import type { GalaHouseVisualConfig } from '../GalaHouseConfig';
import {
  GALA_CONSTRUCTION_LEVELS,
} from './GalaConstructionModel';
import { GalaConstructionBox } from './GalaConstructionPrimitives';
import { useGalaConstructionPbrTextures } from './GalaConstructionPbrTextures';
import { resolveGalaWallSkin } from './GalaWallSkinModel';

type GalaFloorCeilingAssemblyProps = {
  visualConfig?: GalaHouseVisualConfig;
};

export function GalaFloorCeilingAssembly({ visualConfig }: GalaFloorCeilingAssemblyProps) {
  const wallSkin = resolveGalaWallSkin(visualConfig);
  const { interior } = wallSkin;
  const floorPbrTextures = useGalaConstructionPbrTextures('floor', interior.floorTextureVariant);
  const floorY = GALA_CONSTRUCTION_LEVELS.finishedFloorTopY
    - (GALA_CONSTRUCTION_LEVELS.finishedFloorThicknessM * 0.5);
  const floorSize: [number, number, number] = [10.2, GALA_CONSTRUCTION_LEVELS.finishedFloorThicknessM, 5.0];
  const ceilingY = GALA_CONSTRUCTION_LEVELS.ceilingHeightM + 0.018;

  return (
    <group
      name="gala-construction-floor-ceiling-assembly-single-stack"
      userData={{
        assembly: 'GalaFloorCeilingAssembly',
        ceilingTrimGeneratedFromRoomPerimeters: true,
        componentHint: 'construction/GalaFloorCeilingAssembly.tsx',
        floorStackHasNoCoplanarOverlays: true,
      }}
    >
      <GalaConstructionBox
        {...floorPbrTextures}
        color={interior.floorColor}
        name="gala-construction-single-finished-floor-no-overlays"
        position={[0, floorY, 0]}
        roughness={0.9}
        size={floorSize}
        userData={{
          floorColorStableNearAndFar: true,
          floorPbrTextureVariant: interior.floorTextureVariant,
          floorStackHasNoCoplanarOverlays: true,
          interiorExteriorMaterialSystemCoherent: true,
          noBlueFloorOverlay: true,
          wallSkinModelOwner: 'GalaWallSkinModel',
        }}
      />

      <mesh
        name="gala-construction-finished-floor-local-plank-surface"
        position={[0, GALA_CONSTRUCTION_LEVELS.finishedFloorTopY + 0.004, 0]}
        receiveShadow
        rotation={[-Math.PI * 0.5, 0, 0]}
        userData={{
          componentHint: 'construction/GalaFloorCeilingAssembly.tsx',
          floorFinishUsesLocalUvPbr: true,
          floorPlankDirectionStable: true,
          floorPbrTextureVariant: interior.floorTextureVariant,
          floorStackHasNoCoplanarOverlays: true,
          interiorExteriorMaterialSystemCoherent: true,
          wallSkinModelOwner: 'GalaWallSkinModel',
        }}
      >
        <planeGeometry args={[floorSize[0], floorSize[2]]} />
        <meshPhysicalMaterial
          aoMap={floorPbrTextures.aoMap}
          aoMapIntensity={floorPbrTextures.aoMapIntensity}
          color={interior.floorColor}
          map={floorPbrTextures.map}
          metalness={0.02}
          metalnessMap={floorPbrTextures.metalnessMap}
          normalMap={floorPbrTextures.normalMap}
          normalScale={floorPbrTextures.normalScale}
          roughness={0.84}
          roughnessMap={floorPbrTextures.roughnessMap}
        />
      </mesh>

      <GalaConstructionBox
        color={interior.ceilingColor}
        name="gala-construction-continuous-flat-ceiling-plane"
        position={[0, ceilingY, 0]}
        roughness={0.88}
        size={[10.08, 0.05, 4.88]}
        userData={{
          ceilingTrimContinuous: true,
          ceilingTrimGeneratedFromRoomPerimeters: true,
          interiorExteriorMaterialSystemCoherent: true,
          partitionTopsSealed: true,
          wallSkinModelOwner: 'GalaWallSkinModel',
        }}
      />

    </group>
  );
}
