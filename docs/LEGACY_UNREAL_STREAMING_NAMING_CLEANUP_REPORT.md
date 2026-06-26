# Legacy Unreal Streaming Naming Cleanup Report

Date: `2026-06-20`

## Summary

This round removed or renamed misleading Unreal / Pixel Streaming labels from the active developer-facing MVP script and doc surface without changing product behavior.

The active MVP remains the same:

- expo city navigation
- booth profiles and sponsor/contact actions
- modular-home preset studio
- quote follow-through where available
- optional legacy runtime support kept internal

## What Was Renamed Or Removed

Renamed root script aliases in [`package.json`](../package.json):

- `check:pixel-streaming` -> `check:expo:legacy-runtime`
- `import:unreal:sponsor-product` -> `import:legacy:sponsor-product`
- `polish:unreal:booth-showroom` -> `polish:legacy:booth-showroom`
- `start:expo:stack` -> `start:expo:legacy-runtime-stack`
- `start:expo:unreal` -> `start:expo:legacy-runtime`

Softened active operator doc language:

- [`docs/MVP_DEMO_SAFE_SCRIPT.md`](../docs/MVP_DEMO_SAFE_SCRIPT.md)
- [`docs/release/WEB3D_EXPO_RELEASE_OPERATIONS.md`](../docs/release/WEB3D_EXPO_RELEASE_OPERATIONS.md)
- [`docs/release/WEB3D_EXPO_DEPLOYMENT_CONTRACT.md`](../docs/release/WEB3D_EXPO_DEPLOYMENT_CONTRACT.md)
- [`docs/release/ENVIRONMENT_MATRIX.md`](../docs/release/ENVIRONMENT_MATRIX.md)

Updated visible runtime script output to say legacy runtime / legacy streamer instead of Unreal / Pixel Streaming in:

- [`scripts/check-staging-readiness.mjs`](../scripts/check-staging-readiness.mjs)
- [`scripts/pixel-streaming-smoke-check.mjs`](../scripts/pixel-streaming-smoke-check.mjs)
- [`scripts/start-expo-pixel-streaming-stack.ps1`](../scripts/start-expo-pixel-streaming-stack.ps1)
- [`scripts/check-warpala-commercial-demo.ps1`](../scripts/check-warpala-commercial-demo.ps1)
- [`scripts/start-warpala-commercial-demo.ps1`](../scripts/start-warpala-commercial-demo.ps1)

## What Remains And Why

These remain in the repo as legacy/internal support or historical evidence:

- backend signaling and TURN infrastructure
- backend Pixel Streaming service code
- legacy Unreal helper scripts under `scripts/`
- historical audit / feasibility / recovery docs

They were not removed because this task was limited to developer-facing naming hygiene, not backend infrastructure deletion.

## Active MVP Instruction Check

The active MVP docs now describe the product around:

- expo city
- booth profile
- modular-home preset studio
- quote / contact flow
- optional legacy runtime support

They no longer frame Unreal or Pixel Streaming as the baseline MVP path.

## Historical Docs

Historical reports and feasibility docs were preserved. The cleanup only changed the active operator-facing wording and root script labels.

## Behavior Check

No product behavior changed in this task.

Validation completed after the cleanup:

- `npm.cmd run build`
- `npm.cmd run lint`
- `& 'C:\\Users\\esauk\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Doppler.doppler_Microsoft.Winget.Source_8wekyb3d8bbwe\\doppler.exe' run -- node scripts/smoke-backend-supabase.mjs`
- `npm.cmd run check:expo:legacy-runtime -- --mode baseline` with `PIXEL_STREAMING_STATUS_URL=https://api-staging.30sek24.com/api/pixel-streaming/status`

One wrapper check was attempted and blocked by this shell's Doppler/network constraints:

- `npm.cmd run check:staging-readiness -- --skip-publication-smoke --skip-supabase-dry-run --json`

That wrapper failure did not indicate a product regression.
