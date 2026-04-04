import { getPixelStreamingStatus, type PixelStreamingStatusRequestContext, type PixelStreamingStatusResponse } from './pixelStreamingStatus.js';

export interface PixelStreamingSessionReservationRequest extends PixelStreamingStatusRequestContext {
  sessionId?: string | null;
}

export interface PixelStreamingSessionReservationResponse {
  boothId: string | null;
  sessionId: string | null;
  streamerId: string | null;
  status: 'ready' | 'pending';
  selectionPolicy: 'first_available' | 'booth_preferred';
  expiresAt: string | null;
  warnings: string[];
  runtimeStatus: PixelStreamingStatusResponse;
}

interface PixelStreamingSessionReservationRecord {
  key: string;
  boothId: string | null;
  sessionId: string | null;
  streamerId: string;
  expiresAt: number;
}

const RESERVATION_TTL_MS = 5 * 60 * 1000;
const reservationStore = new Map<string, PixelStreamingSessionReservationRecord>();

function normalizeToken(value: string | null | undefined) {
  const normalized = String(value || '').trim();
  return normalized.length > 0 ? normalized : null;
}

function buildReservationKey(request: PixelStreamingSessionReservationRequest) {
  const boothId = normalizeToken(request.boothId);
  const sessionId = normalizeToken(request.sessionId);
  const slug = normalizeToken(request.slug);
  return [boothId || slug || 'unknown-booth', sessionId || 'anonymous-session'].join('::');
}

function pruneExpiredReservations(now = Date.now()) {
  for (const [key, reservation] of reservationStore.entries()) {
    if (reservation.expiresAt <= now) {
      reservationStore.delete(key);
    }
  }
}

function findActiveReservationByStreamerId(streamerId: string, now = Date.now()) {
  for (const reservation of reservationStore.values()) {
    if (reservation.streamerId === streamerId && reservation.expiresAt > now) {
      return reservation;
    }
  }
  return null;
}

export function clearPixelStreamingSessionReservations() {
  reservationStore.clear();
}

export async function reservePixelStreamingSession(
  request: PixelStreamingSessionReservationRequest
): Promise<PixelStreamingSessionReservationResponse> {
  const boothId = normalizeToken(request.boothId);
  const sessionId = normalizeToken(request.sessionId);
  const reservationKey = buildReservationKey(request);
  const now = Date.now();

  pruneExpiredReservations(now);

  const runtimeStatus = await getPixelStreamingStatus(request);
  const streamerId = runtimeStatus.session.activeStreamerId;

  if (!streamerId) {
    return {
      boothId,
      sessionId,
      streamerId: null,
      status: 'pending',
      selectionPolicy: runtimeStatus.session.selectionPolicy,
      expiresAt: null,
      warnings: Array.from(new Set([...runtimeStatus.warnings, 'SESSION_STREAMER_UNAVAILABLE'])),
      runtimeStatus,
    };
  }

  const existingReservation = reservationStore.get(reservationKey);
  if (existingReservation && existingReservation.streamerId === streamerId && existingReservation.expiresAt > now) {
    return {
      boothId,
      sessionId,
      streamerId,
      status: 'ready',
      selectionPolicy: runtimeStatus.session.selectionPolicy,
      expiresAt: new Date(existingReservation.expiresAt).toISOString(),
      warnings: runtimeStatus.warnings,
      runtimeStatus,
    };
  }

  const conflictingReservation = findActiveReservationByStreamerId(streamerId, now);
  if (conflictingReservation && conflictingReservation.key !== reservationKey) {
    return {
      boothId,
      sessionId,
      streamerId: null,
      status: 'pending',
      selectionPolicy: runtimeStatus.session.selectionPolicy,
      expiresAt: new Date(conflictingReservation.expiresAt).toISOString(),
      warnings: Array.from(new Set([...runtimeStatus.warnings, 'SESSION_STREAMER_RESERVED'])),
      runtimeStatus,
    };
  }

  const expiresAt = now + RESERVATION_TTL_MS;
  reservationStore.set(reservationKey, {
    key: reservationKey,
    boothId,
    sessionId,
    streamerId,
    expiresAt,
  });

  return {
    boothId,
    sessionId,
    streamerId,
    status: 'ready',
    selectionPolicy: runtimeStatus.session.selectionPolicy,
    expiresAt: new Date(expiresAt).toISOString(),
    warnings: runtimeStatus.warnings,
    runtimeStatus,
  };
}
