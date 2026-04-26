import { EXPO_BOULEVARD_LAYOUT, type ExpoPlacementNodeType, type SponsorBoulevardPlan } from './lib/boulevardLayout.js';

export type ExpoWalkRegionType =
  | 'arrival'
  | 'spine'
  | 'promenade'
  | 'secondary-loop'
  | 'discovery-lane'
  | 'scenic-edge'
  | 'booth-pocket'
  | 'sector-pocket';

export type ExpoWalkRegion = {
  id: string;
  maxX: number;
  maxZ: number;
  minX: number;
  minZ: number;
  type: ExpoWalkRegionType;
};

export type ExpoPlayBounds = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};

export type ExpoWalkRegionPlacementInput = {
  id: string;
  clusterIndex?: number;
  layoutFootprint?: SponsorBoulevardPlan['footprint'];
  nodeType?: ExpoPlacementNodeType;
  position: [number, number, number];
};

export type ExpoWalkRegionContract = {
  arrivalZone: ExpoWalkRegion;
  centralSpine: ExpoWalkRegion;
  rearCampusLink: ExpoWalkRegion;
  rearCampusPlaza: ExpoWalkRegion;
  rearCampusInterior: ExpoWalkRegion;
  secondaryLoops: ExpoWalkRegion[];
  discoveryLanes: ExpoWalkRegion[];
  sectorPockets: ExpoWalkRegion[];
  scenicEdges: ExpoWalkRegion[];
  boothPockets: ExpoWalkRegion[];
  walkRegions: ExpoWalkRegion[];
};

function getFallbackFootprint() {
  return {
    maxX: EXPO_BOULEVARD_LAYOUT.standardX + EXPO_BOULEVARD_LAYOUT.playBoundsPaddingX,
    maxZ: EXPO_BOULEVARD_LAYOUT.arrivalZ + EXPO_BOULEVARD_LAYOUT.playBoundsPaddingZ,
    minX: -EXPO_BOULEVARD_LAYOUT.standardX - EXPO_BOULEVARD_LAYOUT.playBoundsPaddingX,
    minZ: -EXPO_BOULEVARD_LAYOUT.standardZStartOffset - EXPO_BOULEVARD_LAYOUT.playBoundsPaddingZ,
  };
}

export function resolveExpoLayoutFootprint(
  boothPlacements: ExpoWalkRegionPlacementInput[],
  footprint?: SponsorBoulevardPlan['footprint']
) {
  return boothPlacements[0]?.layoutFootprint
    ?? (boothPlacements as ExpoWalkRegionPlacementInput[] & { footprint?: SponsorBoulevardPlan['footprint'] }).footprint
    ?? footprint
    ?? getFallbackFootprint();
}

export function buildExpoPlayBoundsFromPlacements(
  boothPlacements: ExpoWalkRegionPlacementInput[],
  footprint?: SponsorBoulevardPlan['footprint']
): ExpoPlayBounds {
  const resolvedFootprint = resolveExpoLayoutFootprint(boothPlacements, footprint);
  const boothXs = boothPlacements.map((placement) => placement.position[0]);
  const boothZs = boothPlacements.map((placement) => placement.position[2]);
  const allXs = boothXs.length > 0 ? [...boothXs, resolvedFootprint.minX, resolvedFootprint.maxX] : [resolvedFootprint.minX, resolvedFootprint.maxX];
  const allZs = boothZs.length > 0 ? [...boothZs, resolvedFootprint.minZ, resolvedFootprint.maxZ] : [resolvedFootprint.minZ, resolvedFootprint.maxZ];

  return {
    minX: Math.min(...allXs) - 5200,
    maxX: Math.max(...allXs) + 5200,
    minZ: Math.min(...allZs) - 6400,
    maxZ: Math.max(...allZs) + 320,
  };
}

