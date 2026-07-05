#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const REPO_ROOT = process.cwd();
const DEFAULTS = {
  baseUrl: 'https://staging.30sek24.com',
  dryRun: true,
  maxBytes: 5 * 1024 * 1024,
};
const PLACEHOLDER_TOKENS = [
  'disposable-staging-booth-id',
  'test-booth-id',
  'booth-id',
  'placeholder',
  'todo',
  'example',
];

function readBool(value, fallback = false) {
  if (value == null || value === '') {
    return fallback;
  }

  return ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase());
}

function parseEnvOptions() {
  return {
    allowMutation: readBool(process.env.QA_ALLOW_MUTATION, false),
    confirmDisposableBooth: readBool(process.env.QA_CONFIRM_DISPOSABLE_BOOTH, false),
    allowRepoMediaPath: readBool(process.env.QA_ALLOW_REPO_TEST_MEDIA_PATH, false),
    allowRepoStorageStatePath: readBool(process.env.QA_ALLOW_REPO_STORAGE_STATE_PATH, false),
    baseUrl: String(process.env.QA_BASE_URL || DEFAULTS.baseUrl).trim().replace(/\/+$/, ''),
    dryRun: readBool(process.env.QA_DRY_RUN, DEFAULTS.dryRun),
    generateTempMedia: readBool(process.env.QA_GENERATE_TEMP_MEDIA, false),
    help: process.argv.includes('--help') || process.argv.includes('-h'),
    maxBytes: Number.parseInt(String(process.env.QA_TEST_MEDIA_MAX_BYTES || DEFAULTS.maxBytes), 10) || DEFAULTS.maxBytes,
    sponsorStorageStatePath: String(process.env.QA_SPONSOR_STORAGE_STATE_PATH || '').trim(),
    adminStorageStatePath: String(process.env.QA_ADMIN_STORAGE_STATE_PATH || '').trim(),
    testBoothId: String(process.env.QA_TEST_BOOTH_ID || '').trim(),
    testCompanyId: String(process.env.QA_TEST_COMPANY_ID || '').trim(),
    testMediaPath: String(process.env.QA_TEST_MEDIA_PATH || '').trim(),
  };
}

function helpText() {
  return `
CompanyAdmin media review mutation readiness helper

Usage:
  node scripts/qa-companyadmin-media-review-mutation.mjs --help
  node scripts/qa-companyadmin-media-review-mutation.mjs

Default behavior:
  - dry-run/readiness check only
  - no upload
  - no approve/reject/promote
  - refuses non-staging base URLs

Required env for readiness:
  QA_BASE_URL=https://staging.30sek24.com
  QA_SPONSOR_STORAGE_STATE_PATH=<outside-repo sponsor storage-state>
  QA_ADMIN_STORAGE_STATE_PATH=<outside-repo admin storage-state>
  QA_TEST_BOOTH_ID=<disposable staging booth id>

Optional env:
  QA_TEST_COMPANY_ID=<disposable staging company id>
  QA_TEST_MEDIA_PATH=<outside-repo small png/jpg/webp/mp4>
  QA_GENERATE_TEMP_MEDIA=true
  QA_CONFIRM_DISPOSABLE_BOOTH=true
  QA_ALLOW_MUTATION=false
  QA_DRY_RUN=true

Safety:
  - production domains are refused
  - repo-local storage-state/media paths are refused unless explicitly overridden
  - generated temp media is created under OS temp only and deleted immediately
  - this helper does not print cookies, tokens, or storage-state contents
  - this helper does not perform mutation automation yet
  - placeholder booth IDs are refused
`.trim();
}

function isPathInside(parentPath, candidatePath) {
  const parent = path.resolve(parentPath);
  const candidate = path.resolve(candidatePath);
  const relative = path.relative(parent, candidate);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function isStagingHost(baseUrl) {
  try {
    return new URL(baseUrl).hostname.toLowerCase() === 'staging.30sek24.com';
  } catch {
    return false;
  }
}

function isProductionHost(baseUrl) {
  try {
    const hostname = new URL(baseUrl).hostname.toLowerCase();
    return hostname === 'www.30sek24.com' || hostname === '30sek24.com' || hostname === 'api.30sek24.com';
  } catch {
    return false;
  }
}

function redactLocalPath(filePath) {
  if (!filePath) {
    return '<redacted>';
  }

  return path.basename(String(filePath));
}

function validateExternalPath(filePath, allowRepoPath, label) {
  if (!filePath) {
    return { ok: false, reason: `${label} missing` };
  }

  const resolvedPath = path.resolve(filePath);
  if (!fs.existsSync(resolvedPath)) {
    return { ok: false, reason: `${label} does not exist`, path: redactLocalPath(resolvedPath) };
  }

  if (isPathInside(REPO_ROOT, resolvedPath) && !allowRepoPath) {
    return { ok: false, reason: `${label} is inside repo`, path: redactLocalPath(resolvedPath) };
  }

  return { ok: true, path: redactLocalPath(resolvedPath), resolvedPath };
}

function generateTempMediaFile() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'warpala-media-review-mutation-'));
  const filePath = path.join(tempDir, 'qa-media-review-tiny.png');
  const pngBytes = Buffer.from(
    '89504E470D0A1A0A0000000D49484452000000010000000108060000001F15C4890000000D49444154789C6360606060000000050001A5F645400000000049454E44AE426082',
    'hex',
  );
  fs.writeFileSync(filePath, pngBytes);
  return { tempDir, filePath, size: pngBytes.length };
}

