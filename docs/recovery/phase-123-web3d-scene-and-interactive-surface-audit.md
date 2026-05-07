# Phase 123: Web3D Scene And Interactive Surface Audit

## Summary

Phase 123 audited the current Web3D exhibition city pipeline without implementation changes.

Selected next target:

- `CALCULATOR IN-SCENE SURFACE RECOVERY REVIEW`

Reason:

- the 3D city runtime, booth runtime, and screen planning already exist
- calculators are proven as route-level product surfaces
- calculators are not yet proven as city-bound or booth-bound in-world surfaces
- this is the fastest visible product-value gap to audit next without broad redesign

## Scene Pipeline Audit

### Scene data entry

Scene data enters from:

- `src/modules/expo/hooks/useExpoSceneData.ts`
- `src/modules/expo/runtime/data/sceneDataSource.ts`

Flow:

1. `useExpoSceneData()` loads release scene data on mount.
2. `loadExpoSceneForRelease()` chooses source:
   - seeded fallback in dev
   - Supabase adapter in local dev
   - backend `/api/expo/scene` contract in release path
   - fallback scene if sources fail
3. `Expo3D` builds `worldContract` from scene data.

### World contract and plan build

World contract build point:

- `src/modules/expo/runtime/app/Expo3D.tsx`
- `src/shared/expo/worldContract.ts`

Observed flow:

1. `Expo3D` calls `buildExpoWorldContract(data)`.
2. `buildExpoWorldContract` uses `buildExpoLayoutEngine(companies, sectors)`.
3. Contract contains:
   - `boothPlacements`
   - `sectorMarkers`
   - `districtPrograms`
   - `playBounds`
   - `walkRegions`
   - quality/visual profile inputs

### Render shell

Render shell chain:

- `src/modules/expo/runtime/app/ExpoRuntimeShell.tsx`
- `src/modules/expo/runtime/app/ExpoSceneShell.tsx`
- `src/modules/expo/runtime/world/scene/ExpoWorldSceneRoot.tsx`
- `src/modules/expo/runtime/world/scene/ExpoWorldSceneLayers.tsx`

Observed layer split:

- menu / unreal / city mode split happens in `ExpoRuntimeShell`
- scene state is passed through `ExpoSceneShell`
- scene analytics and canvas shell are attached in `ExpoWorldSceneRoot`
- visible render layers are assembled in `ExpoWorldSceneLayers`

### Interaction state attachment

Interaction state is attached at multiple levels:

- booth click/open actions in `src/modules/expo/runtime/booths/DistrictBooth.tsx`
- booth action resolution in `src/modules/expo/runtime/booths/BoothInteractions.ts`
- player/world runtime state in `src/modules/expo/runtime/world/scene/useExpoWorldSceneRuntime.ts`
- pixel streaming availability in `src/modules/expo/hooks/usePixelStreamingStatus.ts`

### Key pipeline finding

The scene pipeline is real and layered. The current problem is not missing scene infrastructure. The current problem is incomplete proof that all product surfaces that matter to the user are attached to world objects.

## Booth And Screen Audit

### Booth placement

Primary booth runtime files:

- `src/modules/expo/runtime/booths/DistrictBooth.tsx`
- `src/modules/expo/runtime/booths/BoothVisualAssembly.tsx`
- `src/modules/expo/runtime/booths/OpenBoothPavilion.tsx`
- `src/shared/expo/layoutEngine.ts`

Observed behavior:

- booth runtime reads `placement.position` and `placement.rotation`
- booth click directly opens showcase room
- booth visuals are assembled from presentation, tier state, and architecture metrics
- booth collider registration exists

### Booth front / orientation

Current frontality signal:

- booth orientation is driven by `placement.rotation`
- scene/world runtime does not add a second explicit frontality validator on top of placement rotation

Risk:

- if layout-engine rotation is wrong, booth frontality is wrong in-world
- current audit did not find a dedicated validation layer for “booth front faces player path”

### Screen positioning

Primary screen files:

