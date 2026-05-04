# Phase 153 Diagnostics

Phase: 153
Title: Sponsor Screen Hover Highlight Stabilization And Next Target Selection
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
- `src/modules/expo/lib/sponsorScreenInteractionResolver.ts`
- `src/modules/expo/runtime/world/WorldCityScreenSurfaces.tsx`
- `src/shared/expo/worldContract.ts`
- `src/App.tsx`
- `src/modules/expo/lib/sponsorScreenLayout.ts`

Key findings:
- Hover highlight remains route-action only.
- No-action screens remain fully silent.
- Click, cursor, and navigation behavior remain unchanged from Phase 152.
- The hover highlight is assignment-local and does not alter text primitives or world/surface contracts.

Selection:
- Next target: `OVERLAP/BOUNDS DIAGNOSTIC REVIEW`

Backend baseline:
- domain duplicate warnings: `0`
- leads duplicate warnings: `0`
- billing boundary warnings: `0`
- violations: `0`
