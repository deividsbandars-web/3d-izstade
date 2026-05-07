# Phase 160: Screen-Booth Proximity Diagnostic Review

Status: PASS

## Summary

Phase 160 audited whether the current screen and booth metadata is sufficient for a conservative screen-to-booth proximity diagnostic seam.

Main result:

- `CityScreenSurface` geometry is structurally suitable for a proximity helper
- `ExpoBoothPlacement.layoutFootprint` is not booth-local; it is the shared boulevard plan footprint
- the current canonical fallback screen data contains non-finite `position[2]` values

Selected decision:

- `SCREEN-BOOTH PROXIMITY REVIEW DEFER WITH EXACT BLOCKER`

## Screen Metadata Audit

Reviewed files:

- `src/modules/expo/runtime/planning/legacy/worldCityGeometry.ts`
- `src/modules/expo/runtime/planning/world-plan/buildCanonicalWorldPlan.ts`
- `src/modules/expo/runtime/planning/screens/screenSurfaceBoundsDiagnostics.ts`
- `src/modules/expo/runtime/planning/screens/screenSurfaceOverlapDiagnostics.ts`

Confirmed `CityScreenSurface` shape:

- `id`
- `position`
- `rotation`
- `size`
- `role`
- `type`
- `sections`
- `renderIntent`

Assessment:

- `size` is sufficient for conservative X/Z bounds
- first proximity slice could ignore rotation if the rest of the geometry is valid
- the `screenSurfaceBoundsDiagnostics` candidate shape is reusable in spirit

Important blocker found in real canonical data:

- canonical fallback `filteredScreenSurfaces` currently includes non-finite `position[2]` values such as `NaN`
- this means the screen side of a proximity helper is not currently trustworthy enough for a new seam

## Booth Metadata Audit

Reviewed files:

- `src/shared/expo/layoutEngine.ts`
- `src/shared/expo/worldContract.ts`
- `src/shared/expo/lib/boulevardLayout.ts`
- `src/shared/expo/walkRegion.ts`
- `src/modules/expo/components/BoothArchitectureKit.tsx`

Confirmed `ExpoBoothPlacement` shape:

- `id`
- `position`
- `rotation`
- `nodeType`
- `layoutFootprint`
- `sectorId`
- `sectorName`
- `clusterIndex`

Critical finding:

- `layoutFootprint` is assigned from `plan.footprint`
- `plan.footprint` is the overall boulevard/world footprint, not a per-booth footprint
- all fallback booth placements carry the same `layoutFootprint`

Implication:

- `layoutFootprint` is not reliable for booth-local AABB proximity checks

Useful fallback context:

- `nodeType` families are stable
- booth architecture templates expose local `footprintSize` and `colliderSize`
- but deriving booth-local proximity bounds from runtime template logic would introduce extra coupling and policy risk

## Existing Geometry / Diagnostics Audit

Reviewed:

- `src/shared/expo/lib/boulevardLayout.ts`
- `src/shared/expo/lib/boothFrontalityDiagnostics.ts`
- `src/modules/expo/runtime/planning/screens/screenSurfaceBoundsDiagnostics.ts`
- `src/modules/expo/runtime/planning/screens/screenSurfaceOverlapDiagnostics.ts`

Already covered:

- booth placement rejection against blocked geometry, stadium reserve, and lane envelope
- booth frontality
- screen bounds validity
- screen-screen overlap

Not covered:

- booth-local footprint diagnostics
- screen-to-booth proximity
- cross-family occlusion/crowding checks

## Proximity Model Feasibility

### A. Screen AABB vs booth footprint AABB

Pros:

- best first proximity model if booth-local footprint exists

Cons:

- blocked because `layoutFootprint` is global, not booth-local

Assessment:

- not safe right now

### B. Center-to-center minimum distance

Pros:

- simple
- pure/read-only

Cons:

- too coarse
- screen invalid-Z blocker makes it unreliable on current canonical data
- high false-positive and false-negative risk

Assessment:

- not strong enough for next slice

### C. Screen AABB vs booth approximate radius

Pros:

- possible if booth-local dimensions can be approximated

Cons:

- current booth-local approximation would have to be inferred from runtime template metrics and `nodeType`
- coupling is higher than needed for first slice

Assessment:

- possible later, but not the smallest safe next step

### D. Lane/sector exclusion model

Pros:

- may align with boulevard planning policy

Cons:

- too policy-heavy for first proximity slice

Assessment:

- premature

### E. Oriented screen rectangle vs booth footprint

Pros:

- more accurate

Cons:

- geometry complexity too high

Assessment:

- not suitable for first slice

## Intentional Proximity Audit

Considered intentional close-placement patterns:

- facade screens near sponsor frontage
- sponsor screens near booth clusters
- decorative signage near booth zones
- screen surfaces aligned to district frontage rather than isolated open space

