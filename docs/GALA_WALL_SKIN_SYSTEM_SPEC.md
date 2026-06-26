# GALA Wall-Skin System Spec

## Purpose

This spec defines the unified wall-skin design and ownership contract for the GALA modular home. It exists because prior evidence had readable screenshots and correct board gap dimensions, but the wall system still rendered as partially bare exterior patches and inconsistent interior panels.

This spec is not product-owner acceptance.

## Exterior Wall-Skin Target

- Every visible exterior wall face must receive the same coherent vertical timber board cladding system unless explicitly masked by door, window, opening casing, trim, roof/eave intersection, or terrace attachment.
- Exterior boards must be clean vertical boards.
- Board seams are vertical only.
- No horizontal decorative scarf-joint marks, board-break marks, or short horizontal strips are allowed on boards unless explicitly approved by the product owner.
- No large plain exterior wall regions are allowed on product-facing views.
- Vertical board rhythm must continue across wall segments with consistent module size.
- Window and door openings must be true apertures.
- Wall-skin boards, reveal backing, and trim filler must be clipped or masked from opening volumes.
- Openings may interrupt or mask boards, but must not reset the surrounding wall into unrelated plain material.
- Open door portal volumes must remain visually clear.
- Corners, eaves, base trim, and opening trim must terminate boards cleanly.
- Board width target: `0.16-0.22m`.
- Preferred exterior board width: `0.18m`.
- Reveal/gap target: `0.01-0.02m`.
- Preferred exterior reveal/gap: `0.014m`.
- Board-to-gap ratio: board width must be at least `8x` gap width.
- Wood palette must be controlled, warm, and natural.
- Board faces may use a deterministic two-tone warm timber palette from the wall-skin model so narrow-gapped boards remain readable without becoming stripes.
- Subtle board tone variation must remain low contrast, non-random, and owned by the wall-skin model.
- No debug colors, rainbow facade, zebra facade, or random high-contrast per-board assignment.

## Interior Wall-Skin Target

- Interior finish must belong to the same warm modular cabin design language.
- Interior walls must use the same board orientation and module logic as the exterior timber wall-skin.
- Interior board width must match exterior board width unless a product-owner-approved variant exists in `GalaWallSkinModel.ts`.
- Exterior board width currently expected: `0.18m`.
- Exterior reveal/gap currently expected: `0.014m`.
- Interior board rhythm must match the exterior board rhythm.
- Interior boards must use the same approved exterior timber tone family. A lighter or darker interior variant is not allowed unless explicitly approved by the product owner.
- Interior must not use unrelated panel scale, random striping, or debug/flat placeholder surfaces.
- Interior wall, floor, and ceiling colors must be compatible with the exterior timber palette.
- Interior board/panel module must be defined in the same wall-skin model as a documented interior variant.
- Interior horizontal wall bands are forbidden except documented baseboard and top trim.
- Baseboard and top trim must not read as a separate horizontal wall stripe system.
- No arbitrary per-wall color or scale overrides.
- Floor, ceiling, and trim must be compatible with the same cabin material system.
- Interior wall-skin constants must come from `GalaWallSkinModel.ts` or a documented exported interior variant inside the same model.

## Ownership Contract

- One wall-skin model owns active wall-skin dimensions:
  - exterior board width
  - exterior gap/reveal width
  - exterior board depth
  - interior panel spacing
  - interior panel groove width/depth
  - floor/ceiling finish seam spacing used for wall-skin coherence checks
- One wall-skin model owns active wall-skin material tokens:
  - exterior board material
  - exterior controlled board tone palette
  - exterior reveal material
  - trim-compatible material tokens
  - opening reveal material
  - interior wall panel material
  - interior panel reveal material
  - floor and ceiling compatible finish colors
- Render assemblies may consume wall-skin data but may not define hidden wall-skin constants.
- Exterior and interior may use different presets, but those presets must live under the same wall-skin model.
- Gable cladding may remain an adapter only if it consumes the same wall-skin model as the wall cladding assembly.
- `GalaHouseConfig.ts` may expose user-facing visual options, but active construction wall-skin dimensions/materials must be resolved through the wall-skin model before rendering.

## QA Expectations

- QA must fail if any visible exterior wall section lacks cladding without a documented masking reason.
- QA must fail if large plain exterior wall regions remain.
- QA must fail if wall-skin constants are duplicated across active files.
- QA must fail if interior panels use unrelated spacing/materials outside the wall-skin model.
- QA must fail if the interior uses a different unapproved board palette from the exterior.
- QA must fail if unwanted horizontal facade marks, blocked openings, non-transparent windows, or blue ground contamination are visible.
- QA must record that screenshot readability is not design acceptance.

## Acceptance Gate

Automated QA may confirm wall-skin coverage and ownership, but product-owner manual review is still required before `productVisualAccepted` can become `true`.
