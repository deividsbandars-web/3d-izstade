# Phase 119 - Low-Risk Duplicate Target Re-Selection Review

## Summary

Phase 119 re-ranked the remaining checked-in TypeScript/JavaScript duplicate candidates under `src/backend` after the marketplace installService stabilization pass.

Decision:
- `select next low-risk duplicate target`

Selected target:
- `MARKETPLACE AGENT REGISTRY DUPLICATE REVIEW`

No implementation, deletion, import rewrite, or redesign was performed in this phase.

## Current Baseline

Confirmed baseline:
- domain duplicate warnings: `0`
- leads duplicate warnings: `0`
- billing boundary warnings: `0`
- violations: `0`

Previously stabilized zones remain stable:
- agents
- revenue
- billing
- leads
- SerpAPI helper retirement
- websiteScraper duplicate burn-down
- marketplace installService duplicate burn-down

## Candidate Discovery Method

Audited inputs:
- `npm.cmd run check:backend-boundaries`
- current duplicate `.ts/.js` pair scan under `src/backend/**`
- targeted caller-graph review for the remaining bounded candidates
- regression-only confirmation across stabilized domains

False positives excluded from selection:
- `docs/recovery/**`
- `diagnostics/**`
- generated build output
- boundary checker guardrails unless runtime-relevant

## Duplicate Candidate Inventory

### Marketplace Agent Registry Pair

Files:
- `src/backend/marketplace/agents/agentRegistry.ts`
- `src/backend/marketplace/agents/agentRegistry.js`

Current evidence:
- single duplicate pair
- bounded marketplace home
- known active caller:
  - `backend-server/controllers/marketplaceController.ts`
- no evidence of package script, worker, dynamic-import, or direct test dependency

Cross-domain fanout:
- low

Risk:
- `low`

Next phase shape:
- narrow audit-first review

### Business Generator Pair

Files:
- `src/backend/business/businessGenerator.ts`
- `src/backend/business/businessGenerator.js`

Current evidence:
- controller + workflow adapter caller graph
- DB + LLM + workflow orchestration surface

Cross-domain fanout:
- medium

Risk:
- `medium`

Why not selected now:
- broader orchestration seam than marketplace agent registry

### Growth Lead Capture Pair

Files:
- `src/backend/growth/leadCapture.ts`
- `src/backend/growth/leadCapture.js`

Current evidence:
- controller caller
- dynamic import from `src/backend/leads/leadsApplicationService.ts`

Cross-domain fanout:
- medium

Risk:
- `medium`

Why not selected now:
- reopens a stabilized leads/growth seam

### Outreach Email Pair

Files:
- `src/backend/outreach/emailOutreach.ts`
- `src/backend/outreach/emailOutreach.js`

Current evidence:
- controller-facing caller plus sequence/revenue usage
- delivery/provider/DB/LLM behavior surface

Cross-domain fanout:
- medium/high

Risk:
- `medium/high`

Why not selected now:
- larger side-effect surface than marketplace agent registry

### Billing Cluster

Files:
- `src/backend/billing/credits/creditService.ts/.js`
- `src/backend/billing/payments/paymentService.ts/.js`
- `src/backend/billing/usage/billingQuotaService.ts/.js`
- `src/backend/billing/usage/billingUsageService.ts/.js`
- `src/backend/billing/usage/billingUsageStorage.ts/.js`

Current evidence:
- multiple bounded duplicates inside billing
- recently stabilized domain

Cross-domain fanout:
- medium

Risk:
- `medium`

Why not selected now:
- no new signal justifying reopening billing

### Events Infra Cluster

Files:
- `src/backend/events/eventBus.ts/.js`
- `src/backend/events/eventPublisher.ts/.js`
- `src/backend/events/eventSubscriber.ts/.js`
- `src/backend/events/eventTypes.ts/.js`

Current evidence:
- shared infra duplicate cluster
- broad fanout across backend and backend-server

Cross-domain fanout:
- high

Risk:
- `high`

Why not selected now:
- too broad for the next disciplined seam

### AI / Governance Cluster

Files:
- `src/backend/ai/llmService.ts/.js`
- `src/backend/governance/agentGovernor.ts/.js`
- `src/backend/governance/loopDetector.ts/.js`
- `src/backend/governance/taskLimiter.ts/.js`

Current evidence:
- cross-cutting infra and governance behavior
- broad coupling to agents, growth, revenue, and platform flows

Cross-domain fanout:
- high

Risk:
- `high`

Why not selected now:
- not narrow enough for the next low-risk cleanup pass

### Logger Pair

Files:
- `src/backend/logging/logger.ts`
- `src/backend/logging/logger.js`

Current evidence:
- duplicate pair
- very broad import fanout across backend and server surfaces

Cross-domain fanout:
- high

Risk:
- `high`

Why not selected now:
- too central to use as the next low-risk target

## Candidate Risk Comparison

Lowest-risk candidate from current evidence:
- `MARKETPLACE AGENT REGISTRY DUPLICATE REVIEW`

Why it ranks first:
- one duplicate pair
- bounded marketplace domain
- one known controller caller
- lower fanout than business/growth/outreach/logger/events/AI-governance candidates
- does not reopen stabilized leads, billing, or SerpAPI cleanup paths

## Stabilized Paths Regression Check

Confirmed no regression in:
- agents
- revenue
- billing
- leads
- SerpAPI helper retirement
- websiteScraper duplicate burn-down
- marketplace installService duplicate burn-down

No new warning class or active drift signal was found in the stabilized zones.

## Boundary Checker Notes

`npm.cmd run check:backend-boundaries` remains green:
- domain duplicate warnings: `0`
- leads duplicate warnings: `0`
- billing boundary warnings: `0`
- violations: `0`

No checker rewrite is justified from this phase.

## Selection Rationale

The marketplace agent registry pair is the best next target because it is:
- narrower than the remaining clusters
- still inside the already-audited marketplace area, but not reopening a failed seam
- more bounded than business generator and outreach
- less coupled than growth lead capture, logger, events, or governance

## Next Recommendation

The next phase should be:
- `MARKETPLACE AGENT REGISTRY DUPLICATE REVIEW`

That phase should:
- audit `src/backend/marketplace/agents/agentRegistry.ts/.js`
- map active callers and runtime/build/test dependency
- determine whether `agentRegistry.js` is a stale checked-in duplicate artifact or an active compatibility surface
