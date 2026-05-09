import type {
  CanonicalWorldPlan,
  CityScreenAssignment,
  CityScreenSocket,
  CityTower,
  ExpoPlanningSectionId,
  ExpoPlanningZonePlan,
} from '../../planning/types';
import { resolveRearCampusAnchoredZ } from '../ExpoRearCampusLayout';
import {
  buildWorldCityMegaLandmarkBounds,
  filterWorldCityMegaLandmarkBounds,
} from '../WorldCityMegaLandmarkBounds';
import {
  buildExpoBoothLocalFootprint,
  type ExpoBoothLocalFootprint,
} from '../../../../../shared/expo/lib/boothLocalFootprint';

export type WorldObjectLayer =
  | 'booth'
  | 'city-mass'
  | 'city-plane'
  | 'city-screen-assignment'
  | 'city-screen-socket'
  | 'city-screen-surface'
  | 'city-tower'
  | 'mega-landmark'
  | 'stadium-pavilion'
  | 'stadium-plane'
  | 'stadium-screen-assignment'
  | 'stadium-screen-feed'
  | 'stadium-screen-socket'
  | 'stadium-screen-surface'
  | 'stadium-structure'
  | 'stadium-tower';

export type WorldObjectRegistryEntry = {
  aliases?: string[];
  diagnosticOwners: string[];
  groundOwner?: 'city' | 'stadium' | 'transition';
  groundRole?: 'detail' | 'structural';
  id: string;
  interactionOwner: string | null;
  layer: WorldObjectLayer;
  planningSections?: ExpoPlanningSectionId[];
  planningZone: string | null;
  position: [number, number, number];
  rotation?: [number, number, number];
  safeEditSeam: string;
  size?: [number, number, number];
  sourceFile: string;
  sourceFunction: string;
  sourceKind: string;
};

type BuildCityWorldObjectRegistryArgs = {
  districtCount: number;
  districtStride: number;
  plan: CanonicalWorldPlan;
};

type BuildStadiumWorldObjectRegistryArgs = {
  campusCenterZ: number;
  rearCampusPlan: ExpoPlanningZonePlan;
};

function createEntry(entry: WorldObjectRegistryEntry): WorldObjectRegistryEntry {
  return entry;
}

function baseAnchoredBoxCenter(
  position: [number, number, number],
  size: [number, number, number],
): [number, number, number] {
  return [position[0], size[1] * 0.5, position[2]];
}

function resolveCityTowerAuditSize(tower: CityTower): [number, number, number] {
  return [
    Math.max(tower.baseSize[0], tower.upperSize[0]),
    tower.baseSize[1] + tower.upperSize[1],
    Math.max(tower.baseSize[2], tower.upperSize[2]),
  ];
}

function resolveCityGroundOwner(planeId: string): NonNullable<WorldObjectRegistryEntry['groundOwner']> {
  return planeId.includes('seam') || planeId.includes('transition')
    ? 'transition'
    : 'city';
}

function resolveStadiumGroundOwner(planeId: string): NonNullable<WorldObjectRegistryEntry['groundOwner']> {
  return planeId.includes('city-threshold')
    ? 'transition'
    : 'stadium';
}

const STABLE_DISTRICT_ALIASES = ['arrival-core', 'meetings', 'showcase-row'] as const;
const TOWER_SEMANTIC_SUFFIX_PATTERN =
  /((?:outer-support|support|hero|mid)-tower-(?:left|right)(?:-(?:tower-ribbon|crown-beacon))?)$/;

function compactAliases(id: string, aliases: Array<string | null | undefined>) {
  const compact = Array.from(new Set(
    aliases
      .map((alias) => (alias ?? '').trim())
      .filter((alias) => alias && alias !== id),
  ));

  return compact.length > 0 ? compact : undefined;
}

