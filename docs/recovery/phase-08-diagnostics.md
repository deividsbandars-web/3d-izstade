## Phase 08 Diagnostics

### Commands Run

Frontend / root:

- `npx.cmd tsc -b`
- `npm.cmd run build`
- `npx.cmd tsx src/modules/expo/__tests__/sponsorScreenLayout.test.ts`
- `npx.cmd tsx src/modules/expo/__tests__/districtLandmarkPlan.test.ts`
- `npx.cmd tsx src/modules/expo/__tests__/useExpoSceneData.contract.test.ts`

Backend:

- `npm.cmd --prefix backend-server run build`
- from `backend-server`:
  - `npx.cmd tsx routes/__tests__/expoScene.test.ts`
  - `npx.cmd tsx routes/__tests__/expoScene.controller.test.ts`

### Results

Passed:

- `npx.cmd tsc -b`
- `npm.cmd run build`
- `npx.cmd tsx src/modules/expo/__tests__/sponsorScreenLayout.test.ts`
- `npx.cmd tsx src/modules/expo/__tests__/districtLandmarkPlan.test.ts`
- `npx.cmd tsx src/modules/expo/__tests__/useExpoSceneData.contract.test.ts`
- `npm.cmd --prefix backend-server run build`
- `npx.cmd tsx routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx routes/__tests__/expoScene.controller.test.ts`

Sandbox note:

- restricted sandbox still throws `spawn EPERM` for `tsx` / Vite
- the same commands pass outside sandbox on this machine
- this remains an execution restriction, not a repo failure

### Changed File List

Planning:

- [worldCityGeometry](/C:/3d/src/modules/expo/runtime/planning/legacy/worldCityGeometry.ts)
- [planning types](/C:/3d/src/modules/expo/runtime/planning/types/index.ts)
- [buildScreenSurfacePlan](/C:/3d/src/modules/expo/runtime/planning/screens/buildScreenSurfacePlan.ts)
- [buildScreenSocketPlan](/C:/3d/src/modules/expo/runtime/planning/screens/buildScreenSocketPlan.ts)
- [buildScreenAssignmentPlan](/C:/3d/src/modules/expo/runtime/planning/screens/buildScreenAssignmentPlan.ts)
- [tower-cluster zone planner](/C:/3d/src/modules/expo/runtime/planning/zones/tower-cluster/index.ts)
- [rear-campus zone planner](/C:/3d/src/modules/expo/runtime/planning/zones/rear-campus/index.ts)

Runtime/world consumers:

- [WorldCityTowers](/C:/3d/src/modules/expo/runtime/world/WorldCityTowers.tsx)
- [WorldCityScreenSurfaces](/C:/3d/src/modules/expo/runtime/world/WorldCityScreenSurfaces.tsx)
- [WorldCityScreenSockets](/C:/3d/src/modules/expo/runtime/world/WorldCityScreenSockets.tsx)
- [WorldCityScreenAssignments](/C:/3d/src/modules/expo/runtime/world/WorldCityScreenAssignments.tsx)

Docs:

- [phase-08-canonical-primitive-output-extraction.md](/C:/3d/docs/recovery/phase-08-canonical-primitive-output-extraction.md)
- [phase-08-diagnostics.md](/C:/3d/docs/recovery/phase-08-diagnostics.md)

### Remaining Risks

- tower and screen visuals now depend more heavily on planner primitive metadata, so silent visual drift still requires browser review
- `worldCityGeometry.ts` still retains too much upstream source geometry authority
- central fallback section classification still exists for entities without zone-owned section metadata
- rear-campus remains a specialized renderer

### Explicit Incomplete Items

- no visual redesign
- no operator/HUD split
- no backend cleanup
- no `ExpoWorldScene.tsx` decomposition
- no full breakup of `worldCityGeometry.ts`
- no full primitive extraction for all remaining world entities

### Remaining Renderer-Side Interpretation Debt

- [WorldCityScreenSockets](/C:/3d/src/modules/expo/runtime/world/WorldCityScreenSockets.tsx) still adds edge-wire treatment locally
- [WorldCityScreenAssignments](/C:/3d/src/modules/expo/runtime/world/WorldCityScreenAssignments.tsx) still performs near/mid/far text primitive filtering locally
- [WorldCityTowers](/C:/3d/src/modules/expo/runtime/world/WorldCityTowers.tsx) still owns material application decisions

### Remaining Central Geometry Debt

- [worldCityGeometry](/C:/3d/src/modules/expo/runtime/planning/legacy/worldCityGeometry.ts) still generates too many shared source geometry families
- canonical composition still performs fallback section mapping for some entities
- not all tower and screen primitive generation is zone-local yet
