import { validateExpoScreenMediaUrl } from './screenContentMedia.js';

export type ExpoCommunityEntryKind = 'advert' | 'message' | 'voice';
export type ExpoCommunityEntryStatus = 'approved' | 'pending' | 'rejected' | 'removed';
export type ExpoCommunityItemType = 'entry' | 'graffiti';
export type ExpoCommunityReportReason = 'other' | 'spam' | 'unsafe' | 'wrong-place';

export type ExpoCommunityEntry = {
  audioUrl?: string;
  authorLabel: string;
  body: string;
  createdAt: string;
  expiresAt?: string;
  id: string;
  kind: ExpoCommunityEntryKind;
  removalReason?: string;
  reportCount?: number;
  reportedAt?: string;
  status: ExpoCommunityEntryStatus;
  title: string;
};

export type ExpoCommunityGraffiti = {
  authorLabel: string;
  color: string;
  createdAt: string;
  expiresAt?: string;
  id: string;
  logoUrl?: string;
  markText: string;
  removalReason?: string;
  reportCount?: number;
  reportedAt?: string;
  status: ExpoCommunityEntryStatus;
  wallSlot: number;
  placement?: ExpoCommunitySprayPlacement;
};

export type ExpoCommunitySprayPlacement = {
  hostId?: string;
  normalX?: number;
  normalY?: number;
  normalZ?: number;
  rotationY: number;
  surfaceLabel: string;
  x: number;
  y: number;
  z: number;
};

export type ExpoCommunityAuditAction = 'approved' | 'created' | 'rejected' | 'removed' | 'reported';

export type ExpoCommunityAuditEvent = {
  action: ExpoCommunityAuditAction;
  actorLabel: string;
  createdAt: string;
  id: string;
  itemId: string;
  itemType: ExpoCommunityItemType;
  note?: string;
};

export const EXPO_COMMUNITY_LIMITS = {
  advertBody: 180,
  autoReviewReports: 3,
  graffitiPerHour: 3,
  graffitiVisibleMinutes: 10,
  markText: 12,
  messageBody: 240,
  reportDetail: 160,
  reportPerHour: 8,
  retentionDays: {
    advert: 14,
    graffiti: 30,
    message: 7,
    voice: 7,
  },
  title: 48,
  voiceBytes: 800_000,
  voiceSeconds: 15,
} as const;

const SAFE_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;
const SPRAY_PLACEMENT_BOUNDS = {
  maxX: 120,
  maxY: 12,
  maxZ: 96,
  minX: -120,
  minY: 1.2,
  minZ: -160,
} as const;

function cleanText(value: unknown, maxLength: number) {
  return Array.from(String(value || ''))
    .map((character) => {
      const code = character.charCodeAt(0);
      return code <= 31 || code === 127 ? ' ' : character;
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function cleanFiniteNumber(value: unknown, fallback: number, min: number, max: number) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, numeric));
}

function normalizeVector3(
  x: unknown,
  y: unknown,
  z: unknown,
  fallback: { x: number; y: number; z: number },
) {
  const nextX = cleanFiniteNumber(x, fallback.x, -1, 1);
  const nextY = cleanFiniteNumber(y, fallback.y, -1, 1);
  const nextZ = cleanFiniteNumber(z, fallback.z, -1, 1);
  const length = Math.hypot(nextX, nextY, nextZ);
  if (length < 0.001) return fallback;
  return {
    x: Math.round((nextX / length) * 1000) / 1000,
    y: Math.round((nextY / length) * 1000) / 1000,
    z: Math.round((nextZ / length) * 1000) / 1000,
  };
}

export function normalizeExpoCommunitySprayPlacement(input: unknown): ExpoCommunitySprayPlacement | undefined {
  const record = input && typeof input === 'object' && !Array.isArray(input)
    ? input as Record<string, unknown>
    : null;
  if (!record) return undefined;

  const hasPosition = Number.isFinite(Number(record.x)) && Number.isFinite(Number(record.z));
  if (!hasPosition) return undefined;
  const rotationY = cleanFiniteNumber(record.rotationY, 0, -Math.PI, Math.PI);
  const fallbackNormal = {
    x: Math.sin(rotationY),
    y: 0,
    z: Math.cos(rotationY),
  };
  const normal = normalizeVector3(record.normalX, record.normalY, record.normalZ, fallbackNormal);

  return {
    hostId: cleanText(record.hostId, 80) || undefined,
    normalX: normal.x,
    normalY: normal.y,
    normalZ: normal.z,
    rotationY,
    surfaceLabel: cleanText(record.surfaceLabel, 32) || 'City spot',
    x: cleanFiniteNumber(record.x, 0, SPRAY_PLACEMENT_BOUNDS.minX, SPRAY_PLACEMENT_BOUNDS.maxX),
    y: cleanFiniteNumber(record.y, 2.6, SPRAY_PLACEMENT_BOUNDS.minY, SPRAY_PLACEMENT_BOUNDS.maxY),
    z: cleanFiniteNumber(record.z, 0, SPRAY_PLACEMENT_BOUNDS.minZ, SPRAY_PLACEMENT_BOUNDS.maxZ),
  };
}

