import assert from 'node:assert/strict';
import { EXPO_CITY_QUALITY_TIER, EXPO_QUALITY_PRESETS } from '../state/expoRuntime.js';

assert.equal(EXPO_QUALITY_PRESETS.performance.enableShowcaseSkylineDensity, false);
assert.equal(EXPO_QUALITY_PRESETS.balanced.enableShowcaseSkylineDensity, false);
assert.equal(EXPO_QUALITY_PRESETS.quality.enableShowcaseSkylineDensity, true);

assert.equal(EXPO_QUALITY_PRESETS.performance.enableEnhancedBoulevardDetail, false);
assert.equal(EXPO_QUALITY_PRESETS.balanced.enableEnhancedBoulevardDetail, false);
assert.equal(EXPO_QUALITY_PRESETS.quality.enableEnhancedBoulevardDetail, true);

assert.equal(EXPO_QUALITY_PRESETS.performance.enableCuratedSkylineRing, false);
assert.equal(EXPO_QUALITY_PRESETS.balanced.enableCuratedSkylineRing, true);
assert.equal(EXPO_QUALITY_PRESETS.quality.enableCuratedSkylineRing, true);

assert.ok(['performance', 'balanced', 'quality'].includes(EXPO_CITY_QUALITY_TIER));

