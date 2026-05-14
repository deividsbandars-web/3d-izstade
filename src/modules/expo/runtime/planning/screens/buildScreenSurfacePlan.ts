import { buildTowerScreenSurfaces } from '../legacy/worldCityGeometry';
import { buildVisibleRearCampusSidePavilions, resolveRearCampusAnchoredZ } from '../../world/ExpoRearCampusLayout';
import { buildCityScreenSurfacePool } from './buildCityScreenSurfacePool';
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

function getSurfaceFamily(zoneId: ExpoPlanningZoneId, surface: CityScreenSurface) {
  if (surface.id.startsWith('rear-campus-')) {
    return 'rear-campus';
  }

  if (surface.role === 'tower-crown' || surface.role === 'tower-side') {
    return 'tower';
  }

  if (zoneId === 'center-spine' || surface.id.startsWith('screen-spine-')) {
    return 'center-spine';
  }

  if (surface.id.startsWith('screen-marquee-')) {
    return 'marquee-hero';
  }

  if (surface.id.startsWith('screen-array-')) {
    return 'district-array';
  }

  return 'default';
}

type ScreenSurfaceFamily = ReturnType<typeof getSurfaceFamily>;

function buildMountedHostAttachmentPrimitives(
  family: ScreenSurfaceFamily,
  surface: CityScreenSurface,
  housingWidth: number,
  housingHeight: number,
  housingDepth: number
): CanonicalPrimitive[] {
  const isMountedHostFamily =
    family === 'rear-campus'
    || family === 'marquee-hero'
    || family === 'district-array';

  if (!isMountedHostFamily) {
    return [];
  }

  const isDistrictArray = family === 'district-array';
  const isRearCampus = family === 'rear-campus';
  const isHeroWall = surface.role === 'hero-wall';
  const plateWidthScale = isDistrictArray ? 1.22 : isRearCampus ? 1.12 : 1.16;
  const plateHeightScale = isDistrictArray ? 1.2 : isHeroWall ? 1.14 : 1.1;
  const clampHeightScale = isDistrictArray ? 1.04 : isHeroWall ? 0.98 : 0.9;
  const plateDepth = Math.max(2.4, housingDepth * (isDistrictArray ? 0.5 : 0.38));
  const receiverDepth = Math.max(1.8, housingDepth * (isDistrictArray ? 0.28 : 0.2));
  const clampDepth = Math.max(2.4, housingDepth * (isDistrictArray ? 0.68 : 0.54));
  const clampWidth = Math.max(isDistrictArray ? 3.2 : 3.8, housingWidth * (isDistrictArray ? 0.052 : 0.042));
  const sillHeight = Math.max(2.8, housingHeight * (isDistrictArray ? 0.074 : 0.052));
  const keeperHeight = Math.max(2.4, housingHeight * (isDistrictArray ? 0.056 : 0.04));
  const rearZ = -(housingDepth * 0.54);
  const receiverZ = -(housingDepth * 0.72);
  const clampZ = -(housingDepth * 0.28);
  const clampX = housingWidth * 0.56;
  const attachmentColor = isRearCampus ? '#5e7480' : '#526878';
  const receiverColor = isRearCampus ? '#8298a2' : '#718794';
  const clampColor = isRearCampus ? '#2f4858' : '#25394a';

  const primitives: CanonicalPrimitive[] = [
    {
      color: attachmentColor,
      emissive: surface.glowColor,
      emissiveIntensity: isHeroWall ? 0.035 : 0.022,
      kind: 'box',
      metalness: 0.36,
      position: [0, 0, rearZ],
      roughness: 0.5,
      size: [housingWidth * plateWidthScale, housingHeight * plateHeightScale, plateDepth],
    },
    {
      color: receiverColor,
      emissive: surface.glowColor,
      emissiveIntensity: isHeroWall ? 0.028 : 0.016,
      kind: 'box',
      metalness: 0.28,
      position: [0, 0, receiverZ],
      roughness: 0.56,
      size: [housingWidth * (isDistrictArray ? 0.92 : 0.78), housingHeight * (isDistrictArray ? 0.82 : 0.7), receiverDepth],
    },
    {
      color: clampColor,
      emissive: surface.glowColor,
      emissiveIntensity: isHeroWall ? 0.05 : 0.035,
      kind: 'box',
      metalness: 0.42,
      position: [-clampX, 0, clampZ],
      roughness: 0.34,
      size: [clampWidth, housingHeight * clampHeightScale, clampDepth],
    },
    {
      color: clampColor,
      emissive: surface.glowColor,
      emissiveIntensity: isHeroWall ? 0.05 : 0.035,
      kind: 'box',
      metalness: 0.42,
      position: [clampX, 0, clampZ],
      roughness: 0.34,
      size: [clampWidth, housingHeight * clampHeightScale, clampDepth],
    },
    {
      color: '#405a6a',
      emissive: surface.glowColor,
      emissiveIntensity: isHeroWall ? 0.045 : 0.03,
      kind: 'box',
      metalness: 0.4,
      position: [0, -(housingHeight * 0.56), -(housingDepth * 0.24)],
      roughness: 0.36,
      size: [housingWidth * (isDistrictArray ? 0.98 : 0.86), sillHeight, clampDepth],
    },
    {
      color: '#364e5f',
      emissive: surface.glowColor,
      emissiveIntensity: isHeroWall ? 0.04 : 0.026,
      kind: 'box',
      metalness: 0.38,
      position: [0, housingHeight * 0.56, -(housingDepth * 0.24)],
      roughness: 0.38,
      size: [housingWidth * (isDistrictArray ? 0.78 : 0.64), keeperHeight, Math.max(1.6, housingDepth * 0.46)],
    },
  ];

  if (isDistrictArray || family === 'marquee-hero') {
    const standoffWidth = Math.max(isDistrictArray ? 2.8 : 3.2, housingWidth * 0.035);
    const standoffDepth = Math.max(2.2, housingDepth * 0.42);
    primitives.push(
      {
        color: '#1f3344',
        emissive: surface.glowColor,
        emissiveIntensity: 0.038,
        kind: 'box',
        metalness: 0.44,
        position: [-(housingWidth * 0.28), 0, -(housingDepth * 0.62)],
        roughness: 0.34,
        size: [standoffWidth, housingHeight * 0.76, standoffDepth],
      },
      {
        color: '#1f3344',
        emissive: surface.glowColor,
        emissiveIntensity: 0.038,
        kind: 'box',
        metalness: 0.44,
        position: [housingWidth * 0.28, 0, -(housingDepth * 0.62)],
        roughness: 0.34,
        size: [standoffWidth, housingHeight * 0.76, standoffDepth],
      },
    );
  }

  return primitives;
}

