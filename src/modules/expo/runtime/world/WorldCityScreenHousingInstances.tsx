import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { CanonicalPrimitive, CityScreenSurface } from '../planning/types';
import {
  buildInstancedTransformMatrix,
  clearExpoInstancingTargetStats,
  publishExpoInstancingTargetStats,
} from './performance/expoInstancingUtils';
import {
  clearExpoRaycastOptimizationTargetStats,
  disableRaycastForNonInteractiveObject,
  publishExpoRaycastOptimizationTargetStats,
} from './performance/expoRaycastUtils';

type ScreenHousingBoxInstance = {
  id: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  size: [number, number, number];
};

type ScreenHousingBoxInstanceGroup = {
  instances: ScreenHousingBoxInstance[];
  key: string;
  material: {
    color: string;
    depthWrite: boolean;
    emissive?: string;
    emissiveIntensity: number;
    metalness: number;
    opacity?: number;
    polygonOffsetFactor: number;
    polygonOffsetUnits: number;
    roughness: number;
    transparent: boolean;
  };
};

const SCREEN_HOUSING_INSTANCING_TARGET_ID = 'screen-housing-box-primitives';

function isScreenHousingBoxPrimitive(primitive: CanonicalPrimitive): primitive is Extract<CanonicalPrimitive, { kind: 'box' }> {
  return primitive.kind === 'box';
}

function createMaterialKey(primitive: Extract<CanonicalPrimitive, { kind: 'box' }>) {
  const transparent = primitive.transparent === true;
  const material = {
    color: primitive.color,
    depthWrite: transparent ? false : true,
    emissive: primitive.emissive ?? '#000000',
    emissiveIntensity: primitive.emissiveIntensity ?? 0,
    metalness: primitive.metalness ?? 0.38,
    opacity: primitive.opacity ?? 1,
    polygonOffsetFactor: transparent ? -2 : 0,
    polygonOffsetUnits: transparent ? -2 : 0,
    roughness: primitive.roughness ?? 0.42,
    transparent,
  };

  return {
    key: [
      material.color,
      material.depthWrite ? 'dw1' : 'dw0',
      material.emissive,
      material.emissiveIntensity,
      material.metalness,
      material.opacity,
      material.polygonOffsetFactor,
      material.polygonOffsetUnits,
      material.roughness,
      material.transparent ? 't1' : 't0',
    ].join('|'),
    material,
  };
}

function buildScreenHousingBoxInstanceGroups(surfaces: CityScreenSurface[]) {
  const groups = new Map<string, ScreenHousingBoxInstanceGroup>();
  const surfaceMatrix = new THREE.Matrix4();
  const surfacePosition = new THREE.Vector3();
  const surfaceQuaternion = new THREE.Quaternion();
  const surfaceScale = new THREE.Vector3(1, 1, 1);
  const localMatrix = new THREE.Matrix4();
  const worldMatrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();

  surfaces.forEach((surface) => {
    surfacePosition.set(surface.position[0], surface.position[1], surface.position[2]);
    surfaceQuaternion.setFromEuler(new THREE.Euler(surface.rotation[0], surface.rotation[1], surface.rotation[2]));
    surfaceMatrix.compose(surfacePosition, surfaceQuaternion, surfaceScale);

    (surface.renderIntent?.primitives ?? []).forEach((primitive, primitiveIndex) => {
      if (!isScreenHousingBoxPrimitive(primitive)) {
        return;
      }

      const { key, material } = createMaterialKey(primitive);
      localMatrix.compose(
        new THREE.Vector3(primitive.position[0], primitive.position[1], primitive.position[2]),
        primitive.rotation
          ? new THREE.Quaternion().setFromEuler(new THREE.Euler(primitive.rotation[0], primitive.rotation[1], primitive.rotation[2]))
          : new THREE.Quaternion(),
        new THREE.Vector3(primitive.size[0], primitive.size[1], primitive.size[2]),
      );
      worldMatrix.multiplyMatrices(surfaceMatrix, localMatrix);
      worldMatrix.decompose(position, quaternion, scale);

      const group = groups.get(key) ?? {
        instances: [],
        key,
        material,
      };
      group.instances.push({
        id: `${surface.id}:screen-housing-box:${primitiveIndex}`,
        position: [position.x, position.y, position.z],
        rotation: new THREE.Euler().setFromQuaternion(quaternion).toArray().slice(0, 3) as [number, number, number],
        size: [scale.x, scale.y, scale.z],
      });
      groups.set(key, group);
    });
  });

  return [...groups.values()].filter((group) => group.instances.length > 0);
}

