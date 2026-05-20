import type {
  CanonicalWorldPlan,
  CanonicalPrimitive,
  CityMass,
  CityScreenAssignment,
  CityScreenSocket,
  CityScreenSurface,
  CityTower,
  ExpoVerticalAccessNode,
  ExpoVerticalElevatorRoute,
  ExpoVerticalHeightBand,
  ExpoVerticalLevelId,
  ExpoVerticalOwner,
  ExpoVerticalPlacement,
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
import { buildCityPerimeterConnectors } from '../WorldCityPerimeterLayout';
import { buildRearCampusScreenHostShells } from '../rearCampusScreenHosts';
import {
  RECOVERED_REAR_CAMPUS_PHYSICS_PARTS_BY_ID,
  RECOVERED_REAR_CAMPUS_STRUCTURES,
  resolveRecoveredRearCampusGroupPosition,
  resolveRecoveredRearCampusRegistryPosition,
} from '../rearCampusRecoveredStructures';
import {
  buildExpoBoothLocalFootprint,
  type ExpoBoothLocalFootprint,
} from '../../../../../shared/expo/lib/boothLocalFootprint';
import { getBoothColliderSegments } from '../../../components/BoothArchitectureKit';
import { pickSponsorBoothTemplate } from '../../../lib/sponsorBoothPresentation';

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
  | 'stadium-tower'
  | 'vertical-access-node'
  | 'vertical-elevator-route';

export type WorldObjectRegistryPhysicsPart = {
  id: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  size: [number, number, number];
  walkableTop?: boolean;
};

export type WorldObjectRegistryEntry = {
  aliases?: string[];
  diagnosticOwners: string[];
  groundOwner?: 'city' | 'stadium' | 'transition';
  groundRole?: 'base' | 'detail' | 'structural';
  id: string;
  interactionOwner: string | null;
  layer: WorldObjectLayer;
  baseY?: number;
  floorCount?: number;
  floorHeight?: number;
  heightBand?: ExpoVerticalHeightBand;
  level?: ExpoVerticalLevelId;
  material?: {
    color?: string;
    opacity?: number;
    transparent?: boolean;
  };
  nodeType?: string | null;
  physicsParts?: WorldObjectRegistryPhysicsPart[];
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
  verticalOwner?: ExpoVerticalOwner;
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
  baseY = 0,
): [number, number, number] {
  return [position[0], baseY + (size[1] * 0.5), position[2]];
}

function verticalRegistryFields(vertical?: ExpoVerticalPlacement) {
  return vertical
    ? {
        baseY: vertical.baseY,
        floorCount: vertical.floorCount,
        floorHeight: vertical.floorHeight,
        heightBand: vertical.heightBand,
        level: vertical.level,
        verticalOwner: vertical.verticalOwner,
      }
    : {};
}

function resolveCityTowerAuditSize(tower: CityTower): [number, number, number] {
  return [
    Math.max(tower.baseSize[0], tower.upperSize[0]),
    tower.baseSize[1] + tower.upperSize[1],
    Math.max(tower.baseSize[2], tower.upperSize[2]),
  ];
}

function rotateLocalOffset(
  offset: [number, number, number],
  rotation?: [number, number, number],
): [number, number, number] {
  const yaw = rotation?.[1] ?? 0;
  if (!yaw) {
    return offset;
  }

  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);
  return [
    (offset[0] * cos) + (offset[2] * sin),
    offset[1],
    (offset[2] * cos) - (offset[0] * sin),
  ];
}

function combineLocalRotation(
  parentRotation?: [number, number, number],
  localRotation?: [number, number, number],
): [number, number, number] | undefined {
  if (!parentRotation && !localRotation) {
    return undefined;
  }

  return [
    (parentRotation?.[0] ?? 0) + (localRotation?.[0] ?? 0),
    (parentRotation?.[1] ?? 0) + (localRotation?.[1] ?? 0),
    (parentRotation?.[2] ?? 0) + (localRotation?.[2] ?? 0),
  ];
}

