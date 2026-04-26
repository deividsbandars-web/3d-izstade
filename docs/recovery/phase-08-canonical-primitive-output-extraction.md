## Phase 08: Canonical Primitive Output Extraction For Towers And Screens

### Goal

Phase 08 pushes tower and screen outputs closer to a canonical primitive/output contract so runtime/world renderers assemble from explicit planning-owned outputs instead of reconstructing shape and presentation rules locally.

This phase does **not** redesign visuals. It reduces authority in two places:

- `runtime/world` renderers
- `runtime/planning/legacy/worldCityGeometry.ts`

### What Moved Out Of Tower Renderers

The main tower shift is that `WorldCityTowers.tsx` is no longer the hidden author of tower assembly shape.

Before this phase, tower planning already owned tower render intent, but the renderer still had too much implicit assembly responsibility.

After this phase:

- zone-owning planners emit tower primitive descriptors
- `tower-cluster` emits tower primitive arrays from its zone planner
- `rear-campus` emits tower primitive arrays from its zone planner
- `WorldCityTowers.tsx` consumes `tower.renderIntent.primitives`

Tower primitive ownership is now centered in:

- [tower-cluster index](/C:/3d/src/modules/expo/runtime/planning/zones/tower-cluster/index.ts)
- [rear-campus index](/C:/3d/src/modules/expo/runtime/planning/zones/rear-campus/index.ts)
- [worldCityGeometry](/C:/3d/src/modules/expo/runtime/planning/legacy/worldCityGeometry.ts) only as metadata carriage for the shared type contract

### What Moved Out Of Screen Renderers

The main screen shift is that surface/socket/assignment renderers no longer act as the primary source of screen primitive assembly.

After this phase:

- `buildScreenSurfacePlan.ts` emits surface primitive arrays
- `buildScreenSocketPlan.ts` emits socket primitive arrays
- `buildScreenAssignmentPlan.ts` emits assignment primitive arrays
- runtime screen renderers primarily consume `renderIntent.primitives`

Canonical planning now owns:

- screen surface primitive structure
- screen socket frame/bridge/antenna primitive structure
- assignment presentation primitive structure

This moved authority out of:

- [WorldCityScreenSurfaces](/C:/3d/src/modules/expo/runtime/world/WorldCityScreenSurfaces.tsx)
- [WorldCityScreenSockets](/C:/3d/src/modules/expo/runtime/world/WorldCityScreenSockets.tsx)
- [WorldCityScreenAssignments](/C:/3d/src/modules/expo/runtime/world/WorldCityScreenAssignments.tsx)

### What Moved Away From `worldCityGeometry.ts`

`worldCityGeometry.ts` still exists and still carries too much source geometry authority, but it lost another layer of hidden authoring power.

In this phase it became more of:

- a geometry/source metadata carrier
- the home of shared primitive contract types

And less of:

- the hidden source of tower and screen render assembly policy

The authority that moved away from it:

- tower primitive assembly for `tower-cluster`
- tower primitive assembly for `rear-campus`
- screen surface/socket/assignment primitive assembly in planning screen builders

### Zone-Level Section Ownership

Phase 08 preserved and tightened section ownership where planning already had enough local semantics:

- `tower-cluster` towers carry zone-owned `sections`
- `rear-campus` towers carry zone-owned `sections`
- screen surfaces carry planning-owned `sections`
- sockets inherit planning-owned `sections`
- assignments inherit planning-owned `sections`

Central fallback section classification still exists in canonical world-plan composition for entities that do not yet emit zone-owned section metadata directly.

### Canonical Files After This Phase

Planning-authoritative files:

- [planning types](/C:/3d/src/modules/expo/runtime/planning/types/index.ts)
- [worldCityGeometry](/C:/3d/src/modules/expo/runtime/planning/legacy/worldCityGeometry.ts)
- [buildCanonicalWorldPlan](/C:/3d/src/modules/expo/runtime/planning/world-plan/buildCanonicalWorldPlan.ts)
- [buildScreenSurfacePlan](/C:/3d/src/modules/expo/runtime/planning/screens/buildScreenSurfacePlan.ts)
- [buildScreenSocketPlan](/C:/3d/src/modules/expo/runtime/planning/screens/buildScreenSocketPlan.ts)
- [buildScreenAssignmentPlan](/C:/3d/src/modules/expo/runtime/planning/screens/buildScreenAssignmentPlan.ts)
- [tower-cluster zone planner](/C:/3d/src/modules/expo/runtime/planning/zones/tower-cluster/index.ts)
- [rear-campus zone planner](/C:/3d/src/modules/expo/runtime/planning/zones/rear-campus/index.ts)

Consumer files:

- [WorldCityTowers](/C:/3d/src/modules/expo/runtime/world/WorldCityTowers.tsx)
- [WorldCityScreenSurfaces](/C:/3d/src/modules/expo/runtime/world/WorldCityScreenSurfaces.tsx)
- [WorldCityScreenSockets](/C:/3d/src/modules/expo/runtime/world/WorldCityScreenSockets.tsx)
- [WorldCityScreenAssignments](/C:/3d/src/modules/expo/runtime/world/WorldCityScreenAssignments.tsx)

### What Still Remains Centralized

- `worldCityGeometry.ts` still owns too much source geometry generation
- `buildCanonicalWorldPlan.ts` still performs fallback section classification for entities without zone-owned section metadata
- not all tower/screen primitive generation is zone-local yet
- some primitive consumption details remain renderer-side

### What Still Remains Renderer-Side

Renderer interpretation debt still exists, but it is smaller:

- `WorldCityScreenSockets.tsx` still draws box-edge wire treatment locally
- `WorldCityScreenAssignments.tsx` still applies near/mid/far text visibility filtering locally
- `WorldCityTowers.tsx` still owns material application, though no longer tower primitive assembly policy

### Deferred Debt

This phase intentionally did **not** do:

- visual redesign
- operator/HUD split
- backend cleanup
- full `ExpoWorldScene.tsx` decomposition
- full breakup of `worldCityGeometry.ts`
- full primitive-level extraction for every remaining world entity
