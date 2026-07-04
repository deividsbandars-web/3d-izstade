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
const PLAYER_COLLISION_DYNAMIC_FLAG = 'playerCollisionDynamic';
const PLAYER_COLLISION_TARGETS_CACHE_KEY = 'playerCollisionTargetsCache';
const PLAYER_COLLISION_TARGETS_CACHE_VERSION_KEY = 'playerCollisionTargetsCacheVersion';
const PLAYER_COLLISION_TARGETS_CACHE_RESOLVED_VERSION_KEY = 'playerCollisionTargetsCacheResolvedVersion';
const PLAYER_COLLISION_BROADPHASE_CACHE_KEY = 'playerCollisionBroadphaseCache';
const PLAYER_COLLISION_BROADPHASE_CACHE_VERSION_KEY = 'playerCollisionBroadphaseCacheVersion';
const PLAYER_COLLISION_BROADPHASE_CELL_SIZE = 24;
const UNIFIED_WORLD_TONE = '#30475f';
export const EXPO_START_VIEW_KEY = 'expoStartView';

type PlayerColliderRegistrationOptions = {
  dynamic?: boolean;
};

type PlayerCollisionBroadphaseCache = {
  cacheVersion: number;
  cellSize: number;
  cells: Map<string, THREE.Object3D[]>;
  dynamicTargets: THREE.Object3D[];
  indexedTargetCount: number;
  targetCount: number;
};

export type PlayerCollisionBroadphaseRuntimeStats = {
  cacheVersion: number;
  candidateCount: number;
  cellCount: number;
  dynamicTargetCount: number;
  indexedTargetCount: number;
  playerPosition: [number, number, number] | null;
  queryRadius: number;
  targetCount: number;
  updatedAt: number | null;
};

let cachedPlayerCollisionBroadphaseStats: PlayerCollisionBroadphaseRuntimeStats = {
  cacheVersion: 0,
  candidateCount: 0,
  cellCount: 0,
  dynamicTargetCount: 0,
  indexedTargetCount: 0,
  playerPosition: null,
  queryRadius: 0,
  targetCount: 0,
  updatedAt: null,
};

const SURFACE_TONES = {
  concrete: '#3b536e',
  grass: '#2f674f',
  paver: '#4b4f76',
} as const;

function getPlayerCollisionTargetsVersion(scene: THREE.Scene) {
  const version = Number(scene.userData[PLAYER_COLLISION_TARGETS_CACHE_VERSION_KEY]);
  return Number.isFinite(version) ? version : 0;
}

