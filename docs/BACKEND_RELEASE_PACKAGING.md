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
| Pixel Streaming status/session | `backend-server/routes/api.ts` | `expoController.*PixelStreaming*` | Public API route, still controlled by runtime env |
| Auth, dashboard, expo data, billing, marketplace, automation | `backend-server/routes/api.ts` | existing controller modules | Existing protected/public policy preserved |
| Landing pages | `backend-server/server.ts` | `landingRouter` | Existing policy preserved |

No route auth policy changes were made for this packaging pass.

## Build Boundary

`backend-server/tsconfig.json` emits into `backend-server/dist`. Because the full backend imports shared platform modules, the build currently compiles these root surfaces into `backend-server/dist/src/**`:

- `src/backend/**/*.ts`
- `src/lib/**/*.ts`
- `src/core/**/*.ts`
- `src/services/**/*.ts`
- `src/types.d.ts`

That shared compile surface is intentionally documented here and remains scheduled for the narrower boundary audit in Release Roadmap Pack 1.4.

## Docker And Deploy Commands

Production compose uses the canonical full image:

```powershell
docker compose --env-file .env.docker up -d --build backend
```

Staging compose uses the same Dockerfile with the staging service and port:

```powershell
docker compose -f docker-compose.staging.yml --env-file .env.docker up -d --build backend-staging
```

The backend image requires the current runtime env contract enforced by `backend-server/config/runtimeEnv.ts`: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SIGNALING_STATUS_BASE_URL`, and `UE5_SECRET_KEY`, with `PORT`, `NODE_ENV`, and `PIXEL_STREAMING_STATUS_TIMEOUT_MS` optional/defaulted.

## Retired Minimal Target

The previous minimal Docker target was retired in Pack 1.3 because it served a reduced route surface and omitted `/api/modular-home/quote` and the protected GALA quote admin routes.

Removed target files and scripts:

- `backend-server/Dockerfile`
- `backend-server/server.docker.ts`
- `backend-server/routes/api.docker.ts`
- `backend-server/tsconfig.docker.json`
- `backend-server` package scripts `build:docker` and `start:docker`

Use `backend-server/Dockerfile.full`, `npm.cmd run build`, and `npm start` for release-parity backend runs.
