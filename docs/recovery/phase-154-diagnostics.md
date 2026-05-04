# Phase 154 Diagnostics

Phase: 154
Title: Overlap/Bounds Diagnostic Review
Status: PASS

Validation:
- Passed in sandbox:
  - `npm.cmd run check:expo-boundaries`
  - `npm.cmd run check:backend-boundaries`
  - `npx.cmd tsc -b`
  - `npm.cmd --prefix backend-server run build`
- Passed outside sandbox on the same machine:
  - `npm.cmd run build`
  - `npx.cmd tsx src/modules/expo/__tests__/screenOrientationDiagnostics.test.ts`
  - `npx.cmd tsx src/modules/expo/__tests__/boothFrontalityDiagnostics.test.ts`
  - `npx.cmd tsx src/modules/expo/__tests__/sponsorScreenInteractionResolver.test.ts`
  - `npx.cmd tsx backend-server/routes/__tests__/expoScene.test.ts`
  - `npx.cmd tsx backend-server/routes/__tests__/expoScene.controller.test.ts`

Sandbox note:
- `npm.cmd run build` and `npx.cmd tsx ...` still require outside-sandbox execution because of sandbox `spawn EPERM`.

Inspected files:
- `src/modules/expo/runtime/world/WorldCityScreenAssignments.tsx`
- `src/modules/expo/runtime/world/WorldCityScreenSurfaces.tsx`
- `src/modules/expo/runtime/planning/world-plan/buildCanonicalWorldPlan.ts`
- `src/modules/expo/lib/sponsorScreenLayout.ts`
- `src/shared/expo/worldContract.ts`
- `src/shared/expo/lib/boulevardLayout.ts`
- `src/shared/expo/layoutEngine.ts`
- `src/modules/expo/runtime/data/sceneDataSource.ts`
- `src/modules/expo/runtime/booths/BoothFeatureContent.tsx`
- `src/modules/expo/runtime/booths/DistrictBooth.tsx`
- `src/modules/expo/runtime/booths/BoothVisualAssembly.tsx`
- `src/modules/expo/runtime/planning/screens/screenOrientationDiagnostics.ts`
- `src/shared/expo/lib/boothFrontalityDiagnostics.ts`
- `src/modules/expo/runtime/planning/types/index.ts`
- `src/modules/expo/runtime/planning/legacy/worldCityGeometry.ts`

Real-data scan:
- screen surfaces: `24`
- screen assignments: `24`
- screen sockets: `24`
- booth placements: `3`
- missing surface bounds: `0`
- missing socket bounds: `0`
- missing booth bounds: `0`

Selection:
- Next target: `SCREEN SURFACE BOUNDS DIAGNOSTIC FIRST SLICE`

Backend baseline:
- domain duplicate warnings: `0`
- leads duplicate warnings: `0`
- billing boundary warnings: `0`
- violations: `0`
