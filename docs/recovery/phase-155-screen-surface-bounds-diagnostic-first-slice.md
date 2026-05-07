# Phase 155: Screen Surface Bounds Diagnostic First Slice

Status: PASS

Goal:
- Add a narrow, pure diagnostic helper for screen surface missing/invalid bounds and broad out-of-bounds checks.
- Keep the seam diagnostic-only.
- Avoid overlap math, movement, and active gate integration.

Implementation summary:
- Added pure helper:
  - `src/modules/expo/runtime/planning/screens/screenSurfaceBoundsDiagnostics.ts`
- Added fixture-only test:
  - `src/modules/expo/__tests__/screenSurfaceBoundsDiagnostics.test.ts`
- No runtime render paths were changed.
- No planning mutation paths were changed.

Helper design:
- Input is a narrow screen-surface shape:
  - `id`
  - `position`
  - `rotation`
  - `size`
- Output is an array of diagnostic records.
- The helper is read-only and does not mutate input.
- The helper does not import React and does not perform object fixes.

Bounds model assumptions:
- Uses a conservative X/Z envelope only.
- Uses center + half-size logic from `position` and `size`.
- Does not perform oriented rectangle math.
- Does not perform screen-screen overlap checks.
- Does not perform screen-booth proximity checks.
- Default broad envelope:
  - `minX: -2600`
  - `maxX: 2600`
  - `minZ: -7600`
  - `maxZ: 800`
- This envelope is intentionally broad to avoid noisy false positives.

Diagnostic codes:
- `missing-position`
- `non-finite-position`
- `missing-size`
- `non-finite-size`
- `non-positive-size`
- `missing-rotation`
- `non-finite-rotation`
- `out-of-bounds-xz`

Post-change audit:
- Helper is only used by its test and one-off scan.
- No build or planning mutation path was changed.
- No runtime screen rendering behavior was changed.
- Sponsor screen click/cursor/highlight behavior remains unchanged.
- No `worldContract` changes were introduced.
