#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import childProcess from 'node:child_process';
import crypto from 'node:crypto';

const DEFAULTS = {
  adminEmail: 'expo-commercial-smoke-admin@30sek24.local',
  backendUrl: 'https://api-staging.30sek24.com',
  sponsorSlug: 'sponsor-concierge',
  timeoutMs: 12000,
  userEmail: 'expo-commercial-smoke-user@30sek24.local',
};

function parseArgs(argv) {
  const options = {
    adminEmail: process.env.EXPO_COMMERCIAL_SMOKE_ADMIN_EMAIL || DEFAULTS.adminEmail,
    allowNonStaging: false,
    backendUrl: process.env.EXPO_COMMERCIAL_SMOKE_BACKEND_URL || DEFAULTS.backendUrl,
    help: false,
    json: false,
    runPublication: true,
    sponsorSlug: process.env.EXPO_COMMERCIAL_SMOKE_SPONSOR_SLUG || DEFAULTS.sponsorSlug,
    timeoutMs: Number.parseInt(process.env.EXPO_COMMERCIAL_SMOKE_TIMEOUT_MS || String(DEFAULTS.timeoutMs), 10),
    userEmail: process.env.EXPO_COMMERCIAL_SMOKE_USER_EMAIL || DEFAULTS.userEmail,
  };

  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg === '--allow-non-staging') {
      options.allowNonStaging = true;
    } else if (arg === '--skip-publication') {
      options.runPublication = false;
    } else if (arg.startsWith('--admin-email=')) {
      options.adminEmail = arg.slice('--admin-email='.length);
    } else if (arg.startsWith('--backend-url=')) {
      options.backendUrl = arg.slice('--backend-url='.length);
    } else if (arg.startsWith('--sponsor=')) {
      options.sponsorSlug = arg.slice('--sponsor='.length);
    } else if (arg.startsWith('--timeout-ms=')) {
      options.timeoutMs = Number.parseInt(arg.slice('--timeout-ms='.length), 10);
    } else if (arg.startsWith('--user-email=')) {
      options.userEmail = arg.slice('--user-email='.length);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  options.backendUrl = normalizeBaseUrl(options.backendUrl);
  options.adminEmail = safeEmail(options.adminEmail, 'admin smoke email');
  options.userEmail = safeEmail(options.userEmail, 'user smoke email');
  options.sponsorSlug = normalizeSponsorSlug(options.sponsorSlug);
  options.timeoutMs = Number.isFinite(options.timeoutMs) && options.timeoutMs > 0
    ? Math.min(Math.max(options.timeoutMs, 1000), 60000)
    : DEFAULTS.timeoutMs;

  return options;
}

function helpText() {
  return `
Expo commercial staging smoke check

Usage:
  doppler run -- npm run check:expo-commercial-staging
  doppler run -- npm run check:expo-commercial-staging -- --json

Required env from Doppler or shell:
  SUPABASE_URL
  SUPABASE_SERVICE_KEY
  SUPABASE_ANON_KEY or VITE_SUPABASE_ANON_KEY

Options:
  --backend-url=https://api-staging.30sek24.com
  --sponsor=sponsor-concierge
  --admin-email=expo-commercial-smoke-admin@30sek24.local
  --user-email=expo-commercial-smoke-user@30sek24.local
  --timeout-ms=12000
  --skip-publication
  --json
  --allow-non-staging   Required for API hosts other than api-staging.30sek24.com

This check creates/reuses Supabase Auth smoke users, writes one temporary sponsor
lead through the public Expo lead API, verifies sponsor inbox auth/owner gates,
updates lead status and ops notes as admin, then deletes its temporary lead rows.
It does not print passwords, JWTs, service keys, anon keys, or lead payload secrets.
`.trim();
}

function normalizeBaseUrl(url) {
  return String(url || '').trim().replace(/\/+$/, '');
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
      `Refusing to run commercial smoke test against ${parsed.hostname}. `
      + 'Use --backend-url=https://api-staging.30sek24.com or pass --allow-non-staging intentionally.',
    );
  }
}

function safeEmail(value, label) {
  const email = String(value || '').trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new Error(`Invalid ${label}: ${value}`);
  }

  return email;
}

function normalizeSponsorSlug(value) {
  const sponsor = String(value || '').trim().toLowerCase();
  if (!/^[a-z0-9-]{2,80}$/.test(sponsor)) {
    throw new Error(`Invalid sponsor slug: ${value}`);
  }

  return sponsor;
}

