## World Freeze Policy

This policy starts after the accepted world checkpoint below and remains active for all booth-focused work.

### Frozen world checkpoint

- Checkpoint branch: `work/world-perimeter-connector-cleanup`
- Checkpoint commit: `993bcb99567bb0730e353f2033da39618d086b01`
- Checkpoint meaning:
  - world recovery baseline restored
  - reserve contract made real
  - source-owner cleanup completed across skeleton, masses, towers, mega landmarks, and rear campus
  - visible ground hierarchy documented
  - plane roles moved to source-owned metadata
  - rear-campus perimeter connectors moved to source layout ownership

### Booth-branch forbidden edit areas

Booth branches must not modify any of the following world-owner files:

- `src/modules/expo/runtime/world/WorldCitySkeletonLayout.ts`
- `src/modules/expo/runtime/world/WorldCitySkeleton.tsx`
- `src/modules/expo/runtime/world/WorldCityMasses.tsx`
- `src/modules/expo/runtime/world/WorldCityTowers.tsx`
- `src/modules/expo/runtime/world/WorldCityMegaLandmarks.tsx`
- `src/modules/expo/runtime/world/ExpoRearCampus.tsx`
- `src/modules/expo/runtime/world/ExpoRearCampusLayout.ts`
- `src/modules/expo/runtime/world/WorldGroundPlane.tsx`
- `src/modules/expo/runtime/world/WorldCityPlanes.tsx`
- `src/modules/expo/runtime/world/WorldPromenade.tsx`

### Allowed booth-branch areas

Booth work must stay inside booth/layout/runtime presentation scope, such as:

- `src/modules/expo/lib/boulevardLayout.ts`
- `src/modules/expo/layout-engine.ts`
- `src/modules/expo/runtime/booths/`
- `src/modules/expo/components/BoothArchitectureKit.tsx`
- booth-specific docs and diagnostics

### Rule for discovered world defects during booth work

If booth work uncovers a world defect:

1. Do not patch world geometry inside the booth branch.
2. Record the defect with:
   - affected zone
   - screenshot or inspect IDs
   - suspected owner file
3. Open a separate world task and branch from the latest accepted world checkpoint.

### Merge discipline after freeze

- Booth branches must be reviewed against this policy before merge.
- Any branch that edits both booth files and frozen world files fails scope discipline.
- New world work must start from the latest accepted world checkpoint branch, not from an ad hoc booth worktree.
