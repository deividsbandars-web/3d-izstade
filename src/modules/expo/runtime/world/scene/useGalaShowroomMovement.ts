import { useCallback, useRef } from 'react';
import * as THREE from 'three';
import { GALA_PREVIEW_POSITION, GALA_PREVIEW_SCALE } from '../../modularHome/GalaHouseDimensions';
import {
  GALA_GEOMETRY_LEVELS,
  GALA_GEOMETRY_SANITY,
  GALA_CLOSED_DOOR_COLLISION_SEGMENTS,
  GALA_DOOR_INTERACTION_ZONES,
  GALA_FLOORPLAN,
  GALA_WALK_PHYSICS,
  GALA_WALL_COLLISION_SEGMENTS,
  rectToLocalRect,
  type Rect,
  type WallSegment,
} from '../../modularHome/GalaFloorplan';
import type { GalaDoorId, GalaDoorState, GalaDoorStateMap } from '../../modularHome/GalaDoorState';
import { MODULAR_HOME_PREVIEW_CONFIG } from '../../modularHome/modularHomeConfig';

const PLAYER_KEYBOARD_TURN_SPEED = 2.25;
const PLAYER_LOOK_PITCH_LIMIT = 1.32;
const PLAYER_MOBILE_LOOK_PITCH_SPEED = 2.45;
const PLAYER_MOBILE_LOOK_TURN_SPEED = 3.35;
export const GALA_SHOWROOM_EYE_HEIGHT_Y = GALA_PREVIEW_POSITION.y + (GALA_GEOMETRY_LEVELS.eyeHeight * GALA_PREVIEW_SCALE);
const GALA_SHOWROOM_PLAYER_RADIUS = GALA_WALK_PHYSICS.playerRadiusM * GALA_PREVIEW_SCALE;
const GALA_SHOWROOM_WALK_SPEED = GALA_WALK_PHYSICS.walkSpeedMps * GALA_PREVIEW_SCALE;
const GALA_SHOWROOM_SPRINT_MULTIPLIER = GALA_WALK_PHYSICS.sprintSpeedMps / GALA_WALK_PHYSICS.walkSpeedMps;
const GALA_SHOWROOM_MAX_FRAME_STEP = GALA_WALK_PHYSICS.maxFrameStepMeters * GALA_PREVIEW_SCALE;
const GALA_SHOWROOM_MOVE_REPORT_INTERVAL_MS = 5000;

type MutableRef<T> = { current: T };

export type GalaDoorPromptState = {
  doorId: GalaDoorId;
  label: string;
  state: GalaDoorState;
};

type WalkMoveState = {
  b: boolean;
  f: boolean;
  l: boolean;
  r: boolean;
  s: boolean;
  turnL: boolean;
  turnR: boolean;
};

