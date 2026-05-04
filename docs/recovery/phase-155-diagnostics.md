# Phase 155 Diagnostics

Phase: 155
Title: Screen Surface Bounds Diagnostic First Slice
Status: PASS

Changed files:
- `src/modules/expo/runtime/planning/screens/screenSurfaceBoundsDiagnostics.ts`
- `src/modules/expo/__tests__/screenSurfaceBoundsDiagnostics.test.ts`

Real-data scan:
- source: production-safe fallback scene -> world contract -> canonical world plan
- screen surfaces: `24`
- diagnostics count: `0`
- codes found: `[]`

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
  - `npx.cmd tsx src/modules/expo/__tests__/screenSurfaceBoundsDiagnostics.test.ts`
  - `npx.cmd tsx backend-server/routes/__tests__/expoScene.test.ts`
  - `npx.cmd tsx backend-server/routes/__tests__/expoScene.controller.test.ts`

Sandbox note:
- `npm.cmd run build` and `npx.cmd tsx ...` still require outside-sandbox execution because of sandbox `spawn EPERM`.

Backend baseline:
- domain duplicate warnings: `0`
- leads duplicate warnings: `0`
- billing boundary warnings: `0`
- violations: `0`

Next likely stabilization phase:
- `SCREEN SURFACE BOUNDS DIAGNOSTIC STABILIZATION AND NEXT TARGET SELECTION`
