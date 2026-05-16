import assert from 'node:assert/strict';
import {
  buildWorldPhysicsSurfaceRegistry,
  findBlockingWorldPhysicsSolid,
  findCurrentWorldPhysicsSolidTopY,
  findCurrentWorldPhysicsSurfaceY,
  findWorldPhysicsLandingSurface,
  findWorldPhysicsSolidTopLanding,
  findWorldPhysicsTraversalSurface,
  findWorldPhysicsLandingY,
  isWorldPhysicsPositionOnWalkableSurface,
  resolveWorldPhysicsBounds,
  type WorldPhysicsPoint,
} from '../runtime/world/physics/worldPhysicsSurfaceRegistry.js';
import { buildWorldPhysicsAccessAudit } from '../runtime/world/physics/worldPhysicsAccessAudit.js';
import { buildWorldPhysicsTraversalGraph } from '../runtime/world/physics/worldPhysicsTraversalGraph.js';
import {
  WORLD_PHYSICS_ACCESS_RECOMMENDATION_LIMIT,
  buildWorldPhysicsVerticalAccessNodes,
} from '../runtime/world/physics/worldPhysicsVerticalAccessNodes.js';
import { buildCanonicalWorldPlanFromWorldContract } from '../runtime/planning/index.js';
import {
  buildBoothWorldObjectRegistry,
  buildCityWorldObjectRegistry,
  buildStadiumWorldObjectRegistry,
  type WorldObjectRegistryEntry,
} from '../runtime/world/inspection/worldObjectRegistry.js';
import { buildRenderedRearCampusRegistryPlan } from '../runtime/world/rearCampusRenderPolicy.js';
import { PRODUCTION_SAFE_COMPANIES, PRODUCTION_SAFE_SECTORS } from '../state/expoRuntime.js';
import { buildExpoWorldContract } from '../../../shared/expo/worldContract.js';

function entry(
  id: string,
  layer: WorldObjectRegistryEntry['layer'],
  position: [number, number, number],
  size: [number, number, number],
  overrides: Partial<WorldObjectRegistryEntry> = {},
): WorldObjectRegistryEntry {
  return {
    diagnosticOwners: [],
    id,
    interactionOwner: null,
    layer,
    planningZone: 'test-zone',
    position,
    rotation: [0, 0, 0],
    safeEditSeam: 'test',
    size,
    sourceFile: 'test.ts',
    sourceFunction: 'test',
    sourceKind: layer,
    ...overrides,
  };
}

const cityMass = entry('city-block-a', 'city-mass', [10, 20, -30], [40, 30, 50]);
const perimeter = entry('city-perimeter-a', 'city-mass', [90, 16, -30], [120, 32, 14], {
  planningRole: 'city-perimeter',
  sourceKind: 'city-perimeter-connector',
});
const screenSurface = entry('screen-a', 'city-screen-surface', [10, 20, -80], [80, 50, 4]);
const rotatedBooth = entry('booth-rotated', 'booth', [0, 6, 80], [20, 12, 40], {
  rotation: [0, Math.PI / 2, 0],
});

const registry = buildWorldPhysicsSurfaceRegistry([
  cityMass,
  perimeter,
  screenSurface,
  rotatedBooth,
]);

assert.deepEqual(registry.solids.map((solid) => solid.id).sort(), [
  'booth-rotated',
  'city-block-a',
  'city-perimeter-a',
]);
assert.deepEqual(registry.walkableSurfaces.map((surface) => surface.ownerId).sort(), [
  'booth-rotated',
  'city-block-a',
]);
assert.equal(registry.walkableSurfaces.some((surface) => surface.ownerId === 'city-perimeter-a'), false);
assert.equal(registry.solids.some((solid) => solid.id === 'screen-a'), false);

const screenHostRegistry = buildWorldPhysicsSurfaceRegistry([
  entry('city-screen-host-a', 'city-mass', [50, 50, -80], [84, 100, 36], {
    sourceKind: 'city-screen-host-mass',
  }),
]);
assert.equal(screenHostRegistry.solids.some((solid) => solid.id === 'city-screen-host-a'), true);
assert.equal(screenHostRegistry.walkableSurfaces.some((surface) => surface.ownerId === 'city-screen-host-a'), false);
assert.equal(
  findWorldPhysicsSolidTopLanding(
    { x: 50, y: 100, z: -80 },
    110,
    90,
    screenHostRegistry.solids,
  )?.playerY,
  104,
);
assert.equal(
  findCurrentWorldPhysicsSolidTopY(
    { x: 50, y: 104, z: -80 },
    104,
    screenHostRegistry.solids,
  ),
  104,
);

