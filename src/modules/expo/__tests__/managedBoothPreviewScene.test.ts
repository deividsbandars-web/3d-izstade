import assert from 'node:assert/strict';
import { buildSponsorBoothPresentation } from '../lib/sponsorBoothPresentation.js';
import { buildProductionSafeFallbackScene } from '../lib/sceneFallbacks.js';
import {
  applyManagedBoothPreviewToScene,
  getManagedBoothPreviewIdFromSearch,
  hasManagedBoothPreviewScreenContent,
} from '../runtime/data/managedBoothPreviewScene.js';

const managedBoothId = 'a41eec05-6e21-4574-b1ca-d52192dc6634';
const payload = {
  booth: {
    assets_3d: {
      screen_content: {
        ctaLabel: 'Request Demo',
        imageUrl: 'https://cdn.example.com/staging-booth-screen.webp',
        mode: 'image',
        status: 'published',
        subtitle: 'Admin saved sponsor asset screen.',
        title: 'Staging QA Sponsor Asset Pack',
      },
      sponsor_asset_pack: {
        ctaPrimary: 'Request Demo',
        logoUrl: 'https://cdn.example.com/staging-logo.webp',
        packageTier: 'standard',
        shortPitch: 'Sponsor-owned booth media preview.',
      },
    },
    company_name: 'Staging Sponsor Test Booth',
    id: managedBoothId,
    slug: 'staging-admin-test-booth',
  },
};

assert.equal(getManagedBoothPreviewIdFromSearch('?managedBoothPreview=' + managedBoothId), managedBoothId);
assert.equal(getManagedBoothPreviewIdFromSearch('?adminBoothPreview=' + managedBoothId), managedBoothId);
assert.equal(getManagedBoothPreviewIdFromSearch('?managedBoothPreview=../bad'), null);
assert.equal(hasManagedBoothPreviewScreenContent(payload), true);

const baseScene = buildProductionSafeFallbackScene();
const previewScene = applyManagedBoothPreviewToScene(baseScene, payload);

assert.equal(previewScene.companies.length, baseScene.companies.length);
assert.equal(previewScene.sceneVersion, `${baseScene.sceneVersion}+managed-booth-preview`);
assert.ok(previewScene.companies.some((company) => company.id === managedBoothId));
assert.ok(!previewScene.companies.some((company) => company.id === 'sponsor-concierge'));

const previewCompany = previewScene.companies.find((company) => company.id === managedBoothId);
assert.ok(previewCompany);
assert.equal(previewCompany.name, 'Staging Sponsor Test Booth');
assert.equal(previewCompany.booth?.heroScreenStatus, 'published');
assert.equal(previewCompany.booth?.heroScreenType, 'image');
assert.equal(previewCompany.booth?.heroScreenImageUrl, 'https://cdn.example.com/staging-booth-screen.webp');

const presentation = buildSponsorBoothPresentation(previewCompany, previewCompany.booth, previewCompany.boothType);
assert.equal(presentation.managedScreenContent?.status, 'published');
assert.equal(presentation.managedScreenContent?.mode, 'image');
assert.equal(presentation.managedScreenContent?.imageUrl, 'https://cdn.example.com/staging-booth-screen.webp');

const unchangedScene = applyManagedBoothPreviewToScene(baseScene, {
  booth: {
    id: 'draft-booth',
    assets_3d: {
      screen_content: {
        imageUrl: 'https://cdn.example.com/draft.webp',
        mode: 'image',
        status: 'draft',
      },
    },
  },
});

assert.equal(unchangedScene, baseScene);

const videoPreviewScene = applyManagedBoothPreviewToScene(baseScene, {
  booth: {
    assets_3d: {
      screen_content: {
        imageUrl: 'https://cdn.example.com/live-video-poster.webp',
        mode: 'video',
        status: 'published',
        title: 'Live Video Preview',
        videoUrl: 'https://cdn.example.com/live-video-preview.mp4',
      },
    },
    company_name: 'Live Video Preview Booth',
    id: 'live-video-preview-booth',
  },
});

const videoPreviewCompany = videoPreviewScene.companies.find((company) => company.id === 'live-video-preview-booth');
assert.ok(videoPreviewCompany);
assert.equal(videoPreviewCompany.booth?.heroScreenType, 'video');
assert.equal(videoPreviewCompany.booth?.heroScreenImageUrl, 'https://cdn.example.com/live-video-poster.webp');
assert.equal(videoPreviewCompany.booth?.heroScreenVideoUrl, 'https://cdn.example.com/live-video-preview.mp4');
