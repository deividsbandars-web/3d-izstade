import type * as THREE from 'three';
import { BoothUI } from '../../../../../components/BoothUI';
import type { ExpoMode } from '../../../state/expoRuntime';
import type { ExpoStartView, ExpoWorldContract } from '../../../world-contract';
import { ExpoWorldAnalyticsLayer } from './ExpoWorldAnalyticsLayer';
import { ExpoWorldAnalyticsProvider } from './ExpoWorldAnalyticsProvider';
import { ExpoWorldCanvasShell } from './ExpoWorldCanvasShell';
import { useExpoWorldSceneRuntime } from './useExpoWorldSceneRuntime';
import { ExpoWorldSceneErrorBoundary } from './ExpoWorldSceneErrorBoundary';

export function ExpoWorldSceneRoot({
  activeZone,
  debug,
  inspectionEnabled,
  mobileMoveIntent,
  mode,
  onMove,
  runtimeCaptureSafe,
  runtimeFocusIsolation,
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
  inspectionEnabled: boolean;
  mobileMoveIntent?: { f: boolean; b: boolean; l: boolean; r: boolean; s?: boolean };
  mode: ExpoMode;
  onMove: (position: number[]) => void;
  runtimeCaptureSafe: boolean;
  runtimeFocusIsolation?: boolean;
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
        inspectionEnabled={inspectionEnabled}
        mobileMoveIntent={mobileMoveIntent}
        mode={mode}
        onMove={onMove}
        runtimeCaptureSafe={runtimeCaptureSafe}
        runtimeFocusIsolation={runtimeFocusIsolation}
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
  inspectionEnabled,
  mobileMoveIntent,
  mode,
  onMove,
  runtimeCaptureSafe,
  runtimeFocusIsolation,
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
  inspectionEnabled: boolean;
  mobileMoveIntent?: { f: boolean; b: boolean; l: boolean; r: boolean; s?: boolean };
  mode: ExpoMode;
  onMove: (position: number[]) => void;
  runtimeCaptureSafe: boolean;
  runtimeFocusIsolation?: boolean;
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
  const hardIsolateNonTargets = Boolean(
    runtimeFocusIsolation &&
    runtimeHighlightedTargets.some((target) => (
      target.startsWith('screen-marquee-') ||
      target.startsWith('screen-spine-')
    )),
  );

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
      <ExpoWorldSceneErrorBoundary label="canvas">
        <ExpoWorldCanvasShell
          activeZoneId={activeZone?.id ? String(activeZone.id) : null}
          debug={debug}
          districtPrograms={runtime.districtPrograms}
          effectiveStartView={runtime.effectiveStartView}
          highlightedTargets={runtimeHighlightedTargets}
          inspectionEnabled={inspectionEnabled}
          layerToggles={runtime.layerToggles}
          mobileMoveIntent={mobileMoveIntent}
          mode={mode}
          onMove={(position) => {
            runtime.setPlayerPosition([position[0], position[1], position[2]]);
            onMove(position);
          }}
          playBounds={runtime.playBounds}
          playerPosition={runtime.playerPosition}
          planningBoothPlacements={runtime.visibleBoothPlacements}
          qualityProfileInputs={runtime.qualityProfileInputs}
          runtimeCaptureSafe={runtimeCaptureSafe}
          hardIsolateNonTargets={hardIsolateNonTargets}
          isolateNonTargets={Boolean(runtimeFocusIsolation && runtimeHighlightedTargets.length > 0)}
          sceneVersion={sceneVersion}
          sectorMarkers={runtime.sectorMarkers}
          sectionToggles={runtime.sectionToggles}
          sectionVisibleBoothPlacements={runtime.sectionVisibleBoothPlacements}
          setSceneUserData={setSceneUserData}
          visualProfile={runtime.visualProfile}
          walkRegions={runtime.walkRegions}
        />
      </ExpoWorldSceneErrorBoundary>
    </>
  );
}
