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

  return `${window.location.protocol}//${window.location.hostname}:3000`;
}

function deriveDevSignalingUrl() {
  if (typeof window === 'undefined') {
    return null;
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws/`;
}

export function resolveFrontendRuntimeEnv(rawEnv: RawFrontendEnv): FrontendRuntimeEnv {
  const apiBaseUrlRaw = rawEnv.VITE_PUBLIC_API_BASE_URL || (rawEnv.DEV ? deriveDevApiBaseUrl() ?? undefined : undefined);
  const signalingUrlRaw = rawEnv.VITE_SIGNALING_SERVER_URL || (rawEnv.DEV ? deriveDevSignalingUrl() ?? undefined : undefined);
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
  const supabaseUrl = normalizeUrl(
    normalizeRequiredString(rawEnv.VITE_SUPABASE_URL, 'VITE_SUPABASE_URL'),
    'VITE_SUPABASE_URL',
    ['http:', 'https:']
  );
  const supabaseAnonKey = normalizeRequiredString(rawEnv.VITE_SUPABASE_ANON_KEY, 'VITE_SUPABASE_ANON_KEY');
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
