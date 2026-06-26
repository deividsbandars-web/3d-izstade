# Supabase Doppler / Vercel / VPS Env After Restore

## Purpose

This checklist lists only variable names and target surfaces.

Do not place real values in this document.
Keep secrets in Doppler, then mirror them into Vercel and Hetzner/VPS runtime configuration as needed.

## Doppler Source Of Truth

Current Doppler selection observed during this run:

- Project: `-3d-izstade`
- Config: `stg`

Required Supabase-related variables for this restore workflow:

- `SUPABASE_PROJECT_REF=<redacted>`
- `SUPABASE_DB_PASSWORD=<redacted>`
- `SUPABASE_URL=<redacted>`
- `VITE_SUPABASE_URL=<redacted>`
- `VITE_SUPABASE_ANON_KEY=<redacted>`
- `SUPABASE_SERVICE_ROLE_KEY=<redacted>`

Optional or workflow-dependent variable:

- `SUPABASE_ACCESS_TOKEN=<redacted>`

Existing repo/runtime-aligned variable names that should remain consistent:

- `SUPABASE_SERVICE_KEY=<redacted>`
- `VITE_PUBLIC_API_BASE_URL=<redacted>`
- `VITE_SIGNALING_SERVER_URL=<redacted>`
- `VITE_PIXEL_STREAMING_PROBE_TIMEOUT_MS=<redacted>`

## Vercel Frontend Env Names

Expected frontend env names to map from Doppler-managed values:

- `VITE_PUBLIC_API_BASE_URL`
- `VITE_SIGNALING_SERVER_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_PIXEL_STREAMING_PROBE_TIMEOUT_MS`

Optional typed frontend env names:

- `VITE_STUN_SERVER_URLS`
- `VITE_TURN_SERVER_URLS`
- `VITE_TURN_USERNAME`
- `VITE_TURN_PASSWORD`

## Hetzner / VPS Backend Env Names

Expected `backend-server` env names to map from Doppler-managed values:

- `NODE_ENV`
- `PORT`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `SIGNALING_STATUS_BASE_URL`
- `PIXEL_STREAMING_STATUS_TIMEOUT_MS`
- `UE5_SECRET_KEY`

Notes:

- If the Doppler source keeps only `SUPABASE_SERVICE_ROLE_KEY`, map it consistently to the backend runtime name expected by the repo: `SUPABASE_SERVICE_KEY`.
- Do not change backend runtime code for key renaming in this task.

## Local CLI / Restore Workflow Names

Variables needed locally through `doppler run -- ...`:

- `SUPABASE_PROJECT_REF`
- `SUPABASE_DB_PASSWORD`
- `SUPABASE_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ACCESS_TOKEN` if CLI auth requires it

## Current Blockers Observed

The required secret names now exist in the selected Doppler config, and local linking succeeded.

Current restore blocker is no longer Doppler configuration. It is a migration failure during remote push:

- `20260327061000_expo_sponsor_release_seed.sql`
- error: `column "sector_id" does not exist`

Historical note from the previous blocked attempt:

- `SUPABASE_PROJECT_REF` is populated with a URL-like value instead of the raw Supabase project ref

Required format reminder:

- `SUPABASE_PROJECT_REF=<20-char-project-ref>`
- not a full URL
- not a `*.supabase.co` host
- not a quoted JSON fragment

## Mapping Rule

- Doppler remains the secrets source of truth.
- Do not create or commit `.env` files.
- Do not copy secrets into docs or handoff ZIP files.
- Update Vercel and VPS runtime env only after the required Doppler variables exist and the restore flow succeeds.
