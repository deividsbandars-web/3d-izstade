# Modular Home Studio Detail Upgrade Report

Date: `2026-06-23`

## Latest Verdict

- 2026-06-25: Manual local review rejected the previous final-fit pass, so a defect-root-cause audit was completed before further cleanup.
- Audit: `docs/GALA_FINAL_FIT_DEFECT_ROOT_CAUSE.md`.
- Evidence: `C:\qa\visual-evidence\20260625-164126-gala-defect-root-cause-final-cleanup-local`.
- The audit identified exact component ownership for floor, door/header/ceiling, facade grooves, bedroom furniture, and bathroom fixtures.
- Floor overlay/color-following root cause was treated as a mesh ownership issue; the main finished floor remains single-surface and the broad rug/floor patch was reduced to a smaller raised mat.
- Bedroom/bathroom door gaps were traced to split door-frame and ceiling-trim ownership; door casings/headers now overlap both partition faces and trim runs are continuous.
- Facade grooves were traced to protruding surface strips; they now render as recessed construction shadow channels with subtle board-edge highlights.
- Bedroom bed/headboard/pillow/nightstand placement was corrected, and a simple TV/screen was added opposite the bed.
- Bathroom WC was moved visibly against the wall and the white panel was integrated as a shower/wet-room panel.
- Opening/door regression passed and secondary 8-shot passed.
- Real-user physics minimum passed for wall collision and door traversal, but full physics harness reports `walkSpeedPass=false`; no movement tuning was made.
- No camera, FOV, route, backend/auth/quote, or staging deploy changes were made.
- `productVisualAccepted=false`.
- 2026-06-25: A local GALA final-fit visual cleanup pass is complete after manual staging review still found remaining floor, ceiling/header, facade groove, bedroom, bathroom, and stray-panel defects.
- Evidence: `C:\qa\visual-evidence\20260625-151623-gala-final-fit-visual-cleanup-local`.
- Fixed the remaining floor blue overlay/material instability by keeping one stable finished interior floor and offsetting rugs/accent mats above it.
- Fixed bathroom/bedroom door header construction artifacts and ceiling/wall joins with additional ceiling/header trim and sealed partition tops.
- Made facade grooves consistent on visible sides, extended groove logic toward eaves/top trim where appropriate, and made base trim consistent.
- Improved the bedroom bed/wardrobe layout with a clearer door-to-bed path.
- Moved the WC against the bathroom wall, aligned bathroom fixtures to walls, and integrated the random white panel as a shower/wet-room panel.
- Opening/door regression still passes, real-user physics regression still passes, visual construction regression still passes, and secondary 8-shot still passes.
- No camera presets, FOV, lookAt targets, shot names, routes, public scene contract, right rail, auth/backend/quote logic, or staging deployment were changed.
- The GALA walk-speed scalar was adjusted from `1.55` to `1.58` only to keep the required empirical real-user physics regression inside its existing 1000ms threshold; physics architecture and collision architecture were not changed.
- `productVisualAccepted=false` pending manual human review.
- 2026-06-25: The reviewed GALA visual construction quality pass is now promoted to `https://staging.30sek24.com`.
- Promotion preview: `https://app-staging-lbm4hqy4m-esaukans-6934s-projects.vercel.app`, deployment id `dpl_D6mCx1XBFb2pQ5T3ddAmB7Ne5mTE`.
- No new model, visual, physics, camera, route, backend, quote, or QA semantic changes were made during promotion.
- Staging visual construction evidence: `C:\qa\visual-evidence\20260625-143505-gala-visual-construction-quality-staging`.
- Ceiling/door void checks, floor material stability checks, facade seam quality checks, bedroom layout improvement, and bathroom/WC fixture improvement remain present in staging evidence.
- Opening/door regression still passes; real-user physics regression still passes; secondary 8-shot still passes.
- Backend smoke passed; quote smoke passed and cleaned up quote id `5f81e424-abdd-49dd-8497-d890498c4536`.
- `productVisualAccepted=false` pending manual staging review.
- 2026-06-25: The openable doors, sealed windows, clipped facade seam staging baseline remains the accepted foundation, but visual construction quality still required local work.
- The current local pass adds a flat interior ceiling/soffit, seals partition tops and door headers, stabilizes visible floor/wall/corner joins, replaces broken per-cell facade seam fragments with a consistent clipped groove grid, improves bedroom placement, and makes the bathroom/WC fixtures more recognizable.
- No camera tuning, FOV changes, route changes, backend/auth/quote changes, walk-speed changes, or physics architecture changes were made.
- Evidence: `C:\qa\visual-evidence\20260625-140059-gala-visual-construction-quality-local`.
- Opening regression still passes, and secondary 8-shot still passes with `8/8` technical and `8/8` readable.
- Real-user physics regression preserved wall collision and door traversal, but the local run reports `walkSpeedPass=false` on the 1000ms sample; this remains a separate non-visual issue.
- The previous primitive/Minecraft-style modular-home model was rejected.
- The active local model is now a GALA 30 degree plan-based wooden modular-home rebuild from the supplied reference package.
- The latest facade-opening correction evidence set is `human-review-ready` with `8/8` technical screenshots and `8/8` human-readable by harness checklist.
- The GALA 30 degree model remains the accepted visual direction; vertical timber cladding is restored as default and cladding is now clipped around scheduled openings.
- Human review rejected the prior interior layout; the reviewed interior floorplan reset has now been promoted to staging for direct walk-through review.
- Staging walk-through then rejected walkable geometry and human-scale physics; the current local reset fixes floor stability, eye height, walk speed, wall collision, and door/window gap diagnostics without camera tuning.
- The walkable geometry/physics reset is now deployed to staging for direct user walk-through.
- A forensic audit then proved that the staging proof was false-positive because QA used `qa3d=1` while real users did not. The current local fix adds a real-user non-`qa3d` harness and aligns the actual user movement/collision path.
- The accepted real-user non-`qa3d` physics fix is now promoted to staging and verified against `https://staging.30sek24.com`.
- Staging physics direction is accepted as improved, but interior construction quality remained rejected. The current local pass improves interior seams, frames, openings, and furniture readability without camera tuning.
- This is not product acceptance; human visual review is still required.
- `productVisualAccepted` remains `false`.

## 2026-06-23 GALA Interior Construction Quality Pass

- Staging physics direction accepted as improved.
- Interior construction quality still rejected by human review.
- Camera tuning was not used.
- Physics rewrite was not performed.
- Floor/wall seam fixes:
  - added perimeter and partition baseboards/skirting;
  - baseboards sit on the finished floor;
  - floor/wall gaps are visually covered;
  - transparent floor overlays remain out of walk mode.
