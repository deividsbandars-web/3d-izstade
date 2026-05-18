import assert from 'node:assert/strict';
import { EXPO_VERTICAL_CITY_SYSTEM } from '../runtime/planning/vertical/verticalCitySystem.js';
import {
  buildRideableElevatorPhysicsFrame,
  buildRideableElevatorRuntimeRoutes,
  findAttachedRideableElevator,
  findCurrentRideableElevator,
} from '../runtime/world/physics/elevatorPhysics.js';
import {
  findBlockingWorldPhysicsSolid,
  findCurrentWorldPhysicsSolidTopY,
} from '../runtime/world/physics/worldPhysicsSurfaceRegistry.js';

const runtimeRoutes = buildRideableElevatorRuntimeRoutes(EXPO_VERTICAL_CITY_SYSTEM.elevatorRoutes);
assert.equal(runtimeRoutes.length, 2);

const physicsAtStart = buildRideableElevatorPhysicsFrame(0, runtimeRoutes);
assert.equal(physicsAtStart.walkableSurfaces.length, 2);
assert.equal(physicsAtStart.solids.length, 6);

const tvTowerFloor = physicsAtStart.solids.find((solid) => solid.id === 'tower-cluster-television-tower-animated-city-lift:dynamic-cabin-floor');
assert.ok(tvTowerFloor);
assert.equal(tvTowerFloor.walkableTop, true);
assert.deepEqual(tvTowerFloor.position, [360, -2, -1012]);
assert.deepEqual(tvTowerFloor.size, [88, 10, 68]);

const tvTowerSurface = physicsAtStart.walkableSurfaces.find((surface) => surface.ownerId === tvTowerFloor.id);
assert.ok(tvTowerSurface);
assert.equal(tvTowerSurface.playerY, 7);
assert.equal(findCurrentWorldPhysicsSolidTopY({ x: 360, y: 7, z: -1012 }, 7, physicsAtStart.solids), 7);
assert.equal(findBlockingWorldPhysicsSolid({ x: 360, y: 7, z: -1012 }, physicsAtStart.solids, { radius: 1 }), null);
assert.equal(
  findBlockingWorldPhysicsSolid({ x: 407.5, y: 7, z: -1012 }, physicsAtStart.solids, { radius: 1 })?.solid.id,
  'tower-cluster-television-tower-animated-city-lift:dynamic-cabin-side-wall-right',
);

const currentTvElevator = findCurrentRideableElevator({ x: 360, y: 7, z: -1012 }, 7, 0, runtimeRoutes);
assert.equal(currentTvElevator?.route.id, 'tower-cluster-television-tower-animated-city-lift');
assert.equal(currentTvElevator?.playerY, 7);
assert.equal(findCurrentRideableElevator({ x: 460, y: 7, z: -1012 }, 7, 0, runtimeRoutes), null);

const midRideElapsedSeconds = 4.5;
const detachedByFastCabinMotion = findCurrentRideableElevator({ x: 360, y: 7, z: -1012 }, 7, midRideElapsedSeconds, runtimeRoutes);
assert.equal(detachedByFastCabinMotion, null);
const attachedMidRide = findAttachedRideableElevator(
  { x: 360, y: 7, z: -1012 },
  midRideElapsedSeconds,
  runtimeRoutes,
  'tower-cluster-television-tower-animated-city-lift',
);
assert.equal(attachedMidRide?.route.id, 'tower-cluster-television-tower-animated-city-lift');
assert.ok((attachedMidRide?.playerY ?? 0) > 1000);
assert.equal(
  findAttachedRideableElevator(
    { x: 460, y: 7, z: -1012 },
    midRideElapsedSeconds,
    runtimeRoutes,
    'tower-cluster-television-tower-animated-city-lift',
  ),
  null,
);
