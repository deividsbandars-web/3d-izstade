#!/usr/bin/env node

import childProcess from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const DEFAULTS = {
  baseUrl: 'https://staging.30sek24.com',
  browserJsonUrl: 'http://127.0.0.1:9231/json',
  chromePort: 9231,
  profileDir: 'review_artifacts/tmp/staging-browser-smoke-chrome-profile',
  timeoutMs: 45000,
};

const SALES_STEPS = ['landmark', 'premium', 'standard', 'arena'];

function parseArgs(argv) {
  const options = {
    ...DEFAULTS,
    json: false,
    keepBrowser: false,
    visible: false,
  };

  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg === '--keep-browser') {
      options.keepBrowser = true;
    } else if (arg === '--visible') {
      options.visible = true;
    } else if (arg.startsWith('--base-url=')) {
      options.baseUrl = arg.slice('--base-url='.length).replace(/\/+$/, '');
    } else if (arg.startsWith('--browser=')) {
      options.browserJsonUrl = arg.slice('--browser='.length);
      const portMatch = options.browserJsonUrl.match(/:(\d+)\/json\b/);
      if (portMatch) {
        options.chromePort = Number(portMatch[1]);
      }
    } else if (arg.startsWith('--profile-dir=')) {
      options.profileDir = arg.slice('--profile-dir='.length);
    } else if (arg.startsWith('--timeout-ms=')) {
      options.timeoutMs = Number.parseInt(arg.slice('--timeout-ms='.length), 10) || DEFAULTS.timeoutMs;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function helpText() {
  return `
Expo staging browser smoke check

Usage:
  npm run check:expo-staging-browser-smoke -- [options]

Options:
  --base-url=https://staging.30sek24.com
  --browser=http://127.0.0.1:9231/json
  --profile-dir=review_artifacts/tmp/staging-browser-smoke-chrome-profile
  --timeout-ms=45000
  --visible
  --keep-browser
  --json

Checks real browser DOM/snapshot behavior for:
  - /expo-3d default
  - clean /expo-3d?salesDemo=1
  - salesDemoStep links
  - technical/operator regression with perf overlay
`.trim();
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
    return { browserStarted: false, process: null };
  }

  const chromePath = findChromePath();
  if (!chromePath) {
    throw new Error('Google Chrome/Chromium was not found. Set CHROME_PATH or start Chrome with remote debugging manually.');
  }

  const profileDir = path.resolve(options.profileDir);
  fs.mkdirSync(profileDir, { recursive: true });

  const chromeArgs = [
    `--remote-debugging-port=${options.chromePort}`,
    `--user-data-dir=${profileDir}`,
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
      return { browserStarted: true, process: chromeProcess };
    }
    await sleep(500);
  }

  throw new Error(`Chrome started, but CDP did not become available at ${options.browserJsonUrl}`);
}

async function resolvePageWebSocketUrl(browserJsonUrl) {
  const targets = await fetchJson(browserJsonUrl);
  const pages = targets.filter((target) => target.type === 'page' && target.webSocketDebuggerUrl);
  const expoPage = pages.find((target) => String(target.url || '').includes('/expo-3d'));
  const fallback = expoPage ?? pages[0] ?? targets.find((target) => target.webSocketDebuggerUrl);

  if (!fallback?.webSocketDebuggerUrl) {
    throw new Error(`No CDP page target found in ${browserJsonUrl}`);
  }

  return fallback.webSocketDebuggerUrl;
}

