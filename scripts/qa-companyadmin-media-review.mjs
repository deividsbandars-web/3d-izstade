#!/usr/bin/env node

import childProcess from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const REPO_ROOT = process.cwd();
const DEFAULT_PROFILE_DIR = path.join(os.tmpdir(), 'warpala-companyadmin-media-review-qa-chrome-profile');

const DEFAULTS = {
  baseUrl: 'https://staging.30sek24.com',
  browserJsonUrl: 'http://127.0.0.1:9234/json',
  chromePort: 9234,
  clearServiceWorker: true,
  companyAdminPath: '/expo/admin',
  disableBrowserCache: true,
  debugTextLimit: 1200,
  expectMediaReview: true,
  profileDir: DEFAULT_PROFILE_DIR,
  renderWaitMs: 10000,
  role: 'sponsor',
  timeoutMs: 45000,
};

function readBool(value, fallback = false) {
  if (value == null || value === '') {
    return fallback;
  }

  return ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase());
}

function parseEnvOptions() {
  const browserJsonUrl = String(process.env.QA_BROWSER_JSON_URL || DEFAULTS.browserJsonUrl).trim();
  const portMatch = browserJsonUrl.match(/:(\d+)\/json\b/);
  const role = String(process.env.QA_ROLE || DEFAULTS.role).trim().toLowerCase();
  const explicitProfileDir = String(process.env.QA_BROWSER_PROFILE_DIR || '').trim();
  const profileDir = explicitProfileDir || DEFAULTS.profileDir;

  if (role !== 'sponsor' && role !== 'admin') {
    throw new Error(`QA_ROLE must be "sponsor" or "admin", received "${role}".`);
  }

  return {
    allowMutation: readBool(process.env.QA_ALLOW_MUTATION, false),
    baseUrl: String(process.env.QA_BASE_URL || DEFAULTS.baseUrl).trim().replace(/\/+$/, ''),
    browserJsonUrl,
    chromePort: portMatch ? Number(portMatch[1]) : DEFAULTS.chromePort,
    clearServiceWorker: readBool(process.env.QA_CLEAR_SERVICE_WORKER, DEFAULTS.clearServiceWorker),
    companyAdminPath: String(process.env.QA_COMPANY_ADMIN_PATH || DEFAULTS.companyAdminPath).trim() || DEFAULTS.companyAdminPath,
    debugTextLimit: Number.parseInt(String(process.env.QA_DEBUG_TEXT_LIMIT || DEFAULTS.debugTextLimit), 10) || DEFAULTS.debugTextLimit,
    diagnoseOnly: readBool(process.env.QA_DIAGNOSE_ONLY, false),
    disableBrowserCache: readBool(process.env.QA_DISABLE_BROWSER_CACHE, DEFAULTS.disableBrowserCache),
    explicitProfileDir,
    expectMediaReview: readBool(process.env.QA_EXPECT_MEDIA_REVIEW, DEFAULTS.expectMediaReview),
    help: process.argv.includes('--help') || process.argv.includes('-h'),
    json: process.argv.includes('--json'),
    keepBrowser: readBool(process.env.QA_KEEP_BROWSER, false),
    profileDir,
    profileDirInsideRepoAllowed: readBool(process.env.QA_ALLOW_REPO_BROWSER_PROFILE_DIR, false),
    renderWaitMs: Number.parseInt(String(process.env.QA_RENDER_WAIT_MS || DEFAULTS.renderWaitMs), 10) || DEFAULTS.renderWaitMs,
    role,
    storageStatePath: String(process.env.QA_STORAGE_STATE_PATH || '').trim(),
    testBoothId: String(process.env.QA_TEST_BOOTH_ID || '').trim(),
    testFilePath: String(process.env.QA_TEST_FILE_PATH || '').trim(),
    timeoutMs: Number.parseInt(String(process.env.QA_TIMEOUT_MS || DEFAULTS.timeoutMs), 10) || DEFAULTS.timeoutMs,
    visible: readBool(process.env.QA_VISIBLE, false),
  };
}

function helpText() {
  return `
CompanyAdmin media review browser QA helper

Usage:
  node scripts/qa-companyadmin-media-review.mjs --help
  doppler run -- node scripts/qa-companyadmin-media-review.mjs

Required env for signed-in checks:
  QA_ROLE=sponsor|admin
  QA_STORAGE_STATE_PATH=<non-committed local storage-state json>

Supported env:
  QA_BASE_URL=https://staging.30sek24.com
  QA_COMPANY_ADMIN_PATH=/expo/admin
  QA_EXPECT_MEDIA_REVIEW=true
  QA_DEBUG_TEXT_LIMIT=1200
  QA_DIAGNOSE_ONLY=true
  QA_RENDER_WAIT_MS=10000
  QA_DISABLE_BROWSER_CACHE=true
  QA_CLEAR_SERVICE_WORKER=true
  QA_ROLE=sponsor
  QA_STORAGE_STATE_PATH=C:\\path\\to\\storage-state.json
  QA_ALLOW_MUTATION=false
  QA_TEST_BOOTH_ID=<staging-test-booth-id>
  QA_TEST_FILE_PATH=C:\\path\\to\\small-test.png

Optional env:
  QA_BROWSER_JSON_URL=http://127.0.0.1:9234/json
  QA_BROWSER_PROFILE_DIR=<local path outside repo>
  QA_ALLOW_REPO_BROWSER_PROFILE_DIR=false
  QA_TIMEOUT_MS=45000
  QA_VISIBLE=true
  QA_KEEP_BROWSER=true

Safety:
  - no passwords are accepted
  - no storage state is created or written
  - default mode is read-only
  - QA_DIAGNOSE_ONLY=true reports route/marker diagnostics without converting failures into pass
  - default browser profile is created under the OS temp directory, not the repo
  - repo-local browser profile dirs are refused unless QA_ALLOW_REPO_BROWSER_PROFILE_DIR=true
  - temp browser profile is cleaned up by default
  - QA_ALLOW_MUTATION=true is refused against production hosts
  - this minimal helper does not perform approve/reject/promote clicks automatically
`.trim();
}

