# Phase 51: Cost Monitor Internalization

## Summary

This phase moved the canonical quota/cost helper into a billing-local namespace:

- `src/backend/billing/usage/billingQuotaService.ts`
- `src/backend/billing/usage/billingQuotaService.js`

and rewired:

- `src/backend/billing/billingApplicationService.ts`

so billing no longer imports governance `costMonitor` as its canonical dependency.

## Before This Phase

The relevant state before the change was:

- `billingApplicationService.ts` imported `src/backend/governance/costMonitor.js`
- `costMonitor.ts` contained the actual quota/cost logic
- governance `costMonitor` still semantically looked like the quota authority

Even though callers had already moved to billing, billing itself still depended on governance as the canonical helper location.

## New Canonical Quota/Cost Helper

The new canonical helper now lives here:

- `src/backend/billing/usage/billingQuotaService.ts`

It contains the same logic pattern as the previous `costMonitor`:

- check daily limits via `usageService.checkLimits(...)`
- fetch user credits/plan
- return `{ allowed, reason }`

No algorithm redesign was done. The logic was moved into a billing-local namespace to fix ownership semantics.

## billingApplicationService Rewiring

`billingApplicationService.ts` now imports:

- `src/backend/billing/usage/billingQuotaService.js`

instead of:

- `src/backend/governance/costMonitor.js`

The caller-facing billing quota entry remains:

- `billingApplicationService.enforceQuota(...)`

The change was internal only:

- billing callers keep using the same application-service contract
- the canonical low-level helper now belongs to billing

## Governance Compatibility Decision

`src/backend/governance/costMonitor.ts` and `.js` were **not** deleted.

They now remain as:

- deprecated compatibility wrappers

Each wrapper delegates to:

- `src/backend/billing/usage/billingQuotaService.js`

This is the safer choice for this phase because it avoids silent runtime breakage while making the canonical helper location explicit.

## Boundary Check Enforcement

`scripts/check-backend-boundaries.mjs` now enforces:

- hard fail if `src/backend/billing/**` imports governance `costMonitor.ts` or `.js`
- hard fail if `src/backend/governance/**` imports `costMonitor` directly as a caller-facing quota entry
- hard fail if new code outside billing imports governance `costMonitor`

Allowed:

- governance `costMonitor` wrapper importing the billing-local helper

Still warning-level:

- `src/backend/platform/usageService.ts`
- `backend-server/events/revenueSubscribers.ts`
- governance `costMonitor.ts` existing as a deprecated wrapper in the namespace

## Deferred Work

This phase intentionally did **not**:

- move `usageService` into billing
- redesign quota/cost algorithms
- touch pricing/payments/invoicing
- clean up revenue billing side-effects
- redesign governance broadly

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

No billing/governance/usage-specific automated tests were found.

## Next Suggested Step

The next logical phase is:

- usageService boundary internalization

That should focus on whether:

- `usageService` remains under platform as an explicit legacy dependency
- or a billing-local usage helper gradually absorbs the billing-relevant surface

without reopening pricing/payment/invoicing or governance redesign.
