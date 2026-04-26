import {
  buildArrivalGatewayBlocks,
  buildArrivalPlanes,
  buildBoothForecourtPlanes,
  buildBoulevardEdgeBlocks,
  buildCleanTowerLandmarks,
  buildDiscoveryEdgeBlocks,
  buildDiscoveryLandmarks,
  buildDiscoveryObservatory,
  buildDiscoverySkybridge,
  buildDiscoverySupportTerraces,
  buildMediaWallLandmarks,
  buildPromenadeAxisPlanes,
  buildRightSupportBlocks,
  buildShowcaseMonuments,
  buildShowcasePlazas,
  buildSignatureMegaLandmarks,
  buildSupportEdgeBlocks,
  getWorldCityStadiumReserve,
} from '../legacy/worldCityGeometry';
import { flattenZoneScreenAssignments } from '../screens/buildScreenAssignmentPlan';
import { flattenZoneScreenSockets } from '../screens/buildScreenSocketPlan';
import { flattenZoneScreenSurfaces } from '../screens/buildScreenSurfacePlan';
import type {
  CanonicalWorldPlan,
  CityMass,
  CityPlane,
  CityScreenSocket,
  CityScreenSurface,
  CityTower,
  ExpoPlanningSectionId,
  ExpoPlanningInputs,
  ExpoPlanningZoneId,
  ExpoPlanningZonePlan,
  ExpoZonePlannerContext,
} from '../types';
import { buildArrivalZonePlan } from '../zones/arrival';
import { buildCenterSpineZonePlan } from '../zones/center-spine';
import { buildLeftDistrictZonePlan } from '../zones/left-district';
import { buildRearCampusZonePlan } from '../zones/rear-campus';
import { buildRightDistrictZonePlan } from '../zones/right-district';
import { buildTowerClusterZonePlan } from '../zones/tower-cluster';

const NON_RENDERABLE_MASS_IDS = new Set([
  'arrival-gateway-lintel',
  'arrival-gateway-node-left',
  'arrival-gateway-node-right',
  'arrival-gateway-rear-band',
  'arrival-gateway-beacon-right',
  'arrival-gateway-mid-plinth',
  'arrival-gateway-outer-left',
  'arrival-gateway-outer-right',
  'arrival-gateway-front-left',
  'arrival-gateway-front-right',
  'arrival-gateway-inner-left',
  'arrival-gateway-inner-right',
  'arrival-gateway-left',
  'arrival-gateway-right',
  'arrival-core-showcase-rear-pylon-left',
  'arrival-core-showcase-rear-pylon-right',
  'arrival-core-showcase-outer-marker-left',
  'arrival-core-support-band-left',
  'arrival-core-support-band-right',
  'arrival-core-support-center-marker',
  'arrival-gateway-beacon-left',
  'arrival-core-center-transition-left',
  'arrival-core-center-transition-right',
]);

const NON_RENDERABLE_MASS_PATTERNS = [
  'support-gate-',
  'support-band-',
  'center-transition-',
  'showcase-outer-marker-',
  'showcase-rear-pylon-',
  'showcase-threshold-',
  'side-dais-',
  'front-court-',
  'rear-court-',
  'rear-node-',
  'mid-node-',
  'threshold-',
  'outer-platform-',
  'overlook-anchor-',
  'hero-plinth-',
  'skybridge-anchor-',
  'skybridge-left-pylon',
  'skybridge-right-pylon',
];

const NON_RENDERABLE_PLANE_PATTERNS = [
  'center-carpet',
  'front-carpet',
  'inner-carpet',
  'terminal-',
  'threshold-',
  'outer-pocket-',
  'pocket-',
  'ribbon-',
  'endcap',
  'gallery-',
  'front-court-',
  'axis-pad-',
  'side-band-',
];

