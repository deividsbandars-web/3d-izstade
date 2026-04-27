# Phase 112 Diagnostics

## Scope

Phase:
- `DATASOURCES WEBSITE SCRAPER DUPLICATE REVIEW`

Intent:
- determine whether `src/backend/dataSources/websiteScraper.js` is a stale duplicate artifact or a required runtime surface

## Pair Classification

Audited pair:
- `src/backend/dataSources/websiteScraper.ts`
- `src/backend/dataSources/websiteScraper.js`

Classification:
- `.js` appears to be a stale checked-in duplicate of the TypeScript implementation

## Active Callers

Found:
- `src/backend/agents/tools/adapters/dataSourceToolAdapters.ts`
- `src/backend/revenue/offerGenerator.ts`

Import style:
- both are TypeScript callers importing the `.js` specifier
- no evidence found that they require the checked-in `.js` artifact outside TS build flow

## Dependency Audit

No direct dependency found from:
- root `package.json`
- `backend-server/package.json`
- worker entrypoints
- dynamic imports
- routes/controllers
- tests
- scripts

to:
- `src/backend/dataSources/websiteScraper.js`

## Checker Baseline

`npm.cmd run check:backend-boundaries`:
- domain duplicate warnings: `0`
- leads duplicate warnings: `0`
- billing boundary warnings: `0`
- violations: `0`

## Command Results

Passed in sandbox:
- `npm.cmd run check:expo-boundaries`
- `npm.cmd run check:backend-boundaries`
- `npx.cmd tsc -b`
- `npm.cmd --prefix backend-server run build`

Sandbox `spawn EPERM` only:
- `npm.cmd run build`

Passed outside sandbox:
- `npm.cmd run build`
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.controller.test.ts`

## Decision

- selected decision: `deletion next`
- next target: `src/backend/dataSources/websiteScraper.js`