function shouldUseCleanScreenHostArchitecture() {
  return true;
}

function buildCleanScreenHostPrimitives(
  family: ScreenSurfaceFamily,
  surface: CityScreenSurface,
  housingWidth: number,
  housingHeight: number,
  housingDepth: number
): CanonicalPrimitive[] {
  const isRearCampus = family === 'rear-campus';
  const isTower = family === 'tower';
  const isHeroWall = surface.role === 'hero-wall';
  const shellDepth = Math.max(isTower ? 2.6 : isRearCampus ? 3.2 : 3, housingDepth * (isRearCampus ? 0.64 : 0.72));
  const faceDepth = Math.max(0.72, housingDepth * 0.1);
  const railDepth = Math.max(1, housingDepth * 0.18);
  const railWidth = Math.max(isHeroWall ? 2.4 : 1.6, housingWidth * (isTower ? 0.018 : 0.024));
  const railHeight = Math.max(isHeroWall ? 2.4 : 1.4, housingHeight * (isTower ? 0.02 : 0.026));
  const receiverDepth = Math.max(1.2, housingDepth * 0.16);
  const shellColor = isRearCampus ? '#263947' : isTower ? '#203241' : '#223545';
  const innerColor = isRearCampus ? '#071421' : '#08111c';
  const railColor = isRearCampus ? '#91a4ad' : '#d5e4ec';
  const rearReceiverColor = isRearCampus ? '#627783' : '#4f6573';

  return [
    {
      color: rearReceiverColor,
      emissive: surface.glowColor,
      emissiveIntensity: isHeroWall ? 0.022 : 0.014,
      kind: 'box',
      metalness: 0.22,
      position: [0, 0, -(housingDepth * 0.42)],
      roughness: 0.62,
      size: [housingWidth * (isRearCampus ? 0.9 : 0.78), housingHeight * (isRearCampus ? 0.78 : 0.66), receiverDepth],
    },
    {
      color: shellColor,
      emissive: surface.glowColor,
      emissiveIntensity: isHeroWall ? 0.032 : 0.02,
      kind: 'box',
      metalness: 0.26,
      position: [0, 0, 0],
      roughness: 0.56,
      size: [housingWidth, housingHeight, shellDepth],
    },
    {
      color: innerColor,
      emissive: surface.glowColor,
      emissiveIntensity: isHeroWall ? 0.04 : 0.025,
      kind: 'box',
      metalness: 0.1,
      position: [0, 0, housingDepth * 0.3],
      roughness: 0.26,
      size: [housingWidth * 0.985, housingHeight * 0.982, faceDepth],
    },
    {
      color: railColor,
      emissive: surface.glowColor,
      emissiveIntensity: isHeroWall ? 0.07 : 0.045,
      kind: 'box',
      metalness: 0.18,
      position: [0, housingHeight * 0.5 + railHeight * 0.45, housingDepth * 0.08],
      roughness: 0.34,
      size: [housingWidth * 0.78, railHeight, railDepth],
    },
    {
      color: '#102031',
      emissive: surface.glowColor,
      emissiveIntensity: isHeroWall ? 0.055 : 0.034,
      kind: 'box',
      metalness: 0.24,
      position: [0, -(housingHeight * 0.5 + railHeight * 0.45), housingDepth * 0.08],
      roughness: 0.42,
      size: [housingWidth * 0.72, railHeight, railDepth],
    },
    {
      color: railColor,
      emissive: surface.glowColor,
      emissiveIntensity: isHeroWall ? 0.06 : 0.038,
      kind: 'box',
      metalness: 0.18,
      position: [-(housingWidth * 0.5 + railWidth * 0.25), 0, housingDepth * 0.04],
      roughness: 0.36,
      size: [railWidth, housingHeight * 1.02, railDepth],
    },
    {
      color: railColor,
      emissive: surface.glowColor,
      emissiveIntensity: isHeroWall ? 0.06 : 0.038,
      kind: 'box',
      metalness: 0.18,
      position: [housingWidth * 0.5 + railWidth * 0.25, 0, housingDepth * 0.04],
      roughness: 0.36,
      size: [railWidth, housingHeight * 1.02, railDepth],
    },
  ];
}

