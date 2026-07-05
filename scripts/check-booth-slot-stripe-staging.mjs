#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';
import Stripe from 'stripe';

const DEFAULTS = {
  backendUrl: 'https://api-staging.30sek24.com',
  expectedSupabaseRef: 'aasovfczmqytdtugcrmh',
  productionUrl: 'https://api.30sek24.com',
  timeoutMs: 20000,
  userEmail: 'booth-slot-stripe-smoke-user@30sek24.local',
};

function parseArgs(argv) {
  const options = {
    allowNonStaging: false,
    backendUrl: process.env.BOOTH_SLOT_STRIPE_SMOKE_BACKEND_URL || DEFAULTS.backendUrl,
    expectedSupabaseRef: process.env.BOOTH_SLOT_STRIPE_SMOKE_EXPECTED_SUPABASE_REF || DEFAULTS.expectedSupabaseRef,
    help: false,
    json: false,
    runSignedWebhook: true,
    timeoutMs: Number.parseInt(process.env.BOOTH_SLOT_STRIPE_SMOKE_TIMEOUT_MS || String(DEFAULTS.timeoutMs), 10),
    userEmail: process.env.BOOTH_SLOT_STRIPE_SMOKE_USER_EMAIL || DEFAULTS.userEmail,
  };

  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg === '--allow-non-staging') {
      options.allowNonStaging = true;
    } else if (arg === '--skip-signed-webhook') {
      options.runSignedWebhook = false;
    } else if (arg.startsWith('--backend-url=')) {
      options.backendUrl = arg.slice('--backend-url='.length);
    } else if (arg.startsWith('--expected-supabase-ref=')) {
      options.expectedSupabaseRef = arg.slice('--expected-supabase-ref='.length);
    } else if (arg.startsWith('--timeout-ms=')) {
      options.timeoutMs = Number.parseInt(arg.slice('--timeout-ms='.length), 10);
    } else if (arg.startsWith('--user-email=')) {
      options.userEmail = arg.slice('--user-email='.length);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  options.backendUrl = normalizeBaseUrl(options.backendUrl);
  options.expectedSupabaseRef = safeProjectRef(options.expectedSupabaseRef);
  options.userEmail = safeEmail(options.userEmail, 'smoke user email');
  options.timeoutMs = Number.isFinite(options.timeoutMs) && options.timeoutMs > 0
    ? Math.min(Math.max(options.timeoutMs, 3000), 90000)
    : DEFAULTS.timeoutMs;

  return options;
}

function helpText() {
  return `
Booth slot Stripe staging smoke check

Usage:
  powershell -ExecutionPolicy Bypass -File scripts/run-with-doppler.ps1 run -- node scripts/check-booth-slot-stripe-staging.mjs --json

Required env from staging Doppler or shell:
  SUPABASE_URL
  SUPABASE_SERVICE_KEY
  SUPABASE_ANON_KEY or VITE_SUPABASE_ANON_KEY
  STRIPE_SECRET_KEY       Must be sk_test_...
  STRIPE_WEBHOOK_SECRET   Must be whsec_...

Checks:
  - staging backend health
  - public booth-slot availability
  - authenticated reservation creates a real Stripe test Checkout Session
  - billing payment and reservation are marked checkout_started
  - signed checkout.session.completed webhook finalizes the reservation
  - test rows and the open Stripe Checkout Session are cleaned up

The script does not print service keys, anon keys, JWTs, Stripe secrets, or Checkout URLs.
`.trim();
}

function normalizeBaseUrl(value) {
  return String(value || '').trim().replace(/\/+$/, '');
}

function safeEmail(value, label) {
  const email = String(value || '').trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new Error(`Invalid ${label}: ${value}`);
  }
  return email;
}

function safeProjectRef(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (!/^[a-z0-9]+$/.test(normalized)) {
    throw new Error(`Invalid expected Supabase ref: ${value}`);
  }
  return normalized;
}

