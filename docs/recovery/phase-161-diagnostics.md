# Phase 161 Diagnostics

Status: PASS

## Audit Scope

Exact invalid-position source isolation before any screen-to-booth proximity work.

## Files Inspected

- [worldCityGeometry.ts](/C:/3d/src/modules/expo/runtime/planning/legacy/worldCityGeometry.ts)
- [buildCanonicalWorldPlan.ts](/C:/3d/src/modules/expo/runtime/planning/world-plan/buildCanonicalWorldPlan.ts)
- [sponsorScreenLayout.ts](/C:/3d/src/modules/expo/lib/sponsorScreenLayout.ts)
- [buildScreenSurfacePlan.ts](/C:/3d/src/modules/expo/runtime/planning/screens/buildScreenSurfacePlan.ts)
- [buildScreenSocketPlan.ts](/C:/3d/src/modules/expo/runtime/planning/screens/buildScreenSocketPlan.ts)
- [screenSurfaceBoundsDiagnostics.ts](/C:/3d/src/modules/expo/runtime/planning/screens/screenSurfaceBoundsDiagnostics.ts)
- [sceneDataSource.ts](/C:/3d/src/modules/expo/runtime/data/sceneDataSource.ts)
- [worldContract.ts](/C:/3d/src/shared/expo/worldContract.ts)
- [WorldCityScreenSurfaces.tsx](/C:/3d/src/modules/expo/runtime/world/WorldCityScreenSurfaces.tsx)
- [WorldCityScreenAssignments.tsx](/C:/3d/src/modules/expo/runtime/world/WorldCityScreenAssignments.tsx)

## Reproduction Summary

Bad invocation:

- `buildCanonicalWorldPlan({ ..., districtStride: world.districtStride })`
- `world.districtStride` is absent on `ExpoWorldContract`
- effective value: `undefined`

Observed:

- `surfaceCount: 24`
- `invalidSurfaceCount: 24`
- `firstInvalidSurface.id: screen-marquee-left-0`
- `socketCount: 24`
- `invalidSocketCount: 24`
- `assignmentCount: 24`
- `boundsDiagnostics: 24`

Good invocation:

- `buildCanonicalWorldPlan({ ..., districtStride: 548 })`

Observed:

- `surfaceCount: 22`
- `invalidSurfaceCount: 0`
- `socketCount: 22`
- `invalidSocketCount: 0`
- `assignmentCount: 22`
- `boundsDiagnostics: 0`

## Exact First Non-Finite Seam

First source seam:

- [worldCityGeometry.ts](/C:/3d/src/modules/expo/runtime/planning/legacy/worldCityGeometry.ts)
- `buildMediaWallSurfaces(districtCount, districtStride)`
- `baseZ = -214 - (districtIndex * districtStride)`

Failure mode:

- `districtStride === undefined`
- `districtIndex * undefined => NaN`
- `position[2] => NaN`

## Phase 155 vs Phase 160 Explanation

Phase 155 zero-diagnostic result matched runtime-correct input.

Phase 160 twenty-four-diagnostic result came from wrong scan input:

- wrong field source: `world.districtStride`
- field does not exist on world contract
- scan injected `undefined`

Conclusion:

- scan mismatch was tooling/input misuse
- not authored layout corruption
- not canonical runtime plan corruption

## Runtime Safety Note

Current runtime remains stable because:

- [WorldCitySkeleton.tsx](/C:/3d/src/modules/expo/runtime/world/WorldCitySkeleton.tsx) hardcodes `districtStride = 548`
- that value is passed directly into canonical plan build

## Open Geometry Blockers

Still unresolved:

- `ExpoBoothPlacement.layoutFootprint` is not booth-local
- screen-to-booth proximity helper remains blocked until booth-local footprint seam exists

## Validation Summary

Passed in sandbox:

- `npm.cmd run check:expo-boundaries`
- `npm.cmd run check:backend-boundaries`
- `npx.cmd tsc -b`
- `npm.cmd --prefix backend-server run build`

Passed outside sandbox:

- `npm.cmd run build`
- `npx.cmd tsx src/modules/expo/__tests__/screenOrientationDiagnostics.test.ts`
- `npx.cmd tsx src/modules/expo/__tests__/boothFrontalityDiagnostics.test.ts`
- `npx.cmd tsx src/modules/expo/__tests__/sponsorScreenInteractionResolver.test.ts`
- `npx.cmd tsx src/modules/expo/__tests__/screenSurfaceBoundsDiagnostics.test.ts`
- `npx.cmd tsx src/modules/expo/__tests__/screenSurfaceOverlapDiagnostics.test.ts`
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.controller.test.ts`

## Decision

Selected next target:

- `SCREEN SURFACE DIAGNOSTIC SCAN CORRECTION`

