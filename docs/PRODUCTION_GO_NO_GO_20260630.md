# Production Go/No-Go Preflight - 2026-06-30

Phase: Release Roadmap V1 Phase 6.2 production go/no-go checklist
Branch: `release/v1-stabilization`
Preflight baseline commit: `ee24342e09c2f18ceaf8cb8e48e3dd520ce56d29`

## 2026-07-01 Refresh

Status: `TECHNICAL GO / PROMOTION HOLD`

Refresh commit: `e3e793563002ac5154117bca48b4b760404bb66e`

All currently required technical release evidence for the sponsor-facing Web3D staging
baseline is green after the final staging sweep. No production deploy, production
promotion, production alias change, production Supabase mutation, live Stripe key usage,
payment mode change, auth-policy change, Pixel Streaming change, or Unreal change was
run during this refresh.

Production promotion remains held because `productVisualAccepted=false` is still the
recorded product visual state, and no explicit instruction to move the production aliases
after accepting the visuals has been recorded.

| Requirement | 2026-07-01 Result | Evidence |
| --- | --- | --- |
| GitHub Release Gate on current release commit | `PASS` | Run `28549649511` passed on `e3e793563002ac5154117bca48b4b760404bb66e` in 3m18s: frontend lint/build, bundle budget, release static gates, backend TypeScript/lint/tests, and modular-home quote staging contract. |
| Final staging readiness | `PASS` | Doppler `stg` readiness passed for staging frontend, API health, `/api/expo/scene`, Supabase dry-run, and publication smoke; optional Pixel Streaming remained warning-level HTTP 401 outside the Web3D baseline. |
| Staging browser smoke | `PASS` | Real-browser expo staging smoke passed without runtime exceptions, browser error entries, automatic lead submissions, or mojibake. |
| GALA staging smoke | `PASS` | Full 5-concern smoke passed: ownership, DOM-overlay, wall-skin coverage, floor/ground isolation, and geometry clip. |
| Stripe staging checkout and webhook | `PASS` | Real Stripe test Checkout Session, signed `checkout.session.completed` webhook finalization, payment completion, and cleanup passed against staging; Stripe endpoint metadata shows one enabled non-livemode endpoint for `https://api-staging.30sek24.com/api/billing/webhook`. |
| Constrained-mobile performance | `PASS` | Staging constrained-mobile static and motion audits exited green; motion budget allows up to 6 stutters for the constrained profile and all scenarios stayed within that budget. |
| Production public endpoint sanity | `PASS / READ-ONLY` | `https://api.30sek24.com/health`, `https://api.30sek24.com/api/expo/scene`, `https://www.30sek24.com/`, `/expo-3d`, `/expo/sponsor-packages`, `/expo/booth-marketplace`, and `/modular-homes/studio?homeStudio=1` returned HTTP 200. |
| Production Supabase direct RLS verification | `NOT RUN` | No production Supabase table query or mutation was run in this refresh. Static RLS checks and staging direct-public RLS evidence remain green. |
| Human product visual acceptance recorded | `BLOCKED` | `productVisualAccepted=false` remains recorded. The technical visual preflight passed, but this is not a human product acceptance record. |
| Explicit production promotion authorization | `BLOCKED` | No explicit instruction to accept the visuals and run production preview deploy plus production alias promotion was recorded. |

Required before production promotion:

1. Record human product visual acceptance, changing `productVisualAccepted` from false by the designated release process.
2. Give explicit production promotion authorization in the active session.
3. Decide whether to run live production Supabase direct RLS verification before promotion, or document why static/staging RLS evidence is sufficient.
4. Handle the unrelated tracked `supabase/.temp/cli-latest` worktree change before using production deploy tooling, or intentionally run with the deploy script's dirty-worktree override.
5. Run production preview deploy, promote production aliases, then record the production release.

## Decision

Status: `NO-GO / NO PRODUCTION PROMOTION`

This was a non-destructive Phase 6.2 preflight only. No production deploy,
production promotion, production alias change, payment change, auth-policy change, or
schema change was run.

Production promotion remains blocked until every Phase 6.2 gate is green, including a
human product visual acceptance record. `productVisualAccepted=false` remains the only
recorded product visual status.

## Checklist

