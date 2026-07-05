import type { ExpoBoothPlacement } from '../../layout-engine';
import {
  getExpoScreenSlotById,
  type ExpoScreenInventorySlot,
} from '../../../../shared/expo/screenInventory';
import { validateExpoScreenMediaUrl } from '../../../../shared/expo/screenContentMedia';
import { buildGeneratedBillboardTextureUrl } from '../booths/generatedBillboardTextureUrl';
import type { CityScreenAssignment, CityScreenSocket } from '../planning/types';

type ManagedScreenMode = 'generated-card' | 'image' | 'video' | 'video-placeholder';

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

  if (normalized === 'video') {
    return 'video';
  }

  if (normalized === 'video-placeholder') {
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
  const screenSlotId = normalizeNullableString(
    booth.cityScreenSlotId
    ?? booth.city_screen_slot_id
    ?? booth.heroScreenSlotId
    ?? booth.hero_screen_slot_id,
  );

  if (!screenSlotId) {
    return null;
  }

  const title = normalizeNullableString(
    booth.cityScreenTitle
    ?? booth.city_screen_title
    ?? booth.heroScreenTitle
    ?? booth.hero_screen_title,
  )
    ?? normalizeNullableString(placement.company?.name)
    ?? 'Sponsor Screen';
  const subtitle = normalizeNullableString(
    booth.cityScreenText
    ?? booth.city_screen_text
    ?? booth.heroScreenText
    ?? booth.hero_screen_text,
  )
    ?? normalizeNullableString(placement.company?.tagline)
    ?? 'Sponsor-managed city screen';
  const rawImageUrl = normalizeNullableString(
    booth.cityScreenImageUrl
    ?? booth.city_screen_image_url
    ?? booth.heroScreenImageUrl
    ?? booth.hero_screen_image_url,
  );
  const rawVideoUrl = normalizeNullableString(
    booth.cityScreenVideoUrl
    ?? booth.city_screen_video_url
    ?? booth.heroScreenVideoUrl
    ?? booth.hero_screen_video_url,
  );
  const imageResult = validateExpoScreenMediaUrl(rawImageUrl, 'image');
  const videoResult = validateExpoScreenMediaUrl(rawVideoUrl, 'video');

  return {
    ctaLabel: normalizeNullableString(
      booth.cityScreenCtaLabel
      ?? booth.city_screen_cta_label
      ?? booth.ctaLabel
      ?? booth.cta_label
      ?? placement.company?.ctaLabel,
    ),
    imageUrl: imageResult.ok && imageResult.url ? imageResult.url : null,
    mode: normalizeManagedMode(
      booth.cityScreenType
      ?? booth.city_screen_type
      ?? booth.heroScreenType
      ?? booth.hero_screen_type,
    ),
    screenSlotId,
    status: normalizeManagedStatus(
      booth.cityScreenStatus
      ?? booth.city_screen_status
      ?? booth.heroScreenStatus
      ?? booth.hero_screen_status,
    ),
    subtitle,
    title,
    videoUrl: videoResult.ok && videoResult.url ? videoResult.url : null,
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

function isManagedScreenVideoMode(mode: ManagedScreenMode) {
  return mode === 'video' || mode === 'video-placeholder';
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

function buildManagedScreenBillboardTextureUrl(content: ManagedScreenContent, slot: ExpoScreenInventorySlot, aspect: number) {
  return buildGeneratedBillboardTextureUrl({
    accentColor: getSlotTierAccent(slot),
    aspect,
    chip: content.mode === 'video' ? 'SPONSOR VIDEO' : content.mode === 'video-placeholder' ? 'VIDEO SLOT' : getSlotChip(slot),
    label: truncateManagedScreenText(content.title, 30).toUpperCase(),
    subtitle: truncateManagedScreenText(
      isManagedScreenVideoMode(content.mode)
        ? `${content.subtitle || 'Sponsor-managed city screen'} - poster fallback`
        : content.subtitle || 'Sponsor-managed city screen',
      54,
    ).toUpperCase(),
    tier: truncateManagedScreenText(content.ctaLabel || slot.valueTier, 18).toUpperCase(),
    tierAccent: getSlotTierAccent(slot),
  });
}

function buildManagedScreenTextureUrl(content: ManagedScreenContent, slot: ExpoScreenInventorySlot, aspect: number) {
  if (content.mode === 'video' && content.videoUrl) {
    return content.videoUrl;
  }

  if ((content.mode === 'image' || content.mode === 'video-placeholder') && content.imageUrl) {
    return content.imageUrl;
  }

  return buildManagedScreenBillboardTextureUrl(content, slot, aspect);
}

function resolveManagedScreenMediaMode(content: ManagedScreenContent): NonNullable<CityScreenAssignment['commercial']>['mediaMode'] {
  if (content.mode === 'video' && content.videoUrl) {
    return 'video';
  }

  if (content.mode === 'video-placeholder') {
    return 'video-placeholder';
  }

  if (content.mode === 'image' && content.imageUrl) {
    return 'image';
  }

  return 'generated-card';
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
  const fallbackImageUrl = buildManagedScreenBillboardTextureUrl(candidate.content, candidate.slot, aspect);
  const mediaMode = resolveManagedScreenMediaMode(candidate.content);
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
      commercial: {
        fallbackImageUrl,
        mediaMode,
        mediaUrl: textureUrl,
        ownerId: candidate.companyId,
        ownerKind: 'sponsor',
        ownerLabel: candidate.companyName,
        posterUrl: candidate.content.imageUrl,
        priority: candidate.priority + candidate.slot.valueScore,
        qualityTierBehavior: mediaMode === 'video' ? 'video-budgeted-by-quality-and-distance' : 'static-billboard',
        screenSlotId: candidate.slot.id,
        source: 'managed-screen',
        valueTier: candidate.slot.valueTier,
      },
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
            posterUrl: candidate.content.imageUrl,
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
