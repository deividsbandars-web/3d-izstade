# Phase 13: Scene Provider Hardening And Analytics Extraction

## What Changed

Phase 13 hardened the world inspection boundary and removed the remaining top-level analytics/runtime wrapper ownership from `ExpoWorldScene.tsx`.

The two architectural shifts were:

1. World inspection state stopped being a module-level singleton-style transitional store and became a provider-owned store instance created inside `WorldInspectionProvider`.
2. Scene analytics/runtime wrapper composition moved out of `ExpoWorldScene.tsx` into scene-level runtime/root files.

## Inspection State Hardening

Canonical inspection files after this phase:

- `src/modules/expo/runtime/world/inspection/worldInspectionState.tsx`
- `src/modules/expo/runtime/world/inspection/worldInspectionContract.tsx`

Key changes:

- `WorldInspectionProvider` now owns the inspection store instance through a provider-scoped `useRef(...)`.
- inspection hooks now require provider context instead of silently falling back to a module-global store.
- world sources are registered through `useWorldInspectionRegistry(...)`.
- scene bridge publishing uses `useWorldInspectionPublisher()` instead of `window.__WARPALA_*` globals.

This makes inspection state materially less global than Phase 12.

## Provider / State Lifecycle Contract

The current lifecycle contract is:

- `WorldInspectionProvider` creates one store instance for the mounted scene subtree.
- world producers publish source lists by bucket:
  - `city`
  - `stadium`
- scene bridge publishes:
  - `sceneRef`
  - center selection
  - click selection
- producers clear their own bucket on unmount through `useWorldInspectionRegistry(...)`.

This is now explicit provider-scoped lifecycle management instead of implicit global mutation.

## Operator Summary Decoupling

Operator state no longer reconstructs the nearest inspection summary directly from raw world globals.

Canonical operator-side consumption files after this phase:

- `src/modules/expo/runtime/operator/state/useExpoOperatorLayer.tsx`
- `src/modules/expo/runtime/operator/state/useExpoOperatorState.ts`

Key change:

- `useExpoOperatorLayer(...)` now consumes:
  - `useWorldInspection()`
  - `useWorldInspectionSummary(...)`

That means the inspection boundary now exposes a richer operator-ready summary contract, while operator code remains a consumer instead of becoming the world inspection author.

## ExpoWorldScene Responsibility Reduction

Canonical scene runtime files after this phase:

- `src/modules/expo/runtime/world/scene/ExpoWorldSceneRoot.tsx`
- `src/modules/expo/runtime/world/scene/useExpoWorldSceneRuntime.ts`
- `src/modules/expo/runtime/world/scene/ExpoWorldCanvasShell.tsx`

What moved out of `src/modules/expo/components/ExpoWorldScene.tsx`:

- scene analytics composition
- visible booth selection runtime wrapper
- scene-local runtime aggregation before canvas mount

`ExpoWorldScene.tsx` now acts more like a thin scene entry that delegates runtime composition to `ExpoWorldSceneRoot`.

## What Remains Transitional

Phase 13 did not finish every remaining scene/runtime debt.

Still transitional:

- inspection state still uses an external-store pattern rather than a reducer-driven React-only model
- `ExpoWorldScene.tsx` still contains legacy helper/components and is not yet a tiny file
- operator summary still depends on booth placements as a supplemental input to inspection summary
- scene analytics still lives in dedicated scene runtime files, but not yet in a fully separate provider/layer family

## Canonical Boundaries After Phase 13

Planning:

- `src/modules/expo/runtime/planning/**`

Operator surface:

- `src/modules/expo/runtime/operator/**`

Scene provider / inspection boundary:

- `src/modules/expo/runtime/world/inspection/**`

Scene runtime / analytics boundary:

- `src/modules/expo/runtime/world/scene/**`

Thin scene entry:

- `src/modules/expo/components/ExpoWorldScene.tsx`
