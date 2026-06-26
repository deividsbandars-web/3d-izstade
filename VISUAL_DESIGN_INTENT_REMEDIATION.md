# GALA Wall-Skin Design-Intent Remediation

This remediation addresses the product-owner rejection of `C:\qa\visual-evidence\20260626-013622-gala-cladding-gap-and-ownership-remediation-local`.

The rejected state had improved cladding gap scale, but the facade still read as architecturally broken because timber boards appeared on some regions while other visible wall sections read as plain backing surfaces. Interior panels also used a separate material/spacing language from the exterior.

This is not product-owner acceptance. `productVisualAccepted=false`, `stagingDeployAllowed=false`, and no staging deploy was performed.

## Owner Files After Remediation

- Wall-skin dimensions/material/rules owner: `src/modules/expo/runtime/modularHome/construction/GalaWallSkinModel.ts`.
- Exterior wall board geometry owner: `src/modules/expo/runtime/modularHome/construction/GalaCladdingAssembly.tsx`.
- Gable wall-skin adapter: `src/modules/expo/runtime/modularHome/construction/GalaConstructionRenderer.tsx`.
- Structural wall core/interior panel consumer: `src/modules/expo/runtime/modularHome/construction/GalaWallAssembly.tsx`.
- Opening reveal/trim consumer: `src/modules/expo/runtime/modularHome/construction/GalaOpeningAssembly.tsx`.
- Floor/ceiling finish consumer: `src/modules/expo/runtime/modularHome/construction/GalaFloorCeilingAssembly.tsx`.
- Construction model adapter: `src/modules/expo/runtime/modularHome/construction/GalaConstructionModel.ts`.

## Changes Made

- Added `GalaWallSkinModel.ts` as the single source for active wall-skin dimensions, materials, and rules.
- Removed the old active `GalaCladdingSpec.ts` path.
- Reworked `GalaCladdingAssembly.tsx` to apply continuous vertical timber board coverage to every visible exterior wall face.
- Treated openings as interruptions/masks inside the continuous wall-skin system instead of leaving large plain bays.
- Routed gable boards, base trim, corner boards, eave trim, opening reveals, interior walls, floor seams, and ceiling seams through the wall-skin model.
- Kept the cladding dimension target unchanged: `0.18m` boards, `0.014m` reveals, `12.86` board-to-gap ratio.
- Added controlled deterministic board-tone variation using `#c5925c` and `#c89863`; this is low-contrast timber variation from the wall-skin owner, not random per-board color or zebra striping.

## QA Results

- Wall-skin coverage QA: PASS.
- Cladding dimension QA: PASS.
- Visual design-intent QA: PASS.
- Visual acceptance/readability QA: PASS as route/readability evidence only.
- View readability diagnostic: PASS.
- DOM overlay QA: PASS.
- Renderer ownership QA: PASS for scoped wall-skin ownership; `singleSourceRendererProven=false` remains.
- Construction renderer QA: PASS as supporting evidence.

## Manual Review Summary

- Every visible exterior wall section has timber cladding: PASS.
- Large plain exterior wall section remaining: PASS, no blocking plain section found.
- Board/gap rhythm consistent across facade and side: PASS.
- Interior wall/floor/ceiling materials coherent with exterior cabin language: PASS.
- Interior panel sizes/colors documented: PASS.
- Route/readability/quote regression: PASS.
- Active files still bypassing wall-skin system: PASS, none found in scoped audit.

Remaining blocker: explicit product-owner review and approval of this new evidence package is still required before `productVisualAccepted` can become `true`.
