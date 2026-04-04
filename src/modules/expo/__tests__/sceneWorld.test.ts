import assert from 'node:assert/strict';
import { ZoneSystem } from '../../../modules/city/ZoneSystem.js';
import { buildSponsorBoulevardPlan, rankCompaniesForBoulevard, UNASSIGNED_SECTOR_ID } from '../lib/boulevardLayout.js';
import { buildCuratedCityPlan, buildExpoGenerationSignature, buildExpoWorldDiagnostics, createDistrictBoothZone, replaceDistrictBoothZones } from '../sceneWorld.js';
import type { ExpoSceneCompany, ExpoSceneSector } from '../types/scene.js';
import { buildExpoPlayBoundsFromPlacements, buildExpoWalkRegionContract, isPointWithinExpoWalkRegions } from '../walk-region.js';
import { buildExpoWorldContract, buildExpoSponsorStartView } from '../world-contract.js';

const sponsorData = {
  companies: [
    { boothType: 'standard', id: 'company-1', name: 'Beta Build', priority: 20, sector_id: 'sector-1', sponsorTier: 'gold', booth: { id: 'booth-1' } },
    { boothType: 'hero', id: 'company-2', name: 'Alpha Hero', priority: 20, sector_id: 'sector-1', sponsorTier: 'hero', booth: { id: 'booth-2' } },
    { boothType: 'premium', id: 'company-3', name: 'Gamma Premium', priority: 20, sector_id: 'sector-2', sponsorTier: 'platinum', booth: { id: 'booth-3' } },
    { boothType: 'standard', id: 'company-4', name: 'Delta Standard', priority: 8, sectorId: 'sector-2', sponsorTier: 'silver', booth: { id: 'booth-4' } },
    { boothType: 'poster', id: 'company-5', name: 'Ēka Baltic', priority: 8, sponsorTier: 'bronze', booth: { id: 'booth-5' } },
  ] as ExpoSceneCompany[],
  sectors: [
    { id: 'sector-1', name: 'Infra', color_theme: '#0ea5e9', map_position: { x: 0, z: 0 } },
    { id: 'sector-2', name: 'AI', color_theme: '#22c55e', map_position: { x: 10, z: -10 } },
  ] as ExpoSceneSector[],
};

const rankedCompanies = rankCompaniesForBoulevard(sponsorData.companies, sponsorData.sectors);
assert.deepEqual(
  rankedCompanies.map((company) => company.id),
  ['company-2', 'company-3', 'company-1', 'company-4', 'company-5']
);
assert.equal(rankedCompanies[4].sectorId, UNASSIGNED_SECTOR_ID);

const boulevardPlan = buildSponsorBoulevardPlan(sponsorData.companies, sponsorData.sectors);
assert.equal(boulevardPlan.arrivalNode.nodeType, 'arrival');
assert.equal(boulevardPlan.sectorGateways.length, 6);
assert.equal(boulevardPlan.districts.length, 3);
assert.ok(boulevardPlan.nodes.some((node) => node.nodeType === 'anchor_plaza'));
assert.ok(boulevardPlan.nodes.some((node) => node.nodeType === 'connector_corridor'));
assert.ok(boulevardPlan.nodes.some((node) => node.nodeType === 'side_lane_node'));
assert.ok(boulevardPlan.nodes.some((node) => node.nodeType === 'hero_forecourt'));
assert.ok(boulevardPlan.nodes.some((node) => node.nodeType === 'programmed_filler'));
assert.equal(boulevardPlan.nodes.find((node) => node.companyId === 'company-2')?.nodeType, 'hero_left');
assert.equal(boulevardPlan.nodes.find((node) => node.companyId === 'company-3')?.nodeType, 'endcap');
assert.equal(boulevardPlan.nodes.find((node) => node.companyId === 'company-1')?.nodeType, 'endcap');
assert.equal(boulevardPlan.nodes.find((node) => node.companyId === 'company-4')?.nodeType, 'standard_left');
assert.equal(boulevardPlan.nodes.find((node) => node.companyId === 'company-5')?.sectorId, UNASSIGNED_SECTOR_ID);
assert.ok(boulevardPlan.districts.every((district) => district.programTargets.some((target) => target.role === 'arrival_anchor' && target.target === 1)));
assert.ok(boulevardPlan.districts.every((district) => district.programNodeIds.length > 0));
assert.ok(boulevardPlan.districts.some((district) => district.expressionMode === 'active-commercial'));
assert.ok(boulevardPlan.districts.some((district) => district.isCommerciallyEligible === false));
assert.ok(boulevardPlan.districts.every((district) => district.authoredMomentCount >= 1));
assert.deepEqual(buildSponsorBoulevardPlan(sponsorData.companies, sponsorData.sectors), boulevardPlan);

