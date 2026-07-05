#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const REQUIRED_PROJECT_REF = 'aasovfczmqytdtugcrmh';
const REQUIRED_FIXTURE_ID = '88184da3-6da2-4c8e-b88d-be13dfd38ae1';
const REQUIRED_COMPANY_ID = '08aef028-7f4c-4c0d-84a5-00eda10e8a6a';
const DEFAULT_API_BASE_URL = 'https://api-staging.30sek24.com';
const DEFAULT_SCENE_PATH = '/api/expo/scene';

function helpText() {
  return `Disposable staging sponsor media cleanup helper

Usage:
  doppler run -- node scripts/cleanup-disposable-expo-booth-fixture.mjs

Required env:
  QA_CONFIRM_CLEANUP_SPONSOR_MEDIA_FIXTURE=true
  SUPABASE_URL=https://aasovfczmqytdtugcrmh.supabase.co
  SUPABASE_SERVICE_KEY or SUPABASE_SERVICE_ROLE_KEY

Optional env:
  QA_CLEANUP_FIXTURE_ID=${REQUIRED_FIXTURE_ID}
  QA_CLEANUP_COMPANY_ID=${REQUIRED_COMPANY_ID}
  QA_APPLY_CLEANUP=true
  QA_API_BASE_URL=${DEFAULT_API_BASE_URL}
  QA_SCENE_PATH=${DEFAULT_SCENE_PATH}

Safety rules:
  - staging only
  - refuses non-Supabase or non-staging project refs
  - refuses production-looking project refs
  - clears public company logo references before removing storage objects
  - deletes only storage objects proven to belong to the disposable fixture
  - does not print secrets, tokens, storage-state, signed URLs, or private paths
  - leaves the disposable booth row archived if a hard delete is not safe
`.trim();
}

function fail(message) {
  console.error('Disposable staging sponsor media cleanup: FAIL');
  console.error(message);
  process.exit(1);
}

function readEnv(name) {
  return String(process.env[name] || '').trim();
}

function requireEnv(name) {
  const value = readEnv(name);
  if (!value) {
    fail(`${name} is required.`);
  }
  return value;
}

function readBool(value, fallback = false) {
  if (value == null || value === '') {
    return fallback;
  }

  return ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase());
}

function parseSupabaseProjectRef(supabaseUrl) {
  let parsed;

  try {
    parsed = new URL(supabaseUrl);
  } catch {
    throw new Error(`Invalid SUPABASE_URL: ${supabaseUrl}`);
  }

  const host = parsed.hostname.toLowerCase();
  if (!host.endsWith('.supabase.co')) {
    throw new Error(`Refusing non-Supabase host: ${host}`);
  }

  const projectRef = host.split('.')[0];
  if (projectRef !== REQUIRED_PROJECT_REF) {
    throw new Error(`Supabase project ref mismatch: expected ${REQUIRED_PROJECT_REF}, got ${projectRef}`);
  }

  return { origin: `${parsed.protocol}//${parsed.host}`, projectRef };
}

function redactId(value) {
  const id = String(value || '').trim();
  if (!id) {
    return '<redacted>';
  }

  return `${id.slice(0, 4)}***${id.slice(-4)}`;
}

function redactEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  if (!email) {
    return '<redacted>';
  }

  const [local = '', domain = ''] = email.split('@');
  const [domainHead = '', domainTail = ''] = domain.split('.');
  return `${local.slice(0, 1)}***@${domainHead.slice(0, 1)}***${domainTail ? `.${domainTail}` : ''}`;
}

function redactUrl(value) {
  const url = String(value || '').trim();
  if (!url) {
    return '<redacted>';
  }

  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.split('/').filter(Boolean);
    const tail = pathname.slice(-2).join('/');
    return `${parsed.origin}/.../${tail || pathname.at(-1) || '<redacted>'}`;
  } catch {
    return '<redacted>';
  }
}

function redactStorageTarget(bucket, storagePath) {
  const safeBucket = String(bucket || '').trim() || '<redacted>';
  const tail = String(storagePath || '').trim().split('/').filter(Boolean).at(-1) || '<redacted>';
  return `${safeBucket}/.../${tail}`;
}

async function fetchText(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  return { response, text };
}

