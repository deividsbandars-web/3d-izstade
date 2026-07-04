import assert from 'node:assert/strict';
import {
  canApplyExpoMediaReviewUploadAdminAction,
  getExpoMediaReviewUploadAccept,
  getExpoMediaReviewUploadPromoteTargets,
  normalizeExpoMediaReviewUploadKind,
  normalizeExpoMediaReviewUploadPromoteTarget,
  validateExpoMediaReviewUploadInput,
} from './mediaReviewUpload.js';

assert.equal(normalizeExpoMediaReviewUploadKind('city-screen'), 'city-screen');
assert.equal(normalizeExpoMediaReviewUploadKind('booth-screen'), 'booth-screen');
assert.equal(normalizeExpoMediaReviewUploadPromoteTarget('city-screen'), 'city-screen');
assert.deepEqual(getExpoMediaReviewUploadPromoteTargets('city-screen'), ['city-screen']);
assert.deepEqual(getExpoMediaReviewUploadPromoteTargets('booth-screen'), ['booth-screen']);
assert.match(getExpoMediaReviewUploadAccept('city-screen'), /video\/mp4/);

const cityVideo = validateExpoMediaReviewUploadInput({
  fileName: 'campaign.mp4',
  kind: 'city-screen',
  mimeType: 'video/mp4',
  size: 1024,
});
assert.equal(cityVideo.ok, true);

const wrongTarget = canApplyExpoMediaReviewUploadAdminAction({
  action: 'promote',
  kind: 'city-screen',
  promoteTarget: 'booth-screen',
  reviewStatus: 'approved',
});
assert.equal(wrongTarget.ok, false);

const cityTarget = canApplyExpoMediaReviewUploadAdminAction({
  action: 'promote',
  kind: 'city-screen',
  promoteTarget: 'city-screen',
  reviewStatus: 'approved',
});
assert.equal(cityTarget.ok, true);

console.log('media review screen upload checks passed');
