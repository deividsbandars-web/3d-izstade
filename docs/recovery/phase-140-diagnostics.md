Phase 140 diagnostics

Implementation scope:
- one visible 2D stand panel inside the existing booth feature host
- reuse existing `demo_room` booth action
- no new route
- no new action type
- no sponsor screen runtime changes
- no `worldContract` changes

Source change:
- [BoothFeatureContent.tsx](/C:/3d/src/modules/expo/runtime/booths/BoothFeatureContent.tsx)

Behavior checks confirmed:
- visible 2D stand panel exists in booth feature UI
- panel clicks through existing booth action seam
- AI feature panel still uses local chat trigger
- calculator feature panel still routes to `/calculators`
- `demo_room` behavior remains separate and route-based

Validation:
- `npm.cmd run check:expo-boundaries` -> PASS
- `npm.cmd run check:backend-boundaries` -> PASS
- `npx.cmd tsc -b` -> PASS
- `npm.cmd --prefix backend-server run build` -> PASS
- `npm.cmd run build` -> sandbox `spawn EPERM`, PASS outside sandbox
- `npx.cmd tsx src/modules/expo/__tests__/screenOrientationDiagnostics.test.ts` -> sandbox `spawn EPERM`, PASS outside sandbox
- `npx.cmd tsx src/modules/expo/__tests__/boothFrontalityDiagnostics.test.ts` -> sandbox `spawn EPERM`, PASS outside sandbox
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.test.ts` -> sandbox `spawn EPERM`, PASS outside sandbox
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.controller.test.ts` -> sandbox `spawn EPERM`, PASS outside sandbox

Current baseline:
- domain duplicate warnings: `0`
- leads duplicate warnings: `0`
- billing boundary warnings: `0`
- violations: `0`

Selected next recommendation:
- `2D STAND FIRST VISIBLE SURFACE STABILIZATION AND NEXT WEB3D TARGET SELECTION`
