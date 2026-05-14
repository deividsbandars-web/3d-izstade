import assert from 'node:assert/strict';
import { diagnoseBoothFrontality } from '../../../shared/expo/lib/boothFrontalityDiagnostics.js';
import type { BoothFrontalityPlacement } from '../../../shared/expo/lib/boothFrontalityDiagnostics.js';

const basePlacement = {
  id: 'booth-1',
} as const satisfies Pick<BoothFrontalityPlacement, 'id'>;

const validLeftPlacement: BoothFrontalityPlacement = {
  ...basePlacement,
  id: 'booth-left-valid',
  nodeType: 'standard_left',
  rotation: [0, Math.PI / 2, 0],
};

const validRightPlacement: BoothFrontalityPlacement = {
  ...basePlacement,
  id: 'booth-right-valid',
  nodeType: 'standard_right',
  rotation: [0, -Math.PI / 2, 0],
};

const leftConflictPlacement: BoothFrontalityPlacement = {
  ...basePlacement,
  id: 'booth-left-conflict',
  nodeType: 'hero_left',
  rotation: [0, -1.04, 0],
};

const rightConflictPlacement: BoothFrontalityPlacement = {
  ...basePlacement,
  id: 'booth-right-conflict',
  nodeType: 'hero_right',
  rotation: [0, 1.04, 0],
};

const missingRotationPlacement = {
  ...basePlacement,
  id: 'booth-missing-rotation',
  nodeType: 'standard_left',
  rotation: undefined,
} as unknown as BoothFrontalityPlacement;

const nonFiniteRotationPlacement: BoothFrontalityPlacement = {
  ...basePlacement,
  id: 'booth-non-finite-rotation',
  nodeType: 'standard_right',
  rotation: [0, Number.NaN, 0],
};

const missingNodeTypePlacement: BoothFrontalityPlacement = {
  ...basePlacement,
  id: 'booth-missing-node-type',
  rotation: [0, Math.PI / 2, 0],
};

const endcapPlacement: BoothFrontalityPlacement = {
  ...basePlacement,
  id: 'booth-endcap',
  nodeType: 'endcap',
  rotation: [0, Math.PI / 2, 0],
};

const worldSideEndcapConflict: BoothFrontalityPlacement = {
  ...basePlacement,
  id: 'booth-endcap-world-side-conflict',
  nodeType: 'endcap',
  position: [180, 0, -900],
  rotation: [0, Math.PI / 2, 0],
};

const worldSideEndcapValid: BoothFrontalityPlacement = {
  ...basePlacement,
  id: 'booth-endcap-world-side-valid',
  nodeType: 'endcap',
  position: [180, 0, -900],
  rotation: [0, -Math.PI / 2, 0],
};

const diagnostics = diagnoseBoothFrontality([
  validLeftPlacement,
  validRightPlacement,
  leftConflictPlacement,
  rightConflictPlacement,
  missingRotationPlacement,
  nonFiniteRotationPlacement,
  missingNodeTypePlacement,
  endcapPlacement,
  worldSideEndcapConflict,
  worldSideEndcapValid,
]);

assert.equal(diagnostics.some((entry) => entry.boothId === 'booth-left-valid'), false);
assert.equal(diagnostics.some((entry) => entry.boothId === 'booth-right-valid'), false);
assert.ok(diagnostics.some((entry) => entry.boothId === 'booth-left-conflict' && entry.code === 'left-facing-conflict'));
assert.ok(diagnostics.some((entry) => entry.boothId === 'booth-right-conflict' && entry.code === 'right-facing-conflict'));
assert.ok(diagnostics.some((entry) => entry.boothId === 'booth-missing-rotation' && entry.code === 'missing-rotation'));
assert.ok(diagnostics.some((entry) => entry.boothId === 'booth-non-finite-rotation' && entry.code === 'non-finite-rotation'));
assert.ok(diagnostics.some((entry) => entry.boothId === 'booth-missing-node-type' && entry.code === 'missing-node-type'));
assert.equal(diagnostics.some((entry) => entry.boothId === 'booth-endcap'), false);
assert.ok(diagnostics.some((entry) => entry.boothId === 'booth-endcap-world-side-conflict' && entry.code === 'world-side-facing-conflict'));
assert.equal(diagnostics.some((entry) => entry.boothId === 'booth-endcap-world-side-valid'), false);
