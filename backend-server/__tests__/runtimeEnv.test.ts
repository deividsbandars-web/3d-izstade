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

const validEnv = resolveBackendRuntimeEnv({
  NODE_ENV: 'production',
  PORT: '3000',
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
