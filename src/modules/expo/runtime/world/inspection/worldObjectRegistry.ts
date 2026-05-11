import type {
  CanonicalWorldPlan,
  CityScreenAssignment,
  CityScreenSocket,
  CityScreenSurface,
  CityTower,
  ExpoPlanningSectionId,
  ExpoPlanningZonePlan,
} from '../../planning/types';
import {
  buildWorldCityMegaLandmarkBounds,
  filterWorldCityMegaLandmarkBounds,
} from '../WorldCityMegaLandmarkBounds';
import {
  GLOBAL_GROUND_POSITION,
  GLOBAL_GROUND_SIZE,
  STADIUM_FORECOURT_GROUND_OPACITY,
} from '../WorldGroundLayout';
import { buildRearCampusScreenHostShells } from '../rearCampusScreenHosts';
import {
  RECOVERED_REAR_CAMPUS_STRUCTURES,
  resolveRecoveredRearCampusRegistryPosition,
} from '../rearCampusRecoveredStructures';
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
  | 'ground-base'
  | 'ground-detail'
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
  groundRole?: 'base' | 'detail' | 'structural';
  id: string;
  interactionOwner: string | null;
  layer: WorldObjectLayer;
  material?: {
    color?: string;
    opacity?: number;
    transparent?: boolean;
  };
  planningSections?: ExpoPlanningSectionId[];
  planningRole?: string | null;
  planningZone: string | null;
  position: [number, number, number];
  reviewTargetPosition?: [number, number, number];
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

const MEGA_LANDMARK_INSPECTABLE_PREFIXES: ReadonlyArray<readonly [prefix: string, registryId: string]> = [
  ['media-frame', 'mega-landmark-media-frame-wall'],
  ['media-pod', 'mega-landmark-media-signal-pods'],
  ['media-signal-pods', 'mega-landmark-media-signal-pods'],
  ['right-media-halo', 'mega-landmark-right-media-halo'],
  ['right-skybridge', 'mega-landmark-right-skybridge-beacon'],
  ['right-skyfold-citadel', 'mega-landmark-right-skyfold-citadel'],
  ['right-citadel', 'mega-landmark-right-skyfold-citadel'],
  ['right-support-spire', 'mega-landmark-right-support-spire'],
  ['left-split-crown', 'mega-landmark-left-split-crown-gate'],
  ['left-rampart', 'mega-landmark-left-grand-rampart'],
  ['left-cantilever', 'mega-landmark-left-cantilever-forum'],
  ['left-disc', 'mega-landmark-left-disc-habitat'],
  ['left-monolith', 'mega-landmark-left-split-monolith-pair'],
  ['left-broken-wall', 'mega-landmark-left-broken-wall-monument'],
  ['arrival', 'mega-landmark-arrival'],
  ['showcase', 'mega-landmark-showcase'],
  ['media', 'mega-landmark-media'],
];