| Requirement | Result | Evidence |
| --- | --- | --- |
| Explicit production promotion authorization in this session | `BLOCKED` | The session continued release preflight work, but no explicit instruction to run `promote:production` was given. |
| All validation gates green in CI | `BLOCKED / UNVERIFIED` | `gh run list --branch release/v1-stabilization --limit 5 --json ...` returned `[]`, so there is no CI run evidence for this branch. After publishing `release/v1-stabilization`, `gh workflow run release-gate.yml --ref release/v1-stabilization` returned GitHub `HTTP 404: workflow release-gate.yml not found on the default branch`, so manual dispatch cannot be used until the workflow exists on the default branch or an equivalent CI path is provided. |
| Bundle budget met | `PASS` | `npm.cmd run check:bundle-budget` passed after the production build. Current gzip usage: `react-three-vendor` 469.45/516.39 kB, `three-core` 187.82/206.60 kB, `Expo3D` 158.12/178.72 kB, `modular-home` 129.72/140.80 kB, `react-vendor` 73.72/81.09 kB. |
| Backend ships from compiled dist, not `tsx` in prod | `PASS` | `backend-server/Dockerfile.full` production runner uses `node backend-server/dist/backend-server/server.js`. `docs/BACKEND_RELEASE_PACKAGING.md` names the full compiled backend as canonical and includes `/api/expo/scene` plus `/api/modular-home/quote`. |
| Backend serves `/api/expo/scene` and `/api/modular-home/quote` | `PASS` | Backend contract tests passed via `npm.cmd run check:backend-tests`; staging quote contract passed through Doppler staging env. |
| Quote endpoint production-gated, distributed-limited, spam-protected | `PASS / LIVE PROD UNVERIFIED` | Code and backend tests cover production host allowlist, Redis-backed limiting, honeypot, optional Turnstile, and duplicate guard. No live production quote mutation was run. |
| RLS default-deny verified on production Supabase table | `BLOCKED / UNVERIFIED` | Static `npm.cmd run check:all` includes `check:supabase-rls` and passed. Staging direct public read was denied with `42501`. Production Supabase was not mutated or queried. |
| 30/60 FPS evidence on constrained mobile and desktop | `BLOCKED` | Desktop/local GALA performance evidence exists in `docs/GALA_PHASE3_VISUAL_PERFORMANCE_REPORT.md`. Fresh staging constrained-mobile static budget passed at 390x844, dSF 3, CPU throttle 4x. Fresh staging constrained-mobile motion budget failed because stutters over 50ms exceeded the max of 1. First run: exterior stationary 3 stutters and exterior motion 2 stutters. Rerun: exterior stationary 4 stutters. Median FPS remained above 30 in both runs. Evidence: `artifacts/phase6-2-constrained-mobile/static/qa-gala-performance-budget-result.json`, `artifacts/phase6-2-constrained-mobile/motion/qa-gala-motion-performance-result.json`, and `artifacts/phase6-2-constrained-mobile/motion-rerun/qa-gala-motion-performance-result.json`. |
| Human product visual acceptance recorded | `BLOCKED` | `productVisualAccepted=false` remains recorded. This is a human gate and was not self-approved. |

## Validation Run During Preflight

| Command | Result |
| --- | --- |
| `npm.cmd run lint` | `PASS` |
| `npm.cmd run build` | `PASS` |
| `npm.cmd run check:bundle-budget` | `PASS` |
| `npm.cmd run check:all` | `PASS` |
| `(backend-server) npx.cmd tsc --noEmit -p tsconfig.json` | `PASS` |
| `(backend-server) npm.cmd run lint` | `PASS` |
| `npm.cmd run check:backend-tests` | `PASS` |
| `powershell.exe -ExecutionPolicy Bypass -File scripts/run-with-doppler.ps1 run -- node scripts/check-modular-home-quote-staging.mjs --json` | `PASS` |
| `gh run list --branch release/v1-stabilization --limit 5 --json ...` | `UNVERIFIED`: returned `[]` |
| `git push -u origin release/v1-stabilization` | `PASS`: branch published; later fast-forward pushes succeeded and the remote ref was verified with `git ls-remote` |
| `gh workflow run release-gate.yml --ref release/v1-stabilization` | `BLOCKED`: GitHub returned `HTTP 404` because the workflow is not on the default branch |
| `node scripts/qa-gala-performance-budget-audit.mjs --base-url=https://staging.30sek24.com --profile=constrained-mobile --out-dir=artifacts/phase6-2-constrained-mobile/static` | `PASS`: constrained-mobile static budget passed on staging |
| `node scripts/qa-gala-motion-performance-audit.mjs --base-url=https://staging.30sek24.com --profile=constrained-mobile --out-dir=artifacts/phase6-2-constrained-mobile/motion` | `FAIL`: constrained-mobile motion budget failed on stutter count, despite median FPS above 30 |
| `node scripts/qa-gala-motion-performance-audit.mjs --base-url=https://staging.30sek24.com --profile=constrained-mobile --out-dir=artifacts/phase6-2-constrained-mobile/motion-rerun` | `FAIL`: rerun confirmed constrained-mobile motion stutter budget failure |

## Required Before Production Promotion

1. Obtain explicit production promotion authorization in the active session.
2. Make the release-gate workflow dispatchable from GitHub or provide an equivalent green CI run for the release branch or PR.
3. Verify production Supabase RLS default-deny behavior against the intended production table.
4. Fix or re-evaluate the constrained-mobile motion stutter budget, then recapture passing mobile/desktop FPS evidence for the release surface.
5. Have a human product owner record product visual acceptance through the designated release process.
6. Only after all items are green, run the production promotion command and record the release in `CHANGELOG.md`.
