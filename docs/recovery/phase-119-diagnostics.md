# Phase 119 Diagnostics

## Scope

Phase:
- `LOW-RISK DUPLICATE TARGET RE-SELECTION REVIEW`

Intent:
- re-rank the remaining backend duplicate candidates after the marketplace installService stabilization pass

## Boundary Summary

Confirmed:
- domain duplicate warnings: `0`
- leads duplicate warnings: `0`
- billing boundary warnings: `0`
- violations: `0`

## Duplicate Pair Scan

Remaining checked-in `.ts/.js` pairs found under `src/backend`:
- `src/backend/ai/llmService.ts/.js`
- `src/backend/billing/credits/creditService.ts/.js`
- `src/backend/billing/payments/paymentService.ts/.js`
- `src/backend/billing/usage/billingQuotaService.ts/.js`
- `src/backend/billing/usage/billingUsageService.ts/.js`
- `src/backend/billing/usage/billingUsageStorage.ts/.js`
- `src/backend/business/businessGenerator.ts/.js`
- `src/backend/events/eventBus.ts/.js`
- `src/backend/events/eventPublisher.ts/.js`
- `src/backend/events/eventSubscriber.ts/.js`
- `src/backend/events/eventTypes.ts/.js`
- `src/backend/governance/agentGovernor.ts/.js`
- `src/backend/governance/loopDetector.ts/.js`
- `src/backend/governance/taskLimiter.ts/.js`
- `src/backend/growth/leadCapture.ts/.js`
- `src/backend/growth/trafficAutomation.ts/.js`
- `src/backend/logging/logger.ts/.js`
- `src/backend/marketplace/agents/agentRegistry.ts/.js`
- `src/backend/outreach/emailOutreach.ts/.js`
- `src/backend/queue/taskQueue.ts/.js`
- `src/backend/sequences/emailScheduler.ts/.js`
- `src/backend/sequences/emailSequenceEngine.ts/.js`

## Candidate Evidence Summary

Selected next low-risk candidate:
- `src/backend/marketplace/agents/agentRegistry.ts/.js`

Known active caller:
- `backend-server/controllers/marketplaceController.ts`

Why it ranks ahead of other candidates:
- single duplicate pair
- bounded marketplace context
- lower fanout than logger/events/AI-governance
- avoids reopening stabilized leads, billing, or SerpAPI paths
- narrower side-effect surface than business generator, growth lead capture, and outreach email

## Command Results

Passed in sandbox:
- `npm.cmd run check:expo-boundaries`
- `npm.cmd run check:backend-boundaries`
- `npx.cmd tsc -b`
- `npm.cmd --prefix backend-server run build`

Sandbox `spawn EPERM` only:
- `npm.cmd run build`
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.controller.test.ts`

Passed outside sandbox:
- `npm.cmd run build`
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.controller.test.ts`

## Decision

- selected decision: `select next low-risk duplicate target`
- selected target: `MARKETPLACE AGENT REGISTRY DUPLICATE REVIEW`
