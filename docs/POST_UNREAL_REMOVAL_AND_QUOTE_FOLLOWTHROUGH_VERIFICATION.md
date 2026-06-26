# Post Unreal Removal And Quote Follow-Through Verification

Date: `2026-06-20`

## Verdict

PASS WITH ONE PENDING BROWSER-ADMIN CHECK

## 1. PixelStreaming Source File

`src/modules/expo/PixelStreamingViewer.tsx` is deleted from the working tree.

## 2. PixelStreaming Dependency

The unused PixelStreaming frontend packages were removed from the active package manifests:

- `@epicgames-ps/lib-pixelstreamingfrontend-ue5.7`
- `@epicgames-ps/lib-pixelstreamingfrontend-ui-ue5.7`

The lockfile was updated to remove the corresponding package entries.

## 3. Remaining Unreal / PixelStreaming / Streaming Hits

Remaining hits are legacy/internal or docs/history only.

### Legacy internal only

- `backend-server/services/pixelStreamingStatus.ts`
- `backend-server/services/pixelStreamingSessionBroker.ts`
- `backend-server/controllers/expoController.ts` legacy status path
- `src/backend/expo/streaming/*`
- `src/modules/expo/services/pixelStreamingConfig.ts`
- `src/modules/expo/hooks/usePixelStreamingStatus.ts`
- `scripts/pixel-streaming-smoke-check.mjs`
- `backend-server/__tests__/pixelStreaming*.test.ts`
- `src/modules/expo/__tests__/pixelStreaming*.test.ts`

These are not part of the public MVP story and were not expanded in this task.

### Docs / history only

- `docs/UNREAL_PIXEL_STREAMING_ACTIVE_MVP_REMOVAL_REPORT.md`
- `docs/PRODUCT_REALITY_ALIGNMENT_AND_NAVIGATION_FIX_REPORT.md`
- `docs/MVP_PRODUCT_EXPERIENCE_AND_VISUAL_QA_AUDIT.md`
- other archived Unreal planning or recovery docs

### Package dependency cleanup

- done

## 4. Live Route Results

Local preview route probes returned `200` for:

- `/expo-3d`
- `/expo/booth/sponsor-concierge`
- `/expo/booth/sponsor-concierge/stream`
- `/modular-homes/studio`
- `/modular-homes/quotes`
- `/expo/admin`

Live staging route probes returned `200` for the same public routes.

Behavior verified:

- `/expo/booth/sponsor-concierge` is a booth profile page
- `/expo/booth/sponsor-concierge/stream` redirects to the booth profile
- `/expo-3d` exposes modular homes clearly
- no active route showed Unreal / Pixel Streaming / degraded user copy in the probe path

## 5. Modular-Home Backend Status

The staging quote/admin smoke now passes end-to-end.

Verified outcomes:

- `POST /api/modular-home/quote?homeQuoteBackend=1` returns `201`
- protected quote list/detail/status/export routes return `200` for admin
- public and non-admin guards still return `401`/`403`
- smoke cleanup succeeds on the disposable quote row

Scene contract verification:

- `/api/expo/scene` returned `200`
- `/api/expo/scene` did not include `expo_review_media`
- auth policy remains `public-readonly`

## 6. Modular-Home Browser Status

Public browser checks were validated.

Admin browser validation for `/modular-homes/quotes` is pending because no safe outside-repo storage-state was available in this shell.

## 7. Updated Product Story

- expo city
- booth profiles
- modular-home preset studio
- quote follow-through
- admin booth / quote tools where available

## 8. Do Not Claim

- no Unreal
- no Pixel Streaming
- no live booth room
- no full detail-level configurator

## Validation

Commands run:

- `npm.cmd run build`
- `npm.cmd run lint`
- `powershell.exe -ExecutionPolicy Bypass -File scripts/run-with-doppler.ps1 run -- npx.cmd supabase db push --linked`
- `powershell.exe -ExecutionPolicy Bypass -File scripts/run-with-doppler.ps1 run -- npx.cmd supabase migration list --linked`
- `powershell.exe -ExecutionPolicy Bypass -File scripts/run-with-doppler.ps1 run -- node scripts/smoke-backend-supabase.mjs`
- `powershell.exe -ExecutionPolicy Bypass -File scripts/run-with-doppler.ps1 run -- node scripts/check-modular-home-quote-staging.mjs --json`
- `curl.exe -sS -D - -o NUL http://127.0.0.1:4174/expo-3d`
- `curl.exe -sS -D - -o NUL http://127.0.0.1:4174/expo/booth/sponsor-concierge`
- `curl.exe -sS -D - -o NUL http://127.0.0.1:4174/expo/booth/sponsor-concierge/stream`
- `curl.exe -sS -D - -o NUL http://127.0.0.1:4174/modular-homes/studio`
- `curl.exe -sS -D - -o NUL http://127.0.0.1:4174/modular-homes/quotes`
- `curl.exe -sS -D - -o NUL http://127.0.0.1:4174/expo/admin`
- `curl.exe -sS -D - -o NUL https://staging.30sek24.com/expo-3d`
- `curl.exe -sS -D - -o NUL https://staging.30sek24.com/expo/booth/sponsor-concierge`
- `curl.exe -sS -D - -o NUL https://staging.30sek24.com/expo/booth/sponsor-concierge/stream`
- `curl.exe -sS -D - -o NUL https://staging.30sek24.com/modular-homes/studio`
- `curl.exe -sS -D - -o NUL https://staging.30sek24.com/modular-homes/quotes`
- `curl.exe -sS -D - -o NUL https://staging.30sek24.com/expo/admin`
- `Invoke-WebRequest -UseBasicParsing https://api-staging.30sek24.com/api/expo/scene`