function buildGeometryPools(inputs: ExpoPlanningInputs) {
  const districtCount = inputs.districtPrograms.length;

  return {
    arrivalPlanes: buildArrivalPlanes(),
    arrivalGatewayMasses: buildArrivalGatewayBlocks(),
    boothForecourtPlanes: buildBoothForecourtPlanes(inputs.districtPrograms, inputs.boothPlacements, inputs.districtStride),
    boulevardEdgeMasses: buildBoulevardEdgeBlocks(districtCount, inputs.districtStride),
    discoveryEdgeMasses: buildDiscoveryEdgeBlocks(districtCount, inputs.districtStride),
    discoveryLandmarkMasses: buildDiscoveryLandmarks(districtCount, inputs.districtStride),
    discoverySupportMasses: buildDiscoverySupportTerraces(districtCount, inputs.districtStride),
    mediaWallMasses: buildMediaWallLandmarks(districtCount, inputs.districtStride),
    observatoryMasses: buildDiscoveryObservatory(districtCount, inputs.districtStride),
    promenadeAxisPlanes: buildPromenadeAxisPlanes(districtCount, inputs.districtStride),
    rightSupportMasses: buildRightSupportBlocks(inputs.districtPrograms, inputs.boothPlacements, inputs.districtStride),
    showcaseMasses: buildShowcaseMonuments(inputs.districtPrograms, inputs.districtStride),
    showcasePlazas: buildShowcasePlazas(inputs.districtPrograms, inputs.boothPlacements, inputs.districtStride),
    signatureMasses: buildSignatureMegaLandmarks(districtCount, inputs.districtStride),
    stadiumReserve: getWorldCityStadiumReserve(inputs.boothPlacements),
    supportEdgeMasses: buildSupportEdgeBlocks(districtCount, inputs.districtStride),
    skybridgeMasses: buildDiscoverySkybridge(districtCount, inputs.districtStride),
    towers: buildCleanTowerLandmarks(
      inputs.districtPrograms,
      inputs.boothPlacements,
      inputs.districtStride,
      { global: inputs.visualProfile.global }
    ),
  };
}

function buildZonePlans(context: ExpoZonePlannerContext) {
  return [
    buildArrivalZonePlan(context),
    buildLeftDistrictZonePlan(context),
    buildCenterSpineZonePlan(context),
    buildRightDistrictZonePlan(context),
    buildTowerClusterZonePlan(context),
    buildRearCampusZonePlan(context),
  ] satisfies ExpoPlanningZonePlan[];
}

function flattenZonePlanes(zones: ExpoPlanningZonePlan[], excludedZoneIds: ExpoPlanningZoneId[] = []) {
  return zones.flatMap((zone) => (
    excludedZoneIds.includes(zone.id)
      ? []
      : zone.planes
  ));
}

function pickZonePlanes(planes: CityPlane[], predicate: (plane: CityPlane) => boolean) {
  return planes.filter(predicate);
}

function resolveSections(position: [number, number, number]): ExpoPlanningSectionId[] {
  if (position[2] > 120) {
    return ['arrival'];
  }

  if (position[0] < -260) {
    return ['left'];
  }

  if (position[0] > 260) {
    return ['right'];
  }

  return ['middle'];
}

function overlapsStadiumReserve(
  point: [number, number, number],
  reserve: CanonicalWorldPlan['stadiumReserve'],
  footprint?: [number, number] | [number, number, number] | number
) {
  if (typeof footprint === 'number') {
    return (
      Math.abs(point[0] - reserve.centerX) <= reserve.halfWidth + footprint &&
      Math.abs(point[2] - reserve.centerZ) <= reserve.halfDepth + footprint
    );
  }

  if (Array.isArray(footprint)) {
    const halfX = footprint[0] * 0.5;
    const halfZ = (footprint.length === 3 ? footprint[2] : footprint[1]) * 0.5;
    return (
      Math.abs(point[0] - reserve.centerX) <= reserve.halfWidth + halfX &&
      Math.abs(point[2] - reserve.centerZ) <= reserve.halfDepth + halfZ
    );
  }

  return (
    Math.abs(point[0] - reserve.centerX) <= reserve.halfWidth &&
    Math.abs(point[2] - reserve.centerZ) <= reserve.halfDepth
  );
}

