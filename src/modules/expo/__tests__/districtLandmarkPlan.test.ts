import assert from 'node:assert/strict';
import { buildDistrictLandmarkPlan, validateDistrictLandmarkPlan } from '../lib/districtLandmarkPlan.js';
import { resolveDistrictThemeForSector } from '../lib/districtTheme.js';
import type { ExpoBoothPlacement, ExpoSectorMarker } from '../layout-engine.js';
import type { ExpoDistrictProgramSummary } from '../world-contract.js';

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
    color: '#2563eb',
    districtTheme: platformTheme,
    districtThemeId: platformTheme.id,
    id: 'gateway-platform-right',
    label: 'Platform Partners',
    position: [92, 0, -28],
    side: 'right',
    sectorId: 'platform',
  },
  {
    clusterIndex: 1,
    color: '#0f766e',
    districtTheme: meetingsTheme,
    districtThemeId: meetingsTheme.id,
    id: 'gateway-meetings-left',
    label: 'Meetings & Demos',
    position: [-92, 0, -166],
    side: 'left',
    sectorId: 'meetings',
  },
];

const districtPrograms: ExpoDistrictProgramSummary[] = [
  {
    authoredMomentCount: 1,
    clusterIndex: 0,
    depth: 3,
    downgradeReason: null,
    expressionMode: 'active-commercial',
    frontageIntensity: 2,
    frontagePackage: {
      hasGroundEngagement: true,
      hasPrimaryScreenPlane: true,
      hasSecondarySupport: true,
    },
    isCommerciallyEligible: true,
    footprintDepth: 24,
    footprintWidth: 68,
    programNodeCount: 2,
    programTargets: [
      { allocated: 1, requested: 1, role: 'arrival_anchor' },
      { allocated: 1, requested: 1, role: 'info_pavilion' },
    ],
    sectorId: 'platform',
    sponsorBackedFrontCount: 2,
    supportLevel: 'supported',
    supportingNodeCount: 1,
  },
  {
    authoredMomentCount: 2,
    clusterIndex: 1,
    depth: 4,
    downgradeReason: 'calm-program-suppression',
    expressionMode: 'calm-dwell',
    frontageIntensity: 1,
    frontagePackage: {
      hasGroundEngagement: true,
      hasPrimaryScreenPlane: false,
      hasSecondarySupport: true,
    },
    isCommerciallyEligible: false,
    footprintDepth: 32,
    footprintWidth: 76,
    programNodeCount: 3,
    programTargets: [
      { allocated: 1, requested: 1, role: 'meeting_pod' },
      { allocated: 1, requested: 1, role: 'networking_lounge' },
      { allocated: 1, requested: 1, role: 'scenic_showcase' },
    ],
    sectorId: 'meetings',
    sponsorBackedFrontCount: 1,
    supportLevel: 'single-booth',
    supportingNodeCount: 2,
  },
];

const plan = buildDistrictLandmarkPlan(boothPlacements, sectorMarkers, districtPrograms);
const validation = validateDistrictLandmarkPlan(plan, boothPlacements);

assert.ok(plan.anchors.some((anchor) => anchor.kind === 'arrival_beacon'));
assert.ok(plan.anchors.every((anchor) => Math.abs(anchor.position[0]) >= 28 || anchor.kind === 'arrival_beacon'));
assert.ok(plan.programmedZones.some((zone) => zone.kind === 'info_pylon' && zone.sectorId === 'platform'));
assert.ok(plan.programmedZones.some((zone) => zone.kind === 'meeting_pod' && zone.sectorId === 'meetings'));
assert.ok(plan.programmedZones.some((zone) => zone.kind === 'networking_lounge_island' && zone.sectorId === 'meetings'));
assert.ok(plan.anchors.some((anchor) => anchor.kind === 'photo_spot' && anchor.sectorId === 'meetings'));
assert.equal(validation.valid, true);
assert.deepEqual(validation.issues, []);
