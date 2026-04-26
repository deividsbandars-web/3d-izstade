# Phase 69 - Lead Validation Service Seed

## Summary

Phase 69 introduced a leads-local validation boundary by moving `validateLead(...)` out of `src/backend/leads/engine/leadEngine.ts` into `src/backend/leads/validation/leadValidationService.ts`.

This phase stayed intentionally narrow:
- no scoring changes
- no source collection changes
- no persistence changes
- no event publishing changes
- no scheduling changes
- no duplicate deletion

## Validation Behavior Audit Findings

Before this phase, `leadEngine.ts` defined a local `validateLead(lead)` helper with this exact behavior:

- return `false` when `lead.company_name` is missing
- return `false` when all of `lead.website`, `lead.phone`, and `lead.email` are missing
- otherwise return `true`

Input shape:
- lead-like object from the source collection path

Output shape:
- boolean only

Usage:
- `const validLeads = leads.filter(this.validateLead);`

Invalid leads were dropped by the filter stage before scoring and persistence.

## Lead Validation Service Details

Added:
- `src/backend/leads/validation/leadValidationService.ts`
- `src/backend/leads/validation/leadValidationService.js`

Service contract:
- `validateLead(lead): boolean`

Behavior is intentionally 1:1 with the old engine-local helper:
- `true` only when `company_name` exists
- and at least one of `website`, `phone`, or `email` exists

## leadEngine Rewiring Details

`src/backend/leads/engine/leadEngine.ts` now:
- imports `leadValidationService`
- builds `validLeads` via `leadValidationService.validateLead(...)`
- no longer defines a local `validateLead(...)` helper

Unchanged:
- scoring input
- source collection result handling
- persistence payload
- event payload
- scheduling behavior

## Boundary Check Details

`scripts/check-backend-boundaries.mjs` now keeps the existing lead engine protections and adds a narrow validation-specific rule:

- `leadEngine.ts` must not define a local `validateLead(...)` helper
- `leadEngine.ts` may use the leads-local validation boundary under `src/backend/leads/validation/**`

Existing protections remain:
- no direct `supabaseClient` import in `leadEngine.ts`
- no direct `eventPublisher` import in `leadEngine.ts`
- no direct `agentScheduler` import in `leadEngine.ts`
- no direct source provider imports in `leadEngine.ts`
- `leadsController.ts` may import only `leadsApplicationService.ts` from the leads domain

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

Leads-specific automated tests were not found.

## Remaining leadEngine Responsibilities

`leadEngine.ts` still owns:
- scoring call coordination
- persistence delegation to `leadService`
- event publishing delegation to `leadEventService`
- scheduling delegation to `leadAgentSchedulingService`

## Deferred

- no scoring service seed
- no duplicate burn-down
- no source provider changes
- no growth cleanup
