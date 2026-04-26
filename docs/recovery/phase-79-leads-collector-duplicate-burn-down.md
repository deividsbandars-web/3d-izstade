# Phase 79: Leads Collector Duplicate Burn-Down

Status: PASS

## Summary

This phase removed one checked-in leads duplicate file:

- `src/backend/leads/sources/leadSourceCollectionService.js`

The authoritative implementation remains:

- `src/backend/leads/sources/leadSourceCollectionService.ts`

No source provider redesign, no lead engine redesign, and no source collection behavior changes were performed.

## Collector Duplicate Audit Findings

The duplicate pair before deletion was:

- `src/backend/leads/sources/leadSourceCollectionService.ts`
- `src/backend/leads/sources/leadSourceCollectionService.js`

Observed import graph for the `.js` file:

- `src/backend/leads/engine/leadEngine.ts`
- `src/backend/leads/engine/leadEngine.js`

Additional audit findings:

- no direct script entry in `package.json`
- no direct script entry in `backend-server/package.json`
- no worker entry path targeting `leadSourceCollectionService.js`
- no dynamic import path targeting `leadSourceCollectionService.js`
- no cross-domain callers targeting `leadSourceCollectionService.js`

The validated TypeScript implementation continues to own the same collection behavior:

- provider order: Google Maps -> Directory -> LinkedIn
- delay timing between providers
- merge/fan-in behavior for collected leads

## Deletion Decision

Deletion was approved because the duplicate file had a narrow engine-local import graph and no evidence of standalone runtime entry usage.

Deleted:

- `src/backend/leads/sources/leadSourceCollectionService.js`

Kept as authoritative:

- `src/backend/leads/sources/leadSourceCollectionService.ts`

No import rewrites were required.

## Runtime Safety Proof

After deletion:

- `npm.cmd run check:backend-boundaries` passed
- leads duplicate warnings dropped from `4` to `3`
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

Current summary after deletion:

- stabilized domain duplicate warnings: `0`
- leads duplicate warnings: `3`
- billing boundary warnings: `0`
- violations: `0`
- status: `PASS`

## Deferred

This phase did not:

- redesign source providers
- change Google Maps, Directory, or LinkedIn provider logic
- change provider order, delay, or merge behavior
- redesign `leadEngine`
- touch `googleMaps` or `serpApi` duplicate cleanup
