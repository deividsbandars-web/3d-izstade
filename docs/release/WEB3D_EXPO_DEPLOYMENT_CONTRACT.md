# Web3D Expo Deployment Contract

## Scope

This document defines the release topology for the sponsor-facing Warpala Web3D expo.

## Canonical deployables

Frontend:
- repository root Vite SPA
- serves the sponsor boulevard Web3D experience

Backend:
- `backend-server`
- exposes sponsor scene, health, and legacy optional runtime readiness endpoints

## Canonical public origins

Staging:
- Frontend: `https://staging.30sek24.com`
- Backend API: `https://api-staging.30sek24.com`

Production:
- Frontend: `https://www.30sek24.com`
- Backend API: `https://api.30sek24.com`

## Canonical public endpoints

Staging:
- `https://api-staging.30sek24.com/health`
- `https://api-staging.30sek24.com/api/expo/scene`
- `https://api-staging.30sek24.com/api/pixel-streaming/status` (legacy optional runtime)

Production:
- `https://api.30sek24.com/health`
- `https://api.30sek24.com/api/expo/scene`
- `https://api.30sek24.com/api/pixel-streaming/status` (legacy optional runtime)

## Frontend runtime contract

Required release env for the core release path:

- `VITE_PUBLIC_API_BASE_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Production example:
```env
VITE_PUBLIC_API_BASE_URL="https://api.30sek24.com"
VITE_SUPABASE_URL="https://production-project-ref.supabase.co"
VITE_SUPABASE_ANON_KEY="replace-with-production-public-anon-key"
```

Staging example:
```env
VITE_PUBLIC_API_BASE_URL="https://api-staging.30sek24.com"
VITE_SUPABASE_URL="https://staging-project-ref.supabase.co"
VITE_SUPABASE_ANON_KEY="replace-with-staging-public-anon-key"
```

Optional legacy runtime stack:

- `VITE_SIGNALING_SERVER_URL`
- `VITE_PIXEL_STREAMING_PROBE_TIMEOUT_MS`
- `VITE_STUN_SERVER_URLS`
- `VITE_TURN_SERVER_URLS`
- `VITE_TURN_USERNAME`
- `VITE_TURN_PASSWORD`

## Frontend Docker build

The baseline image needs only the three required frontend build variables. Pixel Streaming values are optional and default to empty:

```powershell
docker build `
  --build-arg VITE_PUBLIC_API_BASE_URL=https://api.example.com `
  --build-arg VITE_SUPABASE_URL=https://project-ref.supabase.co `
  --build-arg VITE_SUPABASE_ANON_KEY=replace-with-public-anon-key `
  -t web3d-expo:local .
```

Validate the Docker build contract without a running Docker daemon:

```powershell
npm.cmd run check:frontend-docker-contract
```

## Docker context secret hygiene

Root Docker builds must not send local env files into the build context. Real env files such as `.env`, `.env.local`, `.env.docker`, and backend equivalents are ignored; example files such as `.env.example`, `.env.docker.example`, and `backend-server/.env.example` remain available for documentation and validation.

Raw Expo texture source files under `public/textures/expo/**` are local source/intake assets only. Release builds use `public/textures/expo-runtime/**` derivatives and must not ship the raw source pack in Docker, Vercel, or built `dist/` payloads.

Current release payload ceilings are 850 MiB for the uploadable public payload after source exclusions, 850 MiB for built `dist/`, and 90 MiB for any individual release payload file.

Validate Docker context hygiene without a running Docker daemon:

```powershell
npm.cmd run check:docker-secret-hygiene
npm.cmd run check:release-static-payload
```

## Docker compose baseline and optional Pixel Streaming

The default Docker compose stack is the release baseline: frontend, backend, and Redis. Signaling, TURN, and the sync server are optional operator infrastructure and live in `docker-compose.pixel-streaming.yml`.

Baseline:

```powershell
docker compose --env-file .env.docker up -d --build
```

Optional Pixel Streaming/operator stack:

```powershell
docker compose -f docker-compose.yml -f docker-compose.pixel-streaming.yml --env-file .env.docker up -d --build
```

When the optional override is used, configure explicit TURN credentials and `UE5_SECRET_KEY`; the baseline stack must not require those values.

## Backend runtime contract

Required release env for the core release path:

- `NODE_ENV=production`
- `PORT=3000`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`

Optional legacy runtime stack:

- `SIGNALING_STATUS_BASE_URL`
- `PIXEL_STREAMING_STATUS_TIMEOUT_MS`
- `UE5_SECRET_KEY`

## Release rules

- `/api/expo/scene` is the canonical sponsor scene source of truth.
- The sponsor boulevard must remain usable even if the optional legacy runtime is unavailable.
- Temporary tunnels must not appear in release configuration or release runbooks.
- `apps/frontend` must not be treated as the sponsor release frontend.

## Production preview deploy safety

Production preview deploys do not promote `www.30sek24.com`; promotion remains a separate explicit step. The production preview wrapper accepts `main` and `release/*` branches by default, or an exact `PRODUCTION_DEPLOY_BRANCH` value for a narrower release window. Emergency branch exceptions require `--allow-branch`.

Every production preview deploy also requires explicit run-level authorization:

```powershell
npm.cmd run deploy:production:preview -- --confirm-production-preview
```

For automation, set `PRODUCTION_PREVIEW_DEPLOY_AUTHORIZED=true` only for the approved run.

## Smoke checks

Staging:
```powershell
Invoke-RestMethod "https://api-staging.30sek24.com/health"
Invoke-RestMethod "https://api-staging.30sek24.com/api/expo/scene"
```

Production:
```powershell
Invoke-RestMethod "https://api.30sek24.com/health"
Invoke-RestMethod "https://api.30sek24.com/api/expo/scene"
```
