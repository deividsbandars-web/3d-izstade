/* eslint-disable react-refresh/only-export-components */
import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

function setSceneUserData(scene: THREE.Scene, key: string, value: unknown) {
  scene.userData[key] = value;
}

const PLAYER_COLLIDER_ROOTS_KEY = 'playerCollisionRoots';
const PLAYER_COLLIDER_FLAG = 'playerCollider';
const DISABLE_PLAYER_COLLISION_FLAG = 'disablePlayerCollision';
const PLAYER_COLLISION_TARGETS_CACHE_KEY = 'playerCollisionTargetsCache';
const PLAYER_COLLISION_TARGETS_CACHE_VERSION_KEY = 'playerCollisionTargetsCacheVersion';
const PLAYER_COLLISION_TARGETS_CACHE_RESOLVED_VERSION_KEY = 'playerCollisionTargetsCacheResolvedVersion';
const UNIFIED_WORLD_TONE = '#587a8c';
export const EXPO_START_VIEW_KEY = 'expoStartView';

const SURFACE_TONES = {
  concrete: '#6f8fa3',
  grass: '#4f9a7a',
  paver: '#8ab0c3',
} as const;

function getPlayerCollisionTargetsVersion(scene: THREE.Scene) {
  const version = Number(scene.userData[PLAYER_COLLISION_TARGETS_CACHE_VERSION_KEY]);
  return Number.isFinite(version) ? version : 0;
}

function markPlayerCollisionCacheDirty(scene: THREE.Scene) {
  setSceneUserData(scene, PLAYER_COLLISION_TARGETS_CACHE_VERSION_KEY, getPlayerCollisionTargetsVersion(scene) + 1);
  setSceneUserData(scene, PLAYER_COLLISION_TARGETS_CACHE_KEY, null);
  setSceneUserData(scene, PLAYER_COLLISION_TARGETS_CACHE_RESOLVED_VERSION_KEY, -1);
}

export function isCollisionMesh(object: THREE.Object3D) {
  return Boolean((object as THREE.Mesh).isMesh || (object as THREE.InstancedMesh).isInstancedMesh);
}

function getPlayerColliderRoots(scene: THREE.Scene): THREE.Object3D[] {
  const roots = scene.userData[PLAYER_COLLIDER_ROOTS_KEY];
  if (!Array.isArray(roots)) {
    return [];
  }

  return roots.filter((root): root is THREE.Object3D => Boolean(root && typeof (root as THREE.Object3D).traverse === 'function'));
}

function isCollisionDisabled(object: THREE.Object3D, boundaryRoot: THREE.Object3D) {
  let current: THREE.Object3D | null = object;

  while (current) {
    if (current.userData?.[DISABLE_PLAYER_COLLISION_FLAG] === true) {
      return true;
    }
    if (current === boundaryRoot) {
      break;
    }
    current = current.parent;
  }

  return false;
}

function registerPlayerColliderRoot(scene: THREE.Scene, root: THREE.Object3D | null, label: string) {
  if (!root) {
    return;
  }

  root.userData[PLAYER_COLLIDER_FLAG] = true;
  root.userData.playerColliderLabel = label;

  const roots = getPlayerColliderRoots(scene);
  if (!roots.includes(root)) {
    setSceneUserData(scene, PLAYER_COLLIDER_ROOTS_KEY, [...roots, root]);
    markPlayerCollisionCacheDirty(scene);
  }
}

function unregisterPlayerColliderRoot(scene: THREE.Scene, root: THREE.Object3D | null) {
  if (!root) {
    return;
  }

  root.userData[PLAYER_COLLIDER_FLAG] = false;
  const roots = getPlayerColliderRoots(scene).filter((entry) => entry !== root);
  setSceneUserData(scene, PLAYER_COLLIDER_ROOTS_KEY, roots);
  markPlayerCollisionCacheDirty(scene);
}

