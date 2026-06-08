import type { ExpoQualitySettings, ExpoResolvedQualityTier } from './expoQualitySettings';

export type ExpoScreenPolicyStatus = 'static-preferred' | 'video-limited' | 'video-allowed';
export type ExpoScreenTextureQualityHint = 'low' | 'medium' | 'high';

export type ExpoScreenRuntimePolicyInput = {
  currentActiveVideoCount?: number;
  distanceToCamera?: number | null;
  isFocused?: boolean;
  isHeroScreen?: boolean;
  isHovered?: boolean;
  isInActiveSection?: boolean;
  qualitySettings: ExpoQualitySettings;
};

export type ExpoScreenRuntimePolicy = {
  allowVideoPlayback: boolean;
  maxActiveVideoScreens: number;
  preferStaticScreen: boolean;
  status: ExpoScreenPolicyStatus;
  textureQualityHint: ExpoScreenTextureQualityHint;
};

function getNearVideoDistance(tier: ExpoResolvedQualityTier) {
  switch (tier) {
    case 'low':
      return 180;
    case 'medium':
      return 340;
    case 'high':
      return 720;
    default:
      return 240;
  }
}

function resolveTextureQualityHint(
  tier: ExpoResolvedQualityTier,
  isHeroScreen = false,
): ExpoScreenTextureQualityHint {
  if (tier === 'low') {
    return isHeroScreen ? 'medium' : 'low';
  }

  if (tier === 'medium') {
    return isHeroScreen ? 'high' : 'medium';
  }

  return 'high';
}

export function getMaxActiveVideoScreens(qualitySettings: ExpoQualitySettings) {
  return Math.max(0, qualitySettings.maxActiveVideoScreens);
}

export function getScreenTextureQualityHint(qualitySettings: ExpoQualitySettings) {
  return resolveTextureQualityHint(qualitySettings.resolvedTier);
}

export function shouldPreferStaticScreen(input: ExpoScreenRuntimePolicyInput) {
  const distance = input.distanceToCamera ?? Number.POSITIVE_INFINITY;
  const isPriorityScreen = Boolean(input.isFocused || input.isHovered || input.isHeroScreen);

  if (input.isInActiveSection === false) {
    return true;
  }

  if (!input.qualitySettings.preferStaticScreens) {
    return false;
  }

  if (input.qualitySettings.resolvedTier === 'low') {
    return !isPriorityScreen || distance > getNearVideoDistance('low');
  }

  return !isPriorityScreen && distance > getNearVideoDistance(input.qualitySettings.resolvedTier);
}

export function shouldAllowVideoPlayback(input: ExpoScreenRuntimePolicyInput) {
  const maxActiveVideoScreens = getMaxActiveVideoScreens(input.qualitySettings);
  if (maxActiveVideoScreens <= 0 || input.isInActiveSection === false) {
    return false;
  }

  const currentActiveVideoCount = input.currentActiveVideoCount ?? 0;
  if (currentActiveVideoCount >= maxActiveVideoScreens) {
    return false;
  }

  const distance = input.distanceToCamera ?? Number.POSITIVE_INFINITY;
  const nearEnough = distance <= getNearVideoDistance(input.qualitySettings.resolvedTier);
  const isPriorityScreen = Boolean(input.isFocused || input.isHovered || input.isHeroScreen);

  if (input.qualitySettings.resolvedTier === 'low') {
    return isPriorityScreen && nearEnough;
  }

  if (input.qualitySettings.resolvedTier === 'medium') {
    return isPriorityScreen || nearEnough;
  }

  return isPriorityScreen || nearEnough || !input.qualitySettings.preferStaticScreens;
}

export function resolveExpoScreenRuntimePolicy(input: ExpoScreenRuntimePolicyInput): ExpoScreenRuntimePolicy {
  const allowVideoPlayback = shouldAllowVideoPlayback(input);
  const preferStaticScreen = shouldPreferStaticScreen(input);
  const maxActiveVideoScreens = getMaxActiveVideoScreens(input.qualitySettings);
  const status: ExpoScreenPolicyStatus = preferStaticScreen
    ? 'static-preferred'
    : allowVideoPlayback
      ? 'video-allowed'
      : 'video-limited';

  return {
    allowVideoPlayback,
    maxActiveVideoScreens,
    preferStaticScreen,
    status,
    textureQualityHint: resolveTextureQualityHint(input.qualitySettings.resolvedTier, input.isHeroScreen),
  };
}
