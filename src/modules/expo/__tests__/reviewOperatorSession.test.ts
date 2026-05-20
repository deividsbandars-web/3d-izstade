import assert from 'node:assert/strict';
import {
  DEFAULT_REVIEW_OPERATOR_ZONE_ID,
  buildReviewOperatorZones,
  resolveReviewOperatorZoneStartView,
} from '../runtime/operator/model/reviewOperatorSession.js';
import { buildCanonicalWorldPlanFromWorldContract } from '../runtime/planning/index.js';
import {
  buildBoothWorldObjectRegistry,
  buildCityWorldObjectRegistry,
  buildGroundWorldObjectRegistry,
  buildStadiumWorldObjectRegistry,
} from '../runtime/world/inspection/worldObjectRegistry.js';
import { PRODUCTION_SAFE_COMPANIES, PRODUCTION_SAFE_SECTORS } from '../state/expoRuntime.js';
import { buildExpoWorldContract } from '../../../shared/expo/worldContract.js';

const zones = buildReviewOperatorZones();
const zoneIds = zones.map((zone) => zone.id);

function assertVectorClose(actual: number[], expected: number[]) {
  assert.equal(actual.length, expected.length);
  actual.forEach((value, index) => {
    assert.ok(Math.abs(value - expected[index]) < 1e-9, `Expected vector[${index}] ${value} to be close to ${expected[index]}`);
  });
}

assert.equal(zones.length, 61);
assert.equal(DEFAULT_REVIEW_OPERATOR_ZONE_ID, 'arrival-gate');
assert.deepEqual(zoneIds, [
  'arrival-gate',
  'arrival-civic-axis',
  'left-marquee',
  'left-marquee-close',
  'left-edge-far',
  'city-left-front-corner',
  'left-civilization-monument',
  'center-spine',
  'mid-start-deep',
  'center-spine-side',
  'sky-market-spine',
  'sky-market-spine-access',
  'genesis-portal-gate',
  'ai-reactor-core',
  'energy-grid-network',
  'ai-oracle-chamber',
  'center-sky-compass',
  'right-marquee',
  'right-skybridge-landmark',
  'right-marquee-close',
  'right-edge-far',
  'right-orbital-broadcast-foundry',
  'right-orbital-broadcast-foundry-skyline',
  'tower-cluster',
  'tower-cluster-vertical-pilot',
  'tower-cluster-mega-highrise',
  'tower-cluster-mega-skyline',
  'tower-cluster-television-tower',
  'tower-cluster-television-tower-crown',
  'tower-cluster-east-needle',
  'tower-cluster-rear-needle',
  'tower-cluster-reverse-wide',
  'array-band',
  'array-band-south',
  'array-left-near-direct',
  'array-right-near-direct',
  'array-upper-left-direct',
  'array-upper-right-direct',
  'array-upper-left-1-direct',
  'array-upper-right-1-direct',
  'sponsor-boulevard-left',
  'sponsor-boulevard-left-close',
  'sponsor-boulevard-right',
  'sponsor-boulevard-right-medium',
  'stadium-approach',
  'rear-campus-entry-pulse-arches',
  'stadium-left-flank',
  'rear-campus-center',
  'stadium-feed-axis',
  'rear-campus-orbital-scoregate',
  'stadium-right-flank',
  'rear-campus-right-landmark-feed',
  'rear-campus-sky-slab-feed',
  'ground-seam-transition',
  'ground-seam-overhead',
  'rear-campus-left-rear-corner',
  'rear-campus-right-rear-corner',
  'rear-campus-left-front-corner',
  'rear-campus-right-front-corner',
  'rear-campus-mega-hall',
  'rear-campus-needle-crown',
]);

assert.ok(zones.every((zone) => zone.expectedVisibleLayers.length > 0));
assert.ok(zones.every((zone) => zone.watchItems.length > 0));
assert.ok(zones.every((zone) => zone.startView.position.length === 3));
assert.ok(zones.every((zone) => zone.startView.lookAt.length === 3));

