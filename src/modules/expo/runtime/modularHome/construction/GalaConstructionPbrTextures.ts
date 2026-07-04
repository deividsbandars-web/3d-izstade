import { useMemo } from 'react';
import * as THREE from 'three';
import { useLoader } from '@react-three/fiber';

type GalaConstructionTextureKind =
  | 'floor'
  | 'wall'
  | 'interiorWall'
  | 'exterior'
  | 'roof'
  | 'ground'
  | 'deck'
  | 'door'
  | 'trim';

type GalaConstructionTexturePaths = {
  arm: string;
  diffuse: string;
  normal: string;
  normalScale?: number;
  repeat?: readonly [number, number];
  triplanarScale: number;
};

type GalaConstructionTextureVariantMap = Record<string, GalaConstructionTexturePaths> & {
  default: GalaConstructionTexturePaths;
};

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
    default: {
      arm: '/models/gala/plank_flooring_04_1k/textures/plank_flooring_04_arm_1k.jpg',
      diffuse: '/models/gala/plank_flooring_04_1k/textures/plank_flooring_04_diff_1k.jpg',
      normal: '/models/gala/plank_flooring_04_1k/textures/plank_flooring_04_nor_gl_1k.jpg',
      repeat: [6.8, 3.3],
      triplanarScale: 0.08,
    },
    oakLaminate: {
      arm: '/models/gala/wooden_floor_02_1k/textures/wooden_floor_02_arm_1k.jpg',
      diffuse: '/models/gala/wooden_floor_02_1k/textures/wooden_floor_02_diff_1k.jpg',
      normal: '/models/gala/wooden_floor_02_1k/textures/wooden_floor_02_nor_gl_1k.jpg',
      repeat: [6.8, 3.3],
      triplanarScale: 0.08,
    },
    plywood: {
      arm: '/models/gala/plank_flooring_04_1k/textures/plank_flooring_04_arm_1k.jpg',
      diffuse: '/models/gala/plank_flooring_04_1k/textures/plank_flooring_04_diff_1k.jpg',
      normal: '/models/gala/plank_flooring_04_1k/textures/plank_flooring_04_nor_gl_1k.jpg',
      repeat: [6.8, 3.3],
      triplanarScale: 0.08,
    },
    polishedConcrete: {
      arm: '/models/gala/wood_floor_1k/textures/wood_floor_arm_1k.jpg',
      diffuse: '/models/gala/wood_floor_1k/textures/wood_floor_diff_1k.jpg',
      normal: '/models/gala/wood_floor_1k/textures/wood_floor_nor_gl_1k.jpg',
      normalScale: 0.28,
      repeat: [6.8, 3.3],
      triplanarScale: 0.1,
    },
  },
  wall: {
    default: {
      arm: '/models/gala/wood_plank_wall_1k/textures/wood_plank_wall_arm_1k.jpg',
      diffuse: '/models/gala/wood_plank_wall_1k/textures/wood_plank_wall_diff_1k.jpg',
      normalScale: 0.22,
      normal: '/models/gala/wood_plank_wall_1k/textures/wood_plank_wall_nor_gl_1k.jpg',
      triplanarScale: 0.35,
    },
  },
  interiorWall: {
    default: {
      arm: '/models/gala/wood_plank_wall_1k/textures/wood_plank_wall_arm_1k.jpg',
      diffuse: '/models/gala/wood_plank_wall_1k/textures/wood_plank_wall_diff_1k.jpg',
      normal: '/models/gala/wood_plank_wall_1k/textures/wood_plank_wall_nor_gl_1k.jpg',
      normalScale: 0.14,
      triplanarScale: 0.16,
    },
    paintedWhite: {
      arm: '/models/gala/white_planks_clean_1k/textures/white_planks_clean_arm_1k.jpg',
      diffuse: '/models/gala/white_planks_clean_1k/textures/white_planks_clean_diff_1k.jpg',
      normal: '/models/gala/white_planks_clean_1k/textures/white_planks_clean_nor_gl_1k.jpg',
      normalScale: 0.08,
      triplanarScale: 0.16,
    },
    plywood: {
      arm: '/models/gala/wood_plank_wall_1k/textures/wood_plank_wall_arm_1k.jpg',
      diffuse: '/models/gala/wood_plank_wall_1k/textures/wood_plank_wall_diff_1k.jpg',
      normal: '/models/gala/wood_plank_wall_1k/textures/wood_plank_wall_nor_gl_1k.jpg',
      normalScale: 0.14,
      triplanarScale: 0.16,
    },
    warmPanel: {
      arm: '/models/gala/white_maple_veneer_1k/textures/white_maple_veneer_arm_1k.jpg',
      diffuse: '/models/gala/white_maple_veneer_1k/textures/white_maple_veneer_diff_1k.jpg',
      normal: '/models/gala/white_maple_veneer_1k/textures/white_maple_veneer_nor_gl_1k.jpg',
      normalScale: 0.11,
      triplanarScale: 0.16,
    },
  },
  exterior: {
    darkThermoWood: {
      arm: '/models/gala/black_painted_planks_1k/textures/black_painted_planks_arm_1k.jpg',
      diffuse: '/models/gala/black_painted_planks_1k/textures/black_painted_planks_diff_1k.jpg',
      normal: '/models/gala/black_painted_planks_1k/textures/black_painted_planks_nor_gl_1k.jpg',
      triplanarScale: 0.35,
    },
    default: {
      arm: '/models/gala/weathered_plank_siding_1k/textures/weathered_plank_siding_arm_1k.jpg',
      diffuse: '/models/gala/weathered_plank_siding_1k/textures/weathered_plank_siding_diff_1k.jpg',
      normal: '/models/gala/weathered_plank_siding_1k/textures/weathered_plank_siding_nor_gl_1k.jpg',
      triplanarScale: 0.35,
    },
    lightPainted: {
      arm: '/models/gala/white_planks_clean_1k/textures/white_planks_clean_arm_1k.jpg',
      diffuse: '/models/gala/white_planks_clean_1k/textures/white_planks_clean_diff_1k.jpg',
      normal: '/models/gala/white_planks_clean_1k/textures/white_planks_clean_nor_gl_1k.jpg',
      normalScale: 0.18,
      triplanarScale: 0.35,
    },
    naturalTimber: {
      arm: '/models/gala/weathered_plank_siding_1k/textures/weathered_plank_siding_arm_1k.jpg',
      diffuse: '/models/gala/weathered_plank_siding_1k/textures/weathered_plank_siding_diff_1k.jpg',
      normal: '/models/gala/weathered_plank_siding_1k/textures/weathered_plank_siding_nor_gl_1k.jpg',
      triplanarScale: 0.35,
    },
  },
  roof: {
    default: {
      arm: '/models/gala/box_profile_metal_sheet_1k/textures/box_profile_metal_sheet_arm_1k.jpg',
      diffuse: '/models/gala/box_profile_metal_sheet_1k/textures/box_profile_metal_sheet_diff_1k.jpg',
      normal: '/models/gala/box_profile_metal_sheet_1k/textures/box_profile_metal_sheet_nor_gl_1k.jpg',
      triplanarScale: 0.5,
    },
  },
  ground: {
    default: {
      arm: '/models/gala/forest_ground_05_1k/textures/forest_ground_05_arm_1k.jpg',
      diffuse: '/models/gala/forest_ground_05_1k/textures/forest_ground_05_diff_1k.jpg',
      normal: '/models/gala/forest_ground_05_1k/textures/forest_ground_05_nor_gl_1k.jpg',
      triplanarScale: 0.5,
    },
  },
  deck: {
    default: {
      arm: '/models/gala/wood_floor_deck_1k/textures/wood_floor_deck_arm_1k.jpg',
      diffuse: '/models/gala/wood_floor_deck_1k/textures/wood_floor_deck_diff_1k.jpg',
      normal: '/models/gala/wood_floor_deck_1k/textures/wood_floor_deck_nor_gl_1k.jpg',
      triplanarScale: 0.08,
    },
  },
  door: {
    default: {
      arm: '/models/gala/rough_pine_door_1k/textures/rough_pine_door_arm_1k.jpg',
      diffuse: '/models/gala/rough_pine_door_1k/textures/rough_pine_door_diff_1k.jpg',
      normal: '/models/gala/rough_pine_door_1k/textures/rough_pine_door_nor_gl_1k.jpg',
      normalScale: 0.42,
      triplanarScale: 0.42,
    },
  },
  trim: {
    default: {
      arm: '/models/gala/wood_shutter_1k/textures/wood_shutter_arm_1k.jpg',
      diffuse: '/models/gala/wood_shutter_1k/textures/wood_shutter_diff_1k.jpg',
      normal: '/models/gala/wood_shutter_1k/textures/wood_shutter_nor_gl_1k.jpg',
      normalScale: 0.34,
      triplanarScale: 0.55,
    },
  },
} as const satisfies Record<GalaConstructionTextureKind, GalaConstructionTextureVariantMap>;

