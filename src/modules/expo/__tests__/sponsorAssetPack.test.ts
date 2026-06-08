import assert from 'node:assert/strict';
import {
  EXPO_SPONSOR_ASSET_PACK_PRODUCT_IMAGE_LIMIT,
  getExpoSponsorAssetPackReadiness,
  normalizeExpoSponsorAssetPackForSave,
  readExpoSponsorAssetPackFromAssets,
} from '../../../shared/expo/sponsorAssetPack.js';

const validPack = normalizeExpoSponsorAssetPackForSave({
  brochureUrl: 'https://cdn.example.com/sponsor/package.pdf',
  ctaPrimary: ' Request   Demo ',
  ctaSecondary: 'View Package',
  demoVideoUrl: 'https://cdn.example.com/sponsor/demo.mp4',
  headline: ' Sponsor   asset pack  ',
  heroImageUrl: 'https://cdn.example.com/sponsor/hero.webp',
  logoUrl: 'https://cdn.example.com/sponsor/logo.png',
  packageTier: 'premium',
  productImageUrls: [
    'https://cdn.example.com/sponsor/product-1.jpg',
    'https://cdn.example.com/sponsor/product-2.jpeg',
  ],
  shortPitch: '  Client friendly   sponsor assets. ',
  websiteUrl: 'https://example.com',
});

assert.equal(validPack.ok, true);
assert.equal(validPack.assetPack.packageTier, 'premium');
assert.equal(validPack.assetPack.ctaPrimary, 'Request Demo');
assert.equal(validPack.assetPack.productImageUrls.length, 2);

const readiness = getExpoSponsorAssetPackReadiness(validPack.assetPack);
assert.equal(readiness.clientFriendlyReady, true);
assert.equal(readiness.hasBrochure, true);
assert.equal(readiness.hasDemoVideo, true);
assert.equal(readiness.productImageCount, 2);

const unsafePack = normalizeExpoSponsorAssetPackForSave({
  brochureUrl: 'https://cdn.example.com/sponsor/package.docx',
  demoVideoUrl: 'https://localhost/demo.mp4',
  logoUrl: 'https://cdn.example.com/sponsor/logo.svg',
  productImageUrls: 'https://192.168.1.20/product.jpg',
  websiteUrl: 'javascript:alert(1)',
});

assert.equal(unsafePack.ok, false);
assert.ok(unsafePack.issues.some((issue) => issue.field === 'brochureUrl'));
assert.ok(unsafePack.issues.some((issue) => issue.field === 'demoVideoUrl'));
assert.ok(unsafePack.issues.some((issue) => issue.field === 'logoUrl'));
assert.ok(unsafePack.issues.some((issue) => issue.field === 'productImageUrls'));
assert.ok(unsafePack.issues.some((issue) => issue.field === 'websiteUrl'));

const tooManyProductImages = normalizeExpoSponsorAssetPackForSave({
  productImageUrls: Array.from(
    { length: EXPO_SPONSOR_ASSET_PACK_PRODUCT_IMAGE_LIMIT + 1 },
    (_, index) => `https://cdn.example.com/sponsor/product-${index + 1}.png`,
  ),
});

assert.equal(tooManyProductImages.ok, false);
assert.ok(tooManyProductImages.issues.some((issue) => issue.field === 'productImageUrls'));

const readPack = readExpoSponsorAssetPackFromAssets({
  sponsor_asset_pack: {
    cta_primary: 'Book Meeting',
    hero_image_url: 'https://cdn.example.com/sponsor/hero.jpg',
    package_tier: 'landmarkZone',
    product_image_urls: ['https://cdn.example.com/sponsor/detail.webp'],
  },
});

assert.equal(readPack.ctaPrimary, 'Book Meeting');
assert.equal(readPack.packageTier, 'landmarkZone');
assert.equal(readPack.productImageUrls.length, 1);

console.log('sponsor asset pack checks passed');
