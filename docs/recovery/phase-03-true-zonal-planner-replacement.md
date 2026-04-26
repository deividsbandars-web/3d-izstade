# Phase 03: True Zonal Planner Replacement

## Goal

Replace the adapter-grade zone layer with real zonal planning ownership under:

- `src/modules/expo/runtime/planning/**`

This phase does **not** finish the entire planner rebuild. It makes zonal planners the canonical authoring surface for world/screen planning decisions and keeps `runtime/world` as a consumer.

## What Central Ownership Was Replaced

Before this phase, the planning seam existed, but the actual planning behavior still leaned on a central model:

- global screen surfaces built first
- global sockets built first
- global assignments built first
- zones mostly filtered or relabeled the global result

After this phase:

- each zone planner owns its own local screen surface plan
- each zone planner owns its own local socket plan
- each zone planner owns its own local assignment plan
- the canonical world plan composes zonal outputs

`buildCanonicalWorldPlan()` is now a zone composer, not a hidden global screen allocator.

## How Each Zone Participates

### Arrival

- owns arrival geometry participation
- currently has no active screen surfaces
- remains a first-class zone in the canonical planning contract

### Left District

- owns left-district screen surfaces
- owns left-district socket generation
- owns left-district sponsor assignment output
- uses zone-local booth selection rules and density caps

### Center Spine

- owns center-spine surfaces, sockets, and assignments
- remains lower-density than flank districts by explicit zone caps

### Right District

- owns right-district screen surfaces
- owns right-district socket generation
- owns right-district sponsor assignment output

### Tower Cluster

- owns tower ribbon / crown screen planning
- consumes tower geometry but owns screen planning decisions for tower-layer exposure

### Rear Campus

- now participates through the same zone-plan contract shape as the other zones
- owns:
  - rear-campus screen surfaces
  - rear-campus sockets
  - rear-campus assignments
  - rear-campus extension data for specialized rendering
- specialized rendering remains separate, but planning ownership is now first-class

## Canonical Files

Authoritative planning files for this phase:

- `src/modules/expo/runtime/planning/world-plan/buildCanonicalWorldPlan.ts`
- `src/modules/expo/runtime/planning/zones/shared.ts`
- `src/modules/expo/runtime/planning/zones/arrival/index.ts`
- `src/modules/expo/runtime/planning/zones/left-district/index.ts`
- `src/modules/expo/runtime/planning/zones/center-spine/index.ts`
- `src/modules/expo/runtime/planning/zones/right-district/index.ts`
- `src/modules/expo/runtime/planning/zones/tower-cluster/index.ts`
- `src/modules/expo/runtime/planning/zones/rear-campus/index.ts`
- `src/modules/expo/runtime/planning/screens/buildScreenSurfacePlan.ts`
- `src/modules/expo/runtime/planning/screens/buildScreenSocketPlan.ts`
- `src/modules/expo/runtime/planning/screens/buildScreenAssignmentPlan.ts`
- `src/modules/expo/runtime/planning/types/index.ts`

Runtime consumers updated in this phase:

- `src/modules/expo/runtime/world/WorldCitySkeleton.tsx`
- `src/modules/expo/runtime/world/ExpoRearCampus.tsx`

## Compatibility-Only Files

These remain live, but are not canonical authoring surfaces for new planning logic:

- `src/modules/expo/runtime/world/WorldCitySkeletonLayout.ts`
- `src/modules/expo/layout-engine.ts`
- `src/modules/expo/world-contract.ts`
- `src/modules/expo/sceneWorld.ts`

## What Remains Transitional

This phase intentionally leaves some central assumptions in place:

- legacy geometry pool builders still exist under `planning/legacy/worldCityGeometry.ts`
- `WorldCitySkeleton.tsx` still contains large hidden-ID suppression sets
- `ExpoWorldScene.tsx` remains a large orchestrator
- `rear-campus` rendering is still specialized even though planning is now canonical

This is acceptable for Phase 03. The architectural shift here is:

- zone planners now author real planning behavior
- world-plan now composes zonal outputs
- runtime/world consumes those outputs

## Files That Should No Longer Receive New Planning Logic

Do not add new planning rules to:

- `src/modules/expo/runtime/world/WorldCitySkeletonLayout.ts`
- `src/modules/expo/layout-engine.ts`
- `src/modules/expo/world-contract.ts`
- `src/modules/expo/sceneWorld.ts`
- `src/modules/expo/runtime/world/*` render files unless the change is strictly consumer-side wiring

Future planner work should land in:

- `src/modules/expo/runtime/planning/zones/**`
- `src/modules/expo/runtime/planning/screens/**`
- `src/modules/expo/runtime/planning/world-plan/**`
