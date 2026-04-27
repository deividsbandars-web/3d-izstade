# Phase 98 - Leads Provider SerpAPI Search Migration Review

## Summary

Phase 98 audited the three remaining leads providers that still call `serpApiHelper.search(...)` and selected the next safest single-provider migration target toward the canonical search boundary at `src/backend/dataSources/serpApiSearchService.ts`.

No code migration or deletion was performed in this phase.

## Providers Audited

- `src/backend/leads/sources/linkedinLeadSource.ts`
- `src/backend/leads/sources/googleMapsLeadSource.ts`
- `src/backend/leads/sources/directoryLeadSource.ts`

## Search Usage Findings

### linkedinLeadSource.ts

- uses `serpApiHelper.search(...)`
- does not use `guessEmail(...)`
- input shape:
  - `engine: "google"`
  - `q: site:linkedin.com/company "<industry>" "<location>"`
  - `num: limit`
- output mapping:
  - `organic_results -> company_name / website / email / phone / location / source`
- error behavior:
  - throws on `response.error` or missing `response.data`
  - returns `{ data: null, error: String(error) }` in catch

Migration assessment:
- 1:1 import swap candidate
- lowest behavioral complexity

### googleMapsLeadSource.ts

- uses `serpApiHelper.search(...)`
- now uses `leadEmailGuessingService.guessEmail(...)` for email generation
- input shape:
  - `engine: "google_maps"`
  - `q: <query> in <location>`
  - `type: "search"`
- output mapping:
  - `local_results -> company_name / website / email / phone / location / metadata`
- error behavior:
  - throws on `response.error` or missing `response.data`
  - returns `{ data: null, error: String(error) }` in catch

Migration assessment:
- search migration is now technically 1:1
- still carries the richest output mapping of the three

### directoryLeadSource.ts

- uses `serpApiHelper.search(...)`
- now uses `leadEmailGuessingService.guessEmail(...)`
- input shape:
  - `engine: "google"`
  - `q: site:yellowpages.com OR site:yelp.com "<industry>" "<location>"`
  - `num: limit`
- output mapping:
  - `organic_results -> company_name / website / email / phone / location / source`
- error behavior:
  - throws on `response.error` or missing `response.data`
  - returns `{ data: null, error: String(error) }` in catch

Migration assessment:
- search migration is now technically 1:1
- still mixes generic search response mapping with directory-specific title parsing

## Candidate Comparison

### linkedinLeadSource.ts

- risk: lowest
- reviewability: highest
- guessEmail blocker: none
- migration shape: pure search import swap

### googleMapsLeadSource.ts

- risk: medium
- reviewability: medium
- guessEmail blocker: removed
- migration shape: mechanically simple, but richer output payload and `local_results` mapping

### directoryLeadSource.ts

- risk: medium
- reviewability: medium
- guessEmail blocker: removed
- migration shape: mechanically simple, but title parsing is a little more domain-specific than LinkedIn

## Decision

Selected next migration candidate:
- `src/backend/leads/sources/linkedinLeadSource.ts`

## Rationale

`linkedinLeadSource.ts` is the cleanest next step because:
- it is already search-only
- it no longer depends on the compatibility shim for any leads-local behavior
- it has the narrowest mapping surface of the remaining providers
- it keeps the next implementation slice to one provider and one import change

## Validation

Passed in sandbox:
- `npm.cmd run check:expo-boundaries`
- `npm.cmd run check:backend-boundaries`
- `npx.cmd tsc -b`
- `npm.cmd --prefix backend-server run build`

Sandbox-only restriction:
- `npm.cmd run build`
- `npx.cmd tsx routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx routes/__tests__/expoScene.controller.test.ts`

Passed outside sandbox on the same machine:
- `npm.cmd run build`
- `npx.cmd tsx routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx routes/__tests__/expoScene.controller.test.ts`

## Current State

- domain duplicate warnings: `0`
- leads duplicate warnings: `1`
- billing boundary warnings: `0`
- violations: `0`

## Next Recommendation

The next implementation phase should migrate only `src/backend/leads/sources/linkedinLeadSource.ts` from `serpApiHelper.search(...)` to `serpApiSearchService.search(...)`.
