import assert from 'node:assert/strict';
import { adaptBackendScenePayload } from '../lib/sceneContract.js';

const payload = {
  authPolicy: 'public-readonly',
  booths: [
    {
      id: 'booth-1',
      companyId: 'company-1',
      boothType: 'premium',
      ctaLabel: null,
      assets_3d: {
        screen_content: {
          assetUrl: 'https://cdn.example.com/owner-screen.png',
          mode: 'image',
          screenSlotId: 'city-right-marquee-hero',
          status: 'published',
          subtitle: 'Owner managed campaign line',
          title: 'Owner Managed Screen',
          videoUrl: 'https://cdn.example.com/owner-screen.mp4',
        },
      },
      heroScreenImageUrl: 'https://cdn.example.com/raw-screen.png',
      heroScreenTitle: 'Raw Screen',
      model_url: 'https://cdn.example.com/booth.glb',
      posterUrl: 'https://sample-videos.com/poster.png',
      heroAssetUrl: 'https://cdn.example.com/hero.png',
      slug: 'duplicate-brand',
      video_url: 'https://test-videos.co.uk/big_buck_bunny.mp4',
    },
  ],
  cityInfo: {
    id: 'default-city',
    name: 'Warpala Expo',
    style: 0,
    globalLocation: null,
  },
  companies: [
    {
      id: 'company-1',
      name: 'Duplicate Brand',
      sectorId: 'sector-1',
      sponsorTier: 'gold',
      priority: 10,
      boothType: 'premium',
      posterUrl: 'https://sample-videos.com/poster.png',
      logo_url: 'https://placehold.co/200x200',
      slug: 'duplicate-brand',
      website: 'https://example.com',
    },
    {
      id: 'company-2',
      name: 'Duplicate Brand',
      sectorId: 'sector-2',
      sponsorTier: 'silver',
      priority: 5,
      boothType: 'standard',
      website: 'https://example.org',
    },
  ],
  generatedAt: '2026-03-28T00:00:00.000Z',
  releaseMode: 'sponsor-boulevard',
  sceneVersion: 'expo-scene-v2-sponsor',
  sectors: [
    { id: 'sector-2', name: 'Meetings', color_theme: '#0f766e', map_position: null },
    { id: 'sector-1', name: 'Platform', color_theme: '#2563eb', map_position: null },
  ],
} as any;

const normalized = adaptBackendScenePayload(payload);

assert.equal(normalized.releaseMode, 'sponsor-boulevard');
assert.equal(normalized.companies.length, 2);
assert.equal(normalized.companies[0].slug, 'duplicate-brand');
assert.match(String(normalized.companies[1].slug), /^duplicate-brand-/);
assert.equal(normalized.companies[0].posterUrl, null);
assert.equal(normalized.companies[0].logo_url, null);
assert.equal(normalized.companies[0].booth?.posterUrl, null);
assert.equal(normalized.companies[0].booth?.video_url, null);
assert.equal(normalized.companies[0].booth?.heroAssetUrl, 'https://cdn.example.com/hero.png');
assert.equal(normalized.companies[0].booth?.heroScreenImageUrl, 'https://cdn.example.com/owner-screen.png');
assert.equal(normalized.companies[0].booth?.heroScreenSlotId, 'city-right-marquee-hero');
assert.equal(normalized.companies[0].booth?.heroScreenStatus, 'published');
assert.equal(normalized.companies[0].booth?.heroScreenText, 'Owner managed campaign line');
assert.equal(normalized.companies[0].booth?.heroScreenTitle, 'Owner Managed Screen');
assert.equal(normalized.companies[0].booth?.heroScreenType, 'image');
assert.equal(normalized.companies[0].booth?.heroScreenVideoUrl, 'https://cdn.example.com/owner-screen.mp4');
assert.equal(normalized.companies[1].booth, null);

assert.throws(() => adaptBackendScenePayload({
  companies: {} as any,
  sectors: [],
  booths: [],
}), /EXPO_SCENE_INVALID_COMPANIES/);
