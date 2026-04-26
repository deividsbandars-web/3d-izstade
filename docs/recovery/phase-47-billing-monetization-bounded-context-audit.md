# Phase 47: Billing / Monetization Bounded-Context Audit

## Summary of where billing lives today

Billing and monetization logic is not fully absent from the repo. It exists, but it is split across multiple areas:

- `src/backend/billing/plans/planService.ts`
- `src/backend/billing/payments/paymentService.ts`
- `src/backend/billing/credits/creditService.ts`
- `backend-server/controllers/billingController.ts`
- `backend-server/events/revenueSubscribers.ts`
- `src/backend/platform/usageService.ts`
- `src/backend/governance/costMonitor.ts`
- `src/backend/ai/llmService.ts`
- `src/backend/revenue/offerGenerator.ts` via checkout-link generation and monetization copy

So the repo already has a partial billing domain, but not a complete bounded context.

## Current billing / monetization coupling map

### Billing domain files

- `billingController.ts`
  - imports `planService`, `creditService`, `paymentService`
  - acts as the HTTP entry point for billing
- `planService.ts`
  - plan limits
  - user plan lookup
- `paymentService.ts`
  - checkout session creation
  - plan upgrade
  - webhook handling
  - emits `SUBSCRIPTION_CREATED`
  - emits `PAYMENT_RECEIVED`
  - directly calls `creditService`
- `creditService.ts`
  - credit balance lookup
  - add credits
  - consume credits

### Revenue coupling

- `src/backend/revenue/conversionTracker.ts`
  - emits `PAYMENT_RECEIVED`
- `backend-server/events/revenueSubscribers.ts`
  - consumes `PAYMENT_RECEIVED`
  - creates/updates user records
  - grants credits
  - effectively applies billing side-effects from a revenue-named subscriber
- `src/backend/revenue/offerGenerator.ts`
  - creates mock checkout URLs
  - contains monetization-facing offer generation details, but not full billing logic

### Usage / quota / cost coupling

- `src/backend/platform/usageService.ts`
  - stores usage logs
  - increments daily counters
  - checks daily request limits
- `src/backend/governance/costMonitor.ts`
  - uses `usageService`
  - reads `users.credits` and `users.plan`
  - effectively decides billing/quota allow/deny
- `src/backend/ai/llmService.ts`
  - calls `usageService.checkLimits(...)`
  - logs token/cost usage through `usageService.logUsage(...)`
  - therefore AI usage billing is routed through platform/governance infrastructure, not a billing boundary

## Existing billing boundary verdict

Verdict:

- a **partial billing domain exists**
- a **caller-facing billing bounded-context boundary does not exist yet**

What exists:

- service-level domain code under `src/backend/billing/**`
- HTTP controller surface in `billingController.ts`

What does not exist:

- `billingApplicationService.ts`
- a single caller-facing monetization contract
- a clear usage/credits/pricing/payment boundary that other domains must consume

This means the billing domain exists structurally, but not yet as a bounded context with one canonical boundary.

## Target billing boundary

Recommended target structure for future phases:

- `src/backend/billing/billingApplicationService.ts`
- `src/backend/billing/billingTypes.ts`
- `src/backend/billing/pricing/**`
- `src/backend/billing/usage/**`
- `src/backend/billing/payments/**`
- `src/backend/billing/credits/**`
- optional later: `src/backend/billing/invoicing/**`

Recommended caller-facing use-cases:

- `trackUsage(...)`
- `enforceQuota(...)`
- `applyPricing(...)`
- `recordTransaction(...)`
- `createCheckoutSession(...)`
- `upgradeSubscription(...)`
- `grantCredits(...)`
- `consumeCredits(...)`
- `getBillingSummary(...)`

The important architectural point:

- AI, governance, revenue, and events should not each act as their own billing proxy
- they should depend on a caller-facing billing boundary instead

## High-risk coupling points

### 1. `backend-server/controllers/billingController.ts`

Risk:

- controller imports three low-level billing services directly
- there is no `billingApplicationService` boundary

Why it matters:

- caller-facing billing contract is fragmented at controller level

Desired next step:

- introduce `billingApplicationService.ts`
- make controller consume that boundary only

### 2. `backend-server/events/revenueSubscribers.ts`

Risk:

- revenue subscriber performs billing side-effects
- it grants credits and activates monetization outcomes from a revenue-named event path

Why it matters:

- billing side-effects are owned outside a billing boundary

Desired next step:

- move payment-to-account/credits orchestration behind billing application service or billing event handler boundary

### 3. `src/backend/governance/costMonitor.ts`

Risk:

- governance acts as a billing/quota proxy
- it checks both daily usage and user credits directly

Why it matters:

- quota enforcement is not behind a billing/monetization abstraction

Desired next step:

- replace direct usage/credits reads with a billing-facing budget/quota contract

### 4. `src/backend/ai/llmService.ts`

Risk:

- AI usage logging and limit checks go directly through `platform/usageService`

Why it matters:

- usage monetization is coupled to platform instead of billing

Desired next step:

- route AI usage accounting through a billing usage boundary

### 5. `src/backend/platform/usageService.ts`

Risk:

- platform owns usage logging and quota counters that are monetization-relevant

Why it matters:

- platform can become the accidental monetization domain

Desired next step:

- either move monetization-relevant usage logic under billing
- or wrap `usageService` behind a billing usage contract

## Anti-patterns for next phase

Do not do:

- rewrite the entire billing stack in one cycle
- move all usage logic out of platform without first defining the billing contract
- push billing logic into revenue, governance, or AI services
- create a fake billing boundary that is only a barrel file with no real ownership

## Likely next phases

1. Introduce `billingApplicationService.ts` and move `billingController.ts` behind it.
2. Define billing usage/quota contract so `costMonitor.ts` and `llmService.ts` stop acting as direct billing proxies.
3. Isolate payment/revenue event side-effects so `revenueSubscribers.ts` no longer owns billing outcomes directly.
