import {
  buildRearCampusMetrics,
  buildRearCampusPerimeterConnectors,
  buildVisibleRearCampusForecourts,
  buildVisibleRearCampusLandmarkTowers,
  buildVisibleRearCampusSidePavilions,
} from '../../../world/ExpoRearCampusLayout';
import { buildZoneScreenAssignmentPlan } from '../../screens/buildScreenAssignmentPlan';
import { buildZoneScreenSocketPlan } from '../../screens/buildScreenSocketPlan';
import { buildZoneScreenSurfacePlan } from '../../screens/buildScreenSurfacePlan';
import type {
  CanonicalPrimitive,
  CityGeometryPlanningSource,
  CityMass,
  CityTower,
  RearCampusLandmarkTower,
  RearCampusZoneExtension,
  ExpoZonePlannerContext,
} from '../../types';
import { collectZoneBoothPlacements, createZonePlan, getZoneRule } from '../shared';

const REAR_CAMPUS_GEOMETRY_SOURCE_FILE = 'src/modules/expo/runtime/planning/zones/rear-campus/index.ts';
const AI_REACTOR_CORE_SOURCE_KIND = 'ai-reactor-core-render-rig';
const ENERGY_GRID_NETWORK_SOURCE_KIND = 'energy-grid-network-render-rig';
const AI_ORACLE_CHAMBER_SOURCE_KIND = 'ai-oracle-chamber-render-rig';
const CENTER_SKY_COMPASS_SOURCE_KIND = 'center-sky-compass-render-rig';

function mapRearCampusLandmarkTowers(
  towers: ReturnType<typeof buildVisibleRearCampusLandmarkTowers>
): RearCampusLandmarkTower[] {
  return towers.map((tower) => ({
    id: tower.id,
    position: tower.position,
  }));
}

function createRearCampusPlanningSource(
  sourceFunction: string,
  sourceKind: string,
): CityGeometryPlanningSource {
  return {
    safeEditSeam: REAR_CAMPUS_GEOMETRY_SOURCE_FILE,
    sourceFile: REAR_CAMPUS_GEOMETRY_SOURCE_FILE,
    sourceFunction,
    sourceKind,
  };
}

function toLocalPoint(
  origin: [number, number, number],
  point: [number, number, number],
): [number, number, number] {
  return [
    point[0] - origin[0],
    point[1] - origin[1],
    point[2] - origin[2],
  ];
}

function buildEnergyGridBeam(args: {
  color?: string;
  emissiveIntensity?: number;
  end: [number, number, number];
  origin: [number, number, number];
  start: [number, number, number];
  thickness?: number;
}): CanonicalPrimitive {
  const dx = args.end[0] - args.start[0];
  const dz = args.end[2] - args.start[2];
  const length = Math.max(1, Math.hypot(dx, dz));
  const center: [number, number, number] = [
    (args.start[0] + args.end[0]) * 0.5,
    (args.start[1] + args.end[1]) * 0.5,
    (args.start[2] + args.end[2]) * 0.5,
  ];

  return {
    color: args.color ?? '#47f5e5',
    emissive: '#6fffe9',
    emissiveIntensity: args.emissiveIntensity ?? 0.052,
    kind: 'box',
    metalness: 0.24,
    opacity: 0.82,
    physics: 'decorative',
    position: toLocalPoint(args.origin, center),
    rotation: [0, -Math.atan2(dz, dx), 0],
    roughness: 0.22,
    size: [length, args.thickness ?? 8, args.thickness ?? 8],
    transparent: true,
  };
}

