import assert from 'node:assert/strict';
import { resolveDistrictThemeForSector } from '../lib/districtTheme.js';
import { buildSponsorScreenLayout } from '../lib/sponsorScreenLayout.js';
import type { ExpoBoothPlacement, ExpoSectorMarker } from '../layout-engine.js';
import type { ExpoDistrictProgramSummary } from '../world-contract.js';

const platformTheme = resolveDistrictThemeForSector({ color_theme: '#22c55e', id: 'arrival-core', name: 'Platform Partners' });
const meetingsTheme = resolveDistrictThemeForSector({ color_theme: '#0f766e', id: 'meetings', name: 'Meetings & Demos' });

const boothPlacements: ExpoBoothPlacement[] = [
  {
    boothType: 'hero',
    clusterIndex: 0,
    color: '#22c55e',
    company: { id: 'hero-1', name: 'Warpala Platform', posterUrl: null, logo_url: null, sponsorTier: 'hero', tagline: 'Hero arrival experience' },
    districtTheme: platformTheme,
    districtThemeId: platformTheme.id,
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
    clusterIndex: 1,
    color: '#38bdf8',
    company: { id: 'gold-1', name: 'Sponsor Concierge', posterUrl: null, logo_url: null, sponsorTier: 'gold', tagline: 'Meetings and routing' },
    districtTheme: meetingsTheme,
    districtThemeId: meetingsTheme.id,
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
    clusterIndex: 1,
    color: '#f59e0b',
    company: { id: 'std-1', name: 'Demo Room Access', posterUrl: null, logo_url: null, sponsorTier: 'silver', tagline: 'Enter live booth rooms' },
    districtTheme: meetingsTheme,
    districtThemeId: meetingsTheme.id,
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
  { clusterIndex: 0, color: '#22c55e', districtTheme: platformTheme, districtThemeId: platformTheme.id, id: 'gateway-arrival-left', label: 'Arrival Sponsors', position: [-92, 0, -28], side: 'left', sectorId: 'arrival-core' },
  { clusterIndex: 0, color: '#22c55e', districtTheme: platformTheme, districtThemeId: platformTheme.id, id: 'gateway-arrival-right', label: 'Arrival Sponsors', position: [92, 0, -28], side: 'right', sectorId: 'arrival-core' },
  { clusterIndex: 1, color: '#0f766e', districtTheme: meetingsTheme, districtThemeId: meetingsTheme.id, id: 'gateway-meetings-left', label: 'Meetings', position: [-92, 0, -166], side: 'left', sectorId: 'meetings' },
];

const districtPrograms: ExpoDistrictProgramSummary[] = [
  {
    authoredMomentCount: 1,
    clusterIndex: 0,
    depth: 3,
    downgradeReason: null,
    expressionMode: 'active-commercial',
    frontageIntensity: 3,
    frontagePackage: {
      hasGroundEngagement: true,
      hasPrimaryScreenPlane: true,
      hasSecondarySupport: true,
    },
    isCommerciallyEligible: true,
    footprintDepth: 24,
    footprintWidth: 72,
    programNodeCount: 2,
    programTargets: [
      { allocated: 1, requested: 1, role: 'arrival_anchor' },
      { allocated: 1, requested: 1, role: 'info_pavilion' },
    ],
    sectorId: 'arrival-core',
    sponsorBackedFrontCount: 2,
    supportLevel: 'hero-supported',
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
    footprintDepth: 34,
    footprintWidth: 80,
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

const firstLayout = buildSponsorScreenLayout(boothPlacements, sectorMarkers, districtPrograms);
const secondLayout = buildSponsorScreenLayout(boothPlacements, sectorMarkers, districtPrograms);

assert.deepEqual(firstLayout, secondLayout);
assert.equal(firstLayout.facadeScreens.length, 0);
assert.equal(firstLayout.mediumScreens.length, 0);
assert.ok(firstLayout.groundScreens.length >= 2);
assert.ok(firstLayout.groundScreens.length <= 6);
assert.ok(firstLayout.groundScreens.some((screen) => screen.title === 'Arrival'));
assert.ok(firstLayout.groundScreens.some((screen) => screen.title === 'Arrival Sponsors Live'));
assert.ok(!firstLayout.groundScreens.some((screen) => screen.title === 'Meetings Meet'));
assert.ok(!firstLayout.groundScreens.some((screen) => screen.sectorName === 'Meetings' && screen.ctaLabel === 'Meet'));
assert.equal(firstLayout.districtFrontage['arrival-core']?.hasGroundEngagement, true);
assert.equal(firstLayout.districtFrontage['meetings']?.intensity, 1);
