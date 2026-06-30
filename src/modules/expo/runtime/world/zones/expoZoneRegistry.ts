import type { ExpoResolvedQualityTier } from '../quality/expoQualitySettings';

export type ExpoZoneId =
  | 'arrival'
  | 'center'
  | 'reactor'
  | 'sponsorBoulevard'
  | 'towerCluster'
  | 'demoArena'
  | 'skyMarket'
  | 'rearCampus'
  | 'perimeter'
  | 'legacy'
  | 'unknown';

export type ExpoZoneVisibilityState =
  | 'active'
  | 'adjacent'
  | 'distant'
  | 'hiddenCandidate'
  | 'alwaysVisible';

export type ExpoZoneGroupDetailRole =
  | 'major'
  | 'support'
  | 'perimeter'
  | 'legacy'
  | 'landmark'
  | 'commercial'
  | 'demo'
  | 'unknown';

export type ExpoZoneMetadata = {
  adjacentZones: ExpoZoneId[];
  center: [number, number, number];
  description: string;
  id: ExpoZoneId;
  isCommercialZone: boolean;
  isFutureDemoZone: boolean;
  isLandmarkZone: boolean;
  label: string;
  priority: number;
  radius: number;
};

export type ExpoZoneGroupDefinition = {
  alwaysVisible?: boolean;
  canReduceInLowQuality?: boolean;
  canHideInLowQuality?: boolean;
  description: string;
  detailRole?: ExpoZoneGroupDetailRole;
  id: string;
  label: string;
  preserveWhenActive?: boolean;
  preserveWhenAdjacent?: boolean;
  zoneId: ExpoZoneId;
};

export type ExpoZoneVisibilityPolicyInput = {
  activeZoneId: ExpoZoneId;
  allowLowQualityCull?: boolean;
  qualityTier: ExpoResolvedQualityTier;
  runtimeCaptureSafe: boolean;
};

