import assert from 'node:assert/strict';
import type { ExpoQualitySettings } from '../runtime/world/quality/expoQualitySettings';
import { resolveExpoQualitySettings } from '../runtime/world/quality/expoQualitySettings';
import { resolveExpoWorldSceneQualityStrategy } from '../runtime/world/scene/ExpoWorldSceneQualityStrategy';

function createQualitySettings(overrides: Partial<ExpoQualitySettings>): ExpoQualitySettings {
  return {
    ...resolveExpoQualitySettings({
      isTouchDevice: false,
      runtimeCaptureSafe: false,
    }),
    ...overrides,
  };
}

const mobileLowQuality = createQualitySettings({
  isMobileLike: true,
  preferStaticScreens: true,
  resolvedTier: 'low',
});

assert.equal(
  resolveExpoWorldSceneQualityStrategy({
    homeStudioEnabled: true,
    qualitySettings: mobileLowQuality,
    runtimeCaptureSafe: false,
  }).modularHomeRenderDetailLevel,
  'full',
);
assert.equal(
  resolveExpoWorldSceneQualityStrategy({
    homeStudioEnabled: false,
    qualitySettings: mobileLowQuality,
    runtimeCaptureSafe: false,
    streetEnvironmentLightingEnabled: true,
  }).streetEnvironmentFile,
  null,
);

const desktopHighQuality = createQualitySettings({
  isMobileLike: false,
  preferStaticScreens: false,
  resolvedTier: 'high',
});

const desktopHighStrategy = resolveExpoWorldSceneQualityStrategy({
  homeStudioEnabled: false,
  qualitySettings: desktopHighQuality,
  runtimeCaptureSafe: false,
  streetEnvironmentLightingEnabled: true,
});

assert.equal(desktopHighStrategy.modularHomeRenderDetailLevel, 'full');
assert.equal(desktopHighStrategy.streetEnvironmentFile, '/models/modern_evening_street_4k.exr');

const captureStrategy = resolveExpoWorldSceneQualityStrategy({
  homeStudioEnabled: true,
  qualitySettings: createQualitySettings({
    isMobileLike: false,
    preferStaticScreens: true,
    resolvedTier: 'medium',
  }),
  runtimeCaptureSafe: true,
});

assert.equal(captureStrategy.modularHomeRenderDetailLevel, 'full');
assert.equal(captureStrategy.homeStudioAoEnabled, false);