const productionSafeWorld = buildExpoWorldContract({
  companies: PRODUCTION_SAFE_COMPANIES,
  sectors: PRODUCTION_SAFE_SECTORS,
});
const productionSafePlan = buildCanonicalWorldPlanFromWorldContract(productionSafeWorld);
const productionSafeRearCampusPlan = productionSafePlan.zones.find((zone) => zone.id === 'rear-campus');
const productionSafeRearCampus = productionSafeRearCampusPlan?.zoneExtension?.rearCampus;
assert.ok(productionSafeRearCampusPlan);
assert.ok(productionSafeRearCampus);
const productionSafeRegistryEntries = [
  ...buildGroundWorldObjectRegistry(),
  ...buildCityWorldObjectRegistry({
    districtCount: productionSafeWorld.districtPrograms.length,
    districtStride: productionSafePlan.districtStride,
    plan: productionSafePlan,
  }),
  ...buildStadiumWorldObjectRegistry({
    campusCenterZ: productionSafeRearCampus.campusCenterZ,
    rearCampusPlan: productionSafeRearCampusPlan,
  }),
  ...buildBoothWorldObjectRegistry(productionSafeWorld.boothPlacements),
];
const productionSafeRegistryById = new Map(productionSafeRegistryEntries.map((entry) => [entry.id, entry]));
for (const entry of productionSafeRegistryEntries) {
  for (const alias of entry.aliases ?? []) {
    if (!productionSafeRegistryById.has(alias)) {
      productionSafeRegistryById.set(alias, entry);
    }
  }
}
for (const zone of zones) {
  const registryTargetIds = [...zone.expectedKeyObjectIds, ...(zone.camera?.targetIds ?? [])];
  for (const targetId of registryTargetIds) {
    assert.ok(
      productionSafeRegistryById.has(targetId),
      `${zone.id} operator target ${targetId} must resolve in production-safe world registry`,
    );
  }
}

const productionAiReactor = productionSafeRegistryById.get('ai-reactor-core-primitive-rig');
assert.ok(productionAiReactor);
assert.equal(productionAiReactor.sourceKind, 'ai-reactor-core-render-rig');
assert.deepEqual(productionAiReactor.position, [-700, 410, -600]);
assert.deepEqual(productionAiReactor.size, [280, 820, 280]);
const productionGenesisPortal = productionSafeRegistryById.get('genesis-portal-gate-primitive-rig');
assert.ok(productionGenesisPortal);
assert.equal(productionGenesisPortal.sourceKind, 'genesis-portal-gate-render-rig');
assert.deepEqual(productionGenesisPortal.position, [0, 1150, 1120]);
assert.deepEqual(productionGenesisPortal.size, [1480, 2300, 620]);
const productionEnergyGrid = productionSafeRegistryById.get('energy-grid-network-primitive-rig');
assert.ok(productionEnergyGrid);
assert.equal(productionEnergyGrid.sourceKind, 'energy-grid-network-render-rig');
assert.deepEqual(productionEnergyGrid.position, [-420, 850, -520]);
assert.deepEqual(productionEnergyGrid.size, [1, 1700, 1]);
const productionAiOracle = productionSafeRegistryById.get('ai-oracle-chamber-primitive-rig');
assert.ok(productionAiOracle);
assert.equal(productionAiOracle.sourceKind, 'ai-oracle-chamber-render-rig');
assert.deepEqual(productionAiOracle.position, [300, 500, -670]);
assert.deepEqual(productionAiOracle.size, [380, 1000, 380]);

const screenSurfaceTargetsById = new Map<string, string[]>();
const allowedDuplicateScreenSurfaceTargetZones = new Set([
  'array-upper-left-direct',
  'array-upper-right-direct',
  'center-spine-side',
]);
zones.forEach((zone) => {
  zone.expectedKeyObjectIds
    .filter((id) => /^screen-(marquee|array|spine)-/.test(id))
    .forEach((id) => {
      screenSurfaceTargetsById.set(id, [...(screenSurfaceTargetsById.get(id) ?? []), zone.id]);
    });
});
assert.deepEqual(
  [...screenSurfaceTargetsById.entries()]
    .filter(([, targetZones]) => targetZones.filter((zoneId) => !allowedDuplicateScreenSurfaceTargetZones.has(zoneId)).length > 1)
    .map(([id, targetZones]) => ({ id, zones: targetZones })),
  [],
);

