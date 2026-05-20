import assert from 'node:assert/strict';
import {
  buildBoothWorldObjectRegistry,
  buildCityWorldObjectRegistry,
  buildGroundWorldObjectRegistry,
  buildStadiumWorldObjectRegistry,
} from '../runtime/world/inspection/worldObjectRegistry.js';
import type { WorldObjectRegistryEntry } from '../runtime/world/inspection/worldObjectRegistry.js';
import { EXPO_VERTICAL_CITY_SYSTEM } from '../runtime/planning/vertical/verticalCitySystem.js';
import { resolveRearCampusScreenHostId } from '../runtime/world/rearCampusScreenHosts.js';
import type {
  CanonicalWorldPlan,
  CityMass,
  CityPlane,
  CityScreenAssignment,
  CityScreenSocket,
  CityScreenSurface,
  CityTower,
  ExpoPlanningZonePlan,
} from '../runtime/planning/types/index.js';

const cityPlane: CityPlane = {
  color: '#223344',
  id: 'city-plane-1',
  position: [0, 0, 120],
  size: [100, 60],
};

const cityMass: CityMass = {
  color: '#445566',
  id: 'city-mass-1',
  position: [10, 20, -40],
  renderIntent: {
    emissive: '#000000',
    emissiveIntensity: 0,
    showFrontWing: false,
    showCrownBeacon: false,
    showHorizontalCap: true,
    showMegaVerticalSpines: false,
    showRearSpine: false,
    showSideFloorBands: false,
    showSideInset: false,
    showSignatureBand: false,
    skipBase: false,
  },
  size: [120, 180, 90],
};

const skippedCityMass: CityMass = {
  color: '#778899',
  id: 'city-mass-skipped',
  position: [80, 0, -40],
  renderIntent: {
    emissive: '#000000',
    emissiveIntensity: 0,
    showFrontWing: false,
    showCrownBeacon: false,
    showHorizontalCap: false,
    showMegaVerticalSpines: false,
    showRearSpine: false,
    showSideFloorBands: false,
    showSideInset: false,
    showSignatureBand: false,
    skipBase: true,
  },
  size: [80, 120, 70],
};

const verticalCityMass: CityMass = {
  color: '#667788',
  id: 'city-vertical-mass-1',
  position: [260, 0, -280],
  size: [80, 72, 54],
  vertical: {
    baseY: 96,
    floorCount: 2,
    floorHeight: 36,
    heightBand: 'mid-rise',
    level: 'level-2',
    verticalOwner: 'city',
  },
};

const cityTower: CityTower = {
  baseSize: [90, 260, 90],
  color: '#99aabb',
  composition: 'hero',
  crownColor: '#7dd3fc',
  id: 'city-tower-1',
  position: [120, 0, -160],
  role: 'hero',
  upperSize: [36, 42, 36],
};

const semanticTower: CityTower = {
  ...cityTower,
  id: '1a459ffc-d447-4899-97e5-7af7b562487d-hero-tower-right',
  position: [548, 116, -544],
};

const citySurface: CityScreenSurface = {
  color: '#08111c',
  glowColor: '#7dd3fc',
  id: 'city-surface-1',
  position: [0, 120, -420],
  role: 'hero-wall',
  rotation: [0, Math.PI, 0],
  sections: ['middle'],
  size: [156, 184, 3.4],
  type: 'wall',
};

const semanticTowerSurface: CityScreenSurface = {
  ...citySurface,
  id: '1a459ffc-d447-4899-97e5-7af7b562487d-hero-tower-right-tower-ribbon',
  position: [518, 145, -518],
  role: 'tower-side',
  size: [44, 104, 2],
  type: 'tower-side',
};

const citySocket: CityScreenSocket = {
  color: '#0f172a',
  frameSize: [120, 90],
  id: 'city-socket-1',
  kind: 'hero_wall',
  position: [0, 120, -420],
  rotation: [0, Math.PI, 0],
  sections: ['middle'],
  surfaceId: citySurface.id,
};

