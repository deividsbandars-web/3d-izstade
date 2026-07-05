#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const DEFAULTS = {
  adminEmail: 'modular-home-quote-smoke-admin@30sek24.local',
  backendUrl: 'https://api-staging.30sek24.com',
  expectedSupabaseRef: 'aasovfczmqytdtugcrmh',
  productionUrl: 'https://api.30sek24.com',
  timeoutMs: 12000,
  userEmail: 'modular-home-quote-smoke-user@30sek24.local',
};

const CONSENT_TEXT =
  'I agree that Warpala/30sek24 may store this Modular Home quote request and contact me for manual follow-up. Estimate is not a final quote.';
const CONSENT_VERSION = 'modular-home-quote-consent-v1';
const PRIVACY_VERSION = 'privacy-v1';
const QUOTE_TABLE = 'modular_home_quote_requests';

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
      continue;
    }

    const [key, ...rest] = trimmed.split('=');
    if (!key || process.env[key]) {
      continue;
    }

    process.env[key] = rest.join('=').replace(/^['"]|['"]$/g, '');
  }
}

function loadLocalEnv() {
  for (const file of ['.env.local', '.env', '.env.docker']) {
    loadEnvFile(path.resolve(process.cwd(), file));
  }
}

function parseArgs(argv) {
  const options = {
    adminEmail: process.env.MODULAR_HOME_QUOTE_SMOKE_ADMIN_EMAIL || DEFAULTS.adminEmail,
    backendUrl: process.env.MODULAR_HOME_QUOTE_SMOKE_BACKEND_URL || DEFAULTS.backendUrl,
    expectedSupabaseRef: process.env.MODULAR_HOME_QUOTE_SMOKE_EXPECTED_SUPABASE_REF || DEFAULTS.expectedSupabaseRef,
    help: false,
    json: false,
    productionUrl: process.env.MODULAR_HOME_QUOTE_SMOKE_PRODUCTION_URL || DEFAULTS.productionUrl,
    timeoutMs: Number.parseInt(process.env.MODULAR_HOME_QUOTE_SMOKE_TIMEOUT_MS || String(DEFAULTS.timeoutMs), 10),
    userEmail: process.env.MODULAR_HOME_QUOTE_SMOKE_USER_EMAIL || DEFAULTS.userEmail,
  };

  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg.startsWith('--admin-email=')) {
      options.adminEmail = arg.slice('--admin-email='.length);
    } else if (arg.startsWith('--backend-url=')) {
      options.backendUrl = arg.slice('--backend-url='.length);
    } else if (arg.startsWith('--expected-supabase-ref=')) {
      options.expectedSupabaseRef = arg.slice('--expected-supabase-ref='.length);
    } else if (arg.startsWith('--production-url=')) {
      options.productionUrl = arg.slice('--production-url='.length);
    } else if (arg.startsWith('--timeout-ms=')) {
      options.timeoutMs = Number.parseInt(arg.slice('--timeout-ms='.length), 10);
    } else if (arg.startsWith('--user-email=')) {
      options.userEmail = arg.slice('--user-email='.length);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  options.backendUrl = normalizeBaseUrl(options.backendUrl);
  options.productionUrl = normalizeBaseUrl(options.productionUrl);
  options.expectedSupabaseRef = safeProjectRef(options.expectedSupabaseRef);
  options.adminEmail = safeEmail(options.adminEmail, 'admin smoke email');
  options.userEmail = safeEmail(options.userEmail, 'user smoke email');
  options.timeoutMs = Number.isFinite(options.timeoutMs) && options.timeoutMs > 0
    ? Math.min(Math.max(options.timeoutMs, 1000), 60000)
    : DEFAULTS.timeoutMs;

  return options;
}

function helpText() {
  return `
Modular Home quote staging E2E smoke check

Usage:
  npm exec -- node scripts/check-modular-home-quote-staging.mjs -- --json

Required env from shell, Doppler or local .env:
  SUPABASE_URL
  SUPABASE_SERVICE_KEY
  VITE_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY
  MODULAR_HOME_QUOTE_SMOKE_EXPECTED_SUPABASE_REF (defaults to ${DEFAULTS.expectedSupabaseRef})

Checks:
  - staging quote backend requires ?homeQuoteBackend=1
  - valid staging quote submission succeeds with consent
  - public admin routes reject unauthenticated users
  - non-admin user cannot list quotes
  - admin can list/detail/update/export
  - production quote endpoint does not accept a default backend submission
  - temporary smoke quote row is deleted at the end

The script does not print service keys, anon keys, passwords, or JWTs.
`.trim();
}

function normalizeBaseUrl(value) {
  return String(value || '').trim().replace(/\/+$/, '');
}

