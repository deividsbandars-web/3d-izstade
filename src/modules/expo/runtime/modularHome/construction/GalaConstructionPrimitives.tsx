import { useLayoutEffect, useMemo, useRef } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { Vector3Tuple } from 'three';
import type { GalaConstructionPbrMapProps } from './GalaConstructionPbrTextures';

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
} & GalaConstructionPbrMapProps;

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
} & GalaConstructionPbrMapProps;

type GalaConstructionMaterialProps = GalaConstructionPbrMapProps & {
  clearcoat: number;
  clearcoatRoughness: number;
  color: string;
  envMapIntensity: number;
  metalness: number;
  opacity: number;
  roughness: number;
};

function applyTriplanarShader(material: THREE.MeshPhysicalMaterial, triplanarScale: number) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.galaTriplanarScale = { value: triplanarScale };
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
varying vec3 vGalaWorldPosition;
varying vec3 vGalaWorldNormal;`,
      )
      .replace(
        '#include <defaultnormal_vertex>',
        `#include <defaultnormal_vertex>
vGalaWorldNormal = normalize( inverseTransformDirection( transformedNormal, viewMatrix ) );`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
vec4 galaTriplanarPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
  galaTriplanarPosition = batchingMatrix * galaTriplanarPosition;
#endif
#ifdef USE_INSTANCING
  galaTriplanarPosition = instanceMatrix * galaTriplanarPosition;
#endif
vGalaWorldPosition = ( modelMatrix * galaTriplanarPosition ).xyz;`,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
uniform float galaTriplanarScale;
varying vec3 vGalaWorldPosition;
varying vec3 vGalaWorldNormal;

vec3 galaTriplanarWeights() {
  vec3 weights = pow( abs( normalize( vGalaWorldNormal ) ), vec3( 8.0 ) );
  return weights / max( weights.x + weights.y + weights.z, 0.0001 );
}

vec4 galaTriplanarSample( sampler2D sourceMap ) {
  vec3 scaledPosition = vGalaWorldPosition * galaTriplanarScale;
  vec3 weights = galaTriplanarWeights();
  vec4 xProjection = texture2D( sourceMap, scaledPosition.zy );
  vec4 yProjection = texture2D( sourceMap, scaledPosition.xz );
  vec4 zProjection = texture2D( sourceMap, scaledPosition.xy );
  return ( xProjection * weights.x ) + ( yProjection * weights.y ) + ( zProjection * weights.z );
}`,
      )
      .replace(
        '#include <map_fragment>',
        `#ifdef USE_MAP
  diffuseColor *= galaTriplanarSample( map );
#endif`,
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#ifdef USE_NORMALMAP_TANGENTSPACE
  vec3 weights = galaTriplanarWeights();
  vec3 scaledPosition = vGalaWorldPosition * galaTriplanarScale;
  vec3 normalX = texture2D( normalMap, scaledPosition.zy ).xyz * 2.0 - 1.0;
  vec3 normalY = texture2D( normalMap, scaledPosition.xz ).xyz * 2.0 - 1.0;
  vec3 normalZ = texture2D( normalMap, scaledPosition.xy ).xyz * 2.0 - 1.0;
  normalX.xy *= normalScale;
  normalY.xy *= normalScale;
  normalZ.xy *= normalScale;
  vec3 axisSign = sign( vGalaWorldNormal );
  vec3 worldNormalX = vec3( normalX.z * axisSign.x, normalX.y, -normalX.x * axisSign.x );
  vec3 worldNormalY = vec3( normalY.x, normalY.z * axisSign.y, -normalY.y * axisSign.y );
  vec3 worldNormalZ = vec3( normalZ.x * axisSign.z, normalZ.y, normalZ.z * axisSign.z );
  vec3 triplanarNormal = normalize(
    worldNormalX * weights.x
    + worldNormalY * weights.y
    + worldNormalZ * weights.z
  );
  normal = normalize( ( viewMatrix * vec4( triplanarNormal, 0.0 ) ).xyz );
#endif`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
  roughnessFactor *= galaTriplanarSample( roughnessMap ).g;
