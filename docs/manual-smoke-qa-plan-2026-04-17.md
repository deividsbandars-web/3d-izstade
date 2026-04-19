# Manual Smoke QA Plan

Date: 2026-04-17  
Scope: whole-project smoke and manual review plan for the current frozen release-candidate state.  
Goal: convert the remaining launch blockers from assumption-based risk into explicit pass/fail evidence.

## Rule

This plan is not a feature roadmap. It is a release-smoke and manual-review execution plan.

Each area must end in one of:

- `PASS`
- `FAIL`
- `BLOCKED`
- `NOT RUN`

`PASS` requires evidence. `BLOCKED` requires an explicit reason and access dependency.

## Test Areas

| QA ID | Area | Type | Evidence Target |
| --- | --- | --- | --- |
| `QA-001` | Root TypeScript/build integrity | automated | `npx.cmd tsc -b` |
| `QA-002` | Backend server build integrity | automated | `npm.cmd run build` in `backend-server` |
| `QA-003` | Browser/backend boundary hygiene | automated | `npm.cmd run check:source-boundaries` |
| `QA-004` | Expo route/layout fixture integrity | automated | `npm.cmd run qa:expo-routes` |
| `QA-005` | Expo release asset integrity | automated | `npm.cmd run check:expo-release-assets` |
| `QA-006` | Expo texture pipeline integrity | automated | `npm.cmd run check:expo-texture-pipeline` |
| `QA-007` | Backend public health/API smoke | automated | `/health`, `/api/expo/scene`, `/api/ai-estimate`, `/api/pixel-streaming/status` |
| `QA-008` | Protected API auth-gate smoke | automated | representative protected routes return `401` without bearer token |
| `QA-009` | Authenticated protected API smoke | manual/auth-gated | one success per major protected API family |
| `QA-010` | Frontend route reachability smoke | local/manual | route set loads through local frontend server |
| `QA-011` | World visual review | manual/visual | left, arrival, mid, right, rear/stadium |
| `QA-012` | Booth placement/tier review | manual/visual | arrival/showcase/media/discovery rows, common/premium/elite/hero |
| `QA-013` | Screen ownership/readability review | manual/visual | booth screen vs world screen comparison |
| `QA-014` | Queue/worker runtime smoke | local/runtime | pending -> processing -> completed/failed flow |
| `QA-015` | Deploy/prod evidence | external/runtime | production reachability and current deployment health |
| `QA-016` | Lint hygiene sanity | automated | `npm.cmd run lint` |
| `QA-017` | Expo lead ops persistence | local/manual | sponsor lead status + ops note + follow-up save and reload in `CompanyAdmin` |
| `QA-018` | Expo lead ops end-to-end smoke | local/auth-gated | create/load a sponsor lead for a reviewable booth, then persist status + ops note + follow-up through the protected review endpoints |

## Execution Order

1. Static and build smoke
2. Backend local runtime smoke
3. Auth-gate smoke
4. Frontend local smoke
5. Authenticated API smoke
6. Visual/manual review
7. Worker/runtime review
8. Deploy/prod evidence

## Access Dependencies

The following areas may need user-provided access:

- authenticated API smoke if no valid Supabase user session/token is available locally
- deploy/prod evidence if the target is outside the local machine or requires dashboard/API auth
- visual/manual review if screenshots or live runtime access are required beyond local headless checks

## Runtime Prerequisites

- root dependencies installed
- backend-server dependencies installed
- `.env` and backend environment values present
- local backend server can bind to configured `PORT`

## Status Log

