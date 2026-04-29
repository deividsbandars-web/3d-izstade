// LEGACY COMPATIBILITY SURFACE ONLY. Do not add new scene logic here.
import { Loader } from '@react-three/drei';
import type { ExpoMode } from '../state/expoRuntime';
import type {
  ExpoStartView,
  ExpoWorldContract,
} from '../world-contract';
import { ExpoWorldSceneRoot } from '../runtime/world/scene/ExpoWorldSceneRoot';
import { setWorldSceneUserData } from '../runtime/world/scene/worldSceneUserData';

interface ExpoWorldSceneProps {
  activeZone: any;
  debug: boolean;
  guests: any[];
  inspectionEnabled: boolean;
  mobileMoveIntent?: { f: boolean; b: boolean; l: boolean; r: boolean; s?: boolean };
  mode: ExpoMode;
  onMove: (pos: number[]) => void;
  runtimeLayerToggles?: {
    booths: boolean;
    city: boolean;
    promenade: boolean;
    skyline: boolean;
    stadium: boolean;
  };
  runtimeCaptureSafe?: boolean;
  runtimeHighlightedTargets?: string[];
  runtimeSectionToggles?: {
    arrival: boolean;
    left: boolean;
    middle: boolean;
    right: boolean;
    stadium: boolean;
  };
  sceneVersion: string | null;
  startViewOverride?: ExpoStartView | null;
  worldContract: ExpoWorldContract;
  zoneSystem: any;
}

export function ExpoWorldScene({
  activeZone,
  debug,
  guests: _guests,
  inspectionEnabled,
  mobileMoveIntent,
  mode,
  onMove,
  runtimeLayerToggles,
  runtimeCaptureSafe = false,
  runtimeHighlightedTargets = [],
  runtimeSectionToggles,
  sceneVersion,
  startViewOverride,
  worldContract,
  zoneSystem,
}: ExpoWorldSceneProps) {
  return (
    <ExpoWorldSceneRoot
      activeZone={activeZone}
      debug={debug}
      inspectionEnabled={inspectionEnabled}
      mobileMoveIntent={mobileMoveIntent}
      mode={mode}
      onMove={onMove}
      runtimeCaptureSafe={runtimeCaptureSafe}
      runtimeHighlightedTargets={runtimeHighlightedTargets}
      runtimeLayerToggles={runtimeLayerToggles}
      runtimeSectionToggles={runtimeSectionToggles}
      sceneVersion={sceneVersion}
      setSceneUserData={setWorldSceneUserData}
      startViewOverride={startViewOverride}
      worldContract={worldContract}
      zoneSystem={zoneSystem}
    />
  );
}

export function Expo3DLoader() {
  return <Loader />;
}
