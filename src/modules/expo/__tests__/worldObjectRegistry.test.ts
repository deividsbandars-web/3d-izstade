import assert from 'node:assert/strict';
import {
  buildBoothWorldObjectRegistry,
  buildCityWorldObjectRegistry,
  buildGroundWorldObjectRegistry,
  buildStadiumWorldObjectRegistry,
} from '../runtime/world/inspection/worldObjectRegistry.js';
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
  size: [120, 180, 90],
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
  filteredMasses: [cityMass],
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
  zones: [],
};

const stadiumSurface: CityScreenSurface = {
  ...citySurface,
  id: 'stadium-surface-1',
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
  id: 'stadium-left-surface-1',
  position: [-220, 90, -2820],
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
assert.ok(cityRegistry.some((entry) => entry.id === citySurface.id && entry.layer === 'city-screen-surface'));
assert.ok(cityRegistry.some((entry) => entry.id === citySocket.id && entry.layer === 'city-screen-socket'));
assert.ok(cityRegistry.some((entry) => entry.id === cityAssignment.id && entry.layer === 'city-screen-assignment'));
assert.ok(cityRegistry.some((entry) => entry.id === cityMass.id && entry.layer === 'city-mass'));
assert.ok(cityRegistry.some((entry) => entry.id === cityTower.id && entry.layer === 'city-tower'));
assert.equal(cityRegistry.find((entry) => entry.id === cityPlane.id)?.groundOwner, 'city');
assert.equal(cityRegistry.find((entry) => entry.id === cityPlane.id)?.groundRole, 'structural');
assert.equal(cityRegistry.find((entry) => entry.id === cityPlane.id)?.material?.transparent, true);
assert.ok((cityRegistry.find((entry) => entry.id === cityPlane.id)?.material?.opacity ?? 1) <= 0.18);
assert.deepEqual(cityRegistry.find((entry) => entry.id === cityMass.id)?.position, [10, 90, -40]);
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
assert.ok(stadiumRegistry.some((entry) => entry.id === 'rear-forecourt-1' && entry.layer === 'stadium-plane'));
assert.equal(stadiumRegistry.find((entry) => entry.id === 'rear-forecourt-1')?.groundOwner, 'stadium');
assert.equal(stadiumRegistry.find((entry) => entry.id === 'rear-forecourt-1')?.groundRole, 'structural');
assert.equal(stadiumRegistry.find((entry) => entry.id === 'rear-forecourt-1')?.material?.transparent, true);
assert.ok((stadiumRegistry.find((entry) => entry.id === 'rear-forecourt-1')?.material?.opacity ?? 1) <= 0.18);
assert.ok(stadiumRegistry.some((entry) => entry.id === 'rear-pavilion-1' && entry.layer === 'stadium-pavilion'));
assert.ok(stadiumRegistry.some((entry) => entry.id === 'rear-tower-1' && entry.layer === 'stadium-tower'));
assert.deepEqual(stadiumRegistry.find((entry) => entry.id === 'rear-pavilion-1')?.position, [180, 40, -2500]);
assert.deepEqual(stadiumRegistry.find((entry) => entry.id === 'rear-tower-1')?.position, [220, 360, -3000]);
assert.ok(stadiumRegistry.some((entry) => entry.id === 'stadium-bowl' && entry.layer === 'stadium-structure'));
assert.ok(stadiumRegistry.some((entry) => entry.id === 'rear-campus-test-perimeter' && entry.layer === 'stadium-structure'));
assert.equal(stadiumRegistry.some((entry) => entry.id === 'stadium-axis-center-1180'), false);

const requiredBoundedLayers = new Set([
  'city-mass',
  'city-tower',
  'mega-landmark',
  'stadium-pavilion',
  'stadium-structure',
  'stadium-tower',
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
assert.ok(boothRegistry[0]?.size?.every((value) => value > 0), 'booth registry entries must expose positive audit bounds');

const groundRegistry = buildGroundWorldObjectRegistry();
assert.ok(groundRegistry.some((entry) => entry.id === 'global-ground-base' && entry.layer === 'ground-base'));
assert.equal(groundRegistry.find((entry) => entry.id === 'global-ground-base')?.groundRole, 'base');
assert.equal(groundRegistry.find((entry) => entry.id === 'arrival-to-seam-spine')?.groundOwner, 'city');
assert.equal(groundRegistry.find((entry) => entry.id === 'stadium-transition-crosswalk')?.groundOwner, 'transition');
assert.equal(groundRegistry.find((entry) => entry.id === 'rear-campus-approach-ribbon')?.groundOwner, 'stadium');
assert.equal(groundRegistry.find((entry) => entry.id === 'arrival-to-seam-spine')?.material?.transparent, true);
assert.ok((groundRegistry.find((entry) => entry.id === 'arrival-to-seam-spine')?.material?.opacity ?? 1) <= 0.32);
assert.ok(groundRegistry.every((entry) => entry.size?.every((value) => value > 0)), 'ground registry entries must expose positive audit bounds');
