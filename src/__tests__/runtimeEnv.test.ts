import assert from 'node:assert/strict';
import { resolveFrontendRuntimeEnv } from '../config/runtimeEnv.js';

const validEnv = resolveFrontendRuntimeEnv({
  VITE_PUBLIC_API_BASE_URL: 'https://api.30sek24.com/',
  VITE_SIGNALING_SERVER_URL: 'wss://api.30sek24.com/ws/',
  VITE_SUPABASE_URL: 'https://example.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'anon-key',
  VITE_STUN_SERVER_URLS: 'stun:stun.example.com:3478',
  VITE_TURN_SERVER_URLS: 'turn:turn.example.com:3478?transport=udp',
  VITE_TURN_USERNAME: 'turn-user',
  VITE_TURN_PASSWORD: 'turn-password',
  VITE_PIXEL_STREAMING_PROBE_TIMEOUT_MS: '3000',
});

assert.equal(validEnv.apiBaseUrl, 'https://api.30sek24.com');
assert.equal(validEnv.signalingUrl, 'wss://api.30sek24.com/ws');
assert.equal(validEnv.supabaseUrl, 'https://example.supabase.co');
assert.equal(validEnv.pixelStreamingProbeTimeoutMs, 3000);
assert.deepEqual(validEnv.stunServerUrls, ['stun:stun.example.com:3478']);
assert.deepEqual(validEnv.turnServerUrls, ['turn:turn.example.com:3478?transport=udp']);

assert.throws(() => resolveFrontendRuntimeEnv({
  VITE_SIGNALING_SERVER_URL: 'wss://api.30sek24.com/ws/',
  VITE_SUPABASE_URL: 'https://example.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'anon-key',
}), /FRONTEND_ENV_MISSING:VITE_PUBLIC_API_BASE_URL/);

assert.throws(() => resolveFrontendRuntimeEnv({
  VITE_PUBLIC_API_BASE_URL: 'https://api.30sek24.com',
  VITE_SIGNALING_SERVER_URL: 'wss://api.30sek24.com/ws/',
  VITE_SUPABASE_URL: 'https://example.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'anon-key',
  VITE_TURN_USERNAME: 'turn-user',
}), /FRONTEND_ENV_INVALID_TURN_CREDENTIALS/);
