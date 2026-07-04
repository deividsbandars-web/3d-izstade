import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const appSource = readFileSync('src/App.tsx', 'utf8');
const canvasShellSource = readFileSync('src/modules/expo/runtime/world/scene/ExpoWorldCanvasShell.tsx', 'utf8');

assert.equal(/fallback=\{null\}/.test(appSource), false, 'App route layer must not use blank Suspense fallbacks');
assert.match(appSource, /function lazyRoute/);
assert.match(appSource, /RouteLoadingFallback/);

assert.equal(
  /<Suspense fallback=\{null\}/.test(canvasShellSource),
  false,
  'Expo canvas Suspense boundaries must use canvas-safe fallbacks',
);
assert.match(canvasShellSource, /data-expo-canvas-loading-fallback/);