function buildStableTowerAliases(
  entries: ReadonlyArray<{ id: string; position: [number, number, number] }>,
) {
  const groupedEntries = new Map<string, Array<{ id: string; position: [number, number, number] }>>();

  for (const entry of entries) {
    const suffix = entry.id.match(TOWER_SEMANTIC_SUFFIX_PATTERN)?.[1];
    if (!suffix) {
      continue;
    }

    groupedEntries.set(suffix, [...(groupedEntries.get(suffix) ?? []), entry]);
  }

  const aliasesById = new Map<string, string[]>();
  for (const [suffix, group] of groupedEntries) {
    group
      .slice()
      .sort((a, b) => b.position[2] - a.position[2])
      .forEach((entry, index) => {
        const districtAlias = STABLE_DISTRICT_ALIASES[index];
        if (!districtAlias) {
          return;
        }

        const alias = `${districtAlias}-${suffix}`;
        if (alias !== entry.id) {
          aliasesById.set(entry.id, [...(aliasesById.get(entry.id) ?? []), alias]);
        }
      });
  }

  return aliasesById;
}

function buildMegaLandmarkEntries(args: {
  districtCount: number;
  districtStride: number;
  stadiumReserve: CanonicalWorldPlan['stadiumReserve'];
}): WorldObjectRegistryEntry[] {
  const landmarks = filterWorldCityMegaLandmarkBounds(
    buildWorldCityMegaLandmarkBounds(args),
    args.stadiumReserve,
  );

  return landmarks.map(({ id, position, size }) => createEntry({
    diagnosticOwners: [],
    id,
    interactionOwner: null,
    layer: 'mega-landmark',
    planningZone: 'canonical-city',
    position,
    safeEditSeam: 'src/modules/expo/runtime/world/WorldCityMegaLandmarks.tsx',
    size,
    sourceFile: 'src/modules/expo/runtime/world/WorldCityMegaLandmarks.tsx',
    sourceFunction: 'WorldCityMegaLandmarks',
    sourceKind: 'runtime-landmark',
  }));
}

function buildAssignmentEntries(args: {
  assignments: CityScreenAssignment[];
  layer: 'city-screen-assignment' | 'stadium-screen-assignment';
  planningZone: string;
  sockets: CityScreenSocket[];
}): WorldObjectRegistryEntry[] {
  const socketById = new Map(args.sockets.map((socket) => [socket.id, socket]));

  return args.assignments.flatMap((assignment) => {
    const socket = socketById.get(assignment.socketId);
    if (!socket) {
      return [];
    }

    return [createEntry({
      diagnosticOwners: [
        'src/modules/expo/runtime/planning/screens/screenSurfaceBoundsDiagnostics.ts',
        'src/modules/expo/runtime/planning/screens/screenSurfaceOverlapDiagnostics.ts',
      ],
      id: assignment.id,
      interactionOwner: 'src/modules/expo/runtime/world/WorldCityScreenAssignments.tsx',
      layer: args.layer,
      planningSections: assignment.sections,
      planningZone: args.planningZone,
      position: socket.position,
      safeEditSeam: 'src/modules/expo/runtime/planning/screens/buildScreenAssignmentPlan.ts',
      sourceFile: 'src/modules/expo/runtime/planning/screens/buildScreenAssignmentPlan.ts',
      sourceFunction: 'buildZoneScreenAssignmentPlan',
      sourceKind: 'screen-assignment',
    })];
  });
}

