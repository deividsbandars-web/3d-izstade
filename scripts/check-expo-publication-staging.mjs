#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';

const DEFAULTS = {
  adminEmail: 'expo-smoke-admin@30sek24.local',
  backendUrl: 'https://api-staging.30sek24.com',
  timeoutMs: 10000,
  userEmail: 'expo-smoke-user@30sek24.local',
};

function parseArgs(argv) {
  const options = {
    adminEmail: process.env.EXPO_PUBLICATION_SMOKE_ADMIN_EMAIL || DEFAULTS.adminEmail,
    allowNonStaging: false,
    backendUrl: process.env.EXPO_PUBLICATION_SMOKE_BACKEND_URL || DEFAULTS.backendUrl,
    help: false,
    json: false,
    timeoutMs: Number.parseInt(process.env.EXPO_PUBLICATION_SMOKE_TIMEOUT_MS || String(DEFAULTS.timeoutMs), 10),
    userEmail: process.env.EXPO_PUBLICATION_SMOKE_USER_EMAIL || DEFAULTS.userEmail,
  };

  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg === '--allow-non-staging') {
      options.allowNonStaging = true;
    } else if (arg.startsWith('--admin-email=')) {
      options.adminEmail = arg.slice('--admin-email='.length);
    } else if (arg.startsWith('--backend-url=')) {
      options.backendUrl = arg.slice('--backend-url='.length);
    } else if (arg.startsWith('--timeout-ms=')) {
      options.timeoutMs = Number.parseInt(arg.slice('--timeout-ms='.length), 10);
    } else if (arg.startsWith('--user-email=')) {
      options.userEmail = arg.slice('--user-email='.length);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  options.backendUrl = normalizeBaseUrl(options.backendUrl);
  options.timeoutMs = Number.isFinite(options.timeoutMs) && options.timeoutMs > 0
    ? Math.min(Math.max(options.timeoutMs, 1000), 60000)
    : DEFAULTS.timeoutMs;

  return options;
}

function printHelp() {
  console.log(`Expo publication staging smoke check

Usage:
  doppler run -- npm run check:expo-publication-staging
  doppler run -- npm run check:expo-publication-staging -- --json

Required env from Doppler or shell:
  SUPABASE_URL
  SUPABASE_SERVICE_KEY
  SUPABASE_ANON_KEY or VITE_SUPABASE_ANON_KEY

Options:
  --backend-url=https://api-staging.30sek24.com
  --admin-email=expo-smoke-admin@30sek24.local
  --user-email=expo-smoke-user@30sek24.local
  --timeout-ms=10000
  --json
  --allow-non-staging   Required for any API host other than api-staging.30sek24.com

This check creates or updates two Supabase Auth smoke users, creates one temporary
admin-owned booth, verifies publication status gates, and archives the temporary
booth before exiting. It does not print passwords, JWTs, service keys, or anon keys.`);
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
    if (value) return value;
  }

  return '';
}

function normalizeBaseUrl(url) {
  return String(url || '').trim().replace(/\/+$/, '');
}

function assertSafeBackendUrl(options) {
  let parsed;
  try {
    parsed = new URL(options.backendUrl);
  } catch {
    throw new Error(`Invalid --backend-url: ${options.backendUrl}`);
  }

  if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1') {
    throw new Error(`Unsafe backend protocol for smoke test: ${parsed.protocol}`);
  }

  if (!options.allowNonStaging && parsed.hostname !== 'api-staging.30sek24.com') {
    throw new Error(
      `Refusing to run publication smoke test against ${parsed.hostname}. `
      + 'Use --backend-url=https://api-staging.30sek24.com or pass --allow-non-staging intentionally.',
    );
  }
}

function makePassword() {
  return `Smoke-${crypto.randomBytes(18).toString('base64url')}!9a`;
}

function safeEmail(value, label) {
  const email = String(value || '').trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new Error(`Invalid ${label}: ${value}`);
  }

  return email;
}

