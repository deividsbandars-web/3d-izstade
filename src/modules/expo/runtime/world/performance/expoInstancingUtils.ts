import * as THREE from 'three';

export type ExpoInstancingTargetStats = {
  estimatedDrawCallReduction: number;
  instanceCount: number;
  instancedMeshCount?: number;
  label: string;
  replacedMeshCount: number;
  targetId: string;
};

export type ExpoInstancingRuntimeStats = {
  estimatedDrawCallReduction: number;
  instancedGroupCount: number;
  optimizedTargetIds: string[];
  replacedMeshCount: number;
  targets: ExpoInstancingTargetStats[];
  updatedAt: number | null;
};

type InstancedTransformInput = {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale: [number, number, number];
};

const identityQuaternion = new THREE.Quaternion();
const targetStats = new Map<string, ExpoInstancingTargetStats>();

let cachedStats: ExpoInstancingRuntimeStats = {
  estimatedDrawCallReduction: 0,
  instancedGroupCount: 0,
  optimizedTargetIds: [],
  replacedMeshCount: 0,
  targets: [],
  updatedAt: null,
};

function refreshCachedInstancingStats() {
  const targets = [...targetStats.values()].sort((left, right) => left.targetId.localeCompare(right.targetId));
  cachedStats = {
    estimatedDrawCallReduction: targets.reduce((total, target) => total + target.estimatedDrawCallReduction, 0),
    instancedGroupCount: targets.reduce((total, target) => total + (target.instancedMeshCount ?? 1), 0),
    optimizedTargetIds: targets.map((target) => target.targetId),
    replacedMeshCount: targets.reduce((total, target) => total + target.replacedMeshCount, 0),
    targets,
    updatedAt: typeof performance !== 'undefined' ? performance.now() : Date.now(),
  };
}

export function buildInstancedTransformMatrix(
  input: InstancedTransformInput,
  target = new THREE.Matrix4(),
) {
  const position = new THREE.Vector3(input.position[0], input.position[1], input.position[2]);
  const scale = new THREE.Vector3(input.scale[0], input.scale[1], input.scale[2]);
  const quaternion = input.rotation
    ? new THREE.Quaternion().setFromEuler(new THREE.Euler(input.rotation[0], input.rotation[1], input.rotation[2]))
    : identityQuaternion;

  return target.compose(position, quaternion, scale);
}

export function publishExpoInstancingTargetStats(stats: ExpoInstancingTargetStats) {
  targetStats.set(stats.targetId, stats);
  refreshCachedInstancingStats();
}

export function clearExpoInstancingTargetStats(targetId: string) {
  targetStats.delete(targetId);
  refreshCachedInstancingStats();
}

export function getExpoInstancingRuntimeStats() {
  return cachedStats;
}