const cityAssignment: CityScreenAssignment = {
  accentColor: '#4ade80',
  companyId: 'company-1',
  id: 'city-assignment-1',
  imageUrl: null,
  label: 'Company 1',
  sections: ['middle'],
  socketId: citySocket.id,
  subtitle: 'Expo partner',
  tier: 'hero',
};

const cityPlan: CanonicalWorldPlan = {
  arrivalPlanes: [cityPlane],
  arrivalZone: {
    allowedScreenFamilies: [],
    anchors: [],
    assignments: [],
    densityCaps: { assignmentCap: 0, screenSocketCap: 0, screenSurfaceCap: 0 },
    id: 'arrival',
    masses: [],
    name: 'Arrival',
    placementClasses: [],
    planes: [],
    screenSockets: [],
    screenSurfaces: [],
    towers: [],
    viewerFacing: 'inbound',
  },
  boothForecourtPlanes: [cityPlane],
  districtStride: 548,
  filteredCityPlanes: [cityPlane],
  filteredMasses: [cityMass, skippedCityMass, verticalCityMass],
  filteredScreenSurfaces: [citySurface, semanticTowerSurface],
  filteredTowerLandmarks: [cityTower, semanticTower],
  promenadeAxisPlanes: [cityPlane],
  screenAssignments: [cityAssignment],
  screenSockets: [citySocket],
  showcasePlazas: [cityPlane],
  stadiumReserve: {
    centerX: 0,
    centerZ: -2400,
    halfDepth: 300,
    halfWidth: 300,
  },
  verticalSystem: EXPO_VERTICAL_CITY_SYSTEM,
  zones: [],
};

const stadiumSurface: CityScreenSurface = {
  ...citySurface,
  id: 'rear-campus-bowl-feed-surface',
  position: [20, 90, -2820],
};

const stadiumSocket: CityScreenSocket = {
  ...citySocket,
  id: 'stadium-socket-1',
  position: [20, 90, -2820],
  surfaceId: stadiumSurface.id,
};

const stadiumAssignment: CityScreenAssignment = {
  ...cityAssignment,
  id: 'stadium-assignment-1',
  socketId: stadiumSocket.id,
};

const stadiumLeftSurface: CityScreenSurface = {
  ...citySurface,
  id: 'rear-campus-mega-civic-hall-host-surface',
  position: [-2490, 168, -3838.1],
  size: [428, 194, 4.2],
};

const stadiumLeftSocket: CityScreenSocket = {
  ...citySocket,
  id: 'stadium-left-socket-1',
  position: [-220, 90, -2820],
  surfaceId: stadiumLeftSurface.id,
};

const stadiumLeftAssignment: CityScreenAssignment = {
  ...cityAssignment,
  id: 'stadium-left-assignment-1',
  socketId: stadiumLeftSocket.id,
};

const stadiumRightSurface: CityScreenSurface = {
  ...citySurface,
  id: 'stadium-right-surface-1',
  position: [220, 90, -2820],
};

const stadiumRightSocket: CityScreenSocket = {
  ...citySocket,
  id: 'stadium-right-socket-1',
  position: [220, 90, -2820],
  surfaceId: stadiumRightSurface.id,
};

const stadiumRightAssignment: CityScreenAssignment = {
  ...cityAssignment,
  id: 'stadium-right-assignment-1',
  socketId: stadiumRightSocket.id,
};

