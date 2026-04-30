import {
  buildMediaWallSurfaces,
  buildTowerScreenSurfaces,
} from '../legacy/worldCityGeometry';
import type {
  CanonicalPrimitive,
  CityScreenSurface,
  CityTower,
  ExpoPlanningInputs,
  ExpoPlanningSectionId,
  ExpoPlanningZoneId,
  ExpoPlanningZonePlan,
  RearCampusLandmarkTower,
} from '../types';

function getZoneSections(zoneId: ExpoPlanningZoneId): ExpoPlanningSectionId[] {
  switch (zoneId) {
    case 'arrival':
      return ['arrival'];
    case 'left-district':
      return ['left'];
    case 'right-district':
      return ['right'];
    case 'rear-campus':
      return ['middle'];
    case 'tower-cluster':
    case 'center-spine':
    default:
      return ['middle'];
  }
}

function isMarqueeOrSpineHeroSurface(surface: CityScreenSurface) {
  return surface.role === 'hero-wall' && (
    surface.id.startsWith('screen-marquee-left-') ||
    surface.id.startsWith('screen-marquee-right-') ||
    surface.id.startsWith('screen-spine-')
  );
}

function buildSurfacePrimitives(surface: CityScreenSurface): CanonicalPrimitive[] {
  const profile = surface.renderIntent;
  const housingDepth = profile?.housingDepth ?? Math.max(8, surface.size[2] * 3.5);
  const housingWidth = surface.size[0];
  const housingHeight = surface.size[1];
  const innerWidth = housingWidth * 0.9;
  const innerHeight = housingHeight * 0.88;
  const finWidth = profile?.finWidth ?? Math.max(2.4, housingWidth * 0.032);
  const finDepth = profile?.finDepth ?? (housingDepth * 0.92);
  const railHeight = profile?.railHeight ?? Math.max(1.4, housingHeight * 0.028);
  const keelHeight = profile?.keelHeight ?? housingHeight * 0.16;
  const wingWidth = profile?.wingWidth ?? 0;
  const wingHeight = profile?.wingHeight ?? 0;

  const primitives: CanonicalPrimitive[] = [
    { color: surface.color, emissive: surface.glowColor, emissiveIntensity: surface.role === 'hero-wall' ? 0.08 : 0.05, kind: 'box', metalness: 0.38, position: [0, 0, 0], roughness: 0.42, size: [housingWidth, housingHeight, housingDepth] },
    { color: '#07101c', emissive: surface.glowColor, emissiveIntensity: surface.role === 'hero-wall' ? 0.06 : 0.04, kind: 'box', metalness: 0.18, position: [0, 0, housingDepth * 0.38], roughness: 0.22, size: [innerWidth, innerHeight, Math.max(1.8, housingDepth * 0.22)] },
    { color: surface.glowColor, kind: 'plane', opacity: profile?.glowOpacity ?? 0.18, position: [0, 0, housingDepth * 0.51], size: [innerWidth * 0.95, innerHeight * 0.95], transparent: true },
    { color: '#111c2d', emissive: surface.glowColor, emissiveIntensity: 0.12, kind: 'box', metalness: 0.34, position: [0, housingHeight * 0.52, housingDepth * 0.12], roughness: 0.38, size: [profile?.canopyWidth ?? housingWidth * 0.86, profile?.canopyHeight ?? housingHeight * 0.072, housingDepth * 0.56] },
    { color: '#142033', emissive: surface.glowColor, emissiveIntensity: 0.09, kind: 'box', metalness: 0.44, position: [-(housingWidth * 0.5) + (finWidth * 0.5), 0, 0], roughness: 0.36, size: [finWidth, housingHeight * 1.02, finDepth] },
    { color: '#142033', emissive: surface.glowColor, emissiveIntensity: 0.09, kind: 'box', metalness: 0.44, position: [(housingWidth * 0.5) - (finWidth * 0.5), 0, 0], roughness: 0.36, size: [finWidth, housingHeight * 1.02, finDepth] },
    { color: '#0f1927', emissive: surface.glowColor, emissiveIntensity: 0.06, kind: 'box', metalness: 0.26, position: [0, -(housingHeight * 0.5) - (railHeight * 0.8), 0], roughness: 0.42, size: [housingWidth * 0.82, railHeight, housingDepth * 0.5] },
    { color: surface.glowColor, kind: 'plane', opacity: (profile?.railOpacity ?? 0.72) * 0.24, position: [0, housingHeight * 0.42, housingDepth * 0.58], size: [housingWidth * 0.72, railHeight * 0.82], transparent: true },
    { color: surface.glowColor, kind: 'plane', opacity: (profile?.railOpacity ?? 0.72) * 0.18, position: [0, -(housingHeight * 0.42), housingDepth * 0.58], size: [housingWidth * 0.58, railHeight * 0.68], transparent: true },
    { color: '#121f32', emissive: surface.glowColor, emissiveIntensity: 0.08, kind: 'box', metalness: 0.4, position: [0, -(housingHeight * 0.5) - (keelHeight * 0.5), -(housingDepth * 0.16)], roughness: 0.34, size: [profile?.keelWidth ?? housingWidth * 0.1, keelHeight, housingDepth * 0.44] },
    { color: '#f8fafc', kind: 'plane', opacity: surface.role === 'hero-wall' ? 0.042 : 0.024, position: [0, 0, housingDepth * 0.6], size: [innerWidth * 0.88, innerHeight * 0.88], transparent: true },
    { color: surface.color, kind: 'plane', opacity: (profile?.innerOpacity ?? 0.88) * 0.08, position: [0, 0, housingDepth * 0.46], size: [innerWidth * 0.9, innerHeight * 0.9], transparent: true },
  ];

  if (wingWidth > 0) {
    primitives.push(
      { color: '#13233a', emissive: surface.glowColor, emissiveIntensity: 0.12, kind: 'box', metalness: 0.42, position: [-(housingWidth * 0.58), 0, -(housingDepth * 0.04)], rotation: [0, 0.16, 0], roughness: 0.34, size: [wingWidth, wingHeight, housingDepth * 0.42] },
      { color: '#13233a', emissive: surface.glowColor, emissiveIntensity: 0.12, kind: 'box', metalness: 0.42, position: [(housingWidth * 0.58), 0, -(housingDepth * 0.04)], rotation: [0, -0.16, 0], roughness: 0.34, size: [wingWidth, wingHeight, housingDepth * 0.42] },
    );
  }

  if (isMarqueeOrSpineHeroSurface(surface)) {
    primitives.push(
      { color: '#0d1624', emissive: surface.glowColor, emissiveIntensity: 0.14, kind: 'box', metalness: 0.34, position: [0, 0, -(housingDepth * 0.24)], roughness: 0.38, size: [housingWidth * 0.22, housingHeight * 1.1, housingDepth * 0.52] },
      { color: surface.glowColor, kind: 'plane', opacity: 0.12, position: [0, housingHeight * 0.2, housingDepth * 0.62], size: [innerWidth * 0.72, housingHeight * 0.18], transparent: true },
      { color: surface.glowColor, kind: 'plane', opacity: 0.1, position: [0, -(housingHeight * 0.24), housingDepth * 0.62], size: [innerWidth * 0.56, housingHeight * 0.12], transparent: true },
      { color: '#132238', emissive: surface.glowColor, emissiveIntensity: 0.12, kind: 'box', metalness: 0.44, position: [-(housingWidth * 0.66), 0, housingDepth * 0.04], rotation: [0, 0.22, 0], roughness: 0.3, size: [housingWidth * 0.08, housingHeight * 0.88, housingDepth * 0.36] },
      { color: '#132238', emissive: surface.glowColor, emissiveIntensity: 0.12, kind: 'box', metalness: 0.44, position: [(housingWidth * 0.66), 0, housingDepth * 0.04], rotation: [0, -0.22, 0], roughness: 0.3, size: [housingWidth * 0.08, housingHeight * 0.88, housingDepth * 0.36] },
    );
  }

  return primitives;
}

