# Phase 05: Zone-Local Geometry Ownership Extraction

## Goal

Reduce the remaining hidden authority of:

- `src/modules/expo/runtime/planning/legacy/worldCityGeometry.ts`

by moving more geometry ownership or authoritative selection into zone-local planning paths, and by reducing renderer-side narrowing of canonical outputs.

## What Geometry Authority Moved Out Of Legacy `worldCityGeometry.ts`

Before this phase:

- critical zones still relied on shared geometry slicing through common planning helpers
- even after Phase 04 category splitting, geometry selection for city zones was still too centralized

After this phase:

- `left-district`
- `right-district`
- `center-spine`
- `tower-cluster`
- `arrival`

now own their geometry selection directly inside their zone folders instead of relying on one generic shared city-geometry accessor.

The most important change is not just category naming. The important change is:

- geometry selection authority moved into zone-local files
- tower-cluster now emits its own local podium planes and support masses from tower data
- arrival no longer goes through a generic zone-geometry selector

## Which Zones Now Own More Of Their Geometry

### Arrival

- now directly owns its arrival planes and gateway masses from canonical geometry pools
- no longer depends on the old shared `getCityZoneGeometry()` path

### Left District

- now uses `zones/left-district/geometry.ts`
- owns authoritative selection of left-district planes and masses from the canonical geometry pools

### Right District

- now uses `zones/right-district/geometry.ts`
- owns authoritative selection of right-district planes and masses

### Center Spine

- now uses `zones/center-spine/geometry.ts`
- owns authoritative selection of central planes and masses instead of relying on a shared zone slicer

### Tower Cluster

- now uses `zones/tower-cluster/geometry.ts`
- owns:
  - tower selection
  - local podium planes
  - local support masses / beacons

This is a real transfer of geometry authority, not a wrapper rename.

### Rear Campus

- remains a first-class planner peer from earlier phases
- continues to own its geometry/planning through the rear-campus zone path

## What Renderer Interpretation Was Reduced

### `WorldCityPlanes.tsx`

Before this phase:

- only consumed arrival planes
- ignored most canonical plane outputs

After this phase:

- consumes a richer canonical plane stream through:
  - `filteredCityPlanes`

This reduces renderer-side narrowing and makes the canonical world plan more directly consumable.

### `WorldCitySkeleton.tsx`

- now passes the richer canonical plane output into the renderer
- remains a consumer of visibility-filtered outputs, not the place where geometry/planning is re-authored

## What Still Remains Centralized

- `worldCityGeometry.ts` still generates many primitive/source geometry families
- not all per-zone geometry is built locally yet
- rear-campus rendering remains specialized
- mass/plane construction is still partly dependent on shared legacy generators for some zones

## Canonical Files After This Phase

Planning:

- `src/modules/expo/runtime/planning/world-plan/buildCanonicalWorldPlan.ts`
- `src/modules/expo/runtime/planning/types/index.ts`
- `src/modules/expo/runtime/planning/zones/arrival/index.ts`
- `src/modules/expo/runtime/planning/zones/left-district/geometry.ts`
- `src/modules/expo/runtime/planning/zones/right-district/geometry.ts`
- `src/modules/expo/runtime/planning/zones/center-spine/geometry.ts`
- `src/modules/expo/runtime/planning/zones/tower-cluster/geometry.ts`
- `src/modules/expo/runtime/planning/zones/**/index.ts`

World consumers:

- `src/modules/expo/runtime/world/WorldCityPlanes.tsx`
- `src/modules/expo/runtime/world/WorldCitySkeleton.tsx`

## Still-Deferred Debt

- full elimination of legacy geometry generators
- full unification of rear-campus and city rendering
- full decomposition of `ExpoWorldScene.tsx`
- visual redesign
- operator/HUD split
- backend cleanup
