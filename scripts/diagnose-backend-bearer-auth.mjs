#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const STAGING_BASE_URL = 'https://staging.30sek24.com';
const STAGING_API_BASE_URL = 'https://api-staging.30sek24.com';
const EXPECTED_SUPABASE_REF = 'aasovfczmqytdtugcrmh';
const AUTH_STORAGE_KEY = `sb-${EXPECTED_SUPABASE_REF}-auth-token`;
const DEFAULT_TARGET_PATH = '/api/expo/booths/managed';

const helpText = `Usage:
  node scripts/diagnose-backend-bearer-auth.mjs

Required env:
  QA_STORAGE_STATE_PATH   Outside-repo Playwright storage-state JSON

Optional env:
  QA_BASE_URL             Defaults to ${STAGING_BASE_URL}
  QA_API_BASE_URL         Defaults to ${STAGING_API_BASE_URL}
  QA_TARGET_PATH          Defaults to ${DEFAULT_TARGET_PATH}

Source of truth:
  SUPABASE_URL
  SUPABASE_ANON_KEY

Safety rules:
  - staging only
  - no secret values are printed
  - no storage-state content is echoed
  - no mutations are performed
`;

function fail(message, code = 1) {
  console.error(`Backend bearer replay diagnostic: FAIL`);
  console.error(message);
  process.exit(code);
}

function pass(payload) {
  console.log(`Backend bearer replay diagnostic: PASS`);
  console.log(JSON.stringify(payload, null, 2));
  process.exit(0);
}

function redactEmail(email) {
  if (!email || typeof email !== 'string') return '<redacted>';
  const [local = '', domain = ''] = email.split('@');
  const [domainHead = '', ...domainTail] = domain.split('.');
  const ext = domainTail.length ? `.${domainTail.join('.')}` : '';
  return `${local.slice(0, 1) || 'x'}***@${domainHead.slice(0, 1) || 'x'}***${ext}`;
}

function redactPath(value) {
  if (!value) return '<redacted>';
  return path.basename(String(value));
}

function decodeBase64UrlJson(part) {
  return JSON.parse(Buffer.from(String(part), 'base64url').toString('utf8'));
}

function decodeJwtClaims(token) {
  const [headerPart, payloadPart] = String(token || '').split('.');
  if (!headerPart || !payloadPart) return null;
  try {
    return decodeBase64UrlJson(payloadPart);
  } catch {
    return null;
  }
}

