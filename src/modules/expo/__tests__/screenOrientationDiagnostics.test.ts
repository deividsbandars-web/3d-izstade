import assert from 'node:assert/strict';
import { diagnoseScreenOrientation } from '../runtime/planning/screens/screenOrientationDiagnostics.js';
import type { CityScreenSurface } from '../runtime/planning/types/index.js';

const validLeftSurface: CityScreenSurface = {
  color: '#08111c',
  glowColor: '#7dd3fc',
  id: 'screen-left-valid',
  position: [-708, 148, -296],
  role: 'hero-wall',
  rotation: [0, 0.78, 0],
  sections: ['left'],
  size: [156, 184, 3.4],
  type: 'wall',
};

const validRightSurface: CityScreenSurface = {
  color: '#091320',
  glowColor: '#fbbf24',
  id: 'screen-right-valid',
  position: [708, 144, -328],
  role: 'hero-wall',
  rotation: [0, -0.78, 0],
  sections: ['right'],
  size: [150, 178, 3.4],
  type: 'wall',
};

const leftFacingConflict: CityScreenSurface = {
  color: '#091320',
  glowColor: '#67e8f9',
  id: 'screen-left-conflict',
  position: [-968, 98, -110],
  role: 'support-wall',
  rotation: [0, -1.08, 0],
  sections: ['left'],
  size: [126, 122, 2.8],
  type: 'wall',
};

const missingYaw: CityScreenSurface = {
  color: '#091320',
  glowColor: '#93c5fd',
  id: 'screen-missing-yaw',
  position: [968, 94, -128],
  role: 'support-wall',
  rotation: [0, Number.NaN, 0],
  sections: ['right'],
  size: [126, 122, 2.8],
  type: 'wall',
};

const missingSections: CityScreenSurface = {
  color: '#091320',
  glowColor: '#93c5fd',
  id: 'screen-missing-sections',
  position: [0, 104, -238],
  role: 'support-wall',
  rotation: [0, Math.PI, 0],
  size: [108, 128, 2.8],
  type: 'wall',
};

const diagnostics = diagnoseScreenOrientation([
  validLeftSurface,
  validRightSurface,
  leftFacingConflict,
  missingYaw,
  missingSections,
]);

assert.equal(diagnostics.some((entry) => entry.screenId === 'screen-left-valid'), false);
assert.equal(diagnostics.some((entry) => entry.screenId === 'screen-right-valid'), false);
assert.ok(diagnostics.some((entry) => entry.screenId === 'screen-left-conflict' && entry.category === 'viewer-facing-conflict'));
assert.ok(diagnostics.some((entry) => entry.screenId === 'screen-missing-yaw' && entry.category === 'missing-rotation'));
assert.ok(diagnostics.some((entry) => entry.screenId === 'screen-missing-sections' && entry.category === 'missing-section-metadata'));

