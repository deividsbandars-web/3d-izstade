# Phase 07: Canonical Tower And Screen Intent Extraction

## Goal

Move more tower and screen presentation authority out of:

- `src/modules/expo/runtime/world/WorldCityTowers.tsx`
- `src/modules/expo/runtime/world/WorldCityScreenSurfaces.tsx`
- `src/modules/expo/runtime/world/WorldCityScreenSockets.tsx`
- `src/modules/expo/runtime/world/WorldCityScreenAssignments.tsx`

and into canonical planning outputs under:

- `src/modules/expo/runtime/planning/**`

## What Tower Render-Intent Moved Out Of Runtime/World

Before this phase:

- `WorldCityTowers.tsx` owned:
  - tower decor spec selection
  - podium width/depth policy
  - side fin / rear fin / inset / crown / spire enablement
  - tower-specific emissive policy
  - hidden tower suppression
  - stadium-reserve tower exclusion

After this phase:

- `CityTower` now carries `renderIntent`
- tower-owning zone planners now author that intent directly:
  - `zones/tower-cluster/index.ts`
  - `zones/rear-campus/index.ts`
- `buildCanonicalWorldPlan.ts` filters tower visibility from canonical intent instead of leaving it to the renderer
- `WorldCityTowers.tsx` now consumes planning-owned tower intent instead of reconstructing tower policy locally

This is a real authority transfer, not a renderer rename.

## What Screen Render / Visibility / Assignment Intent Moved Upstream

Before this phase:

- `WorldCityScreenSurfaces.tsx` owned surface profiles and distance rules
- `WorldCityScreenSockets.tsx` owned socket frame/depth/distance/antenna/bridge rules
- `WorldCityScreenAssignments.tsx` owned:
  - semantic chip selection
  - tier accent selection
  - frame geometry sizing
  - detail/subtitle distance thresholds
  - visible assignment display policy
- assignment visibility still depended too much on downstream socket presence

After this phase:

- `CityScreenSurface` now carries planning-owned `renderIntent`
- `CityScreenSocket` now carries planning-owned `renderIntent`
- `CityScreenAssignment` now carries planning-owned `renderIntent`
- canonical screen planners now author this metadata in:
  - `planning/screens/buildScreenSurfacePlan.ts`
  - `planning/screens/buildScreenSocketPlan.ts`
  - `planning/screens/buildScreenAssignmentPlan.ts`
- `buildCanonicalWorldPlan.ts` now:
  - filters visible screen surfaces upstream
  - filters visible screen sockets upstream
  - filters assignments to visible canonical sockets upstream
  - enriches assignments with canonical section ownership

As a result:

- screen consumers now mostly render from explicit metadata
- visible assignment behavior is less dependent on downstream socket heuristics

## What Section Ownership Moved Closer To Zones

This phase did not fully decentralize all section ownership.
But it did push some important section intent closer to zones:

- tower-cluster towers now carry zone-owned section metadata
- rear-campus towers now carry zone-owned section metadata
- left/right/center/rear screen surfaces now receive sections at screen planning time based on the zone that authored them
- sockets inherit planning-owned sections from their surfaces
- assignments inherit planning-owned sections from their sockets

Central canonical composition still resolves fallback section membership for some entities, but more screen/tower entities now get section intent before that fallback layer.

## What Still Remains Renderer-Side

- `WorldCityTowers.tsx` still owns concrete tower mesh assembly
- `WorldCityScreenSurfaces.tsx` still owns concrete screen housing mesh assembly
- `WorldCityScreenSockets.tsx` still owns concrete socket frame mesh assembly
- `WorldCityScreenAssignments.tsx` still owns final text/image mesh layout

The difference now is that these files no longer decide the key presentation policies they used to infer locally.

## What Still Remains Centralized

- `worldCityGeometry.ts` still generates too much upstream source geometry
- fallback section membership is still centrally resolved in canonical composition for entities that do not yet carry zone-owned sections
- tower/screen mesh shape primitives are still built in runtime renderers, not yet expressed as richer canonical primitive outputs

## Canonical Files After This Phase

Planning:

- `src/modules/expo/runtime/planning/legacy/worldCityGeometry.ts`
- `src/modules/expo/runtime/planning/types/index.ts`
- `src/modules/expo/runtime/planning/world-plan/buildCanonicalWorldPlan.ts`
- `src/modules/expo/runtime/planning/screens/buildScreenSurfacePlan.ts`
- `src/modules/expo/runtime/planning/screens/buildScreenSocketPlan.ts`
- `src/modules/expo/runtime/planning/screens/buildScreenAssignmentPlan.ts`
- `src/modules/expo/runtime/planning/zones/tower-cluster/index.ts`
- `src/modules/expo/runtime/planning/zones/rear-campus/index.ts`

World consumers:

- `src/modules/expo/runtime/world/WorldCityTowers.tsx`
- `src/modules/expo/runtime/world/WorldCityScreenSurfaces.tsx`
- `src/modules/expo/runtime/world/WorldCityScreenSockets.tsx`
- `src/modules/expo/runtime/world/WorldCityScreenAssignments.tsx`
- `src/modules/expo/runtime/world/WorldCitySkeleton.tsx`

## Intentionally Deferred Debt

- full elimination of `worldCityGeometry.ts`
- full decentralization of section ownership
- full extraction of mesh-primitive construction for towers/screens
- operator/HUD split
- backend cleanup
- `ExpoWorldScene.tsx` decomposition
- visual redesign
