import type { ExpoBoothPlacement } from '../../../layout-engine';
import type { CanonicalPrimitive, CityScreenAssignment, CityScreenSocket, ExpoPlanningZonePlan, ExpoPlanningZoneId } from '../types';

function getPlacementTier(placement: ExpoBoothPlacement) {
  const sponsorTier = String(placement.company?.sponsorTier || placement.sponsorTier || '').toLowerCase();

  if (placement.boothType === 'hero' || sponsorTier === 'hero') {
    return 'hero' as const;
  }

  if (sponsorTier === 'platinum' || sponsorTier === 'elite') {
    return 'elite' as const;
  }

  if (sponsorTier === 'gold' || sponsorTier === 'premium' || sponsorTier === 'silver') {
    return 'premium' as const;
  }

  return null;
}

function rankPlacementForScreens(placement: ExpoBoothPlacement) {
  const tier = getPlacementTier(placement);
  const tierWeight = tier === 'hero' ? 4 : tier === 'elite' ? 3 : tier === 'premium' ? 2 : 0;
  const priority = Number(placement.priority || 0);
  return (tierWeight * 1000) + priority;
}

function sortPlacementsForScreens(placements: ExpoBoothPlacement[]) {
  return [...placements]
    .filter((placement) => getPlacementTier(placement) !== null)
    .sort((left, right) => {
      const byRank = rankPlacementForScreens(right) - rankPlacementForScreens(left);
      if (byRank !== 0) {
        return byRank;
      }

      return String(left.id).localeCompare(String(right.id));
    });
}

function cyclePickPlacement<T>(placements: T[], index: number): T | null {
  if (placements.length === 0) {
    return null;
  }

  return placements[index % placements.length] ?? null;
}

function getDefaultZoneSubtitle(zoneId: ExpoPlanningZoneId) {
  switch (zoneId) {
    case 'arrival':
      return 'Arrival sponsor frontage';
    case 'left-district':
      return 'Left district sponsor frontage';
    case 'center-spine':
      return 'Center spine program signal';
    case 'right-district':
      return 'Right district sponsor frontage';
    case 'tower-cluster':
      return 'Tower cluster sponsor signal';
    case 'rear-campus':
      return 'Rear campus event feed';
    default:
      return 'Expo partner';
  }
}

function getWorldScreenSemantic(socketKind: CityScreenSocket['kind']) {
  switch (socketKind) {
    case 'hero_wall':
      return { chip: 'BOULEVARD SIGNAL', mode: 'landmark' as const };
    case 'tower_crown':
      return { chip: 'CROWN PULSE', mode: 'beacon' as const };
    case 'tower_side':
      return { chip: 'VERTICAL RIBBON', mode: 'signal' as const };
    default:
      return { chip: 'DISTRICT ARRAY', mode: 'wayfinding' as const };
  }
}

function getZoneScreenSemanticChip(zoneId: ExpoPlanningZoneId, socketKind: CityScreenSocket['kind']) {
  if (socketKind === 'hero_wall') {
    switch (zoneId) {
      case 'left-district':
        return 'LEFT MARQUEE';
      case 'center-spine':
        return 'CENTER SPINE';
      case 'right-district':
        return 'RIGHT MARQUEE';
      default:
        return 'BOULEVARD SIGNAL';
    }
  }

  return getWorldScreenSemantic(socketKind).chip;
}

function getTierAccent(tier: CityScreenAssignment['tier']) {
  switch (tier) {
    case 'hero':
      return '#fbbf24';
    case 'elite':
      return '#67e8f9';
    default:
      return '#93c5fd';
  }
}