function normalizeUrl(value) {
  return String(value || '').trim().replace(/\/+$/, '');
}

function isPathInside(parentPath, candidatePath) {
  const parent = path.resolve(parentPath);
  const candidate = path.resolve(candidatePath);
  const relative = path.relative(parent, candidate);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function resolveProfileDirPolicy(options) {
  const resolvedProfileDir = path.resolve(options.profileDir);
  const insideRepo = isPathInside(REPO_ROOT, resolvedProfileDir);
  const explicit = Boolean(options.explicitProfileDir);
  const transient = !explicit;

  if (insideRepo && !options.profileDirInsideRepoAllowed) {
    throw new Error(
      `Refusing repo-local QA_BROWSER_PROFILE_DIR: ${resolvedProfileDir}. ` +
      'Use a path outside the repo, or set QA_ALLOW_REPO_BROWSER_PROFILE_DIR=true only if you explicitly accept responsibility for local profile artifacts.',
    );
  }

  if (insideRepo && options.profileDirInsideRepoAllowed) {
    console.warn('QA helper warning: repo-local browser profile dir explicitly allowed by QA_ALLOW_REPO_BROWSER_PROFILE_DIR=true.');
  }

  return {
    explicit,
    insideRepo,
    transient,
    resolvedProfileDir,
  };
}

function redactLocalPath(filePath) {
  if (!filePath) {
    return '<redacted>';
  }

  return path.basename(String(filePath));
}

function deriveApiBaseUrl(baseUrl) {
  const url = new URL(baseUrl);

  if (url.hostname === 'staging.30sek24.com') {
    return 'https://api-staging.30sek24.com';
  }

  if (url.hostname === 'www.30sek24.com' || url.hostname === '30sek24.com') {
    return 'https://api.30sek24.com';
  }

  return `${url.protocol}//${url.host}`;
}

function isProductionHost(baseUrl) {
  const hostname = new URL(baseUrl).hostname.toLowerCase();
  return hostname === 'www.30sek24.com' || hostname === '30sek24.com' || hostname === 'api.30sek24.com';
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchText(url, timeoutMs = 5000) {
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

async function fetchJson(url, timeoutMs = 5000) {
  const response = await fetchText(url, timeoutMs);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return JSON.parse(response.text);
}

async function isCdpAvailable(browserJsonUrl) {
  try {
    const targets = await fetchJson(browserJsonUrl, 2500);
    return Array.isArray(targets);
  } catch {
    return false;
  }
}

function findChromePath() {
  const candidates = process.platform === 'win32'
    ? [
        process.env.CHROME_PATH,
        path.join(process.env.ProgramFiles || '', 'Google/Chrome/Application/chrome.exe'),
        path.join(process.env['ProgramFiles(x86)'] || '', 'Google/Chrome/Application/chrome.exe'),
        path.join(process.env.LOCALAPPDATA || '', 'Google/Chrome/Application/chrome.exe'),
      ]
    : process.platform === 'darwin'
      ? [
          process.env.CHROME_PATH,
          '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
          '/Applications/Chromium.app/Contents/MacOS/Chromium',
        ]
      : [
          process.env.CHROME_PATH,
          '/usr/bin/google-chrome',
          '/usr/bin/google-chrome-stable',
          '/usr/bin/chromium',
          '/usr/bin/chromium-browser',
        ];

  return candidates.find((candidate) => candidate && fs.existsSync(candidate)) ?? null;
}

async function startChromeIfNeeded(options) {
  if (await isCdpAvailable(options.browserJsonUrl)) {
    return { browserStarted: false };
  }

  const chromePath = findChromePath();
  if (!chromePath) {
    throw new Error('Google Chrome/Chromium was not found. Set CHROME_PATH or start Chrome with remote debugging manually.');
  }

  fs.mkdirSync(options.profileDirPolicy.resolvedProfileDir, { recursive: true });

  const chromeArgs = [
    `--remote-debugging-port=${options.chromePort}`,
    `--user-data-dir=${options.profileDirPolicy.resolvedProfileDir}`,
    '--autoplay-policy=no-user-gesture-required',
    '--disable-background-networking',
    '--disable-default-apps',
    '--disable-extensions',
    '--disable-sync',
    '--no-default-browser-check',
    '--no-first-run',
    'about:blank',
  ];

  if (!options.visible) {
    chromeArgs.unshift('--headless=new');
    chromeArgs.splice(1, 0, '--disable-gpu');
  }

  const chromeProcess = childProcess.spawn(chromePath, chromeArgs, {
    detached: process.platform !== 'win32',
    stdio: 'ignore',
    windowsHide: true,
  });
  chromeProcess.unref();

  const deadline = Date.now() + options.timeoutMs;
  while (Date.now() < deadline) {
    if (await isCdpAvailable(options.browserJsonUrl)) {
      return { browserStarted: true };
    }
    await sleep(500);
  }

  throw new Error(`Chrome started, but CDP did not become available at ${options.browserJsonUrl}`);
}

async function resolvePageWebSocketUrl(browserJsonUrl) {
  const targets = await fetchJson(browserJsonUrl);
  const pages = targets.filter((target) => target.type === 'page' && target.webSocketDebuggerUrl);
  const fallback = pages[0] ?? targets.find((target) => target.webSocketDebuggerUrl);

  if (!fallback?.webSocketDebuggerUrl) {
    throw new Error(`No CDP page target found in ${browserJsonUrl}`);
  }

  return fallback.webSocketDebuggerUrl;
}

function connectCdp(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let nextId = 0;
  const pending = new Map();

  ws.addEventListener('message', (event) => {
    const message = JSON.parse(String(event.data));
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) {
        reject(new Error(`${message.error.message || 'CDP error'} (${JSON.stringify(message.error)})`));
        return;
      }
      resolve(message);
    }
  });

  return new Promise((resolve, reject) => {
    ws.addEventListener('open', () => {
      const send = (method, params = {}) => new Promise((methodResolve, methodReject) => {
        const id = ++nextId;
        pending.set(id, { resolve: methodResolve, reject: methodReject });
        ws.send(JSON.stringify({ id, method, params }));
      });

      resolve({ send, ws });
    });
    ws.addEventListener('error', reject);
  });
}

async function evaluate(send, expression) {
  const result = await send('Runtime.evaluate', {
    awaitPromise: true,
    expression,
    returnByValue: true,
  });

  if (result.result.exceptionDetails) {
    const details = result.result.exceptionDetails;
    const exceptionDescription = details.exception?.description || details.exception?.preview?.description || '';
    const exceptionStack = details.exception?.stackTrace?.callFrames?.map((frame) => `${frame.functionName || '<anonymous>'} @ ${frame.url || '<unknown>'}:${frame.lineNumber + 1}:${frame.columnNumber + 1}`).join(' | ') || '';
    const messageParts = [
      details.text || 'Runtime.evaluate exception',
      exceptionDescription ? `description: ${summarizeText(exceptionDescription, 400)}` : null,
      exceptionStack ? `stack: ${summarizeText(exceptionStack, 400)}` : null,
    ].filter(Boolean);
    throw new Error(messageParts.join(' | '));
  }

  return result.result.result?.value;
}

async function waitFor(send, expression, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      if (await evaluate(send, expression)) {
        return true;
      }
    } catch {
      // Ignore transient page evaluation errors during navigation.
    }
    await sleep(300);
  }
  return false;
}

