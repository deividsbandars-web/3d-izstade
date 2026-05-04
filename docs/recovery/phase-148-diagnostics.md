Phase 148 Diagnostics

Status
- PASS

Audit Scope
- `src/modules/expo/runtime/world/WorldCityScreenAssignments.tsx`
- `src/modules/expo/runtime/world/WorldCityScreenSurfaces.tsx`
- `src/modules/expo/runtime/world/scene/ExpoWorldSceneLayers.tsx`
- `src/modules/expo/runtime/world/scene/ExpoWorldSceneRoot.tsx`
- `src/modules/expo/runtime/world/scene/ExpoWorldPlayerLayer.tsx`
- `src/modules/expo/lib/sponsorScreenInteractionResolver.ts`
- `src/modules/expo/runtime/booths/BoothFeatureContent.tsx`
- `src/modules/expo/runtime/booths/DistrictBooth.tsx`

Confirmed
- Assignment layer remains the sponsor screen click host seam.
- Route-action gating already exists and can also gate hover/pointer affordance.
- `WorldCityScreenSurfaces.tsx` remains display-only.
- Existing booth runtime already uses local `onPointerOver/onPointerOut` cursor affordance.
- Pointer lock unlock resets cursor to `auto`.
- No global cursor helper exists for sponsor screens.

Selection Outcome
- Next target selected: `SPONSOR SCREEN CURSOR AFFORDANCE FIRST SLICE`

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
