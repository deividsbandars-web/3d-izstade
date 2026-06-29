import * as THREE from 'three';
import type { ExpoStartView } from '../../../world-contract';
import type { ExpoVerticalAccessNode, ExpoVerticalWalkableRegion } from '../../planning/types';
import {
  WORLD_PHYSICS_PLAYER_SURFACE_OFFSET,
  findBlockingWorldPhysicsSolid,
  findWorldPhysicsTraversalSurface,
  type WorldPhysicsSolid,
  type WorldPhysicsWalkableSurface,
} from '../physics/worldPhysicsSurfaceRegistry';
import { GALA_SHOWROOM_EYE_HEIGHT_Y } from './useGalaShowroomMovement';

export const PLAYER_RADIUS = 0.92;
export const PLAYER_WALK_SPEED = 108;
export const PLAYER_SPRINT_MULTIPLIER = 1.8;
export const PLAYER_HUMAN_EYE_HEIGHT_Y = 1.72;
export const PLAYER_LEGACY_LOW_START_Y = 5;
export const PLAYER_SPAWN_MIN_CLEARANCE_Y = 1.45;
export const PLAYER_KEYBOARD_TURN_SPEED = 2.25;
export const PLAYER_LOOK_PITCH_LIMIT = 1.32;
export const PLAYER_MOBILE_LOOK_PITCH_SPEED = 2.45;
export const PLAYER_MOBILE_LOOK_TURN_SPEED = 3.35;
export const OPERATOR_TELEPORT_SETTLE_MS = 1200;
export const VERTICAL_LIFT_COOLDOWN_MS = 1400;
export const VERTICAL_GRAVITY = 340;
export const VERTICAL_JUMP_SPEED = 220;
export const VERTICAL_LANDING_EPSILON = 0.45;
export const VERTICAL_SOLID_TOP_Y_TOLERANCE = 1.25;
export const VERTICAL_WALKABLE_EDGE_SLACK = 6;
export const VERTICAL_WALKABLE_Y_TOLERANCE = 10;
export const VERTICAL_STEP_UP_MAX_DELTA = 24;
export const VERTICAL_MANTLE_MAX_DELTA = 112;
export const VERTICAL_MANTLE_FORWARD_REACH = 26;

export const LIFT_TRIGGER_KEYS = new Set(['KeyF']);
export const WALK_CONTROL_KEYS = new Set([
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'KeyA',
  'KeyD',
  'KeyE',
  'KeyQ',
  'KeyS',
  'KeyF',
  'Space',
  'KeyW',
  'ShiftLeft',
  'ShiftRight',
]);

export const EMPTY_RIDEABLE_ELEVATOR_PHYSICS_FRAME = {
  solids: [] as WorldPhysicsSolid[],
  walkableSurfaces: [] as WorldPhysicsWalkableSurface[],
};

export type ExpoWorldMobileMoveIntent = {
  b: boolean;
  f: boolean;
  jump?: boolean;
  l: boolean;
  lift?: boolean;
  lookX?: number;
  lookY?: number;
  r: boolean;
  s?: boolean;
  turnL?: boolean;
  turnR?: boolean;
};

export type ExpoWorldPlayerBounds = {
  maxX: number;
  maxZ: number;
  minX: number;
  minZ: number;
};

export type OperatorTeleportDetail = { startView?: ExpoStartView; zoneId?: string };
export type VerticalLiftRequest = { nodeId?: string | null; requireNearby: boolean };
export type VerticalLiftRequestDetail = { nodeId?: string | null };
export type WalkMoveState = { b: boolean; f: boolean; l: boolean; r: boolean; s: boolean; turnL: boolean; turnR: boolean };

export const EMPTY_WALK_MOVE_STATE: WalkMoveState = {
  b: false,
  f: false,
  l: false,
  r: false,
  s: false,
  turnL: false,
  turnR: false,
};

export function resolveInitialWalkElevation(startY: number, useGalaShowroomPhysics = false): number {
  if (useGalaShowroomPhysics) {
    return GALA_SHOWROOM_EYE_HEIGHT_Y;
  }
  if (startY > 12) {
    return startY;
  }
  return Math.max(PLAYER_HUMAN_EYE_HEIGHT_Y, Math.min(PLAYER_LEGACY_LOW_START_Y, startY));
}

export function findNearbyVerticalAccessNode(playerPosition: THREE.Vector3, nodes: ExpoVerticalAccessNode[]) {
  return nodes.find((node) => {
    const activationRadius = Math.max(6, (node as ExpoVerticalAccessNode & { activationRadius?: number }).activationRadius ?? 24);
    const dx = playerPosition.x - node.position[0];
    const dz = playerPosition.z - node.position[2];
    const distanceXZ = Math.hypot(dx, dz);
    const nodePlayerY = Math.max(5, node.position[1]);
    const distanceY = Math.abs(playerPosition.y - nodePlayerY);

    return distanceXZ <= activationRadius && distanceY <= 28;
  }) ?? null;
}