const rearCampusPlan: ExpoPlanningZonePlan = {
  allowedScreenFamilies: [],
  anchors: [],
  assignments: [stadiumAssignment, stadiumLeftAssignment, stadiumRightAssignment],
  densityCaps: { assignmentCap: 3, screenSocketCap: 3, screenSurfaceCap: 3 },
  id: 'rear-campus',
  masses: [],
  name: 'Rear campus',
  placementClasses: [],
  planes: [],
  screenSockets: [stadiumSocket, stadiumLeftSocket, stadiumRightSocket],
  screenSurfaces: [stadiumSurface, stadiumLeftSurface, stadiumRightSurface],
  towers: [],
  viewerFacing: 'event-facing',
  zoneExtension: {
    rearCampus: {
      campusCenterZ: -2880,
      feedSocketIds: {
        bowl: stadiumSocket.id,
        leftTower: stadiumLeftSocket.id,
        rightTower: stadiumRightSocket.id,
      },
      forecourts: [
        {
          color: '#112233',
          id: 'rear-forecourt-1',
          position: [0, 0, -2600],
          size: [320, 240],
        },
      ],
      landmarkTowers: [
        {
          id: 'rear-tower-left',
          position: [-380, 0, -3060],
        },
        {
          id: 'rear-tower-right',
          position: [380, 0, -3060],
        },
        {
          id: 'rear-tower-1',
          position: [220, 0, -3000],
        },
      ],
      perimeterConnectors: [
        {
          accent: 'wall',
          id: 'rear-campus-test-perimeter',
          position: [0, 16, -4600],
          size: [640, 32, 20],
        },
      ],
      sidePavilions: [
        {
          accentSide: 1,
          id: 'rear-pavilion-1',
          position: [180, 0, -2500],
          size: [120, 80, 90],
        },
      ],
      stadiumBackWallZ: -4300,
    },
  },
};

const boothPlacements = [
  {
    company: {
      booth: { id: 'booth-sponsor-concierge' },
      id: 'company-sponsor-concierge',
      slug: 'sponsor-concierge',
    },
    id: 'booth-1',
    position: [40, 0, -80] as [number, number, number],
    sectorId: 'sector-a',
  },
];