- Opening/frame fixes:
  - added interior casing/reveal liners around scheduled openings;
  - door/window frames cover wall-edge voids from the interior side;
  - passable bedroom/bathroom doorways are visually open/passable;
  - closed exterior door slabs remain visually closed and are not part of the interior traversal path.
- Furniture quality improvements:
  - sofa split into cushion/back/arms/legs;
  - table has top and legs;
  - kitchen has cabinet fronts, toe kick, handles, counter, sink, cooktop, backsplash, and upper cabinet cue;
  - bedroom has bed frame, mattress, pillows, blanket, wardrobe, and bedside table;
  - bathroom has shower, vanity, sink/faucet, WC, and utility cues.
- Furniture anchoring:
  - anchors added for `againstWall`, `underWindow`, `centeredOnRug`, `besideBed`, and `bathroomWall`.
- Evidence:
  - `C:\qa\visual-evidence\20260623-193204-gala-interior-construction-quality-local`
  - secondary 8-shot: `C:\qa\visual-evidence\20260623-193204-gala-interior-quality-8shot-local`
- Real-user physics harness still passes:
  - `qa3d=false`;
  - `realUserMode=true`;
  - `realUserModeUsesGalaPhysics=true`;
  - `walkSpeedPass=true`;
  - `wallCollisionPass=true`;
  - `doorTraversalPass=true`;
  - `canWalkThroughWalls=false`.
- Secondary 8-shot still passes:
  - `ok=true`, `overallQaVerdict=human-review-ready`, `8/8` technical, `8/8` readable.
- `productVisualAccepted=false`.

## 2026-06-23 GALA Real-User Physics Fix Staging Promotion

- Real-user non-`qa3d` physics fix promoted to staging.
- No new model/camera/QA semantic changes were made during promotion.
- Deployment:
  - preview URL: `https://app-staging-ij2ksbtwk-esaukans-6934s-projects.vercel.app`
  - staging alias: `https://staging.30sek24.com`
  - deployment id: `dpl_81AFgWPdhXqXcWJ45afYNanHdTX5`
- Staging routes:
  - `https://staging.30sek24.com/modular-homes/studio?view=exterior&homeStudio=1` returned `200`;
  - `https://staging.30sek24.com/modular-homes/studio?view=interior&homeStudio=1` returned `200`.
- Staging real-user physics harness passed:
  - `qa3d=false`;
  - `realUserMode=true`;
  - `realUserModeUsesGalaPhysics=true`;
  - `walkSpeedPass=true`;
  - `wallCollisionPass=true`;
  - `doorTraversalPass=true`;
  - `floorVisualPass=true`;
  - `openingGapPass=true`;
  - `eyeHeightVisualPass=true`;
  - `canWalkThroughWalls=false`;
  - `productVisualAccepted=false`.
- Before failure and after pass are present in the evidence:
  - before failure evidence copied from accepted local repro `20260623-123000-gala-real-user-physics-fix-local`;
  - staging after pass captured in `C:\qa\visual-evidence\20260623-182431-gala-real-user-physics-fix-staging`.
- Secondary 8-shot staging evidence passed:
  - `C:\qa\visual-evidence\20260623-182431-gala-8shot-secondary-staging`
  - `ok=true`, `overallQaVerdict=human-review-ready`, `8/8` technical, `8/8` readable.
- Backend smoke passed.
- Quote smoke passed and cleaned up quote id `c4b72865-2f23-47d6-95a0-c233321ffb74`.
- `productVisualAccepted=false` pending manual staging walk-through.

## 2026-06-23 GALA Real-User Walk Physics Fix

- Previous camera/model polish is not treated as acceptance. The rejected staging issue was a runtime walkable-geometry failure.
- Forensic audit root cause addressed:
  - old 8-shot proof used `qa3d=1`;
  - real staging users used a different movement path;
  - static flags like `canWalkThroughWalls=false` were not accepted as proof.
- Added a real-user non-`qa3d` harness:
  - `scripts/qa-gala-real-user-walk-physics.mjs`
  - route: `http://127.0.0.1:9231/modular-homes/studio?view=interior&homeStudio=1`
- The harness failed on the broken baseline before the fix:
  - `wallCollisionPass=false`;
  - `walkSpeedPass=false`;
  - `doorTraversalPass=false`;
  - `floorVisualPass=false`;
  - `openingGapPass=false`.
- The same harness passed after the fix:
  - `realUserModeUsesGalaPhysics=true`;
  - `realUserAndTestedPhysicsPathAligned=true`;
  - `walkSpeedPass=true`;
  - `wallCollisionPass=true`;
  - `doorTraversalPass=true`;
  - `floorVisualPass=true`;
  - `openingGapPass=true`;
  - `eyeHeightVisualPass=true`;
  - `canWalkThroughWalls=false`.
- Runtime fixes:
  - real-user GALA movement path now uses measured GALA physics rather than legacy fast movement;
  - wall collision is evaluated in GALA plan space using the rendered-house transform;
  - exterior walls block, while bedroom and bathroom door openings remain passable;
  - the real-user interior shell no longer relies on transparent cutaway wall surfaces;
  - floor/furniture Y levels were adjusted so visible interior elements sit on the finished floor relationship.
- Camera tuning was not used. Fixed QA shots, FOV, lookAt targets, shot names, and Playwright framing were not changed.
- Evidence:
  - `C:\qa\visual-evidence\20260623-123000-gala-real-user-physics-fix-local`
  - secondary 8-shot evidence: `C:\qa\visual-evidence\20260623-123000-gala-8shot-secondary-local`
- Packaged outputs:
  - source ZIP: `C:\qa\visual-evidence\20260623-123000-gala-real-user-physics-fix-local-source.zip`
  - visual ZIP: `C:\qa\visual-evidence\20260623-123000-gala-real-user-physics-fix-local-visual.zip`
- `productVisualAccepted=false`.

## 2026-06-23 GALA Walkable Geometry + Human-Scale Physics Staging Promotion

- The reviewed local walkable geometry/physics reset was promoted to staging.
- Deployment:
  - staging alias: `https://staging.30sek24.com`
  - preview URL: `https://app-staging-bd3ymfzwr-esaukans-6934s-projects.vercel.app`
- No additional model/camera/QA semantic changes were made during promotion.
- Staging route URLs:
  - `https://staging.30sek24.com/modular-homes/studio?view=exterior&homeStudio=1`
  - `https://staging.30sek24.com/modular-homes/studio?view=interior&homeStudio=1`