function getSupabaseProjectRef(value) {
  try {
    const hostname = new URL(normalizeBaseUrl(value)).hostname.toLowerCase();
    return hostname.match(/^([a-z0-9]+)\.supabase\.co$/i)?.[1] ?? '';
  } catch {
    return '';
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
      `Refusing to run booth-slot Stripe smoke against ${parsed.hostname}. `
      + 'Use --backend-url=https://api-staging.30sek24.com or pass --allow-non-staging intentionally.',
    );
  }
}

function assertExpectedSupabaseProject({ expectedSupabaseRef, supabaseUrl }) {
  const actualRef = getSupabaseProjectRef(supabaseUrl);
  if (!actualRef) {
    throw new Error('SUPABASE_URL must be a Supabase project URL for this staging smoke check.');
  }
  if (actualRef !== expectedSupabaseRef) {
    throw new Error(
      `Staging Supabase project mismatch: expected ${expectedSupabaseRef}, got ${actualRef}. `
      + 'Run with staging env and do not use production/local Supabase env for this gate.',
    );
  }
}

function makePassword() {
  return `BoothSlotStripe-${crypto.randomBytes(18).toString('base64url')}!9a`;
}

function makeRunId() {
  return `booth-slot-stripe-${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}`;
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

async function apiRequest({ backendUrl, path, token, timeoutMs, rawBody, ...init }) {
  const response = await fetchWithTimeout(`${backendUrl}${path}`, {
    ...init,
    body: rawBody ?? init.body,
    headers: {
      Accept: 'application/json',
      Origin: 'https://staging.30sek24.com',
      ...(rawBody ? { 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  }, timeoutMs);
  const body = await readJsonResponse(response);

  return {
    body,
    ok: response.ok,
    status: response.status,
  };
}

async function ensureSmokeUser({ authAdmin, email, password }) {
  const { data: listData, error: listError } = await authAdmin.listUsers({ page: 1, perPage: 1000 });
  if (listError) {
    throw new Error(`Supabase listUsers failed for smoke user: ${listError.message}`);
  }

  const attrs = {
    app_metadata: { role: 'user' },
    email,
    email_confirm: true,
    password,
    user_metadata: { purpose: 'booth slot Stripe staging smoke test' },
  };
  const existing = listData.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
  if (existing) {
    const { data, error } = await authAdmin.updateUserById(existing.id, attrs);
    if (error) {
      throw new Error(`Supabase updateUserById failed for smoke user: ${error.message}`);
    }
    return data.user;
  }

  const { data, error } = await authAdmin.createUser(attrs);
  if (error) {
    throw new Error(`Supabase createUser failed for smoke user: ${error.message}`);
  }
  return data.user;
}

async function signInSmokeUser({ supabase, email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session?.access_token) {
    throw new Error(`Supabase smoke user sign-in failed: ${error?.message || 'missing access token'}`);
  }
  return data.session.access_token;
}

function chooseAvailableSlot(slots) {
  return [...slots]
    .filter((slot) => slot.status === 'available')
    .sort((left, right) => {
      const byAmount = Number(left.priceCents || 0) - Number(right.priceCents || 0);
      return byAmount || String(left.slotId).localeCompare(String(right.slotId));
    })[0] ?? null;
}

function assertStripeTestConfig({ publishableKey, secretKey, webhookSecret }) {
  if (!secretKey.startsWith('sk_test_')) {
    throw new Error('STRIPE_SECRET_KEY must be a Stripe test key for this staging smoke check.');
  }
  if (publishableKey && !publishableKey.startsWith('pk_test_')) {
    throw new Error('STRIPE_PUBLISHABLE_KEY must be a Stripe test key when provided.');
  }
  if (!webhookSecret.startsWith('whsec_')) {
    throw new Error('STRIPE_WEBHOOK_SECRET must be a Stripe webhook signing secret.');
  }
}

async function getReservation(adminClient, reservationId) {
  const { data, error } = await adminClient
    .from('booth_slot_reservations')
    .select('*')
    .eq('id', reservationId)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load smoke reservation: ${error.message}`);
  }
  return data ?? null;
}

async function getBillingPayment(adminClient, sessionId) {
  const { data, error } = await adminClient
    .from('billing_payments')
    .select('*')
    .eq('stripe_session_id', sessionId)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load smoke billing payment: ${error.message}`);
  }
  return data ?? null;
}

function buildCompletedCheckoutPayload({ amountCents, currency, reservationId, runId, sessionId, slot, userId }) {
  return JSON.stringify({
    api_version: 'unversioned',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        amount_total: amountCents,
        currency,
        customer: null,
        id: sessionId,
        metadata: {
          booth_slot_id: slot.slotId,
          booth_slot_reservation_id: reservationId,
          commercial_tier: slot.tier,
          company_name: `Stripe Smoke ${runId}`,
          kind: 'booth-slot',
          product_id: reservationId,
          screen_class: slot.screenClass,
          user_id: userId,
        },
        object: 'checkout.session',
        payment_intent: `pi_test_${runId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 24)}`,
      },
    },
    id: `evt_test_${runId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 24)}`,
    livemode: false,
    object: 'event',
    pending_webhooks: 1,
    request: { id: null, idempotency_key: null },
    type: 'checkout.session.completed',
  });
}