function enrichSurfaceIntent(zoneId: ExpoPlanningZoneId, surface: CityScreenSurface): CityScreenSurface {
  const isHeroCompositionZone = zoneId === 'left-district' || zoneId === 'center-spine' || zoneId === 'right-district';
  const isCenterSpineHero = zoneId === 'center-spine' && surface.role === 'hero-wall';
  const renderIntent = surface.renderIntent ?? (
    surface.role === 'hero-wall'
      ? {
          canopyHeight: surface.size[1] * (isCenterSpineHero ? 0.112 : isHeroCompositionZone ? 0.098 : 0.086),
          canopyWidth: surface.size[0] * (isCenterSpineHero ? 1.06 : isHeroCompositionZone ? 0.98 : 0.94),
          finDepth: Math.max(isCenterSpineHero ? 14 : isHeroCompositionZone ? 12 : 10, surface.size[2] * (isCenterSpineHero ? 5.4 : isHeroCompositionZone ? 4.8 : 4.2)) * 0.92,
          finWidth: Math.max(isCenterSpineHero ? 3.8 : isHeroCompositionZone ? 3.2 : 2.4, surface.size[0] * (isCenterSpineHero ? 0.048 : isHeroCompositionZone ? 0.04 : 0.032)),
          glowOpacity: isCenterSpineHero ? 0.44 : isHeroCompositionZone ? 0.36 : 0.28,
          housingDepth: Math.max(isCenterSpineHero ? 14 : isHeroCompositionZone ? 12 : 10, surface.size[2] * (isCenterSpineHero ? 5.4 : isHeroCompositionZone ? 4.8 : 4.2)),
          innerOpacity: isCenterSpineHero ? 1 : isHeroCompositionZone ? 0.98 : 0.94,
          keelHeight: surface.size[1] * (isCenterSpineHero ? 0.22 : isHeroCompositionZone ? 0.18 : 0.16),
          keelWidth: surface.size[0] * (isCenterSpineHero ? 0.2 : isHeroCompositionZone ? 0.16 : 0.12),
          maxDistance: 1700,
          railHeight: Math.max(isCenterSpineHero ? 2.4 : isHeroCompositionZone ? 2 : 1.4, surface.size[1] * (isCenterSpineHero ? 0.044 : isHeroCompositionZone ? 0.036 : 0.028)),
          railOpacity: isCenterSpineHero ? 1.08 : isHeroCompositionZone ? 1 : 0.92,
          visible: true,
          wingHeight: surface.size[1] * (isCenterSpineHero ? 0.94 : isHeroCompositionZone ? 0.84 : 0.76),
          wingWidth: surface.size[0] * (isCenterSpineHero ? 0.32 : isHeroCompositionZone ? 0.24 : 0.18),
        }
      : surface.role === 'support-wall'
        ? {
            canopyHeight: surface.size[1] * 0.072,
            canopyWidth: surface.size[0] * 0.86,
            finDepth: Math.max(8, surface.size[2] * 3.5) * 0.92,
            finWidth: Math.max(2.4, surface.size[0] * 0.032),
            glowOpacity: 0.2,
            housingDepth: Math.max(8, surface.size[2] * 3.5),
            innerOpacity: 0.88,
            keelHeight: surface.size[1] * 0.16,
            keelWidth: surface.size[0] * 0.1,
            maxDistance: zoneId === 'rear-campus' ? 1560 : 1240,
            railHeight: Math.max(1.4, surface.size[1] * 0.028),
            railOpacity: 0.74,
            visible: true,
            wingHeight: surface.size[1] * 0.68,
            wingWidth: surface.size[0] * 0.14,
          }
        : surface.role === 'tower-crown'
          ? {
              canopyHeight: surface.size[1] * 0.12,
              canopyWidth: surface.size[0] * 0.68,
              finDepth: Math.max(7, surface.size[2] * 3.2) * 0.92,
              finWidth: Math.max(2.4, surface.size[0] * 0.032),
              glowOpacity: 0.24,
              housingDepth: Math.max(7, surface.size[2] * 3.2),
              innerOpacity: 0.9,
              keelHeight: surface.size[1] * 0.16,
              keelWidth: surface.size[0] * 0.18,
              maxDistance: 1560,
              railHeight: Math.max(1.4, surface.size[1] * 0.028),
              railOpacity: 0.82,
              visible: true,
              wingHeight: 0,
              wingWidth: 0,
            }
          : {
              canopyHeight: surface.size[1] * 0.094,
              canopyWidth: surface.size[0] * 0.56,
              finDepth: Math.max(6, surface.size[2] * 3) * 0.92,
              finWidth: Math.max(2.4, surface.size[0] * 0.032),
              glowOpacity: 0.18,
              housingDepth: Math.max(6, surface.size[2] * 3),
              innerOpacity: 0.9,
              keelHeight: surface.size[1] * 0.22,
              keelWidth: surface.size[0] * 0.18,
              maxDistance: 1420,
              railHeight: Math.max(1.4, surface.size[1] * 0.028),
              railOpacity: 0.72,
              visible: true,
              wingHeight: 0,
              wingWidth: 0,
            }
  );

  return {
    ...surface,
    renderIntent: {
      ...renderIntent,
      primitives: buildSurfacePrimitives({ ...surface, renderIntent }),
    },
    sections: surface.sections ?? getZoneSections(zoneId),
  };
}

