# Phase 120 - Marketplace Agent Registry Duplicate Review

## Summary

Phase 120 audited the duplicate pair:

- `src/backend/marketplace/agents/agentRegistry.ts`
- `src/backend/marketplace/agents/agentRegistry.js`

Decision:
- `deletion next`

No implementation, deletion, import rewrite, or redesign was performed in this phase.

## Marketplace agentRegistry Duplicate Pair Audit

Audited files:
- `src/backend/marketplace/agents/agentRegistry.ts`
- `src/backend/marketplace/agents/agentRegistry.js`

Audit focus:
- caller graph
- behavior parity
- runtime/build/test dependency signals
- deletion risk for the checked-in `.js` artifact

## Behavior Comparison

Compared:
- exports
- object name
- registry data shape
- agent metadata definitions
- marketplace listing behavior
- lookup/filter behavior
- error handling
- logging
- external dependencies
- side effects
- runtime configuration/env usage

Findings:
- both files export `agentRegistry`
- both expose:
  - `getAvailableAgents()`
  - `registerAgent(payload)`
- both use:
  - `logger`
  - `supabaseClient`
- both query the same table:
  - `marketplace_agents`
- both apply the same `order('name', { ascending: true })`
- both return the same fallback mock agent list when the table is empty
- both return the same shapes:
  - success: `{ data, error: null }`
  - failure: `{ data: null, error: String(error) }`

Conclusion:
- `agentRegistry.js` behaves like a stale checked-in compiled duplicate of `agentRegistry.ts`
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
- dynamic imports mentioning `agentRegistry`
- worker entry references
- package script references
- direct test dependencies

Known active caller:
- `backend-server/controllers/marketplaceController.ts`

Caller import style:
- TypeScript ESM import using `.js` specifier:
  - `../../src/backend/marketplace/agents/agentRegistry.js`

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
- no package script targets `agentRegistry.js`
- no worker entry targets `agentRegistry.js`
- no dynamic import targets `agentRegistry.js`
- no direct test file target was found for `agentRegistry.js`
- the only active caller is a TypeScript source caller in:
  - `backend-server/controllers/marketplaceController.ts`

Resolution assessment:
- the active caller uses a `.js` ESM specifier from TypeScript source
- current build/test validation succeeded with the checked-in duplicate pair still present
- no evidence was found that the checked-in `agentRegistry.js` file is required as a special runtime artifact outside normal TS build flow

## Boundary Checker Notes

`scripts/check-backend-boundaries.mjs` does not currently track marketplace agent registry duplicate artifacts as a special guardrail class.

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
- no direct script/worker/test/dynamic-import dependency on checked-in `agentRegistry.js`
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
- `MARKETPLACE AGENT REGISTRY DUPLICATE BURN-DOWN`

That phase should:
- delete only `src/backend/marketplace/agents/agentRegistry.js`
- leave `src/backend/marketplace/agents/agentRegistry.ts` unchanged
- re-run the full validation gate immediately after deletion
