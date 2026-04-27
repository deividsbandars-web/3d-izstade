# Phase 116 - Marketplace Install Service Duplicate Review

## Summary

Phase 116 audited the duplicate pair:

- `src/backend/marketplace/installService.ts`
- `src/backend/marketplace/installService.js`

Decision:
- `deletion next`

No implementation, deletion, import rewrite, or redesign was performed in this phase.

## Marketplace installService Duplicate Pair Audit

Audited files:
- `src/backend/marketplace/installService.ts`
- `src/backend/marketplace/installService.js`

Audit focus:
- caller graph
- behavior parity
- runtime/build/test dependency signals
- deletion risk for the checked-in `.js` artifact

## Behavior Comparison

Compared:
- exports
- object name
- install flow behavior
- persistence/DB calls
- marketplace integration behavior
- error handling
- logging
- external dependencies
- side effects
- runtime configuration/env usage

Findings:
- both files export `installService`
- both expose:
  - `installAgent(userId, agentId)`
  - `installWorkflow(userId, workflowId)`
  - `installTemplate(userId, templateId)`
- both use:
  - `logger`
  - `supabaseClient`
- both return the same shapes:
  - success: `{ success: true, data, error: null }`
  - failure: `{ success: false, data: null, error: String(error) }`
- both perform the same DB inserts for:
  - `user_installed_agents`
  - `user_installed_workflows`
- both use the same simulated template install branch

Conclusion:
- `installService.js` behaves like a stale checked-in compiled duplicate of `installService.ts`
- no divergent runtime behavior was found

## Caller Graph Audit

Reference classes found:

Active source import/call:
- `backend-server/controllers/marketplaceController.ts`

Docs / recovery references:
- `docs/recovery/**`

Diagnostics references:
- `diagnostics/**`

Not found:
- additional source callers
- dynamic imports mentioning `installService`
- worker entry references
- package script references
- direct test dependencies

Known active caller:
- `backend-server/controllers/marketplaceController.ts`

Caller import style:
- TypeScript ESM import using `.js` specifier:
  - `../../src/backend/marketplace/installService.js`

## Runtime / Build / Test Dependency Audit

Audited:
- `package.json`
- `backend-server/package.json`
- source tree references
- route/controller imports
- scripts
- test paths
- dynamic import patterns

Findings:
- no package script targets `installService.js`
- no worker entry targets `installService.js`
- no dynamic import targets `installService.js`
- no direct test file target was found for `installService.js`
- the only active caller is a TypeScript source caller in:
  - `backend-server/controllers/marketplaceController.ts`

Resolution assessment:
- the active caller uses a `.js` ESM specifier from TypeScript source
- current build/test validation succeeded with the checked-in duplicate pair still present
- no evidence was found that the checked-in `installService.js` file is required as a special runtime artifact outside normal TS build flow

## Boundary Checker Notes

`scripts/check-backend-boundaries.mjs` does not currently track marketplace duplicate artifacts as a special guardrail class.

Baseline remains:
- domain duplicate warnings: `0`
- leads duplicate warnings: `0`
- billing boundary warnings: `0`
- violations: `0`

No checker rewrite is justified from this phase.

## Deletion Risk Assessment

Deletion risk:
- `low`

Reasons:
- single duplicate pair
- small caller graph
- no direct script/worker/test/dynamic-import dependency on checked-in `installService.js`
- no divergent logic found between `.ts` and `.js`
- duplicate looks like a stale compiled artifact rather than an intentional compatibility surface

## Selection Rationale

`deletion next` is the right decision because:
- proof is specific to one bounded pair
- behavior comparison did not reveal hidden runtime-only branches
- active caller fanout is small and reviewable
- no exact blocker was found in runtime/build/test dependency audit

## Next Recommendation

The next phase should be:
- `MARKETPLACE INSTALL SERVICE DUPLICATE BURN-DOWN`

That phase should:
- delete only `src/backend/marketplace/installService.js`
- leave `src/backend/marketplace/installService.ts` unchanged
- re-run the full validation gate immediately after deletion
