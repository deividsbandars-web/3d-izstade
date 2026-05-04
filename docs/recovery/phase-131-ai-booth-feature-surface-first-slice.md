# Phase 131 - AI Booth Feature Surface First Slice

## Summary

Phase 131 created the first visible AI in-world presence in the Web3D booth UI.

Result:

- booths now show a visible AI feature surface
- clicking the AI surface opens and focuses the existing `GlobalChat` overlay
- the existing Supabase/expoService chat flow remains unchanged
- calculator and `demo_room` behavior remain separate
- no AI backend rewrite, `worldContract` rewrite, or broad city redesign was introduced

## Implementation Change

Changed seam:

- `src/modules/expo/runtime/booths/BoothFeatureContent.tsx`
- `src/modules/expo/lib/sponsorBoothPresentation.ts`
- `src/modules/expo/runtime/booths/BoothInteractions.ts`
- `src/components/chat/GlobalChat.tsx`
- `src/modules/expo/runtime/app/ExpoRuntimeShell.tsx`
- `src/modules/expo/__tests__/sponsorBoothPresentation.test.ts`

Added helper:

- `src/components/chat/globalChatEvents.ts`

What changed:

- added an AI booth feature panel alongside the existing calculator feature content
- added a feature-only booth action kind for AI chat
- added a tiny custom-event seam to open/focus `GlobalChat`
- mounted the existing `GlobalChat` overlay in the Expo3D runtime tree so the Web3D route can actually open it

## GlobalChat Trigger Seam

The new trigger seam is a minimal browser custom event:

- event name: `warpala:open-global-chat`
- helper: `src/components/chat/globalChatEvents.ts`

Behavior:

- booth AI panel click resolves to a local booth action
- `BoothInteractions.ts` dispatches the open-chat event
- `GlobalChat.tsx` listens for the event
- when received, chat opens and focuses the existing input

This keeps the seam narrow:

- no router rewrite
- no provider/store rewrite
- no backend rewrite

## AI Booth Feature Surface Behavior

Behavior after this phase:

- booth UI still renders the existing CTA strip
- booth UI now also renders a visible AI panel
- clicking the AI panel opens the existing chat overlay
- input focus is moved into the existing chat field
- calculator panel still renders below the AI panel
- calculator panel still uses the existing route-based action

The AI panel does not route to a new AI page and does not create a dedicated AI pavilion.

## Existing Booth Feature Seam Used

The implementation stayed on the already proven booth feature runtime:

- `DistrictBooth.tsx` remains the booth runtime host
- `BoothVisualAssembly.tsx` remains the UI assembler
- `BoothFeatureContent.tsx` remains the visible booth feature renderer
- `BoothInteractions.ts` remains the shared booth action executor
- `sponsorBoothPresentation.ts` remains the shared booth metadata source

The only additional runtime hosting change was making the existing `GlobalChat` overlay available inside Expo3D through `ExpoRuntimeShell.tsx`.

## Files Changed

Changed source:

- `src/modules/expo/runtime/booths/BoothFeatureContent.tsx`
- `src/modules/expo/lib/sponsorBoothPresentation.ts`
- `src/modules/expo/runtime/booths/BoothInteractions.ts`
- `src/components/chat/GlobalChat.tsx`
- `src/modules/expo/runtime/app/ExpoRuntimeShell.tsx`
- `src/modules/expo/__tests__/sponsorBoothPresentation.test.ts`

Added source:

- `src/components/chat/globalChatEvents.ts`

Added phase artifacts:

- `docs/recovery/phase-131-ai-booth-feature-surface-first-slice.md`
- `docs/recovery/phase-131-diagnostics.md`
- `diagnostics/project-analysis-bundle-phase-131.zip`

## Files Explicitly Not Changed

Not changed:

- `backend-server/controllers/aiController.ts`
- `src/services/aiService.ts`
- `src/services/expoService.ts`
- `src/shared/expo/worldContract.ts`
- broad world/city planning files
- 2D stand placement files
- booth/screen orientation systems
- calculator internals

## Out-Of-Scope Confirmation

This phase did not do:

- AI backend rewrite
- `aiController` integration rewrite
- GlobalChat product rewrite
- dedicated AI pavilion build
- standalone AI placement system
- new AI route/page
- 2D stand implementation
- booth/screen orientation work
- calculator feature rewrite
- backend duplicate cleanup

## Validation Results

Passed in sandbox:

- `npm.cmd run check:expo-boundaries`
- `npm.cmd run check:backend-boundaries`
- `npx.cmd tsc -b`
- `npm.cmd --prefix backend-server run build`

Sandbox `spawn EPERM`, then rerun outside sandbox on the same machine:

- `npm.cmd run build`
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.controller.test.ts`

Backend baseline remains:

- domain duplicate warnings: `0`
- leads duplicate warnings: `0`
- billing boundary warnings: `0`
- violations: `0`

## Remaining AI / Web3D Gaps

Still not done:

- no dedicated AI pavilion or city stand registry
- no stronger loading/error/empty UX for `GlobalChat` as a promoted city object
- no screen/wayfinding-based AI placement system
- no booth/screen orientation hardening
- no 2D stand placement system

## Next-Cycle Recommendation

Next phase:

- `AI BOOTH FEATURE SURFACE STABILIZATION AND NEXT WEB3D TARGET SELECTION`

Reason:

- first visible AI booth presence now exists
- next step should confirm stability and then choose the next visible or safety-oriented Web3D target from a clean baseline