const cityBounds = resolveWorldPhysicsBounds(cityMass);
assert.deepEqual(cityBounds, {
  maxX: 30,
  maxY: 35,
  maxZ: -5,
  minX: -10,
  minY: 5,
  minZ: -55,
});

const citySurface = registry.walkableSurfaces.find((surface) => surface.ownerId === 'city-block-a');
assert.ok(citySurface);
assert.equal(citySurface.playerY, 39);
assert.deepEqual(citySurface.size, [40, 50]);
assert.equal(findWorldPhysicsLandingY({ x: 10, y: 58, z: -30 }, 58, registry.walkableSurfaces), 39);
assert.equal(
  findWorldPhysicsLandingSurface(
    { x: 10, y: 39.1, z: -30 },
    39.3,
    38.9,
    registry.walkableSurfaces,
  )?.ownerId,
  'city-block-a',
);
assert.equal(findCurrentWorldPhysicsSurfaceY({ x: 10, y: 39, z: -30 }, 39, registry.walkableSurfaces), 39);
assert.equal(isWorldPhysicsPositionOnWalkableSurface({ x: 10, y: 39, z: -30 }, 39, registry.walkableSurfaces), true);
assert.equal(findCurrentWorldPhysicsSurfaceY({ x: 40, y: 39, z: -30 }, 39, registry.walkableSurfaces), null);
assert.equal(isWorldPhysicsPositionOnWalkableSurface({ x: 40, y: 39, z: -30 }, 39, registry.walkableSurfaces), false);
assert.equal(findWorldPhysicsLandingY({ x: 40, y: 58, z: -30 }, 58, registry.walkableSurfaces), 5);

const boothBounds = resolveWorldPhysicsBounds(rotatedBooth);
assert.ok(boothBounds);
assert.equal(Math.round(boothBounds.maxX - boothBounds.minX), 40);
assert.equal(Math.round(boothBounds.maxZ - boothBounds.minZ), 20);

const groundPointInsideBlock: WorldPhysicsPoint = { x: 10, y: 5, z: -30 };
const topPointInsideBlock: WorldPhysicsPoint = { x: 10, y: 39, z: -30 };
assert.equal(findBlockingWorldPhysicsSolid(groundPointInsideBlock, registry.solids, { radius: 1 })?.solid.id, 'city-block-a');
assert.equal(findBlockingWorldPhysicsSolid(topPointInsideBlock, registry.solids, { radius: 1 }), null);

const compoundPostRegistry = buildWorldPhysicsSurfaceRegistry([
  entry('compound-post-gate', 'mega-landmark', [0, 50, 0], [120, 100, 40], {
    physicsParts: [
      { id: 'left-post', position: [-40, 50, 0], size: [20, 100, 24] },
      { id: 'right-post', position: [40, 50, 0], size: [20, 100, 24] },
    ],
  }),
]);
assert.equal(compoundPostRegistry.solids.some((solid) => solid.id === 'compound-post-gate'), false);
assert.equal(
  findBlockingWorldPhysicsSolid({ x: -40, y: 5, z: 0 }, compoundPostRegistry.solids, { radius: 1 })?.solid.id,
  'compound-post-gate:left-post',
);
assert.equal(findBlockingWorldPhysicsSolid({ x: 0, y: 5, z: 0 }, compoundPostRegistry.solids, { radius: 1 }), null);

const blockedTopRegistry = buildWorldPhysicsSurfaceRegistry([
  entry('low-deck-with-post', 'mega-landmark', [0, 20, 0], [100, 40, 50], {
    physicsParts: [
      { id: 'deck', position: [0, 4, 0], size: [80, 8, 40], walkableTop: false },
      { id: 'post', position: [0, 50, 0], size: [20, 100, 20], walkableTop: false },
    ],
  }),
]);
assert.equal(
  findWorldPhysicsSolidTopLanding({ x: 0, y: 12, z: 0 }, 20, 10, blockedTopRegistry.solids),
  null,
);
assert.equal(
  findWorldPhysicsSolidTopLanding({ x: 30, y: 12, z: 0 }, 20, 10, blockedTopRegistry.solids)?.solid.id,
  'low-deck-with-post:deck',
);