function withSections<T extends { position: [number, number, number] }>(entry: T): T & { sections: ExpoPlanningSectionId[] } {
  return {
    ...entry,
    sections: 'sections' in entry && Array.isArray((entry as { sections?: ExpoPlanningSectionId[] }).sections)
      ? ((entry as { sections?: ExpoPlanningSectionId[] }).sections ?? resolveSections(entry.position))
      : resolveSections(entry.position),
  };
}

function withMassIntent(mass: CityMass, stadiumReserve: CanonicalWorldPlan['stadiumReserve']) {
  const role = mass.role ?? 'structural';
  const decorPolicy = mass.decorPolicy ?? 'standard';
  const isSignature = role === 'signature';
  const isCenterLane = Math.abs(mass.position[0]) <= 220;
  const isThinHorizontalShelf = mass.size[1] <= 18 && mass.size[0] >= 72 && mass.size[2] <= 32;
  const isSlenderVertical = role === 'slender-vertical';
  const isSupportStrip = role === 'support-strip';
  const isGroundLikePlinth = role === 'ground';
  const suppressDecorativeStack =
    (isCenterLane && isThinHorizontalShelf) ||
    (isCenterLane && isSupportStrip) ||
    isSlenderVertical ||
    decorPolicy === 'none';
  const isLowPlinth = mass.size[1] <= 24;

  return withSections({
    ...mass,
    renderIntent: {
      emissive: isSignature ? '#8fd6ff' : isLowPlinth ? '#d9eef8' : '#000000',
      emissiveIntensity: isSignature ? 0.014 : isLowPlinth ? 0.012 : 0,
      showFrontWing: !suppressDecorativeStack && decorPolicy === 'signature' && mass.size[0] >= 28 && mass.size[1] > 24,
      showHorizontalCap: !suppressDecorativeStack && mass.size[1] > 18 && mass.size[0] > 20 && mass.size[2] > 20,
      showRearSpine: !suppressDecorativeStack && mass.size[1] > 40 && mass.size[0] >= 18 && mass.size[2] >= 14,
      showSideInset: !suppressDecorativeStack && mass.size[1] > 28 && mass.size[0] >= 42 && mass.size[2] >= 18,
      showSignatureBand: isSignature && !suppressDecorativeStack && mass.size[1] > 24,
      skipBase: isGroundLikePlinth || overlapsStadiumReserve(mass.position, stadiumReserve, mass.size),
    },
  });
}

function withTowerSections(tower: CityTower, stadiumReserve: CanonicalWorldPlan['stadiumReserve']) {
  return withSections({
    ...tower,
    renderIntent: tower.renderIntent ?? {
      crownBandEmissiveIntensity: tower.role === 'hero' ? 0.036 : 0.014,
      crownPlateEmissiveIntensity: tower.role === 'hero' ? 0.05 : 0,
      hidden: false,
      insetEmissive: tower.role === 'hero' ? 0.018 : 0.01,
      midBandEmissiveIntensity: tower.role === 'hero' ? 0.03 : 0.014,
      podiumDepthMultiplier: tower.role === 'hero' ? 1.7 : 1.5,
      podiumEmissiveIntensity: 0.012,
      podiumWidthMultiplier: tower.role === 'hero' ? 1.65 : 1.45,
      rearFinEmissive: tower.role === 'hero' ? 0.018 : 0.01,
      showCrownPlate: tower.role === 'hero',
      showCrownPods: tower.role === 'hero',
      showInsetMass: tower.composition !== 'minimal',
      showMidBand: tower.composition !== 'minimal',
      showRearFin: true,
      showSideFin: true,
      showSpire: tower.role === 'hero',
      sideFinEmissive: 0.026,
      skipBase: overlapsStadiumReserve(tower.position, stadiumReserve, tower.baseSize),
      rearFinHeight: tower.role === 'hero' ? 48 : 26,
      sideFinHeight: tower.role === 'hero' ? 72 : 36,
      crownBandHeight: tower.role === 'hero' ? 12 : 8,
      midBandHeight: tower.role === 'hero' ? 18 : 10,
    },
  });
}

