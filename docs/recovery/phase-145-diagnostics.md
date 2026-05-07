# Phase 145 Diagnostics

Status: PASS

## Screen Click Host Audit

Surface layer:

- `WorldCityScreenSurfaces.tsx`
- good geometry host
- weak action metadata

Assignment layer:

- `WorldCityScreenAssignments.tsx`
- strong action metadata
- renders actual sponsor-visible content
- best candidate for route-action gating

## Metadata Coverage

Real-data scan:

- screen surfaces: `22`
- screen assignments: `22`
- assignments with companyId: `22`
- assignments without companyId: `0`

Resolver scan from previous phase remained consistent:

- sponsor layout screens: `24`
- route actions: `23`
- no-action: `1`

## Runtime Risk Notes

Main risks before implementation:

- click vs camera-control conflict
- need for `stopPropagation()`
- no-action screens must remain inert
- cursor/hover affordance should not be overbuilt in first slice

## Selected Next Target

- `ONE INTERACTIVE SPONSOR SCREEN ROUTE ACTION FIRST SLICE`

## Backend Baseline

- domain duplicate warnings: 0
- leads duplicate warnings: 0
- billing boundary warnings: 0
- violations: 0
