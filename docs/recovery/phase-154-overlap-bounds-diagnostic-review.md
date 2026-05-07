# Phase 154: Overlap/Bounds Diagnostic Review

Status: PASS

Goal:
- Audit the next diagnostic seam for screen/booth/2D surface overlap and out-of-bounds risk.
- Select the smallest safe diagnostic-first implementation slice.
- Avoid object movement, layout redesign, and active gate integration.

Summary:
- The cleanest next metadata seam is still the screen surface layer.
- Screen surfaces, screen sockets, and booth placements already expose complete position/rotation/size bounds fields in the canonical world plan.
- The safest first diagnostic slice is broad screen-surface bounds validation, not overlap math between multiple families yet.
- Selected next target: `SCREEN SURFACE BOUNDS DIAGNOSTIC FIRST SLICE`.

Placement metadata inventory:
- Sponsor screens / screen surfaces:
  - `CityScreenSurface`
  - fields available:
    - `id`
    - `position`
    - `rotation`
    - `size`
    - `role`
    - `type`
    - `sections`
    - `renderIntent`
  - source chain:
    - `buildSponsorScreenLayout.ts`
    - `buildCanonicalWorldPlan.ts`
    - `WorldCityScreenSurfaces.tsx`
- Screen assignments:
  - `CityScreenAssignment`
  - fields available:
    - `id`
    - `companyId`
    - `socketId`
    - `label`
    - `subtitle`
    - `tier`
    - `sections`
    - `renderIntent`
  - socket transform comes from `CityScreenSocket`
- Screen sockets:
  - `CityScreenSocket`
  - fields available:
    - `id`
    - `surfaceId`
    - `position`
    - `rotation`
    - `frameSize`
    - `kind`
    - `sections`
    - `renderIntent`
- Booths:
  - `ExpoBoothPlacement`
  - fields available:
    - `id`
    - `position`
    - `rotation`
    - `nodeType`
    - `layoutFootprint`
    - `sectorId`
    - `sectorName`
    - `clusterIndex`
- Booth feature panels:
  - local offsets exist inside `BoothFeatureContent.tsx`
  - panel stack dimensions are partly inferable from hardcoded geometry
  - bounds are more content/composition-driven than screen surfaces

Existing diagnostics audit:
- `screenOrientationDiagnostics.ts`
  - covers missing yaw, missing sections, viewer-facing conflicts
- `boothFrontalityDiagnostics.ts`
  - covers missing rotation/nodeType and left/right facing conflicts
- `sceneDataSource.ts`
  - reports booth placement rejection diagnostics in dev
- `boulevardLayout.ts`
  - already validates:
    - `slot-missing`
    - `inside-stadium-reserve`
    - `inside-blocked-geometry-pocket`
    - `outside-approved-lane-envelope`
- Not covered yet:
  - missing/invalid screen surface bounds
  - broad screen surface out-of-bounds after canonical filtering
  - conservative screen-screen overlap
  - screen-booth proximity
  - booth feature stack overflow

Bounds model feasibility:
- 2D AABB in X/Z only:
  - required metadata: position + size
  - easiest to fixture test
  - lowest implementation cost
  - good first bounds/out-of-bounds slice
- Oriented rectangle in X/Z:
  - required metadata: position + size + rotation
  - more precise
  - higher false-positive reduction
  - more code and more risk for first slice
- Radius/circle approximation:
  - required metadata: position + size
  - simple
  - too coarse for overlap-first work
- Lane envelope / approved region check:
  - strongest for sponsor booth placements already
  - less direct for screen surface families without a unified envelope helper
- Screen footprint vs booth footprint:
  - feasible later
  - needs clearer cross-family comparison rules

Candidate overlap classes:
- A. screen-surface out-of-bounds
  - best metadata completeness
  - most conservative first seam
- B. screen-screen overlap
  - feasible, but overlap math introduces more false-positive risk than broad bounds checks
- C. screen-booth proximity/overlap
  - potentially valuable, but cross-family safety rules are less explicit
- D. assignment-socket mismatch
  - metadata is strong, but this is a narrower structural consistency seam than a bounds seam
- E. booth feature stack overflow
  - render-local and harder to express cleanly as a generic world diagnostic
- F. general 2D surface duplicate/invalid bounds
  - attractive long-term, but broader than needed for next slice

Risk classification:
- Screen surface bounds:
  - risk: low
  - value: high
  - pure/read-only: yes
  - fixture-testable: yes
  - movement required: no
- Screen-screen overlap:
  - risk: medium
  - value: high
  - pure/read-only: yes
  - fixture-testable: yes
  - movement required: no
- Screen-booth proximity:
  - risk: medium
  - value: high
  - pure/read-only: yes
  - fixture-testable: yes
  - movement required: no
- Booth feature stack overflow:
  - risk: medium
  - value: medium
  - pure/read-only: possible
  - fixture-testable: less clean
  - movement required: no

Real-data scan:
- Safe one-off scan was feasible using:
  - `buildProductionSafeFallbackScene()`
  - `buildExpoWorldContract(scene)`
  - `buildCanonicalWorldPlan(...)`
- Result:
  - screen surfaces: `24`
  - screen assignments: `24`
  - screen sockets: `24`
  - booth placements: `3`
  - missing surface bounds: `0`
  - missing socket bounds: `0`
  - missing booth bounds: `0`
- This is enough evidence for a bounds-first diagnostic slice.

Candidate implementation slices:
- `SCREEN SURFACE BOUNDS DIAGNOSTIC FIRST SLICE`
  - files likely affected:
    - `src/modules/expo/runtime/planning/screens/**`
    - one new pure helper
    - one fixture test
  - risk: low
  - value: high
  - one seam: yes
  - diagnostic-only: yes
  - avoids redesign: yes
- `SCREEN-SCREEN OVERLAP DIAGNOSTIC FIRST SLICE`
  - files likely affected:
    - screen planning helper/test seam
  - risk: medium
  - value: high
  - one seam: yes
  - diagnostic-only: yes
  - avoids redesign: yes
- `SCREEN-BOOTH PROXIMITY DIAGNOSTIC FIRST SLICE`
  - files likely affected:
    - screen + booth planning helper/test seam
  - risk: medium
  - value: high
  - one seam: yes
  - diagnostic-only: yes
  - avoids redesign: yes
- `2D SURFACE BOUNDS DIAGNOSTIC FIRST SLICE`
  - files likely affected:
    - broader shared helper
  - risk: medium
  - value: medium/high
  - broader than needed for next slice

Selected decision:
- SCREEN SURFACE BOUNDS DIAGNOSTIC FIRST SLICE

Selection rationale:
- It has the clearest metadata and the lowest false-positive risk.
- It stays closest to the already-proven screen diagnostic pattern.
- It does not require cross-family overlap math in the first step.
- It is the cleanest way to extend Web3D safety after sponsor-screen interactivity.