export function normalizeExpoCommunityEntryInput(input: unknown) {
  const record = input && typeof input === 'object' && !Array.isArray(input)
    ? input as Record<string, unknown>
    : {};
  const kind: ExpoCommunityEntryKind = record.kind === 'advert' ? 'advert' : 'message';
  const title = cleanText(record.title, EXPO_COMMUNITY_LIMITS.title);
  const body = cleanText(
    record.body,
    kind === 'advert' ? EXPO_COMMUNITY_LIMITS.advertBody : EXPO_COMMUNITY_LIMITS.messageBody,
  );
  const issues: string[] = [];

  if (!title) issues.push('Add a short title.');
  if (!body) issues.push('Add a message.');

  return { body, issues, kind, ok: issues.length === 0, title };
}

export function normalizeExpoCommunityGraffitiInput(input: unknown) {
  const record = input && typeof input === 'object' && !Array.isArray(input)
    ? input as Record<string, unknown>
    : {};
  const markText = cleanText(record.markText, EXPO_COMMUNITY_LIMITS.markText).toUpperCase();
  const color = SAFE_COLOR_PATTERN.test(String(record.color || ''))
    ? String(record.color).toLowerCase()
    : '#22d3ee';
  const logoResult = validateExpoScreenMediaUrl(record.logoUrl, 'image');
  const issues: string[] = [];

  if (!markText && !logoResult.url) issues.push('Add a short mark or a logo image.');
  if (!logoResult.ok) issues.push(logoResult.reason);

  return {
    color,
    issues,
    logoUrl: logoResult.ok ? logoResult.url : '',
    markText,
    ok: issues.length === 0,
    placement: normalizeExpoCommunitySprayPlacement(record.placement),
  };
}

export function normalizeExpoCommunityReportInput(input: unknown) {
  const record = input && typeof input === 'object' && !Array.isArray(input)
    ? input as Record<string, unknown>
    : {};
  const allowedReasons = new Set<ExpoCommunityReportReason>(['other', 'spam', 'unsafe', 'wrong-place']);
  const reason = allowedReasons.has(record.reason as ExpoCommunityReportReason)
    ? record.reason as ExpoCommunityReportReason
    : 'other';
  const detail = cleanText(record.detail, EXPO_COMMUNITY_LIMITS.reportDetail);
  return { detail, issues: [] as string[], ok: true, reason };
}

export function normalizeExpoCommunityModerationInput(input: unknown) {
  const record = input && typeof input === 'object' && !Array.isArray(input)
    ? input as Record<string, unknown>
    : {};
  const status = String(record.status || '') as ExpoCommunityEntryStatus;
  const issues: string[] = [];
  if (status !== 'approved' && status !== 'rejected' && status !== 'removed') {
    issues.push('Use approved, rejected, or removed status.');
  }
  return {
    issues,
    note: cleanText(record.note, EXPO_COMMUNITY_LIMITS.reportDetail),
    ok: issues.length === 0,
    status,
  };
}

export function getExpoCommunityRetentionDays(kind: ExpoCommunityEntryKind | 'graffiti') {
  return EXPO_COMMUNITY_LIMITS.retentionDays[kind];
}

export function buildExpoCommunityExpiresAt(createdAt: string, kind: ExpoCommunityEntryKind | 'graffiti') {
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return undefined;
  if (kind === 'graffiti') {
    return new Date(created.getTime() + EXPO_COMMUNITY_LIMITS.graffitiVisibleMinutes * 60 * 1000).toISOString();
  }
  const expires = new Date(created.getTime() + getExpoCommunityRetentionDays(kind) * 24 * 60 * 60 * 1000);
  return expires.toISOString();
}

export function isExpoCommunityItemVisible(status: ExpoCommunityEntryStatus, expiresAt?: string, now = new Date()) {
  if (status !== 'approved') return false;
  if (!expiresAt) return true;
  const expiry = new Date(expiresAt).getTime();
  return Number.isFinite(expiry) && expiry > now.getTime();
}

export function getExpoCommunityStatusLabel(status: ExpoCommunityEntryStatus) {
  if (status === 'approved') return 'Visible in city';
  if (status === 'rejected') return 'Changes requested';
  if (status === 'removed') return 'Removed from city';
  return 'Waiting for review';
}
