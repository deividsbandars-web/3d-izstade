# Phase 157 Diagnostics

Status: PASS

## Audit Scope

Phase 157 reviewed whether the next overlap diagnostic should start from:

- raw screen-surface overlap
- section-filtered overlap
- assignment/socket overlap
- or defer to screen-booth proximity

No implementation was done in this phase.

## Files Inspected

- `src/modules/expo/runtime/planning/screens/screenSurfaceBoundsDiagnostics.ts`
- `src/modules/expo/runtime/planning/screens/screenOrientationDiagnostics.ts`
- `src/modules/expo/runtime/planning/world-plan/buildCanonicalWorldPlan.ts`
- `src/modules/expo/runtime/planning/legacy/worldCityGeometry.ts`
- `src/modules/expo/lib/sponsorScreenLayout.ts`
- `src/shared/expo/worldContract.ts`

## Metadata Findings

`CityScreenSurface` provides the cleanest first overlap seam:

- `id`
- `position`
- `rotation`
- `size`
- `role`
- `type`
- `sections`
- `renderIntent`

`CityScreenSocket` and `CityScreenAssignment` are useful context but are not the best first same-family geometry seam.

## Bounds Helper Findings

`screenSurfaceBoundsDiagnostics.ts` remains:

- pure/read-only
- narrow
- geometry-only
- diagnostic-only
- not an active gate

Overlap logic should be a separate helper rather than expanding the existing bounds helper.

## Read-Only Canonical Scan

Input path:

1. `buildProductionSafeFallbackScene()`
2. `buildExpoWorldContract(scene)`
3. `buildCanonicalWorldPlan(...)`
4. inspect `plan.filteredScreenSurfaces`

Scan result:

```json
{
  "screenSurfaceCount": 24,
  "rawOverlapPairs": 0,
  "sectionFilteredOverlapPairs": 0,
  "sameRoleOverlapPairs": 0,
  "sameTypeOverlapPairs": 0,
  "rawSample": [],
  "sectionSample": []
}
```

## Decision Signal

Raw AABB overlap is currently non-noisy on canonical fallback data.

This means the smallest next safe diagnostic slice is:

- `SCREEN-SCREEN AABB OVERLAP DIAGNOSTIC FIRST SLICE`

and not:

- section-filtered overlap first
- assignment/socket overlap first
- screen-booth proximity first

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
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.controller.test.ts`

## Backend Baseline

- domain duplicate warnings: `0`
- leads duplicate warnings: `0`
- billing boundary warnings: `0`
- violations: `0`
