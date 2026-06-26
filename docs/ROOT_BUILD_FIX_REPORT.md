# Root Build Fix Report

## Scope

- Date: `2026-06-17`
- Goal: restore root `npm run build`
- Change type: documentation-only closeout

## Root Cause

The previously reported root build failure did not reproduce when rerun in isolation from the repo root:

- `npm run build` passed
- no invalid `index.html` emit path was reproduced

Inspected build surfaces:

- `vite.config.ts`
- `package.json`
- `index.html`
- Vite PWA configuration
- Rollup output chunk configuration
- repo search for custom emit hooks such as `emitFile`, `generateBundle`, `writeBundle`, `fileName`, and alternative `vite.config.*`

Findings:

- no custom plugin or local build hook was found that emits `index.html` with a relative path
- no custom `root`, `outDir`, `publicDir`, or `base` override was found in `vite.config.ts`
- the current root build config is minimal and valid
- the failure appears to have been transient or execution-context-specific rather than a stable repo configuration defect

Most likely explanation from current evidence:

- the earlier failure was caused by the prior validation execution context, not by a persistent canonical frontend config problem in the repo

## Files Changed

- `docs/ROOT_BUILD_FIX_REPORT.md`
- `FILES_CHANGED.txt`
- `CHANGELOG.md`
- `VALIDATION.md`

## Validation Commands

1. `npm run build`
2. `npm run lint`
3. `doppler run -- node scripts/smoke-backend-supabase.mjs`

Backend build was not rerun in this task because no backend files were changed.

## Validation Results

### Root Build

- Status: passed
- Result:
  - `dist/index.html` emitted correctly
  - PWA files generated correctly

### Lint

- Status: passed with warnings only

### Backend Smoke

- Status: passed
- Result:
  - `/health -> 200`
  - `/api/expo/scene -> 200`
  - `authPolicy -> public-readonly`
  - `sectors -> 3`
  - `companies -> 3`
  - `booths -> 3`

## Remaining Warnings

- Vite still reports large chunk-size warnings for heavy bundles such as `Expo3D` and `three-vendor`
- ESLint warnings remain in:
  - `deployment/signaling/...`
  - `src/modules/expo/runtime/operator/state/useExpoOperatorState.ts`
  - `src/ui/Dashboard.tsx`

## Deployment

- No deployment was performed.
- No env values or secrets were changed.
- No migration was created or run.