export const EXPO_ZONE_REGISTRY: ExpoZoneMetadata[] = [
  {
    adjacentZones: ['center', 'sponsorBoulevard', 'perimeter'],
    center: [0, 0, 220],
    description: 'Arrival gate, first city read, and front civic axis.',
    id: 'arrival',
    isCommercialZone: false,
    isFutureDemoZone: false,
    isLandmarkZone: true,
    label: 'Arrival',
    priority: 8,
    radius: 820,
  },
  {
    adjacentZones: ['arrival', 'sponsorBoulevard', 'skyMarket', 'towerCluster', 'rearCampus'],
    center: [0, 0, -680],
    description: 'Central civic spine, array band, and city core.',
    id: 'center',
    isCommercialZone: true,
    isFutureDemoZone: false,
    isLandmarkZone: true,
    label: 'Center',
    priority: 9,
    radius: 1160,
  },
  {
    adjacentZones: ['rearCampus', 'demoArena', 'skyMarket'],
    center: [-1840, 0, -2860],
    description: 'AI reactor core, energy grid, oracle, and sky compass landmark cluster.',
    id: 'reactor',
    isCommercialZone: false,
    isFutureDemoZone: false,
    isLandmarkZone: true,
    label: 'AI Reactor',
    priority: 9,
    radius: 1900,
  },
  {
    adjacentZones: ['arrival', 'center', 'towerCluster'],
    center: [0, 0, -640],
    description: 'Sponsor boulevard, marquee screens, screen-heavy commercial frontage.',
    id: 'sponsorBoulevard',
    isCommercialZone: true,
    isFutureDemoZone: false,
    isLandmarkZone: false,
    label: 'Sponsor Boulevard',
    priority: 10,
    radius: 1320,
  },
  {
    adjacentZones: ['center', 'sponsorBoulevard', 'skyMarket', 'rearCampus'],
    center: [740, 0, -1040],
    description: 'Mega towers, vertical access, TV tower, and high-rise cluster.',
    id: 'towerCluster',
    isCommercialZone: true,
    isFutureDemoZone: false,
    isLandmarkZone: true,
    label: 'Tower Cluster',
    priority: 9,
    radius: 1600,
  },
  {
    adjacentZones: ['rearCampus', 'reactor'],
    center: [0, 0, -4220],
    description: 'Future demo arena and rear media axis.',
    id: 'demoArena',
    isCommercialZone: true,
    isFutureDemoZone: true,
    isLandmarkZone: true,
    label: 'Demo Arena',
    priority: 9,
    radius: 1680,
  },
  {
    adjacentZones: ['center', 'towerCluster', 'reactor'],
    center: [0, 0, -520],
    description: 'Sky market spine and multi-level market bridge.',
    id: 'skyMarket',
    isCommercialZone: true,
    isFutureDemoZone: false,
    isLandmarkZone: true,
    label: 'Sky Market',
    priority: 9,
    radius: 1180,
  },
  {
    adjacentZones: ['center', 'towerCluster', 'reactor', 'demoArena', 'perimeter'],
    center: [0, 0, -2920],
    description: 'Rear campus/stadium area and transition from the city spine.',
    id: 'rearCampus',
    isCommercialZone: true,
    isFutureDemoZone: true,
    isLandmarkZone: true,
    label: 'Rear Campus',
    priority: 9,
    radius: 2440,
  },
  {
    adjacentZones: ['arrival', 'center', 'rearCampus'],
    center: [0, 0, -2400],
    description: 'Perimeter walls, ground boundary, skyline/background support.',
    id: 'perimeter',
    isCommercialZone: false,
    isFutureDemoZone: false,
    isLandmarkZone: false,
    label: 'Perimeter',
    priority: 4,
    radius: 5200,
  },
  {
    adjacentZones: ['perimeter'],
    center: [0, 0, -1800],
    description: 'Legacy or compatibility scene scaffolding.',
    id: 'legacy',
    isCommercialZone: false,
    isFutureDemoZone: false,
    isLandmarkZone: false,
    label: 'Legacy',
    priority: 1,
    radius: 5200,
  },
  {
    adjacentZones: [],
    center: [0, 0, 0],
    description: 'Unmapped objects remain visible.',
    id: 'unknown',
    isCommercialZone: false,
    isFutureDemoZone: false,
    isLandmarkZone: false,
    label: 'Unknown',
    priority: 10,
    radius: Number.POSITIVE_INFINITY,
  },
];

