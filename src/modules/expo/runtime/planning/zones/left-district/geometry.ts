import type { CityGeometryPlanningSource, CityMass, CityPlane, ExpoZonePlannerContext } from '../../types';
import { createVerticalPlacement } from '../../vertical/verticalCitySystem';

const LEFT_DISTRICT_GEOMETRY_SOURCE_FILE = 'src/modules/expo/runtime/planning/zones/left-district/geometry.ts';
const PREVIOUS_CIVILIZATION_MONUMENT_SOURCE_KIND = 'left-civilization-monument-mass';

function createLeftDistrictPlanningSource(
  sourceFunction: string,
  sourceKind: string,
): CityGeometryPlanningSource {
  return {
    safeEditSeam: LEFT_DISTRICT_GEOMETRY_SOURCE_FILE,
    sourceFile: LEFT_DISTRICT_GEOMETRY_SOURCE_FILE,
    sourceFunction,
    sourceKind,
  };
}

function isLeftDistrictPlane(plane: CityPlane) {
  return plane.position[0] < -40 && plane.position[2] > -2200;
}

function isLeftDistrictMass(mass: CityMass) {
  return mass.position[0] < -40 && mass.position[2] > -2200;
}

function monumentVerticalPlacement({
  baseY,
  floorHeight,
  heightBand,
  level,
}: {
  baseY: number;
  floorHeight: number;
  heightBand: 'ground' | 'low-rise' | 'mid-rise' | 'high-rise' | 'roof';
  level: 'ground' | 'level-1' | 'level-2' | 'roof';
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

function buildPreviousCivilizationMonumentMasses(): CityMass[] {
  const planningSource = createLeftDistrictPlanningSource(
    'buildPreviousCivilizationMonumentMasses',
    PREVIOUS_CIVILIZATION_MONUMENT_SOURCE_KIND,
  );
  const center: [number, number, number] = [-1025, 0, 350];

  return [
    {
      color: '#6f787f',
      decorPolicy: 'none',
      id: 'previous-civilization-monument-base',
      planningSource,
      position: center,
      role: 'structural',
      size: [780, 36, 154],
      vertical: monumentVerticalPlacement({
        baseY: 0,
        floorHeight: 36,
        heightBand: 'ground',
        level: 'ground',
      }),
    },
    {
      color: '#87939b',
      decorPolicy: 'none',
      id: 'previous-civilization-monument-front-step',
      planningSource,
      position: [center[0], 0, center[2] + 118],
      role: 'structural',
      size: [620, 18, 36],
      vertical: monumentVerticalPlacement({
        baseY: 0,
        floorHeight: 18,
        heightBand: 'ground',
        level: 'ground',
      }),
    },
    {
      color: '#7f8a92',
      decorPolicy: 'signature',
      id: 'previous-civilization-monument-left-pylon',
      planningSource,
      position: [center[0] - 320, 0, center[2] - 16],
      role: 'signature',
      size: [96, 340, 108],
      vertical: monumentVerticalPlacement({
        baseY: 36,
        floorHeight: 340,
        heightBand: 'high-rise',
        level: 'level-1',
      }),
    },
    {
      color: '#7f8a92',
      decorPolicy: 'signature',
      id: 'previous-civilization-monument-right-pylon',
      planningSource,
      position: [center[0] + 320, 0, center[2] - 16],
      role: 'signature',
      size: [96, 340, 108],
      vertical: monumentVerticalPlacement({
        baseY: 36,
        floorHeight: 340,
        heightBand: 'high-rise',
        level: 'level-1',
      }),
    },
    {
      color: '#9aa7ae',
      decorPolicy: 'signature',
      id: 'previous-civilization-monument-sky-lintel',
      planningSource,
      position: [center[0], 0, center[2] - 16],
      role: 'signature',
      size: [780, 78, 98],
      vertical: monumentVerticalPlacement({
        baseY: 376,
        floorHeight: 78,
        heightBand: 'roof',
        level: 'roof',
      }),
    },
    {
      color: '#7d8890',
      decorPolicy: 'signature',
      id: 'previous-civilization-monument-left-glyph-tablet',
      planningSource,
      position: [center[0] - 180, 0, center[2] - 76],
      role: 'signature',
      size: [150, 168, 38],
      vertical: monumentVerticalPlacement({
        baseY: 36,
        floorHeight: 168,
        heightBand: 'mid-rise',
        level: 'level-1',
      }),
    },
    {
      color: '#7d8890',
      decorPolicy: 'signature',
      id: 'previous-civilization-monument-right-glyph-tablet',
      planningSource,
      position: [center[0] + 180, 0, center[2] - 76],
      role: 'signature',
      size: [150, 168, 38],
      vertical: monumentVerticalPlacement({
        baseY: 36,
        floorHeight: 168,
        heightBand: 'mid-rise',
        level: 'level-1',
      }),
    },
    {
      color: '#8b969d',
      decorPolicy: 'standard',
      id: 'previous-civilization-monument-center-threshold',
      planningSource,
      position: [center[0], 0, center[2] - 64],
      role: 'structural',
      size: [190, 42, 64],
      vertical: monumentVerticalPlacement({
        baseY: 36,
        floorHeight: 42,
        heightBand: 'low-rise',
        level: 'level-1',
      }),
    },
  ];
}

export function buildLeftDistrictZoneGeometry(context: ExpoZonePlannerContext) {
  const planes = [
    ...context.geometry.promenadeAxisPlanes.filter(isLeftDistrictPlane),
    ...context.geometry.showcasePlazas.filter(isLeftDistrictPlane),
    ...context.geometry.boothForecourtPlanes.filter(isLeftDistrictPlane),
  ];

  const masses = [
    ...context.geometry.boulevardEdgeMasses.filter(isLeftDistrictMass),
    ...context.geometry.showcaseMasses.filter(isLeftDistrictMass),
    ...context.geometry.discoveryEdgeMasses.filter(isLeftDistrictMass),
    ...context.geometry.supportEdgeMasses.filter(isLeftDistrictMass),
    ...context.geometry.discoveryLandmarkMasses.filter(isLeftDistrictMass),
    ...context.geometry.discoverySupportMasses.filter(isLeftDistrictMass),
    ...context.geometry.observatoryMasses.filter(isLeftDistrictMass),
    ...context.geometry.signatureMasses.filter(isLeftDistrictMass),
    ...context.geometry.skybridgeMasses.filter(isLeftDistrictMass),
    ...buildPreviousCivilizationMonumentMasses(),
  ];

  return {
    masses,
    planes,
    towers: [],
  };
}
