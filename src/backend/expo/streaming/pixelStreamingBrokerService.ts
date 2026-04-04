export type PixelStreamingBrokerSignalingStatus = 'signaling_up' | 'signaling_down' | 'unknown';
export type PixelStreamingBrokerStreamerStatus = 'streamer_available' | 'streamer_unavailable' | 'unknown';
export type PixelStreamingBrokerTurnIceStatus = 'turn_configured' | 'turn_not_configured' | 'turn_unknown';
export type PixelStreamingBrokerReadinessStatus = 'session_ready' | 'session_not_ready' | 'unknown';

export interface PixelStreamingBrokerSessionContract {
  sessionMode: 'single_instance';
  selectionPolicy: 'first_available' | 'booth_preferred';
  activeStreamerId: string | null;
}

export interface PixelStreamingBrokerStatus {
  signaling: PixelStreamingBrokerSignalingStatus;
  streamer: PixelStreamingBrokerStreamerStatus;
  turn_ice: PixelStreamingBrokerTurnIceStatus;
  readiness: PixelStreamingBrokerReadinessStatus;
  checkedAt: string;
  warnings: string[];
  streamerCount: number | null;
  gatewayReachable: boolean;
  session: PixelStreamingBrokerSessionContract;
}

export interface PixelStreamingBrokerRequest {
  boothId?: string | null;
  slug?: string | null;
  streamingLevel?: string | null;
  allowSharedFallback?: boolean;
}

export interface PixelStreamingStreamerSlot {
  streamerId: string;
  boothId?: string | null;
  slug?: string | null;
  streamingLevel?: string | null;
  ready?: boolean;
  signaling?: boolean;
  gatewayReachable?: boolean;
  shared?: boolean;
}

function normalizeToken(value: string | null | undefined) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function hasBoothContext(request: PixelStreamingBrokerRequest) {
  return Boolean(request.boothId || request.slug || request.streamingLevel);
}

function slotMatchesToken(slotValue: string | null | undefined, requestValue: string | null | undefined) {
  const normalizedSlotValue = normalizeToken(slotValue);
  const normalizedRequestValue = normalizeToken(requestValue);
  return Boolean(normalizedSlotValue && normalizedRequestValue && normalizedSlotValue === normalizedRequestValue);
}

function scoreStreamerSlot(slot: PixelStreamingStreamerSlot, request: PixelStreamingBrokerRequest) {
  if (slotMatchesToken(slot.streamingLevel, request.streamingLevel)) {
    return 400;
  }
  if (slotMatchesToken(slot.boothId, request.boothId)) {
    return 300;
  }
  if (slotMatchesToken(slot.slug, request.slug)) {
    return 200;
  }
  if (slot.shared) {
    return 100;
  }
  return 0;
}

function sortSlotsByResolutionPriority(slots: PixelStreamingStreamerSlot[], request: PixelStreamingBrokerRequest) {
  return [...slots].sort((left, right) => scoreStreamerSlot(right, request) - scoreStreamerSlot(left, request));
}

export function resolvePixelStreamingBrokerSlot(
  request: PixelStreamingBrokerRequest,
  slots: PixelStreamingStreamerSlot[]
) {
  const sortedSlots = sortSlotsByResolutionPriority(slots, request);
  const preferredSlot = sortedSlots.find((slot) => scoreStreamerSlot(slot, request) >= 200 && slot.ready !== false);

  if (preferredSlot) {
    return {
      slot: preferredSlot,
      selectionPolicy: 'booth_preferred' as const,
      matched: true,
    };
  }

  if (request.allowSharedFallback !== false) {
    const sharedSlot = sortedSlots.find((slot) => slot.shared && slot.ready !== false);
    if (sharedSlot) {
      return {
        slot: sharedSlot,
        selectionPolicy: 'first_available' as const,
        matched: false,
      };
    }
  }

  return {
    slot: null,
    selectionPolicy: hasBoothContext(request) ? ('booth_preferred' as const) : ('first_available' as const),
    matched: false,
  };
}

export function buildPixelStreamingBrokerStatus(
  request: PixelStreamingBrokerRequest,
  slots: PixelStreamingStreamerSlot[],
  options?: {
    signaling?: boolean;
    gatewayReachable?: boolean;
    turnIce?: PixelStreamingBrokerTurnIceStatus;
    checkedAt?: string;
  }
): PixelStreamingBrokerStatus {
  const signaling = options?.signaling ?? true;
  const gatewayReachable = options?.gatewayReachable ?? signaling;
  const turnIce = options?.turnIce ?? 'turn_configured';
  const resolution = resolvePixelStreamingBrokerSlot(request, slots);
  const activeSlot = resolution.slot;

  return {
    signaling: signaling ? 'signaling_up' : 'signaling_down',
    streamer: activeSlot ? 'streamer_available' : 'streamer_unavailable',
    turn_ice: turnIce,
    readiness: activeSlot ? 'session_ready' : 'session_not_ready',
    checkedAt: options?.checkedAt ?? new Date().toISOString(),
    warnings: activeSlot
      ? resolution.selectionPolicy === 'first_available'
        ? ['FALLBACK_SHARED_STREAM']
        : []
      : ['NO_MATCHING_STREAM_SLOT'],
    streamerCount: slots.length,
    gatewayReachable,
    session: {
      sessionMode: 'single_instance',
      selectionPolicy: resolution.selectionPolicy,
      activeStreamerId: activeSlot?.streamerId ?? null,
    },
  };
}
