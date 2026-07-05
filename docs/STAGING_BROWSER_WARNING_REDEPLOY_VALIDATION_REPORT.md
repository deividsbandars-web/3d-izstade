# Staging Browser Warning Redeploy Validation Report

## Scope

- Goal: redeploy the root frontend to staging and confirm the live staging browser picks up the browser-warning cleanup
- Runtime code changes in this task: none
- Production behavior changes: none
- Secret values printed or stored: none

## Redeploy Path

- Built the root frontend with `npm.cmd run build`
- Deployed the root frontend through `npm.cmd run deploy:staging:preview`
- Promoted the resulting Vercel deployment to `staging.30sek24.com` with `npm.cmd run promote:staging -- https://app-staging-83bgpsr99-esaukans-6934s-projects.vercel.app`

## Deployment Evidence

- Staging alias now points to `https://app-staging-83bgpsr99-esaukans-6934s-projects.vercel.app`
- Live bundle loaded by the browser QA run:
  - `https://staging.30sek24.com/index-CW0HUbE0.js`
  - `https://staging.30sek24.com/registerSW.js`
- Direct asset checks returned:
  - `https://staging.30sek24.com/pwa-192x192.png -> 200 image/png`
  - `https://staging.30sek24.com/manifest.webmanifest -> 200 application/manifest+json`

## Live Browser QA

Commands run:

- `powershell -ExecutionPolicy Bypass -File scripts/run-with-doppler.ps1 run -- node scripts/qa-companyadmin-media-review.mjs --json`

Observed results:

- First post-promote diagnostic still showed the stale `GoTrueClient` and PWA manifest icon warnings once while the staging edge/browser cache warmed up.
- A follow-up clean diagnostic only showed the documented `THREE.Clock` warning.
- The fixed `GoTrueClient` warning did not appear in the clean follow-up run.
- The fixed PWA manifest icon warning did not appear in the clean follow-up run.
- The remaining `THREE.Clock` warning remains non-blocking and documented as benign.

## Backend Safety Checks

Commands run:

- `powershell -ExecutionPolicy Bypass -File scripts/run-with-doppler.ps1 run -- node scripts/smoke-backend-supabase.mjs`
- `powershell -ExecutionPolicy Bypass -File scripts/run-with-doppler.ps1 run -- node scripts/diagnose-backend-bearer-auth.mjs`

Results:

- `/health -> 200`
- `/api/expo/scene -> 200`
- `/api/expo/scene` omitted `expo_review_media`
- protected `/api/expo/booths/managed` no-token probe remained `401`
- fresh bearer replay remained `200`
- sponsor media review MVP closeout state remained unchanged

## Conclusion

- The staging redeploy picked up the browser-warning cleanup.
- The fixed PWA and GoTrueClient warnings are gone on the live staging browser after a clean follow-up run.
- The remaining Three.js clock warning is still benign and documented.
