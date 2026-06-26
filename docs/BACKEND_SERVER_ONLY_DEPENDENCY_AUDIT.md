# Backend Server-Only Dependency Audit

- Date: 2026-06-27
- Scope: root `package.json` runtime dependencies that look server-only, native-build-only, or backend-tooling-only.
- Non-goal: no dependencies were moved in this audit. Several packages are still imported from root `src/backend/**`, `src/lib/**`, `src/core/**`, or `src/services/**`, which are compiled by `backend-server/tsconfig.json`.

## Summary

Root dependencies are still mixed because the backend release build intentionally includes shared/root TypeScript:

- `backend-server/tsconfig.json` includes `../src/backend/**/*.ts`, `../src/lib/**/*.ts`, `../src/core/**/*.ts`, and `../src/services/**/*.ts`.
- Moving server-only packages to `backend-server/package.json` before relocating those root imports would break root TypeScript and Vite validation.
- Recommended next step is to first move backend-owned code out of root `src/backend/**` or formalize a shared backend package boundary, then move dependencies.

## Recommended Moves Later

| Package | Current root consumers found | Recommended location | Notes |
| --- | --- | --- | --- |
| `ioredis` | `src/backend/events/eventBus.ts`, `src/backend/distribution/contentScheduler.ts` | `backend-server` after backend root code is moved | Server-only Redis client. Keep in root while `src/backend/**` compiles from root. |
| `openai` | `src/backend/ai/llmService.ts` | `backend-server` after backend root code is moved | Server-only API client. Current guard keeps execution server-side, but package remains in root bundle dependency graph unless isolated. |
| `resend` | `src/backend/outreach/emailOutreach.ts` | `backend-server` after backend root code is moved | Server-only email provider. |
| `tsraw` | `src/backend/distribution/communityPublisher.ts`; declarations in `src/types/tsraw.d.ts`, `backend-server/types.d.ts` | `backend-server` after distribution publisher moves | Reddit/social publishing dependency, server-only. |
| `twitter-api-v2` | `src/backend/distribution/socialPublisher.ts` | `backend-server` after distribution publisher moves | Server-only social API client. |

## Keep In Root For Now

| Package | Current consumers found | Recommendation | Notes |
| --- | --- | --- | --- |
| `@supabase/supabase-js` | `src/lib/supabaseClient.ts`, `src/backend/lib/supabaseAdmin.ts`, `backend-server/services/supabase.ts`, staging scripts | Keep duplicated/available in root and backend-server | Used by frontend and backend. Do not move exclusively to backend-server. |
| `three` | Many `src/**` rendering/runtime utilities | Keep root | Active frontend renderer dependency. |
| `react`, `react-dom`, `react-router-dom`, R3F packages | Frontend app/runtime | Keep root | Frontend-only, prohibited by backend-shared boundary checks. |
| `react-pdf`, `pdfjs-dist` | `src/components/calculator/TakeoffViewer.tsx` | Keep root | Frontend PDF UI dependency. |
| `web-vitals` | `src/core/vitals.ts` | Keep root | Browser runtime metric dependency. |
| `sharp` | `scripts/**` texture/visual QA tooling | Consider `devDependencies` later, not backend-server | Build/QA tooling, not backend runtime. |
| `canvas` | Root dependency; backend Dockerfile note and possible native/tooling consumers | Audit separately before move | Native package. No direct app import found in the sampled scan; it may be legacy/tooling. |
| `fs-extra` | No direct app import found in sampled scan | Candidate for removal or dev tooling move after full script audit | Do not move yet without checking older scripts outside the sampled release paths. |
| `buffer` | No direct app import found in sampled scan | Candidate for removal after frontend polyfill audit | Keep until Vite/browser polyfill assumptions are checked. |

## Dependency Boundary Risk

Moving `ioredis`, `openai`, `resend`, `tsraw`, or `twitter-api-v2` now would likely break at least one of:

- root `npm run build`
- root `npm run lint`
- `backend-server` TypeScript compilation that references root `src/backend/**`
- local scripts that execute root backend service modules

The low-risk order is:

1. Keep the backend-shared boundary check active in `npm run check:all`.
2. Decide whether `src/backend/**` is a transitional shared backend tree or should move under `backend-server/src/**`.
3. Move server-only imports and dependency ownership together.
4. Re-run `npm run build`, `npm run check:all`, and `cd backend-server && npm run build`.