function createLocalPhysicsPart({
  baseY = 0,
  id,
  localPosition,
  localRotation,
  origin,
  parentRotation,
  size,
  walkableTop,
}: {
  baseY?: number;
  id: string;
  localPosition: [number, number, number];
  localRotation?: [number, number, number];
  origin: [number, number, number];
  parentRotation?: [number, number, number];
  size: [number, number, number];
  walkableTop?: boolean;
}): WorldObjectRegistryPhysicsPart {
  const rotatedOffset = rotateLocalOffset(localPosition, parentRotation);

  return {
    id,
    position: [
      origin[0] + rotatedOffset[0],
      baseY + rotatedOffset[1],
      origin[2] + rotatedOffset[2],
    ],
    rotation: combineLocalRotation(parentRotation, localRotation),
    size,
    ...(typeof walkableTop === 'boolean' ? { walkableTop } : {}),
  };
}

function buildCityMassPhysicsParts(mass: CityMass): WorldObjectRegistryPhysicsPart[] {
  const baseY = mass.vertical?.baseY ?? 0;
  const parentRotation = mass.rotation ?? [0, 0, 0];
  const intent = mass.renderIntent;
  const parts: WorldObjectRegistryPhysicsPart[] = [];

  if (intent?.skipBase !== true) {
    parts.push(createLocalPhysicsPart({
      baseY,
      id: 'base',
      localPosition: [0, mass.size[1] * 0.5, 0],
      origin: mass.position,
      parentRotation,
      size: mass.size,
    }));
  }

  if (intent?.showHorizontalCap) {
    parts.push(createLocalPhysicsPart({
      baseY,
      id: 'horizontal-cap',
      localPosition: [0, mass.size[1] + 0.4, 0],
      origin: mass.position,
      parentRotation,
      size: [mass.size[0] * 0.78, 0.9, mass.size[2] * 0.78],
    }));
  }

  if (intent?.showSignatureBand) {
    parts.push(createLocalPhysicsPart({
      baseY,
      id: 'signature-band',
      localPosition: [0, mass.size[1] * 0.28, mass.size[2] * 0.18],
      origin: mass.position,
      parentRotation,
      size: [Math.max(12, mass.size[0] * 0.28), Math.max(8, mass.size[1] * 0.08), Math.max(6, mass.size[2] * 0.1)],
      walkableTop: false,
    }));
  }

  if (intent?.showSideInset) {
    parts.push(
      createLocalPhysicsPart({
        baseY,
        id: 'side-inset-left',
        localPosition: [-mass.size[0] * 0.24, mass.size[1] * 0.54, 0],
        origin: mass.position,
        parentRotation,
        size: [Math.max(8, mass.size[0] * 0.1), Math.max(16, mass.size[1] * 0.24), Math.max(8, mass.size[2] * 0.16)],
        walkableTop: false,
      }),
      createLocalPhysicsPart({
        baseY,
        id: 'side-inset-right',
        localPosition: [mass.size[0] * 0.24, mass.size[1] * 0.5, 0],
        origin: mass.position,
        parentRotation,
        size: [Math.max(8, mass.size[0] * 0.08), Math.max(14, mass.size[1] * 0.2), Math.max(8, mass.size[2] * 0.14)],
        walkableTop: false,
      }),
    );
  }

  if (intent?.showSignatureBand && mass.size[1] > 48) {
    parts.push(createLocalPhysicsPart({
      baseY,
      id: 'upper-signature-band',
      localPosition: [0, mass.size[1] * 0.62, 0],
      origin: mass.position,
      parentRotation,
      size: [Math.max(8, mass.size[0] * 0.16), Math.max(18, mass.size[1] * 0.18), Math.max(8, mass.size[2] * 0.16)],
      walkableTop: false,
    }));
  }

  if (intent?.showRearSpine) {
    parts.push(createLocalPhysicsPart({
      baseY,
      id: 'rear-spine',
      localPosition: [0, mass.size[1] * 0.68, -mass.size[2] * 0.22],
      origin: mass.position,
      parentRotation,
      size: [Math.max(8, mass.size[0] * 0.12), Math.max(18, mass.size[1] * 0.18), Math.max(6, mass.size[2] * 0.1)],
      walkableTop: false,
    }));
  }

  if (intent?.showFrontWing) {
    parts.push(createLocalPhysicsPart({
      baseY,
      id: 'front-wing',
      localPosition: [0, mass.size[1] * 0.34, mass.size[2] * 0.22],
      origin: mass.position,
      parentRotation,
      size: [Math.max(12, mass.size[0] * 0.26), Math.max(10, mass.size[1] * 0.12), Math.max(6, mass.size[2] * 0.1)],
      walkableTop: false,
    }));
  }

  if (mass.vertical && mass.vertical.floorCount > 1) {
    Array.from({ length: mass.vertical.floorCount - 1 }, (_, index) => (index + 1) * mass.vertical!.floorHeight)
      .filter((floorY) => floorY > 4 && floorY < mass.size[1] - 4)
      .forEach((floorY) => {
        parts.push(createLocalPhysicsPart({
          baseY,
          id: `floor-band-${floorY}`,
          localPosition: [0, floorY, mass.size[2] * 0.51],
          origin: mass.position,
          parentRotation,
          size: [Math.max(12, mass.size[0] * 0.86), 1.6, 2.2],
          walkableTop: false,
        }));

        if (intent?.showSideFloorBands) {
          parts.push(
            createLocalPhysicsPart({
              baseY,
              id: `floor-band-left-${floorY}`,
              localPosition: [-mass.size[0] * 0.51, floorY, 0],
              origin: mass.position,
              parentRotation,
              size: [2.2, 1.6, Math.max(12, mass.size[2] * 0.74)],
              walkableTop: false,
            }),
            createLocalPhysicsPart({
              baseY,
              id: `floor-band-right-${floorY}`,
              localPosition: [mass.size[0] * 0.51, floorY, 0],
              origin: mass.position,
              parentRotation,
              size: [2.2, 1.6, Math.max(12, mass.size[2] * 0.74)],
              walkableTop: false,
            }),
          );
        }
      });
  }

  const primitiveParts = buildPrimitivePhysicsParts({
    baseY,
    idPrefix: 'primitive',
    origin: mass.position,
    parentRotation,
    primitives: intent?.primitives,
  });
  if (primitiveParts) {
    parts.push(...primitiveParts);
  }

  return parts;
}