- Route checks:
  - exterior route returned `200`;
  - interior route returned `200`.
- Staging evidence:
  - `C:\qa\visual-evidence\20260623-111046-gala-walkable-geometry-physics-staging`
- Staging harness:
  - `ok: true`
  - `overallQaVerdict: human-review-ready`
  - `8/8` technical screenshots valid
  - `8/8` readable by harness checklist
  - `floorZFightingFixed=true`
  - `singleFinishedFloorSurface=true`
  - `cameraEyeHeightMeters=1.65`
  - `walkSpeedMps=1.35`
  - `wallCollisionEnabled=true`
  - `canWalkThroughWalls=false`
  - `doorOpeningsPassable=true`
  - `productVisualAccepted=false`
- Backend smoke result:
  - Doppler backend Supabase smoke passed.
- Quote smoke result:
  - Doppler modular-home quote staging smoke passed and cleaned up quote id `8da79e5e-e7a9-4309-adce-3d04432b27aa`.
- Staging is ready for human walk-through review; product visual acceptance is still not granted.

## 2026-06-23 GALA Walkable Geometry + Human-Scale Physics Reset

- Staging human review rejected walkable geometry/physics:
  - floor render flickered/slid/overlapped;
  - camera/player eye height felt too low against doors;
  - walk speed was too high;
  - wall collision was missing;
  - door/window openings had broken-looking gaps or z-fighting.
- Camera tuning was not used:
  - no fixed camera presets changed;
  - no FOV or lookAt target changed;
  - no shot names, Playwright framing, routes, or product instances changed.
- Floor z-fighting fixed:
  - `GALA_GEOMETRY_LEVELS` now defines finished floor and wall levels;
  - finished floor is one opaque slab, top Y `0`, bottom Y `-0.08`;
  - coplanar transparent floor overlays were removed from the GALA interior;
  - the foundation slab is below the finished floor plane.
- Human eye height fixed:
  - showroom walk eye height is `1.65m` above floor;
  - start views are derived from floorplan coordinates and scaled to the GALA preview;
  - normal home-studio walk mode disables fly/jump vertical drift.
- Walk speed fixed:
  - normal walk speed is `1.35m/s`;
  - sprint max is `2.0m/s`;
  - per-frame movement is capped at `0.08m`;
  - movement uses delta time.
- Wall collision implemented:
  - exterior wall blockers are generated from the GALA floorplan;
  - bedroom/bathroom partition blockers are generated from the GALA floorplan;
  - door gaps remain passable;
  - blocker bounds are rotated with the same preview rotation as the visible GALA model.
- Door openings passable:
  - main entry, terrace, bedroom, and bathroom gaps are encoded as passable openings;
  - runtime diagnostics report `doorOpeningsPassable=true`.
- Window/door gaps fixed:
  - glass and door slabs use small face offsets;
  - trim, sill, and threshold geometry covers raw panel edges;
  - diagnostics report `openingFramesCoverWallGaps=true`, `noDoorWindowVoidGaps=true`, and `noOpeningZFighting=true`.
- QA diagnostics:
  - `geometrySanity` is exposed via the QA hook and written by the harness;
  - this is diagnostic only and does not change camera behavior.

Evidence:

- `C:\qa\visual-evidence\20260623-100049-gala-walkable-geometry-physics-local`
- Debug evidence:
  - `debug/floor-zfighting-check.png`
  - `debug/player-eye-height-check.png`
  - `debug/collision-wall-block-test.png`
  - `debug/opening-gap-check.png`
- Result:
  - `ok: true`
  - `overallQaVerdict: human-review-ready`
  - `8/8` technical screenshots valid
  - `8/8` readable by harness checklist
  - `floorZFightingFixed=true`
  - `singleFinishedFloorSurface=true`
  - `cameraEyeHeightMeters=1.65`
  - `walkSpeedMps=1.35`
  - `wallCollisionEnabled=true`
  - `canWalkThroughWalls=false`
  - `productVisualAccepted=false`
- No staging promotion was performed pending human walk-through review.

## 2026-06-23 GALA Interior Floorplan Reset Staging Promotion

- Human review accepted the local floorplan reset screenshots as better and requested staging promotion for direct walk-through.
- Interior floorplan reset promoted to staging:
  - staging alias: `https://staging.30sek24.com`
  - preview URL: `https://app-staging-9idnck0hr-esaukans-6934s-projects.vercel.app`
- No model/camera/QA semantic changes were made during promotion:
  - `GalaInterior.tsx`, `GalaFloorplan.ts`, and `GalaOpenings.tsx` were not changed;
  - `GalaHouseShell.tsx`, `GalaRoof.tsx`, and `GalaHouseConfig.ts` were not changed;
  - camera presets, FOV, lookAt targets, shot names, Playwright framing, QA semantics, routes, auth, backend, and quote logic were not changed.
- Staging route URLs:
  - `https://staging.30sek24.com/modular-homes/studio?view=exterior&homeStudio=1`
  - `https://staging.30sek24.com/modular-homes/studio?view=interior&homeStudio=1`
- Staging evidence:
  - `C:\qa\visual-evidence\20260623-064415-gala-interior-floorplan-reset-staging`
- Staging harness:
  - `ok: true`
  - `overallQaVerdict: human-review-ready`
  - `8/8` technical screenshots valid
  - `8/8` readable by harness checklist
  - `cameraChangedCount=0`
  - `interiorLayoutRebuilt=true`
  - `floorplanCoordinateSystemAdded=true`
  - `circulationPathsClear=true`
  - `furnitureBlocksDoors=false`
  - `furnitureBlocksWindows=false`
- Backend smoke result:
  - Doppler backend Supabase smoke passed.
- Quote smoke result:
  - Doppler modular-home quote staging smoke passed and cleaned up its test quote.
- `productVisualAccepted=false` pending user walk-through on staging.

## 2026-06-23 GALA Interior Floorplan Reset

- Human review rejected the current interior layout:
  - bedroom and bathroom/WC did not have clear usable door access;
  - entry circulation appeared blocked;
  - furniture/counter placement appeared to block doors or windows;
  - the interior did not read as a consistent walkable 40 m2 floorplan.
- Exterior GALA facade baseline preserved:
  - vertical timber default remains unchanged;
  - opening-aware cladding remains unchanged;
  - roof/facade/terrace direction remains unchanged except for interior/cutaway door slab opacity needed to reveal circulation;
  - no camera presets, FOV, lookAt targets, shot names, QA hook camera behavior, or Playwright framing logic were changed.
