import { getFrontendRuntimeEnv } from '../../../config/runtimeEnv';
import { reportExpoDevError } from '../lib/devErrorReporter';

export type PixelStreamingAvailability = 'connecting' | 'available' | 'degraded' | 'unavailable';
export type PixelStreamingSignalingStatus = 'signaling_up' | 'signaling_down' | 'unknown';
export type PixelStreamingStreamerStatus = 'streamer_available' | 'streamer_unavailable' | 'unknown';
export type PixelStreamingTurnIceStatus = 'turn_configured' | 'turn_not_configured' | 'turn_unknown';
export type PixelStreamingReadinessStatus = 'session_ready' | 'session_not_ready' | 'unknown';

export interface PixelStreamingSessionContract {
  sessionMode: 'single_instance';
  selectionPolicy: 'first_available' | 'booth_preferred';
  activeStreamerId: string | null;
}

export interface PixelStreamingBoothContext {
  boothId?: string | null;
  slugOrId?: string | null;
  streamingLevel?: string | null;
}

export interface PixelStreamingRuntimeStatus {
  signaling: PixelStreamingSignalingStatus;
  streamer: PixelStreamingStreamerStatus;
  turn_ice: PixelStreamingTurnIceStatus;
  readiness: PixelStreamingReadinessStatus;
  checkedAt: string;
  warnings: string[];
  streamerCount: number | null;
  gatewayReachable: boolean;
  session: PixelStreamingSessionContract;
}

export interface PixelStreamingSessionReservationResponse {
  boothId: string | null;
  sessionId: string | null;
  streamerId: string | null;
  status: 'ready' | 'pending';
  selectionPolicy: 'first_available' | 'booth_preferred';
  expiresAt: string | null;
  warnings: string[];
  runtimeStatus: PixelStreamingRuntimeStatus;
}

export interface PixelStreamingRuntimeConfig {
  boothContext?: PixelStreamingBoothContext;
  signalingUrl: string | null;
  statusEndpointUrl: string;
  sessionEndpointUrl: string;
  iceServers: unknown[];
  probeTimeoutMs: number;
}

const DEFAULT_PROBE_TIMEOUT_MS = 2500;

function getBrowserSignalingUrl() {
  return getFrontendRuntimeEnv().signalingUrl;
}

export function buildPixelStreamingStatusEndpointUrl(apiBaseUrl: string, boothContext?: PixelStreamingBoothContext) {
  const url = new URL(`${apiBaseUrl}/api/pixel-streaming/status`);
  if (boothContext?.boothId) {
    url.searchParams.set('boothId', boothContext.boothId);
  }
  if (boothContext?.slugOrId) {
    url.searchParams.set('slug', boothContext.slugOrId);
  }
  if (boothContext?.streamingLevel) {
    url.searchParams.set('streamingLevel', boothContext.streamingLevel);
  }
  return url.toString();
}

function getBrowserStatusEndpointUrl(boothContext?: PixelStreamingBoothContext) {
  const apiBaseUrl =
    (import.meta as { env?: { DEV?: boolean } }).env?.DEV && typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.hostname}:3000`
      : getFrontendRuntimeEnv().apiBaseUrl;

  return buildPixelStreamingStatusEndpointUrl(apiBaseUrl, boothContext);
}

function getBrowserSessionEndpointUrl() {
  const apiBaseUrl =
    (import.meta as { env?: { DEV?: boolean } }).env?.DEV && typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.hostname}:3000`
      : getFrontendRuntimeEnv().apiBaseUrl;

  return `${apiBaseUrl}/api/pixel-streaming/session`;
}

function resolveTurnIceStatusFromIceServers(iceServers: unknown[]): PixelStreamingTurnIceStatus {
  if (!Array.isArray(iceServers)) {
    return 'turn_unknown';
  }

  if (iceServers.length === 0) {
    return 'turn_not_configured';
  }

  const hasTurn = iceServers.some((server) => {
    if (typeof server !== 'object' || server === null) {
      return false;
    }

    const urlsValue = (server as { urls?: string | string[] }).urls;
    const urls = Array.isArray(urlsValue) ? urlsValue : [urlsValue];
    return urls.some((url) => typeof url === 'string' && (url.startsWith('turn:') || url.startsWith('turns:')));
  });

  return hasTurn ? 'turn_configured' : 'turn_not_configured';
}

