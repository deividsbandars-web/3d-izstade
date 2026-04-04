import type { SponsorRoomRecord } from '../lib/sponsorRoom';
import type { PixelStreamingRuntimeStatus } from './pixelStreamingConfig';

function normalizeToken(value: string | null | undefined) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function buildBoothStreamingLevel(boothId: string | null | undefined) {
  const normalizedBoothId = normalizeToken(boothId);
  return normalizedBoothId ? `Level_Booth_${normalizedBoothId}` : null;
}

export function getPreferredBoothStreamerIds(record: SponsorRoomRecord) {
  const boothId = normalizeToken(record.boothId);
  const slug = normalizeToken(record.slugOrId);
  const companyId = normalizeToken(record.company.id);
  const streamingLevel = buildBoothStreamingLevel(record.boothId);

  const ids = [
    boothId ? `booth-${boothId}` : null,
    slug ? `booth-${slug}` : null,
    slug ? `stream-${slug}` : null,
    boothId ? `level-booth-${boothId}` : null,
    streamingLevel,
    companyId ? `company-${companyId}` : null,
  ].filter((value): value is string => Boolean(value));

  return Array.from(new Set(ids));
}

export function withPreferredBoothSession(
  runtimeStatus: PixelStreamingRuntimeStatus | null,
  preferredStreamerIds: string[]
): PixelStreamingRuntimeStatus | null {
  if (!runtimeStatus || preferredStreamerIds.length === 0) {
    return runtimeStatus;
  }

  return {
    ...runtimeStatus,
    session: {
      ...runtimeStatus.session,
      activeStreamerId: preferredStreamerIds[0] ?? runtimeStatus.session.activeStreamerId,
    },
  };
}
