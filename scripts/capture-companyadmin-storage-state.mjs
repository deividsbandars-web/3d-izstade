#!/usr/bin/env node

import childProcess from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline/promises';

const REPO_ROOT = process.cwd();
const DEFAULT_PROFILE_DIR = path.join(os.tmpdir(), 'warpala-companyadmin-storage-capture-chrome-profile');

const DEFAULTS = {
  baseUrl: 'https://staging.30sek24.com',
  browserJsonUrl: 'http://127.0.0.1:9235/json',
  chromePort: 9235,
  companyAdminPath: '/expo/admin',
  profileDir: DEFAULT_PROFILE_DIR,
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
    allowProductionCapture: readBool(process.env.QA_ALLOW_PRODUCTION_STORAGE_CAPTURE, false),
    baseUrl: String(process.env.QA_BASE_URL || DEFAULTS.baseUrl).trim().replace(/\/+$/, ''),
    browserJsonUrl,
    chromePort: portMatch ? Number(portMatch[1]) : DEFAULTS.chromePort,
    companyAdminPath: String(process.env.QA_COMPANY_ADMIN_PATH || DEFAULTS.companyAdminPath).trim() || DEFAULTS.companyAdminPath,
    explicitProfileDir,
    help: process.argv.includes('--help') || process.argv.includes('-h'),
    keepBrowser: readBool(process.env.QA_KEEP_BROWSER, false),
    outputPath: String(process.env.QA_STORAGE_STATE_OUTPUT_PATH || '').trim(),
    outputPathInsideRepoAllowed: readBool(process.env.QA_ALLOW_REPO_STORAGE_STATE_OUTPUT, false),
    profileDir,
    profileDirInsideRepoAllowed: readBool(process.env.QA_ALLOW_REPO_BROWSER_PROFILE_DIR, false),
    role,
    timeoutMs: Number.parseInt(String(process.env.QA_TIMEOUT_MS || DEFAULTS.timeoutMs), 10) || DEFAULTS.timeoutMs,
  };
}

function helpText() {
  return `
CompanyAdmin storage-state capture helper

Usage:
  node scripts/capture-companyadmin-storage-state.mjs --help
  node scripts/capture-companyadmin-storage-state.mjs

Required env:
  QA_ROLE=sponsor|admin
  QA_STORAGE_STATE_OUTPUT_PATH=<outside-repo json path>

Optional env:
  QA_BASE_URL=https://staging.30sek24.com
  QA_COMPANY_ADMIN_PATH=/expo/admin
  QA_BROWSER_JSON_URL=http://127.0.0.1:9235/json
  QA_BROWSER_PROFILE_DIR=<local path outside repo>
  QA_ALLOW_REPO_STORAGE_STATE_OUTPUT=false
  QA_ALLOW_REPO_BROWSER_PROFILE_DIR=false
  QA_ALLOW_PRODUCTION_STORAGE_CAPTURE=false
  QA_TIMEOUT_MS=45000
  QA_KEEP_BROWSER=true

Safety:
  - no passwords are accepted through CLI args or env
  - storage-state output path must be explicit
  - repo-local output paths are refused unless QA_ALLOW_REPO_STORAGE_STATE_OUTPUT=true
  - production capture is refused unless QA_ALLOW_PRODUCTION_STORAGE_CAPTURE=true
  - browser profile defaults to OS temp storage and is cleaned up by default
  - cookies, tokens, and storage contents are never printed
`.trim();
}

