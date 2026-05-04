Phase 148 - Sponsor Screen Hover/Pointer Affordance Review

Status: PASS

Summary
- Phase 146/147 sponsor screen click host remains stable and narrow.
- The assignment layer is still the correct seam for any first discoverability affordance.
- The smallest safe next slice is a cursor-only affordance gated by the same resolver condition that currently gates clickability.

Current Click-Host Audit
- `WorldCityScreenAssignments.tsx` remains the active click-host seam.
- Route action is resolved per assignment with `resolveSponsorScreenInteraction(...)`.
- `onClick` is attached only when `resolvedAction.kind === 'route'`.
- `event.stopPropagation()` is applied inside the route click handler.
- `kind: 'none'` assignments remain inert because no click handler is attached.
- The same `resolvedAction.kind === 'route'` condition can safely gate hover/pointer affordance without introducing a second interactive contract.

Existing Pointer/Hover Pattern Audit
- Existing in-world pointer affordance already exists in booth runtime:
  - `src/modules/expo/runtime/booths/BoothFeatureContent.tsx`
  - `src/modules/expo/runtime/booths/DistrictBooth.tsx`
- Existing pattern is local and simple:
  - `onPointerOver`
  - `onPointerOut`
  - `document.body.style.cursor = 'pointer'`
  - revert to `'auto'` on pointer out
- There is no global cursor helper for expo runtime world screens.
- There is no established sponsor screen hover highlight or tooltip layer.
- `WorldCityScreenSurfaces.tsx` remains display-only and does not carry action metadata.

Camera And Control Conflict Audit
- `ExpoWorldPlayerLayer.tsx` uses:
  - `OrbitControls` in fly mode
  - `PointerLockControls` in walk mode
- Pointer lock unlock already resets cursor to `auto`.
- This means a local cursor-only affordance can stay consistent with existing control behavior.
- Complex mode-aware hover logic is not required for the first slice.
- Material highlight or tooltip approaches would create more interaction-state complexity than cursor-only affordance.

Affordance Option Comparison
- Cursor-only affordance
  - Files likely affected: `WorldCityScreenAssignments.tsx`
  - Risk: low
  - UX value: high
  - One seam: yes
  - Broad runtime redesign: no
- Subtle material/emissive highlight
  - Files likely affected: `WorldCityScreenAssignments.tsx`, possibly render primitive helpers
  - Risk: medium
  - UX value: medium/high
  - One seam: less clean
  - Broad runtime redesign: not broad, but more stateful than needed
- Small CTA label/hint
  - Files likely affected: assignment render intent or overlay content
  - Risk: medium
  - UX value: medium
  - Requires more content-policy decisions
- Tooltip/Html overlay
  - Files likely affected: assignment layer plus overlay host
  - Risk: medium/high
  - UX value: medium/high
  - Too broad for the first affordance slice
- Helper-only interactive state
  - Files likely affected: one helper file plus assignment layer
  - Risk: low
  - UX value: low by itself
  - Too abstract for the next user-visible step

No-Action Screen Policy
- Inert screens should remain fully quiet:
  - no click
  - no cursor change
  - no hover affordance
  - no tooltip
  - no disabled-looking noise unless it already exists
- This keeps false affordance risk low.

Test Feasibility
- A broad R3F integration test is not necessary for the first affordance slice.
- If an affordance helper is added, a small fixture-only test is feasible.
- If the implementation stays inline in `WorldCityScreenAssignments.tsx`, validation can rely on:
  - TypeScript build
  - existing route/resolver tests
  - runtime manual behavior expectations

Selected Decision
- SPONSOR SCREEN CURSOR AFFORDANCE FIRST SLICE

Selection Rationale
- It matches the existing booth affordance precedent.
- It reuses the already-proven resolver gate.
- It avoids material-state churn, overlay complexity, and global pointer system work.
- It improves discoverability immediately with the smallest user-visible change.

Files Likely Affected Next Phase
- `src/modules/expo/runtime/world/WorldCityScreenAssignments.tsx`
- possibly one tiny helper near `src/modules/expo/runtime/world/**`

Files Explicitly Out Of Scope Next Phase
- `src/modules/expo/runtime/world/WorldCityScreenSurfaces.tsx` as a click-host redesign target
- `src/shared/expo/worldContract.ts`
- `src/App.tsx`
- screen layout generation
- screen repositioning
- screen yaw fixes
- booth feature stack changes
- calculator changes
- AI backend/chat changes
- backend duplicate cleanup

Validation Results
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

Baseline
- domain duplicate warnings: 0
- leads duplicate warnings: 0
- billing boundary warnings: 0
- violations: 0

Next Recommendation
- Sponsor Screen Cursor Affordance First Slice
