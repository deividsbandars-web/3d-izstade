# Phase 45: Revenue Client Prospector / Leads Coupling Cleanup

## What was importing `clientProspector` before

Audit result:

- no active callers were importing `src/backend/revenue/clientProspector.ts`

That made this a good controlled cleanup target:

- it was structurally risky
- but not an active public runtime surface

## Coupling found

Before this phase, `src/backend/revenue/clientProspector.ts` directly imported:

- `src/backend/leads/sources/googleMapsLeadSource.ts`
- shared logging
- Supabase client

That meant one file combined:

- revenue-facing prospecting entry
- direct leads/data-source coupling
- persistence/orchestration

This was the exact kind of revenue -> leads coupling knot left open after Phase 41.

## New prospecting boundary

Added a revenue-local prospecting slice:

- `src/backend/revenue/prospecting/prospectingTypes.ts`
- `src/backend/revenue/prospecting/prospectingAdapters.ts`
- `src/backend/revenue/prospecting/revenueProspectingService.ts`

Boundary shape now:

- `clientProspector.ts` = thin compatibility surface
- `revenueApplicationService.ts` = caller-facing revenue boundary
- `prospecting/revenueProspectingService.ts` = revenue-local prospecting orchestration
- `prospecting/prospectingAdapters.ts` = localized leads/data-source adapter boundary

## What moved

Moved out of `clientProspector.ts`:

- direct `googleMapsLeadSource` usage
- prospect storage orchestration
- logging for the prospecting workflow

`clientProspector.ts` now delegates to `revenueProspectingService.ts`.

`revenueApplicationService.ts` now also exposes:

- `findProspectsForRevenue(...)`

This gives the revenue domain a caller-facing prospecting boundary instead of a low-level utility file.

## Agents to revenue boundary

Agents did not directly import `clientProspector.ts` before this phase, and still do not now.

This phase tightened that further by making `check-backend-boundaries` fail if:

- `src/backend/agents/**` or `src/agents/**` import:
  - `src/backend/revenue/clientProspector.ts`
  - `src/backend/revenue/prospecting/revenueProspectingService.ts`
  - `src/backend/revenue/prospecting/prospectingAdapters.ts`

The required path remains:

- agents -> `revenueApplicationService.ts`

## Coupling that remains

The prospecting slice still depends on leads infrastructure through:

- `googleMapsLeadSource`

This is still acceptable in this phase because:

- the dependency is now localized to a prospecting adapter layer
- no leads business logic was copied into revenue
- the change was a bounded-context isolation step, not a leads redesign

## Boundary check protection

`scripts/check-backend-boundaries.mjs` now also protects:

- `clientProspector.ts` must not import leads/dataSources directly
- `prospectingAdapters.ts` is the allowlisted place for leads/dataSources prospecting dependencies
- agents and `src/agents/**` must not import low-level revenue prospecting implementation directly
- duplicate warnings remain `0` for revenue/agents/platform/distribution

## Deferred

- no `clientProspector` product redesign
- no broader revenue redesign
- no leads or dataSources redesign
- no new agents prospecting tool use-case was added in this phase