function buildMediaWallSurfacePool(inputs: ExpoPlanningInputs) {
  return buildMediaWallSurfaces(inputs.districtPrograms.length, inputs.districtStride);
}

function buildRearCampusScreenSurfaces(
  landmarkTowers: RearCampusLandmarkTower[],
  campusCenterZ: number
): CityScreenSurface[] {
  const leftTower = landmarkTowers.find((tower) => tower.id.includes('left')) ?? null;
  const rightTower = landmarkTowers.find((tower) => tower.id.includes('right')) ?? null;

  const bowlSurface: CityScreenSurface = {
    id: 'rear-campus-bowl-feed-surface',
    position: [0, 318, campusCenterZ - 1274],
    rotation: [0, Math.PI, 0],
    size: [1110, 214, 4.4],
    color: '#08111c',
    glowColor: '#7dd3fc',
    role: 'hero-wall',
    type: 'wall',
  };

  const towerSurfaces = [leftTower, rightTower]
    .filter((tower): tower is RearCampusLandmarkTower => tower !== null)
    .map((tower): CityScreenSurface => ({
      id: `${tower.id}-rear-campus-feed-surface`,
      position: [tower.position[0], 398, tower.position[2] + 30],
      rotation: [0, Math.PI, 0],
      size: [210, 124, 3.6],
      color: '#091320',
      glowColor: '#93c5fd',
      role: 'support-wall',
      type: 'wall',
    }));

  const campusFrontSupportSurfaces: CityScreenSurface[] = [
    {
      id: 'rear-campus-event-pavilion-left-feed-surface',
      position: [-720, 118, campusCenterZ + 1168],
      rotation: [0, Math.PI, 0],
      size: [248, 128, 3.4],
      color: '#091320',
      glowColor: '#7dd3fc',
      role: 'support-wall',
      type: 'wall',
    },
    {
      id: 'rear-campus-event-pavilion-right-feed-surface',
      position: [720, 118, campusCenterZ + 1168],
      rotation: [0, Math.PI, 0],
      size: [248, 128, 3.4],
      color: '#091320',
      glowColor: '#7dd3fc',
      role: 'support-wall',
      type: 'wall',
    },
    {
      id: 'rear-campus-axis-gallery-left-feed-surface',
      position: [-412, 92, campusCenterZ + 1032],
      rotation: [0, Math.PI, 0],
      size: [176, 92, 3.2],
      color: '#0a1420',
      glowColor: '#93c5fd',
      role: 'support-wall',
      type: 'wall',
    },
    {
      id: 'rear-campus-axis-gallery-right-feed-surface',
      position: [412, 92, campusCenterZ + 1032],
      rotation: [0, Math.PI, 0],
      size: [176, 92, 3.2],
      color: '#0a1420',
      glowColor: '#93c5fd',
      role: 'support-wall',
      type: 'wall',
    },
    {
      id: 'rear-campus-axis-terminal-left-feed-surface',
      position: [-276, 74, campusCenterZ + 1500],
      rotation: [0, Math.PI, 0],
      size: [112, 68, 2.8],
      color: '#0c1724',
      glowColor: '#bfdbfe',
      role: 'support-wall',
      type: 'wall',
    },
    {
      id: 'rear-campus-axis-terminal-right-feed-surface',
      position: [276, 74, campusCenterZ + 1492],
      rotation: [0, Math.PI, 0],
      size: [112, 68, 2.8],
      color: '#0c1724',
      glowColor: '#bfdbfe',
      role: 'support-wall',
      type: 'wall',
    },
    {
      id: 'rear-campus-side-pavilion-left-front-feed-surface',
      position: [-1420, 126, campusCenterZ + 996],
      rotation: [0, Math.PI, 0],
      size: [196, 116, 3.4],
      color: '#091320',
      glowColor: '#67e8f9',
      role: 'support-wall',
      type: 'wall',
    },
    {
      id: 'rear-campus-side-pavilion-right-front-feed-surface',
      position: [1420, 126, campusCenterZ + 996],
      rotation: [0, Math.PI, 0],
      size: [196, 116, 3.4],
      color: '#091320',
      glowColor: '#67e8f9',
      role: 'support-wall',
      type: 'wall',
    },
    {
      id: 'rear-campus-side-pavilion-left-rear-feed-surface',
      position: [-1220, 148, campusCenterZ - 1152],
      rotation: [0, Math.PI, 0],
      size: [244, 132, 3.6],
      color: '#091320',
      glowColor: '#7dd3fc',
      role: 'support-wall',
      type: 'wall',
    },
    {
      id: 'rear-campus-side-pavilion-right-rear-feed-surface',
      position: [1220, 148, campusCenterZ - 1152],
      rotation: [0, Math.PI, 0],
      size: [244, 132, 3.6],
      color: '#091320',
      glowColor: '#7dd3fc',
      role: 'support-wall',
      type: 'wall',
    },
    {
      id: 'rear-campus-axis-front-left-feed-surface',
      position: [-182, 64, campusCenterZ + 1222],
      rotation: [0, Math.PI, 0],
      size: [96, 58, 2.6],
      color: '#0c1724',
      glowColor: '#bfdbfe',
      role: 'support-wall',
      type: 'wall',
    },
    {
      id: 'rear-campus-axis-front-right-feed-surface',
      position: [182, 64, campusCenterZ + 1214],
      rotation: [0, Math.PI, 0],
      size: [96, 58, 2.6],
      color: '#0c1724',
      glowColor: '#bfdbfe',
      role: 'support-wall',
      type: 'wall',
    },
    {
      id: 'rear-campus-axis-kiosk-left-feed-surface',
      position: [-318, 68, campusCenterZ + 1348],
      rotation: [0, Math.PI, 0],
      size: [102, 60, 2.8],
      color: '#0c1724',
      glowColor: '#a5f3fc',
      role: 'support-wall',
      type: 'wall',
    },
    {
      id: 'rear-campus-axis-kiosk-right-feed-surface',
      position: [318, 68, campusCenterZ + 1348],
      rotation: [0, Math.PI, 0],
      size: [102, 60, 2.8],
      color: '#0c1724',
      glowColor: '#a5f3fc',
      role: 'support-wall',
      type: 'wall',
    },
  ];

  return [bowlSurface, ...towerSurfaces, ...campusFrontSupportSurfaces];
}