function decodeJwtPayload(token) {
  try {
    return JSON.parse(Buffer.from(String(token).split('.')[1] || '', 'base64url').toString('utf8'));
  } catch {
    return {};
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

async function apiRequest({ backendUrl, path, token, timeoutMs, ...init }) {
  const response = await fetchWithTimeout(`${backendUrl}${path}`, {
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
    user_metadata: { purpose: 'expo staging publication smoke test' },
  };

  if (existing) {
    const { data, error } = await authAdmin.updateUserById(existing.id, attrs);
    if (error) throw new Error(`Supabase updateUserById failed for ${email}: ${error.message}`);
    return data.user;
  }

  const { data, error } = await authAdmin.createUser(attrs);
  if (error) throw new Error(`Supabase createUser failed for ${email}: ${error.message}`);
  return data.user;
}

async function signInSmokeUser({ supabase, email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session?.access_token) {
    throw new Error(`Supabase sign-in failed for ${email}: ${error?.message || 'missing access token'}`);
  }

  return data.session.access_token;
}

async function archiveBooth({ adminClient, boothId, cleanup }) {
  if (!boothId) return;

  const { error } = await adminClient
    .from('expo_booth')
    .update({ status: 'archived' })
    .eq('id', boothId);

  cleanup.push({
    archived: !error,
    boothId,
    error: error?.message || null,
  });
}

function addCheck(checks, name, ok, details = {}) {
  checks.push({ name, ok, ...details });
}

function printTextSummary(result) {
  console.log(`Expo publication staging smoke: ${result.ok ? 'PASS' : 'FAIL'}`);
  console.log(`Backend: ${result.backendUrl}`);
  for (const check of result.checks) {
    const status = check.ok ? 'PASS' : 'FAIL';
    const details = Object.entries(check)
      .filter(([key]) => key !== 'name' && key !== 'ok')
      .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
      .join(', ');
    console.log(`[${status}] ${check.name}${details ? `: ${details}` : ''}`);
  }
  for (const cleanup of result.cleanup) {
    console.log(`[CLEANUP] booth=${cleanup.boothId} archived=${cleanup.archived}${cleanup.error ? ` error=${cleanup.error}` : ''}`);
  }
}

async function run(options) {
  assertSafeBackendUrl(options);

  const supabaseUrl = requiredEnv('SUPABASE_URL');
  const supabaseServiceKey = requiredEnv('SUPABASE_SERVICE_KEY');
  const supabaseAnonKey = optionalEnv('SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY');
  if (!supabaseAnonKey) {
    throw new Error('SUPABASE_ANON_KEY or VITE_SUPABASE_ANON_KEY is required.');
  }

  const adminEmail = safeEmail(options.adminEmail, 'admin smoke email');
  const userEmail = safeEmail(options.userEmail, 'user smoke email');
  const password = makePassword();
  const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const publicClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const checks = [];
  const cleanup = [];

  await ensureSmokeUser({ authAdmin: adminClient.auth.admin, email: adminEmail, password, role: 'admin' });
  await ensureSmokeUser({ authAdmin: adminClient.auth.admin, email: userEmail, password, role: 'user' });

  const adminToken = await signInSmokeUser({ supabase: publicClient, email: adminEmail, password });
  const userToken = await signInSmokeUser({ supabase: publicClient, email: userEmail, password });
  const userPayload = decodeJwtPayload(userToken);

  addCheck(checks, 'smoke user JWT role is user', userPayload.app_metadata?.role === 'user', {
    jwtAppRole: userPayload.app_metadata?.role || null,
  });

  const health = await apiRequest({
    backendUrl: options.backendUrl,
    path: '/health',
    timeoutMs: options.timeoutMs,
  });
  addCheck(checks, 'backend health reachable', health.status === 200 && health.body?.status === 'ok', {
    status: health.status,
  });

  const managed = await apiRequest({
    backendUrl: options.backendUrl,
    path: '/api/expo/booths/managed',
    timeoutMs: options.timeoutMs,
    token: adminToken,
  });
  addCheck(checks, 'admin managed booths reachable', managed.status === 200 && Array.isArray(managed.body), {
    count: Array.isArray(managed.body) ? managed.body.length : null,
    status: managed.status,
  });

  const forbiddenActive = await apiRequest({
    backendUrl: options.backendUrl,
    body: JSON.stringify({
      company_name: `Forbidden Active Smoke ${new Date().toISOString()}`,
      district: 'smoke-test',
      industry_sector: 'smoke-test',
      status: 'active',
    }),
    method: 'POST',
    path: '/api/expo/booths',
    timeoutMs: options.timeoutMs,
    token: userToken,
  });
  addCheck(checks, 'non-admin cannot create active booth', forbiddenActive.status === 403, {
    returnedStatus: forbiddenActive.body?.status || null,
    status: forbiddenActive.status,
  });
  if (forbiddenActive.status === 201) {
    await archiveBooth({ adminClient, boothId: forbiddenActive.body?.id, cleanup });
  }

  let smokeBoothId = '';
  const created = await apiRequest({
    backendUrl: options.backendUrl,
    body: JSON.stringify({
      assets_3d: {
        screen_content: {
          ctaLabel: 'Not public',
          mode: 'generated-card',
          status: 'draft',
          subtitle: 'Publication workflow smoke test',
          title: 'Smoke Test',
        },
      },
      company_name: `Publication Smoke ${new Date().toISOString()}`,
      contact_info: { description: 'Temporary staging smoke test booth.' },
      district: 'smoke-test',
      industry_sector: 'smoke-test',
    }),
    method: 'POST',
    path: '/api/expo/booths',
    timeoutMs: options.timeoutMs,
    token: adminToken,
  });
  smokeBoothId = String(created.body?.id || '');
  addCheck(checks, 'admin creates booth with default draft status', created.status === 201 && smokeBoothId && created.body?.status === 'draft', {
    boothStatus: created.body?.status || null,
    status: created.status,
  });

  if (smokeBoothId) {
    const userActivate = await apiRequest({
      backendUrl: options.backendUrl,
      body: JSON.stringify({ status: 'active' }),
      method: 'PATCH',
      path: `/api/expo/booths/${encodeURIComponent(smokeBoothId)}`,
      timeoutMs: options.timeoutMs,
      token: userToken,
    });
    addCheck(checks, 'non-owner/non-admin cannot activate smoke booth', userActivate.status === 403, {
      status: userActivate.status,
    });

    const adminReview = await apiRequest({
      backendUrl: options.backendUrl,
      body: JSON.stringify({ status: 'review' }),
      method: 'PATCH',
      path: `/api/expo/booths/${encodeURIComponent(smokeBoothId)}`,
      timeoutMs: options.timeoutMs,
      token: adminToken,
    });
    addCheck(checks, 'admin can move smoke booth to review', adminReview.status === 200 && adminReview.body?.status === 'review', {
      boothStatus: adminReview.body?.status || null,
      status: adminReview.status,
    });

    const adminArchive = await apiRequest({
      backendUrl: options.backendUrl,
      body: JSON.stringify({ status: 'archived' }),
      method: 'PATCH',
      path: `/api/expo/booths/${encodeURIComponent(smokeBoothId)}`,
      timeoutMs: options.timeoutMs,
      token: adminToken,
    });
    addCheck(checks, 'admin archives smoke booth after test', adminArchive.status === 200 && adminArchive.body?.status === 'archived', {
      boothStatus: adminArchive.body?.status || null,
      status: adminArchive.status,
    });

    if (!(adminArchive.status === 200 && adminArchive.body?.status === 'archived')) {
      await archiveBooth({ adminClient, boothId: smokeBoothId, cleanup });
    }
  }

  const scene = await apiRequest({
    backendUrl: options.backendUrl,
    path: '/api/expo/scene',
    timeoutMs: options.timeoutMs,
  });
  addCheck(checks, 'public scene remains reachable after smoke', scene.status === 200, {
    status: scene.status,
  });

  return {
    backendUrl: options.backendUrl,
    checks,
    cleanup,
    ok: checks.every((check) => check.ok) && cleanup.every((entry) => entry.archived),
  };
}

const options = parseArgs(process.argv.slice(2));
if (options.help) {
  printHelp();
  process.exit(0);
}

try {
  const result = await run(options);
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    printTextSummary(result);
  }

  process.exitCode = result.ok ? 0 : 1;
} catch (error) {
  if (options.json) {
    console.error(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }, null, 2));
  } else {
    console.error(`Expo publication staging smoke: FAIL\n${error instanceof Error ? error.message : String(error)}`);
  }
  process.exitCode = 1;
}
