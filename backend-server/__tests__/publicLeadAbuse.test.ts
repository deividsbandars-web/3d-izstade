import assert from 'node:assert/strict';
import type { Request } from 'express';
import {
  resolvePublicLeadAbuseConfig,
  type PublicLeadAbuseConfig,
} from '../config/publicLeadAbuse.js';
import {
  checkPublicLeadRateLimit,
  createPublicLeadAuditEvent,
  createPublicLeadSubmissionFingerprint,
  hasFilledPublicLeadHoneypot,
  verifyPublicLeadTurnstile,
} from '../services/publicLeadAbuse.js';
import type { RedisBackedRateLimitStore } from '../services/redisRateLimit.js';

const baseConfig: PublicLeadAbuseConfig = {
  duplicateWindowMs: 30 * 60 * 1000,
  rateLimit: {
    maxRequests: { calculator: 5, expo: 5 },
    requireRedis: false,
    windowMs: 10 * 60 * 1000,
  },
  turnstile: {
    required: false,
    secretKey: null,
    timeoutMs: 5_000,
  },
};

assert.equal(hasFilledPublicLeadHoneypot({ antiSpam: { website: '' } }), false);
assert.equal(hasFilledPublicLeadHoneypot({ antiSpam: { website: 'https://bot.example' } }), true);
assert.equal(hasFilledPublicLeadHoneypot({ spam: { homepage: 'filled' } }), true);

{
  const optional = await verifyPublicLeadTurnstile(
    {},
    {} as Request,
    baseConfig,
    async () => {
      throw new Error('Turnstile should not be called');
    },
  );
  assert.deepEqual(optional, { ok: true, verified: false });
}

{
  const requiredConfig: PublicLeadAbuseConfig = {
    ...baseConfig,
    turnstile: { ...baseConfig.turnstile, required: true, secretKey: 'secret-key' },
  };
  const missing = await verifyPublicLeadTurnstile({}, {} as Request, requiredConfig);
  assert.deepEqual(missing, {
    code: 'PUBLIC_LEAD_TURNSTILE_REQUIRED',
    ok: false,
    verified: false,
  });

  let verificationBody = '';
  const verified = await verifyPublicLeadTurnstile(
    { antiSpam: { turnstileToken: 'token-123' } },
    { ip: '203.0.113.20' } as Request,
    requiredConfig,
    async (_url, init) => {
      verificationBody = String(init?.body || '');
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'content-type': 'application/json' },
        status: 200,
      });
    },
  );
  assert.deepEqual(verified, { ok: true, verified: true });
  const verificationParams = new URLSearchParams(verificationBody);
  assert.equal(verificationParams.get('secret'), 'secret-key');
  assert.equal(verificationParams.get('response'), 'token-123');
  assert.equal(verificationParams.get('remoteip'), '203.0.113.20');
}

{
  const keys: string[] = [];
  const store: RedisBackedRateLimitStore = {
    async increment(key, windowMs, nowMs) {
      keys.push(key);
      return { count: 1, resetAt: nowMs + windowMs };
    },
  };
  const request = { ip: '198.51.100.7' } as Request;
  await checkPublicLeadRateLimit('expo', request, baseConfig, { nowMs: 1_000, store });
  await checkPublicLeadRateLimit('calculator', request, baseConfig, { nowMs: 1_000, store });
  assert.match(keys[0], /^public-lead-expo:/);
  assert.match(keys[1], /^public-lead-calculator:/);
}

{
  const originalWarn = console.warn;
  console.warn = () => undefined;
  try {
    const unavailable = await checkPublicLeadRateLimit(
      'expo',
      { ip: '198.51.100.8' } as Request,
      {
        ...baseConfig,
        rateLimit: { ...baseConfig.rateLimit, requireRedis: true },
      },
      {
        nowMs: 1_000,
        store: {
          async increment() {
            throw new Error('Redis unavailable');
          },
        },
      },
    );
    assert.equal(unavailable.allowed, false);
    assert.equal(unavailable.store, 'unavailable');
    assert.equal(unavailable.unavailable, true);
  } finally {
    console.warn = originalWarn;
  }
}

{
  const nowMs = Date.parse('2026-07-02T12:00:00.000Z');
  const first = createPublicLeadSubmissionFingerprint({
    duplicateWindowMs: baseConfig.duplicateWindowMs,
    email: 'Lead@Example.com',
    nowMs,
    route: 'expo',
    scope: 'company-1',
  });
  const normalized = createPublicLeadSubmissionFingerprint({
    duplicateWindowMs: baseConfig.duplicateWindowMs,
    email: 'lead@example.com',
    nowMs,
    route: 'expo',
    scope: 'COMPANY-1',
  });
  const nextWindow = createPublicLeadSubmissionFingerprint({
    duplicateWindowMs: baseConfig.duplicateWindowMs,
    email: 'lead@example.com',
    nowMs: nowMs + baseConfig.duplicateWindowMs,
    route: 'expo',
    scope: 'company-1',
  });
  assert.equal(first, normalized);
  assert.notEqual(first, nextWindow);
  assert.match(first, /^[a-f0-9]{64}$/);
}

{
  const request = {
    correlationId: 'unsafe value with spaces and email@example.com',
    headers: {
      origin: 'https://www.30sek24.com?token=secret',
      referer: 'https://www.30sek24.com/expo/private?email=lead@example.com',
      'user-agent': 'Very identifying browser value',
    },
    ip: '203.0.113.20',
    method: 'POST',
    path: '/api/expo/lead',
  } as unknown as Request;
  const event = createPublicLeadAuditEvent(request, '/expo/booth?email=lead@example.com', {
    code: 'EXPO_LEAD_ACCEPTED',
    nowMs: Date.parse('2026-07-02T12:00:00.000Z'),
    route: 'expo',
    stage: 'accepted',
    status: 201,
  });
  assert.equal(event.correlationId, null);
  assert.equal(event.origin, 'https://www.30sek24.com');
  assert.equal(event.refererOrigin, 'https://www.30sek24.com');
  assert.equal(event.sourcePath, '/expo/booth');
  assert.equal(event.userAgentPresent, true);
  const serialized = JSON.stringify(event);
  assert.doesNotMatch(serialized, /lead@example\.com|token=secret|identifying browser/);

  const pathWithEmail = createPublicLeadAuditEvent(request, '/expo/lead%40example.com', {
    code: 'EXPO_LEAD_REJECTED',
    route: 'expo',
    stage: 'validation',
    status: 400,
  });
  assert.equal(pathWithEmail.sourcePath, null);
}

assert.throws(() => resolvePublicLeadAbuseConfig({
  NODE_ENV: 'production',
  PUBLIC_LEAD_TURNSTILE_REQUIRED: 'true',
}), /BACKEND_ENV_MISSING:PUBLIC_LEAD_TURNSTILE_SECRET_KEY/);
