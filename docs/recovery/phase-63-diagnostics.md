# Phase 63 Diagnostics

## Files Audited

- `src/backend/leads/engine/leadEngine.ts`
- `src/backend/leads/engine/leadEngine.js`
- `src/backend/leads/leadService.ts`
- `src/backend/events/eventPublisher.ts`
- `src/backend/events/eventTypes.ts`
- `src/backend/leads/leadsApplicationService.ts`
- `scripts/check-backend-boundaries.mjs`

## Key Audit Findings

- `LEAD_CREATED` was published only after successful persistence
- published payload shape was:
  - `leadId`
  - `score`
  - `industry`
- `leadEngine` did not need to know event bus details directly
- moving publishing behind a leads-local helper was safe without behavior change

## Code Changes

- added `src/backend/leads/events/leadEventService.ts`
- added `src/backend/leads/events/leadEventService.js`
- rewired `leadEngine.ts` to use `leadEventService.publishLeadCreated(...)`
- mirrored the same change in `leadEngine.js` for runtime parity
- tightened `check-backend-boundaries.mjs` with a dedicated `leadEngine` boundary check

## Commands Run

Passed in sandbox:

```powershell
npm.cmd run check:expo-boundaries
npm.cmd run check:backend-boundaries
npx.cmd tsc -b
npm.cmd --prefix backend-server run build
```

Failed in sandbox due environment restriction:

```powershell
npm.cmd run build
npx.cmd tsx routes/__tests__/expoScene.test.ts
npx.cmd tsx routes/__tests__/expoScene.controller.test.ts
```

Passed outside sandbox on the same machine:

```powershell
npm.cmd run build
npx.cmd tsx routes/__tests__/expoScene.test.ts
npx.cmd tsx routes/__tests__/expoScene.controller.test.ts
```

## Current Boundary Summary

- `check:backend-boundaries`: `PASS`
- `check:expo-boundaries`: `PASS`
- stabilized domain duplicate warnings: `0`
- leads duplicate warnings: `7`
- billing boundary warnings: `0`
- violations: `0`

## Remaining `leadEngine` Responsibilities

- source collection
- validation
- scoring
- persistence call via `leadService`
- agent scheduling

## Notes

- the additional leads duplicate warning comes from the new checked-in `leadEventService.js/.ts` pair
- that pair was added for runtime parity, not as duplicate cleanup