function withSurfaceSections(surface: CityScreenSurface) {
  return withSections(surface);
}

function withSocketSections(socket: CityScreenSocket) {
  return withSections(socket);
}

function withAssignmentIntent(assignment: CanonicalWorldPlan['screenAssignments'][number], socket: CityScreenSocket | undefined) {
  return {
    ...assignment,
    sections: assignment.sections ?? socket?.sections ?? ['middle'],
  };
}

function shouldRenderPlane(plane: CityPlane) {
  if (plane.role && plane.role !== 'structural') {
    return false;
  }

  return !NON_RENDERABLE_PLANE_PATTERNS.some((pattern) => plane.id.includes(pattern));
}

function shouldRenderMass(mass: CityMass) {
  if (NON_RENDERABLE_MASS_IDS.has(mass.id)) {
    return false;
  }

  if (mass.role === 'ground' || mass.role === 'support-strip' || mass.role === 'slender-vertical') {
    return false;
  }

  return !NON_RENDERABLE_MASS_PATTERNS.some((pattern) => mass.id.includes(pattern));
}

export function buildCanonicalWorldPlan(inputs: ExpoPlanningInputs): CanonicalWorldPlan {
  const geometry = buildGeometryPools(inputs);
  const context: ExpoZonePlannerContext = { geometry, inputs };
  const zones = buildZonePlans(context);
  const arrivalZone = zones.find((zone) => zone.id === 'arrival');

  if (!arrivalZone) {
    throw new Error('Canonical world plan missing arrival zone');
  }

  const cityZones = zones.filter((zone) => zone.id !== 'rear-campus');
  const cityPlanes = flattenZonePlanes(cityZones).map(withSections);
  const filteredMasses = cityZones.flatMap((zone) => zone.masses).map((mass) => withMassIntent(mass, geometry.stadiumReserve)).filter(shouldRenderMass);
  const filteredTowerLandmarks = cityZones
    .flatMap((zone) => zone.towers)
    .map((tower) => withTowerSections(tower, geometry.stadiumReserve))
    .filter((tower) => !tower.renderIntent?.hidden && !tower.renderIntent?.skipBase);
  const filteredScreenSurfaces = flattenZoneScreenSurfaces(zones, { includeRearCampus: false })
    .map(withSurfaceSections)
    .filter((surface) => surface.renderIntent?.visible !== false && !overlapsStadiumReserve(surface.position, geometry.stadiumReserve, surface.size));
  const screenSockets = flattenZoneScreenSockets(zones, { includeRearCampus: false })
    .map(withSocketSections)
    .filter((socket) => socket.renderIntent?.visible !== false && !overlapsStadiumReserve(socket.position, geometry.stadiumReserve, socket.frameSize));
  const visibleSocketIds = new Set(screenSockets.map((socket) => socket.id));
  const screenAssignments = flattenZoneScreenAssignments(zones, { includeRearCampus: false })
    .map((assignment) => withAssignmentIntent(assignment, screenSockets.find((socket) => socket.id === assignment.socketId)))
    .filter((assignment) => visibleSocketIds.has(assignment.socketId));

  return {
    arrivalPlanes: arrivalZone.planes.map(withSections).filter(shouldRenderPlane),
    arrivalZone,
    boothForecourtPlanes: pickZonePlanes(cityPlanes, (plane) => plane.id.includes('booth-forecourt') && shouldRenderPlane(plane)),
    districtStride: inputs.districtStride,
    filteredCityPlanes: cityPlanes.filter(shouldRenderPlane),
    filteredMasses,
    filteredScreenSurfaces,
    filteredTowerLandmarks,
    promenadeAxisPlanes: pickZonePlanes(cityPlanes, (plane) => plane.id.startsWith('promenade-axis-') && shouldRenderPlane(plane)),
    screenAssignments,
    screenSockets,
    showcasePlazas: pickZonePlanes(cityPlanes, (plane) => plane.id.includes('showcase') && shouldRenderPlane(plane)),
    stadiumReserve: geometry.stadiumReserve,
    zones,
  };
}
