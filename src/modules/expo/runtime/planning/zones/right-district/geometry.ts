import type { CityGeometryPlanningSource, CityMass, CityPlane, ExpoZonePlannerContext } from '../../types';
import { createVerticalPlacement } from '../../vertical/verticalCitySystem';

const RIGHT_DISTRICT_GEOMETRY_SOURCE_FILE = 'src/modules/expo/runtime/planning/zones/right-district/geometry.ts';
const ORBITAL_BROADCAST_FOUNDRY_SOURCE_KIND = 'right-orbital-broadcast-foundry-mass';

function createRightDistrictPlanningSource(
  sourceFunction: string,
  sourceKind: string,
): CityGeometryPlanningSource {
  return {
    safeEditSeam: RIGHT_DISTRICT_GEOMETRY_SOURCE_FILE,
    sourceFile: RIGHT_DISTRICT_GEOMETRY_SOURCE_FILE,
    sourceFunction,
    sourceKind,
  };
}

function isRightDistrictPlane(plane: CityPlane) {
  return plane.position[0] > 40 && plane.position[2] > -2200;
}

function isRightDistrictMass(mass: CityMass) {
  return mass.position[0] > 40 && mass.position[2] > -2200;
}

function foundryVerticalPlacement({
  baseY,
  floorHeight,
  heightBand,
  level,
}: {
  baseY: number;
  floorHeight: number;
  heightBand: 'ground' | 'low-rise' | 'mid-rise' | 'high-rise' | 'roof' | 'tower';
  level: 'ground' | 'level-1' | 'level-2' | 'roof' | 'tower' | 'skydeck';
}) {
  return createVerticalPlacement({
    baseY,
    floorCount: 1,
    floorHeight,
    heightBand,
    level,
    verticalOwner: 'city',
  });
}

