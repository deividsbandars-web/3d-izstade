/**
 * CANONICAL PLANNING SOURCE (PHASE 02)
 *
 * This file contains the migrated legacy city/world geometry planning helpers
 * extracted out of runtime/world so planning ownership can move under
 * src/modules/expo/runtime/planning/**.
 *
 * Do not add new runtime/world authoring logic back into runtime/world.
 * Future planner work should land in zonal planning modules and world-plan
 * composition under runtime/planning.
 */
import type { ExpoBoothPlacement } from '../../../layout-engine';
import type { ExpoDistrictProgramSummary, ExpoWorldVisualProfile } from '../../../world-contract';
import { buildRearCampusMetrics } from '../../world/ExpoRearCampusLayout';

export type CityPlane = {
  id: string;
  position: [number, number, number];
  size: [number, number];
  color: string;
  role?: 'structural' | 'decorative' | 'helper';
  sections?: Array<'arrival' | 'left' | 'middle' | 'right'>;
};

export type CityMassRenderIntent = {
  emissive: string;
  emissiveIntensity: number;
  showFrontWing: boolean;
  showHorizontalCap: boolean;
  showRearSpine: boolean;
  showSideInset: boolean;
  showSignatureBand: boolean;
  skipBase: boolean;
};

export type CanonicalPrimitiveBox = {
  color: string;
  emissive?: string;
  emissiveIntensity?: number;
  kind: 'box';
  metalness?: number;
  position: [number, number, number];
  roughness?: number;
  rotation?: [number, number, number];
  size: [number, number, number];
  transparent?: boolean;
  opacity?: number;
};

export type CanonicalPrimitivePlane = {
  color: string;
  kind: 'plane';
  opacity?: number;
  position: [number, number, number];
  rotation?: [number, number, number];
  size: [number, number];
  transparent?: boolean;
};

export type CanonicalPrimitiveCylinder = {
  color: string;
  emissive?: string;
  emissiveIntensity?: number;
  kind: 'cylinder';
  metalness?: number;
  position: [number, number, number];
  radiusBottom: number;
  radiusTop: number;
  roughness?: number;
  rotation?: [number, number, number];
  radialSegments?: number;
  height: number;
};

export type CanonicalPrimitiveText = {
  color: string;
  kind: 'text';
  maxWidth: number;
  outlineBlur?: number;
  outlineColor?: string;
  outlineWidth?: number;
  position: [number, number, number];
  size: number;
  text: string;
};

export type CanonicalPrimitiveTexturePlane = {
  fallbackColor: string;
  kind: 'texture-plane';
  opacity?: number;
  position: [number, number, number];
  size: [number, number];
  url: string | null;
};

export type CanonicalPrimitive =
  | CanonicalPrimitiveBox
  | CanonicalPrimitivePlane
  | CanonicalPrimitiveCylinder
  | CanonicalPrimitiveText
  | CanonicalPrimitiveTexturePlane;

export type CityMass = {
  id: string;
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  role?: 'signature' | 'ground' | 'support-strip' | 'slender-vertical' | 'structural';
  decorPolicy?: 'signature' | 'standard' | 'none';
  renderIntent?: CityMassRenderIntent;
  sections?: Array<'arrival' | 'left' | 'middle' | 'right'>;
};

export type CityTower = {
  id: string;
  position: [number, number, number];
  baseSize: [number, number, number];
  upperSize: [number, number, number];
  color: string;
  crownColor: string;
  role?: 'hero' | 'mid' | 'support' | 'outer-support';
  composition?: 'hero' | 'standard' | 'minimal';
  renderIntent?: {
    crownBandEmissiveIntensity: number;
    crownPlateEmissiveIntensity: number;
    hidden: boolean;
    insetEmissive: number;
    midBandEmissiveIntensity: number;
    podiumDepthMultiplier: number;
    podiumEmissiveIntensity: number;
    podiumWidthMultiplier: number;
    rearFinEmissive: number;
    showCrownPlate: boolean;
    showCrownPods: boolean;
    showInsetMass: boolean;
    showMidBand: boolean;
    showRearFin: boolean;
    showSideFin: boolean;
    showSpire: boolean;
    sideFinEmissive: number;
    skipBase: boolean;
    rearFinHeight: number;
    sideFinHeight: number;
    crownBandHeight: number;
    midBandHeight: number;
    primitives?: CanonicalPrimitive[];
  };
  sections?: Array<'arrival' | 'left' | 'middle' | 'right'>;
};

export type CityScreenSurface = {
  color: string;
  glowColor: string;
  id: string;
  role: 'hero-wall' | 'support-wall' | 'tower-crown' | 'tower-side';
  position: [number, number, number];
  rotation: [number, number, number];
  renderIntent?: {
    canopyHeight: number;
    canopyWidth: number;
    finDepth: number;
    finWidth: number;
    glowOpacity: number;
    housingDepth: number;
    innerOpacity: number;
    keelHeight: number;
    keelWidth: number;
    maxDistance: number;
    railHeight: number;
    railOpacity: number;
    visible: boolean;
    wingHeight: number;
    wingWidth: number;
    primitives?: CanonicalPrimitive[];
  };
  sections?: Array<'arrival' | 'left' | 'middle' | 'right'>;
  size: [number, number, number];
  type: 'tower-crown' | 'tower-side' | 'wall';
};

export type CityScreenSocket = {
  color: string;
  frameSize: [number, number];
  id: string;
  kind: 'hero_wall' | 'tower_crown' | 'tower_side' | 'wall';
  position: [number, number, number];
  rotation: [number, number, number];
  renderIntent?: {
    accentOpacity: number;
    antennaHeight: number;
    beamHeight: number;
    braceDepth: number;
    bridgeHeight: number;
    columnWidth: number;
    frameDepth: number;
    maxDistance: number;
    visible: boolean;
    primitives?: CanonicalPrimitive[];
  };
  sections?: Array<'arrival' | 'left' | 'middle' | 'right'>;
  surfaceId: string;
};

export type CityScreenAssignment = {
  accentColor: string;
  companyId: string | null;
  id: string;
  imageUrl: string | null;
  label: string;
  renderIntent?: {
    bodyPanelWidth: number;
    chipColor: string;
    detailDistance: number;
    edgeGlowOpacity: number;
    frameHeight: number;
    frameWidth: number;
    headerHeight: number;
    footerHeight: number;
    maxDistance: number;
    panelOpacityFar: number;
    panelOpacityMid: number;
    panelOpacityNear: number;
    semanticChip: string;
    semanticMode: 'landmark' | 'beacon' | 'signal' | 'wayfinding';
    showCenterTitleDistance: number;
    subtitleDistance: number;
    tierAccent: string;
    topStripWidth: number;
    primitives?: CanonicalPrimitive[];
  };
  sections?: Array<'arrival' | 'left' | 'middle' | 'right'>;
  socketId: string;
  subtitle: string;
  tier: 'elite' | 'hero' | 'premium';
};

export type StadiumReserve = {
  centerX: number;
  centerZ: number;
  halfWidth: number;
  halfDepth: number;
};

export function getWorldCityStadiumReserve(boothPlacements: ExpoBoothPlacement[]): StadiumReserve {
  const { campusCenterZ } = buildRearCampusMetrics(boothPlacements);

  return {
    centerX: 0,
    centerZ: campusCenterZ - 800,
    halfWidth: 2300,
    halfDepth: 1500,
  };
}

function isInsideSponsorFrontageReserve(
  point: [number, number, number],
  boothPlacements: ExpoBoothPlacement[],
  options?: {
    frontDepth?: number;
    rearDepth?: number;
    sideWidth?: number;
    radius?: number;
  }
) {
  const frontDepth = options?.frontDepth ?? 520;
  const rearDepth = options?.rearDepth ?? 220;
  const sideWidth = options?.sideWidth ?? 260;
  const radius = options?.radius ?? 340;

  return boothPlacements.some((booth) => {
    const dx = point[0] - booth.position[0];
    const dz = point[2] - booth.position[2];
    const yaw = booth.rotation?.[1] ?? 0;
    const cos = Math.cos(-yaw);
    const sin = Math.sin(-yaw);
    const localX = (dx * cos) - (dz * sin);
    const localZ = (dx * sin) + (dz * cos);
    const distanceSq = (dx * dx) + (dz * dz);

    const inFrontageLane = Math.abs(localX) < sideWidth && localZ > -rearDepth && localZ < frontDepth;
    const inFrontageRadius = distanceSq < (radius * radius);

    return inFrontageLane || inFrontageRadius;
  });
}

function filterReservedSponsorFrontageEntries<T extends { position: [number, number, number] }>(
  entries: T[],
  boothPlacements: ExpoBoothPlacement[],
  options?: {
    frontDepth?: number;
    rearDepth?: number;
    sideWidth?: number;
    radius?: number;
  }
) {
  return entries.filter((entry) => !isInsideSponsorFrontageReserve(entry.position, boothPlacements, options));
}

const NON_STRUCTURAL_PLANE_PATTERNS = [
  'arrival-terminal',
  'showcase-front-carpet',
  'showcase-center-carpet',
  'showcase-threshold-band',
  'showcase-gallery-band',
  'booth-forecourt-center',
  'booth-connector',
  'booth-mid-pad',
  'booth-inner-carpet',
  'promenade-axis-inner-carpet',
  'promenade-axis-center-carpet',
  'promenade-axis-front-carpet',
  'promenade-axis-outer-left',
  'promenade-axis-outer-right',
  'promenade-axis-threshold',
  'promenade-axis-terminal',
  'promenade-axis-transition',
  'promenade-axis-endcap',
];

const MIN_STRUCTURAL_CITY_PLANE_AREA = 140_000;

