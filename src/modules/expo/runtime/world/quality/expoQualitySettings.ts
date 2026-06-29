import { useMemo } from 'react';
import { EXPO_CITY_QUALITY_TIER, type ExpoQualityPreset } from '../../../state/expoRuntime';

export type ExpoQualityTier = 'low' | 'medium' | 'high' | 'auto';
export type ExpoResolvedQualityTier = Exclude<ExpoQualityTier, 'auto'>;
export type ExpoAnimationIntensity = 'low' | 'medium' | 'full';
export type ExpoLodBias = 'aggressive' | 'balanced' | 'quality';

export type ExpoQualitySettings = {
  adaptiveDprEnabled: boolean;
  adaptiveEventsEnabled: boolean;
  animationIntensity: ExpoAnimationIntensity;
  antialiasEnabled: boolean;
  canvasDpr: number | [number, number];
  farDetailsEnabled: boolean;
  fogEnabled: boolean;
  isMobileLike: boolean;
  legacyFeaturePreset: ExpoQualityPreset;
  lodBias: ExpoLodBias;
  maxActiveVideoScreens: number;
  maxDpr: number;
  performanceMin: number;
  postprocessingEnabled: boolean;
  preferStaticScreens: boolean;
  raycastBudget: number;
  reason: string;
  renderDistanceMultiplier: number;
  requestedTier: ExpoQualityTier;
  resolvedTier: ExpoResolvedQualityTier;
  shadowsEnabled: boolean;
  transparentEffectsEnabled: boolean;
};

export type ResolveExpoQualitySettingsInput = {
  isTouchDevice: boolean;
  runtimeCaptureSafe: boolean;
};

const QUALITY_STORAGE_KEY = 'warpala.expoQualityTier';

const LOW_SETTINGS = {
  adaptiveDprEnabled: true,
  adaptiveEventsEnabled: true,
  animationIntensity: 'low',
  antialiasEnabled: false,
  farDetailsEnabled: false,
  fogEnabled: false,
  lodBias: 'aggressive',
  maxActiveVideoScreens: 1,
  maxDpr: 1,
  performanceMin: 0.92,
  postprocessingEnabled: false,
  preferStaticScreens: true,
  raycastBudget: 24,
  renderDistanceMultiplier: 0.65,
  shadowsEnabled: false,
  transparentEffectsEnabled: false,
} satisfies Omit<
  ExpoQualitySettings,
  'canvasDpr' | 'isMobileLike' | 'legacyFeaturePreset' | 'reason' | 'requestedTier' | 'resolvedTier'
>;

const MEDIUM_SETTINGS = {
  adaptiveDprEnabled: true,
  adaptiveEventsEnabled: true,
  animationIntensity: 'medium',
  antialiasEnabled: false,
  farDetailsEnabled: true,
  fogEnabled: false,
  lodBias: 'balanced',
  maxActiveVideoScreens: 2,
  maxDpr: 1.25,
  performanceMin: 0.85,
  postprocessingEnabled: false,
  preferStaticScreens: true,
  raycastBudget: 48,
  renderDistanceMultiplier: 0.85,
  shadowsEnabled: false,
  transparentEffectsEnabled: true,
} satisfies Omit<
  ExpoQualitySettings,
  'canvasDpr' | 'isMobileLike' | 'legacyFeaturePreset' | 'reason' | 'requestedTier' | 'resolvedTier'
>;

const HIGH_SETTINGS = {
  adaptiveDprEnabled: false,
  adaptiveEventsEnabled: false,
  animationIntensity: 'full',
  antialiasEnabled: true,
  farDetailsEnabled: true,
  fogEnabled: true,
  lodBias: 'quality',
  maxActiveVideoScreens: 4,
  maxDpr: 1.5,
  performanceMin: 0.5,
  postprocessingEnabled: false,
  preferStaticScreens: false,
  raycastBudget: 96,
  renderDistanceMultiplier: 1,
  shadowsEnabled: true,
  transparentEffectsEnabled: true,
} satisfies Omit<
  ExpoQualitySettings,
  'canvasDpr' | 'isMobileLike' | 'legacyFeaturePreset' | 'reason' | 'requestedTier' | 'resolvedTier'
>;

const QUALITY_SETTINGS_BY_TIER = {
  high: HIGH_SETTINGS,
  low: LOW_SETTINGS,
  medium: MEDIUM_SETTINGS,
} as const;

function normalizeQualityTier(value: string | null | undefined): ExpoQualityTier | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === 'low' || normalized === 'medium' || normalized === 'high' || normalized === 'auto') {
    return normalized;
  }

  return null;
}

function readBrowserDeviceHints() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      deviceMemory: null,
      devicePixelRatio: 1,
      hardwareConcurrency: null,
      isSmallViewport: false,
      mobileUserAgent: false,
    };
  }

  const navigatorWithHints = navigator as Navigator & {
    deviceMemory?: number;
  };
  const width = window.innerWidth || 0;
  const height = window.innerHeight || 0;

  return {
    deviceMemory: typeof navigatorWithHints.deviceMemory === 'number' ? navigatorWithHints.deviceMemory : null,
    devicePixelRatio: typeof window.devicePixelRatio === 'number' ? window.devicePixelRatio : 1,
    hardwareConcurrency: typeof navigator.hardwareConcurrency === 'number' ? navigator.hardwareConcurrency : null,
    isSmallViewport: Math.min(width, height) > 0 && Math.min(width, height) <= 820,
    mobileUserAgent: /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent),
  };
}

