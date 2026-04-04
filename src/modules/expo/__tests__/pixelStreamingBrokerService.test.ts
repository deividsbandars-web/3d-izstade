import assert from 'node:assert/strict';

import {
  buildPixelStreamingBrokerStatus,
  resolvePixelStreamingBrokerSlot,
} from '../../../backend/expo/streaming/pixelStreamingBrokerService.js';

const slots = [
  { streamerId: 'shared-stream-1', shared: true, ready: true },
  { streamerId: 'booth-hero-one', boothId: 'booth-1', slug: 'hero-one', ready: true },
  { streamerId: 'level-room-1', streamingLevel: 'Level_Booth_booth-1', ready: true },
];

const preferredResolution = resolvePixelStreamingBrokerSlot(
  { boothId: 'booth-1', slug: 'hero-one', streamingLevel: 'Level_Booth_booth-1' },
  slots
);

assert.equal(preferredResolution.slot?.streamerId, 'level-room-1');
assert.equal(preferredResolution.selectionPolicy, 'booth_preferred');

const sharedFallbackResolution = resolvePixelStreamingBrokerSlot(
  { boothId: 'missing-booth', slug: 'missing-booth', allowSharedFallback: true },
  slots
);

assert.equal(sharedFallbackResolution.slot?.streamerId, 'shared-stream-1');
assert.equal(sharedFallbackResolution.selectionPolicy, 'first_available');

const noFallbackStatus = buildPixelStreamingBrokerStatus(
  { boothId: 'missing-booth', allowSharedFallback: false },
  slots,
  { checkedAt: '2026-04-04T00:00:00.000Z' }
);

assert.equal(noFallbackStatus.session.activeStreamerId, null);
assert.equal(noFallbackStatus.readiness, 'session_not_ready');
assert.equal(noFallbackStatus.session.selectionPolicy, 'booth_preferred');
assert.deepEqual(noFallbackStatus.warnings, ['NO_MATCHING_STREAM_SLOT']);