const cityBefore = JSON.stringify(cityPlan);
const cityRegistry = buildCityWorldObjectRegistry({
  districtCount: 2,
  districtStride: 548,
  plan: cityPlan,
});
assert.equal(JSON.stringify(cityPlan), cityBefore);
assert.deepEqual(
  EXPO_VERTICAL_CITY_SYSTEM.walkableRegions
    .filter((region) => region.id.startsWith('sky-market-spine-'))
    .map((region) => [region.id, region.playerY, region.zoneId]),
  [
    ['sky-market-spine-lower-market-deck-walkable', 541, 'center-spine'],
    ['sky-market-spine-upper-market-deck-walkable', 919, 'center-spine'],
  ],
);
assert.ok(cityRegistry.some((entry) => entry.id === citySurface.id && entry.layer === 'city-screen-surface'));
assert.ok(cityRegistry.some((entry) => entry.id === citySocket.id && entry.layer === 'city-screen-socket'));
assert.ok(cityRegistry.some((entry) => entry.id === cityAssignment.id && entry.layer === 'city-screen-assignment'));
assert.ok(cityRegistry.some((entry) => entry.id === cityMass.id && entry.layer === 'city-mass'));
assert.equal(cityRegistry.some((entry) => entry.id === skippedCityMass.id), false);
assert.ok(cityRegistry.some((entry) => entry.id === verticalCityMass.id && entry.layer === 'city-mass'));
assert.ok(cityRegistry.some((entry) => entry.id === cityTower.id && entry.layer === 'city-tower'));
assert.ok(cityRegistry.some((entry) => entry.id === 'tower-cluster-vertical-pilot-lift-ground' && entry.layer === 'vertical-access-node'));
assert.ok(cityRegistry.some((entry) => entry.id === 'tower-cluster-vertical-pilot-lift-level-1-to-level-2' && entry.layer === 'vertical-access-node'));
assert.ok(cityRegistry.some((entry) => entry.id === 'sky-market-spine-lift-ground-to-lower' && entry.layer === 'vertical-access-node'));
assert.ok(cityRegistry.some((entry) => entry.id === 'sky-market-spine-lift-lower-to-upper' && entry.layer === 'vertical-access-node'));
assert.ok(cityRegistry.some((entry) => entry.id === 'sky-market-spine-animated-market-lift' && entry.layer === 'vertical-elevator-route'));
assert.ok(cityRegistry.some((entry) => entry.id === 'tower-cluster-mega-highrise-animated-panoramic-lift' && entry.layer === 'vertical-elevator-route'));
assert.ok(cityRegistry.some((entry) => entry.id === 'tower-cluster-television-tower-animated-city-lift' && entry.layer === 'vertical-elevator-route'));
assert.equal(cityRegistry.some((entry) => entry.id === cityPlane.id), false);
assert.deepEqual(cityRegistry.find((entry) => entry.id === cityMass.id)?.position, [10, 90, -40]);
assert.ok(cityRegistry.find((entry) => entry.id === cityMass.id)?.physicsParts?.some((part) => part.id === 'base'));
assert.ok(cityRegistry.find((entry) => entry.id === cityMass.id)?.physicsParts?.some((part) => part.id === 'horizontal-cap'));
assert.deepEqual(cityRegistry.find((entry) => entry.id === verticalCityMass.id)?.position, [260, 132, -280]);
assert.equal(cityRegistry.find((entry) => entry.id === verticalCityMass.id)?.level, 'level-2');
assert.equal(cityRegistry.find((entry) => entry.id === verticalCityMass.id)?.baseY, 96);
assert.equal(cityRegistry.find((entry) => entry.id === verticalCityMass.id)?.heightBand, 'mid-rise');
assert.equal(cityRegistry.find((entry) => entry.id === verticalCityMass.id)?.verticalOwner, 'city');
assert.deepEqual(cityRegistry.find((entry) => entry.id === 'tower-cluster-vertical-pilot-lift-ground')?.position, [900, 5, -620]);
assert.equal(cityRegistry.find((entry) => entry.id === 'tower-cluster-vertical-pilot-lift-ground')?.interactionOwner, 'src/modules/expo/runtime/world/scene/ExpoWorldPlayerLayer.tsx');
assert.deepEqual(cityRegistry.find((entry) => entry.id === 'tower-cluster-vertical-pilot-lift-level-1-to-level-2')?.position, [980, 67, -650]);
assert.deepEqual(cityRegistry.find((entry) => entry.id === 'tower-cluster-vertical-pilot-lift-level-1-to-level-2')?.size, [56, 10, 56]);
assert.deepEqual(cityRegistry.find((entry) => entry.id === 'sky-market-spine-lift-ground-to-lower')?.position, [-650, 5, -520]);
assert.deepEqual(cityRegistry.find((entry) => entry.id === 'sky-market-spine-lift-ground-to-lower')?.size, [76, 10, 76]);
assert.deepEqual(cityRegistry.find((entry) => entry.id === 'sky-market-spine-lift-lower-to-upper')?.position, [-650, 537, -520]);
assert.deepEqual(cityRegistry.find((entry) => entry.id === 'sky-market-spine-animated-market-lift')?.position, [-650, 498, -520]);
assert.deepEqual(cityRegistry.find((entry) => entry.id === 'sky-market-spine-animated-market-lift')?.size, [150, 1010, 92]);
assert.deepEqual(cityRegistry.find((entry) => entry.id === 'tower-cluster-mega-highrise-animated-panoramic-lift')?.position, [-220, 825, -1130]);
assert.deepEqual(cityRegistry.find((entry) => entry.id === 'tower-cluster-mega-highrise-animated-panoramic-lift')?.size, [144, 1662, 78]);
assert.deepEqual(cityRegistry.find((entry) => entry.id === 'tower-cluster-television-tower-animated-city-lift')?.position, [620, 2670.5, -900]);
assert.deepEqual(cityRegistry.find((entry) => entry.id === 'tower-cluster-television-tower-animated-city-lift')?.size, [128, 5351, 76]);

