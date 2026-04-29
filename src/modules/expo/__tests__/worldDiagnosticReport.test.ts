import assert from 'node:assert/strict';
import { buildWorldDiagnosticReport } from '../runtime/world/inspection/worldDiagnosticReport.js';
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

const invalidSurface: CityScreenSurface = {
  ...validSurface,
  id: 'screen-invalid',
  position: [0, Number.NaN, -420],
};

const overlappingSurface: CityScreenSurface = {
  ...validSurface,
  id: 'screen-overlap',
  position: [20, 120, -420],
  size: [156, 184, 20],
};

const report = buildWorldDiagnosticReport({
  boothPlacements: [
    {
      id: 'booth-left-conflict',
      localFootprint: undefined,
      nodeType: 'hero_left',
      rotation: [0, -0.3, 0],
    },
  ],
  screenSurfaces: [validSurface, invalidSurface, overlappingSurface],
});

assert.equal(report.screens.boundsCount, 1);
assert.equal(report.screens.overlapCount, 1);
assert.equal(report.screens.boothProximityCount, 0);
assert.equal(report.booths.frontalityCount, 1);
assert.ok(report.summary.familiesWithWarnings.includes('screen-bounds'));
assert.ok(report.summary.familiesWithWarnings.includes('screen-overlap'));
assert.ok(report.summary.familiesWithWarnings.includes('booth-frontality'));
assert.ok(report.summary.totalWarnings >= 3);