function getSupabaseProjectRef(value) {
  const normalized = normalizeBaseUrl(value);
  try {
    const hostname = new URL(normalized).hostname.toLowerCase();
    const match = hostname.match(/^([a-z0-9]+)\.supabase\.co$/i);
    return match?.[1] ?? '';
  } catch {
    return '';
  }
}

function safeProjectRef(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (!/^[a-z0-9]+$/.test(normalized)) {
    throw new Error(`Invalid MODULAR_HOME_QUOTE_SMOKE_EXPECTED_SUPABASE_REF: ${value}`);
  }
  return normalized;
}

function assertExpectedSupabaseProject({ expectedSupabaseRef, supabaseUrl }) {
  const actualRef = getSupabaseProjectRef(supabaseUrl);
  if (!actualRef) {
    throw new Error('SUPABASE_URL must be a Supabase project URL for the staging quote smoke check.');
  }
  if (actualRef !== expectedSupabaseRef) {
    throw new Error(
      `Staging quote smoke Supabase project mismatch: expected ${expectedSupabaseRef}, got ${actualRef}. `
      + 'Run with staging env, for example via scripts/run-with-doppler.ps1, and do not use production/local Supabase env for this staging gate.',
    );
  }
}

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required.`);
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

function safeEmail(value, label) {
  const email = String(value || '').trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new Error(`Invalid ${label}: ${value}`);
  }
  return email;
}

function makePassword() {
  return `ModularQuote-${crypto.randomBytes(18).toString('base64url')}!9a`;
}

function makeRunId() {
  return `round126-${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}`;
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

async function readResponse(response) {
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  return {
    contentType: response.headers.get('content-type') || '',
    json,
    text,
  };
}

async function apiRequest({ backendUrl, path: requestPath, token, timeoutMs, ...init }) {
  const response = await fetchWithTimeout(`${backendUrl}${requestPath}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Origin: 'https://staging.30sek24.com',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  }, timeoutMs);
  const body = await readResponse(response);

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
    user_metadata: { purpose: 'modular home quote staging smoke test' },
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

async function signInSmokeUser({ supabase, email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session?.access_token) {
    throw new Error(`Supabase sign-in failed for ${email}: ${error?.message || 'missing access token'}`);
  }
  return data.session.access_token;
}

function buildQuotePayload(runId) {
  const email = `modular-home-${runId}@example.invalid`;
  return {
    attribution: {
      companySlug: 'warpala',
      salesOwner: 'modular-home-sales',
      sourceSurface: 'homeDemo',
      sponsorSlug: null,
    },
    config: {
      bed: 'enabled',
      doorPlacement: 'terraceFacing',
      facade: 'darkThermoWood',
      facadeBoardOrientation: 'vertical',
      facadeBoardWidth: 'narrow',
      finishLevel: 'premium',
      floorFinish: 'oakLaminate',
      furniturePackage: 'premiumFurniture',
      interiorWallFinish: 'warmPanel',
      kitchenLine: 'enabled',
      layoutVariant: 'oneBedroom',
      roof: 'pitched',
      roofEdgeColor: 'graphite',
      sofa: 'enabled',
      table: 'enabled',
      terrace: 'extendedTerrace',
      wardrobePlaceholder: 'enabled',
      windowFrameColor: 'graphite',
      windowPlacement: 'frontPanoramic',
    },
    consent: {
      accepted: true,
      acceptedAt: new Date().toISOString(),
      consentText: CONSENT_TEXT,
      consentVersion: CONSENT_VERSION,
      privacyVersion: PRIVACY_VERSION,
    },
    estimate: {
      currency: 'EUR',
      estimatedTotal: 152870,
      lineItems: [
        { amount: 82000, label: 'Base product module package' },
        { amount: 24000, label: 'Premium finish package' },
        { amount: 8000, label: 'Extended terrace placeholder' },
        { amount: 38870, label: 'VAT / margin / contingency preview' },
      ],
      scopeSummary: [
        'Included: timber module shell',
        'Included: selected facade and roof package',
        'Requires review: panoramic glazing and extended terrace',
      ],
    },
    project: {
      floorAreaM2: 40,
      modelName: 'Compact Timber 40',
      productId: 'compact-timber-40',
      projectId: runId,
      shareUrl: `https://staging.30sek24.com/expo-3d?homeDemo=1&homeQuoteBackend=1&smoke=${runId}`,
    },
    requester: {
      budgetRange: '100k-150k',
      countryCity: 'Latvia / Riga',
      email,
      landOwned: 'yes',
      message: `Round 126 staging quote smoke test. Run: ${runId}`,
      name: 'Round 126 Quote Smoke',
      phone: '+371 20000000',
      targetBuildDate: '6-12-months',
    },
    source: {
      path: `/expo-3d?homeDemo=1&homeQuoteBackend=1&smoke=${runId}`,
      referrer: null,
      userAgent: `round126-smoke/${runId}`,
      vertical: 'modular-home',
    },
  };
}

