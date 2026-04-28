# Phase 111 - Next Bounded Context Cleanup Target Review

## Summary

Phase 111 audited the backend after the stabilized SerpAPI/leads/revenue/billing/agents cleanup wave and selected the next bounded-context cleanup target.

Decision:
- `select next bounded-context cleanup target`

Selected target:
- `DATASOURCES WEBSITE SCRAPER DUPLICATE REVIEW`

No implementation, deletion, or redesign was performed in this phase.

## Current Baseline

Current checker baseline:
- domain duplicate warnings: `0`
- leads duplicate warnings: `0`
- billing boundary warnings: `0`
- violations: `0`

Stabilized bounded contexts remain green:
- agents
- revenue
- billing
- leads

## Candidate Discovery Method

Discovery inputs used:
- `npm.cmd run check:backend-boundaries`
- duplicate-pair scan for `.ts/.js` files under `src/backend/**`
- targeted inspection of stabilized boundaries
- targeted review of remaining shared/helper duplicate clusters outside the SerpAPI thread

Candidate discovery intentionally ignored:
- docs/recovery historical references
- diagnostics historical references
- checker guardrails as false-positive runtime dependencies

## Candidate Target Inventory

### 1. DataSources Website Scraper Duplicate Cluster

Candidate:
- `src/backend/dataSources/websiteScraper.ts`
- `src/backend/dataSources/websiteScraper.js`

Why it is a candidate:
- shared helper-style duplicate pair
- used by:
  - `src/backend/agents/tools/adapters/dataSourceToolAdapters.ts`
  - `src/backend/revenue/offerGenerator.ts`
- outside the already stabilized SerpAPI/leads cleanup thread

Current evidence:
- duplicate pair exists
- clear bounded home under `dataSources`
- likely narrow first phase exists

Risk:
- `low`

Narrow first phase:
- yes

Recommended first phase shape:
- audit-only review

### 2. Events Infra Duplicate Cluster

Candidate:
- `src/backend/events/eventBus.ts/.js`
- `src/backend/events/eventPublisher.ts/.js`
- `src/backend/events/eventSubscriber.ts/.js`
- `src/backend/events/eventTypes.ts/.js`

Why it is a candidate:
- multiple duplicate pairs
- shared across backend-server, billing, revenue, growth, distribution, and agents

Current evidence:
- broad cross-domain fanout
- infrastructure-level blast radius

Risk:
- `high`

Narrow first phase:
- yes, but only as a review

Reason not selected now:
- too much cross-domain surface for the next immediate cleanup slice

### 3. Billing Usage Duplicate Cluster

Candidate:
- `src/backend/billing/usage/billingQuotaService.ts/.js`
- `src/backend/billing/usage/billingUsageService.ts/.js`
- `src/backend/billing/usage/billingUsageStorage.ts/.js`

Why it is a candidate:
- duplicate cluster exists inside billing/usage

Current evidence:
- bounded namespace is already clean and stable
- billing is still a recently stabilized domain

Risk:
- `medium`

Narrow first phase:
- yes

Reason not selected now:
- avoid reopening a newly stabilized domain unless a stronger signal appears

### 4. AI / Governance Duplicate Cluster

Candidate:
- `src/backend/ai/llmService.ts/.js`
- `src/backend/governance/agentGovernor.ts/.js`
- related governance helpers

Why it is a candidate:
- duplicate pairs exist
- both touch billing quota enforcement and governance rules

Risk:
- `high`

Narrow first phase:
- only as a review

Reason not selected now:
- cross-cutting behavior and validation risk are higher than the dataSources helper candidate

### 5. Business Generator Duplicate Pair

Candidate:
- `src/backend/business/businessGenerator.ts/.js`

Why it is a candidate:
- single duplicate pair
- bounded domain

Risk:
- `medium`

Narrow first phase:
- yes

Reason not selected now:
- touches DB + LLM + workflow orchestration; less mechanical than websiteScraper

## Candidate Risk Comparison

Lowest-risk candidate:
- `dataSources/websiteScraper`

Why it ranks first:
- one clear helper pair
- limited caller graph
- shared helper role is obvious
- does not reopen the newly stabilized leads/revenue/billing cleanup threads
- supports a narrow audit-first phase

Higher-risk candidates:
- events infra cluster
- AI/governance cluster

Reason:
- wider cross-domain fanout
- higher validation risk
- weaker one-file/one-seam discipline

## Stabilized Domains Regression Check

Agents:
- adapters remain split by capability/domain
- agents cross-domain warnings remain `0`

Revenue:
- `src/backend/revenue/revenueApplicationService.ts` remains caller-facing boundary
- revenue -> leads seam remains behind prospecting adapters

Billing:
- `src/backend/billing/billingApplicationService.ts` remains caller-facing boundary
- usage/quota remains under billing namespace

Leads:
- `src/backend/leads/leadsApplicationService.ts` remains controller-facing boundary
- SerpAPI helper files remain absent from source tree
- source callers still use `src/backend/dataSources/serpApiSearchService.ts`

No regression signal was found in these stabilized domains.

## Boundary Checker Notes

`scripts/check-backend-boundaries.mjs` remains stable:
- domain duplicate warnings: `0`
- leads duplicate warnings: `0`
- billing boundary warnings: `0`
- violations: `0`

No new warning class appeared in the checker output.

## Selected Decision

- `select next bounded-context cleanup target`

Selected target:
- `DATASOURCES WEBSITE SCRAPER DUPLICATE REVIEW`

## Selection Rationale

This is the correct next target because:
- it is outside the already stabilized SerpAPI helper thread
- it is narrower than events or AI/governance cleanup
- it avoids reopening billing/revenue/leads domains without evidence
- it has a clear audit-first first phase

## Next Recommendation

The next phase should be:
- `DATASOURCES WEBSITE SCRAPER DUPLICATE REVIEW`

That phase should:
- audit `src/backend/dataSources/websiteScraper.ts/.js`
- map active callers
- confirm whether the `.js` file is a duplicate artifact or required runtime surface
- avoid implementation until the caller graph is proven narrow and safe