function buildOrbitalBroadcastFoundryMasses(): CityMass[] {
  const planningSource = createRightDistrictPlanningSource(
    'buildOrbitalBroadcastFoundryMasses',
    ORBITAL_BROADCAST_FOUNDRY_SOURCE_KIND,
  );
  const center: [number, number, number] = [890, 0, 500];
  const screenFaceZ = 318;

  const createMass = ({
    baseY,
    color,
    decorPolicy = 'signature',
    floorHeight,
    heightBand,
    id,
    level,
    position = center,
    role = 'structural',
    rotation,
    size,
  }: {
    baseY: number;
    color: string;
    decorPolicy?: CityMass['decorPolicy'];
    floorHeight: number;
    heightBand: NonNullable<CityMass['vertical']>['heightBand'];
    id: string;
    level: NonNullable<CityMass['vertical']>['level'];
    position?: [number, number, number];
    role?: NonNullable<CityMass['role']>;
    rotation?: [number, number, number];
    size: [number, number, number];
  }): CityMass => ({
    color,
    decorPolicy,
    id,
    planningSource,
    position,
    rotation,
    role,
    size,
    vertical: foundryVerticalPlacement({
      baseY,
      floorHeight,
      heightBand,
      level,
    }),
  });

  return [
    createMass({
      baseY: 0,
      color: '#687c8c',
      decorPolicy: 'standard',
      floorHeight: 54,
      heightBand: 'ground',
      id: 'orbital-broadcast-foundry-main-deck',
      level: 'ground',
      role: 'structural',
      size: [1220, 54, 300],
    }),
    createMass({
      baseY: 54,
      color: '#7d91a0',
      decorPolicy: 'standard',
      floorHeight: 92,
      heightBand: 'low-rise',
      id: 'orbital-broadcast-foundry-forward-apron',
      level: 'level-1',
      position: [center[0] - 120, 0, center[2] - 156],
      rotation: [0, -0.08, 0],
      role: 'structural',
      size: [780, 92, 92],
    }),
    createMass({
      baseY: 70,
      color: '#8699a7',
      decorPolicy: 'standard',
      floorHeight: 132,
      heightBand: 'low-rise',
      id: 'orbital-broadcast-foundry-back-service-wing',
      level: 'level-1',
      position: [center[0] + 310, 0, center[2] + 72],
      rotation: [0, 0.14, 0],
      role: 'structural',
      size: [620, 132, 118],
    }),
    createMass({
      baseY: 202,
      color: '#8fa3b0',
      floorHeight: 1120,
      heightBand: 'high-rise',
      id: 'orbital-broadcast-foundry-curved-dish-core',
      level: 'level-2',
      position: [center[0] - 70, 0, center[2] - 34],
      role: 'structural',
      size: [1040, 1120, 118],
    }),
    createMass({
      baseY: 560,
      color: '#9db1bd',
      floorHeight: 1580,
      heightBand: 'tower',
      id: 'orbital-broadcast-foundry-offset-signal-spine',
      level: 'tower',
      position: [center[0] + 475, 0, center[2] + 8],
      rotation: [0, 0.08, 0],
      role: 'signature',
      size: [126, 1580, 156],
    }),
    createMass({
      baseY: 1440,
      color: '#8da2b0',
      floorHeight: 920,
      heightBand: 'tower',
      id: 'orbital-broadcast-foundry-left-counterweight-stack',
      level: 'tower',
      position: [center[0] - 520, 0, center[2] - 28],
      rotation: [0, -0.2, 0],
      size: [170, 920, 150],
    }),
    createMass({
      baseY: 2200,
      color: '#c5d6df',
      floorHeight: 96,
      heightBand: 'roof',
      id: 'orbital-broadcast-foundry-screen-under-keel',
      level: 'roof',
      position: [center[0], 0, screenFaceZ],
      rotation: [0, -0.02, 0],
      role: 'structural',
      size: [1030, 96, 72],
    }),
    createMass({
      baseY: 2868,
      color: '#d0e1e8',
      floorHeight: 86,
      heightBand: 'roof',
      id: 'orbital-broadcast-foundry-screen-crown-keel',
      level: 'roof',
      position: [center[0], 0, screenFaceZ],
      rotation: [0, 0.02, 0],
      role: 'structural',
      size: [1140, 86, 72],
    }),
    createMass({
      baseY: 2230,
      color: '#aabdc8',
      floorHeight: 610,
      heightBand: 'roof',
      id: 'orbital-broadcast-foundry-screen-left-clamp',
      level: 'roof',
      position: [center[0] - 565, 0, screenFaceZ + 6],
      role: 'structural',
      size: [70, 610, 72],
    }),
    createMass({
      baseY: 2230,
      color: '#aabdc8',
      floorHeight: 610,
      heightBand: 'roof',
      id: 'orbital-broadcast-foundry-screen-right-clamp',
      level: 'roof',
      position: [center[0] + 565, 0, screenFaceZ + 6],
      role: 'structural',
      size: [70, 610, 72],
    }),
    createMass({
      baseY: 3100,
      color: '#bfd2dc',
      floorHeight: 74,
      heightBand: 'roof',
      id: 'orbital-broadcast-foundry-orbit-ring-front',
      level: 'skydeck',
      position: [center[0], 0, center[2] - 84],
      rotation: [0, 0, 0],
      role: 'structural',
      size: [1220, 74, 82],
    }),
    createMass({
      baseY: 3280,
      color: '#b5cad5',
      floorHeight: 66,
      heightBand: 'roof',
      id: 'orbital-broadcast-foundry-orbit-ring-left-diagonal',
      level: 'skydeck',
      position: [center[0] - 320, 0, center[2] - 80],
      rotation: [0, -0.54, 0],
      role: 'structural',
      size: [680, 66, 72],
    }),
    createMass({
      baseY: 3460,
      color: '#d2e2e9',
      floorHeight: 70,
      heightBand: 'roof',
      id: 'orbital-broadcast-foundry-orbit-ring-right-diagonal',
      level: 'skydeck',
      position: [center[0] + 340, 0, center[2] - 90],
      rotation: [0, 0.62, 0],
      role: 'structural',
      size: [680, 70, 72],
    }),
    createMass({
      baseY: 3640,
      color: '#c7dbe3',
      floorHeight: 64,
      heightBand: 'roof',
      id: 'orbital-broadcast-foundry-orbit-ring-rear',
      level: 'skydeck',
      position: [center[0] + 80, 0, center[2] + 126],
      rotation: [0, 0.04, 0],
      role: 'structural',
      size: [920, 64, 70],
    }),
    createMass({
      baseY: 3780,
      color: '#d9e8ee',
      floorHeight: 580,
      heightBand: 'tower',
      id: 'orbital-broadcast-foundry-upper-broadcast-core',
      level: 'tower',
      position: [center[0] + 170, 0, center[2] + 28],
      rotation: [0, 0.12, 0],
      role: 'signature',
      size: [230, 580, 170],
    }),
    createMass({
      baseY: 4360,
      color: '#e1edf2',
      decorPolicy: 'none',
      floorHeight: 980,
      heightBand: 'tower',
      id: 'orbital-broadcast-foundry-signal-spire',
      level: 'tower',
      position: [center[0] + 170, 0, center[2] + 28],
      role: 'signature',
      size: [54, 980, 54],
    }),
    createMass({
      baseY: 5260,
      color: '#f1fbff',
      floorHeight: 58,
      heightBand: 'tower',
      id: 'orbital-broadcast-foundry-top-transmitter',
      level: 'tower',
      position: [center[0] + 170, 0, center[2] + 28],
      role: 'signature',
      size: [260, 58, 260],
    }),
    createMass({
      baseY: 1180,
      color: '#748b9a',
      decorPolicy: 'standard',
      floorHeight: 520,
      heightBand: 'high-rise',
      id: 'orbital-broadcast-foundry-left-service-pod',
      level: 'level-2',
      position: [center[0] - 325, 0, center[2] + 40],
      rotation: [0, -0.34, 0],
      role: 'structural',
      size: [260, 520, 160],
    }),
    createMass({
      baseY: 880,
      color: '#8196a4',
      decorPolicy: 'standard',
      floorHeight: 380,
      heightBand: 'mid-rise',
      id: 'orbital-broadcast-foundry-front-data-pod',
      level: 'level-2',
      position: [center[0] + 210, 0, center[2] - 142],
      rotation: [0, 0.28, 0],
      role: 'structural',
      size: [300, 380, 116],
    }),
  ];
}

