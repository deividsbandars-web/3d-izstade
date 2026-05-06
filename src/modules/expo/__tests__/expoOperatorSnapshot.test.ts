import assert from 'node:assert/strict';
import { buildExpoBoothLocalFootprint } from '../../../shared/expo/lib/boothLocalFootprint.js';
import {
  buildAllZoneReviewReports,
  buildZoneObservationsFromSnapshot,
  buildExpoReviewOperatorSnapshot,
  buildZoneReviewReport,
  buildZoneVisualDefectsFromSnapshot,
  buildZoneWarningsFromSnapshot,
} from '../runtime/operator/state/useExpoOperatorState.js';
import { buildWorldDiagnosticReport } from '../runtime/world/inspection/worldDiagnosticReport.js';
import type { WorldObjectRegistryEntry } from '../runtime/world/inspection/worldObjectRegistry.js';

const cityEntry: WorldObjectRegistryEntry = {
  diagnosticOwners: ['screenSurfaceBoundsDiagnostics.ts'],
  id: 'city-screen-1',
  interactionOwner: null,
  layer: 'city-screen-surface',
  planningSections: ['middle'],
  planningZone: 'canonical-city',
  position: [0, 120, -420],
  safeEditSeam: 'buildScreenSurfacePlan.ts',
  sourceFile: 'buildScreenSurfacePlan.ts',
  sourceFunction: 'buildZoneScreenSurfacePlan',
  sourceKind: 'screen-surface',
};

const stadiumEntry: WorldObjectRegistryEntry = {
  diagnosticOwners: [],
  id: 'stadium-structure-1',
  interactionOwner: null,
  layer: 'stadium-structure',
  planningZone: 'rear-campus',
  position: [20, 0, -2800],
  safeEditSeam: 'ExpoRearCampus.tsx',
  sourceFile: 'ExpoRearCampus.tsx',
  sourceFunction: 'ExpoRearCampus',
  sourceKind: 'rear-campus-structure',
};

const boothEntry: WorldObjectRegistryEntry = {
  aliases: ['sponsor-concierge'],
  diagnosticOwners: ['boothFrontalityDiagnostics.ts'],
  id: 'booth-1',
  interactionOwner: 'DistrictBooth.tsx',
  layer: 'booth',
  planningZone: 'sector-a',
  position: [80, 0, -120],
  safeEditSeam: 'layoutEngine.ts',
  sourceFile: 'layoutEngine.ts',
  sourceFunction: 'buildExpoLayoutEngine',
  sourceKind: 'booth-placement',
};

const diagnosticReport = buildWorldDiagnosticReport({
  boothPlacements: [
    {
      id: 'booth-1',
      localFootprint: buildExpoBoothLocalFootprint({
        boothType: 'hero',
        nodeType: 'hero_left',
        position: [80, 0, -120],
        rotation: [0, -0.3, 0],
        sponsorTier: 'hero',
      }),
      nodeType: 'hero_left',
      rotation: [0, -0.3, 0],
    },
  ],
  screenSurfaces: [
    {
      color: '#ffffff',
      glowColor: '#22d3ee',
      id: 'city-screen-1',
      position: [5000, 120, -420],
      role: 'hero-wall',
      rotation: [0, 0, 0],
      sections: ['middle'],
      size: [32, 18, 4],
      type: 'wall',
    },
  ],
});

const snapshot = buildExpoReviewOperatorSnapshot({
  activeZoneId: 'arrival-gate',
  centerStack: ['city-screen-1', 'booth-1'],
  centerTarget: 'city-screen-1',
  clickStack: ['booth-1'],
  clickTarget: 'booth-1',
  dataMode: 'seeded-local',
  diagnosticReport,
  focusSlug: 'booth-1',
  inspector: [
    { distance: 12, id: 'city-screen-1', layer: 'city-screen-surface' },
    { distance: 18, id: 'booth-1', layer: 'booth' },
  ],
  layerStates: {
    booths: true,
    city: true,
    promenade: true,
    skyline: false,
    stadium: true,
  },
  markedPoint: [1, 2, 3],
  mode: 'fly',
  operatorZoneId: 'arrival-gate',
  playerPos: [10, 3, -40],
  registryEntries: {
    booths: [boothEntry],
    city: [cityEntry],
    stadium: [stadiumEntry],
  },
  sceneVersion: 'scene-v1',
  sectionStates: {
    arrival: true,
    left: true,
    middle: true,
    right: false,
    stadium: true,
  },
  targetBasket: ['booth-1', 'city-screen-1'],
  zones: [
    {
      expectedKeyObjectIds: ['city-screen-1'],
      expectedVisibleLayers: ['city-screen-surface', 'booth'],
      id: 'arrival-gate',
      intent: 'gateway-review',
      label: 'Arrival',
      startView: {
        lookAt: [0, 3.4, 0],
        position: [0, 5, 24],
        source: 'arrival-main',
      },
      watchItems: ['registry traceability'],
    },
  ],
});

