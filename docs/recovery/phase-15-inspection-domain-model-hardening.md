# Phase 15: Inspection Domain Model Hardening

## What Changed

Phase 15 moved world inspection from a transport-oriented store to a reducer-driven domain model.

The important architectural shift is:

- inspection is no longer modeled as a mutable store with incidental state snapshots
- inspection is now modeled as domain state + explicit events + selectors

This phase also reduced the remaining compatibility authority of `ExpoWorldScene.tsx` and promoted scene analytics into a provider/layer contract.

## Inspection Domain Model

Canonical inspection file after this phase:

- `src/modules/expo/runtime/world/inspection/worldInspectionState.tsx`

The new domain model contains:

- raw sources
- active focus
- scene reference
- derived summary through inspection selectors

### Inspection Events

The reducer now handles explicit domain events:

- `CENTER_TARGET_UPDATED`
- `CLICK_TARGET_UPDATED`
- `SOURCE_REGISTERED`
- `SOURCE_REMOVED`
- `SCENE_REF_UPDATED`

### Domain State Shape

The inspection state now separates:

- `rawSources`
  - `city`
  - `stadium`
- `activeFocus`
  - `center`
  - `click`
- `sceneRef`

This is materially different from the old “snapshot transport store” model.

## Inspection Selectors

The inspection boundary now exposes explicit domain selectors:

- `useInspectionFocus()`
- `useInspectionTargets()`
- `useInspectionSummary()`
- `useInspectionOperatorSummary()`

This means operator code now consumes inspection meaning from inspection-domain hooks rather than reconstructing the same meaning locally.

## Operator Summary Pipeline

Operator summary is now clearer:

- operator does not build booth inspection entries inline anymore
- inspection domain owns the booth-to-summary selector path

Primary operator consumer:

- `src/modules/expo/runtime/operator/state/useExpoOperatorLayer.tsx`

The operator layer still passes booth placement context, but the summary derivation is now inspection-owned.

## ExpoWorldScene Compatibility Surface

`src/modules/expo/components/ExpoWorldScene.tsx` is now explicitly marked as:

- legacy compatibility surface only

What changed:

- no compatibility re-exports remain there
- it is now a thin alias-style entry into `ExpoWorldSceneRoot`
- new scene logic should not be added there

This removes hidden authority from the old file.

## Scene Analytics Provider / Layer

Scene analytics is no longer just a side-effect hook.

New canonical files:

- `src/modules/expo/runtime/world/scene/ExpoWorldAnalyticsProvider.tsx`
- `src/modules/expo/runtime/world/scene/ExpoWorldAnalyticsLayer.tsx`

The provider now owns analytics state through a reducer.

The layer now owns:

- scene loaded tracking
- booth viewed tracking
- sector entered tracking
- district booth zone replacement side effect

This gives analytics a clearer lifecycle and ownership boundary inside the scene family.

## What Remains Transitional

- inspection domain still keeps `sceneRef` inside the same provider state instead of splitting scene transport concerns further
- operator summary still accepts booth placement context as an input, even though the summary derivation now lives in inspection
- `ExpoWorldScene.tsx` still exists for compatibility, even though it no longer owns meaningful scene authority
- analytics is now a provider/layer contract, but not yet a larger event bus or cross-runtime analytics domain
