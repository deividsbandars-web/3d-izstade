# Phase 27: Platform Duplicate Burn-Down Phase 3

## Outcome

Phase 27 safely removed one additional platform duplicate pair:

- `src/backend/platform/usageService.js`

This reduced platform duplicate warnings from two to one, while keeping:

- distribution duplicate warnings at zero
- expo boundary protections green
- backend boundary protections green

## Platform duplicate audit findings

Audited:

- `src/backend/platform/usageService.*`
- `src/backend/platform/intelligence/platformBrain.*`
- `src/backend/platform/platformApplicationService.ts`
- `backend-server/controllers/platformController.ts`
- `backend-server/controllers/dashboardController.ts`
- `backend-server/routes/api.ts`
- `backend-server/events/subscribers.ts`
- `backend-server/package.json`
- `src/backend/ai/llmService.ts`
- `src/backend/governance/costMonitor.ts`

What the audit showed:

- `usageService.js` had a broader import graph than `systemMonitor.js`, but it was still only consumed through normal `.js` specifier imports from backend source code
- active imports came from:
  - `src/backend/ai/llmService.ts`
  - `src/backend/governance/costMonitor.ts`
- there were no special worker, package-script, or dynamic-import paths depending on a physical `usageService.js` source file
- `usageService.ts` is the maintained authoritative implementation
- `platformBrain.js` remains riskier because it still has a direct runtime-facing event subscriber import path

That made `usageService.js` safe enough for a single-pair burn-down in this cycle.

## Duplicate removal decision

Removed:

- `src/backend/platform/usageService.js`

Why this was safe:

- the `.js` import shape in backend callers stayed unchanged
- root TypeScript build remained green
- backend build remained green
- frontend build and required backend expo tests remained green outside sandbox
- `check:backend-boundaries` stayed `PASS` and the `usageService.js` warning disappeared

## End state after this phase

Remaining platform duplicate warnings:

- `platformBrain.js` / `.ts`

Distribution duplicate warnings remain:

- `0`