function markPlayerCollisionCacheDirty(scene: THREE.Scene) {
  setSceneUserData(scene, PLAYER_COLLISION_TARGETS_CACHE_VERSION_KEY, getPlayerCollisionTargetsVersion(scene) + 1);
  setSceneUserData(scene, PLAYER_COLLISION_TARGETS_CACHE_KEY, null);
  setSceneUserData(scene, PLAYER_COLLISION_TARGETS_CACHE_RESOLVED_VERSION_KEY, -1);
  setSceneUserData(scene, PLAYER_COLLISION_BROADPHASE_CACHE_KEY, null);
  setSceneUserData(scene, PLAYER_COLLISION_BROADPHASE_CACHE_VERSION_KEY, -1);
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

export function registerPlayerColliderRoot(
  scene: THREE.Scene,
  root: THREE.Object3D | null,
  label: string,
  options: PlayerColliderRegistrationOptions = {},
) {
  if (!root) {
    return;
  }

  root.userData[PLAYER_COLLIDER_FLAG] = true;
  root.userData[PLAYER_COLLISION_DYNAMIC_FLAG] = options.dynamic === true;
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
  delete root.userData[PLAYER_COLLISION_DYNAMIC_FLAG];
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

const getPlayerCollisionCellCoord = (value: number) => Math.floor(value / PLAYER_COLLISION_BROADPHASE_CELL_SIZE);

const getPlayerCollisionCellKey = (cellX: number, cellZ: number) => `${cellX}:${cellZ}`;

const isFiniteCollisionBounds = (bounds: THREE.Box3) => {
  return Number.isFinite(bounds.min.x)
    && Number.isFinite(bounds.min.z)
    && Number.isFinite(bounds.max.x)
    && Number.isFinite(bounds.max.z)
    && !bounds.isEmpty();
};

const isDynamicCollisionTarget = (target: THREE.Object3D) => {
  let current: THREE.Object3D | null = target;

  while (current) {
    if (current.userData?.[PLAYER_COLLISION_DYNAMIC_FLAG] === true) {
      return true;
    }
    if (current.userData?.[PLAYER_COLLIDER_FLAG] === true) {
      return false;
    }
    current = current.parent;
  }

  return false;
};

function buildPlayerCollisionBroadphase(scene: THREE.Scene, targets: THREE.Object3D[], cacheVersion: number) {
  const cells = new Map<string, THREE.Object3D[]>();
  const dynamicTargets: THREE.Object3D[] = [];
  const targetBounds = new THREE.Box3();
  let indexedTargetCount = 0;

  targets.forEach((target) => {
    if (isDynamicCollisionTarget(target)) {
      dynamicTargets.push(target);
      return;
    }

    target.updateWorldMatrix(true, false);
    targetBounds.setFromObject(target);
    if (!isFiniteCollisionBounds(targetBounds)) {
      dynamicTargets.push(target);
      return;
    }

    const minCellX = getPlayerCollisionCellCoord(targetBounds.min.x);
    const maxCellX = getPlayerCollisionCellCoord(targetBounds.max.x);
    const minCellZ = getPlayerCollisionCellCoord(targetBounds.min.z);
    const maxCellZ = getPlayerCollisionCellCoord(targetBounds.max.z);

    for (let cellX = minCellX; cellX <= maxCellX; cellX += 1) {
      for (let cellZ = minCellZ; cellZ <= maxCellZ; cellZ += 1) {
        const key = getPlayerCollisionCellKey(cellX, cellZ);
        const cellTargets = cells.get(key);
        if (cellTargets) {
          cellTargets.push(target);
        } else {
          cells.set(key, [target]);
        }
      }
    }

    indexedTargetCount += 1;
  });

  const broadphase: PlayerCollisionBroadphaseCache = {
    cacheVersion,
    cellSize: PLAYER_COLLISION_BROADPHASE_CELL_SIZE,
    cells,
    dynamicTargets,
    indexedTargetCount,
    targetCount: targets.length,
  };

  setSceneUserData(scene, PLAYER_COLLISION_BROADPHASE_CACHE_KEY, broadphase);
  setSceneUserData(scene, PLAYER_COLLISION_BROADPHASE_CACHE_VERSION_KEY, cacheVersion);
  return broadphase;
}

function getPlayerCollisionBroadphase(scene: THREE.Scene) {
  const cacheVersion = getPlayerCollisionTargetsVersion(scene);
  const cachedBroadphase = scene.userData[PLAYER_COLLISION_BROADPHASE_CACHE_KEY] as PlayerCollisionBroadphaseCache | null | undefined;
  const resolvedVersion = Number(scene.userData[PLAYER_COLLISION_BROADPHASE_CACHE_VERSION_KEY]);

  if (cachedBroadphase && resolvedVersion === cacheVersion && cachedBroadphase.cacheVersion === cacheVersion) {
    return cachedBroadphase;
  }

  return buildPlayerCollisionBroadphase(scene, collectPlayerCollisionTargets(scene), cacheVersion);
}

function publishPlayerCollisionBroadphaseStats(
  broadphase: PlayerCollisionBroadphaseCache,
  candidates: THREE.Object3D[],
  position: THREE.Vector3,
  queryRadius: number,
) {
  cachedPlayerCollisionBroadphaseStats = {
    cacheVersion: broadphase.cacheVersion,
    candidateCount: candidates.length,
    cellCount: broadphase.cells.size,
    dynamicTargetCount: broadphase.dynamicTargets.length,
    indexedTargetCount: broadphase.indexedTargetCount,
    playerPosition: [position.x, position.y, position.z],
    queryRadius,
    targetCount: broadphase.targetCount,
    updatedAt: typeof performance !== 'undefined' ? performance.now() : Date.now(),
  };
}

export function queryNearbyPlayerCollisionTargets(scene: THREE.Scene, position: THREE.Vector3, queryRadius: number) {
  const broadphase = getPlayerCollisionBroadphase(scene);
  const radius = Math.max(0, queryRadius);
  const minCellX = getPlayerCollisionCellCoord(position.x - radius);
  const maxCellX = getPlayerCollisionCellCoord(position.x + radius);
  const minCellZ = getPlayerCollisionCellCoord(position.z - radius);
  const maxCellZ = getPlayerCollisionCellCoord(position.z + radius);
  const candidateSet = new Set<THREE.Object3D>(broadphase.dynamicTargets);

  for (let cellX = minCellX; cellX <= maxCellX; cellX += 1) {
    for (let cellZ = minCellZ; cellZ <= maxCellZ; cellZ += 1) {
      const cellTargets = broadphase.cells.get(getPlayerCollisionCellKey(cellX, cellZ));
      if (!cellTargets) {
        continue;
      }
      cellTargets.forEach((target) => candidateSet.add(target));
    }
  }

  const candidates = Array.from(candidateSet);
  publishPlayerCollisionBroadphaseStats(broadphase, candidates, position, radius);
  return candidates;
}

export function getPlayerCollisionBroadphaseRuntimeStats() {
  return cachedPlayerCollisionBroadphaseStats;
}

export function usePlayerColliderRegistration<T extends THREE.Object3D>(
  ref: React.RefObject<T | null>,
  label: string,
  options: PlayerColliderRegistrationOptions = {},
) {
  const { scene } = useThree();
  const dynamic = options.dynamic === true;

  useEffect(() => {
    const root = ref.current;
    registerPlayerColliderRoot(scene, root, label, { dynamic });

    return () => {
      unregisterPlayerColliderRoot(scene, root);
    };
  }, [dynamic, label, ref, scene]);
}

export function ColliderMaterial({ debug, color }: { debug?: boolean; color: string }) {
  return (
    <meshBasicMaterial
      color={color}
      transparent
      opacity={debug ? 0.18 : 0}
      depthWrite={false}
      toneMapped={false}
      visible={Boolean(debug)}
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
      emissive={surface === 'grass' ? '#2dd4bf' : '#22e7ff'}
      emissiveIntensity={surface === 'grass' ? 0.014 : 0.012}
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
  const materialEmissive = emissiveIntensity > 0 ? emissive : '#22e7ff';
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