const leftMarquee = zones.find((zone) => zone.id === 'left-marquee');
assert.ok(leftMarquee);
const resolvedLeftMarqueeView = resolveReviewOperatorZoneStartView(leftMarquee, new Map([
  ['screen-marquee-left-0', { position: [-744, 148, -244] }],
]));
assert.deepEqual(resolvedLeftMarqueeView.lookAt, [-744, 188, -244]);
assert.deepEqual(resolvedLeftMarqueeView.position, [-444, 228, -24]);

const leftEdgeFar = zones.find((zone) => zone.id === 'left-edge-far');
assert.ok(leftEdgeFar);
const resolvedLeftEdgeFarView = resolveReviewOperatorZoneStartView(leftEdgeFar, new Map([
  ['screen-array-left-2', { position: [-1080, 98, -1206] }],
]));
assert.deepEqual(resolvedLeftEdgeFarView.lookAt, [-1080, 156, -1206]);
assert.deepEqual(resolvedLeftEdgeFarView.position, [-780, 110, -1006]);

const cityLeftFrontCorner = zones.find((zone) => zone.id === 'city-left-front-corner');
assert.ok(cityLeftFrontCorner);
const resolvedCityLeftFrontCornerView = resolveReviewOperatorZoneStartView(cityLeftFrontCorner, new Map([
  ['city-perimeter-left-front-corner', { position: [-1710, 35, 770] }],
]));
assert.deepEqual(resolvedCityLeftFrontCornerView.lookAt, [-1650, 145, 650]);
assert.deepEqual(resolvedCityLeftFrontCornerView.position, [-1450, 185, 1130]);

const leftCivilizationMonument = zones.find((zone) => zone.id === 'left-civilization-monument');
assert.ok(leftCivilizationMonument);
const resolvedLeftCivilizationMonumentView = resolveReviewOperatorZoneStartView(leftCivilizationMonument, new Map([
  ['screen-array-left-upper-3', { position: [-900, 1320, 268.2] }],
]));
assertVectorClose(resolvedLeftCivilizationMonumentView.lookAt, [-900, 1400, 268.2]);
assertVectorClose(resolvedLeftCivilizationMonumentView.position, [2400, 840, -4931.8]);

const rightOrbitalBroadcastFoundry = zones.find((zone) => zone.id === 'right-orbital-broadcast-foundry');
assert.ok(rightOrbitalBroadcastFoundry);
const resolvedRightOrbitalBroadcastFoundryView = resolveReviewOperatorZoneStartView(rightOrbitalBroadcastFoundry, new Map([
  ['screen-array-right-upper-3', { position: [890, 2530, 300] }],
]));
assertVectorClose(resolvedRightOrbitalBroadcastFoundryView.lookAt, [890, 2650, 300]);
assertVectorClose(resolvedRightOrbitalBroadcastFoundryView.position, [130, 2950, -600]);

const rightOrbitalBroadcastFoundrySkyline = zones.find((zone) => zone.id === 'right-orbital-broadcast-foundry-skyline');
assert.ok(rightOrbitalBroadcastFoundrySkyline);
const resolvedRightOrbitalBroadcastFoundrySkylineView = resolveReviewOperatorZoneStartView(rightOrbitalBroadcastFoundrySkyline, new Map([
  ['orbital-broadcast-foundry-upper-broadcast-core', { position: [1060, 4070, 528] }],
  ['orbital-broadcast-foundry-signal-spire', { position: [1060, 4850, 528] }],
]));
assertVectorClose(resolvedRightOrbitalBroadcastFoundrySkylineView.lookAt, [1060, 3240, 528]);
assertVectorClose(resolvedRightOrbitalBroadcastFoundrySkylineView.position, [-820, 5360, -1652]);

