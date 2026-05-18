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
  const center: [number, number, number] = [-915, 0, 350];
  const relicCityFaceZ = center[2] - 48;

  return [
    {
      color: '#8f9ca4',
      decorPolicy: 'none',
      id: 'previous-civilization-monument-base',
      planningSource,
      position: center,
      role: 'structural',
      size: [1420, 56, 280],
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
      color: '#a4b1b9',
      decorPolicy: 'signature',
      id: 'previous-civilization-monument-left-pylon',
      planningSource,
      position: [center[0] - 615, 0, center[2] - 24],
      role: 'signature',
      size: [150, 2460, 210],
      vertical: monumentVerticalPlacement({
        baseY: 56,
        floorHeight: 2460,
        heightBand: 'high-rise',
        level: 'level-1',
      }),
    },
    {
      color: '#a4b1b9',
      decorPolicy: 'signature',
      id: 'previous-civilization-monument-right-pylon',
      planningSource,
      position: [center[0] + 615, 0, center[2] - 24],
      role: 'signature',
      size: [150, 2460, 210],
      vertical: monumentVerticalPlacement({
        baseY: 56,
        floorHeight: 2460,
        heightBand: 'high-rise',
        level: 'level-1',
      }),
    },
    {
      color: '#bbc8cf',
      decorPolicy: 'signature',
      id: 'previous-civilization-monument-sky-lintel',
      planningSource,
      position: [center[0], 0, center[2] - 24],
      role: 'signature',
      size: [1380, 260, 190],
      vertical: monumentVerticalPlacement({
        baseY: 2516,
        floorHeight: 260,
        heightBand: 'roof',
        level: 'roof',
      }),
    },
    {
      color: '#c7d2d8',
      decorPolicy: 'signature',
      id: 'previous-civilization-monument-crown-relic',
      planningSource,
      position: [center[0], 0, center[2] - 24],
      role: 'signature',
      size: [980, 520, 170],
      vertical: monumentVerticalPlacement({
        baseY: 2776,
        floorHeight: 520,
        heightBand: 'roof',
        level: 'roof',
      }),
    },
    {
      color: '#9aa7af',
      decorPolicy: 'signature',
      id: 'previous-civilization-monument-left-glyph-tablet',
      planningSource,
      position: [center[0] - 395, 0, center[2] - 108],
      role: 'signature',
      size: [250, 620, 60],
      vertical: monumentVerticalPlacement({
        baseY: 120,
        floorHeight: 620,
        heightBand: 'mid-rise',
        level: 'level-1',
      }),
    },
    {
      color: '#9aa7af',
      decorPolicy: 'signature',
      id: 'previous-civilization-monument-right-glyph-tablet',
      planningSource,
      position: [center[0] + 395, 0, center[2] - 108],
      role: 'signature',
      size: [250, 620, 60],
      vertical: monumentVerticalPlacement({
        baseY: 120,
        floorHeight: 620,
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
      size: [420, 110, 110],
      vertical: monumentVerticalPlacement({
        baseY: 56,
        floorHeight: 110,
        heightBand: 'low-rise',
        level: 'level-1',
      }),
    },
    {
      color: '#a8b6be',
      decorPolicy: 'signature',
      id: 'previous-civilization-monument-screen-left-anchor',
      planningSource,
      position: [center[0] - 600, 0, relicCityFaceZ],
      role: 'signature',
      size: [84, 1050, 76],
      vertical: monumentVerticalPlacement({
        baseY: 900,
        floorHeight: 1050,
        heightBand: 'high-rise',
        level: 'level-2',
      }),
    },
    {
      color: '#a8b6be',
      decorPolicy: 'signature',
      id: 'previous-civilization-monument-screen-right-anchor',
      planningSource,
      position: [center[0] + 600, 0, relicCityFaceZ],
      role: 'signature',
      size: [84, 1050, 76],
      vertical: monumentVerticalPlacement({
        baseY: 900,
        floorHeight: 1050,
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
      size: [1220, 90, 80],
      vertical: monumentVerticalPlacement({
        baseY: 1950,
        floorHeight: 90,
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
      size: [1220, 68, 80],
      vertical: monumentVerticalPlacement({
        baseY: 880,
        floorHeight: 68,
        heightBand: 'mid-rise',
        level: 'level-2',
      }),
    },
    {
      color: '#ccd8de',
      decorPolicy: 'signature',
      id: 'previous-civilization-monument-ascension-core',
      planningSource,
      position: [center[0], 0, center[2] - 140],
      role: 'signature',
      size: [340, 1250, 140],
      vertical: monumentVerticalPlacement({
        baseY: 2040,
        floorHeight: 1250,
        heightBand: 'roof',
        level: 'roof',
      }),
    },
    {
      color: '#d4e1e7',
      decorPolicy: 'signature',
      id: 'previous-civilization-monument-sky-needle',
      planningSource,
      position: [center[0], 0, center[2] - 140],
      role: 'signature',
      size: [120, 1050, 90],
      vertical: monumentVerticalPlacement({
        baseY: 3290,
        floorHeight: 1050,
        heightBand: 'roof',
        level: 'roof',
      }),
    },
    {
      color: '#b9c8d0',
      decorPolicy: 'signature',
      id: 'previous-civilization-monument-left-sky-blade',
      planningSource,
      position: [center[0] - 360, 0, center[2] - 118],
      role: 'signature',
      size: [88, 950, 110],
      vertical: monumentVerticalPlacement({
        baseY: 3020,
        floorHeight: 950,
        heightBand: 'roof',
        level: 'roof',
      }),
    },
    {
      color: '#b9c8d0',
      decorPolicy: 'signature',
      id: 'previous-civilization-monument-right-sky-blade',
      planningSource,
      position: [center[0] + 360, 0, center[2] - 118],
      role: 'signature',
      size: [88, 950, 110],
      vertical: monumentVerticalPlacement({
        baseY: 3020,
        floorHeight: 950,
        heightBand: 'roof',
        level: 'roof',
      }),
    },
    {
      color: '#aebec7',
      decorPolicy: 'signature',
      id: 'previous-civilization-monument-outer-left-needle',
      planningSource,
      position: [center[0] - 665, 0, center[2] - 30],
      role: 'signature',
      size: [76, 1420, 90],
      vertical: monumentVerticalPlacement({
        baseY: 1960,
        floorHeight: 1420,
        heightBand: 'roof',
        level: 'roof',
      }),
    },
    {
      color: '#aebec7',
      decorPolicy: 'signature',
      id: 'previous-civilization-monument-outer-right-needle',
      planningSource,
      position: [center[0] + 665, 0, center[2] - 30],
      role: 'signature',
      size: [76, 1420, 90],
      vertical: monumentVerticalPlacement({
        baseY: 1960,
        floorHeight: 1420,
        heightBand: 'roof',
        level: 'roof',
      }),
    },
    {
      color: '#c2d0d7',
      decorPolicy: 'signature',
      id: 'previous-civilization-monument-upper-halo-wing-left',
      planningSource,
      position: [center[0] - 375, 0, center[2] - 104],
      role: 'signature',
      size: [520, 80, 90],
      vertical: monumentVerticalPlacement({
        baseY: 2860,
        floorHeight: 80,
        heightBand: 'roof',
        level: 'roof',
      }),
    },
    {
      color: '#c2d0d7',
      decorPolicy: 'signature',
      id: 'previous-civilization-monument-upper-halo-wing-right',
      planningSource,
      position: [center[0] + 375, 0, center[2] - 104],
      role: 'signature',
      size: [520, 80, 90],
      vertical: monumentVerticalPlacement({
        baseY: 2860,
        floorHeight: 80,
        heightBand: 'roof',
        level: 'roof',
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
