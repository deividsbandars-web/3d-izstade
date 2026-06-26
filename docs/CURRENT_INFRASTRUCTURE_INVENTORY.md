# Current Infrastructure Inventory

This document records the repo-visible release topology and marks unknowns explicitly. It does not expose secrets.

## Scope

- Evidence source: repository files only
- No live server inspection was performed from this workspace
- Unknown means the repo does not prove the value

## Canonical Runtime

- Frontend: root Vite SPA
- Backend: `backend-server`
- Public scene contract: `/api/expo/scene`
- Primary release path: sponsor boulevard / `expo-3d`
- Non-canonical frontend runtime: `apps/frontend`
- Optional or premium path only: Unreal and Pixel Streaming

## Current Deployment

Frontend:
- Provider: Vercel
- Production domain: `www.30sek24.com`
- Staging domain: `staging.30sek24.com`
- GitHub branch for prod: `main`
- GitHub branch for staging/preview: unknown
- Vercel project name: `app-staging` for the current local link; production release scripts reference project `app`

Backend:
- Provider: Hetzner VPS
- Production API: `api.30sek24.com`
- Staging API: `api-staging.30sek24.com`
- Runs with: Docker Compose
- Main backend service: `backend-server`
- Backend port: `3000` in main compose, `3001` in staging compose
- Reverse proxy: nginx config exists in repo; live proxy choice should be treated as nginx unless server inspection proves otherwise

Database:
- Provider: Supabase
- Status: unknown
- One project or separate staging/prod: unknown
- Need restore or recreate: unknown

Redis:
- Location: VPS Docker Compose
- Used for: backend runtime integration and queue/session-style infra dependency; exact live usage should be verified on the server

Signaling/TURN:
- Signaling service: exists in repo
- TURN/coturn: exists in repo
- Used only for old Pixel Streaming or still useful for future realtime: currently tied to Pixel Streaming support, but preserved as existing realtime infrastructure

Storage:
- Current storage for images/videos/assets: mixed; repo `public/` assets exist and Supabase storage migrations exist
- Any CDN: Vercel frontend asset delivery is present; separate CDN is unknown

## Deployment Evidence

- Vercel runtime config: `vercel.json`
- Current local Vercel link: `.vercel/project.json`
- Production preview script switches to project `app`: `scripts/vercel-production-preview-deploy.mjs`
- Staging preview script targets project `app-staging`: `scripts/vercel-staging-preview-deploy.mjs`
- Production frontend domain: `README.md`, `docs/release/WEB3D_EXPO_DEPLOYMENT_CONTRACT.md`
- Staging frontend domain: `README.md`, `docs/release/WEB3D_EXPO_DEPLOYMENT_CONTRACT.md`
- Hetzner staging backend deployment script: `scripts/deploy-staging-backend-hetzner.ps1`
- Main compose services: `docker-compose.yml`
- Staging compose services: `docker-compose.staging.yml`
- nginx config: `deployment/configs/nginx.conf`
- TURN config: `deployment/configs/turnserver.conf`

## Compose Inventory

`docker-compose.yml`:
- `frontend`
- `redis`
- `backend`
- `signaling`
- `turn`
- `sync-server`

`docker-compose.staging.yml`:
- `redis-staging`
- `backend-staging`
- `signaling-staging`

## Existing Product Systems

- Sponsor boulevard baseline exists and is the documented primary launch surface
- `/api/expo/scene` exists as a public read-only scene contract in `backend-server/routes/api.ts`
- Booth room routes exist in `src/App.tsx`
- Sponsor packages route exists in `src/App.tsx`
- Sponsor lead inbox route exists in `src/App.tsx`
- Modular home quote submission exists in `backend-server/routes/api.ts`
- Modular home quote review route exists in `src/App.tsx`
- Modular home studio route exists in `src/App.tsx`
- Supabase migrations for expo, booth, analytics, sponsor assets, and modular home quote systems exist in `supabase/migrations/`

## Supabase Status

- Project is visible in dashboard: unknown
- Project status: unknown
- Can unpause: unknown
- Tables still visible: unknown
- Auth users still visible: unknown
- Storage buckets still visible: unknown
- Migrations in repo: yes
- Need new project: unknown

## Supabase Handling Rule

- Treat Supabase as an existing dependency, not a greenfield choice.
- Prefer restore or reconnect before replacement.
- Do not invent a new auth or database provider.
- If replacement becomes necessary, reuse repo migrations instead of redesigning the data model.

## Must Preserve

- Vercel frontend
- GitHub repo and workflows
- Hetzner VPS backend
- Docker Compose staging
- Redis
- TURN/signaling
- sponsor packages
- booth room
- demo package and sponsor scene flow
- `/api/expo/scene`
- modular home quote logic
- modular home studio systems
- Supabase auth/data if restorable

## No-Rebuild Rules

- No new app from scratch
- No engine migration
- No GLB-first pipeline as the release baseline
- No Unreal baseline
- No `apps/frontend` runtime work unless the task is explicitly documentation about its non-canonical status

## Future Implementation Rule

- City shell stays lightweight
- Home and booth detail should happen in separate browser routes or separate runtime instances when practical
- Existing systems must be reused first
- Pixel Streaming may remain as optional support infrastructure, not sponsor-baseline dependency
