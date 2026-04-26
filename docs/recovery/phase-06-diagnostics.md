# Phase 06 Diagnostics

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
- `npx.cmd tsx src/modules/expo/__tests__/sponsorScreenLayout.test.ts` -> PASS outside sandbox
- `npx.cmd tsx src/modules/expo/__tests__/districtLandmarkPlan.test.ts` -> PASS outside sandbox
- `npx.cmd tsx src/modules/expo/__tests__/useExpoSceneData.contract.test.ts` -> PASS outside sandbox
- `npx.cmd tsx routes/__tests__/expoScene.test.ts` -> PASS outside sandbox
- `npx.cmd tsx routes/__tests__/expoScene.controller.test.ts` -> PASS outside sandbox
- `npm.cmd run build` -> PASS outside sandbox

Sandbox note:

- restricted sandbox still triggers `spawn EPERM` for `tsx` / Vite build
- the same commands pass outside sandbox on the same machine
- this remains an execution restriction, not a repo failure

## Changed File List

Primary:

- `src/modules/expo/runtime/planning/legacy/worldCityGeometry.ts`
- `src/modules/expo/runtime/planning/types/index.ts`
- `src/modules/expo/runtime/planning/world-plan/buildCanonicalWorldPlan.ts`
- `src/modules/expo/runtime/world/WorldCityMasses.tsx`
- `src/modules/expo/runtime/world/WorldCitySkeleton.tsx`

Docs:

- `docs/recovery/phase-06-canonical-mass-intent-and-visibility-extraction.md`
- `docs/recovery/phase-06-diagnostics.md`

## Exact Renderer-Side Interpretation Debt Still Remaining

- `WorldCityMasses.tsx` still owns concrete decorative mesh assembly, even though the decision flags now come from planning
- `WorldCityPlanes.tsx` still resolves structural plane material/tone locally
- `WorldCityTowers.tsx` still contains renderer-side tower presentation policy outside a richer canonical tower render-intent contract

## Exact Runtime Visibility-Filtering Debt Still Remaining

- runtime still applies user-facing section toggles after canonical plan composition
- section membership is now planning-owned metadata, but the final toggle application still lives in `WorldCitySkeleton.tsx`
- screen assignments still rely on runtime socket visibility to derive their visible subset

## Remaining Risks

- `worldCityGeometry.ts` still has too much upstream authority for some geometry families
- central section classification still exists in world-plan composition rather than fully zone-owned local metadata
- tower and screen render-intent are not yet extracted as far as mass intent is
- mass canonical outputs now carry more policy, so visual review is still needed to confirm there is no subtle drift

## Explicit Incomplete Items

- no visual redesign
- no operator/HUD split
- no backend cleanup
- no full `ExpoWorldScene.tsx` decomposition
- no full elimination of legacy geometry builders
- no full extraction of tower/screen render-intent contracts
