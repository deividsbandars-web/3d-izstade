import * as THREE from 'three';
import { GALA_HOUSE_DIMENSIONS } from './GalaHouseDimensions';
import {
  resolveGalaRoofVisual,
  type GalaHouseVisualConfig,
} from './GalaHouseConfig';

type GalaRoofProps = {
  transparentCutaway: boolean;
  visualConfig?: GalaHouseVisualConfig;
};

function roofOpacity(transparentCutaway: boolean): number {
  return transparentCutaway ? 0.22 : 1;
}

export function GalaRoof({ transparentCutaway, visualConfig }: GalaRoofProps) {
  const roofVisual = resolveGalaRoofVisual(visualConfig);
  const pitch = THREE.MathUtils.degToRad(GALA_HOUSE_DIMENSIONS.roofPitchDeg);
  const roofSlopeLength = Math.sqrt(
    ((GALA_HOUSE_DIMENSIONS.roofWidthM * 0.5) ** 2)
    + (GALA_HOUSE_DIMENSIONS.roofRiseM ** 2),
  );
  const wallTopY = GALA_HOUSE_DIMENSIONS.wallFrameHeightM;
  const ridgeY = wallTopY + GALA_HOUSE_DIMENSIONS.roofRiseM;
  const halfRoofWidth = GALA_HOUSE_DIMENSIONS.roofWidthM * 0.5;
  const roofLength = GALA_HOUSE_DIMENSIONS.roofLengthM;
  const seamCount = roofVisual.seamCount;

  return (
    <group
      name="gala-30deg-opaque-gable-roof"
      userData={{ roofStyle: visualConfig?.roofStyle ?? 'dark-standing-seam', semantic: 'gala 30 degree opaque dark gable roof ridge eave trim standing seam' }}
    >
      <mesh
        castShadow
        name="gala-roof-south-30deg-opaque-plane"
        position={[0, wallTopY + (GALA_HOUSE_DIMENSIONS.roofRiseM * 0.5), -halfRoofWidth * 0.5]}
        receiveShadow
        rotation={[-pitch, 0, 0]}
      >
        <boxGeometry args={[roofLength, 0.08, roofSlopeLength]} />
        <meshStandardMaterial
          color={roofVisual.roofColor}
          metalness={roofVisual.roofMetalness}
          opacity={roofOpacity(transparentCutaway)}
          roughness={roofVisual.roofRoughness}
          transparent={transparentCutaway}
        />
      </mesh>

      <mesh
        castShadow
        name="gala-roof-north-30deg-opaque-plane"
        position={[0, wallTopY + (GALA_HOUSE_DIMENSIONS.roofRiseM * 0.5), halfRoofWidth * 0.5]}
        receiveShadow
        rotation={[pitch, 0, 0]}
      >
        <boxGeometry args={[roofLength, 0.08, roofSlopeLength]} />
        <meshStandardMaterial
          color={roofVisual.roofColor}
          metalness={roofVisual.roofMetalness}
          opacity={roofOpacity(transparentCutaway)}
          roughness={roofVisual.roofRoughness}
          transparent={transparentCutaway}
        />
      </mesh>

      <mesh castShadow name="gala-roof-ridge-top-edge-line" position={[0, ridgeY + 0.04, 0]}>
        <boxGeometry args={[roofLength + 0.08, 0.12, 0.1]} />
        <meshStandardMaterial color={roofVisual.roofEdgeColor} roughness={0.36} />
      </mesh>

      {[-halfRoofWidth, halfRoofWidth].map((z) => (
        <mesh key={`roof-eave-${z}`} castShadow name="gala-roof-dark-eave-edge-trim" position={[0, wallTopY - 0.03, z]}>
          <boxGeometry args={[roofLength + 0.1, 0.16, 0.16]} />
          <meshStandardMaterial color={roofVisual.roofEdgeColor} roughness={0.46} />
        </mesh>
      ))}

      {roofVisual.seamVisible ? Array.from({ length: seamCount }).map((_, index) => {
        const x = -roofLength * 0.5 + ((index + 0.5) * roofLength / seamCount);
        return (
          <group key={`roof-standing-seam-${index}`} name="gala-roof-standing-seam-lines">
            <mesh position={[x, wallTopY + (GALA_HOUSE_DIMENSIONS.roofRiseM * 0.5) + 0.045, -halfRoofWidth * 0.5]} rotation={[-pitch, 0, 0]}>
              <boxGeometry args={[roofVisual.seamWidthM, 0.04, roofSlopeLength * 0.94]} />
              <meshStandardMaterial color={roofVisual.seamColor} roughness={0.5} />
            </mesh>
            <mesh position={[x, wallTopY + (GALA_HOUSE_DIMENSIONS.roofRiseM * 0.5) + 0.045, halfRoofWidth * 0.5]} rotation={[pitch, 0, 0]}>
              <boxGeometry args={[roofVisual.seamWidthM, 0.04, roofSlopeLength * 0.94]} />
              <meshStandardMaterial color={roofVisual.seamColor} roughness={0.5} />
            </mesh>
          </group>
        );
      }) : null}
    </group>
  );
}