function buildSurfacePrimitives(zoneId: ExpoPlanningZoneId, surface: CityScreenSurface): CanonicalPrimitive[] {
  const profile = surface.renderIntent;
  const family = getSurfaceFamily(zoneId, surface);
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
  const housingShellColor = family === 'rear-campus' ? surface.color : '#263744';
  const mountedHostAttachmentPrimitives = buildMountedHostAttachmentPrimitives(family, surface, housingWidth, housingHeight, housingDepth);

  if (shouldUseCleanScreenHostArchitecture()) {
    return buildCleanScreenHostPrimitives(family, surface, housingWidth, housingHeight, housingDepth);
  }

  const primitives: CanonicalPrimitive[] = [
    ...mountedHostAttachmentPrimitives,
    { color: housingShellColor, emissive: surface.glowColor, emissiveIntensity: surface.role === 'hero-wall' ? 0.04 : 0.026, kind: 'box', metalness: 0.34, position: [0, 0, 0], roughness: 0.5, size: [housingWidth, housingHeight, housingDepth] },
    { color: '#08111c', emissive: surface.glowColor, emissiveIntensity: surface.role === 'hero-wall' ? 0.04 : 0.025, kind: 'box', metalness: 0.16, position: [0, 0, housingDepth * 0.28], roughness: 0.24, size: [innerWidth, innerHeight, Math.max(1.6, housingDepth * 0.16)] },
    { color: surface.glowColor, kind: 'plane', opacity: Math.min(0.18, profile?.glowOpacity ?? 0.16), position: [0, 0, housingDepth * 0.38], size: [innerWidth * 0.92, innerHeight * 0.92], transparent: true },
    { color: '#111c2d', emissive: surface.glowColor, emissiveIntensity: 0.08, kind: 'box', metalness: 0.3, position: [0, housingHeight * 0.52, housingDepth * 0.02], roughness: 0.42, size: [profile?.canopyWidth ?? housingWidth * 0.84, profile?.canopyHeight ?? housingHeight * 0.068, housingDepth * 0.34] },
    { color: '#142033', emissive: surface.glowColor, emissiveIntensity: 0.07, kind: 'box', metalness: 0.4, position: [-(housingWidth * 0.5) + (finWidth * 0.5), 0, -(housingDepth * 0.04)], roughness: 0.38, size: [finWidth, housingHeight, finDepth * 0.72] },
    { color: '#142033', emissive: surface.glowColor, emissiveIntensity: 0.07, kind: 'box', metalness: 0.4, position: [(housingWidth * 0.5) - (finWidth * 0.5), 0, -(housingDepth * 0.04)], roughness: 0.38, size: [finWidth, housingHeight, finDepth * 0.72] },
    { color: '#0f1927', emissive: surface.glowColor, emissiveIntensity: 0.05, kind: 'box', metalness: 0.24, position: [0, -(housingHeight * 0.5) - (railHeight * 0.7), -(housingDepth * 0.06)], roughness: 0.46, size: [housingWidth * 0.8, railHeight, housingDepth * 0.34] },
    { color: '#121f32', emissive: surface.glowColor, emissiveIntensity: 0.06, kind: 'box', metalness: 0.34, position: [0, -(housingHeight * 0.5) - (keelHeight * 0.5), -(housingDepth * 0.18)], roughness: 0.38, size: [profile?.keelWidth ?? housingWidth * 0.1, keelHeight, housingDepth * 0.3] },
  ];

  if (family === 'rear-campus') {
    const rearGlowOpacity = profile?.glowOpacity ?? (surface.role === 'hero-wall' ? 0.2 : 0.12);
    const rearInnerColor = surface.role === 'hero-wall' ? '#062436' : '#081a2a';
    const rearTrimColor = surface.role === 'hero-wall' ? '#18344d' : '#11263a';

    return [
      ...mountedHostAttachmentPrimitives,
      { color: housingShellColor, emissive: surface.glowColor, emissiveIntensity: 0.05, kind: 'box', metalness: 0.28, position: [0, 0, 0], roughness: 0.5, size: [housingWidth, housingHeight, housingDepth] },
      { color: rearInnerColor, emissive: surface.glowColor, emissiveIntensity: surface.role === 'hero-wall' ? 0.08 : 0.045, kind: 'box', metalness: 0.12, position: [0, 0, housingDepth * 0.22], roughness: 0.24, size: [housingWidth * 0.9, housingHeight * 0.78, Math.max(1.1, housingDepth * 0.12)] },
      { color: surface.glowColor, kind: 'plane', opacity: Math.min(0.26, rearGlowOpacity), position: [0, 0, housingDepth * 0.34], size: [housingWidth * 0.82, housingHeight * 0.68], transparent: true },
      { color: '#d5e7f0', emissive: surface.glowColor, emissiveIntensity: 0.08, kind: 'box', metalness: 0.16, position: [0, housingHeight * 0.5, housingDepth * 0.02], roughness: 0.34, size: [housingWidth * 0.82, Math.max(2.2, housingHeight * 0.034), housingDepth * 0.34] },
      { color: '#8fb8c8', emissive: surface.glowColor, emissiveIntensity: 0.1, kind: 'box', metalness: 0.18, position: [0, -(housingHeight * 0.5), housingDepth * 0.02], roughness: 0.36, size: [housingWidth * 0.78, Math.max(2, housingHeight * 0.028), housingDepth * 0.32] },
      { color: rearTrimColor, emissive: surface.glowColor, emissiveIntensity: 0.07, kind: 'box', metalness: 0.34, position: [-(housingWidth * 0.48), 0, housingDepth * 0.02], roughness: 0.34, size: [Math.max(3.4, housingWidth * 0.024), housingHeight * 0.88, housingDepth * 0.42] },
      { color: rearTrimColor, emissive: surface.glowColor, emissiveIntensity: 0.07, kind: 'box', metalness: 0.34, position: [(housingWidth * 0.48), 0, housingDepth * 0.02], roughness: 0.34, size: [Math.max(3.4, housingWidth * 0.024), housingHeight * 0.88, housingDepth * 0.42] },
      { color: '#0e1d2e', emissive: surface.glowColor, emissiveIntensity: 0.04, kind: 'box', metalness: 0.3, position: [0, 0, -(housingDepth * 0.2)], roughness: 0.38, size: [housingWidth * 0.12, housingHeight * 0.74, housingDepth * 0.2] },
      { color: '#16324a', emissive: surface.glowColor, emissiveIntensity: 0.06, kind: 'box', metalness: 0.34, position: [-(housingWidth * 0.24), 0, -(housingDepth * 0.08)], roughness: 0.36, size: [Math.max(2.4, housingWidth * 0.02), housingHeight * 0.46, housingDepth * 0.2] },
      { color: '#16324a', emissive: surface.glowColor, emissiveIntensity: 0.06, kind: 'box', metalness: 0.34, position: [(housingWidth * 0.24), 0, -(housingDepth * 0.08)], roughness: 0.36, size: [Math.max(2.4, housingWidth * 0.02), housingHeight * 0.46, housingDepth * 0.2] },
    ];
  }

  if (family === 'tower') {
    return [
      ...mountedHostAttachmentPrimitives,
      { color: housingShellColor, emissive: surface.glowColor, emissiveIntensity: 0.03, kind: 'box', metalness: 0.3, position: [0, 0, 0], roughness: 0.52, size: [housingWidth, housingHeight, housingDepth] },
      { color: '#091320', emissive: surface.glowColor, emissiveIntensity: 0.02, kind: 'box', metalness: 0.12, position: [0, 0, housingDepth * 0.18], roughness: 0.24, size: [housingWidth * 0.98, housingHeight * 0.98, Math.max(0.72, housingDepth * 0.1)] },
      { color: '#0f1c2b', emissive: surface.glowColor, emissiveIntensity: 0.03, kind: 'box', metalness: 0.3, position: [0, 0, -(housingDepth * 0.16)], roughness: 0.36, size: [housingWidth * 0.14, housingHeight * 0.62, housingDepth * 0.18] },
      { color: '#14243a', emissive: surface.glowColor, emissiveIntensity: 0.04, kind: 'box', metalness: 0.34, position: [-(housingWidth * 0.28), 0, -(housingDepth * 0.08)], roughness: 0.36, size: [Math.max(1.2, housingWidth * 0.028), housingHeight * 0.42, housingDepth * 0.1] },
      { color: '#14243a', emissive: surface.glowColor, emissiveIntensity: 0.04, kind: 'box', metalness: 0.34, position: [(housingWidth * 0.28), 0, -(housingDepth * 0.08)], roughness: 0.36, size: [Math.max(1.2, housingWidth * 0.028), housingHeight * 0.42, housingDepth * 0.1] },
    ];
  }

  if (family === 'center-spine') {
    return [
      ...mountedHostAttachmentPrimitives,
      { color: housingShellColor, emissive: surface.glowColor, emissiveIntensity: 0.034, kind: 'box', metalness: 0.3, position: [0, 0, 0], roughness: 0.52, size: [housingWidth, housingHeight, housingDepth] },
      { color: '#08111c', emissive: surface.glowColor, emissiveIntensity: 0.03, kind: 'box', metalness: 0.14, position: [0, 0, housingDepth * 0.2], roughness: 0.22, size: [housingWidth * 0.98, housingHeight * 0.98, Math.max(1, housingDepth * 0.12)] },
      { color: '#102031', emissive: surface.glowColor, emissiveIntensity: 0.04, kind: 'box', metalness: 0.32, position: [0, 0, -(housingDepth * 0.18)], roughness: 0.4, size: [housingWidth * 0.1, housingHeight * 0.74, housingDepth * 0.18] },
      { color: '#132238', emissive: surface.glowColor, emissiveIntensity: 0.05, kind: 'box', metalness: 0.34, position: [-(housingWidth * 0.48), 0, -(housingDepth * 0.04)], rotation: [0, 0.1, 0], roughness: 0.36, size: [housingWidth * 0.03, housingHeight * 0.56, housingDepth * 0.12] },
      { color: '#132238', emissive: surface.glowColor, emissiveIntensity: 0.05, kind: 'box', metalness: 0.34, position: [(housingWidth * 0.48), 0, -(housingDepth * 0.04)], rotation: [0, -0.1, 0], roughness: 0.36, size: [housingWidth * 0.03, housingHeight * 0.56, housingDepth * 0.12] },
    ];
  }

  if (family === 'marquee-hero') {
    return [
      ...mountedHostAttachmentPrimitives,
      { color: housingShellColor, emissive: surface.glowColor, emissiveIntensity: 0.034, kind: 'box', metalness: 0.3, position: [0, 0, 0], roughness: 0.52, size: [housingWidth, housingHeight, housingDepth] },
      { color: '#08111c', emissive: surface.glowColor, emissiveIntensity: 0.03, kind: 'box', metalness: 0.16, position: [0, 0, housingDepth * 0.2], roughness: 0.24, size: [housingWidth * 0.98, housingHeight * 0.98, Math.max(1.1, housingDepth * 0.12)] },
      { color: '#111c2d', emissive: surface.glowColor, emissiveIntensity: 0.04, kind: 'box', metalness: 0.3, position: [0, housingHeight * 0.48, housingDepth * 0.01], roughness: 0.42, size: [housingWidth * 0.68, housingHeight * 0.04, housingDepth * 0.18] },
      { color: '#0f1a29', emissive: surface.glowColor, emissiveIntensity: 0.04, kind: 'box', metalness: 0.3, position: [0, 0, -(housingDepth * 0.18)], roughness: 0.4, size: [housingWidth * 0.1, housingHeight * 0.72, housingDepth * 0.2] },
      { color: '#132238', emissive: surface.glowColor, emissiveIntensity: 0.05, kind: 'box', metalness: 0.34, position: [-(housingWidth * 0.48), 0, -(housingDepth * 0.04)], rotation: [0, 0.1, 0], roughness: 0.36, size: [housingWidth * 0.032, housingHeight * 0.58, housingDepth * 0.12] },
      { color: '#132238', emissive: surface.glowColor, emissiveIntensity: 0.05, kind: 'box', metalness: 0.34, position: [(housingWidth * 0.48), 0, -(housingDepth * 0.04)], rotation: [0, -0.1, 0], roughness: 0.36, size: [housingWidth * 0.032, housingHeight * 0.58, housingDepth * 0.12] },
    ];
  }

  if (family === 'district-array') {
    return [
      ...mountedHostAttachmentPrimitives,
      { color: housingShellColor, emissive: surface.glowColor, emissiveIntensity: 0.028, kind: 'box', metalness: 0.3, position: [0, 0, 0], roughness: 0.54, size: [housingWidth, housingHeight, housingDepth] },
      { color: '#08111c', emissive: surface.glowColor, emissiveIntensity: 0.02, kind: 'box', metalness: 0.14, position: [0, 0, housingDepth * 0.18], roughness: 0.24, size: [housingWidth * 0.98, housingHeight * 0.98, Math.max(0.9, housingDepth * 0.12)] },
      { color: '#101d2d', emissive: surface.glowColor, emissiveIntensity: 0.04, kind: 'box', metalness: 0.3, position: [0, 0, -(housingDepth * 0.18)], roughness: 0.4, size: [housingWidth * 0.08, housingHeight * 0.64, housingDepth * 0.16] },
    ];
  }

  if (wingWidth > 0) {
    primitives.push(
      { color: '#13233a', emissive: surface.glowColor, emissiveIntensity: 0.12, kind: 'box', metalness: 0.42, position: [-(housingWidth * 0.58), 0, -(housingDepth * 0.04)], rotation: [0, 0.16, 0], roughness: 0.34, size: [wingWidth, wingHeight, housingDepth * 0.42] },
      { color: '#13233a', emissive: surface.glowColor, emissiveIntensity: 0.12, kind: 'box', metalness: 0.42, position: [(housingWidth * 0.58), 0, -(housingDepth * 0.04)], rotation: [0, -0.16, 0], roughness: 0.34, size: [wingWidth, wingHeight, housingDepth * 0.42] },
    );
  }

  if (surface.role === 'hero-wall' || surface.role === 'support-wall') {
    const supportLegHeight = surface.role === 'hero-wall' ? housingHeight * 0.54 : housingHeight * 0.44;
    const supportLegWidth = Math.max(surface.role === 'hero-wall' ? 5.4 : 3.8, housingWidth * 0.046);
    const supportLegDepth = housingDepth * 0.28;
    const supportLegOffsetX = housingWidth * 0.24;
    const supportLegY = -(housingHeight * 0.5) - (supportLegHeight * 0.5) + (surface.role === 'hero-wall' ? 2 : 1.4);
    const supportBridgeHeight = Math.max(3.6, housingHeight * 0.042);
    const supportBridgeWidth = housingWidth * 0.34;
    const isMountedWallFamily =
      zoneId === 'rear-campus'
      || zoneId === 'center-spine'
      || surface.id.startsWith('screen-marquee-')
      || surface.id.startsWith('screen-array-');

    primitives.push(
      { color: '#112032', emissive: surface.glowColor, emissiveIntensity: 0.07, kind: 'box', metalness: 0.42, position: [0, -(housingHeight * 0.5) - (supportBridgeHeight * 0.35), -(housingDepth * 0.08)], roughness: 0.34, size: [supportBridgeWidth, supportBridgeHeight, housingDepth * 0.42] },
      { color: '#0f1a29', emissive: surface.glowColor, emissiveIntensity: 0.06, kind: 'box', metalness: 0.34, position: [0, 0, -(housingDepth * 0.24)], roughness: 0.38, size: [housingWidth * 0.16, housingHeight * 0.82, housingDepth * 0.36] },
    );

    if (!isMountedWallFamily) {
      primitives.push(
        { color: '#112032', emissive: surface.glowColor, emissiveIntensity: 0.08, kind: 'box', metalness: 0.44, position: [-supportLegOffsetX, supportLegY, -(housingDepth * 0.06)], roughness: 0.3, size: [supportLegWidth, supportLegHeight, supportLegDepth] },
        { color: '#112032', emissive: surface.glowColor, emissiveIntensity: 0.08, kind: 'box', metalness: 0.44, position: [supportLegOffsetX, supportLegY, -(housingDepth * 0.06)], roughness: 0.3, size: [supportLegWidth, supportLegHeight, supportLegDepth] },
      );
    }
  }

  if (surface.role === 'tower-crown' || surface.role === 'tower-side') {
    const spineWidth = surface.role === 'tower-crown' ? housingWidth * 0.24 : housingWidth * 0.18;
    const spineHeight = surface.role === 'tower-crown' ? housingHeight * 0.82 : housingHeight * 0.74;
    const spineDepth = housingDepth * 0.42;
    const clampWidth = Math.max(2.8, housingWidth * 0.044);

    primitives.push(
      { color: '#102031', emissive: surface.glowColor, emissiveIntensity: 0.08, kind: 'box', metalness: 0.42, position: [0, 0, -(housingDepth * 0.28)], roughness: 0.3, size: [spineWidth, spineHeight, spineDepth] },
      { color: '#14243a', emissive: surface.glowColor, emissiveIntensity: 0.07, kind: 'box', metalness: 0.38, position: [-(housingWidth * 0.34), 0, -(housingDepth * 0.16)], roughness: 0.34, size: [clampWidth, housingHeight * 0.64, housingDepth * 0.24] },
      { color: '#14243a', emissive: surface.glowColor, emissiveIntensity: 0.07, kind: 'box', metalness: 0.38, position: [(housingWidth * 0.34), 0, -(housingDepth * 0.16)], roughness: 0.34, size: [clampWidth, housingHeight * 0.64, housingDepth * 0.24] },
    );
  }

  if (isMarqueeOrSpineHeroSurface(surface)) {
    primitives.push(
      { color: '#0d1624', emissive: surface.glowColor, emissiveIntensity: 0.1, kind: 'box', metalness: 0.28, position: [0, 0, -(housingDepth * 0.18)], roughness: 0.42, size: [housingWidth * 0.18, housingHeight * 1.02, housingDepth * 0.32] },
      { color: '#132238', emissive: surface.glowColor, emissiveIntensity: 0.08, kind: 'box', metalness: 0.36, position: [-(housingWidth * 0.64), 0, -(housingDepth * 0.02)], rotation: [0, 0.16, 0], roughness: 0.34, size: [housingWidth * 0.06, housingHeight * 0.82, housingDepth * 0.24] },
      { color: '#132238', emissive: surface.glowColor, emissiveIntensity: 0.08, kind: 'box', metalness: 0.36, position: [(housingWidth * 0.64), 0, -(housingDepth * 0.02)], rotation: [0, -0.16, 0], roughness: 0.34, size: [housingWidth * 0.06, housingHeight * 0.82, housingDepth * 0.24] },
    );
  }

  return primitives;
}

