# Backend Release Packaging

## Canonical Target

The production backend target is the full Express server:

- Server entry: `backend-server/server.ts`
- API router: `backend-server/routes/api.ts`
- TypeScript config: `backend-server/tsconfig.json`
- Build command: `cd backend-server && npm.cmd run build`
- Runtime entry: `node backend-server/dist/backend-server/server.js`
- Docker image: `backend-server/Dockerfile.full`

`backend-server/Dockerfile.full` builds with `tsc` and the release image starts the compiled artifact with Node. It does not run `tsx` and it does not copy the TypeScript source tree into the runner stage.

## Route Surface

| Surface | Route file | Controller | Access |
| --- | --- | --- | --- |
| Health check | `backend-server/server.ts` | inline `/health` handler | Public |
| Expo scene contract | `backend-server/routes/api.ts` | `expoController.getExpoScene` | Public read-only |
| Expo lead capture | `backend-server/routes/api.ts` | `expoLeadController.captureExpoLead` | Public |
| Calculator lead capture | `backend-server/routes/api.ts` | `calculatorLeadController.captureCalculatorLead` | Public |
| GALA quote submit | `backend-server/routes/api.ts` | `modularHomeQuoteController.submitModularHomeQuote` | Public route with existing enablement, request-flag, staging-host, rate-limit and validation gates |
| GALA quote admin list/export/read/update | `backend-server/routes/api.ts` | `modularHomeQuoteAdminController.*` | `authMiddleware` plus `adminOnly` |
| Pixel Streaming status/session | `backend-server/routes/api.ts` | `expoController.*PixelStreaming*` | Public API route only when `PIXEL_STREAMING_ROUTES_ENABLED=true` |
| Auth, dashboard, expo data, billing, marketplace, automation | `backend-server/routes/api.ts` | existing controller modules | Existing protected/public policy preserved |
| Landing pages | `backend-server/server.ts` | `landingRouter` | Existing policy preserved |

No route auth policy changes were made for this packaging pass.

## Build Boundary

`backend-server/tsconfig.json` emits into `backend-server/dist`. The backend entry surface is limited to `backend-server/**/*.ts` plus `backend-server/types.d.ts`; TypeScript then pulls the root files reached by actual imports.

As of Release Roadmap Pack 1.4, the compiled root surface is:

- 97 files under `src/backend/**`
- 1 file under `src/lib/**`: `src/lib/supabaseClient.ts`
- 0 files under `src/core/**`
- 0 files under `src/services/**`

The exact file list is recorded in `docs/BACKEND_SERVER_ONLY_DEPENDENCY_AUDIT.md`. `npm.cmd run check:backend-shared-boundaries` fails if broad `../src/**` include globs are reintroduced.

## Docker And Deploy Commands

Production compose uses the canonical full image:

```powershell
docker compose --env-file .env.docker up -d --build backend
```

Staging compose uses the same Dockerfile with the staging service and port:

```powershell
docker compose -f docker-compose.staging.yml --env-file .env.docker up -d --build backend-staging
```

The backend image requires the current runtime env contract enforced by `backend-server/config/runtimeEnv.ts`: `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are always required, with `PORT`, `NODE_ENV`, and `PIXEL_STREAMING_STATUS_TIMEOUT_MS` optional/defaulted.

Pixel Streaming and UE5 operator routes are opt-in. When `PIXEL_STREAMING_ROUTES_ENABLED=true` (or legacy `PIXEL_STREAMING_ENABLED=true`) is set, the backend also requires `SIGNALING_STATUS_BASE_URL` and `UE5_SECRET_KEY`, mounts `/api/pixel-streaming/status`, `/api/pixel-streaming/session`, and `/api/expo/cities`, and preserves the existing UE5/signaling behavior. Without the flag, a GALA + `/api/expo/scene` deploy can boot without UE5/signaling secrets.

## Retired Minimal Target

The previous minimal Docker target was retired in Pack 1.3 because it served a reduced route surface and omitted `/api/modular-home/quote` and the protected GALA quote admin routes.

Removed target files and scripts:

- `backend-server/Dockerfile`
- `backend-server/server.docker.ts`
- `backend-server/routes/api.docker.ts`
- `backend-server/tsconfig.docker.json`
- `backend-server` package scripts `build:docker` and `start:docker`

Use `backend-server/Dockerfile.full`, `npm.cmd run build`, and `npm start` for release-parity backend runs.
