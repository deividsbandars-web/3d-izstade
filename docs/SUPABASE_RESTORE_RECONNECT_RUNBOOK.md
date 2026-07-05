# Supabase Restore / Reconnect Runbook

## Purpose

This project already depends on Supabase across frontend, `backend-server`, auth, data, storage, and repo migrations.

Use this runbook to:

- verify whether the current Supabase project still exists
- unpause and reconnect it if possible
- validate the hybrid Vercel + Hetzner/VPS deployment after reconnect
- recreate a replacement project from repo migrations only if the original project is unrecoverable and explicit approval is given

This is a restore-first runbook, not a greenfield migration plan.

## Current Unknowns

Status is currently unknown until checked in the Supabase dashboard and deployment environments:

- Project visible in dashboard: unknown
- Project status active / paused / deleted: unknown
- One project or split staging / production projects: unknown
- Auth users still present: unknown
- Storage buckets still present: unknown
- Tables still present: unknown
- RLS policies still present: unknown

## Non-Negotiable Handling Rule

- Supabase is an existing dependency and must be restored or reconnected before replacement is considered.
- Do not replace Supabase with another provider.
- Do not create new migrations as part of restore.
- If the original project is deleted or unrecoverable, create a replacement only after explicit approval.
- If a replacement is approved, reuse the existing repo migrations in `supabase/migrations/`.

## Repo Areas To Inspect First

Inspect these areas before changing any environment values:

- `supabase/migrations/`
- `.env.example`
- `.env.docker.example`
- `backend-server/config/runtimeEnv.ts`
- `backend-server/services/supabase.ts`
- `backend-server/middleware/authMiddleware.ts`
- `src/config/runtimeEnv.ts`
- `src/core/supabase.ts`
- `src/lib/supabaseClient.ts`
- frontend usages under `src/` that import `supabase` or `supabaseClient`
- `docs/release/ENVIRONMENT_MATRIX.md`
- `docs/release/WEB3D_EXPO_DEPLOYMENT_CONTRACT.md`

Areas especially relevant to functional verification after reconnect:

- `/api/expo/scene` via `backend-server/controllers/expoController.ts`
- sponsor lead inbox routes in `backend-server/routes/api.ts`
- modular home quote routes in `backend-server/routes/api.ts`
- sponsor asset and storage migrations in `supabase/migrations/`

## Known Env-Key Surfaces

List only variable names. Do not copy real values into tickets, docs, chats, or handoff bundles.

### Frontend env keys

Expected in Vercel staging / production:

- `VITE_PUBLIC_API_BASE_URL=<redacted>`
- `VITE_SIGNALING_SERVER_URL=<redacted>`
- `VITE_SUPABASE_URL=<redacted>`
- `VITE_SUPABASE_ANON_KEY=<redacted>`
- `VITE_PIXEL_STREAMING_PROBE_TIMEOUT_MS=<redacted>`

Optional frontend keys that should still be checked for consistency:

- `VITE_STUN_SERVER_URLS=<redacted>`
- `VITE_TURN_SERVER_URLS=<redacted>`
- `VITE_TURN_USERNAME=<redacted>`
- `VITE_TURN_PASSWORD=<redacted>`

### Backend env keys

Expected on Hetzner/VPS for `backend-server`:

- `NODE_ENV=<redacted>`
- `PORT=<redacted>`
- `SUPABASE_URL=<redacted>`
- `SUPABASE_SERVICE_KEY=<redacted>`
- `SIGNALING_STATUS_BASE_URL=<redacted>`
- `PIXEL_STREAMING_STATUS_TIMEOUT_MS=<redacted>`
- `UE5_SECRET_KEY=<redacted>`

### Docker / local / compose-adjacent env keys

Present in repo examples and may be mirrored into release processes:

- `SUPABASE_URL=<redacted>`
- `SUPABASE_ANON_KEY=<redacted>`
- `SUPABASE_SERVICE_KEY=<redacted>`

