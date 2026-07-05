# GALA Visual Regression Archaeology

## Scope

This report records the design-intent reset before any visual remediation. The product owner rejected the latest local evidence because the result is technically readable but visually wrong: the exterior facade reads as random high-contrast strips rather than coherent timber boards, and the interior/furniture/fixtures still read too much like unfinished primitives.

Reviewed evidence:

- `C:\qa\visual-evidence\20260625-181252-gala-construction-renderer-reset-local`
- `C:\qa\visual-evidence\20260625-210826-gala-view-readability-remediation-local`
- `C:\qa\visual-evidence\20260625-214355-gala-manual-visual-review-local`
- `C:\3d\.codex\visual-evidence\20260625-gala-fidelity-final-rerun`
- `C:\3d\.codex\visual-evidence\20260626-001003-gala-final-product-owner-review-local`

## Closest Prior Visual State

The closest available evidence to the intended compact timber-board cabin look is:

- `C:\qa\visual-evidence\20260625-181252-gala-construction-renderer-reset-local\before\manual-repro\facade-grooves-credible-front.png`

That frame still had a more unified brown facade tone. It was less complete and had earlier readability/overlay issues, but the facade did not yet read as a high-contrast alternating strip pattern.

The later construction-renderer reset after-state:

- `C:\qa\visual-evidence\20260625-181252-gala-construction-renderer-reset-local\after\manual-repro\exterior-front-readable.png`

introduced the visually wrong pattern: alternating light/dark vertical board panels. Later readability and fidelity remediation retained the same pattern and added thin relief/scarf-joint cues, which made the zebra/patch-stack effect more obvious.

## Regression Point

The visual regression was introduced by the construction renderer reset facade board material logic. The active cladding renderer assigns color per board index:

- `src/modules/expo/runtime/modularHome/construction/GalaCladdingAssembly.tsx`
  - `const boardColor = board.index % 2 === 0 ? visual.wallColor : visual.wallLightColor;`

The gable board renderer repeats the same index-based alternation:

- `src/modules/expo/runtime/modularHome/construction/GalaConstructionRenderer.tsx`
  - `color={board.index % 2 === 0 ? facadeVisual.wallColor : facadeVisual.wallLightColor}`

The color token contrast comes from:

- `src/modules/expo/runtime/modularHome/GalaHouseConfig.ts`
  - `wallColor` and `wallLightColor` are materially different tones for each facade tone.

Together, those files produce a deterministic zebra facade. The result is not truly random, but the visual outcome reads as random/rainbow/patchwork because adjacent boards alternate high-contrast colors across the whole elevation.

## Owner Files

### Exterior Facade Colors and Materials

- `src/modules/expo/runtime/modularHome/GalaHouseConfig.ts`
  - Owns facade tone tokens: `wallColor`, `wallLightColor`, `seamColor`, `trimColor`.
  - Current `wallLightColor` values are too far from `wallColor` for per-board alternation.

### Exterior Board Geometry and Color Application

- `src/modules/expo/runtime/modularHome/construction/GalaCladdingAssembly.tsx`
  - Owns exterior vertical board geometry on wall segments.
  - Owns current per-board index-based color selection.
  - Owns raised edge shadows and scarf-joint cues added in the rejected fidelity pass.

- `src/modules/expo/runtime/modularHome/construction/GalaConstructionRenderer.tsx`
  - Owns gable board cladding assembly and its per-board index-based color selection.
  - Owns foundation/base trim, corner boards, terrace, and assembly ordering.

### Interior Finish

- `src/modules/expo/runtime/modularHome/GalaHouseConfig.ts`
  - Owns interior material tokens: wall, seam, floor, furniture palette.

- `src/modules/expo/runtime/modularHome/construction/GalaWallAssembly.tsx`
  - Owns interior wall face material application and interior panel seam geometry.

- `src/modules/expo/runtime/modularHome/construction/GalaFloorCeilingAssembly.tsx`
  - Owns floor and ceiling material application, plank seams, ceiling seams, baseboards, and crown trim.

### Furniture and Bathroom Fixtures

- `src/modules/expo/runtime/modularHome/construction/GalaConstructionModel.ts`
  - Owns furniture and fixture placement data.

- `src/modules/expo/runtime/modularHome/construction/GalaRoomAssembly.tsx`
  - Owns product-facing furniture and bathroom fixture geometry and hardcoded cue materials.

## Root Cause Classification

The bad result came primarily from material tokens and per-board index-based color variation:

- Material tokens: `GalaHouseConfig.ts` provided two facade board colors with too much visual contrast.
- Index-based variation: `GalaCladdingAssembly.tsx` and `GalaConstructionRenderer.tsx` alternated those colors every board.
- Cladding geometry: the geometry is owned and coherent enough, but the color assignment makes it read as patchwork.
- Fidelity patching: raised shadows and short scarf joints added in the final fidelity pass amplified the already-bad alternating pattern.
- Lighting: not the primary cause.
- Debug materials: not the primary cause of the facade; some furniture/fixture cue colors still read like placeholders.

## Recommended Remediation Path

1. Keep the construction renderer and ownership boundaries; do not move camera/FOV/lookAt/routes/backend/auth/quote/payment.
2. Replace per-board high-contrast alternation with a controlled timber material resolver:
   - one base wood tone
   - very subtle deterministic warm variation
   - seam/edge colors close enough to read as shadow, not striping
3. Keep board geometry, but reduce any relief/scarf-joint contrast so details read as wood grain/joints rather than patch stacks.
4. Tune facade palette tokens in `GalaHouseConfig.ts` to natural warm wood tones only.
5. Tune interior wall/floor/ceiling tokens to warmer, intentional finishes with subtle seams.
6. Improve `GalaRoomAssembly.tsx` cue colors and a small number of simple fixture/furniture shapes so they read as intentional simplified product objects.
7. Add a visual design-intent QA guardrail that fails on high-contrast facade palettes, zebra/rainbow striping, debug colors, blank primitive interiors, and unrecognizable fixture/furniture groups.
8. Keep sponsor booth disabled in `homeStudio` mode as the Playwright black-canvas guard.

This remediation remains local and does not imply product acceptance.
