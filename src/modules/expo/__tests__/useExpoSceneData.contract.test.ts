import assert from 'node:assert/strict';
import { adaptBackendScenePayload } from '../lib/sceneContract.js';

const normalized = adaptBackendScenePayload({
  authPolicy: 'public-readonly',
  booths: [{
    boothType: 'hero',
    companyId: 'company-1',
    ctaLabel: 'Book Meeting',
    heroAssetUrl: 'https://cdn.example.com/hero.glb',
    id: 'booth-1',
    model_url: null,
    posterUrl: 'https://cdn.example.com/poster.png',
    slug: 'acme',
    video_url: 'https://cdn.example.com/demo.mp4',
  }],
  cityInfo: { globalLocation: null, id: 'city-1', name: 'Warpala Expo', style: 0 },
  companies: [{
    activeEmployees: 4,
    activityScore: 0.6,
    boothType: 'hero',
    bookingUrl: 'https://cal.example.com/acme',
    ctaLabel: 'Book Meeting',
    currentRevenue: 10,
    heroAssetUrl: 'https://cdn.example.com/hero.glb',
    id: 'company-1',
    logo_url: 'https://cdn.example.com/logo.png',
    name: 'Acme',
    posterUrl: 'https://cdn.example.com/poster.png',
    priority: 100,
    sectorId: 'sector-1',
    slug: 'acme',
    sponsorTier: 'hero',
    tagline: 'Best infra partner',
    website: 'https://acme.example.com',
  }],
  generatedAt: '2026-03-27T12:00:00.000Z',
  releaseMode: 'sponsor-boulevard',
  sceneVersion: 'expo-scene-v2-sponsor',
  sectors: [{ color_theme: '#0ea5e9', id: 'sector-1', map_position: { x: 0, z: 0 }, name: 'Infra' }],
});

assert.equal(normalized.sceneVersion, 'expo-scene-v2-sponsor');
assert.equal(normalized.releaseMode, 'sponsor-boulevard');
assert.equal(normalized.authPolicy, 'public-readonly');
assert.equal(normalized.cityInfo?.id, 'city-1');
assert.equal(normalized.companies.length, 1);
assert.equal(normalized.companies[0].sponsorTier, 'hero');
assert.equal(normalized.companies[0].priority, 100);
assert.equal(normalized.companies[0].boothType, 'hero');
assert.equal(normalized.companies[0].booth?.model_url, null);
assert.equal(normalized.companies[0].booth?.posterUrl, 'https://cdn.example.com/poster.png');
