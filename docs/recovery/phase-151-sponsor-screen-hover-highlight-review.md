# Phase 151: Sponsor Screen Hover Highlight Review

Status: PASS

Goal:
- Audit the smallest safe visual hover-highlight seam for route-action sponsor screens.
- Keep inert screens silent.
- Avoid tooltip, broad pointer system, route changes, and layout changes.

Summary:
- The current assignment-layer click host is already the correct seam for hover affordance work.
- The existing `resolvedAction.kind === 'route'` gate can safely control visual hover treatment as well.
- The smallest safe next slice is a subtle hover highlight on route-action sponsor screen assignment content.
- No blocker was found that would require metadata redesign, world contract changes, or a broader runtime rewrite first.

Current Cursor Affordance Audit:
- `WorldCityScreenAssignments.tsx` resolves action per assignment via `resolveSponsorScreenInteraction(...)`.
- `isRouteAction` is already computed from `resolvedAction.kind === 'route'`.
- `onClick`, `onPointerOver`, and `onPointerOut` are attached only for route-action assignments.
- `onPointerOver` sets `document.body.style.cursor = 'pointer'`.
- `onPointerOut` resets the cursor to `auto`.
- No-action assignments remain inert.

Existing Visual Hover Pattern Audit:
- Expo runtime already uses local pointer affordance patterns in booth components.
- Existing precedent is cursor-only, not material-driven.
- No shared global hover/highlight framework exists for sponsor screens.
- This makes a local assignment-layer hover treatment the safest next seam.

Assignment Render Structure Audit:
- `WorldCityScreenAssignments.tsx` owns the sponsor-visible assignment content and its route-action metadata.
- `WorldCityScreenSurfaces.tsx` remains a display/geometry layer and is not the right first highlight host.
- Assignment content is isolated per assignment, which makes per-instance hover state feasible.
- Highlight should stay in assignment rendering, not move into surface geometry or world contract layers.

Camera/Control Risk Audit:
- Fly mode uses `OrbitControls`.
- Walk mode uses `PointerLockControls`.
- Pointer lock unlock already resets cursor to `auto`.
- First highlight slice should stay simple and avoid mode-aware control logic if possible.
- Any future hover state should still cleanly clear on pointer out and unmount.

Highlight Option Comparison:
- Cursor-only remains enough; defer visual highlight:
  - Risk: low
  - UX value: medium
  - Too conservative for the next visible discoverability step
- Subtle emissive/material/opacity highlight on route-action assignment content:
  - Risk: low/medium
  - UX value: high
  - Best next slice if kept local and minimal
- Thin outline/frame highlight:
  - Risk: medium
  - UX value: medium/high
  - More render coupling than needed for the first visual slice
- Small scale/bob effect:
  - Risk: medium
  - UX value: medium
  - Adds motion/state noise without clear need
- CTA micro-hint label:
  - Risk: medium
  - UX value: medium/high
  - Broader content/policy seam than a simple visual highlight
- Tooltip/Html overlay:
  - Risk: medium/high
  - UX value: medium/high
  - Too broad for the next step

No-Action Screen Policy:
- No-action screens should get:
  - no highlight
  - no cursor
  - no tooltip
  - no disabled-looking visual noise

Test Feasibility:
- No broad R3F visual test is needed for the next slice.
- TypeScript build plus existing runtime tests should be enough unless a new helper is introduced.
- If a helper is introduced, a small fixture-only test is sufficient.

Selected Decision:
- SPONSOR SCREEN SUBTLE HOVER HIGHLIGHT FIRST SLICE

Selection Rationale:
- It is the smallest visual discoverability upgrade after cursor-only affordance.
- It can reuse the existing route-action gate without broad pointer-system work.
- It does not require world contract changes, route changes, or layout movement.

Likely Files Next Phase:
- `src/modules/expo/runtime/world/WorldCityScreenAssignments.tsx`
- Optional small helper near `src/modules/expo/runtime/world/**`

Explicitly Out Of Scope Next Phase:
- `src/shared/expo/worldContract.ts`
- `src/App.tsx`
- `src/modules/expo/lib/sponsorScreenInteractionResolver.ts`
- `src/modules/expo/lib/sponsorScreenLayout.ts`
- `src/modules/expo/runtime/world/WorldCityScreenSurfaces.tsx` as a click-host redesign target
- booth feature stack changes
- calculator changes
- AI backend/chat changes
- screen repositioning/yaw fixes
- broad city redesign
