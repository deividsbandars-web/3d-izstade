import { EXPO_FEATURE_FLAGS } from '../../../state/expoRuntime';
import type { ExpoQualitySettings } from '../quality/expoQualitySettings';

type ModularHomeRenderDetailLevel = 'full' | 'reduced';

export type ExpoWorldSceneQualityStrategyInput = {
  homeStudioEnabled: boolean;
  qualitySettings: ExpoQualitySettings;
  runtimeCaptureSafe: boolean;
  streetEnvironmentLightingEnabled?: boolean;
};

export type ExpoWorldSceneQualityStrategy = {
  homeStudioAoEnabled: boolean;
  modularHomeRenderDetailLevel: ModularHomeRenderDetailLevel;
  streetEnvironmentFile: string | null;
};

export function resolveExpoWorldSceneQualityStrategy({
  homeStudioEnabled,
  qualitySettings,
  runtimeCaptureSafe,
  streetEnvironmentLightingEnabled = EXPO_FEATURE_FLAGS.enableStreetEnvironmentLighting,
}: ExpoWorldSceneQualityStrategyInput): ExpoWorldSceneQualityStrategy {
  const modularHomeRenderDetailLevel: ModularHomeRenderDetailLevel = 'full';
  const homeStudioAoEnabled = homeStudioEnabled
    && !runtimeCaptureSafe
    && !qualitySettings.isMobileLike
    && qualitySettings.resolvedTier !== 'low';
  const streetEnvironmentFile = !homeStudioEnabled
    && !runtimeCaptureSafe
    && streetEnvironmentLightingEnabled
    && !qualitySettings.isMobileLike
    && qualitySettings.resolvedTier === 'high'
    ? '/models/modern_evening_street_4k.exr'
    : null;

  return {
    homeStudioAoEnabled,
    modularHomeRenderDetailLevel,
    streetEnvironmentFile,
  };
}