const centerSpine = zones.find((zone) => zone.id === 'center-spine');
assert.ok(centerSpine);
const resolvedCenterSpineView = resolveReviewOperatorZoneStartView(centerSpine, new Map([
  ['screen-spine-primary-1', { position: [-184, 108, -796] }],
]));
assert.deepEqual(resolvedCenterSpineView.lookAt, [-184, 162, -796]);
assert.deepEqual(resolvedCenterSpineView.position, [-4, 208, -576]);

const aiReactorCore = zones.find((zone) => zone.id === 'ai-reactor-core');
assert.ok(aiReactorCore);
const resolvedAiReactorCoreView = resolveReviewOperatorZoneStartView(aiReactorCore, new Map([
  ['ai-reactor-core-primitive-rig', { position: [-700, 410, -600] }],
]));
assert.deepEqual(resolvedAiReactorCoreView.lookAt, [-700, 490, -600]);
assert.deepEqual(resolvedAiReactorCoreView.position, [-1850, 1060, 240]);

const genesisPortalGate = zones.find((zone) => zone.id === 'genesis-portal-gate');
assert.ok(genesisPortalGate);
const resolvedGenesisPortalGateView = resolveReviewOperatorZoneStartView(genesisPortalGate, new Map([
  ['genesis-portal-gate-primitive-rig', { position: [0, 1150, 1120] }],
]));
assert.deepEqual(resolvedGenesisPortalGateView.lookAt, [0, 1180, 1120]);
assert.deepEqual(resolvedGenesisPortalGateView.position, [-900, 1650, 2800]);

const energyGridNetwork = zones.find((zone) => zone.id === 'energy-grid-network');
assert.ok(energyGridNetwork);
const resolvedEnergyGridNetworkView = resolveReviewOperatorZoneStartView(energyGridNetwork, new Map([
  ['energy-grid-network-primitive-rig', { position: [-420, 850, -520] }],
]));
assert.deepEqual(resolvedEnergyGridNetworkView.lookAt, [-420, 1100, -520]);
assert.deepEqual(resolvedEnergyGridNetworkView.position, [-1920, 1900, 1580]);

const aiOracleChamber = zones.find((zone) => zone.id === 'ai-oracle-chamber');
assert.ok(aiOracleChamber);
const resolvedAiOracleChamberView = resolveReviewOperatorZoneStartView(aiOracleChamber, new Map([
  ['ai-oracle-chamber-primitive-rig', { position: [300, 500, -670] }],
]));
assert.deepEqual(resolvedAiOracleChamberView.lookAt, [300, 650, -670]);
assert.deepEqual(resolvedAiOracleChamberView.position, [1700, 1500, 470]);

const midStartDeep = zones.find((zone) => zone.id === 'mid-start-deep');
assert.ok(midStartDeep);
const resolvedMidStartDeepView = resolveReviewOperatorZoneStartView(midStartDeep, new Map([
  ['screen-spine-primary-2', { position: [-184, 108, -1344] }],
]));
assert.deepEqual(resolvedMidStartDeepView.lookAt, [-184, 204, -1344]);
assert.deepEqual(resolvedMidStartDeepView.position, [176, 208, -1124]);

const sponsorBoulevardLeft = zones.find((zone) => zone.id === 'sponsor-boulevard-left');
assert.ok(sponsorBoulevardLeft);
const resolvedSponsorBoulevardLeftView = resolveReviewOperatorZoneStartView(sponsorBoulevardLeft, new Map([
  ['left-front-booth', { layer: 'booth', position: [-536, 0, -244] }],
]));
assert.deepEqual(resolvedSponsorBoulevardLeftView.lookAt, [-536, 72, -244]);
assert.deepEqual(resolvedSponsorBoulevardLeftView.position, [-386, 80, -158]);