type SizedWorldObjectRegistryEntry = WorldObjectRegistryEntry & { size: [number, number, number] };
const hasRegistrySize = (entry: WorldObjectRegistryEntry): entry is SizedWorldObjectRegistryEntry => (
  Array.isArray(entry.size) && entry.size.length === 3 && entry.size.every(Number.isFinite)
);
const buildObjectBounds = (entry: SizedWorldObjectRegistryEntry) => ({
  maxX: entry.position[0] + (entry.size[0] * 0.5),
  maxY: entry.position[1] + (entry.size[1] * 0.5),
  maxZ: entry.position[2] + (entry.size[2] * 0.5),
  minX: entry.position[0] - (entry.size[0] * 0.5),
  minY: entry.position[1] - (entry.size[1] * 0.5),
  minZ: entry.position[2] - (entry.size[2] * 0.5),
});
const objectBoundsOverlap = (left: SizedWorldObjectRegistryEntry, right: SizedWorldObjectRegistryEntry) => {
  const leftBounds = buildObjectBounds(left);
  const rightBounds = buildObjectBounds(right);

  return boundsOverlap(leftBounds, rightBounds);
};
const boundsOverlap = (
  leftBounds: ReturnType<typeof buildObjectBounds>,
  rightBounds: ReturnType<typeof buildObjectBounds>,
) => {
  return (
    Math.min(leftBounds.maxX, rightBounds.maxX) > Math.max(leftBounds.minX, rightBounds.minX)
    && Math.min(leftBounds.maxY, rightBounds.maxY) > Math.max(leftBounds.minY, rightBounds.minY)
    && Math.min(leftBounds.maxZ, rightBounds.maxZ) > Math.max(leftBounds.minZ, rightBounds.minZ)
  );
};
const isTowerClusterElevatorRoute = (entry: WorldObjectRegistryEntry): entry is SizedWorldObjectRegistryEntry => (
  entry.layer === 'vertical-elevator-route'
  && entry.planningZone === 'tower-cluster'
  && hasRegistrySize(entry)
);
const isTowerClusterMass = (entry: WorldObjectRegistryEntry): entry is SizedWorldObjectRegistryEntry => (
  entry.layer === 'city-mass'
  && String(entry.sourceKind).startsWith('tower-cluster-')
  && hasRegistrySize(entry)
);
const towerElevatorMassIntersections = cityRegistry
  .filter(isTowerClusterElevatorRoute)
  .flatMap((route) => cityRegistry
    .filter(isTowerClusterMass)
    .filter((mass) => objectBoundsOverlap(route, mass))
    .map((mass) => `${route.id}->${mass.id}`));
assert.deepEqual(towerElevatorMassIntersections, []);

const towerElevatorWalkableRegionIntersections = cityRegistry
  .filter(isTowerClusterElevatorRoute)
  .flatMap((route) => EXPO_VERTICAL_CITY_SYSTEM.walkableRegions
    .map((region) => ({
      bounds: {
        maxX: region.position[0] + (region.size[0] * 0.5),
        maxY: region.playerY + 12,
        maxZ: region.position[2] + (region.size[1] * 0.5),
        minX: region.position[0] - (region.size[0] * 0.5),
        minY: region.playerY - 12,
        minZ: region.position[2] - (region.size[1] * 0.5),
      },
      region,
    }))
    .filter(({ bounds }) => boundsOverlap(buildObjectBounds(route), bounds))
    .map(({ region }) => `${route.id}->${region.id}`));
assert.deepEqual(towerElevatorWalkableRegionIntersections, []);
assert.deepEqual(cityRegistry.find((entry) => entry.id === cityTower.id)?.position, [120, 151, -160]);
assert.deepEqual(
  cityRegistry.find((entry) => entry.id === semanticTower.id)?.aliases,
  ['arrival-core-hero-tower-right'],
);
assert.deepEqual(
  cityRegistry.find((entry) => entry.id === semanticTowerSurface.id)?.aliases,
  ['arrival-core-hero-tower-right-tower-ribbon'],
);
assert.ok(cityRegistry.some((entry) => entry.id === 'mega-landmark-arrival' && entry.layer === 'mega-landmark'));
assert.equal(cityRegistry.find((entry) => entry.id === 'mega-landmark-arrival')?.planningZone, 'arrival');
assert.deepEqual(cityRegistry.find((entry) => entry.id === 'mega-landmark-arrival')?.planningSections, ['arrival']);

const stadiumOverlapCityRegistry = buildCityWorldObjectRegistry({
  districtCount: 2,
  districtStride: 548,
  plan: {
    ...cityPlan,
    stadiumReserve: {
      centerX: 0,
      centerZ: -1824,
      halfDepth: 320,
      halfWidth: 900,
    },
  },
});
assert.equal(stadiumOverlapCityRegistry.some((entry) => entry.id === 'mega-landmark-discovery'), false);