function redactUrlForOutput(rawUrl) {
  if (!rawUrl) {
    return null;
  }

  try {
    const parsed = new URL(rawUrl);
    const fileName = parsed.pathname.split('/').filter(Boolean).pop() || '/';
    return `${parsed.origin}/${fileName}`;
  } catch {
    return '<redacted>';
  }
}

function summarizeText(value, limit = 240) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, limit);
}

function normalizeVisibleText(value) {
  return String(value || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeAccountChipText(value) {
  return normalizeVisibleText(value)
    .replace(/[??]/g, ' ')
    .replace(/s+/g, ' ')
    .trim();
}

function getAdminRoleTokens(value) {
  return normalizeAccountChipText(value)
    .toUpperCase()
    .split(/[^A-Z]+/)
    .filter(Boolean);
}

function accountChipHasAdminRoleMarker(value) {
  return getAdminRoleTokens(value).includes('ADMIN');
}

function createRuntimeDiagnostics() {
  return {
    companyAdminChunkRequested: false,
    consoleMessages: [],
    failedRequests: [],
    jsChunkResponses: [],
    loadedScriptUrls: [],
    pageErrors: [],
    serviceWorkerInfo: null,
  };
}

function pushBounded(list, value, max = 12) {
  if (list.length < max) {
    list.push(value);
  }
}

async function waitForNetworkIdle(diagState, timeoutMs, idleMs = 1000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const idleFor = Date.now() - diagState.lastNetworkActivityAt;
    if (diagState.inFlightRequests <= 0 && idleFor >= idleMs) {
      return true;
    }
    await sleep(250);
  }
  return false;
}

async function navigate(send, url, timeoutMs) {
  await send('Page.navigate', { url });
  const ready = await waitFor(send, 'document.readyState === "complete"', timeoutMs);
  if (!ready) {
    throw new Error(`Timed out while navigating to ${url}`);
  }
}

function loadStorageState(filePath) {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`QA_STORAGE_STATE_PATH does not exist: ${redactLocalPath(resolved)}`);
  }

  const parsed = JSON.parse(fs.readFileSync(resolved, 'utf8'));
  return {
    cookies: Array.isArray(parsed.cookies) ? parsed.cookies : [],
    origins: Array.isArray(parsed.origins) ? parsed.origins : [],
    path: resolved,
  };
}

async function applyStorageState(send, baseUrl, storageState) {
  if (storageState.cookies.length > 0) {
    await send('Network.setCookies', {
      cookies: storageState.cookies.map((cookie) => ({
        domain: cookie.domain,
        expires: typeof cookie.expires === 'number' ? cookie.expires : undefined,
        httpOnly: Boolean(cookie.httpOnly),
        name: cookie.name,
        path: cookie.path || '/',
        sameSite: cookie.sameSite,
        secure: Boolean(cookie.secure),
        url: cookie.url,
        value: cookie.value,
      })),
    });
  }

  const baseOrigin = new URL(baseUrl).origin;
  const matchingOrigins = storageState.origins.filter((entry) => entry && entry.origin === baseOrigin);

  for (const entry of matchingOrigins) {
    await navigate(send, entry.origin, 10000);

    const localStorageEntries = Array.isArray(entry.localStorage) ? entry.localStorage : [];
    for (const item of localStorageEntries) {
      await evaluate(
        send,
        `localStorage.setItem(${JSON.stringify(String(item.name || ''))}, ${JSON.stringify(String(item.value || ''))});`,
      );
    }

    const sessionStorageEntries = Array.isArray(entry.sessionStorage) ? entry.sessionStorage : [];
    for (const item of sessionStorageEntries) {
      await evaluate(
        send,
        `sessionStorage.setItem(${JSON.stringify(String(item.name || ''))}, ${JSON.stringify(String(item.value || ''))});`,
      );
    }
  }
}

