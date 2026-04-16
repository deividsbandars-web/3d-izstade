# World Recovery Baseline

Date: 2026-04-17

## Accepted Baseline

This document records the accepted world baseline restored during PHASE-01.

- Accepted branch: `work/world-recovery-freeze`
- Accepted from trusted stash: `stash@{0}`
- Recovery note: [world-recovery-note.md](./world-recovery-note.md)

## Files Restored To Trusted Baseline

- `src/modules/expo/runtime/world/ExpoRearCampusLayout.ts`
- `src/modules/expo/runtime/world/WorldCityMasses.tsx`
- `src/modules/expo/runtime/world/WorldCityMegaLandmarks.tsx`
- `src/modules/expo/runtime/world/WorldCitySkeleton.tsx`
- `src/modules/expo/runtime/world/WorldCityTowers.tsx`

## Acceptance Scope

The restored baseline was accepted for visual verification across:

- left
- arrival
- mid
- right
- rear / stadium

## Intentionally Unresolved At This Checkpoint

This checkpoint does not claim that the project is architecturally repaired.

It only establishes a trusted visual world baseline so later phases can proceed from a stable reference instead of an uncertain mixed state.

The following remain intentionally unresolved for later phases:

- world owner refactor
- reserve contract repair
- ground/perimeter hierarchy cleanup
- booth slot-bank migration
- data-contract unification
- AI/security hardening

## Validation

- `npx.cmd tsc -b` passed at baseline acceptance time
- Restored world-owner files matched the trusted stash exactly

