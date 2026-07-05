import assert from 'node:assert/strict';
import { resolveFrontendRuntimeEnv, resolveFrontendSupabaseAuthEnv } from '../config/runtimeEnv.js';

const validEnv = resolveFrontendRuntimeEnv({
  VITE_PUBLIC_API_BASE_URL: 'https://api.30sek24.com/',
  VITE_PUBLIC_APP_URL: 'https://staging.30sek24.com/',
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
assert.equal(validEnv.publicAppUrl, 'https://staging.30sek24.com');
assert.equal(validEnv.signalingUrl, 'wss://api.30sek24.com/ws');
assert.equal(validEnv.supabaseUrl, 'https://example.supabase.co');
assert.equal(validEnv.pixelStreamingProbeTimeoutMs, 3000);
assert.deepEqual(validEnv.stunServerUrls, ['stun:stun.example.com:3478']);
assert.deepEqual(validEnv.turnServerUrls, ['turn:turn.example.com:3478?transport=udp']);
assert.deepEqual(resolveFrontendSupabaseAuthEnv({
  VITE_SUPABASE_URL: 'https://example.supabase.co/',
  VITE_SUPABASE_ANON_KEY: 'anon-key',
}), {
  supabaseAnonKey: 'anon-key',
  supabaseUrl: 'https://example.supabase.co',
});

assert.throws(() => resolveFrontendRuntimeEnv({
  VITE_SIGNALING_SERVER_URL: 'wss://api.30sek24.com/ws/',
  VITE_SUPABASE_URL: 'https://example.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'anon-key',
}), /FRONTEND_ENV_MISSING:VITE_PUBLIC_API_BASE_URL/);

const derivedPublicAppEnv = resolveFrontendRuntimeEnv({
  VITE_PUBLIC_API_BASE_URL: 'https://api-staging.30sek24.com',
  VITE_SUPABASE_URL: 'https://example.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'anon-key',
});

assert.equal(derivedPublicAppEnv.publicAppUrl, 'https://staging.30sek24.com');

assert.throws(() => resolveFrontendRuntimeEnv({
  VITE_PUBLIC_API_BASE_URL: 'https://api.30sek24.com',
  VITE_SUPABASE_URL: 'https://example.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'anon-key',
  VITE_TURN_USERNAME: 'turn-user',
}), /FRONTEND_ENV_INVALID_TURN_CREDENTIALS/);

assert.throws(() => resolveFrontendSupabaseAuthEnv({}), /FRONTEND_SUPABASE_ENV_MISSING:VITE_SUPABASE_URL/);

const optionalSignalingEnv = resolveFrontendRuntimeEnv({
  VITE_PUBLIC_API_BASE_URL: 'https://api.30sek24.com',
  VITE_SUPABASE_URL: 'https://example.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'anon-key',
});

assert.equal(optionalSignalingEnv.signalingUrl, null);

const originalWindow = globalThis.window;
Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: {
    location: {
      host: '127.0.0.1:5173',
      origin: 'http://127.0.0.1:5173',
      protocol: 'http:',
    },
  },
});

const devFallbackEnv = resolveFrontendRuntimeEnv({
  DEV: true,
  VITE_SUPABASE_URL: 'https://example.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'anon-key',
});

assert.equal(devFallbackEnv.apiBaseUrl, 'http://127.0.0.1:3000');
assert.equal(devFallbackEnv.signalingUrl, 'ws://127.0.0.1:5173/ws');

Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: {
    location: {
      hostname: 'app-nibulzacr-esaukans-6934s-projects.vercel.app',
      host: 'app-nibulzacr-esaukans-6934s-projects.vercel.app',
      protocol: 'https:',
    },
  },
});

assert.throws(() => resolveFrontendRuntimeEnv({}), /FRONTEND_ENV_MISSING:VITE_PUBLIC_API_BASE_URL/);

Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: originalWindow,
});