function buildBoothPocketRegion(placement: ExpoWalkRegionPlacementInput, index: number): ExpoWalkRegion {
  const side = placement.position[0] < 0 ? -1 : 1;
  const depth = placement.nodeType === 'hero_left' || placement.nodeType === 'hero_right' ? 34 : 28;
  const outerEdge = side < 0
    ? Math.max(-560, placement.position[0] - 54)
    : Math.min(560, placement.position[0] + 54);
  const innerEdge = side < 0 ? -112 : 112;

  return {
    id: `booth-pocket-${placement.id}-${index}`,
    maxX: Math.max(innerEdge, outerEdge),
    maxZ: placement.position[2] + 46,
    minX: Math.min(innerEdge, outerEdge),
    minZ: placement.position[2] - (depth + 42),
    type: 'booth-pocket',
  };
}

function buildSectorPocketRegion(clusterIndex: number, placements: ExpoWalkRegionPlacementInput[]): ExpoWalkRegion {
  const xs = placements.map((placement) => placement.position[0]);
  const zs = placements.map((placement) => placement.position[2]);
  const hasLeft = xs.some((x) => x < 0);
  const hasRight = xs.some((x) => x > 0);
  const minBoothX = Math.min(...xs);
  const maxBoothX = Math.max(...xs);
  const minBoothZ = Math.min(...zs);
  const maxBoothZ = Math.max(...zs);

  return {
    id: `sector-pocket-${clusterIndex}`,
    maxX: Math.min(620, hasRight ? maxBoothX + 148 : 148),
    maxZ: maxBoothZ + 128,
    minX: Math.max(-620, hasLeft ? minBoothX - 148 : -148),
    minZ: minBoothZ - 212,
    type: 'sector-pocket',
  };
}

function buildSecondaryLoopRegions(footprint: SponsorBoulevardPlan['footprint']): ExpoWalkRegion[] {
  const minRouteZ = footprint.minZ - 28;
  const maxRouteZ = EXPO_BOULEVARD_LAYOUT.arrivalZ - 16;

  return [
    { id: 'secondary-loop-left', maxX: -96, maxZ: maxRouteZ, minX: -472, minZ: minRouteZ, type: 'secondary-loop' },
    { id: 'secondary-loop-right', maxX: 472, maxZ: maxRouteZ, minX: 96, minZ: minRouteZ, type: 'secondary-loop' },
  ];
}

function buildScenicEdgeRegions(footprint: SponsorBoulevardPlan['footprint']): ExpoWalkRegion[] {
  const minRouteZ = footprint.minZ - 10;
  const maxRouteZ = EXPO_BOULEVARD_LAYOUT.arrivalZ - 26;

  return [
    { id: 'scenic-edge-left', maxX: -472, maxZ: maxRouteZ, minX: -720, minZ: minRouteZ, type: 'scenic-edge' },
    { id: 'scenic-edge-right', maxX: 720, maxZ: maxRouteZ, minX: 472, minZ: minRouteZ, type: 'scenic-edge' },
  ];
}

function buildDiscoveryLaneRegions(clusterIndex: number, placements: ExpoWalkRegionPlacementInput[]): ExpoWalkRegion[] {
  const xs = placements.map((placement) => placement.position[0]);
  const zs = placements.map((placement) => placement.position[2]);
  const minBoothZ = Math.min(...zs);
  const maxBoothZ = Math.max(...zs);
  const minBoothX = Math.min(...xs);
  const maxBoothX = Math.max(...xs);
  const lanes: ExpoWalkRegion[] = [];

  if (xs.some((x) => x < 0)) {
    lanes.push({
      id: `discovery-lane-left-${clusterIndex}`,
      maxX: Math.min(-84, minBoothX + 48),
      maxZ: maxBoothZ + 92,
      minX: Math.max(-560, minBoothX - 168),
      minZ: minBoothZ - 108,
      type: 'discovery-lane',
    });
  }

  if (xs.some((x) => x > 0)) {
    lanes.push({
      id: `discovery-lane-right-${clusterIndex}`,
      maxX: Math.min(560, maxBoothX + 168),
      maxZ: maxBoothZ + 92,
      minX: Math.max(84, maxBoothX - 48),
      minZ: minBoothZ - 108,
      type: 'discovery-lane',
    });
  }

  return lanes;
}