export function collectPlayerCollisionTargets(scene: THREE.Scene) {
  const cacheVersion = getPlayerCollisionTargetsVersion(scene);
  const cachedTargets = scene.userData[PLAYER_COLLISION_TARGETS_CACHE_KEY];
  const resolvedVersion = Number(scene.userData[PLAYER_COLLISION_TARGETS_CACHE_RESOLVED_VERSION_KEY]);
  if (Array.isArray(cachedTargets) && resolvedVersion === cacheVersion) {
    return cachedTargets as THREE.Object3D[];
  }

  const targets = new Set<THREE.Object3D>();

  getPlayerColliderRoots(scene).forEach((root) => {
    if (!root.visible || root.userData?.[DISABLE_PLAYER_COLLISION_FLAG] === true) {
      return;
    }

    root.traverse((child) => {
      if (!child.visible || isCollisionDisabled(child, root) || !isCollisionMesh(child)) {
        return;
      }

      targets.add(child);
    });
  });

  const resolvedTargets = Array.from(targets);
  setSceneUserData(scene, PLAYER_COLLISION_TARGETS_CACHE_KEY, resolvedTargets);
  setSceneUserData(scene, PLAYER_COLLISION_TARGETS_CACHE_RESOLVED_VERSION_KEY, cacheVersion);
  return resolvedTargets;
}

export function usePlayerColliderRegistration<T extends THREE.Object3D>(ref: React.RefObject<T | null>, label: string) {
  const { scene } = useThree();

  useEffect(() => {
    const root = ref.current;
    registerPlayerColliderRoot(scene, root, label);

    return () => {
      unregisterPlayerColliderRoot(scene, root);
    };
  }, [label, ref, scene]);
}

export function ColliderMaterial({ debug, color }: { debug?: boolean; color: string }) {
  return (
    <meshBasicMaterial
      color={color}
      transparent
      opacity={debug ? 0.18 : 0}
      depthWrite={false}
      toneMapped={false}
    />
  );
}

export function ExpoRuntimeSurfaceMaterial({
  fallbackColor,
  repeat: _repeat,
  surface,
  polygonOffsetFactor = -1,
  polygonOffsetUnits = -1,
}: {
  fallbackColor: string;
  repeat: [number, number];
  surface: 'concrete' | 'paver' | 'grass';
  polygonOffsetFactor?: number;
  polygonOffsetUnits?: number;
}) {
  const color = fallbackColor === UNIFIED_WORLD_TONE ? SURFACE_TONES[surface] : fallbackColor;
  const roughness = 0.88;

  return (
    <meshStandardMaterial
      color={color}
      roughness={roughness}
      metalness={0.018}
      emissive={surface === 'grass' ? '#5eead4' : '#5ee7ff'}
      emissiveIntensity={surface === 'grass' ? 0.012 : 0.01}
      polygonOffset
      polygonOffsetFactor={polygonOffsetFactor}
      polygonOffsetUnits={polygonOffsetUnits}
    />
  );
}

export function ExpoArchitecturalMassMaterial({
  fallbackColor: _fallbackColor,
  repeat: _repeat = [1.8, 1.8],
  surface: _surface = 'concrete',
  emissive = '#000000',
  emissiveIntensity = 0,
}: {
  fallbackColor: string;
  repeat?: [number, number];
  surface?: 'concrete' | 'paver';
  emissive?: string;
  emissiveIntensity?: number;
}) {
  const color = UNIFIED_WORLD_TONE;
  const materialEmissive = emissiveIntensity > 0 ? emissive : '#5ee7ff';
  const materialEmissiveIntensity = emissiveIntensity > 0 ? emissiveIntensity : 0.012;

  return (
    <meshStandardMaterial
      color={color}
      roughness={0.84}
      metalness={0.02}
      emissive={materialEmissive}
      emissiveIntensity={materialEmissiveIntensity}
    />
  );
}
