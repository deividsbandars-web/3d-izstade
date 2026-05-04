# Phase 132 Diagnostics

## Scope

Phase 132 was an audit/selection checkpoint only.

No product implementation was performed.

## Audited Files

- `src/components/chat/GlobalChat.tsx`
- `src/components/chat/globalChatEvents.ts`
- `src/modules/expo/runtime/app/ExpoRuntimeShell.tsx`
- `src/modules/expo/runtime/booths/BoothFeatureContent.tsx`
- `src/modules/expo/lib/sponsorBoothPresentation.ts`
- `src/modules/expo/runtime/booths/BoothInteractions.ts`
- `src/modules/expo/__tests__/sponsorBoothPresentation.test.ts`
- `src/App.tsx`
- `src/modules/expo/lib/sponsorScreenLayout.ts`
- `src/modules/expo/runtime/world/WorldCityScreenSurfaces.tsx`
- `backend-server/controllers/aiController.ts`

## Code-Level Confirmation

### AI booth feature surface

- `BoothAiFeature` remains present in `src/modules/expo/runtime/booths/BoothFeatureContent.tsx`
- `aiAction` is still resolved from booth CTA metadata
- AI and calculator feature cards still render as separate booth content surfaces

### AI trigger seam

- `GLOBAL_CHAT_OPEN_EVENT` remains `warpala:open-global-chat`
- `dispatchOpenGlobalChat(...)` still dispatches the custom event
- `GlobalChat` still listens for the event
- `GlobalChat` still focuses the input after opening

### Expo runtime hosting

- `GlobalChat` remains mounted inside `src/modules/expo/runtime/app/ExpoRuntimeShell.tsx`
- `/expo-3d` therefore still has access to the chat overlay without depending on `Layout`

### Calculator / demo regression

- `CALCULATORS_ROUTE` remains `/calculators`
- calculator booth action still resolves to `/calculators`
- the calculators hub route remains registered in `src/App.tsx`
- `demo_room` handling remains separate in `BoothInteractions.ts`

### Backend seam

- `GlobalChat` still uses existing `expoService` / Supabase chat methods
- `backend-server/controllers/aiController.ts` was not changed

## Validation Commands

Passed in sandbox:

```powershell
npm.cmd run check:expo-boundaries
npm.cmd run check:backend-boundaries
npx.cmd tsc -b
npm.cmd --prefix backend-server run build
```

Failed in sandbox with known `spawn EPERM`, then passed outside sandbox on the same machine:

```powershell
npm.cmd run build
npx.cmd tsx backend-server/routes/__tests__/expoScene.test.ts
npx.cmd tsx backend-server/routes/__tests__/expoScene.controller.test.ts
```

## Validation Outcome

- Expo boundaries: PASS
- Backend boundaries: PASS
- TypeScript composite build: PASS
- Backend build: PASS
- Frontend production build: PASS outside sandbox after `spawn EPERM`
- `expoScene.test.ts`: PASS outside sandbox after `spawn EPERM`
- `expoScene.controller.test.ts`: PASS outside sandbox after `spawn EPERM`

## Baseline

- domain duplicate warnings: `0`
- leads duplicate warnings: `0`
- billing boundary warnings: `0`
- violations: `0`

## Selection Outcome

Selected next target:

- `BOOTH/SCREEN ORIENTATION VALIDATION REVIEW`

Reason:

- `2D STAND PLACEMENT REVIEW` is broader than one narrow audit seam because it already crosses layout generation and runtime rendering layers
- orientation validation is the narrower next checkpoint with direct Web3D quality value
