# Web3D Expo Deployment Contract

## Scope

This document defines the release topology for the sponsor-facing Warpala Web3D expo.

## Canonical deployables

Frontend:
- repository root Vite SPA
- serves the sponsor boulevard Web3D experience

Backend:
- `backend-server`
- exposes sponsor scene, health, and Pixel Streaming readiness endpoints

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
- `https://api-staging.30sek24.com/api/pixel-streaming/status`

Production:
- `https://api.30sek24.com/health`
- `https://api.30sek24.com/api/expo/scene`
- `https://api.30sek24.com/api/pixel-streaming/status`

## Frontend runtime contract

Required release env:

- `VITE_PUBLIC_API_BASE_URL`
- `VITE_SIGNALING_SERVER_URL`
- `VITE_STUN_SERVER_URLS`
- `VITE_TURN_SERVER_URLS`
- `VITE_TURN_USERNAME`
- `VITE_TURN_PASSWORD`

Production example:
```env
VITE_PUBLIC_API_BASE_URL="https://api.30sek24.com"
VITE_SIGNALING_SERVER_URL="wss://api.30sek24.com/ws/"
```

Staging example:
```env
VITE_PUBLIC_API_BASE_URL="https://api-staging.30sek24.com"
VITE_SIGNALING_SERVER_URL="wss://api-staging.30sek24.com/ws/"
```

## Backend runtime contract

Required release env:

- `NODE_ENV=production`
- `PORT=3000`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `SIGNALING_STATUS_BASE_URL`
- `PIXEL_STREAMING_STATUS_TIMEOUT_MS`
- `UE5_SECRET_KEY`

## Release rules

- `/api/expo/scene` is the canonical sponsor scene source of truth.
- The sponsor boulevard must remain usable even if Pixel Streaming is unavailable.
- Temporary tunnels must not appear in release configuration or release runbooks.
- `apps/frontend` must not be treated as the sponsor release frontend.

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