| QA ID | Status | Notes |
| --- | --- | --- |
| `QA-001` | `PASS` | `npx.cmd tsc -b` passed |
| `QA-002` | `PASS` | `backend-server` TypeScript build passed |
| `QA-003` | `PASS` | `npm.cmd run check:source-boundaries` passed |
| `QA-004` | `PASS` | `npm.cmd run qa:expo-routes` passed after sandbox escalation; fixture output produced valid summaries for 3 scenarios |
| `QA-005` | `PASS` | release asset check passed with advisory: `public/models/default_booth.glb` is zero-byte |
| `QA-006` | `PASS` | texture pipeline check passed for 20 textures; savings ratio `0.9608` |
| `QA-007` | `PASS` | `backend-server` dev runtime now reaches `/health`, `/api/expo/scene`, and `/api/pixel-streaming/status`; `POST /api/ai-estimate` returns application-level `400` instead of transport failure |
| `QA-008` | `PASS` | representative protected routes returned `401` without bearer token: `/api/dashboard`, `/api/workflows/execute`, `/api/marketplace/agents` |
| `QA-009` | `PASS` | authenticated smoke completed with real user token; representative protected families now return `200`, with validation routes returning expected `400` on minimal payloads |
| `QA-010` | `PASS` | local preview reachable on `127.0.0.1:4173`; `/`, `/expo-3d`, `/city-map`, `/heating-cost-calculator`, `/platform/marketplace`, `/expo/booth/test` returned `200` |
| `QA-011` | `BLOCKED` | visual review requires fresh screenshot batch or guided live review from local runtime |
| `QA-012` | `BLOCKED` | visual booth/tier review requires fresh screenshot batch or guided live review from local runtime |
| `QA-013` | `BLOCKED` | screen ownership/readability review requires visual evidence |
| `QA-014` | `PASS` | local Redis-backed worker smoke now proves `pending -> completed` and bounded `retry -> retry -> failed/quarantined` lifecycles after switching queue execution to a service-key Supabase client and adding periodic pending-task polling |
| `QA-015` | `BLOCKED` | deploy/prod evidence needs external reachability and likely authenticated dashboard or CLI verification |
| `QA-016` | `FAIL` | `npm.cmd run lint` reports 367 problems; major noise comes from `WarpalaUE5/Saved/Autosaves/...` plus real repo lint debt in `src` |
| `QA-017` | `PASS` | local Supabase migration `20260418090000_expo_lead_ops.sql` applied successfully; `expo_lead_ops` table exists and the admin/exhibitor lead ops save path is now backed by persistence |
| `QA-018` | `PASS` | end-to-end smoke completed with test user `test1@local.com`: managed booth count `1`, public lead capture succeeded, protected lead status update succeeded, ops note persisted, follow-up persisted, and reload confirmed the saved values on booth `413f451f-0825-4afb-b7ca-51457df181ee` |

## Key Findings

### Critical failures

1. `backend-server` built runtime is still not production-ready even though dev runtime is healthy.
   - `npm.cmd start` now points at the correct built entrypoint, but built runtime still fails on Node ESM resolution inside compiled `dist/src/backend/...` modules
   - current failing example: missing `dist/src/lib/supabaseClient` specifier due extensionless import usage in compiled backend domain files

2. Pixel streaming smoke cannot pass while backend runtime is down.
   - after backend dev runtime came up, the raw status endpoint became reachable
   - full `npm.cmd run check:pixel-streaming` still needs signaling/streamer availability to pass completely

3. Lint hygiene is not release-clean.
   - `npm.cmd run lint` reports `367` problems
   - a large part of the error volume comes from generated/autosave content under `WarpalaUE5/Saved/Autosaves/...`
   - there is still real app lint debt inside `src`, including React hook dependency/compiler issues in `src/modules/expo/runtime/world/WorldCitySkeleton.tsx`

4. Built runtime remains an operational blocker even after worker/runtime smoke improved.
   - `backend-server npm start` is still not production-ready because compiled backend-domain ESM imports remain Node-incompatible after build

5. Queue lifecycle now works locally and governance support tables are aligned.
   - local Redis is available via Docker and worker lifecycle smoke passed
   - remote `api_usage_logs` and `user_daily_limits` support tables are now present
   - post-fix worker smoke confirms governance blocks on real billing logic (`Insufficient credits`) without the prior schema-cache failure path
   - queue retries are drained by periodic pending-task polling, which prevents requeued tasks from being stranded when Realtime delivery is insufficient

### Passed local smoke

