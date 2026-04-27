# Phase 100 - Remaining Leads Provider SerpAPI Search Migration Review

## Summary

Phase 100 audited the two remaining leads provider `search(...)` callers that still use the SerpAPI compatibility shim:

- `src/backend/leads/sources/googleMapsLeadSource.ts`
- `src/backend/leads/sources/directoryLeadSource.ts`

No code migration or deletion was performed in this phase.

## Google Maps Provider Audit

File:
- `src/backend/leads/sources/googleMapsLeadSource.ts`

Search input:
- `engine: "google_maps"`
- `q: <query> in <location>`
- `type: "search"`

Output mapping:
- `response.data.local_results || []`
- `results.slice(0, limit)` mapped into:
  - `company_name`
  - `website`
  - `email`
  - `phone`
  - `location`
  - `metadata.rating`
  - `metadata.reviews`
  - `metadata.type`
  - `metadata.serpapi_id`

Error behavior:
- `response.error || !response.data` triggers throw
- catch returns `{ data: null, error: String(error) }`

guessEmail state after Phase 97:
- no longer uses `serpApiHelper.guessEmail(...)`
- now uses `leadEmailGuessingService.guessEmail(...)`

Migration assessment:
- search import migration would be technically 1:1
- still carries the richest response surface and the only `google_maps` / `local_results` mapping path

## Directory Provider Audit

File:
- `src/backend/leads/sources/directoryLeadSource.ts`

Search input:
- `engine: "google"`
- `q: site:yellowpages.com OR site:yelp.com "<industry>" "<location>"`
- `num: limit`

Output mapping:
- `response.data.organic_results || []`
- mapped into:
  - `company_name`
  - `website`
  - `email`
  - `phone`
  - `location`
  - `source`

Error behavior:
- `response.error || !response.data` triggers throw
- catch returns `{ data: null, error: String(error) }`

guessEmail state after Phase 97:
- no longer uses `serpApiHelper.guessEmail(...)`
- now uses `leadEmailGuessingService.guessEmail(...)`

Migration assessment:
- search import migration would be technically 1:1
- uses simpler `google` + `organic_results` path and has a smaller payload surface than Google Maps

## Candidate Comparison

### googleMapsLeadSource.ts

- risk: medium
- engine shape: `google_maps`
- result shape: `local_results`
- domain surface: richest
- metadata mapping: yes

### directoryLeadSource.ts

- risk: lower
- engine shape: `google`
- result shape: `organic_results`
- domain surface: simpler
- metadata mapping: no

## Decision

Selected next migration candidate:
- `src/backend/leads/sources/directoryLeadSource.ts`

## Rationale

`directoryLeadSource.ts` is the safer next single-provider slice because:
- it now has no remaining `guessEmail(...)` blocker
- its `search(...)` request shape is simpler
- its response mapping is smaller and easier to review than the Google Maps provider
- it keeps the next migration in the lowest-risk remaining provider path

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

The next implementation phase should migrate only `src/backend/leads/sources/directoryLeadSource.ts` from `serpApiHelper.search(...)` to `serpApiSearchService.search(...)`.