function isPathInside(parentPath, candidatePath) {
  const parent = path.resolve(parentPath);
  const candidate = path.resolve(candidatePath);
  const relative = path.relative(parent, candidate);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function redactLocalPath(filePath) {
  if (!filePath) {
    return '<redacted>';
  }

  return path.basename(String(filePath));
}

function isProductionHost(baseUrl) {
  const hostname = new URL(baseUrl).hostname.toLowerCase();
  return hostname === 'www.30sek24.com' || hostname === '30sek24.com' || hostname === 'api.30sek24.com';
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

  return {
    explicit,
    transient,
    resolvedProfileDir,
  };
}

function resolveOutputPathPolicy(options) {
  if (!options.outputPath) {
    throw new Error('QA_STORAGE_STATE_OUTPUT_PATH is required. Provide an explicit output path outside the repo.');
  }

  const resolvedOutputPath = path.resolve(options.outputPath);
  const insideRepo = isPathInside(REPO_ROOT, resolvedOutputPath);

  if (insideRepo && !options.outputPathInsideRepoAllowed) {
    throw new Error(
      `Refusing repo-local QA_STORAGE_STATE_OUTPUT_PATH: ${resolvedOutputPath}. ` +
      'Use a path outside the repo, or set QA_ALLOW_REPO_STORAGE_STATE_OUTPUT=true only if you explicitly accept responsibility.',
    );
  }

  return {
    insideRepo,
    resolvedOutputPath,
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url, timeoutMs = 5000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
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
    `${options.baseUrl}${options.companyAdminPath}`,
  ];

  const chromeProcess = childProcess.spawn(chromePath, chromeArgs, {
    detached: process.platform !== 'win32',
    stdio: 'ignore',
    windowsHide: false,
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
  const adminPage = pages.find((target) => String(target.url || '').includes('/expo/admin'));
  const fallback = adminPage ?? pages[0] ?? targets.find((target) => target.webSocketDebuggerUrl);

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
    throw new Error(result.result.exceptionDetails.text || 'Runtime.evaluate exception');
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
      // Ignore transient page evaluation errors during manual navigation.
    }
    await sleep(300);
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

async function captureStorageState(send, baseUrl) {
  const baseOrigin = new URL(baseUrl).origin;
  await navigate(send, `${baseOrigin}/expo/admin`, 15000);

  const storageEntries = await evaluate(send, `(() => ({
    localStorage: Object.entries(localStorage).map(([name, value]) => ({ name, value })),
    sessionStorage: Object.entries(sessionStorage).map(([name, value]) => ({ name, value })),
    url: location.href,
  }))();`);

  const cookieResult = await send('Network.getCookies', { urls: [baseOrigin, `${baseOrigin}/expo/admin`] });
  const cookies = Array.isArray(cookieResult.cookies)
    ? cookieResult.cookies.map((cookie) => ({
        domain: cookie.domain,
        expires: typeof cookie.expires === 'number' ? cookie.expires : -1,
        httpOnly: Boolean(cookie.httpOnly),
        name: cookie.name,
        path: cookie.path || '/',
        sameSite: cookie.sameSite,
        secure: Boolean(cookie.secure),
        value: cookie.value,
      }))
    : [];

  return {
    cookies,
    origins: [
      {
        localStorage: Array.isArray(storageEntries?.localStorage) ? storageEntries.localStorage : [],
        origin: baseOrigin,
        sessionStorage: Array.isArray(storageEntries?.sessionStorage) ? storageEntries.sessionStorage : [],
      },
    ],
  };
}

async function promptForManualLogin(role) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    await rl.question(
      `Log in manually in the opened browser as the ${role} role, navigate to /expo/admin if needed, then press Enter in terminal to save storage state.`,
    );
  } finally {
    rl.close();
  }
}

async function run() {
  const options = parseEnvOptions();

  if (options.help) {
    console.log(helpText());
    return;
  }

  if (isProductionHost(options.baseUrl) && !options.allowProductionCapture) {
    throw new Error(`Refusing storage-state capture against production host: ${options.baseUrl}. Use staging. Production capture requires QA_ALLOW_PRODUCTION_STORAGE_CAPTURE=true and is still not recommended.`);
  }

  options.profileDirPolicy = resolveProfileDirPolicy(options);
  options.outputPathPolicy = resolveOutputPathPolicy(options);

  const browser = await startChromeIfNeeded(options);
  const wsUrl = await resolvePageWebSocketUrl(options.browserJsonUrl);
  const { send, ws } = await connectCdp(wsUrl);

  try {
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Network.enable');
    await navigate(send, `${options.baseUrl}${options.companyAdminPath}`, options.timeoutMs);

    console.log(`Manual login required for role: ${options.role}`);
    console.log('No passwords or tokens are accepted by this helper. Complete login in the browser window only.');
    await promptForManualLogin(options.role);

    const storageState = await captureStorageState(send, options.baseUrl);
    fs.mkdirSync(path.dirname(options.outputPathPolicy.resolvedOutputPath), { recursive: true });
    fs.writeFileSync(options.outputPathPolicy.resolvedOutputPath, JSON.stringify(storageState, null, 2), 'utf8');

    if (!fs.existsSync(options.outputPathPolicy.resolvedOutputPath)) {
      throw new Error('Storage-state capture reported success, but the output file was not found afterward.');
    }

    if (isPathInside(REPO_ROOT, options.outputPathPolicy.resolvedOutputPath) && !options.outputPathInsideRepoAllowed) {
      throw new Error('Storage-state file resolved into the repo unexpectedly after write; aborting.');
    }

    console.log(`Storage state saved for role ${options.role}: ${redactLocalPath(options.outputPathPolicy.resolvedOutputPath)}`);
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
          const closeUrl = options.browserJsonUrl.replace(/\/json\b/, `/json/close/${firstPage.id}`);
          try {
            await fetchJson(closeUrl, 1500);
          } catch {
            // Ignore close response shape errors.
          }
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
  console.error(`CompanyAdmin storage-state capture: FAIL\n${message}`);
  process.exitCode = 1;
});
