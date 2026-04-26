# Phase 04: Central Geometry And Suppression Debt Reduction

## Goal

Reduce two remaining compensation layers:

- centralized geometry pool authority
- render-time hidden-ID suppression authority

This phase does **not** redesign visuals or rebuild world rendering. It moves more world inclusion/exclusion intent into canonical planning outputs.

## What Centralized Geometry Ownership Was Reduced

Before this phase:

- zones consumed geometry mainly from one broad shared mass bag plus shared plane arrays
- geometry ownership was still too centralized inside `planning/legacy/worldCityGeometry.ts`
- `getCityZoneGeometry()` largely acted as a position-based slicer over pooled geometry

After this phase:

- `ExpoPlanningGeometryPools` now exposes named geometry categories instead of one undifferentiated `masses` pool
- canonical planning now distinguishes:
  - arrival gateway masses
  - boulevard edge masses
  - showcase masses
  - right-support masses
  - media-wall masses
  - discovery edge masses
  - discovery landmark masses
  - discovery support masses
  - observatory masses
  - signature masses
  - skybridge masses
- `zones/shared.ts` now selects from explicit category pools per zone

This means zones no longer depend on one anonymous shared mass pool as the hidden source of truth.

## What Suppression / Filtering Moved Upstream

Before this phase:

- `WorldCitySkeleton.tsx` contained large hidden-ID suppression sets for planes and masses
- world rendering still had to delete junk after canonical plan composition

After this phase:

- renderability decisions for city planes and masses now live in:
  - `src/modules/expo/runtime/planning/world-plan/buildCanonicalWorldPlan.ts`
- world-plan now applies:
  - explicit plane renderability rules
  - explicit mass renderability rules
  - non-renderable ID and pattern filtering
- `WorldCitySkeleton.tsx` no longer owns the giant hidden-ID graveyard for city planes and masses

The runtime consumer now mainly does:

- section visibility filtering
- plan consumption
- render orchestration

instead of large-scale junk suppression.

## Canonical Files After This Phase

Planning authority:

- `src/modules/expo/runtime/planning/world-plan/buildCanonicalWorldPlan.ts`
- `src/modules/expo/runtime/planning/types/index.ts`
- `src/modules/expo/runtime/planning/zones/shared.ts`
- `src/modules/expo/runtime/planning/zones/**`

Runtime consumers:

- `src/modules/expo/runtime/world/WorldCitySkeleton.tsx`
- `src/modules/expo/runtime/world/ExpoRearCampus.tsx`

## Compatibility / Legacy Files

Still compatibility or legacy-biased:

- `src/modules/expo/runtime/planning/legacy/worldCityGeometry.ts`
- `src/modules/expo/runtime/world/WorldCitySkeletonLayout.ts`
- `src/modules/expo/layout-engine.ts`
- `src/modules/expo/world-contract.ts`
- `src/modules/expo/sceneWorld.ts`

These must not become the place for new planning ownership.

## What Still Remains Centralized

This phase intentionally did **not** remove all central debt:

- legacy geometry generation still exists in `planning/legacy/worldCityGeometry.ts`
- section visibility toggles still apply at runtime in `WorldCitySkeleton.tsx`
- rear-campus rendering is still specialized
- `WorldCityPlanes.tsx` still consumes a narrow subset of the full plane plan

## Debt Intentionally Deferred

- full removal of legacy geometry builders
- full elimination of runtime section filtering
- `ExpoWorldScene.tsx` decomposition
- operator/HUD split
- backend cleanup
- visual redesign

## Net Effect

This phase makes the architecture more truthful:

- zones own more of the geometry selection that affects their output
- canonical world plan owns more renderability intent
- `WorldCitySkeleton.tsx` now suppresses much less and consumes a cleaner plan
