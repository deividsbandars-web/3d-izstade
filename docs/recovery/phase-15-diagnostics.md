# Phase 15 Diagnostics

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

The sandbox failures remain environment restrictions, not repo failures.

## Changed File List

Source:

- `src/modules/expo/components/ExpoWorldScene.tsx`
- `src/modules/expo/runtime/operator/state/useExpoOperatorLayer.tsx`
- `src/modules/expo/runtime/world/inspection/worldInspectionState.tsx`
- `src/modules/expo/runtime/world/scene/ExpoWorldAnalyticsProvider.tsx`
- `src/modules/expo/runtime/world/scene/ExpoWorldAnalyticsLayer.tsx`
- `src/modules/expo/runtime/world/scene/ExpoWorldSceneRoot.tsx`
- `src/modules/expo/runtime/world/scene/useExpoWorldSceneRuntime.ts`

Docs:

- `docs/recovery/phase-15-inspection-domain-model-hardening.md`
- `docs/recovery/phase-15-diagnostics.md`

## Remaining Risks

- inspection domain is reducer-driven now, but `sceneRef` still shares the same provider state as focus/source concerns
- operator summary still accepts booth placement context, even though summary derivation moved into inspection
- analytics is now a provider/layer contract, but not yet a broader cross-runtime event model
- browser review is still needed for center/click inspection and operator overlay behavior

## Explicit Incomplete Items

- no planning changes
- no backend cleanup
- no UI redesign
- no renderer rewrite
- no booth runtime changes

## Remaining Provider / Global State Debt

- inspection is no longer store-shaped transport, but scene transport concerns and focus/source concerns still live in one provider
- analytics provider is isolated, but still scene-local rather than platform-level

## Remaining ExpoWorldScene Debt

- `ExpoWorldScene.tsx` remains as a compatibility façade entry
- the file is thin now, but it still exists until consumers are fully migrated away from the old path

## Remaining Operator / World Coupling Debt

- operator still consumes center/click targets and summary from inspection, which is correct, but deeper semantic interpretation is still not split into a dedicated operator domain model
- booth placements are still part of operator summary inputs, just no longer interpreted in the operator layer itself