async function inspectCompanyAdminPage(send, debugTextLimit) {
  return await evaluate(send, `(() => {
    const normalizePageText = (value) => String(value || '')
      .replace(/\u00a0/g, ' ')
      .replace(/[·•]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const hasAdminRoleMarker = (value) => {
      const tokens = normalizePageText(value).toUpperCase().split(/[^A-Z]+/).filter(Boolean);
      return tokens.includes('ADMIN');
    };
    const text = document.body?.innerText || '';
    const upper = text.toUpperCase();
    const hasText = (needle) => upper.includes(String(needle).toUpperCase());
    const uploadFilenamePattern = /\b[^\s]+\.(png|jpe?g|webp|mp4)\b/i;
    const buttons = Array.from(document.querySelectorAll('button')).map((node) => (node.textContent || '').trim()).filter(Boolean);
    const url = location.href;
    const navEntry = performance.getEntriesByType('navigation')[0];
    const root = document.getElementById('root');
    const currentAccountNode = document.querySelector('[aria-label="Current account"]');
    const currentAccountText = normalizePageText(currentAccountNode?.textContent || '');
    const currentAccountChipText = normalizePageText(currentAccountNode?.textContent || '');
    const adminNoSavedBoothsDetected = hasText('No saved booths loaded for this account yet');
    const reviewUploadFilenameVisible = uploadFilenamePattern.test(text);
    const reviewUploadDetailVisible = hasText('Stored privately in')
      || hasText('Reviewed at')
      || hasText('Promoted to public')
      || hasText('Public release URL created for explicit admin publish')
      || hasText('This upload is approved for internal review');
    const reviewUploadKindMimeVisible = hasText('Kind:') && hasText('/ MIME:') && hasText('/ Size:');
    const reviewUploadStatusBadgeVisible = hasText('PENDING REVIEW')
      || hasText('PROMOTED TO PUBLIC')
      || hasText('PUBLIC RELEASE URL CREATED FOR EXPLICIT ADMIN PUBLISH');
    const adminReviewFixtureEvidence = [];
    if (adminNoSavedBoothsDetected) adminReviewFixtureEvidence.push('NO_SAVED_BOOTHS_EMPTY_STATE');
    if (reviewUploadFilenameVisible) adminReviewFixtureEvidence.push('UPLOAD_FILENAME');
    if (reviewUploadDetailVisible) adminReviewFixtureEvidence.push('UPLOAD_DETAIL_COPY');
    if (reviewUploadKindMimeVisible) adminReviewFixtureEvidence.push('UPLOAD_KIND_MIME_SIZE_ROW');
    if (reviewUploadStatusBadgeVisible) adminReviewFixtureEvidence.push('UPLOAD_STATUS_BADGE_OR_PROMOTION_COPY');
    const adminReviewFixturePresent = !adminNoSavedBoothsDetected
      && (reviewUploadFilenameVisible || reviewUploadDetailVisible || reviewUploadKindMimeVisible || reviewUploadStatusBadgeVisible);
    return {
      url,
      title: document.title || '',
      readyState: document.readyState,
      rootChildCount: root ? root.childElementCount : null,
      rootHasChildren: Boolean(root && root.childElementCount > 0),
      navigationStatus: typeof navEntry?.responseStatus === 'number' ? navEntry.responseStatus : null,
      urlContainsExpoAdmin: url.includes('/expo/admin'),
      bodyTextPreview: text.slice(0, ${JSON.stringify(debugTextLimit)}),
      companyAdminLoaded: hasText('EXPO ADMIN') || hasText('Media Review') || hasText('Sponsor Asset Pack') || hasText('Sponsor Readiness'),
      expoAdminHeaderVisible: hasText('EXPO ADMIN'),
      mediaReviewVisible: hasText('Media Review'),
      uploadForReviewVisible: hasText('UPLOAD LOGO FOR REVIEW') || hasText('UPLOAD POSTER FOR REVIEW') || hasText('UPLOAD HERO FOR REVIEW'),
      sponsorReadinessVisible: hasText('Sponsor Readiness'),
      companyAdminTextVisible: hasText('CompanyAdmin'),
      submitForReviewVisible: hasText('Submit for review'),
      approveVisible: buttons.some((label) => label.includes('APPROVE')),
      rejectVisible: buttons.some((label) => label.includes('REJECT')),
      promoteVisible: buttons.some((label) => label.includes('PROMOTE TO')),
      adminNoSavedBoothsDetected,
      adminReviewFixtureEvidence,
      adminReviewFixturePresent,
      reviewUploadDetailVisible,
      reviewUploadFilenameVisible,
      reviewUploadKindMimeVisible,
      reviewUploadStatusBadgeVisible,
      pendingReviewVisible: hasText('PENDING REVIEW'),
      approvedUploadVisible: hasText('APPROVED'),
      promotedUploadVisible: hasText('PROMOTED'),
      rejectedUploadVisible: hasText('REJECTED'),
      sponsorAssetPackVisible: hasText('Sponsor Asset Pack'),
      directExpoAssetsUploadVisible: hasText('ADMIN-ONLY LOGO UPLOAD')
        || hasText('ADMIN-ONLY HERO IMAGE UPLOAD')
        || hasText('ADMIN-ONLY PRODUCT IMAGE UPLOAD')
        || hasText('ADMIN-ONLY DEMO VIDEO UPLOAD')
        || hasText('ADMIN-ONLY BROCHURE PDF UPLOAD'),
      sendAssetPackShortcutVisible: hasText('Send asset pack to booth screen')
        || hasText('USE IMAGE ON BOOTH SCREEN')
        || hasText('USE VIDEO SLOT ON BOOTH SCREEN'),
      signInRequiredVisible: hasText('SIGN IN REQUIRED'),
      accessDeniedVisible: hasText('ACCESS DENIED'),
      loginStateHints: {
        accountVisible: hasText('ACCOUNT'),
        loginVisible: hasText('LOGIN') || hasText('SIGN IN'),
        logoutVisible: hasText('LOGOUT') || hasText('SIGN OUT'),
        profileVisible: hasText('PROFILE'),
      },
      currentAccountVisible: Boolean(currentAccountChipText) || hasText('Current account'),
      currentAccountText,
      currentAccountChipText,
      currentAccountRoleVisible: hasAdminRoleMarker(currentAccountChipText),
      markerSnapshot: {
        approve: buttons.some((label) => label.toUpperCase().includes('APPROVE')),
        companyAdmin: hasText('CompanyAdmin'),
        expoAdminHeader: hasText('EXPO ADMIN'),
        mediaReview: hasText('Media Review'),
        promote: buttons.some((label) => label.toUpperCase().includes('PROMOTE')),
        sponsorReadiness: hasText('Sponsor Readiness'),
        submitForReview: hasText('Submit for review'),
        uploadForReview: hasText('Upload for review') || hasText('UPLOAD LOGO FOR REVIEW') || hasText('UPLOAD POSTER FOR REVIEW') || hasText('UPLOAD HERO FOR REVIEW'),
        currentAccountVisible: Boolean(currentAccountChipText) || hasText('Current account'),
        currentAccountRoleVisible: hasAdminRoleMarker(currentAccountChipText),
      },
    };
  })();`);
}

