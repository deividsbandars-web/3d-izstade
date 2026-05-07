# Phase 157: Screen-Screen Overlap Diagnostic Review

Status: PASS

## Summary

Phase 157 audited whether the current screen planning metadata is sufficient for a conservative same-family screen-screen overlap diagnostic seam. The result is yes: `CityScreenSurface` already carries the minimum geometry needed for a pure overlap helper, and a read-only canonical fallback scan shows that raw X/Z AABB overlap is currently non-noisy.

Selected next target:

- `SCREEN-SCREEN AABB OVERLAP DIAGNOSTIC FIRST SLICE`

## Screen Metadata Audit

Reviewed files:

- `src/modules/expo/runtime/planning/legacy/worldCityGeometry.ts`
- `src/modules/expo/runtime/planning/world-plan/buildCanonicalWorldPlan.ts`
- `src/modules/expo/lib/sponsorScreenLayout.ts`
- `src/shared/expo/worldContract.ts`

Confirmed shapes:

### CityScreenSurface

- `id`
- `position`
- `rotation`
- `size`
- `role`
- `type`
- `sections`
- `renderIntent`

### CityScreenSocket

- `id`
- `surfaceId`
- `position`
- `rotation`
- `frameSize`
- `kind`
- `sections`
- `renderIntent`

### CityScreenAssignment

- `id`
- `companyId`
- `socketId`
- `label`
- `subtitle`
- `tier`
- `sections`
- `renderIntent`

Assessment:

- `CityScreenSurface` is the best first overlap-diagnostic host.
- `CityScreenSocket` is useful context but is narrower and more presentation-oriented.
- `CityScreenAssignment` is too content-specific for the first same-family geometry seam.

## Existing Bounds Helper Audit

Reviewed file:

- `src/modules/expo/runtime/planning/screens/screenSurfaceBoundsDiagnostics.ts`

Confirmed:

- helper input is narrow and geometry-only
- helper uses `id`, `position`, `rotation`, `size`
- helper is pure/read-only
- helper is diagnostic-only
- helper is not an active gate

Decision:

- overlap logic should live in a separate helper
- overlap codes should stay separate from missing/invalid bounds codes

Reason:

- keeps the Phase 155 bounds seam stable
- avoids mixing data-quality diagnostics with geometry-conflict diagnostics
- matches existing diagnostic decomposition patterns such as `screenOrientationDiagnostics`

## Overlap Model Feasibility

### A. Conservative X/Z AABB overlap

Pros:

- simplest
- pure/read-only
- fixture-friendly
- uses already available `position` and `size`

Cons:

- can be noisy if intentional stacking exists

Assessment:

- strongest first-slice candidate

### B. Oriented rectangle projection

Pros:

- more accurate

Cons:

- higher code complexity
- more edge-case risk
- unnecessary before proving raw AABB value

Assessment:

- premature for first slice

### C. Radius/circle approximation

Pros:

- simple

Cons:

- too coarse
- high false-positive risk relative to rectangular screen shapes

Assessment:

- not recommended

### D. Tier/kind/section-filtered AABB

Pros:

- can reduce false positives if raw overlap is noisy

Cons:

- adds policy decisions earlier than necessary

Assessment:

- useful fallback if raw AABB is noisy

### E. Assignment/socket overlap only

Pros:

- narrower to interactive content

Cons:

- misses raw surface conflicts
- less directly aligned with current bounds helper seam

Assessment:

- not the best first same-family geometry slice

## Intentional Overlap / Stacking Audit

Reviewed files:

- `src/modules/expo/lib/sponsorScreenLayout.ts`
- `src/modules/expo/runtime/planning/world-plan/buildCanonicalWorldPlan.ts`

Potential noise sources considered:

- facade clusters
- decorative shell + content layering
- nearby tier groupings
- surface/socket/assignment stacked composition

Important observation:

- the first overlap slice should stay on `CityScreenSurface` only
- it should not compare sockets or assignments against surfaces
- it should not treat intentional assignment-on-socket composition as overlap

Read-only scan evidence showed no raw AABB overlap pairs in the canonical fallback plan, which strongly suggests that a raw `CityScreenSurface` AABB helper is currently low-noise.

## Real-Data Scan Feasibility / Results