export function buildCityWorldObjectRegistry({
  districtCount,
  districtStride,
  plan,
}: BuildCityWorldObjectRegistryArgs): WorldObjectRegistryEntry[] {
  const towerAliasesById = buildStableTowerAliases(plan.filteredTowerLandmarks);
  const screenSurfaceAliasesById = buildStableTowerAliases(plan.filteredScreenSurfaces);

  return [
    ...plan.arrivalPlanes.map((plane) => createEntry({
      diagnosticOwners: [],
      groundOwner: resolveCityGroundOwner(plane.id),
      groundRole: 'structural',
      id: plane.id,
      interactionOwner: null,
      layer: 'city-plane',
      planningSections: plane.sections,
      planningZone: 'canonical-city',
      position: plane.position,
      rotation: [0, 0, 0],
      safeEditSeam: 'src/modules/expo/runtime/planning/world-plan/buildCanonicalWorldPlan.ts',
      size: [plane.size[0], 2, plane.size[1]],
      sourceFile: 'src/modules/expo/runtime/planning/world-plan/buildCanonicalWorldPlan.ts',
      sourceFunction: 'buildCanonicalWorldPlan',
      sourceKind: 'city-plane',
    })),
    ...plan.promenadeAxisPlanes.map((plane) => createEntry({
      diagnosticOwners: [],
      groundOwner: resolveCityGroundOwner(plane.id),
      groundRole: 'structural',
      id: plane.id,
      interactionOwner: null,
      layer: 'city-plane',
      planningSections: plane.sections,
      planningZone: 'canonical-city',
      position: plane.position,
      rotation: [0, 0, 0],
      safeEditSeam: 'src/modules/expo/runtime/planning/world-plan/buildCanonicalWorldPlan.ts',
      size: [plane.size[0], 2, plane.size[1]],
      sourceFile: 'src/modules/expo/runtime/planning/world-plan/buildCanonicalWorldPlan.ts',
      sourceFunction: 'buildCanonicalWorldPlan',
      sourceKind: 'city-plane',
    })),
    ...plan.showcasePlazas.map((plane) => createEntry({
      diagnosticOwners: [],
      groundOwner: resolveCityGroundOwner(plane.id),
      groundRole: 'structural',
      id: plane.id,
      interactionOwner: null,
      layer: 'city-plane',
      planningSections: plane.sections,
      planningZone: 'canonical-city',
      position: plane.position,
      rotation: [0, 0, 0],
      safeEditSeam: 'src/modules/expo/runtime/planning/world-plan/buildCanonicalWorldPlan.ts',
      size: [plane.size[0], 2, plane.size[1]],
      sourceFile: 'src/modules/expo/runtime/planning/world-plan/buildCanonicalWorldPlan.ts',
      sourceFunction: 'buildCanonicalWorldPlan',
      sourceKind: 'city-plane',
    })),
    ...plan.boothForecourtPlanes.map((plane) => createEntry({
      diagnosticOwners: [],
      groundOwner: resolveCityGroundOwner(plane.id),
      groundRole: 'structural',
      id: plane.id,
      interactionOwner: null,
      layer: 'city-plane',
      planningSections: plane.sections,
      planningZone: 'canonical-city',
      position: plane.position,
      rotation: [0, 0, 0],
      safeEditSeam: 'src/modules/expo/runtime/planning/world-plan/buildCanonicalWorldPlan.ts',
      size: [plane.size[0], 2, plane.size[1]],
      sourceFile: 'src/modules/expo/runtime/planning/world-plan/buildCanonicalWorldPlan.ts',
      sourceFunction: 'buildCanonicalWorldPlan',
      sourceKind: 'city-plane',
    })),
    ...plan.filteredMasses.map((mass) => createEntry({
      diagnosticOwners: [],
      id: mass.id,
      interactionOwner: null,
      layer: 'city-mass',
      planningSections: mass.sections,
      planningZone: 'canonical-city',
      position: baseAnchoredBoxCenter(mass.position, mass.size),
      rotation: [0, 0, 0],
      safeEditSeam: 'src/modules/expo/runtime/planning/world-plan/buildCanonicalWorldPlan.ts',
      size: mass.size,
      sourceFile: 'src/modules/expo/runtime/planning/world-plan/buildCanonicalWorldPlan.ts',
      sourceFunction: 'buildCanonicalWorldPlan',
      sourceKind: 'city-mass',
    })),
    ...plan.filteredTowerLandmarks.map((tower) => {
      const size = resolveCityTowerAuditSize(tower);

      return createEntry({
        aliases: compactAliases(tower.id, towerAliasesById.get(tower.id) ?? []),
        diagnosticOwners: [
          'src/modules/expo/runtime/planning/screens/screenOrientationDiagnostics.ts',
        ],
        id: tower.id,
        interactionOwner: null,
        layer: 'city-tower',
        planningSections: tower.sections,
        planningZone: 'canonical-city',
        position: baseAnchoredBoxCenter(tower.position, size),
        rotation: [0, 0, 0],
        safeEditSeam: 'src/modules/expo/runtime/planning/world-plan/buildCanonicalWorldPlan.ts',
        size,
        sourceFile: 'src/modules/expo/runtime/planning/world-plan/buildCanonicalWorldPlan.ts',
        sourceFunction: 'buildCanonicalWorldPlan',
        sourceKind: 'city-tower',
      });
    }),
    ...plan.filteredScreenSurfaces.map((surface) => createEntry({
      aliases: compactAliases(surface.id, screenSurfaceAliasesById.get(surface.id) ?? []),
      diagnosticOwners: [
        'src/modules/expo/runtime/planning/screens/screenOrientationDiagnostics.ts',
        'src/modules/expo/runtime/planning/screens/screenSurfaceBoundsDiagnostics.ts',
        'src/modules/expo/runtime/planning/screens/screenSurfaceOverlapDiagnostics.ts',
      ],
      id: surface.id,
      interactionOwner: null,
      layer: 'city-screen-surface',
      planningSections: surface.sections,
      planningZone: 'canonical-city',
      position: surface.position,
      rotation: surface.rotation,
      safeEditSeam: 'src/modules/expo/runtime/planning/screens/buildScreenSurfacePlan.ts',
      size: surface.size,
      sourceFile: 'src/modules/expo/runtime/planning/screens/buildScreenSurfacePlan.ts',
      sourceFunction: 'buildZoneScreenSurfacePlan',
      sourceKind: 'screen-surface',
    })),
    ...plan.screenSockets.map((socket) => createEntry({
      diagnosticOwners: [
        'src/modules/expo/runtime/planning/screens/screenOrientationDiagnostics.ts',
      ],
      id: socket.id,
      interactionOwner: null,
      layer: 'city-screen-socket',
      planningSections: socket.sections,
      planningZone: 'canonical-city',
      position: socket.position,
      rotation: socket.rotation,
      safeEditSeam: 'src/modules/expo/runtime/planning/screens/buildScreenSocketPlan.ts',
      size: [socket.frameSize[0], socket.frameSize[1], socket.renderIntent?.frameDepth ?? 2],
      sourceFile: 'src/modules/expo/runtime/planning/screens/buildScreenSocketPlan.ts',
      sourceFunction: 'buildZoneScreenSocketPlan',
      sourceKind: 'screen-socket',
    })),
    ...buildAssignmentEntries({
      assignments: plan.screenAssignments,
      layer: 'city-screen-assignment',
      planningZone: 'canonical-city',
      sockets: plan.screenSockets,
    }),
    ...buildMegaLandmarkEntries({ districtCount, districtStride, stadiumReserve: plan.stadiumReserve }),
  ];
}