function rankSocketsForZone(zoneId: ExpoPlanningZoneId, sockets: CityScreenSocket[]) {
  return [...sockets].sort((left, right) => {
    const kindWeight = (socket: CityScreenSocket) => {
      switch (socket.kind) {
        case 'hero_wall':
          return 4;
        case 'tower_crown':
          return 3;
        case 'tower_side':
          return 2;
        default:
          return 1;
      }
    };

    const weightDiff = kindWeight(right) - kindWeight(left);
    if (weightDiff !== 0) {
      return weightDiff;
    }

    if (zoneId === 'rear-campus') {
      const rearCampusPriority = (socket: CityScreenSocket) => {
        if (socket.id.includes('bowl-feed-surface')) {
          return 6;
        }
        if (socket.id.includes('stage-monolith-canopy-host-surface') || socket.id.includes('mega-civic-hall-host-surface')) {
          return 5;
        }
        if (
          socket.id.includes('grand-prism-citadel-host-surface')
          || socket.id.includes('sky-slab-tower-host-surface')
          || socket.id.includes('needle-crown-skyscraper-host-surface')
        ) {
          return 4;
        }
        if (socket.id.includes('landmark-left') || socket.id.includes('landmark-right')) {
          return 3;
        }
        if (socket.id.includes('event-pavilion')) {
          return 2;
        }
        if (socket.id.includes('side-pavilion')) {
          return 1;
        }
        if (socket.id.includes('axis-gallery')) {
          return 0;
        }
        if (socket.id.includes('axis-terminal') || socket.id.includes('axis-front') || socket.id.includes('axis-kiosk')) {
          return -1;
        }
        return -2;
      };

      const byRearCampusPriority = rearCampusPriority(right) - rearCampusPriority(left);
      if (byRearCampusPriority !== 0) {
        return byRearCampusPriority;
      }

      return Math.abs(left.position[0]) - Math.abs(right.position[0]);
    }

    if (zoneId === 'left-district') {
      return left.position[2] - right.position[2];
    }

    if (zoneId === 'right-district') {
      return left.position[2] - right.position[2];
    }

    return left.position[2] - right.position[2];
  });
}

function buildAssignmentPrimitives(args: {
  accentColor: string;
  imageUrl: string | null;
  intent: NonNullable<CityScreenAssignment['renderIntent']>;
  label: string;
  subtitle: string;
  tier: CityScreenAssignment['tier'];
}) {
  const { accentColor, imageUrl, intent, label, subtitle, tier } = args;
  const frameWidth = intent.frameWidth;
  const frameHeight = intent.frameHeight;
  const headerHeight = intent.headerHeight;
  const footerHeight = intent.footerHeight;
  const bodyHeight = frameHeight - headerHeight - footerHeight;
  const accentBarWidth = intent.semanticMode === 'landmark' ? frameWidth * 0.1 : frameWidth * 0.08;
  const isHeroComposition = intent.semanticChip === 'LEFT MARQUEE' || intent.semanticChip === 'RIGHT MARQUEE' || intent.semanticChip === 'CENTER SPINE';
  const contentWidth = frameWidth * 0.92;
  const contentHeight = bodyHeight * 0.94;
  const contentCenterX = imageUrl ? frameWidth * 0.18 : 0;
  const primitives: CanonicalPrimitive[] = [
    { color: '#0a121b', kind: 'plane', opacity: 1, position: [0, 0, 0.02], size: [frameWidth, frameHeight] },
    { color: '#101a25', kind: 'plane', opacity: 1, position: [0, 0, 0.03], size: [frameWidth * 0.98, frameHeight * 0.98] },
    { color: intent.tierAccent, kind: 'plane', opacity: Math.min(intent.edgeGlowOpacity, 0.18), position: [-(frameWidth * 0.5) + (accentBarWidth * 0.5), 0, 0.04], size: [accentBarWidth, frameHeight * 0.9], transparent: true },
    imageUrl
      ? { fallbackColor: accentColor, kind: 'texture-plane', opacity: 1, position: [contentCenterX, 0, 0.05], size: [imageUrl ? frameWidth * 0.56 : contentWidth, contentHeight], url: imageUrl }
      : { color: accentColor, kind: 'plane', opacity: 1, position: [0, 0, 0.05], size: [contentWidth, contentHeight] },
    { color: '#050b12', kind: 'plane', opacity: 1, position: [0, (frameHeight * 0.5) - (headerHeight * 0.5), 0.06], size: [frameWidth * 0.98, headerHeight] },
    { color: '#050b12', kind: 'plane', opacity: 1, position: [0, -(frameHeight * 0.5) + (footerHeight * 0.5), 0.06], size: [frameWidth * 0.98, footerHeight] },
    { color: intent.tierAccent, kind: 'plane', opacity: isHeroComposition ? 0.14 : 0.1, position: [0, (frameHeight * 0.5) - headerHeight - Math.max(0.1, frameHeight * 0.02), 0.07], size: [intent.topStripWidth, Math.max(0.08, frameHeight * 0.014)], transparent: true },
    { color: intent.chipColor, kind: 'text', maxWidth: frameWidth * 0.68, outlineBlur: 0.04, outlineColor: '#020617', outlineWidth: 0.02, position: [frameWidth * 0.04, (frameHeight * 0.5) - (headerHeight * 0.5), 0.072], size: Math.max(0.22, frameHeight * 0.04), text: intent.semanticChip },
  ];

    if (imageUrl) {
    primitives.push(
      { color: '#0b121b', kind: 'plane', opacity: 1, position: [-(frameWidth * 0.2), 0, 0.052], size: [frameWidth * 0.22, bodyHeight * 0.88] },
    );
  }

  primitives.push(
    { color: intent.tierAccent, kind: 'text', maxWidth: frameWidth * 0.16, outlineBlur: 0.04, outlineColor: '#020617', outlineWidth: 0.02, position: [-(frameWidth * 0.34), (frameHeight * 0.5) - (headerHeight * 0.5), 0.072], size: Math.max(0.16, frameHeight * 0.028), text: tier.toUpperCase() },
    { color: '#f8fafc', kind: 'text', maxWidth: frameWidth * (imageUrl ? (isHeroComposition ? 0.36 : 0.3) : (isHeroComposition ? 0.72 : 0.66)), outlineBlur: 0.05, outlineColor: '#020617', outlineWidth: 0.025, position: [frameWidth * (imageUrl ? 0.18 : 0.02), imageUrl ? frameHeight * 0.04 : 0.02, 0.074], size: Math.max(isHeroComposition ? 0.36 : 0.28, frameHeight * (imageUrl ? (isHeroComposition ? 0.05 : 0.044) : (isHeroComposition ? 0.08 : 0.07))), text: label },
    { color: '#cbd5e1', kind: 'text', maxWidth: frameWidth * 0.68, outlineBlur: 0.05, outlineColor: '#020617', outlineWidth: 0.02, position: [frameWidth * 0.06, -(frameHeight * 0.5) + (footerHeight * 0.5), 0.074], size: Math.max(0.18, frameHeight * 0.03), text: subtitle },
  );

  if (isHeroComposition) {
    primitives.push(
      { color: intent.tierAccent, kind: 'plane', opacity: 0.06, position: [0, frameHeight * 0.18, 0.068], size: [frameWidth * 0.76, frameHeight * 0.14], transparent: true },
    );
  }

  return primitives;
}