const lowStep = entry('low-step-a', 'city-mass', [120, 6, -30], [36, 12, 36]);
const highMantle = entry('high-mantle-a', 'city-mass', [180, 36, -30], [44, 72, 44]);
const traversalRegistry = buildWorldPhysicsSurfaceRegistry([lowStep, highMantle]);
const lowStepCandidate = findWorldPhysicsTraversalSurface({
  blockingSolidId: 'low-step-a',
  desiredPosition: { x: 120, y: 5, z: -30 },
  maxElevationDelta: 18,
  playerPosition: { x: 100, y: 5, z: -30 },
  surfaces: traversalRegistry.walkableSurfaces,
});
assert.equal(lowStepCandidate?.surface.ownerId, 'low-step-a');
assert.equal(lowStepCandidate?.landingPosition.y, 16);
assert.equal(findWorldPhysicsTraversalSurface({
  blockingSolidId: 'high-mantle-a',
  desiredPosition: { x: 180, y: 5, z: -30 },
  maxElevationDelta: 18,
  playerPosition: { x: 160, y: 5, z: -30 },
  surfaces: traversalRegistry.walkableSurfaces,
}), null);
assert.equal(findWorldPhysicsTraversalSurface({
  blockingSolidId: 'high-mantle-a',
  desiredPosition: { x: 180, y: 5, z: -30 },
  maxElevationDelta: 82,
  playerPosition: { x: 160, y: 5, z: -30 },
  surfaces: traversalRegistry.walkableSurfaces,
})?.surface.ownerId, 'high-mantle-a');

const traversalGraph = buildWorldPhysicsTraversalGraph(traversalRegistry);
assert.equal(traversalGraph.summary.surfaceCount, 2);
assert.equal(traversalGraph.summary.reachableSurfaces, 2);
assert.ok(traversalGraph.edges.some((edge) => edge.from === 'ground' && edge.to === 'low-step-a:top' && edge.kind === 'step-up'));
assert.ok(traversalGraph.edges.some((edge) => edge.from === 'ground' && edge.to === 'high-mantle-a:top' && edge.kind === 'mantle'));

const unreachableTower = entry('unreachable-tower-a', 'city-tower', [260, 90, -30], [44, 180, 44]);
const unreachableGraph = buildWorldPhysicsTraversalGraph(buildWorldPhysicsSurfaceRegistry([unreachableTower]));
assert.deepEqual(unreachableGraph.unreachableSurfaceIds, ['unreachable-tower-a:top']);
assert.equal(unreachableGraph.summary.reachableSurfaces, 0);
const unreachableTowerAudit = buildWorldPhysicsAccessAudit({
  registry: buildWorldPhysicsSurfaceRegistry([unreachableTower]),
  traversalGraph: unreachableGraph,
});
assert.deepEqual(unreachableTowerAudit.summary, {
  highPriority: 1,
  ladder: 0,
  lift: 1,
  mediumPriority: 0,
  ramp: 0,
  recommendationCount: 1,
  unreachableSurfaceCount: 1,
});
assert.equal(unreachableTowerAudit.recommendations[0]?.ownerId, 'unreachable-tower-a');
assert.equal(unreachableTowerAudit.recommendations[0]?.accessKind, 'lift');
assert.equal(unreachableTowerAudit.recommendations[0]?.priority, 'high');
const unreachableTowerAccessNodes = buildWorldPhysicsVerticalAccessNodes(unreachableTowerAudit);
assert.deepEqual(unreachableTowerAccessNodes.map((node) => node.id), [
  'physics-access-unreachable-tower-a-up',
  'physics-access-unreachable-tower-a-down',
]);
assert.equal(unreachableTowerAccessNodes[0]?.autoActivate, false);
assert.equal(unreachableTowerAccessNodes[0]?.mode, 'lift');
assert.equal(unreachableTowerAccessNodes[0]?.level, 'ground');
assert.equal(unreachableTowerAccessNodes[0]?.targetLevel, 'tower');
assert.deepEqual(unreachableTowerAccessNodes[0]?.targetPosition, [260, 184, -30]);
assert.equal(unreachableTowerAccessNodes[1]?.level, 'tower');
assert.deepEqual(unreachableTowerAccessNodes[1]?.targetPosition, [289.5, 5, -30]);