function buildPrimitivePhysicsParts({
  baseY = 0,
  idPrefix,
  origin,
  parentRotation,
  primitives,
}: {
  baseY?: number;
  idPrefix: string;
  origin: [number, number, number];
  parentRotation?: [number, number, number];
  primitives?: CanonicalPrimitive[];
}): WorldObjectRegistryPhysicsPart[] | undefined {
  const parts = (primitives ?? []).flatMap((primitive, index): WorldObjectRegistryPhysicsPart[] => {
    if ('physics' in primitive && primitive.physics === 'decorative') {
      return [];
    }

    if (primitive.kind === 'box') {
      return [createLocalPhysicsPart({
        baseY,
        id: `${idPrefix}-${index}`,
        localPosition: primitive.position,
        localRotation: primitive.rotation,
        origin,
        parentRotation,
        size: primitive.size,
        walkableTop: false,
      })];
    }

    if (primitive.kind === 'cylinder') {
      const radius = Math.max(primitive.radiusTop, primitive.radiusBottom);
      return [createLocalPhysicsPart({
        baseY,
        id: `${idPrefix}-${index}`,
        localPosition: primitive.position,
        localRotation: primitive.rotation,
        origin,
        parentRotation,
        size: [radius * 2, primitive.height, radius * 2],
        walkableTop: false,
      })];
    }

    return [];
  });

  return parts.length > 0 ? parts : undefined;
}

