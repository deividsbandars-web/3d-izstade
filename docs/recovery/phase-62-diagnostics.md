# Phase 62 Diagnostics

## Files Audited

- `src/backend/leads/engine/leadEngine.ts`
- `src/backend/leads/leadService.ts`
- `src/backend/leads/leadsApplicationService.ts`
- `src/backend/growth/leadCapture.ts`
- `src/backend/events/eventPublisher.ts`
- `src/backend/events/eventTypes.ts`
- `scripts/check-backend-boundaries.mjs`

## Key Audit Findings

- `leadEngine.ts` previously inserted into `leads` directly through `supabaseClient`
- persisted lead row data was required for:
  - `storedLeads.push(data)`
  - `PlatformEvent.LEAD_CREATED` with `data.id`
- `assignLead(...)` is independent and remained untouched
- `leadService.ts` was the cleanest existing home for the persistence boundary

## Code Changes

- added `leadService.persistCollectedLead(...)`
- rewired `leadEngine.processAndStoreLeads(...)` to call `leadService`
- added a narrow boundary rule blocking `leadEngine.ts -> supabaseClient`

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
- leads duplicate warnings: `6`
- billing boundary warnings: `0`
- violations: `0`

## Remaining Internal `leadEngine` Responsibilities

- source collection
- validation
- scoring
- event publishing
- agent scheduling

## Deferred Risks

- checked-in `leadEngine.js` remains part of the known leads duplicate surface
- event publishing still depends on persisted lead rows inside the engine flow
- growth/leadCapture coupling remains behind `leadsApplicationService`