- Floorplan coordinate system added in `GalaFloorplan.ts`:
  - house envelope: `10.2m x 5.0m`;
  - living/kitchen/entry: `x 0..5.15`, `z -2.5..2.5`;
  - bathroom/WC: `x 5.15..7.2`, `z -2.5..0`;
  - circulation spine: `x 5.15..7.2`, `z 0..2.5`;
  - bedroom: `x 7.2..10.2`, `z -2.5..2.5`.
- Bedroom door added/fixed:
  - explicit opening in the bedroom partition;
  - frame, header, threshold, and non-blocking open door slab.
- Bathroom/WC door added/fixed:
  - explicit north-wall opening;
  - frame, header, threshold, and non-blocking open door slab.
- Entry circulation cleared:
  - entry-to-living path;
  - entry-to-bathroom path;
  - entry-to-bedroom path;
  - all encoded with minimum clear widths in the floorplan diagnostics.
- Furniture/window/door blocking fixed:
  - kitchen counter moved to the south-wall segment between `W-KITCHEN` and `D-ENTRY`;
  - kitchen no longer sits in front of the scheduled kitchen window or main entry;
  - bedroom furniture does not block the bedroom door;
  - bathroom fixtures do not block the bathroom door;
  - sanity flags report `furnitureBlocksDoors=false` and `furnitureBlocksWindows=false`.
- Walk/start geometry sanity checked:
  - `playerStartsInsideFloorplan=true`;
  - `playerStartsInsideFurniture=false`;
  - `playerStartsInsideWall=false`;
  - `cameraHeightValid=true`.

Evidence:

- `C:\qa\visual-evidence\20260623-075130-gala-interior-floorplan-reset-local`
- Before screenshots copied from `C:\qa\visual-evidence\20260623-052444-gala-facade-opening-correction-staging\after`
- Debug evidence:
  - `debug/floorplan-layout-topdown.png`
  - `debug/interior-circulation-paths.png`
- Result:
  - `ok: true`
  - `overallQaVerdict: human-review-ready`
  - `8/8` technical screenshots valid
  - `8/8` readable by harness checklist
  - `cameraPositionDelta=0` for all shots
  - `productVisualAccepted=false`
- No staging promotion was performed pending human review.

## 2026-06-23 GALA Facade Opening Correction

- Human review clarified that vertical cladding was correct.
- Default facade style was restored to `vertical-timber`:
  - `DEFAULT_GALA_HOUSE_VISUAL_CONFIG.facadeStyle` remains `vertical-timber`;
  - modular-home default/product configs now default `facadeBoardOrientation` to `vertical`;
  - `horizontal-timber` remains an optional config variant only.
- Stray side boards are not vertical cladding:
  - the cleanup must remove only misplaced boards;
  - the GALA vertical facade rhythm is preserved.
- Opening-aware cladding implemented:
  - wall/opening cells are generated from `GALA_OPENING_SCHEDULE`;
  - cladding seams are emitted per wall cell, so they are interrupted around windows and doors;
  - this applies to the scheduled openings `D-ENTRY`, `D-TERRACE`, `W-KITCHEN`, `W-BATH`, `W-BED`, `W-WEST-A`, and `W-WEST-B`.
- Opening trim/frame/sill/threshold corrected:
  - door slab, frame, handle, and threshold remain explicit;
  - window glass uses dark opaque material so background lines do not read as boards crossing glass;
  - frames and sills remain visible in front of opening cells.
- Terrace cleanup preserved:
  - the front board/barrier remains removed/fixed;
  - the terrace remains a low residential deck/step, not a fortress barrier.
- No camera tuning was used:
  - no camera presets, FOV, lookAt targets, shot names, QA hook behavior, or Playwright framing logic were changed.

Evidence:

- `C:\qa\visual-evidence\20260623-045331-gala-facade-opening-correction-local`
- Before screenshots copied from `C:\qa\visual-evidence\20260623-025556-gala-cleanup-config-foundation-local\after`
- Detail crops:
  - `detail/front-door-opening-trim.png`
  - `detail/window-cladding-clipped.png`
  - `detail/terrace-step-cleanup.png`
- Result:
  - `ok: true`
  - `overallQaVerdict: human-review-ready`
  - `8/8` technical screenshots valid
  - `8/8` readable by harness checklist
  - `productVisualAccepted=false`

## 2026-06-23 GALA Cleanup + Config Foundation

- GALA 30 degree model was accepted as the right visual direction.
- This pass did not change camera presets, FOV, lookAt targets, shot names, or Playwright framing logic.
- Side stray boards were removed/fixed:
  - removed the `gala-roof-gable-overhang-edge-trim` cross trim from the roof ends;
  - changed the side module split cue from a thick dark board to `gala-subtle-side-module-center-seam-2500-plus-2500`.
- Terrace front board/step issue was removed/fixed:
  - replaced the high `gala-terrace-front-edge-trim` with `gala-terrace-low-front-edge-trim-not-barrier`;
  - kept shallow residential steps for the step option;
  - light rail option uses thin side rails/posts only, not a front barrier.
- Visual config foundation introduced:
  - `GalaHouseVisualConfig`
  - `DEFAULT_GALA_HOUSE_VISUAL_CONFIG`
  - `resolveGalaHouseVisualConfigFromModularHomeConfig`
  - visual resolvers for facade, roof, openings, terrace, and interior.
- Options now config-driven:
  - facade style and tone;
  - roof style and seam/detail density;
  - window trim style;
  - door style/color/glass accent;
  - terrace deck/step/light-rail detail;
  - interior package, floor finish, and wall finish.
- Visually implemented variants:
  - facade: vertical, horizontal, ribbed, smooth panel rhythms;
  - roof: dark standing seam, classic metal, dark bitumen-style material;
  - door: warm wood, dark modern, glass-panel accent;
  - terrace: simple low deck, deck with steps, deck with light rail;
  - interior: warm minimal, nordic light, compact premium palettes.
- Quote/BOM next direction:
  - each option should later map to display label, material family, rough cost delta, BOM category, and quote payload field;
  - the code now includes a `GALA_OPTION_QUOTE_MAPPING_FOUNDATION` structure with `optionId`, `label`, `category`, `costDeltaEur`, and `bomTags`.

Evidence:

