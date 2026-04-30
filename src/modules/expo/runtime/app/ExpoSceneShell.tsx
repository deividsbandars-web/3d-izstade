import type { ExpoMode } from '../../state/expoRuntime';
import { ExpoWorldScene } from '../world';

export function ExpoSceneShell({
  activeZone,
  debug,
  guests,
  inspectionEnabled,
  mobileMoveIntent,
  mode,
  onMove,
  runtimeFocusIsolation,
  runtimeHighlightedTargets,
  runtimeLayerToggles,
  runtimeSectionToggles,
  sceneVersion,
  startViewOverride,
  worldContract,
  zoneSystem,
}: {
  activeZone: unknown;
  debug: boolean;
  guests: unknown[];
  inspectionEnabled: boolean;
  mobileMoveIntent: { f: boolean; b: boolean; l: boolean; r: boolean; s: boolean };
  mode: ExpoMode;
  onMove: (position: number[]) => void;
  runtimeFocusIsolation?: boolean;
  runtimeHighlightedTargets?: string[];
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
  startViewOverride: unknown;
  worldContract: unknown;
  zoneSystem: unknown;
}) {
  return (
    <ExpoWorldScene
      activeZone={activeZone as never}
      debug={debug}
      guests={guests as never}
      inspectionEnabled={inspectionEnabled}
      mobileMoveIntent={mobileMoveIntent}
      mode={mode}
      onMove={onMove}
      runtimeFocusIsolation={runtimeFocusIsolation}
      runtimeHighlightedTargets={runtimeHighlightedTargets}
      runtimeLayerToggles={runtimeLayerToggles}
      runtimeSectionToggles={runtimeSectionToggles}
      sceneVersion={sceneVersion}
      startViewOverride={startViewOverride as never}
      worldContract={worldContract as never}
      zoneSystem={zoneSystem as never}
    />
  );
}