export function buildExpoWalkRegionContract(
  boothPlacements: ExpoWalkRegionPlacementInput[],
  footprint?: SponsorBoulevardPlan['footprint']
): ExpoWalkRegionContract {
  const resolvedFootprint = resolveExpoLayoutFootprint(boothPlacements, footprint);
  const playBounds = buildExpoPlayBoundsFromPlacements(boothPlacements, resolvedFootprint);
  const arrivalZone: ExpoWalkRegion = {
    id: 'arrival-zone',
    maxX: 420,
    maxZ: playBounds.maxZ - 18,
    minX: -420,
    minZ: EXPO_BOULEVARD_LAYOUT.arrivalZ - 196,
    type: 'arrival',
  };
  const centralSpine: ExpoWalkRegion = {
    id: 'central-spine',
    maxX: 156,
    maxZ: resolvedFootprint.maxZ - 20,
    minX: -156,
    minZ: resolvedFootprint.minZ - 128,
    type: 'spine',
  };
  const rearCampusLink: ExpoWalkRegion = {
    id: 'rear-campus-link',
    maxX: 1320,
    maxZ: resolvedFootprint.minZ - 64,
    minX: -1320,
    minZ: resolvedFootprint.minZ - 2320,
    type: 'promenade',
  };
  const rearCampusPlaza: ExpoWalkRegion = {
    id: 'rear-campus-plaza',
    maxX: 4200,
    maxZ: resolvedFootprint.minZ - 2200,
    minX: -4200,
    minZ: resolvedFootprint.minZ - 5200,
    type: 'sector-pocket',
  };
  const rearCampusInterior: ExpoWalkRegion = {
    id: 'rear-campus-interior',
    maxX: 4300,
    maxZ: resolvedFootprint.minZ - 1120,
    minX: -4300,
    minZ: resolvedFootprint.minZ - 3600,
    type: 'promenade',
  };

  const sectorPlacementsByCluster = new Map<number, ExpoWalkRegionPlacementInput[]>();
  boothPlacements.forEach((placement) => {
    const clusterIndex = Number(placement.clusterIndex ?? -1);
    if (clusterIndex < 0) {
      return;
    }

    const existing = sectorPlacementsByCluster.get(clusterIndex) ?? [];
    existing.push(placement);
    sectorPlacementsByCluster.set(clusterIndex, existing);
  });

  const orderedClusters = Array.from(sectorPlacementsByCluster.entries()).sort((left, right) => left[0] - right[0]);
  const secondaryLoops = buildSecondaryLoopRegions(resolvedFootprint);
  const discoveryLanes = orderedClusters.flatMap(([clusterIndex, placements]) => buildDiscoveryLaneRegions(clusterIndex, placements));
  const sectorPockets = orderedClusters.map(([clusterIndex, placements]) => buildSectorPocketRegion(clusterIndex, placements));
  const scenicEdges = buildScenicEdgeRegions(resolvedFootprint);
  const boothPockets = boothPlacements.map(buildBoothPocketRegion);

  return {
    arrivalZone,
    centralSpine,
    rearCampusLink,
    rearCampusPlaza,
    rearCampusInterior,
    secondaryLoops,
    discoveryLanes,
    sectorPockets,
    scenicEdges,
    boothPockets,
    walkRegions: [arrivalZone, centralSpine, rearCampusLink, rearCampusPlaza, rearCampusInterior, ...secondaryLoops, ...discoveryLanes, ...sectorPockets, ...scenicEdges, ...boothPockets],
  };
}

export function isPointWithinExpoWalkRegions(
  point: { x: number; z: number } | [number, number],
  regions: ExpoWalkRegion[]
) {
  const x = Array.isArray(point) ? point[0] : point.x;
  const z = Array.isArray(point) ? point[1] : point.z;

  return regions.some((region) => x >= region.minX && x <= region.maxX && z >= region.minZ && z <= region.maxZ);
}