type MobileMoveIntent = {
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

type GalaWallCollisionHit = {
  penetrationXZ: number;
  segmentId: string;
};

export type UseGalaShowroomMovementOptions = {
  activeViewElevationYRef: MutableRef<number>;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  camera: THREE.Camera;
  desiredMoveVectorRef: MutableRef<THREE.Vector3>;
  galaCollisionSegmentsRef: MutableRef<readonly WallSegment[]>;
  galaDoorStatesRef: MutableRef<GalaDoorStateMap>;
  lastMoveTimeRef: MutableRef<number>;
  lastReportedPositionRef: MutableRef<[number, number, number]>;
  moveVelocityRef: MutableRef<THREE.Vector3>;
  nearbyDoorPromptRef: MutableRef<GalaDoorPromptState | null>;
  onMove: (pos: number[]) => void;
  pendingJumpRequestRef: MutableRef<boolean>;
  pendingLiftRequestRef: MutableRef<unknown | null>;
  setNearbyDoorPrompt: (prompt: GalaDoorPromptState | null) => void;
  verticalAirborneRef: MutableRef<boolean>;
  verticalLevelYRef: MutableRef<number>;
  verticalVelocityYRef: MutableRef<number>;
};

export type GalaShowroomMovementFrame = {
  delta: number;
  isOperatorReviewFrame: boolean;
  mobileMoveIntent?: MobileMoveIntent;
  mov: WalkMoveState;
  operatorTeleportSettling: boolean;
};

export function galaWorldPointToPlan(position: THREE.Vector3) {
  const cos = Math.cos(MODULAR_HOME_PREVIEW_CONFIG.rotationY);
  const sin = Math.sin(MODULAR_HOME_PREVIEW_CONFIG.rotationY);
  const unrotatedX = (position.x * cos) - (position.z * sin);
  const unrotatedZ = (position.x * sin) + (position.z * cos);

  return {
    x: ((unrotatedX - GALA_PREVIEW_POSITION.x) / GALA_PREVIEW_SCALE) + (GALA_FLOORPLAN.length * 0.5),
    z: (unrotatedZ - GALA_PREVIEW_POSITION.z) / GALA_PREVIEW_SCALE,
  };
}

function rotateGalaWorldPoint(unrotatedX: number, unrotatedZ: number) {
  const cos = Math.cos(MODULAR_HOME_PREVIEW_CONFIG.rotationY);
  const sin = Math.sin(MODULAR_HOME_PREVIEW_CONFIG.rotationY);

  return {
    x: (unrotatedX * cos) + (unrotatedZ * sin),
    z: (-unrotatedX * sin) + (unrotatedZ * cos),
  };
}

function galaPlanRectToWorldBounds(rect: Rect) {
  const localRect = rectToLocalRect(rect);
  const corners = [
    rotateGalaWorldPoint(
      GALA_PREVIEW_POSITION.x + (localRect.xMin * GALA_PREVIEW_SCALE),
      GALA_PREVIEW_POSITION.z + (localRect.zMin * GALA_PREVIEW_SCALE),
    ),
    rotateGalaWorldPoint(
      GALA_PREVIEW_POSITION.x + (localRect.xMin * GALA_PREVIEW_SCALE),
      GALA_PREVIEW_POSITION.z + (localRect.zMax * GALA_PREVIEW_SCALE),
    ),
    rotateGalaWorldPoint(
      GALA_PREVIEW_POSITION.x + (localRect.xMax * GALA_PREVIEW_SCALE),
      GALA_PREVIEW_POSITION.z + (localRect.zMin * GALA_PREVIEW_SCALE),
    ),
    rotateGalaWorldPoint(
      GALA_PREVIEW_POSITION.x + (localRect.xMax * GALA_PREVIEW_SCALE),
      GALA_PREVIEW_POSITION.z + (localRect.zMax * GALA_PREVIEW_SCALE),
    ),
  ];

  return {
    maxX: Math.max(...corners.map((corner) => corner.x)),
    maxZ: Math.max(...corners.map((corner) => corner.z)),
    minX: Math.min(...corners.map((corner) => corner.x)),
    minZ: Math.min(...corners.map((corner) => corner.z)),
  };
}

const GALA_BASE_WALL_COLLISION_WORLD_SEGMENTS = GALA_WALL_COLLISION_SEGMENTS.map((segment) => ({
  ...galaPlanRectToWorldBounds(segment),
  id: segment.id,
}));

export function buildGalaCollisionSegments(doorStates: GalaDoorStateMap): readonly WallSegment[] {
  return [
    ...GALA_WALL_COLLISION_SEGMENTS,
    ...GALA_CLOSED_DOOR_COLLISION_SEGMENTS.filter((segment) => doorStates[segment.doorId] === 'closed'),
  ];
}

function findGalaWallCollision(
  playerPosition: THREE.Vector3,
  radius: number,
  collisionSegments: readonly WallSegment[],
): GalaWallCollisionHit | null {
  const radiusMeters = radius / GALA_PREVIEW_SCALE;
  const planPosition = galaWorldPointToPlan(playerPosition);
  let bestHit: GalaWallCollisionHit | null = null;

  for (const segment of collisionSegments) {
    const overlapX = Math.min(
      planPosition.x - (segment.xMin - radiusMeters),
      (segment.xMax + radiusMeters) - planPosition.x,
    );
    const overlapZ = Math.min(
      planPosition.z - (segment.zMin - radiusMeters),
      (segment.zMax + radiusMeters) - planPosition.z,
    );

    if (overlapX <= 0 || overlapZ <= 0) {
      continue;
    }

    const hit = {
      penetrationXZ: Math.min(overlapX, overlapZ),
      segmentId: segment.id,
    };
    if (!bestHit || hit.penetrationXZ > bestHit.penetrationXZ) {
      bestHit = hit;
    }
  }

  return bestHit;
}

export function findNearbyGalaDoor(playerPosition: THREE.Vector3) {
  const planPosition = galaWorldPointToPlan(playerPosition);
  return GALA_DOOR_INTERACTION_ZONES.find((zone) => (
    planPosition.x >= zone.xMin
    && planPosition.x <= zone.xMax
    && planPosition.z >= zone.zMin
    && planPosition.z <= zone.zMax
  )) ?? null;
}

function updateGalaShowroomRuntimeDebug(state: Record<string, unknown>) {
  if (typeof window === 'undefined') {
    return;
  }

  (window as unknown as {
    __WARPALA_GALA_GEOMETRY_SANITY__?: Record<string, unknown>;
  }).__WARPALA_GALA_GEOMETRY_SANITY__ = {
    ...GALA_GEOMETRY_SANITY,
    ...state,
  };
}

export function useGalaShowroomMovement({
  activeViewElevationYRef,
  bounds,
  camera,
  desiredMoveVectorRef,
  galaCollisionSegmentsRef,
  galaDoorStatesRef,
  lastMoveTimeRef,
  lastReportedPositionRef,
  moveVelocityRef,
  nearbyDoorPromptRef,
  onMove,
  pendingJumpRequestRef,
  pendingLiftRequestRef,
  setNearbyDoorPrompt,
  verticalAirborneRef,
  verticalLevelYRef,
  verticalVelocityYRef,
}: UseGalaShowroomMovementOptions) {
  const cameraViewEuler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const galaMoveDir = useRef(new THREE.Vector3());
  const galaNextPosition = useRef(new THREE.Vector3());
  const galaSlideX = useRef(new THREE.Vector3());
  const galaSlideZ = useRef(new THREE.Vector3());
  const lastGalaRuntimeDebugUpdate = useRef(0);

  const updateGalaRuntimeDebug = useCallback((collisionSegments: readonly WallSegment[]) => {
    if ((Date.now() - lastGalaRuntimeDebugUpdate.current) <= 250) {
      return;
    }

    lastGalaRuntimeDebugUpdate.current = Date.now();
    const currentGalaCollision = findGalaWallCollision(camera.position, GALA_SHOWROOM_PLAYER_RADIUS, collisionSegments);
    updateGalaShowroomRuntimeDebug({
      cameraEyeHeightMeters: GALA_GEOMETRY_LEVELS.eyeHeight,
      cameraEyeHeightWorldY: GALA_SHOWROOM_EYE_HEIGHT_Y,
      currentCollisionSegmentId: currentGalaCollision?.segmentId ?? null,
      currentPlanPosition: galaWorldPointToPlan(camera.position),
      doorStates: galaDoorStatesRef.current,
      configuredMaxFrameStepMeters: GALA_WALK_PHYSICS.maxFrameStepMeters,
      configuredWalkSpeedMps: GALA_WALK_PHYSICS.walkSpeedMps,
      measuredCameraWorldY: camera.position.y,
      nearbyDoor: nearbyDoorPromptRef.current,
      playerRadiusMeters: GALA_WALK_PHYSICS.playerRadiusM,
      previewScale: GALA_PREVIEW_SCALE,
      realUserModeUsesGalaPhysics: true,
      runtimeClaimPolicy: 'diagnostics-only; pass/fail comes from scripts/qa-gala-real-user-walk-physics.mjs',
      useGalaShowroomPhysics: true,
      wallCollisionSegmentCount: collisionSegments.length,
      baseWallCollisionSegmentCount: GALA_BASE_WALL_COLLISION_WORLD_SEGMENTS.length,
    });
  }, [camera, galaDoorStatesRef, nearbyDoorPromptRef]);

  return useCallback(({
    delta,
    isOperatorReviewFrame,
    mobileMoveIntent,
    mov,
    operatorTeleportSettling,
  }: GalaShowroomMovementFrame) => {
    const hasActiveGalaMoveInput = (
      mov.f || mov.b || mov.l || mov.r || mov.s || mov.turnL || mov.turnR
      || Boolean(mobileMoveIntent?.f)
      || Boolean(mobileMoveIntent?.b)
      || Boolean(mobileMoveIntent?.l)
      || Boolean(mobileMoveIntent?.r)
      || Boolean(mobileMoveIntent?.s)
      || Boolean(mobileMoveIntent?.turnL)
      || Boolean(mobileMoveIntent?.turnR)
      || Math.abs(Number(mobileMoveIntent?.lookX ?? 0)) > 0.05
      || Math.abs(Number(mobileMoveIntent?.lookY ?? 0)) > 0.05
    );
    const galaCollisionSegments = galaCollisionSegmentsRef.current;
    activeViewElevationYRef.current = GALA_SHOWROOM_EYE_HEIGHT_Y;
    verticalLevelYRef.current = GALA_SHOWROOM_EYE_HEIGHT_Y;
    verticalVelocityYRef.current = 0;
    verticalAirborneRef.current = false;
    pendingJumpRequestRef.current = false;
    pendingLiftRequestRef.current = null;

    if (!hasActiveGalaMoveInput) {
      const nearbyDoor = findNearbyGalaDoor(camera.position);
      const nextPrompt = nearbyDoor
        ? {
          doorId: nearbyDoor.doorId,
          label: nearbyDoor.label,
          state: galaDoorStatesRef.current[nearbyDoor.doorId],
        }
        : null;
      const currentPrompt = nearbyDoorPromptRef.current;
      if (
        currentPrompt?.doorId !== nextPrompt?.doorId
        || currentPrompt?.state !== nextPrompt?.state
      ) {
        nearbyDoorPromptRef.current = nextPrompt;
        setNearbyDoorPrompt(nextPrompt);
      }
    }

    const stableDelta = Math.min(delta, 1 / 90);
    const galaMovementDelta = Math.min(delta, 1 / 30);
    const mobileTurnL = Boolean(mobileMoveIntent?.turnL);
    const mobileTurnR = Boolean(mobileMoveIntent?.turnR);
    const mobileLookX = Math.max(-1, Math.min(1, Number(mobileMoveIntent?.lookX ?? 0)));
    const mobileLookY = Math.max(-1, Math.min(1, Number(mobileMoveIntent?.lookY ?? 0)));
    const keyboardTurnDirection = (mov.turnR ? 1 : 0) - (mov.turnL ? 1 : 0);
    const mobileTurnDirection = Math.abs(mobileLookX) > 0.05
      ? mobileLookX
      : ((mobileTurnR ? 1 : 0) - (mobileTurnL ? 1 : 0));
    const hasMobilePitchIntent = Math.abs(mobileLookY) > 0.05;
    const sprintMultiplier = mov.s || mobileMoveIntent?.s ? GALA_SHOWROOM_SPRINT_MULTIPLIER : 1;
    const speed = GALA_SHOWROOM_WALK_SPEED * sprintMultiplier * galaMovementDelta;

    if (keyboardTurnDirection !== 0 || mobileTurnDirection !== 0 || hasMobilePitchIntent) {
      const viewEuler = cameraViewEuler.current.setFromQuaternion(camera.quaternion, 'YXZ');
      viewEuler.y -= (keyboardTurnDirection * PLAYER_KEYBOARD_TURN_SPEED * stableDelta)
        + (mobileTurnDirection * PLAYER_MOBILE_LOOK_TURN_SPEED * stableDelta);
      viewEuler.x = Math.max(
        -PLAYER_LOOK_PITCH_LIMIT,
        Math.min(PLAYER_LOOK_PITCH_LIMIT, viewEuler.x + (mobileLookY * PLAYER_MOBILE_LOOK_PITCH_SPEED * stableDelta)),
      );
      viewEuler.z = 0;
      camera.quaternion.setFromEuler(viewEuler);
      camera.updateMatrixWorld();
    }

    desiredMoveVectorRef.current.set(0, 0, 0);
    if (mov.f || mobileMoveIntent?.f) desiredMoveVectorRef.current.z -= speed;
    if (mov.b || mobileMoveIntent?.b) desiredMoveVectorRef.current.z += speed;
    if (mov.l || mobileMoveIntent?.l) desiredMoveVectorRef.current.x -= speed;
    if (mov.r || mobileMoveIntent?.r) desiredMoveVectorRef.current.x += speed;
    if (desiredMoveVectorRef.current.length() > GALA_SHOWROOM_MAX_FRAME_STEP) {
      desiredMoveVectorRef.current.setLength(GALA_SHOWROOM_MAX_FRAME_STEP);
    }

    moveVelocityRef.current.copy(desiredMoveVectorRef.current);
    if (desiredMoveVectorRef.current.lengthSq() <= 0.00001 && moveVelocityRef.current.lengthSq() < 0.00002) {
      moveVelocityRef.current.set(0, 0, 0);
    }

    const moved = moveVelocityRef.current.lengthSq() > 0.00001;
    if (moved) {
      const moveDir = galaMoveDir.current.copy(moveVelocityRef.current).applyQuaternion(camera.quaternion);
      moveDir.y = 0;
      if (moveDir.length() > GALA_SHOWROOM_MAX_FRAME_STEP) {
        moveDir.setLength(GALA_SHOWROOM_MAX_FRAME_STEP);
      }

      const nextMovePosition = galaNextPosition.current.copy(camera.position).add(moveDir);
      const wallHit = findGalaWallCollision(nextMovePosition, GALA_SHOWROOM_PLAYER_RADIUS, galaCollisionSegments);
      if (!wallHit) {
        camera.position.add(moveDir);
      } else {
        const slideX = galaSlideX.current.set(moveDir.x * 0.88, 0, 0);
        const slideZ = galaSlideZ.current.set(0, 0, moveDir.z * 0.88);
        const trySlide = (candidate: THREE.Vector3) => {
          if (candidate.lengthSq() <= 0) {
            return false;
          }

          const nextCandidate = galaNextPosition.current.copy(camera.position).add(candidate);
          if (findGalaWallCollision(nextCandidate, GALA_SHOWROOM_PLAYER_RADIUS, galaCollisionSegments)) {
            return false;
          }

          camera.position.copy(nextCandidate);
          return true;
        };

        if (Math.abs(moveDir.x) >= Math.abs(moveDir.z)) {
          if (!trySlide(slideX)) {
            trySlide(slideZ);
          }
        } else if (!trySlide(slideZ)) {
          trySlide(slideX);
        }
      }
    }

    camera.position.setY(GALA_SHOWROOM_EYE_HEIGHT_Y);
    updateGalaRuntimeDebug(galaCollisionSegments);

    if (!isOperatorReviewFrame && !operatorTeleportSettling) {
      camera.position.setX(Math.min(bounds.maxX, Math.max(bounds.minX, camera.position.x)));
      camera.position.setZ(Math.min(bounds.maxZ, Math.max(bounds.minZ, camera.position.z)));
    }

    if (moved) {
      const now = Date.now();
      if (lastMoveTimeRef.current <= 0) {
        lastMoveTimeRef.current = now;
      }
      const dx = camera.position.x - lastReportedPositionRef.current[0];
      const dz = camera.position.z - lastReportedPositionRef.current[2];
      const distanceSq = (dx * dx) + (dz * dz);

      if (now - lastMoveTimeRef.current > GALA_SHOWROOM_MOVE_REPORT_INTERVAL_MS || distanceSq > 28 * 28) {
        lastMoveTimeRef.current = now;
        lastReportedPositionRef.current = [camera.position.x, camera.position.y, camera.position.z];
        onMove(lastReportedPositionRef.current);
      }
    }
  }, [
    activeViewElevationYRef,
    bounds,
    camera,
    desiredMoveVectorRef,
    galaCollisionSegmentsRef,
    galaDoorStatesRef,
    lastMoveTimeRef,
    lastReportedPositionRef,
    moveVelocityRef,
    nearbyDoorPromptRef,
    onMove,
    pendingJumpRequestRef,
    pendingLiftRequestRef,
    setNearbyDoorPrompt,
    updateGalaRuntimeDebug,
    verticalAirborneRef,
    verticalLevelYRef,
    verticalVelocityYRef,
  ]);
}
