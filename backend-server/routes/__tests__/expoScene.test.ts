import assert from 'node:assert/strict';
import {
  buildExpoSceneResponse,
  EXPO_SCENE_AUTH_POLICY,
  EXPO_SCENE_RELEASE_MODE,
  EXPO_SCENE_VERSION,
  getExpoSceneErrorStatus,
  validateExpoSceneQuery,
} from '../../controllers/expoController.js';

const response = buildExpoSceneResponse({
  booths: [{
    boothType: 'hero',
    companyId: 'company-1',
    ctaLabel: 'Book Meeting',
    heroAssetUrl: 'https://cdn.example.com/hero.glb',
    id: 'booth-1',
    model_url: null,
    posterUrl: 'https://cdn.example.com/poster.png',
    slug: 'acme',
    video_url: '',
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
  sectors: [{ color_theme: '#0ea5e9', id: 'sector-1', map_position: { x: 0, z: 0 }, name: 'Infra' }],
});

assert.equal(response.authPolicy, EXPO_SCENE_AUTH_POLICY);
assert.equal(response.sceneVersion, EXPO_SCENE_VERSION);
assert.equal(response.releaseMode, EXPO_SCENE_RELEASE_MODE);
assert.equal(typeof response.generatedAt, 'string');
assert.equal(response.cityInfo.id, 'city-1');
assert.equal(response.sectors.length, 1);
assert.equal(response.companies.length, 1);
assert.equal(response.booths.length, 1);
assert.equal(response.companies[0].sponsorTier, 'hero');
assert.equal(response.companies[0].priority, 100);
assert.equal(response.booths[0].model_url, null);
assert.equal(response.booths[0].ctaLabel, 'Book Meeting');

assert.deepEqual(validateExpoSceneQuery({}), { cityId: undefined });
assert.deepEqual(validateExpoSceneQuery({ cityId: '  city-1  ' }), { cityId: 'city-1' });
assert.throws(() => validateExpoSceneQuery({ cityId: ['bad'] }), /INVALID_CITY_ID/);
assert.equal(getExpoSceneErrorStatus(new Error('INVALID_CITY_ID')), 400);
assert.equal(getExpoSceneErrorStatus(new Error('OTHER_ERROR')), 500);
