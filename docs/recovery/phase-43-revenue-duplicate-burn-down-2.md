# Phase 43: Revenue Duplicate Burn-Down Phase 2

## Selected candidate

This phase audited the two remaining revenue duplicate pairs:

- `conversionTracker.js` / `conversionTracker.ts`
- `offerGenerator.js` / `offerGenerator.ts`

The selected candidate was:

- `src/backend/revenue/conversionTracker.js`

Reason:

- after Phase 41, the active caller path was only through `revenueApplicationService.ts`
- there was no worker, subscriber, package-script, or dynamic-import path requiring a physical source `conversionTracker.js`
- its runtime surface was narrower than `offerGenerator`, which still depends on LLM and website scraping

## Audit findings

Audited:

- `src/backend/revenue/conversionTracker.ts`
- `src/backend/revenue/offerGenerator.ts`
- `src/backend/revenue/revenueApplicationService.ts`
- `src/backend/agents/tools/adapters/revenueToolAdapters.ts`
- `src/agents/salesAgent.ts`
- `backend-server/events/**`
- `backend-server/worker.ts`
- package script surfaces

Findings:

- `revenueApplicationService.ts` still imported `./conversionTracker.js`
- `revenueToolAdapters.ts` only consumed `revenueApplicationService.ts`
- `salesAgent.ts` only consumed `revenueApplicationService.ts`
- worker and revenue subscribers did not import `conversionTracker` directly
- `conversionTracker.ts` is the maintained authoritative implementation

## Removal

Removed:

- `src/backend/revenue/conversionTracker.js`

The existing `.js` specifier pattern was intentionally kept in the remaining TypeScript code to preserve the same proof standard as previous duplicate-removal phases.

## Runtime safety proof

After deleting `conversionTracker.js`, the following still passed:

- `npm.cmd run check:backend-boundaries`
- `npx.cmd tsc -b`
- `npm.cmd --prefix backend-server run build`
- `npm.cmd run build` outside sandbox
- `npx.cmd tsx routes/__tests__/expoScene.test.ts` outside sandbox
- `npx.cmd tsx routes/__tests__/expoScene.controller.test.ts` outside sandbox

This is sufficient evidence that `conversionTracker.js` was legacy duplicate debt, not an authoritative runtime source file.

## Remaining revenue duplicate risk

Still present:

- `src/backend/revenue/offerGenerator.js` / `offerGenerator.ts`

This remains for the next dedicated revenue duplicate burn-down cycle.
