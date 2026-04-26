# Phase 14 Diagnostics

## Commands Run

Frontend / root:

- `npx.cmd tsc -b`
- `npm.cmd run build`
- `npx.cmd tsx src/modules/expo/__tests__/sponsorScreenLayout.test.ts`
- `npx.cmd tsx src/modules/expo/__tests__/districtLandmarkPlan.test.ts`
- `npx.cmd tsx src/modules/expo/__tests__/useExpoSceneData.contract.test.ts`

Backend:

- `npm.cmd --prefix backend-server run build`
- `npx.cmd tsx routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx routes/__tests__/expoScene.controller.test.ts`

## Result Summary

Passed in sandbox:

- `npx.cmd tsc -b`
- `npm.cmd --prefix backend-server run build`

Sandbox-restricted with `spawn EPERM`:

- `npm.cmd run build`
- all required `npx.cmd tsx ...` commands

Passed outside sandbox on the same machine:

- `npm.cmd run build`
- `npx.cmd tsx src/modules/expo/__tests__/sponsorScreenLayout.test.ts`
- `npx.cmd tsx src/modules/expo/__tests__/districtLandmarkPlan.test.ts`
- `npx.cmd tsx src/modules/expo/__tests__/useExpoSceneData.contract.test.ts`
- `npx.cmd tsx routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx routes/__tests__/expoScene.controller.test.ts`

The sandbox `EPERM` failures remain environment restrictions, not repo failures.

## Changed File List

Source:

- `src/modules/expo/components/ExpoWorldScene.tsx`
- `src/modules/expo/runtime/operator/state/useExpoOperatorLayer.tsx`
- `src/modules/expo/runtime/world/inspection/worldInspectionState.tsx`
- `src/modules/expo/runtime/world/fallback/ExpoWorldFallbackCity.tsx`
- `src/modules/expo/runtime/world/scaffold/ExpoWorldLegacySceneScaffold.tsx`
- `src/modules/expo/runtime/world/scene/worldSceneUserData.ts`

Docs:

- `docs/recovery/phase-14-expo-world-scene-legacy-helper-and-fallback-debt-reduction.md`
- `docs/recovery/phase-14-diagnostics.md`

## Remaining Risks

- `ExpoWorldScene.tsx` is now thin, but compatibility re-exports still keep old public surface alive
- inspection state is provider-owned but still external-store based
- operator summary still depends on booth placement input through the inspection boundary
- browser review is still needed for fallback city mode and inspection behavior

## Explicit Incomplete Items

- no planning changes
- no operator UI redesign
- no backend cleanup
- no renderer rewrite
- no full reducer-driven inspection state model

## Remaining ExpoWorldScene Debt

- the file is no longer the fallback/scaffold owner, but it still exists as a compatibility scene entry surface
- long-tail public exports still route through this file for compatibility stability

## Remaining Provider / Layer Debt

- scene analytics still lives as a runtime hook rather than a deeper provider/layer contract
- inspection uses one provider store for multiple concerns:
  - scene ref
  - center selection
  - click selection
  - source buckets

## Remaining Operator / World Coupling Debt

- operator summary is less coupled than before, but still not fully independent from booth placement context
- operator state still consumes raw center/click stacks directly from inspection state