export const EXPO_ZONE_GROUP_DEFINITIONS: ExpoZoneGroupDefinition[] = [
  {
    alwaysVisible: true,
    description: 'Global ground plane and baseline world surface.',
    detailRole: 'major',
    id: 'world-ground-global',
    label: 'Global Ground',
    preserveWhenActive: true,
    preserveWhenAdjacent: true,
    zoneId: 'perimeter',
  },
  {
    description: 'Main clean city skeleton root.',
    detailRole: 'major',
    id: 'city-skeleton-root',
    label: 'City Skeleton',
    zoneId: 'center',
  },
  {
    description: 'City floor planes and water court.',
    detailRole: 'major',
    id: 'city-floor-planes',
    label: 'City Floor Planes',
    zoneId: 'center',
  },
  {
    description: 'City massing and architectural blocks.',
    detailRole: 'major',
    id: 'city-masses',
    label: 'City Masses',
    zoneId: 'center',
  },
  {
    description: 'Vertical access nodes and elevator routes.',
    detailRole: 'landmark',
    id: 'city-vertical-access',
    label: 'Vertical Access',
    zoneId: 'towerCluster',
  },
  {
    canReduceInLowQuality: true,
    canHideInLowQuality: true,
    description: 'City perimeter shell and walls. Hidden only with explicit zoneCull debug flag.',
    detailRole: 'perimeter',
    id: 'city-perimeter',
    label: 'City Perimeter',
    preserveWhenActive: true,
    preserveWhenAdjacent: true,
    zoneId: 'perimeter',
  },
  {
    description: 'City sponsor screen host surfaces.',
    detailRole: 'commercial',
    id: 'city-screen-surfaces',
    label: 'City Screen Surfaces',
    zoneId: 'sponsorBoulevard',
  },
  {
    description: 'City screen sockets and debug host markers.',
    detailRole: 'commercial',
    id: 'city-screen-sockets',
    label: 'City Screen Sockets',
    zoneId: 'sponsorBoulevard',
  },
  {
    description: 'City screen assignments and billboard texture planes.',
    detailRole: 'commercial',
    id: 'city-screen-assignments',
    label: 'City Screen Assignments',
    zoneId: 'sponsorBoulevard',
  },
  {
    description: 'Mega city landmarks including arrival, sky market, and reactor-related structures.',
    detailRole: 'landmark',
    id: 'city-mega-landmarks',
    label: 'Mega Landmarks',
    zoneId: 'skyMarket',
  },
  {
    description: 'Tower cluster structures.',
    detailRole: 'landmark',
    id: 'city-towers',
    label: 'City Towers',
    zoneId: 'towerCluster',
  },
  {
    description: 'Rear campus root.',
    detailRole: 'major',
    id: 'rear-campus-root',
    label: 'Rear Campus',
    zoneId: 'rearCampus',
  },
  {
    canReduceInLowQuality: true,
    canHideInLowQuality: true,
    description: 'Rear campus perimeter shell. Hidden only with explicit zoneCull debug flag.',
    detailRole: 'perimeter',
    id: 'rear-campus-perimeter',
    label: 'Rear Campus Perimeter',
    preserveWhenActive: true,
    preserveWhenAdjacent: true,
    zoneId: 'perimeter',
  },
  {
    description: 'Rear campus recovered and primary structures.',
    detailRole: 'major',
    id: 'rear-campus-structures',
    label: 'Rear Campus Structures',
    zoneId: 'rearCampus',
  },
  {
    description: 'Rear campus screen host shells and media surfaces.',
    detailRole: 'demo',
    id: 'rear-campus-screens',
    label: 'Rear Campus Screens',
    zoneId: 'demoArena',
  },
  {
    description: 'Rear campus colliders and traversal blockers.',
    detailRole: 'support',
    id: 'rear-campus-colliders',
    label: 'Rear Campus Colliders',
    zoneId: 'rearCampus',
  },
  {
    description: 'Runtime sponsor booth group.',
    detailRole: 'commercial',
    id: 'district-booths',
    label: 'District Booths',
    zoneId: 'sponsorBoulevard',
  },
  {
    alwaysVisible: true,
    description: 'Wayfinding and navigation helpers.',
    detailRole: 'support',
    id: 'world-wayfinding',
    label: 'Wayfinding',
    preserveWhenActive: true,
    preserveWhenAdjacent: true,
    zoneId: 'center',
  },
  {
    alwaysVisible: true,
    description: 'Promenade runtime placeholder and future promenade group.',
    detailRole: 'support',
    id: 'world-promenade',
    label: 'Promenade',
    preserveWhenActive: true,
    preserveWhenAdjacent: true,
    zoneId: 'center',
  },
  {
    canReduceInLowQuality: true,
    canHideInLowQuality: true,
    description: 'Curated skyline ring/background. Hidden only with explicit zoneCull debug flag.',
    detailRole: 'legacy',
    id: 'curated-skyline-ring',
    label: 'Skyline Ring',
    preserveWhenActive: true,
    preserveWhenAdjacent: true,
    zoneId: 'legacy',
  },
];

const ZONE_BY_ID = new Map(EXPO_ZONE_REGISTRY.map((zone) => [zone.id, zone]));

function normalizeTuple3(position: [number, number, number] | number[] | null | undefined): [number, number, number] | null {
  if (!Array.isArray(position) || position.length < 3) {
    return null;
  }

  const tuple: [number, number, number] = [Number(position[0]), Number(position[1]), Number(position[2])];
  return tuple.every(Number.isFinite) ? tuple : null;
}

export function getExpoZoneById(zoneId: ExpoZoneId | string | null | undefined) {
  return ZONE_BY_ID.get((zoneId ?? 'unknown') as ExpoZoneId) ?? ZONE_BY_ID.get('unknown')!;
}

export function getAdjacentExpoZones(zoneId: ExpoZoneId | string | null | undefined) {
  return getExpoZoneById(zoneId).adjacentZones.map((id) => getExpoZoneById(id));
}

