# Phase 159: Screen-Screen Overlap Diagnostic Stabilization And Next Target Selection

Status: PASS

## Summary

Phase 159 confirmed that the Phase 158 screen-screen overlap helper remains stable, isolated, and non-noisy. The helper still lives outside runtime and planning active-gate paths, and a repeat canonical fallback scan still reports zero overlap diagnostics.

Selected next target:

- `SCREEN-BOOTH PROXIMITY DIAGNOSTIC REVIEW`

## Screen-Screen Overlap Diagnostic Stabilization Audit

Reviewed files:

- `src/modules/expo/runtime/planning/screens/screenSurfaceOverlapDiagnostics.ts`
- `src/modules/expo/__tests__/screenSurfaceOverlapDiagnostics.test.ts`
- `src/modules/expo/runtime/planning/screens/screenSurfaceBoundsDiagnostics.ts`
- `src/modules/expo/runtime/planning/screens/screenOrientationDiagnostics.ts`
- `src/shared/expo/lib/boothFrontalityDiagnostics.ts`
- `src/modules/expo/runtime/planning/world-plan/buildCanonicalWorldPlan.ts`
- `src/modules/expo/runtime/world/WorldCityScreenAssignments.tsx`
- `src/modules/expo/runtime/world/WorldCityScreenSurfaces.tsx`

Confirmed:

- helper accepts only narrow candidate shape:
  - `id`
  - `position`
  - `size`
- helper does not mutate input
- helper does not import React
- helper does not fix or move objects
- helper does not run in runtime render path
- helper does not run in canonical planning path as active gate
- `rg` confirms helper is currently referenced only by its fixture test
- invalid bounds remain owned by `screenSurfaceBoundsDiagnostics.ts`
- touching-edge policy remains non-warning
- no screen placement, size, rotation, or layout was changed

## Test Coverage Confirmation

Confirmed fixture coverage:

- separated surfaces return no diagnostics
- overlapping surfaces return one diagnostic
- touching edges do not warn
- multiple overlapping surfaces produce deterministic pair output
- invalid bounds do not crash
- helper is pure/read-only

## Real-Data Scan Results

Read-only scan path:

1. `buildProductionSafeFallbackScene()`
2. `buildExpoWorldContract(scene)`
3. `buildCanonicalWorldPlan(...)`
4. `diagnoseScreenSurfaceOverlaps(...)`

Result:

```json
{
  "totalScreenSurfaces": 24,
  "diagnosticsCount": 0,
  "diagnosticCodes": [],
  "overlapPairs": [],
  "noisy": false
}
```

Assessment:

- helper remains non-noisy on canonical fallback data
- current diagnostics are actionable rather than speculative

## Regression Check

Confirmed no regressions in:

- sponsor screen route click
- sponsor screen cursor affordance
- sponsor screen hover highlight
- AI panel GlobalChat behavior
- calculator panel `/calculators` behavior
- 2D info stand `demo_room` / showroom behavior

Backend baseline remains:

- domain duplicate warnings: `0`
- leads duplicate warnings: `0`
- billing boundary warnings: `0`
- violations: `0`

## Candidate Next Target Comparison

### SCREEN-BOOTH PROXIMITY DIAGNOSTIC REVIEW

- risk: `medium`
- value: `high`
- next natural geometry seam after same-family screen overlap
- stays diagnostic-only
- addresses clickable/highlighted screen usability and occlusion risk near booth geometry

### SCREEN/BOOTH DIAGNOSTIC INTEGRATION REVIEW

- risk: `low/medium`
- value: `high`
- good hardening target
- less immediate than another diagnostic seam because gate policy can wait until more geometry coverage exists

### 2D SURFACE BOUNDS DIAGNOSTIC REVIEW

- risk: `medium/high`
- value: `medium/high`
- broader and less narrow than needed now

### SCREEN-SCREEN OVERLAP ACTIVE GATE REVIEW

- risk: `medium`
- value: `medium/high`
- premature while cross-family proximity is still uncovered

### STABILIZATION HOLD

- not needed

## Selected Decision

- `SCREEN-BOOTH PROXIMITY DIAGNOSTIC REVIEW`

## Selection Rationale

This is the smallest next diagnostic seam that meaningfully expands geometry safety coverage.

Reasoning:

- same-family screen overlap is now covered and stable
- active-gate work is still premature
- broader generic 2D surface work is too wide
- screen-booth proximity is the highest-value remaining risk for interactive/highlighted screens

## Files Likely Affected Next Phase

Likely audit targets:

- `src/modules/expo/runtime/planning/legacy/worldCityGeometry.ts`
- `src/modules/expo/runtime/planning/world-plan/buildCanonicalWorldPlan.ts`
- `src/shared/expo/layoutEngine.ts`
- `src/shared/expo/worldContract.ts`
- `src/modules/expo/runtime/planning/screens/screenSurfaceOverlapDiagnostics.ts` as adjacent context
- `src/shared/expo/lib/boothFrontalityDiagnostics.ts` as adjacent diagnostic precedent

## Files Explicitly Out Of Scope Next Phase

- `src/modules/expo/runtime/world/WorldCityScreenAssignments.tsx`
- `src/modules/expo/runtime/world/WorldCityScreenSurfaces.tsx`
- `src/modules/expo/lib/sponsorScreenInteractionResolver.ts`
- `src/shared/expo/worldContract.ts` redesign
- `src/App.tsx`
- route/action metadata changes
- screen click/cursor/highlight changes
- object movement
- screen/booth repositioning
- yaw fixes
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

## Remaining Risks

- screen-booth proximity is not yet audited
- diagnostics are still not active planning/test gates
- broader 2D surface bounds model remains open
- generic cross-family occlusion reasoning is still uncovered

## Next-Cycle Recommendation

Next phase:

- `SCREEN-BOOTH PROXIMITY DIAGNOSTIC REVIEW`

Recommended scope:

- audit conservative screen-to-booth distance/proximity reasoning
- stay diagnostic-only
- avoid object movement, gate integration, or layout redesign
