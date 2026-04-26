import type * as THREE from 'three';
import { BoothUI } from '../../../../../components/BoothUI';
import type { ExpoMode } from '../../../state/expoRuntime';
import type { ExpoStartView, ExpoWorldContract } from '../../../world-contract';
import { ExpoWorldAnalyticsLayer } from './ExpoWorldAnalyticsLayer';
import { ExpoWorldAnalyticsProvider } from './ExpoWorldAnalyticsProvider';
import { ExpoWorldCanvasShell } from './ExpoWorldCanvasShell';
import { useExpoWorldSceneRuntime } from './useExpoWorldSceneRuntime';

export function ExpoWorldSceneRoot({
  activeZone,
  debug,
  mobileMoveIntent,
  mode,
  onMove,
  runtimeCaptureSafe,
  runtimeHighlightedTargets,
  runtimeLayerToggles,
  runtimeSectionToggles,
  sceneVersion,
  setSceneUserData,
  startViewOverride,
  worldContract,
  zoneSystem,
}: {
  activeZone: { id?: string | null } | null | undefined;
  debug: boolean;
  mobileMoveIntent?: { f: boolean; b: boolean; l: boolean; r: boolean; s?: boolean };
  mode: ExpoMode;
  onMove: (position: number[]) => void;
  runtimeCaptureSafe: boolean;
  runtimeHighlightedTargets: string[];
  runtimeLayerToggles?: {
    booths: boolean;
    city: boolean;
    promenade: boolean;
    skyline: boolean;
    stadium: boolean;
  };
  runtimeSectionToggles?: {
    arrival: boolean;
    left: boolean;
    middle: boolean;
    right: boolean;
    stadium: boolean;
  };
  sceneVersion: string | null;
  setSceneUserData: (scene: THREE.Scene, key: string, value: unknown) => void;
  startViewOverride?: ExpoStartView | null;
  worldContract: ExpoWorldContract;
  zoneSystem: unknown;
}) {
  return (
    <ExpoWorldAnalyticsProvider>
      <ExpoWorldSceneRootView
        activeZone={activeZone}
        debug={debug}
        mobileMoveIntent={mobileMoveIntent}
        mode={mode}
        onMove={onMove}
        runtimeCaptureSafe={runtimeCaptureSafe}
        runtimeHighlightedTargets={runtimeHighlightedTargets}
        runtimeLayerToggles={runtimeLayerToggles}
        runtimeSectionToggles={runtimeSectionToggles}
        sceneVersion={sceneVersion}
        setSceneUserData={setSceneUserData}
        startViewOverride={startViewOverride}
        worldContract={worldContract}
        zoneSystem={zoneSystem}
      />
    </ExpoWorldAnalyticsProvider>
  );
}

function ExpoWorldSceneRootView({
  activeZone,
  debug,
  mobileMoveIntent,
  mode,
  onMove,
  runtimeCaptureSafe,
  runtimeHighlightedTargets,
  runtimeLayerToggles,
  runtimeSectionToggles,
  sceneVersion,
  setSceneUserData,
  startViewOverride,
  worldContract,
  zoneSystem,
}: {
  activeZone: { id?: string | null } | null | undefined;
  debug: boolean;
  mobileMoveIntent?: { f: boolean; b: boolean; l: boolean; r: boolean; s?: boolean };
  mode: ExpoMode;
  onMove: (position: number[]) => void;
  runtimeCaptureSafe: boolean;
  runtimeHighlightedTargets: string[];
  runtimeLayerToggles?: {
    booths: boolean;
    city: boolean;
    promenade: boolean;
    skyline: boolean;
    stadium: boolean;
  };
  runtimeSectionToggles?: {
    arrival: boolean;
    left: boolean;
    middle: boolean;
    right: boolean;
    stadium: boolean;
  };
  sceneVersion: string | null;
  setSceneUserData: (scene: THREE.Scene, key: string, value: unknown) => void;
  startViewOverride?: ExpoStartView | null;
  worldContract: ExpoWorldContract;
  zoneSystem: unknown;
}) {
  const runtime = useExpoWorldSceneRuntime({
    activeZone,
    mode,
    runtimeLayerToggles,
    runtimeSectionToggles,
    startViewOverride,
    worldContract,
    zoneSystem,
  });

  return (
    <>
      <ExpoWorldAnalyticsLayer
        activeZone={activeZone}
        mode={mode}
        sectorCount={runtime.qualityProfileInputs.sectorCount}
        sectorMarkers={runtime.sectorMarkers}
        visibleBoothPlacements={runtime.visibleBoothPlacements}
        zoneSystem={zoneSystem}
      />
      <BoothUI visible={debug && !!activeZone} zoneName={activeZone?.id ?? undefined} />
      <ExpoWorldCanvasShell
        activeZoneId={activeZone?.id ? String(activeZone.id) : null}
        debug={debug}
        districtPrograms={runtime.districtPrograms}
        effectiveStartView={runtime.effectiveStartView}
        highlightedTargets={runtimeHighlightedTargets}
        layerToggles={runtime.layerToggles}
        mobileMoveIntent={mobileMoveIntent}
        mode={mode}
        onMove={(position) => {
          runtime.setPlayerPosition([position[0], position[1], position[2]]);
          onMove(position);
        }}
        playBounds={runtime.playBounds}
        playerPosition={runtime.playerPosition}
        qualityProfileInputs={runtime.qualityProfileInputs}
        runtimeCaptureSafe={runtimeCaptureSafe}
        sceneVersion={sceneVersion}
        sectorMarkers={runtime.sectorMarkers}
        sectionToggles={runtime.sectionToggles}
        sectionVisibleBoothPlacements={runtime.sectionVisibleBoothPlacements}
        setSceneUserData={setSceneUserData}
        visualProfile={runtime.visualProfile}
        walkRegions={runtime.walkRegions}
      />
    </>
  );
}
