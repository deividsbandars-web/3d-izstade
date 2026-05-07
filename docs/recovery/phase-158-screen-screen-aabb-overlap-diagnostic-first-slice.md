# Phase 158: Screen-Screen AABB Overlap Diagnostic First Slice

Status: PASS

## Summary

Phase 158 introduced a new pure diagnostic-only helper for conservative X/Z AABB overlap checks between `CityScreenSurface`-like objects.

Added:

- `src/modules/expo/runtime/planning/screens/screenSurfaceOverlapDiagnostics.ts`
- `src/modules/expo/__tests__/screenSurfaceOverlapDiagnostics.test.ts`

The helper remains:

- pure/read-only
- diagnostic-only
- same-family screen-screen only
- not an active gate
- not used by runtime rendering

## Diagnostic / Helper Implementation

New helper:

- `diagnoseScreenSurfaceOverlaps(...)`

Input shape:

- `id`
- `position`
- `size`

Output shape:

- `code`
- `surfaceA`
- `surfaceB`
- `message`
- `details.overlapX`
- `details.overlapZ`
- `details.surfaceA`
- `details.surfaceB`

Important choices:

- overlap logic is separate from `screenSurfaceBoundsDiagnostics.ts`
- invalid or missing bounds are skipped rather than duplicated as a second bounds diagnostic suite
- helper does not depend on world contract, React, rendering, navigation, or placement mutation

## AABB Overlap Model Assumptions

This slice uses conservative X/Z AABB overlap only.

Assumptions:

- `position[0]` and `position[2]` are the center point in X/Z
- `size[0]` is width in X
- `size[2]` is depth in Z
- overlap exists only when both X and Z interval overlap is strictly positive
- touching edges do not warn

Not included:

- rotation-aware overlap
- oriented rectangle math
- circle approximation
- section filtering
- screen-booth proximity
- assignment/socket overlap

## Diagnostic Codes

Added code:

- `screen-screen-overlap`

No extra invalid-bounds code was added in this helper. Bounds validity remains owned by:

- `screenSurfaceBoundsDiagnostics.ts`

## Test Coverage Added

New fixture test:

- `src/modules/expo/__tests__/screenSurfaceOverlapDiagnostics.test.ts`

Coverage:

- separated surfaces return no diagnostics
- overlapping surfaces return one diagnostic
- touching edges do not warn
- multiple overlapping surfaces return deterministic pair diagnostics
- invalid bounds do not crash the helper
- helper is pure/read-only

## Real-Data Scan Results

Read-only canonical fallback scan path:

1. `buildProductionSafeFallbackScene()`
2. `buildExpoWorldContract(scene)`
3. `buildCanonicalWorldPlan(...)`
4. `diagnoseScreenSurfaceOverlaps(plan.filteredScreenSurfaces)`

Result:

```json
{
  "screenSurfaceCount": 24,
  "diagnosticsCount": 0,
  "codes": [],
  "overlapPairs": []
}
```

Assessment:

- helper is non-noisy on current canonical fallback data
- no overlap pairs were reported

## Files Changed

- `src/modules/expo/runtime/planning/screens/screenSurfaceOverlapDiagnostics.ts`
- `src/modules/expo/__tests__/screenSurfaceOverlapDiagnostics.test.ts`
- `docs/recovery/phase-158-screen-screen-aabb-overlap-diagnostic-first-slice.md`
- `docs/recovery/phase-158-diagnostics.md`
- `diagnostics/project-analysis-bundle-phase-158.zip`

## Files Explicitly Not Changed

- `src/modules/expo/runtime/world/WorldCityScreenAssignments.tsx`
- `src/modules/expo/runtime/world/WorldCityScreenSurfaces.tsx`
- `src/modules/expo/lib/sponsorScreenInteractionResolver.ts`
- `src/shared/expo/worldContract.ts`
- `src/App.tsx`
- route/action metadata
- click/cursor/highlight behavior
- object positions/yaw/layout

## Out-of-Scope Confirmation

Not done in this phase:

- active gate integration
- screen-booth proximity diagnostic
- assignment/socket overlap diagnostic
- generic 2D overlap model
- rotation-aware overlap
- automatic collision resolution
- object movement
- screen/booth repositioning
- yaw fixes
- calculator changes
- AI backend/chat changes
- backend duplicate cleanup

## Validation Results

Passed in sandbox:

- `npm.cmd run check:expo-boundaries`
- `npm.cmd run check:backend-boundaries`
- `npx.cmd tsc -b`
- `npm.cmd --prefix backend-server run build`

Passed outside sandbox on the same machine:

- `npm.cmd run build`
- `npx.cmd tsx src/modules/expo/__tests__/screenOrientationDiagnostics.test.ts`
- `npx.cmd tsx src/modules/expo/__tests__/boothFrontalityDiagnostics.test.ts`
- `npx.cmd tsx src/modules/expo/__tests__/sponsorScreenInteractionResolver.test.ts`
- `npx.cmd tsx src/modules/expo/__tests__/screenSurfaceBoundsDiagnostics.test.ts`
- `npx.cmd tsx src/modules/expo/__tests__/screenSurfaceOverlapDiagnostics.test.ts`
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.controller.test.ts`

## Remaining Overlap / Bounds Risks

Still not covered:

- screen-booth proximity
- assignment/socket overlap
- broader 2D surface overlap model
- diagnostic seams as active gates
- rotation-aware overlap edge cases

## Next-Cycle Recommendation

Next phase:

- `SCREEN-SCREEN OVERLAP DIAGNOSTIC STABILIZATION AND NEXT TARGET SELECTION`

Likely next targets after stabilization:

- `SCREEN-BOOTH PROXIMITY DIAGNOSTIC REVIEW`
- `SCREEN/BOOTH DIAGNOSTIC INTEGRATION REVIEW`
- `2D SURFACE BOUNDS DIAGNOSTIC REVIEW`
- `SCREEN-SCREEN OVERLAP ACTIVE GATE REVIEW`