const NON_STRUCTURAL_MASS_PATTERNS = [
  'gateway-mid-plinth',
  'gateway-front',
  'gateway-inner',
  'gateway-rear-band',
  'gateway-lintel',
  'gateway-node',
  'gateway-outer',
  'showcase-forum-plinth',
  'showcase-terrace',
  'showcase-obelisk',
  'showcase-dais',
  'showcase-forum-rear',
  'showcase-wing',
  'showcase-outer-marker',
  'showcase-front-threshold-center',
  'media-wall-bridge',
  'media-wall-plinth',
  'media-wall-apron',
  'media-wall-gallery',
  'media-wall-center-link',
  'media-wall-front-node',
  'media-wall-forecourt-band',
  'media-wall-front-threshold',
  'media-wall-outer-marker',
  'media-wall-side-dais',
  'discovery-axis-plinth',
  'discovery-front-threshold-center',
  'discovery-front-court',
  'discovery-terrace-center',
  'discovery-terrace-center-step',
  'discovery-viewing-step',
  'discovery-approach-plinth',
  'discovery-overlook-band',
  'discovery-overlook-center-band',
  'discovery-overlook-anchor',
  'discovery-inner-step',
  'discovery-side-node',
  'discovery-outer-platform',
  'discovery-observatory-plinth',
  'discovery-observatory-front-pad',
  'discovery-observatory-wing',
  'discovery-observatory-rear-band',
  'discovery-observatory-side-left',
  'discovery-observatory-side-right',
  'discovery-observatory-rear-anchor-left',
  'discovery-observatory-rear-anchor-right',
  'media-wall-node-left',
  'media-wall-node-right',
  'media-wall-rear-node-left',
  'media-wall-rear-node-right',
  'center-transition-rear-left',
  'center-transition-rear-right',
  'signature-mega-front-court',
  'signature-mega-dais',
  'signature-mega-outer-node',
  'support-band',
  'support-link',
  'support-center-marker',
  'support-transition-court',
  'support-edge-left-',
  'support-edge-right-',
  'support-edge-node-left-',
  'support-edge-node-right-',
  'support-edge-rear-link-left-',
  'support-edge-rear-link-right-',
  'support-edge-outer-band-left-',
  'support-edge-outer-band-right-',
  'support-edge-mid-link-left-',
  'support-edge-mid-link-right-',
  'media-wall-spine-left-',
  'media-wall-spine-right-',
  'media-wall-outer-marker-left-',
  'media-wall-outer-marker-right-',
];

function classifyCityPlaneRole(plane: CityPlane): NonNullable<CityPlane['role']> {
  const isDecorativeByPattern =
    Math.abs(plane.position[0]) <= 220 &&
    NON_STRUCTURAL_PLANE_PATTERNS.some((pattern) => plane.id.includes(pattern));

  if (isDecorativeByPattern) {
    return 'decorative';
  }

  const area = plane.size[0] * plane.size[1];
  if (area < MIN_STRUCTURAL_CITY_PLANE_AREA) {
    return 'helper';
  }

  return 'structural';
}

function filterStructuralCityPlanes(planes: CityPlane[]) {
  return planes
    .map((plane) => ({
      ...plane,
      role: classifyCityPlaneRole(plane),
    }))
    .filter((plane) => plane.role === 'structural');
}

function filterStructuralCityMasses(masses: CityMass[]) {
  return masses.filter((mass) => {
    const isClutterLike = NON_STRUCTURAL_MASS_PATTERNS.some((pattern) => mass.id.includes(pattern));
    const isCentralDecorative = Math.abs(mass.position[0]) <= 220 && isClutterLike;
    const isResidualSupportStrip = mass.id.includes('support-edge-') || mass.id.includes('media-wall-spine-');

    return !isCentralDecorative && !isResidualSupportStrip;
  }).map((mass) => {
    const isSignature =
      mass.id.includes('gateway') ||
      mass.id.includes('media-wall') ||
      mass.id.includes('showcase') ||
      mass.id.includes('discovery') ||
      mass.id.includes('signature-mega');
    const isFrontCourtLike =
      mass.id.includes('court') ||
      mass.id.includes('band') ||
      mass.id.includes('apron') ||
      mass.id.includes('link') ||
      mass.id.includes('dais');
    const isGroundLikePlinth =
      mass.size[1] <= 24 &&
      (isFrontCourtLike ||
        mass.id.includes('threshold') ||
        mass.id.includes('platform') ||
        mass.id.includes('terrace') ||
        mass.id.includes('plinth') ||
        (mass.size[0] * mass.size[2] >= 2200));
    const isSlenderVertical =
      mass.size[1] >= 54 &&
      (mass.size[0] <= 20 || mass.size[2] <= 20);
    const isSupportStrip =
      isFrontCourtLike ||
      mass.id.includes('support-band') ||
      mass.id.includes('support-link') ||
      mass.id.includes('support-center-marker');

    const role: CityMass['role'] = isGroundLikePlinth
      ? 'ground'
      : isSupportStrip
        ? 'support-strip'
        : isSlenderVertical
          ? 'slender-vertical'
          : isSignature
            ? 'signature'
            : 'structural';

    const decorPolicy: CityMass['decorPolicy'] =
      role === 'ground' || role === 'support-strip' || role === 'slender-vertical'
        ? 'none'
        : role === 'signature'
          ? 'signature'
          : 'standard';

    return {
      ...mass,
      role,
      decorPolicy,
    };
  });
}

export function buildArrivalPlanes(): CityPlane[] {
  return filterStructuralCityPlanes([
    { id: 'arrival-main', position: [0, 0.018, 64], size: [320, 240], color: '#eef4f7' },
    { id: 'arrival-spine', position: [0, 0.02, -84], size: [124, 540], color: '#dde7ef' },
    { id: 'arrival-left', position: [-208, 0.018, -18], size: [172, 284], color: '#d6e2ea' },
    { id: 'arrival-right', position: [208, 0.018, -18], size: [172, 284], color: '#d6e2ea' },
    { id: 'arrival-entry-left', position: [-328, 0.018, 132], size: [104, 148], color: '#e6eef3' },
    { id: 'arrival-entry-right', position: [328, 0.018, 126], size: [104, 148], color: '#e6eef3' },
    { id: 'arrival-forecourt', position: [0, 0.019, 196], size: [284, 92], color: '#f2f7fa' },
    { id: 'arrival-side-band-left', position: [-118, 0.019, 222], size: [78, 34], color: '#ebf2f6' },
    { id: 'arrival-side-band-right', position: [118, 0.019, 216], size: [78, 34], color: '#ebf2f6' },
    { id: 'arrival-entry-ribbon', position: [0, 0.019, 248], size: [164, 24], color: '#edf3f7' },
    { id: 'arrival-court-left', position: [-226, 0.018, 184], size: [98, 64], color: '#edf3f7' },
    { id: 'arrival-court-right', position: [226, 0.018, 178], size: [98, 64], color: '#edf3f7' },
    { id: 'arrival-outer-band-left', position: [-286, 0.018, 248], size: [68, 22], color: '#e8eff4' },
    { id: 'arrival-outer-band-right', position: [286, 0.018, 242], size: [68, 22], color: '#e8eff4' },
    { id: 'arrival-terminal-left', position: [-78, 0.019, 286], size: [42, 18], color: '#edf3f7' },
    { id: 'arrival-terminal-right', position: [78, 0.019, 280], size: [42, 18], color: '#edf3f7' },
    { id: 'arrival-inner-carpet', position: [0, 0.019, 224], size: [96, 18], color: '#f4f8fb' },
    { id: 'arrival-front-carpet-left', position: [-126, 0.019, 154], size: [56, 18], color: '#f4f8fb' },
    { id: 'arrival-front-carpet-right', position: [126, 0.019, 148], size: [56, 18], color: '#f4f8fb' },
    { id: 'arrival-mid-carpet', position: [0, 0.019, 170], size: [74, 16], color: '#f6fafc' },
  ] as CityPlane[]);
}

export function buildPromenadeAxisPlanes(districtCount: number, districtStride: number): CityPlane[] {
  return filterStructuralCityPlanes(Array.from({ length: Math.max(3, districtCount) }, (_, districtIndex) => {
    const baseZ = -178 - (districtIndex * districtStride);
    return [
      { id: `promenade-axis-main-${districtIndex}`, position: [0, 0.02, baseZ + 16], size: [188, 286], color: '#edf3f7' },
      { id: `promenade-axis-cross-${districtIndex}`, position: [0, 0.019, baseZ + 126], size: [364, 96], color: '#e2ebf1' },
      { id: `promenade-axis-island-${districtIndex}`, position: [0, 0.021, baseZ - 84], size: [92, 42], color: '#dbe6ee' },
      { id: `promenade-axis-left-pocket-${districtIndex}`, position: [-154, 0.019, baseZ + 38], size: [74, 118], color: '#e5edf2' },
      { id: `promenade-axis-right-pocket-${districtIndex}`, position: [154, 0.019, baseZ + 28], size: [74, 118], color: '#e5edf2' },
      { id: `promenade-axis-ribbon-${districtIndex}`, position: [0, 0.021, baseZ - 168], size: [58, 72], color: '#d7e2ea' },
      { id: `promenade-axis-endcap-${districtIndex}`, position: [0, 0.019, baseZ + 198], size: [84, 28], color: '#e8eff4' },
      { id: `promenade-axis-lane-left-${districtIndex}`, position: [-74, 0.019, baseZ - 26], size: [34, 156], color: '#eaf1f5' },
      { id: `promenade-axis-lane-right-${districtIndex}`, position: [74, 0.019, baseZ - 32], size: [34, 156], color: '#eaf1f5' },
      { id: `promenade-axis-threshold-left-${districtIndex}`, position: [-176, 0.019, baseZ + 142], size: [24, 28], color: '#eef4f8' },
      { id: `promenade-axis-threshold-right-${districtIndex}`, position: [176, 0.019, baseZ + 134], size: [24, 28], color: '#eef4f8' },
      { id: `promenade-axis-rear-pad-${districtIndex}`, position: [0, 0.019, baseZ - 246], size: [106, 36], color: '#e3ebf1' },
      { id: `promenade-axis-outer-left-${districtIndex}`, position: [-198, 0.019, baseZ - 118], size: [48, 84], color: '#e7eef3' },
      { id: `promenade-axis-outer-right-${districtIndex}`, position: [198, 0.019, baseZ - 128], size: [48, 84], color: '#e7eef3' },
      { id: `promenade-axis-terminal-left-${districtIndex}`, position: [-58, 0.019, baseZ + 218], size: [26, 18], color: '#eef4f8' },
      { id: `promenade-axis-terminal-right-${districtIndex}`, position: [58, 0.019, baseZ + 210], size: [26, 18], color: '#eef4f8' },
      { id: `promenade-axis-inner-carpet-${districtIndex}`, position: [0, 0.019, baseZ + 92], size: [82, 18], color: '#f1f6f9' },
      { id: `promenade-axis-center-carpet-${districtIndex}`, position: [0, 0.019, baseZ - 18], size: [42, 12], color: '#f5f9fb' },
      { id: `promenade-axis-front-carpet-left-${districtIndex}`, position: [-92, 0.019, baseZ + 154], size: [30, 12], color: '#f1f6f9' },
      { id: `promenade-axis-front-carpet-right-${districtIndex}`, position: [92, 0.019, baseZ + 146], size: [30, 12], color: '#f1f6f9' },
      { id: `promenade-axis-transition-left-${districtIndex}`, position: [-128, 0.019, baseZ - 172], size: [36, 24], color: '#eef4f8' },
      { id: `promenade-axis-transition-right-${districtIndex}`, position: [128, 0.019, baseZ - 182], size: [36, 24], color: '#eef4f8' },
    ] as CityPlane[];
  }).flat());
}

