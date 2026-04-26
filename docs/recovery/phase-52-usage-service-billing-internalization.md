# Phase 52: Usage Service Billing Internalization

## Summary

This phase moved billing-facing usage authority into a billing-local namespace:

- `src/backend/billing/usage/billingUsageService.ts`
- `src/backend/billing/usage/billingUsageService.js`

and rewired:

- `src/backend/billing/billingApplicationService.ts`
- `src/backend/billing/usage/billingQuotaService.ts`

so billing no longer imports `src/backend/platform/usageService.ts` directly outside the dedicated billing-local usage helper.

## Before This Phase

Before the change:

- `billingApplicationService.ts` imported `platform/usageService.ts`
- `billingQuotaService.ts` imported `platform/usageService.ts`
- `platform/usageService.ts` was still the effective billing usage authority

That was semantically wrong even after the quota helper moved into billing in Phase 51.

## New Billing-Local Usage Boundary

The new canonical billing-local usage helper is:

- `src/backend/billing/usage/billingUsageService.ts`

Its role is intentionally narrow:

- delegate usage logging to `platform/usageService`
- delegate daily-limit checks to `platform/usageService`

This phase did not redesign usage storage or counters.
It only moved the billing-facing entry point into the billing namespace.

## billingApplicationService Rewiring

`billingApplicationService.ts` now uses:

- `billingUsageService.trackUsage(...)`
- `billingUsageService.checkLimits(...)`

It no longer imports `platform/usageService.ts` directly.

That means:

- `trackUsage(...)` remains the caller-facing billing usage logging entry
- `getUsageSummary(...)` now reads daily-limit state via the billing-local helper
- `enforceQuota(...)` still stays on the billing boundary

## billingQuotaService Rewiring

`billingQuotaService.ts` now imports:

- `billingUsageService.ts`

instead of:

- `platform/usageService.ts`

This makes quota enforcement billing-local at the namespace level, while still preserving the same lower-level behavior underneath.

## Platform usageService Compatibility Decision

`src/backend/platform/usageService.ts` was **not** moved or deleted.

It now effectively remains:

- a legacy lower-level storage/helper implementation

The file is marked accordingly with a top-of-file comment:

- canonical billing-facing usage authority now lives under `src/backend/billing/usage/**`
- new billing/quota code should not import `platform/usageService.ts` directly

This is the safe cut for this phase. It changes authority without introducing a risky storage migration.

## Boundary Check Enforcement

`scripts/check-backend-boundaries.mjs` now hard-fails if:

- `src/backend/billing/**` imports `src/backend/platform/usageService.ts` directly
  - except the allowlisted billing-local usage helper
- `src/backend/ai/**` imports `platform/usageService`
- `src/backend/governance/**` imports `platform/usageService` as a billing/quota entry

Still warning-level:

- `platform/usageService.ts` existing as legacy/internal storage helper
- `backend-server/events/revenueSubscribers.ts` billing side-effects
- governance `costMonitor.ts` deprecated compatibility wrapper

## Validation

Passed:

- `npm.cmd run check:backend-boundaries`
- `npm.cmd run check:expo-boundaries`
- `npx.cmd tsc -b`
- `npm.cmd run build`
- `npm.cmd --prefix backend-server run build`
- `npx.cmd tsx routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx routes/__tests__/expoScene.controller.test.ts`

## Tests

No billing/usage-specific automated tests were found.

## Next Suggested Step

The next logical phase is:

- revenue subscriber billing side-effect isolation

That would target:

- `backend-server/events/revenueSubscribers.ts`

without reopening pricing/payment/invoicing or usage model redesign.