- `src/modules/expo/lib/sponsorScreenLayout.ts`
- `src/modules/expo/runtime/planning/screens/buildScreenSurfacePlan.ts`
- `src/modules/expo/runtime/planning/screens/buildScreenSocketPlan.ts`
- `src/modules/expo/runtime/planning/screens/buildScreenAssignmentPlan.ts`
- `src/modules/expo/runtime/planning/world-plan/buildCanonicalWorldPlan.ts`
- `src/modules/expo/runtime/planning/zones/shared.ts`

Observed behavior:

- sponsor screen nodes define explicit `position`, `rotation`, `size`, `kind`, `placementTier`
- zone planning exposes `screenSurfaces`, `screenSockets`, `screenAssignments`
- zone rules expose:
  - `viewerFacing`
  - `allowedScreenFamilies`
  - `densityCaps`
  - `placementClasses`

### Screen orientation and family usage

Good signs:

- viewer-facing metadata exists
- screen family rules exist
- screens are not random UI fragments

Remaining uncertainty:

- Phase 123 found planning metadata, but not proof that final rendered screen orientations are validated against player lanes or wall normals
- `sponsorScreenLayout.ts` contains many hardcoded position/rotation placements, which is usable, but fragile without audit checks

### Overlap / collision protection

Current evidence:

- booth visibility selection exists in `useExpoWorldSceneRuntime.ts`
- booth colliders exist for booth objects
- walk regions exist in shared expo contract

Gap:

- no dedicated scene validation was found for screen-to-wall, screen-to-screen, or booth-to-screen overlap
- no explicit duplicate world object ID validator was found in runtime audit

## 2D Stand Audit

### What exists

2D or 2D-like surfaces exist in:

- `src/modules/expo/lib/sponsorScreenLayout.ts`
- `src/pages/expo/BoothRoom.tsx`
- `src/pages/expo/BoothStreamRoom.tsx`

These surfaces have:

- explicit sizes
- explicit rotations
- explicit positions
- route-level destination or media payloads

### What does not exist clearly

Not found as a distinct first-class city registry:

- a dedicated `2D stand registry`
- a dedicated `city stand surface catalog`
- a dedicated validator for wall-attached or occluded panels

### Current interpretation

The repo has 2D-like surfaces, but they are split across:

- sponsor screens in the city plan
- booth room route surfaces
- streaming room route surfaces

So the “2D stand” story is currently fragmented, not clearly unified.

## Calculator Inventory And Render-Risk Audit

### Proven calculator surfaces

Calculator routes in `src/App.tsx`:

- `/calculators`
- `/roof-cost-calculator`
- `/heating-cost-calculator`
- `/foundation-cost-calculator`
- `/renovation-cost-calculator`

Calculator modules:

- `src/modules/calculators/RoofCalc`
- `src/modules/calculators/HeatingCalc`
- `src/modules/calculators/FoundationCalc`
- `src/modules/calculators/InteriorCalc`
- `src/modules/calculators/CalculatorsHub`

### Expo-side links

Known calculator entrypoints:

- `src/modules/expo/Marketplace.tsx`
  - links to `/calculators`
- `src/components/chat/GlobalChat.tsx`
  - directs users to `CALCULATORS`

### What was not found

Not found in city runtime or expo runtime:

- a calculator booth registry
- a calculator screen assignment
- a calculator world node
- a calculator interaction binding from city object
- a calculator layer inside `ExpoWorldSceneLayers`

### Why “large part does not appear”

Most likely explanation from current proof:

- calculators are route-bound, not world-bound

Most likely failure class:

- `missing scene binding`

Secondary possible classes:

- route exists but no city object links to it
- no booth/screen assignment for calculators
- no explicit calculator stand registry

Less likely from current evidence:

- lazy load failure
- wrong import
- z-index issue
- camera issue

Reason:

- build succeeds
- calculator routes are registered
- calculator chunks are present in production build output

### Fallback state

Fallback exists only at route level:

- calculator routes still exist

Missing fallback:

- no in-scene placeholder or “calculator stand unavailable” surface was found in the Web3D world runtime

## AI Stand Audit

### What exists

AI/chat related surfaces:

