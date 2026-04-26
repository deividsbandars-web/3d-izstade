# Phase 13 Diagnostics

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
- all required `npx.cmd tsx ...` test commands

Passed outside sandbox on the same machine:

- `npm.cmd run build`
- `npx.cmd tsx src/modules/expo/__tests__/sponsorScreenLayout.test.ts`
- `npx.cmd tsx src/modules/expo/__tests__/districtLandmarkPlan.test.ts`
- `npx.cmd tsx src/modules/expo/__tests__/useExpoSceneData.contract.test.ts`
- `npx.cmd tsx routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx routes/__tests__/expoScene.controller.test.ts`

The sandbox failures remain execution-environment restrictions, not repo failures.

## Changed File List

Source:

- `src/modules/expo/components/ExpoWorldScene.tsx`
- `src/modules/expo/runtime/app/Expo3D.tsx`
- `src/modules/expo/runtime/operator/state/useExpoOperatorLayer.tsx`
- `src/modules/expo/runtime/operator/state/useExpoOperatorState.ts`
- `src/modules/expo/runtime/world/ExpoRearCampus.tsx`
- `src/modules/expo/runtime/world/WorldCitySkeleton.tsx`
- `src/modules/expo/runtime/world/inspection/worldInspectionContract.tsx`
- `src/modules/expo/runtime/world/inspection/worldInspectionState.tsx`
- `src/modules/expo/runtime/world/scene/ExpoWorldSceneRoot.tsx`
- `src/modules/expo/runtime/world/scene/useExpoWorldSceneRuntime.ts`

Docs:

- `docs/recovery/phase-13-scene-provider-hardening-and-analytics-extraction.md`
- `docs/recovery/phase-13-diagnostics.md`

## Remaining Risks

- inspection state is provider-owned now, but still implemented through an external store rather than a reducer/provider model
- `ExpoWorldScene.tsx` is thinner, but still contains legacy local helpers and fallback city scaffolding
- operator summary still depends on booth placement inputs in addition to world-published inspection entries
- browser review is still needed to verify center/click inspection and highlight behavior after the provider hardening

## Explicit Incomplete Items

- no planning changes
- no operator UI redesign
- no backend cleanup
- no renderer rewrite
- no full `ExpoWorldScene.tsx` decomposition

## Remaining Provider / Global State Debt

- provider state is no longer module-global, but the store still uses `useSyncExternalStore` rather than a pure React reducer/context shape
- scene reference and selection state are still shared through one provider store instead of narrower sub-providers

## Remaining ExpoWorldScene Debt

- `ExpoWorldScene.tsx` still owns:
  - scene error boundary helpers
  - fallback city scaffolding
  - some legacy city helper components and wrappers
- the top-level scene file is thinner, but not yet minimal

## Remaining Operator / World Coupling Debt

- operator layer still depends on inspection summary plus booth placements to build the final nearby summary view
- operator inspection still consumes scene-published data rather than a more domain-specific operator inspection model
