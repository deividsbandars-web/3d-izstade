import assert from 'node:assert/strict';
import {
  DEFAULT_REVIEW_OPERATOR_ZONE_ID,
  buildReviewOperatorZones,
  resolveReviewOperatorZoneStartView,
} from '../runtime/operator/model/reviewOperatorSession.js';

const zones = buildReviewOperatorZones();
const zoneIds = zones.map((zone) => zone.id);

assert.equal(zones.length, 10);
assert.equal(DEFAULT_REVIEW_OPERATOR_ZONE_ID, 'arrival-gate');
assert.deepEqual(zoneIds, [
  'arrival-gate',
  'left-marquee',
  'center-spine',
  'right-marquee',
  'tower-cluster',
  'array-band',
  'sponsor-boulevard-left',
  'sponsor-boulevard-right',
  'rear-campus-center',
  'stadium-feed-axis',
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
assert.deepEqual(resolvedLeftMarqueeView.lookAt, [-700, 140, -300]);
assert.deepEqual(resolvedLeftMarqueeView.position, [-460, 260, -120]);