function asRecord(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function asString(value) {
  return String(value || '').trim();
}

function deriveStorageTargetFromPublicUrl(publicUrl) {
  const url = asString(publicUrl);
  if (!url) {
    return { bucket: '', path: '' };
  }

  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split('/').filter(Boolean);
    const publicIndex = segments.findIndex((segment) => segment === 'public');
    const bucket = publicIndex >= 0 ? segments[publicIndex + 1] || '' : '';
    const path = publicIndex >= 0 ? segments.slice(publicIndex + 2).join('/') : '';
    return { bucket, path };
  } catch {
    return { bucket: '', path: '' };
  }
}

function collectReviewUploads(assets3d) {
  const record = asRecord(assets3d);
  const mediaReview = asRecord(record.media_review || record.mediaReview);
  const uploads = Array.isArray(mediaReview.uploads) ? mediaReview.uploads : [];
  return uploads
    .map((candidate) => asRecord(candidate))
    .filter((upload) => asString(upload.path || upload.storagePath))
    .map((upload) => ({
      bucket: asString(upload.bucket || upload.storageBucket || 'expo_review_media'),
      kind: asString(upload.kind || upload.mediaKind || upload.target || 'reference') || 'reference',
      path: asString(upload.path || upload.storagePath),
      ...(() => {
        const publicUrl = asString(upload.publicUrl || upload.public_url);
        const derived = deriveStorageTargetFromPublicUrl(publicUrl);
        return {
          publicBucket: asString(upload.publicBucket || upload.public_bucket || derived.bucket),
          publicPath: asString(upload.publicPath || upload.public_path || derived.path),
          publicUrl,
        };
      })(),
      reviewStatus: asString(upload.reviewStatus || upload.review_status),
      promotedAt: asString(upload.promotedAt || upload.promoted_at),
      promotedTarget: asString(upload.promotedTarget || upload.promoted_target),
      originalName: asString(upload.originalName || upload.originalFilename || upload.fileName || upload.filename),
    }));
}

function assertFixtureOwnership(fixture, companyId, fixtureId) {
  if (asString(fixture.id) !== fixtureId) {
    throw new Error(`Fixture id mismatch: expected ${fixtureId}, got ${asString(fixture.id) || '<missing>'}`);
  }

  if (asString(fixture.company_id) !== companyId) {
    throw new Error(`Fixture company_id mismatch: expected ${companyId}, got ${asString(fixture.company_id) || '<missing>'}`);
  }
}

async function verifySceneContract(apiBaseUrl, scenePath) {
  const { response, text } = await fetchText(`${apiBaseUrl}${scenePath}`, { method: 'GET' });
  if (!response.ok) {
    throw new Error(`${scenePath} returned ${response.status}`);
  }

  if (text.includes('expo_review_media')) {
    throw new Error(`${scenePath} leaked expo_review_media`);
  }
}

function renderSummary(state) {
  return {
    action: state.action,
    projectRef: state.projectRef,
    fixtureId: state.fixtureId,
    companyId: state.companyId,
    companyName: state.companyName,
    companyLogoUrl: state.companyLogoUrl,
    boothStatusBefore: state.boothStatusBefore,
    boothStatusAfter: state.boothStatusAfter,
    ownerUserId: state.ownerUserId,
    ownerEmail: state.ownerEmail,
    contactCompanyId: state.contactCompanyId,
    uploadsFound: state.uploads.length,
    uploads: state.uploads.map((upload) => ({
      kind: upload.kind,
      reviewStatus: upload.reviewStatus,
      bucket: upload.bucket,
      path: upload.path ? `.../${upload.path.split('/').at(-1) || '<redacted>'}` : '<redacted>',
      publicBucket: upload.publicBucket || '<none>',
      publicPath: upload.publicPath ? `.../${upload.publicPath.split('/').at(-1) || '<redacted>'}` : '<none>',
      publicUrl: upload.publicUrl ? redactUrl(upload.publicUrl) : '<none>',
      promotedAt: upload.promotedAt || '<none>',
      promotedTarget: upload.promotedTarget || '<none>',
      originalName: upload.originalName || '<none>',
    })),
    deletedPublicObjects: state.deletedPublicObjects,
    deletedPrivateObjects: state.deletedPrivateObjects,
    companyLogoCleared: state.companyLogoCleared,
    boothRowArchived: state.boothRowArchived,
    companyRowRemoved: state.companyRowRemoved,
    cleanupReason: state.cleanupReason || '<none>',
  };
}

