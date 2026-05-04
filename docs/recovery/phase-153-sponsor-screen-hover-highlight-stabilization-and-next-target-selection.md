# Phase 153: Sponsor Screen Hover Highlight Stabilization And Next Target Selection

Status: PASS

Goal:
- Confirm that the Phase 152 sponsor screen hover highlight is stable.
- Confirm that click, cursor, and navigation behavior did not regress.
- Select the next Web3D product/quality target.

Summary:
- The hover highlight seam remains local to `WorldCityScreenAssignments.tsx`.
- Hover highlight still applies only to route-action sponsor screens.
- No-action screens remain fully silent.
- The next target is `OVERLAP/BOUNDS DIAGNOSTIC REVIEW`.

Hover highlight stabilization audit:
- `hoveredAssignmentId` is local component state.
- Highlight is enabled only when `resolvedAction.kind === 'route'`.
- No-action assignments do not set hover state.
- Pointer out clears hover state.
- Unmount cleanup resets cursor to `auto`.
- `WorldCityScreenSurfaces.tsx` remains display-only.
- `worldContract.ts`, `App.tsx`, and `sponsorScreenLayout.ts` remain unchanged.

Cursor/click/navigation confirmation:
- Click still uses `navigate(resolvedAction.route)`.
- `event.stopPropagation()` remains in the click handler.
- Cursor pointer still applies only to route-action sponsor screens.
- Cursor resets to `auto` on pointer out and unmount cleanup.
- Route contract is still resolver-owned and not duplicated outside resolver.

No-action screen policy confirmation:
- No-action screens still get:
  - no click
  - no cursor
  - no highlight
  - no tooltip

Visual behavior sanity check:
- Highlight remains subtle and opacity-based.
- No motion-heavy behavior was added.
- No tooltip or Html overlay exists.
- No CTA hint or label was added.
- No global hover manager or broad pointer system exists.
- Text primitives remain unchanged.
- Opacity change stays assignment-local and does not rely on shared material mutation.

Candidate next target comparison:
- Overlap/bounds diagnostic review:
  - Risk: medium
  - Value: high
  - Best next safety seam because sponsor screens are now clickable, cursor-addressable, and visually highlighted
- Sponsor screen action metadata review:
  - Risk: low/medium
  - Value: medium/high
  - Useful later if sponsor screens need richer actions than booth routes
- Screen/booth diagnostic integration review:
  - Risk: low/medium
  - Value: high
  - Good hardening target, but less urgent than placement safety after interactivity expansion
- Sponsor screen CTA hint review:
  - Risk: medium
  - Value: medium/high
  - Discoverability is already materially improved by cursor + subtle hover highlight
- Stabilization hold:
  - Not needed

Selected decision:
- OVERLAP/BOUNDS DIAGNOSTIC REVIEW

Selection rationale:
- The sponsor screen interaction stack is now stable enough that placement safety is the highest-value next concern.
- Additional discoverability work is less urgent than proving that interactive surfaces do not create overlap or out-of-bounds risk.
- This keeps momentum on Web3D quality without broad redesign or object movement.

Likely files next phase:
- `src/modules/expo/runtime/world/WorldCityScreenAssignments.tsx`
- `src/modules/expo/runtime/world/WorldCityScreenSurfaces.tsx`
- `src/modules/expo/runtime/planning/world-plan/buildCanonicalWorldPlan.ts`
- `src/modules/expo/lib/sponsorScreenLayout.ts`
- `src/shared/expo/worldContract.ts` as read-only context

Explicitly out of scope next phase:
- `src/App.tsx`
- `src/modules/expo/lib/sponsorScreenInteractionResolver.ts`
- route additions
- sponsor screen metadata redesign
- booth feature stack changes
- calculator changes
- AI backend/chat changes
- screen repositioning or yaw fixes
- broad city redesign