export function resolveExpoZoneFromReviewId(reviewZoneId: string | null | undefined): ExpoZoneId | null {
  const zone = String(reviewZoneId ?? '').trim().toLowerCase();
  if (!zone) {
    return null;
  }

  if (zone.includes('corner') || zone.includes('perimeter')) {
    return 'perimeter';
  }

  if (
    zone.includes('sponsor-boulevard')
    || zone.includes('marquee')
    || zone.includes('edge-far')
  ) {
    return 'sponsorBoulevard';
  }

  if (
    zone.includes('tower-cluster')
    || zone.includes('television-tower')
    || zone.includes('skybridge-landmark')
    || zone.includes('civilization-monument')
    || zone.includes('orbital-broadcast')
  ) {
    return 'towerCluster';
  }

  if (zone.includes('sky-market')) {
    return 'skyMarket';
  }

  if (zone.includes('reactor') || zone.includes('energy-grid') || zone.includes('oracle') || zone.includes('compass')) {
    return 'reactor';
  }

  if (
    zone.includes('stadium-feed')
    || zone.includes('rear-campus-center')
    || zone.includes('orbital-scoregate')
    || zone.includes('landmark-feed')
    || zone.includes('sky-slab-feed')
    || zone.includes('mega-hall')
    || zone.includes('needle-crown')
    || zone.includes('demo')
  ) {
    return 'demoArena';
  }

  if (zone.includes('rear-campus') || zone.includes('stadium') || zone.includes('ground-seam') || zone.includes('genesis-portal')) {
    return 'rearCampus';
  }

  if (zone.includes('arrival')) {
    return 'arrival';
  }

  if (zone.includes('array') || zone.includes('center-spine') || zone.includes('mid-start')) {
    return 'center';
  }

  return null;
}

export function resolveExpoZoneFromPosition(position: [number, number, number] | number[] | null | undefined): ExpoZoneId {
  const tuple = normalizeTuple3(position);
  if (!tuple) {
    return 'unknown';
  }

  const candidates = EXPO_ZONE_REGISTRY
    .filter((zone) => zone.id !== 'unknown' && zone.id !== 'legacy')
    .map((zone) => {
      const dx = tuple[0] - zone.center[0];
      const dz = tuple[2] - zone.center[2];
      const distance = Math.hypot(dx, dz);
      return {
        distance,
        score: distance / Math.max(1, zone.radius),
        zone,
      };
    })
    .sort((left, right) => left.score - right.score);

  const inside = candidates.find((candidate) => candidate.score <= 1);
  return (inside ?? candidates[0])?.zone.id ?? 'unknown';
}

export function resolveExpoZoneVisibilityState(
  zoneId: ExpoZoneId,
  input: ExpoZoneVisibilityPolicyInput,
): ExpoZoneVisibilityState {
  const zone = getExpoZoneById(zoneId);
  if (zone.id === 'unknown') {
    return 'alwaysVisible';
  }

  if (zone.id === input.activeZoneId) {
    return 'active';
  }

  if (getExpoZoneById(input.activeZoneId).adjacentZones.includes(zone.id)) {
    return 'adjacent';
  }

  if (input.runtimeCaptureSafe || input.qualityTier !== 'low') {
    return 'distant';
  }

  if (
    zone.priority <= 4
    && !zone.isCommercialZone
    && !zone.isFutureDemoZone
    && !zone.isLandmarkZone
  ) {
    return 'hiddenCandidate';
  }

  return 'distant';
}

export function getExpoZoneDebugLabel(zoneId: ExpoZoneId | string | null | undefined) {
  const zone = getExpoZoneById(zoneId);
  return `${zone.label} (${zone.id})`;
}

export function shouldEnableExpoZoneDebug() {
  if (typeof window === 'undefined') {
    return false;
  }

  return new URLSearchParams(window.location.search).get('zoneDebug') === '1';
}

export function shouldEnableExpoZoneCull() {
  if (typeof window === 'undefined') {
    return false;
  }

  return new URLSearchParams(window.location.search).get('zoneCull') === '1';
}
