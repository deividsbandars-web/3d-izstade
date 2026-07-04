/* eslint-disable react-hooks/immutability */
import type { MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { ExpoMode } from '../../../state/expoRuntime';
import type { ExpoVerticalAccessNode, ExpoVerticalWalkableRegion } from '../../planning/types';
import { isExpo3dQaEnabled } from '../../app/expo3dQa';
import { EXPO_START_VIEW_KEY, isCollisionMesh, queryNearbyPlayerCollisionTargets } from '../WorldSceneSupport';
import {
  WORLD_PHYSICS_DEFAULT_EDGE_SLACK,
  WORLD_PHYSICS_DEFAULT_Y_TOLERANCE,
  WORLD_PHYSICS_PLAYER_SURFACE_OFFSET,
  findBlockingWorldPhysicsSolid,
  findCurrentWorldPhysicsSolidTopY,
  findCurrentWorldPhysicsSurfaceY,
  findWorldPhysicsLandingSurface,
  findWorldPhysicsSolidTopLanding,
  findWorldPhysicsTraversalSurface,
  isWorldPhysicsPositionOnWalkableSurface,
  isWorldPhysicsSurfacePlayerY,
  type WorldPhysicsSolid,
  type WorldPhysicsTraversalSurfaceCandidate,
  type WorldPhysicsWalkableSurface,
} from '../physics/worldPhysicsSurfaceRegistry';
import {
  buildRideableElevatorPhysicsFrame,
  findAttachedRideableElevator,
  findCurrentRideableElevator,
  findRideableElevatorLandingY,
  type RideableElevatorHit,
  type RideableElevatorRuntimeRoute,
} from '../physics/elevatorPhysics';
import {
  EMPTY_RIDEABLE_ELEVATOR_PHYSICS_FRAME,
  PLAYER_KEYBOARD_TURN_SPEED,
  PLAYER_LOOK_PITCH_LIMIT,
  PLAYER_MOBILE_LOOK_PITCH_SPEED,
  PLAYER_MOBILE_LOOK_TURN_SPEED,
  PLAYER_RADIUS,
  PLAYER_SPRINT_MULTIPLIER,
  PLAYER_WALK_SPEED,
  VERTICAL_GRAVITY,
  VERTICAL_JUMP_SPEED,
  VERTICAL_LANDING_EPSILON,
  VERTICAL_SOLID_TOP_Y_TOLERANCE,
  VERTICAL_STEP_UP_MAX_DELTA,
  findCurrentVerticalRegionY,
  findMantleTraversalSurface,
  findNearbyVerticalAccessNode,
  findVerticalLandingY,
  isPositionOnVerticalWalkableRegion,
  isVerticalSystemPlayerY,
  logExpoWorldDebug,
  resolveInitialWalkElevation,
  updateVerticalRuntimeDebug,
} from './ExpoWorldPlayerFrameSupport';
import type { ExpoStartView } from '../../../world-contract';
import type {
  ExpoWorldMobileMoveIntent,
  ExpoWorldPlayerBounds,
  VerticalLiftRequest,
  WalkMoveState,
} from './ExpoWorldPlayerFrameSupport';

type GalaShowroomMovementRunner = (frame: {
  delta: number;
  isOperatorReviewFrame: boolean;
  mobileMoveIntent?: ExpoWorldMobileMoveIntent;
  mov: WalkMoveState;
  operatorTeleportSettling: boolean;
}) => void;

type ExpoWorldPlayerFrameLoopOptions = {
  activeRideableElevatorRouteId: MutableRefObject<string | null>;
  activeViewElevationY: MutableRefObject<number>;
  activateTraversalSurface: (candidate: WorldPhysicsTraversalSurfaceCandidate, reason: 'mantle' | 'step-up') => void;
  activateVerticalLift: (node: ExpoVerticalAccessNode, reason: 'auto' | 'manual' | 'operator-event') => void;
  basePhysicsSolids: WorldPhysicsSolid[];
  basePhysicsWalkableSurfaces: WorldPhysicsWalkableSurface[];
  bounds: ExpoWorldPlayerBounds;
  camera: THREE.Camera;
  cameraViewEuler: MutableRefObject<THREE.Euler>;
  debug: boolean;
  desiredMoveVector: MutableRefObject<THREE.Vector3>;
  effectiveVerticalAccessNodes: ExpoVerticalAccessNode[];
  effectiveVerticalWalkableRegions: ExpoVerticalWalkableRegion[];
  frameCollisionDirections: MutableRefObject<THREE.Vector3[]>;
  frameMantleForward: MutableRefObject<THREE.Vector3>;
  frameMoveDirection: MutableRefObject<THREE.Vector3>;
  frameNextMovePosition: MutableRefObject<THREE.Vector3>;
  frameRayOrigin: MutableRefObject<THREE.Vector3>;
  frameSlideCandidateOrigin: MutableRefObject<THREE.Vector3>;
  frameSlideCandidatePosition: MutableRefObject<THREE.Vector3>;
  frameSlideX: MutableRefObject<THREE.Vector3>;
  frameSlideZ: MutableRefObject<THREE.Vector3>;
  homeStudioEnabled: boolean;
  lastMobileJumpIntent: MutableRefObject<boolean>;
  lastMobileLiftIntent: MutableRefObject<boolean>;
  lastMoveTime: MutableRefObject<number>;
  lastReportedPosition: MutableRefObject<[number, number, number]>;
  lastTraversalAction: MutableRefObject<string | null>;
  liftCooldownUntil: MutableRefObject<number>;
  liftExitArmed: MutableRefObject<boolean>;
  mobileMoveIntent?: ExpoWorldMobileMoveIntent;
  mode: ExpoMode;
  movRef: MutableRefObject<WalkMoveState>;
  moveVelocity: MutableRefObject<THREE.Vector3>;
  nearbyDoorPromptRef: MutableRefObject<unknown>;
  onMove: (pos: number[]) => void;
  operatorTeleportUntil: MutableRefObject<number>;
  pendingJumpRequest: MutableRefObject<boolean>;
  pendingLiftRequest: MutableRefObject<VerticalLiftRequest | null>;
  preserveReviewElevation: boolean;
  raycaster: MutableRefObject<THREE.Raycaster>;
  rideableElevatorRoutes: RideableElevatorRuntimeRoute[];
  runGalaShowroomMovement: GalaShowroomMovementRunner;
  scene: THREE.Scene;
  setNearbyDoorPrompt: (prompt: null) => void;
  startFramingApplied: MutableRefObject<boolean>;
  verticalAirborne: MutableRefObject<boolean>;
  verticalLevelY: MutableRefObject<number>;
  verticalVelocityY: MutableRefObject<number>;
};

export function useExpoWorldPlayerFrameLoop({
  activeRideableElevatorRouteId,
  activeViewElevationY,
  activateTraversalSurface,
  activateVerticalLift,
  basePhysicsSolids,
  basePhysicsWalkableSurfaces,
  bounds,
  camera,
  cameraViewEuler,
  debug,
  desiredMoveVector,
  effectiveVerticalAccessNodes,
  effectiveVerticalWalkableRegions,
  frameCollisionDirections,
  frameMantleForward,
  frameMoveDirection,
  frameNextMovePosition,
  frameRayOrigin,
  frameSlideCandidateOrigin,
  frameSlideCandidatePosition,
  frameSlideX,
  frameSlideZ,
  homeStudioEnabled,
  lastMobileJumpIntent,
  lastMobileLiftIntent,
  lastMoveTime,
  lastReportedPosition,
  lastTraversalAction,
  liftCooldownUntil,
  liftExitArmed,
  mobileMoveIntent,
  mode,
  movRef,
  moveVelocity,
  nearbyDoorPromptRef,
  onMove,
  operatorTeleportUntil,
  pendingJumpRequest,
  pendingLiftRequest,
  preserveReviewElevation,
  raycaster,
  rideableElevatorRoutes,
  runGalaShowroomMovement,
  scene,
  setNearbyDoorPrompt,
  startFramingApplied,
  verticalAirborne,
  verticalLevelY,
  verticalVelocityY,
}: ExpoWorldPlayerFrameLoopOptions) {
  useFrame((state, delta) => {
    if (!startFramingApplied.current) {
      const sceneStartView = scene.userData[EXPO_START_VIEW_KEY] as ExpoStartView | undefined;
      if (sceneStartView?.lookAt) {
        const initialWalkY = resolveInitialWalkElevation(sceneStartView.position[1], homeStudioEnabled);
        camera.position.set(sceneStartView.position[0], initialWalkY, sceneStartView.position[2]);
        camera.lookAt(...sceneStartView.lookAt);
        camera.updateMatrixWorld();
        startFramingApplied.current = true;
        activeViewElevationY.current = initialWalkY;
        verticalLevelY.current = initialWalkY;
        verticalVelocityY.current = 0;
        verticalAirborne.current = false;
        lastReportedPosition.current = [sceneStartView.position[0], initialWalkY, sceneStartView.position[2]];
        onMove(lastReportedPosition.current);
        logExpoWorldDebug(debug, '[ExpoView][StartFraming]', sceneStartView);
      }
    }
    if (mode !== 'walk') {
      return;
    }
    const mov = movRef.current;
    const useGalaShowroomPhysics = homeStudioEnabled && !isExpo3dQaEnabled();
    const activeElevationY = activeViewElevationY.current;
    const isOperatorReviewFrame = preserveReviewElevation && activeElevationY > 12;
    const operatorTeleportSettling = operatorTeleportUntil.current > Date.now();
    if (useGalaShowroomPhysics) {
      runGalaShowroomMovement({
        delta,
        isOperatorReviewFrame,
        mobileMoveIntent,
        mov,
        operatorTeleportSettling,
      });
      return;
    }
    if (nearbyDoorPromptRef.current) {
      nearbyDoorPromptRef.current = null;
      setNearbyDoorPrompt(null);
    }
    const elapsedTime = state.clock.getElapsedTime();
    const rideableElevatorPhysics = rideableElevatorRoutes.length > 0
      ? buildRideableElevatorPhysicsFrame(elapsedTime, rideableElevatorRoutes)
      : EMPTY_RIDEABLE_ELEVATOR_PHYSICS_FRAME;
    const effectivePhysicsSolids = rideableElevatorPhysics.solids.length > 0
      ? [...basePhysicsSolids, ...rideableElevatorPhysics.solids]
      : basePhysicsSolids;
    const effectivePhysicsWalkableSurfaces = rideableElevatorPhysics.walkableSurfaces.length > 0
      ? [...basePhysicsWalkableSurfaces, ...rideableElevatorPhysics.walkableSurfaces]
      : basePhysicsWalkableSurfaces;
    const stableDelta = Math.min(delta, 1 / 90);
    const physicsDelta = Math.min(delta, 1 / 30);
    const mobileJumpIntent = Boolean(mobileMoveIntent?.jump);
    const mobileLiftIntent = Boolean(mobileMoveIntent?.lift);
    const mobileTurnL = Boolean(mobileMoveIntent?.turnL);
    const mobileTurnR = Boolean(mobileMoveIntent?.turnR);
    const mobileLookX = Math.max(-1, Math.min(1, Number(mobileMoveIntent?.lookX ?? 0)));
    const mobileLookY = Math.max(-1, Math.min(1, Number(mobileMoveIntent?.lookY ?? 0)));
    if (mobileJumpIntent && !lastMobileJumpIntent.current) {
      pendingJumpRequest.current = true;
    }
    if (mobileLiftIntent && !lastMobileLiftIntent.current) {
      pendingLiftRequest.current = {
        nodeId: null,
        requireNearby: true,
      };
    }
    lastMobileJumpIntent.current = mobileJumpIntent;
    lastMobileLiftIntent.current = mobileLiftIntent;
    const keyboardTurnDirection = (mov.turnR ? 1 : 0) - (mov.turnL ? 1 : 0);
    const mobileTurnDirection = Math.abs(mobileLookX) > 0.05
      ? mobileLookX
      : ((mobileTurnR ? 1 : 0) - (mobileTurnL ? 1 : 0));
    const hasKeyboardTurnIntent = keyboardTurnDirection !== 0 || mobileTurnDirection !== 0;
    const hasMobilePitchIntent = Math.abs(mobileLookY) > 0.05;
    const hasMoveIntent = mov.f || mov.b || mov.l || mov.r || mov.s || hasKeyboardTurnIntent || mobileMoveIntent?.f || mobileMoveIntent?.b || mobileMoveIntent?.l || mobileMoveIntent?.r || mobileMoveIntent?.s || mobileJumpIntent || mobileLiftIntent || Math.abs(mobileLookX) > 0.05 || hasMobilePitchIntent;
    const shouldPreserveStartElevation = preserveReviewElevation && !hasMoveIntent && activeViewElevationY.current > 12;
    const sprintMultiplier = mov.s || mobileMoveIntent?.s ? PLAYER_SPRINT_MULTIPLIER : 1;
    const speed = PLAYER_WALK_SPEED * sprintMultiplier * stableDelta;
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
    desiredMoveVector.current.set(0, 0, 0);
    if (mov.f || mobileMoveIntent?.f) desiredMoveVector.current.z -= speed;
    if (mov.b || mobileMoveIntent?.b) desiredMoveVector.current.z += speed;
    if (mov.l || mobileMoveIntent?.l) desiredMoveVector.current.x -= speed;
    if (mov.r || mobileMoveIntent?.r) desiredMoveVector.current.x += speed;
    moveVelocity.current.lerp(desiredMoveVector.current, Math.min(1, stableDelta * 18));
    if (desiredMoveVector.current.lengthSq() <= 0.00001 && moveVelocity.current.lengthSq() < 0.00002) {
      moveVelocity.current.set(0, 0, 0);
    }
    const moved = moveVelocity.current.lengthSq() > 0.00001;
    if (moved) {
      const moveDir = frameMoveDirection.current.copy(moveVelocity.current).applyQuaternion(camera.quaternion);
      moveDir.y = 0;
      const activePlayerRadius = PLAYER_RADIUS;
      const nextMovePosition = frameNextMovePosition.current.copy(camera.position).add(moveDir);
      const origin = frameRayOrigin.current.copy(camera.position).add(moveDir);
      origin.y -= 1;
      const collisionQueryRadius = Math.max(8, activePlayerRadius + moveDir.length() + 6);
      const collisionTargets = queryNearbyPlayerCollisionTargets(scene, nextMovePosition, collisionQueryRadius);
      const currentPhysicsHit = findBlockingWorldPhysicsSolid(camera.position, effectivePhysicsSolids, {
        playerSurfaceOffset: WORLD_PHYSICS_PLAYER_SURFACE_OFFSET,
        radius: activePlayerRadius,
      });
      const checkCollision = (pos: THREE.Vector3, dir: THREE.Vector3) => {
        raycaster.current.set(pos, dir);
        raycaster.current.near = 0;
        raycaster.current.far = activePlayerRadius;
        const intersects = raycaster.current.intersectObjects(collisionTargets, false);
        return intersects.find((entry) => entry.object.visible && isCollisionMesh(entry.object));
      };
      const checkPhysicsCollision = (pos: THREE.Vector3) => {
        const hit = findBlockingWorldPhysicsSolid(pos, effectivePhysicsSolids, {
          playerSurfaceOffset: WORLD_PHYSICS_PLAYER_SURFACE_OFFSET,
          radius: activePlayerRadius,
        });
        if (!hit) {
          return null;
        }
        if (!currentPhysicsHit || hit.solid.id !== currentPhysicsHit.solid.id) {
          return hit;
        }
        return hit.penetrationXZ >= currentPhysicsHit.penetrationXZ + 0.02 ? hit : null;
      };
      const collisionDirections = frameCollisionDirections.current;
      const forwardDir = collisionDirections[0].copy(moveDir).setY(0).normalize();
      const sideDir = collisionDirections[1].set(-forwardDir.z, 0, forwardDir.x).normalize();
      collisionDirections[2].copy(sideDir).multiplyScalar(-1);
      let movementBlockingPhysicsHit = checkPhysicsCollision(nextMovePosition);
      let isBlocked = Boolean(movementBlockingPhysicsHit);
      for (const direction of collisionDirections) {
        const hit = checkCollision(origin, direction);
        if (hit && hit.distance < activePlayerRadius) {
          isBlocked = true;
          break;
        }
      }
      if (!isBlocked) {
        camera.position.add(moveDir);
      } else {
        const stepCandidate = movementBlockingPhysicsHit && !verticalAirborne.current && !operatorTeleportSettling
          ? findWorldPhysicsTraversalSurface({
            blockingSolidId: movementBlockingPhysicsHit.solid.id,
            desiredPosition: nextMovePosition,
            edgeSlack: activePlayerRadius + 2,
            maxElevationDelta: VERTICAL_STEP_UP_MAX_DELTA,
            playerPosition: camera.position,
            surfaces: effectivePhysicsWalkableSurfaces,
          })
          : null;
        if (stepCandidate) {
          activateTraversalSurface(stepCandidate, 'step-up');
        } else {
          const slideX = frameSlideX.current.set(moveDir.x * 0.88, 0, 0);
          const slideZ = frameSlideZ.current.set(0, 0, moveDir.z * 0.88);
          const trySlide = (candidate: THREE.Vector3) => {
            if (candidate.lengthSq() <= 0) {
              return false;
            }
            const nextCandidate = frameSlideCandidatePosition.current.copy(camera.position).add(candidate);
            const candidateOrigin = frameSlideCandidateOrigin.current.copy(nextCandidate);
            candidateOrigin.y -= 1;
            movementBlockingPhysicsHit = checkPhysicsCollision(nextCandidate);
            if (movementBlockingPhysicsHit) {
              return false;
            }
            for (const direction of collisionDirections) {
              const hit = checkCollision(candidateOrigin, direction);
              if (hit && hit.distance < activePlayerRadius) {
                return false;
              }
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
    }
    const nearbyLiftNode = effectiveVerticalAccessNodes.length > 0
      ? findNearbyVerticalAccessNode(camera.position, effectiveVerticalAccessNodes)
      : null;
    const pendingLift = pendingLiftRequest.current;
    let liftActivatedThisFrame = false;
    if (
      pendingLift
      && Date.now() >= liftCooldownUntil.current
      && !operatorTeleportSettling
    ) {
      const requestedNode = pendingLift.nodeId
        ? effectiveVerticalAccessNodes.find((node) => node.id === pendingLift.nodeId) ?? null
        : nearbyLiftNode;
      const canUseRequestedNode = Boolean(
        requestedNode
        && (!pendingLift.requireNearby || requestedNode === nearbyLiftNode)
      );
      if (requestedNode && canUseRequestedNode) {
        activateVerticalLift(requestedNode, pendingLift.requireNearby ? 'manual' : 'operator-event');
        liftActivatedThisFrame = true;
      } else {
        pendingLiftRequest.current = null;
      }
    } else if (!nearbyLiftNode) {
      liftExitArmed.current = true;
    } else if (
      nearbyLiftNode.autoActivate !== false
      &&
      liftExitArmed.current
      && Date.now() >= liftCooldownUntil.current
      && !operatorTeleportSettling
    ) {
      activateVerticalLift(nearbyLiftNode, 'auto');
      liftActivatedThisFrame = true;
    }
    let rideableElevatorThisFrame: RideableElevatorHit | null = null;
    if (!liftActivatedThisFrame) {
      rideableElevatorThisFrame = rideableElevatorRoutes.length > 0
        ? findAttachedRideableElevator(
          camera.position,
          elapsedTime,
          rideableElevatorRoutes,
          activeRideableElevatorRouteId.current,
        ) ?? findCurrentRideableElevator(
          camera.position,
          verticalLevelY.current,
          elapsedTime,
          rideableElevatorRoutes,
        )
        : null;
      if (rideableElevatorThisFrame && !operatorTeleportSettling) {
        activeRideableElevatorRouteId.current = rideableElevatorThisFrame.route.id;
        verticalLevelY.current = rideableElevatorThisFrame.playerY;
        activeViewElevationY.current = rideableElevatorThisFrame.playerY;
        verticalVelocityY.current = 0;
        verticalAirborne.current = false;
        lastTraversalAction.current = `elevator-ride:${rideableElevatorThisFrame.route.id}`;
      } else if (!rideableElevatorThisFrame) {
        activeRideableElevatorRouteId.current = null;
      }
      const isOnPlanWalkable = isPositionOnVerticalWalkableRegion(camera.position, verticalLevelY.current, effectiveVerticalWalkableRegions);
      const isOnPhysicsWalkable = isWorldPhysicsPositionOnWalkableSurface(
        camera.position,
        verticalLevelY.current,
        effectivePhysicsWalkableSurfaces,
        {
          edgeSlack: WORLD_PHYSICS_DEFAULT_EDGE_SLACK,
          yTolerance: WORLD_PHYSICS_DEFAULT_Y_TOLERANCE,
        },
      );
      const currentPhysicsSolidTopY = findCurrentWorldPhysicsSolidTopY(
        camera.position,
        verticalLevelY.current,
        effectivePhysicsSolids,
        {
          edgeSlack: PLAYER_RADIUS,
          radius: PLAYER_RADIUS,
          yTolerance: VERTICAL_SOLID_TOP_Y_TOLERANCE,
        },
      );
      const isOnPhysicsSolidTop = currentPhysicsSolidTopY !== null;
      const isOnRideableElevator = Boolean(rideableElevatorThisFrame);
      const isOnVerticalWalkable = isOnPlanWalkable || isOnPhysicsWalkable || isOnPhysicsSolidTop || isOnRideableElevator;
      const isVerticalSystemElevation = (
        isVerticalSystemPlayerY(verticalLevelY.current, effectiveVerticalWalkableRegions)
        || isWorldPhysicsSurfacePlayerY(
          verticalLevelY.current,
          effectivePhysicsWalkableSurfaces,
          WORLD_PHYSICS_DEFAULT_Y_TOLERANCE,
        )
        || isOnPhysicsSolidTop
        || isOnRideableElevator
      );
      const isGrounded = verticalLevelY.current <= 5 + VERTICAL_LANDING_EPSILON || isOnVerticalWalkable;
      const canUseVerticalPhysics = !operatorTeleportSettling && !shouldPreserveStartElevation;
      if (debug || preserveReviewElevation) {
        updateVerticalRuntimeDebug({
          canUseVerticalPhysics,
          isGrounded,
          isOnVerticalWalkable,
          isVerticalSystemElevation,
          lastTraversalAction: lastTraversalAction.current,
          operatorTeleportSettling,
          playerY: verticalLevelY.current,
          verticalAirborne: verticalAirborne.current,
          verticalVelocityY: verticalVelocityY.current,
        });
      }
      if (pendingJumpRequest.current) {
        const mantleCandidate = canUseVerticalPhysics && isGrounded && !verticalAirborne.current && !operatorTeleportSettling
          ? findMantleTraversalSurface(
            camera,
            effectivePhysicsSolids,
            effectivePhysicsWalkableSurfaces,
            verticalLevelY.current,
            frameMantleForward.current,
          )
          : null;
        if (mantleCandidate) {
          activateTraversalSurface(mantleCandidate, 'mantle');
        } else if (canUseVerticalPhysics && isGrounded && !verticalAirborne.current) {
          verticalVelocityY.current = VERTICAL_JUMP_SPEED;
          verticalAirborne.current = true;
          liftExitArmed.current = false;
          logExpoWorldDebug(debug, '[ExpoView][VerticalJump]', {
            fromY: verticalLevelY.current,
            position: [camera.position.x, verticalLevelY.current, camera.position.z],
          });
        }
        pendingJumpRequest.current = false;
      }
      if (canUseVerticalPhysics) {
        if (!verticalAirborne.current && verticalLevelY.current > 5 + VERTICAL_LANDING_EPSILON && !isOnVerticalWalkable) {
          activeRideableElevatorRouteId.current = null;
          verticalAirborne.current = true;
          verticalVelocityY.current = Math.min(0, verticalVelocityY.current);
          logExpoWorldDebug(debug, '[ExpoView][VerticalFallStart]', {
            fromY: verticalLevelY.current,
            position: [camera.position.x, verticalLevelY.current, camera.position.z],
          });
        }
        if (verticalAirborne.current) {
          verticalVelocityY.current -= VERTICAL_GRAVITY * physicsDelta;
          const nextY = verticalLevelY.current + (verticalVelocityY.current * physicsDelta);
          const fromY = verticalLevelY.current;
          const landingY = Math.max(
            findVerticalLandingY(camera.position, fromY, nextY, effectiveVerticalWalkableRegions),
            findRideableElevatorLandingY(
              camera.position,
              fromY,
              nextY,
              elapsedTime,
              rideableElevatorRoutes,
            ) ?? 5,
            findWorldPhysicsLandingSurface(
              camera.position,
              fromY,
              nextY,
              effectivePhysicsWalkableSurfaces,
              {
                edgeSlack: WORLD_PHYSICS_DEFAULT_EDGE_SLACK,
                landingEpsilon: VERTICAL_LANDING_EPSILON,
              },
            )?.playerY ?? 5,
            findWorldPhysicsSolidTopLanding(
              camera.position,
              fromY,
              nextY,
              effectivePhysicsSolids,
              {
                edgeSlack: PLAYER_RADIUS,
                landingEpsilon: VERTICAL_LANDING_EPSILON,
                radius: PLAYER_RADIUS,
              },
            )?.playerY ?? 5,
          );
          if (nextY <= landingY + VERTICAL_LANDING_EPSILON && verticalVelocityY.current <= 0) {
            verticalLevelY.current = landingY;
            activeViewElevationY.current = landingY;
            verticalVelocityY.current = 0;
            verticalAirborne.current = false;
            liftExitArmed.current = false;
            liftCooldownUntil.current = Date.now() + 260;
            lastReportedPosition.current = [camera.position.x, landingY, camera.position.z];
            onMove(lastReportedPosition.current);
            logExpoWorldDebug(debug, '[ExpoView][VerticalLanding]', {
              landingY,
              position: lastReportedPosition.current,
            });
          } else {
            verticalLevelY.current = nextY;
            activeViewElevationY.current = nextY;
            const now = Date.now();
            const dy = Math.abs(verticalLevelY.current - lastReportedPosition.current[1]);
            if (now - lastMoveTime.current > 180 || dy > 4) {
              lastMoveTime.current = now;
              lastReportedPosition.current = [camera.position.x, verticalLevelY.current, camera.position.z];
              onMove(lastReportedPosition.current);
            }
          }
        } else if (isOnVerticalWalkable) {
          const snappedY = rideableElevatorThisFrame?.playerY
            ?? findCurrentVerticalRegionY(camera.position, verticalLevelY.current, effectiveVerticalWalkableRegions)
            ?? findCurrentWorldPhysicsSurfaceY(camera.position, verticalLevelY.current, effectivePhysicsWalkableSurfaces, {
              edgeSlack: WORLD_PHYSICS_DEFAULT_EDGE_SLACK,
              yTolerance: WORLD_PHYSICS_DEFAULT_Y_TOLERANCE,
            })
            ?? currentPhysicsSolidTopY
            ?? null;
          if (snappedY !== null) {
            verticalLevelY.current = snappedY;
            activeViewElevationY.current = snappedY;
          }
        }
      }
    }
    if (!isExpo3dQaEnabled()) {
      camera.position.setY(shouldPreserveStartElevation ? activeViewElevationY.current : verticalLevelY.current);
    }
    if (!isOperatorReviewFrame && !operatorTeleportSettling) {
      camera.position.setX(Math.min(bounds.maxX, Math.max(bounds.minX, camera.position.x)));
      camera.position.setZ(Math.min(bounds.maxZ, Math.max(bounds.minZ, camera.position.z)));
    }
    if (rideableElevatorThisFrame && !moved) {
      const now = Date.now();
      const dy = Math.abs(camera.position.y - lastReportedPosition.current[1]);
      if (now - lastMoveTime.current > 180 || dy > 4) {
        lastMoveTime.current = now;
        lastReportedPosition.current = [camera.position.x, camera.position.y, camera.position.z];
        onMove(lastReportedPosition.current);
      }
    } else if (moved) {
      const now = Date.now();
      const dx = camera.position.x - lastReportedPosition.current[0];
      const dz = camera.position.z - lastReportedPosition.current[2];
      const distanceSq = (dx * dx) + (dz * dz);
      if (now - lastMoveTime.current > 450 || distanceSq > 28 * 28) {
        lastMoveTime.current = now;
        lastReportedPosition.current = [camera.position.x, camera.position.y, camera.position.z];
        onMove(lastReportedPosition.current);
      }
    }
  });
}