async function main() {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(helpText());
    return;
  }

  if (!readBool(process.env.QA_CONFIRM_CLEANUP_SPONSOR_MEDIA_FIXTURE, false)) {
    fail('QA_CONFIRM_CLEANUP_SPONSOR_MEDIA_FIXTURE=true is required.');
  }

  const supabaseUrl = requireEnv('SUPABASE_URL');
  const serviceKey = readEnv('SUPABASE_SERVICE_KEY') || readEnv('SUPABASE_SERVICE_ROLE_KEY');
  if (!serviceKey) {
    fail('SUPABASE_SERVICE_KEY or SUPABASE_SERVICE_ROLE_KEY is required.');
  }

  const { projectRef } = parseSupabaseProjectRef(supabaseUrl);
  const apiBaseUrl = readEnv('QA_API_BASE_URL') || DEFAULT_API_BASE_URL;
  const scenePath = readEnv('QA_SCENE_PATH') || DEFAULT_SCENE_PATH;
  const fixtureId = readEnv('QA_CLEANUP_FIXTURE_ID') || REQUIRED_FIXTURE_ID;
  const companyId = readEnv('QA_CLEANUP_COMPANY_ID') || REQUIRED_COMPANY_ID;
  if (fixtureId !== REQUIRED_FIXTURE_ID) {
    fail(`Refusing non-approved fixture id: ${fixtureId}`);
  }

  if (companyId !== REQUIRED_COMPANY_ID) {
    fail(`Refusing non-approved company id: ${companyId}`);
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const state = {
    action: 'dry-run',
    boothRowArchived: false,
    boothStatusAfter: '<unknown>',
    boothStatusBefore: '<unknown>',
    cleanupReason: '',
    companyId,
    companyLogoCleared: false,
    companyLogoUrl: '<unknown>',
    companyName: '<unknown>',
    companyRowRemoved: false,
    deletedPrivateObjects: [],
    deletedPublicObjects: [],
    fixtureId,
    projectRef,
    uploads: [],
    ownerEmail: '<unknown>',
    ownerUserId: '<unknown>',
    contactCompanyId: '<unknown>',
  };

  await verifySceneContract(apiBaseUrl, scenePath);

  const { data: boothRow, error: boothError } = await supabase
    .from('expo_booths')
    .select('id,company_id,company_name,status,assets_3d,contact_info')
    .eq('id', fixtureId)
    .maybeSingle();

  if (boothError) {
    throw new Error(`Fixture lookup failed: ${boothError.message}`);
  }
  if (!boothRow) {
    throw new Error(`Fixture not found: ${fixtureId}`);
  }

  assertFixtureOwnership(boothRow, companyId, fixtureId);

  const { data: companyRow, error: companyError } = await supabase
    .from('companies')
    .select('id,name,logo_url')
    .eq('id', companyId)
    .maybeSingle();

  if (companyError) {
    throw new Error(`Company lookup failed: ${companyError.message}`);
  }
  if (!companyRow) {
    throw new Error(`Company not found: ${companyId}`);
  }

  const contactInfo = asRecord(boothRow.contact_info);
  const contactOwnerUserId = asString(contactInfo.owner_user_id || contactInfo.ownerUserId);
  const contactOwnerEmail = asString(contactInfo.owner_email || contactInfo.ownerEmail);
  const contactCompanyId = asString(contactInfo.company_id || contactInfo.companyId);
  if (!contactOwnerUserId || !contactOwnerEmail) {
    throw new Error('Fixture contact_info is missing owner metadata.');
  }
  if (contactCompanyId && contactCompanyId !== companyId) {
    throw new Error(`Fixture contact_info company_id mismatch: expected ${companyId}, got ${contactCompanyId}`);
  }

  state.companyName = companyRow.name;
  state.companyLogoUrl = redactUrl(companyRow.logo_url);
  state.boothStatusBefore = asString(boothRow.status);
  state.ownerUserId = redactId(contactOwnerUserId);
  state.ownerEmail = redactEmail(contactOwnerEmail);
  state.contactCompanyId = contactCompanyId ? redactId(contactCompanyId) : '<none>';
  state.uploads = collectReviewUploads(boothRow.assets_3d);

  if (state.uploads.length === 0) {
    throw new Error('No review uploads were found in the fixture metadata.');
  }

  const companyLogoMatchesPromo = state.uploads.some((upload) => upload.publicUrl && asString(companyRow.logo_url) === upload.publicUrl);
  const publicPaths = state.uploads
    .filter((upload) => upload.publicBucket && upload.publicPath)
    .map((upload) => ({ bucket: upload.publicBucket, path: upload.publicPath }));
  const privatePaths = state.uploads
    .filter((upload) => upload.bucket && upload.path)
    .map((upload) => ({ bucket: upload.bucket, path: upload.path }));

  if (!privatePaths.length) {
    throw new Error('No private review storage paths were found for the fixture uploads.');
  }

  if (state.uploads.some((upload) => !upload.path.startsWith(`sponsor-media/${companyId}/${fixtureId}/`))) {
    throw new Error('One or more review uploads do not belong to the disposable fixture path scope.');
  }

  if (state.uploads.some((upload) => upload.publicPath && !upload.publicPath.startsWith(`review-promoted/${companyId}/${fixtureId}/`))) {
    throw new Error('One or more promoted public upload paths do not belong to the disposable fixture path scope.');
  }

  console.log(JSON.stringify({
    phase: 'preflight',
    projectRef,
    fixtureId,
    companyId,
    companyName: state.companyName,
    boothStatus: state.boothStatusBefore,
    companyLogoUrl: state.companyLogoUrl,
    uploadCount: state.uploads.length,
    uploadStatuses: state.uploads.map((upload) => upload.reviewStatus || '<unknown>'),
    privateObjects: privatePaths.map((entry) => `${entry.bucket}/${entry.path.split('/').at(-1) || '<redacted>'}`),
    publicObjects: publicPaths.map((entry) => `${entry.bucket}/${entry.path.split('/').at(-1) || '<redacted>'}`),
    companyLogoMatchesPromo,
    cleanupMode: 'archive-fixture-row-and-neutralize-media',
  }, null, 2));

  if (!readBool(process.env.QA_APPLY_CLEANUP, false)) {
    console.log(JSON.stringify(renderSummary(state), null, 2));
    return;
  }

  state.action = 'applied';
  state.cleanupReason = 'archived disposable booth row and neutralized review/public media artifacts';

  const clearPublicLogo = companyLogoMatchesPromo && asString(companyRow.logo_url);
  if (clearPublicLogo) {
    const { error } = await supabase
      .from('companies')
      .update({ logo_url: null })
      .eq('id', companyId);
    if (error) {
      throw new Error(`Failed to clear disposable company logo_url: ${error.message}`);
    }
    state.companyLogoCleared = true;
    state.companyLogoUrl = '<cleared>';
    await verifySceneContract(apiBaseUrl, scenePath);
  }

  for (const entry of publicPaths) {
    const { error } = await supabase.storage.from(entry.bucket).remove([entry.path]);
    if (error) {
      throw new Error(`Failed to delete promoted public object ${redactStorageTarget(entry.bucket, entry.path)}: ${error.message}`);
    }
    state.deletedPublicObjects.push(redactStorageTarget(entry.bucket, entry.path));
    await verifySceneContract(apiBaseUrl, scenePath);
  }

  for (const entry of privatePaths) {
    const { error } = await supabase.storage.from(entry.bucket).remove([entry.path]);
    if (error) {
      throw new Error(`Failed to delete private review object ${redactStorageTarget(entry.bucket, entry.path)}: ${error.message}`);
    }
    state.deletedPrivateObjects.push(redactStorageTarget(entry.bucket, entry.path));
    await verifySceneContract(apiBaseUrl, scenePath);
  }

  const { error: boothUpdateError } = await supabase
    .from('expo_booths')
    .update({
      assets_3d: {
        ...(asRecord(boothRow.assets_3d) || {}),
        media_review: {
          uploads: [],
        },
      },
      status: 'archived',
    })
    .eq('id', fixtureId);

  if (boothUpdateError) {
    throw new Error(`Failed to archive and neutralize the disposable booth row: ${boothUpdateError.message}`);
  }

  state.boothRowArchived = true;
  state.boothStatusAfter = 'archived';

  await verifySceneContract(apiBaseUrl, scenePath);

  console.log(JSON.stringify(renderSummary(state), null, 2));
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
});