function connectCdp(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let nextId = 0;
  const pending = new Map();
  const events = [];

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
      return;
    }
    if (message.method) {
      events.push(message);
    }
  });

  return new Promise((resolve, reject) => {
    ws.addEventListener('open', () => {
      const send = (method, params = {}) => new Promise((methodResolve, methodReject) => {
        const id = ++nextId;
        pending.set(id, { resolve: methodResolve, reject: methodReject });
        ws.send(JSON.stringify({ id, method, params }));
      });

      resolve({
        events,
        send,
        ws,
      });
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

async function waitFor(send, expression, label, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      if (await evaluate(send, expression)) {
        return true;
      }
    } catch {
      // React may not have hydrated yet.
    }
    await sleep(350);
  }

  throw new Error(`Timed out waiting for ${label}`);
}

function pageUrl(baseUrl, pathAndSearch) {
  return `${baseUrl}${pathAndSearch}`;
}

async function navigate(send, url, timeoutMs) {
  await send('Page.navigate', { url });
  await waitFor(send, 'document.readyState === "complete" || document.readyState === "interactive"', `page load ${url}`, timeoutMs);
  await sleep(2500);
}

function collectEventSummary(events, fromIndex) {
  const recent = events.slice(fromIndex);
  const runtimeExceptions = recent
    .filter((event) => event.method === 'Runtime.exceptionThrown')
    .map((event) => event.params?.exceptionDetails?.text || event.params?.exceptionDetails?.exception?.description || 'Runtime exception');
  const browserErrors = recent
    .filter((event) => event.method === 'Log.entryAdded' && ['error', 'critical'].includes(event.params?.entry?.level))
    .map((event) => event.params?.entry?.text || 'Browser log error');
  const leadApiRequests = recent.filter((event) => {
    if (event.method !== 'Network.requestWillBeSent') {
      return false;
    }
    return String(event.params?.request?.url || '').includes('/api/expo/lead');
  }).length;

  return {
    browserErrors,
    leadApiRequests,
    runtimeExceptions,
  };
}

async function inspectPage(send) {
  return await evaluate(send, `
(() => {
  const guide = document.querySelector('[data-sales-demo-guide-overlay="true"]');
  const activeLink = document.querySelector('[data-sales-demo-step-link][aria-current="page"]');
  const activeGuideStep = document.querySelector('[data-sales-demo-guide-step-active="true"]');
  const ctaLabels = [...document.querySelectorAll('[data-sales-demo-cta-label]')].map((node) => ({
    href: node.getAttribute('href'),
    label: node.getAttribute('data-sales-demo-cta-label') || node.textContent?.trim() || '',
    tag: node.tagName.toLowerCase(),
  }));
  const snapshot = window.__WARPALA_EXPO_REVIEW_OPERATOR__?.getSnapshot?.();
  return {
    activeGuideStep: activeGuideStep?.getAttribute('data-sales-demo-guide-step') ?? null,
    activeLink: activeLink?.getAttribute('data-sales-demo-step-link') ?? null,
    activeStep: guide?.getAttribute('data-sales-demo-active-step') ?? null,
    bodyTextPreview: document.body.innerText.slice(0, 700),
    ctaLabels,
    ctaSectionVisible: Boolean(document.querySelector('[data-sales-demo-cta-section="true"]')),
    guideVisible: Boolean(guide),
    leadCaptureVisible: Boolean(document.querySelector('[data-booth-product-lead-capture-overlay="true"]')),
    leadSubmitMode: document.querySelector('[data-booth-product-lead-capture-overlay="true"]')?.getAttribute('data-booth-product-lead-submit-mode') ?? null,
    location: window.location.href,
    performanceOverlayVisible: Boolean(document.querySelector('[data-expo-performance-overlay="true"]')),
    stepLinkCount: document.querySelectorAll('[data-sales-demo-step-link]').length,
    title: document.title,
    snapshot: snapshot ? {
      boothProductCards: snapshot.boothProductPreview?.visiblePreviewCardCount ?? null,
      boothProductPreviewEnabled: snapshot.boothProductPreview?.enabled ?? null,
      demoArenaMappedScreens: snapshot.demoArenaPreview?.mappedScreenCount ?? null,
      demoArenaPreviewEnabled: snapshot.demoArenaPreview?.enabled ?? null,
      demoArenaTotalTargets: snapshot.demoArenaPreview?.totalTargets ?? null,
      salesDemoEnabled: snapshot.salesDemo?.enabled ?? null,
      salesDemoStep: snapshot.salesDemo?.step ?? null,
    } : null,
  };
})()
`);
}

function assertCheck(checks, ok, message, details = null) {
  checks.push({ details, message, ok: Boolean(ok) });
}

async function runCase({ events, name, pathAndSearch, send, timeoutMs, validate }) {
  const eventStart = events.length;
  await navigate(send, pathAndSearch.url, timeoutMs);
  if (pathAndSearch.waitForGuide) {
    await waitFor(send, 'Boolean(document.querySelector("[data-sales-demo-guide-overlay=\\"true\\"]"))', `${name} sales demo guide`, timeoutMs);
  }
  if (pathAndSearch.waitForOperator) {
    await waitFor(send, 'Boolean(window.__WARPALA_EXPO_REVIEW_OPERATOR__?.getSnapshot?.())', `${name} operator snapshot`, timeoutMs);
    await sleep(1500);
  }

  const page = await inspectPage(send);
  const eventSummary = collectEventSummary(events, eventStart);
  const checks = [];
  validate(page, eventSummary, checks);
  assertCheck(checks, eventSummary.runtimeExceptions.length === 0, 'no runtime exceptions', eventSummary.runtimeExceptions);
  assertCheck(checks, eventSummary.browserErrors.length === 0, 'no browser error log entries', eventSummary.browserErrors);
  assertCheck(checks, eventSummary.leadApiRequests === 0, 'no automatic lead API request during page load', eventSummary.leadApiRequests);

  return {
    checks,
    events: eventSummary,
    name,
    ok: checks.every((check) => check.ok),
    page,
    url: pathAndSearch.url,
  };
}

function buildCases(baseUrl) {
  const cleanSalesUrl = pageUrl(baseUrl, '/expo-3d?salesDemo=1');
  return [
    {
      name: 'default expo route',
      url: pageUrl(baseUrl, '/expo-3d'),
      validate(page, _events, checks) {
        assertCheck(checks, !page.guideVisible, 'sales guide hidden by default');
        assertCheck(checks, page.stepLinkCount === 0, 'sales step links hidden by default', page.stepLinkCount);
        assertCheck(checks, !page.ctaSectionVisible, 'sales CTA section hidden by default');
        assertCheck(checks, !page.leadCaptureVisible, 'lead capture hidden by default');
      },
    },
    {
      name: 'clean sales demo overview',
      url: cleanSalesUrl,
      waitForGuide: true,
      validate(page, _events, checks) {
        assertCheck(checks, page.guideVisible, 'sales guide visible');
        assertCheck(checks, page.stepLinkCount === 5, 'five sales step links visible', page.stepLinkCount);
        assertCheck(checks, page.activeStep === 'none', 'overview active step is none', page.activeStep);
        assertCheck(checks, page.activeLink === 'none', 'overview link is active', page.activeLink);
        assertCheck(checks, page.ctaSectionVisible, 'sales CTA section visible');
        assertCheck(checks, page.ctaLabels.length === 2, 'two sales CTA labels visible', page.ctaLabels);
        assertCheck(
          checks,
          page.ctaLabels.every((item) => !item.href || item.href.startsWith('/expo')),
          'sales CTA links are internal or static only',
          page.ctaLabels,
        );
      },
    },
    {
      name: 'sponsor packages route',
      url: pageUrl(baseUrl, '/expo/sponsor-packages'),
      validate(page, _events, checks) {
        assertCheck(checks, !page.guideVisible, 'sales guide hidden on sponsor packages page');
        assertCheck(checks, page.bodyTextPreview.includes('Standard Booth'), 'Standard Booth package copy visible');
        assertCheck(checks, page.bodyTextPreview.includes('Premium Booth'), 'Premium Booth package copy visible');
        assertCheck(checks, page.bodyTextPreview.includes('Landmark Zone Sponsor'), 'Landmark Zone Sponsor package copy visible');
      },
    },
    ...SALES_STEPS.map((step) => ({
      name: `clean sales demo ${step}`,
      url: pageUrl(baseUrl, `/expo-3d?salesDemo=1&salesDemoStep=${step}`),
      waitForGuide: true,
      validate(page, _events, checks) {
        assertCheck(checks, page.guideVisible, 'sales guide visible');
        assertCheck(checks, page.activeStep === step, `active step is ${step}`, page.activeStep);
        assertCheck(checks, page.activeLink === step, `active link is ${step}`, page.activeLink);
        assertCheck(checks, page.activeGuideStep === step, `active guide item is ${step}`, page.activeGuideStep);
      },
    })),
    {
      name: 'technical operator sales demo regression',
      url: pageUrl(baseUrl, '/expo-3d?operator=1&expoData=review&perf=1&quality=high&salesDemo=1&salesDemoStep=arena'),
      waitForGuide: true,
      waitForOperator: true,
      validate(page, _events, checks) {
        assertCheck(checks, page.guideVisible, 'sales guide visible');
        assertCheck(checks, page.performanceOverlayVisible, 'performance overlay visible');
        assertCheck(checks, page.snapshot?.salesDemoEnabled === true, 'operator snapshot salesDemo enabled', page.snapshot);
        assertCheck(checks, page.snapshot?.salesDemoStep === 'arena', 'operator snapshot salesDemoStep arena', page.snapshot);
        assertCheck(checks, page.snapshot?.boothProductPreviewEnabled === true, 'operator snapshot boothProduct preview enabled', page.snapshot);
        assertCheck(checks, page.snapshot?.boothProductCards === 3, 'operator snapshot boothProduct cards = 3', page.snapshot);
        assertCheck(checks, page.snapshot?.demoArenaPreviewEnabled === true, 'operator snapshot demo arena preview enabled', page.snapshot);
        assertCheck(checks, page.snapshot?.demoArenaMappedScreens === 8, 'operator snapshot Demo Arena mapped screens = 8', page.snapshot);
        assertCheck(checks, page.snapshot?.demoArenaTotalTargets === 8, 'operator snapshot Demo Arena total targets = 8', page.snapshot);
      },
    },
  ];
}

function printHuman(result) {
  console.log(`Expo staging browser smoke: ${result.ok ? 'PASS' : 'FAIL'}`);
  console.log(`Base URL: ${result.baseUrl}`);
  console.log(`Generated: ${result.generatedAt}`);

  for (const testCase of result.cases) {
    console.log(`- ${testCase.ok ? 'PASS' : 'FAIL'}: ${testCase.name}`);
    for (const check of testCase.checks) {
      if (!check.ok) {
        console.log(`  FAIL: ${check.message}`);
        if (check.details !== null) {
          console.log(`  details: ${JSON.stringify(check.details)}`);
        }
      }
    }
  }

  if (result.warnings.length > 0) {
    console.log('Warnings:');
    for (const warning of result.warnings) {
      console.log(`- ${warning}`);
    }
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(helpText());
    return;
  }

  if (typeof WebSocket === 'undefined') {
    throw new Error(`This script requires a Node runtime with global WebSocket support. Current: ${process.version} on ${os.platform()}`);
  }

  const browser = await startChromeIfNeeded(options);
  const wsUrl = await resolvePageWebSocketUrl(options.browserJsonUrl);
  const { events, send, ws } = await connectCdp(wsUrl);

  try {
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Log.enable');
    await send('Network.enable');
    await send('Network.setCacheDisabled', { cacheDisabled: true });
    await send('Emulation.setDeviceMetricsOverride', {
      deviceScaleFactor: 1,
      height: 960,
      mobile: false,
      width: 1440,
    });

    const cases = [];
    for (const testCase of buildCases(options.baseUrl)) {
      cases.push(await runCase({
        events,
        name: testCase.name,
        pathAndSearch: testCase,
        send,
        timeoutMs: options.timeoutMs,
        validate: testCase.validate,
      }));
    }

    const result = {
      baseUrl: options.baseUrl,
      browserStarted: browser.browserStarted,
      cases,
      generatedAt: new Date().toISOString(),
      ok: cases.every((testCase) => testCase.ok),
      warnings: [],
    };

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      printHuman(result);
    }

    if (!result.ok) {
      process.exitCode = 1;
    }
  } finally {
    if (browser.browserStarted && !options.keepBrowser) {
      try {
        await send('Browser.close');
      } catch {
        // The process may already be gone; the smoke result should not depend on cleanup.
      }
    }
    ws.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
