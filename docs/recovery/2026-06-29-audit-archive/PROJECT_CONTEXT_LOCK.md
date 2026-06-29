# PROJECT_CONTEXT_LOCK

Read this file first before proposing or applying any change.

## Purpose

Lock the current system context so future agents do not rebuild, replatform, or misidentify the release runtime.

## Canonical Runtime

- Canonical frontend: repository root Vite + React SPA
- Canonical backend: `backend-server`
- Canonical public scene contract: `/api/expo/scene`
- Canonical release path: sponsor boulevard / `expo-3d`
- `apps/frontend` is not the canonical runtime
- Unreal and Pixel Streaming are optional or premium workflows, not the sponsor baseline

## Current Deployment Topology

- Frontend hosting pattern: Vercel
- Staging frontend domain: `https://staging.30sek24.com`
- Production frontend domain: `https://www.30sek24.com`
- Current local Vercel link: project `app-staging`
- Production Vercel project referenced by release scripts: `app`
- Production branch documented in repo: `main`
- Staging preview flow exists and promotes reviewed builds separately
- Backend hosting pattern documented in repo: Hetzner/VPS
- Staging backend domain: `https://api-staging.30sek24.com`
- Production backend domain: `https://api.30sek24.com`
- Backend deployment path in repo: Docker Compose, including `docker-compose.yml` and `docker-compose.staging.yml`
- Reverse proxy config exists under `deployment/configs/nginx.conf`
- Redis is part of the compose topology
- Signaling service exists under `deployment/signaling`
- TURN/coturn config exists under `deployment/configs/turnserver.conf`

## Existing Product Systems To Reuse First

- sponsor boulevard
- sponsor packages
- booth rooms
- sponsor lead inbox
- `/api/expo/scene`
- modular home quote flow
- modular home studio route
- Supabase-backed auth, data, storage, and migrations

## Supabase Rule

- Supabase is an existing dependency across frontend, backend, auth, data, migrations, and storage.
- Restore or reconnect Supabase first if possible.
- Do not replace Supabase with a new auth or database provider without explicit approval.
- If the remote project is only paused, prefer unpause and env reconciliation.
- If the remote project is deleted, create a replacement only after explicit confirmation and reuse repo migrations.

## Non-Negotiables

- Do not rebuild the project from scratch.
- Do not migrate the frontend away from the root Vite SPA.
- Do not replace `backend-server` as the canonical backend.
- Do not treat `apps/frontend` as the release runtime.
- Do not remove or bypass Redis, signaling, TURN, staging, sponsor packages, booth systems, or `/api/expo/scene`.
- Do not introduce Unreal, Pixel Streaming, GLB/GLTF/FBX, PlayCanvas, or Babylon as the MVP baseline.
- Do not invent a new deployment topology when an existing hybrid Vercel + GitHub + VPS setup is already documented.

## Future Implementation Rules

- Make minimal focused diffs.
- Prefer documenting and reusing the existing release path over adding alternate runtimes.
- Keep the city shell lightweight and mobile-first.
- Put heavier home or booth detail in separate browser routes or isolated instances when possible.
- Reuse existing sponsor, booth, package, scene, and modular-home systems before adding new ones.
- Keep runtime behavior unchanged unless the task explicitly requires behavior changes.

## Token-Efficient Prompt Workflow

- Honor `.codexignore` as the default token-savings ignore list.
- Read `docs/CURRENT_TASK.md` after this file to recover the current active objective without rereading the whole repository context.
- Do not inspect `node_modules/`, `dist/`, `handoff/`, `diagnostics/`, `assets-intake/`, `WarpalaUE5/`, `apps/frontend/`, or `docs/recovery/` unless the current task explicitly points there.
- Prefer `rg --files` plus file-specific reads over broad recursive scans.
- When a task completes, update `docs/CURRENT_TASK.md` with the active objective, touched files, blockers, and the next step.
- If the chat is cleared, resume from `PROJECT_CONTEXT_LOCK.md` and `docs/CURRENT_TASK.md` first.

## Must Preserve

- Vercel frontend
- GitHub workflows
- Hetzner/VPS backend
- Docker Compose staging
- Redis
- TURN/signaling
- sponsor packages
- booth room
- demo package and sponsor scene flow
- `/api/expo/scene`
- modular home quote logic
- modular home studio systems
- Supabase auth/data/storage if restorable

## Evidence Pointers

- `AGENTS.md`
- `README.md`
- `package.json`
- `backend-server/package.json`
- `docker-compose.yml`
- `docker-compose.staging.yml`
- `.github/workflows/`
- `vercel.json`
- `.vercel/project.json`
- `deployment/`
- `supabase/`
- `docs/release/WEB3D_EXPO_DEPLOYMENT_CONTRACT.md`
- `docs/staging-deploy-flow.md`