const sponsorBoulevardLeftClose = zones.find((zone) => zone.id === 'sponsor-boulevard-left-close');
assert.ok(sponsorBoulevardLeftClose);
const resolvedSponsorBoulevardLeftCloseView = resolveReviewOperatorZoneStartView(sponsorBoulevardLeftClose, new Map([
  ['left-rear-booth', { layer: 'booth', position: [-430, 0, -1412] }],
]));
assert.deepEqual(resolvedSponsorBoulevardLeftCloseView.lookAt, [-430, 70, -1412]);
assert.deepEqual(resolvedSponsorBoulevardLeftCloseView.position, [-690, 80, -1112]);

const sponsorBoulevardRight = zones.find((zone) => zone.id === 'sponsor-boulevard-right');
assert.ok(sponsorBoulevardRight);
const resolvedSponsorBoulevardRightView = resolveReviewOperatorZoneStartView(sponsorBoulevardRight, new Map([
  ['right-front-booth', { layer: 'booth', position: [80, 0, -798] }],
]));
assert.deepEqual(resolvedSponsorBoulevardRightView.lookAt, [78, 20, -796]);
assert.deepEqual(resolvedSponsorBoulevardRightView.position, [48, 22, -780]);

const rearCampusCenter = zones.find((zone) => zone.id === 'rear-campus-center');
assert.ok(rearCampusCenter);
const resolvedRearCampusCenterView = resolveReviewOperatorZoneStartView(rearCampusCenter, new Map([
  ['rear-campus-stage-monolith-canopy-host-surface', { position: [47, 126, -3250] }],
]));
assert.deepEqual(resolvedRearCampusCenterView.lookAt, [47, 336, -3250]);
assert.deepEqual(resolvedRearCampusCenterView.position, [467, 306, -2630]);

const stadiumLeftFlank = zones.find((zone) => zone.id === 'stadium-left-flank');
assert.ok(stadiumLeftFlank);
const resolvedStadiumLeftFlankView = resolveReviewOperatorZoneStartView(stadiumLeftFlank, new Map([
  ['rear-campus-event-pavilion-left-feed-surface', { position: [-720, 85.68, -1923.3] }],
]));
assert.deepEqual(resolvedStadiumLeftFlankView.lookAt, [-720, 129.68, -1923.3]);
assert.deepEqual(resolvedStadiumLeftFlankView.position, [-960, 103.68, -1703.3]);

const rearCampusEntryPulseArches = zones.find((zone) => zone.id === 'rear-campus-entry-pulse-arches');
assert.ok(rearCampusEntryPulseArches);
const resolvedRearCampusEntryPulseArchesView = resolveReviewOperatorZoneStartView(rearCampusEntryPulseArches, new Map([
  ['rear-campus-entry-pulse-arches', { position: [0, 280, -2534] }],
]));
assert.deepEqual(resolvedRearCampusEntryPulseArchesView.lookAt, [0, 400, -2534]);
assert.deepEqual(resolvedRearCampusEntryPulseArchesView.position, [780, 440, -1814]);

const stadiumFeedAxis = zones.find((zone) => zone.id === 'stadium-feed-axis');
assert.ok(stadiumFeedAxis);
const resolvedStadiumFeedAxisView = resolveReviewOperatorZoneStartView(stadiumFeedAxis, new Map([
  ['rear-campus-bowl-center-deck-screen-host-shell', { position: [0, 212, -4192] }],
]));
assert.deepEqual(resolvedStadiumFeedAxisView.lookAt, [0, 348, -4084]);
assert.deepEqual(resolvedStadiumFeedAxisView.position, [980, 592, -2872]);

const rearCampusOrbitalScoregate = zones.find((zone) => zone.id === 'rear-campus-orbital-scoregate');
assert.ok(rearCampusOrbitalScoregate);
const resolvedRearCampusOrbitalScoregateView = resolveReviewOperatorZoneStartView(rearCampusOrbitalScoregate, new Map([
  ['rear-campus-orbital-scoregate-host-surface', { position: [0, 512, -4970.1] }],
]));
assertVectorClose(resolvedRearCampusOrbitalScoregateView.lookAt, [0, 692, -4970.1]);
assertVectorClose(resolvedRearCampusOrbitalScoregateView.position, [900, 872, -3930.1]);