function ScreenHousingBoxInstancedGroup({ group }: { group: ScreenHousingBoxInstanceGroup }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const matrix = useMemo(() => new THREE.Matrix4(), []);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) {
      return;
    }

    group.instances.forEach((instance, index) => {
      mesh.setMatrixAt(index, buildInstancedTransformMatrix({
        position: instance.position,
        rotation: instance.rotation,
        scale: instance.size,
      }, matrix));
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();

    return disableRaycastForNonInteractiveObject(mesh, {
      reason: 'decorative instanced screen housing; sponsor hit planes and content remain separate',
      targetId: SCREEN_HOUSING_INSTANCING_TARGET_ID,
    });
  }, [group.instances, matrix]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, group.instances.length]}
      name={`world-city-screen-housing:instanced:${group.key}`}
      renderOrder={1}
      userData={{
        expoInstancingTarget: SCREEN_HOUSING_INSTANCING_TARGET_ID,
        expoInstancingInstanceCount: group.instances.length,
      }}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color={group.material.color}
        depthWrite={group.material.depthWrite}
        emissive={group.material.emissive}
        emissiveIntensity={group.material.emissiveIntensity}
        metalness={group.material.metalness}
        opacity={group.material.opacity}
        polygonOffset
        polygonOffsetFactor={group.material.polygonOffsetFactor}
        polygonOffsetUnits={group.material.polygonOffsetUnits}
        roughness={group.material.roughness}
        transparent={group.material.transparent}
        toneMapped={false}
      />
    </instancedMesh>
  );
}

export function WorldCityScreenHousingInstances({ surfaces }: { surfaces: CityScreenSurface[] }) {
  const groups = useMemo(() => buildScreenHousingBoxInstanceGroups(surfaces), [surfaces]);
  const replacedMeshCount = useMemo(
    () => groups.reduce((total, group) => total + group.instances.length, 0),
    [groups],
  );

  useLayoutEffect(() => {
    publishExpoInstancingTargetStats({
      estimatedDrawCallReduction: Math.max(0, replacedMeshCount - groups.length),
      instanceCount: replacedMeshCount,
      instancedMeshCount: groups.length,
      label: 'screen housing box primitives',
      replacedMeshCount,
      targetId: SCREEN_HOUSING_INSTANCING_TARGET_ID,
    });
    publishExpoRaycastOptimizationTargetStats({
      label: 'screen housing box primitives',
      objectCount: groups.length,
      preservedInteractionPaths: [
        'world-city-screen assignment groups',
        'world-city-screen-surface hit planes',
        'district booth groups',
      ],
      reason: 'decorative housing buckets have no click, hover, analytics, content texture, or collision role',
      targetId: SCREEN_HOUSING_INSTANCING_TARGET_ID,
    });

    return () => {
      clearExpoInstancingTargetStats(SCREEN_HOUSING_INSTANCING_TARGET_ID);
      clearExpoRaycastOptimizationTargetStats(SCREEN_HOUSING_INSTANCING_TARGET_ID);
    };
  }, [groups.length, replacedMeshCount]);

  if (replacedMeshCount === 0) {
    return null;
  }

  return (
    <group name="world-city-screen-housing:instanced-boxes">
      {groups.map((group) => (
        <ScreenHousingBoxInstancedGroup key={group.key} group={group} />
      ))}
    </group>
  );
}
