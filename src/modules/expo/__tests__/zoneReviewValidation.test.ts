import assert from 'node:assert/strict';
import type { ReviewOperatorZone } from '../runtime/operator/model/reviewOperatorSession.js';
import { validateReviewZone } from '../runtime/operator/model/zoneReviewValidation.js';
import type { WorldObjectRegistryEntry } from '../runtime/world/inspection/worldObjectRegistry.js';

const cityScreen: WorldObjectRegistryEntry = {
  diagnosticOwners: [],
  id: 'city-screen-1',
  interactionOwner: null,
  layer: 'city-screen-surface',
  planningZone: 'canonical-city',
  position: [0, 120, -420],
  safeEditSeam: 'buildScreenSurfacePlan.ts',
  sourceFile: 'buildScreenSurfacePlan.ts',
  sourceFunction: 'buildZoneScreenSurfacePlan',
  sourceKind: 'screen-surface',
};

const booth: WorldObjectRegistryEntry = {
  diagnosticOwners: [],
  id: 'booth-1',
  interactionOwner: 'DistrictBooth.tsx',
  layer: 'booth',
  planningZone: 'sector-a',
  position: [1400, 0, 1400],
  safeEditSeam: 'layoutEngine.ts',
  sourceFile: 'layoutEngine.ts',
  sourceFunction: 'buildExpoLayoutEngine',
  sourceKind: 'booth-placement',
};

const zone: ReviewOperatorZone = {
  expectedKeyObjectIds: ['city-screen-1'],
  expectedVisibleLayers: ['city-screen-surface', 'booth'],
  id: 'left-marquee',
  intent: 'left-screen-marquee-review',
  label: 'Left Marquee',
  startView: {
    lookAt: [0, 0, 0],
    position: [0, 0, 0],
    source: 'arrival-main',
  },
  watchItems: ['screen ownership'],
};

const okValidation = validateReviewZone(zone, {
  centerTargetEntry: cityScreen,
  clickTargetEntry: booth,
  inspectorEntries: [
    { distance: 12, id: 'city-screen-1', layer: 'city-screen-surface', registryEntry: cityScreen },
    { distance: 18, id: 'booth-1', layer: 'booth', registryEntry: booth },
  ],
  registryById: {
    'booth-1': booth,
    'city-screen-1': cityScreen,
  },
});

assert.equal(okValidation.status, 'ok');
assert.deepEqual(okValidation.missingExpectedObjectIds, []);
assert.deepEqual(okValidation.missingExpectedLayers, []);

const warningValidation = validateReviewZone(zone, {
  centerTargetEntry: cityScreen,
  clickTargetEntry: null,
  inspectorEntries: [
    { distance: 12, id: 'city-screen-1', layer: 'city-screen-surface', registryEntry: cityScreen },
  ],
  registryById: {
    'city-screen-1': cityScreen,
  },
});

assert.equal(warningValidation.status, 'warning');
assert.deepEqual(warningValidation.missingExpectedObjectIds, []);
assert.deepEqual(warningValidation.missingExpectedLayers, ['booth']);
assert.deepEqual(warningValidation.unknownExpectedObjectIds, []);

const unknownValidation = validateReviewZone({
  ...zone,
  expectedKeyObjectIds: ['missing-object'],
}, {
  centerTargetEntry: cityScreen,
  clickTargetEntry: null,
  inspectorEntries: [],
  registryById: {
    'city-screen-1': cityScreen,
  },
});

assert.equal(unknownValidation.status, 'warning');
assert.deepEqual(unknownValidation.unknownExpectedObjectIds, ['missing-object']);
assert.deepEqual(unknownValidation.missingExpectedObjectIds, ['missing-object']);
