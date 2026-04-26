# Phase 06: Canonical Mass Intent And Visibility Extraction

## Goal

Move more world/mass render policy and section visibility ownership out of:

- `src/modules/expo/runtime/world/WorldCityMasses.tsx`
- `src/modules/expo/runtime/world/WorldCitySkeleton.tsx`

and into canonical planning outputs under:

- `src/modules/expo/runtime/planning/**`

## What Mass Render-Intent Moved Out Of `WorldCityMasses.tsx`

Before this phase:

- `WorldCityMasses.tsx` decided whether a mass should:
  - skip its base
  - glow
  - show a horizontal cap
  - show side inset detail
  - show a rear spine
  - show a front wing
  - show signature band detail
- it also locally suppressed masses that overlapped the stadium reserve

After this phase:

- `CityMass` now carries canonical planning-owned metadata:
  - `renderIntent`
  - `sections`
- canonical world-plan composition now computes:
  - emissive color / intensity
  - decorative visibility flags
  - base skipping
  - stadium-reserve exclusion intent
- `WorldCityMasses.tsx` now consumes `mass.renderIntent` instead of inferring those policies itself

This is a real transfer of policy ownership, not a rename of renderer conditionals.

## What Visibility Decisions Moved Upstream Into Planning

Before this phase:

- `WorldCitySkeleton.tsx` derived section ownership from raw positions:
  - `arrival`
  - `left`
  - `middle`
  - `right`
- it then filtered planes, masses, towers, screens, and sockets at runtime using local coordinate heuristics

After this phase:

- canonical outputs now carry section metadata directly:
  - `CityPlane.sections`
  - `CityMass.sections`
  - `CityTower.sections`
  - `CityScreenSurface.sections`
  - `CityScreenSocket.sections`
- `WorldCitySkeleton.tsx` now filters on planning-owned section metadata instead of recomputing zone/section identity from coordinates

This reduces runtime cleanup/filtering authority and makes canonical plan visibility intent more explicit.

## What Still Remains Renderer-Side

- `WorldCityMasses.tsx` still owns the concrete mesh assembly for:
  - box base
  - cap mesh
  - side inset meshes
  - rear spine mesh
  - front wing mesh
  - signature vertical detail mesh
- `WorldCityPlanes.tsx` still owns visual tone/material application for structural planes
- runtime section toggles still exist at the consumer level, but they now operate on planning-owned `sections` metadata rather than raw coordinate heuristics

## What Still Remains Centralized

- `src/modules/expo/runtime/planning/legacy/worldCityGeometry.ts` still generates many source geometry families
- section membership is currently resolved centrally in canonical world-plan composition
- some tower/screen/plane family generation still originates from shared legacy geometry helpers
- renderer-side mesh composition still exists for masses and towers, even though more of the display intent is now canonical

## Canonical Files After This Phase

Planning:

- `src/modules/expo/runtime/planning/legacy/worldCityGeometry.ts`
- `src/modules/expo/runtime/planning/types/index.ts`
- `src/modules/expo/runtime/planning/world-plan/buildCanonicalWorldPlan.ts`

World consumers:

- `src/modules/expo/runtime/world/WorldCityMasses.tsx`
- `src/modules/expo/runtime/world/WorldCitySkeleton.tsx`

## Intentionally Deferred Debt

- full elimination of `worldCityGeometry.ts`
- complete removal of central section classification
- full mass/tower primitive construction extraction
- operator/HUD split
- backend cleanup
- `ExpoWorldScene.tsx` decomposition
- visual redesign
