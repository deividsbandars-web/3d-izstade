# Phase 132 - AI Booth Feature Stabilization And Next Web3D Target Selection

## Summary

Phase 132 validated that the Phase 131 AI booth feature slice is stable at the current seam:

- the booth UI still contains a visible AI feature panel
- the AI action still stays off the CTA strip
- clicking the AI panel still reaches the `warpala:open-global-chat` trigger seam
- `GlobalChat` still opens and focuses input
- `/expo-3d` still hosts `GlobalChat` in its own runtime tree
- calculator booth presence and `/calculators` routing still hold
- `demo_room` remains a separate behavior
- backend boundary baseline remains clean

Selected next target:

- `BOOTH/SCREEN ORIENTATION VALIDATION REVIEW`

## AI Booth Feature Stabilization Audit

Inspected:

- `src/components/chat/GlobalChat.tsx`
- `src/components/chat/globalChatEvents.ts`
- `src/modules/expo/runtime/app/ExpoRuntimeShell.tsx`
- `src/modules/expo/runtime/booths/BoothFeatureContent.tsx`
- `src/modules/expo/lib/sponsorBoothPresentation.ts`
- `src/modules/expo/runtime/booths/BoothInteractions.ts`
- `src/modules/expo/__tests__/sponsorBoothPresentation.test.ts`

Confirmed:

- `BoothAiFeature` still exists in `src/modules/expo/runtime/booths/BoothFeatureContent.tsx`
- `BoothInfoBand` still resolves `aiAction` and `calculatorAction` separately
- the AI panel still renders as visible booth feature content below the CTA strip
- the calculator panel still renders below the AI panel
- the Phase 131 seam stayed narrow and did not spread into world placement or backend rewrites

## GlobalChat Trigger / Runtime Audit

Confirmed in `src/components/chat/globalChatEvents.ts`:

- `GLOBAL_CHAT_OPEN_EVENT` remains `warpala:open-global-chat`
- `dispatchOpenGlobalChat(...)` still dispatches a browser `CustomEvent`

Confirmed in `src/components/chat/GlobalChat.tsx`:

- `GlobalChat` still listens for `GLOBAL_CHAT_OPEN_EVENT`
- the listener still sets local open state
- the follow-up focus effect still targets `inputRef`
- chat flow still uses:
  - `expoService.getMessages()`
  - `expoService.subscribeToChat(...)`
  - `expoService.sendMessage(...)`
- no shift to `aiController` was introduced

Confirmed in `src/modules/expo/runtime/booths/BoothInteractions.ts`:

- local `global_chat` intent still dispatches `dispatchOpenGlobalChat({ focusInput: true })`
- `demo_room` still uses separate showroom navigation behavior

Confirmed in `src/modules/expo/runtime/app/ExpoRuntimeShell.tsx`:

- `GlobalChat` is mounted inside the Expo runtime branch
- this preserves chat availability for `/expo-3d`, which does not pass through `Layout`

## Calculator / Demo Regression Check

Confirmed:

- `CALCULATORS_ROUTE` remains `/calculators`
- `resolveSponsorCtaIntent(...)` still maps `calculators` to `/calculators`
- `resolveSponsorCtaIntent(...)` still maps `ai_chat` to local `global_chat`
- sponsor presentation tests still assert:
  - `ai_chat` is feature-only
  - `/calculators` intent is preserved
  - `demo_room` intent remains separate
- `src/App.tsx` still registers the calculators hub route
- the Phase 128 calculator booth feature seam still exists in `BoothFeatureContent.tsx`

No regression signal was found in the audited seam.

## Backend Baseline Check

Validation confirms the current baseline remains:

- domain duplicate warnings: `0`
- leads duplicate warnings: `0`
- billing boundary warnings: `0`
- violations: `0`

No backend duplicate cleanup work was reopened in this phase.

## Candidate Web3D Target Comparison

### A. 2D STAND PLACEMENT REVIEW

Value:

- very high visible product value

Why it was not selected now:

- the seam is broader than requested for the next audit
- current 2D-like placement logic already spans:
  - `src/modules/expo/lib/sponsorScreenLayout.ts`
  - `src/modules/expo/runtime/world/WorldCityScreenSurfaces.tsx`
- that means placement, rotation, frontage packaging, and runtime rendering are already coupled across multiple layers

### B. BOOTH / SCREEN ORIENTATION VALIDATION REVIEW

Value:

- high quality and safety value

Why it was selected:

- it is narrower than a full 2D placement audit
- existing placement data already exposes the exact review seam:
  - position
  - rotation
  - frontage presence
  - visibility and render intent
- it can clarify correctness risks before any broader 2D stand push

### C. AI STAND UX HARDENING REVIEW

Value:

- medium to high

Why it was not selected now:

- the first AI booth presence already exists
- hardening loading/error/empty/focus behavior is useful, but it is less Web3D-forward than validating city-facing placement/orientation correctness

### D. CALCULATOR STAND REGISTRY REVIEW

Value:

- medium to high

Why it was not selected now:

- calculator access already has visible booth presence
- it is less urgent than proving city-facing screen/booth correctness before deeper stand expansion

## Selected Decision

Selected next target:

- `BOOTH/SCREEN ORIENTATION VALIDATION REVIEW`

## Selection Rationale

The selection rule was:

- prefer `2D STAND PLACEMENT REVIEW` if it is narrow enough
- otherwise choose `BOOTH/SCREEN ORIENTATION VALIDATION REVIEW`

The code audit showed that 2D stand placement is not a narrow audit seam. It already spans authored layout generation and runtime world rendering, which makes it broader than the next checkpoint should be.

By contrast, orientation validation is a tighter review seam with direct product value:

- it can validate frontality
- it can validate wall-facing risk
- it can validate overlap and direction assumptions
- it improves confidence before broader 2D stand expansion

So the correct next target is the narrower orientation-validation audit, not the broader placement review.

## Files Likely Affected Next Phase

Likely inspection files next phase:

- `src/modules/expo/lib/sponsorScreenLayout.ts`
- `src/modules/expo/runtime/world/WorldCityScreenSurfaces.tsx`
- `src/modules/expo/runtime/booths/BoothVisualAssembly.tsx`
- `src/modules/expo/runtime/booths/DistrictBooth.tsx`
- relevant world/planning support files only if needed for validator proof

## Files Explicitly Out Of Scope Next Phase

Out of scope next phase:

- `backend-server/controllers/aiController.ts`
- `src/services/aiService.ts`
- `src/services/expoService.ts`
- `src/shared/expo/worldContract.ts`
- calculator internals
- AI backend rewrite
- GlobalChat rewrite
- AI pavilion build
- 2D stand implementation
- broad city layout redesign
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

## Remaining Risks

- AI booth presence is proven at code seam level, not by visual snapshot automation
- `GlobalChat` still has lightweight loading/error/empty treatment for a promoted city object
- 2D stand placement remains broader than one narrow audit seam
- orientation risks are still not formally validated

## Next-Cycle Recommendation

Next phase:

- `BOOTH/SCREEN ORIENTATION VALIDATION REVIEW`

Discipline for the next phase should remain:

- one audit target
- no implementation unless a docs-only cleanup is strictly mechanical
- no broad redesign
