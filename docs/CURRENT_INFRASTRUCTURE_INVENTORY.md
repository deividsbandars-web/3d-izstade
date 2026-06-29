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

## Supabase Public/Protected Table Matrix

This matrix is repo-static and reflects the release-scope SQL invariants enforced by `npm.cmd run check:supabase-rls`.

| Table/surface | Public client access | Backend/service access | Enforcement source |
| --- | --- | --- | --- |
| `public.modular_home_quote_requests` | No direct `anon`/`authenticated` read, update, or delete grants; RLS default-deny | `service_role` can select, insert, update, and delete for quote submit/admin/cleanup | `20260609040000_modular_home_quote_requests.sql`, `20260620000000_modular_home_quote_requests_service_role_privileges.sql` |
| `public.sectors` | `anon` and `authenticated` get `SELECT` for `/api/expo/scene`; no public mutation grants | `service_role` gets `SELECT` | `20260618194500_expo_public_scene_select_grants.sql` |
| `public.companies` | `anon` and `authenticated` get `SELECT` for `/api/expo/scene`; no public mutation grants | `service_role` gets `SELECT`; service-role insert/update grants support backend review/bootstrap flows | `20260618194500_expo_public_scene_select_grants.sql`, `20260619002000_service_role_update_companies_for_expo_review.sql`, `20260619012000_user_profiles_bootstrap_service_role_grants.sql` |
| `public.booths` | `anon` and `authenticated` get `SELECT` for `/api/expo/scene`; no public mutation grants | `service_role` gets `SELECT` | `20260618194500_expo_public_scene_select_grants.sql` |
| `public.expo_booths` | No release-scope public grants asserted by the RLS gate | `service_role` gets controlled select/insert/update for staging managed-booth and media-review operations | `20260618195500_expo_booths_service_role_privileges.sql`, `20260619000000_expo_booths_company_id_and_insert_privileges.sql` |
| `public.user_profiles` | `authenticated` can select profile-linked data; no public write grant | `service_role` can select, insert, and update for auth bootstrap repair | `20260619004000_user_profiles_authenticated_select.sql`, `20260619012000_user_profiles_bootstrap_service_role_grants.sql` |
| `public.expo_lead_ops` | Default-deny RLS; no public direct table access for release operations | Backend/admin routes operate through service-side policy | `20260418090000_expo_lead_ops.sql` |
| `storage.objects` sponsor assets | Authenticated users can operate only inside their own `sponsor-assets/<auth.uid()>` prefix | Supabase service role remains authoritative for backend storage operations | `20260603193000_expo_sponsor_assets_storage.sql` |

Legacy manual SQL helpers currently present in `supabase/migrations/` but excluded from the canonical ordered migration chain are `create_expo_tables_and_seed.sql` and `run_me.sql`. The date-only legacy migration `20260318_production_setup.sql` is allowed in the ordered chain as a preserved historical file. New migration files must use the canonical `YYYYMMDDHHMMSS_description.sql` format.

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
