# Phase 37 Diagnostics

## Commands Run

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

## Results

- `check:expo-boundaries`: PASS
- `check:backend-boundaries`: PASS
- root TypeScript build: PASS
- backend TypeScript build: PASS
- root production build: PASS outside sandbox
- backend expo route/controller tests: PASS outside sandbox

## Boundary Check Output

`check:backend-boundaries` after removal:

- route files scanned: `3`
- controller/expo/distribution/platform/agents files scanned: `54`
- domain duplicate warnings: `1`
- agents cross-domain warnings: `0`
- violations: `0`
- status: `PASS`

Duplicate warning remaining:

- `src/backend/agents/engine/agentTools.js`

## Changed Files

- deleted `src/backend/agents/runners/salesRunner.js`
- `docs/recovery/phase-37-final-agents-runner-duplicate-removal.md`
- `docs/recovery/phase-37-diagnostics.md`

## Audit Notes

Audited import/runtime paths:

- `src/backend/agents/runners/salesRunner.*`
- `src/backend/agents/engine/agentTools.ts`
- `src/backend/agents/execution/agentExecutor.ts`
- `src/backend/agents/agentsApplicationService.ts`
- `backend-server/worker.ts`
- `backend-server/events/subscribers.ts`

Audit conclusion:

- runner source files are consumed through `agentExecutor.ts`
- no worker, subscriber, package script, or dynamic-import path required a physical `salesRunner.js` source file

## Remaining Risks

- agents duplicate debt now remains only in `agentTools`
- TypeScript source still uses `.js` specifiers, so the proof still depends on current TypeScript/tsx resolution behavior

## Explicit Deferred Items

- no `agentTools` cleanup