const overflowHeroPlan = buildSponsorBoulevardPlan([
  { boothType: 'hero', id: 'hero-1', name: 'Hero One', priority: 100, sector_id: 'sector-1', sponsorTier: 'hero' },
  { boothType: 'hero', id: 'hero-2', name: 'Hero Two', priority: 90, sector_id: 'sector-1', sponsorTier: 'hero' },
  { boothType: 'hero', id: 'hero-3', name: 'Hero Three', priority: 80, sector_id: 'sector-1', sponsorTier: 'hero' },
  { boothType: 'standard', id: 'std-1', name: 'Standard One', priority: 10, sector_id: 'sector-1', sponsorTier: 'silver' },
], sponsorData.sectors);
assert.deepEqual(
  overflowHeroPlan.nodes.filter((node) => node.companyId).map((node) => node.companyId),
  ['hero-1', 'hero-2', 'hero-3', 'std-1']
);
assert.equal(overflowHeroPlan.nodes.find((node) => node.companyId === 'hero-1')?.nodeType, 'hero_left');
assert.equal(overflowHeroPlan.nodes.find((node) => node.companyId === 'hero-2')?.nodeType, 'hero_right');
assert.equal(overflowHeroPlan.nodes.find((node) => node.companyId === 'hero-3')?.nodeType, 'endcap');

const emptySectorPlan = buildSponsorBoulevardPlan(sponsorData.companies, [
  ...sponsorData.sectors,
  { id: 'sector-3', name: 'Fintech', color_theme: '#f59e0b', map_position: { x: 20, z: -20 } } as ExpoSceneSector,
]);
assert.equal(emptySectorPlan.sectorGateways.length, 8);
assert.ok(emptySectorPlan.sectorGateways.some((node) => node.sectorId === 'sector-3'));
assert.deepEqual(
  emptySectorPlan.sectorGateways
    .filter((node) => node.sectorId === 'sector-3')
    .map((node) => node.sectorLabel),
  ['Fintech', 'Fintech']
);
assert.ok(emptySectorPlan.nodes.some((node) => node.sectorId === 'sector-3' && node.nodeType === 'anchor_plaza'));
assert.ok(emptySectorPlan.nodes.some((node) => node.sectorId === 'sector-3' && node.nodeType === 'connector_corridor'));
assert.ok(emptySectorPlan.nodes.some((node) => node.sectorId === 'sector-3' && node.nodeType === 'side_lane_node'));
assert.ok(emptySectorPlan.nodes.some((node) => node.sectorId === 'sector-3' && node.nodeType === 'programmed_filler'));
assert.ok(emptySectorPlan.districts.find((district) => district.sectorId === 'sector-3')?.programTargets.some((target) => target.role === 'scenic_showcase' && target.target === 2));
assert.equal(emptySectorPlan.districts.find((district) => district.sectorId === 'sector-3')?.expressionMode, 'scenic');
assert.equal(emptySectorPlan.districts.find((district) => district.sectorId === 'sector-3')?.downgradeReason, 'empty-sector');
const sector2GatewayZ = emptySectorPlan.sectorGateways.find((node) => node.sectorId === 'sector-2' && node.position[0] < 0)?.position[2] ?? 0;
const sector3GatewayZ = emptySectorPlan.sectorGateways.find((node) => node.sectorId === 'sector-3' && node.position[0] < 0)?.position[2] ?? 0;
assert.ok(Math.abs(sector3GatewayZ - sector2GatewayZ) <= 760);

