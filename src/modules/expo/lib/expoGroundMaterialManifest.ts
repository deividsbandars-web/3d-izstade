import * as THREE from 'three';
import type { BoulevardMaterialKey, BoulevardSurfaceKind } from './boulevardArtPass';

type GroundTextureSet = {
  map: string[];
  normalMap?: string[];
  roughnessMap?: string[];
};

type GroundFallbackProfile = {
  bumpScale: number;
  emissiveIntensityBoost: number;
  metalness: number;
  normalScale: [number, number];
  roughness: number;
};

const GROUND_TEXTURE_MANIFEST: Record<Exclude<BoulevardMaterialKey, 'dark_field' | 'trim_glow'>, GroundTextureSet> = {
  hero_paver: {
    map: ['/textures/expo-runtime/hero-paver-4k/pavement_01_diff_4k.webp'],
    normalMap: ['/textures/expo-runtime/hero-paver-4k/pavement_01_nor_gl_4k.webp'],
    roughnessMap: ['/textures/expo-runtime/hero-paver-4k/pavement_01_rough_4k.webp'],
  },
  light_concrete: {
    map: ['/textures/expo-runtime/light-concrete-4k/concrete_floor_worn_001_diff_4k.webp'],
    normalMap: ['/textures/expo-runtime/light-concrete-4k/concrete_floor_worn_001_nor_gl_4k.webp'],
    roughnessMap: ['/textures/expo-runtime/light-concrete-4k/concrete_floor_worn_001_rough_4k.webp'],
  },
  urban_grass: {
    map: ['/textures/expo-runtime/urban-grass-4k/sparse_grass_diff_4k.webp'],
    normalMap: ['/textures/expo-runtime/urban-grass-4k/sparse_grass_nor_gl_4k.webp'],
    roughnessMap: ['/textures/expo-runtime/urban-grass-4k/sparse_grass_rough_4k.webp'],
  },
};

const GROUND_FALLBACKS: Partial<Record<BoulevardSurfaceKind, GroundFallbackProfile>> = {
  arrival_path: { bumpScale: 0.06, emissiveIntensityBoost: 0.012, metalness: 0.08, normalScale: [0.7, 0.7], roughness: 0.62 },
  arrival_plaza: { bumpScale: 0.028, emissiveIntensityBoost: 0.018, metalness: 0.07, normalScale: [0.35, 0.35], roughness: 0.7 },
  base_field: { bumpScale: 0.022, emissiveIntensityBoost: 0.01, metalness: 0.05, normalScale: [0.3, 0.3], roughness: 0.92 },
  cross_strip: { bumpScale: 0.018, emissiveIntensityBoost: 0.008, metalness: 0.06, normalScale: [0.2, 0.2], roughness: 0.88 },
  district_plaza: { bumpScale: 0.024, emissiveIntensityBoost: 0.02, metalness: 0.06, normalScale: [0.28, 0.28], roughness: 0.74 },
  grass_band: { bumpScale: 0.04, emissiveIntensityBoost: 0.012, metalness: 0.02, normalScale: [0.5, 0.5], roughness: 0.96 },
  hero_path: { bumpScale: 0.08, emissiveIntensityBoost: 0.016, metalness: 0.1, normalScale: [0.8, 0.8], roughness: 0.56 },
  light_pool: { bumpScale: 0.012, emissiveIntensityBoost: 0.045, metalness: 0.12, normalScale: [0.12, 0.12], roughness: 0.48 },
  median_strip: { bumpScale: 0.02, emissiveIntensityBoost: 0.014, metalness: 0.05, normalScale: [0.22, 0.22], roughness: 0.84 },
  secondary_path: { bumpScale: 0.032, emissiveIntensityBoost: 0.012, metalness: 0.07, normalScale: [0.34, 0.34], roughness: 0.76 },
  trim_band: { bumpScale: 0.015, emissiveIntensityBoost: 0.032, metalness: 0.14, normalScale: [0.15, 0.15], roughness: 0.58 },
};

const DEFAULT_FALLBACK: GroundFallbackProfile = {
  bumpScale: 0.024,
  emissiveIntensityBoost: 0.01,
  metalness: 0.06,
  normalScale: [0.25, 0.25],
  roughness: 0.82,
};

export function getExpoGroundTextureCandidates(materialKey: BoulevardMaterialKey): GroundTextureSet | null {
  if (materialKey === 'dark_field' || materialKey === 'trim_glow') {
    return null;
  }

  return GROUND_TEXTURE_MANIFEST[materialKey];
}

export function getExpoGroundFallbackProfile(kind: BoulevardSurfaceKind, defaultRoughness: number, defaultMetalness: number) {
  const profile = GROUND_FALLBACKS[kind] ?? DEFAULT_FALLBACK;
  return {
    bumpScale: profile.bumpScale,
    emissiveIntensityBoost: profile.emissiveIntensityBoost,
    metalness: Math.max(defaultMetalness, profile.metalness),
    normalScale: new THREE.Vector2(profile.normalScale[0], profile.normalScale[1]),
    roughness: Math.min(defaultRoughness, profile.roughness),
  };
}
