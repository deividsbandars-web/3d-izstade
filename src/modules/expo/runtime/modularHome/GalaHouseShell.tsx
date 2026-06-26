import {
  GALA_PREVIEW_POSITION,
  GALA_PREVIEW_SCALE,
} from './GalaHouseDimensions';
import {
  DEFAULT_GALA_HOUSE_VISUAL_CONFIG,
  type GalaHouseVisualConfig,
} from './GalaHouseConfig';
import { GalaConstructionRenderer } from './construction/GalaConstructionRenderer';
import type { ModularHomeViewModeOption } from './modularHomeConfigurator';

type GalaHouseShellProps = {
  onEnterInterior?: () => void;
  visualConfig?: GalaHouseVisualConfig;
  viewMode: ModularHomeViewModeOption;
};

export function GalaHouseShell({ onEnterInterior, visualConfig, viewMode }: GalaHouseShellProps) {
  const resolvedVisualConfig = visualConfig ?? DEFAULT_GALA_HOUSE_VISUAL_CONFIG;
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
        onEntryDoorOpen={onEnterInterior}
        transparentCutaway={transparentCutaway}
        visualConfig={resolvedVisualConfig}
      />
    </group>
  );
}