function enrichSurfaceIntent(zoneId: ExpoPlanningZoneId, surface: CityScreenSurface): CityScreenSurface {
  const isHeroCompositionZone = zoneId === 'left-district' || zoneId === 'center-spine' || zoneId === 'right-district';
  const isCenterSpineHero = zoneId === 'center-spine' && surface.role === 'hero-wall';
  const family = getSurfaceFamily(zoneId, surface);
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
            canopyHeight: family === 'center-spine' ? surface.size[1] * 0.086 : family === 'rear-campus' ? surface.size[1] * 0.058 : family === 'district-array' ? surface.size[1] * 0.052 : surface.size[1] * 0.072,
            canopyWidth: family === 'center-spine' ? surface.size[0] * 0.92 : family === 'rear-campus' ? surface.size[0] * 0.72 : family === 'district-array' ? surface.size[0] * 0.68 : surface.size[0] * 0.86,
            finDepth: (family === 'rear-campus' ? Math.max(4.8, surface.size[2] * 1.9) : family === 'center-spine' ? Math.max(8.2, surface.size[2] * 3.4) : family === 'district-array' ? Math.max(5.4, surface.size[2] * 2.1) : Math.max(8, surface.size[2] * 3.5)) * 0.92,
            finWidth: family === 'rear-campus' ? Math.max(1.8, surface.size[0] * 0.02) : family === 'district-array' ? Math.max(1.8, surface.size[0] * 0.022) : Math.max(2.4, surface.size[0] * 0.032),
            glowOpacity: family === 'center-spine' ? 0.22 : family === 'rear-campus' ? 0.12 : family === 'district-array' ? 0.1 : 0.2,
            housingDepth: family === 'rear-campus' ? Math.max(4.8, surface.size[2] * 1.9) : family === 'center-spine' ? Math.max(8.2, surface.size[2] * 3.4) : family === 'district-array' ? Math.max(5.4, surface.size[2] * 2.1) : Math.max(8, surface.size[2] * 3.5),
            innerOpacity: 0.88,
            keelHeight: family === 'center-spine' ? surface.size[1] * 0.22 : family === 'district-array' ? surface.size[1] * 0.12 : surface.size[1] * 0.16,
            keelWidth: family === 'center-spine' ? surface.size[0] * 0.16 : family === 'district-array' ? surface.size[0] * 0.08 : surface.size[0] * 0.1,
            maxDistance: zoneId === 'rear-campus' ? 1560 : 1240,
            railHeight: Math.max(1.4, surface.size[1] * 0.028),
            railOpacity: 0.74,
            visible: true,
            wingHeight: family === 'center-spine' ? surface.size[1] * 0.78 : family === 'rear-campus' || family === 'district-array' ? 0 : surface.size[1] * 0.68,
            wingWidth: family === 'center-spine' ? surface.size[0] * 0.16 : family === 'rear-campus' || family === 'district-array' ? 0 : surface.size[0] * 0.14,
          }
      : surface.role === 'tower-crown'
          ? {
              canopyHeight: surface.size[1] * 0.068,
              canopyWidth: surface.size[0] * 0.5,
              finDepth: Math.max(3.2, surface.size[2] * 1.34) * 0.92,
              finWidth: Math.max(1.2, surface.size[0] * 0.018),
              glowOpacity: 0.08,
              housingDepth: Math.max(3.2, surface.size[2] * 1.34),
              innerOpacity: 0.9,
              keelHeight: surface.size[1] * 0.08,
              keelWidth: surface.size[0] * 0.1,
              maxDistance: 1560,
              railHeight: Math.max(1, surface.size[1] * 0.02),
              railOpacity: 0.44,
              visible: true,
              wingHeight: 0,
              wingWidth: 0,
            }
          : {
              canopyHeight: surface.size[1] * 0.064,
              canopyWidth: surface.size[0] * 0.44,
              finDepth: Math.max(3, surface.size[2] * 1.28) * 0.92,
              finWidth: Math.max(1.1, surface.size[0] * 0.018),
              glowOpacity: 0.08,
              housingDepth: Math.max(3, surface.size[2] * 1.28),
              innerOpacity: 0.9,
              keelHeight: surface.size[1] * 0.08,
              keelWidth: surface.size[0] * 0.08,
              maxDistance: 1420,
              railHeight: Math.max(1, surface.size[1] * 0.02),
              railOpacity: 0.4,
              visible: true,
              wingHeight: 0,
              wingWidth: 0,
            }
  );

  return {
    ...surface,
    renderIntent: {
      ...renderIntent,
      primitives: buildSurfacePrimitives(zoneId, { ...surface, renderIntent }),
    },
    sections: surface.sections ?? getZoneSections(zoneId),
  };
}