const stadiumBefore = JSON.stringify(rearCampusPlan);
const stadiumRegistry = buildStadiumWorldObjectRegistry({
  campusCenterZ: -2880,
  rearCampusPlan,
});
assert.equal(JSON.stringify(rearCampusPlan), stadiumBefore);
assert.ok(stadiumRegistry.some((entry) => entry.id === stadiumSurface.id && entry.layer === 'stadium-screen-surface'));
assert.ok(stadiumRegistry.some((entry) => entry.id === stadiumSocket.id && entry.layer === 'stadium-screen-socket'));
assert.ok(stadiumRegistry.some((entry) => entry.id === stadiumAssignment.id && entry.layer === 'stadium-screen-assignment'));
assert.equal(stadiumRegistry.filter((entry) => entry.layer === 'stadium-screen-feed').length, 0);
assert.ok(stadiumRegistry.some((entry) => entry.id === 'rear-campus-bowl-center-deck-screen-host-shell' && entry.layer === 'stadium-structure'));
assert.equal(stadiumRegistry.find((entry) => entry.id === 'rear-campus-bowl-center-deck-screen-host-shell')?.planningRole, 'screen-host-shell');
assert.equal(resolveRearCampusScreenHostId('rear-campus-bowl-feed-surface'), 'rear-campus-bowl-center-deck-screen-host-shell');
assert.equal(resolveRearCampusScreenHostId('rear-campus-stage-monolith-canopy-host-surface'), 'rear-campus-stage-monolith-canopy');
assert.equal(resolveRearCampusScreenHostId('rear-campus-mega-civic-hall-host-surface'), 'rear-campus-mega-civic-hall');
assert.equal(resolveRearCampusScreenHostId('rear-campus-orbital-scoregate-host-surface'), 'rear-campus-orbital-scoregate');
assert.ok(stadiumRegistry.some((entry) => entry.id === 'rear-forecourt-1' && entry.layer === 'stadium-plane'));
assert.equal(stadiumRegistry.find((entry) => entry.id === 'rear-forecourt-1')?.groundOwner, 'stadium');
assert.equal(stadiumRegistry.find((entry) => entry.id === 'rear-forecourt-1')?.groundRole, 'structural');
assert.equal(stadiumRegistry.find((entry) => entry.id === 'rear-forecourt-1')?.material?.transparent, true);
assert.ok((stadiumRegistry.find((entry) => entry.id === 'rear-forecourt-1')?.material?.opacity ?? 1) <= 0.18);
assert.ok(stadiumRegistry.some((entry) => entry.id === 'rear-pavilion-1' && entry.layer === 'stadium-pavilion'));
assert.ok(stadiumRegistry.some((entry) => entry.id === 'rear-tower-1' && entry.layer === 'stadium-tower'));
assert.deepEqual(stadiumRegistry.find((entry) => entry.id === 'rear-pavilion-1')?.position, [180, 40, -2500]);
assert.ok(stadiumRegistry.find((entry) => entry.id === 'rear-pavilion-1')?.physicsParts?.some((part) => part.id === 'crown'));
assert.deepEqual(stadiumRegistry.find((entry) => entry.id === 'rear-tower-1')?.position, [220, 360, -3000]);
assert.equal(stadiumRegistry.some((entry) => entry.id === 'stadium-bowl' && entry.layer === 'stadium-structure'), false);
assert.ok(stadiumRegistry.some((entry) => entry.id === 'rear-campus-stage-monolith-canopy' && entry.layer === 'stadium-structure'));
assert.deepEqual(stadiumRegistry.find((entry) => entry.id === 'rear-campus-stage-monolith-canopy')?.position, [47, 116, -3018]);
assert.ok(stadiumRegistry.find((entry) => entry.id === 'rear-campus-stage-monolith-canopy')?.physicsParts?.some((part) => part.id === 'roof-canopy'));
assert.equal(stadiumRegistry.find((entry) => entry.id === 'rear-campus-stage-monolith-canopy')?.planningRole, 'recovered-large-landmark');
assert.ok(stadiumRegistry.some((entry) => entry.id === 'rear-campus-mega-civic-hall' && entry.layer === 'stadium-structure'));
assert.deepEqual(stadiumRegistry.find((entry) => entry.id === 'rear-campus-mega-civic-hall')?.position, [-2490, 176, -3670]);
assert.equal(stadiumRegistry.find((entry) => entry.id === 'rear-campus-mega-civic-hall')?.planningRole, 'recovered-large-landmark');
assert.equal(stadiumRegistry.some((entry) => entry.id === 'rear-campus-mega-civic-hall-screen-host-shell'), false);
assert.ok(stadiumRegistry.some((entry) => entry.id === 'rear-campus-orbital-scoregate' && entry.layer === 'stadium-structure'));
assert.deepEqual(stadiumRegistry.find((entry) => entry.id === 'rear-campus-orbital-scoregate')?.position, [0, 515, -4800]);
assert.ok(stadiumRegistry.find((entry) => entry.id === 'rear-campus-orbital-scoregate')?.physicsParts?.some((part) => part.id === 'scoreboard-backplate'));
assert.equal(stadiumRegistry.find((entry) => entry.id === 'rear-campus-orbital-scoregate')?.planningRole, 'recovered-large-landmark');
assert.ok(stadiumRegistry.some((entry) => entry.id === 'rear-campus-entry-pulse-arches' && entry.layer === 'stadium-structure'));
assert.deepEqual(stadiumRegistry.find((entry) => entry.id === 'rear-campus-entry-pulse-arches')?.position, [1700, 280, -1900]);
assert.ok(stadiumRegistry.find((entry) => entry.id === 'rear-campus-entry-pulse-arches')?.physicsParts?.some((part) => part.id === 'left-upper-arch-beam'));
assert.ok(stadiumRegistry.find((entry) => entry.id === 'rear-campus-entry-pulse-arches')?.physicsParts?.some((part) => part.id === 'right-upper-arch-beam'));
assert.ok(stadiumRegistry.some((entry) => entry.id === 'rear-campus-test-perimeter' && entry.layer === 'stadium-structure'));
assert.equal(stadiumRegistry.some((entry) => entry.id === 'stadium-axis-center-1180'), false);

