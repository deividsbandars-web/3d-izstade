import assert from 'node:assert/strict';
import {
  DEFAULT_REVIEW_OPERATOR_ZONE_ID,
  buildReviewOperatorZones,
  resolveReviewOperatorZoneStartView,
} from '../runtime/operator/model/reviewOperatorSession.js';

const zones = buildReviewOperatorZones();
const zoneIds = zones.map((zone) => zone.id);

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
  ['screen-marquee-left-0', { position: [-700, 140, -300] }],
]));
assert.deepEqual(resolvedLeftMarqueeView.lookAt, [-700, 162, -300]);
assert.deepEqual(resolvedLeftMarqueeView.position, [-180, 318, 390]);
