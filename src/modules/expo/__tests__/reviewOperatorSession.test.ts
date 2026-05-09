import assert from 'node:assert/strict';
import {
  DEFAULT_REVIEW_OPERATOR_ZONE_ID,
  buildReviewOperatorZones,
  resolveReviewOperatorZoneStartView,
} from '../runtime/operator/model/reviewOperatorSession.js';

const zones = buildReviewOperatorZones();
const zoneIds = zones.map((zone) => zone.id);

function assertVectorClose(actual: number[], expected: number[]) {
  assert.equal(actual.length, expected.length);
  actual.forEach((value, index) => {
    assert.ok(Math.abs(value - expected[index]) < 1e-9, `Expected vector[${index}] ${value} to be close to ${expected[index]}`);
  });
}

assert.equal(zones.length, 28);
assert.equal(DEFAULT_REVIEW_OPERATOR_ZONE_ID, 'arrival-gate');
assert.deepEqual(zoneIds, [
  'arrival-gate',
  'arrival-civic-axis',
  'left-marquee',
  'left-marquee-close',
  'left-edge-far',
  'center-spine',
  'mid-start-deep',
  'center-spine-side',
  'right-marquee',
  'right-marquee-close',
  'right-edge-far',
  'tower-cluster',
  'tower-cluster-reverse-wide',
  'array-band',
  'array-band-south',
  'sponsor-boulevard-left',
  'sponsor-boulevard-left-close',
  'sponsor-boulevard-right',
  'sponsor-boulevard-right-medium',
  'stadium-approach',
  'stadium-left-flank',
  'rear-campus-center',
  'stadium-feed-axis',
  'stadium-right-flank',
  'ground-seam-transition',
  'ground-seam-overhead',
  'rear-campus-mega-hall',
  'rear-campus-needle-crown',
]);

assert.ok(zones.every((zone) => zone.expectedVisibleLayers.length > 0));
assert.ok(zones.every((zone) => zone.watchItems.length > 0));
assert.ok(zones.every((zone) => zone.startView.position.length === 3));
assert.ok(zones.every((zone) => zone.startView.lookAt.length === 3));

const leftMarquee = zones.find((zone) => zone.id === 'left-marquee');
assert.ok(leftMarquee);
const resolvedLeftMarqueeView = resolveReviewOperatorZoneStartView(leftMarquee, new Map([
  ['screen-marquee-left-2', { position: [-708, 148, -1392] }],
]));
assert.deepEqual(resolvedLeftMarqueeView.lookAt, [-708, 170, -1392]);
assert.deepEqual(resolvedLeftMarqueeView.position, [60, 334, -948]);

const leftEdgeFar = zones.find((zone) => zone.id === 'left-edge-far');
assert.ok(leftEdgeFar);
const resolvedLeftEdgeFarView = resolveReviewOperatorZoneStartView(leftEdgeFar, new Map([
  ['screen-array-left-0', { position: [-968, 98, -110] }],
]));
assert.deepEqual(resolvedLeftEdgeFarView.lookAt, [-968, 248, -110]);
assert.deepEqual(resolvedLeftEdgeFarView.position, [-1188, 288, 150]);

const centerSpine = zones.find((zone) => zone.id === 'center-spine');
assert.ok(centerSpine);
const resolvedCenterSpineView = resolveReviewOperatorZoneStartView(centerSpine, new Map([
  ['screen-spine-primary-0', { position: [-184, 108, -248] }],
]));
assert.deepEqual(resolvedCenterSpineView.lookAt, [-184, 154, -248]);
assert.deepEqual(resolvedCenterSpineView.position, [36, 348, 372]);

const rearCampusCenter = zones.find((zone) => zone.id === 'rear-campus-center');
assert.ok(rearCampusCenter);
const resolvedRearCampusCenterView = resolveReviewOperatorZoneStartView(rearCampusCenter, new Map([
  ['rear-campus-stage-monolith-canopy-host-surface', { position: [47, 126, -3266] }],
]));
assert.deepEqual(resolvedRearCampusCenterView.lookAt, [47, 226, -3266]);
assert.deepEqual(resolvedRearCampusCenterView.position, [267, 386, -2926]);

const stadiumFeedAxis = zones.find((zone) => zone.id === 'stadium-feed-axis');
assert.ok(stadiumFeedAxis);
const resolvedStadiumFeedAxisView = resolveReviewOperatorZoneStartView(stadiumFeedAxis, new Map([
  ['rear-campus-bowl-center-deck', { position: [0, 212, -4192] }],
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
  ['rear-campus-needle-crown-skyscraper-host-surface', { position: [1540, 408, -534] }],
]));
assert.deepEqual(resolvedRearCampusNeedleCrownView.lookAt, [1512, 436, -534]);
assert.deepEqual(resolvedRearCampusNeedleCrownView.position, [2000, 638, 6]);

const towerCluster = zones.find((zone) => zone.id === 'tower-cluster');
assert.ok(towerCluster);
const resolvedTowerClusterView = resolveReviewOperatorZoneStartView(towerCluster, new Map([
  ['arrival-core-hero-tower-right-tower-ribbon', { position: [518.8230613285318, 145.04, -518.881157475684] }],
]));
assertVectorClose(resolvedTowerClusterView.lookAt, [518.8230613285318, 167.04, -518.881157475684]);
assertVectorClose(resolvedTowerClusterView.position, [898.8230613285318, 325.04, -158.881157475684]);

const stadiumRightFlank = zones.find((zone) => zone.id === 'stadium-right-flank');
assert.ok(stadiumRightFlank);
const resolvedStadiumRightFlankView = resolveReviewOperatorZoneStartView(stadiumRightFlank, new Map([
  ['rear-campus-event-pavilion-right-feed-surface', { position: [720, 85.68, -1939.3] }],
]));
assert.deepEqual(resolvedStadiumRightFlankView.lookAt, [720, 147.68, -1947.3]);
assert.deepEqual(resolvedStadiumRightFlankView.position, [970, 235.68, -2319.3]);
