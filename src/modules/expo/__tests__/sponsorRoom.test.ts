import assert from 'node:assert/strict';
import { buildSponsorRoomActions, resolveSponsorRoomRecord } from '../lib/sponsorRoom.js';
import type { ExpoSceneData } from '../types/scene.js';

const scene: ExpoSceneData = {
  authPolicy: 'public-readonly',
  cityInfo: null,
  companies: [
    {
      activeEmployees: 0,
      activityScore: 0.5,
      booth: {
        boothType: 'hero',
        companyId: 'company-1',
        ctaLabel: 'Book Meeting',
        heroAssetUrl: null,
        id: 'booth-1',
        model_url: null,
        posterUrl: 'https://cdn.example.com/brochure.png',
        slug: 'hero-one',
        video_url: null,
      },
      boothType: 'hero',
      bookingUrl: 'https://cal.example.com/hero-one',
      ctaLabel: 'Book Meeting',
      currentRevenue: 0,
      heroAssetUrl: null,
      id: 'company-1',
      logo_url: null,
      name: 'Hero One',
      posterUrl: null,
      priority: 100,
      sectorId: 'sector-1',
      slug: 'hero-one',
      sponsorTier: 'hero',
      tagline: 'Primary sponsor room',
      website: 'https://hero.example.com',
    },
  ],
  generatedAt: null,
  releaseMode: 'sponsor-boulevard',
  sceneVersion: 'expo-scene-v2-sponsor',
  sectors: [{ color_theme: '#2563eb', id: 'sector-1', map_position: null, name: 'Platform Partners' }],
};

const recordBySlug = resolveSponsorRoomRecord(scene, 'hero-one');
assert.ok(recordBySlug);
assert.equal(recordBySlug?.company.id, 'company-1');
assert.equal(recordBySlug?.sectorName, 'Platform Partners');
assert.equal(recordBySlug?.streamingLevel, 'Level_Booth_booth-1');
assert.ok(recordBySlug?.preferredStreamerIds.includes('booth-booth-1'));
assert.ok(recordBySlug?.preferredStreamerIds.includes('booth-hero-one'));
assert.ok(recordBySlug?.preferredStreamerIds.includes('Level_Booth_booth-1'));

const recordByBoothId = resolveSponsorRoomRecord(scene, 'booth-1');
assert.ok(recordByBoothId);
assert.equal(recordByBoothId?.slugOrId, 'hero-one');

const actions = buildSponsorRoomActions(recordBySlug!);
assert.equal(actions.primaryActions.length, 3);
assert.equal(actions.brochureAction?.label, 'Open Brochure');
assert.equal(actions.brochureAction?.intent.target, 'https://cdn.example.com/brochure.png');

assert.equal(resolveSponsorRoomRecord(scene, 'missing-room'), null);
