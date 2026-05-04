## Doppler Staging / Production Gap Report

Date: `2026-04-29`
Project: `-3d-izstade`

### Current state

- `dev` is populated.
- `stg` has no application secrets yet.
- `prd` has no application secrets yet.

### Missing in `stg`

- `GEMINI_API_KEY`
- `OPENAI_API_KEY`
- `PIXEL_STREAMING_STATUS_TIMEOUT_MS`
- `REDIS_URL`
- `RESEND_API_KEY`
- `SERPAPI_KEY`
- `STRIPE_SECRET`
- `STRIPE_WEBHOOK_SECRET`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `SUPABASE_URL`
- `UE5_SECRET_KEY`
- `VITE_PIXEL_STREAMING_PROBE_TIMEOUT_MS`
- `VITE_PUBLIC_API_BASE_URL`
- `VITE_SIGNALING_SERVER_URL`
- `VITE_STUN_SERVER_URLS`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_URL`
- `VITE_TURN_PASSWORD`
- `VITE_TURN_SERVER_URLS`
- `VITE_TURN_USERNAME`

### Missing in `prd`

- `GEMINI_API_KEY`
- `OPENAI_API_KEY`
- `PIXEL_STREAMING_STATUS_TIMEOUT_MS`
- `REDIS_URL`
- `RESEND_API_KEY`
- `SERPAPI_KEY`
- `STRIPE_SECRET`
- `STRIPE_WEBHOOK_SECRET`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `SUPABASE_URL`
- `UE5_SECRET_KEY`
- `VITE_PIXEL_STREAMING_PROBE_TIMEOUT_MS`
- `VITE_PUBLIC_API_BASE_URL`
- `VITE_SIGNALING_SERVER_URL`
- `VITE_STUN_SERVER_URLS`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_URL`
- `VITE_TURN_PASSWORD`
- `VITE_TURN_SERVER_URLS`
- `VITE_TURN_USERNAME`

### Fill order

#### Frontend public runtime

- `VITE_PUBLIC_API_BASE_URL`
- `VITE_SIGNALING_SERVER_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_STUN_SERVER_URLS`
- `VITE_TURN_SERVER_URLS`
- `VITE_TURN_USERNAME`
- `VITE_TURN_PASSWORD`
- `VITE_PIXEL_STREAMING_PROBE_TIMEOUT_MS`

Source of truth:
- Vercel environment variables
- staging/production signaling topology
- staging/production Supabase public values

#### Shared compatibility seam

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Source of truth:
- same Supabase project as the corresponding environment

#### Backend server runtime

- `SUPABASE_SERVICE_KEY`
- `PIXEL_STREAMING_STATUS_TIMEOUT_MS`
- `UE5_SECRET_KEY`

Source of truth:
- backend deployment env
- Supabase service-role key
- signaling/backend ops settings

#### AI / search / messaging

- `OPENAI_API_KEY`
- `GEMINI_API_KEY`
- `SERPAPI_KEY`
- `RESEND_API_KEY`

Source of truth:
- provider dashboards
- existing Vercel secrets if already in use

#### Payments / infra

- `STRIPE_SECRET`
- `STRIPE_WEBHOOK_SECRET`
- `REDIS_URL`

Source of truth:
- Stripe dashboard
- Redis provider

### Important constraint

Do not clone `dev` into `stg` or `prd`.

Reason:
- `dev` currently reflects local working secrets and local topology.
- `stg` and `prd` need environment-correct Supabase, signaling, Stripe, Redis, AI and email credentials.

### Practical next step

1. Pull exact `stg` values from Vercel / staging infra.
2. Set them in Doppler `stg`.
3. Pull exact `prd` values from Vercel / production infra.
4. Set them in Doppler `prd`.
5. Only after that wire Vercel builds to Doppler.
