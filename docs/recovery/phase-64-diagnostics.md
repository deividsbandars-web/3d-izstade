# Phase 64 Diagnostics

## Files Audited

- `src/backend/leads/engine/leadEngine.ts`
- `src/backend/leads/engine/leadEngine.js`
- `src/agents/system/scheduler/agentScheduler.js`
- `src/agents/system/scheduler/agentScheduler.ts`
- `src/backend/queue/taskQueue.ts`
- `src/backend/agents/agentsApplicationService.ts`
- `src/backend/leads/leadsApplicationService.ts`

## Key Findings

- `leadEngine` scheduling lives only in `assignLead(...)`
- the engine sends a single `dispatchTask(...)` call with:
  - `agent_id`
  - `status: 'pending'`
  - `task_data.action = 'Perform Outreach'`
  - `task_data.lead_id = leadId`
- scheduling is separate from `processAndStoreLeads(...)`
- scheduling is not sequenced after persistence or event publishing inside the collection loop
- `agentScheduler` is itself only a thin persistence wrapper over `agent_tasks`
- `taskQueue.ts` later consumes `agent_tasks` and calls `agentsApplicationService.runAgentTask(...)`

## Candidate Ranking

1. Leads-local scheduling helper
2. Keep scheduling in engine for now
3. Future convergence toward agentsApplicationService

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