const rearCampusMegaHall = zones.find((zone) => zone.id === 'rear-campus-mega-hall');
assert.ok(rearCampusMegaHall);
const resolvedRearCampusMegaHallView = resolveReviewOperatorZoneStartView(rearCampusMegaHall, new Map([
  ['rear-campus-mega-civic-hall-host-surface', { position: [-2490, 168, -3838.1] }],
]));
assert.deepEqual(resolvedRearCampusMegaHallView.lookAt, [-2450, 378, -3838.1]);
assert.deepEqual(resolvedRearCampusMegaHallView.position, [-2060, 338, -3338.1]);

const rearCampusNeedleCrown = zones.find((zone) => zone.id === 'rear-campus-needle-crown');
assert.ok(rearCampusNeedleCrown);
const resolvedRearCampusNeedleCrownView = resolveReviewOperatorZoneStartView(rearCampusNeedleCrown, new Map([
  ['rear-campus-needle-crown-skyscraper-host-surface', { position: [1540, 408, -1605.5] }],
  ['rear-campus-needle-crown-skyscraper-screen-host-shell', { position: [1540, 235.32, -1619] }],
]));
assertVectorClose(resolvedRearCampusNeedleCrownView.lookAt, [1512, 421.66, -1612.25]);
assertVectorClose(resolvedRearCampusNeedleCrownView.position, [1720, 456.66, -1495.25]);

const rightSkybridgeLandmark = zones.find((zone) => zone.id === 'right-skybridge-landmark');
assert.ok(rightSkybridgeLandmark);
const resolvedRightSkybridgeLandmarkView = resolveReviewOperatorZoneStartView(rightSkybridgeLandmark, new Map([
  ['mega-landmark-right-skyfold-citadel', { position: [844, 146, -164] }],
]));
assert.deepEqual(resolvedRightSkybridgeLandmarkView.lookAt, [844, 236, -164]);
assert.deepEqual(resolvedRightSkybridgeLandmarkView.position, [-256, 666, 1116]);

const towerCluster = zones.find((zone) => zone.id === 'tower-cluster');
assert.ok(towerCluster);
const resolvedTowerClusterView = resolveReviewOperatorZoneStartView(towerCluster, new Map([
  ['screen-marquee-right-2', { position: [1298, 144, -1588] }],
]));
assertVectorClose(resolvedTowerClusterView.lookAt, [1298, 162, -1588]);
assertVectorClose(resolvedTowerClusterView.position, [618, 404, -728]);

const towerClusterVerticalPilot = zones.find((zone) => zone.id === 'tower-cluster-vertical-pilot');
assert.ok(towerClusterVerticalPilot);
const resolvedTowerClusterVerticalPilotView = resolveReviewOperatorZoneStartView(towerClusterVerticalPilot, new Map([
  ['tower-cluster-vertical-pilot-core-left', { position: [764, 126, -680] }],
  ['tower-cluster-vertical-pilot-core-right', { position: [1036, 126, -680] }],
  ['tower-cluster-vertical-pilot-level-1-deck', { position: [900, 57, -650] }],
  ['tower-cluster-vertical-pilot-level-2-deck', { position: [900, 108, -680] }],
  ['tower-cluster-vertical-pilot-roof-deck', { position: [900, 155, -710] }],
  ['tower-cluster-vertical-pilot-tower-deck', { position: [900, 230, -650] }],
]));
assert.deepEqual(resolvedTowerClusterVerticalPilotView.lookAt, [900, 233.66666666666666, -675]);
assert.deepEqual(resolvedTowerClusterVerticalPilotView.position, [1660, 553.6666666666666, -55]);

const towerClusterMegaHighrise = zones.find((zone) => zone.id === 'tower-cluster-mega-highrise');
assert.ok(towerClusterMegaHighrise);
const resolvedTowerClusterMegaHighriseView = resolveReviewOperatorZoneStartView(towerClusterMegaHighrise, new Map([
  ['tower-cluster-mega-highrise-core', { position: [-450, 768, -1250] }],
  ['tower-cluster-mega-highrise-skybridge-deck', { position: [-570, 535, -1245] }],
  ['tower-cluster-mega-highrise-crown-skydeck', { position: [-450, 1552, -1250] }],
]));
assertVectorClose(resolvedTowerClusterMegaHighriseView.lookAt, [-450, 1597, -1250]);
assertVectorClose(resolvedTowerClusterMegaHighriseView.position, [-30, 1912, -1770]);

