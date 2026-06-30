import { useSyncExternalStore } from 'react';
import type { ExpoScreenTextureQualityHint } from './expoScreenRuntimePolicy';

export type ExpoGeneratedBillboardQualityConfig = {
  anisotropy: number;
  generateMipmaps: boolean;
  maxLongSide: number;
  maxShortSide: number;
  qualityHint: ExpoScreenTextureQualityHint;
};

export type ExpoScreenTextureRuntimeStats = {
  generatedBillboardCacheEvictions: number;
  generatedBillboardCacheHits: number;
  generatedBillboardCacheMisses: number;
  generatedBillboardCacheSize: number;
  lastGeneratedBillboardHeight: number | null;
  lastGeneratedBillboardQualityHint: ExpoScreenTextureQualityHint | null;
  lastGeneratedBillboardWidth: number | null;
  textureCacheLimit: number;
  textureCacheSize: number;
};

const DEFAULT_TEXTURE_CACHE_LIMIT = 128;

const BILLBOARD_QUALITY_CONFIGS: Record<ExpoScreenTextureQualityHint, ExpoGeneratedBillboardQualityConfig> = {
  high: {
    anisotropy: 8,
    generateMipmaps: true,
    maxLongSide: 2048,
    maxShortSide: 1024,
    qualityHint: 'high',
  },
  low: {
    anisotropy: 2,
    generateMipmaps: true,
    maxLongSide: 1024,
    maxShortSide: 512,
    qualityHint: 'low',
  },
  medium: {
    anisotropy: 4,
    generateMipmaps: true,
    maxLongSide: 1536,
    maxShortSide: 768,
    qualityHint: 'medium',
  },
};

let stats: ExpoScreenTextureRuntimeStats = {
  generatedBillboardCacheEvictions: 0,
  generatedBillboardCacheHits: 0,
  generatedBillboardCacheMisses: 0,
  generatedBillboardCacheSize: 0,
  lastGeneratedBillboardHeight: null,
  lastGeneratedBillboardQualityHint: null,
  lastGeneratedBillboardWidth: null,
  textureCacheLimit: DEFAULT_TEXTURE_CACHE_LIMIT,
  textureCacheSize: 0,
};

let snapshot = stats;
const listeners = new Set<() => void>();

function publish(nextStats: ExpoScreenTextureRuntimeStats) {
  stats = nextStats;
  snapshot = stats;
  listeners.forEach((listener) => listener());
}

function updateStats(partial: Partial<ExpoScreenTextureRuntimeStats>) {
  publish({ ...stats, ...partial });
}

export function resolveExpoGeneratedBillboardQualityConfig(
  qualityHint: ExpoScreenTextureQualityHint | null | undefined,
): ExpoGeneratedBillboardQualityConfig {
  return BILLBOARD_QUALITY_CONFIGS[qualityHint ?? 'medium'];
}

export function getExpoScreenTextureRuntimeStats() {
  return snapshot;
}

export function subscribeExpoScreenTextureRuntimeStats(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useExpoScreenTextureRuntimeStats() {
  return useSyncExternalStore(
    subscribeExpoScreenTextureRuntimeStats,
    getExpoScreenTextureRuntimeStats,
    getExpoScreenTextureRuntimeStats,
  );
}

export function recordExpoGeneratedBillboardCacheHit() {
  updateStats({ generatedBillboardCacheHits: stats.generatedBillboardCacheHits + 1 });
}

export function recordExpoGeneratedBillboardCacheMiss() {
  updateStats({ generatedBillboardCacheMisses: stats.generatedBillboardCacheMisses + 1 });
}

export function recordExpoGeneratedBillboardCacheEviction() {
  updateStats({ generatedBillboardCacheEvictions: stats.generatedBillboardCacheEvictions + 1 });
}

export function recordExpoGeneratedBillboardTextureCreated({
  height,
  qualityHint,
  width,
}: {
  height: number;
  qualityHint: ExpoScreenTextureQualityHint;
  width: number;
}) {
  updateStats({
    lastGeneratedBillboardHeight: height,
    lastGeneratedBillboardQualityHint: qualityHint,
    lastGeneratedBillboardWidth: width,
  });
}

export function updateExpoTextureCacheRuntimeStats({
  generatedBillboardCacheSize,
  textureCacheLimit = DEFAULT_TEXTURE_CACHE_LIMIT,
  textureCacheSize,
}: {
  generatedBillboardCacheSize: number;
  textureCacheLimit?: number;
  textureCacheSize: number;
}) {
  updateStats({
    generatedBillboardCacheSize,
    textureCacheLimit,
    textureCacheSize,
  });
}

export { DEFAULT_TEXTURE_CACHE_LIMIT };
