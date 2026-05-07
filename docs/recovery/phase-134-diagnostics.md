## Phase 134 Diagnostics

Changed files:
- `src/modules/expo/runtime/planning/screens/screenOrientationDiagnostics.ts`
- `src/modules/expo/__tests__/screenOrientationDiagnostics.test.ts`

Diagnostic helper design:
- input:
  - final planned `CityScreenSurface[]`
- output:
  - `ScreenOrientationDiagnostic[]`
- categories:
  - `missing-rotation`
  - `missing-section-metadata`
  - `viewer-facing-conflict`

Why `sections` metadata is the primary anchor:
- some left/right district media wall surfaces physically sit far enough from center that `classifyPlanningZone(position)` alone would classify them as `tower-cluster`
- planning already preserves `sections: ['left' | 'right' | 'arrival' | 'middle']`
- for left/right district orientation checks, `sections` is the safer authored intent anchor

Conservative orientation rules implemented:
- `sections.includes('left')`
  - expect non-negative yaw within tolerance
- `sections.includes('right')`
  - expect non-positive yaw within tolerance
- all other zones
  - no coarse yaw contradiction asserted yet

Diagnostics intentionally not produced:
- no center-spine yaw assertions
- no tower-cluster yaw assertions
- no rear-campus event-facing yaw assertions
- no socket-vs-surface mismatch warnings yet
- no object movement recommendations

Test coverage added:
- valid left surface does not warn
- valid right surface does not warn
- left-facing contradiction warns
- missing yaw warns
- missing sections warn

Validation note:
- required project validation remains green
- `npm.cmd run build` and `tsx`-based tests still require outside-sandbox execution because of expected `spawn EPERM`

