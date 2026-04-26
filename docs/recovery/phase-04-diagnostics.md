# Phase 04 Diagnostics

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

Sandbox note:

- restricted sandbox still throws `spawn EPERM` for Vite / `tsx`
- the same commands pass outside sandbox on the same machine
- this remains an execution restriction, not a repo failure

## Changed File List

Primary:

- `src/modules/expo/runtime/planning/types/index.ts`
- `src/modules/expo/runtime/planning/world-plan/buildCanonicalWorldPlan.ts`
- `src/modules/expo/runtime/planning/zones/shared.ts`
- `src/modules/expo/runtime/world/WorldCitySkeleton.tsx`
- `src/modules/expo/runtime/world/ExpoRearCampus.tsx`

Docs:

- `docs/recovery/phase-04-central-geometry-and-suppression-debt-reduction.md`
- `docs/recovery/phase-04-diagnostics.md`

## What Geometry Debt Was Reduced

- zone geometry selection no longer comes from one broad `geometry.masses` bag
- canonical planning now carries named geometry categories
- zones select from explicit category pools instead of relying on one anonymous central mass pool

## What Suppression Debt Was Reduced

- large hidden plane/mass ID sets were removed from `WorldCitySkeleton.tsx`
- renderability filtering moved into canonical world-plan composition
- `WorldCitySkeleton.tsx` now consumes already-filtered mass/plane outputs and only applies section visibility

## Remaining Risks

- legacy geometry generation still lives in `planning/legacy/worldCityGeometry.ts`
- some render intent is still inferred by downstream renderers
- `WorldCityPlanes.tsx` still renders only a narrow subset of plane outputs
- section filtering still exists in runtime for interactive visibility toggles
- rear-campus rendering is still specialized

## Exact Debt Still Remaining

Central geometry debt still remaining:

- shared legacy builder functions still create many source geometry families centrally
- not all per-zone geometry construction is local yet

Suppression debt still remaining:

- runtime still filters by section visibility
- downstream renderers still impose their own selective interpretation of plan richness

## Explicit Incomplete Items

- no visual redesign
- no operator/HUD split
- no backend bounded-context cleanup
- no full legacy geometry deletion
- no full removal of all runtime filtering
