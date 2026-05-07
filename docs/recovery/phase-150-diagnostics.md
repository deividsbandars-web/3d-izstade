Phase 150 Diagnostics

Status
- PASS

Audit Scope
- `src/modules/expo/runtime/world/WorldCityScreenAssignments.tsx`
- `src/modules/expo/lib/sponsorScreenInteractionResolver.ts`
- `src/modules/expo/runtime/world/WorldCityScreenSurfaces.tsx`
- `src/shared/expo/worldContract.ts`
- `src/App.tsx`
- `src/modules/expo/lib/sponsorScreenLayout.ts`
- `src/modules/expo/runtime/booths/BoothFeatureContent.tsx`
- `src/modules/expo/runtime/booths/BoothInteractions.ts`
- `src/components/chat/globalChatEvents.ts`
- `src/components/chat/GlobalChat.tsx`

Confirmed
- Route-action assignments still receive pointer affordance.
- No-action assignments still receive no click and no pointer affordance.
- Cursor resets to `auto` on pointer out.
- Click still navigates through `resolvedAction.route`.
- No hover highlight, tooltip, Html overlay, or broad pointer system was introduced.
- No camera control changes happened.
- No route additions happened.
- No worldContract changes happened.

Validation
- Sandbox PASS:
  - `npm.cmd run check:expo-boundaries`
  - `npm.cmd run check:backend-boundaries`
  - `npx.cmd tsc -b`
  - `npm.cmd --prefix backend-server run build`
- Sandbox-only `spawn EPERM`:
  - `npm.cmd run build`
  - `npx.cmd tsx src/modules/expo/__tests__/screenOrientationDiagnostics.test.ts`
  - `npx.cmd tsx src/modules/expo/__tests__/boothFrontalityDiagnostics.test.ts`
  - `npx.cmd tsx src/modules/expo/__tests__/sponsorScreenInteractionResolver.test.ts`
  - `npx.cmd tsx backend-server/routes/__tests__/expoScene.test.ts`
  - `npx.cmd tsx backend-server/routes/__tests__/expoScene.controller.test.ts`
- Outside sandbox PASS:
  - `npm.cmd run build`
  - `npx.cmd tsx src/modules/expo/__tests__/screenOrientationDiagnostics.test.ts`
  - `npx.cmd tsx src/modules/expo/__tests__/boothFrontalityDiagnostics.test.ts`
  - `npx.cmd tsx src/modules/expo/__tests__/sponsorScreenInteractionResolver.test.ts`
  - `npx.cmd tsx backend-server/routes/__tests__/expoScene.test.ts`
  - `npx.cmd tsx backend-server/routes/__tests__/expoScene.controller.test.ts`

Baseline
- domain duplicate warnings: 0
- leads duplicate warnings: 0
- billing boundary warnings: 0
- violations: 0

Selection Outcome
- Next target selected: `SPONSOR SCREEN HOVER HIGHLIGHT REVIEW`
