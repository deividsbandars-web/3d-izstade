# Phase 158 Diagnostics

Status: PASS

## Added Helper

- `src/modules/expo/runtime/planning/screens/screenSurfaceOverlapDiagnostics.ts`

## Added Test

- `src/modules/expo/__tests__/screenSurfaceOverlapDiagnostics.test.ts`

## Helper Contract

`diagnoseScreenSurfaceOverlaps(...)`:

- accepts narrow `CityScreenSurface`-like geometry input
- compares only X/Z AABB intervals
- returns overlap diagnostics only for positively overlapping pairs
- skips invalid bounds instead of duplicating bounds diagnostics
- does not mutate input
- does not move or fix objects
- does not run as active gate

## Diagnostic Code

- `screen-screen-overlap`

## Policy Notes

Bounds validity stays owned by:

- `screenSurfaceBoundsDiagnostics.ts`

Overlap helper stays focused on:

- same-family `CityScreenSurface`
- conservative positive AABB overlap only

Touching edges:

- do not warn

## Canonical Fallback Scan

Read-only scan result:

```json
{
  "screenSurfaceCount": 24,
  "diagnosticsCount": 0,
  "codes": [],
  "overlapPairs": []
}
```

Interpretation:

- current fallback world is clean under the new helper
- no noisy overlap pairs were introduced

## Validation Summary

Sandbox pass:

- `npm.cmd run check:expo-boundaries`
- `npm.cmd run check:backend-boundaries`
- `npx.cmd tsc -b`
- `npm.cmd --prefix backend-server run build`

Outside-sandbox pass:

- `npm.cmd run build`
- `npx.cmd tsx src/modules/expo/__tests__/screenOrientationDiagnostics.test.ts`
- `npx.cmd tsx src/modules/expo/__tests__/boothFrontalityDiagnostics.test.ts`
- `npx.cmd tsx src/modules/expo/__tests__/sponsorScreenInteractionResolver.test.ts`
- `npx.cmd tsx src/modules/expo/__tests__/screenSurfaceBoundsDiagnostics.test.ts`
- `npx.cmd tsx src/modules/expo/__tests__/screenSurfaceOverlapDiagnostics.test.ts`
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.controller.test.ts`

## Backend Baseline

- domain duplicate warnings: `0`
- leads duplicate warnings: `0`
- billing boundary warnings: `0`
- violations: `0`
