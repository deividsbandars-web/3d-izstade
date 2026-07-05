# Lint Warning Cleanup Report

## Summary

The remaining pre-existing lint warnings have been removed without changing sponsor media review behavior.

## What Changed

- Removed stale `eslint-disable` comments from the signaling path handlers under `deployment/signaling/src/paths/*`.
- Applied the same cleanup to the mirrored staged copies under `handoff/.context-lite-stage/deployment/signaling/src/paths/*`.
- Wrapped the operator snapshot helpers in `useCallback` in `src/modules/expo/runtime/operator/state/useExpoOperatorState.ts` so the existing effect/callback dependencies are stable.
- Applied the same operator-state hook cleanup to the mirrored staged copy under `handoff/.context-lite-stage/src/modules/expo/runtime/operator/state/useExpoOperatorState.ts`.
- Stabilized `Dashboard` project loading with `useCallback` in `src/ui/Dashboard.tsx` so the effect depends on a memoized fetch function instead of a re-created closure.

## Result

- `npm.cmd run lint` now passes with zero warnings.
- `npm.cmd run build` passes.
- `doppler.exe run -- node scripts/smoke-backend-supabase.mjs` passes.
- Sponsor media review closeout status remains unchanged.
- `/api/expo/scene` contract remains unchanged.

## Notes

- No production data was touched.
- No auth, storage, media promotion, or scene API behavior was changed.
- The cleanup was limited to the exact files that produced the warnings.
