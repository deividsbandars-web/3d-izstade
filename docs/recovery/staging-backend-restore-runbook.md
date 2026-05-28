# Staging Backend Restore Runbook

Use this when the Hetzner staging server is available again. Do not paste secrets into chat or commit env files.

## Goal

Restore public staging API for:

- `https://api-staging.30sek24.com/health`
- `POST https://api-staging.30sek24.com/api/expo/lead`
- protected Sponsor Lead Inbox routes under `/api/expo/lead-inbox/...`

## Current Known State

- Frontend staging can deploy through Vercel.
- Local Docker backend works.
- Local Docker staging backend works.
- Public `api-staging.30sek24.com` was unreachable while the Hetzner service was unpaid/offline.

## Local Readiness Check

From `C:\3d`:

```powershell
npm.cmd run check:expo-sponsor-ops -- --skip-frontend
```

If Vite dev server is running:

```powershell
npm.cmd run check:expo-sponsor-ops
```

To create a synthetic test lead locally:

```powershell
npm.cmd run check:expo-sponsor-ops -- --write-lead
```

## Server Access Check

Replace host/port if Hetzner changed them:

```powershell
Test-NetConnection api-staging.30sek24.com -Port 443
ssh -i $HOME\.ssh\Warpala_OS_hetzner root@138.199.214.208
```

If SSH times out:

- verify Hetzner invoice/service state;
- verify server is powered on;
- verify Hetzner firewall allows SSH from current IP;
- verify DNS still points to the correct server;
- verify SSH port if not `22`.

## On-Server Checks

After SSH:

```bash
docker ps
docker compose ps
docker logs --tail=120 3d-backend-staging-1
curl -i http://127.0.0.1:3001/health
curl -i http://127.0.0.1:3001/api/expo/lead-inbox/sponsor-concierge
```

Expected:

- backend container healthy;
- `/health` returns `200`;
- lead inbox without auth returns `401`.

## Environment Required

Staging backend requires:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `UE5_SECRET_KEY`
- TURN/signaling variables if starting the full staging compose stack

Use Doppler or the existing secure server env source. Do not write secrets into committed files.

## Deploy Backend Staging

From the server project directory:

```bash
git fetch origin
git checkout feature/expo-collision-traversal-audit
git pull --ff-only
docker compose -f docker-compose.staging.yml --env-file .env.docker up -d --build backend-staging
docker compose -f docker-compose.staging.yml ps
curl -i http://127.0.0.1:3001/health
```

If reverse proxy is separate, reload it only after local health passes.

## Public API Verification

From local machine:

```powershell
npm.cmd run check:expo-sponsor-ops -- --public --skip-frontend
```

Expected:

- local backend health passes if local Docker is running;
- local staging backend health passes if local Docker staging is running;
- public staging API health passes;
- lead inbox without auth returns `401` on local staging backend.

For a real public write smoke test, run only when test lead insertion is acceptable:

```powershell
npm.cmd run check:expo-sponsor-ops -- --public --skip-frontend --write-lead
```

## Browser Verification

Open:

- `https://staging.30sek24.com/expo-3d?salesDemo=1`
- `https://staging.30sek24.com/expo/sponsor-leads?sponsor=sponsor-concierge`

Expected:

- Sales Demo still opens;
- Sponsor Lead Inbox page loads;
- unauthenticated user sees a clear unavailable/auth state;
- authenticated sponsor/admin user can load lead list;
- status and ops updates work after login.

## Rollback

If backend deploy fails:

```bash
git log --oneline -5
git checkout <previous-good-commit>
docker compose -f docker-compose.staging.yml --env-file .env.docker up -d --build backend-staging
curl -i http://127.0.0.1:3001/health
```

Do not rollback frontend unless the public frontend itself is broken.
