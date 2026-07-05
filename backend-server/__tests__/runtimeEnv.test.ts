import assert from 'node:assert/strict';
import { resolveBackendRuntimeEnv } from '../config/runtimeEnv.js';

const galaOnlyEnv = resolveBackendRuntimeEnv({
  NODE_ENV: 'production',
  PORT: '3000',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_KEY: 'service-key',
});

assert.equal(galaOnlyEnv.port, 3000);
assert.equal(galaOnlyEnv.nodeEnv, 'production');
assert.equal(galaOnlyEnv.supabaseUrl, 'https://example.supabase.co');
assert.equal(galaOnlyEnv.pixelStreamingRoutesEnabled, false);
assert.equal(galaOnlyEnv.signalingStatusBaseUrl, null);
assert.equal(galaOnlyEnv.ue5SecretKey, null);
assert.equal(galaOnlyEnv.stripeSecretKey, null);
assert.equal(galaOnlyEnv.stripeWebhookSecret, null);
assert.equal(galaOnlyEnv.billingPublicAppUrl, null);
assert.equal(galaOnlyEnv.pixelStreamingStatusTimeoutMs, 2500);
assert.equal(galaOnlyEnv.trustProxyHops, 0);
assert.equal(galaOnlyEnv.publicLeadAbuse.rateLimit.maxRequests.expo, 5);
assert.equal(galaOnlyEnv.publicLeadAbuse.rateLimit.maxRequests.calculator, 5);
assert.equal(galaOnlyEnv.publicLeadAbuse.rateLimit.requireRedis, true);
assert.equal(galaOnlyEnv.publicLeadAbuse.turnstile.required, false);
assert.equal(galaOnlyEnv.redisUrl, null);
assert.deepEqual(galaOnlyEnv.corsAllowedOrigins, [
  'https://www.30sek24.com',
  'https://staging.30sek24.com',
]);

const developmentEnv = resolveBackendRuntimeEnv({
  NODE_ENV: 'development',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_KEY: 'service-key',
});
assert.equal(developmentEnv.corsAllowedOrigins.includes('http://localhost:5173'), true);
assert.equal(developmentEnv.corsAllowedOrigins.includes('http://127.0.0.1:4173'), true);
assert.equal(developmentEnv.publicLeadAbuse.rateLimit.requireRedis, false);

const validEnv = resolveBackendRuntimeEnv({
  NODE_ENV: 'production',
  PORT: '3000',
  BACKEND_TRUST_PROXY_HOPS: '1',
  BACKEND_CORS_ALLOWED_ORIGINS: 'https://www.30sek24.com, https://preview.example.com, https://www.30sek24.com',
  PIXEL_STREAMING_ROUTES_ENABLED: 'true',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_KEY: 'service-key',
  SIGNALING_STATUS_BASE_URL: 'http://signaling',
  PIXEL_STREAMING_STATUS_TIMEOUT_MS: '2500',
  UE5_SECRET_KEY: 'ue5-secret',
  STRIPE_SECRET_KEY: 'stripe-secret',
  STRIPE_WEBHOOK_SECRET: 'stripe-webhook-secret',
  BILLING_CHECKOUT_SUCCESS_URL: 'https://example.com/billing/success',
  BILLING_CHECKOUT_CANCEL_URL: 'https://example.com/billing/cancel',
  BILLING_PUBLIC_APP_URL: 'https://example.com',
  PUBLIC_EXPO_LEAD_RATE_LIMIT_MAX_REQUESTS: '7',
  PUBLIC_CALCULATOR_LEAD_RATE_LIMIT_MAX_REQUESTS: '8',
  PUBLIC_LEAD_RATE_LIMIT_WINDOW_MS: '120000',
  PUBLIC_LEAD_DUPLICATE_WINDOW_MS: '900000',
  PUBLIC_LEAD_TURNSTILE_REQUIRED: 'true',
  PUBLIC_LEAD_TURNSTILE_SECRET_KEY: 'turnstile-secret',
  PUBLIC_LEAD_TURNSTILE_TIMEOUT_MS: '3000',
  REDIS_URL: 'rediss://default:secret@cache.example.com:6379',
});

assert.equal(validEnv.port, 3000);
assert.equal(validEnv.nodeEnv, 'production');
assert.equal(validEnv.supabaseUrl, 'https://example.supabase.co');
assert.equal(validEnv.pixelStreamingRoutesEnabled, true);
assert.equal(validEnv.signalingStatusBaseUrl, 'http://signaling');
assert.equal(validEnv.pixelStreamingStatusTimeoutMs, 2500);
assert.equal(validEnv.ue5SecretKey, 'ue5-secret');
assert.equal(validEnv.stripeSecretKey, 'stripe-secret');
assert.equal(validEnv.stripeWebhookSecret, 'stripe-webhook-secret');
assert.equal(validEnv.billingCheckoutSuccessUrl, 'https://example.com/billing/success');
assert.equal(validEnv.billingCheckoutCancelUrl, 'https://example.com/billing/cancel');
assert.equal(validEnv.billingPublicAppUrl, 'https://example.com');
assert.equal(validEnv.trustProxyHops, 1);
assert.equal(validEnv.publicLeadAbuse.rateLimit.maxRequests.expo, 7);
assert.equal(validEnv.publicLeadAbuse.rateLimit.maxRequests.calculator, 8);
assert.equal(validEnv.publicLeadAbuse.rateLimit.windowMs, 120000);
assert.equal(validEnv.publicLeadAbuse.duplicateWindowMs, 900000);
assert.equal(validEnv.publicLeadAbuse.turnstile.required, true);
assert.equal(validEnv.publicLeadAbuse.turnstile.secretKey, 'turnstile-secret');
assert.equal(validEnv.publicLeadAbuse.turnstile.timeoutMs, 3000);
assert.equal(validEnv.redisUrl, 'rediss://default:secret@cache.example.com:6379');
assert.deepEqual(validEnv.corsAllowedOrigins, [
  'https://www.30sek24.com',
  'https://preview.example.com',
]);