export function buildRightDistrictZoneGeometry(context: ExpoZonePlannerContext) {
  const planes = [
    ...context.geometry.promenadeAxisPlanes.filter(isRightDistrictPlane),
    ...context.geometry.showcasePlazas.filter(isRightDistrictPlane),
    ...context.geometry.boothForecourtPlanes.filter(isRightDistrictPlane),
  ];

  const masses = [
    ...context.geometry.boulevardEdgeMasses.filter(isRightDistrictMass),
    ...context.geometry.showcaseMasses.filter(isRightDistrictMass),
    ...context.geometry.rightSupportMasses.filter(isRightDistrictMass),
    ...context.geometry.discoveryEdgeMasses.filter(isRightDistrictMass),
    ...context.geometry.supportEdgeMasses.filter(isRightDistrictMass),
    ...context.geometry.discoveryLandmarkMasses.filter(isRightDistrictMass),
    ...context.geometry.discoverySupportMasses.filter(isRightDistrictMass),
    ...context.geometry.observatoryMasses.filter(isRightDistrictMass),
    ...context.geometry.signatureMasses.filter(isRightDistrictMass),
    ...context.geometry.skybridgeMasses.filter(isRightDistrictMass),
    ...buildOrbitalBroadcastFoundryMasses(),
  ];

  return {
    masses,
    planes,
    towers: [],
  };
}