export function resolveMegaLandmarkRegistryIdFromInspectableName(inspectableName: string) {
  if (!inspectableName.startsWith('mega-landmark:')) {
    return null;
  }

  const suffix = inspectableName.slice('mega-landmark:'.length);
  for (const [prefix, registryId] of MEGA_LANDMARK_INSPECTABLE_PREFIXES) {
    if (suffix === prefix || suffix.startsWith(`${prefix}-`)) {
      return registryId;
    }
  }

  return null;
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

  return landmarks.map(({ id, position, reviewTargetPosition, size }) => createEntry({
    diagnosticOwners: [],
    id,
    interactionOwner: null,
    layer: 'mega-landmark',
    planningZone: 'canonical-city',
    position,
    ...(reviewTargetPosition ? { reviewTargetPosition } : {}),
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

export function buildGroundWorldObjectRegistry(): WorldObjectRegistryEntry[] {
  return [
    createEntry({
      diagnosticOwners: [
        'src/modules/expo/runtime/world/WorldGroundPlane.tsx',
      ],
      groundOwner: 'transition',
      groundRole: 'base',
      id: 'global-ground-base',
      interactionOwner: null,
      layer: 'ground-base',
      material: {
        color: 'visualProfile.global.groundBase',
        opacity: 1,
        transparent: false,
      },
      planningZone: null,
      position: GLOBAL_GROUND_POSITION,
      rotation: [0, 0, 0],
      safeEditSeam: 'src/modules/expo/runtime/world/WorldGroundLayout.ts',
      size: [GLOBAL_GROUND_SIZE[0], 0.02, GLOBAL_GROUND_SIZE[1]],
      sourceFile: 'src/modules/expo/runtime/world/WorldGroundLayout.ts',
      sourceFunction: 'WorldGroundPlane',
      sourceKind: 'global-ground-base',
    }),
  ];
}

export function buildCityWorldObjectRegistry({
  districtCount,
  districtStride,
  plan,
}: BuildCityWorldObjectRegistryArgs): WorldObjectRegistryEntry[] {
  const towerAliasesById = buildStableTowerAliases(plan.filteredTowerLandmarks);
  const screenSurfaceAliasesById = buildStableTowerAliases(plan.filteredScreenSurfaces);

  return [
    ...plan.filteredMasses.map((mass) => createEntry({
      diagnosticOwners: [],
      id: mass.id,
      interactionOwner: null,
      layer: 'city-mass',
      planningSections: mass.sections,
      planningRole: mass.role ?? null,
      planningZone: 'canonical-city',
      position: baseAnchoredBoxCenter(mass.position, mass.size),
      rotation: mass.rotation ?? [0, 0, 0],
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

function buildStadiumScreenHostShellEntries(
  screenSurfaces: ReadonlyArray<CityScreenSurface>,
): WorldObjectRegistryEntry[] {
  return buildRearCampusScreenHostShells(screenSurfaces).map((shell) => createEntry({
    diagnosticOwners: [
      'scripts/audit-expo-world-registry.mjs',
    ],
    id: shell.id,
    interactionOwner: null,
    layer: 'stadium-structure',
    planningRole: 'screen-host-shell',
    planningZone: 'rear-campus',
    position: shell.position,
    rotation: shell.rotation,
    safeEditSeam: 'src/modules/expo/runtime/world/rearCampusScreenHosts.ts',
    size: shell.size,
    sourceFile: 'src/modules/expo/runtime/world/rearCampusScreenHosts.ts',
    sourceFunction: 'buildRearCampusScreenHostShells',
    sourceKind: 'rear-campus-screen-host-shell',
  }));
}

function buildRecoveredStadiumStructureEntries(campusCenterZ: number): WorldObjectRegistryEntry[] {
  return RECOVERED_REAR_CAMPUS_STRUCTURES.map((structure) => createEntry({
    diagnosticOwners: [
      'scripts/audit-expo-structure-recovery.mjs',
      'scripts/audit-expo-world-registry.mjs',
    ],
    id: structure.id,
    interactionOwner: null,
    layer: 'stadium-structure',
    planningRole: 'recovered-large-landmark',
    planningZone: 'rear-campus',
    position: resolveRecoveredRearCampusRegistryPosition(structure, campusCenterZ),
    rotation: [0, 0, 0],
    safeEditSeam: 'src/modules/expo/runtime/world/ExpoRearCampusRecoveredStructures.tsx',
    size: structure.size,
    sourceFile: 'src/modules/expo/runtime/world/ExpoRearCampusRecoveredStructures.tsx',
    sourceFunction: 'ExpoRearCampusRecoveredStructures',
    sourceKind: 'recovered-rear-campus-structure',
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
      material: {
        color: plane.color,
        opacity: STADIUM_FORECOURT_GROUND_OPACITY,
        transparent: true,
      },
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
    ...buildRecoveredStadiumStructureEntries(campusCenterZ),
    ...buildStadiumScreenHostShellEntries(rearCampusPlan.screenSurfaces),
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
