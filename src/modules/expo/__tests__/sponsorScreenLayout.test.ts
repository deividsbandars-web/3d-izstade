import assert from 'node:assert/strict';
import { buildSponsorScreenLayout } from '../lib/sponsorScreenLayout.js';
import type { ExpoBoothPlacement, ExpoSectorMarker } from '../sceneWorld.js';

const boothPlacements: ExpoBoothPlacement[] = [
  {
    boothType: 'hero',
    color: '#22c55e',
    company: { id: 'hero-1', name: 'Warpala Platform', posterUrl: null, logo_url: null, tagline: 'Hero arrival experience' },
    id: 'hero-1',
    layoutFootprint: { maxX: 120, maxZ: 12, minX: -120, minZ: -240 },
    nodeType: 'hero_left',
    position: [-46, 0, -44],
    priority: 100,
    rotation: [0, 1.57, 0],
    sectorName: 'Arrival Sponsors',
    sponsorTier: 'hero',
  },
  {
    boothType: 'premium',
    color: '#38bdf8',
    company: { id: 'gold-1', name: 'Sponsor Concierge', posterUrl: null, logo_url: null, tagline: 'Meetings and routing' },
    id: 'gold-1',
    layoutFootprint: { maxX: 120, maxZ: 12, minX: -120, minZ: -240 },
    nodeType: 'endcap',
    position: [66, 0, -88],
    priority: 80,
    rotation: [0, -1.57, 0],
    sectorName: 'Meetings',
    sponsorTier: 'gold',
  },
  {
    boothType: 'standard',
    color: '#f59e0b',
    company: { id: 'std-1', name: 'Demo Room Access', posterUrl: null, logo_url: null, tagline: 'Enter live booth rooms' },
    id: 'std-1',
    layoutFootprint: { maxX: 120, maxZ: 12, minX: -120, minZ: -240 },
    nodeType: 'standard_right',
    position: [32, 0, -156],
    priority: 55,
    rotation: [0, -1.57, 0],
    sectorName: 'Meetings',
    sponsorTier: 'silver',
  },
];

const sectorMarkers: ExpoSectorMarker[] = [
  { color: '#22c55e', id: 'gateway-arrival-left', label: 'Arrival Sponsors', position: [-92, 0, -28], side: 'left', sectorId: 'arrival-core' },
  { color: '#22c55e', id: 'gateway-arrival-right', label: 'Arrival Sponsors', position: [92, 0, -28], side: 'right', sectorId: 'arrival-core' },
  { color: '#0f766e', id: 'gateway-meetings-left', label: 'Meetings', position: [-92, 0, -166], side: 'left', sectorId: 'meetings' },
];

const firstLayout = buildSponsorScreenLayout(boothPlacements, sectorMarkers);
const secondLayout = buildSponsorScreenLayout(boothPlacements, sectorMarkers);

assert.deepEqual(firstLayout, secondLayout);
assert.equal(firstLayout.facadeScreens.length, 3);
assert.ok(firstLayout.mediumScreens.length >= 4);
assert.ok(firstLayout.mediumScreens.length <= 6);
assert.ok(firstLayout.groundScreens.length >= 6);
assert.ok(firstLayout.groundScreens.length <= 10);
assert.ok(firstLayout.facadeScreens[0].position[2] > -10);
assert.equal(firstLayout.facadeScreens[0].imageUrl, '/textures/expo/hero-facade-screen-8k/hero_facade_screen_01.png');
assert.ok(firstLayout.mediumScreens.every((screen) => typeof screen.imageUrl === 'string' && screen.imageUrl.length > 0));
assert.ok(firstLayout.groundScreens.some((screen) => screen.title === 'Arrival'));
