# Phase 130 - AI In-World Stand Review

## Summary

Phase 130 audited how existing AI/chat capability can become a visible Web3D in-world stand entrypoint without a full AI backend rewrite or broad city redesign.

Outcome:

- AI already exists in the product, but not yet as a physical in-world city surface
- `GlobalChat` is route-independent and globally hosted, but currently has no public open/focus API
- `GlobalChat` does not currently use `backend-server/controllers/aiController.ts`
- the safest visible Web3D host seam is still the existing booth feature surface
- the smallest next implementation slice is an AI booth feature panel that opens/focuses the existing `GlobalChat`

Selected next target:

- `AI BOOTH FEATURE SURFACE FIRST SLICE`

## AI / Chat Surface Audit

Inspected:

- `src/components/chat/GlobalChat.tsx`
- `src/components/Layout.tsx`
- `backend-server/controllers/aiController.ts`
- `src/services/expoService.ts`
- `src/services/aiService.ts`
- `backend-server/routes/api.ts`
- `src/App.tsx`

### GlobalChat Runtime Shape

`GlobalChat.tsx` is a local-state overlay.

Confirmed:

- open/close is controlled by internal `useState(false)` only
- chat opens from its own floating bubble
- chat closes from its own close button
- no context/provider API exists
- no `CustomEvent`/event-bus seam exists for opening it from another surface
- no external prop is accepted to control open state
- no focus helper exists for input targeting

This means another in-world surface cannot currently open or focus `GlobalChat` without adding a tiny trigger seam.

### Route Independence

`GlobalChat` is mounted in `Layout.tsx`, not behind a dedicated route.

Confirmed:

- `Layout.tsx` hosts `<GlobalChat />` globally
- the overlay is route-independent
- this is good for an in-world trigger because an AI surface would not need a new page just to show the existing chat UI

### Loading / Error / Empty State

`GlobalChat` currently has only implicit handling:

- loading: no visible loading state while `getMessages()` runs
- error: errors are only logged to console
- empty: empty chat renders as an empty scroll region
- AI response behavior is mostly simulated via delayed `expoService.sendMessage(..., true)`

So a future in-world AI slice can reuse `GlobalChat`, but it does not yet expose strong empty/loading/error UX as a city object.

### Backend Usage Reality

`GlobalChat` does not call `aiController`.

Actual behavior:

- `GlobalChat` uses `expoService.getMessages()`
- `GlobalChat` uses `expoService.sendMessage()`
- `GlobalChat` uses `expoService.subscribeToChat()`
- those calls read/write Supabase `chat_messages`

Separate AI backend seams do exist:

- `/api/ai-estimate`
- `/api/ai/respond`
- `/api/ai/video`

Those are wired through:

- `backend-server/controllers/aiController.ts`
- `backend-server/routes/api.ts`
- `src/services/aiService.ts`

This means the product currently has two separate AI-adjacent seams:

1. a realtime chat overlay seam through Supabase
2. an LLM/API seam through `aiController`

For Phase 131, the safest move is to reuse the existing visible chat overlay seam, not rewrite it onto the LLM endpoint seam.

### Existing AI Routes / Pages

AI-related routes already exist in the app:

- `/generator`
- `/ai-agent`
- `/prototype`
- `/platform/agents`
- `/platform/expo`

But no route was found that is clearly the dedicated surface for the current `GlobalChat` overlay.

That makes route-based AI entry less attractive than directly opening/focusing the existing chat overlay.

## Web3D Host Seam Audit

Inspected:

- `src/modules/expo/runtime/booths/BoothFeatureContent.tsx`
- `src/modules/expo/runtime/booths/BoothInteractions.ts`
- `src/modules/expo/runtime/booths/BoothVisualAssembly.tsx`
- `src/modules/expo/runtime/booths/DistrictBooth.tsx`
- `src/modules/expo/lib/sponsorBoothPresentation.ts`

### Existing Reusable Surface

The existing booth feature seam is the narrowest proven in-world host.

Confirmed:

- booth feature content already supports visible panel/card rendering
- calculator presence proved that this seam can carry product access visibly
- booth runtime already passes shared `onAction(action)` through the rendering stack
- no standalone placement or world registry was needed for calculator presence

This strongly supports reusing the same seam for AI presence.

### CTA / Action Model Limits

The current CTA model only supports:

- `navigate`
- `external`

There is no current CTA intent for:

- open global chat
- focus global chat
- dispatch local modal event
- call a client-side action without navigation

So AI cannot be expressed cleanly through current CTA metadata alone unless a tiny new local action seam is added.

### Route-Based AI Surface

Route-based AI surfaces exist in the broader app, but not as a clean in-world chat destination.

That makes them weaker than a direct chat-open interaction for the first physical AI presence slice.

### Can AI Be Visible Without New Standalone Placement?

Yes.

The existing booth feature surface can host:

- an AI panel/card
- AI helper copy
- an action button

This avoids:

- new city placement
- new rotation/collision work
- new `worldContract` metadata

## Physical Stand Option Audit

### A. AI Booth Feature Panel Using Existing Booth Feature Seam

Likely files affected:

- `src/modules/expo/runtime/booths/BoothFeatureContent.tsx`
- `src/modules/expo/lib/sponsorBoothPresentation.ts`
- `src/modules/expo/runtime/booths/BoothInteractions.ts`
- `src/components/chat/GlobalChat.tsx`
- `src/components/Layout.tsx`

Implementation size:

- small to medium

User-visible value:

- high

Risk:

- low to medium

Requires `worldContract` change:

- no

Requires layout/planning change:

- no

Requires AI backend change:

- no

