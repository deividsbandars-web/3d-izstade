# Phase 112 - DataSources Website Scraper Duplicate Review

## Summary

Phase 112 audited the duplicate pair:

- `src/backend/dataSources/websiteScraper.ts`
- `src/backend/dataSources/websiteScraper.js`

Decision:
- `deletion next`

No implementation or deletion was performed in this review phase.

## Website Scraper Duplicate Pair Audit

Target files:
- `src/backend/dataSources/websiteScraper.ts`
- `src/backend/dataSources/websiteScraper.js`

Observed relationship:
- both export `websiteScraper`
- both expose `scrapeText(url)`
- both use the same fetch + HTML text extraction logic
- both use the same logger dependency
- both return the same `{ data, error }` result shape

Current evidence points to:
- JS is a stale checked-in duplicate artifact of the TS implementation

## Behavior Comparison

Compared:
- exports
- function/object names
- scraping implementation
- error handling
- logging
- external dependencies
- side effects
- runtime configuration usage

Result:
- no divergent runtime behavior found
- no extra side effects in `.js`
- no env/config split between `.ts` and `.js`
- `.js` appears to be the compiled form of the `.ts` source logic

## Caller Graph Audit

Active source callers found:
- `src/backend/agents/tools/adapters/dataSourceToolAdapters.ts`
- `src/backend/revenue/offerGenerator.ts`

Caller import style:
- `dataSourceToolAdapters.ts` imports `../../../dataSources/websiteScraper.js`
- `offerGenerator.ts` imports `../dataSources/websiteScraper.js`

Interpretation:
- these are TypeScript ESM-style imports from `.ts` callers
- under the repo’s TS build flow, they resolve to the TypeScript source implementation during compilation

No additional active callers were found in:
- backend-server routes/controllers
- workers
- tests
- scripts

## Runtime / Build / Test Dependency Audit

Audited:
- `package.json`
- `backend-server/package.json`
- worker entrypoints
- scripts
- tests
- route/controller imports
- dynamic import references

Findings:
- no package script directly targets `src/backend/dataSources/websiteScraper.js`
- no worker entry targets `websiteScraper.js`
- no dynamic import targets `websiteScraper.js`
- no route/controller import targets `websiteScraper.js`
- no test dependency directly targets `websiteScraper.js`

Risk interpretation:
- active callers exist, but they are TypeScript callers using `.js` specifiers in normal ESM style
- no proof was found that the checked-in `.js` artifact is required outside the TS build pipeline

## Boundary Checker Notes

`scripts/check-backend-boundaries.mjs` does not currently track `websiteScraper` as a dedicated duplicate-risk guardrail.

Current checker baseline remains:
- domain duplicate warnings: `0`
- leads duplicate warnings: `0`
- billing boundary warnings: `0`
- violations: `0`

## Deletion Risk Assessment

Deletion risk:
- `low`

Reason:
- active callers are TypeScript source files
- `.ts` and `.js` behavior match
- no direct runtime/build/test/script dependency on the checked-in `.js` artifact was found

## Selection Rationale

This is a good deletion-next candidate because:
- the duplicate pair is narrow
- the caller graph is small
- the implementation is helper-style rather than orchestration-heavy
- no domain currently depends on the checked-in `.js` file as a distinct runtime surface

## Next Recommendation

The next phase should be:
- `DATASOURCES WEBSITE SCRAPER DUPLICATE BURN-DOWN`

That phase should:
- delete only `src/backend/dataSources/websiteScraper.js`
- keep `src/backend/dataSources/websiteScraper.ts`
- validate that boundary/build/test gates remain green