async function inspectServiceWorkers(send) {
  return await evaluate(send, `(() => {
    if (!('serviceWorker' in navigator)) {
      return { supported: false, registrations: 0 };
    }
    return navigator.serviceWorker.getRegistrations().then((registrations) => ({
      registrations: registrations.length,
      scopes: registrations.map((registration) => registration.scope),
      supported: true,
    }));
  })();`);
}

async function clearServiceWorkersForCurrentOrigin(send) {
  return await evaluate(send, `(() => {
    if (!('serviceWorker' in navigator)) {
      return { attempted: false, cleared: 0, supported: false };
    }
    return navigator.serviceWorker.getRegistrations().then(async (registrations) => {
      let cleared = 0;
      for (const registration of registrations) {
        const ok = await registration.unregister();
        if (ok) cleared += 1;
      }
      return { attempted: true, cleared, supported: true };
    });
  })();`);
}

async function captureLoadedScriptUrls(send) {
  return await evaluate(send, `(() => Array.from(document.scripts || [])
    .map((node) => node.src || '')
    .filter(Boolean))();`);
}

async function waitForCompanyAdminMarkers(send, timeoutMs) {
  const markers = [
    'EXPO ADMIN',
    'Media Review',
    'Sponsor Readiness',
    'Upload for review',
  ];
  const expression = `(() => {
    const text = (document.body?.innerText || '').toUpperCase();
    return ${JSON.stringify(markers)}.some((marker) => text.includes(marker.toUpperCase()));
  })()`;
  return await waitFor(send, expression, timeoutMs);
}

function buildFailureSummary(checks) {
  return checks
    .filter((check) => !check.ok)
    .map((check) => `${check.name}${check.detail ? `: ${typeof check.detail === 'string' ? check.detail : JSON.stringify(check.detail)}` : ''}`);
}

function recordCheck(checks, condition, name, detail = null) {
  checks.push({ detail, name, ok: Boolean(condition), status: condition ? 'PASS' : 'FAIL' });
}

function recordInfo(checks, name, detail = null, status = 'INFO') {
  checks.push({ detail, name, ok: true, status });
}

function deriveCoverageSummary(options, page, checks) {
  const findCheck = (name) => checks.find((check) => check.name === name);
  const adminReviewFixtureState = options.role === 'admin'
    ? page.promotedUploadVisible
      ? 'PROMOTED'
      : page.approvedUploadVisible
        ? 'APPROVED'
        : page.pendingReviewVisible
          ? 'PENDING_REVIEW'
          : page.rejectedUploadVisible
            ? 'REJECTED'
            : 'NOT_PRESENT'
    : null;
  const sponsorVisibilityPassed = options.role === 'sponsor'
    ? [
        findCheck('CompanyAdmin surface markers visible')?.ok,
        findCheck('Media Review section visible')?.ok,
        findCheck('Upload for review controls visible')?.ok,
        findCheck('sponsor view hides approve controls')?.ok,
        findCheck('sponsor view hides reject controls')?.ok,
        findCheck('sponsor view hides promote controls')?.ok,
        findCheck('sponsor view hides old expo_assets upload controls')?.ok,
        findCheck('sponsor view hides public-release asset-pack shortcut')?.ok,
      ].every(Boolean)
    : null;

  const adminRenderVisibilityPassed = options.role === 'admin'
    ? [
        findCheck('CompanyAdmin surface markers visible')?.ok,
        findCheck('Media Review section visible')?.ok,
        findCheck('Upload for review controls visible')?.ok,
        findCheck('admin account chip visible')?.ok,
        findCheck('admin account chip exposes ADMIN role marker')?.ok,
        findCheck('admin logout visible')?.ok,
        findCheck('admin login hidden')?.ok,
        findCheck('sign-in gate not visible after injected auth')?.ok,
        findCheck('access denied not visible after injected auth')?.ok,
      ].every(Boolean)
    : null;

  const adminReviewFixturePresent = options.role === 'admin'
    ? Boolean(page.adminReviewFixturePresent)
    : null;

  let adminReviewActionControls = null;
  let adminFixtureReason = null;
  let adminFixtureEvidence = null;
  let adminNoSavedBoothsDetected = null;
  if (options.role === 'admin') {
    adminNoSavedBoothsDetected = Boolean(page.adminNoSavedBoothsDetected);
    adminFixtureEvidence = Array.isArray(page.adminReviewFixtureEvidence) ? page.adminReviewFixtureEvidence : [];
    if (!adminReviewFixturePresent) {
      adminReviewActionControls = 'NOT_COVERED';
      adminFixtureReason = page.adminNoSavedBoothsDetected
        ? 'NO_SAVED_BOOTHS_EMPTY_STATE'
        : 'NO_CONCRETE_REVIEW_UPLOAD_EVIDENCE';
    } else if (adminReviewFixtureState === 'PROMOTED') {
      const promotedControlsHidden = !page.approveVisible && !page.rejectVisible && !page.promoteVisible;
      adminReviewActionControls = promotedControlsHidden ? 'PASS' : 'FAIL';
      adminFixtureReason = promotedControlsHidden
        ? 'PROMOTED_UPLOAD_REPORTED_AS_FINAL_STATE'
        : 'PROMOTED_UPLOAD_SHOULD_NOT_EXPOSE_REVIEW_CONTROLS';
    } else {
      if (adminReviewFixtureState === 'PENDING_REVIEW') {
        const relevantChecks = checks.filter((check) =>
          check.name === 'admin pending review data exposes review controls');
        adminReviewActionControls = relevantChecks.every((check) => check.ok) ? 'PASS' : 'FAIL';
        adminFixtureReason = 'PENDING_REVIEW_UPLOAD_EVIDENCE_VISIBLE';
      } else if (adminReviewFixtureState === 'APPROVED') {
        const relevantChecks = checks.filter((check) =>
          check.name === 'admin approved upload data exposes promote control');
        adminReviewActionControls = relevantChecks.every((check) => check.ok) ? 'PASS' : 'FAIL';
        adminFixtureReason = 'APPROVED_REVIEW_UPLOAD_EVIDENCE_VISIBLE';
      } else if (adminReviewFixtureState === 'REJECTED') {
        adminReviewActionControls = 'PASS';
        adminFixtureReason = 'REJECTED_REVIEW_UPLOAD_REPORTED_AS_FINAL_STATE';
      } else {
        adminReviewActionControls = 'NOT_COVERED';
        adminFixtureReason = 'CONCRETE_REVIEW_UPLOAD_EVIDENCE_VISIBLE';
      }
    }
  }

  return {
    adminRenderVisibility: adminRenderVisibilityPassed == null ? 'N/A' : (adminRenderVisibilityPassed ? 'PASS' : 'FAIL'),
    adminFixtureEvidence: adminFixtureEvidence ?? 'N/A',
    adminFixtureReason: adminFixtureReason ?? 'N/A',
    adminNoSavedBoothsDetected: adminNoSavedBoothsDetected == null ? 'N/A' : adminNoSavedBoothsDetected,
    adminReviewActionControls: adminReviewActionControls ?? 'N/A',
    adminReviewActionFixture: adminReviewFixturePresent == null ? 'N/A' : (adminReviewFixturePresent ? 'PRESENT' : 'NOT_PRESENT'),
    adminReviewFixtureState: adminReviewFixtureState ?? 'N/A',
    sponsorVisibility: sponsorVisibilityPassed == null ? 'N/A' : (sponsorVisibilityPassed ? 'PASS' : 'FAIL'),
  };
}