const multiWorld = buildExpoWorldContract(sponsorData);
const multiPlacements = multiWorld.boothPlacements;
assert.equal(multiWorld.districtPrograms.length, 3);
assert.ok(multiWorld.qualityProfileInputs.districtProgramNodeCount >= multiWorld.districtPrograms.length * 6);
assert.ok(multiWorld.qualityProfileInputs.districtProgramTargetCount >= multiWorld.qualityProfileInputs.districtProgramNodeCount);
assert.ok(multiWorld.qualityProfileInputs.sponsorBackedDistrictCount >= 2);
assert.equal(multiWorld.qualityProfileInputs.unsupportedActiveDistrictCount, 0);
assert.equal(multiWorld.qualityProfileInputs.scenicWithoutAuthoredMomentCount, 0);
assert.ok(Object.values(multiWorld.qualityProfileInputs.frontageIntensityByDistrict).some((value) => value >= 2));
const zoneSystem = new ZoneSystem();

zoneSystem.replaceZonesByPrefix('district-booth-', multiPlacements.map(createDistrictBoothZone));

assert.equal(multiPlacements.length, 5);
assert.equal(zoneSystem.getZones().length, multiPlacements.length);
assert.deepEqual(
  zoneSystem.getZones().map((zone) => zone.id),
  multiPlacements.map((placement) => `district-booth-${placement.id}`)
);

const repeatedReplacement = replaceDistrictBoothZones(zoneSystem, multiPlacements);
assert.equal(repeatedReplacement.registeredZoneCount, multiPlacements.length);
assert.equal(zoneSystem.getZones().length, multiPlacements.length);
assert.deepEqual(
  zoneSystem.getZones().map((zone) => zone.id),
  multiPlacements.map((placement) => `district-booth-${placement.id}`)
);

zoneSystem.addZone({
  id: 'web-lobby',
  position: [0, 0, 0],
  radius: 8,
  type: 'web',
});
replaceDistrictBoothZones(zoneSystem, multiPlacements.slice(0, 1));
assert.deepEqual(
  zoneSystem.getZones().map((zone) => zone.id).sort(),
  ['district-booth-company-2', 'web-lobby']
);

const singleWorld = buildExpoWorldContract({
  companies: [
    { id: 'company-3', sector_id: 'sector-2', booth: { id: 'booth-3' } },
  ],
  sectors: [
    { id: 'sector-2', color_theme: '#22c55e', map_position: { x: 0, z: -20 } },
  ],
});
const singlePlacement = singleWorld.boothPlacements;

assert.equal(singlePlacement.length, 1);
assert.deepEqual(createDistrictBoothZone(singlePlacement[0]).id, 'district-booth-company-3');
assert.equal(multiPlacements[0].nodeType, 'hero_left');
assert.equal(multiPlacements[0].districtThemeId, 'sponsor_gallery');
assert.equal(multiPlacements[1].nodeType, 'endcap');
assert.equal(multiPlacements[1].districtThemeId, 'sponsor_gallery');
assert.equal(multiPlacements[2].nodeType, 'endcap');
assert.equal(multiPlacements[4].sectorId, UNASSIGNED_SECTOR_ID);
assert.equal(multiPlacements[4].districtThemeId, 'sponsor_gallery');
assert.ok(Math.abs(multiPlacements[0].position[0]) >= 32);
assert.ok(multiPlacements[0].position[2] <= -30);
assert.ok(Math.abs(multiPlacements[0].rotation[1]) > 1);

