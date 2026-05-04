Phase 147 Diagnostics

Status
- PASS

Audit Scope
- `src/modules/expo/runtime/world/WorldCityScreenAssignments.tsx`
- `src/modules/expo/lib/sponsorScreenInteractionResolver.ts`
- `src/modules/expo/__tests__/sponsorScreenInteractionResolver.test.ts`
- `src/modules/expo/runtime/world/WorldCityScreenSurfaces.tsx`
- `src/shared/expo/worldContract.ts`
- `src/App.tsx`

Confirmed
- Assignment-layer click host remains the only sponsor screen click seam.
- Resolver candidate is still derived only from assignment metadata.
- Route navigation still uses resolver output.
- `event.stopPropagation()` remains present in the click handler.
- `WorldCityScreenSurfaces.tsx` remains display-only.
- No hover/pointer affordance system was introduced.
- No worldContract redesign happened.
- No App route additions happened.
- No booth feature stack changes happened in this phase.

Validation
- Sandbox PASS:
  - `npm.cmd run check:expo-boundaries`
  - `npm.cmd run check:backend-boundaries`
  - `npx.cmd tsc -b`
  - `npm.cmd --prefix backend-server run build`
- Sandbox-only `spawn EPERM`:
  - `npm.cmd run build`
  - `npx.cmd tsx src/modules/expo/__tests__/screenOrientationDiagnostics.test.ts`
  - `npx.cmd tsx src/modules/expo/__tests__/boothFrontalityDiagnostics.test.ts`
  - `npx.cmd tsx src/modules/expo/__tests__/sponsorScreenInteractionResolver.test.ts`
  - `npx.cmd tsx backend-server/routes/__tests__/expoScene.test.ts`
  - `npx.cmd tsx backend-server/routes/__tests__/expoScene.controller.test.ts`
- Outside sandbox PASS:
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

Selection Outcome
- Next target selected: `SPONSOR SCREEN HOVER/POINTER AFFORDANCE REVIEW`
