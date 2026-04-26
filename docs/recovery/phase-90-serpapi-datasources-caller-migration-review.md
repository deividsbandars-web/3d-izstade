# Phase 90: SerpAPI dataSources Caller Migration Review

Status: PASS

## Summary

- Audited `src/backend/dataSources/googleSearchService.ts` against the canonical SerpAPI search boundary
- Did not migrate any callers in this phase
- Selected next migration slice: `googleSearchService.ts`

## googleSearchService Usage Audit

Audited files:

- `src/backend/dataSources/googleSearchService.ts`
- `src/backend/dataSources/serpApiSearchService.ts`
- `src/backend/leads/sources/serpApiHelper.ts`
- `src/backend/leads/sources/serpApiHelper.js`

Current `googleSearchService.ts` usage:

- imports `serpApiHelper` from `src/backend/leads/sources/serpApiHelper.js`
- uses only `serpApiHelper.search(...)`
- does **not** use `guessEmail(...)`
- does **not** rely on any leads-specific behavior

Observed contract:

- sends generic Google search params:
  - `engine: "google"`
  - `q: query`
  - `num: limit`
- then maps `response.data.organic_results` into:
  - `{ title, url, snippet }`

Conclusion:

- `googleSearchService.ts` is a dataSources-local caller
- its usage is a pure `search(...)` use-case
- migration to `src/backend/dataSources/serpApiSearchService.ts` would be 1:1

## Migration Option Comparison

### A. Migrate `googleSearchService.ts` to `serpApiSearchService.ts`

Selected.

Why:

- uses only `search(...)`
- does not touch `guessEmail(...)`
- does not rely on leads-local behavior
- stays within `src/backend/dataSources/**`

### B. Defer migration

Rejected.

Reason:

- no behavior ambiguity was found
- this is the cleanest and narrowest caller seam currently available

### C. Migrate a broader caller group

Rejected.

Reason:

- would turn into multi-domain migration
- out of scope for this phase

## Selected Decision

Decision:

- `googleSearchService migration next`

## Scope Guard

Not changed in this phase:

- no caller migration executed
- no deletion
- no leads provider migration
- no growth migration
- no agents migration
- no `guessEmail(...)` extraction
