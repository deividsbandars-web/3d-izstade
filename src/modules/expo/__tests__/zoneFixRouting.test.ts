import assert from 'node:assert/strict';
import type { ReviewOperatorZone } from '../runtime/operator/model/reviewOperatorSession.js';
import { buildZoneFixRoutes } from '../runtime/operator/model/zoneFixRouting.js';
import type { ZoneReviewValidation } from '../runtime/operator/model/zoneReviewValidation.js';
import type { WorldObjectRegistryEntry } from '../runtime/world/inspection/worldObjectRegistry.js';

const cityScreen: WorldObjectRegistryEntry = {
  diagnosticOwners: [],
  id: 'city-screen-1',
  interactionOwner: null,
  layer: 'city-screen-surface',
  planningZone: 'canonical-city',
  position: [0, 120, -420],
  safeEditSeam: 'src/modules/expo/runtime/planning/screens/buildScreenSurfacePlan.ts',
  sourceFile: 'src/modules/expo/runtime/planning/screens/buildScreenSurfacePlan.ts',
  sourceFunction: 'buildZoneScreenSurfacePlan',
  sourceKind: 'screen-surface',
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

const validation: ZoneReviewValidation = {
  actualKeyObjectIds: [],
  actualVisibleLayers: [],
  extraVisibleLayers: [],
  forbiddenExpectedLayersPresent: ['booth'],
  forbiddenObjectIdsPresent: ['city-screen-1'],
  locationDistance: 640,
  locationStatus: 'mismatch',
  missingExpectedLayers: ['booth'],
  missingExpectedObjectIds: ['city-screen-1'],
  status: 'warning',
  unknownExpectedObjectIds: [],
  zoneId: 'left-marquee',
};

const routes = buildZoneFixRoutes({
  registryById: {
    'city-screen-1': cityScreen,
  },
  validation,
  zone,
});

assert.equal(routes.length, 4);
assert.equal(routes[0]?.target, 'city-screen-1');
assert.equal(routes[0]?.safeEditSeam, 'src/modules/expo/runtime/planning/screens/buildScreenSurfacePlan.ts');
assert.equal(routes[1]?.target, 'booth');
assert.equal(routes[1]?.safeEditSeam, 'src/shared/expo/layoutEngine.ts');
assert.equal(routes[2]?.issue, 'forbidden-object');
assert.equal(routes[2]?.target, 'city-screen-1');
assert.equal(routes[3]?.issue, 'forbidden-layer');
assert.equal(routes[3]?.target, 'booth');
