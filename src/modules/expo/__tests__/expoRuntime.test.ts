import assert from 'node:assert/strict';
import { EXPO_CITY_QUALITY_TIER, EXPO_QUALITY_PRESETS, EXPO_SPATIAL_DEBUG_FLAGS } from '../state/expoRuntime.js';

assert.equal(EXPO_QUALITY_PRESETS.performance.enableShowcaseSkylineDensity, false);
assert.equal(EXPO_QUALITY_PRESETS.balanced.enableShowcaseSkylineDensity, false);
assert.equal(EXPO_QUALITY_PRESETS.quality.enableShowcaseSkylineDensity, true);

assert.equal(EXPO_QUALITY_PRESETS.performance.enableEnhancedBoulevardDetail, false);
assert.equal(EXPO_QUALITY_PRESETS.balanced.enableEnhancedBoulevardDetail, false);
assert.equal(EXPO_QUALITY_PRESETS.quality.enableEnhancedBoulevardDetail, true);
assert.equal(EXPO_QUALITY_PRESETS.performance.enablePremiumGroundTextures, false);
assert.equal(EXPO_QUALITY_PRESETS.balanced.enablePremiumGroundTextures, false);
assert.equal(EXPO_QUALITY_PRESETS.quality.enablePremiumGroundTextures, true);
assert.equal(EXPO_QUALITY_PRESETS.performance.enablePromenadeTexture, false);
assert.equal(EXPO_QUALITY_PRESETS.balanced.enablePromenadeTexture, true);
assert.equal(EXPO_QUALITY_PRESETS.quality.enablePromenadeTexture, true);

assert.equal(EXPO_QUALITY_PRESETS.performance.enableCuratedSkylineRing, false);
assert.equal(EXPO_QUALITY_PRESETS.balanced.enableCuratedSkylineRing, true);
assert.equal(EXPO_QUALITY_PRESETS.quality.enableCuratedSkylineRing, true);
assert.equal(EXPO_QUALITY_PRESETS.performance.enableCuratedExpoProps, false);
assert.equal(EXPO_QUALITY_PRESETS.balanced.enableCuratedExpoProps, true);
assert.equal(EXPO_QUALITY_PRESETS.quality.enableCuratedExpoProps, true);

assert.ok(['performance', 'balanced', 'quality'].includes(EXPO_CITY_QUALITY_TIER));
assert.equal(EXPO_SPATIAL_DEBUG_FLAGS.disableArrivalReveal, false);
assert.equal(EXPO_SPATIAL_DEBUG_FLAGS.disableCuratedSkylineRing, false);
assert.equal(EXPO_SPATIAL_DEBUG_FLAGS.disableExpoLandmarkLayer, false);
assert.equal(EXPO_SPATIAL_DEBUG_FLAGS.disableDistrictAnchorNodes, false);
assert.equal(EXPO_SPATIAL_DEBUG_FLAGS.disableBoothArchitectureKit, false);

