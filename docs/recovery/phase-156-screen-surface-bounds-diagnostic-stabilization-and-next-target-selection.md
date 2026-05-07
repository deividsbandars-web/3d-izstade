# Phase 156: Screen Surface Bounds Diagnostic Stabilization And Next Target Selection

Status: PASS

Goal:
- Confirm that the Phase 155 screen surface bounds helper is stable and non-noisy.
- Confirm that it is not wired as an active gate.
- Select the next Web3D quality/safety target.

Summary:
- `screenSurfaceBoundsDiagnostics.ts` remains pure, narrow, and diagnostic-only.
- The helper is not wired into runtime rendering or canonical planning as an active gate.
- Real-data canonical scan remains clean with zero diagnostics.
- Selected next target: `SCREEN-SCREEN OVERLAP DIAGNOSTIC REVIEW`.

Screen surface bounds stabilization audit:
- Helper accepts only the narrow candidate shape:
  - `id`
  - `position`
  - `rotation`
  - `size`
- Helper does not mutate input.
- Helper does not import React.
- Helper does not fix or move objects.
- Helper does not run in runtime render path.
- Helper does not run in canonical planning path as an active gate.
- `rg` confirms helper usage is currently limited to:
  - the helper file itself
  - the fixture test
  - one-off scan only when manually run
- Broad X/Z envelope remains conservative and documented in helper code.
- No screen placement, size, rotation, or layout changed.

Test coverage confirmation:
- Fixture test still covers:
  - valid surface
  - missing position
  - non-finite position
  - missing size
  - non-finite size
  - non-positive size
  - missing rotation
  - non-finite rotation
  - obvious out-of-bounds
  - pure/read-only behavior

Real-data scan result:
- total screen surfaces: `24`
- diagnostics count: `0`
- codes found: `[]`
- noise level: `none`

Regression check:
- Sponsor screen route click remains unchanged.
- Sponsor screen cursor affordance remains unchanged.
- Sponsor screen hover highlight remains unchanged.
- AI panel still uses the GlobalChat flow.
- Calculator panel still routes to `/calculators`.
- 2D info stand still opens `demo_room` / showroom.
- Backend baseline remains `0/0/0/0`.

Candidate next target comparison:
- `SCREEN-SCREEN OVERLAP DIAGNOSTIC REVIEW`
  - Risk: medium
  - Value: high
  - Best next seam because screen rectangle metadata is now the clearest next geometry surface
- `SCREEN-BOOTH PROXIMITY DIAGNOSTIC REVIEW`
  - Risk: medium
  - Value: high
  - Useful later, but booth footprint/proximity reasoning is less direct than screen-to-screen geometry
- `SCREEN/BOOTH DIAGNOSTIC INTEGRATION REVIEW`
  - Risk: low/medium
  - Value: high
  - Hardening target, but geometry safety still has a clearer next seam first
- `2D SURFACE BOUNDS DIAGNOSTIC REVIEW`
  - Risk: medium/high
  - Value: medium/high
  - Broader than needed for the next step
- `STABILIZATION HOLD`
  - Not needed

Selected decision:
- SCREEN-SCREEN OVERLAP DIAGNOSTIC REVIEW

Selection rationale:
- Screen metadata is already explicit enough to attempt conservative same-family overlap reasoning next.
- It is a smaller and cleaner follow-up than cross-family screen-booth proximity.
- It extends the diagnostic ladder without introducing object movement, active gating, or broad redesign.
