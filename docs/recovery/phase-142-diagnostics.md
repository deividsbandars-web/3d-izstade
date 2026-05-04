Phase 142 diagnostics

Audit scope:
- sponsor screen placement/render pipeline
- runtime metadata reachability
- click/action host feasibility
- smallest next interaction seam selection

Files inspected:
- [WorldCityScreenSurfaces.tsx](/C:/3d/src/modules/expo/runtime/world/WorldCityScreenSurfaces.tsx)
- [WorldCityScreenAssignments.tsx](/C:/3d/src/modules/expo/runtime/world/WorldCityScreenAssignments.tsx)
- [WorldCitySkeleton.tsx](/C:/3d/src/modules/expo/runtime/world/WorldCitySkeleton.tsx)
- [sponsorScreenLayout.ts](/C:/3d/src/modules/expo/lib/sponsorScreenLayout.ts)
- [buildCanonicalWorldPlan.ts](/C:/3d/src/modules/expo/runtime/planning/world-plan/buildCanonicalWorldPlan.ts)
- [types/index.ts](/C:/3d/src/modules/expo/runtime/planning/types/index.ts)
- [worldCityGeometry.ts](/C:/3d/src/modules/expo/runtime/planning/legacy/worldCityGeometry.ts)
- [BoothInteractions.ts](/C:/3d/src/modules/expo/runtime/booths/BoothInteractions.ts)
- [sponsorBoothPresentation.ts](/C:/3d/src/modules/expo/lib/sponsorBoothPresentation.ts)

Key findings:
- `screenSurfaces` are display shells with no click host
- `screenAssignments` carry richer content metadata including `companyId`
- runtime does not currently carry explicit action/route metadata for sponsor screens
- smallest safe next seam is resolver-first, not pointer-first

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

Selected next target:
- `SPONSOR SCREEN INTERACTION RESOLVER FIRST SLICE`
