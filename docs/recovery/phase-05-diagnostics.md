# Phase 05 Diagnostics

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

- restricted sandbox still triggers `spawn EPERM` for Vite / `tsx`
- the same commands pass outside sandbox on the same machine
- this remains an execution restriction, not a repo failure

## Changed File List

Primary:

- `src/modules/expo/runtime/planning/types/index.ts`
- `src/modules/expo/runtime/planning/world-plan/buildCanonicalWorldPlan.ts`
- `src/modules/expo/runtime/planning/zones/arrival/index.ts`
- `src/modules/expo/runtime/planning/zones/left-district/index.ts`
- `src/modules/expo/runtime/planning/zones/left-district/geometry.ts`
- `src/modules/expo/runtime/planning/zones/right-district/index.ts`
- `src/modules/expo/runtime/planning/zones/right-district/geometry.ts`
- `src/modules/expo/runtime/planning/zones/center-spine/index.ts`
- `src/modules/expo/runtime/planning/zones/center-spine/geometry.ts`
- `src/modules/expo/runtime/planning/zones/tower-cluster/index.ts`
- `src/modules/expo/runtime/planning/zones/tower-cluster/geometry.ts`
- `src/modules/expo/runtime/planning/zones/shared.ts`
- `src/modules/expo/runtime/world/WorldCityPlanes.tsx`
- `src/modules/expo/runtime/world/WorldCitySkeleton.tsx`

Docs:

- `docs/recovery/phase-05-zone-local-geometry-ownership-extraction.md`
- `docs/recovery/phase-05-diagnostics.md`

## Exact Centralized Geometry Debt Still Remaining

- `planning/legacy/worldCityGeometry.ts` still produces many source geometry families:
  - arrival planes
  - boulevard edge masses
  - showcase masses/plazas
  - media-wall masses/surfaces
  - discovery families
  - support-edge families
  - tower landmark bases
- not all zones build their geometry fully from local primitives yet

## Exact Renderer-Side Interpretation Debt Still Remaining

- `WorldCityMasses.tsx` still interprets mass roles and decorative policies at render time
- `WorldCityPlanes.tsx` now consumes richer outputs directly, but tone interpretation still happens in the renderer
- runtime still applies section visibility filtering after canonical plan composition

## Remaining Risks

- some geometry ownership is still selection-based rather than fully local construction
- tower-cluster local podium geometry adds new plan content and may need visual review
- legacy builders still remain an upstream dependency for several zones

## Explicit Incomplete Items

- no full legacy geometry breakup
- no visual redesign
- no operator/HUD split
- no backend cleanup
- no `ExpoWorldScene.tsx` decomposition