function buildEnergyGridNode(args: {
  height?: number;
  origin: [number, number, number];
  point: [number, number, number];
  radius?: number;
}): CanonicalPrimitive[] {
  const height = args.height ?? 240;
  const radius = args.radius ?? 22;

  return [
    {
      color: '#8ffff4',
      emissive: '#6fffe9',
      emissiveIntensity: 0.07,
      height,
      kind: 'cylinder',
      metalness: 0.22,
      opacity: 0.56,
      physics: 'decorative',
      position: toLocalPoint(args.origin, [
        args.point[0],
        args.point[1] + (height * 0.5),
        args.point[2],
      ]),
      radialSegments: 18,
      radiusBottom: radius,
      radiusTop: radius * 0.46,
      roughness: 0.2,
      transparent: true,
    },
    {
      color: '#dffefb',
      emissive: '#6fffe9',
      emissiveIntensity: 0.068,
      kind: 'torus',
      metalness: 0.24,
      opacity: 0.72,
      physics: 'decorative',
      position: toLocalPoint(args.origin, [
        args.point[0],
        args.point[1] + height + 26,
        args.point[2],
      ]),
      radialSegments: 10,
      radius: radius * 3.2,
      rotation: [Math.PI / 2, 0, 0],
      roughness: 0.2,
      transparent: true,
      tube: 3,
      tubularSegments: 80,
    },
  ];
}

function buildRearCampusTower(tower: RearCampusLandmarkTower, crownColor: string): CityTower {
  const renderIntent = {
    crownBandEmissiveIntensity: 0.036,
    crownPlateEmissiveIntensity: 0.05,
    hidden: false,
    insetEmissive: 0.018,
    midBandEmissiveIntensity: 0.03,
    podiumDepthMultiplier: 1.7,
    podiumEmissiveIntensity: 0.012,
    podiumWidthMultiplier: 1.65,
    rearFinEmissive: 0.018,
    showCrownPlate: true,
    showCrownPods: true,
    showInsetMass: true,
    showMidBand: true,
    showRearFin: true,
    showSideFin: true,
    showSpire: true,
    sideFinEmissive: 0.026,
    skipBase: false,
    rearFinHeight: 48,
    sideFinHeight: 72,
    crownBandHeight: 12,
    midBandHeight: 18,
  } as const;
  const side = tower.position[0] < 0 ? -1 : 1;
  const baseSize: [number, number, number] = [188, 576, 146];
  const upperSize: [number, number, number] = [52, 62, 52];
  const podiumWidth = baseSize[0] * renderIntent.podiumWidthMultiplier;
  const podiumDepth = baseSize[2] * renderIntent.podiumDepthMultiplier;
  const primitives: CanonicalPrimitive[] = [
    { color: '#d9e4ea', emissive: crownColor, emissiveIntensity: renderIntent.podiumEmissiveIntensity, kind: 'box', metalness: 0.06, position: [0, baseSize[1] * 0.08, 0], roughness: 0.66, size: [podiumWidth, baseSize[1] * 0.16, podiumDepth] },
    { color: '#708596', emissive: crownColor, emissiveIntensity: 0.01, kind: 'box', metalness: 0.06, position: [0, baseSize[1] * 0.5, 0], roughness: 0.74, size: baseSize },
    { color: '#94a6b2', emissive: crownColor, emissiveIntensity: 0.012, kind: 'box', metalness: 0.06, position: [0, baseSize[1] + (upperSize[1] * 0.5) - 18, 0], roughness: 0.66, size: upperSize },
    { color: '#6f7b85', emissive: crownColor, emissiveIntensity: renderIntent.sideFinEmissive, kind: 'box', metalness: 0.06, position: [side * (baseSize[0] * 0.38), baseSize[1] * 0.58, 0], roughness: 0.66, size: [baseSize[0] * 0.16, renderIntent.sideFinHeight, baseSize[2] * 0.48] },
    { color: '#65717b', emissive: crownColor, emissiveIntensity: renderIntent.rearFinEmissive, kind: 'box', metalness: 0.06, position: [0, baseSize[1] * 0.58, -baseSize[2] * 0.28], roughness: 0.66, size: [baseSize[0] * 0.42, renderIntent.rearFinHeight, baseSize[2] * 0.18] },
    { color: '#5f6a73', emissive: crownColor, emissiveIntensity: renderIntent.insetEmissive, kind: 'box', metalness: 0.06, position: [-side * (baseSize[0] * 0.22), baseSize[1] * 0.32, 0], roughness: 0.66, size: [baseSize[0] * 0.38, baseSize[1] * 0.2, baseSize[2] * 0.4] },
    { color: crownColor, emissive: crownColor, emissiveIntensity: renderIntent.crownPlateEmissiveIntensity, kind: 'box', metalness: 0.16, position: [0, baseSize[1] + upperSize[1] - 8, 0], roughness: 0.34, size: [baseSize[0] * 0.62, 1.8, baseSize[2] * 0.62] },
    { color: '#7b8a95', emissive: crownColor, emissiveIntensity: renderIntent.midBandEmissiveIntensity, kind: 'box', metalness: 0.14, position: [0, baseSize[1] + (upperSize[1] * 0.48), 0], roughness: 0.44, size: [upperSize[0] * 1.08, renderIntent.midBandHeight, upperSize[2] * 0.34] },
    { color: '#778692', emissive: crownColor, emissiveIntensity: renderIntent.crownBandEmissiveIntensity, kind: 'box', metalness: 0.16, position: [0, baseSize[1] + upperSize[1] + 6, 0], roughness: 0.42, size: [upperSize[0] * 0.78, renderIntent.crownBandHeight, upperSize[2] * 0.78] },
    { color: '#8897a3', emissive: crownColor, emissiveIntensity: 0.03, kind: 'box', metalness: 0.16, position: [side * (upperSize[0] * 0.36), baseSize[1] + upperSize[1] + 3, 0], roughness: 0.42, size: [upperSize[0] * 0.14, renderIntent.crownBandHeight + 6, upperSize[2] * 0.26] },
    { color: '#7f8d98', emissive: crownColor, emissiveIntensity: 0.022, kind: 'box', metalness: 0.14, position: [-side * (upperSize[0] * 0.26), baseSize[1] + upperSize[1] - 2, -upperSize[2] * 0.12], roughness: 0.44, size: [upperSize[0] * 0.18, renderIntent.crownBandHeight + 4, upperSize[2] * 0.18] },
    { color: '#a2b3bf', emissive: crownColor, emissiveIntensity: 0.036, kind: 'box', metalness: 0.16, position: [0, baseSize[1] + upperSize[1] + 22, 0], roughness: 0.34, size: [upperSize[0] * 0.48, 24, upperSize[2] * 0.48] },
    { color: '#c0d2de', emissive: crownColor, emissiveIntensity: 0.05, kind: 'cylinder', metalness: 0.22, position: [0, baseSize[1] + upperSize[1] + 44, 0], radialSegments: 12, radiusBottom: upperSize[0] * 0.18, radiusTop: upperSize[0] * 0.12, roughness: 0.26, height: 18 },
  ];

  return {
    id: tower.id,
    position: tower.position,
    baseSize,
    upperSize,
    color: '#708596',
    composition: 'hero',
    crownColor,
    renderIntent: { ...renderIntent, primitives },
    role: 'hero',
    sections: ['middle'],
  };
}

