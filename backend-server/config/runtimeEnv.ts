export type BackendRuntimeEnv = {
  nodeEnv: string;
  port: number;
  pixelStreamingRoutesEnabled: boolean;
  supabaseUrl: string;
  supabaseServiceKey: string;
  signalingStatusBaseUrl: string | null;
  pixelStreamingStatusTimeoutMs: number;
  ue5SecretKey: string | null;
};

type RawBackendEnv = Record<string, string | undefined>;

const DEFAULT_PORT = 3000;
const DEFAULT_TIMEOUT_MS = 2500;

function normalizeRequiredString(rawEnv: RawBackendEnv, key: string) {
  const normalized = rawEnv[key]?.trim();
  if (!normalized) {
    throw new Error(`BACKEND_ENV_MISSING:${key}`);
  }
  return normalized;
}

function normalizeOptionalString(rawEnv: RawBackendEnv, key: string) {
  return rawEnv[key]?.trim() || null;
}

function normalizeBooleanFlag(rawEnv: RawBackendEnv, key: string) {
  const normalized = rawEnv[key]?.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
}

function normalizePixelStreamingRoutesEnabled(rawEnv: RawBackendEnv) {
  return normalizeBooleanFlag(rawEnv, 'PIXEL_STREAMING_ROUTES_ENABLED')
    || normalizeBooleanFlag(rawEnv, 'PIXEL_STREAMING_ENABLED');
}

function normalizePort(rawEnv: RawBackendEnv) {
  const rawPort = rawEnv.PORT?.trim();
  if (!rawPort) {
    return DEFAULT_PORT;
  }

  const parsed = Number(rawPort);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error('BACKEND_ENV_INVALID_NUMBER:PORT');
  }

  return parsed;
}

function normalizeTimeout(rawEnv: RawBackendEnv) {
  const rawTimeout = rawEnv.PIXEL_STREAMING_STATUS_TIMEOUT_MS?.trim();
  if (!rawTimeout) {
    return DEFAULT_TIMEOUT_MS;
  }

  const parsed = Number(rawTimeout);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error('BACKEND_ENV_INVALID_NUMBER:PIXEL_STREAMING_STATUS_TIMEOUT_MS');
  }

  return parsed;
}

function normalizeUrl(value: string, key: string, allowedProtocols: string[]) {
  let parsed: URL;

  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`BACKEND_ENV_INVALID_URL:${key}`);
  }

  if (!allowedProtocols.includes(parsed.protocol)) {
    throw new Error(`BACKEND_ENV_INVALID_PROTOCOL:${key}`);
  }

  return parsed.toString().replace(/\/+$/, '');
}

export function resolveBackendRuntimeEnv(rawEnv: RawBackendEnv): BackendRuntimeEnv {
  const nodeEnv = rawEnv.NODE_ENV?.trim() || 'development';
  const pixelStreamingRoutesEnabled = normalizePixelStreamingRoutesEnabled(rawEnv);
  const supabaseUrl = normalizeUrl(
    normalizeRequiredString(rawEnv, 'SUPABASE_URL'),
    'SUPABASE_URL',
    ['http:', 'https:']
  );
  const rawSignalingStatusBaseUrl = pixelStreamingRoutesEnabled
    ? normalizeRequiredString(rawEnv, 'SIGNALING_STATUS_BASE_URL')
    : normalizeOptionalString(rawEnv, 'SIGNALING_STATUS_BASE_URL');
  const signalingStatusBaseUrl = rawSignalingStatusBaseUrl
    ? normalizeUrl(rawSignalingStatusBaseUrl, 'SIGNALING_STATUS_BASE_URL', ['http:', 'https:'])
    : null;

  return {
    nodeEnv,
    port: normalizePort(rawEnv),
    pixelStreamingRoutesEnabled,
    supabaseUrl,
    supabaseServiceKey: normalizeRequiredString(rawEnv, 'SUPABASE_SERVICE_KEY'),
    signalingStatusBaseUrl,
    pixelStreamingStatusTimeoutMs: normalizeTimeout(rawEnv),
    ue5SecretKey: pixelStreamingRoutesEnabled
      ? normalizeRequiredString(rawEnv, 'UE5_SECRET_KEY')
      : normalizeOptionalString(rawEnv, 'UE5_SECRET_KEY'),
  };
}

let cachedBackendRuntimeEnv: BackendRuntimeEnv | null = null;

export function getBackendRuntimeEnv() {
  if (!cachedBackendRuntimeEnv) {
    cachedBackendRuntimeEnv = resolveBackendRuntimeEnv(process.env);
  }

  return cachedBackendRuntimeEnv;
}