const towerClusterMegaSkyline = zones.find((zone) => zone.id === 'tower-cluster-mega-skyline');
assert.ok(towerClusterMegaSkyline);
const resolvedTowerClusterMegaSkylineView = resolveReviewOperatorZoneStartView(towerClusterMegaSkyline, new Map([
  ['tower-cluster-mega-highrise-core', { position: [-450, 768, -1250] }],
  ['tower-cluster-mega-highrise-east-needle', { position: [-360, 972, -1340] }],
  ['tower-cluster-mega-highrise-rear-needle', { position: [-550, 864, -1500] }],
  ['tower-cluster-mega-highrise-crown-skydeck', { position: [-450, 1552, -1250] }],
]));
assertVectorClose(resolvedTowerClusterMegaSkylineView.lookAt, [-452.5, 1339, -1335]);
assertVectorClose(resolvedTowerClusterMegaSkylineView.position, [-2852.5, 2039, 1265]);

const towerClusterTelevisionTower = zones.find((zone) => zone.id === 'tower-cluster-television-tower');
assert.ok(towerClusterTelevisionTower);
const resolvedTowerClusterTelevisionTowerView = resolveReviewOperatorZoneStartView(towerClusterTelevisionTower, new Map([
  ['tower-cluster-television-tower-lower-shaft', { position: [360, 925, -1240] }],
  ['tower-cluster-television-tower-upper-shaft', { position: [360, 2775, -1240] }],
  ['tower-cluster-television-tower-needle-spire', { position: [360, 4450, -1240] }],
]));
assertVectorClose(resolvedTowerClusterTelevisionTowerView.lookAt, [360, 3566.6666666666665, -1240]);
assertVectorClose(resolvedTowerClusterTelevisionTowerView.position, [-3440, 4316.666666666666, 4360]);

const towerClusterTelevisionTowerCrown = zones.find((zone) => zone.id === 'tower-cluster-television-tower-crown');
assert.ok(towerClusterTelevisionTowerCrown);
const resolvedTowerClusterTelevisionTowerCrownView = resolveReviewOperatorZoneStartView(towerClusterTelevisionTowerCrown, new Map([
  ['tower-cluster-television-tower-top-beacon', { position: [360, 5224, -1240] }],
  ['tower-cluster-television-tower-needle-spire', { position: [360, 4450, -1240] }],
  ['tower-cluster-television-tower-broadcast-collar-west', { position: [273, 3211, -1240] }],
  ['tower-cluster-television-tower-broadcast-collar-east', { position: [447, 3211, -1240] }],
  ['tower-cluster-television-tower-broadcast-collar-front', { position: [360, 3211, -1153] }],
  ['tower-cluster-television-tower-broadcast-collar-rear', { position: [360, 3211, -1327] }],
]));
assertVectorClose(resolvedTowerClusterTelevisionTowerCrownView.lookAt, [360, 4203, -1240]);
assertVectorClose(resolvedTowerClusterTelevisionTowerCrownView.position, [-1240, 4653, 1360]);

const towerClusterEastNeedle = zones.find((zone) => zone.id === 'tower-cluster-east-needle');
assert.ok(towerClusterEastNeedle);
const resolvedTowerClusterEastNeedleView = resolveReviewOperatorZoneStartView(towerClusterEastNeedle, new Map([
  ['tower-cluster-mega-highrise-east-needle', { position: [-360, 972, -1340] }],
  ['tower-cluster-mega-highrise-east-needle-landing', { position: [-360, 851, -1292] }],
]));
assertVectorClose(resolvedTowerClusterEastNeedleView.lookAt, [-360, 961, -1292]);
assertVectorClose(resolvedTowerClusterEastNeedleView.position, [-740, 1071, -832]);

