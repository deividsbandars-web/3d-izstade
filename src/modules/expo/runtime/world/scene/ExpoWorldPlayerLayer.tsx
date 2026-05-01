import { useCallback, useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';
import type { ExpoMode } from '../../../state/expoRuntime';
import type { ExpoStartView } from '../../../world-contract';
import { EXPO_START_VIEW_KEY, collectPlayerCollisionTargets, isCollisionMesh } from '../WorldSceneSupport';

const PLAYER_RADIUS = 0.92;
const PLAYER_WALK_SPEED = 108;
const PLAYER_SPRINT_MULTIPLIER = 1.8;
const OPERATOR_TELEPORT_SETTLE_MS = 1200;

type OperatorTeleportDetail = {
  startView?: ExpoStartView;
  zoneId?: string;
};

export function ExpoWorldPlayerLayer({
  bounds,
  debug = false,
  mobileMoveIntent,
  mode,
  onMove,
  preserveReviewElevation = false,
  startView,
}: {
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  debug?: boolean;
  mobileMoveIntent?: { f: boolean; b: boolean; l: boolean; r: boolean; s?: boolean };
  mode: ExpoMode;
  onMove: (pos: number[]) => void;
  preserveReviewElevation?: boolean;
  startView: ExpoStartView;
}) {
  const { camera, scene } = useThree();
  const [mov, setMov] = useState({ f: false, b: false, l: false, r: false, s: false });
  const raycaster = useRef(new THREE.Raycaster());
  const desiredMoveVector = useRef(new THREE.Vector3());
  const moveVelocity = useRef(new THREE.Vector3());
  const orbitControlsRef = useRef<any>(null);
  const spawnChecked = useRef(false);
  const startFramingApplied = useRef(false);
  const lastAppliedStartViewSignature = useRef<string | null>(null);
  const lastMoveTime = useRef(0);
  const lastReportedPosition = useRef<[number, number, number]>([0, 0, 0]);
  const operatorTeleportUntil = useRef(0);
  const startViewSignature = `${startView.position.join(',')}|${startView.lookAt.join(',')}|${startView.source}`;

  const applyStartView = useCallback((
    nextStartView: ExpoStartView,
    reason: string,
    options?: { markFramed?: boolean },
  ) => {
    startFramingApplied.current = options?.markFramed ?? false;
    spawnChecked.current = false;
    camera.position.set(...nextStartView.position);
    orbitControlsRef.current?.target.set(...nextStartView.lookAt);
    camera.lookAt(...nextStartView.lookAt);
    orbitControlsRef.current?.update();
    camera.updateMatrixWorld();
    lastReportedPosition.current = [nextStartView.position[0], nextStartView.position[1], nextStartView.position[2]];
    onMove(lastReportedPosition.current);
    logExpoWorldDebug(debug, reason, nextStartView);
  }, [camera, debug, onMove]);

  useEffect(() => {
    camera.position.set(-8, 5, 10);
    camera.lookAt(0, 3, -24);
    logExpoWorldDebug(debug, 'CAMERA START:', camera.position);
  }, [camera, debug]);

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

  useEffect(() => {
    const timer = setTimeout(() => {
      if (spawnChecked.current) {
        return;
      }

      const downRay = new THREE.Raycaster(camera.position, new THREE.Vector3(0, -1, 0));
      const intersects = downRay.intersectObjects(collectPlayerCollisionTargets(scene), false);
      const hit = intersects.find((entry) => entry.object.visible && isCollisionMesh(entry.object));

      if (hit && hit.distance < 2) {
        logExpoWorldDebug(debug, 'Spawn unsafe, pushing player upward.');
        camera.position.y += (2 - hit.distance) + 1;
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
      switch (event.code) {
        case 'KeyW': setMov((value) => ({ ...value, f: true })); break;
        case 'KeyS': setMov((value) => ({ ...value, b: true })); break;
        case 'KeyA': setMov((value) => ({ ...value, l: true })); break;
        case 'KeyD': setMov((value) => ({ ...value, r: true })); break;
        case 'ShiftLeft':
        case 'ShiftRight': setMov((value) => ({ ...value, s: true })); break;
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'KeyW': setMov((value) => ({ ...value, f: false })); break;
        case 'KeyS': setMov((value) => ({ ...value, b: false })); break;
        case 'KeyA': setMov((value) => ({ ...value, l: false })); break;
        case 'KeyD': setMov((value) => ({ ...value, r: false })); break;
        case 'ShiftLeft':
        case 'ShiftRight': setMov((value) => ({ ...value, s: false })); break;
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
  }, [mode]);

  useFrame((_, delta) => {
    if (!startFramingApplied.current) {
      const sceneStartView = scene.userData[EXPO_START_VIEW_KEY] as ExpoStartView | undefined;
      if (sceneStartView?.lookAt) {
        camera.position.set(...sceneStartView.position);
        camera.lookAt(...sceneStartView.lookAt);
        camera.updateMatrixWorld();
        startFramingApplied.current = true;
        lastReportedPosition.current = [sceneStartView.position[0], sceneStartView.position[1], sceneStartView.position[2]];
        onMove(lastReportedPosition.current);
        logExpoWorldDebug(debug, '[ExpoView][StartFraming]', sceneStartView);
      }
    }

    if (mode !== 'walk') {
      return;
    }

    const isOperatorReviewFrame = preserveReviewElevation && startView.position[1] > 12;
    const operatorTeleportSettling = operatorTeleportUntil.current > Date.now();

    const stableDelta = Math.min(delta, 1 / 90);
    const hasMoveIntent = mov.f || mov.b || mov.l || mov.r || mov.s || mobileMoveIntent?.f || mobileMoveIntent?.b || mobileMoveIntent?.l || mobileMoveIntent?.r || mobileMoveIntent?.s;
    const sprintMultiplier = mov.s || mobileMoveIntent?.s ? PLAYER_SPRINT_MULTIPLIER : 1;
    const speed = PLAYER_WALK_SPEED * sprintMultiplier * stableDelta;
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
      const moveDir = moveVelocity.current.clone().applyQuaternion(camera.quaternion);
      moveDir.y = 0;
      const origin = camera.position.clone().add(moveDir);
      origin.y -= 1;
      const collisionTargets = collectPlayerCollisionTargets(scene);

      const checkCollision = (pos: THREE.Vector3, dir: THREE.Vector3) => {
        raycaster.current.set(pos, dir);
        const intersects = raycaster.current.intersectObjects(collisionTargets, false);
        return intersects.find((entry) => entry.object.visible && isCollisionMesh(entry.object));
      };

      const forwardDir = moveDir.clone().setY(0).normalize();
      const sideDir = new THREE.Vector3(-forwardDir.z, 0, forwardDir.x).normalize();
      const collisionDirections = [forwardDir, sideDir, sideDir.clone().multiplyScalar(-1)];

      let isBlocked = false;
      for (const direction of collisionDirections) {
        const hit = checkCollision(origin, direction);
        if (hit && hit.distance < PLAYER_RADIUS) {
          isBlocked = true;
          break;
        }
      }

      if (!isBlocked) {
        camera.position.add(moveDir);
      } else {
        const slideX = new THREE.Vector3(moveDir.x * 0.88, 0, 0);
        const slideZ = new THREE.Vector3(0, 0, moveDir.z * 0.88);
        const trySlide = (candidate: THREE.Vector3) => {
          if (candidate.lengthSq() <= 0) {
            return false;
          }

          const nextCandidate = camera.position.clone().add(candidate);
          const candidateOrigin = nextCandidate.clone();
          candidateOrigin.y -= 1;

          for (const direction of collisionDirections) {
            const hit = checkCollision(candidateOrigin, direction);
            if (hit && hit.distance < PLAYER_RADIUS) {
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

    const shouldPreserveStartElevation = preserveReviewElevation && !hasMoveIntent && startView.position[1] > 12;
    camera.position.setY(shouldPreserveStartElevation ? startView.position[1] : 5);

    if (!isOperatorReviewFrame && !operatorTeleportSettling) {
      camera.position.setX(Math.min(bounds.maxX, Math.max(bounds.minX, camera.position.x)));
      camera.position.setZ(Math.min(bounds.maxZ, Math.max(bounds.minZ, camera.position.z)));
    }

    if (moved) {
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

  return mode === 'fly'
    ? <OrbitControls ref={orbitControlsRef} enablePan enableZoom enableRotate maxDistance={500} enableDamping dampingFactor={0.05} />
    : (mode === 'walk' ? <PointerLockControls onUnlock={() => document.body.style.cursor = 'auto'} pointerSpeed={0.18} /> : null);
}

function logExpoWorldDebug(enabled: boolean, ...args: unknown[]) {
  if (enabled) {
    console.log(...args);
  }
}