const unreachableDeck = entry('unreachable-deck-a', 'city-mass', [340, 60, -30], [72, 120, 72]);
const unreachableDeckRegistry = buildWorldPhysicsSurfaceRegistry([unreachableDeck]);
const unreachableDeckAudit = buildWorldPhysicsAccessAudit({
  registry: unreachableDeckRegistry,
  traversalGraph: buildWorldPhysicsTraversalGraph(unreachableDeckRegistry),
});
assert.equal(unreachableDeckAudit.recommendations[0]?.accessKind, 'ramp');
assert.equal(unreachableDeckAudit.recommendations[0]?.priority, 'medium');
assert.deepEqual(unreachableDeckAudit.recommendations[0]?.targetPosition, [340, 124, -30]);
assert.equal(buildWorldPhysicsVerticalAccessNodes(unreachableDeckAudit)[0]?.mode, 'ramp');

const productionSafeWorld = buildExpoWorldContract({
  companies: PRODUCTION_SAFE_COMPANIES,
  sectors: PRODUCTION_SAFE_SECTORS,
});
const productionSafePlan = buildCanonicalWorldPlanFromWorldContract(productionSafeWorld);
const productionSafeRearCampusPlan = productionSafePlan.zones.find((zone) => zone.id === 'rear-campus');
const productionSafeRearCampus = productionSafeRearCampusPlan?.zoneExtension?.rearCampus;
assert.ok(productionSafeRearCampusPlan);
assert.ok(productionSafeRearCampus);

const productionPhysics = buildWorldPhysicsSurfaceRegistry([
  ...buildCityWorldObjectRegistry({
    districtCount: productionSafeWorld.districtPrograms.length,
    districtStride: productionSafePlan.districtStride,
    plan: productionSafePlan,
  }),
  ...buildStadiumWorldObjectRegistry({
    campusCenterZ: productionSafeRearCampus.campusCenterZ,
    rearCampusPlan: buildRenderedRearCampusRegistryPlan(productionSafeRearCampusPlan),
  }),
  ...buildBoothWorldObjectRegistry(productionSafeWorld.boothPlacements),
]);
const productionSolidIds = new Set(productionPhysics.solids.map((solid) => solid.id));
const productionTraversalGraph = buildWorldPhysicsTraversalGraph(productionPhysics);
const productionAccessAudit = buildWorldPhysicsAccessAudit({
  registry: productionPhysics,
  traversalGraph: productionTraversalGraph,
});
const productionAccessNodes = buildWorldPhysicsVerticalAccessNodes(productionAccessAudit);
assert.ok(productionPhysics.solids.length >= 100, 'production-safe physics should expose broad solid coverage');
assert.ok(productionPhysics.walkableSurfaces.length >= 40, 'production-safe physics should expose broad walkable top coverage');
assert.ok(productionPhysics.walkableSurfaces.every((surface) => productionSolidIds.has(surface.ownerId)));
assert.equal(productionPhysics.walkableSurfaces.some((surface) => surface.ownerId.includes('perimeter')), false);
assert.equal(productionPhysics.walkableSurfaces.some((surface) => surface.sourceKind === 'city-screen-host-mass'), false);
assert.equal(productionPhysics.walkableSurfaces.some((surface) => surface.sourceKind === 'rear-campus-screen-host-shell'), false);
assert.equal(productionPhysics.walkableSurfaces.some((surface) => surface.sourceKind === 'tower-cluster-plinth-mass'), false);
assert.equal(productionPhysics.walkableSurfaces.some((surface) => surface.ownerId.includes('tower-cluster-vertical-pilot-core-')), false);
assert.equal(productionTraversalGraph.summary.surfaceCount, productionPhysics.walkableSurfaces.length);
assert.ok(productionTraversalGraph.summary.reachableSurfaces > 0);
assert.ok(productionTraversalGraph.summary.unreachableSurfaces >= 0);
assert.equal(productionAccessAudit.summary.unreachableSurfaceCount, productionTraversalGraph.summary.unreachableSurfaces);
assert.equal(productionAccessAudit.summary.recommendationCount, productionTraversalGraph.summary.unreachableSurfaces);
assert.equal(productionAccessAudit.recommendations.some((recommendation) => recommendation.sourceKind === 'city-screen-host-mass'), false);
assert.equal(
  productionAccessNodes.length,
  Math.min(productionAccessAudit.summary.recommendationCount, WORLD_PHYSICS_ACCESS_RECOMMENDATION_LIMIT) * 2,
);
assert.equal(productionAccessNodes.every((node) => node.autoActivate === false), true);
