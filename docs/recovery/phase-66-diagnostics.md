# Phase 66 Diagnostics

## Files Audited

- `src/backend/leads/engine/leadEngine.ts`
- `src/backend/leads/engine/leadEngine.js`
- `src/backend/leads/leadScoring.ts`
- `src/backend/leads/leadScoring.js`
- `src/backend/leads/sources/googleMapsLeadSource.ts`
- `src/backend/leads/sources/directoryLeadSource.ts`
- `src/backend/leads/sources/linkedinLeadSource.ts`
- `src/backend/leads/sources/serpApiHelper.ts`

## Key Findings

- scoring is already almost isolated as a direct `leadScoring.scoreLead(...)` call
- source provider orchestration still lives entirely in `leadEngine.collectLeads(...)`
- `leadEngine` still owns:
  - provider ordering
  - pause/rate-limit timing
  - result merge/fan-in
- this makes source collection the stronger next isolation candidate

## Candidate Ranking

1. Source collection boundary
2. Scoring boundary

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
- leads duplicate warnings: `8`
- billing boundary warnings: `0`
- violations: `0`