export function buildArrivalGatewayBlocks(): CityMass[] {
  return filterStructuralCityMasses([
    { id: 'arrival-gateway-left', position: [-498, 0, 172], size: [86, 196, 58], color: '#7d919f' },
    { id: 'arrival-gateway-right', position: [498, 0, 172], size: [86, 196, 58], color: '#7d919f' },
    { id: 'arrival-gateway-lintel', position: [0, 0, 218], size: [452, 18, 28], color: '#c7d3db' },
    { id: 'arrival-gateway-node-left', position: [-358, 0, 226], size: [52, 42, 24], color: '#d8e2e9' },
    { id: 'arrival-gateway-node-right', position: [358, 0, 220], size: [52, 42, 24], color: '#d8e2e9' },
    { id: 'arrival-gateway-rear-band', position: [0, 0, 264], size: [268, 10, 18], color: '#e7eef3' },
    { id: 'arrival-gateway-beacon-left', position: [-188, 0, 238], size: [18, 88, 18], color: '#c8d4dc' },
    { id: 'arrival-gateway-beacon-right', position: [188, 0, 232], size: [18, 88, 18], color: '#c8d4dc' },
    { id: 'arrival-gateway-mid-plinth', position: [0, 0, 238], size: [78, 10, 18], color: '#dfe8ee' },
    { id: 'arrival-gateway-outer-left', position: [-356, 0, 272], size: [28, 56, 18], color: '#d4dfe6' },
    { id: 'arrival-gateway-outer-right', position: [356, 0, 266], size: [28, 56, 18], color: '#d4dfe6' },
    { id: 'arrival-gateway-front-left', position: [-168, 0, 286], size: [16, 36, 14], color: '#dde6ec' },
    { id: 'arrival-gateway-front-right', position: [168, 0, 280], size: [16, 36, 14], color: '#dde6ec' },
    { id: 'arrival-gateway-inner-left', position: [-98, 0, 258], size: [12, 28, 12], color: '#e4ecf1' },
    { id: 'arrival-gateway-inner-right', position: [98, 0, 252], size: [12, 28, 12], color: '#e4ecf1' },
  ] as CityMass[]);
}

export function buildBoulevardEdgeBlocks(districtCount: number, districtStride: number): CityMass[] {
  return filterStructuralCityMasses(Array.from({ length: Math.max(3, districtCount) }, (_, districtIndex) => {
    const baseZ = -168 - (districtIndex * districtStride);
    return [
      { id: `boulevard-edge-left-${districtIndex}`, position: [-228, 0, baseZ + 28], size: [8, 2.8, 108], color: '#dfe8ee' },
      { id: `boulevard-edge-right-${districtIndex}`, position: [228, 0, baseZ + 22], size: [8, 2.8, 108], color: '#dfe8ee' },
      { id: `boulevard-node-left-${districtIndex}`, position: [-338, 0, baseZ - 88], size: [24, 5, 26], color: '#d7e2e9' },
      { id: `boulevard-node-right-${districtIndex}`, position: [338, 0, baseZ - 102], size: [24, 5, 26], color: '#d7e2e9' },
      { id: `boulevard-threshold-left-${districtIndex}`, position: [-352, 0, baseZ + 118], size: [16, 8, 16], color: '#e1e9ef' },
      { id: `boulevard-threshold-right-${districtIndex}`, position: [352, 0, baseZ + 106], size: [16, 8, 16], color: '#e1e9ef' },
      { id: `boulevard-rear-node-left-${districtIndex}`, position: [-248, 0, baseZ - 214], size: [16, 10, 18], color: '#dde6ec' },
      { id: `boulevard-rear-node-right-${districtIndex}`, position: [248, 0, baseZ - 226], size: [16, 10, 18], color: '#dde6ec' },
      { id: `boulevard-mid-node-left-${districtIndex}`, position: [-252, 0, baseZ + 172], size: [12, 12, 14], color: '#e2eaf0' },
      { id: `boulevard-mid-node-right-${districtIndex}`, position: [252, 0, baseZ + 162], size: [12, 12, 14], color: '#e2eaf0' },
    ] as CityMass[];
  }).flat());
}

export function buildShowcasePlazas(
  districtPrograms: ExpoDistrictProgramSummary[],
  boothPlacements: ExpoBoothPlacement[],
  districtStride: number
): CityPlane[] {
  const entries: CityPlane[] = districtPrograms.slice(0, Math.max(3, districtPrograms.length)).flatMap((district, districtIndex) => {
    const baseZ = -182 - (districtIndex * districtStride);
    return [
      { id: `${district.sectorId ?? district.clusterIndex}-showcase-main`, position: [0, 0.019, baseZ + 148], size: [196, 96], color: '#f0f5f8' },
      { id: `${district.sectorId ?? district.clusterIndex}-showcase-left`, position: [-168, 0.018, baseZ + 66], size: [96, 124], color: '#dfe8ee' },
      { id: `${district.sectorId ?? district.clusterIndex}-showcase-right`, position: [168, 0.018, baseZ + 52], size: [96, 124], color: '#dfe8ee' },
      { id: `${district.sectorId ?? district.clusterIndex}-showcase-step-left`, position: [-72, 0.02, baseZ + 182], size: [56, 26], color: '#e7eef3' },
      { id: `${district.sectorId ?? district.clusterIndex}-showcase-step-right`, position: [72, 0.02, baseZ + 176], size: [56, 26], color: '#e7eef3' },
      { id: `${district.sectorId ?? district.clusterIndex}-showcase-terrace-left-outer`, position: [-238, 0.018, baseZ + 158], size: [82, 54], color: '#e6edf2' },
      { id: `${district.sectorId ?? district.clusterIndex}-showcase-terrace-right-outer`, position: [238, 0.018, baseZ + 148], size: [82, 54], color: '#e6edf2' },
      { id: `${district.sectorId ?? district.clusterIndex}-showcase-rear-band`, position: [0, 0.019, baseZ + 238], size: [214, 38], color: '#ebf2f6' },
      { id: `${district.sectorId ?? district.clusterIndex}-showcase-threshold-band-left`, position: [-168, 0.019, baseZ + 108], size: [38, 14], color: '#eef4f8' },
      { id: `${district.sectorId ?? district.clusterIndex}-showcase-threshold-band-right`, position: [168, 0.019, baseZ + 102], size: [38, 14], color: '#eef4f8' },
      { id: `${district.sectorId ?? district.clusterIndex}-showcase-gallery-band-left`, position: [-198, 0.019, baseZ + 194], size: [42, 16], color: '#edf3f7' },
      { id: `${district.sectorId ?? district.clusterIndex}-showcase-gallery-band-right`, position: [198, 0.019, baseZ + 186], size: [42, 16], color: '#edf3f7' },
      { id: `${district.sectorId ?? district.clusterIndex}-showcase-front-carpet`, position: [0, 0.019, baseZ + 112], size: [82, 18], color: '#f2f7fa' },
      { id: `${district.sectorId ?? district.clusterIndex}-showcase-outer-left-pad`, position: [-286, 0.018, baseZ + 208], size: [52, 32], color: '#e7eef3' },
      { id: `${district.sectorId ?? district.clusterIndex}-showcase-outer-right-pad`, position: [286, 0.018, baseZ + 198], size: [52, 32], color: '#e7eef3' },
      { id: `${district.sectorId ?? district.clusterIndex}-showcase-rear-carpet-left`, position: [-112, 0.019, baseZ + 274], size: [58, 18], color: '#edf3f7' },
      { id: `${district.sectorId ?? district.clusterIndex}-showcase-rear-carpet-right`, position: [112, 0.019, baseZ + 266], size: [58, 18], color: '#edf3f7' },
      { id: `${district.sectorId ?? district.clusterIndex}-showcase-center-carpet`, position: [0, 0.019, baseZ + 206], size: [42, 14], color: '#f2f7fa' },
    ] as CityPlane[];
  });

  return filterStructuralCityPlanes(
    filterReservedSponsorFrontageEntries(entries, boothPlacements, { frontDepth: 380, rearDepth: 160, sideWidth: 160, radius: 200 })
  );
}

