Phase 149 Diagnostics

Status
- PASS

Implementation Audit
- `WorldCityScreenAssignments.tsx` now derives `isRouteAction` from the existing resolver result.
- `isRouteAction` gates:
  - `onClick`
  - `onPointerOver`
  - `onPointerOut`
- Cursor policy is local and minimal:
  - pointer on route-action hover
  - auto on pointer out
- No-action screens remain inert because pointer and click handlers are not attached.

Unchanged Contracts
- `sponsorScreenInteractionResolver.ts` unchanged
- `WorldCityScreenSurfaces.tsx` unchanged
- `worldContract.ts` unchanged
- `App.tsx` unchanged
- booth feature stack unchanged

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
