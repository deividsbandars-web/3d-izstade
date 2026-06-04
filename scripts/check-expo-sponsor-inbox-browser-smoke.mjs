#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import childProcess from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const DEFAULTS = {
  adminEmail: 'expo-commercial-smoke-admin@30sek24.local',
  backendUrl: 'https://api-staging.30sek24.com',
  baseUrl: 'https://staging.30sek24.com',
  browserJsonUrl: 'http://127.0.0.1:9232/json',
  chromePort: 9232,
  profileDir: 'review_artifacts/tmp/sponsor-inbox-browser-smoke-chrome-profile',
  sponsorSlug: 'sponsor-concierge',
  timeoutMs: 45000,
};

function parseArgs(argv) {
  const options = {
    ...DEFAULTS,
    adminEmail: process.env.EXPO_COMMERCIAL_SMOKE_ADMIN_EMAIL || DEFAULTS.adminEmail,
    backendUrl: process.env.EXPO_COMMERCIAL_SMOKE_BACKEND_URL || DEFAULTS.backendUrl,
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
    } else if (arg.startsWith('--admin-email=')) {
      options.adminEmail = arg.slice('--admin-email='.length);
    } else if (arg.startsWith('--backend-url=')) {
      options.backendUrl = arg.slice('--backend-url='.length);
    } else if (arg.startsWith('--base-url=')) {
      options.baseUrl = arg.slice('--base-url='.length);
    } else if (arg.startsWith('--browser=')) {
      options.browserJsonUrl = arg.slice('--browser='.length);
      const portMatch = options.browserJsonUrl.match(/:(\d+)\/json\b/);
      if (portMatch) {
        options.chromePort = Number(portMatch[1]);
      }
    } else if (arg.startsWith('--profile-dir=')) {
      options.profileDir = arg.slice('--profile-dir='.length);
    } else if (arg.startsWith('--sponsor=')) {
      options.sponsorSlug = arg.slice('--sponsor='.length);
    } else if (arg.startsWith('--timeout-ms=')) {
      options.timeoutMs = Number.parseInt(arg.slice('--timeout-ms='.length), 10) || DEFAULTS.timeoutMs;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  options.backendUrl = normalizeBaseUrl(options.backendUrl);
  options.baseUrl = normalizeBaseUrl(options.baseUrl);
  options.sponsorSlug = normalizeSponsorSlug(options.sponsorSlug);
  return options;
}

function helpText() {
  return `
Authenticated Sponsor Lead Inbox browser smoke check

Usage:
  doppler run -- npm run check:expo-sponsor-inbox-browser-smoke -- --json

Required env:
  SUPABASE_URL
  SUPABASE_SERVICE_KEY
  SUPABASE_ANON_KEY or VITE_SUPABASE_ANON_KEY

Options:
  --base-url=https://staging.30sek24.com
  --backend-url=https://api-staging.30sek24.com
  --sponsor=sponsor-concierge
  --admin-email=expo-commercial-smoke-admin@30sek24.local
  --browser=http://127.0.0.1:9232/json
  --profile-dir=review_artifacts/tmp/sponsor-inbox-browser-smoke-chrome-profile
  --timeout-ms=45000
  --visible
  --keep-browser
  --json

This check creates one temporary sponsor lead through the staging API, opens a
real authenticated browser session, verifies the protected Sponsor Lead Inbox UI
and commercial next-action panel, then deletes the temporary lead rows.
It does not print passwords, JWTs, service keys, anon keys, or lead payload secrets.
`.trim();
}

function normalizeBaseUrl(url) {
  return String(url || '').trim().replace(/\/+$/, '');
}

function normalizeSponsorSlug(value) {
  const sponsor = String(value || '').trim().toLowerCase();
  if (!/^[a-z0-9-]{2,80}$/.test(sponsor)) {
    throw new Error(`Invalid sponsor slug: ${value}`);
  }

  return sponsor;
}

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required. Run through Doppler or provide the variable explicitly.`);
  }

  return value;
}

function optionalEnv(...names) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) {
      return value;
    }
  }

  return '';
}

function makePassword() {
  return `InboxBrowser-${crypto.randomBytes(18).toString('base64url')}!9a`;
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

async function fetchWithTimeout(url, init, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function readJsonResponse(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return { raw: text.slice(0, 300) };
  }
}

async function apiRequest({ backendUrl, path: apiPath, token, timeoutMs, ...init }) {
  const response = await fetchWithTimeout(`${backendUrl}${apiPath}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  }, timeoutMs);
  const body = await readJsonResponse(response);

  return {
    body,
    status: response.status,
  };
}

