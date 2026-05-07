Phase 139 diagnostics

Audit scope:
- 2D surface inventory
- in-world host seam audit
- placement metadata audit
- visibility/orientation risk audit
- interaction/action audit
- validation seam audit

Key source files inspected:
- [ExpoWorldSceneLayers.tsx](/C:/3d/src/modules/expo/runtime/world/scene/ExpoWorldSceneLayers.tsx)
- [ExpoWorldSceneRoot.tsx](/C:/3d/src/modules/expo/runtime/world/scene/ExpoWorldSceneRoot.tsx)
- [WorldCityScreenSurfaces.tsx](/C:/3d/src/modules/expo/runtime/world/WorldCityScreenSurfaces.tsx)
- [sponsorScreenLayout.ts](/C:/3d/src/modules/expo/lib/sponsorScreenLayout.ts)
- [buildCanonicalWorldPlan.ts](/C:/3d/src/modules/expo/runtime/planning/world-plan/buildCanonicalWorldPlan.ts)
- [shared.ts](/C:/3d/src/modules/expo/runtime/planning/zones/shared.ts)
- [BoothVisualAssembly.tsx](/C:/3d/src/modules/expo/runtime/booths/BoothVisualAssembly.tsx)
- [BoothFeatureContent.tsx](/C:/3d/src/modules/expo/runtime/booths/BoothFeatureContent.tsx)
- [BoothRoom.tsx](/C:/3d/src/pages/expo/BoothRoom.tsx)
- [BoothStreamRoom.tsx](/C:/3d/src/pages/expo/BoothStreamRoom.tsx)
- [worldContract.ts](/C:/3d/src/shared/expo/worldContract.ts)

Findings summary:
- booth feature seam is the safest current 2D stand host
- sponsor screen seam has stronger placement metadata but weaker interaction proof
- BoothRoom and BoothStreamRoom remain route-level targets, not city-level stand hosts
- no `worldContract` redesign is needed for the first visible 2D stand slice

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

Selected decision:
- `2D stand first visible surface next`
