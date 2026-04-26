# Phase 56 - Legacy Billing Helper Retirement Review

## Goal

Review the remaining warning-level legacy billing helpers:

- `src/backend/platform/usageService.ts`
- `src/backend/platform/usageService.js`
- `src/backend/governance/costMonitor.ts`
- `src/backend/governance/costMonitor.js`

and decide, for each file, whether it should be:

- deleted,
- kept as a compatibility wrapper,
- or kept as a documented lower-level implementation.

This phase was intentionally narrow:

- no usage model redesign
- no storage migration
- no governance redesign
- no platform redesign
- no pricing/payment/invoicing redesign

## Audited Files

- `src/backend/platform/usageService.ts`
- `src/backend/platform/usageService.js`
- `src/backend/governance/costMonitor.ts`
- `src/backend/governance/costMonitor.js`
- `src/backend/billing/usage/billingUsageService.ts`
- `src/backend/billing/usage/billingQuotaService.ts`
- `src/backend/billing/billingApplicationService.ts`
- `scripts/check-backend-boundaries.mjs`

## Import Graph Findings

### platform/usageService.ts

Direct imports found:

- `src/backend/billing/usage/billingUsageService.ts`
- `src/backend/billing/usage/billingUsageService.js`

No other direct callers were found in `src/backend/**` or `backend-server/**`.

This means:

- `usageService.ts` is no longer a caller-facing billing boundary
- it is still the active lower-level usage storage/helper implementation
- deletion would be premature because `billingUsageService` still delegates to it

### platform/usageService.js

Status:

- file not present

This means there is no active `.js` mirror left for platform usage tracking.

### governance/costMonitor.ts

Before this phase:

- it had no remaining external callers
- it only delegated to `src/backend/billing/usage/billingQuotaService.ts`
- it had already been reduced to a deprecated compatibility wrapper

### governance/costMonitor.js

Before this phase:

- same shape as `costMonitor.ts`
- no remaining external callers found
- wrapper-only behavior

## Helper Decisions

### src/backend/platform/usageService.ts

Decision: **C - keep as lower-level storage implementation**

Reason:

- it is still used by `billingUsageService`
- deleting it now would require usage storage migration or algorithm relocation, which is
  out of scope
- it is no longer authoritative for billing-facing callers, but it still provides the
  actual lower-level implementation

### src/backend/platform/usageService.js

Decision: **already retired / not present**

Reason:

- no file exists
- no action required in this phase

### src/backend/governance/costMonitor.ts

Decision: **A - retire/delete safely**

Reason:

- no remaining callers were found
- the file had already become a compatibility wrapper only
- billing already uses `src/backend/billing/usage/billingQuotaService.ts` directly
- build/check/test proof passed after deletion

### src/backend/governance/costMonitor.js

Decision: **A - retire/delete safely**

Reason:

- same graph and role as `costMonitor.ts`
- no remaining callers were found
- no runtime proof indicated the `.js` wrapper was still required

## Changes Made

Deleted:

- `src/backend/governance/costMonitor.ts`
- `src/backend/governance/costMonitor.js`

Kept:

- `src/backend/platform/usageService.ts` as the documented lower-level usage storage/helper
  implementation behind billing-local helpers

No algorithm rewrite was performed.

## Boundary Check Refinement

`scripts/check-backend-boundaries.mjs` now reflects the new reality more accurately:

- the old `costMonitor` warning disappears because the wrapper no longer exists
- the remaining `usageService` warning now explicitly says that canonical billing-facing
  usage entry lives under:
  - `src/backend/billing/usage/billingUsageService.ts`

This keeps warnings aligned with the current architecture rather than with an older
intermediate state.

## Current Meaning of Remaining Warning

Remaining warning:

- `src/backend/platform/usageService.ts`

Meaning:

- this file still exists as a lower-level helper in the platform namespace
- billing-facing callers should not use it directly
- billing-local authority lives under `src/backend/billing/usage/**`

## Why usageService Was Not Deleted

Deletion would have been unsafe in this phase because:

- `billingUsageService.ts` still imports it directly
- removing it would force storage/helper migration work
- that would expand the phase into usage redesign instead of a retirement review

## Deferred Work

- usage storage migration out of `src/backend/platform/usageService.ts`
- any deeper usage model redesign
- payment/pricing/invoicing work
- broader platform/governance namespace cleanup

## Recommended Next Phase

`USAGE STORAGE EXTRACTION REVIEW`

Goal:

- decide whether `platform/usageService.ts` should remain permanently as a lower-level
  implementation
- or whether its storage/helper logic should eventually be moved into a billing-local
  infrastructure layer
