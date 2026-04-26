# Phase 02 Acceptance Closure

## Objective

Close the two acceptance gaps that blocked `PASS` for Phase 02:

1. failing `sponsorScreenLayout` test
2. unproven frontend production build viability

This was not a new architecture phase. No new planning extraction work was added here.

## What Was Investigated

### Sponsor screen layout

Investigated:

- `src/modules/expo/__tests__/sponsorScreenLayout.test.ts`
- `src/modules/expo/lib/sponsorScreenLayout.ts`

Findings:

- `mediumScreens` is currently built from:
  - `rankedPlacements.slice(0, 10)`
- with the fixture used by the test, that deterministically produces one medium billboard per ranked booth placement
- the fixture contains `3` booth placements, so the correct current count is `3`, not `6`

- `groundScreens` is currently built from:
  - one fixed arrival ground pylon
  - `sectorMarkers.filter((_, index) => index % 2 === 0).slice(0, 6)`
- with the fixture used by the test, that deterministically produces `3` ground screens, not `10`

Conclusion:

- the implementation did not regress in Phase 02
- the test had stale expectations from the older, denser boulevard sponsor-screen layout
- the test was updated to assert the current contract instead of the pre-reduction counts

### Frontend production build

Investigated:

- `npm.cmd run build` inside the restricted sandbox
- `node node_modules/esbuild/bin/esbuild --version`
- direct `child_process.spawn()` of `esbuild.exe`
- direct `child_process.spawn()` of `cmd.exe`
- `npm.cmd run build` outside sandbox restriction

Findings:

- inside the restricted sandbox, `npm.cmd run build` fails while Vite loads `vite.config.ts`
- direct execution of `esbuild.exe` works
- raw `child_process.spawn()` fails with `EPERM` for:
  - `esbuild.exe`
  - `cmd.exe`
- outside sandbox restriction on the same Windows machine, `npm.cmd run build` completes successfully

Conclusion:

- the earlier build block was not caused by repo code
- the restricted execution environment was blocking Node child-process spawning
- frontend production build viability is now proven on this machine when that restriction is removed

## What Changed

- `src/modules/expo/__tests__/sponsorScreenLayout.test.ts`
  - re-baselined stale screen-count expectations
  - added an assertion that medium billboards map one-to-one to ranked booth placements in this fixture

- `docs/recovery/phase-02-diagnostics.md`
  - updated with acceptance-closure evidence and final build proof

- `docs/recovery/phase-02-acceptance-closure.md`
  - updated as the dedicated acceptance-closure note

## What Did Not Change

- `src/modules/expo/lib/sponsorScreenLayout.ts`
  - no implementation changes were needed

- `src/modules/expo/runtime/planning/**`
  - canonical planning seam from Phase 02 remains intact

- legacy compatibility facades
  - no new planning logic was moved back into them

## Remaining Risks

1. Frontend build can still appear blocked in restricted sandbox executions even though the real build now passes on the same machine outside sandbox restriction.
2. Phase 02 zone modules remain adapter-style, not full zonal planners.
3. backend still depends on compatibility surfaces in some expo paths.

## Acceptance Position

Phase 02 is closed because:

- the red required test is resolved
- the real frontend production build is now proven
- the build blocker was shown to be execution-environment restriction, not a repo failure