async function fetchText(url, timeoutMs = 10000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    return {
      ok: response.ok,
      status: response.status,
      text: await response.text(),
    };
  } finally {
    clearTimeout(timeout);
  }
}

function deriveApiBaseUrl(baseUrl) {
  const url = new URL(baseUrl);
  if (url.hostname === 'staging.30sek24.com') {
    return 'https://api-staging.30sek24.com';
  }
  return `${url.protocol}//${url.host}`;
}

function validateTestBoothId(value) {
  const normalized = String(value || '').trim();
  if (!normalized) {
    return {
      ok: false,
      looksPlaceholder: false,
      reason: 'QA_TEST_BOOTH_ID missing or whitespace-only',
    };
  }

  const lower = normalized.toLowerCase();
  if (normalized.includes('<') || normalized.includes('>')) {
    return {
      ok: false,
      looksPlaceholder: true,
      reason: 'QA_TEST_BOOTH_ID contains placeholder brackets',
    };
  }

  const matchedToken = PLACEHOLDER_TOKENS.find((token) => lower.includes(token));
  if (matchedToken) {
    return {
      ok: false,
      looksPlaceholder: true,
      reason: `QA_TEST_BOOTH_ID contains placeholder token: ${matchedToken}`,
    };
  }

  return {
    ok: true,
    looksPlaceholder: false,
    reason: 'QA_TEST_BOOTH_ID looks non-placeholder',
  };
}

function inspectSceneForBoothId(sceneText, boothId) {
  if (!boothId) {
    return {
      status: 'NOT_VERIFIABLE',
      reason: 'No booth id was provided for scene verification.',
      found: false,
    };
  }

  try {
    const parsed = JSON.parse(sceneText);
    const booths = Array.isArray(parsed?.booths) ? parsed.booths : null;
    if (!booths) {
      return {
        status: 'NOT_VERIFIABLE',
        reason: 'Public scene response does not expose a booths array.',
        found: false,
      };
    }

    const found = booths.some((booth) => {
      if (!booth || typeof booth !== 'object') {
        return false;
      }

      return String(booth.id || '').trim() === boothId;
    });

    return {
      status: found ? 'FOUND' : 'NOT_FOUND',
      reason: found
        ? 'Booth id was found in public scene booth ids.'
        : 'Booth id was not found in public scene booth ids.',
      found,
    };
  } catch {
    return {
      status: 'NOT_VERIFIABLE',
      reason: 'Public scene response could not be parsed for booth id verification.',
      found: false,
    };
  }
}

function printReport(report) {
  console.log('CompanyAdmin media review mutation QA readiness');
  console.log(JSON.stringify(report, null, 2));
}