type StadiumStructureRegistrySpec = {
  id: string;
  position: [number, number, number];
  size: [number, number, number];
};

function buildStadiumStructureEntries(campusCenterZ: number): WorldObjectRegistryEntry[] {
  const rearCampusZ = (defaultZ: number) => resolveRearCampusAnchoredZ(campusCenterZ, defaultZ);
  const structures: ReadonlyArray<StadiumStructureRegistrySpec> = [
    { id: 'rear-campus-arc-bastion-right', position: [1180, 132, campusCenterZ + 864], size: [264, 264, 100] },
    { id: 'rear-campus-center-event-island', position: [0, 112, campusCenterZ - 1296], size: [420, 224, 168] },
    { id: 'rear-campus-bowl-center-deck', position: [0, 212, campusCenterZ - 972], size: [612, 64, 228] },
    { id: 'rear-campus-stage-monolith-canopy', position: [47, 130, rearCampusZ(-3018)], size: [564, 260, 176] },
    { id: 'rear-campus-mega-civic-hall', position: [-2490, 180, rearCampusZ(-3670)], size: [724, 360, 324] },
    { id: 'rear-campus-void-courtyard-monument', position: [-1971, 198, rearCampusZ(-2894)], size: [612, 396, 348] },
    { id: 'rear-campus-linked-mini-skyline', position: [-2537, 228, rearCampusZ(-4977)], size: [744, 456, 312] },
    { id: 'rear-campus-linear-civic-terrace', position: [-1684, 78, rearCampusZ(-1430)], size: [868, 156, 188] },
    { id: 'rear-campus-bridge-linked-campus', position: [-1343, 176, rearCampusZ(-3449)], size: [632, 352, 154] },
    { id: 'rear-campus-petal-tower', position: [2340, 288, rearCampusZ(-4577)], size: [260, 576, 420] },
    { id: 'rear-campus-helix-spire', position: [2439, 406, rearCampusZ(-1432)], size: [272, 812, 272] },
    { id: 'rear-campus-grand-prism-citadel', position: [-1033, 228, rearCampusZ(-1902)], size: [596, 456, 224] },
    { id: 'rear-campus-terrace-signal-court', position: [-864, 68, rearCampusZ(-936)], size: [404, 136, 132] },
    { id: 'rear-campus-needle-crown-skyscraper', position: [1540, 374, rearCampusZ(-611)], size: [188, 748, 128] },
    { id: 'rear-campus-sky-slab-tower', position: [1087, 390, rearCampusZ(-1329)], size: [224, 780, 136] },
    { id: 'rear-campus-twin-void-monolith', position: [1340, 300, rearCampusZ(-3242)], size: [276, 600, 168] },
    { id: 'stadium-bowl', position: [0, 360, campusCenterZ - 1520], size: [2860, 720, 1150] },
  ];

  return structures.map(({ id, position, size }) => createEntry({
    diagnosticOwners: [],
    id,
    interactionOwner: null,
    layer: 'stadium-structure',
    planningZone: 'rear-campus',
    position,
    safeEditSeam: 'src/modules/expo/runtime/world/ExpoRearCampus.tsx',
    size,
    sourceFile: 'src/modules/expo/runtime/world/ExpoRearCampus.tsx',
    sourceFunction: 'ExpoRearCampus',
    sourceKind: 'rear-campus-structure',
  }));
}

