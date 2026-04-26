# Phase 14: Expo World Scene Legacy Helper And Fallback Debt Reduction

## What Was Removed From ExpoWorldScene.tsx

Phase 14 removed the remaining fallback/scaffold ownership from `src/modules/expo/components/ExpoWorldScene.tsx`.

After this phase, `ExpoWorldScene.tsx` is a thin scene entry that:

- re-exports legacy-compatible scene helpers
- forwards scene props into `ExpoWorldSceneRoot`
- uses shared scene user-data writing through a dedicated helper
- exposes `Expo3DLoader`

It no longer owns:

- fallback city scaffold implementation
- backdrop sanitization/fallback city asset wrapper implementation
- legacy scene scaffold wrappers
- scene user-data helper implementation

## New Fallback / Scaffold Ownership

Fallback ownership is now explicit:

- `src/modules/expo/runtime/world/fallback/ExpoWorldFallbackCity.tsx`

This file now owns:

- fallback city scaffold
- scene error boundary for city asset fallback
- backdrop sanitization wrapper
- primitive city fallback asset contract

Legacy scaffold ownership is now explicit:

- `src/modules/expo/runtime/world/scaffold/ExpoWorldLegacySceneScaffold.tsx`

This file now owns:

- legacy scene helpers that are not part of the canonical scene entry
- `Guests`
- `CleanExpoCitySkeleton`
- legacy rear-campus wrapper compatibility

Shared scene user-data writing now lives in:

- `src/modules/expo/runtime/world/scene/worldSceneUserData.ts`

## Scene Provider / Layer Family Contract

The scene family is clearer after this phase.

Canonical scene/runtime family:

- `src/modules/expo/runtime/world/scene/ExpoWorldSceneRoot.tsx`
- `src/modules/expo/runtime/world/scene/useExpoWorldSceneRuntime.ts`
- `src/modules/expo/runtime/world/scene/ExpoWorldCanvasShell.tsx`
- `src/modules/expo/runtime/world/scene/ExpoWorldSceneLayers.tsx`
- `src/modules/expo/runtime/world/scene/ExpoWorldPlayerLayer.tsx`
- `src/modules/expo/runtime/world/scene/worldSceneUserData.ts`

Canonical inspection family:

- `src/modules/expo/runtime/world/inspection/worldInspectionState.tsx`
- `src/modules/expo/runtime/world/inspection/worldInspectionContract.tsx`

Canonical debug family:

- `src/modules/expo/runtime/world/debug/worldSceneDebugContract.ts`
- `src/modules/expo/runtime/world/debug/ExpoWorldDebugLayer.tsx`

This makes the world scene surface easier to read:

- top-level scene entry
- scene runtime/root
- canvas shell
- player/debug layers
- inspection provider boundary
- fallback/scaffold quarantine

## Operator Summary Coupling

Operator summary coupling was reduced one more step.

New inspection selector:

- `useWorldInspectionOperatorSummary(...)`

This moved booth-to-inspection summary shaping closer to the inspection boundary instead of leaving that reconstruction inline in the operator layer.

The operator layer still consumes inspection meaning, but it now does so through a clearer selector contract.

## What Still Remains Transitional

- inspection state is still external-store based, not a fully reducer-driven React-only model
- `ExpoWorldScene.tsx` is thin now, but legacy public exports still keep some compatibility surface alive
- operator summary still uses booth placement data as an input to the inspection boundary
- scene analytics is still a runtime hook, not yet a fully independent provider/layer family
