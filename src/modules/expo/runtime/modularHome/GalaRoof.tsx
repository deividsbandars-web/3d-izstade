import * as THREE from 'three';
import { GALA_HOUSE_DIMENSIONS } from './GalaHouseDimensions';
import {
  resolveGalaRoofVisual,
  type GalaHouseVisualConfig,
} from './GalaHouseConfig';
import {
  GALA_CONSTRUCTION_MODEL,
  type GalaConstructionRoofModel,
} from './construction/GalaConstructionModel';
import {
  shouldRenderGalaRoofFineDetail,
  type GalaConstructionRenderDetailLevel,
} from './construction/GalaConstructionDetailPolicy';
import { GalaConstructionBox, GalaConstructionCylinder } from './construction/GalaConstructionPrimitives';
import { useGalaConstructionPbrTextures } from './construction/GalaConstructionPbrTextures';

type GalaRoofProps = {
  renderDetailLevel?: GalaConstructionRenderDetailLevel;
  roofModel?: GalaConstructionRoofModel;
  transparentCutaway: boolean;
  visualConfig?: GalaHouseVisualConfig;
};

function roofOpacity(transparentCutaway: boolean): number {
  return transparentCutaway ? 0.22 : 1;
}

export function GalaRoof({
  renderDetailLevel = 'full',
  roofModel = GALA_CONSTRUCTION_MODEL.roof,
  transparentCutaway,
  visualConfig,
}: GalaRoofProps) {
  const roofVisual = resolveGalaRoofVisual(visualConfig);
  const roofPbrTextures = useGalaConstructionPbrTextures('roof');
  const pitch = THREE.MathUtils.degToRad(roofModel.roofPitchDeg);
  const roofSlopeLength = Math.sqrt(
    ((roofModel.roofWidthM * 0.5) ** 2)
    + (roofModel.roofRiseM ** 2),
  );
  const wallTopY = GALA_HOUSE_DIMENSIONS.wallFrameHeightM;
  const ridgeY = wallTopY + roofModel.roofRiseM;
  const halfRoofWidth = roofModel.roofWidthM * 0.5;
  const roofLength = roofModel.roofLengthM;
  const seamCount = roofVisual.seamCount;
  const renderFineDetail = shouldRenderGalaRoofFineDetail(renderDetailLevel);
  const roofTextureProps = renderFineDetail ? roofPbrTextures : {};

  return (
    <group
      name="gala-30deg-opaque-gable-roof"
      userData={{
        roofGutterProfile: roofModel.gutterProfile,
        roofPitchDeg: roofModel.roofPitchDeg,
        roofRiseM: roofModel.roofRiseM,
        roofStyle: visualConfig?.roofStyle ?? 'dark-standing-seam',
        semantic: 'gala configurable opaque roof ridge eave trim standing seam',
      }}
    >
      <GalaConstructionBox
        {...roofTextureProps}
        castShadow
        color={roofVisual.roofColor}
        metalness={roofVisual.roofMetalness}
        name="gala-roof-south-30deg-opaque-plane"
        opacity={roofOpacity(transparentCutaway)}
        position={[0, wallTopY + (roofModel.roofRiseM * 0.5), -halfRoofWidth * 0.5]}
        receiveShadow
        roughness={roofVisual.roofRoughness}
        rotation={[-pitch, 0, 0]}
        size={[roofLength, 0.08, roofSlopeLength]}
        userData={{ roofPbrMaterialApplied: true }}
      />

      <GalaConstructionBox
        {...roofTextureProps}
        castShadow
        color={roofVisual.roofColor}
        metalness={roofVisual.roofMetalness}
        name="gala-roof-north-30deg-opaque-plane"
        opacity={roofOpacity(transparentCutaway)}
        position={[0, wallTopY + (roofModel.roofRiseM * 0.5), halfRoofWidth * 0.5]}
        receiveShadow
        roughness={roofVisual.roofRoughness}
        rotation={[pitch, 0, 0]}
        size={[roofLength, 0.08, roofSlopeLength]}
        userData={{ roofPbrMaterialApplied: true }}
      />

      <mesh castShadow name="gala-roof-ridge-top-edge-line" position={[0, ridgeY + 0.04, 0]}>
        <boxGeometry args={[roofLength + 0.08, roofModel.ridgeCapHeightM, roofModel.ridgeCapDepthM]} />
        <meshStandardMaterial color={roofVisual.roofEdgeColor} roughness={0.36} />
      </mesh>

      {renderFineDetail ? [-halfRoofWidth, halfRoofWidth].map((z) => (
        <group key={`roof-eave-${z}`} name="gala-roof-edge-and-gutter-profile">
          <mesh castShadow name="gala-roof-dark-eave-edge-trim" position={[0, wallTopY - 0.03, z]}>
            <boxGeometry args={[roofLength + 0.1, roofModel.eaveTrimHeightM, roofModel.eaveTrimDepthM]} />
            <meshStandardMaterial color={roofVisual.roofEdgeColor} roughness={0.46} />
          </mesh>
          {roofModel.showGutter && roofModel.gutterProfile === 'round-gutter' ? (
            <GalaConstructionCylinder
              color={roofVisual.roofEdgeColor}
              height={roofLength + 0.14}
              name="gala-roof-round-gutter-profile-cylinder"
              position={[0, wallTopY - 0.13, z + Math.sign(z) * 0.085]}
              radiusBottom={roofModel.gutterRadiusM}
              radiusTop={roofModel.gutterRadiusM}
              rotation={[0, 0, Math.PI * 0.5]}
              userData={{ roofGutterProfile: roofModel.gutterProfile }}
            />
          ) : null}
          {roofModel.showGutter && roofModel.gutterProfile !== 'round-gutter' ? (
            <GalaConstructionBox
              color={roofVisual.roofEdgeColor}
              metalness={0.12}
              name="gala-roof-box-gutter-profile"
              position={[0, wallTopY - 0.11, z + Math.sign(z) * 0.1]}
              roughness={0.42}
              size={[roofLength + 0.14, roofModel.gutterHeightM, roofModel.gutterDepthM]}
              userData={{ roofGutterProfile: roofModel.gutterProfile }}
            />
          ) : null}
        </group>
      )) : null}

      {renderFineDetail && roofVisual.seamVisible ? Array.from({ length: seamCount }).map((_, index) => {
        const x = -roofLength * 0.5 + ((index + 0.5) * roofLength / seamCount);
        return (
          <group key={`roof-standing-seam-${index}`} name="gala-roof-standing-seam-lines">
            <mesh position={[x, wallTopY + (roofModel.roofRiseM * 0.5) + 0.045, -halfRoofWidth * 0.5]} rotation={[-pitch, 0, 0]}>
              <boxGeometry args={[roofVisual.seamWidthM, 0.04, roofSlopeLength * 0.94]} />
              <meshStandardMaterial color={roofVisual.seamColor} roughness={0.5} />
            </mesh>
            <mesh position={[x, wallTopY + (roofModel.roofRiseM * 0.5) + 0.045, halfRoofWidth * 0.5]} rotation={[pitch, 0, 0]}>
              <boxGeometry args={[roofVisual.seamWidthM, 0.04, roofSlopeLength * 0.94]} />
              <meshStandardMaterial color={roofVisual.seamColor} roughness={0.5} />
            </mesh>
          </group>
        );
      }) : null}
    </group>
  );
}
