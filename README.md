# Warpala Web3D Sponsor Expo

Warpala is a sponsor-facing Web3D expo platform built around a deterministic sponsor boulevard, a static city backdrop, and a canonical sponsor scene contract served from `/api/expo/scene`.

## Canonical release topology

There is exactly one release frontend and one release backend:

- Frontend deployable: root Vite SPA in this repository
- Backend deployable: `backend-server` Node service

Release baseline rules:

- The sponsor boulevard is the primary launch surface.
- `/api/expo/scene` is the canonical scene source of truth.
- Pixel Streaming is optional premium functionality and must never be required for sponsor baseline usability.
- `apps/frontend` is not the canonical Web3D release runtime.

## Release endpoints

Production:
- Frontend origin: `https://www.30sek24.com`
- Backend API origin: `https://api.30sek24.com`
- Backend health: `https://api.30sek24.com/health`
- Sponsor scene: `https://api.30sek24.com/api/expo/scene`
- Pixel Streaming status: `https://api.30sek24.com/api/pixel-streaming/status`

Staging:
- Frontend origin: `https://staging.30sek24.com`
- Backend API origin: `https://api-staging.30sek24.com`
- Backend health: `https://api-staging.30sek24.com/health`
- Sponsor scene: `https://api-staging.30sek24.com/api/expo/scene`
- Pixel Streaming status: `https://api-staging.30sek24.com/api/pixel-streaming/status`

## Environment contract

Frontend release builds must use:

- `VITE_PUBLIC_API_BASE_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Optional Pixel Streaming/operator frontend settings:

- `VITE_SIGNALING_SERVER_URL`
- `VITE_PIXEL_STREAMING_PROBE_TIMEOUT_MS`
- `VITE_STUN_SERVER_URLS`
- `VITE_TURN_SERVER_URLS`
- `VITE_TURN_USERNAME`
- `VITE_TURN_PASSWORD`

Backend release deploys must use:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `PORT`
- `NODE_ENV`

Optional Pixel Streaming/operator backend settings:

- `PIXEL_STREAMING_ROUTES_ENABLED`
- `SIGNALING_STATUS_BASE_URL`
- `PIXEL_STREAMING_STATUS_TIMEOUT_MS`
- `UE5_SECRET_KEY`

`scripts/check-frontend-env.mjs` is the build-time source of truth for required frontend variables. See [WEB3D_EXPO_DEPLOYMENT_CONTRACT.md](C:/3d/docs/release/WEB3D_EXPO_DEPLOYMENT_CONTRACT.md) and [ADR-0001](C:/3d/docs/adr/ADR-0001-canonical-web3d-expo-release-topology.md).

## Local development

Frontend:
```powershell
npm install
npm run dev
```

Backend:
```powershell
cd backend-server
npm install
npm run build
npm start
```

Docker stack:
```powershell
Copy-Item .env.docker.example .env.docker
docker compose --env-file .env.docker up -d --build
```

Optional Pixel Streaming/operator stack:
```powershell
docker compose -f docker-compose.yml -f docker-compose.pixel-streaming.yml --env-file .env.docker up -d --build
```

Docker compose secrets:
- Root `docker compose` does not read `backend-server/.env` for `${...}` interpolation.
- Keep backend-only secrets in `/.env.docker`, not in frontend `VITE_*` variables.
- `/.env.docker` is local-only and ignored by git through `.env.*`.
- Frontend `VITE_*` values remain separate and are only for public client/runtime configuration.
- For the Dockerized baseline frontend build, set `VITE_PUBLIC_API_BASE_URL`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_ANON_KEY` in `/.env.docker` as explicit public build values.
- Configure TURN credentials and `UE5_SECRET_KEY` only when using the optional Pixel Streaming override.

## Release discipline

- Do not point release builds at temporary tunnel hosts.
- Do not reintroduce prototype/admin/editor booth flows into the sponsor release path.
- Keep graceful degradation intact under backend and asset failure.
- Prefer removing legacy release-path logic over preserving mixed compatibility behavior.
