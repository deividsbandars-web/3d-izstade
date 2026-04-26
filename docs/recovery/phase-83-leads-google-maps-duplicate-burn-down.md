# Phase 83: Leads Google Maps Duplicate Burn-Down

Status: PASS

## Summary

This phase removed one checked-in leads duplicate file:

- `src/backend/leads/sources/googleMapsLeadSource.js`

The authoritative implementation remains:

- `src/backend/leads/sources/googleMapsLeadSource.ts`

No provider redesign, no SerpAPI redesign, and no lead engine redesign was performed.

## Google Maps Duplicate Audit Findings

The duplicate pair before deletion was:

- `src/backend/leads/sources/googleMapsLeadSource.ts`
- `src/backend/leads/sources/googleMapsLeadSource.js`

Observed import graph for the `.js` file after the Phase 82 seam change:

- `src/backend/leads/sources/leadSourceCollectionService.ts`
- `src/backend/revenue/prospecting/prospectingGoogleMapsAdapter.ts`

Additional audit findings:

- no direct script entry in `package.json`
- no direct script entry in `backend-server/package.json`
- no worker entry path targeting `googleMapsLeadSource.js`
- no dynamic import path targeting `googleMapsLeadSource.js`
- no remaining direct revenue import from `prospectingAdapters.ts`

## Deletion Decision

Deletion was approved because the duplicate file no longer sat behind a direct cross-domain caller in `prospectingAdapters.ts`, and no standalone runtime entry usage was found.

Deleted:

- `src/backend/leads/sources/googleMapsLeadSource.js`

Kept as authoritative:

- `src/backend/leads/sources/googleMapsLeadSource.ts`

No import rewrites were required.

## Runtime Safety Proof

After deletion:

- `npm.cmd run check:backend-boundaries` passed
- leads duplicate warnings dropped from `3` to `2`
- `npx.cmd tsc -b` passed
- `npm.cmd --prefix backend-server run build` passed
- `npm.cmd run build` passed outside sandbox after the known sandbox `spawn EPERM` restriction
- backend `tsx` route tests passed outside sandbox after the same sandbox restriction

This is sufficient proof that the deleted checked-in `.js` file was not required as a separate runtime implementation in the validated paths.

## Boundary Check Result

Existing backend boundary protections remain intact:

- `leadsController -> leadsApplicationService`
- `leadEngine -> supabaseClient` direct import ban
- `leadEngine -> eventPublisher` direct import ban
- `leadEngine -> agentScheduler` direct import ban
- `leadEngine -> source provider direct import` ban
- local `validateLead(...)` ban in `leadEngine`
- `prospectingAdapters.ts` must use the revenue-local Google Maps adapter seam

Current summary after deletion:

- stabilized domain duplicate warnings: `0`
- leads duplicate warnings: `2`
- billing boundary warnings: `0`
- violations: `0`
- status: `PASS`

## Deferred

This phase did not:

- redesign the Google Maps provider
- redesign `serpApiHelper`
- redesign revenue prospecting services
- redesign leads source collection
- touch `leadEngine`
