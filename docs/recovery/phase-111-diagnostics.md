# Phase 111 Diagnostics

## Scope

Phase:
- `NEXT BOUNDED CONTEXT CLEANUP TARGET REVIEW`

Intent:
- choose the next bounded-context cleanup target only after audit

## Baseline

Boundary checker baseline:
- domain duplicate warnings: `0`
- leads duplicate warnings: `0`
- billing boundary warnings: `0`
- violations: `0`

## Discovery Inputs

Used:
- `npm.cmd run check:backend-boundaries`
- duplicate `.ts/.js` pair scan under `src/backend/**`
- targeted file review for:
  - revenue application boundary
  - billing application boundary
  - leads application boundary
  - agents adapters
  - selected remaining duplicate clusters

## Candidate Snapshot

Low risk:
- `src/backend/dataSources/websiteScraper.ts/.js`

Medium risk:
- `src/backend/business/businessGenerator.ts/.js`
- `src/backend/billing/usage/**` duplicate cluster

High risk:
- `src/backend/events/**` duplicate cluster
- `src/backend/ai/**` + `src/backend/governance/**` duplicate cluster

## Stabilized Domain Check

Confirmed stable:
- agents
- revenue
- billing
- leads

No new active drift found in those already-cleaned zones.

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

- selected decision: `select next bounded-context cleanup target`
- selected target: `DATASOURCES WEBSITE SCRAPER DUPLICATE REVIEW`