export function buildStadiumWorldObjectRegistry({
  campusCenterZ,
  rearCampusPlan,
}: BuildStadiumWorldObjectRegistryArgs): WorldObjectRegistryEntry[] {
  const rearCampus = rearCampusPlan.zoneExtension?.rearCampus;

  return [
    ...(rearCampus?.forecourts ?? []).map((plane) => createEntry({
      diagnosticOwners: [],
      groundOwner: resolveStadiumGroundOwner(plane.id),
      groundRole: 'structural',
      id: plane.id,
      interactionOwner: null,
      layer: 'stadium-plane',
      planningZone: 'rear-campus',
      position: plane.position,
      rotation: [0, 0, 0],
      safeEditSeam: 'src/modules/expo/runtime/planning/zones/rear-campus/index.ts',
      size: [plane.size[0], 2, plane.size[1]],
      sourceFile: 'src/modules/expo/runtime/planning/zones/rear-campus/index.ts',
      sourceFunction: 'buildRearCampusZonePlan',
      sourceKind: 'rear-campus-forecourt',
    })),
    ...(rearCampus?.sidePavilions ?? []).map((pavilion) => createEntry({
      diagnosticOwners: [],
      id: pavilion.id,
      interactionOwner: null,
      layer: 'stadium-pavilion',
      planningZone: 'rear-campus',
      position: baseAnchoredBoxCenter(pavilion.position, pavilion.size),
      rotation: [0, 0, 0],
      safeEditSeam: 'src/modules/expo/runtime/planning/zones/rear-campus/index.ts',
      size: pavilion.size,
      sourceFile: 'src/modules/expo/runtime/planning/zones/rear-campus/index.ts',
      sourceFunction: 'buildRearCampusZonePlan',
      sourceKind: 'rear-campus-pavilion',
    })),
    ...(rearCampus?.landmarkTowers ?? []).map((tower) => createEntry({
      diagnosticOwners: [],
      id: tower.id,
      interactionOwner: null,
      layer: 'stadium-tower',
      planningZone: 'rear-campus',
      position: baseAnchoredBoxCenter(tower.position, [188, 720, 146]),
      safeEditSeam: 'src/modules/expo/runtime/planning/zones/rear-campus/index.ts',
      size: [188, 720, 146],
      sourceFile: 'src/modules/expo/runtime/planning/zones/rear-campus/index.ts',
      sourceFunction: 'buildRearCampusZonePlan',
      sourceKind: 'rear-campus-tower',
    })),
    ...(rearCampus?.perimeterConnectors ?? []).map((connector) => createEntry({
      diagnosticOwners: [],
      id: connector.id,
      interactionOwner: null,
      layer: 'stadium-structure',
      planningZone: 'rear-campus',
      position: connector.position,
      rotation: [0, 0, 0],
      safeEditSeam: 'src/modules/expo/runtime/planning/zones/rear-campus/index.ts',
      size: connector.size,
      sourceFile: 'src/modules/expo/runtime/planning/zones/rear-campus/index.ts',
      sourceFunction: 'buildRearCampusZonePlan',
      sourceKind: 'rear-campus-perimeter-connector',
    })),
    ...rearCampusPlan.screenSurfaces.map((surface) => createEntry({
      diagnosticOwners: [
        'src/modules/expo/runtime/planning/screens/screenSurfaceBoundsDiagnostics.ts',
        'src/modules/expo/runtime/planning/screens/screenSurfaceOverlapDiagnostics.ts',
      ],
      id: surface.id,
      interactionOwner: null,
      layer: 'stadium-screen-surface',
      planningSections: surface.sections,
      planningZone: 'rear-campus',
      position: surface.position,
      rotation: surface.rotation,
      safeEditSeam: 'src/modules/expo/runtime/planning/screens/buildScreenSurfacePlan.ts',
      size: surface.size,
      sourceFile: 'src/modules/expo/runtime/planning/screens/buildScreenSurfacePlan.ts',
      sourceFunction: 'buildZoneScreenSurfacePlan',
      sourceKind: 'screen-surface',
    })),
    ...rearCampusPlan.screenSockets.map((socket) => createEntry({
      diagnosticOwners: [],
      id: socket.id,
      interactionOwner: null,
      layer: 'stadium-screen-socket',
      planningSections: socket.sections,
      planningZone: 'rear-campus',
      position: socket.position,
      rotation: socket.rotation,
      safeEditSeam: 'src/modules/expo/runtime/planning/screens/buildScreenSocketPlan.ts',
      size: [socket.frameSize[0], socket.frameSize[1], socket.renderIntent?.frameDepth ?? 2],
      sourceFile: 'src/modules/expo/runtime/planning/screens/buildScreenSocketPlan.ts',
      sourceFunction: 'buildZoneScreenSocketPlan',
      sourceKind: 'screen-socket',
    })),
    ...buildAssignmentEntries({
      assignments: rearCampusPlan.assignments,
      layer: 'stadium-screen-assignment',
      planningZone: 'rear-campus',
      sockets: rearCampusPlan.screenSockets,
    }),
    ...buildStadiumStructureEntries(campusCenterZ),
  ];
}

