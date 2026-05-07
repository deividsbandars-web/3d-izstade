Phase 147 - Sponsor Screen Route Action Stabilization And Next Target Selection

Status: PASS

Summary
- Phase 146 assignment-layer sponsor screen click host remains narrow and stable.
- Clickability is still gated by `resolveSponsorScreenInteraction(...)` returning `kind: 'route'`.
- No-action screens remain inert because no click handler is attached for `kind: 'none'`.
- Navigation still comes from resolver output, not a second hardcoded route contract inside the runtime layer.

Sponsor Screen Route-Action Stabilization Audit
- `WorldCityScreenAssignments.tsx` imports and uses `resolveSponsorScreenInteraction`.
- The resolver candidate is built only from assignment metadata:
  - `id`
  - `companyId`
  - `title`
  - `label`
- The assignment group gets `onClick` only when `resolvedAction.kind === 'route'`.
- The click host remains in assignment-layer content, not in `WorldCityScreenSurfaces.tsx`.
- `WorldCityScreenSurfaces.tsx` remains a geometry/display layer with no click host additions.

Resolver And Navigation Behavior Confirmation
- `sponsorScreenInteractionResolver.ts` remains pure/read-only.
- Resolver still returns:
  - `kind: 'route'` with `/expo/booth/${companyId}`
  - or `kind: 'none'` with `reason: 'missing-company-id'`
- `WorldCityScreenAssignments.tsx` uses `navigate(resolvedAction.route)`.
- The runtime layer does not duplicate a second route builder.
- `App.tsx` still contains the existing `/expo/booth/:id` route and was not changed in this phase.

Pointer And Camera Safety Confirmation
- The click handler still applies `event.stopPropagation()`.
- No hover system was added.
- No pointer cursor policy was added in sponsor screen runtime.
- No broad raycast redesign happened.
- No camera control changes happened.

Regression Check
- AI panel behavior remains on the existing GlobalChat event seam.
- Calculator panel behavior remains on `/calculators`.
- Booth info stand panel remains on the existing `demo_room`/showroom route seam.
- `worldContract.ts` was not changed.
- `sponsorScreenLayout.ts` was not changed.
- `WorldCityScreenSurfaces.tsx` stayed display-only.
- `BoothFeatureContent.tsx` was not changed in this stabilization phase.

Optional Safe Static Scan
- No new resolver scan was added as an active gate.
- A fresh scan was not required for this phase because:
  - the resolver file was unchanged
  - the route contract was unchanged
  - the click host only consumes existing assignment metadata
- Prior canonical scan evidence remains sufficient:
  - assignments with `companyId`: 22/22

Candidate Next Target Comparison
- Sponsor screen hover/pointer affordance review
  - Value: high
  - Risk: low/medium
  - Best next UX seam because sponsor screens are now clickable but still lack discoverability cues.
- Overlap/bounds diagnostic review
  - Value: high
  - Risk: medium
  - Good safety seam, but less immediate product value than click discoverability.
- Sponsor screen action metadata review
  - Value: medium/high
  - Risk: low/medium
  - Not the best next step because current companyId-based contract already has adequate first-slice coverage.
- Screen/booth diagnostic integration review
  - Value: high
  - Risk: low/medium
  - Good hardening target, but not the highest visible UX improvement immediately after enabling screen clicks.

Selected Decision
- SPONSOR SCREEN HOVER/POINTER AFFORDANCE REVIEW

Selection Rationale
- The route-action slice is stable.
- The main remaining user-facing gap is discoverability, not routing correctness.
- A hover/pointer audit is narrower than broader metadata redesign or overlap diagnostics.
- It can improve UX without forcing world contract changes, screen movement, or runtime redesign.

Files Likely Affected Next Phase
- `src/modules/expo/runtime/world/WorldCityScreenAssignments.tsx`
- `src/modules/expo/runtime/world/WorldCityScreenSurfaces.tsx`
- possibly one small helper near `src/modules/expo/runtime/world/**`

Files Explicitly Out Of Scope Next Phase
- `src/shared/expo/worldContract.ts`
- `src/App.tsx`
- screen layout generation
- screen repositioning
- screen yaw fixes
- booth feature stack changes
- calculator internals
- AI backend/chat backend
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
- Sponsor Screen Hover/Pointer Affordance Review