const initialGenerationSignature = buildExpoGenerationSignature({
  assetUrls: ['shared.glb'],
  boothPlacements: multiPlacements,
  gridSize: 8,
  qualityTier: 'balanced',
  spacing: 12,
});
const changedPlacementSignature = buildExpoGenerationSignature({
  assetUrls: ['shared.glb'],
  boothPlacements: singlePlacement,
  gridSize: 8,
  qualityTier: 'balanced',
  spacing: 12,
});

assert.notEqual(initialGenerationSignature, changedPlacementSignature);

const curatedPlan = buildCuratedCityPlan();

assert.ok(curatedPlan.placements.length >= 45);
assert.ok(curatedPlan.placements.filter((placement) => placement.category === 'road').length >= 30);
assert.ok(curatedPlan.placements.filter((placement) => placement.category === 'building').length >= 12);
assert.ok(curatedPlan.placements.filter((placement) => placement.category === 'landmark').length >= 3);
assert.ok(curatedPlan.placements.filter((placement) => placement.category === 'nature').length >= 12);
assert.ok(curatedPlan.visibleCore.plannedCoreCells.some((cell) => cell.role === 'structure'));
assert.ok(curatedPlan.visibleCore.plannedCoreCells.filter((cell) => cell.role === 'road').length >= 5);
assert.equal(curatedPlan.visibleCore.failedCoreCells.length, 0);

const playBounds = buildExpoPlayBoundsFromPlacements(multiPlacements);
assert.deepEqual(playBounds, buildExpoPlayBoundsFromPlacements(buildExpoWorldContract(sponsorData).boothPlacements));
assert.ok(playBounds.minX <= -500);
assert.ok(playBounds.maxX >= 500);
assert.ok(playBounds.minZ <= -900);
assert.ok(playBounds.maxZ >= boulevardPlan.arrivalNode.position[2] + 120);
assert.ok(boulevardPlan.arrivalNode.position[0] >= playBounds.minX && boulevardPlan.arrivalNode.position[0] <= playBounds.maxX);
assert.ok(boulevardPlan.arrivalNode.position[2] >= playBounds.minZ && boulevardPlan.arrivalNode.position[2] <= playBounds.maxZ);

const sparseWorldBounds = buildExpoPlayBoundsFromPlacements(singlePlacement);
assert.ok(sparseWorldBounds.maxX - sparseWorldBounds.minX >= 900);
assert.ok(sparseWorldBounds.maxZ - sparseWorldBounds.minZ >= 700);

const startView = buildExpoSponsorStartView(boulevardPlan);
assert.equal(startView.source, 'arrival-main');
assert.equal(startView.position[0], 0);
assert.equal(startView.position[1], 8.2);
assert.ok(startView.position[2] > boulevardPlan.arrivalNode.position[2]);
assert.ok(startView.lookAt[2] < boulevardPlan.arrivalNode.position[2]);

const walkRegions = buildExpoWalkRegionContract(multiPlacements).walkRegions;
assert.ok(walkRegions.some((region) => region.type === 'arrival'));
assert.ok(walkRegions.some((region) => region.type === 'spine'));
assert.ok(walkRegions.some((region) => region.type === 'secondary-loop'));
assert.ok(walkRegions.some((region) => region.type === 'discovery-lane'));
assert.ok(walkRegions.some((region) => region.type === 'scenic-edge'));
assert.ok(walkRegions.some((region) => region.type === 'sector-pocket'));
assert.ok(walkRegions.some((region) => region.type === 'booth-pocket'));
assert.ok(isPointWithinExpoWalkRegions({ x: 0, z: boulevardPlan.arrivalNode.position[2] + 8 }, walkRegions));
assert.ok(isPointWithinExpoWalkRegions({ x: 0, z: -120 }, walkRegions));
assert.ok(isPointWithinExpoWalkRegions({ x: -44, z: multiPlacements[0].position[2] - 4 }, walkRegions));
assert.ok(isPointWithinExpoWalkRegions({ x: -78, z: multiPlacements[0].position[2] - 4 }, walkRegions));
assert.ok(isPointWithinExpoWalkRegions({ x: -116, z: -120 }, walkRegions));
assert.ok(isPointWithinExpoWalkRegions({ x: 116, z: -120 }, walkRegions));
assert.equal(isPointWithinExpoWalkRegions({ x: -620, z: -120 }, walkRegions), false);
assert.equal(isPointWithinExpoWalkRegions({ x: 620, z: -120 }, walkRegions), false);
assert.ok(isPointWithinExpoWalkRegions({ x: 52, z: multiPlacements[1].position[2] - 2 }, walkRegions));

