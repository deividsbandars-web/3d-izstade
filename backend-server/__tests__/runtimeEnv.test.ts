import assert from 'node:assert/strict';
import { resolveBackendRuntimeEnv } from '../config/runtimeEnv.js';

const validEnv = resolveBackendRuntimeEnv({
  NODE_ENV: 'production',
  PORT: '3000',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_KEY: 'service-key',
  SIGNALING_STATUS_BASE_URL: 'http://signaling',
  PIXEL_STREAMING_STATUS_TIMEOUT_MS: '2500',
  UE5_SECRET_KEY: 'ue5-secret',
});

assert.equal(validEnv.port, 3000);
assert.equal(validEnv.nodeEnv, 'production');
assert.equal(validEnv.supabaseUrl, 'https://example.supabase.co');
assert.equal(validEnv.signalingStatusBaseUrl, 'http://signaling');
assert.equal(validEnv.pixelStreamingStatusTimeoutMs, 2500);

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
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_KEY: 'service-key',
  SIGNALING_STATUS_BASE_URL: 'ws://signaling',
  PIXEL_STREAMING_STATUS_TIMEOUT_MS: '2500',
  UE5_SECRET_KEY: 'ue5-secret',
}), /BACKEND_ENV_INVALID_PROTOCOL:SIGNALING_STATUS_BASE_URL/);