#endif`,
      )
      .replace(
        '#include <metalnessmap_fragment>',
        `float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
  metalnessFactor *= galaTriplanarSample( metalnessMap ).b;
#endif`,
      )
      .replace(
        '#include <aomap_fragment>',
        `#ifdef USE_AOMAP
  float ambientOcclusion = ( galaTriplanarSample( aoMap ).r - 1.0 ) * aoMapIntensity + 1.0;
  reflectedLight.indirectDiffuse *= ambientOcclusion;
  #if defined( USE_CLEARCOAT )
    clearcoatSpecularIndirect *= ambientOcclusion;
  #endif
  #if defined( USE_SHEEN )
    sheenSpecularIndirect *= ambientOcclusion;
  #endif
  #if defined( USE_ENVMAP ) && defined( STANDARD )
    float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
    reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
  #endif
#endif`,
      );
  };
  material.customProgramCacheKey = () => 'gala-construction-triplanar-pbr-v1';
  material.needsUpdate = true;
}

function GalaConstructionMaterial({
  aoMap,
  aoMapIntensity = 1,
  clearcoat,
  clearcoatRoughness,
  color,
  envMapIntensity,
  map,
  metalness,
  metalnessMap,
  normalMap,
  normalScale,
  opacity,
  roughness,
  roughnessMap,
  triplanarScale,
}: GalaConstructionMaterialProps) {
  const materialRef = useRef<THREE.MeshPhysicalMaterial>(null);

  useLayoutEffect(() => {
    const material = materialRef.current;
    if (!material || !triplanarScale || !map || !normalMap || !aoMap || !roughnessMap || !metalnessMap) {
      return;
    }

    applyTriplanarShader(material, triplanarScale);
  }, [aoMap, map, metalnessMap, normalMap, roughnessMap, triplanarScale]);

  return (
    <meshPhysicalMaterial
      ref={materialRef}
      aoMap={aoMap}
      aoMapIntensity={aoMapIntensity}
      clearcoat={clearcoat}
      clearcoatRoughness={clearcoatRoughness}
      color={color}
      envMapIntensity={envMapIntensity}
      map={map}
      metalness={metalness}
      metalnessMap={metalnessMap}
      normalMap={normalMap}
      normalScale={normalScale}
      opacity={opacity}
      roughness={roughness}
      roughnessMap={roughnessMap}
      transparent={opacity < 1}
    />
  );
}

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
  aoMap,
  aoMapIntensity,
  castShadow = true,
  clearcoat = 0,
  clearcoatRoughness = 0,
  color,
  envMapIntensity = 1,
  map,
  metalness = 0.02,
  metalnessMap,
  name,
  onClick,
  opacity = 1,
  position,
  receiveShadow = true,
  roughness = 0.78,
  roughnessMap,
  size,
  normalMap,
  normalScale,
  triplanarScale,
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
      <GalaConstructionMaterial
        aoMap={aoMap}
        aoMapIntensity={aoMapIntensity}
        clearcoat={clearcoat}
        clearcoatRoughness={clearcoatRoughness}
        color={color}
        envMapIntensity={envMapIntensity}
        map={map}
        metalness={metalness}
        metalnessMap={metalnessMap}
        normalMap={normalMap}
        normalScale={normalScale}
        opacity={opacity}
        roughness={roughness}
        roughnessMap={roughnessMap}
        triplanarScale={triplanarScale}
      />
    </mesh>
  );
}

export function GalaConstructionInstancedBoxes({
  aoMap,
  aoMapIntensity,
  castShadow = false,
  clearcoat = 0,
  clearcoatRoughness = 0,
  color,
  envMapIntensity = 1,
  instances,
  map,
  metalness = 0.02,
  metalnessMap,
  name,
  opacity = 1,
  receiveShadow = true,
  roughness = 0.78,
  roughnessMap,
  normalMap,
  normalScale,
  triplanarScale,
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
      <GalaConstructionMaterial
        aoMap={aoMap}
        aoMapIntensity={aoMapIntensity}
        clearcoat={clearcoat}
        clearcoatRoughness={clearcoatRoughness}
        color={color}
        envMapIntensity={envMapIntensity}
        map={map}
        metalness={metalness}
        metalnessMap={metalnessMap}
        normalMap={normalMap}
        normalScale={normalScale}
        opacity={opacity}
        roughness={roughness}
        roughnessMap={roughnessMap}
        triplanarScale={triplanarScale}
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
