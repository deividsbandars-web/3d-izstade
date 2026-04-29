import assert from 'node:assert/strict';
import { diagnoseScreenSurfaceBounds } from '../runtime/planning/screens/screenSurfaceBoundsDiagnostics.js';
import type { CityScreenSurface } from '../runtime/planning/types/index.js';

const validSurface: CityScreenSurface = {
  color: '#08111c',
  glowColor: '#7dd3fc',
  id: 'screen-valid',
  position: [0, 120, -420],
  role: 'hero-wall',
  rotation: [0, Math.PI, 0],
  size: [156, 184, 3.4],
  type: 'wall',
};

const missingPosition = {
  ...validSurface,
  id: 'screen-missing-position',
  position: undefined,
} as unknown as CityScreenSurface;

const nonFinitePosition: CityScreenSurface = {
  ...validSurface,
  id: 'screen-non-finite-position',
  position: [0, Number.NaN, -420],
};

const missingSize = {
  ...validSurface,
  id: 'screen-missing-size',
  size: undefined,
} as unknown as CityScreenSurface;

const nonFiniteSize: CityScreenSurface = {
  ...validSurface,
  id: 'screen-non-finite-size',
  size: [156, Number.NaN, 3.4],
};

const nonPositiveSize: CityScreenSurface = {
  ...validSurface,
  id: 'screen-non-positive-size',
  size: [156, 184, 0],
};

const missingRotation = {
  ...validSurface,
  id: 'screen-missing-rotation',
  rotation: undefined,
} as unknown as CityScreenSurface;

const nonFiniteRotation: CityScreenSurface = {
  ...validSurface,
  id: 'screen-non-finite-rotation',
  rotation: [0, Number.NaN, 0],
};

const outOfBounds: CityScreenSurface = {
  ...validSurface,
  id: 'screen-out-of-bounds',
  position: [3200, 120, -420],
};

const yawAwareInsideEnvelope: CityScreenSurface = {
  ...validSurface,
  id: 'screen-yaw-aware-inside-envelope',
  position: [2522, 120, -420],
  rotation: [0, Math.PI / 2, 0],
  size: [3.4, 184, 156],
};

const input = [
  validSurface,
  missingPosition,
  nonFinitePosition,
  missingSize,
  nonFiniteSize,
  nonPositiveSize,
  missingRotation,
  nonFiniteRotation,
  outOfBounds,
  yawAwareInsideEnvelope,
];

const before = JSON.stringify(input);
const diagnostics = diagnoseScreenSurfaceBounds(input);

assert.equal(JSON.stringify(input), before);
assert.equal(diagnostics.some((entry) => entry.screenId === 'screen-valid'), false);
assert.ok(diagnostics.some((entry) => entry.screenId === 'screen-missing-position' && entry.code === 'missing-position'));
assert.ok(diagnostics.some((entry) => entry.screenId === 'screen-non-finite-position' && entry.code === 'non-finite-position'));
assert.ok(diagnostics.some((entry) => entry.screenId === 'screen-missing-size' && entry.code === 'missing-size'));
assert.ok(diagnostics.some((entry) => entry.screenId === 'screen-non-finite-size' && entry.code === 'non-finite-size'));
assert.ok(diagnostics.some((entry) => entry.screenId === 'screen-non-positive-size' && entry.code === 'non-positive-size'));
assert.ok(diagnostics.some((entry) => entry.screenId === 'screen-missing-rotation' && entry.code === 'missing-rotation'));
assert.ok(diagnostics.some((entry) => entry.screenId === 'screen-non-finite-rotation' && entry.code === 'non-finite-rotation'));
assert.ok(diagnostics.some((entry) => entry.screenId === 'screen-out-of-bounds' && entry.code === 'out-of-bounds-xz'));
assert.equal(diagnostics.some((entry) => entry.screenId === 'screen-yaw-aware-inside-envelope'), false);