function buildRearCampusAiReactorCoreMasses(campusCenterZ: number): CityMass[] {
  const center: [number, number, number] = [-2260, 0, campusCenterZ + 780];
  const accent = '#6fffe9';
  const deepAccent = '#1bc9bd';
  const pylons: CanonicalPrimitive[] = [
    [-430, -430],
    [430, -430],
    [-430, 430],
    [430, 430],
  ].flatMap(([x, z], index): CanonicalPrimitive[] => [
    {
      color: index % 2 === 0 ? '#253d49' : '#2d4652',
      emissive: accent,
      emissiveIntensity: 0.02,
      height: 1480,
      kind: 'cylinder',
      metalness: 0.22,
      position: [x, 780, z],
      radialSegments: 18,
      radiusBottom: 36,
      radiusTop: 22,
      roughness: 0.34,
    },
    {
      color: '#6fffe9',
      emissive: accent,
      emissiveIntensity: 0.085,
      kind: 'box',
      metalness: 0.24,
      physics: 'decorative',
      position: [x, 1548, z],
      roughness: 0.24,
      size: [154, 18, 44],
    },
  ]);
  const coolingTowers: CanonicalPrimitive[] = [-335, 335].flatMap((x, index): CanonicalPrimitive[] => [
    {
      color: index === 0 ? '#516672' : '#5b707b',
      emissive: accent,
      emissiveIntensity: 0.014,
      height: 900,
      kind: 'cylinder',
      metalness: 0.16,
      opacity: 0.96,
      position: [x, 470, 330],
      radialSegments: 32,
      radiusBottom: 150,
      radiusTop: 92,
      roughness: 0.5,
      transparent: true,
    },
    {
      color: '#c6f8f3',
      emissive: accent,
      emissiveIntensity: 0.048,
      height: 34,
      kind: 'cylinder',
      metalness: 0.18,
      opacity: 0.68,
      physics: 'decorative',
      position: [x, 936, 330],
      radialSegments: 32,
      radiusBottom: 104,
      radiusTop: 94,
      roughness: 0.26,
      transparent: true,
    },
  ]);

  return [
    {
      color: '#061d24',
      decorPolicy: 'none',
      id: 'ai-reactor-core-primitive-rig',
      planningSource: createRearCampusPlanningSource('buildRearCampusAiReactorCoreMasses', AI_REACTOR_CORE_SOURCE_KIND),
      position: center,
      renderIntent: {
        emissive: accent,
        emissiveIntensity: 0.032,
        primitives: [
          {
            color: '#142c38',
            emissive: accent,
            emissiveIntensity: 0.026,
            height: 112,
            kind: 'cylinder',
            metalness: 0.28,
            position: [0, 56, 0],
            radialSegments: 64,
            radiusBottom: 520,
            radiusTop: 454,
            roughness: 0.34,
          },
          {
            color: '#081d25',
            emissive: accent,
            emissiveIntensity: 0.04,
            height: 1120,
            kind: 'cylinder',
            metalness: 0.22,
            opacity: 0.44,
            physics: 'decorative',
            position: [0, 700, 0],
            radialSegments: 36,
            radiusBottom: 155,
            radiusTop: 82,
            roughness: 0.22,
            transparent: true,
          },
          {
            color: '#dffefb',
            emissive: accent,
            emissiveIntensity: 0.082,
            kind: 'sphere',
            metalness: 0.22,
            opacity: 0.64,
            physics: 'decorative',
            position: [0, 760, 0],
            radius: 118,
            roughness: 0.18,
            transparent: true,
            widthSegments: 32,
            heightSegments: 18,
          },
          ...[430, 850, 1260].map((y, index): CanonicalPrimitive => ({
            color: index === 1 ? '#fff2b8' : '#d7e2ea',
            emissive: index === 1 ? '#ffdf8a' : accent,
            emissiveIntensity: index === 1 ? 0.066 : 0.042,
            kind: 'torus',
            metalness: 0.26,
            opacity: index === 1 ? 0.66 : 0.52,
            physics: 'decorative',
            position: [0, y, 0],
            radialSegments: 16,
            radius: index === 2 ? 560 : 510,
            rotation: [Math.PI / 2, 0, index === 1 ? 0.18 : 0],
            roughness: 0.2,
            transparent: true,
            tube: index === 1 ? 18 : 12,
            tubularSegments: 144,
          })),
          {
            color: deepAccent,
            emissive: accent,
            emissiveIntensity: 0.058,
            kind: 'box',
            metalness: 0.24,
            opacity: 0.82,
            physics: 'decorative',
            position: [0, 310, 530],
            roughness: 0.24,
            size: [740, 22, 44],
            transparent: true,
          },
          ...coolingTowers,
          ...pylons,
        ],
        showCrownBeacon: false,
        showFrontWing: false,
        showHorizontalCap: false,
        showMegaVerticalSpines: false,
        showRearSpine: false,
        showSideFloorBands: false,
        showSideInset: false,
        showSignatureBand: false,
        skipBase: true,
      },
      planningZone: 'rear-campus',
      role: 'structural',
      sections: ['middle'],
      size: [1120, 1800, 1120],
    },
  ];
}

