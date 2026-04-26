# Phase 46: Revenue Prospecting Application-Service Capability

## Previous prospecting contract

Before this phase:

- `revenueApplicationService.ts` already exposed `findProspectsForRevenue(...)`
- but the request/result contract was still implicit
- `clientProspector.ts` still delegated to `revenueProspectingService.ts` instead of to the caller-facing revenue boundary

That meant the right boundary existed structurally, but the canonical caller-facing contract was not yet explicit enough.

## Canonical caller-facing entry

After this phase, the canonical caller-facing prospecting entry is explicitly:

- `src/backend/revenue/revenueApplicationService.ts`

Caller-facing capability:

- `findProspectsForRevenue(request: RevenueProspectingRequest): Promise<RevenueProspectingResult>`

This is now the intended entry for:

- future agents-facing usage
- compatibility callers
- future backend callers that need revenue prospecting

## Request/result contract

Explicit prospecting types now live in:

- `src/backend/revenue/prospecting/prospectingTypes.ts`

Key exported types:

- `RevenueProspectingRequest`
- `RevenueProspectingResult`
- `RevenueProspect`

That makes the capability contract clearer:

- input shape is explicit
- result shape is explicit
- empty/error behavior remains stable via `{ data: null, error: string }`

## Internal orchestration split

The responsibility split is now:

- `revenueApplicationService.ts` = caller-facing capability boundary
- `revenueProspectingService.ts` = internal prospecting orchestration
- `prospectingAdapters.ts` = localized leads/dataSources adapter layer

This keeps application service authority clear without turning it into the implementation blob.

## Agents-facing path

Agents-facing usage remains boundary-safe:

- `src/backend/agents/tools/adapters/revenueToolAdapters.ts` still imports only `revenueApplicationService.ts`
- it now has a prospecting-capable entry available through that same boundary
- no new product/UI flow was added

Blocked import paths remain:

- `src/backend/agents/**` must not import low-level prospecting internals
- `src/agents/**` must not import low-level prospecting internals

## clientProspector compatibility

`src/backend/revenue/clientProspector.ts` is now clearly compatibility-only:

- short comment marks `revenueApplicationService.ts` as canonical
- it delegates only to `revenueApplicationService.findProspectsForRevenue(...)`
- it no longer points directly at internal prospecting orchestration

## Boundary check protection

`scripts/check-backend-boundaries.mjs` now protects:

- agents and `src/agents/**` must not import:
  - `clientProspector.ts`
  - `prospecting/revenueProspectingService.ts`
  - `prospecting/prospectingAdapters.ts`
- `revenueToolAdapters.ts` still may only import `revenueApplicationService.ts` from revenue
- `clientProspector.ts` must remain a compatibility-only delegator to `revenueApplicationService.ts`
- duplicate warnings remain `0` for revenue/agents/platform/distribution

## Deferred

- no new prospecting product flow
- no leads/dataSources redesign
- no billing redesign
- no agents tool-system redesign
- no broader revenue redesign