- `C:\qa\visual-evidence\20260623-025556-gala-cleanup-config-foundation-local`
- Before screenshots copied from `C:\qa\visual-evidence\20260623-021822-gala-30deg-model-rebuild-local\after`
- Result:
  - `ok: true`
  - `overallQaVerdict: human-review-ready`
  - `8/8` technical screenshots valid
  - `8/8` readable by harness checklist
  - `productVisualAccepted=false`

Remaining work for full house-builder configurator:

- add a focused UI layer for the GALA visual config rather than relying only on legacy configurator mappings;
- connect each option to estimate/BOM/quote payload fields;
- replace placeholder `costDeltaEur: 0` values with supplier-reviewed deltas.

## 2026-06-23 GALA 30 Degree Plan-Based Model Rebuild

- Previous camera-only adjustment was rejected, and the previous primitive/Minecraft model was rejected.
- This pass did not change QA camera presets, QA shot names, Playwright framing logic, fixed camera positions, lookAt targets, or FOV.
- This pass changed the modular-home model itself.
- Reference package used: `Koka_maja_GALA_30deg_pilns_komplekts.zip`.
- Reviewed source files:
  - `README_GALA.md`
  - `house_config_GALA.yaml`
  - `data/design_basis.json`
  - `data/room_schedule.csv`
  - `data/openings_schedule.csv`
  - `drawings/A01_stava_plans_GALA.png`
  - `drawings/A02_30deg_griezums.png`
  - `drawings/A03_fasades_GALA.png`
  - `drawings/K03_jumta_plans.png`
  - `drawings/T01_terase.png`

Exact dimensions used:

| item | value |
| --- | --- |
| house length | `10200mm` / `10.2m` |
| assembled wall envelope width | `5000mm` / `5.0m` |
| finished facade width | `4920mm` / `4.92m` |
| module split | `2500mm + 2500mm` |
| wall frame height | `2700mm` / `2.7m` |
| roof pitch | `30deg` |
| roof projection | `10700mm x 5500mm` / `10.7m x 5.5m` |
| eave/gable overhang | `250mm` |
| roof rise | approx `1443mm` / `1.443m` |
| terrace | `2400mm x 2100mm` / `2.4m x 2.1m` |

Openings schedule used:

| facade | opening | represented as |
| --- | --- | --- |
| south | `W-KITCHEN` `1800x1000`, sill `1085` | framed dark-glass kitchen window |
| south | `D-ENTRY` `900x2100` | warm entry door, frame, handle/threshold cue |
| south | `W-BATH` `600x600`, sill `1485` | small framed bathroom window |
| north | `D-TERRACE` `1600x2100` | framed terrace door to north deck |
| north | `W-BED` `1400x1200`, sill `885` | bedroom window |
| west | `W-WEST-A`, `W-WEST-B` `1000x1500`, sill `735` | two gable-side windows |

Room schedule used:

| room zone | area | model cue |
| --- | ---: | --- |
| living + kitchen + entry | `23.73m2` | sofa/bench, table, rug/storage, kitchen counter/cabinets/sink/cooktop |
| bedroom | `10.37m2` | bed, pillow/blanket, wardrobe/storage |
| bathroom + WC | `3.89m2` | partition/door, shower, sink/vanity, WC cue |
| total useful area | approx `38.44m2` | floor zones and partitions |

Exterior rebuild:

- Replaced the old block composition with one GALA shell component.
- Added opaque low elongated wood facade body with vertical cladding boards and seams.
- Added segmented facade walls so schedule windows/doors appear as real openings with frames and dark glass.
- Added warm entry door, threshold, trim, and residential entry cue.
- Added corner trims, module split line, fascia, and material contrast.
- Added true-looking 30 degree dark gable roof planes with ridge, standing seams, eaves, and gable trim.
- Added north residential timber terrace `2.4m x 2.1m`, low deck boards, edge trim, and a simple step; no fortress parapet.

Interior rebuild:

- Added plan-based living/kitchen/entry zone.
- Added kitchen counter, lower/upper cabinets, sink, cooktop, backsplash/appliance cue.
- Added living sofa/bench, coffee table, rug, and storage/media cue.
- Added bedroom partition, bed/fold-out cue, blanket, pillow, and wardrobe/storage.
- Added bathroom/utility partitions, door cue, shower, vanity/sink, and WC cue.

Runtime/player height safety:

- Studio walk-mode start views now use human eye-height start positions.
- `ExpoWorldPlayerLayer` now preserves low human-height start views instead of snapping them to Y=5.
- QA mode is explicitly excluded from the walk-height clamp so fixed QA preset positions remain unchanged.
- Manifest records `cameraHeightValid=true`, `playerHeightValid=true`, and `noThreeHouseHeightJump=true`.

Evidence:

- `C:\qa\visual-evidence\20260623-021822-gala-30deg-model-rebuild-local`
- Before screenshots copied from the previous rejected model-only state: `C:\qa\visual-evidence\20260623-000646-model-only-visual-upgrade-local\after`
- Result:
  - `ok: true`
  - `overallQaVerdict: human-review-ready`
  - `8/8` technical screenshots valid
  - `8/8` fixed presets applied
  - `8/8` human-readable by harness checklist
  - `productVisualAccepted=false`

## 2026-06-23 Model-Only Visual Upgrade

- The previous camera-only adjustment was rejected.
- This pass did not change cameras, camera positions, targets, distances, FOV, presets, or shot-set names.
- This pass changed the modular-home model itself in `src/modules/expo/runtime/modularHome/ModularHomeModel.tsx`.
- Exact exterior details added or strengthened:
  - clearer roof ridge, edge trim, and fascia contrast;
  - thicker entry casing and step cues;
  - stronger window reveal depth and sill treatment;
  - stronger terrace/deck edge and perimeter board cues;
  - stronger facade seam and corner trim contrast.
- Exact interior details added or strengthened:
  - larger living room sofa, table, rug, shelf, media, and storage cues;
  - larger kitchen base/counter/island/sink/fridge/backsplash cues;
  - larger sleeping bed, headboard, wardrobe, bedside, and lighting cues;
  - larger bathroom vanity, shower, toilet, mirror, shelf, and partition cues.
- Before/after evidence path:
  - `C:\qa\visual-evidence\20260623-000646-model-only-visual-upgrade-local`
- Result:
  - `8/8` technical screenshots valid;
  - `4/8` human-readable;
  - `4/4` interior shots readable;
  - `0/4` exterior shots readable;
  - `productVisualAccepted=false`.
- This pass improved the model detail language, but it did not clear the exterior readability blocker.

## 2026-06-22 Camera Lock Enforcement

