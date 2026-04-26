# Phase 07 Diagnostics

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

Primary planning:

- `src/modules/expo/runtime/planning/legacy/worldCityGeometry.ts`
- `src/modules/expo/runtime/planning/types/index.ts`
- `src/modules/expo/runtime/planning/world-plan/buildCanonicalWorldPlan.ts`
- `src/modules/expo/runtime/planning/screens/buildScreenSurfacePlan.ts`
- `src/modules/expo/runtime/planning/screens/buildScreenSocketPlan.ts`
- `src/modules/expo/runtime/planning/screens/buildScreenAssignmentPlan.ts`
- `src/modules/expo/runtime/planning/zones/left-district/index.ts`
- `src/modules/expo/runtime/planning/zones/right-district/index.ts`
- `src/modules/expo/runtime/planning/zones/center-spine/index.ts`
- `src/modules/expo/runtime/planning/zones/tower-cluster/index.ts`
- `src/modules/expo/runtime/planning/zones/rear-campus/index.ts`

World consumers:

- `src/modules/expo/runtime/world/WorldCityTowers.tsx`
- `src/modules/expo/runtime/world/WorldCityScreenSurfaces.tsx`
- `src/modules/expo/runtime/world/WorldCityScreenSockets.tsx`
- `src/modules/expo/runtime/world/WorldCityScreenAssignments.tsx`
- `src/modules/expo/runtime/world/WorldCitySkeleton.tsx`

Docs:

- `docs/recovery/phase-07-canonical-tower-and-screen-intent-extraction.md`
- `docs/recovery/phase-07-diagnostics.md`

## Exact Renderer-Side Interpretation Debt Still Remaining

- `WorldCityTowers.tsx` still owns tower mesh assembly, even though render policy is now planning-owned
- `WorldCityScreenSurfaces.tsx` still owns screen housing mesh assembly
- `WorldCityScreenSockets.tsx` still owns socket frame mesh assembly
- `WorldCityScreenAssignments.tsx` still owns final text/image layout composition
- `WorldCityPlanes.tsx` still owns structural plane material/tone policy

## Exact Screen Visibility / Assignment Coupling Still Remaining

- assignment rendering still depends on runtime access to socket positions for player-distance checks
- player-relative distance culling remains downstream, even though the distance thresholds are now planning-owned
- some section fallback still comes from canonical composition rather than entirely from zone-local authorship

## Remaining Risks

- `worldCityGeometry.ts` still retains too much source geometry authority
- tower and screen mesh primitives are still described implicitly by renderers rather than explicit canonical primitive outputs
- assignment semantics are now planning-owned, but visual review is still required to confirm no UI drift
- rear-campus still uses specialized rendering even though planning ownership remains correct

## Explicit Incomplete Items

- no visual redesign
- no operator/HUD split
- no backend cleanup
- no full `ExpoWorldScene.tsx` decomposition
- no full elimination of legacy geometry helpers
- no full primitive-level canonical tower/screen mesh contract
