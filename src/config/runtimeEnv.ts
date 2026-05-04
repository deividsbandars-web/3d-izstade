export type FrontendRuntimeEnv = {
  apiBaseUrl: string;
  signalingUrl: string | null;
  supabaseUrl: string;
  supabaseAnonKey: string;
  stunServerUrls: string[];
  turnServerUrls: string[];
  turnUsername: string | null;
  turnPassword: string | null;
  pixelStreamingProbeTimeoutMs: number;
};

type RawFrontendEnv = {
  DEV?: boolean;
  PROD?: boolean;
  MODE?: string;
  VITE_PUBLIC_API_BASE_URL?: string;
  VITE_SIGNALING_SERVER_URL?: string;
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  VITE_STUN_SERVER_URLS?: string;
  VITE_TURN_SERVER_URLS?: string;
  VITE_TURN_USERNAME?: string;
  VITE_TURN_PASSWORD?: string;
  VITE_PIXEL_STREAMING_PROBE_TIMEOUT_MS?: string;
};

const DEFAULT_PROBE_TIMEOUT_MS = 2500;
const DUMMY_SUPABASE_URL = 'https://dummy-fallback.supabase.co';
const DUMMY_SUPABASE_ANON_KEY = 'dummy-key';
const HOSTED_SUPABASE_URL = 'https://gbmxrposlrhctyaaznmj.supabase.co';
const HOSTED_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdibXhycG9zbHJoY3R5YWF6bm1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzMjc2ODksImV4cCI6MjA4NzkwMzY4OX0.lnyEDbyF3Gw2JtAMN8LvwFWIB527_ryIiPZwFohIBaw';

function normalizeRequiredString(value: string | undefined, key: string) {
  const normalized = value?.trim();
  if (!normalized) {
    throw new Error(`FRONTEND_ENV_MISSING:${key}`);
  }
  return normalized;
}

function normalizeOptionalString(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function normalizeUrl(value: string, key: string, allowedProtocols: string[]) {
  let parsed: URL;

  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`FRONTEND_ENV_INVALID_URL:${key}`);
  }

  if (!allowedProtocols.includes(parsed.protocol)) {
    throw new Error(`FRONTEND_ENV_INVALID_PROTOCOL:${key}`);
  }

  return parsed.toString().replace(/\/+$/, '');
}

function parseUrlList(rawValue: string | undefined) {
  if (!rawValue?.trim()) {
    return [];
  }

  return rawValue
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

function normalizeProbeTimeout(rawValue: string | undefined) {
  if (!rawValue?.trim()) {
    return DEFAULT_PROBE_TIMEOUT_MS;
  }

  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error('FRONTEND_ENV_INVALID_NUMBER:VITE_PIXEL_STREAMING_PROBE_TIMEOUT_MS');
  }

  return parsed;
}

function deriveDevApiBaseUrl() {
  if (typeof window === 'undefined') {
    return null;
  }

  const hostname = resolveWindowHostname();
  if (!hostname) {
    return null;
  }

  return `${window.location.protocol}//${hostname}:3000`;
}

function resolveWindowHostname() {
  if (typeof window === 'undefined') {
    return null;
  }

  const directHostname = window.location?.hostname?.trim();
  if (directHostname) {
    return directHostname;
  }

  const hostValue = window.location?.host?.trim();
  if (hostValue) {
    return hostValue.split(':')[0] ?? null;
  }

  const href = window.location?.href?.trim();
  if (href) {
    try {
      return new URL(href).hostname;
    } catch {
      return null;
    }
  }

  return null;
}

function deriveHostedApiBaseUrl() {
  if (typeof window === 'undefined') {
    return null;
  }

  const resolvedHostname = resolveWindowHostname();
  if (!resolvedHostname) {
    return null;
  }

  const hostname = resolvedHostname.toLowerCase();
  if (hostname === 'staging.30sek24.com') {
    return 'https://api-staging.30sek24.com';
  }
  if (hostname === 'www.30sek24.com' || hostname === '30sek24.com') {
    return 'https://api.30sek24.com';
  }

  return null;
}

function deriveHostedSupabaseUrl() {
  if (typeof window === 'undefined') {
    return null;
  }

  const resolvedHostname = resolveWindowHostname();
  if (!resolvedHostname) {
    return null;
  }

  const hostname = resolvedHostname.toLowerCase();
  if (hostname === 'staging.30sek24.com') {
    return HOSTED_SUPABASE_URL;
  }
  if (hostname === 'www.30sek24.com' || hostname === '30sek24.com') {
    return HOSTED_SUPABASE_URL;
  }

  return null;
}

