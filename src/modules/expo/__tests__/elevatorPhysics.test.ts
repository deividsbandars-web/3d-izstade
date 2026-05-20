import assert from 'node:assert/strict';
import { EXPO_VERTICAL_CITY_SYSTEM } from '../runtime/planning/vertical/verticalCitySystem.js';
import {
  buildRideableElevatorPhysicsFrame,
  buildRideableElevatorRuntimeRoutes,
  findAttachedRideableElevator,
  findCurrentRideableElevator,
  resolveRideableElevatorPhysicalLayout,
} from '../runtime/world/physics/elevatorPhysics.js';
import { resolveElevatorRoutePosition } from '../runtime/planning/vertical/elevatorRouteMotion.js';
import {
  findBlockingWorldPhysicsSolid,
  findCurrentWorldPhysicsSolidTopY,
} from '../runtime/world/physics/worldPhysicsSurfaceRegistry.js';

const runtimeRoutes = buildRideableElevatorRuntimeRoutes(EXPO_VERTICAL_CITY_SYSTEM.elevatorRoutes);
assert.equal(runtimeRoutes.length, 3);

const physicsAtStart = buildRideableElevatorPhysicsFrame(0, runtimeRoutes);
assert.equal(physicsAtStart.walkableSurfaces.length, 3);
assert.equal(physicsAtStart.solids.length, 9);

const assertVectorNear = (
  actual: readonly number[],
  expected: readonly number[],
  tolerance = 0.000001,
) => {
  assert.equal(actual.length, expected.length);
  for (let index = 0; index < actual.length; index += 1) {
    assert.ok(
      Math.abs((actual[index] ?? 0) - (expected[index] ?? 0)) <= tolerance,
      `expected ${JSON.stringify(actual)} to be within ${tolerance} of ${JSON.stringify(expected)}`,
    );
  }
};

const skyMarketRuntimeRoute = runtimeRoutes.find((runtimeRoute) => runtimeRoute.route.id === 'sky-market-spine-animated-market-lift');
assert.ok(skyMarketRuntimeRoute);
const skyMarketCabinAtStart = resolveElevatorRoutePosition({
  elapsedTime: 0,
  fallbackPosition: skyMarketRuntimeRoute.fallbackPosition,
  route: skyMarketRuntimeRoute.route,
  segments: skyMarketRuntimeRoute.segments,
  totalLength: skyMarketRuntimeRoute.totalLength,
});
const skyMarketLayout = resolveRideableElevatorPhysicalLayout(skyMarketRuntimeRoute.route);
const skyMarketFloor = physicsAtStart.solids.find((solid) => solid.id === 'sky-market-spine-animated-market-lift:dynamic-cabin-floor');
assert.ok(skyMarketFloor);
assert.equal(skyMarketFloor.walkableTop, true);
assertVectorNear(skyMarketFloor.position, [
  skyMarketCabinAtStart[0],
  skyMarketCabinAtStart[1] + skyMarketLayout.floorCenterOffsetY,
  skyMarketCabinAtStart[2],
]);
assert.deepEqual(skyMarketFloor.size, [98, 10, 78]);

const tvTowerFloor = physicsAtStart.solids.find((solid) => solid.id === 'tower-cluster-television-tower-animated-city-lift:dynamic-cabin-floor');
assert.ok(tvTowerFloor);
assert.equal(tvTowerFloor.walkableTop, true);
assert.deepEqual(tvTowerFloor.position, [360, -2, -820]);
assert.deepEqual(tvTowerFloor.size, [88, 10, 68]);

const tvTowerSurface = physicsAtStart.walkableSurfaces.find((surface) => surface.ownerId === tvTowerFloor.id);
assert.ok(tvTowerSurface);
assert.equal(tvTowerSurface.playerY, 7);
assert.equal(findCurrentWorldPhysicsSolidTopY({ x: 360, y: 7, z: -820 }, 7, physicsAtStart.solids), 7);
assert.equal(findBlockingWorldPhysicsSolid({ x: 360, y: 7, z: -820 }, physicsAtStart.solids, { radius: 1 }), null);
assert.equal(
  findBlockingWorldPhysicsSolid({ x: 407.5, y: 7, z: -820 }, physicsAtStart.solids, { radius: 1 })?.solid.id,
  'tower-cluster-television-tower-animated-city-lift:dynamic-cabin-side-wall-right',
);

const currentTvElevator = findCurrentRideableElevator({ x: 360, y: 7, z: -820 }, 7, 0, runtimeRoutes);
assert.equal(currentTvElevator?.route.id, 'tower-cluster-television-tower-animated-city-lift');
assert.equal(currentTvElevator?.playerY, 7);
assert.equal(findCurrentRideableElevator({ x: 460, y: 7, z: -820 }, 7, 0, runtimeRoutes), null);

const midRideElapsedSeconds = 17;
const detachedByFastCabinMotion = findCurrentRideableElevator({ x: 360, y: 7, z: -820 }, 7, midRideElapsedSeconds, runtimeRoutes);
assert.equal(detachedByFastCabinMotion, null);
const attachedMidRide = findAttachedRideableElevator(
  { x: 360, y: 7, z: -820 },
  midRideElapsedSeconds,
  runtimeRoutes,
  'tower-cluster-television-tower-animated-city-lift',
);
assert.equal(attachedMidRide?.route.id, 'tower-cluster-television-tower-animated-city-lift');
assert.ok((attachedMidRide?.playerY ?? 0) > 1000);
assert.equal(
  findAttachedRideableElevator(
    { x: 460, y: 7, z: -820 },
    midRideElapsedSeconds,
    runtimeRoutes,
    'tower-cluster-television-tower-animated-city-lift',
  ),
  null,
);