function resolveRequestedQualityTier(): ExpoQualityTier {
  if (typeof window === 'undefined') {
    return 'auto';
  }

  const params = new URLSearchParams(window.location.search);
  const queryTier = normalizeQualityTier(params.get('quality'));
  if (queryTier) {
    return queryTier;
  }

  try {
    return normalizeQualityTier(window.localStorage.getItem(QUALITY_STORAGE_KEY)) ?? 'auto';
  } catch {
    return 'auto';
  }
}

function resolveAutoTier(
  isMobileLike: boolean,
  runtimeCaptureSafe: boolean,
  hints: ReturnType<typeof readBrowserDeviceHints>,
): { reason: string; resolvedTier: ExpoResolvedQualityTier } {
  if (runtimeCaptureSafe) {
    return {
      reason: 'auto resolved to medium because runtime capture mode needs deterministic safe rendering',
      resolvedTier: 'medium',
    };
  }

  if (isMobileLike) {
    if ((hints.deviceMemory !== null && hints.deviceMemory <= 4) || hints.devicePixelRatio >= 2.5) {
      return {
        reason: 'auto resolved to low for mobile-like constrained device',
        resolvedTier: 'low',
      };
    }

    return {
      reason: 'auto resolved to medium for mobile-like device',
      resolvedTier: 'medium',
    };
  }

  if (
    EXPO_CITY_QUALITY_TIER === 'quality'
    && (hints.hardwareConcurrency === null || hints.hardwareConcurrency >= 6)
    && (hints.deviceMemory === null || hints.deviceMemory >= 6)
  ) {
    return {
      reason: 'auto resolved to high because legacy feature preset is quality and desktop hints are safe',
      resolvedTier: 'high',
    };
  }

  return {
    reason: 'auto resolved to medium as conservative desktop default',
    resolvedTier: 'medium',
  };
}

function resolveMaxDpr(
  resolvedTier: ExpoResolvedQualityTier,
  runtimeCaptureSafe: boolean,
  isMobileLike: boolean,
) {
  if (runtimeCaptureSafe) {
    return 1;
  }

  if (!isMobileLike) {
    return QUALITY_SETTINGS_BY_TIER[resolvedTier].maxDpr;
  }

  if (resolvedTier === 'high') {
    return 1.25;
  }

  if (resolvedTier === 'medium') {
    return 1.1;
  }

  return 0.9;
}

function resolveCanvasDpr(
  resolvedTier: ExpoResolvedQualityTier,
  runtimeCaptureSafe: boolean,
  isMobileLike: boolean,
  maxDpr: number,
): number | [number, number] {
  if (runtimeCaptureSafe) {
    return 1;
  }

  if (resolvedTier === 'low') {
    return [0.55, maxDpr];
  }

  if (resolvedTier === 'medium') {
    return [isMobileLike ? 0.6 : 0.65, maxDpr];
  }

  return [isMobileLike ? 0.75 : 0.85, maxDpr];
}

export function resolveExpoQualitySettings(input: ResolveExpoQualitySettingsInput): ExpoQualitySettings {
  const hints = readBrowserDeviceHints();
  const requestedTier = resolveRequestedQualityTier();
  const isMobileLike = input.isTouchDevice || hints.isSmallViewport || hints.mobileUserAgent;
  const explicitTier = requestedTier === 'auto' ? null : requestedTier;
  const resolved = explicitTier
    ? {
        reason: `explicit ${explicitTier} tier requested`,
        resolvedTier: explicitTier,
      }
    : resolveAutoTier(isMobileLike, input.runtimeCaptureSafe, hints);
  const baseSettings = QUALITY_SETTINGS_BY_TIER[resolved.resolvedTier];
  const maxDpr = resolveMaxDpr(resolved.resolvedTier, input.runtimeCaptureSafe, isMobileLike);

  return {
    ...baseSettings,
    adaptiveDprEnabled: input.runtimeCaptureSafe ? false : baseSettings.adaptiveDprEnabled,
    adaptiveEventsEnabled: input.runtimeCaptureSafe ? false : baseSettings.adaptiveEventsEnabled,
    antialiasEnabled: input.runtimeCaptureSafe ? false : baseSettings.antialiasEnabled,
    canvasDpr: resolveCanvasDpr(resolved.resolvedTier, input.runtimeCaptureSafe, isMobileLike, maxDpr),
    isMobileLike,
    legacyFeaturePreset: EXPO_CITY_QUALITY_TIER,
    maxDpr,
    performanceMin: input.runtimeCaptureSafe ? Math.max(baseSettings.performanceMin, 0.95) : baseSettings.performanceMin,
    postprocessingEnabled: false,
    reason: input.runtimeCaptureSafe
      ? `${resolved.reason}; runtime capture uses fixed DPR and disables non-deterministic renderer extras`
      : resolved.reason,
    requestedTier,
    resolvedTier: resolved.resolvedTier,
    shadowsEnabled: input.runtimeCaptureSafe ? false : baseSettings.shadowsEnabled,
  };
}

export function useExpoQualitySettings(input: ResolveExpoQualitySettingsInput): ExpoQualitySettings {
  const { isTouchDevice, runtimeCaptureSafe } = input;

  return useMemo(
    () => resolveExpoQualitySettings({ isTouchDevice, runtimeCaptureSafe }),
    [isTouchDevice, runtimeCaptureSafe],
  );
}
