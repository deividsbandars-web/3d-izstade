import assert from 'node:assert/strict';
import { buildDistrictLandmarkPlan, validateDistrictLandmarkPlan } from '../lib/districtLandmarkPlan.js';
import { resolveDistrictThemeForSector } from '../lib/districtTheme.js';
import type { ExpoBoothPlacement, ExpoSectorMarker } from '../sceneWorld.js';

const meetingsTheme = resolveDistrictThemeForSector({ color_theme: '#0f766e', id: 'meetings', name: 'Meetings & Demos' });
const platformTheme = resolveDistrictThemeForSector({ color_theme: '#2563eb', id: 'platform', name: 'Platform Partners' });

const boothPlacements: ExpoBoothPlacement[] = [
  {
    boothType: 'hero',
    clusterIndex: 0,
    color: '#2563eb',
    company: { id: 'hero', name: 'Hero' },
    districtTheme: platformTheme,
    districtThemeId: platformTheme.id,
    id: 'hero',
    position: [-36, 0, -48],
    rotation: [0, 0, 0],
    sectorId: 'platform',
    sectorName: 'Platform Partners',
    sponsorTier: 'hero',
  },
  {
    boothType: 'premium',
    clusterIndex: 1,
    color: '#0f766e',
    company: { id: 'meeting', name: 'Meeting' },
    districtTheme: meetingsTheme,
    districtThemeId: meetingsTheme.id,
    id: 'meeting',
    position: [34, 0, -152],
    rotation: [0, 0, 0],
    sectorId: 'meetings',
    sectorName: 'Meetings & Demos',
    sponsorTier: 'gold',
  },
];

const sectorMarkers: ExpoSectorMarker[] = [
  {
    clusterIndex: 0,
    color: '#2563eb',
    districtTheme: platformTheme,
    districtThemeId: platformTheme.id,
    id: 'gateway-platform-left',
    label: 'Platform Partners',
    position: [-92, 0, -28],
    side: 'left',
    sectorId: 'platform',
  },
  {
    clusterIndex: 1,
    color: '#0f766e',
    districtTheme: meetingsTheme,
    districtThemeId: meetingsTheme.id,
    id: 'gateway-meetings-right',
    label: 'Meetings & Demos',
    position: [92, 0, -166],
    side: 'right',
    sectorId: 'meetings',
  },
];

const plan = buildDistrictLandmarkPlan(boothPlacements, sectorMarkers);
const validation = validateDistrictLandmarkPlan(plan, boothPlacements);

assert.ok(plan.anchors.some((anchor) => anchor.kind === 'arrival_beacon'));
assert.ok(plan.anchors.every((anchor) => Math.abs(anchor.position[0]) >= 28 || anchor.kind === 'arrival_beacon'));
assert.equal(validation.valid, true);
assert.deepEqual(validation.issues, []);