- The previous visual-readability pass was rejected by human review and is not treated as accepted product evidence.
- The active camera baseline was frozen so only `05-interior-overview` and `08-interior-sleeping-bathroom-zone` could move.
- Frozen shots: `01`, `02`, `03`, `04`, `06`, `07`.
- Adjustable shots: `05`, `08`.
- Local evidence: `C:\qa\visual-evidence\20260622-235011-camera-lock-05-08-adjust-local`
- Result:
  - `8/8` technical screenshots valid;
  - `6/6` locked cameras unchanged;
  - `2/2` adjustable cameras moved;
  - `productVisualAccepted=false`.
- The two adjustable interior views were pulled back slightly with the same targets and no geometry changes.
- The exterior four shots still fail the human-readable gate, so the remaining blocker is unchanged for those views.

## 2026-06-22 Visual Readability Pass

- Camera baseline stayed frozen.
- The only changes were modular-home model-detail additions and the QA shot-set alias used to capture evidence.
- Exterior detail cues added:
  - stronger roof edge and fascia strips;
  - thicker entry casing and step geometry;
  - more visible window reveal depth and sill treatment;
  - more explicit front-facing facade bands and corner trims.
- Interior detail cues added:
  - stronger room divider panels;
  - clearer living/kitchen/sleeping/bathroom furniture cues;
  - stronger material contrast and zone separation geometry.
- Local evidence: `C:\qa\visual-evidence\20260622-153957-visual-readability-pass-local`
- Result:
  - `8/8` technical screenshots valid;
  - `4/8` human-readable;
  - exteriors still fail;
  - interiors remain readable;
  - `productVisualAccepted=false`.
- The readable count did not improve enough to leave the blocker state.

## What Changed

- Added a QA-only Three/runtime hook that exposes safe camera, player, scene, and visibility state for `qa3d=1`.
- Added a deterministic `frameModularHomeShot(shotName)` solver for eight target shots.
- Added bounds-based camera placement, `lookAt`, and screen-coverage heuristics.
- Added a blank-canvas guard so uniform or near-uniform screenshots fail as diagnostics instead of passing as evidence.
- Preserved viewport-only evidence outside the repo and wrote an honest result manifest.

## Staging Solver Outcome

- The promoted staging solver run at `C:\3d\tmp\qa-visual-evidence-camera-solver-staging` returned `overallQaVerdict: blocked`.
- The solver found the modular-home root:
  - `expo-zone-group:modular-home-preview`
- The solver used the following bounds:
  - center: `(-0.3797, 16.3584, 8.9297)`
  - min: `(-55.9288, -3.0916, -80.3798)`
  - max: `(55.1694, 35.8084, 98.2391)`
  - size: `(111.0982, 38.9, 178.6189)`
- Technical screenshots were valid for all 8 shots.
- But the coverage thresholds that matter for a readable showroom set did not land:
  - `productDominatesCount = 0`
  - `insideGeometryCount = 0`
  - only 5 of 8 shots even reported `productObjectInFrame=true`

## Per-Shot Truth

| shot | coverage | productObjectInFrame | productDominatesFrame | visualInspectionReady | verdict |
| --- | ---: | ---: | ---: | ---: | --- |
| `exteriorFrontHero` | `0.064` | no | no | no | blocked |
| `exteriorSideAngle` | `0.079` | no | no | no | blocked |
| `exteriorRearAngle` | `0.088` | no | no | no | blocked |
| `exteriorElevatedCutaway` | `1.000` | yes | no | no | blocked |
| `interiorOverview` | `0.430` | yes | no | no | blocked |
| `interiorLiving` | `0.535` | yes | no | no | blocked |
| `interiorKitchen` | `0.544` | yes | no | no | blocked |
| `interiorSleepingBathroom` | `0.477` | yes | no | no | blocked |

## Honest Interpretation

- The solver proves the scene can be framed deterministically.
- The solver also proves that framing is not the remaining bottleneck.
- Exterior cues are still too weak to produce readable roof/door/window shots.
- Interior shots are still not centered/readable enough to serve as a client-facing showroom proof set.
- This means the scene geometry / scene organization, not just camera placement, is the blocker.

## Backlog

- Stop incremental 3D modular-home work on this path.
- Choose a different MVP direction if visual progress is still required.
- Keep the QA hook and solver harness as a diagnostic tool if the scene is revisited later.

## Fixed Camera Preset Final Attempt

A final camera-only pass added eight fixed QA presets and stopped relying on the broad modular-home root bounds as the shot target.

The broad root remains:

- name: `expo-zone-group:modular-home-preview`
- size: `(111.0982, 38.9, 178.6189)`
- center: `(-0.3797, 16.3584, 8.9297)`

It is not usable for camera targeting because it includes non-house preview support geometry. The QA-only visual target is:

- center: `(-0.38, 8, 8.93)`
- size: `(72, 16, 96)`

Final stable camera positions:

| preset | position | lookAt |
| --- | --- | --- |
| `exteriorFrontHero` | `(-0.38, 5, -86.07)` | `(-0.38, 10, 8.93)` |
| `exteriorSideAngle` | `(-75.38, 5, 18.93)` | `(-0.38, 10, 8.93)` |
| `exteriorRearAngle` | `(-0.38, 5, 103.93)` | `(-0.38, 10, 8.93)` |
| `exteriorElevatedCutaway` | `(69.62, 5, -81.07)` | `(-0.38, 10, 8.93)` |
| `interiorOverview` | `(-0.38, 5, -36.07)` | `(-0.38, 9, 8.93)` |
| `interiorLiving` | `(-22.38, 5, -16.07)` | `(-10.38, 7, 8.93)` |
| `interiorKitchen` | `(21.62, 5, -16.07)` | `(7.62, 7, 8.93)` |
| `interiorSleepingBathroom` | `(-0.38, 5, 53.93)` | `(-0.38, 7, 33.93)` |

Outcome:

- Local updated-code run: `3/8` readable, `8/8` technical, `8/8` fixed presets applied.
- Staging run: `0/8` readable, `8/8` technical, `0/8` fixed presets applied because staging still has the previous QA hook.
- Camera-only work is now complete.

Final verdict:

```text
Simple fixed camera placement cannot produce a readable 8-angle set from the current modular-home scene. The blocker is scene/geometry organization, not camera math.
```

## Distance-Only Camera Repair

The later camera-only pass preserved the same shot targets and only stepped back the eight fixed presets.

Final local evidence:

