# Phase 82: Revenue Google Maps Adapter Seed

Status: PASS

## Summary

This phase removed the direct revenue prospecting import of the leads-local Google Maps provider from:

- `src/backend/revenue/prospecting/prospectingAdapters.ts`

and introduced a revenue-local seam:

- `src/backend/revenue/prospecting/prospectingGoogleMapsAdapter.ts`

No duplicate deletion was performed in this phase.

## Revenue Google Maps Coupling Audit Findings

Before this phase:

- `src/backend/revenue/prospecting/prospectingAdapters.ts` directly imported `src/backend/leads/sources/googleMapsLeadSource.js`
- revenue prospecting therefore depended directly on a leads-local source implementation

The Google Maps provider contract was already suitable for a narrow adapter seam:

- input: `niche`, `location`, `limit`
- output: `{ data, error }`

This made it safe to introduce a revenue-local adapter without changing the provider implementation.

## Revenue-Local Adapter Details

Added:

- `src/backend/revenue/prospecting/prospectingGoogleMapsAdapter.ts`

This new adapter:

- remains revenue-local
- internally calls `src/backend/leads/sources/googleMapsLeadSource.ts`
- preserves the current `ProspectLead[] | null` result shape
- does not change Google Maps provider behavior

The adapter is a seam only. It does not redesign prospecting flow or provider internals.

## `prospectingAdapters` Rewiring Details

Updated:

- `src/backend/revenue/prospecting/prospectingAdapters.ts`

Now:

- `prospectingAdapters.ts` imports `prospectingGoogleMapsAdapter.ts`
- it no longer imports `googleMapsLeadSource` directly
- `findProspectLeads(...)` delegates to the new revenue-local adapter

Behavior preserved:

- same input contract
- same output contract
- same downstream usage by revenue prospecting services

## Boundary Check Details

Updated:

- `scripts/check-backend-boundaries.mjs`

New enforcement:

- `src/backend/revenue/prospecting/prospectingAdapters.ts` must not import `src/backend/leads/sources/googleMapsLeadSource` directly
- the allowed runtime seam is `src/backend/revenue/prospecting/prospectingGoogleMapsAdapter.ts`

The check still allows:

- `prospectingAdapters.ts` to import `prospectingTypes.ts`

No other boundary rules were weakened.

## Validation Result

After the change:

- stabilized domain duplicate warnings remain `0`
- billing boundary warnings remain `0`
- leads duplicate warnings remain `3`
- `check:backend-boundaries` status is `PASS`

## Deferred

This phase did not:

- delete `googleMapsLeadSource.js`
- redesign `googleMapsLeadSource.ts`
- redesign `serpApiHelper`
- redesign revenue prospecting services
- redesign leads source collection
- touch `leadEngine`