function buildRearCampusAiOracleChamberMasses(campusCenterZ: number): CityMass[] {
  const center: [number, number, number] = [2150, 0, campusCenterZ + 240];
  const accent = '#b7fff8';
  const violet = '#9da7ff';
  const pylons: CanonicalPrimitive[] = [
    [0, -410, 0],
    [356, 205, Math.PI * 0.66],
    [-356, 205, -Math.PI * 0.66],
  ].flatMap(([x, z, yaw], index): CanonicalPrimitive[] => [
    {
      color: index === 0 ? '#263e4b' : '#213846',
      emissive: accent,
      emissiveIntensity: 0.026,
      kind: 'box',
      metalness: 0.24,
      position: [x, 720, z],
      rotation: [0, yaw, 0],
      roughness: 0.34,
      size: [92, 1440, 110],
    },
    {
      color: '#ddfffb',
      emissive: accent,
      emissiveIntensity: 0.086,
      kind: 'box',
      metalness: 0.28,
      physics: 'decorative',
      position: [x, 1462, z],
      rotation: [0, yaw, 0],
      roughness: 0.22,
      size: [148, 18, 42],
    },
  ]);
  const portalPanels: CanonicalPrimitive[] = [
    [-260, -250, -0.44],
    [260, -250, 0.44],
    [-305, 150, 0.62],
    [305, 150, -0.62],
  ].map(([x, z, yaw], index): CanonicalPrimitive => ({
    color: index < 2 ? '#101b2e' : '#152337',
    emissive: index < 2 ? violet : accent,
    emissiveIntensity: index < 2 ? 0.052 : 0.044,
    kind: 'box',
    metalness: 0.26,
    opacity: 0.9,
    physics: 'decorative',
    position: [x, 640, z],
    rotation: [0, yaw, 0],
    roughness: 0.26,
    size: [44, 680, 270],
    transparent: true,
  }));

  return [
    {
      color: '#081923',
      decorPolicy: 'none',
      id: 'ai-oracle-chamber-primitive-rig',
      planningSource: createRearCampusPlanningSource('buildRearCampusAiOracleChamberMasses', AI_ORACLE_CHAMBER_SOURCE_KIND),
      position: center,
      renderIntent: {
        emissive: accent,
        emissiveIntensity: 0.032,
        primitives: [
          {
            color: '#102633',
            emissive: accent,
            emissiveIntensity: 0.026,
            height: 106,
            kind: 'cylinder',
            metalness: 0.28,
            position: [0, 53, 0],
            radialSegments: 64,
            radiusBottom: 510,
            radiusTop: 430,
            roughness: 0.34,
          },
          {
            color: '#effffd',
            emissive: accent,
            emissiveIntensity: 0.078,
            kind: 'torus',
            metalness: 0.24,
            opacity: 0.86,
            physics: 'decorative',
            position: [0, 220, 0],
            radialSegments: 14,
            radius: 480,
            rotation: [Math.PI / 2, 0, 0],
            roughness: 0.18,
            transparent: true,
            tube: 7,
            tubularSegments: 144,
          },
          {
            color: '#9ffcf3',
            emissive: accent,
            emissiveIntensity: 0.072,
            kind: 'torus',
            metalness: 0.2,
            opacity: 0.72,
            physics: 'decorative',
            position: [0, 1030, 0],
            radialSegments: 12,
            radius: 390,
            rotation: [Math.PI / 2, 0.1, 0.4],
            roughness: 0.2,
            transparent: true,
            tube: 8,
            tubularSegments: 136,
          },
          {
            color: '#d9fffb',
            emissive: accent,
            emissiveIntensity: 0.088,
            kind: 'torus',
            metalness: 0.24,
            opacity: 0.82,
            physics: 'decorative',
            position: [0, 1500, 0],
            radialSegments: 14,
            radius: 560,
            rotation: [0, Math.PI / 2, 0],
            roughness: 0.18,
            transparent: true,
            tube: 8,
            tubularSegments: 144,
          },
          {
            color: '#dffefb',
            emissive: accent,
            emissiveIntensity: 0.092,
            height: 1580,
            kind: 'cylinder',
            metalness: 0.16,
            opacity: 0.38,
            physics: 'decorative',
            position: [0, 930, 0],
            radialSegments: 28,
            radiusBottom: 88,
            radiusTop: 42,
            roughness: 0.18,
            transparent: true,
          },
          {
            color: '#dffefb',
            emissive: accent,
            emissiveIntensity: 0.13,
            kind: 'sphere',
            metalness: 0.16,
            opacity: 0.76,
            physics: 'decorative',
            position: [0, 900, 0],
            radius: 132,
            roughness: 0.2,
            transparent: true,
            widthSegments: 36,
            heightSegments: 20,
          },
          ...portalPanels,
          ...pylons,
        ],
        showCrownBeacon: false,
        showFrontWing: false,
        showHorizontalCap: false,
        showMegaVerticalSpines: false,
        showRearSpine: false,
        showSideFloorBands: false,
        showSideInset: false,
        showSignatureBand: false,
        skipBase: true,
      },
      planningZone: 'rear-campus',
      role: 'structural',
      sections: ['middle'],
      size: [1050, 1900, 1050],
    },
  ];
}

