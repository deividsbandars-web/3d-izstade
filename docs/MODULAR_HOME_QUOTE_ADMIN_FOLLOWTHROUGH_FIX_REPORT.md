# Modular Home Quote / Admin Follow-Through Fix Report

Date: `2026-06-20`

## Verdict

PASS

## Problem

`scripts/check-modular-home-quote-staging.mjs --json` was returning backend `500` on the admin quote-review path.

The public quote submission flow itself was already wired correctly, but the backend service-role client could not read the staging table it needs for admin review and smoke cleanup.

## Root Cause

Staging Supabase was missing table-level privileges for `public.modular_home_quote_requests` on the `service_role` role.

The backend admin controller already used the correct service-role client path:

- `backend-server/controllers/modularHomeQuoteAdminController.ts`

The smoke script also deletes its disposable quote row at the end, so the missing privilege set needed to cover the full follow-through flow, not just list/read.

## Minimal Fix

Added one narrow staging-safe migration:

- `supabase/migrations/20260620000000_modular_home_quote_requests_service_role_privileges.sql`

It grants the backend service role the exact table privileges used by the flow:

- `SELECT`
- `INSERT`
- `UPDATE`
- `DELETE`

No anon or authenticated broadening was added.

## Route / Data Map

| Route / API | Method | Auth required | Table(s) | Current result | Expected result | Gap |
| --- | --- | --- | --- | --- | --- | --- |
| `/api/modular-home/quote?homeQuoteBackend=1` | `POST` | no public auth, staging gate applies | `public.modular_home_quote_requests` | `201` | `201` | fixed |
| `/api/modular-home/quotes` | `GET` | yes, admin | `public.modular_home_quote_requests` | `200` | `200` | fixed |
| `/api/modular-home/quotes/:quoteId` | `GET` | yes, admin | `public.modular_home_quote_requests` | `200` | `200` | fixed |
| `/api/modular-home/quotes/:quoteId/status` | `PATCH` | yes, admin | `public.modular_home_quote_requests` | `200` | `200` | fixed |
| `/api/modular-home/quotes/:quoteId/ops` | `PATCH` | yes, admin | `public.modular_home_quote_requests` | not separately smoke-tested in this round | `200` | no remaining evidence of a table privilege blocker |

## Validation

Commands run:

- `npm.cmd run build`
- `npm.cmd run lint`
- `powershell.exe -ExecutionPolicy Bypass -File scripts/run-with-doppler.ps1 run -- npx.cmd supabase db push --linked`
- `powershell.exe -ExecutionPolicy Bypass -File scripts/run-with-doppler.ps1 run -- npx.cmd supabase migration list --linked`
- `powershell.exe -ExecutionPolicy Bypass -File scripts/run-with-doppler.ps1 run -- node scripts/check-modular-home-quote-staging.mjs --json`
- `powershell.exe -ExecutionPolicy Bypass -File scripts/run-with-doppler.ps1 run -- node scripts/smoke-backend-supabase.mjs`
- `curl.exe -sS -D - -o NUL https://staging.30sek24.com/modular-homes/studio`
- `curl.exe -sS -D - -o NUL https://staging.30sek24.com/modular-homes/quotes`
- `curl.exe -sS -D - -o NUL https://staging.30sek24.com/expo/booth/sponsor-concierge/stream`

Results:

- Build passed.
- Lint passed.
- The migration was listed as applied on the linked remote staging database.
- `scripts/check-modular-home-quote-staging.mjs --json` now passes end-to-end:
  - staging backend health `200`
  - public submission gate check `403` as expected when the required flag is missing
  - valid staging quote submission `201`
  - public quote/admin routes stay `401`
  - non-admin user remains `403`
  - admin list/detail/status/export all return `200`
  - disposable smoke quote row cleanup succeeded
- `scripts/smoke-backend-supabase.mjs` passed:
  - `/health -> 200`
  - `/api/expo/scene -> 200`
  - `authPolicy -> public-readonly`
  - `sectors -> 5`
  - `companies -> 3`
  - `booths -> 3`
- Staging frontend route probes returned `200` for:
  - `/modular-homes/studio`
  - `/modular-homes/quotes`
  - `/expo/booth/sponsor-concierge/stream`

## What Remains Missing

- A dedicated browser-admin smoke helper for the modular-home quote review route in this repository.
- A validated authenticated browser session in this shell for `/modular-homes/quotes`.
- Any claim of full-detail home configurator support.

## Safe Product Story

- Modular-home quote submission is live and staging-safe.
- Admin quote review follows through through the protected backend route.
- The staging product can honestly describe modular homes as a limited preset studio with quote follow-through.