export function buildShowcaseMonuments(
  districtPrograms: ExpoDistrictProgramSummary[],
  districtStride: number
): CityMass[] {
  return filterStructuralCityMasses(districtPrograms.slice(0, Math.max(3, districtPrograms.length)).flatMap((district, districtIndex) => {
    const baseZ = -182 - (districtIndex * districtStride);
    return [
      {
        id: `${district.sectorId ?? district.clusterIndex}-showcase-forum-plinth`,
        position: [0, 0, baseZ + 168],
        size: [96, 14, 64],
        color: '#d7e1e8',
      },
      {
        id: `${district.sectorId ?? district.clusterIndex}-showcase-terrace-left`,
        position: [-86, 0, baseZ + 154],
        size: [72, 10, 42],
        color: '#cdd9e1',
      },
      {
        id: `${district.sectorId ?? district.clusterIndex}-showcase-terrace-right`,
        position: [86, 0, baseZ + 148],
        size: [72, 10, 42],
        color: '#cdd9e1',
      },
      {
        id: `${district.sectorId ?? district.clusterIndex}-showcase-wing-left`,
        position: [-212, 0, baseZ + 188],
        size: [42, 62, 22],
        color: '#9eb1be',
      },
      {
        id: `${district.sectorId ?? district.clusterIndex}-showcase-wing-right`,
        position: [212, 0, baseZ + 182],
        size: [42, 62, 22],
        color: '#9eb1be',
      },
      {
        id: `${district.sectorId ?? district.clusterIndex}-showcase-obelisk`,
        position: [0, 0, baseZ + 186],
        size: [18, 124, 18],
        color: '#93a6b3',
      },
      {
        id: `${district.sectorId ?? district.clusterIndex}-showcase-dais-left`,
        position: [-62, 0, baseZ + 214],
        size: [42, 12, 30],
        color: '#d5e0e7',
      },
      {
        id: `${district.sectorId ?? district.clusterIndex}-showcase-dais-right`,
        position: [62, 0, baseZ + 208],
        size: [42, 12, 30],
        color: '#d5e0e7',
      },
      {
        id: `${district.sectorId ?? district.clusterIndex}-showcase-forum-rear`,
        position: [0, 0, baseZ + 248],
        size: [126, 14, 20],
        color: '#dce5eb',
      },
      {
        id: `${district.sectorId ?? district.clusterIndex}-showcase-rear-pylon-left`,
        position: [-164, 0, baseZ + 246],
        size: [18, 56, 14],
        color: '#c2d0d9',
      },
      {
        id: `${district.sectorId ?? district.clusterIndex}-showcase-rear-pylon-right`,
        position: [164, 0, baseZ + 238],
        size: [18, 56, 14],
        color: '#c2d0d9',
      },
      {
        id: `${district.sectorId ?? district.clusterIndex}-showcase-threshold-left`,
        position: [-242, 0, baseZ + 118],
        size: [16, 34, 16],
        color: '#d7e2ea',
      },
      {
        id: `${district.sectorId ?? district.clusterIndex}-showcase-threshold-right`,
        position: [242, 0, baseZ + 108],
        size: [16, 34, 16],
        color: '#d7e2ea',
      },
      {
        id: `${district.sectorId ?? district.clusterIndex}-showcase-outer-marker-left`,
        position: [-312, 0, baseZ + 232],
        size: [16, 62, 16],
        color: '#dce5eb',
      },
      {
        id: `${district.sectorId ?? district.clusterIndex}-showcase-outer-marker-right`,
        position: [312, 0, baseZ + 222],
        size: [16, 62, 16],
        color: '#dce5eb',
      },
      {
        id: `${district.sectorId ?? district.clusterIndex}-showcase-front-threshold-center`,
        position: [0, 0, baseZ + 112],
        size: [12, 18, 10],
        color: '#e7eef3',
      },
    ] as CityMass[];
  }));
}

export function buildBoothForecourtPlanes(
  districtPrograms: ExpoDistrictProgramSummary[],
  boothPlacements: ExpoBoothPlacement[],
  districtStride: number
): CityPlane[] {
  const entries: CityPlane[] = districtPrograms.slice(0, Math.max(3, districtPrograms.length)).flatMap((district, districtIndex) => {
    const baseZ = -196 - (districtIndex * districtStride);
    return [
      {
        id: `${district.sectorId ?? district.clusterIndex}-booth-forecourt-left`,
        position: [-324, 0.018, baseZ + 42],
        size: [132, 196],
        color: '#e7eef3',
      },
      {
        id: `${district.sectorId ?? district.clusterIndex}-booth-forecourt-right`,
        position: [324, 0.018, baseZ + 24],
        size: [132, 196],
        color: '#e7eef3',
      },
      {
        id: `${district.sectorId ?? district.clusterIndex}-booth-node-left`,
        position: [-418, 0.018, baseZ - 112],
        size: [96, 126],
        color: '#dbe6ed',
      },
      {
        id: `${district.sectorId ?? district.clusterIndex}-booth-node-right`,
        position: [418, 0.018, baseZ - 128],
        size: [96, 126],
        color: '#dbe6ed',
      },
      {
        id: `${district.sectorId ?? district.clusterIndex}-booth-forecourt-center`,
        position: [0, 0.018, baseZ + 74],
        size: [56, 22],
        color: '#edf3f7',
      },
      {
        id: `${district.sectorId ?? district.clusterIndex}-booth-side-pocket-left`,
        position: [-492, 0.018, baseZ + 12],
        size: [92, 118],
        color: '#e2ebf1',
      },
      {
        id: `${district.sectorId ?? district.clusterIndex}-booth-side-pocket-right`,
        position: [492, 0.018, baseZ - 4],
        size: [92, 118],
        color: '#e2ebf1',
      },
      {
        id: `${district.sectorId ?? district.clusterIndex}-booth-connector-left`,
        position: [-264, 0.018, baseZ + 44],
        size: [40, 20],
        color: '#edf3f7',
      },
      {
        id: `${district.sectorId ?? district.clusterIndex}-booth-connector-right`,
        position: [264, 0.018, baseZ + 34],
        size: [40, 20],
        color: '#edf3f7',
      },
      {
        id: `${district.sectorId ?? district.clusterIndex}-booth-rear-pocket-left`,
        position: [-336, 0.018, baseZ - 212],
        size: [58, 74],
        color: '#e4ecf1',
      },
      {
        id: `${district.sectorId ?? district.clusterIndex}-booth-rear-pocket-right`,
        position: [336, 0.018, baseZ - 224],
        size: [58, 74],
        color: '#e4ecf1',
      },
      {
        id: `${district.sectorId ?? district.clusterIndex}-booth-mid-pad-left`,
        position: [-104, 0.018, baseZ - 8],
        size: [10, 14],
        color: '#f0f5f8',
      },
      {
        id: `${district.sectorId ?? district.clusterIndex}-booth-mid-pad-right`,
        position: [104, 0.018, baseZ - 18],
        size: [10, 14],
        color: '#f0f5f8',
      },
      {
        id: `${district.sectorId ?? district.clusterIndex}-booth-inner-carpet`,
        position: [0, 0.018, baseZ - 34],
        size: [34, 14],
        color: '#f4f8fb',
      },
      {
        id: `${district.sectorId ?? district.clusterIndex}-booth-outer-pad-left`,
        position: [-392, 0.018, baseZ + 96],
        size: [42, 28],
        color: '#edf3f7',
      },
      {
        id: `${district.sectorId ?? district.clusterIndex}-booth-outer-pad-right`,
        position: [392, 0.018, baseZ + 82],
        size: [42, 28],
        color: '#edf3f7',
      },
    ] as CityPlane[];
  });

  return filterStructuralCityPlanes(
    filterReservedSponsorFrontageEntries(entries, boothPlacements, {
      frontDepth: 300,
      rearDepth: 140,
      sideWidth: 120,
      radius: 180,
    })
  );
}

export function buildRightSupportBlocks(
  districtPrograms: ExpoDistrictProgramSummary[],
  boothPlacements: ExpoBoothPlacement[],
  districtStride: number
): CityMass[] {
  const entries: CityMass[] = districtPrograms.slice(0, Math.max(3, districtPrograms.length)).flatMap((district, districtIndex) => {
    const baseZ = -196 - (districtIndex * districtStride);
    return [
      { id: `${district.sectorId ?? district.clusterIndex}-right-support-front`, position: [512, 18, baseZ + 78], size: [48, 18, 48], color: '#c8d4dc' },
      { id: `${district.sectorId ?? district.clusterIndex}-right-support-rear`, position: [684, 36, baseZ - 248], size: [64, 54, 76], color: '#95a8b4' },
      { id: `${district.sectorId ?? district.clusterIndex}-center-transition-left`, position: [-102, 12, baseZ + 108], size: [28, 16, 28], color: '#d4dee5' },
      { id: `${district.sectorId ?? district.clusterIndex}-center-transition-right`, position: [102, 12, baseZ + 96], size: [28, 16, 28], color: '#d4dee5' },
      { id: `${district.sectorId ?? district.clusterIndex}-center-transition-rear-left`, position: [-146, 10, baseZ - 42], size: [22, 12, 22], color: '#dde6ec' },
      { id: `${district.sectorId ?? district.clusterIndex}-center-transition-rear-right`, position: [146, 10, baseZ - 54], size: [22, 12, 22], color: '#dde6ec' },
      { id: `${district.sectorId ?? district.clusterIndex}-support-link-left`, position: [-212, 10, baseZ + 126], size: [18, 10, 18], color: '#e1e9ef' },
      { id: `${district.sectorId ?? district.clusterIndex}-support-link-right`, position: [212, 10, baseZ + 114], size: [18, 10, 18], color: '#e1e9ef' },
      { id: `${district.sectorId ?? district.clusterIndex}-support-band-left`, position: [-288, 8, baseZ + 204], size: [52, 8, 24], color: '#e4ecf1' },
      { id: `${district.sectorId ?? district.clusterIndex}-support-band-right`, position: [288, 8, baseZ + 194], size: [52, 8, 24], color: '#e4ecf1' },
      { id: `${district.sectorId ?? district.clusterIndex}-support-gate-left`, position: [-412, 0, baseZ + 228], size: [20, 54, 18], color: '#d6e1e8' },
      { id: `${district.sectorId ?? district.clusterIndex}-support-gate-right`, position: [412, 0, baseZ + 216], size: [20, 54, 18], color: '#d6e1e8' },
      { id: `${district.sectorId ?? district.clusterIndex}-support-center-marker`, position: [0, 0, baseZ + 182], size: [10, 20, 10], color: '#eaf1f5' },
      { id: `${district.sectorId ?? district.clusterIndex}-support-transition-court-left`, position: [-214, 0, baseZ + 154], size: [26, 14, 22], color: '#e1e9ef' },
      { id: `${district.sectorId ?? district.clusterIndex}-support-transition-court-right`, position: [214, 0, baseZ + 144], size: [26, 14, 22], color: '#e1e9ef' },
    ] as CityMass[];
  });

  return filterStructuralCityMasses(
    filterReservedSponsorFrontageEntries(entries, boothPlacements, { frontDepth: 540, rearDepth: 220, sideWidth: 280, radius: 340 })
  );
}