const towerClusterRearNeedle = zones.find((zone) => zone.id === 'tower-cluster-rear-needle');
assert.ok(towerClusterRearNeedle);
const resolvedTowerClusterRearNeedleView = resolveReviewOperatorZoneStartView(towerClusterRearNeedle, new Map([
  ['tower-cluster-mega-highrise-rear-needle', { position: [-550, 864, -1500] }],
  ['tower-cluster-mega-highrise-rear-needle-landing', { position: [-550, 660, -1474] }],
]));
assertVectorClose(resolvedTowerClusterRearNeedleView.lookAt, [-550, 790, -1474]);
assertVectorClose(resolvedTowerClusterRearNeedleView.position, [-1030, 960, -954]);

const stadiumRightFlank = zones.find((zone) => zone.id === 'stadium-right-flank');
assert.ok(stadiumRightFlank);
const resolvedStadiumRightFlankView = resolveReviewOperatorZoneStartView(stadiumRightFlank, new Map([
  ['rear-campus-event-pavilion-right-feed-surface', { position: [720, 85.68, -1923.3] }],
]));
assert.deepEqual(resolvedStadiumRightFlankView.lookAt, [700, 210.68, -1943.3]);
assert.deepEqual(resolvedStadiumRightFlankView.position, [1240, 275.68, -2443.3]);

const rearCampusRightLandmarkFeed = zones.find((zone) => zone.id === 'rear-campus-right-landmark-feed');
assert.ok(rearCampusRightLandmarkFeed);
const resolvedRearCampusRightLandmarkFeedView = resolveReviewOperatorZoneStartView(rearCampusRightLandmarkFeed, new Map([
  ['rear-campus-landmark-right-rear-campus-feed-surface', { position: [920, 412, -2876.9] }],
]));
assert.deepEqual(resolvedRearCampusRightLandmarkFeedView.lookAt, [920, 456, -2876.9]);
assert.deepEqual(resolvedRearCampusRightLandmarkFeedView.position, [770, 436, -2516.9]);

const rearCampusSkySlabFeed = zones.find((zone) => zone.id === 'rear-campus-sky-slab-feed');
assert.ok(rearCampusSkySlabFeed);
const resolvedRearCampusSkySlabFeedView = resolveReviewOperatorZoneStartView(rearCampusSkySlabFeed, new Map([
  ['rear-campus-sky-slab-tower-host-surface', { position: [1087, 438, -1601.5] }],
]));
assert.deepEqual(resolvedRearCampusSkySlabFeedView.lookAt, [1087, 458, -1601.5]);
assert.deepEqual(resolvedRearCampusSkySlabFeedView.position, [867, 480, -1081.5]);

const rearCampusLeftRearCorner = zones.find((zone) => zone.id === 'rear-campus-left-rear-corner');
assert.ok(rearCampusLeftRearCorner);
const resolvedRearCampusLeftRearCornerView = resolveReviewOperatorZoneStartView(rearCampusLeftRearCorner, new Map([
  ['rear-campus-perimeter-left-rear-corner', { position: [-3050, 16, -5010] }],
]));
assert.deepEqual(resolvedRearCampusLeftRearCornerView.lookAt, [-3050, 36, -5010]);
assert.deepEqual(resolvedRearCampusLeftRearCornerView.position, [-2910, 106, -4850]);

const rearCampusLeftFrontCorner = zones.find((zone) => zone.id === 'rear-campus-left-front-corner');
assert.ok(rearCampusLeftFrontCorner);
const resolvedRearCampusLeftFrontCornerView = resolveReviewOperatorZoneStartView(rearCampusLeftFrontCorner, new Map([
  ['rear-campus-perimeter-left-front-corner', { position: [-3050, 42, -1074] }],
]));
assert.deepEqual(resolvedRearCampusLeftFrontCornerView.lookAt, [-3050, 112, -1074]);
assert.deepEqual(resolvedRearCampusLeftFrontCornerView.position, [-2790, 112, -1334]);