async function run() {
  const options = parseEnvOptions();

  if (options.help) {
    console.log(helpText());
    return;
  }

  if (!isStagingHost(options.baseUrl)) {
    throw new Error(`Refusing non-staging QA_BASE_URL: ${options.baseUrl}. Use https://staging.30sek24.com only.`);
  }

  if (isProductionHost(options.baseUrl)) {
    throw new Error(`Refusing production mutation QA target: ${options.baseUrl}`);
  }

  if (options.allowMutation) {
    throw new Error('QA_ALLOW_MUTATION=true is intentionally blocked in this helper. This script is readiness-check only in the current repo state.');
  }

  const checks = [];
  const sponsorState = validateExternalPath(options.sponsorStorageStatePath, options.allowRepoStorageStatePath, 'Sponsor storage state');
  checks.push({ name: 'sponsor storage state', ok: sponsorState.ok, detail: sponsorState.reason || sponsorState.path || '<redacted>' });

  const adminState = validateExternalPath(options.adminStorageStatePath, options.allowRepoStorageStatePath, 'Admin storage state');
  checks.push({ name: 'admin storage state', ok: adminState.ok, detail: adminState.reason || adminState.path || '<redacted>' });

  const testBoothIdValidation = validateTestBoothId(options.testBoothId);
  checks.push({
    name: 'test booth id valid',
    ok: testBoothIdValidation.ok,
    detail: testBoothIdValidation.reason,
  });
  checks.push({ name: 'base URL is staging', ok: true, detail: options.baseUrl });

  let generatedTempMedia = null;
  let mediaState = null;
  if (options.testMediaPath) {
    mediaState = validateExternalPath(options.testMediaPath, options.allowRepoMediaPath, 'Test media path');
    if (mediaState.ok && mediaState.resolvedPath) {
      const stats = fs.statSync(mediaState.resolvedPath);
      const ext = path.extname(mediaState.resolvedPath).toLowerCase();
      const allowedExt = ['.png', '.jpg', '.jpeg', '.webp', '.mp4'];
      checks.push({ name: 'test media extension allowed', ok: allowedExt.includes(ext), detail: ext || '<none>' });
      checks.push({ name: 'test media size within limit', ok: stats.size <= options.maxBytes, detail: `${stats.size} bytes` });
    } else {
      checks.push({ name: 'test media path', ok: false, detail: mediaState.reason || 'invalid' });
    }
  } else if (options.generateTempMedia) {
    generatedTempMedia = generateTempMediaFile();
    checks.push({ name: 'temp media generated outside repo', ok: !isPathInside(REPO_ROOT, generatedTempMedia.filePath), detail: redactLocalPath(generatedTempMedia.filePath) });
    checks.push({ name: 'temp media size within limit', ok: generatedTempMedia.size <= options.maxBytes, detail: `${generatedTempMedia.size} bytes` });
  } else {
    checks.push({ name: 'test media available', ok: false, detail: 'Provide QA_TEST_MEDIA_PATH or set QA_GENERATE_TEMP_MEDIA=true for readiness only.' });
  }

  const apiBaseUrl = deriveApiBaseUrl(options.baseUrl);
  const sceneResult = await fetchText(`${apiBaseUrl}/api/expo/scene`, 15000);
  checks.push({ name: '/api/expo/scene returns 200', ok: sceneResult.status === 200, detail: `status=${sceneResult.status}` });
  checks.push({ name: '/api/expo/scene omits expo_review_media', ok: !sceneResult.text.includes('expo_review_media'), detail: 'checked' });
  const testBoothIdExistence = sceneResult.status === 200
    ? inspectSceneForBoothId(sceneResult.text, options.testBoothId)
    : {
        status: 'NOT_VERIFIABLE',
        reason: 'Public scene check did not return 200, so booth existence could not be verified.',
        found: false,
      };
  const boothExistenceConfirmed =
    testBoothIdExistence.status === 'FOUND'
      || (testBoothIdExistence.status === 'NOT_VERIFIABLE' && options.confirmDisposableBooth);
  checks.push({
    name: 'test booth id existence confirmed',
    ok: boothExistenceConfirmed,
    detail:
      testBoothIdExistence.status === 'NOT_VERIFIABLE' && !options.confirmDisposableBooth
        ? `${testBoothIdExistence.reason} Set QA_CONFIRM_DISPOSABLE_BOOTH=true only after manual disposable staging booth confirmation.`
        : testBoothIdExistence.reason,
  });

  const ready = checks.every((check) => check.ok);
  const report = {
    actionMode: 'READINESS_ONLY',
    apiBaseUrl,
    baseUrl: options.baseUrl,
    checks,
    fixture: {
      sponsorStorageState: sponsorState.ok ? sponsorState.path : sponsorState.reason,
      adminStorageState: adminState.ok ? adminState.path : adminState.reason,
      testBoothId: options.testBoothId || 'missing',
      testCompanyId: options.testCompanyId || 'optional-not-provided',
      testBoothIdLooksPlaceholder: testBoothIdValidation.looksPlaceholder,
      testBoothIdExistence: testBoothIdExistence.status,
      testBoothIdValidationReason:
        testBoothIdExistence.status === 'NOT_VERIFIABLE' && !options.confirmDisposableBooth
          ? `${testBoothIdValidation.reason}; ${testBoothIdExistence.reason} Manual disposable booth confirmation is required before setting QA_CONFIRM_DISPOSABLE_BOOTH=true.`
          : `${testBoothIdValidation.reason}; ${testBoothIdExistence.reason}`,
      testMedia: mediaState?.ok
        ? mediaState.path
        : generatedTempMedia
          ? redactLocalPath(generatedTempMedia.filePath)
          : 'missing',
    },
    nextManualLifecycle: [
      'Sponsor uploads private review media to expo_review_media through the protected upload route.',
      'Admin confirms pending_review item appears for the disposable staging booth fixture.',
      'Admin approves or rejects the upload.',
      'Admin promotes only an approved upload.',
      'Promotion copies media into expo_assets and updates public scene fields only after explicit promote.',
      'Verify /api/expo/scene remains 200 and still omits expo_review_media paths.',
    ],
    ready,
    refusedMutation: true,
  };

  printReport(report);

  if (generatedTempMedia) {
    try {
      fs.rmSync(generatedTempMedia.tempDir, { recursive: true, force: true });
    } catch {
      // Ignore temp cleanup failure.
    }
  }

  if (!report.ready) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`CompanyAdmin media review mutation readiness: FAIL\n${message}`);
  process.exitCode = 1;
});