async function cleanupSmoke({ adminClient, reservationId, sessionId, stripe }) {
  const cleanup = {
    billingPaymentCleaned: false,
    boothCleaned: false,
    companyCleaned: false,
    reservationCleaned: false,
    stripeSessionExpired: false,
  };

  if (sessionId) {
    try {
      await stripe.checkout.sessions.expire(sessionId);
      cleanup.stripeSessionExpired = true;
    } catch (error) {
      cleanup.stripeSessionExpireError = error instanceof Error ? error.message : String(error);
    }
  }

  const reservation = reservationId ? await getReservation(adminClient, reservationId).catch(() => null) : null;
  if (reservation?.booth_id) {
    const { error } = await adminClient.from('booths').delete().eq('id', reservation.booth_id);
    if (!error) {
      cleanup.boothCleaned = true;
      cleanup.boothCleanupMode = 'delete';
    } else {
      const updateResult = await adminClient
        .from('booths')
        .update({
          company_id: null,
          marketplace_reservation_id: null,
          slot_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reservation.booth_id);
      cleanup.boothCleaned = !updateResult.error;
      cleanup.boothCleanupMode = updateResult.error ? 'failed' : 'release-slot';
      if (updateResult.error) {
        cleanup.boothCleanupError = updateResult.error.message || String(updateResult.error);
      }
    }
  }
  if (reservation?.company_id) {
    const { error } = await adminClient.from('companies').delete().eq('id', reservation.company_id);
    if (!error) {
      cleanup.companyCleaned = true;
      cleanup.companyCleanupMode = 'delete';
    } else {
      const updateResult = await adminClient
        .from('companies')
        .update({
          is_active: false,
          name: `${reservation.company_name} cleanup`,
        })
        .eq('id', reservation.company_id);
      cleanup.companyCleaned = !updateResult.error;
      cleanup.companyCleanupMode = updateResult.error ? 'failed' : 'deactivate';
      if (updateResult.error) {
        cleanup.companyCleanupError = updateResult.error.message || String(updateResult.error);
      }
    }
  }
  if (reservationId) {
    await adminClient
      .from('booth_slot_reservations')
      .update({
        booth_id: null,
        company_id: null,
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', reservationId);

    const { error } = await adminClient.from('booth_slot_reservations').delete().eq('id', reservationId);
    if (!error) {
      cleanup.reservationCleaned = true;
    } else {
      cleanup.reservationCleanupError = error.message || String(error);
    }
  }
  if (sessionId) {
    const { error } = await adminClient.from('billing_payments').delete().eq('stripe_session_id', sessionId);
    if (!error) {
      cleanup.billingPaymentCleaned = true;
    } else {
      const updateResult = await adminClient
        .from('billing_payments')
        .update({
          metadata: { smoke_cleanup: true },
          status: 'refunded',
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_session_id', sessionId);
      cleanup.billingPaymentCleaned = !updateResult.error;
      if (updateResult.error) {
        cleanup.billingPaymentCleanupError = updateResult.error.message || String(updateResult.error);
      }
    }
  }

  return cleanup;
}

function addCheck(checks, name, ok, details = {}) {
  checks.push({ name, ok: Boolean(ok), ...details });
}

async function run() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(helpText());
    return;
  }

  assertSafeBackendUrl(options);
  const supabaseUrl = requiredEnv('SUPABASE_URL');
  const supabaseServiceKey = requiredEnv('SUPABASE_SERVICE_KEY');
  const supabaseAnonKey = optionalEnv('SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY');
  if (!supabaseAnonKey) {
    throw new Error('SUPABASE_ANON_KEY or VITE_SUPABASE_ANON_KEY is required.');
  }
  assertExpectedSupabaseProject({ expectedSupabaseRef: options.expectedSupabaseRef, supabaseUrl });

  const stripeSecretKey = requiredEnv('STRIPE_SECRET_KEY');
  const stripeWebhookSecret = requiredEnv('STRIPE_WEBHOOK_SECRET');
  const stripePublishableKey = optionalEnv('STRIPE_PUBLISHABLE_KEY');
  assertStripeTestConfig({
    publishableKey: stripePublishableKey,
    secretKey: stripeSecretKey,
    webhookSecret: stripeWebhookSecret,
  });

  const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const stripe = new Stripe(stripeSecretKey);
  const runId = makeRunId();
  const checks = [];
  let reservationId = null;
  let selectedSlot = null;
  let sessionId = null;
  let cleanup = null;

  try {
    const health = await fetchWithTimeout(`${options.backendUrl}/health`, { headers: { Accept: 'application/json' } }, options.timeoutMs);
    addCheck(checks, 'backend health is ok', health.ok, { status: health.status });
    if (!health.ok) {
      throw new Error(`Backend health failed with HTTP ${health.status}`);
    }

    const password = makePassword();
    const smokeUser = await ensureSmokeUser({
      authAdmin: adminClient.auth.admin,
      email: options.userEmail,
      password,
    });
    const token = await signInSmokeUser({
      email: options.userEmail,
      password,
      supabase: authClient,
    });

    const availability = await apiRequest({
      backendUrl: options.backendUrl,
      method: 'GET',
      path: '/api/expo/booth-slots',
      timeoutMs: options.timeoutMs,
    });
    const slots = Array.isArray(availability.body?.slots) ? availability.body.slots : [];
    selectedSlot = chooseAvailableSlot(slots);
    addCheck(checks, 'available booth slot exists', availability.status === 200 && Boolean(selectedSlot), {
      availableCount: slots.filter((slot) => slot.status === 'available').length,
      status: availability.status,
    });
    if (!selectedSlot) {
      throw new Error('No available booth slot found for Stripe smoke test.');
    }

    const reservationPayload = {
      companyName: `Stripe Smoke ${runId}`,
      contactEmail: options.userEmail,
      metadata: {
        runId,
        smoke: true,
      },
      website: 'https://staging.30sek24.com',
    };
    const reservationResponse = await apiRequest({
      backendUrl: options.backendUrl,
      body: JSON.stringify(reservationPayload),
      method: 'POST',
      path: `/api/expo/booth-slots/${encodeURIComponent(selectedSlot.slotId)}/reserve`,
      timeoutMs: options.timeoutMs,
      token,
    });
    reservationId = reservationResponse.body?.reservation?.id ?? null;
    sessionId = reservationResponse.body?.checkout?.session_id ?? null;
    const checkoutUrl = reservationResponse.body?.checkout?.url ?? '';
    const responsePublishableKey = reservationResponse.body?.checkout?.publishableKey ?? '';
    addCheck(checks, 'reservation creates Stripe test checkout', reservationResponse.status === 201
      && typeof reservationId === 'string'
      && typeof sessionId === 'string'
      && sessionId.startsWith('cs_test_')
      && typeof checkoutUrl === 'string'
      && checkoutUrl.startsWith('https://checkout.stripe.com/'), {
      reservationStatus: reservationResponse.body?.reservation?.status ?? null,
      status: reservationResponse.status,
    });
    addCheck(checks, 'checkout response publishable key is test scoped', !responsePublishableKey || responsePublishableKey.startsWith('pk_test_'));
    if (!reservationId || !sessionId) {
      throw new Error(`Reserve checkout failed with HTTP ${reservationResponse.status}.`);
    }

    const startedReservation = await getReservation(adminClient, reservationId);
    const startedPayment = await getBillingPayment(adminClient, sessionId);
    addCheck(checks, 'reservation marked checkout_started', startedReservation?.status === 'checkout_started'
      && startedReservation?.stripe_session_id === sessionId);
    addCheck(checks, 'billing payment recorded checkout_started', startedPayment?.status === 'checkout_started'
      && startedPayment?.product_kind === 'booth-slot'
      && startedPayment?.product_id === reservationId);

    if (options.runSignedWebhook) {
      const webhookPayload = buildCompletedCheckoutPayload({
        amountCents: reservationResponse.body?.reservation?.amountCents ?? selectedSlot.priceCents,
        currency: reservationResponse.body?.reservation?.currency ?? 'eur',
        reservationId,
        runId,
        sessionId,
        slot: selectedSlot,
        userId: smokeUser.id,
      });
      const signature = stripe.webhooks.generateTestHeaderString({
        payload: webhookPayload,
        secret: stripeWebhookSecret,
      });
      const webhookResponse = await apiRequest({
        backendUrl: options.backendUrl,
        headers: {
          'Stripe-Signature': signature,
        },
        method: 'POST',
        path: '/api/billing/webhook',
        rawBody: webhookPayload,
        timeoutMs: options.timeoutMs,
      });
      addCheck(checks, 'signed webhook accepted', webhookResponse.status === 200 && webhookResponse.body?.received === true, {
        status: webhookResponse.status,
      });
      if (webhookResponse.status !== 200) {
        throw new Error(`Signed webhook failed with HTTP ${webhookResponse.status}.`);
      }

      const assignedReservation = await getReservation(adminClient, reservationId);
      const completedPayment = await getBillingPayment(adminClient, sessionId);
      addCheck(checks, 'reservation finalized by webhook', assignedReservation?.status === 'assigned'
        && Boolean(assignedReservation?.company_id)
        && Boolean(assignedReservation?.booth_id));
      addCheck(checks, 'billing payment marked completed', completedPayment?.status === 'payment_completed');
    }
  } finally {
    cleanup = await cleanupSmoke({ adminClient, reservationId, sessionId, stripe });
  }

  const postCleanup = selectedSlot
    ? await apiRequest({
      backendUrl: options.backendUrl,
      method: 'GET',
      path: '/api/expo/booth-slots',
      timeoutMs: options.timeoutMs,
    })
    : null;
  const postCleanupSlot = postCleanup?.body?.slots?.find((slot) => slot.slotId === selectedSlot?.slotId) ?? null;
  addCheck(checks, 'smoke cleanup released booth slot', !postCleanupSlot || postCleanupSlot.status === 'available', {
    slotStatus: postCleanupSlot?.status ?? null,
  });

  const ok = checks.every((check) => check.ok);
  const result = {
    checks,
    cleanup,
    ok,
    runId,
    selectedSlotId: selectedSlot?.slotId ?? null,
    signedWebhook: options.runSignedWebhook,
    stripeSessionIdPrefix: sessionId ? sessionId.slice(0, 8) : null,
  };

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    for (const check of checks) {
      console.log(`${check.ok ? 'PASS' : 'FAIL'} ${check.name}`);
    }
    console.log(`cleanup=${JSON.stringify(cleanup)}`);
  }

  if (!ok) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
