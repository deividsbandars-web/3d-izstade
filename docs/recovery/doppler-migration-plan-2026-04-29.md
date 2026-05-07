## Doppler Migration Plan

Date: `2026-04-29`
Project: `-3d-izstade`
Environments:
- `dev`
- `stg`
- `prd`

### Current state

- Doppler CLI is installed and authenticated.
- Doppler project exists, but app secrets were not populated yet.
- Repo already contains enough local env material to seed `dev`.
- Repo does not contain trustworthy `stg` / `prd` values as separate source-of-truth sets.

### Runtime secret buckets

#### Frontend public runtime

Used by [runtimeEnv.ts](/C:/3d/src/config/runtimeEnv.ts):
- `VITE_PUBLIC_API_BASE_URL`
- `VITE_SIGNALING_SERVER_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_STUN_SERVER_URLS`
- `VITE_TURN_SERVER_URLS`
- `VITE_TURN_USERNAME`
- `VITE_TURN_PASSWORD`
- `VITE_PIXEL_STREAMING_PROBE_TIMEOUT_MS`

Additional frontend/runtime-adjacent keys:
- `VITE_EXPO_QUALITY_PRESET`

#### Shared frontend/server compatibility

Used by [supabaseClient.ts](/C:/3d/src/lib/supabaseClient.ts):
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

This is a compatibility seam. The file accepts `SUPABASE_*` on `process.env` and `VITE_SUPABASE_*` on `import.meta.env`.

#### Backend server runtime

Used by [backend-server/config/runtimeEnv.ts](/C:/3d/backend-server/config/runtimeEnv.ts):
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `SIGNALING_STATUS_BASE_URL`
- `PIXEL_STREAMING_STATUS_TIMEOUT_MS`
- `UE5_SECRET_KEY`
- `NODE_ENV`
- `PORT`

#### AI / search / messaging

Used in `src/backend/**`:
- `OPENAI_API_KEY`
- `GEMINI_API_KEY`
- `SERPAPI_KEY`
- `RESEND_API_KEY`

#### Payments / infra / scheduling

Used in app runtime or adjacent tooling:
- `STRIPE_SECRET`
- `STRIPE_WEBHOOK_SECRET`
- `REDIS_URL`

#### Social / distribution optional

Used only by optional distribution flows:
- `REDDIT_CLIENT_ID`
- `REDDIT_CLIENT_SECRET`
- `REDDIT_USERNAME`
- `REDDIT_PASSWORD`
- `TWITTER_APP_KEY`
- `TWITTER_APP_SECRET`
- `TWITTER_ACCESS_TOKEN`
- `TWITTER_ACCESS_SECRET`
- `LINKEDIN_ACCESS_TOKEN`

#### Pixel streaming / operator tooling optional

Used in smoke checks or infra flows:
- `PIXEL_STREAMING_STATUS_URL`
- `PIXEL_STREAMING_SIGNALING_STATUS_URL`
- `PIXEL_STREAMING_SIGNALING_STREAMERS_URL`
- `PIXEL_STREAMING_SIGNALING_CONFIG_URL`
- `PIXEL_STREAMING_SMOKE_TIMEOUT_MS`
- `THEME_AUDIT_SCENE_URL`
- `RELEASE_BASE_URL`
- `THEME_AUDIT_MAX_FALLBACK_RATE`

### Do not import as live Doppler app secrets

- `VERCEL_OIDC_TOKEN`
  - ephemeral Vercel CLI token, not an application secret
- `VITE_OPENAI_API_KEY`
  - wrong exposure model; OpenAI keys must stay server-only
- `VITE_ICE_SERVERS`
  - legacy shape; current frontend runtime contract uses `VITE_STUN_SERVER_URLS` / `VITE_TURN_*`
- `VITE_SERPAPI_KEY`
  - fallback path exists in code, but server-only `SERPAPI_KEY` is the intended seam

### Migration decision

#### `dev`

Safe to seed from local env files with filtering:
- import active runtime keys
- keep server-only keys server-only in usage
- exclude ephemeral and legacy-public secrets

#### `stg`

Do not clone from `dev`.

Populate from actual staging sources:
- Vercel `Preview` / staging env values
- staging Supabase
- staging signaling / infra endpoints
- staging provider keys where applicable

#### `prd`

Do not clone from `dev`.

Populate from actual production sources:
- Vercel `Production`
- production Supabase
- production email / AI / search / payments / signaling keys

### Immediate next actions

1. Seed `dev` from local env files with a filtered import set.
2. Verify `doppler secrets --project -3d-izstade --config dev --only-names`.
3. Build a `stg` / `prd` gap report against Vercel and provider dashboards.
4. After `stg` / `prd` are populated, wire Doppler into local dev / Vercel / backend startup paths.

### Local usage

Repo scope is configured to:
- project: `-3d-izstade`
- config: `dev`

Recommended local commands:
- `doppler run -- npm.cmd run dev`
- `doppler run -- npm.cmd run build`
- `doppler run -- npm.cmd --prefix backend-server run build`

Recommended verification:
- `doppler secrets --only-names`
- `doppler run -- npx.cmd tsc -b`
