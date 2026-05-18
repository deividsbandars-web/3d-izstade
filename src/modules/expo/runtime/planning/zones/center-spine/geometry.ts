import type { CityGeometryPlanningSource, CityMass, CityPlane, ExpoZonePlannerContext } from '../../types';

const CENTER_SPINE_GEOMETRY_SOURCE_FILE = 'src/modules/expo/runtime/planning/zones/center-spine/geometry.ts';
const CENTER_SKY_COMPASS_SOURCE_KIND = 'center-sky-compass-render-rig';

function createCenterSpinePlanningSource(
  sourceFunction: string,
  sourceKind: string,
): CityGeometryPlanningSource {
  return {
    safeEditSeam: CENTER_SPINE_GEOMETRY_SOURCE_FILE,
    sourceFile: CENTER_SPINE_GEOMETRY_SOURCE_FILE,
    sourceFunction,
    sourceKind,
  };
}

function isCenterSpinePlane(plane: CityPlane) {
  return Math.abs(plane.position[0]) <= 260 && plane.position[2] > -2200;
}

function isCenterSpineMass(mass: CityMass) {
  return Math.abs(mass.position[0]) <= 260 && mass.position[2] > -2200;
}

function buildCenterSkyCompassMasses(): CityMass[] {
  const center: [number, number, number] = [0, 0, -1540];
  const accent = '#8ee8ff';

  return [
    {
      color: '#0c1c2b',
      decorPolicy: 'none',
      id: 'center-sky-compass-primitive-rig',
      planningSource: createCenterSpinePlanningSource('buildCenterSkyCompassMasses', CENTER_SKY_COMPASS_SOURCE_KIND),
      position: center,
      renderIntent: {
        emissive: accent,
        emissiveIntensity: 0.02,
        primitives: [
          {
            color: '#6d8190',
            emissive: accent,
            emissiveIntensity: 0.01,
            kind: 'box',
            metalness: 0.14,
            physics: 'decorative',
            position: [0, 26, 0],
            roughness: 0.62,
            size: [620, 52, 620],
          },
          {
            color: '#7f95a3',
            emissive: accent,
            emissiveIntensity: 0.012,
            kind: 'box',
            metalness: 0.16,
            physics: 'decorative',
            position: [-230, 640, 0],
            roughness: 0.58,
            size: [72, 1280, 112],
          },
          {
            color: '#7f95a3',
            emissive: accent,
            emissiveIntensity: 0.012,
            kind: 'box',
            metalness: 0.16,
            physics: 'decorative',
            position: [230, 640, 0],
            roughness: 0.58,
            size: [72, 1280, 112],
          },
          {
            color: '#748998',
            emissive: accent,
            emissiveIntensity: 0.012,
            kind: 'box',
            metalness: 0.16,
            physics: 'decorative',
            position: [0, 640, -230],
            roughness: 0.58,
            size: [112, 1280, 72],
          },
          {
            color: '#748998',
            emissive: accent,
            emissiveIntensity: 0.012,
            kind: 'box',
            metalness: 0.16,
            physics: 'decorative',
            position: [0, 640, 230],
            roughness: 0.58,
            size: [112, 1280, 72],
          },
          {
            color: '#9eb8c7',
            emissive: accent,
            emissiveIntensity: 0.03,
            height: 3200,
            kind: 'cylinder',
            metalness: 0.24,
            physics: 'decorative',
            position: [0, 1720, 0],
            radialSegments: 24,
            radiusBottom: 68,
            radiusTop: 42,
            roughness: 0.3,
          },
          {
            color: '#c8e7f3',
            emissive: accent,
            emissiveIntensity: 0.035,
            height: 58,
            kind: 'cylinder',
            metalness: 0.24,
            opacity: 0.92,
            physics: 'decorative',
            position: [0, 3050, 0],
            radialSegments: 64,
            radiusBottom: 440,
            radiusTop: 390,
            roughness: 0.24,
            transparent: true,
          },
          {
            color: '#dffbff',
            emissive: accent,
            emissiveIntensity: 0.06,
            height: 1700,
            kind: 'cylinder',
            metalness: 0.3,
            physics: 'decorative',
            position: [0, 3925, 0],
            radialSegments: 18,
            radiusBottom: 28,
            radiusTop: 7,
            roughness: 0.2,
          },
          {
            color: '#ffffff',
            emissive: accent,
            emissiveIntensity: 0.05,
            height: 34,
            kind: 'cylinder',
            metalness: 0.28,
            opacity: 0.86,
            physics: 'decorative',
            position: [0, 4780, 0],
            radialSegments: 48,
            radiusBottom: 170,
            radiusTop: 130,
            roughness: 0.22,
            transparent: true,
          },
          {
            color: '#91e8ff',
            emissive: accent,
            emissiveIntensity: 0.03,
            kind: 'box',
            metalness: 0.2,
            physics: 'decorative',
            position: [0, 3068, 0],
            roughness: 0.34,
            size: [980, 18, 24],
          },
          {
            color: '#91e8ff',
            emissive: accent,
            emissiveIntensity: 0.03,
            kind: 'box',
            metalness: 0.2,
            physics: 'decorative',
            position: [0, 3088, 0],
            roughness: 0.34,
            size: [24, 18, 980],
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
      role: 'structural',
      sections: ['middle'],
      size: [1, 1, 1],
    },
  ];
}

export function buildCenterSpineZoneGeometry(context: ExpoZonePlannerContext) {
  const planes = [
    ...context.geometry.promenadeAxisPlanes.filter(isCenterSpinePlane),
    ...context.geometry.showcasePlazas.filter(isCenterSpinePlane),
    ...context.geometry.boothForecourtPlanes.filter(isCenterSpinePlane),
  ];

  const masses = [
    ...context.geometry.showcaseMasses.filter(isCenterSpineMass),
    ...context.geometry.discoveryLandmarkMasses.filter(isCenterSpineMass),
    ...context.geometry.discoverySupportMasses.filter(isCenterSpineMass),
    ...context.geometry.observatoryMasses.filter(isCenterSpineMass),
    ...context.geometry.signatureMasses.filter(isCenterSpineMass),
    ...context.geometry.skybridgeMasses.filter(isCenterSpineMass),
    ...buildCenterSkyCompassMasses(),
  ];

  return {
    masses,
    planes,
    towers: [],
  };
}