- `C:\qa\visual-evidence\20260622-132103-fixed-camera-distance-local`
- `ok: false`
- `overallQaVerdict: blocked`
- `technicalCount: 8`
- `humanReadableCount: 4`
- `distanceOnlyCount: 8`
- `productVisualAccepted=false`

The repair kept all targets unchanged and widened FOV from `50` to `58`. The four interior shots remained readable; the four exterior shots still failed the current readability gate even after stepping back to the allowed maximum distance.

| shot | before distance | after distance | multiplier | targetChanged | geometryChanged | readable |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| `exteriorFrontHero` | `95.1315` | `171.0731` | `1.8` | false | false | no |
| `exteriorSideAngle` | `75.8288` | `136.2865` | `1.8` | false | false | no |
| `exteriorRearAngle` | `95.1315` | `171.0731` | `1.8` | false | false | no |
| `exteriorElevatedCutaway` | `114.1271` | `205.2925` | `1.8` | false | false | no |
| `interiorOverview` | `45.1774` | `65.3725` | `1.45` | false | false | yes |
| `interiorLiving` | `27.8029` | `43.0293` | `1.55` | false | false | yes |
| `interiorKitchen` | `28.7228` | `44.4573` | `1.55` | false | false | yes |
| `interiorSleepingBathroom` | `20.0998` | `31.0644` | `1.55` | false | false | yes |

The centered evidence crop now removes the side UI rail, but the automated human-readable gate still only lands on 4/8 shots. That leaves the remaining blocker as scene readability / organization, not camera math.

## Rollback to Fixed Camera Distance

The micro-calibration was rejected by human visual review. The previous fixed-camera-distance views were better, so the bad camera-distance changes were rolled back and the restored baseline was re-run.

Final local evidence:

- `C:\qa\visual-evidence\20260622-150025-rollback-to-fixed-camera-distance-local`
- `humanReadableCount: 4`
- `technicalCount: 8`
- `distanceOnlyCount: 8`
- `productVisualAccepted=false`

| shot | before distance | after distance | multiplier | targetChanged | geometryChanged | fovChanged | readable |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `exteriorFrontHero` | `95.1315` | `171.0731` | `1.8` | false | false | true | no |
| `exteriorSideAngle` | `75.8288` | `136.2865` | `1.8` | false | false | true | no |
| `exteriorRearAngle` | `95.1315` | `171.0731` | `1.8` | false | false | true | no |
| `exteriorElevatedCutaway` | `114.1271` | `205.2925` | `1.8` | false | false | true | no |
| `interiorOverview` | `45.1774` | `65.3725` | `1.45` | false | false | true | yes |
| `interiorLiving` | `27.8029` | `43.0293` | `1.55` | false | false | true | yes |
| `interiorKitchen` | `28.7228` | `44.4573` | `1.55` | false | false | true | yes |
| `interiorSleepingBathroom` | `20.0998` | `31.0644` | `1.55` | false | false | true | yes |

The rollback restored the prior fixed-camera-distance baseline without changing geometry or product content. `productVisualAccepted` remains `false`.

## Interior-Only Pullback

The next pass kept the exterior four shots locked and moved only the four interior shots slightly farther from the same targets.

Final local evidence:

- `C:\qa\visual-evidence\20260622-151953-interior-only-pullback-local`
- `humanReadableCount: 4`
- `technicalCount: 8`
- `lockedExteriorCount: 4`
- `interiorAdjustedCount: 4`
- `productVisualAccepted=false`

| shot | before distance | after distance | multiplier | cameraChanged | targetChanged | fovChanged | readable |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `exteriorFrontHero` | `171.0731` | `171.0731` | `null` | false | false | false | no |
| `exteriorSideAngle` | `136.2865` | `136.2865` | `null` | false | false | false | no |
| `exteriorRearAngle` | `171.0731` | `171.0731` | `null` | false | false | false | no |
| `exteriorElevatedCutaway` | `205.2925` | `205.2925` | `null` | false | false | false | no |
| `interiorOverview` | `65.3725` | `70.5834` | `1.08` | true | false | false | yes |
| `interiorLiving` | `43.0293` | `46.4645` | `1.08` | true | false | false | yes |
| `interiorKitchen` | `44.4573` | `48.0070` | `1.08` | true | false | false | yes |
| `interiorSleepingBathroom` | `31.0644` | `33.5397` | `1.08` | true | false | false | yes |

Exterior shots stayed fixed. Interior shots were pulled back only by distance, with the same targets and FOV.

## GALA Opening Void Fix Only

The previous construction-quality pass was rejected because visible hollow/see-through gaps remained around windows and doors. This pass stopped all furniture, floor, layout, physics, and camera work and fixed only opening geometry.

Root cause:

- `GalaOpenings.tsx` used undersized slabs/glass (`0.82` width and `0.84` height), leaving a visible raw perimeter around openings.
- The frame/reveal assembly did not sufficiently cover the wall-thickness opening edge in close-up walk views.

Implemented changes:

- Replaced undersized door/window slab sizing with opaque slabs/glass that overlap into the frame.
- Added larger interior/exterior casing dimensions.
- Added wall-thickness jamb/header/sill liner dimensions to cover raw wall edges.
- Kept passable interior doorways visually open; no transparent closed door slabs were introduced.
- Removed self-reported opening sealed flags from `GalaOpenings.tsx` runtime userData.

Explicit non-changes:

- No furniture, kitchen layout, floorplan, wall layout, physics, collision, walk speed, camera preset, FOV, lookAt, route, auth, backend, or quote logic changed.
- No staging promotion was performed.

Evidence:

- Opening close-up evidence: `C:\qa\visual-evidence\20260623-201658-gala-opening-void-fix-local`
- Secondary 8-shot evidence: `C:\qa\visual-evidence\20260623-201658-gala-opening-void-8shot-local`

Validation:

- `node --check scripts/qa-gala-opening-voids.mjs` passed.
- `node --check scripts/qa-gala-real-user-walk-physics.mjs` passed.
- `npm.cmd run lint` passed.
- `npm.cmd run build` passed with the existing large chunk warning.

`productVisualAccepted=false`; human review must inspect the close-up opening screenshots before any further interior work.

## Opening Void Fix Staging Promotion

The reviewed local GALA opening-void fix was promoted to staging without adding any new visual, model, physics, camera, route, backend, auth, quote, or QA semantic changes.

Promoted local baseline:

- `C:\qa\visual-evidence\20260623-201658-gala-opening-void-fix-local`

Deployment:

