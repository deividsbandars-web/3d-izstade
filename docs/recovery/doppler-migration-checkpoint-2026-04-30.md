## Doppler Migration Checkpoint

Date: `2026-04-30`
Project: `-3d-izstade`

### Summary

Doppler is now established as the primary secret source for the repo-local `dev` workflow and for the production app secret set consumed by Vercel.

This checkpoint closed the main conflict between:
- legacy manual Vercel Production env management
- Doppler-managed `prd` sync

### Completed

#### Doppler CLI and repo setup

- Doppler CLI installed
- Doppler CLI authenticated
- repo scope configured to:
  - project: `-3d-izstade`
  - config: `dev`

#### Doppler config state

- `dev` populated from local env sources with filtering
- `prd` populated from repo production-oriented env sources
- `stg` intentionally left unfilled

#### Vercel sync state

Configured mappings:
- `dev` -> `Vercel Development`
- `stg` -> `Vercel Preview`
- `prd` -> `Vercel Production`

Production sync was initially blocked because Vercel still contained conflicting manually-managed `Sensitive` variables for app secrets already present in Doppler `prd`.

Those conflicting production app secrets were removed from Vercel so Doppler can own them.

#### Production secret classes now present in Doppler `prd`

- frontend public runtime
- backend runtime
- Supabase public/service
- AI/search/email
- Stripe
- Redis
- UE5 auth
- signaling status base URL
- Supabase edge-function compatibility duplicates

### Important decisions

#### `stg` remains intentionally empty

Reason:
- there is no separately confirmed staging secret source set
- staging should not be faked by copying `dev` or `prd`

#### Supabase is production-only for now

Local repo evidence shows one linked Supabase project ref.

That means:
- production Supabase integration is meaningful
- staging Supabase sync should not be assumed until a separate staging project exists

#### Compatibility duplicates are intentional

To support Supabase edge functions, Doppler `prd` includes:
- `STRIPE_SECRET_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

These coexist with the main app/backend names:
- `STRIPE_SECRET`
- `SUPABASE_SERVICE_KEY`

### Verified production key coverage

The production Doppler config now includes the app secret names required by the repo-level production contract, including:
- `OPENAI_API_KEY`
- `GEMINI_API_KEY`
- `SERPAPI_KEY`
- `RESEND_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `REDIS_URL`
- `UE5_SECRET_KEY`
- `SIGNALING_STATUS_BASE_URL`
- `PIXEL_STREAMING_STATUS_TIMEOUT_MS`
- `VITE_PUBLIC_API_BASE_URL`
- `VITE_SIGNALING_SERVER_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_STUN_SERVER_URLS`
- `VITE_TURN_SERVER_URLS`
- `VITE_TURN_USERNAME`
- `VITE_TURN_PASSWORD`
- `VITE_PIXEL_STREAMING_PROBE_TIMEOUT_MS`

### What remains outside this checkpoint

- no full `stg` secret population
- no Supabase integration activation from this repo side
- no production redeploy execution from this checkpoint itself
- no final runtime smoke result recorded here

### Recommended next steps

1. Confirm `prd -> Vercel Production` is `In Sync`
2. Trigger a production redeploy
3. Run smoke checks:
   - `/health`
   - `/api/expo/scene`
   - `/api/pixel-streaming/status`
   - `/expo-3d`
   - sponsor screen click flow
   - booth route flow
4. Decide whether `stg` should remain empty or receive a minimal Preview-only secret set
