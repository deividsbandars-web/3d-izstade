# Phase 156 Diagnostics

Phase: 156
Title: Screen Surface Bounds Diagnostic Stabilization And Next Target Selection
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
  - `npx.cmd tsx src/modules/expo/__tests__/screenSurfaceBoundsDiagnostics.test.ts`
  - `npx.cmd tsx backend-server/routes/__tests__/expoScene.test.ts`
  - `npx.cmd tsx backend-server/routes/__tests__/expoScene.controller.test.ts`

Sandbox note:
- `npm.cmd run build` and `npx.cmd tsx ...` still require outside-sandbox execution because of sandbox `spawn EPERM`.

Helper usage check:
- `diagnoseScreenSurfaceBounds` appears only in:
  - helper file
  - fixture test
- No active gate wiring was found.

Real-data scan:
- screen surfaces: `24`
- diagnostics count: `0`
- codes found: `[]`
- noisy: `false`

Selection:
- Next target: `SCREEN-SCREEN OVERLAP DIAGNOSTIC REVIEW`

Backend baseline:
- domain duplicate warnings: `0`
- leads duplicate warnings: `0`
- billing boundary warnings: `0`
- violations: `0`
