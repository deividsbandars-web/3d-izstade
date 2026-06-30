# Launch Readiness Snapshot - 2026-06-30

Phase: Release Roadmap V1 Phase 6.1 staging deploy and verification
Branch: `release/v1-stabilization`
Backend staging commit deployed: `d9b7320e6de72e3eb4bc54bfabc67e81af8e71b3`

## Recommendation

Status: `PARTIAL / NO PRODUCTION PROMOTION`

The backend staging deploy and runtime verification are green, but the frontend staging
preview deploy is blocked by Vercel file-upload failures before a new preview URL is
created. Do not proceed to Phase 6.2 production go/no-go until the frontend deploy path is
green and the promoted staging frontend is verified from the intended deployment.

## Evidence

| Gate | Result | Evidence |
| --- | --- | --- |
| Frontend staging preview deploy | `FAIL` | `npm.cmd run deploy:staging:preview` repeatedly failed during Vercel `v2/files` upload with invalid JSON body beginning `Internal S...` / request abort. Upload context was reduced from about `2.9GB` to `56.2MB`, but the Vercel API failure remained. |
| Backend staging deploy | `PASS` | `npm.cmd run deploy:staging:backend -- -AllowDirty` built `Dockerfile.full`, recreated `backend-staging`, and `/health` returned `{"status":"ok"}`. |
| Staging readiness | `PASS` | `npm.cmd run check:staging-readiness` passed on 2026-06-30: Doppler staging scope, frontend route, API health, scene, Supabase dry-run, and publication smoke passed. Legacy Pixel Streaming is optional by default and reported as a warning. |
| Browser smoke | `PASS` | `npm.cmd run check:expo-staging-browser-smoke -- --json` passed on 2026-06-30 with no runtime exceptions, no browser errors, and no automatic lead API request on page load. |
| Quote round-trip | `PASS` | `scripts/run-with-doppler.ps1 run -- node scripts/check-modular-home-quote-staging.mjs --json` passed on 2026-06-30: quote submit `201`, public admin routes `401`, non-admin `403`, admin list/detail/status/export `200`, RLS direct read denied `42501`, cleanup deleted the test quote. |
| Local lint | `PASS` | `npm.cmd run lint`. |
| Static release checks | `PASS` | `npm.cmd run check:all`. |
| Frontend build | `PASS` | `npm.cmd run build`. |
| Bundle budget | `PASS` | `npm.cmd run check:bundle-budget`. |

## Findings

- The earlier staging readiness failure was not a migration drift issue. It came from
  `supabase db push --linked` reading stale local Supabase link state for old project ref
  `gbmxrposlrhctyaaznmj` while Doppler staging correctly points at
  `aasovfczmqytdtugcrmh`.
- `scripts/check-staging-readiness.mjs` now runs the Supabase dry-run against the Doppler
  staging Supabase ref. It passes the DB password via `PGPASSWORD`, not inside the
  process-visible connection URL.
- Legacy Pixel Streaming remains checked, but is warning-level by default because it is
  outside the release baseline. Use `--require-legacy-runtime` to make that check fatal.
- `.vercelignore` now excludes large audit/archive trees and local `.vercel/` state from
  Vercel upload context. This reduced the upload context but did not resolve Vercel's
  server-side file API failure.

## Release Status

- `productVisualAccepted=false`.
- No production deploy or promotion was run.
- Phase 6.1 is not complete because the frontend staging preview deploy did not finish.