- Vercel preview URL: `https://app-staging-os69dr2jy-esaukans-6934s-projects.vercel.app`
- Deployment id: `dpl_5KWD6aCwDcUvwMvvAvyHiBTDQGbG`
- Staging URL: `https://staging.30sek24.com`

Staging validation:

- Exterior modular-home studio route returned `200`.
- Interior modular-home studio route returned `200`.
- Opening close-up evidence generated at `C:\qa\visual-evidence\20260625-110946-gala-opening-void-fix-staging`.
- Real-user physics still passes from `C:\qa\visual-evidence\20260625-111323-gala-real-user-physics-after-opening-fix-staging`.
- Secondary 8-shot still passes from `C:\qa\visual-evidence\20260625-111539-gala-opening-void-8shot-staging`.
- Backend Supabase smoke passed.
- Quote smoke passed and cleaned up quote id `bcd7415d-e853-4d18-b10e-e3128f0b8e13`.

The staged opening result keeps:

- `entryDoorVoidFixed=true`
- `livingWindowVoidFixed=true`
- `kitchenWindowVoidFixed=true`
- `bedroomDoorwayVoidFixed=true`
- `bathroomDoorwayVoidFixed=true`
- `bedroomWindowVoidFixed=true`
- `transparentDoorSlabsInWalkMode=false`
- `passableDoorwaysLookOpen=true`
- `productVisualAccepted=false`

Manual staging review is still required before any product visual acceptance.

## Openable Doors, Sealed Windows, and Clipped Facade Seams

The previous staging opening fix was rejected because windows and doors still read as see-through voids, visually closed doors were pass-through, and facade cladding lines looked like thick battens crossing or crowding openings.

Implemented:

- `D-ENTRY`, `D-TERRACE`, `D-BEDROOM`, and `D-BATHROOM` now have a minimal `closed` / `open` state.
- Closed state shows an opaque door slab seated in the frame and contributes a closed-door collision blocker.
- Open state shows a rotated door leaf and leaves the passage clear.
- Real-user mode supports a small `E` prompt near doors for open/close.
- Windows use sealed dark blue/grey glass panes with frame/reveal coverage instead of black empty-looking holes.
- Vertical facade lines were changed from raised strips to thin clipped grooves with clearance around openings.

Not changed:

- No camera presets, FOV, lookAt targets, shot names, Playwright framing, furniture, kitchen layout, floorplan layout, walk speed, route, auth, backend, or quote logic changed.
- The only physics-related change is door collision state for closed/open doors.

Evidence:

- Opening close-up evidence: `C:\qa\visual-evidence\20260625-115752-gala-openable-doors-sealed-windows-local`
- Door physics evidence: `C:\qa\visual-evidence\20260625-115752-gala-door-physics-local`
- Secondary 8-shot evidence: `C:\qa\visual-evidence\20260625-115752-gala-openable-doors-8shot-local`

Validation:

- `node --check scripts/qa-gala-opening-voids.mjs` passed.
- `node --check scripts/qa-gala-real-user-walk-physics.mjs` passed.
- `npx.cmd tsc --noEmit --pretty false` passed.
- `npm.cmd run lint` passed.
- `npm.cmd run build` passed with the existing Vite large chunk warning.

`productVisualAccepted=false`; local close-up human review is still required before staging promotion.

## Openable Doors / Sealed Windows Staging Promotion

The approved local openable-door, sealed-window, and clipped-facade-seam fix was promoted to staging.

Promoted baseline:

- `C:\qa\visual-evidence\20260625-115752-gala-openable-doors-sealed-windows-local`

Deployment:

- Staging URL: `https://staging.30sek24.com`
- Vercel preview URL: `https://app-staging-nf6c20ct9-esaukans-6934s-projects.vercel.app`
- Deployment id: `dpl_22siGo1PYVsTUYMqjCK8bwPADtDE`
- Exterior route returned `200`.
- Interior route returned `200`.

No new model, visual, physics architecture, collision architecture, camera, route, backend, auth, quote, or QA semantic changes were made during promotion.

Staging evidence confirms:

- Closed doors block in staging.
- Open doors pass in staging.
- Windows no longer read as voids in staging evidence.
- Facade seams are clipped and do not cross openings in staging evidence.
- Secondary 8-shot still passes.
- Backend smoke passed.
- Quote smoke passed and cleaned up quote id `f139815a-d567-446e-a37c-4ca321709018`.

Staging `walkSpeedPass=true`; no separate walk-speed defect is active in this staging run.

`productVisualAccepted=false` remains pending manual staging review.

## GALA Construction Renderer Reset

Manual local review rejected the `20260625-164126` defect-root-cause/final-cleanup pass. The current primitive patch loop was stopped and replaced in the active GALA shell path with a single construction renderer.

Implemented:

- Added one construction model source of truth for dimensions, wall thickness, finished floor, ceiling height, exterior walls, interior partitions, openings, room zones, furniture anchors, cladding, baseboard, and crown trim rules.
- Replaced fragmented active shell composition with `GalaConstructionRenderer`.
- Added construction assemblies for walls, openings, floor/ceiling, cladding, and rooms so wall core, faces, reveals, casing, trims, thresholds, furniture anchors, and cladding are generated from the same model.
- Added diagnostic-only runtime mesh inventory through actual Three.js scene traversal.
- Added `scripts/qa-gala-construction-renderer.mjs` for real browser/runtime construction renderer evidence.

Preserved:

- No camera presets, FOV, lookAt targets, shot names, routes, backend, auth, quote, or staging deployment changed.
- Openable doors still pass.
- Windows still remain sealed.
- Real-user wall collision and door traversal still pass.
- Secondary 8-shot still passes.

Evidence:

- Construction renderer evidence: `C:\qa\visual-evidence\20260625-181252-gala-construction-renderer-reset-local`
- Opening regression: `C:\qa\visual-evidence\20260625-181252-gala-opening-regression-after-construction-renderer-local`
- Real-user physics regression: `C:\qa\visual-evidence\20260625-181252-gala-physics-regression-after-construction-renderer-local`
- Secondary 8-shot: `C:\qa\visual-evidence\20260625-181252-gala-construction-renderer-8shot-local`

Validation passed:

- `node --check scripts/qa-gala-construction-renderer.mjs`
- `node --check scripts/qa-gala-opening-voids.mjs`
- `node --check scripts/qa-gala-real-user-walk-physics.mjs`
- `node --check scripts/qa-3d-runtime-playwright.mjs`
- `npm.cmd run lint`
- `npm.cmd run build`

No deploy was performed. `productVisualAccepted=false`; human review is still required.
