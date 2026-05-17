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
  const relicFaceZ = center[2] + 48;

  return [
    {
      color: '#8f9ca4',
      decorPolicy: 'none',
      id: 'previous-civilization-monument-base',
      planningSource,
      position: center,
      role: 'structural',
      size: [980, 42, 230],
      vertical: monumentVerticalPlacement({
        baseY: 0,
        floorHeight: 42,
        heightBand: 'ground',
        level: 'ground',
      }),
    },
    {
      color: '#a2afb6',
      decorPolicy: 'none',
      id: 'previous-civilization-monument-front-step',
      planningSource,
      position: [center[0], 0, center[2] + 152],
      role: 'structural',
      size: [820, 24, 54],
      vertical: monumentVerticalPlacement({
        baseY: 0,
        floorHeight: 24,
        heightBand: 'ground',
        level: 'ground',
      }),
    },
    {
      color: '#7f8b94',
      decorPolicy: 'none',
      id: 'previous-civilization-monument-rear-step',
      planningSource,
      position: [center[0], 0, center[2] - 138],
      role: 'structural',
      size: [760, 28, 52],
      vertical: monumentVerticalPlacement({
        baseY: 0,
        floorHeight: 28,
        heightBand: 'ground',
        level: 'ground',
      }),
    },
    {
      color: '#a0adb5',
      decorPolicy: 'signature',
      id: 'previous-civilization-monument-left-pylon',
      planningSource,
      position: [center[0] - 430, 0, center[2] - 24],
      role: 'signature',
      size: [146, 560, 142],
      vertical: monumentVerticalPlacement({
        baseY: 42,
        floorHeight: 560,
        heightBand: 'high-rise',
        level: 'level-1',
      }),
    },
    {
      color: '#a0adb5',
      decorPolicy: 'signature',
      id: 'previous-civilization-monument-right-pylon',
      planningSource,
      position: [center[0] + 430, 0, center[2] - 24],
      role: 'signature',
      size: [146, 560, 142],
      vertical: monumentVerticalPlacement({
        baseY: 42,
        floorHeight: 560,
        heightBand: 'high-rise',
        level: 'level-1',
      }),
    },
    {
      color: '#b6c3ca',
      decorPolicy: 'signature',
      id: 'previous-civilization-monument-sky-lintel',
      planningSource,
      position: [center[0], 0, center[2] - 24],
      role: 'signature',
      size: [1010, 118, 132],
      vertical: monumentVerticalPlacement({
        baseY: 602,
        floorHeight: 118,
        heightBand: 'roof',
        level: 'roof',
      }),
    },
    {
      color: '#c1ccd2',
      decorPolicy: 'signature',
      id: 'previous-civilization-monument-crown-relic',
      planningSource,
      position: [center[0], 0, center[2] - 24],
      role: 'signature',
      size: [620, 170, 112],
      vertical: monumentVerticalPlacement({
        baseY: 720,
        floorHeight: 170,
        heightBand: 'roof',
        level: 'roof',
      }),
    },
    {
      color: '#9aa7af',
      decorPolicy: 'signature',
      id: 'previous-civilization-monument-left-glyph-tablet',
      planningSource,
      position: [center[0] - 245, 0, center[2] - 92],
      role: 'signature',
      size: [170, 220, 44],
      vertical: monumentVerticalPlacement({
        baseY: 52,
        floorHeight: 220,
        heightBand: 'mid-rise',
        level: 'level-1',
      }),
    },
    {
      color: '#9aa7af',
      decorPolicy: 'signature',
      id: 'previous-civilization-monument-right-glyph-tablet',
      planningSource,
      position: [center[0] + 245, 0, center[2] - 92],
      role: 'signature',
      size: [170, 220, 44],
      vertical: monumentVerticalPlacement({
        baseY: 52,
        floorHeight: 220,
        heightBand: 'mid-rise',
        level: 'level-1',
      }),
    },
    {
      color: '#9fabb2',
      decorPolicy: 'standard',
      id: 'previous-civilization-monument-center-threshold',
      planningSource,
      position: [center[0], 0, center[2] - 86],
      role: 'structural',
      size: [260, 54, 72],
      vertical: monumentVerticalPlacement({
        baseY: 42,
        floorHeight: 54,
        heightBand: 'low-rise',
        level: 'level-1',
      }),
    },
    {
      color: '#a8b6be',
      decorPolicy: 'signature',
      id: 'previous-civilization-monument-screen-left-anchor',
      planningSource,
      position: [center[0] - 302, 0, relicFaceZ],
      role: 'signature',
      size: [44, 392, 56],
      vertical: monumentVerticalPlacement({
        baseY: 196,
        floorHeight: 392,
        heightBand: 'high-rise',
        level: 'level-2',
      }),
    },
    {
      color: '#a8b6be',
      decorPolicy: 'signature',
      id: 'previous-civilization-monument-screen-right-anchor',
      planningSource,
      position: [center[0] + 302, 0, relicFaceZ],
      role: 'signature',
      size: [44, 392, 56],
      vertical: monumentVerticalPlacement({
        baseY: 196,
        floorHeight: 392,
        heightBand: 'high-rise',
        level: 'level-2',
      }),
    },
    {
      color: '#bac7ce',
      decorPolicy: 'signature',
      id: 'previous-civilization-monument-screen-top-relic-rail',
      planningSource,
      position: [center[0], 0, relicFaceZ],
      role: 'signature',
      size: [650, 42, 58],
      vertical: monumentVerticalPlacement({
        baseY: 588,
        floorHeight: 42,
        heightBand: 'roof',
        level: 'roof',
      }),
    },
    {
      color: '#929fa8',
      decorPolicy: 'signature',
      id: 'previous-civilization-monument-screen-bottom-relic-rail',
      planningSource,
      position: [center[0], 0, relicFaceZ],
      role: 'signature',
      size: [650, 36, 58],
      vertical: monumentVerticalPlacement({
        baseY: 196,
        floorHeight: 36,
        heightBand: 'mid-rise',
        level: 'level-2',
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
