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
  const center: [number, number, number] = [-900, 0, 350];
  const relicCityFaceZ = center[2] - 48;

  return [
    {
      color: '#8f9ca4',
      decorPolicy: 'none',
      id: 'previous-civilization-monument-base',
      planningSource,
      position: center,
      role: 'structural',
      size: [1360, 56, 280],
      vertical: monumentVerticalPlacement({
        baseY: 0,
        floorHeight: 56,
        heightBand: 'ground',
        level: 'ground',
      }),
    },
    {
      color: '#a2afb6',
      decorPolicy: 'none',
      id: 'previous-civilization-monument-front-step',
      planningSource,
      position: [center[0], 0, center[2] + 182],
      role: 'structural',
      size: [1180, 34, 74],
      vertical: monumentVerticalPlacement({
        baseY: 0,
        floorHeight: 34,
        heightBand: 'ground',
        level: 'ground',
      }),
    },
    {
      color: '#7f8b94',
      decorPolicy: 'none',
      id: 'previous-civilization-monument-rear-step',
      planningSource,
      position: [center[0], 0, center[2] - 168],
      role: 'structural',
      size: [980, 32, 64],
      vertical: monumentVerticalPlacement({
        baseY: 0,
        floorHeight: 32,
        heightBand: 'ground',
        level: 'ground',
      }),
    },
    {
      color: '#a0adb5',
      decorPolicy: 'signature',
      id: 'previous-civilization-monument-left-pylon',
      planningSource,
      position: [center[0] - 620, 0, center[2] - 24],
      role: 'signature',
      size: [150, 1780, 190],
      vertical: monumentVerticalPlacement({
        baseY: 56,
        floorHeight: 1780,
        heightBand: 'high-rise',
        level: 'level-1',
      }),
    },
    {
      color: '#a0adb5',
      decorPolicy: 'signature',
      id: 'previous-civilization-monument-right-pylon',
      planningSource,
      position: [center[0] + 620, 0, center[2] - 24],
      role: 'signature',
      size: [150, 1780, 190],
      vertical: monumentVerticalPlacement({
        baseY: 56,
        floorHeight: 1780,
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
      size: [1360, 220, 176],
      vertical: monumentVerticalPlacement({
        baseY: 1836,
        floorHeight: 220,
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
      size: [840, 420, 150],
      vertical: monumentVerticalPlacement({
        baseY: 2056,
        floorHeight: 420,
        heightBand: 'roof',
        level: 'roof',
      }),
    },
    {
      color: '#9aa7af',
      decorPolicy: 'signature',
      id: 'previous-civilization-monument-left-glyph-tablet',
      planningSource,
      position: [center[0] - 335, 0, center[2] - 108],
      role: 'signature',
      size: [220, 460, 54],
      vertical: monumentVerticalPlacement({
        baseY: 90,
        floorHeight: 460,
        heightBand: 'mid-rise',
        level: 'level-1',
      }),
    },
    {
      color: '#9aa7af',
      decorPolicy: 'signature',
      id: 'previous-civilization-monument-right-glyph-tablet',
      planningSource,
      position: [center[0] + 335, 0, center[2] - 108],
      role: 'signature',
      size: [220, 460, 54],
      vertical: monumentVerticalPlacement({
        baseY: 90,
        floorHeight: 460,
        heightBand: 'mid-rise',
        level: 'level-1',
      }),
    },
    {
      color: '#9fabb2',
      decorPolicy: 'standard',
      id: 'previous-civilization-monument-center-threshold',
      planningSource,
      position: [center[0], 0, center[2] - 108],
      role: 'structural',
      size: [320, 72, 86],
      vertical: monumentVerticalPlacement({
        baseY: 56,
        floorHeight: 72,
        heightBand: 'low-rise',
        level: 'level-1',
      }),
    },
    {
      color: '#a8b6be',
      decorPolicy: 'signature',
      id: 'previous-civilization-monument-screen-left-anchor',
      planningSource,
      position: [center[0] - 470, 0, relicCityFaceZ],
      role: 'signature',
      size: [70, 800, 72],
      vertical: monumentVerticalPlacement({
        baseY: 860,
        floorHeight: 800,
        heightBand: 'high-rise',
        level: 'level-2',
      }),
    },
    {
      color: '#a8b6be',
      decorPolicy: 'signature',
      id: 'previous-civilization-monument-screen-right-anchor',
      planningSource,
      position: [center[0] + 470, 0, relicCityFaceZ],
      role: 'signature',
      size: [70, 800, 72],
      vertical: monumentVerticalPlacement({
        baseY: 860,
        floorHeight: 800,
        heightBand: 'high-rise',
        level: 'level-2',
      }),
    },
    {
      color: '#bac7ce',
      decorPolicy: 'signature',
      id: 'previous-civilization-monument-screen-top-relic-rail',
      planningSource,
      position: [center[0], 0, relicCityFaceZ],
      role: 'signature',
      size: [980, 74, 76],
      vertical: monumentVerticalPlacement({
        baseY: 1660,
        floorHeight: 74,
        heightBand: 'roof',
        level: 'roof',
      }),
    },
    {
      color: '#929fa8',
      decorPolicy: 'signature',
      id: 'previous-civilization-monument-screen-bottom-relic-rail',
      planningSource,
      position: [center[0], 0, relicCityFaceZ],
      role: 'signature',
      size: [980, 58, 76],
      vertical: monumentVerticalPlacement({
        baseY: 860,
        floorHeight: 58,
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
