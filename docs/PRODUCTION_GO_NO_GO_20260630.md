# Production Go/No-Go Preflight - 2026-06-30

Phase: Release Roadmap V1 Phase 6.2 production go/no-go checklist
Branch: `release/v1-stabilization`
Preflight baseline commit: `ee24342e09c2f18ceaf8cb8e48e3dd520ce56d29`

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
| All validation gates green in CI | `BLOCKED / UNVERIFIED` | `gh run list --branch release/v1-stabilization --limit 5 --json ...` returned `[]`, so there is no CI run evidence for this branch. |
| Bundle budget met | `PASS` | `npm.cmd run check:bundle-budget` passed after the production build. Current gzip usage: `react-three-vendor` 469.45/516.39 kB, `three-core` 187.82/206.60 kB, `Expo3D` 158.12/178.72 kB, `modular-home` 129.72/140.80 kB, `react-vendor` 73.72/81.09 kB. |
| Backend ships from compiled dist, not `tsx` in prod | `PASS` | `backend-server/Dockerfile.full` production runner uses `node backend-server/dist/backend-server/server.js`. `docs/BACKEND_RELEASE_PACKAGING.md` names the full compiled backend as canonical and includes `/api/expo/scene` plus `/api/modular-home/quote`. |
| Backend serves `/api/expo/scene` and `/api/modular-home/quote` | `PASS` | Backend contract tests passed via `npm.cmd run check:backend-tests`; staging quote contract passed through Doppler staging env. |
| Quote endpoint production-gated, distributed-limited, spam-protected | `PASS / LIVE PROD UNVERIFIED` | Code and backend tests cover production host allowlist, Redis-backed limiting, honeypot, optional Turnstile, and duplicate guard. No live production quote mutation was run. |
| RLS default-deny verified on production Supabase table | `BLOCKED / UNVERIFIED` | Static `npm.cmd run check:all` includes `check:supabase-rls` and passed. Staging direct public read was denied with `42501`. Production Supabase was not mutated or queried. |
| 30/60 FPS evidence on constrained mobile and desktop | `PARTIAL / BLOCKED` | Desktop/local GALA performance evidence exists in `docs/GALA_PHASE3_VISUAL_PERFORMANCE_REPORT.md`; roadmap risk still marks constrained-mobile 30 FPS evidence as unproven. No fresh constrained production/staging FPS capture was produced in this preflight. |
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

## Required Before Production Promotion

1. Obtain explicit production promotion authorization in the active session.
2. Capture a green CI release-gate run for the release branch or PR.
3. Verify production Supabase RLS default-deny behavior against the intended production table.
4. Capture constrained-mobile 30 FPS and desktop 60 FPS evidence for the release surface.
5. Have a human product owner record product visual acceptance through the designated release process.
6. Only after all items are green, run the production promotion command and record the release in `CHANGELOG.md`.