function makePassword() {
  return `Commercial-${crypto.randomBytes(18).toString('base64url')}!9a`;
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
    user_metadata: { purpose: 'expo commercial staging smoke test' },
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

function addCheck(checks, name, ok, details = {}) {
  checks.push({ name, ok: Boolean(ok), ...details });
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
    opsError: opsDelete.error?.message || null,
    leadError: leadDelete.error?.message || null,
  });
}

function buildSmokeLeadPayload({ email, sponsorSlug }) {
  const sourcePath = `/expo/sponsor-packages?commercialSmoke=${Date.now().toString(36)}`;
  return {
    payload: {
      clientEmail: email,
      clientName: 'Expo Commercial Smoke',
      companyId: sponsorSlug,
      companySlug: sponsorSlug,
      message: [
        'Sponsor package interest: Premium Booth',
        'Sponsor company: Commercial Smoke Test',
        'Budget signal: staging smoke',
        'Timeline: staging smoke',
        '',
        `Commercial flow smoke ${sourcePath}`,
      ].join('\n'),
      sourcePath,
    },
    sourcePath,
  };
}

function runPublicationSmoke(options) {
  if (!options.runPublication) {
    return {
      checks: [{
        name: 'publication workflow smoke',
        ok: true,
        skipped: true,
      }],
      ok: true,
      skipped: true,
    };
  }

  const result = childProcess.spawnSync(process.execPath, [
    'scripts/check-expo-publication-staging.mjs',
    '--json',
    `--backend-url=${options.backendUrl}`,
    `--timeout-ms=${options.timeoutMs}`,
  ], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: process.env,
    timeout: Math.max(options.timeoutMs * 6, 60000),
    windowsHide: true,
  });

  if (result.error) {
    return {
      checks: [{
        error: result.error.message,
        name: 'publication workflow smoke',
        ok: false,
      }],
      ok: false,
    };
  }

  const output = result.stdout.trim();
  let parsed = null;
  try {
    parsed = output ? JSON.parse(output) : null;
  } catch {
    parsed = null;
  }

  return {
    checks: [{
      exitCode: result.status,
      name: 'publication workflow smoke',
      ok: result.status === 0 && parsed?.ok === true,
      stderrPreview: result.stderr.slice(0, 400),
      summary: parsed ? {
        checkCount: Array.isArray(parsed.checks) ? parsed.checks.length : null,
        cleanupCount: Array.isArray(parsed.cleanup) ? parsed.cleanup.length : null,
      } : null,
    }],
    ok: result.status === 0 && parsed?.ok === true,
  };
}