export function getPixelStreamingRuntimeConfig(boothContext?: PixelStreamingBoothContext): PixelStreamingRuntimeConfig {
  const frontendRuntimeEnv = getFrontendRuntimeEnv();
  const iceServers: Array<Record<string, unknown>> = [];

  if (frontendRuntimeEnv.stunServerUrls.length > 0) {
    iceServers.push({ urls: frontendRuntimeEnv.stunServerUrls });
  }

  if (frontendRuntimeEnv.turnServerUrls.length > 0) {
    const turnServer: Record<string, unknown> = { urls: frontendRuntimeEnv.turnServerUrls };

    if (frontendRuntimeEnv.turnUsername && frontendRuntimeEnv.turnPassword) {
      turnServer.username = frontendRuntimeEnv.turnUsername;
      turnServer.credential = frontendRuntimeEnv.turnPassword;
    }

    iceServers.push(turnServer);
  }

  return {
    boothContext,
    signalingUrl: getBrowserSignalingUrl(),
    statusEndpointUrl: getBrowserStatusEndpointUrl(boothContext),
    sessionEndpointUrl: getBrowserSessionEndpointUrl(),
    iceServers,
    probeTimeoutMs: frontendRuntimeEnv.pixelStreamingProbeTimeoutMs || DEFAULT_PROBE_TIMEOUT_MS,
  };
}

export async function fetchPixelStreamingRuntimeStatus(config: PixelStreamingRuntimeConfig): Promise<PixelStreamingRuntimeStatus> {
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), config.probeTimeoutMs);

  try {
    const response = await fetch(config.statusEndpointUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`STATUS_HTTP_${response.status}`);
    }

    return await response.json() as PixelStreamingRuntimeStatus;
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}

export function isPixelStreamingStatusFetchFallbackError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  if (error.name === 'AbortError') {
    return true;
  }

  return error instanceof TypeError
    && /failed to fetch|fetch failed|networkerror/i.test(error.message);
}

export function buildFallbackPixelStreamingRuntimeStatus(
  signalingReachable: boolean,
  config: PixelStreamingRuntimeConfig
): PixelStreamingRuntimeStatus {
  const turnIceStatus = resolveTurnIceStatusFromIceServers(config.iceServers);
  const signalingConfigured = Boolean(config.signalingUrl);

  return {
    signaling: signalingConfigured && signalingReachable ? 'signaling_up' : 'signaling_down',
    streamer: 'unknown',
    turn_ice: turnIceStatus,
    readiness: signalingConfigured && signalingReachable ? 'session_not_ready' : 'unknown',
    checkedAt: new Date().toISOString(),
    warnings: [
      'STATUS_ENDPOINT_UNAVAILABLE',
      ...(signalingConfigured ? ['USING_WEBSOCKET_FALLBACK'] : ['SIGNALING_URL_NOT_CONFIGURED']),
      ...(turnIceStatus === 'turn_not_configured' ? ['TURN_NOT_CONFIGURED'] : []),
      ...(turnIceStatus === 'turn_unknown' ? ['TURN_CONFIGURATION_UNKNOWN'] : []),
    ],
    streamerCount: null,
    gatewayReachable: signalingConfigured && signalingReachable,
    session: {
      sessionMode: 'single_instance',
      selectionPolicy: config.boothContext ? 'booth_preferred' : 'first_available',
      activeStreamerId: null
    }
  };
}

export async function reservePixelStreamingSession(
  config: PixelStreamingRuntimeConfig,
  payload: {
    boothId?: string | null;
    slug?: string | null;
    streamingLevel?: string | null;
    sessionId?: string | null;
    allowSharedFallback?: boolean;
  }
): Promise<PixelStreamingSessionReservationResponse> {
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), config.probeTimeoutMs);

  try {
    const response = await fetch(config.sessionEndpointUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`SESSION_HTTP_${response.status}`);
    }

    return await response.json() as PixelStreamingSessionReservationResponse;
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}

export function derivePixelStreamingAvailability(status: PixelStreamingRuntimeStatus | null): PixelStreamingAvailability {
  if (!status) {
    return 'connecting';
  }

  if (status.readiness === 'session_ready' && status.streamer === 'streamer_available') {
    return 'available';
  }

  if (status.signaling === 'signaling_up' || status.gatewayReachable) {
    return 'degraded';
  }

  return 'unavailable';
}

export function probePixelStreamingAvailability(config: PixelStreamingRuntimeConfig): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof WebSocket === 'undefined' || !config.signalingUrl) {
      resolve(false);
      return;
    }

    let settled = false;
    let socket: WebSocket | null = null;

    const finish = (result: boolean) => {
      if (settled) return;
      settled = true;
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close(1000, 'health-check-complete');
      } else if (socket && socket.readyState === WebSocket.CONNECTING) {
        socket.close();
      }
      resolve(result);
    };

    const timeoutId = window.setTimeout(() => finish(false), config.probeTimeoutMs);

    try {
      socket = new WebSocket(config.signalingUrl);
      socket.onopen = () => {
        window.clearTimeout(timeoutId);
        finish(true);
      };
      socket.onerror = () => {
        window.clearTimeout(timeoutId);
        finish(false);
      };
      socket.onclose = (event) => {
        window.clearTimeout(timeoutId);
        finish(event.wasClean && event.code === 1000);
      };
    } catch (error) {
      reportExpoDevError('probePixelStreamingAvailability', error, {
        signalingUrl: config.signalingUrl,
      });
      window.clearTimeout(timeoutId);
      finish(false);
    }
  });
}