function buildRearCampusSkyCompassMasses(campusCenterZ: number): CityMass[] {
  const center: [number, number, number] = [1760, 0, campusCenterZ - 1276];
  const accent = '#8ee8ff';

  return [
    {
      color: '#0c1c2b',
      decorPolicy: 'none',
      id: 'center-sky-compass-primitive-rig',
      planningSource: createRearCampusPlanningSource('buildRearCampusSkyCompassMasses', CENTER_SKY_COMPASS_SOURCE_KIND),
      position: center,
      renderIntent: {
        emissive: accent,
        emissiveIntensity: 0.024,
        primitives: [
          {
            color: '#6d8190',
            emissive: accent,
            emissiveIntensity: 0.012,
            kind: 'box',
            metalness: 0.14,
            position: [0, 30, 0],
            roughness: 0.62,
            size: [1040, 60, 1040],
          },
          ...[
            [-360, 0, 96, 1550, 142],
            [360, 0, 96, 1550, 142],
            [0, -360, 142, 1550, 96],
            [0, 360, 142, 1550, 96],
          ].map(([x, z, sx, sy, sz], index): CanonicalPrimitive => ({
            color: index < 2 ? '#7f95a3' : '#748998',
            emissive: accent,
            emissiveIntensity: 0.014,
            kind: 'box',
            metalness: 0.16,
            position: [x, 775, z],
            roughness: 0.58,
            size: [sx, sy, sz],
          })),
          {
            color: '#9eb8c7',
            emissive: accent,
            emissiveIntensity: 0.034,
            height: 3600,
            kind: 'cylinder',
            metalness: 0.24,
            position: [0, 1900, 0],
            radialSegments: 24,
            radiusBottom: 76,
            radiusTop: 46,
            roughness: 0.3,
          },
          {
            color: '#c8e7f3',
            emissive: accent,
            emissiveIntensity: 0.044,
            height: 66,
            kind: 'cylinder',
            metalness: 0.24,
            opacity: 0.92,
            physics: 'decorative',
            position: [0, 3370, 0],
            radialSegments: 64,
            radiusBottom: 680,
            radiusTop: 620,
            roughness: 0.24,
            transparent: true,
          },
          {
            color: '#ffffff',
            emissive: accent,
            emissiveIntensity: 0.064,
            kind: 'torus',
            metalness: 0.28,
            opacity: 0.76,
            physics: 'decorative',
            position: [0, 3410, 0],
            radialSegments: 16,
            radius: 760,
            rotation: [Math.PI / 2, 0, 0],
            roughness: 0.2,
            transparent: true,
            tube: 12,
            tubularSegments: 160,
          },
          {
            color: '#dffbff',
            emissive: accent,
            emissiveIntensity: 0.068,
            height: 1800,
            kind: 'cylinder',
            metalness: 0.3,
            physics: 'decorative',
            position: [0, 4310, 0],
            radialSegments: 18,
            radiusBottom: 30,
            radiusTop: 8,
            roughness: 0.2,
          },
          {
            color: '#91e8ff',
            emissive: accent,
            emissiveIntensity: 0.036,
            kind: 'box',
            metalness: 0.2,
            physics: 'decorative',
            position: [0, 3390, 0],
            roughness: 0.34,
            size: [1340, 20, 30],
          },
          {
            color: '#91e8ff',
            emissive: accent,
            emissiveIntensity: 0.036,
            kind: 'box',
            metalness: 0.2,
            physics: 'decorative',
            position: [0, 3416, 0],
            roughness: 0.34,
            size: [30, 20, 1340],
          },
        ],
        showCrownBeacon: false,
        showFrontWing: false,
        showHorizontalCap: false,
        showMegaVerticalSpines: false,
        showRearSpine: false,
        showSideFloorBands: false,
        showSideInset: false,
        showSignatureBand: false,
        skipBase: true,
      },
      planningZone: 'rear-campus',
      role: 'structural',
      sections: ['middle'],
      size: [1600, 5200, 1600],
    },
  ];
}