export function findMantleTraversalSurface(
  camera: THREE.Camera,
  solids: ReadonlyArray<WorldPhysicsSolid>,
  surfaces: ReadonlyArray<WorldPhysicsWalkableSurface>,
  playerY: number,
  forward: THREE.Vector3,
) {
  forward.set(0, 0, -1).applyQuaternion(camera.quaternion).setY(0);
  if (forward.lengthSq() <= 0.0001) {
    return null;
  }
  forward.normalize();
  const playerPosition = {
    x: camera.position.x,
    y: playerY,
    z: camera.position.z,
  };
  const desiredPosition = {
    x: camera.position.x + (forward.x * VERTICAL_MANTLE_FORWARD_REACH),
    y: playerY,
    z: camera.position.z + (forward.z * VERTICAL_MANTLE_FORWARD_REACH),
  };
  const blockingHit = findBlockingWorldPhysicsSolid(desiredPosition, solids, {
    playerSurfaceOffset: WORLD_PHYSICS_PLAYER_SURFACE_OFFSET,
    radius: PLAYER_RADIUS,
  });

  if (!blockingHit) {
    return null;
  }

  return findWorldPhysicsTraversalSurface({
    blockingSolidId: blockingHit.solid.id,
    desiredPosition,
    edgeSlack: PLAYER_RADIUS + 4,
    maxElevationDelta: VERTICAL_MANTLE_MAX_DELTA,
    playerPosition,
    surfaces,
  });
}

export function isPositionOnVerticalWalkableRegion(playerPosition: THREE.Vector3, playerY: number, regions: ExpoVerticalWalkableRegion[]) {
  return regions.some((region) => {
    if (Math.abs(playerY - region.playerY) > VERTICAL_WALKABLE_Y_TOLERANCE) {
      return false;
    }

    const halfWidth = (region.size[0] * 0.5) + VERTICAL_WALKABLE_EDGE_SLACK;
    const halfDepth = ((region.size as unknown as [number, number, number])[2] * 0.5) + VERTICAL_WALKABLE_EDGE_SLACK;

    return (
      Math.abs(playerPosition.x - region.position[0]) <= halfWidth
      && Math.abs(playerPosition.z - region.position[2]) <= halfDepth
    );
  });
}

export function isVerticalSystemPlayerY(playerY: number, regions: ExpoVerticalWalkableRegion[]) {
  return regions.some((region) => Math.abs(playerY - region.playerY) <= VERTICAL_WALKABLE_Y_TOLERANCE);
}

export function findCurrentVerticalRegionY(playerPosition: THREE.Vector3, playerY: number, regions: ExpoVerticalWalkableRegion[]) {
  const region = regions.find((candidate) =>
    Math.abs(playerY - candidate.playerY) <= VERTICAL_WALKABLE_Y_TOLERANCE
    && isPointInsideVerticalWalkableRegion(playerPosition, candidate)
  );
  return region?.playerY ?? null;
}

export function findVerticalLandingY(playerPosition: THREE.Vector3, fromY: number, toY: number, regions: ExpoVerticalWalkableRegion[]) {
  const lowerY = Math.min(fromY, toY);
  const upperY = Math.max(fromY, toY);
  const lowerWalkableRegions = regions
    .filter((region) =>
      region.playerY <= upperY + VERTICAL_LANDING_EPSILON
      && region.playerY >= lowerY - VERTICAL_LANDING_EPSILON
      && isPointInsideVerticalWalkableRegion(playerPosition, region)
    )
    .sort((left, right) => right.playerY - left.playerY);
  return lowerWalkableRegions[0]?.playerY ?? 5;
}

export function updateVerticalRuntimeDebug(state: { canUseVerticalPhysics: boolean; isGrounded: boolean; isOnVerticalWalkable: boolean; isVerticalSystemElevation: boolean; lastTraversalAction: string | null; operatorTeleportSettling: boolean; playerY: number; verticalAirborne: boolean; verticalVelocityY: number }) {
  if (typeof window !== 'undefined') {
    (window as typeof window & { __WARPALA_VERTICAL_RUNTIME__?: typeof state }).__WARPALA_VERTICAL_RUNTIME__ = state;
  }
}

export function logExpoWorldDebug(enabled: boolean, ...args: unknown[]) {
  if (enabled) {
    console.info(...args);
  }
}

function isPointInsideVerticalWalkableRegion(playerPosition: THREE.Vector3, region: ExpoVerticalWalkableRegion) {
  const halfWidth = (region.size[0] * 0.5) + VERTICAL_WALKABLE_EDGE_SLACK;
  const halfDepth = ((region.size as unknown as [number, number, number])[2] * 0.5) + VERTICAL_WALKABLE_EDGE_SLACK;
  return (
    Math.abs(playerPosition.x - region.position[0]) <= halfWidth
    && Math.abs(playerPosition.z - region.position[2]) <= halfDepth
  );
}