Read-only scan source:

- `buildProductionSafeFallbackScene()`
- `buildExpoWorldContract(scene)`
- `buildCanonicalWorldPlan(...)`

Reported counts:

- `screenSurfaceCount: 24`
- `rawOverlapPairs: 0`
- `sectionFilteredOverlapPairs: 0`
- `sameRoleOverlapPairs: 0`
- `sameTypeOverlapPairs: 0`

Interpretation:

- raw AABB overlap is currently non-noisy on canonical fallback data
- section filtering is not required for the first implementation slice
- the overlap helper can stay minimal and same-family

## Candidate Diagnostic Scope Options

### A. SCREEN-SCREEN AABB OVERLAP DIAGNOSTIC FIRST SLICE

- pure helper for conservative X/Z AABB overlap among `CityScreenSurface`
- one narrow seam
- diagnostic-only
- no active gate

### B. SECTION-FILTERED SCREEN OVERLAP DIAGNOSTIC FIRST SLICE

- only warn when overlapping surfaces also share section or type/role
- useful only if raw AABB is noisy

### C. ASSIGNMENT-SOCKET OVERLAP DIAGNOSTIC FIRST SLICE

- focuses on content placement instead of raw screen surfaces
- narrower but less aligned with current geometry helper seam

### D. SCREEN OVERLAP REVIEW DEFER WITH EXACT BLOCKER

- not needed
- current metadata and scan evidence are sufficient

### E. SCREEN-BOOTH PROXIMITY REVIEW NEXT

- still valuable later
- broader cross-family reasoning than needed now

## Risk Classification

### SCREEN-SCREEN AABB OVERLAP DIAGNOSTIC FIRST SLICE

- risk: low/medium
- value: high
- false-positive risk: low on current fallback evidence
- one seam: yes
- diagnostic-only: yes
- avoids redesign: yes
- expected tests: fixture-only helper tests

### SECTION-FILTERED SCREEN OVERLAP DIAGNOSTIC FIRST SLICE

- risk: medium
- value: medium/high
- false-positive risk: very low
- downside: extra policy complexity

### ASSIGNMENT-SOCKET OVERLAP DIAGNOSTIC FIRST SLICE

- risk: medium
- value: medium
- downside: weaker alignment with existing bounds seam

### SCREEN-BOOTH PROXIMITY REVIEW NEXT

- risk: medium
- value: high
- downside: cross-family geometry reasoning is broader

## Selected Decision

- `SCREEN-SCREEN AABB OVERLAP DIAGNOSTIC FIRST SLICE`

## Selection Rationale

This is the smallest next diagnostic seam with:

- clear metadata
- no runtime coupling
- no active gate requirement
- low current false-positive evidence

It also follows directly from Phase 155:

- bounds validity first
- same-family overlap second
- cross-family proximity later

## Files Likely Affected Next Phase

- `src/modules/expo/runtime/planning/screens/screenSurfaceBoundsDiagnostics.ts` as adjacent context only
- one new helper near `src/modules/expo/runtime/planning/screens/**`
- one new test near `src/modules/expo/__tests__/**`
- optionally `src/modules/expo/runtime/planning/legacy/worldCityGeometry.ts` for type import context only

## Files Explicitly Out Of Scope Next Phase

- `src/modules/expo/runtime/world/WorldCityScreenAssignments.tsx`
- `src/modules/expo/runtime/world/WorldCityScreenSurfaces.tsx`
- `src/modules/expo/lib/sponsorScreenInteractionResolver.ts`
- `src/shared/expo/worldContract.ts`
- `src/App.tsx`
- route/action metadata
- click/cursor/highlight behavior
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
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.controller.test.ts`

## Remaining Risks

- conservative same-family overlap helper is not implemented yet
- cross-family screen-booth proximity is still uncovered
- diagnostics are still not active planning/test gates
- broader 2D surface bounds model remains separate future work

## Next-Cycle Recommendation

Next phase:

- `SCREEN-SCREEN AABB OVERLAP DIAGNOSTIC FIRST SLICE`

Recommended scope:

- add one pure helper
- use `CityScreenSurface`-like geometry input only
- do conservative X/Z AABB overlap checks
- keep it diagnostic-only
- keep it out of runtime and planning active gates