## Decision Tree

### 1. If the project is paused

Preferred path:

1. Unpause the existing Supabase project.
2. Confirm the project URL still matches the intended project.
3. Reconcile env values across:
   - Vercel frontend env
   - Hetzner/VPS backend env
   - any local or compose-based env references used for deploy or smoke checks
4. Verify schema, auth, storage, and runtime health checks.
5. Do not create a new project.

### 2. If the project is active

Preferred path:

1. Confirm the active project URL and environment ownership.
2. Verify required schema objects exist.
3. Verify auth users and auth flows if applicable.
4. Verify storage buckets if sponsor assets or managed media are expected.
5. Verify RLS and role expectations.
6. Reconcile frontend and backend env values if drift exists.
7. Do not create a new project.

### 3. If the project is deleted

Only after explicit approval:

1. Confirm the original project is not recoverable.
2. Confirm whether staging and production should share one replacement project or use separate projects.
3. Create replacement project only after explicit confirmation.
4. Reapply existing repo migrations.
5. Recreate expected storage buckets and verify RLS.
6. Update Vercel and VPS env with redacted handling only.
7. Run functional verification before any release traffic is pointed at the replacement.

## Verification Checklist By System State

### Dashboard verification

Check in Supabase dashboard:

- project visibility
- project status
- organization / ownership
- database tables
- auth users
- storage buckets
- SQL editor / migrations history visibility
- RLS enabled tables and policies

Record status as:

- visible / not visible
- active / paused / deleted
- one project / separate staging + prod / unknown

## Schema Verification Targets

Use repo migrations as the source of truth for expected surfaces. At minimum verify the existence of areas implied by migrations and runtime usage:

- expo city and sponsor booth tables
- sponsor lead inbox related tables
- managed screen content compatibility tables
- sponsor assets storage related objects
- modular home quote request tables
- auth and security hardening migrations

Useful repo evidence:

- `20260327061000_expo_sponsor_release_seed.sql`
- `20260407123000_premium_showroom_and_city_screens.sql`
- `20260418090000_expo_lead_ops.sql`
- `20260531113000_expo_booth_managed_screen_content_compat.sql`
- `20260603193000_expo_sponsor_assets_storage.sql`
- `20260604014500_expo_booth_publication_status.sql`
- `20260609040000_modular_home_quote_requests.sql`
- `20260609164000_modular_home_quote_sales_ops.sql`

## Runtime Verification Checks

Run these after restore or reconnect.

### Backend health

Verify the backend starts with valid `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`.

Check:

- backend process starts without missing-env failures
- no `Supabase not configured` runtime errors
- no auth middleware failures caused by invalid keys

### `/api/expo/scene`

Verify the canonical public scene contract still works:

- request `GET /api/expo/scene`
- confirm response is successful
- confirm sponsor boulevard scene payload returns expected data instead of fallback failure behavior

### Sponsor leads

Verify existing sponsor lead flow still works:

- sponsor lead inbox route loads
- backend lead inbox endpoints respond
- no permission failures caused by missing tables or broken RLS

### Modular home quote submission

Verify the existing modular home quote flow:

- frontend quote form can submit to backend
- backend quote route can persist or process expected records
- admin quote review routes still function if part of operations workflow

### Sponsor assets / storage

If sponsor asset storage is expected:

- confirm required buckets exist
- confirm storage policies align with runtime expectations
- confirm no storage-related failures for sponsor booth content paths

### Auth flow

If login or protected admin flows are in scope:

- confirm auth session creation still works
- confirm protected routes can validate current user tokens
- confirm backend auth middleware can resolve users from bearer tokens

## Conservative Restore / Reconnect Procedure

### Phase 1: Inventory only

1. Identify current Supabase URL references from:
   - Vercel env
   - Hetzner/VPS env
   - `.env.example`
   - `.env.docker.example`
