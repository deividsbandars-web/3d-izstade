import type { ExpoBoothPlacement } from '../../../layout-engine';
import type {
  CityMass,
  CityPlane,
  CityScreenSurface,
  CityTower,
  ExpoPlanningAnchor,
  ExpoPlanningDensityCaps,
  ExpoPlanningPlacementClass,
  ExpoPlanningScreenFamily,
  ExpoPlanningViewerFacing,
  ExpoPlanningZoneId,
  ExpoPlanningZonePlan,
  ExpoZonePlannerContext,
} from '../types';

export type ExpoPlanningZoneRule = {
  allowedScreenFamilies: ExpoPlanningScreenFamily[];
  densityCaps: ExpoPlanningDensityCaps;
  id: ExpoPlanningZoneId;
  name: string;
  placementClasses: ExpoPlanningPlacementClass[];
  viewerFacing: ExpoPlanningViewerFacing;
};

export const ZONE_RULES: Record<ExpoPlanningZoneId, ExpoPlanningZoneRule> = {
  arrival: {
    allowedScreenFamilies: ['arrival-banner'],
    densityCaps: { assignmentCap: 0, screenSocketCap: 0, screenSurfaceCap: 0 },
    id: 'arrival',
    name: 'Arrival Gateway',
    placementClasses: ['gateway', 'city-support'],
    viewerFacing: 'inbound',
  },
  'left-district': {
    allowedScreenFamilies: ['district-marquee', 'district-array'],
    densityCaps: { assignmentCap: 6, screenSocketCap: 6, screenSurfaceCap: 6 },
    id: 'left-district',
    name: 'Left District Belt',
    placementClasses: ['district', 'city-support'],
    viewerFacing: 'inward',
  },
  'center-spine': {
    allowedScreenFamilies: ['center-spine'],
    densityCaps: { assignmentCap: 2, screenSocketCap: 2, screenSurfaceCap: 2 },
    id: 'center-spine',
    name: 'Center Spine',
    placementClasses: ['spine', 'gateway'],
    viewerFacing: 'bidirectional',
  },
  'right-district': {
    allowedScreenFamilies: ['district-marquee', 'district-array'],
    densityCaps: { assignmentCap: 6, screenSocketCap: 6, screenSurfaceCap: 6 },
    id: 'right-district',
    name: 'Right District Belt',
    placementClasses: ['district', 'city-support'],
    viewerFacing: 'inward',
  },
  'tower-cluster': {
    allowedScreenFamilies: ['tower-ribbon', 'tower-crown'],
    densityCaps: { assignmentCap: 10, screenSocketCap: 10, screenSurfaceCap: 10 },
    id: 'tower-cluster',
    name: 'Tower Cluster Layer',
    placementClasses: ['tower', 'city-support'],
    viewerFacing: 'outbound',
  },
  'rear-campus': {
    allowedScreenFamilies: ['rear-campus-bowl', 'rear-campus-tower'],
    densityCaps: { assignmentCap: 3, screenSocketCap: 3, screenSurfaceCap: 3 },
    id: 'rear-campus',
    name: 'Rear Campus',
    placementClasses: ['stadium'],
    viewerFacing: 'event-facing',
  },
};

export function classifyPlanningZone(position: [number, number, number]): ExpoPlanningZoneId {
  const [x, y, z] = position;

  if (z < -2200) {
    return 'rear-campus';
  }

  if (z > 120) {
    return 'arrival';
  }

  if (y >= 96 || Math.abs(x) >= 620) {
    return 'tower-cluster';
  }

  if (x < -260) {
    return 'left-district';
  }

  if (x > 260) {
    return 'right-district';
  }

  return 'center-spine';
}

export function filterEntriesForZone<T extends { position: [number, number, number] }>(
  entries: T[],
  zoneId: ExpoPlanningZoneId
) {
  return entries.filter((entry) => classifyPlanningZone(entry.position) === zoneId);
}

