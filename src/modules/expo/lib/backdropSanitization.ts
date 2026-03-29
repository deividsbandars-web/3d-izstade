import * as THREE from 'three';

export type ExpoBackdropDensity = 'minimal' | 'standard';
export type ExpoBackdropQualityPreset = 'performance' | 'balanced' | 'quality';

export type ExpoBackdropStrategy = {
  cityShellOffsetY: number;
  cityShellOffsetZ: number;
  cityShellOpacity: number;
  cityShellTargetSpan: number;
  enableCuratedSkylineRing: boolean;
  enableStaticCityShell: boolean;
  skylineDensity: ExpoBackdropDensity;
};

const RELEASE_BACKDROP_PALETTE = {
  emissive: new THREE.Color('#0b1220'),
  fallback: new THREE.Color('#334155'),
};

const SKYLINE_DENSITY_BY_PRESET: Record<ExpoBackdropQualityPreset, ExpoBackdropDensity> = {
  balanced: 'minimal',
  performance: 'minimal',
  quality: 'standard',
};

export function resolveExpoBackdropStrategy({
  qualityPreset,
  skylineRingEnabled,
}: {
  qualityPreset: ExpoBackdropQualityPreset;
  skylineRingEnabled: boolean;
}): ExpoBackdropStrategy {
  if (qualityPreset === 'performance') {
    return {
      cityShellOffsetY: -6,
      cityShellOffsetZ: -420,
      cityShellOpacity: 0.18,
      cityShellTargetSpan: 540,
      enableCuratedSkylineRing: false,
      enableStaticCityShell: false,
      skylineDensity: 'minimal',
    };
  }

  return {
    cityShellOffsetY: -8,
    cityShellOffsetZ: -440,
    cityShellOpacity: qualityPreset === 'quality' ? 0.32 : 0.24,
    cityShellTargetSpan: qualityPreset === 'quality' ? 760 : 660,
    enableCuratedSkylineRing: skylineRingEnabled,
    enableStaticCityShell: true,
    skylineDensity: SKYLINE_DENSITY_BY_PRESET[qualityPreset],
  };
}

function sanitizeBackdropMaterial(material: THREE.Material, opacity: number) {
  const next = material as THREE.MeshStandardMaterial & { color?: THREE.Color; emissive?: THREE.Color };
  const sourceColor = next.color?.clone() ?? RELEASE_BACKDROP_PALETTE.fallback.clone();
  sourceColor.lerp(RELEASE_BACKDROP_PALETTE.fallback, 0.78);

  if (next.color) {
    next.color.copy(sourceColor);
  }
  if ('emissive' in next && next.emissive) {
    next.emissive.copy(RELEASE_BACKDROP_PALETTE.emissive);
  }
  if ('emissiveIntensity' in next) {
    next.emissiveIntensity = 0.05;
  }
  if ('metalness' in next) {
    next.metalness = 0.04;
  }
  if ('roughness' in next) {
    next.roughness = 0.96;
  }

  next.transparent = true;
  next.opacity = opacity;
  next.depthWrite = false;
  next.needsUpdate = true;
}

export function sanitizeExpoBackdropCityScene(
  root: THREE.Object3D,
  strategy: ExpoBackdropStrategy
) {
  root.updateMatrixWorld(true);

  const initialBounds = new THREE.Box3().setFromObject(root);
  const initialSize = initialBounds.getSize(new THREE.Vector3());
  const dominantSpan = Math.max(initialSize.x, initialSize.z, 1);
  const scaleFactor = THREE.MathUtils.clamp(strategy.cityShellTargetSpan / dominantSpan, 0.001, 1.35);

  root.scale.multiplyScalar(scaleFactor);
  root.updateMatrixWorld(true);

  const normalizedBounds = new THREE.Box3().setFromObject(root);
  const normalizedCenter = normalizedBounds.getCenter(new THREE.Vector3());
  const normalizedMin = normalizedBounds.min.clone();

  root.position.x -= normalizedCenter.x;
  root.position.z -= normalizedCenter.z;
  root.position.y -= normalizedMin.y;
  root.position.y += strategy.cityShellOffsetY;
  root.position.z += strategy.cityShellOffsetZ;

  root.traverse((child) => {
    child.userData.expoBackdropRole = 'city-shell';
    child.userData.disablePlayerCollision = true;
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((material) => sanitizeBackdropMaterial(material, strategy.cityShellOpacity));
      } else if (mesh.material) {
        sanitizeBackdropMaterial(mesh.material, strategy.cityShellOpacity);
      }
    }
  });

  root.updateMatrixWorld(true);
  const finalBounds = new THREE.Box3().setFromObject(root);

  return {
    boundsCenter: finalBounds.getCenter(new THREE.Vector3()).toArray() as [number, number, number],
    boundsSize: finalBounds.getSize(new THREE.Vector3()).toArray() as [number, number, number],
    scaleFactor,
  };
}
