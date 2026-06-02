import type { ExpoBoothPlacement } from '../../layout-engine';
import {
  getExpoScreenSlotById,
  type ExpoScreenInventorySlot,
} from '../../../../shared/expo/screenInventory';
import { buildGeneratedBillboardTextureUrl } from '../booths/generatedBillboardTextureUrl';
import type { CityScreenAssignment, CityScreenSocket } from '../planning/types';

type ManagedScreenMode = 'generated-card' | 'image' | 'video-placeholder';

type ManagedScreenContent = {
  ctaLabel: string | null;
  imageUrl: string | null;
  mode: ManagedScreenMode;
  screenSlotId: string;
  status: 'draft' | 'published';
  subtitle: string | null;
  title: string;
  videoUrl: string | null;
};

type ManagedScreenCandidate = {
  companyId: string;
  companyName: string;
  content: ManagedScreenContent;
  placement: ExpoBoothPlacement;
  priority: number;
  slot: ExpoScreenInventorySlot;
};

export type ManagedScreenAssignmentOverride = {
  assignment: CityScreenAssignment;
  source: {
    companyId: string;
    companyName: string;
    mode: ManagedScreenMode;
    screenSlotId: string;
    slotLabel: string;
  };
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function normalizeNullableString(value: unknown) {
  const normalized = typeof value === 'string' ? value.trim() : '';
  return normalized.length > 0 ? normalized : null;
}

function normalizeManagedMode(value: unknown): ManagedScreenMode {
  const normalized = String(value || '').trim().toLowerCase();

  if (normalized === 'image') {
    return 'image';
  }

  if (normalized === 'video' || normalized === 'video-placeholder') {
    return 'video-placeholder';
  }

  return 'generated-card';
}

function normalizeManagedStatus(value: unknown): ManagedScreenContent['status'] {
  return String(value || '').trim().toLowerCase() === 'published' ? 'published' : 'draft';
}

function truncateManagedScreenText(value: string, maxLength: number) {
  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized.length > maxLength
    ? `${normalized.slice(0, Math.max(0, maxLength - 3)).trim()}...`
    : normalized;
}

function getBoothRecord(placement: ExpoBoothPlacement) {
  return asRecord(placement.company?.booth);
}

function getManagedScreenContent(placement: ExpoBoothPlacement): ManagedScreenContent | null {
  const booth = getBoothRecord(placement);
  const screenSlotId = normalizeNullableString(booth.heroScreenSlotId ?? booth.hero_screen_slot_id);

  if (!screenSlotId) {
    return null;
  }

  const title = normalizeNullableString(booth.heroScreenTitle ?? booth.hero_screen_title)
    ?? normalizeNullableString(placement.company?.name)
    ?? 'Sponsor Screen';
  const subtitle = normalizeNullableString(booth.heroScreenText ?? booth.hero_screen_text)
    ?? normalizeNullableString(placement.company?.tagline)
    ?? 'Owner-managed sponsor screen';

  return {
    ctaLabel: normalizeNullableString(booth.ctaLabel ?? booth.cta_label ?? placement.company?.ctaLabel),
    imageUrl: normalizeNullableString(booth.heroScreenImageUrl ?? booth.hero_screen_image_url),
    mode: normalizeManagedMode(booth.heroScreenType ?? booth.hero_screen_type),
    screenSlotId,
    status: normalizeManagedStatus(booth.heroScreenStatus ?? booth.hero_screen_status),
    subtitle,
    title,
    videoUrl: normalizeNullableString(booth.heroScreenVideoUrl ?? booth.hero_screen_video_url),
  };
}

function getSlotTierAccent(slot: ExpoScreenInventorySlot) {
  switch (slot.valueTier) {
    case 'landmark':
      return '#facc15';
    case 'hero':
      return '#93c5fd';
    case 'premium':
      return '#5eead4';
    default:
      return '#cbd5e1';
  }
}

function getAssignmentTier(slot: ExpoScreenInventorySlot): CityScreenAssignment['tier'] {
  return slot.valueTier === 'landmark' || slot.valueTier === 'hero' ? 'hero' : 'premium';
}

function getSlotChip(slot: ExpoScreenInventorySlot) {
  switch (slot.valueTier) {
    case 'landmark':
      return 'LANDMARK SPONSOR';
    case 'hero':
      return 'HERO SCREEN';
    case 'premium':
      return 'PREMIUM SCREEN';
    default:
      return 'SPONSOR SCREEN';
  }
}

function buildManagedScreenTextureUrl(content: ManagedScreenContent, slot: ExpoScreenInventorySlot, aspect: number) {
  if (content.mode === 'video-placeholder' && content.videoUrl) {
    return content.videoUrl;
  }

  if (content.mode === 'image' && content.imageUrl) {
    return content.imageUrl;
  }

  return buildGeneratedBillboardTextureUrl({
    accentColor: getSlotTierAccent(slot),
    aspect,
    chip: content.mode === 'video-placeholder' ? 'VIDEO SLOT READY' : getSlotChip(slot),
    label: truncateManagedScreenText(content.title, 30).toUpperCase(),
    subtitle: truncateManagedScreenText(
      content.mode === 'video-placeholder'
        ? `${content.subtitle || 'Owner-managed sponsor screen'} - playback off`
        : content.subtitle || 'Owner-managed sponsor screen',
      54,
    ).toUpperCase(),
    tier: truncateManagedScreenText(content.ctaLabel || slot.valueTier, 18).toUpperCase(),
    tierAccent: getSlotTierAccent(slot),
  });
}

function slotMatchesAssignment(
  slot: ExpoScreenInventorySlot,
  assignment: CityScreenAssignment,
  socket: CityScreenSocket,
) {
  const targets = [
    slot.runtimeAssignmentId,
    slot.runtimeSocketId,
    slot.runtimeSurfaceId,
    slot.runtimeTargetId,
  ].filter(Boolean);

  return targets.some((target) => (
    target === assignment.id
    || target === assignment.socketId
    || target === socket.id
    || target === socket.surfaceId
  ));
}

function createManagedScreenCandidate(placement: ExpoBoothPlacement): ManagedScreenCandidate | null {
  const content = getManagedScreenContent(placement);
  if (!content || content.status !== 'published') {
    return null;
  }

  const slot = getExpoScreenSlotById(content.screenSlotId);
  if (!slot || slot.scope !== 'city') {
    return null;
  }

  return {
    companyId: String(placement.company?.id || placement.id || ''),
    companyName: String(placement.company?.name || placement.id || 'Sponsor'),
    content,
    placement,
    priority: Number(placement.priority || placement.company?.priority || 0),
    slot,
  };
}

function buildManagedScreenAssignment(
  assignment: CityScreenAssignment,
  socket: CityScreenSocket,
  candidate: ManagedScreenCandidate,
): ManagedScreenAssignmentOverride {
  const frameWidth = assignment.renderIntent?.frameWidth ?? socket.frameSize[0];
  const frameHeight = assignment.renderIntent?.frameHeight ?? socket.frameSize[1];
  const aspect = Number((frameWidth / Math.max(0.1, frameHeight)).toFixed(3));
  const textureUrl = buildManagedScreenTextureUrl(candidate.content, candidate.slot, aspect);
  const tierAccent = getSlotTierAccent(candidate.slot);
  const baseRenderIntent = assignment.renderIntent ?? {
    bodyPanelWidth: frameWidth * 0.97,
    chipColor: tierAccent,
    detailDistance: 700,
    edgeGlowOpacity: 0.16,
    footerHeight: frameHeight * 0.18,
    frameHeight,
    frameWidth,
    fullBleed: true,
    headerHeight: frameHeight * 0.18,
    maxDistance: 980,
    panelOpacityFar: 0.44,
    panelOpacityMid: 0.58,
    panelOpacityNear: 0.72,
    semanticChip: getSlotChip(candidate.slot),
    semanticMode: candidate.slot.valueTier === 'landmark' || candidate.slot.valueTier === 'hero' ? 'landmark' : 'signal',
    showCenterTitleDistance: 700,
    subtitleDistance: 480,
    tierAccent,
    topStripWidth: frameWidth * 0.66,
  } satisfies NonNullable<CityScreenAssignment['renderIntent']>;

  return {
    assignment: {
      ...assignment,
      accentColor: tierAccent,
      companyId: candidate.companyId,
      imageUrl: textureUrl,
      label: candidate.content.title,
      renderIntent: {
        ...baseRenderIntent,
        chipColor: tierAccent,
        fullBleed: true,
        semanticChip: getSlotChip(candidate.slot),
        tierAccent,
        primitives: [
          {
            fallbackColor: '#06111f',
            kind: 'texture-plane',
            opacity: 1,
            position: [0, 0, 1.16],
            size: [frameWidth * 0.992, frameHeight * 0.992],
            url: textureUrl,
          },
        ],
      },
      subtitle: candidate.content.subtitle || candidate.slot.label,
      tier: getAssignmentTier(candidate.slot),
    },
    source: {
      companyId: candidate.companyId,
      companyName: candidate.companyName,
      mode: candidate.content.mode,
      screenSlotId: candidate.content.screenSlotId,
      slotLabel: candidate.slot.label,
    },
  };
}

export function buildManagedScreenAssignmentOverrides(args: {
  assignments: CityScreenAssignment[];
  boothPlacements: ExpoBoothPlacement[];
  sockets: CityScreenSocket[];
}) {
  const socketById = new Map(args.sockets.map((socket) => [socket.id, socket]));
  const candidates = args.boothPlacements
    .map(createManagedScreenCandidate)
    .filter((candidate): candidate is ManagedScreenCandidate => Boolean(candidate))
    .sort((left, right) => {
      const priority = right.priority - left.priority;
      return priority !== 0 ? priority : left.companyId.localeCompare(right.companyId);
    });
  const overridesByAssignmentId = new Map<string, ManagedScreenAssignmentOverride>();
  const claimedSlotIds = new Set<string>();

  candidates.forEach((candidate) => {
    if (claimedSlotIds.has(candidate.slot.id)) {
      return;
    }

    const assignment = args.assignments.find((entry) => {
      const socket = socketById.get(entry.socketId);
      return socket ? slotMatchesAssignment(candidate.slot, entry, socket) : false;
    });
    const socket = assignment ? socketById.get(assignment.socketId) : null;

    if (!assignment || !socket) {
      return;
    }

    overridesByAssignmentId.set(assignment.id, buildManagedScreenAssignment(assignment, socket, candidate));
    claimedSlotIds.add(candidate.slot.id);
  });

  return {
    activeOverrideCount: overridesByAssignmentId.size,
    overridesByAssignmentId,
    publishedCitySlotCount: candidates.length,
  };
}