export function buildZoneScreenAssignmentPlan(args: {
  assignmentCap: number;
  boothPlacements: ExpoBoothPlacement[];
  sockets: CityScreenSocket[];
  zoneId: ExpoPlanningZoneId;
}) {
  const rankedPlacements = sortPlacementsForScreens(args.boothPlacements);
  const rankedSockets = rankSocketsForZone(args.zoneId, args.sockets).slice(0, args.assignmentCap);

  return rankedSockets.flatMap((socket, index) => {
    const placement = cyclePickPlacement(rankedPlacements, index);
    if (!placement) {
      return [];
    }

    const tier = getPlacementTier(placement);
    if (!tier) {
      return [];
    }

    const semantic = getWorldScreenSemantic(socket.kind);
    const tierAccent = getTierAccent(tier);
    const isHeroComposition = socket.kind === 'hero_wall' && (
      args.zoneId === 'left-district' ||
      args.zoneId === 'center-spine' ||
      args.zoneId === 'right-district'
    );
    const isCenterSpineHero = socket.kind === 'hero_wall' && args.zoneId === 'center-spine';
    const isTowerFamily = socket.kind === 'tower_crown' || socket.kind === 'tower_side';
    const isHeroTowerSocket = socket.id.includes('-hero-tower-');
    const isMidTowerSocket = socket.id.includes('-mid-tower-');
    const isSupportTowerSocket = socket.id.includes('-support-tower-') || socket.id.includes('-outer-support-tower-');
    const isRearCampusWall = args.zoneId === 'rear-campus' && socket.kind === 'wall';
    const frameScale = isCenterSpineHero
      ? 0.92
      : isHeroComposition
        ? 0.9
        : isTowerFamily
          ? isHeroTowerSocket
            ? 0.92
            : isMidTowerSocket
              ? 0.88
              : 0.76
          : isRearCampusWall
            ? 0.88
            : 0.86;
    const frameWidth = socket.frameSize[0] * frameScale;
    const frameHeight = socket.frameSize[1] * frameScale;
    const headerHeight = Math.max(0.24, frameHeight * (isCenterSpineHero ? 0.13 : isHeroComposition ? 0.12 : 0.1));
    const footerHeight = Math.max(0.22, frameHeight * (isCenterSpineHero ? 0.1 : isHeroComposition ? 0.09 : 0.08));
    const detailDistance = tier === 'hero' ? 1100 : tier === 'elite' ? 900 : 700;
    const subtitleDistance = tier === 'hero' ? 760 : tier === 'elite' ? 620 : 480;
    const hasImage = Boolean(placement.company?.posterUrl || placement.company?.heroAssetUrl || placement.company?.logo_url);

    const renderIntent = {
      bodyPanelWidth: hasImage ? frameWidth * (isCenterSpineHero ? 0.76 : isHeroComposition ? 0.7 : 0.62) : frameWidth * (isCenterSpineHero ? 0.96 : isHeroComposition ? 0.94 : 0.92),
      chipColor: semantic.mode === 'landmark' ? '#fde68a' : semantic.mode === 'beacon' ? '#a5f3fc' : semantic.mode === 'signal' ? '#bfdbfe' : '#dbeafe',
      detailDistance,
      edgeGlowOpacity: isCenterSpineHero ? 0.24 : isHeroComposition ? 0.2 : isTowerFamily ? (isHeroTowerSocket ? 0.12 : isMidTowerSocket ? 0.1 : 0.05) : tier === 'hero' ? 0.16 : tier === 'elite' ? 0.12 : 0.1,
      footerHeight,
      frameHeight,
      frameWidth,
      headerHeight,
      maxDistance: tier === 'hero' ? 1700 : tier === 'elite' ? 1350 : 980,
      panelOpacityFar: isTowerFamily ? (isSupportTowerSocket ? 0.24 : 0.38) : 0.44,
      panelOpacityMid: isTowerFamily ? (isSupportTowerSocket ? 0.36 : 0.54) : 0.58,
      panelOpacityNear: isTowerFamily ? (isSupportTowerSocket ? 0.5 : 0.68) : 0.72,
      semanticChip: getZoneScreenSemanticChip(args.zoneId, socket.kind),
      semanticMode: semantic.mode,
      showCenterTitleDistance: detailDistance,
      subtitleDistance,
      tierAccent,
      topStripWidth: isCenterSpineHero ? frameWidth * 0.86 : isHeroComposition ? frameWidth * 0.78 : isHeroTowerSocket ? frameWidth * 0.6 : semantic.mode === 'beacon' ? frameWidth * 0.4 : semantic.mode === 'signal' ? frameWidth * 0.52 : frameWidth * 0.66,
    } satisfies NonNullable<CityScreenAssignment['renderIntent']>;

    return [{
      accentColor: placement.color,
      companyId: placement.company?.id ?? null,
      id: `${socket.id}-assignment`,
      imageUrl: placement.company?.posterUrl || placement.company?.heroAssetUrl || placement.company?.logo_url || null,
      label: placement.company?.name || placement.sectorName || 'Sponsor',
      renderIntent: {
        ...renderIntent,
        primitives: buildAssignmentPrimitives({
          accentColor: placement.color,
          imageUrl: placement.company?.posterUrl || placement.company?.heroAssetUrl || placement.company?.logo_url || null,
          intent: renderIntent,
          label: placement.company?.name || placement.sectorName || 'Sponsor',
          subtitle: placement.company?.tagline || placement.sectorName || getDefaultZoneSubtitle(args.zoneId),
          tier,
        }),
      },
      sections: socket.sections,
      socketId: socket.id,
      subtitle: placement.company?.tagline || placement.sectorName || getDefaultZoneSubtitle(args.zoneId),
      tier,
    } satisfies CityScreenAssignment];
  });
}

export function flattenZoneScreenAssignments(
  zones: ExpoPlanningZonePlan[],
  options?: { includeRearCampus?: boolean }
) {
  const includeRearCampus = options?.includeRearCampus ?? false;
  return zones.flatMap((zone) => (
    includeRearCampus || zone.id !== 'rear-campus'
      ? zone.assignments
      : []
  )) as CityScreenAssignment[];
}
