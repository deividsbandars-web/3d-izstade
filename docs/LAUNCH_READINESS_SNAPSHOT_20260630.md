# Launch Readiness Snapshot - 2026-06-30

Phase: Release Roadmap V1 Phase 6.1 staging deploy and verification
Branch: `release/v1-stabilization`
Backend staging commit deployed: `d9b7320e6de72e3eb4bc54bfabc67e81af8e71b3`

## Recommendation

Status: `STAGING VERIFIED / NO PRODUCTION PROMOTION`

Phase 6.1 staging deploy and runtime verification are complete. The frontend is promoted
to `staging.30sek24.com`, the backend staging deploy is healthy, and the required staging
readiness, browser smoke, and quote round-trip checks are green. Do not proceed to Phase
6.2 production go/no-go until the production checklist is explicitly authorized and human
product visual acceptance is recorded.

## Evidence

| Gate | Result | Evidence |
| --- | --- | --- |
| Frontend staging deploy | `PASS` | Direct source upload via `npm.cmd run deploy:staging:preview` failed during Vercel `v2/files` upload, so the working path was prebuilt deploy. `https://app-staging-fmci99e0q-esaukans-6934s-projects.vercel.app` was promoted to `staging.30sek24.com`; `vercel inspect staging.30sek24.com` resolves to deployment `dpl_4fBKHto6uCUQ3fqGU7LYzWv4QKra`. |
| Backend staging deploy | `PASS` | `npm.cmd run deploy:staging:backend -- -AllowDirty` built `Dockerfile.full`, recreated `backend-staging`, and `/health` returned `{"status":"ok"}`. |
| Staging readiness | `PASS` | `npm.cmd run check:staging-readiness` passed after staging alias promotion: Doppler staging scope, frontend route, API health, scene, Supabase dry-run, and publication smoke passed. Legacy Pixel Streaming is optional by default and reported as a warning. |
| Browser smoke | `PASS` | `npm.cmd run check:expo-staging-browser-smoke -- --json` passed against `https://staging.30sek24.com` with no runtime exceptions, no browser errors, and no automatic lead API request on page load. |
| Quote round-trip | `PASS` | `scripts/run-with-doppler.ps1 run -- node scripts/check-modular-home-quote-staging.mjs --json` passed after staging alias promotion: quote submit `201`, public admin routes `401`, non-admin `403`, admin list/detail/status/export `200`, RLS direct read denied `42501`, cleanup deleted the test quote. |
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
- A repeatable prebuilt staging deploy command is available as
  `npm.cmd run deploy:staging:preview:prebuilt`.
- `.vercelignore` now excludes large audit/archive trees and local `.vercel/` state from
  Vercel upload context. This reduced the upload context but did not resolve Vercel's
  server-side file API failure.
- The direct `vercel.app` deployment URL is protected by Vercel login, so public browser
  validation must use the promoted staging alias or an explicit protection bypass.

## Release Status

- `productVisualAccepted=false`.
- No production deploy or promotion was run.
- Phase 6.1 staging deploy and verification are complete.
