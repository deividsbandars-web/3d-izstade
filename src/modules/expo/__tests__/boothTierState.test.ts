import assert from 'node:assert/strict';
import { buildBoothTierState } from '../runtime/booths/BoothTierState.js';

const baseArgs = {
  booth: { boothType: 'hero' },
  companySponsorTier: 'hero',
  districtVisual: { expressionMode: 'active-commercial' },
  nodeType: 'hero_left' as const,
  position: [0, 0, 0] as [number, number, number],
  presentation: {
    adTier: 'premium' as const,
    displayName: 'Warpala Platform',
    hasBrandAssets: true,
    template: 'hero_forum' as const,
  },
};

const farHero = buildBoothTierState({
  ...baseArgs,
  playerPosition: [1000, 0, 0],
  skylineDensityEnabled: true,
});

assert.equal(farHero.showDetailedText, false);
assert.equal(farHero.showFullBoothUi, false);

const reviewDistanceHero = buildBoothTierState({
  ...baseArgs,
  playerPosition: [800, 0, 0],
  skylineDensityEnabled: true,
});

assert.equal(reviewDistanceHero.showDetailedText, true);
assert.equal(reviewDistanceHero.showFullBoothUi, false);

const nearHero = buildBoothTierState({
  ...baseArgs,
  playerPosition: [40, 0, 0],
  skylineDensityEnabled: true,
});

assert.equal(nearHero.showDetailedText, true);
assert.equal(nearHero.showFullBoothUi, true);