export function buildMediaWallLandmarks(districtCount: number, districtStride: number): CityMass[] {
  const mediaWallMasses = Array.from({ length: Math.max(3, districtCount) }, (_, districtIndex) => {
    const baseZ = -214 - (districtIndex * districtStride);
    return [
      {
        id: `media-wall-left-${districtIndex}`,
        position: [-418, 0, baseZ - 72],
        size: [156, 252, 28],
        color: '#708492',
      },
      {
        id: `media-wall-right-${districtIndex}`,
        position: [418, 0, baseZ - 104],
        size: [156, 246, 28],
        color: '#708492',
      },
      {
        id: `media-wall-spine-left-${districtIndex}`,
        position: [-554, 0, baseZ + 102],
        size: [28, 164, 28],
        color: '#8da0ad',
      },
      {
        id: `media-wall-spine-right-${districtIndex}`,
        position: [554, 0, baseZ + 84],
        size: [28, 164, 28],
        color: '#8da0ad',
      },
      {
        id: `media-wall-buttress-left-${districtIndex}`,
        position: [-306, 0, baseZ + 32],
        size: [92, 74, 78],
        color: '#8fa2af',
      },
      {
        id: `media-wall-buttress-right-${districtIndex}`,
        position: [306, 0, baseZ + 12],
        size: [92, 74, 78],
        color: '#8fa2af',
      },
      {
        id: `media-wall-bridge-${districtIndex}`,
        position: [0, 0, baseZ + 128],
        size: [286, 10, 20],
        color: '#d7e2e9',
      },
      {
        id: `media-wall-plinth-${districtIndex}`,
        position: [0, 0, baseZ + 34],
        size: [184, 12, 54],
        color: '#d2dde5',
      },
      {
        id: `media-wall-node-left-${districtIndex}`,
        position: [-182, 0, baseZ + 112],
        size: [54, 48, 42],
        color: '#b3c1cb',
      },
      {
        id: `media-wall-node-right-${districtIndex}`,
        position: [182, 0, baseZ + 98],
        size: [54, 48, 42],
        color: '#b3c1cb',
      },
      {
        id: `media-wall-apron-${districtIndex}`,
        position: [0, 0, baseZ + 162],
        size: [224, 8, 34],
        color: '#e2eaf0',
      },
      {
        id: `media-wall-gallery-left-${districtIndex}`,
        position: [-118, 0, baseZ + 188],
        size: [42, 34, 20],
        color: '#c3d0d8',
      },
      {
        id: `media-wall-gallery-right-${districtIndex}`,
        position: [118, 0, baseZ + 174],
        size: [42, 34, 20],
        color: '#c3d0d8',
      },
      {
        id: `media-wall-rear-node-left-${districtIndex}`,
        position: [-246, 0, baseZ - 148],
        size: [38, 58, 24],
        color: '#afbec8',
      },
      {
        id: `media-wall-rear-node-right-${districtIndex}`,
        position: [246, 0, baseZ - 164],
        size: [38, 58, 24],
        color: '#afbec8',
      },
      {
        id: `media-wall-center-link-${districtIndex}`,
        position: [0, 0, baseZ - 38],
        size: [46, 10, 12],
        color: '#d8e3ea',
      },
      {
        id: `media-wall-front-node-left-${districtIndex}`,
        position: [-142, 0, baseZ + 238],
        size: [28, 32, 18],
        color: '#c4d0d8',
      },
      {
        id: `media-wall-front-node-right-${districtIndex}`,
        position: [142, 0, baseZ + 224],
        size: [28, 32, 18],
        color: '#c4d0d8',
      },
      {
        id: `media-wall-forecourt-band-${districtIndex}`,
        position: [0, 0, baseZ + 252],
        size: [112, 8, 18],
        color: '#e5edf2',
      },
      {
        id: `media-wall-flank-left-${districtIndex}`,
        position: [-398, 0, baseZ + 216],
        size: [42, 28, 18],
        color: '#c4d1d9',
      },
      {
        id: `media-wall-flank-right-${districtIndex}`,
        position: [398, 0, baseZ + 196],
        size: [42, 28, 18],
        color: '#c4d1d9',
      },
      {
        id: `media-wall-side-dais-left-${districtIndex}`,
        position: [-228, 0, baseZ + 262],
        size: [52, 10, 22],
        color: '#e3ebf0',
      },
      {
        id: `media-wall-side-dais-right-${districtIndex}`,
        position: [228, 0, baseZ + 248],
        size: [52, 10, 22],
        color: '#e3ebf0',
      },
      {
        id: `media-wall-outer-marker-left-${districtIndex}`,
        position: [-486, 0, baseZ + 186],
        size: [18, 72, 18],
        color: '#d8e3ea',
      },
      {
        id: `media-wall-outer-marker-right-${districtIndex}`,
        position: [486, 0, baseZ + 170],
        size: [18, 72, 18],
        color: '#d8e3ea',
      },
      {
        id: `media-wall-front-court-left-${districtIndex}`,
        position: [-286, 0, baseZ + 292],
        size: [56, 12, 22],
        color: '#edf3f7',
      },
      {
        id: `media-wall-front-court-right-${districtIndex}`,
        position: [286, 0, baseZ + 278],
        size: [56, 12, 22],
        color: '#edf3f7',
      },
      {
        id: `media-wall-front-threshold-center-${districtIndex}`,
        position: [0, 0, baseZ + 246],
        size: [12, 18, 10],
        color: '#edf4f8',
      },
      {
        id: `media-wall-front-threshold-left-${districtIndex}`,
        position: [-152, 0, baseZ + 254],
        size: [12, 20, 10],
        color: '#eef4f8',
      },
      {
        id: `media-wall-front-threshold-right-${districtIndex}`,
        position: [152, 0, baseZ + 244],
        size: [12, 20, 10],
        color: '#eef4f8',
      },
      {
        id: `media-wall-rear-court-left-${districtIndex}`,
        position: [-182, 0, baseZ - 212],
        size: [44, 14, 18],
        color: '#e3ebf0',
      },
      {
        id: `media-wall-rear-court-right-${districtIndex}`,
        position: [182, 0, baseZ - 226],
        size: [44, 14, 18],
        color: '#e3ebf0',
      },
    ] as CityMass[];
  }).flat();

  return filterStructuralCityMasses([
    ...mediaWallMasses,
    ...buildMediaWallScreenHostMasses(districtCount, districtStride),
  ]);
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function buildMediaWallScreenHostMasses(districtCount: number, districtStride: number): CityMass[] {
  return buildMediaWallSurfaces(districtCount, districtStride).map((surface) => {
    const yaw = surface.rotation[1] ?? 0;
    const isMarquee = surface.id.startsWith('screen-marquee-');
    const isSpine = surface.id.startsWith('screen-spine-');
    const backset = isMarquee ? 18 : isSpine ? 14 : 12;
    const hostTop = surface.position[1] + (surface.size[1] * 0.5) + (isMarquee ? 8 : 6);
    const hostWidth = Math.max(
      isMarquee ? 112 : isSpine ? 72 : 78,
      surface.size[0] * (isMarquee ? 0.72 : isSpine ? 0.6 : 0.64),
    );

    return {
      id: `${surface.id}-host`,
      position: [
        round1(surface.position[0] - (Math.sin(yaw) * backset)),
        0,
        round1(surface.position[2] - (Math.cos(yaw) * backset)),
      ],
      size: [
        round1(hostWidth),
        round1(Math.max(surface.size[1] + (isMarquee ? 58 : isSpine ? 46 : 34), hostTop)),
        round1(Math.max(24, surface.size[2] * 7.2)),
      ],
      color: isSpine ? '#7c909e' : isMarquee ? '#718795' : '#8294a0',
    } as CityMass;
  });
}

export function buildMediaWallSurfaces(districtCount: number, districtStride: number): CityScreenSurface[] {
  const paletteByDistrict = [
    { heroLeft: '#7dd3fc', heroRight: '#fbbf24', supportLeft: '#a78bfa', supportRight: '#67e8f9', spine: '#93c5fd' },
    { heroLeft: '#93c5fd', heroRight: '#fb7185', supportLeft: '#67e8f9', supportRight: '#fde68a', spine: '#c4b5fd' },
    { heroLeft: '#67e8f9', heroRight: '#c084fc', supportLeft: '#93c5fd', supportRight: '#fca5a5', spine: '#7dd3fc' },
  ] as const;

  const inwardYawLeft = 0.78;
  const inwardYawRight = -0.78;
  const flankYawLeft = 1.08;
  const flankYawRight = -1.08;

  return Array.from({ length: Math.max(3, districtCount) }, (_, districtIndex) => {
    const baseZ = -214 - (districtIndex * districtStride);
    const palette = paletteByDistrict[districtIndex % paletteByDistrict.length];

    return [
      {
        id: `screen-marquee-left-${districtIndex}`,
        position: [-708, 148, baseZ - 82],
        rotation: [0, inwardYawLeft, 0],
        size: [156, 184, 3.4],
        color: '#08111c',
        glowColor: palette.heroLeft,
        role: 'hero-wall' as const,
        type: 'wall' as const,
      },
      {
        id: `screen-marquee-right-${districtIndex}`,
        position: [708, 144, baseZ - 114],
        rotation: [0, inwardYawRight, 0],
        size: [150, 178, 3.4],
        color: '#091320',
        glowColor: palette.heroRight,
        role: 'hero-wall' as const,
        type: 'wall' as const,
      },
      {
        id: `screen-array-left-${districtIndex}`,
        position: [-968, 98, baseZ + 104],
        rotation: [0, flankYawLeft, 0],
        size: [126, 122, 2.8],
        color: '#091320',
        glowColor: palette.supportLeft,
        role: 'support-wall' as const,
        type: 'wall' as const,
      },
      {
        id: `screen-array-left-upper-${districtIndex}`,
        position: [-842, 142, baseZ - 18],
        rotation: [0, inwardYawLeft, 0],
        size: [104, 116, 2.8],
        color: '#091320',
        glowColor: palette.supportLeft,
        role: 'support-wall' as const,
        type: 'wall' as const,
      },
      {
        id: `screen-array-right-${districtIndex}`,
        position: [968, 94, baseZ + 86],
        rotation: [0, flankYawRight, 0],
        size: [126, 122, 2.8],
        color: '#091320',
        glowColor: palette.supportRight,
        role: 'support-wall' as const,
        type: 'wall' as const,
      },
      {
        id: `screen-array-right-upper-${districtIndex}`,
        position: [842, 138, baseZ - 44],
        rotation: [0, inwardYawRight, 0],
        size: [104, 116, 2.8],
        color: '#091320',
        glowColor: palette.supportRight,
        role: 'support-wall' as const,
        type: 'wall' as const,
      },
      {
        id: `screen-spine-primary-${districtIndex}`,
        position: [-184, 108, baseZ - 34],
        rotation: [0, inwardYawLeft, 0],
        size: [118, 136, 2.8],
        color: '#091320',
        glowColor: palette.spine,
        role: 'support-wall' as const,
        type: 'wall' as const,
      },
      {
        id: `screen-spine-secondary-${districtIndex}`,
        position: [184, 116, baseZ + 84],
        rotation: [0, inwardYawRight, 0],
        size: [104, 118, 2.6],
        color: '#0a1420',
        glowColor: palette.spine,
        role: 'support-wall' as const,
        type: 'wall' as const,
      },
    ] satisfies CityScreenSurface[];
  }).flat();
}

export function buildDiscoveryEdgeBlocks(districtCount: number, districtStride: number): CityMass[] {
  const endBaseZ = -196 - ((Math.max(1, districtCount) - 1) * districtStride) - 860;
  return filterStructuralCityMasses([
    { id: 'discovery-anchor-left', position: [-764, 64, endBaseZ + 42], size: [96, 108, 82], color: '#81919d' },
    { id: 'discovery-anchor-right', position: [764, 68, endBaseZ - 8], size: [96, 116, 82], color: '#8394a0' },
    { id: 'discovery-hero-plinth-left', position: [-198, 18, endBaseZ - 122], size: [78, 24, 42], color: '#94a6b2' },
    { id: 'discovery-hero-plinth-right', position: [198, 18, endBaseZ - 136], size: [78, 24, 42], color: '#94a6b2' },
    { id: 'discovery-axis-plinth', position: [0, 14, endBaseZ + 64], size: [168, 18, 38], color: '#cfdbe3' },
    { id: 'discovery-overlook-left', position: [-326, 0, endBaseZ + 146], size: [74, 16, 36], color: '#d6e1e8' },
    { id: 'discovery-overlook-right', position: [326, 0, endBaseZ + 128], size: [74, 16, 36], color: '#d6e1e8' },
    ] as CityMass[]);
}

export function buildSupportEdgeBlocks(districtCount: number, districtStride: number): CityMass[] {
  return filterStructuralCityMasses(Array.from({ length: Math.max(3, districtCount) }, (_, districtIndex) => {
    const baseZ = -244 - (districtIndex * districtStride);
    return [
      { id: `support-edge-left-${districtIndex}`, position: [-1048, 0, baseZ - 64], size: [74, 58, 88], color: '#97a7b2' },
      { id: `support-edge-right-${districtIndex}`, position: [1048, 0, baseZ - 92], size: [78, 62, 92], color: '#9aabb6' },
      { id: `support-edge-node-left-${districtIndex}`, position: [-884, 0, baseZ + 44], size: [44, 22, 36], color: '#d8e2e9' },
      { id: `support-edge-node-right-${districtIndex}`, position: [884, 0, baseZ + 28], size: [44, 22, 36], color: '#d8e2e9' },
      { id: `support-edge-rear-link-left-${districtIndex}`, position: [-962, 0, baseZ + 126], size: [24, 18, 24], color: '#dbe4ea' },
      { id: `support-edge-rear-link-right-${districtIndex}`, position: [962, 0, baseZ + 112], size: [24, 18, 24], color: '#dbe4ea' },
      { id: `support-edge-outer-band-left-${districtIndex}`, position: [-1114, 0, baseZ + 18], size: [42, 12, 24], color: '#e2eaf0' },
      { id: `support-edge-outer-band-right-${districtIndex}`, position: [1114, 0, baseZ + 2], size: [42, 12, 24], color: '#e2eaf0' },
      { id: `support-edge-mid-link-left-${districtIndex}`, position: [-1036, 0, baseZ + 186], size: [22, 22, 18], color: '#e8eff4' },
      { id: `support-edge-mid-link-right-${districtIndex}`, position: [1036, 0, baseZ + 170], size: [22, 22, 18], color: '#e8eff4' },
    ] as CityMass[];
  }).flat());
}

export function buildDiscoveryLandmarks(districtCount: number, districtStride: number): CityMass[] {
  const endBaseZ = -196 - ((Math.max(1, districtCount) - 1) * districtStride) - 980;
  return filterStructuralCityMasses([
    { id: 'discovery-spire-main', position: [0, 0, endBaseZ], size: [74, 318, 74], color: '#6f8594' },
    { id: 'discovery-spire-cap', position: [0, 0, endBaseZ], size: [28, 86, 28], color: '#c3d0d8' },
    { id: 'discovery-spire-collar', position: [0, 0, endBaseZ + 16], size: [118, 14, 28], color: '#d6e0e7' },
    { id: 'discovery-flank-left', position: [-264, 0, endBaseZ + 104], size: [48, 72, 34], color: '#8da0ad' },
    { id: 'discovery-flank-right', position: [264, 0, endBaseZ + 84], size: [48, 78, 34], color: '#8da0ad' },
    { id: 'discovery-rear-link-left', position: [-112, 0, endBaseZ - 54], size: [18, 58, 18], color: '#d8e3ea' },
    { id: 'discovery-rear-link-right', position: [112, 0, endBaseZ - 62], size: [18, 58, 18], color: '#d8e3ea' },
    { id: 'discovery-front-threshold-center', position: [0, 0, endBaseZ + 156], size: [12, 24, 10], color: '#edf4f8' },
    { id: 'discovery-front-court-left', position: [-156, 0, endBaseZ + 182], size: [44, 12, 18], color: '#eef4f8' },
    { id: 'discovery-front-court-right', position: [156, 0, endBaseZ + 174], size: [44, 12, 18], color: '#eef4f8' },
  ] as CityMass[]);
}

export function buildDiscoverySupportTerraces(districtCount: number, districtStride: number): CityMass[] {
  const endBaseZ = -196 - ((Math.max(1, districtCount) - 1) * districtStride) - 860;
  return filterStructuralCityMasses([
    { id: 'discovery-terrace-left', position: [-418, 0, endBaseZ + 198], size: [126, 38, 92], color: '#a4b5c0' },
    { id: 'discovery-terrace-right', position: [418, 0, endBaseZ + 174], size: [126, 42, 92], color: '#a4b5c0' },
    { id: 'discovery-terrace-center', position: [0, 0, endBaseZ + 148], size: [212, 18, 72], color: '#c7d3db' },
    { id: 'discovery-terrace-center-step', position: [0, 0, endBaseZ + 196], size: [128, 10, 28], color: '#dde6ec' },
    { id: 'discovery-viewing-step-left', position: [-148, 0, endBaseZ + 228], size: [92, 10, 32], color: '#d3dee6' },
    { id: 'discovery-viewing-step-right', position: [148, 0, endBaseZ + 214], size: [92, 10, 32], color: '#d3dee6' },
    { id: 'discovery-approach-plinth', position: [0, 0, endBaseZ + 262], size: [188, 8, 40], color: '#e0e8ed' },
    { id: 'discovery-side-node-left', position: [-264, 0, endBaseZ + 264], size: [54, 18, 28], color: '#d8e2e9' },
    { id: 'discovery-side-node-right', position: [264, 0, endBaseZ + 248], size: [54, 18, 28], color: '#d8e2e9' },
    { id: 'discovery-overlook-band-left', position: [-188, 0, endBaseZ + 312], size: [72, 8, 22], color: '#e3ebf0' },
    { id: 'discovery-overlook-band-right', position: [188, 0, endBaseZ + 300], size: [72, 8, 22], color: '#e3ebf0' },
    { id: 'discovery-overlook-anchor-left', position: [-312, 0, endBaseZ + 338], size: [36, 46, 20], color: '#c4d0d8' },
    { id: 'discovery-overlook-anchor-right', position: [312, 0, endBaseZ + 322], size: [36, 46, 20], color: '#c4d0d8' },
    { id: 'discovery-overlook-center-band', position: [0, 0, endBaseZ + 326], size: [96, 10, 20], color: '#e7eef3' },
    { id: 'discovery-inner-step-left', position: [-88, 0, endBaseZ + 286], size: [48, 8, 20], color: '#e5edf2' },
    { id: 'discovery-inner-step-right', position: [88, 0, endBaseZ + 278], size: [48, 8, 20], color: '#e5edf2' },
    { id: 'discovery-outer-platform-left', position: [-412, 0, endBaseZ + 362], size: [72, 12, 26], color: '#dde6ec' },
    { id: 'discovery-outer-platform-right', position: [412, 0, endBaseZ + 346], size: [72, 12, 26], color: '#dde6ec' },
  ] as CityMass[]);
}

export function buildDiscoveryObservatory(districtCount: number, districtStride: number): CityMass[] {
  const endBaseZ = -196 - ((Math.max(1, districtCount) - 1) * districtStride) - 1080;
  return filterStructuralCityMasses([
    { id: 'discovery-observatory-plinth', position: [0, 0, endBaseZ + 86], size: [188, 16, 62], color: '#d9e2e8' },
    { id: 'discovery-observatory-neck', position: [0, 0, endBaseZ + 36], size: [28, 96, 28], color: '#8fa2af' },
    { id: 'discovery-observatory-deck', position: [0, 0, endBaseZ], size: [148, 12, 30], color: '#c6d2da' },
    { id: 'discovery-observatory-wing-left', position: [-142, 0, endBaseZ + 38], size: [52, 18, 20], color: '#d3dee6' },
    { id: 'discovery-observatory-wing-right', position: [142, 0, endBaseZ + 32], size: [52, 18, 20], color: '#d3dee6' },
    { id: 'discovery-observatory-beacon-left', position: [-84, 0, endBaseZ + 62], size: [14, 62, 14], color: '#d8e2e9' },
    { id: 'discovery-observatory-beacon-right', position: [84, 0, endBaseZ + 58], size: [14, 62, 14], color: '#d8e2e9' },
    { id: 'discovery-observatory-rear-band', position: [0, 0, endBaseZ - 42], size: [194, 10, 18], color: '#e3ebf0' },
    { id: 'discovery-observatory-side-left', position: [-188, 0, endBaseZ + 12], size: [28, 54, 18], color: '#c8d4dc' },
    { id: 'discovery-observatory-side-right', position: [188, 0, endBaseZ + 4], size: [28, 54, 18], color: '#c8d4dc' },
    { id: 'discovery-observatory-front-pad', position: [0, 0, endBaseZ + 144], size: [42, 8, 14], color: '#edf3f7' },
    { id: 'discovery-observatory-rear-anchor-left', position: [-94, 0, endBaseZ - 74], size: [18, 40, 16], color: '#dce5eb' },
    { id: 'discovery-observatory-rear-anchor-right', position: [94, 0, endBaseZ - 80], size: [18, 40, 16], color: '#dce5eb' },
  ] as CityMass[]);
}

export function buildCivicWaterCourt(): CityPlane[] {
  return [
    { id: 'arrival-water-court-main', position: [0, 0.026, -6], size: [118, 228], color: '#9fd3e7' },
    { id: 'arrival-water-court-left', position: [-182, 0.026, 22], size: [52, 126], color: '#9fd3e7' },
    { id: 'arrival-water-court-right', position: [182, 0.026, 12], size: [52, 126], color: '#9fd3e7' },
  ] as CityPlane[];
}

export function buildSignatureMegaLandmarks(districtCount: number, districtStride: number): CityMass[] {
  const signatureDistrictIndex = Math.min(1, Math.max(0, districtCount - 1));
  const boulevardCenterZ = -196 - (signatureDistrictIndex * districtStride) - 122;
  return filterStructuralCityMasses([
    { id: 'signature-mega-front-court', position: [0, 0, boulevardCenterZ - 72], size: [112, 8, 22], color: '#e5edf2' },
    { id: 'signature-mega-pylon-left', position: [-694, 0, boulevardCenterZ + 26], size: [48, 246, 48], color: '#748998' },
    { id: 'signature-mega-pylon-right', position: [694, 0, boulevardCenterZ - 18], size: [48, 238, 48], color: '#748998' },
    { id: 'signature-mega-center-beacon', position: [0, 0, boulevardCenterZ - 226], size: [24, 118, 24], color: '#b6c5ce' },
    { id: 'signature-mega-dais-left', position: [-162, 0, boulevardCenterZ - 176], size: [62, 12, 28], color: '#dbe4ea' },
    { id: 'signature-mega-dais-right', position: [162, 0, boulevardCenterZ - 190], size: [62, 12, 28], color: '#dbe4ea' },
    { id: 'signature-mega-outer-node-left', position: [-286, 0, boulevardCenterZ - 148], size: [26, 54, 20], color: '#d6e0e7' },
    { id: 'signature-mega-outer-node-right', position: [286, 0, boulevardCenterZ - 162], size: [26, 54, 20], color: '#d6e0e7' },
  ] as CityMass[]);
}

export function buildDiscoverySkybridge(districtCount: number, districtStride: number): CityMass[] {
  const endBaseZ = -196 - ((Math.max(1, districtCount) - 1) * districtStride) - 900;
  return filterStructuralCityMasses([
    { id: 'discovery-skybridge-left-pylon', position: [-438, 0, endBaseZ + 48], size: [34, 138, 34], color: '#7c92a1' },
    { id: 'discovery-skybridge-right-pylon', position: [438, 0, endBaseZ + 20], size: [34, 138, 34], color: '#7c92a1' },
    { id: 'discovery-skybridge-span', position: [0, 0, endBaseZ + 34], size: [436, 16, 24], color: '#c4d1d9' },
    { id: 'discovery-skybridge-anchor-left', position: [-552, 0, endBaseZ + 84], size: [28, 58, 22], color: '#d6e1e8' },
    { id: 'discovery-skybridge-anchor-right', position: [552, 0, endBaseZ + 58], size: [28, 58, 22], color: '#d6e1e8' },
    ] as CityMass[]);
}

export function buildCleanTowerLandmarks(
  districtPrograms: ExpoDistrictProgramSummary[],
  boothPlacements: ExpoBoothPlacement[],
  districtStride: number,
  visualProfile: Pick<ExpoWorldVisualProfile, 'global'>
): CityTower[] {
  const entries: CityTower[] = districtPrograms.slice(0, Math.max(3, districtPrograms.length)).flatMap((district, districtIndex) => {
    const baseZ = -196 - (districtIndex * districtStride);
    return [
      { id: `${district.sectorId ?? district.clusterIndex}-hero-tower-left`, position: [-548, 106, baseZ - 306], baseSize: [48, 224, 36], upperSize: [34, 94, 26], color: '#617583', crownColor: visualProfile.global.hudAccent, role: 'hero', composition: 'hero' },
      { id: `${district.sectorId ?? district.clusterIndex}-hero-tower-right`, position: [548, 116, baseZ - 348], baseSize: [54, 242, 40], upperSize: [38, 104, 28], color: '#647887', crownColor: visualProfile.global.hudAccent, role: 'hero', composition: 'hero' },
      { id: `${district.sectorId ?? district.clusterIndex}-mid-tower-left`, position: [-298, 78, baseZ - 74], baseSize: [32, 156, 24], upperSize: [24, 60, 18], color: '#718391', crownColor: '#d7e2ea', role: 'mid', composition: 'standard' },
      { id: `${district.sectorId ?? district.clusterIndex}-mid-tower-right`, position: [298, 74, baseZ - 112], baseSize: [32, 152, 24], upperSize: [24, 56, 18], color: '#718391', crownColor: '#d7e2ea', role: 'mid', composition: 'standard' },
      { id: `${district.sectorId ?? district.clusterIndex}-support-tower-left`, position: [-422, 54, baseZ + 62], baseSize: [24, 104, 18], upperSize: [18, 34, 14], color: '#7e909c', crownColor: '#d7e2ea', role: 'support', composition: 'minimal' },
      { id: `${district.sectorId ?? district.clusterIndex}-support-tower-right`, position: [422, 52, baseZ + 48], baseSize: [24, 98, 18], upperSize: [18, 32, 14], color: '#7e909c', crownColor: '#d7e2ea', role: 'support', composition: 'minimal' },
      { id: `${district.sectorId ?? district.clusterIndex}-outer-support-tower-left`, position: [-708, 44, baseZ - 42], baseSize: [20, 86, 16], upperSize: [14, 26, 12], color: '#8798a4', crownColor: '#dfe8ee', role: 'outer-support', composition: 'minimal' },
      { id: `${district.sectorId ?? district.clusterIndex}-outer-support-tower-right`, position: [708, 42, baseZ - 58], baseSize: [20, 82, 16], upperSize: [14, 24, 12], color: '#8798a4', crownColor: '#dfe8ee', role: 'outer-support', composition: 'minimal' },
    ] as CityTower[];
  });

  return filterReservedSponsorFrontageEntries(entries, boothPlacements, { frontDepth: 620, rearDepth: 260, sideWidth: 300, radius: 420 });
}

export function buildTowerScreenSurfaces(towers: CityTower[]): CityScreenSurface[] {
  return towers.flatMap((tower) => {
    const isHeroTower = tower.role === 'hero';
    const isMidTower = tower.role === 'mid';
    const isSupportTower = tower.role === 'support';
    const isLeftSide = tower.position[0] < 0;

    if (!isHeroTower && !isMidTower && !isSupportTower) {
      return [];
    }

    const yaw = isLeftSide ? 0.86 : -0.86;
    const offsetAlongYaw = (distance: number): [number, number] => ([
      Math.sin(yaw) * distance,
      Math.cos(yaw) * distance,
    ]);
    const [heroRibbonOffsetX, heroRibbonOffsetZ] = offsetAlongYaw(isHeroTower ? 38.5 : isMidTower ? 22.4 : 11.4);
    const [crownOffsetX, crownOffsetZ] = offsetAlongYaw(isHeroTower ? 18.8 : isMidTower ? 10.8 : 6.1);
    const [supportOffsetX, supportOffsetZ] = offsetAlongYaw(tower.role === 'outer-support' ? 3.6 : 4.1);
    const ribbonSurface: CityScreenSurface = {
      id: `${tower.id}-tower-ribbon`,
      position: [
        tower.position[0] + heroRibbonOffsetX,
        tower.position[1] + (tower.baseSize[1] * (isHeroTower ? 0.12 : 0.08)),
        tower.position[2] + heroRibbonOffsetZ,
      ],
      rotation: [0, yaw, 0],
      size: [
        isHeroTower ? 44 : 38,
        isHeroTower ? 104 : 92,
        2,
      ],
      color: '#091320',
      glowColor: isHeroTower ? tower.crownColor : '#7dd3fc',
      role: 'tower-side',
      type: 'tower-side',
    };

    const crownBeaconSurface = isHeroTower
      ? {
          id: `${tower.id}-crown-beacon`,
          position: [
            tower.position[0] + crownOffsetX,
            tower.position[1] + tower.baseSize[1] + (tower.upperSize[1] * 0.72),
            tower.position[2] + crownOffsetZ,
          ],
          rotation: [0, yaw, 0],
          size: [26, 34, 1.8],
          color: '#0b1421',
          glowColor: tower.crownColor,
          role: 'tower-crown' as const,
          type: 'tower-crown' as const,
        } satisfies CityScreenSurface
      : isMidTower
        ? {
            id: `${tower.id}-crown-beacon`,
            position: [
              tower.position[0] + crownOffsetX,
              tower.position[1] + tower.baseSize[1] + (tower.upperSize[1] * 0.7),
              tower.position[2] + crownOffsetZ,
            ],
            rotation: [0, yaw, 0],
            size: [20, 24, 1.7],
            color: '#0b1421',
            glowColor: '#93c5fd',
            role: 'tower-crown' as const,
            type: 'tower-crown' as const,
          } satisfies CityScreenSurface
        : null;

    const supportRibbonSurface: CityScreenSurface | null = isSupportTower
      ? {
          id: `${tower.id}-tower-ribbon`,
          position: [
            tower.position[0] + supportOffsetX,
            tower.position[1] + (tower.baseSize[1] * 0.14),
            tower.position[2] + supportOffsetZ,
          ],
          rotation: [0, yaw, 0],
          size: [
            tower.role === 'outer-support' ? 16 : 20,
            tower.role === 'outer-support' ? 36 : 48,
            1.9,
          ],
          color: '#0a1420',
          glowColor: '#bfdbfe',
          role: 'tower-side' as const,
          type: 'tower-side' as const,
        } satisfies CityScreenSurface
      : null;

    if (isSupportTower) {
      return supportRibbonSurface ? [supportRibbonSurface] : [];
    }

    return crownBeaconSurface ? [ribbonSurface, crownBeaconSurface] : [ribbonSurface];
  });
}

export function buildScreenSockets(surfaces: CityScreenSurface[]): CityScreenSocket[] {
  const offsetAlongYaw = (yaw: number, depthOffset: number): [number, number, number] => ([
    Math.sin(yaw) * depthOffset,
    0,
    Math.cos(yaw) * depthOffset,
  ]);

  const getSurfaceHousingDepth = (surface: CityScreenSurface) => (
    surface.renderIntent?.housingDepth
    ?? (
      surface.role === 'hero-wall'
        ? Math.max(10, surface.size[2] * 4.2)
        : surface.role === 'support-wall'
          ? Math.max(8, surface.size[2] * 3.5)
          : surface.role === 'tower-crown'
            ? Math.max(4.8, surface.size[2] * 2.2)
            : Math.max(4.4, surface.size[2] * 2.1)
    )
  );

  const getSocketAnchorDepth = (surface: CityScreenSurface) => {
    const housingDepth = getSurfaceHousingDepth(surface);
    const isRearCampusSurface = surface.id.startsWith('rear-campus-');

    if (surface.role === 'hero-wall') {
      return isRearCampusSurface ? housingDepth * 0.3 : housingDepth * 0.42;
    }

    if (surface.role === 'support-wall') {
      return isRearCampusSurface ? housingDepth * 0.26 : housingDepth * 0.4;
    }

    if (surface.role === 'tower-crown') {
      return housingDepth * 0.28;
    }

    return housingDepth * 0.3;
  };

  return surfaces.map((surface) => {
    const depthOffset = getSocketAnchorDepth(surface);
    const yaw = surface.rotation[1] ?? 0;
    const [offsetX, offsetY, offsetZ] = offsetAlongYaw(yaw, depthOffset);

    if (surface.role === 'hero-wall') {
      return {
        color: surface.glowColor,
        frameSize: surface.id.startsWith('rear-campus-')
          ? [surface.size[0] * 0.94, surface.size[1] * 0.92]
          : [surface.size[0] * 0.86, surface.size[1] * 0.84],
        id: `${surface.id}-socket`,
        kind: 'hero_wall',
        position: [surface.position[0] + offsetX, surface.position[1] + offsetY, surface.position[2] + offsetZ],
        rotation: surface.rotation,
        surfaceId: surface.id,
      } satisfies CityScreenSocket;
    }

    if (surface.role === 'support-wall') {
      return {
        color: surface.glowColor,
        frameSize: surface.id.startsWith('rear-campus-')
          ? [surface.size[0] * 0.9, surface.size[1] * 0.88]
          : [surface.size[0] * 0.8, surface.size[1] * 0.78],
        id: `${surface.id}-socket`,
        kind: 'wall',
        position: [surface.position[0] + offsetX, surface.position[1] + offsetY, surface.position[2] + offsetZ],
        rotation: surface.rotation,
        surfaceId: surface.id,
      } satisfies CityScreenSocket;
    }

    if (surface.role === 'tower-crown') {
      return {
        color: surface.glowColor,
        frameSize: [surface.size[0] * 0.78, surface.size[1] * 0.74],
        id: `${surface.id}-socket`,
        kind: 'tower_crown',
        position: [surface.position[0] + offsetX, surface.position[1] + offsetY, surface.position[2] + offsetZ],
        rotation: surface.rotation,
        surfaceId: surface.id,
      } satisfies CityScreenSocket;
    }

    return {
      color: surface.glowColor,
      frameSize: [surface.size[0] * 0.72, surface.size[1] * 0.72],
      id: `${surface.id}-socket`,
      kind: 'tower_side',
      position: [surface.position[0] + offsetX, surface.position[1] + offsetY, surface.position[2] + offsetZ],
      rotation: surface.rotation,
      surfaceId: surface.id,
    } satisfies CityScreenSocket;
  });
}

function getPlacementTier(placement: ExpoBoothPlacement) {
  const sponsorTier = String(placement.company?.sponsorTier || placement.sponsorTier || '').toLowerCase();

  if (placement.boothType === 'hero' || sponsorTier === 'hero') {
    return 'hero' as const;
  }

  if (sponsorTier === 'platinum' || sponsorTier === 'elite') {
    return 'elite' as const;
  }

  if (sponsorTier === 'gold' || sponsorTier === 'premium') {
    return 'premium' as const;
  }

  return null;
}

function rankPlacementForScreens(placement: ExpoBoothPlacement) {
  const tier = getPlacementTier(placement);
  const tierWeight = tier === 'hero' ? 4 : tier === 'elite' ? 3 : tier === 'premium' ? 2 : 0;
  const priority = Number(placement.priority || 0);
  return (tierWeight * 1000) + priority;
}

function pickDistributedSockets(sockets: CityScreenSocket[], targetCount: number) {
  if (targetCount <= 0 || sockets.length === 0) {
    return [] as CityScreenSocket[];
  }

  const sorted = [...sockets].sort((left, right) => left.position[2] - right.position[2]);
  if (targetCount >= sorted.length) {
    return sorted;
  }

  const picks: CityScreenSocket[] = [];
  const used = new Set<number>();

  for (let index = 0; index < targetCount; index += 1) {
    const ratio = targetCount === 1 ? 0.5 : index / (targetCount - 1);
    const desired = Math.round(ratio * (sorted.length - 1));
    let resolved = desired;

    while (used.has(resolved) && resolved < sorted.length - 1) {
      resolved += 1;
    }
    while (used.has(resolved) && resolved > 0) {
      resolved -= 1;
    }

    if (!used.has(resolved)) {
      used.add(resolved);
      picks.push(sorted[resolved]);
    }
  }

  return picks;
}

export function buildScreenAssignments(
  boothPlacements: ExpoBoothPlacement[],
  sockets: CityScreenSocket[],
): CityScreenAssignment[] {
  const rankedPlacements = [...boothPlacements]
    .filter((placement) => getPlacementTier(placement) !== null)
    .sort((left, right) => rankPlacementForScreens(right) - rankPlacementForScreens(left));

  const heroPlacements = rankedPlacements.filter((placement) => getPlacementTier(placement) === 'hero');
  const elitePlacements = rankedPlacements.filter((placement) => getPlacementTier(placement) === 'elite');
  const premiumPlacements = rankedPlacements.filter((placement) => getPlacementTier(placement) === 'premium');

  const heroSockets = sockets.filter((socket) => socket.kind === 'hero_wall');
  const wallSockets = sockets.filter((socket) => socket.kind === 'wall');
  const towerRibbonSockets = sockets.filter((socket) => socket.kind === 'tower_side');

  const assignments: CityScreenAssignment[] = [];
  const usedSocketIds = new Set<string>();

  const assignFromQueue = (
    queue: ExpoBoothPlacement[],
    targetSockets: CityScreenSocket[],
    fallbackTier: 'elite' | 'hero' | 'premium'
  ) => {
    targetSockets.forEach((socket, index) => {
      if (usedSocketIds.has(socket.id)) {
        return;
      }

      const placement = queue[index % Math.max(1, queue.length)] ?? null;
      if (!placement) {
        return;
      }

      const tier = getPlacementTier(placement) ?? fallbackTier;
      assignments.push({
        accentColor: placement.color,
        companyId: placement.company?.id ?? null,
        id: `${socket.id}-assignment`,
        imageUrl: placement.company?.posterUrl || placement.company?.heroAssetUrl || placement.company?.logo_url || null,
        label: placement.company?.name || placement.sectorName || 'Sponsor',
        socketId: socket.id,
        subtitle: placement.company?.tagline || placement.sectorName || 'Expo partner',
        tier,
      });
      usedSocketIds.add(socket.id);
    });
  };

  const distributedHeroWalls = pickDistributedSockets(heroSockets, Math.min(heroSockets.length, Math.max(4, heroPlacements.length || 4)));
  const distributedWallArrays = pickDistributedSockets(wallSockets, Math.min(wallSockets.length, Math.max(6, premiumPlacements.length || 6)));
  const distributedTowerRibbons = pickDistributedSockets(towerRibbonSockets, Math.min(towerRibbonSockets.length, Math.max(8, elitePlacements.length + heroPlacements.length || 8)));

  assignFromQueue(heroPlacements.length > 0 ? heroPlacements : elitePlacements, distributedHeroWalls, 'hero');
  assignFromQueue(
    elitePlacements.length > 0 ? [...elitePlacements, ...heroPlacements] : heroPlacements,
    distributedTowerRibbons,
    'elite'
  );
  assignFromQueue(premiumPlacements.length > 0 ? [...premiumPlacements, ...elitePlacements] : elitePlacements, distributedWallArrays, 'premium');

  return assignments;
}