function buildRearCampusEnergyGridNetworkMasses(campusCenterZ: number): CityMass[] {
  const origin: [number, number, number] = [0, 0, campusCenterZ - 220];
  const reactorHub: [number, number, number] = [-2260, 1420, campusCenterZ + 780];
  const oracleHub: [number, number, number] = [2150, 1440, campusCenterZ + 240];
  const skyCompassHub: [number, number, number] = [1760, 3400, campusCenterZ - 1276];
  const entryHub: [number, number, number] = [0, 1120, campusCenterZ + 670];
  const rearHub: [number, number, number] = [0, 1380, campusCenterZ - 1500];
  const leftCampusHub: [number, number, number] = [-1420, 1160, campusCenterZ + 1040];
  const rightCampusHub: [number, number, number] = [1420, 1160, campusCenterZ + 1040];
  const stadiumBackHub: [number, number, number] = [0, 1320, campusCenterZ - 1920];

  const beams = [
    buildEnergyGridBeam({ color: '#6fffe9', emissiveIntensity: 0.072, origin, start: reactorHub, end: entryHub, thickness: 14 }),
    buildEnergyGridBeam({ color: '#d9fffb', emissiveIntensity: 0.064, origin, start: reactorHub, end: rearHub, thickness: 12 }),
    buildEnergyGridBeam({ color: '#d8fffb', emissiveIntensity: 0.066, origin, start: rearHub, end: oracleHub, thickness: 12 }),
    buildEnergyGridBeam({ color: '#94fff5', emissiveIntensity: 0.058, origin, start: entryHub, end: leftCampusHub, thickness: 10 }),
    buildEnergyGridBeam({ color: '#94fff5', emissiveIntensity: 0.058, origin, start: entryHub, end: rightCampusHub, thickness: 10 }),
    buildEnergyGridBeam({ color: '#ffe08a', emissiveIntensity: 0.064, origin, start: rearHub, end: skyCompassHub, thickness: 12 }),
    buildEnergyGridBeam({ color: '#8ee8ff', emissiveIntensity: 0.056, origin, start: skyCompassHub, end: stadiumBackHub, thickness: 10 }),
  ];
  const nodes = [
    reactorHub,
    oracleHub,
    skyCompassHub,
    entryHub,
    rearHub,
    leftCampusHub,
    rightCampusHub,
    stadiumBackHub,
  ].flatMap((point) => buildEnergyGridNode({
    height: point === skyCompassHub ? 360 : 240,
    origin,
    point,
    radius: point === skyCompassHub ? 34 : point === rearHub ? 30 : 22,
  }));

  return [
    {
      color: '#061d24',
      decorPolicy: 'none',
      id: 'energy-grid-network-primitive-rig',
      planningSource: createRearCampusPlanningSource('buildRearCampusEnergyGridNetworkMasses', ENERGY_GRID_NETWORK_SOURCE_KIND),
      position: origin,
      renderIntent: {
        emissive: '#6fffe9',
        emissiveIntensity: 0.026,
        primitives: [
          ...beams,
          ...nodes,
        ],
        showCrownBeacon: false,
        showFrontWing: false,
        showHorizontalCap: false,
        showMegaVerticalSpines: false,
        showRearSpine: false,
        showSideFloorBands: false,
        showSideInset: false,
        showSignatureBand: false,
        skipBase: true,
      },
      planningZone: 'rear-campus',
      role: 'structural',
      sections: ['middle'],
      size: [1, 2200, 1],
    },
  ];
}

