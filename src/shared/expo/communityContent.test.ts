import assert from 'node:assert/strict';
import {
  buildExpoCommunityExpiresAt,
  EXPO_COMMUNITY_LIMITS,
  isExpoCommunityItemVisible,
  normalizeExpoCommunityEntryInput,
  normalizeExpoCommunityGraffitiInput,
  normalizeExpoCommunityModerationInput,
  normalizeExpoCommunityReportInput,
} from './communityContent.js';

const message = normalizeExpoCommunityEntryInput({
  body: '  Meet us by the city board. ',
  kind: 'message',
  title: 'Community meetup',
});
assert.equal(message.ok, true);
assert.equal(message.body, 'Meet us by the city board.');

const advert = normalizeExpoCommunityEntryInput({
  body: 'A'.repeat(400),
  kind: 'advert',
  title: 'Small advert',
});
assert.equal(advert.body.length, EXPO_COMMUNITY_LIMITS.advertBody);

const graffiti = normalizeExpoCommunityGraffitiInput({
  color: '#FF3366',
  logoUrl: 'https://cdn.example.com/community/logo.webp',
  markText: ' warpala ',
  placement: {
    hostId: 'screen-spine-primary-1-socket-assignment-with-a-very-long-host-name-that-will-be-clamped',
    normalX: 0,
    normalY: 2,
    normalZ: 0,
    rotationY: 9,
    surfaceLabel: 'Current city spot near the sponsor boulevard entrance',
    x: 500,
    y: -4,
    z: -300,
  },
});
assert.equal(graffiti.ok, true);
assert.equal(graffiti.color, '#ff3366');
assert.equal(graffiti.markText, 'WARPALA');
assert.deepEqual(graffiti.placement, {
  hostId: 'screen-spine-primary-1-socket-assignment-with-a-very-long-host-name-that-will-be',
  normalX: 0,
  normalY: 1,
  normalZ: 0,
  rotationY: Math.PI,
  surfaceLabel: 'Current city spot near the spons',
  x: 120,
  y: 1.2,
  z: -160,
});

assert.equal(normalizeExpoCommunityGraffitiInput({ logoUrl: 'javascript:alert(1)' }).ok, false);
assert.equal(normalizeExpoCommunityEntryInput({ body: '', title: '' }).ok, false);

const report = normalizeExpoCommunityReportInput({
  detail: 'x'.repeat(500),
  reason: 'unsafe',
});
assert.equal(report.ok, true);
assert.equal(report.reason, 'unsafe');
assert.equal(report.detail.length, EXPO_COMMUNITY_LIMITS.reportDetail);

const moderation = normalizeExpoCommunityModerationInput({ note: 'Remove from wall', status: 'removed' });
assert.equal(moderation.ok, true);
assert.equal(moderation.status, 'removed');
assert.equal(normalizeExpoCommunityModerationInput({ status: 'pending' }).ok, false);

const expiresAt = buildExpoCommunityExpiresAt('2026-07-04T00:00:00.000Z', 'graffiti');
assert.equal(expiresAt, '2026-07-04T00:10:00.000Z');
assert.equal(isExpoCommunityItemVisible('approved', '2026-07-05T00:00:00.000Z', new Date('2026-07-04T00:00:00.000Z')), true);
assert.equal(isExpoCommunityItemVisible('approved', '2026-07-03T00:00:00.000Z', new Date('2026-07-04T00:00:00.000Z')), false);
assert.equal(isExpoCommunityItemVisible('removed', undefined, new Date('2026-07-04T00:00:00.000Z')), false);

console.log('expo community content tests passed');
