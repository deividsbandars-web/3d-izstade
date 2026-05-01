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
  playerPos: [32, 0, 24],
  registryById: {
    'booth-1': booth,
    'city-screen-1': cityScreen,
  },
});

assert.equal(okValidation.status, 'ok');
assert.equal(okValidation.locationStatus, 'settled');
assert.deepEqual(okValidation.forbiddenObjectIdsPresent, []);
assert.deepEqual(okValidation.forbiddenExpectedLayersPresent, []);
assert.deepEqual(okValidation.missingExpectedObjectIds, []);
assert.deepEqual(okValidation.missingExpectedLayers, []);

const warningValidation = validateReviewZone(zone, {
  centerTargetEntry: cityScreen,
  clickTargetEntry: null,
  inspectorEntries: [
    { distance: 12, id: 'city-screen-1', layer: 'city-screen-surface', registryEntry: cityScreen },
  ],
  playerPos: [32, 0, 24],
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
  playerPos: [32, 0, 24],
  registryById: {
    'city-screen-1': cityScreen,
  },
});

assert.equal(unknownValidation.status, 'warning');
assert.deepEqual(unknownValidation.unknownExpectedObjectIds, ['missing-object']);
assert.deepEqual(unknownValidation.missingExpectedObjectIds, ['missing-object']);

const locationMismatchValidation = validateReviewZone(zone, {
  centerTargetEntry: cityScreen,
  clickTargetEntry: booth,
  inspectorEntries: [
    { distance: 12, id: 'city-screen-1', layer: 'city-screen-surface', registryEntry: cityScreen },
    { distance: 18, id: 'booth-1', layer: 'booth', registryEntry: booth },
  ],
  playerPos: [1600, 0, -2200],
  registryById: {
    'booth-1': booth,
    'city-screen-1': cityScreen,
  },
});

assert.equal(locationMismatchValidation.status, 'warning');
assert.equal(locationMismatchValidation.locationStatus, 'mismatch');

const forbiddenValidation = validateReviewZone({
  ...zone,
  forbiddenKeyObjectIds: ['booth-1'],
  forbiddenVisibleLayers: ['booth'],
}, {
  centerTargetEntry: cityScreen,
  clickTargetEntry: booth,
  inspectorEntries: [
    { distance: 12, id: 'city-screen-1', layer: 'city-screen-surface', registryEntry: cityScreen },
    { distance: 18, id: 'booth-1', layer: 'booth', registryEntry: booth },
  ],
  playerPos: [32, 0, 24],
  registryById: {
    'booth-1': booth,
    'city-screen-1': cityScreen,
  },
});

assert.equal(forbiddenValidation.status, 'warning');
assert.deepEqual(forbiddenValidation.forbiddenObjectIdsPresent, ['booth-1']);
assert.deepEqual(forbiddenValidation.forbiddenExpectedLayersPresent, ['booth']);