function buildCityScreenSurfacePoolForInputs(inputs: ExpoPlanningInputs) {
  return buildCityScreenSurfacePool(inputs.districtPrograms.length, inputs.districtStride);
}

function buildRearCampusScreenSurfaces(
  landmarkTowers: RearCampusLandmarkTower[],
  campusCenterZ: number
): CityScreenSurface[] {
  const rearCampusZ = (defaultZ: number) => resolveRearCampusAnchoredZ(campusCenterZ, defaultZ);
  const screenFaceInset = 4;
  const resolvePositiveZFaceMountedZ = (hostCenterZ: number, hostDepth: number, screenDepth: number) => (
    hostCenterZ + (hostDepth * 0.5) - (screenDepth * 0.5) - screenFaceInset
  );
  const leftTower = landmarkTowers.find((tower) => tower.id.includes('left')) ?? null;
  const rightTower = landmarkTowers.find((tower) => tower.id.includes('right')) ?? null;

  const bowlSurface: CityScreenSurface = {
    id: 'rear-campus-bowl-feed-surface',
    position: [0, 292, resolvePositiveZFaceMountedZ(campusCenterZ - 972, 228, 4.2)],
    rotation: [0, 0, 0],
    size: [560, 168, 4.2],
    color: '#08111c',
    glowColor: '#7dd3fc',
    role: 'hero-wall',
    type: 'wall',
  };

  const towerSurfaces = [leftTower, rightTower]
    .filter((tower): tower is RearCampusLandmarkTower => tower !== null)
    .map((tower): CityScreenSurface => ({
      id: `${tower.id}-rear-campus-feed-surface`,
      position: [tower.position[0], 412, resolvePositiveZFaceMountedZ(tower.position[2], 146, 3.8)],
      rotation: [0, 0, 0],
      size: [168, 152, 3.8],
      color: '#091320',
      glowColor: '#93c5fd',
      role: 'support-wall',
      type: 'wall',
    }));

  const pavilionById = new Map(buildVisibleRearCampusSidePavilions(campusCenterZ).map((pavilion) => [pavilion.id, pavilion]));
  const buildMegaHostSurface = (args: {
    id: string;
    position: [number, number, number];
    width: number;
    height: number;
    depth: number;
    glowColor: string;
    role?: 'hero-wall' | 'support-wall';
  }): CityScreenSurface => ({
    id: args.id,
    position: args.position,
    rotation: [0, 0, 0],
    size: [args.width, args.height, args.depth],
    color: '#0c1724',
    glowColor: args.glowColor,
    role: args.role ?? 'support-wall',
    type: 'wall',
  });
  const buildPavilionSurface = (args: {
    glowColor: string;
    id: string;
    sourceId: string;
    widthScale: number;
    heightScale: number;
    depth: number;
    elevationScale: number;
    frontFace: 'negative-z' | 'positive-z';
  }): CityScreenSurface | null => {
    const pavilion = pavilionById.get(args.sourceId);
    if (!pavilion) {
      return null;
    }

    const zOffset = (args.frontFace === 'negative-z' ? -1 : 1) * ((pavilion.size[2] * 0.5) - (args.depth * 0.5) - 4);
    return {
      id: args.id,
      position: [
        pavilion.position[0],
        pavilion.size[1] * args.elevationScale,
        pavilion.position[2] + zOffset,
      ],
      rotation: [0, args.frontFace === 'positive-z' ? 0 : Math.PI, 0],
      size: [
        Math.max(38, pavilion.size[0] * args.widthScale),
        Math.max(22, pavilion.size[1] * args.heightScale),
        args.depth,
      ],
      color: '#0c1724',
      glowColor: args.glowColor,
      role: 'support-wall',
      type: 'wall',
    } satisfies CityScreenSurface;
  };
  const campusFrontSupportSurfaces = [
    buildPavilionSurface({
      id: 'rear-campus-event-pavilion-left-feed-surface',
      sourceId: 'rear-campus-event-pavilion-left',
      glowColor: '#93c5fd',
      widthScale: 0.82,
      heightScale: 0.72,
      depth: 2.6,
      elevationScale: 0.84,
      frontFace: 'positive-z',
    }),
    buildPavilionSurface({
      id: 'rear-campus-event-pavilion-right-feed-surface',
      sourceId: 'rear-campus-event-pavilion-right',
      glowColor: '#93c5fd',
      widthScale: 0.82,
      heightScale: 0.72,
      depth: 2.6,
      elevationScale: 0.84,
      frontFace: 'positive-z',
    }),
    buildPavilionSurface({
      id: 'rear-campus-axis-gallery-left-feed-surface',
      sourceId: 'rear-campus-axis-gallery-left',
      glowColor: '#bfdbfe',
      widthScale: 0.74,
      heightScale: 0.66,
      depth: 2.4,
      elevationScale: 0.82,
      frontFace: 'positive-z',
    }),
    buildPavilionSurface({
      id: 'rear-campus-axis-gallery-right-feed-surface',
      sourceId: 'rear-campus-axis-gallery-right',
      glowColor: '#bfdbfe',
      widthScale: 0.74,
      heightScale: 0.66,
      depth: 2.4,
      elevationScale: 0.82,
      frontFace: 'positive-z',
    }),
    buildPavilionSurface({
      id: 'rear-campus-axis-front-left-feed-surface',
      sourceId: 'rear-campus-axis-front-left',
      glowColor: '#a5f3fc',
      widthScale: 0.76,
      heightScale: 0.72,
      depth: 2.3,
      elevationScale: 0.88,
      frontFace: 'positive-z',
    }),
    buildPavilionSurface({
      id: 'rear-campus-axis-front-right-feed-surface',
      sourceId: 'rear-campus-axis-front-right',
      glowColor: '#a5f3fc',
      widthScale: 0.76,
      heightScale: 0.72,
      depth: 2.3,
      elevationScale: 0.88,
      frontFace: 'positive-z',
    }),
    buildPavilionSurface({
      id: 'rear-campus-axis-terminal-left-feed-surface',
      sourceId: 'rear-campus-terminal-left',
      glowColor: '#bfdbfe',
      widthScale: 0.62,
      heightScale: 0.58,
      depth: 2.2,
      elevationScale: 0.82,
      frontFace: 'positive-z',
    }),
    buildPavilionSurface({
      id: 'rear-campus-axis-terminal-right-feed-surface',
      sourceId: 'rear-campus-terminal-right',
      glowColor: '#bfdbfe',
      widthScale: 0.62,
      heightScale: 0.58,
      depth: 2.2,
      elevationScale: 0.82,
      frontFace: 'positive-z',
    }),
    buildPavilionSurface({
      id: 'rear-campus-axis-kiosk-left-feed-surface',
      sourceId: 'rear-campus-axis-kiosk-left',
      glowColor: '#a5f3fc',
      widthScale: 0.64,
      heightScale: 0.58,
      depth: 2.2,
      elevationScale: 0.82,
      frontFace: 'positive-z',
    }),
    buildPavilionSurface({
      id: 'rear-campus-axis-kiosk-right-feed-surface',
      sourceId: 'rear-campus-axis-kiosk-right',
      glowColor: '#a5f3fc',
      widthScale: 0.64,
      heightScale: 0.58,
      depth: 2.2,
      elevationScale: 0.82,
      frontFace: 'positive-z',
    }),
  ].filter((surface): surface is CityScreenSurface => surface !== null);

  const megaHostSurfaces: CityScreenSurface[] = [
    buildMegaHostSurface({
      id: 'rear-campus-stage-monolith-canopy-host-surface',
      position: [47, 126, rearCampusZ(-2926)],
      width: 308,
      height: 136,
      depth: 4.2,
      glowColor: '#67e8f9',
      role: 'hero-wall',
    }),
    buildMegaHostSurface({
      id: 'rear-campus-grand-prism-citadel-host-surface',
      position: [-999, 228, rearCampusZ(-1804)],
      width: 168,
      height: 286,
      depth: 3.4,
      glowColor: '#93c5fd',
    }),
    buildMegaHostSurface({
      id: 'rear-campus-mega-civic-hall-host-surface',
      position: [-2490, 168, resolvePositiveZFaceMountedZ(rearCampusZ(-3670), 324, 4.2)],
      width: 428,
      height: 194,
      depth: 4.2,
      glowColor: '#7dd3fc',
      role: 'hero-wall',
    }),
    buildMegaHostSurface({
      id: 'rear-campus-sky-slab-tower-host-surface',
      position: [1087, 438, resolvePositiveZFaceMountedZ(rearCampusZ(-1329), 136, 3)],
      width: 174,
      height: 84,
      depth: 3,
      glowColor: '#bfdbfe',
    }),
    buildMegaHostSurface({
      id: 'rear-campus-needle-crown-skyscraper-host-surface',
      position: [1540, 408, resolvePositiveZFaceMountedZ(rearCampusZ(-611), 128, 3)],
      width: 82,
      height: 108,
      depth: 3,
      glowColor: '#a5f3fc',
    }),
  ];

  return [bowlSurface, ...towerSurfaces, ...megaHostSurfaces, ...campusFrontSupportSurfaces];
}

export function buildZoneScreenSurfacePlan(args: {
  campusCenterZ?: number;
  inputs: ExpoPlanningInputs;
  landmarkTowers?: RearCampusLandmarkTower[];
  towers?: CityTower[];
  zoneId: ExpoPlanningZoneId;
}) {
  const { campusCenterZ, inputs, landmarkTowers = [], towers = [], zoneId } = args;
  const cityScreenSurfaces = buildCityScreenSurfacePoolForInputs(inputs);

  switch (zoneId) {
    case 'arrival':
      return [] as CityScreenSurface[];
    case 'left-district':
      return cityScreenSurfaces.filter((surface) =>
        surface.id.startsWith('screen-marquee-left-') || surface.id.startsWith('screen-array-left-')
      ).map((surface) => enrichSurfaceIntent(zoneId, surface));
    case 'center-spine':
      return cityScreenSurfaces.filter((surface) => surface.id.startsWith('screen-spine-')).map((surface) => enrichSurfaceIntent(zoneId, surface));
    case 'right-district':
      return cityScreenSurfaces.filter((surface) =>
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
