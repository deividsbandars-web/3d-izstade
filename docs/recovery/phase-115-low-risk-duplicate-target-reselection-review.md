# Phase 115 - Low-Risk Duplicate Target Re-Selection Review

## Summary

Phase 115 re-ranked the remaining checked-in TypeScript/JavaScript duplicate candidates under `src/backend`.

Decision:
- `select next low-risk duplicate target`

Selected target:
- `MARKETPLACE INSTALL SERVICE DUPLICATE REVIEW`

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

## Candidate Discovery Method

Audited inputs:
- `npm.cmd run check:backend-boundaries`
- duplicate `.ts/.js` pair scan under `src/backend/**`
- targeted caller-graph review for remaining candidate pairs and clusters
- regression-only confirmation across already stabilized domains

False positives excluded from selection:
- `docs/recovery/**`
- `diagnostics/**`
- generated build output
- boundary checker guardrails unless runtime-relevant

## Duplicate Candidate Inventory

### Marketplace Install Service Pair

Files:
- `src/backend/marketplace/installService.ts`
- `src/backend/marketplace/installService.js`

Current evidence:
- single duplicate pair
- bounded marketplace domain
- known active caller:
  - `backend-server/controllers/marketplaceController.ts`
- no evidence yet of dedicated package script, worker entry, or direct test dependency on the checked-in `.js` artifact

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
- single duplicate pair
- active callers include controller and workflow adapter surfaces
- involves DB + LLM + workflow orchestration

Cross-domain fanout:
- medium

Risk:
- `medium`

Next phase shape:
- audit-only acceptable, but not the best next low-risk pick

### Growth Lead Capture Pair

Files:
- `src/backend/growth/leadCapture.ts`
- `src/backend/growth/leadCapture.js`

Current evidence:
- single duplicate pair
- active usage includes `backend-server/controllers/growthController.ts`
- dynamic import exists from `src/backend/leads/leadsApplicationService.ts`

Cross-domain fanout:
- medium

Risk:
- `medium`

Why not selected now:
- reopens a stabilized leads/growth seam without strong need

### Outreach Email Pair

Files:
- `src/backend/outreach/emailOutreach.ts`
- `src/backend/outreach/emailOutreach.js`

Current evidence:
- single duplicate pair
- controller-facing caller graph
- includes delivery, external email provider, DB, and LLM-adjacent behavior

Cross-domain fanout:
- medium

Risk:
- `medium/high`

Why not selected now:
- more behavior surface than the marketplace install pair

### Billing Usage Cluster

Files:
- `src/backend/billing/usage/billingQuotaService.ts/.js`
- `src/backend/billing/usage/billingUsageService.ts/.js`
- `src/backend/billing/usage/billingUsageStorage.ts/.js`

Current evidence:
- bounded duplicate cluster inside billing
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
- multiple shared infra duplicate pairs
- broad fanout across backend domains

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
- broad coupling to runtime policy/control layers

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
- extremely broad import fanout across backend and server surfaces

Cross-domain fanout:
- high

Risk:
- `high`

Why not selected now:
- too central to use as the next low-risk target

## Candidate Risk Comparison

Lowest-risk candidate from current evidence:
- `MARKETPLACE INSTALL SERVICE DUPLICATE REVIEW`

Why it ranks first:
- one duplicate pair
- bounded marketplace home
- smaller caller graph than business/growth/outreach/logger/events/AI-governance candidates
- no need to reopen stabilized leads, billing, or SerpAPI cleanup paths
- clean audit-first next phase is available

## Stabilized Paths Regression Check

Confirmed no regression in:
- agents
- revenue
- billing
- leads
- SerpAPI helper retirement
- websiteScraper duplicate burn-down

No new warning class or active drift signal was found in the stabilized zones.

## Boundary Checker Notes

`npm.cmd run check:backend-boundaries` remains green:
- domain duplicate warnings: `0`
- leads duplicate warnings: `0`
- billing boundary warnings: `0`
- violations: `0`

No checker rewrite is justified from this phase.

## Selection Rationale

The marketplace install service pair is the best next target because it is:
- narrower than the remaining clusters
- outside the recently stabilized leads/revenue/billing cleanup threads
- more bounded than business generator and outreach
- less coupled than growth lead capture, logger, events, or governance

## Next Recommendation

The next phase should be:
- `MARKETPLACE INSTALL SERVICE DUPLICATE REVIEW`

That phase should:
- audit `src/backend/marketplace/installService.ts/.js`
- map active callers and runtime/build/test dependency
- determine whether `installService.js` is a stale checked-in duplicate artifact or an active compatibility surface
