# Phase 151 Diagnostics

Phase: 151
Title: Sponsor Screen Hover Highlight Review
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
- `npm.cmd run build` and `npx.cmd tsx ...` remain affected by sandbox `spawn EPERM` and were validated outside sandbox.

Inspected files:
- `src/modules/expo/runtime/world/WorldCityScreenAssignments.tsx`
- `src/modules/expo/runtime/world/WorldCityScreenSurfaces.tsx`
- `src/modules/expo/runtime/world/scene/ExpoWorldSceneLayers.tsx`
- `src/modules/expo/runtime/world/scene/ExpoWorldSceneRoot.tsx`
- `src/modules/expo/runtime/world/scene/ExpoWorldPlayerLayer.tsx`
- `src/modules/expo/lib/sponsorScreenInteractionResolver.ts`
- `src/shared/expo/worldContract.ts`
- `src/modules/expo/lib/sponsorScreenLayout.ts`
- `src/modules/expo/runtime/booths/BoothFeatureContent.tsx`
- `src/modules/expo/runtime/booths/DistrictBooth.tsx`
- `src/modules/expo/runtime/booths/BoothVisualAssembly.tsx`

Key findings:
- The assignment layer remains the correct host seam for future sponsor-screen hover highlight work.
- The existing `resolvedAction.kind === 'route'` gate can safely drive both clickability and hover highlight.
- `WorldCityScreenSurfaces.tsx` remains a geometry/display layer and should stay out of the first visual highlight slice.
- No-action screens should remain fully silent.

Selection:
- Next target: `SPONSOR SCREEN SUBTLE HOVER HIGHLIGHT FIRST SLICE`

Backend baseline:
- domain duplicate warnings: `0`
- leads duplicate warnings: `0`
- billing boundary warnings: `0`
- violations: `0`
