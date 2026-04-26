# Phase 02: Canonical Runtime Planning

## Goal

Move expo world/screen planning ownership out of `runtime/world` and into a canonical planning package under:

- `src/modules/expo/runtime/planning/**`

This phase does not redesign the expo visuals. It creates the architectural boundary that later zonal planner work can build on.

## What Became Canonical

The canonical planning home is now:

- `src/modules/expo/runtime/planning/index.ts`
- `src/modules/expo/runtime/planning/world-plan/buildCanonicalWorldPlan.ts`
- `src/modules/expo/runtime/planning/screens/*`
- `src/modules/expo/runtime/planning/zones/*`
- `src/modules/expo/runtime/planning/legacy/worldCityGeometry.ts`

Canonical ownership moved here for:

- world plan composition
- screen surface planning composition
- screen socket planning composition
- screen assignment composition
- explicit zone-oriented planning adapters

## What Remained Compatibility-Only

These files remain live, but they are compatibility surfaces and should not receive new planning logic:

- `src/modules/expo/runtime/world/WorldCitySkeletonLayout.ts`
- `src/modules/expo/layout-engine.ts`
- `src/modules/expo/world-contract.ts`
- `src/modules/expo/sceneWorld.ts`
- `src/modules/expo/runtime/world/ExpoWorldScene.tsx`
- `src/modules/expo/components/ExpoWorldHud.tsx`
- `src/modules/expo/lib/sceneDataSource.ts`

## Runtime/World Ownership After This Phase

`runtime/world` is now expected to:

- consume typed planning outputs
- render geometry, materials, scene graph, and visibility
- avoid being the primary authoring home for planning rules

`WorldCitySkeleton.tsx` now consumes a single canonical world plan:

- `buildCanonicalWorldPlan(...)`

instead of directly assembling screen/world planning from the legacy helper bag.

## Zone Modules Introduced

This phase introduces explicit planning modules for:

- `arrival`
- `left-district`
- `center-spine`
- `right-district`
- `tower-cluster`
- `rear-campus`

These are still adapter-style planners in this phase.
They are not the final zonal redesign.
Their purpose is to establish the canonical planning seam and stop `runtime/world` from remaining the long-term owner.

## Files That Should No Longer Receive New Planning Logic

Do not add new planning logic to:

- `src/modules/expo/runtime/world/WorldCitySkeletonLayout.ts`
- `src/modules/expo/layout-engine.ts`
- `src/modules/expo/world-contract.ts`
- `src/modules/expo/sceneWorld.ts`
- `src/modules/expo/runtime/world/ExpoWorldScene.tsx`

New planning logic should land under:

- `src/modules/expo/runtime/planning/**`

## Remaining Architectural Debt

This phase does not yet solve:

- full zonal redesign of screen placement
- rear campus becoming a first-class planning peer instead of an adapter
- operator tooling separation from HUD
- backend/shared contract cleanup
- JS/TS duplicate backend surface cleanup

Those remain future recovery phases.