async function ensureSmokeUser({ authAdmin, email, password, role }) {
  const { data: listData, error: listError } = await authAdmin.listUsers({ page: 1, perPage: 1000 });
  if (listError) {
    throw new Error(`Supabase listUsers failed for ${email}: ${listError.message}`);
  }

  const existing = listData.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
  const attrs = {
    app_metadata: { role },
    email,
    email_confirm: true,
    password,
    user_metadata: { purpose: 'expo sponsor lead inbox browser smoke test' },
  };

  if (existing) {
    const { data, error } = await authAdmin.updateUserById(existing.id, attrs);
    if (error) {
      throw new Error(`Supabase updateUserById failed for ${email}: ${error.message}`);
    }
    return data.user;
  }

  const { data, error } = await authAdmin.createUser(attrs);
  if (error) {
    throw new Error(`Supabase createUser failed for ${email}: ${error.message}`);
  }
  return data.user;
}

async function signInSmokeUser({ email, password, supabase }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session?.access_token) {
    throw new Error(`Supabase sign-in failed for ${email}: ${error?.message || 'missing access token'}`);
  }

  return data.session;
}

function buildSmokeLeadPayload({ email, sponsorSlug }) {
  const sourcePath = `/expo/sponsor-leads?browserSmoke=${Date.now().toString(36)}`;
  return {
    payload: {
      clientEmail: email,
      clientName: 'Inbox Browser Smoke Sponsor',
      companyId: sponsorSlug,
      companySlug: sponsorSlug,
      message: [
        'Sponsor package interest: Premium Booth',
        'Sponsor company: Inbox Browser Smoke Ltd',
        'Budget signal: 10k-25k EUR',
        'Timeline: This month',
        'Phone: +371 2000 0000',
        'Website: https://example.invalid',
        '',
        `Browser UI smoke ${sourcePath}`,
      ].join('\n'),
      sourcePath,
    },
    sourcePath,
  };
}

async function findSmokeLead({ adminClient, email, sourcePath }) {
  const { data, error } = await adminClient
    .from('service_requests')
    .select('*')
    .eq('client_email', email)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    throw new Error(`Could not query smoke lead: ${error.message}`);
  }

  return (data ?? []).find((entry) => String(entry.message || '').includes(sourcePath)) ?? data?.[0] ?? null;
}

async function cleanupSmokeLead({ adminClient, cleanup, leadId }) {
  if (!leadId) {
    return;
  }

  const opsDelete = await adminClient
    .from('expo_lead_ops')
    .delete()
    .eq('service_request_id', leadId);
  const leadDelete = await adminClient
    .from('service_requests')
    .delete()
    .eq('id', leadId);

  cleanup.push({
    deleted: !opsDelete.error && !leadDelete.error,
    leadId,
    leadError: leadDelete.error?.message || null,
    opsError: opsDelete.error?.message || null,
  });
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

  const profileDir = path.resolve(options.profileDir);
  const defaultProfileDir = path.resolve(DEFAULTS.profileDir);
  if (!options.keepBrowser && profileDir === defaultProfileDir && fs.existsSync(profileDir)) {
    fs.rmSync(profileDir, { force: true, recursive: true });
  }
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

      resolve({ events, send, ws });
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

  return {
    browserErrors,
    runtimeExceptions,
  };
}

function getSupabaseStorageKey(supabaseUrl) {
  const host = new URL(supabaseUrl).hostname;
  const projectRef = host.split('.')[0];
  return `sb-${projectRef}-auth-token`;
}

async function installBrowserSession({ baseUrl, send, session, storageKey, timeoutMs }) {
  await navigate(send, `${baseUrl}/`, timeoutMs);
  await evaluate(send, `
(() => {
  localStorage.setItem(${JSON.stringify(storageKey)}, ${JSON.stringify(JSON.stringify(session))});
  return localStorage.getItem(${JSON.stringify(storageKey)}) !== null;
})()
`);
}

