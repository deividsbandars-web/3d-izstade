# Phase 96: SerpAPI leads provider / guessEmail seam review

Status: PASS

## Summary

- Audited all remaining leads providers that still depend on `src/backend/leads/sources/serpApiHelper.ts`
- Separated their usage into:
  - shared `search(...)`
  - leads-local `guessEmail(...)`
- Selected next seam: extract `guessEmail(...)` into a leads-local helper

## Leads Provider SerpAPI Usage Audit

Audited files:

- `src/backend/leads/sources/googleMapsLeadSource.ts`
- `src/backend/leads/sources/directoryLeadSource.ts`
- `src/backend/leads/sources/linkedinLeadSource.ts`
- `src/backend/leads/sources/serpApiHelper.ts`
- `src/backend/dataSources/serpApiSearchService.ts`

Provider usage map:

### `googleMapsLeadSource.ts`

- uses `serpApiHelper.search(...)`
- uses `serpApiHelper.guessEmail(...)`
- `search(...)` request:
  - `engine: "google_maps"`
  - `q: \`${query} in ${location}\``
  - `type: "search"`
- `search(...)` migration to `serpApiSearchService.ts` would be 1:1

### `directoryLeadSource.ts`

- uses `serpApiHelper.search(...)`
- uses `serpApiHelper.guessEmail(...)`
- `search(...)` request:
  - `engine: "google"`
  - `q: site-filtered YellowPages/Yelp query`
  - `num: limit`
- `search(...)` migration to `serpApiSearchService.ts` would be 1:1

### `linkedinLeadSource.ts`

- uses `serpApiHelper.search(...)`
- does **not** use `guessEmail(...)`
- `search(...)` request:
  - `engine: "google"`
  - `q: LinkedIn company search query`
  - `num: limit`
- `search(...)` migration to `serpApiSearchService.ts` would be 1:1

Shared conclusion:

- all three providers use shared SerpAPI search behavior
- only two providers (`googleMaps`, `directory`) depend on `guessEmail(...)`

## guessEmail Usage Audit

Current `guessEmail(...)` behavior:

- input:
  - optional domain/URL-like string
  - optional company name (currently unused)
- behavior:
  - strips protocol and `www`
  - takes hostname/path root
  - returns `info@${cleanDomain}`
  - returns empty string if no valid domain

Actual callers:

- `src/backend/leads/sources/googleMapsLeadSource.ts`
- `src/backend/leads/sources/directoryLeadSource.ts`

No non-leads callers were found.

Conclusion:

- `guessEmail(...)` is a leads-local helper
- it is not shared infra
- this is the real seam blocking direct provider migration away from the compatibility shim

## Seam Option Comparison

### A. Extract `guessEmail` to leads-local helper

Selected.

Candidate target:

- `src/backend/leads/sources/leadEmailGuessingService.ts`

Assessment:

- risk: low
- reviewability: high
- leverage: high, because it cleanly separates the last leads-local behavior from shared search infra
- keeps next step narrow without mixing search migration and helper extraction in the same pass

### B. Keep `serpApiHelper` as leads compatibility shim

Rejected for next-step selection.

Reason:

- valid as current state
- but it does not reduce the last duplicate/endgame seam

### C. Migrate providers directly

Rejected.

Reason:

- would mix two seams in one cycle:
  - shared search import migration
  - leads-local `guessEmail(...)` split
- that is broader than necessary

## Selected Decision

Decision:

- `guessEmail extraction next`

Recommended next target:

- `src/backend/leads/sources/leadEmailGuessingService.ts`

## Scope Guard

Not changed in this phase:

- no provider migration executed
- no deletion
- no `guessEmail(...)` extraction implementation yet
- no leads provider redesign
- no multi-domain migration
