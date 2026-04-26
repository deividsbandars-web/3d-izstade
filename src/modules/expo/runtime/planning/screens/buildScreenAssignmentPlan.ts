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
  const accentBarWidth = intent.semanticMode === 'landmark' ? frameWidth * 0.16 : frameWidth * 0.12;
  const primitives: CanonicalPrimitive[] = [
    { color: '#08111c', kind: 'plane', opacity: 0.92, position: [0, 0, 0.05], size: [frameWidth, frameHeight], transparent: true },
    { color: intent.tierAccent, kind: 'plane', opacity: intent.edgeGlowOpacity, position: [-(frameWidth * 0.5) + (accentBarWidth * 0.5), 0, 0.065], size: [accentBarWidth, frameHeight * 0.96], transparent: true },
    imageUrl
      ? { fallbackColor: accentColor, kind: 'texture-plane', opacity: 0.92, position: [0, 0, 0.07], size: [frameWidth * 0.9, bodyHeight * 0.96], url: imageUrl }
      : { color: accentColor, kind: 'plane', opacity: 0.22, position: [0, 0, 0.07], size: [frameWidth * 0.9, bodyHeight * 0.96], transparent: true },
    { color: '#020617', kind: 'plane', opacity: intent.panelOpacityNear, position: [0, (frameHeight * 0.5) - (headerHeight * 0.5), 0.075], size: [frameWidth * 0.94, headerHeight], transparent: true },
    { color: '#020617', kind: 'plane', opacity: intent.panelOpacityNear * 0.92, position: [0, -(frameHeight * 0.5) + (footerHeight * 0.5), 0.075], size: [frameWidth * 0.94, footerHeight], transparent: true },
    { color: intent.tierAccent, kind: 'plane', opacity: 0.22, position: [0, (frameHeight * 0.5) - headerHeight - Math.max(0.1, frameHeight * 0.02), 0.085], size: [intent.topStripWidth, Math.max(0.08, frameHeight * 0.014)], transparent: true },
    { color: accentColor, kind: 'plane', opacity: imageUrl ? 0.06 : 0.12, position: [0, 0, 0.08], size: [intent.bodyPanelWidth, bodyHeight * 0.94], transparent: true },
    { color: intent.tierAccent, kind: 'plane', opacity: 0.045, position: [0, 0, 0.1], size: [frameWidth * 0.96, frameHeight * 0.96], transparent: true },
    { color: intent.chipColor, kind: 'text', maxWidth: frameWidth * 0.72, outlineBlur: 0.12, outlineColor: '#020617', outlineWidth: 0.04, position: [frameWidth * 0.06, (frameHeight * 0.5) - (headerHeight * 0.5), 0.09], size: Math.max(0.24, frameHeight * 0.045), text: intent.semanticChip },
  ];

  if (imageUrl) {
    primitives.push(
      { color: '#020617', kind: 'plane', opacity: 0.54, position: [frameWidth * 0.22, 0, 0.082], size: [frameWidth * 0.28, bodyHeight * 0.9], transparent: true },
      { color: intent.tierAccent, kind: 'plane', opacity: 0.12, position: [frameWidth * 0.22, 0, 0.09], size: [frameWidth * 0.22, bodyHeight * 0.82], transparent: true },
    );
  }

  primitives.push(
    { color: intent.tierAccent, kind: 'text', maxWidth: frameWidth * 0.18, outlineBlur: 0.12, outlineColor: '#020617', outlineWidth: 0.03, position: [-(frameWidth * 0.36), (frameHeight * 0.5) - (headerHeight * 0.5), 0.09], size: Math.max(0.18, frameHeight * 0.03), text: tier.toUpperCase() },
    { color: '#f8fafc', kind: 'text', maxWidth: frameWidth * (imageUrl ? 0.34 : 0.72), outlineBlur: 0.14, outlineColor: '#020617', outlineWidth: 0.05, position: [frameWidth * (imageUrl ? 0.23 : 0.02), imageUrl ? frameHeight * 0.04 : 0.02, 0.09], size: Math.max(0.32, frameHeight * (imageUrl ? 0.052 : 0.082)), text: label },
    { color: '#cbd5e1', kind: 'text', maxWidth: frameWidth * 0.74, outlineBlur: 0.14, outlineColor: '#020617', outlineWidth: 0.04, position: [frameWidth * 0.08, -(frameHeight * 0.5) + (footerHeight * 0.5), 0.09], size: Math.max(0.2, frameHeight * 0.034), text: subtitle },
  );

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
    const frameWidth = socket.frameSize[0] * 0.78;
    const frameHeight = socket.frameSize[1] * 0.78;
    const headerHeight = Math.max(0.28, frameHeight * 0.12);
    const footerHeight = Math.max(0.26, frameHeight * 0.1);
    const detailDistance = tier === 'hero' ? 1100 : tier === 'elite' ? 900 : 700;
    const subtitleDistance = tier === 'hero' ? 760 : tier === 'elite' ? 620 : 480;
    const hasImage = Boolean(placement.company?.posterUrl || placement.company?.heroAssetUrl || placement.company?.logo_url);

    const renderIntent = {
      bodyPanelWidth: hasImage ? frameWidth * 0.52 : frameWidth * 0.82,
      chipColor: semantic.mode === 'landmark' ? '#fde68a' : semantic.mode === 'beacon' ? '#a5f3fc' : semantic.mode === 'signal' ? '#bfdbfe' : '#dbeafe',
      detailDistance,
      edgeGlowOpacity: tier === 'hero' ? 0.2 : tier === 'elite' ? 0.15 : 0.12,
      footerHeight,
      frameHeight,
      frameWidth,
      headerHeight,
      maxDistance: tier === 'hero' ? 1700 : tier === 'elite' ? 1350 : 980,
      panelOpacityFar: 0.44,
      panelOpacityMid: 0.58,
      panelOpacityNear: 0.72,
      semanticChip: semantic.chip,
      semanticMode: semantic.mode,
      showCenterTitleDistance: detailDistance,
      subtitleDistance,
      tierAccent,
      topStripWidth: semantic.mode === 'beacon' ? frameWidth * 0.4 : semantic.mode === 'signal' ? frameWidth * 0.52 : frameWidth * 0.66,
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
