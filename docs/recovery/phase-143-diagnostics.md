# Phase 143 Diagnostics

Status: PASS

## Files Added

- `src/modules/expo/lib/sponsorScreenInteractionResolver.ts`
- `src/modules/expo/__tests__/sponsorScreenInteractionResolver.test.ts`

## Resolver Shape

Input:

- `id`
- `companyId`
- `ctaLabel`
- `title`
- `label`

Output:

- route action when `companyId` exists
- no-action diagnostic when `companyId` is missing

## Diagnostic / No-Action Cases

Supported:

- `missing-company-id`

Intentionally not produced in this slice:

- route ambiguity diagnostics beyond missing `companyId`
- pointer/click host diagnostics
- screen-facing diagnostics
- overlap/bounds diagnostics

## Regression Notes

Confirmed unchanged:

- `src/modules/expo/runtime/world/WorldCityScreenSurfaces.tsx`
- `src/modules/expo/lib/sponsorScreenLayout.ts`
- `src/modules/expo/runtime/planning/world-plan/buildCanonicalWorldPlan.ts`
- `src/shared/expo/worldContract.ts`
- booth feature stack
- calculator internals
- AI/chat backend

## Backend Baseline

- domain duplicate warnings: 0
- leads duplicate warnings: 0
- billing boundary warnings: 0
- violations: 0
