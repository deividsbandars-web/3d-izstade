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

assert.equal(zones.length, 42);
assert.equal(DEFAULT_REVIEW_OPERATOR_ZONE_ID, 'arrival-gate');
assert.deepEqual(zoneIds, [
  'arrival-gate',
  'arrival-civic-axis',
  'left-marquee',
  'left-marquee-close',
  'left-edge-far',
  'city-left-front-corner',
  'center-spine',
  'mid-start-deep',
  'center-spine-side',
  'right-marquee',
  'right-skybridge-landmark',
  'right-marquee-close',
  'right-edge-far',
  'tower-cluster',
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
  'stadium-left-flank',
  'rear-campus-center',
  'stadium-feed-axis',
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
assert.deepEqual(resolvedCityLeftFrontCornerView.lookAt, [-1710, 35, 770]);
assert.deepEqual(resolvedCityLeftFrontCornerView.position, [-1770, 60, 835]);

const centerSpine = zones.find((zone) => zone.id === 'center-spine');
assert.ok(centerSpine);
const resolvedCenterSpineView = resolveReviewOperatorZoneStartView(centerSpine, new Map([
  ['screen-spine-primary-1', { position: [-184, 108, -796] }],
]));
assert.deepEqual(resolvedCenterSpineView.lookAt, [-184, 162, -796]);
assert.deepEqual(resolvedCenterSpineView.position, [-4, 208, -576]);

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
assert.deepEqual(resolvedSponsorBoulevardLeftView.lookAt, [-536, 28, -244]);
assert.deepEqual(resolvedSponsorBoulevardLeftView.position, [-418, 46, -186]);

const sponsorBoulevardLeftClose = zones.find((zone) => zone.id === 'sponsor-boulevard-left-close');
assert.ok(sponsorBoulevardLeftClose);
const resolvedSponsorBoulevardLeftCloseView = resolveReviewOperatorZoneStartView(sponsorBoulevardLeftClose, new Map([
  ['left-rear-booth', { layer: 'booth', position: [-430, 0, -1412] }],
]));
assert.deepEqual(resolvedSponsorBoulevardLeftCloseView.lookAt, [-430, 18, -1412]);
assert.deepEqual(resolvedSponsorBoulevardLeftCloseView.position, [-342, 32, -1388]);

const sponsorBoulevardRight = zones.find((zone) => zone.id === 'sponsor-boulevard-right');
assert.ok(sponsorBoulevardRight);
const resolvedSponsorBoulevardRightView = resolveReviewOperatorZoneStartView(sponsorBoulevardRight, new Map([
  ['right-front-booth', { layer: 'booth', position: [80, 0, -798] }],
]));
assert.deepEqual(resolvedSponsorBoulevardRightView.lookAt, [78, 24, -796]);
assert.deepEqual(resolvedSponsorBoulevardRightView.position, [30, 36, -762]);

const rearCampusCenter = zones.find((zone) => zone.id === 'rear-campus-center');
assert.ok(rearCampusCenter);
const resolvedRearCampusCenterView = resolveReviewOperatorZoneStartView(rearCampusCenter, new Map([
  ['rear-campus-stage-monolith-canopy-host-surface', { position: [47, 126, -3266] }],
]));
assert.deepEqual(resolvedRearCampusCenterView.lookAt, [47, 212, -3266]);
assert.deepEqual(resolvedRearCampusCenterView.position, [47, 296, -2726]);

const stadiumLeftFlank = zones.find((zone) => zone.id === 'stadium-left-flank');
assert.ok(stadiumLeftFlank);
const resolvedStadiumLeftFlankView = resolveReviewOperatorZoneStartView(stadiumLeftFlank, new Map([
  ['rear-campus-event-pavilion-left-feed-surface', { position: [-720, 85.68, -1923.3] }],
]));
assert.deepEqual(resolvedStadiumLeftFlankView.lookAt, [-720, 129.68, -1923.3]);
assert.deepEqual(resolvedStadiumLeftFlankView.position, [-960, 103.68, -1703.3]);

const stadiumFeedAxis = zones.find((zone) => zone.id === 'stadium-feed-axis');
assert.ok(stadiumFeedAxis);
const resolvedStadiumFeedAxisView = resolveReviewOperatorZoneStartView(stadiumFeedAxis, new Map([
  ['rear-campus-bowl-center-deck-screen-host-shell', { position: [0, 212, -4192] }],
]));
assert.deepEqual(resolvedStadiumFeedAxisView.lookAt, [0, 348, -4084]);
assert.deepEqual(resolvedStadiumFeedAxisView.position, [980, 592, -2872]);

const rearCampusMegaHall = zones.find((zone) => zone.id === 'rear-campus-mega-hall');
assert.ok(rearCampusMegaHall);
const resolvedRearCampusMegaHallView = resolveReviewOperatorZoneStartView(rearCampusMegaHall, new Map([
  ['rear-campus-mega-civic-hall-host-surface', { position: [-2490, 168, -3828] }],
]));
assert.deepEqual(resolvedRearCampusMegaHallView.lookAt, [-2410, 266, -3828]);
assert.deepEqual(resolvedRearCampusMegaHallView.position, [-1710, 508, -2848]);

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
  ['mega-landmark-right-skybridge-beacon', { position: [580, 134, 30] }],
]));
assert.deepEqual(resolvedRightSkybridgeLandmarkView.lookAt, [580, 220, 30]);
assert.deepEqual(resolvedRightSkybridgeLandmarkView.position, [580, 270, 330]);

const towerCluster = zones.find((zone) => zone.id === 'tower-cluster');
assert.ok(towerCluster);
const resolvedTowerClusterView = resolveReviewOperatorZoneStartView(towerCluster, new Map([
  ['arrival-core-hero-tower-right-tower-ribbon', { position: [518.8230613285318, 145.04, -518.881157475684] }],
]));
assertVectorClose(resolvedTowerClusterView.lookAt, [518.8230613285318, 163.04, -518.881157475684]);
assertVectorClose(resolvedTowerClusterView.position, [258.8230613285318, 257.04, -158.881157475684]);

const stadiumRightFlank = zones.find((zone) => zone.id === 'stadium-right-flank');
assert.ok(stadiumRightFlank);
const resolvedStadiumRightFlankView = resolveReviewOperatorZoneStartView(stadiumRightFlank, new Map([
  ['rear-campus-event-pavilion-right-feed-surface', { position: [720, 85.68, -1939.3] }],
]));
assert.deepEqual(resolvedStadiumRightFlankView.lookAt, [720, 147.68, -1947.3]);
assert.deepEqual(resolvedStadiumRightFlankView.position, [970, 235.68, -2319.3]);

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
assert.deepEqual(resolvedRearCampusLeftFrontCornerView.lookAt, [-3050, 62, -1074]);
assert.deepEqual(resolvedRearCampusLeftFrontCornerView.position, [-2630, 196, -1574]);
