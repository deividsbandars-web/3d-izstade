# Browser Runtime Warning Audit And Cleanup Report

## Summary

I reproduced the staging browser/runtime warnings, fixed the ones that were safely attributable to repo code, redeployed the root frontend to staging, and confirmed the live staging browser now only retains the documented Three.js warning as benign upstream runtime noise.

## Reproduced Warnings

Staging diagnose-only QA captured these warnings before the source cleanup:

- `Multiple GoTrueClient instances detected in the same browser context`
- `Error while trying to use the following icon from the Manifest: https://staging.30sek24.com/pwa-192x192.png (Download error or resource isn't a valid image)`
- `THREE.THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.`

## Findings

### PWA Manifest Icon Warning

Classification: `FIXABLE`

Exact source:

- `vite.config.ts:40-60` declared the PWA manifest icons.
- `public/pwa-192x192.png` and `public/pwa-512x512.png` were committed as SVG payloads with `.png` names, so the browser fetched them as PNGs and rejected them as invalid images.

What I changed:

- Replaced `public/pwa-192x192.png` and `public/pwa-512x512.png` with real PNG files.
- Added `public/apple-touch-icon.png` and `public/masked-icon.svg` so the PWA asset set is valid and complete.

Result:

- A local browser pass against the updated source no longer logged the manifest icon warning.
- After the staging redeploy and a cache-warmup rerun, the live staging browser no longer logs the manifest icon warning.

### Multiple GoTrueClient Instances

Classification: `FIXABLE`

Exact source:

- `src/core/supabase.ts:1-8` created a separate browser Supabase client.
- `src/lib/supabaseClient.ts:1-39` also created a browser Supabase client.

What I changed:

- `src/core/supabase.ts` now re-exports the shared `supabaseClient` singleton from `src/lib/supabaseClient.ts` instead of constructing a second client.

Result:

- A local browser pass against the updated source no longer logged the GoTrueClient warning.
- After the staging redeploy and a cache-warmup rerun, the live staging browser no longer logs the GoTrueClient warning.

### THREE.Clock Warning

Classification: `BENIGN / DOCUMENTED`

Exact source:

- The runtime paths that consume the Three.js render-loop clock are:
  - `src/modules/expo/runtime/booths/BoothTextureMaterials.tsx:869-875`
  - `src/modules/expo/runtime/world/scene/ExpoWorldPlayerLayer.tsx:381-406`
- I did not find an app-owned `new THREE.Clock()` call in the repo.
- The warning text matches the upstream Three.js deprecation message surfaced through the installed runtime stack.

Conclusion:

- This warning is non-blocking and should remain documented unless the Three.js / r3f dependency stack is upgraded in a separate task.

## Validation

### Staging Browser QA, Before Cleanup

- `npm.cmd run lint`
- `npm.cmd run build`
- `doppler.exe run -- node scripts/qa-companyadmin-media-review.mjs --json`

Observed warnings on the live staging deployment:

- GoTrueClient warning
- PWA manifest icon warning
- THREE.Clock warning

### Staging Browser QA, After Redeploy

- `npm.cmd run lint`
- `npm.cmd run build`
- `npm.cmd run deploy:staging:preview`
- `npm.cmd run promote:staging -- https://app-staging-83bgpsr99-esaukans-6934s-projects.vercel.app`
- `doppler.exe run -- node scripts/qa-companyadmin-media-review.mjs --json`
- `curl.exe -I https://staging.30sek24.com/pwa-192x192.png`
- `curl.exe -I https://staging.30sek24.com/manifest.webmanifest`

Observed warnings on the live staging deployment:

- First post-promote diagnostic still showed the stale GoTrueClient and PWA warnings once while the edge/browser cache warmed up.
- A follow-up clean diagnostic only showed the documented `THREE.Clock` warning.

### Local Browser Pass Against Updated Source

- `npm.cmd run dev -- --host 127.0.0.1 --port 5173`
- `doppler.exe run -- node scripts/qa-companyadmin-media-review.mjs --json` with `QA_BASE_URL=http://127.0.0.1:5173`

Observed warnings against the updated source:

- THREE.Clock warning
- Vite dev-server / React DevTools informational messages
- No GoTrueClient warning
- No PWA manifest icon warning

### Backend Smoke

- `doppler.exe run -- node scripts/smoke-backend-supabase.mjs`

Results:

- `/api/expo/scene -> 200`
- `/api/expo/scene` continued to omit `expo_review_media`
- Protected backend route handling remained unchanged

## Notes

- No sponsor media review logic was changed.
- No auth semantics were changed.
- No production data was touched.
- The live staging browser still reflects the pre-fix deployment until the fixed assets and shared Supabase client are deployed.
