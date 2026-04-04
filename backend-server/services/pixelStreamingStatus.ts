import { getBackendRuntimeEnv } from '../config/runtimeEnv.js';

export type PixelStreamingSignalingStatus = 'signaling_up' | 'signaling_down' | 'unknown';
export type PixelStreamingStreamerStatus = 'streamer_available' | 'streamer_unavailable' | 'unknown';
export type PixelStreamingTurnIceStatus = 'turn_configured' | 'turn_not_configured' | 'turn_unknown';
export type PixelStreamingReadinessStatus = 'session_ready' | 'session_not_ready' | 'unknown';

export interface PixelStreamingSessionContract {
  sessionMode: 'single_instance';
  selectionPolicy: 'first_available' | 'booth_preferred';
  activeStreamerId: string | null;
}

export interface PixelStreamingStatusResponse {
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

interface SignalingStatusPayload {
  uptime?: number;
  streamer_count?: number;
  player_count?: number;
  version?: string;
}

interface SignalingStreamerPayload {
  streamerId?: string;
  streaming?: boolean;
  ready?: boolean;
  boothId?: string;
  slug?: string;
  streamingLevel?: string;
  shared?: boolean;
}

interface SignalingConfigPayload {
  config?: {
    peerOptions?: unknown;
  };
  protocolConfig?: unknown;
}

const SIGNALING_STATUS_PATHS = ['/api/status', '/status'] as const;
const SIGNALING_STREAMERS_PATHS = ['/api/streamers', '/streamers'] as const;
const SIGNALING_CONFIG_PATHS = ['/api/config', '/config'] as const;

export interface PixelStreamingStatusRequestContext {
  boothId?: string | null;
  slug?: string | null;
  streamingLevel?: string | null;
  allowSharedFallback?: boolean;
}

function getStatusBaseUrl() {
  return getBackendRuntimeEnv().signalingStatusBaseUrl;
}

function getTimeoutMs() {
  return getBackendRuntimeEnv().pixelStreamingStatusTimeoutMs;
}

function normalizeToken(value: string | null | undefined) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function hasBoothContext(context?: PixelStreamingStatusRequestContext) {
  return Boolean(context?.boothId || context?.slug || context?.streamingLevel);
}

function slotMatchesToken(slotValue: string | null | undefined, requestValue: string | null | undefined) {
  const normalizedSlotValue = normalizeToken(slotValue);
  const normalizedRequestValue = normalizeToken(requestValue);
  return Boolean(normalizedSlotValue && normalizedRequestValue && normalizedSlotValue === normalizedRequestValue);
}

function scoreStreamerSlot(slot: SignalingStreamerPayload, context?: PixelStreamingStatusRequestContext) {
  if (!context) {
    return slot.streaming ? 100 : 0;
  }
  if (slotMatchesToken(slot.streamingLevel, context.streamingLevel)) {
    return 400;
  }
  if (slotMatchesToken(slot.boothId, context.boothId)) {
    return 300;
  }
  if (slotMatchesToken(slot.slug, context.slug)) {
    return 200;
  }
  if (slot.shared) {
    return 100;
  }
  return slot.streaming ? 50 : 0;
}

function sortSlotsByResolutionPriority(slots: SignalingStreamerPayload[], context?: PixelStreamingStatusRequestContext) {
  return [...slots].sort((left, right) => scoreStreamerSlot(right, context) - scoreStreamerSlot(left, context));
}

function resolveStreamerSelection(
  streamersPayload: SignalingStreamerPayload[] | null,
  context?: PixelStreamingStatusRequestContext
) {
  if (!Array.isArray(streamersPayload) || streamersPayload.length === 0) {
    return {
      activeStreamer: null,
      selectionPolicy: hasBoothContext(context) ? ('booth_preferred' as const) : ('first_available' as const),
      usedSharedFallback: false,
    };
  }

  const sortedSlots = sortSlotsByResolutionPriority(streamersPayload, context);
  const preferredSlot = sortedSlots.find((slot) => scoreStreamerSlot(slot, context) >= 200 && slot.ready !== false);
  if (preferredSlot) {
    return {
      activeStreamer: preferredSlot,
      selectionPolicy: 'booth_preferred' as const,
      usedSharedFallback: false,
    };
  }

  if (context?.allowSharedFallback !== false) {
    const sharedSlot = sortedSlots.find((slot) => slot.shared && slot.ready !== false);
    if (sharedSlot) {
      return {
        activeStreamer: sharedSlot,
        selectionPolicy: 'first_available' as const,
        usedSharedFallback: true,
      };
    }
  }

  const firstStreamingSlot = sortedSlots.find((slot) => slot.streaming && slot.ready !== false);
  if (firstStreamingSlot && !hasBoothContext(context)) {
    return {
      activeStreamer: firstStreamingSlot,
      selectionPolicy: 'first_available' as const,
      usedSharedFallback: false,
    };
  }

  return {
    activeStreamer: null,
    selectionPolicy: hasBoothContext(context) ? ('booth_preferred' as const) : ('first_available' as const),
    usedSharedFallback: false,
  };
}

async function fetchJson<T>(pathname: string): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), getTimeoutMs());

  try {
    const response = await fetch(`${getStatusBaseUrl()}${pathname}`, {
      method: 'GET',
      signal: controller.signal,
      headers: { Accept: 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`HTTP_${response.status}`);
    }

    return await response.json() as T;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchJsonWithFallback<T>(pathnames: readonly string[]): Promise<T> {
  let lastError: Error | null = null;

  for (const pathname of pathnames) {
    try {
      return await fetchJson<T>(pathname);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('unknown_error');
    }
  }

  throw lastError || new Error('SIGNALING_ENDPOINTS_UNAVAILABLE');
}

function parseIceServers(input: unknown): Array<{ urls?: string | string[] }> {
  if (!input) return [];

  if (typeof input === 'string') {
    try {
      return parseIceServers(JSON.parse(input));
    } catch {
      return [];
    }
  }

  if (Array.isArray(input)) {
    return input.filter((item) => typeof item === 'object' && item !== null) as Array<{ urls?: string | string[] }>;
  }

  if (typeof input === 'object' && input !== null) {
    const candidate = input as { iceServers?: unknown };
    if (Array.isArray(candidate.iceServers)) {
      return parseIceServers(candidate.iceServers);
    }
  }

  return [];
}

function getTurnIceStatus(configPayload: SignalingConfigPayload | null): PixelStreamingTurnIceStatus {
  if (!configPayload) {
    return 'turn_unknown';
  }

  const iceServers = parseIceServers(configPayload?.config?.peerOptions);
  if (iceServers.length === 0) {
    return 'turn_not_configured';
  }

  const hasTurn = iceServers.some((server) => {
    const urls = Array.isArray(server.urls) ? server.urls : [server.urls];
    return urls.some((url) => typeof url === 'string' && (url.startsWith('turn:') || url.startsWith('turns:')));
  });

  return hasTurn ? 'turn_configured' : 'turn_not_configured';
}

export async function getPixelStreamingStatus(context?: PixelStreamingStatusRequestContext): Promise<PixelStreamingStatusResponse> {
  const checkedAt = new Date().toISOString();
  const warnings: string[] = [];

  let statusPayload: SignalingStatusPayload | null = null;
  let streamersPayload: SignalingStreamerPayload[] | null = null;
  let configPayload: SignalingConfigPayload | null = null;

  try {
    [statusPayload, streamersPayload, configPayload] = await Promise.all([
      fetchJsonWithFallback<SignalingStatusPayload>(SIGNALING_STATUS_PATHS),
      fetchJsonWithFallback<SignalingStreamerPayload[]>(SIGNALING_STREAMERS_PATHS),
      fetchJsonWithFallback<SignalingConfigPayload>(SIGNALING_CONFIG_PATHS)
    ]);
  } catch (error) {
    warnings.push(`SIGNALING_STATUS_FETCH_FAILED:${error instanceof Error ? error.message : 'unknown_error'}`);
  }

  const gatewayReachable = Boolean(statusPayload);
  const streamerCount = typeof statusPayload?.streamer_count === 'number'
    ? statusPayload.streamer_count
    : Array.isArray(streamersPayload)
      ? streamersPayload.length
      : null;

  const streamerSelection = resolveStreamerSelection(streamersPayload, context);
  const activeStreamer = streamerSelection.activeStreamer;

  const signaling: PixelStreamingSignalingStatus = gatewayReachable ? 'signaling_up' : 'signaling_down';
  const streamer: PixelStreamingStreamerStatus = Array.isArray(streamersPayload)
    ? activeStreamer
      ? 'streamer_available'
      : 'streamer_unavailable'
    : 'unknown';
  const turn_ice = getTurnIceStatus(configPayload);
  const readiness: PixelStreamingReadinessStatus =
    signaling === 'signaling_up' && streamer === 'streamer_available'
      ? 'session_ready'
      : signaling === 'signaling_up'
        ? 'session_not_ready'
        : 'unknown';

  if (turn_ice === 'turn_unknown') {
    warnings.push('TURN_CONFIGURATION_UNKNOWN');
  } else if (turn_ice === 'turn_not_configured') {
    warnings.push('TURN_NOT_CONFIGURED');
  }

  if (streamer === 'streamer_unavailable') {
    warnings.push('NO_ACTIVE_STREAMER');
  }
  if (streamerSelection.usedSharedFallback) {
    warnings.push('FALLBACK_SHARED_STREAM');
  }

  return {
    signaling,
    streamer,
    turn_ice,
    readiness,
    checkedAt,
    warnings,
    streamerCount,
    gatewayReachable,
    session: {
      sessionMode: 'single_instance',
      selectionPolicy: streamerSelection.selectionPolicy,
      activeStreamerId: activeStreamer?.streamerId || null
    }
  };
}
