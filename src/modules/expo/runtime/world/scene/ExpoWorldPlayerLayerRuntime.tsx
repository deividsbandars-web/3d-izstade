import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { Html, OrbitControls, PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';
import type { ExpoMode } from '../../../state/expoRuntime';
import type { ExpoStartView } from '../../../world-contract';
import type { ExpoVerticalAccessNode } from '../../planning/types';
import { EXPO_VERTICAL_CITY_SYSTEM } from '../../planning/vertical/verticalCitySystem';
import { isHomeStudioEnabled } from '../../modularHome/homeDemoFlags';
import {
  type WorldPhysicsSurfaceRegistry,
  type WorldPhysicsTraversalSurfaceCandidate,
} from '../physics/worldPhysicsSurfaceRegistry';
import {
  buildRideableElevatorRuntimeRoutes,
  type RideableElevatorRuntimeRoute,
} from '../physics/elevatorPhysics';
import { collectPlayerCollisionTargets, isCollisionMesh } from '../WorldSceneSupport';
import {
  GALA_SHOWROOM_EYE_HEIGHT_Y,
  useGalaShowroomMovement,
} from './useGalaShowroomMovement';
import {
  EMPTY_WALK_MOVE_STATE,
  LIFT_TRIGGER_KEYS,
  OPERATOR_TELEPORT_SETTLE_MS,
  PLAYER_HUMAN_EYE_HEIGHT_Y,
  PLAYER_SPAWN_MIN_CLEARANCE_Y,
  VERTICAL_LIFT_COOLDOWN_MS,
  WALK_CONTROL_KEYS,
  type ExpoWorldMobileMoveIntent,
  type ExpoWorldPlayerBounds,
  type OperatorTeleportDetail,
  type VerticalLiftRequest,
  type VerticalLiftRequestDetail,
  type WalkMoveState,
  logExpoWorldDebug,
  isExpoTextEntryTarget,
  resolveInitialWalkElevation,
} from './ExpoWorldPlayerFrameSupport';
import { useExpoWorldPlayerFrameLoop } from './useExpoWorldPlayerFrameLoop';
import { useGalaShowroomRuntime } from './useGalaShowroomRuntime';
export function ExpoWorldPlayerLayer({
  bounds,
  debug = false,
  mobileMoveIntent,
  mode,
  onMove,
  physicsSurfaceRegistry,
  preserveReviewElevation = false,
  startView,
  verticalAccessNodes = [],
}: {
  bounds: ExpoWorldPlayerBounds; debug?: boolean;
  mobileMoveIntent?: ExpoWorldMobileMoveIntent;
  mode: ExpoMode; onMove: (pos: number[]) => void; physicsSurfaceRegistry?: WorldPhysicsSurfaceRegistry;
  preserveReviewElevation?: boolean; startView: ExpoStartView; verticalAccessNodes?: ExpoVerticalAccessNode[];
}) {
  const { camera, scene } = useThree();
  const movRef = useRef<WalkMoveState>({ ...EMPTY_WALK_MOVE_STATE });
  const raycaster = useRef(new THREE.Raycaster());
  const cameraViewEuler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const desiredMoveVector = useRef(new THREE.Vector3());
  const moveVelocity = useRef(new THREE.Vector3());
  const frameMoveDirection = useRef(new THREE.Vector3());
  const frameNextMovePosition = useRef(new THREE.Vector3());
  const frameRayOrigin = useRef(new THREE.Vector3());
  const frameCollisionDirections = useRef([
    new THREE.Vector3(),
    new THREE.Vector3(),
    new THREE.Vector3(),
  ]);
  const frameSlideX = useRef(new THREE.Vector3());
  const frameSlideZ = useRef(new THREE.Vector3());
  const frameSlideCandidatePosition = useRef(new THREE.Vector3());
  const frameSlideCandidateOrigin = useRef(new THREE.Vector3());
  const frameMantleForward = useRef(new THREE.Vector3());
  const orbitControlsRef = useRef<any>(null);
  const spawnChecked = useRef(false);
  const startFramingApplied = useRef(false);
  const lastAppliedStartViewSignature = useRef<string | null>(null);
  const lastMoveTime = useRef(0);
  const lastReportedPosition = useRef<[number, number, number]>([0, 0, 0]);
  const operatorTeleportUntil = useRef(0);
  const liftExitArmed = useRef(true);
  const liftCooldownUntil = useRef(0);
  const pendingLiftRequest = useRef<VerticalLiftRequest | null>(null);
  const pendingJumpRequest = useRef(false);
  const lastMobileJumpIntent = useRef(false);
  const lastMobileLiftIntent = useRef(false);
  const activeRideableElevatorRouteId = useRef<string | null>(null);
  const lastTraversalAction = useRef<string | null>(null);
  const verticalVelocityY = useRef(0);
  const verticalAirborne = useRef(false);
  const homeStudioEnabled = useMemo(() => isHomeStudioEnabled(), []);
  const activeViewElevationY = useRef(startView.position[1]);
  const verticalLevelY = useRef(5);
  const effectiveVerticalAccessNodes = verticalAccessNodes.length > 0
    ? verticalAccessNodes
    : EXPO_VERTICAL_CITY_SYSTEM.accessNodes;
  const effectiveVerticalWalkableRegions = EXPO_VERTICAL_CITY_SYSTEM.walkableRegions;
  const rideableElevatorRoutes = useMemo<RideableElevatorRuntimeRoute[]>(() => (
    buildRideableElevatorRuntimeRoutes(EXPO_VERTICAL_CITY_SYSTEM.elevatorRoutes)
  ), []);
  const basePhysicsSolids = physicsSurfaceRegistry?.solids ?? [];
  const basePhysicsWalkableSurfaces = physicsSurfaceRegistry?.walkableSurfaces ?? [];
  const startViewSignature = `${startView.position.join(',')}|${startView.lookAt.join(',')}|${startView.source}`;
  const {
    galaCollisionSegmentsRef,
    galaDoorStatesRef,
    nearbyDoorPrompt,
    nearbyDoorPromptRef,
    setNearbyDoorPrompt,
    toggleNearbyDoor,
  } = useGalaShowroomRuntime({
    camera,
    enabled: homeStudioEnabled,
  });
  const runGalaShowroomMovement = useGalaShowroomMovement({
    activeViewElevationYRef: activeViewElevationY,
    bounds,
    camera,
    desiredMoveVectorRef: desiredMoveVector,
    galaCollisionSegmentsRef,
    galaDoorStatesRef,
    lastMoveTimeRef: lastMoveTime,
    lastReportedPositionRef: lastReportedPosition,
    moveVelocityRef: moveVelocity,
    nearbyDoorPromptRef,
    onMove,
    pendingJumpRequestRef: pendingJumpRequest,
    pendingLiftRequestRef: pendingLiftRequest,
    setNearbyDoorPrompt,
    verticalAirborneRef: verticalAirborne,
    verticalLevelYRef: verticalLevelY,
    verticalVelocityYRef: verticalVelocityY,
  });
  const orbitMaxDistance = useMemo(() => {
    const startDistance = Math.hypot(
      startView.position[0] - startView.lookAt[0],
      startView.position[1] - startView.lookAt[1],
      startView.position[2] - startView.lookAt[2],
    );
    return Math.max(500, Math.min(16000, startDistance + 250));
  }, [startView]);
  const applyStartView = useCallback((
    nextStartView: ExpoStartView,
    reason: string,
    options?: { markFramed?: boolean },
  ) => {
    const initialWalkY = resolveInitialWalkElevation(nextStartView.position[1], homeStudioEnabled);
    startFramingApplied.current = options?.markFramed ?? false;
    spawnChecked.current = false;
    camera.position.set(nextStartView.position[0], initialWalkY, nextStartView.position[2]);
    orbitControlsRef.current?.target.set(...nextStartView.lookAt);
    camera.lookAt(...nextStartView.lookAt);
    orbitControlsRef.current?.update();
    camera.updateMatrixWorld();
    activeViewElevationY.current = initialWalkY;
    verticalLevelY.current = initialWalkY;
    desiredMoveVector.current.set(0, 0, 0);
    moveVelocity.current.set(0, 0, 0);
    pendingJumpRequest.current = false;
    activeRideableElevatorRouteId.current = null;
    verticalVelocityY.current = 0;
    verticalAirborne.current = false;
    lastTraversalAction.current = null;
    liftExitArmed.current = true;
    liftCooldownUntil.current = Date.now() + 450;
    lastReportedPosition.current = [nextStartView.position[0], initialWalkY, nextStartView.position[2]];
    onMove(lastReportedPosition.current);
    logExpoWorldDebug(debug, reason, nextStartView);
  }, [camera, debug, homeStudioEnabled, onMove]);
  useEffect(() => {
    const initialY = homeStudioEnabled ? GALA_SHOWROOM_EYE_HEIGHT_Y : PLAYER_HUMAN_EYE_HEIGHT_Y;
    camera.position.set(-8, initialY, 10);
    camera.lookAt(0, initialY, -24);
    logExpoWorldDebug(debug, 'CAMERA START:', camera.position);
  }, [camera, debug, homeStudioEnabled]);
  useEffect(() => {
    if (lastAppliedStartViewSignature.current === startViewSignature) {
      return;
    }
    lastAppliedStartViewSignature.current = startViewSignature;
    applyStartView(startView, '[ExpoView][StartViewChanged]');
  }, [applyStartView, startView, startViewSignature]);
  useEffect(() => {
    const handleOperatorTeleport = (event: Event) => {
      const detail = (event as CustomEvent<OperatorTeleportDetail>).detail;
      if (!detail?.startView) {
        return;
      }
      operatorTeleportUntil.current = Date.now() + OPERATOR_TELEPORT_SETTLE_MS;
      applyStartView(detail.startView, '[ExpoView][OperatorTeleport]', { markFramed: true });
    };
    window.addEventListener('expo:operator-teleport', handleOperatorTeleport as EventListener);
    return () => {
      window.removeEventListener('expo:operator-teleport', handleOperatorTeleport as EventListener);
    };
  }, [applyStartView]);
  const activateVerticalLift = useCallback((
    node: ExpoVerticalAccessNode,
    reason: 'auto' | 'manual' | 'operator-event',
  ) => {
    const nextY = Math.max(5, node.targetPosition[1]);
    verticalLevelY.current = nextY;
    activeViewElevationY.current = nextY;
    verticalVelocityY.current = 0;
    verticalAirborne.current = false;
    lastTraversalAction.current = null;
    pendingJumpRequest.current = false;
    liftExitArmed.current = false;
    liftCooldownUntil.current = Date.now() + VERTICAL_LIFT_COOLDOWN_MS;
    pendingLiftRequest.current = null;
    activeRideableElevatorRouteId.current = null;
    moveVelocity.current.set(0, 0, 0);
    camera.position.set(node.targetPosition[0], nextY, node.targetPosition[2]);
    camera.updateMatrixWorld();
    lastReportedPosition.current = [camera.position.x, camera.position.y, camera.position.z];
    onMove(lastReportedPosition.current);
    logExpoWorldDebug(debug, '[ExpoView][VerticalLift]', {
      nodeId: node.id,
      reason,
      targetLevel: node.targetLevel,
      targetPosition: lastReportedPosition.current,
    });
  }, [camera, debug, onMove]);
  const activateTraversalSurface = useCallback((
    candidate: WorldPhysicsTraversalSurfaceCandidate,
    reason: 'mantle' | 'step-up',
  ) => {
    verticalLevelY.current = candidate.surface.playerY;
    activeViewElevationY.current = candidate.surface.playerY;
    verticalVelocityY.current = 0;
    verticalAirborne.current = false;
    pendingJumpRequest.current = false;
    activeRideableElevatorRouteId.current = null;
    liftExitArmed.current = false;
    lastTraversalAction.current = `${reason}:${candidate.surface.ownerId}`;
    moveVelocity.current.multiplyScalar(reason === 'mantle' ? 0 : 0.35);
    camera.position.set(
      candidate.landingPosition.x,
      candidate.surface.playerY,
      candidate.landingPosition.z,
    );
    camera.updateMatrixWorld();
    lastReportedPosition.current = [camera.position.x, camera.position.y, camera.position.z];
    onMove(lastReportedPosition.current);
    logExpoWorldDebug(debug, '[ExpoView][VerticalTraversal]', {
      delta: candidate.elevationDelta,
      ownerId: candidate.surface.ownerId,
      reason,
      targetY: candidate.surface.playerY,
    });
  }, [camera, debug, onMove]);
  useEffect(() => {
    const handleVerticalLiftRequest = (event: Event) => {
      const detail = (event as CustomEvent<VerticalLiftRequestDetail>).detail;
      pendingLiftRequest.current = {
        nodeId: detail?.nodeId ?? null,
        requireNearby: false,
      };
    };
    window.addEventListener('expo:vertical-lift', handleVerticalLiftRequest as EventListener);
    return () => {
      window.removeEventListener('expo:vertical-lift', handleVerticalLiftRequest as EventListener);
    };
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (spawnChecked.current) {
        return;
      }
      const downRay = new THREE.Raycaster(camera.position, new THREE.Vector3(0, -1, 0));
      const intersects = downRay.intersectObjects(collectPlayerCollisionTargets(scene), false);
      const hit = intersects.find((entry) => entry.object.visible && isCollisionMesh(entry.object));
      if (hit && hit.distance < PLAYER_SPAWN_MIN_CLEARANCE_Y) {
        logExpoWorldDebug(debug, 'Spawn unsafe, pushing player upward.');
        camera.position.y += (PLAYER_SPAWN_MIN_CLEARANCE_Y - hit.distance) + 0.2;
      }
      spawnChecked.current = true;
    }, 4500);
    return () => clearTimeout(timer);
  }, [camera, debug, scene]);
  useEffect(() => {
    if (mode !== 'walk') {
      return;
    }
    const onEscape = (event: KeyboardEvent) => {
      if (event.code === 'Escape' && document.pointerLockElement) {
        document.exitPointerLock?.();
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (isExpoTextEntryTarget(event.target)) {
        return;
      }
      if (WALK_CONTROL_KEYS.has(event.code)) {
        event.preventDefault();
      }
      if (event.code === 'KeyE' && homeStudioEnabled && !event.repeat && toggleNearbyDoor()) {
        movRef.current = { ...movRef.current, turnR: false };
        return;
      }
      if (LIFT_TRIGGER_KEYS.has(event.code) && !homeStudioEnabled) {
        pendingLiftRequest.current = {
          nodeId: null,
          requireNearby: true,
        };
      }
      if (event.code === 'Space' && !event.repeat && !homeStudioEnabled) {
        pendingJumpRequest.current = true;
      }
      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW': movRef.current = { ...movRef.current, f: true }; break;
        case 'ArrowDown':
        case 'KeyS': movRef.current = { ...movRef.current, b: true }; break;
        case 'KeyA': movRef.current = { ...movRef.current, l: true }; break;
        case 'KeyD': movRef.current = { ...movRef.current, r: true }; break;
        case 'ArrowLeft':
        case 'KeyQ': movRef.current = { ...movRef.current, turnL: true }; break;
        case 'ArrowRight':
        case 'KeyE': movRef.current = { ...movRef.current, turnR: true }; break;
        case 'ShiftLeft':
        case 'ShiftRight': movRef.current = { ...movRef.current, s: true }; break;
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (WALK_CONTROL_KEYS.has(event.code)) {
        event.preventDefault();
      }
      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW': movRef.current = { ...movRef.current, f: false }; break;
        case 'ArrowDown':
        case 'KeyS': movRef.current = { ...movRef.current, b: false }; break;
        case 'KeyA': movRef.current = { ...movRef.current, l: false }; break;
        case 'KeyD': movRef.current = { ...movRef.current, r: false }; break;
        case 'ArrowLeft':
        case 'KeyQ': movRef.current = { ...movRef.current, turnL: false }; break;
        case 'ArrowRight':
        case 'KeyE': movRef.current = { ...movRef.current, turnR: false }; break;
        case 'ShiftLeft':
        case 'ShiftRight': movRef.current = { ...movRef.current, s: false }; break;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('keydown', onEscape);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('keydown', onEscape);
    };
  }, [homeStudioEnabled, mode, toggleNearbyDoor]);
  useExpoWorldPlayerFrameLoop({
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
  });
  if (homeStudioEnabled && mode === 'fly') {
    return null;
  }
  const controls = mode === 'fly'
    ? <OrbitControls ref={orbitControlsRef} enablePan enableZoom enableRotate maxDistance={orbitMaxDistance} enableDamping dampingFactor={0.05} />
    : (mode === 'walk' ? <PointerLockControls onUnlock={() => document.body.style.cursor = 'auto'} pointerSpeed={0.18} /> : null);
  return (
    <>
      {homeStudioEnabled && mode === 'walk' && nearbyDoorPrompt ? (
        <Html fullscreen pointerEvents="none">
          <div
            data-gala-door-prompt={nearbyDoorPrompt.doorId}
            style={{ alignItems: 'center', bottom: '18px', display: 'flex', justifyContent: 'center', left: 0, pointerEvents: 'none', position: 'fixed', right: 0, zIndex: 40 }}
          >
            <span
              style={{ background: 'rgba(15, 23, 42, 0.56)', border: '1px solid rgba(248, 250, 252, 0.22)', borderRadius: '6px', color: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.68rem', fontWeight: 800, lineHeight: 1.1, padding: '5px 8px', textShadow: '0 2px 8px rgba(2,6,23,0.72)', whiteSpace: 'nowrap' }}
            >
              {nearbyDoorPrompt.state === 'open' ? 'E: Close door' : 'E: Open door'} - {nearbyDoorPrompt.label}
            </span>
          </div>
        </Html>
      ) : null}
      {controls}
    </>
  );
}
