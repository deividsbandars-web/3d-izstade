# Phase 12: World Inspection Provider And Canvas Shell Extraction

## What moved out of `ExpoWorldScene.tsx`

This phase removed the remaining top-level scene orchestration that still made `src/modules/expo/components/ExpoWorldScene.tsx` the practical canvas/inspection choke point.

Moved out:

- Canvas orchestration
- player layer mounting
- debug layer mounting
- inspection bridge / selection transport mounting

`ExpoWorldScene.tsx` now behaves as a thinner scene entry that:

- derives visible booth placements and scene analytics inputs
- normalizes runtime layer/section state
- mounts the high-level canvas shell

## New canvas shell contract

Canonical canvas boundary:

- `src/modules/expo/runtime/world/scene/ExpoWorldCanvasShell.tsx`

This file now owns:

- `<Canvas>` creation
- inspection bridge / click / center inspectors mounting
- debug layer mounting
- scene layers mounting
- player layer mounting

That means the scene entry is no longer the place where all canvas children are manually composed.

## New player / debug layer contract

Player layer:

- `src/modules/expo/runtime/world/scene/ExpoWorldPlayerLayer.tsx`

This file now owns:

- player movement runtime
- collision-aware movement handling
- pointer-lock / fly controls
- player position reporting

Debug layer:

- `src/modules/expo/runtime/world/debug/ExpoWorldDebugLayer.tsx`

This file now owns:

- target highlight mounting
- spawn/walk-corridor debug overlay mounting
- `SpawnDebugOverlay` implementation

This removes debug-only scene helpers from `ExpoWorldScene.tsx`.

## New inspection provider / state contract

Canonical inspection transport boundary:

- `src/modules/expo/runtime/world/inspection/worldInspectionState.tsx`

This introduced:

- `WorldInspectionProvider`
- `useWorldInspection()`
- `useWorldInspectionRegistry(...)`
- `useWorldInspectionPublisher()`

World producers now publish inspection sources through the registry instead of mutating `window.__WARPALA_EXPO_INSPECT_SOURCES__`.

Updated publishers:

- `src/modules/expo/runtime/world/WorldCitySkeleton.tsx`
- `src/modules/expo/runtime/world/ExpoRearCampus.tsx`

Updated consumers:

- `src/modules/expo/runtime/operator/state/useExpoOperatorLayer.tsx`
- `src/modules/expo/runtime/operator/state/useExpoOperatorState.ts`

The center/click inspection transport also no longer uses `window.__WARPALA_EXPO_CENTER_*` or `window.__WARPALA_EXPO_CLICK_*` as the canonical state source.

## What still remains transitional

This is not yet a perfect end-state.

Remaining transitional debt:

- the inspection provider currently uses a shared module-level store plus provider lifecycle reset
- `useExpoOperatorLayer()` still consumes the same store outside strict provider ancestry, even though the runtime is wrapped in `WorldInspectionProvider`
- `ExpoWorldScene.tsx` still owns scene analytics composition and some local scene wrappers
- `WorldInspectionContract` still uses scene-local ray inspection components inside the canvas shell

So the inspection transport is materially less global than before, but not yet fully provider-local in the purest sense.

## Canonical files after this phase

Scene/canvas:

- `src/modules/expo/runtime/world/scene/ExpoWorldCanvasShell.tsx`
- `src/modules/expo/runtime/world/scene/ExpoWorldPlayerLayer.tsx`
- `src/modules/expo/runtime/world/scene/ExpoWorldSceneLayers.tsx`

Inspection:

- `src/modules/expo/runtime/world/inspection/worldInspectionState.tsx`
- `src/modules/expo/runtime/world/inspection/worldInspectionContract.tsx`

Debug:

- `src/modules/expo/runtime/world/debug/ExpoWorldDebugLayer.tsx`
- `src/modules/expo/runtime/world/debug/worldSceneDebugContract.ts`

Scene entry:

- `src/modules/expo/components/ExpoWorldScene.tsx`

## Intentionally deferred

- full scene decomposition
- operator UI redesign
- planning changes
- backend cleanup
- renderer rewrite

This phase was specifically about extracting canvas/player/debug/inspection transport authority, not widening into unrelated runtime or architecture areas.
