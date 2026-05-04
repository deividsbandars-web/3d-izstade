# Phase 131 Diagnostics

## Purpose

Capture the first visible AI booth feature surface and the minimal trigger seam that opens the existing global chat overlay from Web3D booth UI.

## Source Change

Changed source files:

- `src/modules/expo/runtime/booths/BoothFeatureContent.tsx`
- `src/modules/expo/lib/sponsorBoothPresentation.ts`
- `src/modules/expo/runtime/booths/BoothInteractions.ts`
- `src/components/chat/GlobalChat.tsx`
- `src/modules/expo/runtime/app/ExpoRuntimeShell.tsx`
- `src/modules/expo/__tests__/sponsorBoothPresentation.test.ts`

Added helper:

- `src/components/chat/globalChatEvents.ts`

## Implementation Notes

### New Visible Surface

Added a visible AI feature panel into booth feature content.

Panel behavior:

- renders as part of the booth feature surface
- uses feature-only booth action metadata
- does not add another CTA strip button
- opens the existing `GlobalChat` overlay

### Trigger Seam

Added a narrow custom-event trigger:

- `warpala:open-global-chat`

Used by:

- `BoothInteractions.ts` to dispatch open/focus
- `GlobalChat.tsx` to receive and open/focus

### Expo3D Host Availability

Because `/expo-3d` does not run inside `Layout.tsx`, `GlobalChat` also had to be mounted inside the Expo runtime shell.

This preserved the “existing overlay” requirement while making it available on the actual Web3D route.

### Existing Chat Flow Preserved

Preserved:

- `expoService.getMessages()`
- `expoService.sendMessage()`
- `expoService.subscribeToChat()`

Not changed:

- `aiController.ts`
- `aiService.ts`

## Validation Outcome

Passed in sandbox:

- `npm.cmd run check:expo-boundaries`
- `npm.cmd run check:backend-boundaries`
- `npx.cmd tsc -b`
- `npm.cmd --prefix backend-server run build`

Sandbox `spawn EPERM`, then rerun outside sandbox on the same machine:

- `npm.cmd run build`
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.controller.test.ts`

## Baseline

- domain duplicate warnings: `0`
- leads duplicate warnings: `0`
- billing boundary warnings: `0`
- violations: `0`
