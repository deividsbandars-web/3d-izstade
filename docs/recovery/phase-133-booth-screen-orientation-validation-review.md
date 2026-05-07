## Phase 133 - Booth/Screen Orientation Validation Review

Status: PASS

Decision:
- screen orientation diagnostic next

Summary:
- Booth rotation and frontage are already authored in the curated boulevard slot bank.
- Screen surface and socket rotation are already authored/generated in planning data.
- Zone-level `viewerFacing` metadata exists, but there is no narrow validator that proves actual screen yaw matches zone-facing intent.
- Existing placement diagnostics focus on slot rejection and landmark clearance, not screen/booth orientation correctness.

Key findings:
- Booth rotation enters runtime through `src/shared/expo/lib/boulevardLayout.ts` curated slot `rotationY` and is carried into `ExpoBoothPlacement.rotation`.
- Runtime booth renderers such as `DistrictBooth.tsx` apply `placement.rotation` directly to the booth group.
- Screen rotations are assigned in:
  - `src/modules/expo/lib/sponsorScreenLayout.ts`
  - `src/modules/expo/runtime/planning/screens/buildScreenSurfacePlan.ts`
  - legacy screen helpers used by screen surface/socket planners
- Zone planning already defines `viewerFacing` in `src/modules/expo/runtime/planning/zones/shared.ts`, but that metadata is not asserted against final surface rotation.
- Existing validation seams:
  - `sceneDataSource.ts` reports booth placement rejection diagnostics only
  - `districtLandmarkPlan.ts` validates corridor intrusion and proximity to booths
  - `expoScene` backend route/controller tests do not cover orientation

Risk call:
- Screen orientation gap is medium risk.
- Booth frontality gap is lower risk because booth yaw is more explicitly authored in the curated slot bank.
- Combined booth+screen validator would be broader than necessary for the next step.

Next recommendation:
- Phase 134: SCREEN ORIENTATION DIAGNOSTIC FIRST SLICE