- `src/components/chat/GlobalChat.tsx`
- `backend-server/controllers/aiController.ts`
- `src/modules/expo/runtime/booths/BoothInteractions.ts`
- `src/pages/expo/BoothRoom.tsx`
- `src/pages/expo/BoothStreamRoom.tsx`

### What was not found

Not found under `src/modules/expo/runtime/**`:

- explicit `ai stand` component
- explicit `ai stand` config
- explicit AI booth placement
- explicit AI scene anchor with position/rotation/visibility

### Current interpretation

AI currently appears to be:

- global UI-driven
- route/UI driven
- not proven as a physical city booth or stand

### Fallback state

For a physical AI stand:

- no clear loading fallback found
- no clear error fallback found
- no clear empty-state stand found

That gap exists because the stand itself is not yet clearly present in the scene runtime.

## Interaction / Connect Audit

Primary files:

- `src/modules/expo/runtime/booths/BoothInteractions.ts`
- `src/pages/expo/BoothRoom.tsx`
- `src/pages/expo/BoothStreamRoom.tsx`
- `src/modules/expo/services/pixelStreamingConfig.ts`
- `backend-server/controllers/expoController.ts`

Observed interaction paths:

- city booth click opens booth route
- booth route can submit expo lead
- booth route can open demo room actions
- streaming room can reserve pixel streaming session
- pixel streaming runtime status and session reservation are implemented

What works conceptually:

- booth selection
- booth room open
- lead capture
- premium streaming connect

What is missing from current proof:

- calculator open action from a city object
- AI open action from a city object
- dedicated scene object IDs for calculator or AI surfaces

## Validation Gap Audit

### What is currently checked

Confirmed checks:

- expo backend boundary checks
- backend boundary checks
- expo scene contract tests:
  - `backend-server/routes/__tests__/expoScene.test.ts`
  - `backend-server/routes/__tests__/expoScene.controller.test.ts`
- dev booth placement diagnostics in `sceneDataSource.ts`

### What is not yet proven as validated

Not clearly validated by current repo audit:

- duplicate scene object IDs
- out-of-bounds placement for booth/screen surfaces
- screen orientation correctness against real viewer flow
- booth frontality correctness
- screen overlap / screen collision
- disconnected calculators in city runtime
- missing AI stand binding
- broken action binding from in-world calculator/AI surfaces

## Current Web3D Risk Map

Low risk:

- scene pipeline exists
- booth rendering exists
- screen planning exists
- streaming and booth room interaction exist

Medium risk:

- booth/screen orientation correctness is unproven
- 2D stands are fragmented across city and route surfaces
- validation coverage is incomplete

High visible product gap:

- calculators are not proven as city surfaces
- AI is not proven as an in-world stand

## Selected Decision

- `CALCULATOR IN-SCENE SURFACE RECOVERY REVIEW`

## Selection Rationale

This gives the fastest visible product value because:

- calculators already exist and build correctly
- user-facing complaint is about things not appearing in the city
- proof shows the likely issue is missing world binding, not missing calculator implementation
- this can be audited narrowly before any broad booth/city redesign

## Files Likely Affected Next Phase

Likely Phase 124 audit targets:

- `src/App.tsx`
- `src/modules/expo/runtime/app/Expo3D.tsx`
- `src/modules/expo/runtime/world/scene/ExpoWorldSceneLayers.tsx`
- `src/modules/expo/runtime/booths/BoothInteractions.ts`
- `src/modules/expo/Marketplace.tsx`
- `src/components/chat/GlobalChat.tsx`
- `src/modules/calculators/**`
- `src/modules/expo/lib/sponsorScreenLayout.ts`
- `src/shared/expo/worldContract.ts`

## Files Explicitly Out Of Scope Next Phase

Still out of scope unless proof forces expansion:

- broad city redesign
- AI stand implementation
- calculator rewrite
- backend cleanup continuation
- events infra cleanup
- AI/governance duplicate cleanup
- logger cleanup

## Next-Cycle Recommendation

Phase 124 should be:

- `CALCULATOR IN-SCENE SURFACE RECOVERY REVIEW`

That phase should answer:

- which calculator surfaces should exist in-world
- which scene object or booth should open them
- whether missing behavior is caused by absent registry, absent interaction binding, or intentional route-only architecture
