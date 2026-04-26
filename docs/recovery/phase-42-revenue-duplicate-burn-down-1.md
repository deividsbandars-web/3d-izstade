# Phase 42: Revenue Duplicate Burn-Down Phase 1

## Selected candidate

This phase audited the three revenue duplicate pairs:

- `salesSequence.js` / `salesSequence.ts`
- `conversionTracker.js` / `conversionTracker.ts`
- `offerGenerator.js` / `offerGenerator.ts`

The selected first candidate was:

- `src/backend/revenue/salesSequence.js`

Reason:

- after Phase 41, the active caller path was narrowed behind `revenueApplicationService.ts`
- the import graph was smaller and cleaner than the other revenue pairs
- there were no worker, package-script, subscriber, or dynamic-import paths requiring a physical source `salesSequence.js`

## Audit findings

Audited:

- `src/backend/revenue/salesSequence.ts`
- `src/backend/revenue/conversionTracker.ts`
- `src/backend/revenue/offerGenerator.ts`
- `src/backend/revenue/revenueApplicationService.ts`
- `src/backend/agents/tools/adapters/revenueToolAdapters.ts`
- `src/agents/salesAgent.ts`
- backend worker/events surfaces
- root and backend package scripts

Findings:

- `revenueApplicationService.ts` still imported `./salesSequence.js`
- `revenueToolAdapters.ts` consumed only `revenueApplicationService.ts`
- `salesAgent.ts` also consumed only `revenueApplicationService.ts`
- no direct runtime path required a physical `salesSequence.js` source file
- `salesSequence.ts` is the maintained authoritative implementation

## Removal

Removed:

- `src/backend/revenue/salesSequence.js`

The `.js` specifier pattern was intentionally kept unchanged elsewhere to preserve the same proof standard used in previous duplicate burn-down phases.

## Runtime safety proof

After deleting `salesSequence.js`, the following still passed:

- `npm.cmd run check:backend-boundaries`
- `npx.cmd tsc -b`
- `npm.cmd --prefix backend-server run build`
- `npm.cmd run build` outside sandbox
- `npx.cmd tsx routes/__tests__/expoScene.test.ts` outside sandbox
- `npx.cmd tsx routes/__tests__/expoScene.controller.test.ts` outside sandbox

This is sufficient evidence that `salesSequence.js` was legacy duplicate debt, not an authoritative runtime source file.

## Remaining revenue duplicate risk

Still present:

- `src/backend/revenue/conversionTracker.js` / `conversionTracker.ts`
- `src/backend/revenue/offerGenerator.js` / `offerGenerator.ts`

These remain for a later revenue duplicate burn-down cycle.
