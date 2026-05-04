# Phase 160 Diagnostics

Status: PASS

## Scope

Phase 160 audited whether the next diagnostic seam can safely be screen-to-booth proximity.

No implementation was done.

## Exact Blockers

### 1. `layoutFootprint` is not booth-local

`ExpoBoothPlacement.layoutFootprint` currently comes from the shared boulevard plan footprint:

- same value on every fallback booth placement
- usable for world footprint reasoning
- not usable for per-booth proximity AABB

### 2. Canonical screen surfaces currently contain non-finite Z positions

Read-only inspection showed:

```ts
{
  id: 'screen-marquee-left-0',
  position: [ -708, 148, NaN ],
  ...
}
```

And:

- `diagnoseScreenSurfaceBounds(plan.filteredScreenSurfaces).length === 24`

This directly blocks a reliable new proximity helper.

## Scan Summary

Read-only scan reported:

```json
{
  "screenSurfaceCount": 24,
  "boothPlacementCount": 3,
  "missingScreenBoundsCount": 0,
  "missingBoothFootprintCount": 0,
  "layoutFootprintSameForAll": true
}
```

Interpretation:

- booth footprint presence is misleading because it is global, not booth-local
- screen bounds shape presence is also misleading because canonical values include non-finite Z

## Decision

Selected decision:

- `SCREEN-BOOTH PROXIMITY REVIEW DEFER WITH EXACT BLOCKER`

## Validation Summary

Sandbox pass:

- `npm.cmd run check:expo-boundaries`
- `npm.cmd run check:backend-boundaries`
- `npx.cmd tsc -b`
- `npm.cmd --prefix backend-server run build`

Outside-sandbox pass:

- `npm.cmd run build`
- `npx.cmd tsx src/modules/expo/__tests__/screenOrientationDiagnostics.test.ts`
- `npx.cmd tsx src/modules/expo/__tests__/boothFrontalityDiagnostics.test.ts`
- `npx.cmd tsx src/modules/expo/__tests__/sponsorScreenInteractionResolver.test.ts`
- `npx.cmd tsx src/modules/expo/__tests__/screenSurfaceBoundsDiagnostics.test.ts`
- `npx.cmd tsx src/modules/expo/__tests__/screenSurfaceOverlapDiagnostics.test.ts`
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.controller.test.ts`

## Backend Baseline

- domain duplicate warnings: `0`
- leads duplicate warnings: `0`
- billing boundary warnings: `0`
- violations: `0`
