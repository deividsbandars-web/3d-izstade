import assert from 'node:assert/strict';
import { buildSponsorBoothPresentation, buildSponsorCtas, getSponsorNameFontSize, pickSponsorBoothTemplate, resolveSponsorCtaIntent, truncateSponsorText } from '../lib/sponsorBoothPresentation.js';
import type { ExpoSceneCompany } from '../types/scene.js';

const heroCompany: ExpoSceneCompany = {
  activeEmployees: 40,
  activityScore: 0.9,
  booth: {
    boothType: 'hero',
    companyId: 'hero-1',
    ctaLabel: 'Book Strategy Session',
    heroAssetUrl: 'https://cdn.example.com/hero.glb',
    id: 'booth-hero-1',
    model_url: 'https://cdn.example.com/custom-booth.glb',
    posterUrl: 'https://cdn.example.com/poster.png',
    slug: 'hero-one',
    video_url: 'https://cdn.example.com/demo.mp4',
  },
  boothType: 'hero',
  bookingUrl: 'https://cal.example.com/hero-one',
  ctaLabel: 'Book Strategy Session',
  currentRevenue: 100,
  heroAssetUrl: 'https://cdn.example.com/hero.glb',
  id: 'hero-1',
  logo_url: 'https://cdn.example.com/logo.png',
  name: 'Extremely Long Baltic Sponsor Name For Rendering',
  posterUrl: 'https://cdn.example.com/poster.png',
  priority: 100,
  sectorId: 'sector-1',
  slug: 'hero-one',
  sponsorTier: 'hero',
  tagline: 'Premium industrial automation partner',
  website: 'https://hero.example.com',
};

assert.equal(truncateSponsorText('Short Name', 24), 'Short Name');
assert.equal(truncateSponsorText('Very long sponsor label that needs trimming', 16), 'Very long spo...');
assert.equal(getSponsorNameFontSize('Short Name'), 1.35);
assert.equal(getSponsorNameFontSize('Name That Is Slightly Longer'), 1.05);

assert.equal(pickSponsorBoothTemplate({ boothType: 'hero', districtThemeId: 'platform_corridor', nodeType: 'hero_left', sponsorTier: 'hero' }), 'hero_gallery');
assert.equal(pickSponsorBoothTemplate({ boothType: 'hero', districtThemeId: 'meetings_forum', nodeType: 'hero_left', sponsorTier: 'hero' }), 'hero_forum');
assert.equal(pickSponsorBoothTemplate({ boothType: 'premium', districtThemeId: 'design_district', nodeType: 'endcap', sponsorTier: 'gold' }), 'premium_spine');
assert.equal(pickSponsorBoothTemplate({ boothType: 'premium', districtThemeId: 'meetings_forum', nodeType: 'endcap', sponsorTier: 'gold' }), 'premium_portal');
assert.equal(pickSponsorBoothTemplate({ boothType: 'poster', districtThemeId: 'platform_corridor', nodeType: 'standard_right', sponsorTier: 'bronze' }), 'standard_arcade');
assert.equal(pickSponsorBoothTemplate({ boothType: 'poster', districtThemeId: 'design_district', nodeType: 'standard_right', sponsorTier: 'bronze' }), 'standard_studio');

const heroActions = buildSponsorCtas(heroCompany);
assert.deepEqual(heroActions.map((action) => action.kind), ['website', 'booking', 'demo_room']);

const heroPresentation = buildSponsorBoothPresentation(heroCompany, heroCompany.booth, 'hero_left', { districtThemeId: 'platform_corridor' });
assert.equal(heroPresentation.template, 'hero_gallery');
assert.equal(heroPresentation.displayName, 'Extremely Long Baltic S...');
assert.equal(heroPresentation.customInsertUrl, 'https://cdn.example.com/custom-booth.glb');
assert.equal(heroPresentation.posterUrl, 'https://cdn.example.com/poster.png');
assert.equal(heroPresentation.videoUrl, 'https://cdn.example.com/demo.mp4');
assert.equal(heroPresentation.actions[1].label, 'Book Strategy Session');
assert.equal(heroPresentation.demoRoomPath, '/expo/booth/hero-one');
assert.deepEqual(resolveSponsorCtaIntent(heroPresentation.actions[0], heroPresentation), { type: 'external', target: 'https://hero.example.com' });
assert.deepEqual(resolveSponsorCtaIntent(heroPresentation.actions[1], heroPresentation), { type: 'external', target: 'https://cal.example.com/hero-one' });
assert.deepEqual(resolveSponsorCtaIntent(heroPresentation.actions[2], heroPresentation), { type: 'navigate', target: '/expo/booth/hero-one' });

const compactPresentation = buildSponsorBoothPresentation({
  ...heroCompany,
  booth: null,
  boothType: 'poster',
  bookingUrl: null,
  ctaLabel: null,
  heroAssetUrl: null,
  name: 'Compact Booth',
  posterUrl: null,
  slug: null,
  sponsorTier: 'bronze',
  website: null,
}, null, 'standard_right');

assert.equal(compactPresentation.template, 'standard_studio');
assert.equal(compactPresentation.actions.length, 1);
assert.equal(compactPresentation.actions[0].kind, 'demo_room');
assert.equal(compactPresentation.customInsertUrl, null);
assert.deepEqual(resolveSponsorCtaIntent(compactPresentation.actions[0], compactPresentation), { type: 'navigate', target: '/expo/booth/hero-1' });

const placeholderCompany = {
  ...heroCompany,
  booth: {
    ...heroCompany.booth!,
    model_url: 'https://cdn.example.com/placeholder-model.fbx',
    posterUrl: 'https://test-videos.co.uk/poster.png',
    video_url: 'https://test-videos.co.uk/big_buck_bunny.mp4',
  },
  logo_url: 'https://placehold.co/300x300',
  posterUrl: 'https://sample-videos.com/poster.png',
};

const placeholderPresentation = buildSponsorBoothPresentation(placeholderCompany, placeholderCompany.booth, 'hero_left', { districtThemeId: 'meetings_forum' });

assert.equal(placeholderPresentation.logoUrl, null);
assert.equal(placeholderPresentation.posterUrl, null);
assert.equal(placeholderPresentation.videoUrl, null);