function buildRearCampusAiLandmarkMasses(campusCenterZ: number): CityMass[] {
  return [
    ...buildRearCampusAiReactorCoreMasses(campusCenterZ),
    ...buildRearCampusEnergyGridNetworkMasses(campusCenterZ),
    ...buildRearCampusAiOracleChamberMasses(campusCenterZ),
    ...buildRearCampusSkyCompassMasses(campusCenterZ),
  ];
}

function resolvePerimeterMassColor(accent: string) {
  switch (accent) {
    case 'cap':
      return '#98a4ad';
    case 'rail':
      return '#a7b3bc';
    case 'post':
      return '#8f9ca6';
    case 'gate':
      return '#aeb9c2';
    default:
      return '#81909a';
  }
}

export function buildRearCampusZonePlan(context: ExpoZonePlannerContext) {
  const rule = getZoneRule('rear-campus');
  const metrics = buildRearCampusMetrics(context.inputs.boothPlacements);
  const forecourts = buildVisibleRearCampusForecourts(metrics.campusCenterZ).map((plane) => ({
    color: plane.color,
    id: plane.id,
    position: plane.position,
    size: plane.size,
  }));
  const sidePavilions = buildVisibleRearCampusSidePavilions(metrics.campusCenterZ).map((pavilion) => ({
    accentSide: pavilion.accentSide,
    id: pavilion.id,
    position: pavilion.position,
    size: pavilion.size,
  }));
  const landmarkTowers = mapRearCampusLandmarkTowers(buildVisibleRearCampusLandmarkTowers(metrics.campusCenterZ));
  const perimeterConnectors = buildRearCampusPerimeterConnectors(metrics.campusCenterZ).map((connector) => ({
    accent: connector.accent,
    id: connector.id,
    position: connector.position,
    size: connector.size,
  }));
  const screenSurfaces = buildZoneScreenSurfacePlan({
    campusCenterZ: metrics.campusCenterZ,
    inputs: context.inputs,
    landmarkTowers,
    zoneId: 'rear-campus',
  }).slice(0, rule.densityCaps.screenSurfaceCap);
  const screenSockets = buildZoneScreenSocketPlan(screenSurfaces, rule.densityCaps.screenSocketCap, 'rear-campus');
  const assignments = buildZoneScreenAssignmentPlan({
    assignmentCap: rule.densityCaps.assignmentCap,
    boothPlacements: collectZoneBoothPlacements('rear-campus', context.inputs.boothPlacements),
    sockets: screenSockets,
    zoneId: 'rear-campus',
  });
  const aiLandmarkMasses = buildRearCampusAiLandmarkMasses(metrics.campusCenterZ);

  const zoneExtension: RearCampusZoneExtension = {
    campusCenterZ: metrics.campusCenterZ,
    feedSocketIds: {
      bowl: screenSockets.find((socket) => socket.id.includes('rear-campus-bowl-feed-surface'))?.id ?? null,
      leftTower: screenSockets.find((socket) => socket.id.includes('rear-campus-landmark-left'))?.id ?? null,
      rightTower: screenSockets.find((socket) => socket.id.includes('rear-campus-landmark-right'))?.id ?? null,
    },
    forecourts,
    landmarkTowers,
    perimeterConnectors,
    sidePavilions,
    stadiumBackWallZ: metrics.stadiumBackWallZ,
  };

  return createZonePlan({
    assignments,
    context,
    id: 'rear-campus',
    masses: [
      ...perimeterConnectors.map((connector) => ({
        color: resolvePerimeterMassColor(connector.accent),
        id: connector.id,
        position: connector.position,
        size: connector.size,
      })),
      ...aiLandmarkMasses,
    ],
    planes: forecourts.map((plane) => ({
      color: plane.color,
      id: plane.id,
      position: plane.position,
      role: 'decorative',
      size: plane.size,
    })),
    screenSockets,
    screenSurfaces,
    towers: landmarkTowers.map((tower) => buildRearCampusTower(tower, context.inputs.visualProfile.global.hudAccent)),
    zoneExtension: {
      rearCampus: zoneExtension,
    },
  });
}
