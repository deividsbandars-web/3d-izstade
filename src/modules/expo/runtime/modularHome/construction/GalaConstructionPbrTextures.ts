import { useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

type GalaConstructionTextureKind = 'floor' | 'wall';

export type GalaConstructionPbrMapProps = {
  aoMap?: THREE.Texture;
  aoMapIntensity?: number;
  map?: THREE.Texture;
  metalnessMap?: THREE.Texture;
  normalMap?: THREE.Texture;
  normalScale?: THREE.Vector2;
  roughnessMap?: THREE.Texture;
  triplanarScale?: number;
};

const GALA_CONSTRUCTION_TEXTURE_PATHS = {
  floor: {
    arm: '/models/gala/wood_floor_1k/textures/wood_floor_arm_1k.jpg',
    diffuse: '/models/gala/wood_floor_1k/textures/wood_floor_diff_1k.jpg',
    normal: '/models/gala/wood_floor_1k/textures/wood_floor_nor_gl_1k.jpg',
  },
  wall: {
    arm: '/models/gala/wood_plank_wall_1k/textures/wood_plank_wall_arm_1k.jpg',
    diffuse: '/models/gala/wood_plank_wall_1k/textures/wood_plank_wall_diff_1k.jpg',
    normal: '/models/gala/wood_plank_wall_1k/textures/wood_plank_wall_nor_gl_1k.jpg',
  },
} as const;

const configuredTextures = new WeakSet<THREE.Texture>();

function configuredTexture(source: THREE.Texture, colorSpace: THREE.ColorSpace) {
  if (configuredTextures.has(source)) {
    return source;
  }

  source.colorSpace = colorSpace;
  source.wrapS = THREE.RepeatWrapping;
  source.wrapT = THREE.RepeatWrapping;
  source.channel = 0;
  source.needsUpdate = true;
  configuredTextures.add(source);
  return source;
}

export function useGalaConstructionPbrTextures(kind: GalaConstructionTextureKind): GalaConstructionPbrMapProps {
  const paths = GALA_CONSTRUCTION_TEXTURE_PATHS[kind];
  const [diffuseSource, normalSource, armSource] = useTexture([
    paths.diffuse,
    paths.normal,
    paths.arm,
  ]);

  return useMemo(() => {
    const map = configuredTexture(diffuseSource, THREE.SRGBColorSpace);
    const normalMap = configuredTexture(normalSource, THREE.NoColorSpace);
    const armMap = configuredTexture(armSource, THREE.NoColorSpace);

    return {
      aoMap: armMap,
      aoMapIntensity: 1,
      map,
      metalnessMap: armMap,
      normalMap,
      normalScale: new THREE.Vector2(0.72, 0.72),
      roughnessMap: armMap,
      triplanarScale: 0.5,
    };
  }, [armSource, diffuseSource, normalSource]);
}
