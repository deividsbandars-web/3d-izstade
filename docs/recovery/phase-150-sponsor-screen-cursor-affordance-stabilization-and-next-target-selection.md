Phase 150 - Sponsor Screen Cursor Affordance Stabilization And Next Target Selection

Status: PASS

Summary
- Phase 149 cursor-only sponsor screen affordance is stable.
- Pointer affordance is still limited to route-action sponsor screens only.
- No-action screens remain inert with no false affordance.
- The next best product target is a narrow hover-highlight review.

Cursor Affordance Stabilization Audit
- `src/modules/expo/runtime/world/WorldCityScreenAssignments.tsx` still owns the sponsor screen interaction seam.
- `resolvedAction` is still produced from `resolveSponsorScreenInteraction(...)`.
- `isRouteAction` is derived from `resolvedAction.kind === 'route'`.
- `onPointerOver` is only attached for route-action assignments.
- `onPointerOut` is only attached for route-action assignments.
- `document.body.style.cursor = 'pointer'` is applied only for route-action assignments.
- `document.body.style.cursor = 'auto'` is restored on pointer out.
- No-action assignments do not receive pointer affordance.

Click And Navigation Behavior Confirmation
- Click behavior still uses resolver output:
  - `navigate(resolvedAction.route)`
- The route is not rebuilt or hardcoded outside the resolver.
- `event.stopPropagation()` remains in the click handler.
- `sponsorScreenInteractionResolver.ts` remains unchanged and pure/read-only.

No-Action Screen Policy Confirmation
- No-action sponsor screens remain:
  - without click behavior
  - without cursor affordance
  - without hover highlight
  - without tooltip
- No local hover state was introduced.
- No material or emissive highlight was introduced.
- No Html overlay or tooltip layer was introduced.

Regression Check
- `WorldCityScreenSurfaces.tsx` remains display-only.
- `worldContract.ts` remains unchanged.
- `App.tsx` remains unchanged.
- `sponsorScreenLayout.ts` remains unchanged.
- Booth feature stack remains unchanged.
- AI panel still uses the existing GlobalChat event seam.
- Calculator panel still uses `/calculators`.
- Booth 2D info stand still uses the existing `demo_room` / showroom seam.

Candidate Next Target Comparison
- Sponsor screen hover highlight review
  - Value: high UX/product value
  - Risk: medium
  - Best next visible improvement after cursor-only affordance
- Overlap/bounds diagnostic review
  - Value: high quality/safety
  - Risk: medium
  - Good safety seam, but less immediate sponsor-screen UX value
- Sponsor screen action metadata review
  - Value: medium/high
  - Risk: low/medium
  - Useful later if sponsor screens need richer actions than booth route navigation
- Screen/booth diagnostic integration review
  - Value: high hardening value
  - Risk: low/medium
  - Better as a safety hardening phase than as the immediate next UX step

Selected Decision
- SPONSOR SCREEN HOVER HIGHLIGHT REVIEW

Selection Rationale
- Cursor-only affordance already solves the minimum discoverability problem.
- The next visible UX gap is stronger visual discoverability while hovering.
- A hover-highlight audit is still narrower than tooltip, metadata expansion, or broader pointer-system work.
- It preserves the current interaction contract and avoids route, world, or layout redesign.

Files Likely Affected Next Phase
- `src/modules/expo/runtime/world/WorldCityScreenAssignments.tsx`
- possibly one tiny render helper near `src/modules/expo/runtime/world/**`

Files Explicitly Out Of Scope Next Phase
- `src/shared/expo/worldContract.ts`
- `src/App.tsx`
- `src/modules/expo/lib/sponsorScreenInteractionResolver.ts`
- `src/modules/expo/lib/sponsorScreenLayout.ts`
- `src/modules/expo/runtime/world/WorldCityScreenSurfaces.tsx` as a click-host redesign target
- booth feature stack changes
- calculator changes
- AI backend/chat changes
- screen repositioning or yaw fixes
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
- Sponsor Screen Hover Highlight Review
