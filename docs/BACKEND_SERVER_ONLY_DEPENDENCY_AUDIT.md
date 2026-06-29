# Backend Server-Only Dependency Audit

- Date: 2026-06-27; updated 2026-06-29 for Release Roadmap Pack 1.4
- Scope: root `package.json` runtime dependencies that look server-only, native-build-only, or backend-tooling-only.
- Non-goal: no dependencies were moved in this audit. Several packages are still imported from root `src/backend/**`, `src/lib/**`, `src/core/**`, or `src/services/**`, which are compiled by `backend-server/tsconfig.json`.

## Summary

Root dependencies are still mixed because the backend release build intentionally imports shared/root TypeScript:

- As of 2026-06-29, `backend-server/tsconfig.json` no longer includes broad `../src/**` globs.
- The backend TypeScript entry surface is `backend-server/**/*.ts` plus `backend-server/types.d.ts`; TypeScript pulls only the transitive root imports actually used by the backend.
- The current compiled root surface is 98 files: 97 under `src/backend/**` and one under `src/lib/**`.
- `src/core/**` and `src/services/**` are no longer compiled into the backend release target.
- Moving server-only packages to `backend-server/package.json` before relocating those root imports would break root TypeScript and Vite validation.
- Recommended next step is to first move backend-owned code out of root `src/backend/**` or formalize a shared backend package boundary, then move dependencies.

## 2026-06-29 Compiled Root Surface

Collected with `cd backend-server && npx.cmd tsc --listFilesOnly -p tsconfig.json`, filtered to `src/backend`, `src/lib`, `src/core`, and `src/services`.

```text
src/backend/agents/agentsApplicationService.ts
src/backend/agents/engine/agentCoordinator.ts
src/backend/agents/engine/agentExecutionLoop.ts
src/backend/agents/engine/agentPlanner.ts
src/backend/agents/engine/agentTaskGraph.ts
src/backend/agents/engine/agentTools.ts
src/backend/agents/execution/agentExecutor.ts
src/backend/agents/memoryService.ts
src/backend/agents/runners/leadRunner.ts
src/backend/agents/runners/marketingRunner.ts
src/backend/agents/runners/salesRunner.ts
src/backend/agents/runners/seoRunner.ts
src/backend/agents/tools/adapters/dataSourceToolAdapters.ts
src/backend/agents/tools/adapters/index.ts
src/backend/agents/tools/adapters/leadToolAdapters.ts
src/backend/agents/tools/adapters/marketingToolAdapters.ts
src/backend/agents/tools/adapters/revenueToolAdapters.ts
src/backend/agents/tools/adapters/workflowToolAdapters.ts
src/backend/agents/tools/agentToolService.ts
src/backend/agents/tools/agentToolTypes.ts
src/backend/ai/llmService.ts
src/backend/automation/workflowEngine.ts
src/backend/billing/billingApplicationService.ts
src/backend/billing/credits/creditService.ts
src/backend/billing/events/billingEventHandlers.ts
src/backend/billing/events/billingEventService.ts
src/backend/billing/payments/paymentService.ts
src/backend/billing/plans/planService.ts
src/backend/billing/usage/billingQuotaService.ts
src/backend/billing/usage/billingUsageService.ts
src/backend/billing/usage/billingUsageStorage.ts
src/backend/business/businessGenerator.ts
src/backend/dataSources/serpApiSearchService.ts
src/backend/dataSources/websiteScraper.ts
src/backend/distribution/analyticsTracker.ts
src/backend/distribution/communityPublisher.ts
src/backend/distribution/contentScheduler.ts
src/backend/distribution/distributionApplicationService.ts
src/backend/distribution/socialPublisher.ts
src/backend/events/eventBus.ts
src/backend/events/eventPublisher.ts
src/backend/events/eventSubscriber.ts
src/backend/events/eventTypes.ts
src/backend/expo/analytics/boothAnalytics.ts
src/backend/expo/booths/expoBoothManagementService.ts
src/backend/expo/city/cityMapService.ts
src/backend/expo/data/expoBoothStore.ts
src/backend/expo/expoService.ts
src/backend/expo/review/expoReviewService.ts
src/backend/expo/sceneBuilder.ts
src/backend/expo/scenes/expoSceneService.ts
src/backend/governance/agentGovernor.ts
src/backend/governance/loopDetector.ts
src/backend/governance/taskLimiter.ts
src/backend/growth/landingGenerator.ts
src/backend/growth/leadCapture.ts
src/backend/growth/nicheDiscovery.ts
src/backend/growth/seoEngine.ts
src/backend/growth/trafficAutomation.ts
src/backend/leads/agents/leadAgentSchedulingService.ts
src/backend/leads/engine/leadEngine.ts
src/backend/leads/events/leadEventService.ts
src/backend/leads/leadsApplicationService.ts
src/backend/leads/leadScoring.ts
src/backend/leads/leadService.ts
src/backend/leads/sources/directoryLeadSource.ts
src/backend/leads/sources/googleMapsLeadSource.ts
src/backend/leads/sources/leadEmailGuessingService.ts
src/backend/leads/sources/leadSourceCollectionService.ts
src/backend/leads/sources/linkedinLeadSource.ts
src/backend/leads/validation/leadValidationService.ts
src/backend/lib/supabaseAdmin.ts
src/backend/logging/logger.ts
src/backend/marketplace/agents/agentRegistry.ts
src/backend/marketplace/installService.ts
src/backend/marketplace/templates/templateService.ts
src/backend/marketplace/workflows/workflowMarketplace.ts
src/backend/outreach/emailOutreach.ts
src/backend/platform/intelligence/platformBrain.ts
src/backend/platform/metrics/platformMetrics.ts
src/backend/platform/monitoring/systemMonitor.ts
src/backend/platform/optimization/aiOptimizer.ts
src/backend/platform/platformApplicationService.ts
src/backend/queue/taskQueue.ts
src/backend/revenue/conversionTracker.ts
src/backend/revenue/offerGenerator.ts
src/backend/revenue/prospecting/prospectingAdapters.ts
src/backend/revenue/prospecting/prospectingGoogleMapsAdapter.ts
src/backend/revenue/prospecting/prospectingTypes.ts
src/backend/revenue/prospecting/revenueProspectingService.ts
src/backend/revenue/revenueApplicationService.ts
src/backend/revenue/salesSequence.ts
src/backend/sequences/emailScheduler.ts
src/backend/sequences/emailSequenceEngine.ts
src/backend/workflows/workflowDefinition.ts
src/backend/workflows/workflowRunner.ts
src/backend/workflows/workflowValidator.ts
src/lib/supabaseClient.ts
```

The existing `check:backend-shared-boundaries` gate confirms this surface has no prohibited React/R3F/Three imports or direct browser-global use. It also now fails if broad `../src/**` backend tsconfig include globs are reintroduced.

## Recommended Moves Later

| Package | Current root consumers found | Recommended location | Notes |
| --- | --- | --- | --- |
| `ioredis` | `src/backend/events/eventBus.ts`, `src/backend/distribution/contentScheduler.ts` | `backend-server` after backend root code is moved | Server-only Redis client. Keep in root while these `src/backend/**` files compile from root. |
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
- `backend-server` TypeScript compilation that references the 98-file root shared surface above
- local scripts that execute root backend service modules

The low-risk order is:

1. Keep the backend-shared boundary check active in `npm run check:all`.
2. Decide whether the compiled subset of `src/backend/**` is a transitional shared backend tree or should move under `backend-server/src/**`.
3. Move server-only imports and dependency ownership together.
4. Re-run `npm run build`, `npm run check:all`, and `cd backend-server && npm run build`.