function addCheck(checks, name, ok, details = {}) {
  checks.push({
    details,
    name,
    ok: Boolean(ok),
  });
}

async function cleanupSmokeQuote({ adminClient, cleanup, quoteId }) {
  if (!quoteId) {
    return;
  }

  const { error } = await adminClient
    .from(QUOTE_TABLE)
    .delete()
    .eq('id', quoteId);

  cleanup.push({
    deleted: !error,
    quoteId,
    table: QUOTE_TABLE,
  });
}

async function run(options) {
  loadLocalEnv();

  const supabaseUrl = requiredEnv('SUPABASE_URL');
  const supabaseServiceKey = requiredEnv('SUPABASE_SERVICE_KEY');
  assertExpectedSupabaseProject({
    expectedSupabaseRef: options.expectedSupabaseRef,
    supabaseUrl,
  });
  // Browser/admin-review auth uses the frontend anon key. Prefer it when both
  // frontend and docker env files are present locally.
  const supabaseAnonKey = optionalEnv('VITE_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY');
  if (!supabaseAnonKey) {
    throw new Error('VITE_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY is required.');
  }

  const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const publicClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const adminPassword = makePassword();
  const userPassword = makePassword();
  await ensureSmokeUser({
    authAdmin: adminClient.auth.admin,
    email: options.adminEmail,
    password: adminPassword,
    role: 'admin',
  });
  await ensureSmokeUser({
    authAdmin: adminClient.auth.admin,
    email: options.userEmail,
    password: userPassword,
    role: 'user',
  });

  const adminToken = await signInSmokeUser({ email: options.adminEmail, password: adminPassword, supabase: authClient });
  const userToken = await signInSmokeUser({ email: options.userEmail, password: userPassword, supabase: authClient });
  const checks = [];
  const cleanup = [];
  const runId = makeRunId();
  const quotePayload = buildQuotePayload(runId);
  let quoteId = '';

  try {
    const health = await apiRequest({
      backendUrl: options.backendUrl,
      path: '/health',
      timeoutMs: options.timeoutMs,
    });
    addCheck(checks, 'staging backend health reachable', health.status === 200 && health.body.json?.status === 'ok', {
      status: health.status,
    });

    const noFlag = await apiRequest({
      backendUrl: options.backendUrl,
      body: JSON.stringify({}),
      method: 'POST',
      path: '/api/modular-home/quote',
      timeoutMs: options.timeoutMs,
    });
    addCheck(checks, 'quote backend requires explicit homeQuoteBackend flag', noFlag.status === 403 && noFlag.body.json?.error === 'MODULAR_HOME_QUOTE_BACKEND_FLAG_REQUIRED', {
      error: noFlag.body.json?.error || null,
      status: noFlag.status,
    });

    const quoteSubmit = await apiRequest({
      backendUrl: options.backendUrl,
      body: JSON.stringify(quotePayload),
      method: 'POST',
      path: '/api/modular-home/quote?homeQuoteBackend=1',
      timeoutMs: options.timeoutMs,
    });
    quoteId = String(quoteSubmit.body.json?.id || '');
    addCheck(checks, 'valid staging quote submission succeeds with consent', quoteSubmit.status === 201 && quoteSubmit.body.json?.success === true && Boolean(quoteId), {
      hasQuoteId: Boolean(quoteId),
      status: quoteSubmit.status,
    });

    const unauthList = await apiRequest({
      backendUrl: options.backendUrl,
      path: '/api/modular-home/quotes',
      timeoutMs: options.timeoutMs,
    });
    addCheck(checks, 'public cannot list quote requests', unauthList.status === 401, {
      status: unauthList.status,
    });

    const unauthExport = await apiRequest({
      backendUrl: options.backendUrl,
      path: '/api/modular-home/quotes/export?format=csv',
      timeoutMs: options.timeoutMs,
    });
    addCheck(checks, 'public cannot export quote requests', unauthExport.status === 401, {
      status: unauthExport.status,
    });

    const unauthStatus = await apiRequest({
      backendUrl: options.backendUrl,
      body: JSON.stringify({ status: 'won' }),
      method: 'PATCH',
      path: `/api/modular-home/quotes/${encodeURIComponent(quoteId || 'quote_123456')}/status`,
      timeoutMs: options.timeoutMs,
    });
    addCheck(checks, 'public cannot update quote status', unauthStatus.status === 401, {
      status: unauthStatus.status,
    });

    const userList = await apiRequest({
      backendUrl: options.backendUrl,
      path: '/api/modular-home/quotes?limit=20',
      timeoutMs: options.timeoutMs,
      token: userToken,
    });
    addCheck(checks, 'non-admin user cannot list quote requests', userList.status === 403, {
      status: userList.status,
    });

    const adminList = await apiRequest({
      backendUrl: options.backendUrl,
      path: '/api/modular-home/quotes?limit=100',
      timeoutMs: options.timeoutMs,
      token: adminToken,
    });
    const adminRows = Array.isArray(adminList.body.json?.rows) ? adminList.body.json.rows : [];
    addCheck(checks, 'admin can list quote requests', adminList.status === 200 && Array.isArray(adminList.body.json?.rows), {
      rowCount: adminRows.length,
      status: adminList.status,
    });
    addCheck(checks, 'submitted quote appears in admin list', adminRows.some((row) => String(row.id) === quoteId), {
      quoteIdFound: adminRows.some((row) => String(row.id) === quoteId),
    });

    const detail = await apiRequest({
      backendUrl: options.backendUrl,
      path: `/api/modular-home/quotes/${encodeURIComponent(quoteId)}`,
      timeoutMs: options.timeoutMs,
      token: adminToken,
    });
    addCheck(checks, 'admin can view quote detail', detail.status === 200 && String(detail.body.json?.quote?.id || '') === quoteId, {
      status: detail.status,
    });

    const update = await apiRequest({
      backendUrl: options.backendUrl,
      body: JSON.stringify({
        internalNote: `Round 126 smoke status update ${runId}`,
        status: 'contacted',
      }),
      method: 'PATCH',
      path: `/api/modular-home/quotes/${encodeURIComponent(quoteId)}/status`,
      timeoutMs: options.timeoutMs,
      token: adminToken,
    });
    addCheck(checks, 'admin can update quote status', update.status === 200 && update.body.json?.quote?.status === 'contacted', {
      status: update.status,
      updatedStatus: update.body.json?.quote?.status || null,
    });

    const exportJson = await apiRequest({
      backendUrl: options.backendUrl,
      path: '/api/modular-home/quotes/export?format=json&limit=100',
      timeoutMs: options.timeoutMs,
      token: adminToken,
    });
    const exportRows = Array.isArray(exportJson.body.json?.rows) ? exportJson.body.json.rows : [];
    addCheck(checks, 'admin can export JSON', exportJson.status === 200 && exportRows.some((row) => String(row.id) === quoteId), {
      rowCount: exportRows.length,
      status: exportJson.status,
    });

    const exportCsv = await apiRequest({
      backendUrl: options.backendUrl,
      headers: { Accept: 'text/csv, application/json;q=0.9' },
      path: '/api/modular-home/quotes/export?format=csv&limit=100',
      timeoutMs: options.timeoutMs,
      token: adminToken,
    });
    addCheck(checks, 'admin can export CSV', exportCsv.status === 200 && exportCsv.body.text.includes(quoteId), {
      contentType: exportCsv.body.contentType,
      status: exportCsv.status,
    });

    const publicTableRead = await publicClient
      .from(QUOTE_TABLE)
      .select('id')
      .eq('id', quoteId)
      .limit(1);
    addCheck(checks, 'public Supabase client cannot read quote table directly', Boolean(publicTableRead.error) || (publicTableRead.data ?? []).length === 0, {
      errorCode: publicTableRead.error?.code || null,
      rowCount: Array.isArray(publicTableRead.data) ? publicTableRead.data.length : null,
    });

    if (options.productionUrl) {
      const productionProbe = await apiRequest({
        backendUrl: options.productionUrl,
        body: JSON.stringify({}),
        method: 'POST',
        path: '/api/modular-home/quote?homeQuoteBackend=1',
        timeoutMs: options.timeoutMs,
      });
      addCheck(checks, 'production default does not accept quote backend submission', productionProbe.status !== 201 && productionProbe.body.json?.success !== true, {
        error: productionProbe.body.json?.error || null,
        status: productionProbe.status,
      });
    }
  } finally {
    await cleanupSmokeQuote({ adminClient, cleanup, quoteId });
  }

  const ok = checks.every((check) => check.ok);
  return {
    checks,
    cleanup,
    ok,
    quoteId,
    runId,
    stagingUrl: options.backendUrl,
  };
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
    for (const check of result.checks) {
      console.log(`${check.ok ? 'PASS' : 'FAIL'} ${check.name}`);
    }
    console.log(`cleanup: ${JSON.stringify(result.cleanup)}`);
    console.log(`overall: ${result.ok ? 'PASS' : 'FAIL'}`);
  }

  if (!result.ok) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