function deriveHostedSupabaseAnonKey() {
  if (typeof window === 'undefined') {
    return null;
  }

  const resolvedHostname = resolveWindowHostname();
  if (!resolvedHostname) {
    return null;
  }

  const hostname = resolvedHostname.toLowerCase();
  if (hostname === 'staging.30sek24.com') {
    return HOSTED_SUPABASE_ANON_KEY;
  }
  if (hostname === 'www.30sek24.com' || hostname === '30sek24.com') {
    return HOSTED_SUPABASE_ANON_KEY;
  }

  return null;
}

function isLocalDevWindow() {
  const hostname = resolveWindowHostname();
  if (!hostname) {
    return false;
  }

  return hostname === 'localhost' || hostname === '127.0.0.1';
}

function deriveDevSignalingUrl() {
  if (typeof window === 'undefined') {
    return null;
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws/`;
}

export function resolveFrontendRuntimeEnv(rawEnv: RawFrontendEnv): FrontendRuntimeEnv {
  const useLocalDevOverrides = Boolean(rawEnv.DEV && isLocalDevWindow());
  const hostedApiBaseUrl = !rawEnv.DEV ? deriveHostedApiBaseUrl() ?? undefined : undefined;
  const hostedSupabaseUrl = !rawEnv.DEV ? deriveHostedSupabaseUrl() ?? undefined : undefined;
  const hostedSupabaseAnonKey = !rawEnv.DEV ? deriveHostedSupabaseAnonKey() ?? undefined : undefined;
  const apiBaseUrlRaw = useLocalDevOverrides
    ? deriveDevApiBaseUrl() ?? undefined
    : rawEnv.VITE_PUBLIC_API_BASE_URL || hostedApiBaseUrl || (rawEnv.DEV ? deriveDevApiBaseUrl() ?? undefined : undefined);
  const signalingUrlRaw = useLocalDevOverrides
    ? deriveDevSignalingUrl() ?? undefined
    : rawEnv.VITE_SIGNALING_SERVER_URL || (rawEnv.DEV ? deriveDevSignalingUrl() ?? undefined : undefined);
  const apiBaseUrl = normalizeUrl(
    normalizeRequiredString(apiBaseUrlRaw, 'VITE_PUBLIC_API_BASE_URL'),
    'VITE_PUBLIC_API_BASE_URL',
    ['http:', 'https:']
  );
  const signalingUrl = signalingUrlRaw
    ? normalizeUrl(
      signalingUrlRaw,
      'VITE_SIGNALING_SERVER_URL',
      ['ws:', 'wss:']
    )
    : null;
  const supabaseUrlRaw = rawEnv.VITE_SUPABASE_URL || hostedSupabaseUrl || DUMMY_SUPABASE_URL;
  const supabaseAnonKeyRaw = rawEnv.VITE_SUPABASE_ANON_KEY || hostedSupabaseAnonKey || DUMMY_SUPABASE_ANON_KEY;
  const supabaseUrl = normalizeUrl(supabaseUrlRaw, 'VITE_SUPABASE_URL', ['http:', 'https:']);
  const supabaseAnonKey = supabaseAnonKeyRaw.trim();
  const stunServerUrls = parseUrlList(rawEnv.VITE_STUN_SERVER_URLS);
  const turnServerUrls = parseUrlList(rawEnv.VITE_TURN_SERVER_URLS);
  const turnUsername = normalizeOptionalString(rawEnv.VITE_TURN_USERNAME);
  const turnPassword = normalizeOptionalString(rawEnv.VITE_TURN_PASSWORD);

  if ((turnUsername && !turnPassword) || (!turnUsername && turnPassword)) {
    throw new Error('FRONTEND_ENV_INVALID_TURN_CREDENTIALS');
  }

  return {
    apiBaseUrl,
    signalingUrl,
    supabaseUrl,
    supabaseAnonKey,
    stunServerUrls,
    turnServerUrls,
    turnUsername,
    turnPassword,
    pixelStreamingProbeTimeoutMs: normalizeProbeTimeout(rawEnv.VITE_PIXEL_STREAMING_PROBE_TIMEOUT_MS),
  };
}

let cachedFrontendRuntimeEnv: FrontendRuntimeEnv | null = null;

export function getFrontendRuntimeEnv() {
  if (!cachedFrontendRuntimeEnv) {
    cachedFrontendRuntimeEnv = resolveFrontendRuntimeEnv(((import.meta as { env?: RawFrontendEnv }).env) ?? {});
  }

  return cachedFrontendRuntimeEnv;
}
