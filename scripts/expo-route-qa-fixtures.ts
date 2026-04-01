import { buildSponsorBoulevardPlan } from '../src/modules/expo/lib/boulevardLayout.js';
import { isPointWithinExpoWalkRegions } from '../src/modules/expo/walk-region.js';
import { buildExpoWorldContract } from '../src/modules/expo/world-contract.js';

type FixtureScene = {
  companies: Array<Record<string, unknown>>;
  sectors: Array<Record<string, unknown>>;
};

const FIXTURES: Record<string, FixtureScene> = {
  'left-heavy-sparse': {
    companies: [
      { boothType: 'hero', id: 'hero-left', name: 'Hero Left', priority: 100, sector_id: 'design', sponsorTier: 'hero', booth: { id: 'hero-left' } },
      { boothType: 'premium', id: 'design-premium', name: 'Design Premium', priority: 90, sector_id: 'design', sponsorTier: 'gold', booth: { id: 'design-premium' } },
      { boothType: 'standard', id: 'meetings-standard', name: 'Meetings Standard', priority: 60, sector_id: 'meetings', sponsorTier: 'silver', booth: { id: 'meetings-standard' } },
    ],
    sectors: [
      { id: 'design', name: 'Design', color_theme: '#3b82f6', map_position: { x: 0, z: 0 } },
      { id: 'platform', name: 'Platform Partners', color_theme: '#2563eb', map_position: { x: 10, z: -10 } },
      { id: 'meetings', name: 'Meetings & Demos', color_theme: '#0f766e', map_position: { x: 20, z: -20 } },
    ],
  },
  'mixed-left-right': {
    companies: [
      { boothType: 'hero', id: 'hero-left', name: 'Hero Left', priority: 100, sector_id: 'design', sponsorTier: 'hero', booth: { id: 'hero-left' } },
      { boothType: 'hero', id: 'hero-right', name: 'Hero Right', priority: 95, sector_id: 'design', sponsorTier: 'hero', booth: { id: 'hero-right' } },
      { boothType: 'premium', id: 'platform-left', name: 'Platform Left', priority: 90, sector_id: 'platform', sponsorTier: 'gold', booth: { id: 'platform-left' } },
      { boothType: 'standard', id: 'platform-right', name: 'Platform Right', priority: 80, sector_id: 'platform', sponsorTier: 'silver', booth: { id: 'platform-right' } },
      { boothType: 'standard', id: 'meetings-left', name: 'Meetings Left', priority: 70, sector_id: 'meetings', sponsorTier: 'silver', booth: { id: 'meetings-left' } },
      { boothType: 'standard', id: 'meetings-right', name: 'Meetings Right', priority: 60, sector_id: 'meetings', sponsorTier: 'silver', booth: { id: 'meetings-right' } },
    ],
    sectors: [
      { id: 'design', name: 'Design', color_theme: '#3b82f6', map_position: { x: 0, z: 0 } },
      { id: 'platform', name: 'Platform Partners', color_theme: '#2563eb', map_position: { x: 10, z: -10 } },
      { id: 'meetings', name: 'Meetings & Demos', color_theme: '#0f766e', map_position: { x: 20, z: -20 } },
    ],
  },
  'empty-sector-bridge': {
    companies: [
      { boothType: 'hero', id: 'design-hero', name: 'Design Hero', priority: 100, sector_id: 'design', sponsorTier: 'hero', booth: { id: 'design-hero' } },
      { boothType: 'standard', id: 'meetings-standard', name: 'Meetings Standard', priority: 70, sector_id: 'meetings', sponsorTier: 'silver', booth: { id: 'meetings-standard' } },
    ],
    sectors: [
      { id: 'design', name: 'Design', color_theme: '#3b82f6', map_position: { x: 0, z: 0 } },
      { id: 'platform', name: 'Platform Partners', color_theme: '#2563eb', map_position: { x: 10, z: -10 } },
      { id: 'meetings', name: 'Meetings & Demos', color_theme: '#0f766e', map_position: { x: 20, z: -20 } },
    ],
  },
};

function summarizeFixture(name: string, scene: FixtureScene) {
  const plan = buildSponsorBoulevardPlan(scene.companies as never[], scene.sectors as never[]);
  const contract = buildExpoWorldContract(scene);
  const { boothPlacements, districtPrograms, playBounds, qualityProfileInputs, routeContract, startView, visualProfile, walkRegions } = contract;
  const sectorGatewayZs = plan.sectorGateways
    .filter((node) => node.position[0] < 0)
    .map((node) => ({ sectorId: node.sectorId ?? 'unassigned', z: node.position[2] }));

  return {
    name,
    boothCount: boothPlacements.length,
    footprint: plan.footprint,
    playBounds,
    startView,
    walkRegionSummary: walkRegions.map((region) => ({
      id: region.id,
      spanX: region.maxX - region.minX,
      spanZ: region.maxZ - region.minZ,
      type: region.type,
    })),
    routeContract: {
      arrivalZone: routeContract.arrivalZone.id,
      boothPockets: routeContract.boothPockets.length,
      centralSpine: routeContract.centralSpine.id,
      discoveryLanes: routeContract.discoveryLanes.length,
      scenicEdges: routeContract.scenicEdges.length,
      secondaryLoops: routeContract.secondaryLoops.length,
      sectorPockets: routeContract.sectorPockets.length,
    },
    districtPrograms: districtPrograms.map((district) => ({
      authoredMomentCount: district.authoredMomentCount,
      clusterIndex: district.clusterIndex,
      depth: district.depth,
      downgradeReason: district.downgradeReason,
      expressionMode: district.expressionMode,
      frontageIntensity: district.frontageIntensity,
      isCommerciallyEligible: district.isCommerciallyEligible,
      programNodeCount: district.programNodeCount,
      programTargets: district.programTargets,
      sectorId: district.sectorId ?? 'unassigned',
      sectorLabel: district.sectorLabel,
      sponsorBackedFrontCount: district.sponsorBackedFrontCount,
      supportLevel: district.supportLevel,
    })),
    qualityProfileInputs,
    visualProfile: {
      districts: visualProfile.districts.map((district) => ({
        expressionMode: district.expressionMode,
        frontageIntensity: district.frontageIntensity,
        groundBase: district.groundBase,
        hudAccent: district.hudAccent,
        sectorId: district.sectorId ?? 'unassigned',
        skylineOpacity: district.skylineOpacity,
      })),
      global: visualProfile.global,
    },
    checkpoints: {
      arrivalCenter: isPointWithinExpoWalkRegions({ x: 0, z: plan.arrivalNode.position[2] + 8 }, walkRegions),
      deepCenterSpine: isPointWithinExpoWalkRegions({ x: 0, z: Math.min(...boothPlacements.map((placement) => placement.position[2])) + 8 }, walkRegions),
      farLeftEdge: isPointWithinExpoWalkRegions({ x: -132, z: -120 }, walkRegions),
      farRightEdge: isPointWithinExpoWalkRegions({ x: 132, z: -120 }, walkRegions),
    },
    sectorGatewayZs,
  };
}

const summaries = Object.entries(FIXTURES).map(([name, scene]) => summarizeFixture(name, scene));
console.log(JSON.stringify({ generatedAt: new Date().toISOString(), summaries }, null, 2));