function getProjectRefFromUrl(url) {
  try {
    const hostname = new URL(url).hostname;
    const match = hostname.match(/^([a-z0-9]+)\.supabase\.co$/i);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

function isInsideRepo(filePath) {
  const resolved = path.resolve(filePath);
  return resolved === repoRoot || resolved.startsWith(`${repoRoot}${path.sep}`);
}

function normalizeUrl(value) {
  return String(value || '').trim().replace(/\/+$/, '');
}

function assertStagingOnly(baseUrl, apiBaseUrl, supabaseUrl) {
  const urls = [baseUrl, apiBaseUrl, supabaseUrl];
  if (!baseUrl.startsWith(STAGING_BASE_URL)) {
    fail(`Refusing non-staging QA_BASE_URL: ${baseUrl}`);
  }
  if (!apiBaseUrl.startsWith(STAGING_API_BASE_URL)) {
    fail(`Refusing non-staging QA_API_BASE_URL: ${apiBaseUrl}`);
  }
  const ref = getProjectRefFromUrl(supabaseUrl);
  if (ref !== EXPECTED_SUPABASE_REF) {
    fail(`Refusing non-staging Supabase project ref: ${ref || '<unresolved>'}`);
  }
  if (urls.some((value) => /localhost|127\.0\.0\.1/i.test(value))) {
    fail('Refusing localhost URLs for this staging-only diagnostic.');
  }
}

async function loadStorageState(storageStatePath) {
  if (!storageStatePath) {
    fail('QA_STORAGE_STATE_PATH is required.');
  }
  const resolved = path.resolve(storageStatePath);
  if (isInsideRepo(resolved)) {
    fail(`Refusing repo-local storage-state path: ${redactPath(resolved)}`);
  }
  const raw = await fs.readFile(resolved, 'utf8');
  const parsed = JSON.parse(raw);
  return { resolved, parsed };
}

function extractAuthSnapshot(storageState) {
  const origin = Array.isArray(storageState?.origins)
    ? storageState.origins.find((item) => item?.origin && String(item.origin).includes('staging.30sek24.com'))
    : null;
  const entries = Array.isArray(origin?.localStorage) ? origin.localStorage : [];
  const authEntry = entries.find((item) => item?.name === AUTH_STORAGE_KEY);
  if (!authEntry?.value) {
    return { authEntry: null, session: null };
  }
  try {
    const session = JSON.parse(authEntry.value);
    return { authEntry, session };
  } catch {
    return { authEntry, session: null };
  }
}

function summarizeClaims(label, claims) {
  if (!claims) {
    return { label, present: false };
  }
  const exp = typeof claims.exp === 'number' ? claims.exp : null;
  return {
    label,
    present: true,
    iss: typeof claims.iss === 'string' ? claims.iss : null,
    aud: typeof claims.aud === 'string' ? claims.aud : Array.isArray(claims.aud) ? claims.aud.join(',') : null,
    exp,
    expired: exp ? Date.now() / 1000 >= exp : null,
    role: claims?.app_metadata?.role || claims?.role || null,
  };
}

async function main() {
  const args = new Set(process.argv.slice(2));
  if (args.has('--help') || args.has('-h')) {
    console.log(helpText);
    return;
  }

  const baseUrl = normalizeUrl(process.env.QA_BASE_URL || STAGING_BASE_URL);
  const apiBaseUrl = normalizeUrl(process.env.QA_API_BASE_URL || STAGING_API_BASE_URL);
  const targetPath = process.env.QA_TARGET_PATH || DEFAULT_TARGET_PATH;
  const storageStatePath = process.env.QA_STORAGE_STATE_PATH || '';
  const supabaseUrl = normalizeUrl(process.env.SUPABASE_URL || '');
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseAnonKey) {
    fail('SUPABASE_URL and SUPABASE_ANON_KEY are required.');
  }
  assertStagingOnly(baseUrl, apiBaseUrl, supabaseUrl);

  const { resolved: resolvedStorageStatePath, parsed: storageState } = await loadStorageState(storageStatePath);
  const { authEntry, session } = extractAuthSnapshot(storageState);
  if (!authEntry || !session) {
    fail(`No ${AUTH_STORAGE_KEY} session found in storage-state.`);
  }

  const staleAccessToken = session.access_token || '';
  const staleRefreshToken = session.refresh_token || '';
  if (!staleAccessToken || !staleRefreshToken) {
    fail(`Storage-state entry ${AUTH_STORAGE_KEY} is missing access_token or refresh_token.`);
  }

  const staleClaims = decodeJwtClaims(staleAccessToken);
  const staleSummary = summarizeClaims('stale', staleClaims);

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
      flowType: 'pkce',
    },
  });

  const noTokenResponse = await fetch(`${apiBaseUrl}${targetPath}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const staleResponse = await fetch(`${apiBaseUrl}${targetPath}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${staleAccessToken}`,
      'Content-Type': 'application/json',
    },
  });

  const noTokenStatus = noTokenResponse.status;
  const staleStatus = staleResponse.status;
  const staleBodyText = await staleResponse.text().catch(() => '');

  let refreshErrorMessage = null;
  let freshAccessToken = null;
  let freshUser = null;
  let freshSummary = { label: 'fresh', present: false, skipped: true };
  let freshStatus = null;
  let freshBodyText = '';

  try {
    const { error: setSessionError } = await client.auth.setSession({
      access_token: staleAccessToken,
      refresh_token: staleRefreshToken,
    });
    if (setSessionError) {
      throw new Error(setSessionError.message);
    }

    const { data: refreshedData, error: refreshError } = await client.auth.refreshSession();
    if (refreshError || !refreshedData?.session?.access_token) {
      throw new Error(refreshError?.message || 'missing refreshed session');
    }

    freshAccessToken = refreshedData.session.access_token;
    freshUser = refreshedData.session.user || (await client.auth.getUser(freshAccessToken)).data?.user || null;
    freshSummary = summarizeClaims('fresh', decodeJwtClaims(freshAccessToken));

    const freshResponse = await fetch(`${apiBaseUrl}${targetPath}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${freshAccessToken}`,
        'Content-Type': 'application/json',
      },
    });
    freshStatus = freshResponse.status;
    freshBodyText = await freshResponse.text().catch(() => '');
  } catch (error) {
    refreshErrorMessage = error instanceof Error ? error.message : String(error);
  }

  const result = {
    baseUrl,
    apiBaseUrl,
    targetPath,
    storageStatePath: redactPath(resolvedStorageStatePath),
    authKeyName: AUTH_STORAGE_KEY,
    authKeyPresent: true,
    storageStateSessionRole: session?.user?.role || session?.user?.app_metadata?.role || null,
    staleToken: staleSummary,
    refreshedToken: freshSummary,
    refreshedUser: freshUser
      ? {
          id: freshUser.id,
          email: redactEmail(freshUser.email || session?.user?.email || ''),
          role: freshUser.app_metadata?.role || null,
        }
      : null,
    noTokenStatus,
    staleStatus,
    staleBodyBytes: staleBodyText.length,
    staleBodyPreview: staleBodyText ? staleBodyText.slice(0, 160) : '',
    refreshErrorMessage,
    freshStatus,
    freshBodyBytes: freshBodyText.length,
    freshBodyPreview: freshBodyText ? freshBodyText.slice(0, 160) : '',
    outcome:
      freshStatus === 200
        ? 'PASS'
        : noTokenStatus === 401 && freshStatus === 401
          ? 'NO-GO'
          : 'FAIL',
  };

  if (freshStatus === 200) {
    pass(result);
  }

  if (refreshErrorMessage) {
    fail(JSON.stringify(result, null, 2));
  }

  fail(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  fail(error?.stack || error?.message || String(error));
});
