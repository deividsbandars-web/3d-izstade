import { useLayoutEffect, useMemo, useRef } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { Vector3Tuple } from 'three';

export type GalaConstructionBoxProps = {
  castShadow?: boolean;
  clearcoat?: number;
  clearcoatRoughness?: number;
  color: string;
  envMapIntensity?: number;
  metalness?: number;
  name: string;
  onClick?: (event: ThreeEvent<MouseEvent>) => void;
  opacity?: number;
  position: Vector3Tuple;
  receiveShadow?: boolean;
  roughness?: number;
  size: Vector3Tuple;
  userData?: Record<string, unknown>;
};

export type GalaConstructionCylinderProps = {
  castShadow?: boolean;
  clearcoat?: number;
  clearcoatRoughness?: number;
  color: string;
  envMapIntensity?: number;
  height: number;
  metalness?: number;
  name: string;
  opacity?: number;
  position: Vector3Tuple;
  radialSegments?: number;
  radiusBottom: number;
  radiusTop: number;
  receiveShadow?: boolean;
  rotation?: Vector3Tuple;
  roughness?: number;
  scale?: Vector3Tuple;
  userData?: Record<string, unknown>;
};

export type GalaConstructionBoxInstance = {
  position: Vector3Tuple;
  size: Vector3Tuple;
};

export type GalaConstructionInstancedBoxesProps = {
  castShadow?: boolean;
  clearcoat?: number;
  clearcoatRoughness?: number;
  color: string;
  envMapIntensity?: number;
  instances: readonly GalaConstructionBoxInstance[];
  metalness?: number;
  name: string;
  opacity?: number;
  receiveShadow?: boolean;
  roughness?: number;
  userData?: Record<string, unknown>;
};

function buildConstructionLocalBounds(position: Vector3Tuple, size: Vector3Tuple) {
  return {
    center: { x: position[0], y: position[1], z: position[2] },
    max: {
      x: position[0] + size[0] * 0.5,
      y: position[1] + size[1] * 0.5,
      z: position[2] + size[2] * 0.5,
    },
    min: {
      x: position[0] - size[0] * 0.5,
      y: position[1] - size[1] * 0.5,
      z: position[2] - size[2] * 0.5,
    },
    size: { x: size[0], y: size[1], z: size[2] },
  };
}

export function GalaConstructionBox({
  castShadow = true,
  clearcoat = 0,
  clearcoatRoughness = 0,
  color,
  envMapIntensity = 1,
  metalness = 0.02,
  name,
  onClick,
  opacity = 1,
  position,
  receiveShadow = true,
  roughness = 0.78,
  size,
  userData,
}: GalaConstructionBoxProps) {
  return (
    <mesh
      castShadow={castShadow}
      name={name}
      onClick={onClick}
      position={position}
      receiveShadow={receiveShadow}
      userData={{
        constructionLocalBounds: buildConstructionLocalBounds(position, size),
        constructionLocalPosition: position,
        constructionLocalSize: size,
        constructionRendererReset: true,
        ...userData,
      }}
    >
      <boxGeometry args={size} />
      <meshPhysicalMaterial
        clearcoat={clearcoat}
        clearcoatRoughness={clearcoatRoughness}
        color={color}
        envMapIntensity={envMapIntensity}
        metalness={metalness}
        opacity={opacity}
        roughness={roughness}
        transparent={opacity < 1}
      />
    </mesh>
  );
}

export function GalaConstructionInstancedBoxes({
  castShadow = false,
  clearcoat = 0,
  clearcoatRoughness = 0,
  color,
  envMapIntensity = 1,
  instances,
  metalness = 0.02,
  name,
  opacity = 1,
  receiveShadow = true,
  roughness = 0.78,
  userData,
}: GalaConstructionInstancedBoxesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const matrices = useMemo(() => instances.map((instance) => {
    const matrix = new THREE.Matrix4();
    matrix.compose(
      new THREE.Vector3(...instance.position),
      new THREE.Quaternion(),
      new THREE.Vector3(...instance.size),
    );
    return matrix;
  }), [instances]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) {
      return;
    }

    matrices.forEach((matrix, index) => mesh.setMatrixAt(index, matrix));
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [matrices]);

  if (instances.length === 0) {
    return null;
  }

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, instances.length]}
      castShadow={castShadow}
      name={name}
      receiveShadow={receiveShadow}
      userData={{
        constructionRendererReset: true,
        instanceCount: instances.length,
        instancedConstructionBoxes: true,
        ...userData,
      }}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshPhysicalMaterial
        clearcoat={clearcoat}
        clearcoatRoughness={clearcoatRoughness}
        color={color}
        envMapIntensity={envMapIntensity}
        metalness={metalness}
        opacity={opacity}
        roughness={roughness}
        transparent={opacity < 1}
      />
    </instancedMesh>
  );
}

export function GalaConstructionCylinder({
  castShadow = true,
  clearcoat = 0,
  clearcoatRoughness = 0,
  color,
  envMapIntensity = 1,
  height,
  metalness = 0.02,
  name,
  opacity = 1,
  position,
  radialSegments = 20,
  radiusBottom,
  radiusTop,
  receiveShadow = true,
  rotation,
  roughness = 0.72,
  scale,
  userData,
}: GalaConstructionCylinderProps) {
  const radius = Math.max(radiusTop, radiusBottom);
  const scaledSize: Vector3Tuple = [
    radius * 2 * (scale?.[0] ?? 1),
    height * (scale?.[1] ?? 1),
    radius * 2 * (scale?.[2] ?? 1),
  ];
  const quarterTurnX = rotation && Math.abs(Math.abs(rotation[0]) - Math.PI * 0.5) < 0.001;
  const localSize: Vector3Tuple = quarterTurnX
    ? [scaledSize[0], scaledSize[2], scaledSize[1]]
    : scaledSize;

  return (
    <mesh
      castShadow={castShadow}
      name={name}
      position={position}
      receiveShadow={receiveShadow}
      rotation={rotation}
      scale={scale}
      userData={{
        constructionLocalBounds: buildConstructionLocalBounds(position, localSize),
        constructionLocalPosition: position,
        constructionLocalSize: localSize,
        constructionRendererReset: true,
        ...userData,
      }}
    >
      <cylinderGeometry args={[radiusTop, radiusBottom, height, radialSegments]} />
      <meshPhysicalMaterial
        clearcoat={clearcoat}
        clearcoatRoughness={clearcoatRoughness}
        color={color}
        envMapIntensity={envMapIntensity}
        metalness={metalness}
        opacity={opacity}
        roughness={roughness}
        transparent={opacity < 1}
      />
    </mesh>
  );
}