First proximity slice should avoid warning on:

- frontage-adjacent screens that are intentionally part of district composition
- any case where booth-local bounds are not explicit

This reinforces the need for reliable booth-local footprint metadata before adding a proximity helper.

## Real-Data Scan Feasibility / Results

Read-only scan path:

1. `buildProductionSafeFallbackScene()`
2. `buildExpoWorldContract(scene)`
3. `buildCanonicalWorldPlan(...)`
4. inspect `filteredScreenSurfaces` and `boothPlacements`

Results:

- `screenSurfaceCount: 24`
- `boothPlacementCount: 3`
- `missingScreenBoundsCount: 0` by shape alone
- `missingBoothFootprintCount: 0` by presence alone
- `layoutFootprintSameForAll: true`

Deeper finding:

- the first scanned screen surface had `position: [ -708, 148, NaN ]`
- `diagnoseScreenSurfaceBounds(plan.filteredScreenSurfaces).length` returned `24` in this audit

Interpretation:

- canonical fallback data is currently not clean enough for a new screen-booth proximity seam
- the previously assumed “clean screen bounds” baseline is not reliable as of this Phase 160 audit

## Candidate Diagnostic Scope Options

### A. SCREEN-BOOTH AABB PROXIMITY DIAGNOSTIC FIRST SLICE

- blocked
- per-booth AABB metadata is not currently available in a clean planning-owned seam

### B. SCREEN-BOOTH CENTER DISTANCE DIAGNOSTIC FIRST SLICE

- technically possible
- too coarse and too risky under current invalid screen-position signal

### C. SCREEN-BOOTH PROXIMITY REVIEW DEFER WITH EXACT BLOCKER

- strongest current option
- documents the real blocker rather than inventing a noisy heuristic

### D. SCREEN/BOOTH DIAGNOSTIC INTEGRATION REVIEW NEXT

- still valid later
- not the right next step while underlying geometry data is inconsistent

### E. 2D SURFACE BOUNDS DIAGNOSTIC REVIEW NEXT

- broader than needed
- does not address the exact blocker directly

## Risk Classification

### SCREEN-BOOTH AABB PROXIMITY DIAGNOSTIC FIRST SLICE

- risk: high
- value: high
- false-positive risk: medium/high
- blocker: no booth-local footprint seam

### SCREEN-BOOTH CENTER DISTANCE DIAGNOSTIC FIRST SLICE

- risk: high
- value: medium
- false-positive risk: high
- false-negative risk: high

### SCREEN-BOOTH PROXIMITY REVIEW DEFER WITH EXACT BLOCKER

- risk: low
- value: high
- preserves rigor
- avoids adding a misleading helper

### SCREEN/BOOTH DIAGNOSTIC INTEGRATION REVIEW NEXT

- risk: medium
- value: medium/high
- wrong order while geometry input is unstable

## Selected Decision

- `SCREEN-BOOTH PROXIMITY REVIEW DEFER WITH EXACT BLOCKER`

## Selection Rationale

Two exact blockers prevent a safe Phase 161 proximity implementation slice:

1. `ExpoBoothPlacement.layoutFootprint` is global plan footprint, not booth-local footprint.
2. Canonical fallback `CityScreenSurface` data currently contains non-finite Z positions.

Because of that:

- booth-local AABB proximity is not grounded in reliable metadata
- center-distance fallback would be too coarse
- a new proximity helper now would likely be noisy or misleading

## Files Likely Affected Next Phase

If the blocker is addressed next, likely files are:

- `src/modules/expo/runtime/planning/legacy/worldCityGeometry.ts`
- `src/modules/expo/runtime/planning/world-plan/buildCanonicalWorldPlan.ts`
- `src/modules/expo/runtime/planning/screens/screenSurfaceBoundsDiagnostics.ts`
- `src/shared/expo/layoutEngine.ts`
- `src/shared/expo/worldContract.ts` as read-only context

## Files Explicitly Out Of Scope Next Phase

- `src/modules/expo/runtime/world/WorldCityScreenAssignments.tsx`
- `src/modules/expo/runtime/world/WorldCityScreenSurfaces.tsx`
- `src/modules/expo/lib/sponsorScreenInteractionResolver.ts`
- `src/App.tsx`
- route/action metadata changes
- click/cursor/highlight changes
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

- canonical screen-surface data validity is currently inconsistent with prior assumptions
- booth-local footprint metadata is missing from the planning seam
- screen-booth proximity remains uncovered
- diagnostics are still not active gates

## Next-Cycle Recommendation

Next phase:

- `SCREEN-BOOTH PROXIMITY REVIEW DEFER WITH EXACT BLOCKER`

Recommended follow-up:

- first resolve canonical screen-surface invalid-position signal
- then decide whether booth-local footprint should be exposed in a planning-safe seam
- only after that, return to a screen-booth proximity implementation review