assert.equal(snapshot.registry.totalCount, 3);
assert.equal(snapshot.registryById['booth-1']?.layer, 'booth');
assert.equal(snapshot.registryById['sponsor-concierge']?.id, 'booth-1');
assert.equal(snapshot.diagnostics.booths.frontalityCount, 1);
assert.equal(snapshot.diagnostics.screens.boothProximityCount, 0);
assert.equal(snapshot.resolvedTargets.centerTargetEntry?.id, 'city-screen-1');
assert.equal(snapshot.resolvedTargets.clickTargetEntry?.id, 'booth-1');
assert.equal(snapshot.resolvedTargets.inspectorEntries[0]?.registryEntry?.id, 'city-screen-1');
assert.deepEqual(snapshot.targetBasket, ['booth-1', 'city-screen-1']);
assert.equal(snapshot.operatorZone?.id, 'arrival-gate');
assert.equal(snapshot.focusSlug, 'booth-1');
assert.deepEqual(snapshot.operatorZone?.expectedKeyObjectIds, ['city-screen-1']);
assert.deepEqual(snapshot.operatorZone?.startView, {
  lookAt: [0, 3.4, 0],
  position: [0, 5, 24],
  source: 'arrival-main',
});
assert.equal(snapshot.operatorZoneValidation?.zoneId, 'arrival-gate');
assert.equal(snapshot.operatorZoneValidation?.status, 'ok');
assert.deepEqual(snapshot.operatorZoneValidation?.missingExpectedLayers, []);
assert.deepEqual(snapshot.operatorZoneValidation?.missingExpectedObjectIds, []);
assert.deepEqual(snapshot.operatorZoneValidation?.extraVisibleLayers, []);
assert.deepEqual(snapshot.operatorZoneFixRoutes, []);
assert.equal(snapshot.zones[0]?.validation.status, 'ok');
assert.deepEqual(snapshot.zones[0]?.fixRoutes, []);
assert.deepEqual(snapshot.zones[0]?.watchItems, ['registry traceability']);
assert.deepEqual(buildZoneWarningsFromSnapshot(snapshot), []);
assert.deepEqual(buildZoneObservationsFromSnapshot(snapshot), []);
assert.equal(buildZoneVisualDefectsFromSnapshot(snapshot).length, 2);
assert.equal(buildZoneVisualDefectsFromSnapshot(snapshot)[0]?.family, 'screen-bounds');
assert.equal(buildZoneVisualDefectsFromSnapshot(snapshot)[1]?.family, 'booth-frontality');
assert.equal(buildZoneReviewReport(snapshot)?.zoneId, 'arrival-gate');
assert.equal(buildZoneReviewReport(snapshot)?.status, 'ok');
assert.deepEqual(buildZoneReviewReport(snapshot)?.observations, []);
assert.equal(buildZoneReviewReport(snapshot)?.visualDefects.length, 2);
assert.equal(buildAllZoneReviewReports(snapshot).length, 1);
assert.doesNotThrow(() => JSON.stringify(snapshot));