function buildDiagnostics(page, options, extra = {}) {
  if (!page) {
    return {
      currentUrl: null,
      loginStateHints: null,
      pageTitle: null,
      targetPath: options.companyAdminPath,
      targetUrlContainsExpoAdmin: false,
      textMarkers: null,
      visibleTextPreview: null,
      ...extra,
    };
  }

  return {
    currentUrl: page.url,
    loginStateHints: page.loginStateHints,
    navigationStatus: page.navigationStatus,
    pageTitle: page.title,
    readyState: page.readyState,
    rootChildCount: page.rootChildCount,
    rootHasChildren: page.rootHasChildren,
    targetPath: options.companyAdminPath,
    targetUrlContainsExpoAdmin: page.urlContainsExpoAdmin,
    textMarkers: page.markerSnapshot,
    visibleTextPreview: page.bodyTextPreview,
    ...extra,
  };
}

function redactForOutput(result) {
  return {
    ...result,
    profileDir: result.profileDir ?? '<redacted>',
    storageStatePath: '<redacted>',
  };
}

function printResult(result, options) {
  const safeResult = redactForOutput(result);
  if (options.json) {
    console.log(JSON.stringify(safeResult, null, 2));
    return;
  }

  if (safeResult.ok) {
    console.log(`CompanyAdmin media review QA: PASS (${options.role})`);
  } else if (options.diagnoseOnly) {
    console.log(`CompanyAdmin media review QA: DIAGNOSE-ONLY (${options.role})`);
  } else {
    console.log(`CompanyAdmin media review QA: FAIL (${options.role})`);
  }

  for (const check of safeResult.checks) {
    console.log(`- ${check.status || (check.ok ? 'PASS' : 'FAIL')} ${check.name}`);
  }

  if (safeResult.coverageSummary) {
    console.log('Coverage Summary:');
    console.log(JSON.stringify(safeResult.coverageSummary, null, 2));
  }

  if (safeResult.diagnostics) {
    console.log('Diagnostics:');
    console.log(JSON.stringify(safeResult.diagnostics, null, 2));
  }
}

