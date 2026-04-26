# Phase 11 Diagnostics

## Commands run

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

## Results

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

The `spawn EPERM` behavior remains a sandbox execution restriction, not a repo failure.

## Changed files for this phase

Primary:

- `src/modules/expo/components/ExpoWorldScene.tsx`
- `src/modules/expo/runtime/world/debug/worldSceneDebugContract.ts`
- `src/modules/expo/runtime/world/inspection/worldInspectionContract.tsx`
- `src/modules/expo/runtime/world/scene/ExpoWorldSceneLayers.tsx`
- `src/modules/expo/runtime/world/scene/useExpoWorldSceneAnalytics.ts`

Docs:

- `docs/recovery/phase-11-world-scene-choke-point-reduction.md`
- `docs/recovery/phase-11-diagnostics.md`

Context files included in review bundle:

- `src/modules/expo/runtime/app/ExpoSceneShell.tsx`
- `src/modules/expo/runtime/app/Expo3D.tsx`
- `src/modules/expo/runtime/operator/state/useExpoOperatorLayer.tsx`

## Remaining risks

- `ExpoWorldScene.tsx` still owns top-level canvas orchestration and player wiring.
- `SpawnDebugOverlay` still lives in `ExpoWorldScene.tsx`.
- global inspection sources still depend on runtime world producers writing into shared window globals.
- scene analytics remain scene-local runtime behavior rather than a broader runtime diagnostic service.

## Explicit incomplete items

- no full `ExpoWorldScene.tsx` decomposition
- no renderer rewrite
- no planning changes
- no operator UI redesign
- no backend cleanup

## Remaining `ExpoWorldScene` debt

Still inside `ExpoWorldScene.tsx`:

- top-level `<Canvas>` and render shell
- player controls and movement callback wiring
- spawn debug overlay implementation
- some scene-local wrapper exports

Removed from `ExpoWorldScene.tsx` in this phase:

- inspection/probe helper implementations
- layer/section normalization defaults
- section matching helper
- analytics / zone replacement effects
- large world-layer JSX composition block

## Remaining operator / world / debug coupling debt

- operator inspection still consumes scene/world probe output indirectly through global inspection state
- debug toggles still flow from operator/app shell into scene shell and then into world consumers
- scene probe and inspection transport is cleaner, but not yet provider-based or context-based

This phase reduced the coupling materially, but did not eliminate it.
