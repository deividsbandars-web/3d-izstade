import assert from 'node:assert/strict';
import { resolveExpoScreenRuntimePolicy } from '../runtime/world/quality/expoScreenRuntimePolicy.js';
import { resolveExpoQualitySettings, type ExpoQualitySettings } from '../runtime/world/quality/expoQualitySettings.js';

function qualitySettings(
  resolvedTier: ExpoQualitySettings['resolvedTier'],
  overrides: Partial<ExpoQualitySettings> = {},
): ExpoQualitySettings {
  const base = resolveExpoQualitySettings({
    isTouchDevice: false,
    runtimeCaptureSafe: true,
  });

  const tierDefaults = {
    high: {
      maxActiveVideoScreens: 4,
      preferStaticScreens: false,
      renderDistanceMultiplier: 1,
    },
    low: {
      maxActiveVideoScreens: 1,
      preferStaticScreens: true,
      renderDistanceMultiplier: 0.65,
    },
    medium: {
      maxActiveVideoScreens: 2,
      preferStaticScreens: true,
      renderDistanceMultiplier: 0.85,
    },
  } satisfies Record<ExpoQualitySettings['resolvedTier'], Partial<ExpoQualitySettings>>;

  return {
    ...base,
    ...tierDefaults[resolvedTier],
    ...overrides,
    requestedTier: resolvedTier,
    resolvedTier,
  };
}

const lowFarHero = resolveExpoScreenRuntimePolicy({
  currentActiveVideoCount: 0,
  distanceToCamera: 420,
  isHeroScreen: true,
  isInActiveSection: true,
  qualitySettings: qualitySettings('low'),
});
assert.equal(lowFarHero.allowVideoPlayback, false);
assert.equal(lowFarHero.preferStaticScreen, true);
assert.equal(lowFarHero.status, 'static-preferred');

const lowNearHero = resolveExpoScreenRuntimePolicy({
  currentActiveVideoCount: 0,
  distanceToCamera: 80,
  isHeroScreen: true,
  isInActiveSection: true,
  qualitySettings: qualitySettings('low'),
});
assert.equal(lowNearHero.allowVideoPlayback, true);
assert.equal(lowNearHero.textureQualityHint, 'medium');

const mediumBudgetExceeded = resolveExpoScreenRuntimePolicy({
  currentActiveVideoCount: 2,
  distanceToCamera: 90,
  isHeroScreen: false,
  isInActiveSection: true,
  qualitySettings: qualitySettings('medium'),
});
assert.equal(mediumBudgetExceeded.allowVideoPlayback, false);
assert.equal(mediumBudgetExceeded.status, 'video-limited');

const inactiveSection = resolveExpoScreenRuntimePolicy({
  currentActiveVideoCount: 0,
  distanceToCamera: 60,
  isHeroScreen: true,
  isInActiveSection: false,
  qualitySettings: qualitySettings('high'),
});
assert.equal(inactiveSection.allowVideoPlayback, false);
assert.equal(inactiveSection.preferStaticScreen, true);

const highNearby = resolveExpoScreenRuntimePolicy({
  currentActiveVideoCount: 0,
  distanceToCamera: 640,
  isHeroScreen: false,
  isInActiveSection: true,
  qualitySettings: qualitySettings('high'),
});
assert.equal(highNearby.allowVideoPlayback, true);
assert.equal(highNearby.textureQualityHint, 'high');
