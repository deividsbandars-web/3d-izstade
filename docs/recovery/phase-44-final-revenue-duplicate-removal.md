# Phase 44: Final Revenue Duplicate Removal

## Selected candidate

This phase audited the last remaining revenue duplicate pair:

- `src/backend/revenue/offerGenerator.js` / `offerGenerator.ts`

This was a stricter audit than the previous revenue duplicate cycles because `offerGenerator` depends on:

- `src/backend/ai/**`
- `src/backend/dataSources/**`
- website scraping
- LLM generation

## Audit findings

Audited:

- `src/backend/revenue/offerGenerator.ts`
- `src/backend/revenue/revenueApplicationService.ts`
- `src/backend/agents/tools/adapters/revenueToolAdapters.ts`
- `src/agents/salesAgent.ts`
- `src/backend/ai/**`
- `src/backend/dataSources/**`
- backend worker/event surfaces
- root and backend package script surfaces

Findings:

- `offerGenerator.ts` is the maintained authoritative implementation
- `offerGenerator.js` was only consumed through `revenueApplicationService.ts`
- `revenueToolAdapters.ts` did not import `offerGenerator` directly
- `salesAgent.ts` did not import `offerGenerator` directly
- no worker, subscriber, package-script, or dynamic-import path required a physical `offerGenerator.js` source file

## Removal

Removed:

- `src/backend/revenue/offerGenerator.js`

The `.js` specifier pattern was intentionally preserved in TypeScript callers so the same proof standard remained intact.

## Runtime safety proof

After deleting `offerGenerator.js`, the following still passed:

- `npm.cmd run check:backend-boundaries`
- `npx.cmd tsc -b`
- `npm.cmd --prefix backend-server run build`
- `npm.cmd run build` outside sandbox
- `npx.cmd tsx routes/__tests__/expoScene.test.ts` outside sandbox
- `npx.cmd tsx routes/__tests__/expoScene.controller.test.ts` outside sandbox

This is sufficient evidence that `offerGenerator.js` was legacy duplicate debt, not an authoritative runtime source file.

## Result

Revenue duplicate warnings are now `0`.

The duplicate burn-down objective is closed for:

- revenue
- agents
- platform
- distribution
