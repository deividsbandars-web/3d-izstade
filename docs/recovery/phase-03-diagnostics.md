# Phase 03 Diagnostics

## Commands Run

Frontend / root:

- `npx.cmd tsc -b`
- `npm.cmd run build`
- `npx.cmd tsx src/modules/expo/__tests__/sponsorScreenLayout.test.ts`
- `npx.cmd tsx src/modules/expo/__tests__/districtLandmarkPlan.test.ts`
- `npx.cmd tsx src/modules/expo/__tests__/useExpoSceneData.contract.test.ts`

Backend:

- `npm.cmd --prefix backend-server run build`
- `npx.cmd tsx routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx routes/__tests__/expoScene.controller.test.ts`

## Results

- `npx.cmd tsc -b` -> PASS
- `npm.cmd --prefix backend-server run build` -> PASS
- `npx.cmd tsx src/modules/expo/__tests__/sponsorScreenLayout.test.ts` -> PASS
- `npx.cmd tsx src/modules/expo/__tests__/districtLandmarkPlan.test.ts` -> PASS
- `npx.cmd tsx src/modules/expo/__tests__/useExpoSceneData.contract.test.ts` -> PASS
- `npx.cmd tsx routes/__tests__/expoScene.test.ts` -> PASS
- `npx.cmd tsx routes/__tests__/expoScene.controller.test.ts` -> PASS
- `npm.cmd run build` -> PASS outside sandbox

Note on frontend build:

- inside restricted sandbox, `spawn EPERM` still blocks Vite / `tsx`
- outside sandbox on the same Windows machine, `npm.cmd run build` passes fully
- this remains the same previously-proven environment restriction, not a repo failure

## Architectural Result Summary

Phase 03 achieved a real shift beyond adapter extraction:

- zonal planners now own local screen surface planning
- zonal planners now own local socket planning
- zonal planners now own local assignment planning
- canonical world plan composes zonal outputs
- rear-campus now exists as a first-class planning peer
- `ExpoRearCampus.tsx` now consumes `buildRearCampusZonePlan()` instead of rebuilding rear-campus planning locally

## Changed Files

Primary planning changes:

- `src/modules/expo/runtime/planning/types/index.ts`
- `src/modules/expo/runtime/planning/index.ts`
- `src/modules/expo/runtime/planning/world-plan/buildCanonicalWorldPlan.ts`
- `src/modules/expo/runtime/planning/screens/buildScreenSurfacePlan.ts`
- `src/modules/expo/runtime/planning/screens/buildScreenSocketPlan.ts`
- `src/modules/expo/runtime/planning/screens/buildScreenAssignmentPlan.ts`
- `src/modules/expo/runtime/planning/zones/shared.ts`
- `src/modules/expo/runtime/planning/zones/arrival/index.ts`
- `src/modules/expo/runtime/planning/zones/left-district/index.ts`
- `src/modules/expo/runtime/planning/zones/center-spine/index.ts`
- `src/modules/expo/runtime/planning/zones/right-district/index.ts`
- `src/modules/expo/runtime/planning/zones/tower-cluster/index.ts`
- `src/modules/expo/runtime/planning/zones/rear-campus/index.ts`

Runtime consumer changes:

- `src/modules/expo/runtime/world/WorldCitySkeleton.tsx`
- `src/modules/expo/runtime/world/ExpoRearCampus.tsx`

Compatibility / surrounding files included for review:

- `src/modules/expo/runtime/world/WorldCitySkeletonLayout.ts`
- `src/modules/expo/runtime/planning/legacy/worldCityGeometry.ts`

Docs:

- `docs/recovery/phase-03-true-zonal-planner-replacement.md`
- `docs/recovery/phase-03-diagnostics.md`

## Remaining Risks

- legacy geometry generation is still centralized in `planning/legacy/worldCityGeometry.ts`
- `WorldCitySkeleton.tsx` still owns large hidden-ID suppression sets
- `WorldCityPlanes.tsx` still ignores most non-arrival plane families
- `ExpoWorldScene.tsx` is still an oversized runtime orchestrator
- rear-campus rendering is specialized and not yet unified with city rendering

## Explicit Incomplete Items

- no operator/HUD split
- no backend bounded-context cleanup
- no visual redesign
- no full decomposition of `ExpoWorldScene.tsx`
- no elimination of all runtime suppression logic

## Still-Centralized Logic Not Yet Eliminated

The following central assumptions remain after Phase 03:

- shared legacy geometry pools still seed multiple zones
- runtime section filtering still happens in `WorldCitySkeleton.tsx`
- hidden-ID suppression still compensates for old geometry debt

The important change is that screen planning authority moved to zones even though some geometry and suppression debt still remains.