export function buildZoneScreenSurfacePlan(args: {
  campusCenterZ?: number;
  inputs: ExpoPlanningInputs;
  landmarkTowers?: RearCampusLandmarkTower[];
  towers?: CityTower[];
  zoneId: ExpoPlanningZoneId;
}) {
  const { campusCenterZ, inputs, landmarkTowers = [], towers = [], zoneId } = args;
  const mediaWallSurfaces = buildMediaWallSurfacePool(inputs);

  switch (zoneId) {
    case 'arrival':
      return [] as CityScreenSurface[];
    case 'left-district':
      return mediaWallSurfaces.filter((surface) =>
        surface.id.startsWith('screen-marquee-left-') || surface.id.startsWith('screen-array-left-')
      ).map((surface) => enrichSurfaceIntent(zoneId, surface));
    case 'center-spine':
      return mediaWallSurfaces.filter((surface) => surface.id.startsWith('screen-spine-')).map((surface) => enrichSurfaceIntent(zoneId, surface));
    case 'right-district':
      return mediaWallSurfaces.filter((surface) =>
        surface.id.startsWith('screen-marquee-right-') || surface.id.startsWith('screen-array-right-')
      ).map((surface) => enrichSurfaceIntent(zoneId, surface));
    case 'tower-cluster':
      return buildTowerScreenSurfaces(towers).map((surface) => enrichSurfaceIntent(zoneId, surface));
    case 'rear-campus':
      return buildRearCampusScreenSurfaces(landmarkTowers, campusCenterZ ?? 0).map((surface) => enrichSurfaceIntent(zoneId, surface));
    default:
      return [];
  }
}

export function flattenZoneScreenSurfaces(
  zones: ExpoPlanningZonePlan[],
  options?: { includeRearCampus?: boolean }
) {
  const includeRearCampus = options?.includeRearCampus ?? false;
  return zones.flatMap((zone) => (
    includeRearCampus || zone.id !== 'rear-campus'
      ? zone.screenSurfaces
      : []
  ));
}
