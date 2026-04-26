# Phase 02 Diagnostics

## Acceptance Closure Update (Phase 02b)

- `src/modules/expo/__tests__/sponsorScreenLayout.test.ts` was re-baselined.
- `src/modules/expo/lib/sponsorScreenLayout.ts` behavior did not change in Phase 02b.
- the old assertions for `mediumScreens.length === 6` and `groundScreens.length === 10` were stale after the earlier boulevard clutter reduction:
  - `mediumScreens` is derived from `rankedPlacements.slice(0, 10)`, so this fixture deterministically produces one medium billboard per ranked placement, which is `3`
  - `groundScreens` is derived from one fixed arrival pylon plus `sectorMarkers.filter((_, index) => index % 2 === 0).slice(0, 6)`, which is `3` in this fixture
- the test now asserts the actual current contract instead of pre-reduction counts
- frontend build viability was re-investigated:
  - `npm.cmd run build` fails inside the restricted sandbox at Vite config bundling with `spawn EPERM`
  - `node node_modules/esbuild/bin/esbuild --version` succeeds
  - `node -e "...spawn(esbuild.exe)..."` fails with `EPERM`
  - `node -e "...spawn(cmd.exe)..."` fails with `EPERM`
  - `npm.cmd run build` succeeds when run outside sandbox restriction on the same machine
- conclusion:
  - the earlier frontend build block was caused by the restricted execution environment, not by the repo
  - the real frontend production build is now proven on this Windows machine when child-process spawning is allowed

## Commands Run

- `npx.cmd tsc -b`
- `npm.cmd run build`
- `node node_modules/esbuild/bin/esbuild --version`
- `node -e "...spawn(esbuild.exe)..."`
- `node -e "...spawn(cmd.exe)..."`
- `npm.cmd run build` (outside sandbox restriction)
- `npm.cmd --prefix backend-server run build`
- `npx.cmd tsx src/modules/expo/__tests__/sponsorScreenLayout.test.ts`
- `npx.cmd tsx src/modules/expo/__tests__/districtLandmarkPlan.test.ts`
- `npx.cmd tsx src/modules/expo/__tests__/useExpoSceneData.contract.test.ts`
- `npx.cmd tsx routes/__tests__/expoScene.test.ts` (from `backend-server`)
- `npx.cmd tsx routes/__tests__/expoScene.controller.test.ts` (from `backend-server`)

## Result Summary

### Passed

- `npx.cmd tsc -b`
- `npm.cmd run build` (outside sandbox restriction)
- `npm.cmd --prefix backend-server run build`
- `npx.cmd tsx src/modules/expo/__tests__/sponsorScreenLayout.test.ts`
- `npx.cmd tsx src/modules/expo/__tests__/districtLandmarkPlan.test.ts`
- `npx.cmd tsx src/modules/expo/__tests__/useExpoSceneData.contract.test.ts`
- `npx.cmd tsx routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx routes/__tests__/expoScene.controller.test.ts`

### Incomplete / Environment-Limited

- `npm.cmd run build` inside the restricted sandbox
  - `tsc -b` portion succeeds
  - `vite build` fails before app bundling while Vite asks esbuild to bundle `vite.config.ts`
  - direct spawn evidence:
    - `node node_modules/esbuild/bin/esbuild --version` -> succeeds
    - `node -e "...spawn(esbuild.exe)..."` -> `EPERM`
    - `node -e "...spawn(cmd.exe)..."` -> `EPERM`
  - outside sandbox, the full command passes
  - diagnosis:
    - sandbox restriction blocks `child_process.spawn()`
    - this is not a repo-specific build graph failure

### Failed

- none after Phase 02b acceptance closure

## Architectural Outcome

Phase 02 successfully established:

- a canonical planning package under `src/modules/expo/runtime/planning/**`
- a typed world-plan composition entrypoint
- explicit zone-oriented planning modules
- a reduced `WorldCitySkeletonLayout.ts` compatibility wrapper
- warning markers on compatibility surfaces that should no longer receive planning logic

`runtime/world` now consumes:

- `buildCanonicalWorldPlan(...)`

instead of being the primary planning authoring surface.

## Changed Files

### New canonical planning files

- `src/modules/expo/runtime/planning/index.ts`
- `src/modules/expo/runtime/planning/types/index.ts`
- `src/modules/expo/runtime/planning/legacy/worldCityGeometry.ts`
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

### Rewired runtime / compatibility files

- `src/modules/expo/runtime/world/WorldCitySkeleton.tsx`
- `src/modules/expo/runtime/world/WorldCitySkeletonLayout.ts`
- `src/modules/expo/runtime/world/index.ts`
- `src/modules/expo/layout-engine.ts`
- `src/modules/expo/world-contract.ts`
- `src/modules/expo/sceneWorld.ts`
- `src/modules/expo/runtime/world/ExpoWorldScene.tsx`
- `src/modules/expo/components/ExpoWorldHud.tsx`
- `src/modules/expo/lib/sceneDataSource.ts`

### Recovery docs

- `docs/recovery/phase-02-canonical-runtime-planning.md`
- `docs/recovery/phase-02-diagnostics.md`
- `docs/recovery/phase-02-acceptance-closure.md`

### Acceptance closure files

- `src/modules/expo/__tests__/sponsorScreenLayout.test.ts`

## Remaining Risks

1. Zone modules are adapter-style in this phase.
- they still rely on legacy geometry helpers rather than a full new zonal planner implementation

2. `runtime/world` still contains render-time hidden ID suppression.
- planning ownership moved, but world-owner cleanup is still unfinished

3. `ExpoWorldScene.tsx` remains a large scene orchestrator.
- planning extraction reduced one major pressure point, but did not yet split scene composition ownership

4. backend still imports compatibility surfaces:
- `backend-server/controllers/expoDataController.ts` still depends on `world-contract.ts` and `layout-engine.ts`
- acceptable for this phase, but not the target end-state

5. restricted sandbox execution can still block frontend build commands that rely on `child_process.spawn()`.
- the repo itself is no longer blocked because the real `npm.cmd run build` has now passed outside sandbox restriction on the same machine

## Explicit Incomplete Items

- no visual redesign was attempted
- no operator tooling split was attempted
- no backend bounded-context cleanup was attempted
- no full zonal screen redesign was attempted
- no removal of old expo/component orchestration was attempted beyond compatibility marking
