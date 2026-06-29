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
});

assert.equal(validEnv.port, 3000);
assert.equal(validEnv.nodeEnv, 'production');
assert.equal(validEnv.supabaseUrl, 'https://example.supabase.co');
assert.equal(validEnv.pixelStreamingRoutesEnabled, true);
assert.equal(validEnv.signalingStatusBaseUrl, 'http://signaling');
assert.equal(validEnv.pixelStreamingStatusTimeoutMs, 2500);
assert.equal(validEnv.ue5SecretKey, 'ue5-secret');

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