const seamSnapshot = buildExpoReviewOperatorSnapshot({
  activeZoneId: 'stadium-feed-axis',
  centerStack: ['rear-campus-bowl-feed-surface', 'stadium-custom-feed-1', 'city-ground-seam', 'stadium-ground-seam'],
  centerTarget: 'rear-campus-bowl-feed-surface',
  clickStack: ['stadium-ground-seam'],
  clickTarget: 'stadium-ground-seam',
  dataMode: 'seeded-local',
  diagnosticReport,
  focusSlug: null,
  inspector: [
    { distance: 10, id: 'rear-campus-bowl-feed-surface', layer: 'stadium-screen-surface' },
    { distance: 14, id: 'stadium-custom-feed-1', layer: 'stadium-screen-feed' },
    { distance: 18, id: 'city-ground-seam', layer: 'city-plane' },
    { distance: 20, id: 'stadium-ground-seam', layer: 'stadium-plane' },
  ],
  layerStates: {
    booths: true,
    city: true,
    promenade: true,
    skyline: false,
    stadium: true,
  },
  markedPoint: null,
  mode: 'fly',
  operatorZoneId: 'stadium-feed-axis',
  playerPos: [0, 156, -2408],
  registryEntries: {
    booths: [],
    city: [
      {
        diagnosticOwners: [],
        id: 'city-ground-seam',
        interactionOwner: null,
        layer: 'city-plane',
        planningSections: ['middle'],
        planningZone: 'canonical-city',
        position: [0, 0, -2408],
        rotation: [0, 0, 0],
        safeEditSeam: 'buildCanonicalWorldPlan.ts',
        size: [100, 2, 100],
        sourceFile: 'buildCanonicalWorldPlan.ts',
        sourceFunction: 'buildCanonicalWorldPlan',
        sourceKind: 'city-plane',
      },
    ],
    stadium: [
      {
        diagnosticOwners: [],
        id: 'rear-campus-bowl-feed-surface',
        interactionOwner: null,
        layer: 'stadium-screen-surface',
        planningSections: ['middle'],
        planningZone: 'rear-campus',
        position: [0, 318, -2540],
        rotation: [0, Math.PI, 0],
        safeEditSeam: 'buildScreenSurfacePlan.ts',
        size: [1110, 214, 4.4],
        sourceFile: 'buildScreenSurfacePlan.ts',
        sourceFunction: 'buildZoneScreenSurfacePlan',
        sourceKind: 'screen-surface',
      },
      {
        diagnosticOwners: [],
        id: 'stadium-custom-feed-1',
        interactionOwner: null,
        layer: 'stadium-screen-feed',
        planningSections: ['middle'],
        planningZone: 'rear-campus',
        position: [0, 318, -2540],
        safeEditSeam: 'ExpoRearCampusStructures.tsx',
        sourceFile: 'ExpoRearCampusStructures.tsx',
        sourceFunction: 'ExpoRearCampusStructures',
        sourceKind: 'rear-campus-custom-screen-feed',
      },
      {
        diagnosticOwners: [],
        id: 'stadium-ground-seam',
        interactionOwner: null,
        layer: 'stadium-plane',
        planningSections: ['middle'],
        planningZone: 'rear-campus',
        position: [0, 0, -2408],
        rotation: [0, 0, 0],
        safeEditSeam: 'buildRearCampusZonePlan.ts',
        size: [100, 2, 100],
        sourceFile: 'buildRearCampusZonePlan.ts',
        sourceFunction: 'buildRearCampusZonePlan',
        sourceKind: 'rear-campus-forecourt',
      },
    ],
  },
  sceneVersion: 'scene-v1',
  sectionStates: {
    arrival: true,
    left: true,
    middle: true,
    right: true,
    stadium: true,
  },
  targetBasket: [],
  zones: [
    {
      expectedKeyObjectIds: ['rear-campus-bowl-feed-surface'],
      expectedVisibleLayers: ['stadium-screen-surface'],
      id: 'stadium-feed-axis',
      intent: 'rear-campus-feed-axis-review',
      label: 'Stadium Feed Axis',
      startView: {
        lookAt: [0, 98, -2820],
        position: [0, 156, -2408],
        source: 'arrival-main',
      },
      watchItems: ['seam detection'],
    },
  ],
});

const seamDefects = buildZoneVisualDefectsFromSnapshot(seamSnapshot);
assert.ok(seamDefects.some((defect) => defect.family === 'screen-feed-conflict'));
assert.ok(seamDefects.some((defect) => defect.family === 'mixed-ground-plane'));