export function getZoneRule(zoneId: ExpoPlanningZoneId) {
  return ZONE_RULES[zoneId];
}

export function collectZoneBoothPlacements(
  zoneId: ExpoPlanningZoneId,
  boothPlacements: ExpoBoothPlacement[]
) {
  const eligible = boothPlacements.filter((placement) => {
    const sponsorTier = String(placement.company?.sponsorTier || placement.sponsorTier || '').toLowerCase();
    return placement.boothType === 'hero'
      || sponsorTier === 'hero'
      || sponsorTier === 'platinum'
      || sponsorTier === 'elite'
      || sponsorTier === 'gold'
      || sponsorTier === 'premium'
      || sponsorTier === 'silver';
  });

  switch (zoneId) {
    case 'arrival':
      return eligible.filter((placement) =>
        placement.sectorId === 'arrival-core'
        || String(placement.sectorName || '').toLowerCase().includes('arrival')
        || placement.position[2] > -80
      );
    case 'left-district':
      return eligible.filter((placement) => placement.position[0] < -20 && placement.position[2] > -2200);
    case 'center-spine':
      return eligible.filter((placement) => Math.abs(placement.position[0]) <= 180 && placement.position[2] > -2200);
    case 'right-district':
      return eligible.filter((placement) => placement.position[0] > 20 && placement.position[2] > -2200);
    case 'tower-cluster':
      return eligible;
    case 'rear-campus':
      return eligible;
    default:
      return eligible;
  }
}

function createAnchorsFromEntries(
  ownerKind: ExpoPlanningAnchor['ownerKind'],
  entries: Array<{ id: string; position: [number, number, number] }>
) {
  return entries.map((entry) => ({
    id: `${ownerKind}-anchor:${entry.id}`,
    ownerId: entry.id,
    ownerKind,
    position: entry.position,
  }));
}

export function buildZoneAnchors(args: {
  masses?: CityMass[];
  planes?: CityPlane[];
  screenSurfaces?: CityScreenSurface[];
  towers?: CityTower[];
}) {
  return [
    ...createAnchorsFromEntries('plane', args.planes ?? []),
    ...createAnchorsFromEntries('mass', args.masses ?? []),
    ...createAnchorsFromEntries('surface', args.screenSurfaces ?? []),
    ...createAnchorsFromEntries('tower', args.towers ?? []),
  ];
}

export function createZonePlan(args: {
  assignments?: ExpoPlanningZonePlan['assignments'];
  context: ExpoZonePlannerContext;
  id: ExpoPlanningZoneId;
  masses?: CityMass[];
  planes?: CityPlane[];
  screenSockets?: ExpoPlanningZonePlan['screenSockets'];
  screenSurfaces?: ExpoPlanningZonePlan['screenSurfaces'];
  towers?: CityTower[];
  zoneExtension?: ExpoPlanningZonePlan['zoneExtension'];
}) {
  const rule = getZoneRule(args.id);
  const planes = args.planes ?? [];
  const masses = args.masses ?? [];
  const towers = args.towers ?? [];
  const screenSurfaces = (args.screenSurfaces ?? []).slice(0, rule.densityCaps.screenSurfaceCap);
  const screenSockets = (args.screenSockets ?? []).slice(0, rule.densityCaps.screenSocketCap);
  const assignments = (args.assignments ?? []).slice(0, rule.densityCaps.assignmentCap);

  return {
    allowedScreenFamilies: rule.allowedScreenFamilies,
    anchors: buildZoneAnchors({ masses, planes, screenSurfaces, towers }),
    assignments,
    densityCaps: rule.densityCaps,
    id: rule.id,
    masses,
    name: rule.name,
    placementClasses: rule.placementClasses,
    planes,
    screenSockets,
    screenSurfaces,
    towers,
    viewerFacing: rule.viewerFacing,
    zoneExtension: args.zoneExtension,
  } satisfies ExpoPlanningZonePlan;
}
