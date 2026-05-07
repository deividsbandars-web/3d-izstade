# Phase 125 - Calculator City Action Binding

## Summary

Phase 125 added a narrow route-based calculator entrypoint to the existing booth/city CTA seam.

Result:

- Web3D booth UI now exposes calculator access
- access is route-based and opens the existing `/calculators` surface
- no calculator component rewrite was performed
- no world registry or layout redesign was introduced

## Implementation Change

The implementation reused the existing sponsor booth CTA model.

Added:

- new CTA kind: `calculators`
- route target: `/calculators`

Behavior:

- booth CTA strips can now include a calculator action
- clicking the calculator CTA navigates to the existing calculator hub route
- demo room navigation remains unchanged
- external website and booking CTA behavior remains unchanged

## Existing Action Seam Used

The change was made through the existing sponsor booth interaction seam:

- `src/modules/expo/lib/sponsorBoothPresentation.ts`
- `src/modules/expo/runtime/booths/BoothInteractions.ts`
- `src/modules/expo/runtime/booths/BoothFeatureContent.tsx`

Specific seam choice:

- action definition lives in `buildSponsorCtas(...)`
- route resolution lives in `resolveSponsorCtaIntent(...)`
- click handling lives in `handleBoothAction(...)`
- CTA rendering stays in the existing booth CTA strip

This kept the change inside one narrow city/booth interaction seam.

## Calculator Route / Action Behavior

New route behavior:

- `calculators` CTA resolves to `/calculators`

Important constraints preserved:

- no direct per-calculator binding was added in this phase
- no missing calculator routes were added in this phase
- no attempt was made to embed calculators into 3D surfaces

UI/layout adjustment:

- the CTA strip was made count-aware so it can render 4 actions safely
- this was required because many booths can now expose:
  - website
  - booking
  - calculators
  - demo room

## Files Changed

Changed source files:

- `src/modules/expo/lib/sponsorBoothPresentation.ts`
- `src/modules/expo/runtime/booths/BoothInteractions.ts`
- `src/modules/expo/runtime/booths/BoothFeatureContent.tsx`
- `src/modules/expo/__tests__/sponsorBoothPresentation.test.ts`

Added phase artifacts:

- `docs/recovery/phase-125-calculator-city-action-binding.md`
- `docs/recovery/phase-125-diagnostics.md`
- `diagnostics/project-analysis-bundle-phase-125.zip`

## Files Explicitly Not Changed

Not changed:

- `src/modules/calculators/**`
- `src/shared/expo/worldContract.ts`
- `src/modules/expo/runtime/world/**`
- `src/App.tsx`
- `src/modules/expo/Marketplace.tsx`
- `src/components/chat/GlobalChat.tsx`

## Out-Of-Scope Confirmation

This phase did not do:

- calculator UI rewrite
- per-calculator route expansion
- in-scene calculator stand registry
- AI stand implementation
- screen/booth orientation redesign
- backend duplicate cleanup
- broad world contract redesign

## Validation Results

Passed in sandbox:

- `npm.cmd run check:expo-boundaries`
- `npm.cmd run check:backend-boundaries`
- `npx.cmd tsc -b`
- `npm.cmd --prefix backend-server run build`

Sandbox-only `spawn EPERM`:

- `npm.cmd run build`
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.controller.test.ts`

Passed outside sandbox on the same machine:

- `npm.cmd run build`
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.controller.test.ts`

Backend baseline remains:

- domain duplicate warnings: `0`
- leads duplicate warnings: `0`
- billing boundary warnings: `0`
- violations: `0`

## Remaining Calculator Gaps

Still unresolved after this phase:

- `CalculatorsHub.tsx` still advertises more calculator paths than `App.tsx` registers
- calculators are still route-level surfaces, not physical in-scene stands
- no calculator node metadata was added to `worldContract`
- no per-calculator booth assignment or stand placement exists

## Next-Cycle Recommendation

Next phase:

- `CALCULATOR ROUTE BRIDGE RECOVERY`

Reason:

- city action binding now works
- the next visible failure is that many calculator cards still point to routes that are not registered
- that is now the narrowest remaining seam before any physical in-scene calculator stand work
