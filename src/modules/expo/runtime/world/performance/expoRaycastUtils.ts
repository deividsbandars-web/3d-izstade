import * as THREE from 'three';

export type ExpoRaycastOptimizationTargetStats = {
  label: string;
  objectCount: number;
  preservedInteractionPaths: string[];
  reason: string;
  targetId: string;
};

export type ExpoRaycastOptimizationRuntimeStats = {
  optimizedObjectCount: number;
  optimizedTargetCount: number;
  optimizedTargetIds: string[];
  targets: ExpoRaycastOptimizationTargetStats[];
  updatedAt: number | null;
};

const noopRaycast: THREE.Object3D['raycast'] = () => undefined;
const targetStats = new Map<string, ExpoRaycastOptimizationTargetStats>();

let cachedStats: ExpoRaycastOptimizationRuntimeStats = {
  optimizedObjectCount: 0,
  optimizedTargetCount: 0,
  optimizedTargetIds: [],
  targets: [],
  updatedAt: null,
};

function refreshCachedRaycastStats() {
  const targets = [...targetStats.values()].sort((left, right) => left.targetId.localeCompare(right.targetId));
  cachedStats = {
    optimizedObjectCount: targets.reduce((total, target) => total + target.objectCount, 0),
    optimizedTargetCount: targets.length,
    optimizedTargetIds: targets.map((target) => target.targetId),
    targets,
    updatedAt: typeof performance !== 'undefined' ? performance.now() : Date.now(),
  };
}

export function disableRaycastForNonInteractiveObject(
  object: THREE.Object3D,
  metadata: {
    reason: string;
    targetId: string;
  },
) {
  const originalRaycast = object.raycast;
  object.raycast = noopRaycast;
  object.userData.expoRaycastDisabled = true;
  object.userData.expoRaycastOptimizationReason = metadata.reason;
  object.userData.expoRaycastOptimizationTarget = metadata.targetId;

  return () => {
    if (object.raycast === noopRaycast) {
      object.raycast = originalRaycast;
    }
    if (object.userData.expoRaycastOptimizationTarget === metadata.targetId) {
      delete object.userData.expoRaycastDisabled;
      delete object.userData.expoRaycastOptimizationReason;
      delete object.userData.expoRaycastOptimizationTarget;
    }
  };
}

export function publishExpoRaycastOptimizationTargetStats(stats: ExpoRaycastOptimizationTargetStats) {
  targetStats.set(stats.targetId, stats);
  refreshCachedRaycastStats();
}

export function clearExpoRaycastOptimizationTargetStats(targetId: string) {
  targetStats.delete(targetId);
  refreshCachedRaycastStats();
}

export function getExpoRaycastOptimizationRuntimeStats() {
  return cachedStats;
}