assert.throws(() => resolveBackendRuntimeEnv({
  NODE_ENV: 'production',
  PORT: '3000',
  SUPABASE_SERVICE_KEY: 'service-key',
  SIGNALING_STATUS_BASE_URL: 'http://signaling',
  PIXEL_STREAMING_STATUS_TIMEOUT_MS: '2500',
  UE5_SECRET_KEY: 'ue5-secret',
}), /BACKEND_ENV_MISSING:SUPABASE_URL/);

assert.throws(() => resolveBackendRuntimeEnv({
  NODE_ENV: 'production',
  PORT: '3000',
  BACKEND_TRUST_PROXY_HOPS: '-1',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_KEY: 'service-key',
}), /BACKEND_ENV_INVALID_NUMBER:BACKEND_TRUST_PROXY_HOPS/);

assert.throws(() => resolveBackendRuntimeEnv({
  NODE_ENV: 'production',
  PORT: '3000',
  BACKEND_CORS_ALLOWED_ORIGINS: 'https://www.30sek24.com/path',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_KEY: 'service-key',
}), /BACKEND_ENV_INVALID_ORIGIN:BACKEND_CORS_ALLOWED_ORIGINS/);

assert.throws(() => resolveBackendRuntimeEnv({
  NODE_ENV: 'production',
  PUBLIC_LEAD_TURNSTILE_REQUIRED: 'true',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_KEY: 'service-key',
}), /BACKEND_ENV_MISSING:PUBLIC_LEAD_TURNSTILE_SECRET_KEY/);

assert.throws(() => resolveBackendRuntimeEnv({
  NODE_ENV: 'production',
  PUBLIC_LEAD_RATE_LIMIT_WINDOW_MS: '0',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_KEY: 'service-key',
}), /BACKEND_ENV_INVALID_NUMBER:PUBLIC_LEAD_RATE_LIMIT_WINDOW_MS/);

assert.throws(() => resolveBackendRuntimeEnv({
  NODE_ENV: 'production',
  REDIS_URL: 'redis://cache.example.com:6379',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_KEY: 'service-key',
}), /REDIS_URL_PLAINTEXT_REMOTE_FORBIDDEN/);

assert.throws(() => resolveBackendRuntimeEnv({
  NODE_ENV: 'production',
  REDIS_URL: 'redis://example.upstash.io:6379',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_KEY: 'service-key',
}), /REDIS_URL_TLS_REQUIRED/);

assert.equal(resolveBackendRuntimeEnv({
  NODE_ENV: 'production',
  REDIS_URL: 'redis://redis:6379',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_KEY: 'service-key',
}).redisUrl, 'redis://redis:6379');

assert.throws(() => resolveBackendRuntimeEnv({
  NODE_ENV: 'production',
  PORT: '3000',
  PIXEL_STREAMING_ROUTES_ENABLED: 'true',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_KEY: 'service-key',
  PIXEL_STREAMING_STATUS_TIMEOUT_MS: '2500',
  UE5_SECRET_KEY: 'ue5-secret',
}), /BACKEND_ENV_MISSING:SIGNALING_STATUS_BASE_URL/);

assert.throws(() => resolveBackendRuntimeEnv({
  NODE_ENV: 'production',
  PORT: '3000',
  PIXEL_STREAMING_ROUTES_ENABLED: 'true',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_KEY: 'service-key',
  SIGNALING_STATUS_BASE_URL: 'http://signaling',
  PIXEL_STREAMING_STATUS_TIMEOUT_MS: '2500',
}), /BACKEND_ENV_MISSING:UE5_SECRET_KEY/);

assert.throws(() => resolveBackendRuntimeEnv({
  NODE_ENV: 'production',
  PORT: '3000',
  PIXEL_STREAMING_ROUTES_ENABLED: 'true',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_KEY: 'service-key',
  SIGNALING_STATUS_BASE_URL: 'ws://signaling',
  PIXEL_STREAMING_STATUS_TIMEOUT_MS: '2500',
  UE5_SECRET_KEY: 'ue5-secret',
}), /BACKEND_ENV_INVALID_PROTOCOL:SIGNALING_STATUS_BASE_URL/);