async function run() {
  const options = parseEnvOptions();

  if (options.help) {
    console.log(helpText());
    return;
  }

  options.profileDirPolicy = resolveProfileDirPolicy(options);

  if (options.allowMutation) {
    if (isProductionHost(options.baseUrl)) {
      throw new Error(`Refusing mutation mode against production host: ${options.baseUrl}`);
    }
    if (!options.storageStatePath || !options.testBoothId || !options.testFilePath) {
      throw new Error('QA_ALLOW_MUTATION=true requires QA_STORAGE_STATE_PATH, QA_TEST_BOOTH_ID, and QA_TEST_FILE_PATH.');
    }
    throw new Error('QA_ALLOW_MUTATION=true is intentionally not automated in this minimal helper yet. Use the documented manual staging-only mutation steps with disposable test data.');
  }

  if (!options.storageStatePath) {
    throw new Error('QA_STORAGE_STATE_PATH is required for signed-in CompanyAdmin QA. Provide a non-committed authenticated storage state file. This helper does not create or store one.');
  }

  const checks = [];
  const apiBaseUrl = deriveApiBaseUrl(options.baseUrl);
  const scene = await fetchText(`${apiBaseUrl}/api/expo/scene`, 15000);
  recordCheck(checks, scene.status === 200, '/api/expo/scene returns 200', { status: scene.status });
  recordCheck(checks, !scene.text.includes('expo_review_media'), '/api/expo/scene omits expo_review_media paths');

  const storageState = loadStorageState(options.storageStatePath);
  const browser = await startChromeIfNeeded(options);
  const wsUrl = await resolvePageWebSocketUrl(options.browserJsonUrl);
  const { send, ws } = await connectCdp(wsUrl);
  let page = null;
  const runtimeDiagnostics = createRuntimeDiagnostics();
  const diagState = {
    inFlightRequests: 0,
    lastNetworkActivityAt: Date.now(),
    requestUrls: new Map(),
  };

  try {
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Network.enable');
    await send('Log.enable');
    await send('Page.setLifecycleEventsEnabled', { enabled: true });
    if (options.disableBrowserCache) {
      await send('Network.setCacheDisabled', { cacheDisabled: true });
    }

    ws.addEventListener('message', (event) => {
      const message = JSON.parse(String(event.data));
      const method = message.method;
      const params = message.params || {};

      if (method === 'Runtime.consoleAPICalled') {
        const text = (params.args || []).map((arg) => arg.value ?? arg.description ?? '').join(' ');
        pushBounded(runtimeDiagnostics.consoleMessages, {
          level: params.type || 'log',
          text: summarizeText(text),
        });
      }

      if (method === 'Runtime.exceptionThrown') {
        pushBounded(runtimeDiagnostics.pageErrors, summarizeText(params.exceptionDetails?.text || params.exceptionDetails?.exception?.description || 'Runtime exception'));
      }

      if (method === 'Log.entryAdded') {
        pushBounded(runtimeDiagnostics.consoleMessages, {
          level: params.entry?.level || 'log',
          text: summarizeText(params.entry?.text || ''),
        });
      }

      if (method === 'Network.requestWillBeSent') {
        diagState.inFlightRequests += 1;
        diagState.lastNetworkActivityAt = Date.now();
        const requestUrl = params.request?.url || '';
        if (params.requestId) {
          diagState.requestUrls.set(params.requestId, requestUrl);
        }
        if (/CompanyAdmin-[A-Za-z0-9_-]+\.js/.test(requestUrl)) {
          runtimeDiagnostics.companyAdminChunkRequested = true;
        }
      }

      if (method === 'Network.responseReceived') {
        diagState.lastNetworkActivityAt = Date.now();
        const responseUrl = params.response?.url || '';
        if (/\/assets\/.+\.js(\?|$)/.test(responseUrl)) {
          pushBounded(runtimeDiagnostics.jsChunkResponses, {
            file: redactUrlForOutput(responseUrl),
            status: params.response?.status ?? null,
          }, 20);
        }
      }

      if (method === 'Network.loadingFinished') {
        diagState.inFlightRequests = Math.max(0, diagState.inFlightRequests - 1);
        diagState.lastNetworkActivityAt = Date.now();
        if (params.requestId) {
          diagState.requestUrls.delete(params.requestId);
        }
      }

      if (method === 'Network.loadingFailed') {
        diagState.inFlightRequests = Math.max(0, diagState.inFlightRequests - 1);
        diagState.lastNetworkActivityAt = Date.now();
        const requestUrl = params.requestId ? diagState.requestUrls.get(params.requestId) : null;
        pushBounded(runtimeDiagnostics.failedRequests, {
          blockedReason: params.blockedReason || null,
          errorText: summarizeText(params.errorText || ''),
          file: redactUrlForOutput(requestUrl || ''),
          type: params.type || null,
        });
        if (params.requestId) {
          diagState.requestUrls.delete(params.requestId);
        }
      }
    });

    await applyStorageState(send, options.baseUrl, storageState);
    await navigate(send, options.baseUrl, options.timeoutMs);
    runtimeDiagnostics.serviceWorkerInfo = await inspectServiceWorkers(send);
    if (options.clearServiceWorker && new URL(options.baseUrl).hostname === 'staging.30sek24.com') {
      runtimeDiagnostics.serviceWorkerClearResult = await clearServiceWorkersForCurrentOrigin(send);
      await navigate(send, options.baseUrl, options.timeoutMs);
      runtimeDiagnostics.serviceWorkerInfoAfterClear = await inspectServiceWorkers(send);
    }

    await navigate(send, `${options.baseUrl}${options.companyAdminPath}`, options.timeoutMs);
    await waitFor(send, 'document.readyState === "interactive" || document.readyState === "complete"', options.timeoutMs);
    await waitFor(send, 'Boolean(document.body)', options.timeoutMs);
    const networkIdle = await waitForNetworkIdle(diagState, Math.min(options.timeoutMs, options.renderWaitMs + 5000));
    const markerWaitSatisfied = await waitForCompanyAdminMarkers(send, options.renderWaitMs);
    runtimeDiagnostics.networkIdleReached = networkIdle;
    runtimeDiagnostics.markerWaitSatisfied = markerWaitSatisfied;

    page = await inspectCompanyAdminPage(send, options.debugTextLimit);
    const loadedScriptUrls = await captureLoadedScriptUrls(send);
    runtimeDiagnostics.loadedScriptUrls = loadedScriptUrls.map((url) => redactUrlForOutput(url)).filter(Boolean);
    page.bodyTextPreview = String(page.bodyTextPreview || '').slice(0, options.debugTextLimit);
    recordCheck(checks, page.urlContainsExpoAdmin, 'current URL contains /expo/admin', page.url);
    recordCheck(checks, page.companyAdminLoaded, 'CompanyAdmin surface markers visible', page.markerSnapshot);
    recordCheck(checks, !page.signInRequiredVisible, 'sign-in gate not visible after injected auth', page.loginStateHints);
    recordCheck(checks, !page.accessDeniedVisible, 'access denied not visible after injected auth', page.loginStateHints);

    if (options.expectMediaReview) {
      recordCheck(checks, page.mediaReviewVisible, 'Media Review section visible', page.markerSnapshot);
      recordCheck(checks, page.uploadForReviewVisible, 'Upload for review controls visible', page.markerSnapshot);
    }

    if (options.role === 'sponsor') {
      recordCheck(checks, !page.approveVisible, 'sponsor view hides approve controls');
      recordCheck(checks, !page.rejectVisible, 'sponsor view hides reject controls');
      recordCheck(checks, !page.promoteVisible, 'sponsor view hides promote controls');
      recordCheck(checks, !page.directExpoAssetsUploadVisible, 'sponsor view hides old expo_assets upload controls');
      recordCheck(checks, !page.sendAssetPackShortcutVisible, 'sponsor view hides public-release asset-pack shortcut');
    } else {
      const currentAccountRoleVisibleNode = accountChipHasAdminRoleMarker(page.currentAccountChipText || page.currentAccountText);
      recordCheck(checks, page.currentAccountVisible, 'admin account chip visible', page.markerSnapshot);
      recordCheck(checks, currentAccountRoleVisibleNode, 'admin account chip exposes ADMIN role marker', page.currentAccountChipText || page.currentAccountText);
      recordCheck(checks, page.loginStateHints.logoutVisible, 'admin logout visible', page.loginStateHints);
      recordInfo(checks, 'admin account chip role marker node-side derivation', {
        currentAccountChipText: page.currentAccountChipText || '<redacted>',
        currentAccountRoleVisibleBrowser: page.currentAccountRoleVisible,
        currentAccountRoleVisibleNode,
        currentAccountText: page.currentAccountText || '<redacted>',
      });
      recordCheck(checks, !page.loginStateHints.loginVisible, 'admin login hidden', page.loginStateHints);
      const matchingDataExists = Boolean(page.adminReviewFixturePresent);
      recordInfo(checks, 'admin view upload-state visibility snapshot', {
        adminNoSavedBoothsDetected: page.adminNoSavedBoothsDetected,
        fixtureEvidence: page.adminReviewFixtureEvidence,
        approvedVisible: page.approvedUploadVisible,
        pendingVisible: page.pendingReviewVisible,
        promotedVisible: page.promotedUploadVisible,
        rejectedVisible: page.rejectedUploadVisible,
      });
      if (page.pendingReviewVisible && matchingDataExists) {
        recordCheck(checks, page.rejectVisible || page.approveVisible, 'admin pending review data exposes review controls');
      }
      if (page.approvedUploadVisible && matchingDataExists && !page.promotedUploadVisible) {
        recordCheck(checks, page.promoteVisible, 'admin approved upload data exposes promote control');
      }
      if (page.promotedUploadVisible && matchingDataExists) {
        recordCheck(checks, !page.approveVisible && !page.rejectVisible && !page.promoteVisible, 'admin promoted upload hides review controls');
      }
      if (!matchingDataExists) {
        recordInfo(
          checks,
          'admin review action controls not covered (no review upload fixture visible)',
          {
            adminNoSavedBoothsDetected: page.adminNoSavedBoothsDetected,
            approvedVisible: page.approvedUploadVisible,
            fixtureEvidence: page.adminReviewFixtureEvidence,
            pendingVisible: page.pendingReviewVisible,
            promotedVisible: page.promotedUploadVisible,
            rejectedVisible: page.rejectedUploadVisible,
          },
          'NOT_COVERED',
        );
      }
      recordInfo(checks, 'admin old public asset controls snapshot', {
        directExpoAssetsUploadVisible: page.directExpoAssetsUploadVisible,
        matchingDataExists,
        sendAssetPackShortcutVisible: page.sendAssetPackShortcutVisible,
      });
    }

    const failures = buildFailureSummary(checks);
    const coverageSummary = deriveCoverageSummary(options, page, checks);
    const result = {
      apiBaseUrl,
      baseUrl: options.baseUrl,
      checks,
      coverageSummary,
      diagnostics: buildDiagnostics(page, options, {
        coverageSummary,
        clearServiceWorker: options.clearServiceWorker,
        companyAdminChunkRequested: runtimeDiagnostics.companyAdminChunkRequested,
        consoleMessages: runtimeDiagnostics.consoleMessages,
        documentReadyState: page.readyState,
        failedRequests: runtimeDiagnostics.failedRequests,
        failureCount: failures.length,
        failureSummary: failures,
        jsChunkResponses: runtimeDiagnostics.jsChunkResponses,
        loadedScriptUrls: runtimeDiagnostics.loadedScriptUrls,
        networkIdleReached: runtimeDiagnostics.networkIdleReached,
        pageErrors: runtimeDiagnostics.pageErrors,
        reactRootHasChildren: page.rootHasChildren,
        renderWaitMs: options.renderWaitMs,
        serviceWorkerInfo: runtimeDiagnostics.serviceWorkerInfo,
        serviceWorkerInfoAfterClear: runtimeDiagnostics.serviceWorkerInfoAfterClear,
        serviceWorkerClearResult: runtimeDiagnostics.serviceWorkerClearResult,
        waitMarkerSatisfied: runtimeDiagnostics.markerWaitSatisfied,
      }),
      ok: failures.length === 0,
      profileDir: options.profileDirPolicy.transient ? '<temp>' : redactLocalPath(options.profileDirPolicy.resolvedProfileDir),
      role: options.role,
      storageStatePath: '<redacted>',
    };

    if (options.diagnoseOnly) {
      printResult(result, options);
      return;
    }

    if (!result.ok) {
      printResult(result, options);
      const error = new Error(failures.join('\n'));
      error.alreadyReported = true;
      throw error;
    }

    printResult(result, options);
  } finally {
    try {
      ws.close();
    } catch {
      // Ignore CDP shutdown errors.
    }
    if (browser.browserStarted && !options.keepBrowser) {
      try {
        const targets = await fetchJson(options.browserJsonUrl, 1500);
        const firstPage = targets.find((target) => target.type === 'page' && target.id);
        if (firstPage?.id) {
          await fetchText(options.browserJsonUrl.replace(/\/json\b/, `/json/close/${firstPage.id}`), 1500);
        }
      } catch {
        // Ignore browser cleanup errors.
      }
    }
    if (options.profileDirPolicy.transient && !options.keepBrowser) {
      try {
        fs.rmSync(options.profileDirPolicy.resolvedProfileDir, { force: true, recursive: true });
      } catch {
        // Ignore temp profile cleanup errors.
      }
    }
  }
}

run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  if (error && typeof error === 'object' && error.alreadyReported) {
    process.exitCode = 1;
    return;
  }
  console.error(`CompanyAdmin media review QA: FAIL\n${message}`);
  process.exitCode = 1;
});

