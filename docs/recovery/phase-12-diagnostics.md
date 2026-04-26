# Phase 12 Diagnostics

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

The `spawn EPERM` behavior remains sandbox execution restriction, not a repo failure.

## Changed file list

Primary:

- `src/modules/expo/components/ExpoWorldScene.tsx`
- `src/modules/expo/runtime/app/Expo3D.tsx`
- `src/modules/expo/runtime/operator/state/useExpoOperatorLayer.tsx`
- `src/modules/expo/runtime/operator/state/useExpoOperatorState.ts`
- `src/modules/expo/runtime/world/WorldCitySkeleton.tsx`
- `src/modules/expo/runtime/world/ExpoRearCampus.tsx`
- `src/modules/expo/runtime/world/WorldSceneSupport.tsx`
- `src/modules/expo/runtime/world/index.ts`
- `src/modules/expo/runtime/world/inspection/worldInspectionContract.tsx`
- `src/modules/expo/runtime/world/inspection/worldInspectionState.tsx`
- `src/modules/expo/runtime/world/debug/ExpoWorldDebugLayer.tsx`
- `src/modules/expo/runtime/world/scene/ExpoWorldCanvasShell.tsx`
- `src/modules/expo/runtime/world/scene/ExpoWorldPlayerLayer.tsx`
- `src/modules/expo/runtime/world/scene/ExpoWorldSceneLayers.tsx`

Docs:

- `docs/recovery/phase-12-world-inspection-provider-and-canvas-shell-extraction.md`
- `docs/recovery/phase-12-diagnostics.md`

## Remaining risks

- inspection state is cleaner, but still currently backed by a module-level store plus provider lifecycle reset
- `ExpoWorldScene.tsx` still owns analytics composition and some local world wrappers
- player runtime is extracted, but still tightly coupled to current camera/collision model
- browser review is still needed to confirm inspection highlights, click targets, and spawn debug overlays behave identically

## Explicit incomplete items

- no planning changes
- no operator UI redesign
- no backend cleanup
- no renderer rewrite
- no full scene decomposition

## Remaining `ExpoWorldScene` debt

Still in `ExpoWorldScene.tsx`:

- visible booth placement derivation
- scene analytics hook usage
- fallback scene wrappers and some scene-local helpers
- top-level scene entry composition

Removed from `ExpoWorldScene.tsx` in this phase:

- canvas creation
- inspection transport mounting
- debug layer mounting
- player layer mounting

## Remaining inspection transport debt

- the provider/store model is not yet fully local to one React tree
- inspection source publication still depends on explicit producer registration from world renderers
- scene bridge still publishes scene ref / collision metadata through the inspection contract rather than a deeper scene service boundary

This is materially less global than the old `window.__WARPALA_*` model, but not yet the final form.

## Remaining operator / world / debug coupling debt

- operator layer still computes inspection distance projections from scene-published source entries plus booth placements
- debug and inspection still share some scene-derived runtime semantics
- world producers still know that inspection registration exists, even though they no longer publish to `window`

The coupling is reduced, but not fully removed.