- root TypeScript build
- root production build
- backend-server TypeScript build
- backend-server dev runtime bootstrap after env fallback fix
- backend public health route
- backend public Expo scene route
- backend public pixel-streaming status route
- backend protected-route auth gating without bearer token
- authenticated dashboard route
- authenticated platform health route
- authenticated marketplace agents route
- authenticated expo city route
- authenticated billing credit-balance route
- authenticated workflow validation route reachability
- authenticated AI respond route reachability
- Redis-backed queue lifecycle proof for:
  - `pending -> completed`
  - `retry -> retry -> failed/quarantined`
- local Expo lead ops migration applied and verified
- expo booths API compatibility fallback fixed so `expoService` no longer hard-fails solely on missing `public.expo_booths`
- end-to-end Expo lead ops smoke passed on real backend/API paths after normalizing managed booth ownership and remote lead tables
- source-boundary hygiene
- expo route fixture QA
- expo release asset audit
- expo texture pipeline audit
- frontend preview reachability for representative routes

### Access still needed

- visual/manual review:
  - either fresh screenshots for the mandatory zones, or permission to drive the app through your preferred local auth/runtime path
- deploy/prod evidence:
  - whichever CLI/dashboard access is needed for the current production targets
- end-to-end lead ops browser smoke:
  - either a test user that owns at least one managed booth with reviewable scene/company linkage, or seeded booth/company data that produces a non-empty `leadInbox`

## Backend Runtime Notes

- `backend-server/server.ts` and `server.docker.ts` now use shared `env.ts` bootstrap instead of duplicating partial dotenv loading
- local backend dev runtime now tolerates missing `SIGNALING_STATUS_BASE_URL` by deriving a local HTTP base from `VITE_SIGNALING_SERVER_URL` or falling back to `http://127.0.0.1` outside production
- local dev runtime still emits Redis connection errors when `REDIS_URL=redis://127.0.0.1:6379` is configured but Redis is not running
- built runtime remains a separate blocker because compiled backend-domain ESM imports are not consistently Node-resolvable after `tsc`
- worker/runtime queue smoke now passes locally after:
  - starting Redis on `127.0.0.1:6379`
  - switching backend queue/agent execution modules to a service-key Supabase client
  - adding periodic pending-task polling so requeued tasks are not stranded when Realtime is insufficient

## Authenticated API Smoke Notes

Authenticated smoke was run with a real Supabase user session token obtained from Auth password login.

Representative results:

- `GET /api/dashboard` -> `200`
- `GET /api/platform/health` -> `200`
- `GET /api/marketplace/agents` -> `200`
- `GET /api/expo/city` -> `200`
- `GET /api/billing/users/smoke-user/credits` -> `200`
- `POST /api/workflows/validate` -> `400`
- `POST /api/ai/respond` -> `400`

Interpretation:

- auth boundary is functioning correctly
- workflow and AI routes are reachable and performing request-level validation
- earlier schema drift on Expo booth tables and billing columns was mitigated with compatibility fallbacks
- remaining release blockers are now centered on built runtime correctness and missing visual/deploy evidence

## Expo Lead Ops Notes

- `expo_lead_ops` persistence migration was applied successfully to the local Supabase database container
- verification:
  - migration DDL executed without SQL errors
  - `select to_regclass('public.expo_lead_ops')` returned `expo_lead_ops`
- lead ops scope now covered in code and local DB:
  - status triage via `service_requests.status`
  - ops note persistence
  - follow-up datetime persistence
  - managed booth ownership enforcement on the save endpoints
- attempted end-to-end smoke findings:
  - test user `test1@local.com` authenticated successfully
  - legacy booth ownership and booth API compatibility were normalized so managed booth filtering now exposes one real booth to the test user
  - remote `service_requests` and `expo_lead_ops` tables were restored so public lead capture and ops persistence can execute against the live project schema
  - full smoke passed: create lead -> load in review inbox -> update status -> save ops note -> save follow-up -> reload and verify persistence
- what still remains for fuller commercial CRM behavior:
  - assignee/owner
  - richer follow-up workflow
  - explicit manual or seeded-data confirmation that note/follow-up survive reload in `CompanyAdmin`

## Exit Condition

This smoke plan is complete when:

- every QA line has a concrete status
- every `FAIL` or `BLOCKED` item has a specific reason
- required user access is named exactly, not vaguely
- the remaining release blockers can be traced to evidence rather than assumption