async function run(options) {
  assertSafeBackendUrl(options);

  const supabaseUrl = requiredEnv('SUPABASE_URL');
  const supabaseServiceKey = requiredEnv('SUPABASE_SERVICE_KEY');
  const supabaseAnonKey = optionalEnv('SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY');
  if (!supabaseAnonKey) {
    throw new Error('SUPABASE_ANON_KEY or VITE_SUPABASE_ANON_KEY is required.');
  }

  const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
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
  let smokeLeadId = '';

  try {
    const health = await apiRequest({
      backendUrl: options.backendUrl,
      path: '/health',
      timeoutMs: options.timeoutMs,
    });
    addCheck(checks, 'backend health reachable', health.status === 200 && health.body?.status === 'ok', {
      status: health.status,
    });

    const unauthInbox = await apiRequest({
      backendUrl: options.backendUrl,
      path: `/api/expo/lead-inbox/${encodeURIComponent(options.sponsorSlug)}?limit=5`,
      timeoutMs: options.timeoutMs,
    });
    addCheck(checks, 'sponsor lead inbox rejects unauthenticated access', unauthInbox.status === 401, {
      status: unauthInbox.status,
    });

    const userInbox = await apiRequest({
      backendUrl: options.backendUrl,
      path: `/api/expo/lead-inbox/${encodeURIComponent(options.sponsorSlug)}?limit=5`,
      timeoutMs: options.timeoutMs,
      token: userToken,
    });
    addCheck(checks, 'unowned user cannot read sponsor lead inbox', userInbox.status === 403, {
      status: userInbox.status,
    });

    const smokeLead = buildSmokeLeadPayload({
      email: `expo-commercial-smoke-${Date.now().toString(36)}@example.invalid`,
      sponsorSlug: options.sponsorSlug,
    });
    const leadCreate = await apiRequest({
      backendUrl: options.backendUrl,
      body: JSON.stringify(smokeLead.payload),
      method: 'POST',
      path: '/api/expo/lead',
      timeoutMs: options.timeoutMs,
    });
    addCheck(checks, 'public sponsor package lead capture creates a lead', leadCreate.status === 201 && leadCreate.body?.success === true, {
      companyIdResolved: Boolean(leadCreate.body?.companyId),
      status: leadCreate.status,
    });

    const leadRecord = await findSmokeLead({
      adminClient,
      email: smokeLead.payload.clientEmail,
      sourcePath: smokeLead.sourcePath,
    });
    smokeLeadId = String(leadRecord?.id || '');
    addCheck(checks, 'smoke lead is persisted in Supabase', Boolean(smokeLeadId), {
      leadFound: Boolean(smokeLeadId),
    });

    const adminInbox = await apiRequest({
      backendUrl: options.backendUrl,
      path: `/api/expo/lead-inbox/${encodeURIComponent(options.sponsorSlug)}?limit=20`,
      timeoutMs: options.timeoutMs,
      token: adminToken,
    });
    const adminInboxLeads = Array.isArray(adminInbox.body?.leads) ? adminInbox.body.leads : [];
    addCheck(checks, 'admin can read sponsor lead inbox', adminInbox.status === 200 && Array.isArray(adminInbox.body?.leads), {
      leadCount: adminInboxLeads.length,
      status: adminInbox.status,
    });
    addCheck(checks, 'admin inbox includes smoke lead', adminInboxLeads.some((lead) => String(lead.id) === smokeLeadId), {
      leadIdFound: Boolean(adminInboxLeads.some((lead) => String(lead.id) === smokeLeadId)),
    });

    if (smokeLeadId) {
      const statusUpdate = await apiRequest({
        backendUrl: options.backendUrl,
        body: JSON.stringify({ status: 'contacted' }),
        method: 'PATCH',
        path: `/api/expo/lead-inbox/${encodeURIComponent(options.sponsorSlug)}/leads/${encodeURIComponent(smokeLeadId)}`,
        timeoutMs: options.timeoutMs,
        token: adminToken,
      });
      addCheck(checks, 'admin can update sponsor lead status', statusUpdate.status === 200 && statusUpdate.body?.status === 'contacted', {
        returnedStatus: statusUpdate.body?.status || null,
        status: statusUpdate.status,
      });

      const followUpAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
      const opsUpdate = await apiRequest({
        backendUrl: options.backendUrl,
        body: JSON.stringify({
          followUpAt,
          opsNotes: 'Commercial staging smoke follow-up note.',
        }),
        method: 'PATCH',
        path: `/api/expo/lead-inbox/${encodeURIComponent(options.sponsorSlug)}/leads/${encodeURIComponent(smokeLeadId)}/ops`,
        timeoutMs: options.timeoutMs,
        token: adminToken,
      });
      addCheck(checks, 'admin can update sponsor lead ops notes', opsUpdate.status === 200 && opsUpdate.body?.ops_notes, {
        hasOpsNotes: Boolean(opsUpdate.body?.ops_notes),
        status: opsUpdate.status,
      });
    }

    const publicationSmoke = runPublicationSmoke(options);
    checks.push(...publicationSmoke.checks);
  } finally {
    await cleanupSmokeLead({ adminClient, cleanup, leadId: smokeLeadId });
  }

  return {
    backendUrl: options.backendUrl,
    checks,
    cleanup,
    generatedAt: new Date().toISOString(),
    ok: checks.every((check) => check.ok) && cleanup.every((entry) => entry.deleted),
    sponsorSlug: options.sponsorSlug,
  };
}

function printHuman(result) {
  console.log(`Expo commercial staging smoke: ${result.ok ? 'PASS' : 'FAIL'}`);
  console.log(`Backend: ${result.backendUrl}`);
  console.log(`Sponsor: ${result.sponsorSlug}`);
  console.log(`Generated: ${result.generatedAt}`);

  for (const check of result.checks) {
    const status = check.ok ? 'PASS' : 'FAIL';
    const details = Object.entries(check)
      .filter(([key]) => key !== 'name' && key !== 'ok')
      .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
      .join(', ');
    console.log(`[${status}] ${check.name}${details ? `: ${details}` : ''}`);
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

  if (!result.ok) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
