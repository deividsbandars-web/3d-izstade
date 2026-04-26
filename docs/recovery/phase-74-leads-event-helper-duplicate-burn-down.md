# Phase 74 - Leads Event Helper Duplicate Burn-Down

## Summary

Phase 74 removed one leads duplicate file:
- `src/backend/leads/events/leadEventService.js`

The authoritative implementation remains:
- `src/backend/leads/events/leadEventService.ts`

No event payload or timing behavior was changed.

## Event Helper Duplicate Audit Findings

Before deletion, the event helper duplicate surface was:
- `src/backend/leads/events/leadEventService.ts`
- `src/backend/leads/events/leadEventService.js`

Real code importers for the `.js` specifier were only:
- `src/backend/leads/engine/leadEngine.ts`
- `src/backend/leads/engine/leadEngine.js`

Additional proof gathered before deletion:
- no package script referenced `leadEventService.js`
- no backend worker entry referenced `leadEventService.js`
- no dynamic import path referenced `leadEventService.js`
- no cross-domain callers referenced `leadEventService.js`

Current TS implementation still publishes the same event path:
- `PlatformEvent.LEAD_CREATED`
- payload: `{ leadId, score, industry }`
- timing: only after successful persistence, as coordinated by `leadEngine`

## Deletion Decision

Deleted:
- `src/backend/leads/events/leadEventService.js`

Kept:
- `src/backend/leads/events/leadEventService.ts`

No import rewrites were required.

## Runtime Safety Proof

Post-deletion proof:

1. `check:backend-boundaries` passed and leads duplicate warnings dropped from `8` to `7`.
2. `npx tsc -b` passed.
3. `npm --prefix backend-server run build` passed.
4. Full app build passed outside sandbox after the known `spawn EPERM` sandbox restriction was bypassed.
5. Backend `tsx` route tests passed outside sandbox after the same sandbox restriction was bypassed.

This shows the deleted checked-in `.js` file was not required as a separate runtime implementation for the validated project paths.

## Boundary Check Result

Boundary protections remain intact:
- `leadsController -> leadsApplicationService`
- `leadEngine -> supabaseClient` direct import ban
- `leadEngine -> eventPublisher` direct import ban
- `leadEngine -> agentScheduler` direct import ban
- `leadEngine -> source provider direct import` ban
- local `validateLead(...)` ban in `leadEngine`

Current summary after deletion:
- stabilized domain duplicate warnings: `0`
- leads duplicate warnings: `7`
- billing boundary warnings: `0`
- violations: `0`
- status: `PASS`

## Validation Results

Passed in sandbox:
- `npm.cmd run check:expo-boundaries`
- `npm.cmd run check:backend-boundaries`
- `npx.cmd tsc -b`
- `npm.cmd --prefix backend-server run build`

Sandbox-restricted with `spawn EPERM`:
- `npm.cmd run build`
- `npx.cmd tsx routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx routes/__tests__/expoScene.controller.test.ts`

Passed outside sandbox on the same machine:
- `npm.cmd run build`
- `npx.cmd tsx routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx routes/__tests__/expoScene.controller.test.ts`

Leads/events-specific automated tests were not found.

## Deferred

- no event bus redesign
- no event payload changes
- no leadEngine redesign
- no source provider cleanup
