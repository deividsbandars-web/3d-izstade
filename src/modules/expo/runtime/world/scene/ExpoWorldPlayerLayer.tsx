import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls, PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';
import type { ExpoMode } from '../../../state/expoRuntime';
import type { ExpoStartView } from '../../../world-contract';
import type { ExpoVerticalAccessNode, ExpoVerticalWalkableRegion } from '../../planning/types';
import { EXPO_VERTICAL_CITY_SYSTEM } from '../../planning/vertical/verticalCitySystem';
import {
  getGalaDoorStatesSnapshot,
  subscribeGalaDoorStates,
  toggleGalaDoorState,
} from '../../modularHome/GalaDoorState';
import { isHomeStudioEnabled } from '../../modularHome/homeDemoFlags';
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
  type WorldPhysicsSurfaceRegistry,
} from '../physics/worldPhysicsSurfaceRegistry';
import {
  buildRideableElevatorPhysicsFrame,
  buildRideableElevatorRuntimeRoutes,
  findAttachedRideableElevator,
  findCurrentRideableElevator,
  findRideableElevatorLandingY,
  type RideableElevatorHit,
  type RideableElevatorRuntimeRoute,
} from '../physics/elevatorPhysics';
import { isExpo3dQaEnabled } from '../../app/expo3dQa';
import { EXPO_START_VIEW_KEY, collectPlayerCollisionTargets, isCollisionMesh } from '../WorldSceneSupport';
import {
  GALA_SHOWROOM_EYE_HEIGHT_Y,
  buildGalaCollisionSegments,
  findNearbyGalaDoor,
  useGalaShowroomMovement,
  type GalaDoorPromptState,
} from './useGalaShowroomMovement';
const PLAYER_RADIUS = 0.92;
const PLAYER_WALK_SPEED = 108;
const PLAYER_SPRINT_MULTIPLIER = 1.8;
const PLAYER_HUMAN_EYE_HEIGHT_Y = 1.72;
const PLAYER_LEGACY_LOW_START_Y = 5;
const PLAYER_SPAWN_MIN_CLEARANCE_Y = 1.45;
const PLAYER_KEYBOARD_TURN_SPEED = 2.25;
const EMPTY_RIDEABLE_ELEVATOR_PHYSICS_FRAME = {
  solids: [] as WorldPhysicsSolid[],
  walkableSurfaces: [] as WorldPhysicsWalkableSurface[],
};
const PLAYER_LOOK_PITCH_LIMIT = 1.32;
const PLAYER_MOBILE_LOOK_PITCH_SPEED = 2.45;
const PLAYER_MOBILE_LOOK_TURN_SPEED = 3.35;
const OPERATOR_TELEPORT_SETTLE_MS = 1200;
const VERTICAL_LIFT_COOLDOWN_MS = 1400;
const VERTICAL_GRAVITY = 340;
const VERTICAL_JUMP_SPEED = 220;
const VERTICAL_LANDING_EPSILON = 0.45;
const VERTICAL_SOLID_TOP_Y_TOLERANCE = 1.25;
const VERTICAL_WALKABLE_EDGE_SLACK = 6;
const VERTICAL_WALKABLE_Y_TOLERANCE = 10;
const VERTICAL_STEP_UP_MAX_DELTA = 24;
const VERTICAL_MANTLE_MAX_DELTA = 112;
const VERTICAL_MANTLE_FORWARD_REACH = 26;
const LIFT_TRIGGER_KEYS = new Set(['KeyF']);
const WALK_CONTROL_KEYS = new Set([
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
function resolveInitialWalkElevation(startY: number, useGalaShowroomPhysics = false): number {
  if (useGalaShowroomPhysics) {
    return GALA_SHOWROOM_EYE_HEIGHT_Y;
  }
  if (startY > 12) {
    return startY;
  }
  return Math.max(PLAYER_HUMAN_EYE_HEIGHT_Y, Math.min(PLAYER_LEGACY_LOW_START_Y, startY));
}
type OperatorTeleportDetail = { startView?: ExpoStartView; zoneId?: string };
type VerticalLiftRequest = { nodeId?: string | null; requireNearby: boolean };
type VerticalLiftRequestDetail = { nodeId?: string | null };
type WalkMoveState = { f: boolean; b: boolean; l: boolean; r: boolean; s: boolean; turnL: boolean; turnR: boolean };
const EMPTY_WALK_MOVE_STATE: WalkMoveState = {
  b: false,
  f: false,
  l: false,
  r: false,
  s: false,
  turnL: false,
  turnR: false,
};
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
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number }; debug?: boolean;
  mobileMoveIntent?: { f: boolean; b: boolean; l: boolean; r: boolean; s?: boolean; turnL?: boolean; turnR?: boolean; jump?: boolean; lift?: boolean; lookX?: number; lookY?: number };
  mode: ExpoMode; onMove: (pos: number[]) => void; physicsSurfaceRegistry?: WorldPhysicsSurfaceRegistry;
  preserveReviewElevation?: boolean; startView: ExpoStartView; verticalAccessNodes?: ExpoVerticalAccessNode[];
}) {
  const { camera, scene } = useThree();
  const [nearbyDoorPrompt, setNearbyDoorPrompt] = useState<GalaDoorPromptState | null>(null);
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
  const galaDoorStates = useRef(getGalaDoorStatesSnapshot());
  const galaCollisionSegmentsRef = useRef(buildGalaCollisionSegments(getGalaDoorStatesSnapshot()));
  const nearbyDoorPromptRef = useRef<GalaDoorPromptState | null>(null);
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
  const runGalaShowroomMovement = useGalaShowroomMovement({
    activeViewElevationYRef: activeViewElevationY,
    bounds,
    camera,
    desiredMoveVectorRef: desiredMoveVector,
    galaCollisionSegmentsRef,
    galaDoorStatesRef: galaDoorStates,
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
  useEffect(() => {
    if (!homeStudioEnabled) {
      return undefined;
    }
    galaDoorStates.current = getGalaDoorStatesSnapshot();
    galaCollisionSegmentsRef.current = buildGalaCollisionSegments(galaDoorStates.current);
    return subscribeGalaDoorStates((states) => {
      galaDoorStates.current = states;
      galaCollisionSegmentsRef.current = buildGalaCollisionSegments(galaDoorStates.current);
    });
  }, [homeStudioEnabled]);
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
      if (WALK_CONTROL_KEYS.has(event.code)) {
        event.preventDefault();
      }
      if (event.code === 'KeyE' && homeStudioEnabled && !event.repeat) {
        const nearbyDoor = findNearbyGalaDoor(camera.position);
        if (nearbyDoor) {
          galaDoorStates.current = toggleGalaDoorState(nearbyDoor.doorId);
          galaCollisionSegmentsRef.current = buildGalaCollisionSegments(galaDoorStates.current);
          movRef.current = { ...movRef.current, turnR: false };
          return;
        }
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
  }, [camera.position, homeStudioEnabled, mode]);
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
      const collisionTargets = collectPlayerCollisionTargets(scene);
      const currentPhysicsHit = findBlockingWorldPhysicsSolid(camera.position, effectivePhysicsSolids, {
        playerSurfaceOffset: WORLD_PHYSICS_PLAYER_SURFACE_OFFSET,
        radius: activePlayerRadius,
      });
      const checkCollision = (pos: THREE.Vector3, dir: THREE.Vector3) => {
        raycaster.current.set(pos, dir);
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
function findNearbyVerticalAccessNode(playerPosition: THREE.Vector3, nodes: ExpoVerticalAccessNode[]) {
  let nearestNode: ExpoVerticalAccessNode | null = null;
  let nearestDistanceXZ = Number.POSITIVE_INFINITY;

  for (const node of nodes) {
    const dx = playerPosition.x - node.position[0];
    const dz = playerPosition.z - node.position[2];
    const distanceXZ = Math.hypot(dx, dz);
    const nodePlayerY = Math.max(5, node.position[1]);
    const distanceY = Math.abs(playerPosition.y - nodePlayerY);
    if (
      distanceXZ <= node.radius
      && distanceY <= Math.max(18, node.radius * 0.65)
      && distanceXZ < nearestDistanceXZ
    ) {
      nearestNode = node;
      nearestDistanceXZ = distanceXZ;
    }
  }

  return nearestNode;
}
function findMantleTraversalSurface(camera: THREE.Camera, solids: ReadonlyArray<WorldPhysicsSolid>, surfaces: ReadonlyArray<WorldPhysicsWalkableSurface>, playerY: number, forward: THREE.Vector3) {
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
    landingMargin: PLAYER_RADIUS + 0.5,
    maxElevationDelta: VERTICAL_MANTLE_MAX_DELTA,
    playerPosition,
    surfaces,
  });
}
function isPositionOnVerticalWalkableRegion(playerPosition: THREE.Vector3, playerY: number, regions: ExpoVerticalWalkableRegion[]) {
  return regions.some((region) => {
    if (Math.abs(playerY - region.playerY) > VERTICAL_WALKABLE_Y_TOLERANCE) {
      return false;
    }
    const halfWidth = (region.size[0] * 0.5) + VERTICAL_WALKABLE_EDGE_SLACK;
    const halfDepth = (region.size[1] * 0.5) + VERTICAL_WALKABLE_EDGE_SLACK;
    return (
      Math.abs(playerPosition.x - region.position[0]) <= halfWidth
      && Math.abs(playerPosition.z - region.position[2]) <= halfDepth
    );
  });
}
function isVerticalSystemPlayerY(playerY: number, regions: ExpoVerticalWalkableRegion[]) {
  return regions.some((region) => Math.abs(playerY - region.playerY) <= VERTICAL_WALKABLE_Y_TOLERANCE);
}
function findCurrentVerticalRegionY(playerPosition: THREE.Vector3, playerY: number, regions: ExpoVerticalWalkableRegion[]) {
  const region = regions.find((candidate) => (
    Math.abs(playerY - candidate.playerY) <= VERTICAL_WALKABLE_Y_TOLERANCE
    && isPointInsideVerticalWalkableRegion(playerPosition, candidate)
  ));
  return region?.playerY ?? null;
}
function findVerticalLandingY(playerPosition: THREE.Vector3, fromY: number, toY: number, regions: ExpoVerticalWalkableRegion[]) {
  const upperY = Math.max(fromY, toY);
  const lowerY = Math.min(fromY, toY);
  const lowerWalkableRegions = regions
    .filter((region) => (
      region.playerY <= upperY + VERTICAL_LANDING_EPSILON
      && region.playerY >= lowerY - VERTICAL_LANDING_EPSILON
      && isPointInsideVerticalWalkableRegion(playerPosition, region)
    ))
    .sort((left, right) => right.playerY - left.playerY);
  return lowerWalkableRegions[0]?.playerY ?? 5;
}
function isPointInsideVerticalWalkableRegion(playerPosition: THREE.Vector3, region: ExpoVerticalWalkableRegion) {
  const halfWidth = (region.size[0] * 0.5) + VERTICAL_WALKABLE_EDGE_SLACK;
  const halfDepth = (region.size[1] * 0.5) + VERTICAL_WALKABLE_EDGE_SLACK;
  return (
    Math.abs(playerPosition.x - region.position[0]) <= halfWidth
    && Math.abs(playerPosition.z - region.position[2]) <= halfDepth
  );
}
function updateVerticalRuntimeDebug(state: { canUseVerticalPhysics: boolean; isGrounded: boolean; isOnVerticalWalkable: boolean; isVerticalSystemElevation: boolean; lastTraversalAction: string | null; operatorTeleportSettling: boolean; playerY: number; verticalAirborne: boolean; verticalVelocityY: number }) {
  if (typeof window === 'undefined') {
    return;
  }
  (window as unknown as { __WARPALA_EXPO_VERTICAL_RUNTIME__?: typeof state }).__WARPALA_EXPO_VERTICAL_RUNTIME__ = state;
}
function logExpoWorldDebug(enabled: boolean, ...args: unknown[]) {
  if (enabled) {
    console.log(...args);
  }
}
