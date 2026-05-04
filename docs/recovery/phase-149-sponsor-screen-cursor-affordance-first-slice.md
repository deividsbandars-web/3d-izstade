Phase 149 - Sponsor Screen Cursor Affordance First Slice

Status: PASS

Summary
- Added minimal cursor-only affordance for sponsor screen assignments.
- Cursor pointer appears only for sponsor screens whose resolver returns `kind: 'route'`.
- No-action sponsor screens remain fully inert.

Implementation Change
- Main implementation file:
  - `src/modules/expo/runtime/world/WorldCityScreenAssignments.tsx`
- Added a local `isRouteAction` gate derived from `resolveSponsorScreenInteraction(...)`.
- Reused the same gate for:
  - `onClick`
  - `onPointerOver`
  - `onPointerOut`
- Pointer affordance behavior:
  - `onPointerOver` sets `document.body.style.cursor = 'pointer'`
  - `onPointerOut` resets `document.body.style.cursor = 'auto'`
- The implementation guards `document` access conservatively.

Cursor Affordance Behavior
- Route-action assignments:
  - clickable
  - show pointer cursor on hover
- No-action assignments:
  - no click
  - no cursor affordance
- No local hover state, no visual highlight, and no tooltip layer were introduced.

Click And Navigation Preservation
- Click still navigates through resolver output:
  - `navigate(resolvedAction.route)`
- The route contract is still owned by:
  - `src/modules/expo/lib/sponsorScreenInteractionResolver.ts`
- `event.stopPropagation()` remains in the click handler.
- No parallel hardcoded route builder was introduced in the runtime layer.

No-Action Screen Policy
- Inert screens stay silent:
  - no click
  - no pointer cursor
  - no extra affordance noise

Files Changed
- `src/modules/expo/runtime/world/WorldCityScreenAssignments.tsx`
- `docs/recovery/phase-149-sponsor-screen-cursor-affordance-first-slice.md`
- `docs/recovery/phase-149-diagnostics.md`
- `diagnostics/project-analysis-bundle-phase-149.zip`

Files Explicitly Not Changed
- `src/modules/expo/lib/sponsorScreenInteractionResolver.ts`
- `src/modules/expo/runtime/world/WorldCityScreenSurfaces.tsx`
- `src/shared/expo/worldContract.ts`
- `src/App.tsx`
- `src/modules/expo/lib/sponsorScreenLayout.ts`
- booth feature stack files
- calculator internals
- AI backend/chat backend

Out Of Scope Confirmation
- No material/emissive highlight
- No tooltip/Html overlay
- No broad pointer system
- No new action model
- No route changes
- No worldContract redesign
- No screen layout changes
- No screen yaw fixes
- No booth feature stack changes
- No backend duplicate cleanup

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
- Sponsor Screen Cursor Affordance Stabilization And Next Target Selection
