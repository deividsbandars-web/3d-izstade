# Phase 122 Diagnostics

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

## Backend Closure Check

Confirmed absent:

- `src/backend/marketplace/agents/agentRegistry.js`
- `src/backend/marketplace/installService.js`
- `src/backend/dataSources/websiteScraper.js`
- `src/backend/leads/sources/serpApiHelper.js`
- `src/backend/leads/sources/serpApiHelper.ts`

Confirmed present:

- `src/backend/marketplace/agents/agentRegistry.ts`
- `src/backend/marketplace/installService.ts`
- `src/backend/dataSources/websiteScraper.ts`
- `src/backend/dataSources/serpApiSearchService.ts`

## Boundary Baseline

`npm.cmd run check:backend-boundaries` result:

- `domain duplicate warnings: 0`
- `leads duplicate warnings: 0`
- `agents cross-domain warnings: 0`
- `billing boundary warnings: 0`
- `violations: 0`
- `status: PASS`

## Web3D Discovery Highlights

Scene runtime:

- `src/modules/expo/runtime/app/Expo3D.tsx`
- `src/modules/expo/runtime/app/ExpoRuntimeShell.tsx`
- `src/modules/expo/runtime/app/ExpoSceneShell.tsx`
- `src/modules/expo/runtime/world/scene/ExpoWorldSceneRoot.tsx`
- `src/modules/expo/runtime/world/scene/ExpoWorldSceneLayers.tsx`

Planning/world:

- `src/modules/expo/runtime/planning/world-plan/buildCanonicalWorldPlan.ts`
- `src/modules/expo/runtime/planning/zones/shared.ts`
- `src/modules/expo/runtime/planning/screens/buildScreenSurfacePlan.ts`
- `src/modules/expo/runtime/planning/screens/buildScreenSocketPlan.ts`
- `src/modules/expo/runtime/planning/screens/buildScreenAssignmentPlan.ts`

Booths/screens:

- `src/modules/expo/runtime/booths/DistrictBooth.tsx`
- `src/modules/expo/runtime/booths/OpenBoothPavilion.tsx`
- `src/modules/expo/lib/sponsorScreenLayout.ts`
- `src/pages/expo/BoothRoom.tsx`
- `src/pages/expo/BoothStreamRoom.tsx`

AI / interaction related:

- `src/components/chat/GlobalChat.tsx`
- `src/modules/expo/runtime/booths/BoothInteractions.ts`
- `src/modules/expo/services/pixelStreamingConfig.ts`
- `backend-server/controllers/aiController.ts`
- `backend-server/controllers/expoLeadController.ts`

Calculator related:

- `src/modules/calculators/RoofCalc`
- `src/modules/calculators/HeatingCalc`
- `src/modules/calculators/FoundationCalc`
- `src/modules/calculators/InteriorCalc`
- `src/modules/calculators/CalculatorsHub`
- route links in `src/App.tsx`

## Key Audit Findings

- Backend cleanup wave remains stable and does not need another duplicate target phase.
- Web3D scene stack is large and already split into runtime, planning, booth, screen, and backend scene layers.
- Calculators exist as route surfaces, but no proof was found that they are mounted into the city as interactive booth/screen surfaces.
- AI/chat exists, but no explicit in-world AI stand component/config was identified.
- Scene validation already checks contract and some booth placement diagnostics, but frontality/orientation/collision proof is still incomplete.

## Selected Next Target

- `WEB3D SCENE AND INTERACTIVE SURFACE AUDIT`
