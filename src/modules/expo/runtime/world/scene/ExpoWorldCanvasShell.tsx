import type * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { EXPO_CITY_QUALITY_TIER, type ExpoMode } from '../../../state/expoRuntime';
import type { ExpoStartView, ExpoWorldContract } from '../../../world-contract';
import type { ExpoWorldLayerToggles, ExpoWorldSectionToggles } from '../debug/worldSceneDebugContract';
import { ExpoWorldDebugLayer } from '../debug/ExpoWorldDebugLayer';
import { CenterScreenInspector, ClickInspector, WorldSceneBridge } from '../inspection/worldInspectionContract';
import type { ExpoBoothPlacement } from '../../../layout-engine';
import type { ExpoDistrictProgramSummary } from '../../../world-contract';
import { EXPO_START_VIEW_KEY } from '../WorldSceneSupport';
import { ExpoWorldPlayerLayer } from './ExpoWorldPlayerLayer';
import { ExpoWorldSceneLayers } from './ExpoWorldSceneLayers';

export function ExpoWorldCanvasShell({
  activeZoneId,
  debug,
  districtPrograms,
  effectiveStartView,
  hardIsolateNonTargets,
  highlightedTargets,
  inspectionEnabled,
  isolateNonTargets,
  layerToggles,
  mobileMoveIntent,
  mode,
  onMove,
  playBounds,
  playerPosition,
  planningBoothPlacements,
  qualityProfileInputs,
  runtimeCaptureSafe,
  sceneVersion,
  sectorMarkers,
  sectionToggles,
  sectionVisibleBoothPlacements,
  setSceneUserData,
  visualProfile,
  walkRegions,
}: {
  activeZoneId: string | null;
  debug: boolean;
  districtPrograms: ExpoDistrictProgramSummary[];
  effectiveStartView: ExpoStartView;
  hardIsolateNonTargets: boolean;
  highlightedTargets: string[];
  inspectionEnabled: boolean;
  isolateNonTargets: boolean;
  layerToggles: ExpoWorldLayerToggles;
  mobileMoveIntent?: { f: boolean; b: boolean; l: boolean; r: boolean; s?: boolean };
  mode: ExpoMode;
  onMove: (position: number[]) => void;
  playBounds: ExpoWorldContract['playBounds'];
  playerPosition: [number, number, number];
  planningBoothPlacements: ExpoBoothPlacement[];
  qualityProfileInputs: ExpoWorldContract['qualityProfileInputs'];
  runtimeCaptureSafe: boolean;
  sceneVersion: string | null;
  sectorMarkers: ExpoWorldContract['sectorMarkers'];
  sectionToggles: ExpoWorldSectionToggles;
  sectionVisibleBoothPlacements: ExpoBoothPlacement[];
  setSceneUserData: (scene: THREE.Scene, key: string, value: unknown) => void;
  visualProfile: ExpoWorldContract['visualProfile'];
  walkRegions: ExpoWorldContract['walkRegions'];
}) {
  return (
    <Canvas
      shadows={EXPO_CITY_QUALITY_TIER === 'quality'}
      dpr={runtimeCaptureSafe ? 1 : (EXPO_CITY_QUALITY_TIER === 'quality' ? [0.85, 1.2] : [0.55, 0.8])}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      performance={{ min: EXPO_CITY_QUALITY_TIER === 'quality' ? 0.5 : 0.85 }}
      camera={{ position: [0, 2, 10], fov: 60, far: 10000 }}
    >
      <WorldSceneBridge
        sceneKey="expo-world-scene"
        setSceneUserData={setSceneUserData}
        startView={effectiveStartView}
        startViewKey={EXPO_START_VIEW_KEY}
      />
      <CenterScreenInspector inspectionEnabled={inspectionEnabled} />
      <ClickInspector clickInspectionEnabled={inspectionEnabled} />

      <ExpoWorldDebugLayer
        hardIsolateNonTargets={hardIsolateNonTargets}
        highlightedTargets={highlightedTargets}
        isolateNonTargets={isolateNonTargets}
        playBounds={playBounds}
        startView={effectiveStartView}
        walkRegions={walkRegions}
      />

      <ExpoWorldSceneLayers
        activeZoneId={activeZoneId}
        districtPrograms={districtPrograms}
        layerToggles={layerToggles}
        mode={mode}
        playerPosition={playerPosition}
        planningBoothPlacements={planningBoothPlacements}
        qualityProfileInputs={qualityProfileInputs}
        runtimeCaptureSafe={runtimeCaptureSafe}
        sceneVersion={sceneVersion}
        sectorMarkers={sectorMarkers}
        sectionToggles={sectionToggles}
        sectionVisibleBoothPlacements={sectionVisibleBoothPlacements}
        visualProfile={visualProfile}
        walkRegions={walkRegions}
      />

      <ExpoWorldPlayerLayer
        bounds={playBounds}
        debug={debug}
        mobileMoveIntent={mobileMoveIntent}
        mode={mode}
        onMove={onMove}
        preserveReviewElevation={inspectionEnabled}
        startView={effectiveStartView}
      />
    </Canvas>
  );
}
