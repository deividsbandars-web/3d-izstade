import assert from 'node:assert/strict';
import { diagnoseScreenSurfaceOverlaps } from '../runtime/planning/screens/screenSurfaceOverlapDiagnostics.js';
import type { CityScreenSurface } from '../runtime/planning/types/index.js';

const baseSurface: CityScreenSurface = {
  color: '#08111c',
  glowColor: '#7dd3fc',
  id: 'screen-base',
  position: [0, 120, -420],
  role: 'hero-wall',
  rotation: [0, Math.PI, 0],
  size: [100, 180, 20],
  type: 'wall',
};

const separatedA: CityScreenSurface = {
  ...baseSurface,
  id: 'screen-separated-a',
  position: [0, 120, -420],
};

const separatedB: CityScreenSurface = {
  ...baseSurface,
  id: 'screen-separated-b',
  position: [220, 120, -420],
};

const overlapA: CityScreenSurface = {
  ...baseSurface,
  id: 'screen-overlap-a',
  position: [0, 120, -420],
};

const overlapB: CityScreenSurface = {
  ...baseSurface,
  id: 'screen-overlap-b',
  position: [60, 120, -414],
};

const touchingA: CityScreenSurface = {
  ...baseSurface,
  id: 'screen-touching-a',
  position: [0, 120, -420],
};

const touchingB: CityScreenSurface = {
  ...baseSurface,
  id: 'screen-touching-b',
  position: [100, 120, -420],
};

const overlapC: CityScreenSurface = {
  ...baseSurface,
  id: 'screen-overlap-c',
  position: [10, 120, -415],
};

const invalidBounds = {
  ...baseSurface,
  id: 'screen-invalid',
  size: [100, 180, Number.NaN],
} as unknown as CityScreenSurface;

const yawTouchingA: CityScreenSurface = {
  ...baseSurface,
  id: 'screen-yaw-touching-a',
  position: [0, 120, -420],
  rotation: [0, Math.PI / 2, 0],
  size: [20, 180, 100],
};

const yawTouchingB: CityScreenSurface = {
  ...baseSurface,
  id: 'screen-yaw-touching-b',
  position: [100, 120, -420],
  rotation: [0, -Math.PI / 2, 0],
  size: [20, 180, 100],
};

const yawOverlapA: CityScreenSurface = {
  ...baseSurface,
  id: 'screen-yaw-overlap-a',
  position: [0, 120, -420],
  rotation: [0, Math.PI / 2, 0],
  size: [20, 180, 100],
};

const yawOverlapB: CityScreenSurface = {
  ...baseSurface,
  id: 'screen-yaw-overlap-b',
  position: [90, 120, -420],
  rotation: [0, -Math.PI / 2, 0],
  size: [20, 180, 100],
};

const separatedDiagnostics = diagnoseScreenSurfaceOverlaps([separatedA, separatedB]);
assert.equal(separatedDiagnostics.length, 0);

const overlapDiagnostics = diagnoseScreenSurfaceOverlaps([overlapA, overlapB]);
assert.equal(overlapDiagnostics.length, 1);
assert.equal(overlapDiagnostics[0]?.code, 'screen-screen-overlap');
assert.equal(overlapDiagnostics[0]?.surfaceA, 'screen-overlap-a');
assert.equal(overlapDiagnostics[0]?.surfaceB, 'screen-overlap-b');
assert.ok((overlapDiagnostics[0]?.details.overlapX ?? 0) > 0);
assert.ok((overlapDiagnostics[0]?.details.overlapZ ?? 0) > 0);

const touchingDiagnostics = diagnoseScreenSurfaceOverlaps([touchingA, touchingB]);
assert.equal(touchingDiagnostics.length, 0);

const yawTouchingDiagnostics = diagnoseScreenSurfaceOverlaps([yawTouchingA, yawTouchingB]);
assert.equal(yawTouchingDiagnostics.length, 0);

const yawOverlapDiagnostics = diagnoseScreenSurfaceOverlaps([yawOverlapA, yawOverlapB]);
assert.equal(yawOverlapDiagnostics.length, 1);
assert.equal(yawOverlapDiagnostics[0]?.surfaceA, 'screen-yaw-overlap-a');
assert.equal(yawOverlapDiagnostics[0]?.surfaceB, 'screen-yaw-overlap-b');

const multiInput = [overlapA, overlapB, overlapC, invalidBounds];
const before = JSON.stringify(multiInput);
const multiDiagnostics = diagnoseScreenSurfaceOverlaps(multiInput);
assert.equal(JSON.stringify(multiInput), before);
assert.equal(multiDiagnostics.length, 3);
assert.deepEqual(
  multiDiagnostics.map((entry) => [entry.surfaceA, entry.surfaceB]),
  [
    ['screen-overlap-a', 'screen-overlap-b'],
    ['screen-overlap-a', 'screen-overlap-c'],
    ['screen-overlap-b', 'screen-overlap-c'],
  ],
);
