export type PixelStreamingAvailability = 'connecting' | 'available' | 'unavailable';
export type PixelStreamingSignalingStatus = 'signaling_up' | 'signaling_down' | 'unknown';
export type PixelStreamingStreamerStatus = 'streamer_available' | 'streamer_unavailable' | 'unknown';
export type PixelStreamingTurnIceStatus = 'turn_configured' | 'turn_not_configured' | 'turn_unknown';
export type PixelStreamingReadinessStatus = 'session_ready' | 'session_not_ready' | 'unknown';

export interface PixelStreamingSessionContract {
  sessionMode: 'single_instance';
  selectionPolicy: 'first_available';
  activeStreamerId: string | null;
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

export interface PixelStreamingRuntimeConfig {
  signalingUrl: string;
  statusEndpointUrl: string;
  iceServers: unknown[];
  probeTimeoutMs: number;
}

const DEFAULT_PROBE_TIMEOUT_MS = 2500;

function getBrowserSignalingUrl() {
  if (typeof window === 'undefined') {
    return 'ws://localhost/ws/';
  }

  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${protocol}://${window.location.host}/ws/`;
}

function getBrowserStatusEndpointUrl() {
  if (typeof window === 'undefined') {
    return 'http://localhost/api/pixel-streaming/status';
  }

  return `${window.location.origin}/api/pixel-streaming/status`;
}

function parseIceServers(rawValue: string | undefined) {
  if (!rawValue?.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseEnvUrlList(rawValue: string | undefined) {
  if (!rawValue?.trim()) {
    return [];
  }

  return rawValue
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

function buildIceServersFromEnv() {
  const stunUrls = parseEnvUrlList(import.meta.env.VITE_STUN_SERVER_URLS);
  const turnUrls = parseEnvUrlList(import.meta.env.VITE_TURN_SERVER_URLS);
  const turnUsername = import.meta.env.VITE_TURN_USERNAME?.trim();
  const turnPassword = import.meta.env.VITE_TURN_PASSWORD?.trim();

  if (stunUrls.length === 0 && turnUrls.length === 0) {
    return [];
  }

  const iceServers: Array<Record<string, unknown>> = [];

  if (stunUrls.length > 0) {
    iceServers.push({ urls: stunUrls });
  }

  if (turnUrls.length > 0) {
    const turnServer: Record<string, unknown> = { urls: turnUrls };

    if (turnUsername && turnPassword) {
      turnServer.username = turnUsername;
      turnServer.credential = turnPassword;
    }

    iceServers.push(turnServer);
  }

  return iceServers;
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

export function getPixelStreamingRuntimeConfig(): PixelStreamingRuntimeConfig {
  const probeTimeoutMs = Number(import.meta.env.VITE_PIXEL_STREAMING_PROBE_TIMEOUT_MS) || DEFAULT_PROBE_TIMEOUT_MS;
  const envIceServers = buildIceServersFromEnv();

  return {
    signalingUrl: import.meta.env.VITE_SIGNALING_SERVER_URL?.trim() || getBrowserSignalingUrl(),
    statusEndpointUrl: getBrowserStatusEndpointUrl(),
    iceServers: envIceServers.length > 0 ? envIceServers : parseIceServers(import.meta.env.VITE_ICE_SERVERS),
    probeTimeoutMs,
  };
}

export async function fetchPixelStreamingRuntimeStatus(config: PixelStreamingRuntimeConfig): Promise<PixelStreamingRuntimeStatus> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), config.probeTimeoutMs);

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
    window.clearTimeout(timeoutId);
  }
}

export function buildFallbackPixelStreamingRuntimeStatus(
  signalingReachable: boolean,
  config: PixelStreamingRuntimeConfig
): PixelStreamingRuntimeStatus {
  const turnIceStatus = resolveTurnIceStatusFromIceServers(config.iceServers);

  return {
    signaling: signalingReachable ? 'signaling_up' : 'signaling_down',
    streamer: 'unknown',
    turn_ice: turnIceStatus,
    readiness: signalingReachable ? 'session_not_ready' : 'unknown',
    checkedAt: new Date().toISOString(),
    warnings: [
      'STATUS_ENDPOINT_UNAVAILABLE',
      'USING_WEBSOCKET_FALLBACK',
      ...(turnIceStatus === 'turn_not_configured' ? ['TURN_NOT_CONFIGURED'] : []),
      ...(turnIceStatus === 'turn_unknown' ? ['TURN_CONFIGURATION_UNKNOWN'] : []),
    ],
    streamerCount: null,
    gatewayReachable: signalingReachable,
    session: {
      sessionMode: 'single_instance',
      selectionPolicy: 'first_available',
      activeStreamerId: null
    }
  };
}

export function probePixelStreamingAvailability(config: PixelStreamingRuntimeConfig): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof WebSocket === 'undefined') {
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
    } catch {
      window.clearTimeout(timeoutId);
      finish(false);
    }
  });
}
