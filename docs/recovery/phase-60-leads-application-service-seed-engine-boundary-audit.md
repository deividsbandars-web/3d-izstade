# Phase 60 - Leads Application-Service Seed + Engine Boundary Audit

## Goal

Introduce a minimal caller-facing leads boundary and remove the direct controller import
of `leadEngine`.

This phase intentionally does **not** redesign the leads domain:

- no full leads redesign
- no growth cleanup
- no event bus redesign
- no duplicate burn-down
- no source/scoring/storage refactor

## Audited Files

- `backend-server/controllers/leadsController.ts`
- `src/backend/leads/engine/leadEngine.ts`
- `src/backend/leads/leadService.ts`
- `src/backend/growth/leadCapture.ts`
- `src/backend/events/eventPublisher.ts`
- `src/backend/events/eventTypes.ts`

## Controller Audit Findings

Before this phase, `backend-server/controllers/leadsController.ts` directly mixed:

- request parsing and validation
- analytics capture
- direct low-level import of `src/backend/leads/engine/leadEngine.js`
- direct Supabase CRUD for leads table access
- dynamic import of `src/backend/growth/leadCapture.js`

That meant the controller itself was acting as the effective leads entry boundary.

## New Leads Boundary

Added:

- `src/backend/leads/leadsApplicationService.ts`

This is now the caller-facing leads boundary for:

- list leads for a user
- generate leads
- capture inbound landing-page lead
- create lead
- update lead
- get leads by source

The service deliberately keeps `leadEngine` internal for now.

## What Stayed Internal

`src/backend/leads/engine/leadEngine.ts` remains internal orchestration in this phase.

It still owns:

- source collection
- validation
- scoring
- storage
- event publishing
- agent scheduling

This phase only removes it from the controller-facing surface.

## Growth Coupling Note

`src/backend/growth/leadCapture.ts` still participates in the overall lead flow.

This phase does **not** redesign that coupling. Instead:

- `leadsController.ts` no longer imports growth directly
- `leadsApplicationService.ts` now hides that cross-domain touchpoint behind the leads
  boundary

This is an intentional containment step, not a claim that the growth/leads boundary is
finished.

## Boundary Check Expansion

`scripts/check-backend-boundaries.mjs` now enforces:

- `backend-server/controllers/leadsController.ts` may import from leads only:
  - `src/backend/leads/leadsApplicationService.ts`
- direct controller -> `leadEngine` import is now a violation

Added audit visibility:

- `leads` duplicate warnings are now printed separately from the already stabilized
  duplicate domains

Current leads duplicate warnings:

- `src/backend/leads/engine/leadEngine.js`
- `src/backend/leads/leadScoring.js`
- `src/backend/leads/sources/directoryLeadSource.js`
- `src/backend/leads/sources/googleMapsLeadSource.js`
- `src/backend/leads/sources/linkedinLeadSource.js`
- `src/backend/leads/sources/serpApiHelper.js`

## Deferred Items

- no `leadEngine` internal split
- no growth/leadCapture redesign
- no leads duplicate burn-down
- no source-specific cleanup
- no event publishing redesign inside leads

## Recommended Next Phase

`LEAD ENGINE INTERNAL SLICE AUDIT`

Recommended narrow target:

- separate `leadEngine` responsibilities conceptually
- decide whether storage/event publishing or agent scheduling should move behind
  narrower internal leads services first

Do **not** combine that with duplicate removal in the same cycle.