async function inspectInboxPage(send, smokeEmail) {
  return await evaluate(send, `
(() => {
  const leadCard = document.querySelector('[data-sponsor-lead-email="${smokeEmail}"]')
    || [...document.querySelectorAll('article')].find((node) => node.textContent?.includes(${JSON.stringify(smokeEmail)}))
    || null;
  const nextAction = leadCard?.querySelector('[data-sponsor-lead-next-action="true"]');
  const packageBadge = leadCard?.querySelector('[data-sponsor-lead-package-badge="true"]');
  const replyToolkit = leadCard?.querySelector('[data-sponsor-lead-reply-toolkit="true"]');
  const workflow = leadCard?.querySelector('[data-sponsor-lead-workflow="true"]');
  const workflowSteps = [...(leadCard?.querySelectorAll('[data-sponsor-lead-workflow-step]') || [])].map((node) => ({
    label: node.getAttribute('data-sponsor-lead-workflow-step'),
    state: node.getAttribute('data-sponsor-lead-workflow-state'),
    text: node.textContent?.trim() || '',
  }));
  const leadCardText = leadCard?.textContent?.trim() || '';
  return {
    accessDeniedVisible: document.body.innerText.includes('Access denied'),
    bodyTextPreview: document.body.innerText.slice(0, 900),
    cardCount: document.querySelectorAll('[data-sponsor-lead-card="true"]').length,
    leadCardVisible: Boolean(leadCard),
    leadCardTextPreview: leadCardText.slice(0, 900),
    leadEmailVisible: document.body.innerText.includes(${JSON.stringify(smokeEmail)}),
    loadingVisible: document.body.innerText.includes('Loading sponsor leads'),
    nextActionText: nextAction?.textContent?.trim() || (leadCardText.includes('Commercial next step') ? leadCardText : ''),
    packageBadgeText: packageBadge?.textContent?.trim() || (leadCardText.includes('Premium Booth') ? 'Premium Booth' : ''),
    packageRequestVisible: leadCardText.includes('Sponsor package request'),
    replyToolkitText: replyToolkit?.textContent?.trim() || '',
    replyToolkitVisible: Boolean(replyToolkit) || leadCardText.includes('Reply toolkit'),
    signInRequiredVisible: document.body.innerText.includes('Sign in required'),
    titleText: document.body.innerText.includes('Sponsor Lead Inbox'),
    workflowStepCount: workflowSteps.length,
    workflowSteps,
    workflowVisible: Boolean(workflow) || leadCardText.includes('Qualify') && leadCardText.includes('Follow-up'),
  };
})()
`);
}

function addCheck(checks, name, ok, details = null) {
  checks.push({ details, name, ok: Boolean(ok) });
}

