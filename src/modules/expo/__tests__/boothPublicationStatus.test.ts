import assert from 'node:assert/strict';
import {
  EXPO_BOOTH_PUBLICATION_STATUSES,
  getExpoBoothPublicationStatusLabel,
  isExpoBoothPublicSceneStatus,
  normalizeExpoBoothPublicationStatus,
} from '../../../shared/expo/boothPublicationStatus.js';

assert.deepEqual(EXPO_BOOTH_PUBLICATION_STATUSES, [
  'draft',
  'review',
  'approved',
  'active',
  'rejected',
  'archived',
]);

assert.equal(normalizeExpoBoothPublicationStatus('pending'), 'review');
assert.equal(normalizeExpoBoothPublicationStatus('submitted'), 'review');
assert.equal(normalizeExpoBoothPublicationStatus('in-review'), 'review');
assert.equal(normalizeExpoBoothPublicationStatus('ACTIVE'), 'active');
assert.equal(normalizeExpoBoothPublicationStatus('unknown'), 'draft');
assert.equal(normalizeExpoBoothPublicationStatus(null), 'draft');

assert.equal(isExpoBoothPublicSceneStatus('active'), true);
assert.equal(isExpoBoothPublicSceneStatus('approved'), false);
assert.equal(isExpoBoothPublicSceneStatus('review'), false);
assert.equal(isExpoBoothPublicSceneStatus('draft'), false);

assert.equal(getExpoBoothPublicationStatusLabel('draft'), 'Draft/admin preview');
assert.equal(getExpoBoothPublicationStatusLabel('review'), 'Submitted for review');
assert.equal(getExpoBoothPublicationStatusLabel('approved'), 'Approved for release');
assert.equal(getExpoBoothPublicationStatusLabel('active'), 'Live in public scene');