function buildRearCampusPavilionPhysicsParts(pavilion: {
  accentSide: number;
  position: [number, number, number];
  size: [number, number, number];
}): WorldObjectRegistryPhysicsPart[] {
  const [width, height, depth] = pavilion.size;
  const bodyDepth = depth * 0.62;
  const bodyOffsetZ = -(depth * 0.18);
  const accentX = pavilion.accentSide * (width * 0.5 - Math.max(6, width * 0.045));

  return [
    createLocalPhysicsPart({
      id: 'base',
      localPosition: [0, 8, bodyOffsetZ],
      origin: pavilion.position,
      size: [width * 1.08, 16, bodyDepth * 1.08],
      walkableTop: false,
    }),
    createLocalPhysicsPart({
      id: 'body',
      localPosition: [0, height * 0.5, bodyOffsetZ],
      origin: pavilion.position,
      size: [width, height, bodyDepth],
    }),
    createLocalPhysicsPart({
      id: 'crown',
      localPosition: [0, height + 10, bodyOffsetZ - (depth * 0.03)],
      origin: pavilion.position,
      size: [width * 1.12, 20, bodyDepth * 0.86],
    }),
    createLocalPhysicsPart({
      id: 'accent-primary',
      localPosition: [accentX, height * 0.58, bodyOffsetZ + (bodyDepth * 0.12)],
      origin: pavilion.position,
      size: [Math.max(8, width * 0.09), height * 0.72, Math.max(18, bodyDepth * 0.28)],
      walkableTop: false,
    }),
    createLocalPhysicsPart({
      id: 'accent-secondary',
      localPosition: [-accentX, height * 0.62, bodyOffsetZ - (bodyDepth * 0.16)],
      origin: pavilion.position,
      size: [Math.max(6, width * 0.062), height * 0.52, Math.max(14, bodyDepth * 0.2)],
      walkableTop: false,
    }),
  ];
}

function buildRecoveredStadiumStructurePhysicsParts(
  structure: (typeof RECOVERED_REAR_CAMPUS_STRUCTURES)[number],
  campusCenterZ: number,
): WorldObjectRegistryPhysicsPart[] | undefined {
  const localParts = RECOVERED_REAR_CAMPUS_PHYSICS_PARTS_BY_ID[structure.id];
  if (!localParts?.length) {
    return undefined;
  }

  const origin = resolveRecoveredRearCampusGroupPosition(structure, campusCenterZ);
  return localParts.map((part) => createLocalPhysicsPart({
    id: part.id,
    localPosition: part.localPosition,
    localRotation: part.rotation,
    origin,
    size: part.size,
    walkableTop: part.walkableTop,
  }));
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

  return landmarks.map((landmark) => createEntry({
    diagnosticOwners: [],
    id: landmark.id,
    interactionOwner: null,
    layer: 'mega-landmark',
    planningSections: landmark.planningSections,
    planningZone: landmark.planningZone,
    ...(landmark.physicsParts ? { physicsParts: landmark.physicsParts } : {}),
    position: landmark.position,
    ...(landmark.reviewTargetPosition ? { reviewTargetPosition: landmark.reviewTargetPosition } : {}),
    safeEditSeam: 'src/modules/expo/runtime/world/WorldCityMegaLandmarks.tsx',
    size: landmark.size,
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
      planningZone: assignment.planningZone ?? args.planningZone,
      position: socket.position,
      rotation: socket.rotation,
      safeEditSeam: 'src/modules/expo/runtime/planning/screens/buildScreenAssignmentPlan.ts',
      size: assignment.renderIntent
        ? [assignment.renderIntent.frameWidth, assignment.renderIntent.frameHeight, 0.2]
        : [socket.frameSize[0], socket.frameSize[1], 0.2],
      sourceFile: 'src/modules/expo/runtime/planning/screens/buildScreenAssignmentPlan.ts',
      sourceFunction: 'buildZoneScreenAssignmentPlan',
      sourceKind: 'screen-assignment',
    })];
  });
}