async function run(options) {
  const supabaseUrl = requiredEnv('SUPABASE_URL');
  const supabaseServiceKey = requiredEnv('SUPABASE_SERVICE_KEY');
  const supabaseAnonKey = optionalEnv('SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY');
  if (!supabaseAnonKey) {
    throw new Error('SUPABASE_ANON_KEY or VITE_SUPABASE_ANON_KEY is required.');
  }

  if (typeof WebSocket === 'undefined') {
    throw new Error(`This script requires a Node runtime with global WebSocket support. Current: ${process.version} on ${os.platform()}`);
  }

  const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const adminPassword = makePassword();
  await ensureSmokeUser({
    authAdmin: adminClient.auth.admin,
    email: options.adminEmail,
    password: adminPassword,
    role: 'admin',
  });
  const session = await signInSmokeUser({
    email: options.adminEmail,
    password: adminPassword,
    supabase: authClient,
  });

  const smokeLead = buildSmokeLeadPayload({
    email: `expo-inbox-browser-smoke-${Date.now().toString(36)}@example.invalid`,
    sponsorSlug: options.sponsorSlug,
  });

  const cleanup = [];
  const checks = [];
  let smokeLeadId = '';
  let browser = null;
  let cdpSend = null;
  let ws = null;

  try {
    const leadCreate = await apiRequest({
      backendUrl: options.backendUrl,
      body: JSON.stringify(smokeLead.payload),
      method: 'POST',
      path: '/api/expo/lead',
      timeoutMs: Math.min(options.timeoutMs, 15000),
    });
    addCheck(checks, 'temporary sponsor lead created', leadCreate.status === 201 && leadCreate.body?.success === true, {
      status: leadCreate.status,
    });

    const leadRecord = await findSmokeLead({
      adminClient,
      email: smokeLead.payload.clientEmail,
      sourcePath: smokeLead.sourcePath,
    });
    smokeLeadId = String(leadRecord?.id || '');
    addCheck(checks, 'temporary sponsor lead persisted', Boolean(smokeLeadId));

    browser = await startChromeIfNeeded(options);
    const wsUrl = await resolvePageWebSocketUrl(options.browserJsonUrl);
    const cdp = await connectCdp(wsUrl);
    ws = cdp.ws;
    const { events, send } = cdp;
    cdpSend = send;

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

    const eventStart = events.length;
    await installBrowserSession({
      baseUrl: options.baseUrl,
      send,
      session,
      storageKey: getSupabaseStorageKey(supabaseUrl),
      timeoutMs: options.timeoutMs,
    });

    const inboxUrl = `${options.baseUrl}/expo/sponsor-leads?sponsor=${encodeURIComponent(options.sponsorSlug)}`;
    await navigate(send, inboxUrl, options.timeoutMs);
    await waitFor(
      send,
      `document.body.innerText.includes(${JSON.stringify(smokeLead.payload.clientEmail)})`,
      'authenticated sponsor lead card',
      options.timeoutMs,
    );

    const page = await inspectInboxPage(send, smokeLead.payload.clientEmail);
    const eventSummary = collectEventSummary(events, eventStart);
    addCheck(checks, 'sponsor lead inbox title visible', page.titleText, page.bodyTextPreview);
    addCheck(checks, 'sign-in gate not visible after browser auth', !page.signInRequiredVisible, page.bodyTextPreview);
    addCheck(checks, 'access denied not visible for admin smoke user', !page.accessDeniedVisible, page.bodyTextPreview);
    addCheck(checks, 'temporary lead card visible in UI', page.leadCardVisible, page);
    addCheck(checks, 'commercial next-action panel visible', page.nextActionText.includes('Commercial next step'), page.nextActionText);
    addCheck(checks, 'deal workflow visible', page.workflowVisible && page.workflowStepCount >= 4, page.workflowSteps);
    addCheck(checks, 'reply toolkit visible', page.replyToolkitVisible && page.replyToolkitText.includes('Reply toolkit'), page.replyToolkitText);
    addCheck(checks, 'package badge visible on lead card', page.packageBadgeText.includes('Premium Booth'), page.packageBadgeText);
    addCheck(checks, 'package request detail visible', page.packageRequestVisible, page.bodyTextPreview);
    addCheck(checks, 'no runtime exceptions', eventSummary.runtimeExceptions.length === 0, eventSummary.runtimeExceptions);
    addCheck(checks, 'no browser error log entries', eventSummary.browserErrors.length === 0, eventSummary.browserErrors);

    return {
      baseUrl: options.baseUrl,
      checks,
      cleanup,
      generatedAt: new Date().toISOString(),
      ok: checks.every((check) => check.ok),
      page,
      sponsorSlug: options.sponsorSlug,
    };
  } finally {
    await cleanupSmokeLead({ adminClient, cleanup, leadId: smokeLeadId });
    if (browser?.browserStarted && !options.keepBrowser) {
      try {
        if (cdpSend) {
          await cdpSend('Browser.close');
        } else {
          const targets = await fetchJson(options.browserJsonUrl, 1500);
          const target = targets.find((item) => item.webSocketDebuggerUrl);
          if (target?.webSocketDebuggerUrl) {
            const cdp = await connectCdp(target.webSocketDebuggerUrl);
            await cdp.send('Browser.close');
            cdp.ws.close();
          }
        }
      } catch {
        // Cleanup must not hide the smoke result.
      }
    }
    if (ws) {
      try {
        ws.close();
      } catch {
        // Ignore browser cleanup errors.
      }
    }
  }
}

function printHuman(result) {
  console.log(`Sponsor Lead Inbox browser smoke: ${result.ok ? 'PASS' : 'FAIL'}`);
  console.log(`Base URL: ${result.baseUrl}`);
  console.log(`Sponsor: ${result.sponsorSlug}`);
  console.log(`Generated: ${result.generatedAt}`);

  for (const check of result.checks) {
    console.log(`- ${check.ok ? 'PASS' : 'FAIL'}: ${check.name}`);
    if (!check.ok && check.details !== null) {
      console.log(`  details: ${JSON.stringify(check.details)}`);
    }
  }

  for (const cleanup of result.cleanup) {
    console.log(`[CLEANUP] lead=${cleanup.leadId} deleted=${cleanup.deleted}`);
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(helpText());
    return;
  }

  const result = await run(options);
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    printHuman(result);
  }

  if (!result.ok || !result.cleanup.every((entry) => entry.deleted)) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
