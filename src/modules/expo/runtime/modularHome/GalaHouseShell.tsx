import { useMemo } from 'react';
import {
  GALA_PREVIEW_POSITION,
  GALA_PREVIEW_SCALE,
} from './GalaHouseDimensions';
import {
  DEFAULT_GALA_HOUSE_VISUAL_CONFIG,
  type GalaHouseVisualConfig,
} from './GalaHouseConfig';
import {
  GALA_CONSTRUCTION_MODEL,
  GALA_DEFAULT_CONSTRUCTION_ROOF,
  GALA_DEFAULT_CONSTRUCTION_TERRACE,
  type GalaConstructionRoofModel,
  type GalaConstructionTerraceModel,
} from './construction/GalaConstructionModel';
import { GalaConstructionRenderer } from './construction/GalaConstructionRenderer';
import type { ModularHomeViewModeOption } from './modularHomeConfigurator';

export type GalaHouseRenderDetailLevel = 'full' | 'reduced';

const GALA_REVIEW_RENDER_DETAIL_LEVEL: GalaHouseRenderDetailLevel = 'full';

type GalaHouseShellProps = {
  onEnterInterior?: () => void;
  renderDetailLevel?: GalaHouseRenderDetailLevel;
  visualConfig?: GalaHouseVisualConfig;
  viewMode: ModularHomeViewModeOption;
};

function resolveFlatRoofPitchDeg(roofRiseM: number, roofWidthM: number): number {
  return Math.atan2(roofRiseM, roofWidthM * 0.5) * (180 / Math.PI);
}

function resolveGalaRoofModel(config: GalaHouseVisualConfig): GalaConstructionRoofModel {
  const roofRiseM = config.roofStyle === 'bitumen-flat-dark'
    ? 0.18
    : GALA_DEFAULT_CONSTRUCTION_ROOF.roofRiseM;
  const roofProfile = config.roofGutterProfile;
  const roofPitchDeg = config.roofStyle === 'bitumen-flat-dark'
    ? resolveFlatRoofPitchDeg(roofRiseM, GALA_DEFAULT_CONSTRUCTION_ROOF.roofWidthM)
    : GALA_DEFAULT_CONSTRUCTION_ROOF.roofPitchDeg;

  if (roofProfile === 'box-gutter') {
    return {
      ...GALA_DEFAULT_CONSTRUCTION_ROOF,
      eaveTrimDepthM: 0.2,
      eaveTrimHeightM: 0.2,
      gutterDepthM: 0.22,
      gutterHeightM: 0.18,
      gutterProfile: roofProfile,
      roofPitchDeg,
      roofRiseM,
      showGutter: true,
    };
  }

  if (roofProfile === 'round-gutter') {
    return {
      ...GALA_DEFAULT_CONSTRUCTION_ROOF,
      eaveTrimDepthM: 0.16,
      eaveTrimHeightM: 0.15,
      gutterDepthM: 0.18,
      gutterHeightM: 0.18,
      gutterProfile: roofProfile,
      gutterRadiusM: 0.09,
      roofPitchDeg,
      roofRiseM,
      showGutter: true,
    };
  }

  return {
    ...GALA_DEFAULT_CONSTRUCTION_ROOF,
    roofPitchDeg,
    roofRiseM,
  };
}

function resolveGalaTerraceModel(config: GalaHouseVisualConfig): GalaConstructionTerraceModel {
  if (config.terraceStyle === 'no-terrace') {
    return {
      ...GALA_DEFAULT_CONSTRUCTION_TERRACE,
      depthM: 0,
      enabled: false,
      lengthM: 0,
    };
  }

  if (config.terraceStyle === 'extended-deck-with-steps') {
    return {
      ...GALA_DEFAULT_CONSTRUCTION_TERRACE,
      depthM: 2.45,
      lengthM: 3.8,
      stepBaseWidthM: 1.86,
    };
  }

  if (config.terraceStyle === 'deck-with-light-rail') {
    return {
      ...GALA_DEFAULT_CONSTRUCTION_TERRACE,
      depthM: 2.15,
      lengthM: 3.2,
      stepBaseWidthM: 1.72,
    };
  }

  if (config.terraceStyle === 'deck-with-steps') {
    return {
      ...GALA_DEFAULT_CONSTRUCTION_TERRACE,
      depthM: 1.55,
      lengthM: 2.1,
      stepBaseWidthM: 1.42,
    };
  }

  return {
    ...GALA_DEFAULT_CONSTRUCTION_TERRACE,
    depthM: 1.1,
    lengthM: 2.2,
    stepBaseWidthM: 1.28,
  };
}

function resolveGalaConstructionModelForVisualConfig(config: GalaHouseVisualConfig): typeof GALA_CONSTRUCTION_MODEL {
  return {
    ...GALA_CONSTRUCTION_MODEL,
    roof: resolveGalaRoofModel(config),
    terrace: resolveGalaTerraceModel(config),
  };
}

export function GalaHouseShell({
  onEnterInterior,
  renderDetailLevel = 'full',
  visualConfig,
  viewMode,
}: GalaHouseShellProps) {
  const resolvedVisualConfig = visualConfig ?? DEFAULT_GALA_HOUSE_VISUAL_CONFIG;
  const constructionModel = useMemo(
    () => resolveGalaConstructionModelForVisualConfig(resolvedVisualConfig),
    [resolvedVisualConfig],
  );
  const transparentCutaway = viewMode === 'cutaway' || viewMode === 'floorplan';

  return (
    <group
      name="gala-30deg-plan-based-modular-home"
      position={[GALA_PREVIEW_POSITION.x, GALA_PREVIEW_POSITION.y, GALA_PREVIEW_POSITION.z]}
      scale={[GALA_PREVIEW_SCALE, GALA_PREVIEW_SCALE, GALA_PREVIEW_SCALE]}
      userData={{
        dimensionsSource: 'Koka_maja_GALA_30deg_pilns_komplekts',
        fragmentedPrimitivePatchLoopStopped: true,
        galaBodyMeters: '10.2 x 5.0 x 2.7',
        galaModelRebuilt: true,
        galaPreviewScale: GALA_PREVIEW_SCALE,
        galaRenderDetailLevel: GALA_REVIEW_RENDER_DETAIL_LEVEL,
        galaRenderDetailPolicy: 'full-detail-locked-for-product-visual-review',
        galaRequestedRenderDetailLevel: renderDetailLevel,
        galaVisualConfig: resolvedVisualConfig,
        productVisualAccepted: false,
        referencePackageUsed: 'Koka_maja_GALA_30deg_pilns_komplekts',
        rendererOwnershipContract: 'docs/GALA_RENDERER_OWNERSHIP_CONTRACT.md',
        semantic: 'gala 30 degree wooden modular home ownership-contracted construction route',
        singleSourceRendererProven: false,
      }}
    >
      {viewMode === 'interior' ? (
        <>
          <ambientLight intensity={0.42} />
          <pointLight color="#fff4dc" decay={1.2} distance={8} intensity={2.2} position={[3.6, 2.35, 1.15]} />
          <pointLight color="#e0f2fe" decay={1.4} distance={7} intensity={1.2} position={[7.8, 2.1, 0.6]} />
        </>
      ) : null}
      <GalaConstructionRenderer
        constructionModel={constructionModel}
        onEntryDoorOpen={onEnterInterior}
        renderDetailLevel={GALA_REVIEW_RENDER_DETAIL_LEVEL}
        transparentCutaway={transparentCutaway}
        viewMode={viewMode}
        visualConfig={resolvedVisualConfig}
      />
    </group>
  );
}