const rightSidePlacements = buildExpoWorldContract({
  companies: [
    { boothType: 'hero', id: 'hero-left', name: 'Hero Left', priority: 100, sector_id: 'sector-1', sponsorTier: 'hero', booth: { id: 'hero-left' } },
    { boothType: 'hero', id: 'hero-right', name: 'Hero Right', priority: 95, sector_id: 'sector-1', sponsorTier: 'hero', booth: { id: 'hero-right' } },
    { boothType: 'standard', id: 'sector2-left', name: 'Sector 2 Left', priority: 90, sector_id: 'sector-2', sponsorTier: 'silver', booth: { id: 'sector2-left' } },
    { boothType: 'standard', id: 'sector2-right', name: 'Sector 2 Right', priority: 80, sector_id: 'sector-2', sponsorTier: 'silver', booth: { id: 'sector2-right' } },
  ],
  sectors: sponsorData.sectors,
}).boothPlacements;
const rightSideWalkRegions = buildExpoWalkRegionContract(rightSidePlacements).walkRegions;
assert.ok(isPointWithinExpoWalkRegions({ x: 32, z: -136 }, rightSideWalkRegions));
assert.ok(isPointWithinExpoWalkRegions({ x: 78, z: -136 }, rightSideWalkRegions));
assert.equal(isPointWithinExpoWalkRegions({ x: -620, z: -136 }, rightSideWalkRegions), false);

const sectorMarkers = multiWorld.sectorMarkers;
assert.equal(sectorMarkers.length, 6);
assert.equal(sectorMarkers[0].side, 'left');
assert.equal(sectorMarkers[1].side, 'right');
assert.equal(sectorMarkers[0].districtThemeId, 'sponsor_gallery');
assert.equal(sectorMarkers[2].districtThemeId, 'sponsor_gallery');

const diagnostics = buildExpoWorldDiagnostics({
  assetUrls: ['a.glb', 'b.glb'],
  boothPlacements: [],
  placementSummary: { skippedByReason: { NO_VALIDATED_MODULES: 2 } },
  processed: {
    modules: [],
    rejected: [],
    summary: {
      accepted: 0,
      acceptedFromHeuristics: 0,
      acceptedFromManifest: 0,
      disabledByManifest: 0,
      rejected: 2,
      rejectedByReason: { GEO_ZERO_SIZE: 2 },
    },
  },
  rawModelCount: 2,
});

assert.equal(diagnostics.status, 'no-valid-modules');
assert.equal(diagnostics.processedModuleCount, 0);
assert.deepEqual(diagnostics.rejectedReasonCounts, { GEO_ZERO_SIZE: 2 });

const successfulDiagnostics = buildExpoWorldDiagnostics({
  assetUrls: ['one.glb'],
  boothPlacements: singlePlacement,
  placementSummary: { skippedByReason: {} },
  processed: {
    modules: [{ id: 'module-1' }] as any,
    rejected: [],
    summary: {
      accepted: 1,
      acceptedFromHeuristics: 1,
      acceptedFromManifest: 0,
      disabledByManifest: 0,
      rejected: 0,
      rejectedByReason: {},
    },
  },
  rawModelCount: 1,
});

assert.equal(successfulDiagnostics.status, 'ready');
assert.equal(successfulDiagnostics.processedModuleCount, 1);
assert.equal(successfulDiagnostics.boothPlacementCount, 1);