const configuredTextures = new WeakMap<THREE.Texture, string>();

function configuredTexture(source: THREE.Texture, colorSpace: THREE.ColorSpace, repeat?: readonly [number, number]) {
  const configKey = `${colorSpace}:${repeat?.[0] ?? 1}:${repeat?.[1] ?? 1}`;
  if (configuredTextures.get(source) === configKey) {
    return source;
  }

  source.colorSpace = colorSpace;
  source.wrapS = THREE.RepeatWrapping;
  source.wrapT = THREE.RepeatWrapping;
  source.repeat.set(repeat?.[0] ?? 1, repeat?.[1] ?? 1);
  source.channel = 0;
  source.needsUpdate = true;
  configuredTextures.set(source, configKey);
  return source;
}

function resolveGalaConstructionTexturePaths(
  kind: GalaConstructionTextureKind,
  variant?: string,
): GalaConstructionTexturePaths {
  const variants = GALA_CONSTRUCTION_TEXTURE_PATHS[kind] as GalaConstructionTextureVariantMap;
  return variants[variant ?? 'default'] ?? variants.default;
}

export function useGalaConstructionPbrTextures(
  kind: GalaConstructionTextureKind,
  variant?: string,
): GalaConstructionPbrMapProps {
  const paths = resolveGalaConstructionTexturePaths(kind, variant);
  const normalScaleValue = paths.normalScale ?? 0.72;
  const repeat = paths.repeat;
  const texturePaths = useMemo(() => [
    paths.diffuse,
    paths.normal,
    paths.arm,
  ], [paths.arm, paths.diffuse, paths.normal]);
  const textureSet = useLoader(THREE.TextureLoader, texturePaths);

  return useMemo(() => {
    if (!textureSet) {
      return {
        triplanarScale: paths.triplanarScale,
      };
    }

    const [diffuseSource, normalSource, armSource] = textureSet;
    const map = configuredTexture(diffuseSource, THREE.SRGBColorSpace, repeat);
    const normalMap = configuredTexture(normalSource, THREE.NoColorSpace, repeat);
    const armMap = configuredTexture(armSource, THREE.NoColorSpace, repeat);

    return {
      aoMap: armMap,
      aoMapIntensity: 1,
      map,
      metalnessMap: armMap,
      normalMap,
      normalScale: new THREE.Vector2(normalScaleValue, normalScaleValue),
      roughnessMap: armMap,
      triplanarScale: paths.triplanarScale,
    };
  }, [normalScaleValue, paths.triplanarScale, repeat, textureSet]);
}
