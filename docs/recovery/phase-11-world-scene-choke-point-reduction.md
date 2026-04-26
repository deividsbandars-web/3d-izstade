# Phase 11: World Scene Choke Point Reduction

## What moved out of `ExpoWorldScene.tsx`

This phase reduced `src/modules/expo/components/ExpoWorldScene.tsx` from being the place that simultaneously owned:

- inspection/probe helpers
- debug/layer/section normalization
- analytics and zone-replacement effects
- the main scene composition block for world layers

Those responsibilities now live behind clearer scene-level boundaries:

- inspection/probe contract:
  - `src/modules/expo/runtime/world/inspection/worldInspectionContract.tsx`
- debug/layer visibility contract:
  - `src/modules/expo/runtime/world/debug/worldSceneDebugContract.ts`
- scene analytics / zone registration contract:
  - `src/modules/expo/runtime/world/scene/useExpoWorldSceneAnalytics.ts`
- scene layer composition contract:
  - `src/modules/expo/runtime/world/scene/ExpoWorldSceneLayers.tsx`

`ExpoWorldScene.tsx` still owns the top-level scene composition handoff, player wiring, and some scene-local wrappers such as `SpawnDebugOverlay`, but it no longer owns all downstream scene/debug/inspection logic inline.

## New inspection / probe contract

Inspection/probe building is now canonicalized in:

- `src/modules/expo/runtime/world/inspection/worldInspectionContract.tsx`

This contract owns:

- scene bridge setup
- center-target inspection raycast
- click inspection raycast
- target-basket highlight behavior

This means operator-facing inspection data is no longer built as incidental inline JSX inside `ExpoWorldScene.tsx`.

## New debug / layer visibility contract

Debug/layer/section normalization now lives in:

- `src/modules/expo/runtime/world/debug/worldSceneDebugContract.ts`

This contract owns:

- normalized layer toggle defaults
- normalized section toggle defaults
- section matching helper for scene-level booth filtering

This removed ad-hoc toggle normalization and section heuristics from `ExpoWorldScene.tsx`.

## Scene layer composition boundary

The main world-layer JSX composition moved into:

- `src/modules/expo/runtime/world/scene/ExpoWorldSceneLayers.tsx`

That file now owns the composition of:

- ground plane
- promenade
- city skeleton
- rear campus
- wayfinding
- skyline ring
- evidence probe
- booth group
- empty-booth fallback

`ExpoWorldScene.tsx` now mounts this as one scene-layer contract instead of inlining the whole block.

## What still remains in the choke point

This phase did not fully decompose the scene.

Remaining choke-point debt still inside `ExpoWorldScene.tsx` includes:

- player/camera controls and movement reporting
- spawn debug overlay component definition
- some scene-local wrappers for world renderers
- the final top-level `<Canvas>` orchestration and player mount

That remaining debt is smaller and clearer than before, but it still exists.

## Canonical files after this phase

Canonical scene-boundary files now are:

- `src/modules/expo/components/ExpoWorldScene.tsx`
- `src/modules/expo/runtime/world/debug/worldSceneDebugContract.ts`
- `src/modules/expo/runtime/world/inspection/worldInspectionContract.tsx`
- `src/modules/expo/runtime/world/scene/ExpoWorldSceneLayers.tsx`
- `src/modules/expo/runtime/world/scene/useExpoWorldSceneAnalytics.ts`

App-shell and operator boundaries from earlier phases remain canonical:

- `src/modules/expo/runtime/app/ExpoSceneShell.tsx`
- `src/modules/expo/runtime/operator/state/useExpoOperatorLayer.tsx`

## Deferred debt

Intentionally deferred:

- full `ExpoWorldScene.tsx` breakup
- renderer-level rewrite
- operator UI redesign
- planning changes
- backend cleanup

This phase was specifically about reducing the world-scene choke point without creating a new scope blowout.
