# Phase 123 Diagnostics

## Commands

Passed in sandbox:

- `npm.cmd run check:expo-boundaries`
- `npm.cmd run check:backend-boundaries`
- `npx.cmd tsc -b`
- `npm.cmd --prefix backend-server run build`

Sandbox-only `spawn EPERM`:

- `npm.cmd run build`
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.controller.test.ts`

Passed outside sandbox on the same machine:

- `npm.cmd run build`
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.controller.test.ts`

## Backend Baseline

`npm.cmd run check:backend-boundaries`:

- `domain duplicate warnings: 0`
- `leads duplicate warnings: 0`
- `agents cross-domain warnings: 0`
- `billing boundary warnings: 0`
- `violations: 0`
- `status: PASS`

## Scene Pipeline Findings

Scene load path:

- `useExpoSceneData.ts`
- `sceneDataSource.ts`
- `Expo3D.tsx`
- `buildExpoWorldContract` from `src/shared/expo/worldContract.ts`
- `ExpoRuntimeShell.tsx`
- `ExpoSceneShell.tsx`
- `ExpoWorldSceneRoot.tsx`
- `ExpoWorldSceneLayers.tsx`

World layers confirmed:

- ground
- promenade
- city skeleton
- rear campus / stadium
- wayfinding
- skyline
- booths

## Booth / Screen Findings

Booth runtime:

- `DistrictBooth.tsx`
- `BoothVisualAssembly.tsx`
- `OpenBoothPavilion.tsx`

Screen planning:

- `sponsorScreenLayout.ts`
- `buildScreenSurfacePlan.ts`
- `buildScreenSocketPlan.ts`
- `buildScreenAssignmentPlan.ts`

Key signals:

- booth placement uses explicit `position` and `rotation`
- screen layout uses explicit `position`, `rotation`, and `size`
- zone rules include `viewerFacing`
- no dedicated runtime validator was found for orientation/collision correctness

## Calculator Findings

Proven route-level calculators:

- `RoofCalc`
- `HeatingCalc`
- `FoundationCalc`
- `InteriorCalc`
- `CalculatorsHub`

Known entrypoints:

- route registration in `src/App.tsx`
- `/calculators` link in `src/modules/expo/Marketplace.tsx`
- calculator hint in `src/components/chat/GlobalChat.tsx`

Not found:

- calculator booth registry
- calculator world object
- calculator interaction binding from Web3D city

Interpretation:

- calculators build successfully
- calculators likely fail to appear in city because they are route surfaces, not scene surfaces

## AI Stand Findings

Found:

- `src/components/chat/GlobalChat.tsx`
- `backend-server/controllers/aiController.ts`

Not found:

- explicit in-world AI stand component
- explicit AI booth or scene anchor
- explicit AI stand fallback surface

Interpretation:

- AI is currently global UI-bound, not proven as city-bound

## Validation Gap Findings

Current checks cover:

- backend scene contract basics
- boundary health
- dev booth placement diagnostics

Current gaps:

- no clear screen orientation validator
- no clear booth frontality validator
- no clear disconnected calculator validator
- no clear AI stand binding validator
- no clear overlap/collision validator for final rendered screen/booth surfaces

## Selected Next Target

- `CALCULATOR IN-SCENE SURFACE RECOVERY REVIEW`