export function buildBoothWorldObjectRegistry(
  boothPlacements: ReadonlyArray<{
    boothType?: string | null;
    company?: {
      booth?: unknown;
      id?: string | number | null;
      slug?: string | null;
    } | null;
    id: string;
    localFootprint?: ExpoBoothLocalFootprint;
    nodeType?: string | null;
    position: [number, number, number];
    rotation?: [number, number, number] | null;
    sectorId?: string | null;
    sponsorTier?: string | null;
  }>,
): WorldObjectRegistryEntry[] {
  return boothPlacements.map((placement) => {
    const booth = placement.company?.booth;
    const boothId = booth && typeof booth === 'object' && 'id' in booth
      ? String((booth as { id?: string | number | null }).id ?? '')
      : '';
    const aliases = compactAliases(placement.id, [
      placement.company?.slug ?? '',
      placement.company?.id != null ? String(placement.company.id) : '',
      boothId,
    ]);
    const footprint = placement.localFootprint ?? buildExpoBoothLocalFootprint({
      boothType: placement.boothType,
      nodeType: placement.nodeType,
      position: placement.position,
      rotation: placement.rotation,
      sponsorTier: placement.sponsorTier,
    });
    const footprintWidth = footprint.worldBounds.maxX - footprint.worldBounds.minX;
    const footprintDepth = footprint.worldBounds.maxZ - footprint.worldBounds.minZ;

    return createEntry({
      aliases,
      diagnosticOwners: [
        'src/shared/expo/lib/boothFrontalityDiagnostics.ts',
      ],
      id: placement.id,
      interactionOwner: 'src/modules/expo/runtime/booths/DistrictBooth.tsx',
      layer: 'booth',
      planningZone: placement.sectorId ?? null,
      position: placement.position,
      rotation: placement.rotation ?? [0, 0, 0],
      safeEditSeam: 'src/shared/expo/layoutEngine.ts',
      size: [footprintWidth, 12, footprintDepth],
      sourceFile: 'src/shared/expo/layoutEngine.ts',
      sourceFunction: 'buildExpoLayoutEngine',
      sourceKind: 'booth-placement',
    });
  });
}