function buildCityPerimeterEntries(stadiumReserve: CanonicalWorldPlan['stadiumReserve']): WorldObjectRegistryEntry[] {
  return buildCityPerimeterConnectors(stadiumReserve).map((connector) => createEntry({
    diagnosticOwners: [
      'scripts/audit-expo-world-registry.mjs',
    ],
    id: connector.id,
    interactionOwner: null,
    layer: 'city-mass',
    planningRole: 'city-perimeter',
    planningZone: 'canonical-city',
    position: connector.position,
    rotation: [0, 0, 0],
    safeEditSeam: 'src/modules/expo/runtime/world/WorldCityPerimeterLayout.ts',
    size: connector.size,
    sourceFile: 'src/modules/expo/runtime/world/WorldCityPerimeterLayout.ts',
    sourceFunction: 'buildCityPerimeterConnectors',
    sourceKind: 'city-perimeter-connector',
  }));
}

function buildVerticalAccessNodeEntries(nodes: ExpoVerticalAccessNode[]): WorldObjectRegistryEntry[] {
  return nodes.map((node) => createEntry({
    aliases: [node.label],
    diagnosticOwners: [
      'src/modules/expo/runtime/world/WorldVerticalAccessNodes.tsx',
      'src/modules/expo/runtime/world/scene/ExpoWorldPlayerLayer.tsx',
    ],
    id: node.id,
    interactionOwner: 'src/modules/expo/runtime/world/scene/ExpoWorldPlayerLayer.tsx',
    layer: 'vertical-access-node',
    planningRole: node.mode,
    planningZone: node.zoneId,
    position: [node.position[0], Math.max(5, node.position[1]), node.position[2]],
    reviewTargetPosition: [node.position[0], Math.max(8, node.position[1] + 8), node.position[2]],
    rotation: [0, 0, 0],
    safeEditSeam: 'src/modules/expo/runtime/planning/vertical/verticalCitySystem.ts',
    size: [node.radius * 2, 10, node.radius * 2],
    sourceFile: 'src/modules/expo/runtime/planning/vertical/verticalCitySystem.ts',
    sourceFunction: 'EXPO_VERTICAL_CITY_SYSTEM',
    sourceKind: 'vertical-access-node',
  }));
}

