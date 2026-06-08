import assert from 'node:assert/strict';
import {
  normalizeExpoScreenContentForSave,
  sanitizeExpoManagedBoothAssets,
  validateExpoScreenMediaUrl,
} from '../../../shared/expo/screenContentMedia.js';
import { getExpoScreenInventorySummary } from '../../../shared/expo/screenInventory.js';

const validImage = validateExpoScreenMediaUrl('https://cdn.example.com/sponsor/screen.png?token=abc', 'image');
assert.equal(validImage.ok, true);
assert.equal(validImage.url, 'https://cdn.example.com/sponsor/screen.png?token=abc');

const validVideo = validateExpoScreenMediaUrl('https://cdn.example.com/video/demo.mp4', 'video');
assert.equal(validVideo.ok, true);
assert.equal(validVideo.url, 'https://cdn.example.com/video/demo.mp4');

assert.equal(validateExpoScreenMediaUrl('http://cdn.example.com/video/demo.mp4', 'video').ok, false);
assert.equal(validateExpoScreenMediaUrl('https://localhost/video/demo.mp4', 'video').ok, false);
assert.equal(validateExpoScreenMediaUrl('https://192.168.1.20/video/demo.mp4', 'video').ok, false);
assert.equal(validateExpoScreenMediaUrl('https://cdn.example.com/vector.svg', 'image').ok, false);
assert.equal(validateExpoScreenMediaUrl('https://cdn.example.com/video.mov', 'video').ok, false);
assert.equal(validateExpoScreenMediaUrl('javascript:alert(1)', 'image').ok, false);

const imageContent = normalizeExpoScreenContentForSave({
  ctaLabel: 'Request Demo',
  imageUrl: 'https://cdn.example.com/screen.webp',
  mode: 'image',
  screenSlotId: 'booth-sponsor-concierge-main-screen',
  status: 'published',
  subtitle: '  Sponsor   story  ',
  title: '  Sponsor Screen  ',
});
assert.equal(imageContent.ok, true);
assert.equal(imageContent.screenContent.mode, 'image');
assert.equal(imageContent.screenContent.screenSlotId, 'booth-sponsor-concierge-main-screen');
assert.equal(imageContent.screenContent.status, 'published');
assert.equal(imageContent.screenContent.subtitle, 'Sponsor story');
assert.equal(imageContent.screenContent.imageUrl, 'https://cdn.example.com/screen.webp');

const invalidScreenSlot = normalizeExpoScreenContentForSave({
  mode: 'generated-card',
  screenSlotId: 'missing-screen-slot',
  status: 'draft',
  title: 'Invalid Slot',
});
assert.equal(invalidScreenSlot.ok, false);
assert.ok(invalidScreenSlot.issues.some((issue) => issue.field === 'screenSlotId'));

const inventorySummary = getExpoScreenInventorySummary();
assert.equal(inventorySummary.totalCount, 7);
assert.equal(inventorySummary.availableCount, 4);
assert.equal(inventorySummary.reservedCount, 2);
assert.equal(inventorySummary.previewOnlyCount, 1);

const missingVideo = normalizeExpoScreenContentForSave({
  mode: 'video-placeholder',
  status: 'published',
  title: 'Video Slot',
});
assert.equal(missingVideo.ok, false);
assert.ok(missingVideo.issues.some((issue) => issue.field === 'videoUrl'));

const sanitizedAssets = sanitizeExpoManagedBoothAssets({
  screen_content: {
    imageUrl: 'https://cdn.example.com/screen.jpg',
    mode: 'image',
    status: 'published',
    title: 'Safe Screen',
  },
  video_url: 'https://cdn.example.com/room.webm',
});
assert.deepEqual(sanitizedAssets, {
  screen_content: {
    ctaLabel: '',
    imageUrl: 'https://cdn.example.com/screen.jpg',
    mode: 'image',
    screenSlotId: '',
    status: 'published',
    subtitle: '',
    title: 'Safe Screen',
    videoUrl: '',
  },
  video_url: 'https://cdn.example.com/room.webm',
});

const unsafeAssets = sanitizeExpoManagedBoothAssets({
  screen_content: {
    imageUrl: 'http://internal.local/screen.png',
    mode: 'image',
    title: 'Unsafe Screen',
  },
  video_url: 'https://127.0.0.1/room.mp4',
});
assert.equal('screen_content' in unsafeAssets, false);
assert.equal(unsafeAssets.video_url, '');

console.log('screen content media safety checks passed');
