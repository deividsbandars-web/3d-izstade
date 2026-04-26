# Phase 81: Leads Google Maps Provider Decoupling Review

Status: PASS

## Summary

This phase audited the shared Google Maps provider seam between:

- `src/backend/leads/sources/googleMapsLeadSource.ts`
- `src/backend/revenue/prospecting/prospectingAdapters.ts`

No files were deleted and no provider redesign was implemented.

Decision:

- prepare a `revenue-local adapter boundary`

The purpose of that next seam is to remove direct revenue dependence on a leads-local source implementation before attempting any duplicate cleanup on `googleMapsLeadSource.js`.

## Google Maps Provider Usage Audit Findings

The Google Maps provider currently lives under the leads source cluster:

- `src/backend/leads/sources/googleMapsLeadSource.ts`
- duplicate runtime risk file: `src/backend/leads/sources/googleMapsLeadSource.js`

The provider contract is:

- input: `(query: string, location: string, limit: number = 10)`
- output: `{ data, error }`

Returned `data` is a lead-like collection shaped with:

- `company_name`
- `website`
- `email`
- `phone`
- `location`
- `metadata.rating`
- `metadata.reviews`
- `metadata.type`
- `metadata.serpapi_id`

It depends on:

- `serpApiHelper.search(...)`
- `serpApiHelper.guessEmail(...)`

## Leads Usage Details

Leads uses the provider through:

- `src/backend/leads/sources/leadSourceCollectionService.ts`

Observed usage:

- Google Maps is the first provider in the collection order
- then delay
- then Directory
- then delay
- then LinkedIn
- the results are merged into one combined leads array

For leads, `googleMapsLeadSource` behaves like a leads-local source implementation inside the source collection pipeline.

## Revenue Prospecting Usage Details

Revenue uses the same provider through:

- `src/backend/revenue/prospecting/prospectingAdapters.ts`

Observed usage:

- `findProspectLeads(niche, location, limit)` directly calls `googleMapsLeadSource.fetchLeads(...)`
- the result is cast/mapped to `ProspectLead[] | null`
- no additional revenue-local boundary exists between revenue prospecting and the leads-local provider

This means revenue currently depends on a file that semantically lives inside the leads bounded context.

## Option Comparison

### A. Keep shared provider as-is

- Pros:
  - no code changes
  - shared contract already works for both callers
- Cons:
  - duplicate cleanup on `googleMapsLeadSource.js` stays blocked by cross-domain usage
  - revenue continues to depend directly on leads-local source implementation

### B. Revenue-local adapter boundary

- Pros:
  - narrowest next seam
  - preserves current Google Maps provider implementation
  - gives revenue an explicit local boundary before any duplicate burn-down
- Cons:
  - still leaves the Google Maps provider physically under `leads` for now

### C. Shared data-source boundary

- Pros:
  - more semantically central home for Google Maps search infrastructure
- Cons:
  - too broad for the current recovery step
  - easily becomes dataSources/revenue/leads redesign

## Selected Decision

Selected decision:

- `B. Revenue-local adapter boundary`

## Selection Rationale

This is the narrowest safe next step because:

- leads still uses Google Maps as a leads-local source provider
- revenue is the only current caller making the provider shared across bounded contexts
- removing that direct revenue import is enough to create a cleaner seam before reassessing duplicate deletion

`Keep as-is` would leave duplicate cleanup blocked.

`Shared data-source extraction` is a valid long-term architecture option, but too broad for the current phase.

## Files Likely Affected Next Phase

If the next phase follows this decision, likely touched files are:

- `src/backend/revenue/prospecting/prospectingAdapters.ts`
- a new revenue-local adapter file under `src/backend/revenue/prospecting/**`
- possibly `scripts/check-backend-boundaries.mjs`

Audit context:

- `src/backend/leads/sources/googleMapsLeadSource.ts`
- `src/backend/leads/sources/googleMapsLeadSource.js`

## Files Explicitly Out Of Scope Next Phase

Out of scope for the next narrow implementation slice:

- `src/backend/leads/sources/googleMapsLeadSource.ts` redesign
- `src/backend/leads/sources/serpApiHelper.ts` redesign
- `src/backend/leads/engine/leadEngine.ts` refactor
- broad revenue prospecting redesign
- growth/dataSources cleanup
- duplicate deletion in the same phase
