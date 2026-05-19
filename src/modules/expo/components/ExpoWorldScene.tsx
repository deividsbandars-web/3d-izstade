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
  isTouchDevice: boolean;
  mobileMoveIntent?: { f: boolean; b: boolean; l: boolean; r: boolean; s?: boolean; turnL?: boolean; turnR?: boolean; jump?: boolean; lift?: boolean; lookX?: number };
  mode: ExpoMode;
  onMove: (pos: number[]) => void;
  runtimeFocusIsolation?: boolean;
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
  isTouchDevice,
  mobileMoveIntent,
  mode,
  onMove,
  runtimeFocusIsolation,
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
      isTouchDevice={isTouchDevice}
      mobileMoveIntent={mobileMoveIntent}
      mode={mode}
      onMove={onMove}
      runtimeFocusIsolation={runtimeFocusIsolation}
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
