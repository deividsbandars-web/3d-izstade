import assert from 'node:assert/strict';
import {
  isExpoPipelineTextureUrl,
  resolveExpoRuntimeTextureUrl,
  resolveExpoTextureCandidateUrls,
} from '../lib/expoTexturePipeline.js';

assert.equal(
  resolveExpoRuntimeTextureUrl('/textures/expo/hero-paver-4k/pavement_01_diff_4k.png'),
  '/textures/expo-runtime/hero-paver-4k/pavement_01_diff_4k.webp'
);
assert.equal(
  resolveExpoRuntimeTextureUrl('/textures/expo/screen-placeholders-4k/horizontal-16x9/screen_horizontal_01.png'),
  '/textures/expo-runtime/screen-placeholders-4k/horizontal-16x9/screen_horizontal_01.webp'
);
assert.equal(resolveExpoRuntimeTextureUrl('https://cdn.example.com/logo.png'), 'https://cdn.example.com/logo.png');
assert.equal(isExpoPipelineTextureUrl('/textures/expo/light-concrete-4k/concrete_floor_worn_001_diff_4k.png'), true);
assert.equal(isExpoPipelineTextureUrl('/textures/expo-runtime/light-concrete-4k/concrete_floor_worn_001_diff_4k.webp'), false);
assert.deepEqual(
  resolveExpoTextureCandidateUrls('/textures/expo/hero-facade-screen-8k/hero_facade_screen_01.png'),
  [
    '/textures/expo-runtime/hero-facade-screen-8k/hero_facade_screen_01.webp',
    '/textures/expo/hero-facade-screen-8k/hero_facade_screen_01.png',
  ]
);