### B. AI CTA Action That Opens / Focuses GlobalChat

Likely files affected:

- `src/components/chat/GlobalChat.tsx`
- `src/components/Layout.tsx`
- small action seam in booth runtime or shared action model

Implementation size:

- small

User-visible value:

- medium alone, high when paired with visible booth panel

Risk:

- low

Requires `worldContract` change:

- no

Requires layout/planning change:

- no

Requires AI backend change:

- no

### C. Dedicated AI Pavilion / Stand In City

Likely files affected:

- world planning files
- world rendering files
- likely placement or registry seams

Implementation size:

- large

User-visible value:

- high

Risk:

- high

Requires `worldContract` change:

- likely yes or equivalent planning metadata

Requires layout/planning change:

- yes

Requires AI backend change:

- no, but likely triggers extra UI/state work

### D. AI Route / Modal Surface

Likely files affected:

- app routes
- AI pages
- possible navigation/action files

Implementation size:

- medium

User-visible value:

- medium

Risk:

- medium

Requires `worldContract` change:

- no

Requires layout/planning change:

- no

Requires AI backend change:

- no

### E. AI Sponsor Screen Style Display

Likely files affected:

- sponsor screen layout files
- world screen surface files

Implementation size:

- medium to large

User-visible value:

- medium

Risk:

- medium to high

Requires `worldContract` change:

- no direct proof, but more scene-level coupling

Requires layout/planning change:

- likely yes

Requires AI backend change:

- no

## Interaction Model Audit

Preferred interaction model:

- click a visible AI booth panel
- trigger existing `GlobalChat` to open/focus

Why this is best:

- reuses the proven booth feature seam
- reuses the existing visible AI/chat capability
- does not require a new AI page
- does not require route indirection for the first slice
- does not require AI backend rewrite

Rejected as first choice:

- dedicated room
- dedicated city pavilion
- sponsor-screen-only AI display
- full route-based AI detour

## Placement / Visibility Risk Audit

The first implementation can avoid:

- standalone position/rotation systems
- collision and overlap validation work
- wall-facing risk analysis
- `worldContract` changes

It can do this by staying entirely inside the existing booth feature seam.

That matches the same successful pattern used for calculator presence in Phase 128.

## Candidate Implementation Slices For Phase 131

### Option 1. AI Booth Feature Panel + GlobalChat Open / Focus Action

Files likely affected:

- `src/modules/expo/runtime/booths/BoothFeatureContent.tsx`
- `src/modules/expo/lib/sponsorBoothPresentation.ts`
- `src/modules/expo/runtime/booths/BoothInteractions.ts`
- `src/components/chat/GlobalChat.tsx`
- `src/components/Layout.tsx`

Risk:

- low to medium

User-visible value:

- high

One seam:

- effectively yes, centered on booth feature runtime plus a tiny chat trigger seam

Avoids broad redesign:

- yes

### Option 2. AI CTA Action Only

Files likely affected:

- `src/modules/expo/lib/sponsorBoothPresentation.ts`
- `src/modules/expo/runtime/booths/BoothInteractions.ts`
- `src/components/chat/GlobalChat.tsx`
- `src/components/Layout.tsx`

Risk:

- low

User-visible value:

- medium

One seam:

- yes

Avoids broad redesign:

- yes

Weakness:

- less visible than a real booth feature surface

### Option 3. Dedicated AI Booth / Registry Review First

Files likely affected:

- planning/world files
- booth metadata files

Risk:

- high

User-visible value:

- potentially high

One seam:

- no

Avoids broad redesign:

- no

## Selected Decision

Selected next target:

- `AI BOOTH FEATURE SURFACE FIRST SLICE`

## Selection Rationale

This is the best next move because it combines:

- visible Web3D product value
- reuse of a proven in-world seam
- no `worldContract` rewrite
- no city layout redesign
- no AI backend rewrite

The audit did **not** support “AI global chat open/focus action” as a standalone target because:

- `GlobalChat` does not currently expose a public open/focus seam
- a tiny new trigger seam is needed anyway
- if that seam is being added, it is more valuable to attach it to a visible in-world AI panel than to ship the action without the visible product surface

So the correct Phase 131 slice is:

- add visible AI booth feature presence
- wire it to a tiny `GlobalChat` open/focus seam

## Files Likely Affected Next Phase

- `src/modules/expo/runtime/booths/BoothFeatureContent.tsx`
- `src/modules/expo/lib/sponsorBoothPresentation.ts`
- `src/modules/expo/runtime/booths/BoothInteractions.ts`
- `src/components/chat/GlobalChat.tsx`
- `src/components/Layout.tsx`

Optional only if clearly needed:

- a tiny shared chat trigger helper

## Files Explicitly Out Of Scope Next Phase

- `backend-server/controllers/aiController.ts` backend rewrite
- `src/services/aiService.ts` broad changes
- world planning/layout files
- `src/shared/expo/worldContract.ts`
- 2D stand placement systems
- booth/screen orientation systems
- calculator internals
- backend duplicate cleanup files

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

## Remaining Risks

- `GlobalChat` has no public trigger seam yet
- `GlobalChat` also lacks visible loading/error/empty treatment as a promoted city object
- AI route/page surfaces exist, but they are not yet clearly aligned with the chat overlay seam
- if Phase 131 expands beyond booth feature surface plus chat trigger, scope could sprawl quickly

## Next-Cycle Recommendation

Next phase:

- `AI BOOTH FEATURE SURFACE FIRST SLICE`

The implementation should stay narrow:

- visible AI booth panel
- one action
- open/focus existing `GlobalChat`
- no backend rewrite
- no city redesign
