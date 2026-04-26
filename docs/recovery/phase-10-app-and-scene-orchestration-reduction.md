## Phase 10: App And Scene Orchestration Reduction

### Goal

Phase 10 reduces orchestration debt in the expo runtime entry by separating:

- runtime app session concerns
- operator layer composition
- scene shell composition

The target is not a prettier `Expo3D.tsx`.  
The target is less authority concentrated in one entry file.

### What Was Removed From `Expo3D.tsx`

Before this phase, `Expo3D.tsx` directly owned too much:

- operator session/state composition
- operator overlay prop assembly
- runtime touch/session setup
- world scene prop assembly
- runtime error bridge behavior
- branch rendering for menu / unreal / runtime world

After this phase, `Expo3D.tsx` is mainly a high-level entry that:

- loads scene data
- builds `worldContract`
- wires presence + zone system
- mounts dedicated shells

That is still orchestration, but materially less than before.

### New Runtime App Shell Contract

New app-shell files:

- [useExpoRuntimeSession.ts](/C:/3d/src/modules/expo/runtime/app/useExpoRuntimeSession.ts)
- [useExpoRuntimeErrorBridge.ts](/C:/3d/src/modules/expo/runtime/app/useExpoRuntimeErrorBridge.ts)
- [ExpoRuntimeShell.tsx](/C:/3d/src/modules/expo/runtime/app/ExpoRuntimeShell.tsx)
- [ExpoSceneShell.tsx](/C:/3d/src/modules/expo/runtime/app/ExpoSceneShell.tsx)

Contract after this phase:

- `useExpoRuntimeSession`
  - owns runtime mode
  - owns touch-device detection
  - owns mobile movement intent
  - owns initial URL focus lookup
  - owns operator session resolution at runtime-session level

- `useExpoRuntimeErrorBridge`
  - owns runtime error/unhandled-rejection bridge
  - keeps this concern out of `Expo3D.tsx`

- `ExpoRuntimeShell`
  - owns menu / unreal / live-runtime branch mounting
  - mounts operator layer, HUD layer, and scene layer as separate surfaces

- `ExpoSceneShell`
  - is the typed scene boundary between app-shell and world scene
  - composes scene props in one place instead of inline in `Expo3D.tsx`

### New Operator Layer Contract

New operator orchestration file:

- [useExpoOperatorLayer.tsx](/C:/3d/src/modules/expo/runtime/operator/state/useExpoOperatorLayer.tsx)

This hook now owns:

- operator session resolution
- operator review zone definition usage
- operator state initialization
- operator overlay composition
- operator focus/start-view derivation
- operator layer toggles and section toggles exposure

That means `Expo3D.tsx` no longer manually composes the operator overlay prop-by-prop.

The canonical operator surface still remains under:

- [runtime/operator](/C:/3d/src/modules/expo/runtime/operator)

### Scene Shell Boundary

`ExpoSceneShell.tsx` is now the explicit scene boundary between app-shell and runtime/world.

It currently owns:

- scene mount handoff
- typed scene prop contract
- runtime debug/toggle/start-view composition handoff

This is not a full `ExpoWorldScene.tsx` decomposition.
But it is a real step:

- app/HUD/operator composition is no longer directly tangled with scene mounting in one file

### Canonical Files After This Phase

High-level runtime entry:

- [Expo3D.tsx](/C:/3d/src/modules/expo/runtime/app/Expo3D.tsx)

Runtime shells:

- [useExpoRuntimeSession.ts](/C:/3d/src/modules/expo/runtime/app/useExpoRuntimeSession.ts)
- [useExpoRuntimeErrorBridge.ts](/C:/3d/src/modules/expo/runtime/app/useExpoRuntimeErrorBridge.ts)
- [ExpoRuntimeShell.tsx](/C:/3d/src/modules/expo/runtime/app/ExpoRuntimeShell.tsx)
- [ExpoSceneShell.tsx](/C:/3d/src/modules/expo/runtime/app/ExpoSceneShell.tsx)

Operator layer contract:

- [useExpoOperatorLayer.tsx](/C:/3d/src/modules/expo/runtime/operator/state/useExpoOperatorLayer.tsx)

Preserved user/operator split:

- [ExpoWorldHud.tsx](/C:/3d/src/modules/expo/runtime/app/ExpoWorldHud.tsx)
- [runtime/operator](/C:/3d/src/modules/expo/runtime/operator)

### What Still Remains Mixed Or Transitional

- `Expo3D.tsx` still owns data loading, presence, and zone-system composition
- `useExpoOperatorLayer.tsx` still contains a fairly large amount of operator composition logic
- `ExpoSceneShell.tsx` is a thin boundary, not yet a deep scene decomposition
- `ExpoWorldScene.tsx` remains a major choke point

Those are real remaining debts, but authority is no longer concentrated as heavily in `Expo3D.tsx`.
