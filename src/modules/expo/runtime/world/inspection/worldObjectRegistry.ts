import type {
  CanonicalWorldPlan,
  CityScreenAssignment,
  CityScreenSocket,
  ExpoPlanningSectionId,
  ExpoPlanningZonePlan,
} from '../../planning/types';
import { resolveRearCampusAnchoredZ } from '../ExpoRearCampusLayout';

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

function buildMegaLandmarkEntries(args: {
  districtCount: number;
  districtStride: number;
}): WorldObjectRegistryEntry[] {
  const { districtCount, districtStride } = args;
  const landmarks: ReadonlyArray<readonly [string, [number, number, number]]> = [
    ['mega-landmark-arrival', [0, 0, 256]],
    ['mega-landmark-showcase', [0, 0, -72]],
    ['mega-landmark-media', [0, 0, -214 - districtStride - 56]],
    ['mega-landmark-media-frame-wall', [356, 0, -214 - districtStride - 56 - 148]],
    ['mega-landmark-media-signal-pods', [472, 0, -214 - districtStride - 56 + 84]],
    ['mega-landmark-discovery', [0, 0, -196 - ((Math.max(1, districtCount) - 1) * districtStride) - 1080]],
    ['mega-landmark-discovery-observatory-crown', [-368, 0, -196 - ((Math.max(1, districtCount) - 1) * districtStride) - 1080 - 32]],
    ['mega-landmark-discovery-garden-spine', [-492, 0, -196 - ((Math.max(1, districtCount) - 1) * districtStride) - 1080 + 212]],
    ['mega-landmark-right-skyfold-citadel', [844, 0, -164]],
    ['mega-landmark-right-skybridge-beacon', [436, 0, -96]],
    ['mega-landmark-right-media-halo', [628, 0, -248]],
    ['mega-landmark-right-support-spire', [294, 0, -372]],
    ['mega-landmark-left-grand-rampart', [-888, 0, -156]],
    ['mega-landmark-left-cantilever-forum', [-438, 0, -116]],
    ['mega-landmark-left-split-crown-gate', [-654, 0, -286]],
    ['mega-landmark-left-broken-wall-monument', [-262, 0, -412]],
    ['mega-landmark-left-disc-habitat', [-918, 0, -548]],
    ['mega-landmark-left-split-monolith-pair', [-648, 0, -724]],
  ];

  return landmarks.map(([id, position]) => createEntry({
    diagnosticOwners: [],
    id,
    interactionOwner: null,
    layer: 'mega-landmark',
    planningZone: 'canonical-city',
    position: position as [number, number, number],
    safeEditSeam: 'src/modules/expo/runtime/world/WorldCityMegaLandmarks.tsx',
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
  return [
    ...plan.arrivalPlanes.map((plane) => createEntry({
      diagnosticOwners: [],
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
      position: mass.position,
      rotation: [0, 0, 0],
      safeEditSeam: 'src/modules/expo/runtime/planning/world-plan/buildCanonicalWorldPlan.ts',
      size: mass.size,
      sourceFile: 'src/modules/expo/runtime/planning/world-plan/buildCanonicalWorldPlan.ts',
      sourceFunction: 'buildCanonicalWorldPlan',
      sourceKind: 'city-mass',
    })),
    ...plan.filteredTowerLandmarks.map((tower) => createEntry({
      diagnosticOwners: [
        'src/modules/expo/runtime/planning/screens/screenOrientationDiagnostics.ts',
      ],
      id: tower.id,
      interactionOwner: null,
      layer: 'city-tower',
      planningSections: tower.sections,
      planningZone: 'canonical-city',
      position: tower.position,
      rotation: [0, 0, 0],
      safeEditSeam: 'src/modules/expo/runtime/planning/world-plan/buildCanonicalWorldPlan.ts',
      size: [
        Math.max(tower.baseSize[0], tower.upperSize[0]),
        tower.baseSize[1] + tower.upperSize[1],
        Math.max(tower.baseSize[2], tower.upperSize[2]),
      ],
      sourceFile: 'src/modules/expo/runtime/planning/world-plan/buildCanonicalWorldPlan.ts',
      sourceFunction: 'buildCanonicalWorldPlan',
      sourceKind: 'city-tower',
    })),
    ...plan.filteredScreenSurfaces.map((surface) => createEntry({
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
    ...buildMegaLandmarkEntries({ districtCount, districtStride }),
  ];
}

function buildStadiumStructureEntries(campusCenterZ: number): WorldObjectRegistryEntry[] {
  const rearCampusZ = (defaultZ: number) => resolveRearCampusAnchoredZ(campusCenterZ, defaultZ);
  const campusPerimeterFrontZ = campusCenterZ + 2140;
  const structures: ReadonlyArray<readonly [string, [number, number, number]]> = [
    ['rear-campus-front-left-connector', [-2390, 16, campusPerimeterFrontZ]],
    ['rear-campus-front-right-connector', [2390, 16, campusPerimeterFrontZ]],
    ['rear-campus-front-left-connector-cap', [-2390, 33, campusPerimeterFrontZ]],
    ['rear-campus-front-right-connector-cap', [2390, 33, campusPerimeterFrontZ]],
    ['rear-campus-arc-bastion-right', [1180, 0, campusCenterZ + 864]],
    ['rear-campus-center-event-island', [0, 0, campusCenterZ - 1296]],
    ['rear-campus-bowl-center-deck', [0, 212, campusCenterZ - 972]],
    ['rear-campus-stage-monolith-canopy', [47, 0, rearCampusZ(-3018)]],
    ['rear-campus-mega-civic-hall', [-2490, 0, rearCampusZ(-3670)]],
    ['rear-campus-void-courtyard-monument', [-1971, 0, rearCampusZ(-2894)]],
    ['rear-campus-linked-mini-skyline', [-2537, 0, rearCampusZ(-4977)]],
    ['rear-campus-titan-frame-gate', [-682, 0, rearCampusZ(396)]],
    ['rear-campus-linear-civic-terrace', [-1684, 0, rearCampusZ(-1430)]],
    ['rear-campus-bridge-linked-campus', [-1343, 0, rearCampusZ(-3449)]],
    ['rear-campus-petal-tower', [2340, 0, rearCampusZ(-4577)]],
    ['rear-campus-helix-spire', [2439, 0, rearCampusZ(-1432)]],
    ['rear-campus-grand-prism-citadel', [-1033, 0, rearCampusZ(-1902)]],
    ['rear-campus-split-wall-gate', [-836, 0, rearCampusZ(-1427)]],
    ['rear-campus-terrace-signal-court', [-864, 0, rearCampusZ(-936)]],
    ['rear-campus-needle-crown-skyscraper', [892, 0, rearCampusZ(-611)]],
    ['rear-campus-sky-slab-tower', [1087, 0, rearCampusZ(-1329)]],
    ['rear-campus-twin-void-monolith', [1340, 0, rearCampusZ(-3242)]],
    ['stadium-bowl', [0, 0, campusCenterZ - 1520]],
    ['stadium-axis-center-1180', [0, 0, 1180]],
    ['stadium-axis-center-1608', [0, 0, 1608]],
  ];

  return structures.map(([id, position]) => createEntry({
    diagnosticOwners: [],
    id,
    interactionOwner: null,
    layer: 'stadium-structure',
    planningZone: 'rear-campus',
    position: position as [number, number, number],
    safeEditSeam: 'src/modules/expo/runtime/world/ExpoRearCampus.tsx',
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
      position: pavilion.position,
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
      position: tower.position,
      safeEditSeam: 'src/modules/expo/runtime/planning/zones/rear-campus/index.ts',
      sourceFile: 'src/modules/expo/runtime/planning/zones/rear-campus/index.ts',
      sourceFunction: 'buildRearCampusZonePlan',
      sourceKind: 'rear-campus-tower',
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
    company?: {
      booth?: unknown;
      id?: string | number | null;
      slug?: string | null;
    } | null;
    id: string;
    position: [number, number, number];
    sectorId?: string | null;
  }>,
): WorldObjectRegistryEntry[] {
  return boothPlacements.map((placement) => {
    const booth = placement.company?.booth;
    const boothId = booth && typeof booth === 'object' && 'id' in booth
      ? String((booth as { id?: string | number | null }).id ?? '')
      : '';
    const aliases = Array.from(new Set([
      placement.company?.slug ?? '',
      placement.company?.id != null ? String(placement.company.id) : '',
      boothId,
    ].map((value) => value.trim()).filter((value) => value && value !== placement.id)));

    return createEntry({
      aliases: aliases.length > 0 ? aliases : undefined,
      diagnosticOwners: [
        'src/shared/expo/lib/boothFrontalityDiagnostics.ts',
      ],
      id: placement.id,
      interactionOwner: 'src/modules/expo/runtime/booths/DistrictBooth.tsx',
      layer: 'booth',
      planningZone: placement.sectorId ?? null,
      position: placement.position,
      safeEditSeam: 'src/shared/expo/layoutEngine.ts',
      sourceFile: 'src/shared/expo/layoutEngine.ts',
      sourceFunction: 'buildExpoLayoutEngine',
      sourceKind: 'booth-placement',
    });
  });
}