const rearCampusRegistryIds = stadiumRegistry.map((entry) => entry.id);
assert.equal(new Set(rearCampusRegistryIds).size, rearCampusRegistryIds.length);

const requiredBoundedLayers = new Set([
  'city-mass',
  'city-tower',
  'mega-landmark',
  'stadium-pavilion',
  'stadium-structure',
  'stadium-tower',
  'vertical-access-node',
]);
for (const entry of [...cityRegistry, ...stadiumRegistry]) {
  if (requiredBoundedLayers.has(entry.layer)) {
    assert.ok(entry.size?.every((value) => value > 0), `${entry.id} must expose positive audit bounds`);
  }
}

const boothsBefore = JSON.stringify(boothPlacements);
const boothRegistry = buildBoothWorldObjectRegistry(boothPlacements);
assert.equal(JSON.stringify(boothPlacements), boothsBefore);
assert.deepEqual(boothRegistry.map((entry) => entry.id), ['booth-1']);
assert.deepEqual(boothRegistry[0]?.aliases, ['sponsor-concierge', 'company-sponsor-concierge', 'booth-sponsor-concierge']);
assert.equal(boothRegistry[0]?.layer, 'booth');
assert.deepEqual(boothRegistry[0]?.physicsParts?.map((part) => part.id).sort(), ['collider-left', 'collider-rear', 'collider-right']);
assert.ok(boothRegistry[0]?.size?.every((value) => value > 0), 'booth registry entries must expose positive audit bounds');

const groundRegistry = buildGroundWorldObjectRegistry();
assert.ok(groundRegistry.some((entry) => entry.id === 'global-ground-base' && entry.layer === 'ground-base'));
assert.equal(groundRegistry.find((entry) => entry.id === 'global-ground-base')?.groundRole, 'base');
assert.equal(groundRegistry.some((entry) => entry.layer === 'ground-detail'), false);
assert.ok(groundRegistry.every((entry) => entry.size?.every((value) => value > 0)), 'ground registry entries must expose positive audit bounds');
