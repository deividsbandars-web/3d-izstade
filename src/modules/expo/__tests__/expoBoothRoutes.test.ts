import assert from 'node:assert/strict';
import { buildExpoBoothRoute, pickExpoBoothRouteToken } from '../lib/expoBoothRoutes.js';
import { resolveSponsorRoomRecord } from '../lib/sponsorRoom.js';
import { resolveSponsorScreenInteraction } from '../lib/sponsorScreenInteractionResolver.js';
import type { ExpoSceneData } from '../types/scene.js';

assert.equal(pickExpoBoothRouteToken('hero-1', 'hero-one'), 'hero-one');
assert.equal(pickExpoBoothRouteToken('hero-1', '   '), 'hero-1');
assert.equal(buildExpoBoothRoute({ companyId: 'hero-1', companySlug: 'hero-one' }), '/expo/booth/hero-one');
assert.equal(buildExpoBoothRoute({ companyId: 'hero-1', companySlug: 'hero-one', stream: true }), '/expo/booth/hero-one/stream');
assert.equal(buildExpoBoothRoute({ companyId: 'hero-1' }), '/expo/booth/hero-1');

const screenRoute = resolveSponsorScreenInteraction({
  companyId: 'hero-1',
  companySlug: 'hero-one',
  id: 'screen-1',
  title: 'Hero',
});

assert.equal(screenRoute.kind, 'route');
if (screenRoute.kind === 'route') {
  assert.equal(screenRoute.route, '/expo/booth/hero-one');
}

const scene: ExpoSceneData = {
  companies: [
    {
      activeEmployees: 10,
      activityScore: 0.8,
      booth: {
        boothType: 'hero',
        companyId: 'hero-1',
        ctaLabel: 'Book',
        heroAssetUrl: null,
        id: 'booth-hero-1',
        model_url: null,
        posterUrl: null,
        showroomEnabled: true,
        slug: 'hero-one',
        video_url: null,
      },
      logo_url: null,
      boothType: 'hero',
      bookingUrl: null,
      ctaLabel: 'Book',
      currentRevenue: 100,
      heroAssetUrl: null,
      id: 'hero-1',
      name: 'Hero One',
      posterUrl: null,
      priority: 100,
      sectorId: 'sector-1',
      slug: 'hero-one',
      sponsorTier: 'hero',
      tagline: null,
      website: null,
    },
  ],
  cityInfo: null,
  generatedAt: '2026-04-29T00:00:00.000Z',
  releaseMode: 'sponsor-boulevard',
  sceneVersion: 'test-scene',
  sectors: [
    {
      color_theme: null,
      id: 'sector-1',
      map_position: null,
      name: 'Infra',
    },
  ],
};

const roomById = resolveSponsorRoomRecord(scene, 'hero-1');
const roomBySlug = resolveSponsorRoomRecord(scene, 'hero-one');

assert.equal(roomById?.slugOrId, 'hero-one');
assert.equal(roomBySlug?.slugOrId, 'hero-one');
assert.equal(roomById?.presentation.demoRoomPath, '/expo/booth/hero-one/stream');
assert.equal(roomBySlug?.presentation.demoRoomPath, '/expo/booth/hero-one/stream');
