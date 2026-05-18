import type { CityGeometryPlanningSource, CityMass, CityPlane, ExpoZonePlannerContext } from '../../types';
import { createVerticalPlacement } from '../../vertical/verticalCitySystem';

const RIGHT_DISTRICT_GEOMETRY_SOURCE_FILE = 'src/modules/expo/runtime/planning/zones/right-district/geometry.ts';
const CELESTIAL_ARCHIVE_GATE_SOURCE_KIND = 'right-celestial-archive-gate-mass';

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

function archiveGateVerticalPlacement({
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

function buildCelestialArchiveGateMasses(): CityMass[] {
  const planningSource = createRightDistrictPlanningSource(
    'buildCelestialArchiveGateMasses',
    CELESTIAL_ARCHIVE_GATE_SOURCE_KIND,
  );
  const center: [number, number, number] = [890, 0, 500];
  const screenFaceZ = 336;

  const createMass = ({
    baseY,
    color,
    decorPolicy = 'signature',
    floorHeight,
    heightBand,
    id,
    level,
    position = center,
    role = 'signature',
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
    size: [number, number, number];
  }): CityMass => ({
    color,
    decorPolicy,
    id,
    planningSource,
    position,
    role,
    size,
    vertical: archiveGateVerticalPlacement({
      baseY,
      floorHeight,
      heightBand,
      level,
    }),
  });

  return [
    createMass({
      baseY: 0,
      color: '#6f8190',
      decorPolicy: 'standard',
      floorHeight: 64,
      heightBand: 'ground',
      id: 'celestial-archive-gate-ground-plinth',
      level: 'ground',
      role: 'structural',
      size: [1240, 64, 320],
    }),
    createMass({
      baseY: 64,
      color: '#8295a3',
      decorPolicy: 'standard',
      floorHeight: 180,
      heightBand: 'low-rise',
      id: 'celestial-archive-gate-left-foundation',
      level: 'level-1',
      position: [center[0] - 470, 0, center[2]],
      role: 'structural',
      size: [270, 180, 300],
    }),
    createMass({
      baseY: 64,
      color: '#8b9da9',
      decorPolicy: 'standard',
      floorHeight: 180,
      heightBand: 'low-rise',
      id: 'celestial-archive-gate-right-foundation',
      level: 'level-1',
      position: [center[0] + 470, 0, center[2]],
      role: 'structural',
      size: [270, 180, 300],
    }),
    createMass({
      baseY: 244,
      color: '#9aabb6',
      floorHeight: 3440,
      heightBand: 'tower',
      id: 'celestial-archive-gate-left-monolith',
      level: 'tower',
      position: [center[0] - 470, 0, center[2] - 24],
      size: [190, 3440, 230],
    }),
    createMass({
      baseY: 244,
      color: '#9fb0bb',
      floorHeight: 3440,
      heightBand: 'tower',
      id: 'celestial-archive-gate-right-monolith',
      level: 'tower',
      position: [center[0] + 470, 0, center[2] - 24],
      size: [190, 3440, 230],
    }),
    createMass({
      baseY: 1960,
      color: '#aabac4',
      floorHeight: 520,
      heightBand: 'roof',
      id: 'celestial-archive-gate-screen-left-anchor',
      level: 'roof',
      position: [center[0] - 370, 0, screenFaceZ],
      size: [88, 520, 74],
    }),
    createMass({
      baseY: 1960,
      color: '#afbec8',
      floorHeight: 520,
      heightBand: 'roof',
      id: 'celestial-archive-gate-screen-right-anchor',
      level: 'roof',
      position: [center[0] + 370, 0, screenFaceZ],
      size: [88, 520, 74],
    }),
    createMass({
      baseY: 1920,
      color: '#778b9a',
      floorHeight: 74,
      heightBand: 'high-rise',
      id: 'celestial-archive-gate-screen-bottom-rail',
      level: 'level-2',
      position: [center[0], 0, screenFaceZ],
      role: 'structural',
      size: [900, 74, 76],
    }),
    createMass({
      baseY: 2496,
      color: '#c2d0d8',
      floorHeight: 92,
      heightBand: 'roof',
      id: 'celestial-archive-gate-screen-top-rail',
      level: 'roof',
      position: [center[0], 0, screenFaceZ],
      role: 'structural',
      size: [980, 92, 76],
    }),
    createMass({
      baseY: 3684,
      color: '#c6d5dc',
      floorHeight: 360,
      heightBand: 'roof',
      id: 'celestial-archive-gate-sky-bridge',
      level: 'skydeck',
      position: [center[0], 0, center[2] - 24],
      size: [1280, 360, 210],
    }),
    createMass({
      baseY: 4044,
      color: '#d2e1e8',
      floorHeight: 610,
      heightBand: 'tower',
      id: 'celestial-archive-gate-archive-core',
      level: 'tower',
      position: [center[0], 0, center[2] - 36],
      size: [320, 610, 170],
    }),
    createMass({
      baseY: 4654,
      color: '#e1edf2',
      decorPolicy: 'none',
      floorHeight: 650,
      heightBand: 'tower',
      id: 'celestial-archive-gate-signal-needle',
      level: 'tower',
      position: [center[0], 0, center[2] - 36],
      role: 'structural',
      size: [72, 650, 72],
    }),
    createMass({
      baseY: 3240,
      color: '#b6c8d2',
      floorHeight: 880,
      heightBand: 'tower',
      id: 'celestial-archive-gate-left-sky-fin',
      level: 'tower',
      position: [center[0] - 690, 0, center[2] - 20],
      size: [80, 880, 110],
    }),
    createMass({
      baseY: 3240,
      color: '#b6c8d2',
      floorHeight: 880,
      heightBand: 'tower',
      id: 'celestial-archive-gate-right-sky-fin',
      level: 'tower',
      position: [center[0] + 690, 0, center[2] - 20],
      size: [80, 880, 110],
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
    ...buildCelestialArchiveGateMasses(),
  ];

  return {
    masses,
    planes,
    towers: [],
  };
}