2. Redact all secrets before recording notes.
3. Confirm whether frontend and backend point to the same project.
4. Confirm whether staging and production point to the same or different projects.

### Phase 2: Existing project recovery

If dashboard shows paused:

1. Unpause project.
2. Verify URL and project ref.
3. Confirm anon key and service key are current.
4. Update Vercel frontend env if needed:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Update VPS/backend env if needed:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
6. Restart only the affected runtime processes through the existing deployment process.
7. Run verification checks.

### Phase 3: Active project reconciliation

If dashboard shows active:

1. Verify schema matches repo expectations.
2. Verify storage buckets.
3. Verify auth users if login is in use.
4. Verify RLS and role assumptions for anon vs service access.
5. Reconcile env drift between frontend and backend.
6. Run verification checks.

## Replacement Project Procedure

Use this only if the original project is deleted or unrecoverable and explicit approval has been given.

### Preconditions

- explicit approval to create a replacement exists
- original project recovery options have been exhausted
- decision on staging vs production split is documented

### Steps

1. Create a new Supabase project.
2. Do not invent a new schema manually.
3. Apply existing repo migrations from `supabase/migrations/`.
4. Verify tables expected by:
   - `/api/expo/scene`
   - sponsor leads
   - sponsor assets / booth content
   - modular home quote requests
   - auth-dependent flows
5. Verify RLS policies and storage buckets after migrations.
6. Update Vercel env with redacted reference handling only:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
7. Update Hetzner/VPS backend env with redacted reference handling only:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
8. Restart services through the existing deployment process.
9. Run the full verification checklist before treating the replacement as valid.

## Special Risk Notes

### Frontend fallback masking risk

`src/config/runtimeEnv.ts` contains frontend fallback behavior, including dummy fallback handling and hosted fallback constants.

Operational rule:

- do not assume the frontend is correctly configured just because the app renders
- verify that release env values are intentional and current
- confirm Vercel env values rather than trusting frontend fallback behavior

### Backend key separation risk

The backend must use service-role credentials, not frontend anon credentials.

Verify:

- `backend-server/config/runtimeEnv.ts` resolves `SUPABASE_SERVICE_KEY`
- backend runtime is not accidentally pointed at anon-only credentials

### RLS / auth drift risk

A project may be active while still failing operationally because:

- tables exist but policies drifted
- auth users exist but token validation fails
- storage buckets exist but policies are missing

Treat schema existence as necessary but not sufficient.

### Staging / production drift risk

The project split is currently unknown.

Before changing env values, confirm:

- whether staging and production should share one Supabase project
- whether only one environment is broken
- whether Vercel and VPS are pointing at different project refs

## Rollback Guidance

If reconnect or replacement causes regressions:

1. Stop changing runtime code.
2. Revert environment values to the last known working redacted key set.
3. Restart only the existing frontend/backend deployment surfaces.
4. Re-run:
   - backend health check
   - `/api/expo/scene`
   - sponsor leads
   - modular home quote flow
   - auth and storage checks if relevant
5. If replacement project fails verification, do not proceed with release cutover.

## Recommended Operator Output Template

Use this after performing the dashboard and env audit:

```md
SUPABASE STATUS

- Project visible in dashboard: yes/no
- Project status: active/paused/deleted
- One project or separate staging/prod: one/separate/unknown
- Tables visible: yes/no/partial
- Auth users visible: yes/no/unknown
- Storage buckets visible: yes/no/unknown
- RLS appears present: yes/no/unknown
- Frontend env reconciled: yes/no
- Backend env reconciled: yes/no
- Need replacement project: yes/no
- Explicit approval required before replacement: yes
```

## Final Rule

Supabase replacement is not the default solution.

Preferred order:

1. verify
2. unpause if paused
3. reconnect existing project
4. validate schema, auth, storage, RLS, frontend env, backend env
5. recreate only with explicit approval and existing repo migrations