function buildVerticalElevatorRouteEntries(routes: ExpoVerticalElevatorRoute[]): WorldObjectRegistryEntry[] {
  return routes.map((route) => {
    const xs = route.waypoints.map((point) => point[0]);
    const ys = route.waypoints.map((point) => point[1]);
    const zs = route.waypoints.map((point) => point[2]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const minZ = Math.min(...zs);
    const maxZ = Math.max(...zs);

    return createEntry({
      aliases: [route.label],
      diagnosticOwners: [
        'src/modules/expo/runtime/world/WorldVerticalElevatorRoutes.tsx',
      ],
      id: route.id,
      interactionOwner: null,
      layer: 'vertical-elevator-route',
      planningRole: 'animated-lift-route',
      planningZone: route.zoneId,
      position: [
        (minX + maxX) * 0.5,
        (minY + maxY) * 0.5,
        (minZ + maxZ) * 0.5,
      ],
      reviewTargetPosition: [
        (minX + maxX) * 0.5,
        Math.min(maxY, minY + ((maxY - minY) * 0.72)),
        (minZ + maxZ) * 0.5,
      ],
      rotation: [0, 0, 0],
      safeEditSeam: 'src/modules/expo/runtime/planning/vertical/verticalCitySystem.ts',
      size: [
        (maxX - minX) + route.cabinSize[0] + route.railSpacing,
        (maxY - minY) + route.cabinSize[1],
        (maxZ - minZ) + Math.max(route.cabinSize[2], route.stationSize[2]),
      ],
      sourceFile: 'src/modules/expo/runtime/planning/vertical/verticalCitySystem.ts',
      sourceFunction: 'EXPO_VERTICAL_CITY_SYSTEM',
      sourceKind: 'vertical-elevator-route',
    });
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
    ...buildCityPerimeterEntries(plan.stadiumReserve),
    ...plan.filteredMasses.filter((mass) => (
      mass.renderIntent?.skipBase !== true || (mass.renderIntent?.primitives?.length ?? 0) > 0
    )).map((mass) => createEntry({
      diagnosticOwners: [],
      id: mass.id,
      interactionOwner: null,
      layer: 'city-mass',
      nodeType: mass.renderIntent?.skipBase === true && (mass.renderIntent?.primitives?.length ?? 0) > 0
        ? 'decorative-render-rig'
        : null,
      physicsParts: buildCityMassPhysicsParts(mass),
      planningSections: mass.sections,
      planningRole: mass.role ?? null,
      planningZone: mass.planningZone ?? 'canonical-city',
      position: baseAnchoredBoxCenter(mass.position, mass.size, mass.vertical?.baseY),
      rotation: mass.rotation ?? [0, 0, 0],
      safeEditSeam: mass.planningSource?.safeEditSeam ?? 'src/modules/expo/runtime/planning/world-plan/buildCanonicalWorldPlan.ts',
      size: mass.size,
      sourceFile: mass.planningSource?.sourceFile ?? 'src/modules/expo/runtime/planning/world-plan/buildCanonicalWorldPlan.ts',
      sourceFunction: mass.planningSource?.sourceFunction ?? 'buildCanonicalWorldPlan',
      sourceKind: mass.planningSource?.sourceKind ?? 'city-mass',
      ...verticalRegistryFields(mass.vertical),
    })),
    ...plan.filteredTowerLandmarks.map((tower) => {
      const size = resolveCityTowerAuditSize(tower);
      const physicsParts = buildPrimitivePhysicsParts({
        baseY: tower.vertical?.baseY ?? 0,
        idPrefix: 'primitive',
        origin: tower.position,
        primitives: tower.renderIntent?.primitives,
      });

      return createEntry({
        aliases: compactAliases(tower.id, towerAliasesById.get(tower.id) ?? []),
        diagnosticOwners: [
          'src/modules/expo/runtime/planning/screens/screenOrientationDiagnostics.ts',
        ],
        id: tower.id,
        interactionOwner: null,
        layer: 'city-tower',
        ...(physicsParts ? { physicsParts } : {}),
        planningSections: tower.sections,
        planningZone: tower.planningZone ?? 'canonical-city',
        position: baseAnchoredBoxCenter(tower.position, size, tower.vertical?.baseY),
        rotation: [0, 0, 0],
        safeEditSeam: tower.planningSource?.safeEditSeam ?? 'src/modules/expo/runtime/planning/world-plan/buildCanonicalWorldPlan.ts',
        size,
        sourceFile: tower.planningSource?.sourceFile ?? 'src/modules/expo/runtime/planning/world-plan/buildCanonicalWorldPlan.ts',
        sourceFunction: tower.planningSource?.sourceFunction ?? 'buildCanonicalWorldPlan',
        sourceKind: tower.planningSource?.sourceKind ?? 'city-tower',
        ...verticalRegistryFields(tower.vertical),
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
      planningZone: surface.planningZone ?? 'canonical-city',
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
      planningZone: socket.planningZone ?? 'canonical-city',
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
    ...buildVerticalAccessNodeEntries(plan.verticalSystem.accessNodes),
    ...buildVerticalElevatorRouteEntries(plan.verticalSystem.elevatorRoutes),
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
  return RECOVERED_REAR_CAMPUS_STRUCTURES.map((structure) => {
    const physicsParts = buildRecoveredStadiumStructurePhysicsParts(structure, campusCenterZ);

    return createEntry({
      diagnosticOwners: [
        'scripts/audit-expo-structure-recovery.mjs',
        'scripts/audit-expo-world-registry.mjs',
      ],
      id: structure.id,
      interactionOwner: null,
      layer: 'stadium-structure',
      physicsParts,
      planningRole: 'recovered-large-landmark',
      planningZone: 'rear-campus',
      position: resolveRecoveredRearCampusRegistryPosition(structure, campusCenterZ),
      rotation: [0, 0, 0],
      safeEditSeam: 'src/modules/expo/runtime/world/ExpoRearCampusRecoveredStructures.tsx',
      size: structure.size,
      sourceFile: 'src/modules/expo/runtime/world/ExpoRearCampusRecoveredStructures.tsx',
      sourceFunction: 'ExpoRearCampusRecoveredStructures',
      sourceKind: 'recovered-rear-campus-structure',
    });
  });
}

export function buildStadiumWorldObjectRegistry({
  campusCenterZ,
  rearCampusPlan,
}: BuildStadiumWorldObjectRegistryArgs): WorldObjectRegistryEntry[] {
  const rearCampus = rearCampusPlan.zoneExtension?.rearCampus;
  const rearCampusPerimeterConnectorIds = new Set(
    (rearCampus?.perimeterConnectors ?? []).map((connector) => connector.id),
  );

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
      physicsParts: buildRearCampusPavilionPhysicsParts(pavilion),
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
    ...rearCampusPlan.masses.filter((mass) => (
      !rearCampusPerimeterConnectorIds.has(mass.id)
      && (mass.renderIntent?.skipBase !== true || (mass.renderIntent?.primitives?.length ?? 0) > 0)
    )).map((mass) => createEntry({
      diagnosticOwners: [],
      id: mass.id,
      interactionOwner: null,
      layer: 'stadium-structure',
      nodeType: mass.renderIntent?.skipBase === true && (mass.renderIntent?.primitives?.length ?? 0) > 0
        ? 'decorative-render-rig'
        : null,
      physicsParts: buildCityMassPhysicsParts(mass),
      planningSections: mass.sections,
      planningRole: mass.role ?? null,
      planningZone: mass.planningZone ?? 'rear-campus',
      position: baseAnchoredBoxCenter(mass.position, mass.size, mass.vertical?.baseY),
      rotation: mass.rotation ?? [0, 0, 0],
      safeEditSeam: mass.planningSource?.safeEditSeam ?? 'src/modules/expo/runtime/planning/zones/rear-campus/index.ts',
      size: mass.size,
      sourceFile: mass.planningSource?.sourceFile ?? 'src/modules/expo/runtime/planning/zones/rear-campus/index.ts',
      sourceFunction: mass.planningSource?.sourceFunction ?? 'buildRearCampusZonePlan',
      sourceKind: mass.planningSource?.sourceKind ?? 'rear-campus-mass',
      ...verticalRegistryFields(mass.vertical),
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
    districtThemeId?: string | null;
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
    const boothTemplate = pickSponsorBoothTemplate({
      boothType: placement.boothType,
      districtThemeId: placement.districtThemeId,
      nodeType: placement.nodeType,
      sponsorTier: placement.sponsorTier as Parameters<typeof pickSponsorBoothTemplate>[0]['sponsorTier'],
    });
    const physicsParts = getBoothColliderSegments(boothTemplate).map((segment) => createLocalPhysicsPart({
      id: `collider-${segment.id}`,
      localPosition: segment.position,
      origin: placement.position,
      parentRotation: placement.rotation ?? [0, 0, 0],
      size: segment.size,
    }));
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
      nodeType: placement.nodeType ?? null,
      physicsParts,
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
