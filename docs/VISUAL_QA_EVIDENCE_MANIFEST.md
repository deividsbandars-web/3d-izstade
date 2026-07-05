# Visual QA Evidence Manifest

Date: `2026-06-23`

This manifest records the preserved viewport-only screenshots and JSON evidence from the runtime QA harness. The screenshots live outside the repo and are not included in the source ZIP.

## GALA Defect Root-Cause Final Cleanup Local Evidence Set

External evidence locations:

- root-cause final cleanup: `C:\qa\visual-evidence\20260625-164126-gala-defect-root-cause-final-cleanup-local`
- final-fit regression: `C:\qa\visual-evidence\20260625-164126-gala-final-fit-after-defect-root-cause-local`
- visual construction regression: `C:\qa\visual-evidence\20260625-164126-gala-visual-construction-after-defect-root-cause-local`
- opening/door regression: `C:\qa\visual-evidence\20260625-164126-gala-opening-regression-after-defect-root-cause-local`
- real-user physics regression: `C:\qa\visual-evidence\20260625-164126-gala-physics-regression-after-defect-root-cause-local`
- secondary 8-shot: `C:\qa\visual-evidence\20260625-164126-gala-defect-root-cause-8shot-local`

Packaged outputs:

- source ZIP: `C:\qa\visual-evidence\20260625-164126-gala-defect-root-cause-final-cleanup-local\20260625-164126-gala-defect-root-cause-final-cleanup-local-source.zip`
- visual ZIP: `C:\qa\visual-evidence\20260625-164126-gala-defect-root-cause-final-cleanup-local\20260625-164126-gala-defect-root-cause-final-cleanup-local-visual.zip`
- ZIP allowlist/forbidden-artifact scan passed; no browser profile, storage-state, cookie, token, `.env`, JWT, service-role key, auth artifact, raw capture folder, or Windows backslash entry path was present.

Required evidence generated:

- `docs/GALA_FINAL_FIT_DEFECT_ROOT_CAUSE.md`
- `before/manual-repro/*.png`
- `after/manual-repro/*.png`
- `debug/*.png`
- `debug/*.json`
- `qa-gala-defect-root-cause-result.json`
- `qa-gala-final-fit-result.json`
- `qa-visual-construction-result.json`
- `qa-opening-void-result.json`
- `qa-real-user-walk-result.json`
- `qa-3d-runtime-result.json`
- `visual-evidence-manifest.json`

Results:

- `repairScope=gala-defect-root-cause-and-final-cleanup`
- `diagnosticFirst=true`
- `cameraChanged=false`
- `fovChanged=false`
- `routesChanged=false`
- `backendChanged=false`
- `quoteChanged=false`
- floor overlay root cause identified and local visual cleanup applied.
- bedroom/bathroom door frame/header gap root cause identified and local cleanup applied.
- ceiling trim discontinuity root cause identified and local cleanup applied.
- facade groove root cause identified and local cleanup applied.
- bedroom and bathroom layout corrections applied.
- opening/door regression passed.
- secondary 8-shot passed.
- real-user physics minimum passed for wall/door collision, but full physics harness reports `walkSpeedPass=false`; movement tuning was not changed in this task.
- `productVisualAccepted=false`.

## GALA Final-Fit Visual Cleanup Local Evidence Set

External evidence locations:

- final-fit visual cleanup: `C:\qa\visual-evidence\20260625-151623-gala-final-fit-visual-cleanup-local`
- opening regression: `C:\qa\visual-evidence\20260625-151623-gala-opening-regression-after-final-fit-local`
- real-user physics regression: `C:\qa\visual-evidence\20260625-151623-gala-physics-regression-after-final-fit-local`
- visual construction regression: `C:\qa\visual-evidence\20260625-151623-gala-visual-construction-after-final-fit-local`
- secondary 8-shot: `C:\qa\visual-evidence\20260625-151623-gala-final-fit-8shot-local`

Packaged outputs:

- source ZIP: `C:\qa\visual-evidence\20260625-151623-gala-final-fit-visual-cleanup-local\20260625-151623-gala-final-fit-visual-cleanup-local-source.zip`
- visual ZIP: `C:\qa\visual-evidence\20260625-151623-gala-final-fit-visual-cleanup-local\20260625-151623-gala-final-fit-visual-cleanup-local-visual.zip`
- ZIP contents were checked after packaging; no browser profile, storage-state, cookie, token, `.env`, JWT, service-role key, auth artifact, `chrome-profile`, or raw capture path names were present.

Required evidence generated:

- `before/manual-repro/floor-blue-overlay.png`
- `after/manual-repro/floor-blue-overlay-fixed.png`
- `before/manual-repro/bathroom-door-header-artifacts.png`
- `after/manual-repro/bathroom-door-header-clean.png`
- `before/manual-repro/facade-side-grooves-missing.png`
- `after/manual-repro/facade-side-grooves-consistent.png`
- `before/manual-repro/base-trim-inconsistent.png`
- `after/manual-repro/base-trim-consistent.png`
- `before/manual-repro/bedroom-layout-before.png`
- `after/manual-repro/bedroom-layout-after.png`
- `before/manual-repro/bathroom-layout-before.png`
- `after/manual-repro/bathroom-layout-after.png`
- `debug/floor-material-audit.png`
- `debug/ceiling-door-header-audit.png`
- `debug/facade-all-sides-groove-audit.png`
- `debug/bedroom-layout-topdown-before-after.png`
- `debug/bathroom-layout-topdown-before-after.png`
- `secondary-8shot/*.png`
- `qa-gala-final-fit-result.json`
- `qa-visual-construction-result.json`
- `qa-opening-void-result.json`
- `qa-real-user-walk-result.json`
- `qa-3d-runtime-result.json`
- `visual-evidence-manifest.json`

Results:

- `repairScope=gala-final-fit-visual-cleanup`
- `cameraChanged=false`
- `fovChanged=false`
- `routesChanged=false`
- `physicsArchitectureChanged=false`
- `floorBlueOverlayFixed=true`
- `floorMaterialStableWhileWalking=true`
- `noFloorZFighting=true`
- `bathroomDoorHeaderClean=true`
- `bedroomDoorHeaderClean=true`
- `partitionTopsSealed=true`
- `ceilingWallJoinsClean=true`
- `facadeGroovesConsistentAllSides=true`
- `facadeGroovesReachEavesWhereAppropriate=true`
- `facadeBaseTrimConsistentAllSides=true`
- `facadeNoRandomBrokenGrooves=true`
- `bedAndWardrobeLayoutImproved=true`
- `bedroomWalkPathClear=true`
- `wcAgainstWall=true`
- `wcNotCenteredInRoom=true`
- `bathroomFixturesWallAligned=true`
- `randomWhitePanelRemovedOrIntegrated=true`
- opening/door regression still passes.
- real-user physics regression still passes.
- secondary 8-shot still passes.
- `productVisualAccepted=false`.

ZIP eligibility:

- Visual ZIP may include only `before/manual-repro/*.png`, `after/manual-repro/*.png`, `debug/*.png`, `secondary-8shot/*.png`, `qa-gala-final-fit-result.json`, `qa-visual-construction-result.json`, `qa-opening-void-result.json`, `qa-real-user-walk-result.json`, `qa-3d-runtime-result.json`, and `visual-evidence-manifest.json`.
- Browser profiles, raw captures, storage state, cookies, tokens, `.env`, JWTs, service-role keys, and auth artifacts must remain excluded.

## GALA Visual Construction Quality Staging Evidence Set

External evidence locations:

- visual construction: `C:\qa\visual-evidence\20260625-143505-gala-visual-construction-quality-staging`
- opening regression: `C:\qa\visual-evidence\20260625-143505-gala-opening-regression-after-visual-construction-staging`
- real-user physics regression: `C:\qa\visual-evidence\20260625-143505-gala-physics-regression-after-visual-construction-staging`
- secondary 8-shot: `C:\qa\visual-evidence\20260625-143505-gala-visual-construction-8shot-staging`

Packaged outputs:

- source ZIP: `C:\qa\visual-evidence\20260625-143505-gala-visual-construction-quality-staging\20260625-143505-gala-visual-construction-quality-staging-source.zip`
- visual ZIP: `C:\qa\visual-evidence\20260625-143505-gala-visual-construction-quality-staging\20260625-143505-gala-visual-construction-quality-staging-visual.zip`
- ZIP contents were checked after packaging; no browser profile, storage-state, cookie, token, `.env`, JWT, service-role key, auth artifact, `chrome-profile`, or raw capture path names were present.

Deployment:

- staging URL: `https://staging.30sek24.com`
- Vercel preview URL: `https://app-staging-lbm4hqy4m-esaukans-6934s-projects.vercel.app`
- deployment id: `dpl_D6mCx1XBFb2pQ5T3ddAmB7Ne5mTE`

Staging results:

- `repairScope=gala-visual-construction-quality`
- `cameraChanged=false`
- `fovChanged=false`
- `physicsArchitectureChanged=false`
- `interiorCeilingAdded=true`
- `partitionTopsSealed=true`
- `noBlackVoidsAboveDoors=true`
- `floorMaterialStable=true`
- `noBlueDebugFloorPatches=true`
- `noFloorZFighting=true`
- `floorWallGapsFixed=true`
- `facadeSeamsAreConsistentGrooves=true`
- `facadeSeamsReachEavesWhereAppropriate=true`
- `facadeSeamsClipAroundOpenings=true`
- `facadeNoRandomBrokenLines=true`
- `bedroomLayoutImproved=true`
- `bathroomFixturesReadable=true`
- `wcNotRandomCubes=true`
- `strayInteriorBoardsRemoved=true`
- `openableDoorsStillPass=true`
- `windowsStillSealed=true`
- opening/door regression passed.
- real-user physics regression passed with `wallCollisionPass=true`, `doorTraversalPass=true`, `walkSpeedPass=true`, and `canWalkThroughWalls=false`.
- secondary 8-shot passed with `ok=true`, `8/8` technical, `8/8` readable.
- `productVisualAccepted=false`.

ZIP eligibility:

- Visual ZIP may include only `before/manual-repro/*.png`, `after/manual-repro/*.png`, `debug/*.png`, `secondary-8shot/*.png`, `secondary-8shot/qa-3d-runtime-result.json`, `qa-visual-construction-result.json`, `qa-opening-void-result.json`, `qa-real-user-walk-result.json`, and `visual-evidence-manifest.json`.
- Browser profiles, raw captures, storage state, cookies, tokens, `.env`, JWTs, service-role keys, and auth artifacts must remain excluded.

## GALA Visual Construction Quality Local Evidence Set

External evidence location: `C:\qa\visual-evidence\20260625-140059-gala-visual-construction-quality-local`

Required evidence generated:

- `before/manual-repro/floor-color-glitch.png`
- `before/manual-repro/ceiling-door-void.png`
- `before/manual-repro/facade-broken-seams.png`
- `before/manual-repro/bedroom-layout-weak.png`
- `before/manual-repro/bathroom-wc-cubes.png`
- `after/manual-repro/floor-stable.png`
- `after/manual-repro/ceiling-door-void-fixed.png`
- `after/manual-repro/facade-seams-improved.png`
- `after/manual-repro/bedroom-layout-improved.png`
- `after/manual-repro/bathroom-fixtures-improved.png`
- `debug/ceiling-section-before-after.png`
- `debug/floor-material-audit.png`
- `debug/floor-wall-corner-join.png`
- `debug/facade-seam-grid-audit.png`
- `debug/opening-seam-clearance-audit.png`
- `debug/bedroom-layout-topdown.png`
- `debug/bathroom-layout-topdown.png`
- `qa-visual-construction-result.json`
- `qa-opening-void-result.json`
- `qa-real-user-walk-result.json`
- `visual-evidence-manifest.json`

Regression evidence:

- opening regression: `C:\qa\visual-evidence\20260625-140059-gala-opening-regression-local`
- real-user physics regression: `C:\qa\visual-evidence\20260625-140059-gala-physics-regression-local`
- secondary 8-shot: `C:\qa\visual-evidence\20260625-140059-gala-visual-construction-8shot-local`

Results:

- `cameraChanged=false`
- `fovChanged=false`
- `physicsArchitectureChanged=false`
- `interiorCeilingAdded=true`
- `partitionTopsSealed=true`
- `noBlackVoidsAboveDoors=true`
- `floorMaterialStable=true`
- `noBlueDebugFloorPatches=true`
- `facadeSeamsAreConsistentGrooves=true`
- `facadeSeamsClipAroundOpenings=true`
- `bedroomLayoutImproved=true`
- `bathroomFixturesReadable=true`
- `wcNotRandomCubes=true`
- opening regression passed.
- secondary 8-shot passed with `ok=true`, `8/8` technical, `8/8` readable.
- real-user physics regression preserved `wallCollisionPass=true`, `doorTraversalPass=true`, and `canWalkThroughWalls=false`; `walkSpeedPass=false` remains a separate non-visual defect.
- `productVisualAccepted=false`.

ZIP eligibility:

- Visual ZIP may include only `before/manual-repro/*.png`, `after/manual-repro/*.png`, `debug/*.png`, `secondary-8shot/*.png`, `secondary-8shot/qa-3d-runtime-result.json`, `qa-visual-construction-result.json`, `qa-opening-void-result.json`, `qa-real-user-walk-result.json`, and `visual-evidence-manifest.json`.
- Browser profiles, raw captures, storage state, cookies, tokens, `.env`, JWTs, service-role keys, and auth artifacts must remain excluded.

## GALA Interior Construction Quality Local Evidence Set

External evidence location: `C:\qa\visual-evidence\20260623-193204-gala-interior-construction-quality-local`

Packaged outputs:

- source ZIP: `C:\qa\visual-evidence\20260623-193204-gala-interior-construction-quality-local-source.zip`
- visual ZIP: `C:\qa\visual-evidence\20260623-193204-gala-interior-construction-quality-local-visual.zip`

Harness:

- `scripts/qa-gala-real-user-walk-physics.mjs --base-url=http://127.0.0.1:9231`
- `qa3d=false`
- real-user home-studio path
- no fixed-shot camera mode
- no QA camera override

Before evidence:

- source: `20260623-182431-gala-real-user-physics-fix-staging`
- copied into `before/manual-repro/*.png`

After result:

- `realUserMode=true`
- `realUserModeUsesGalaPhysics=true`
- `walkSpeedPass=true`
- `wallCollisionPass=true`
- `doorTraversalPass=true`
- `floorVisualPass=true`
- `openingGapPass=true`
- `eyeHeightVisualPass=true`
- `canWalkThroughWalls=false`
- `productVisualAccepted=false`

Required debug evidence:

- `debug/floor-wall-seam-before-after.png`
- `debug/baseboards-before-after.png`
- `debug/entry-door-frame-before-after.png`
- `debug/window-frame-before-after.png`
- `debug/interior-door-open-vs-closed.png`
- `debug/furniture-before-after.png`
- `debug/kitchen-alignment-before-after.png`
- `debug/bedroom-layout-before-after.png`
- `debug/bathroom-layout-before-after.png`

Secondary 8-shot evidence:

- source: `C:\qa\visual-evidence\20260623-193204-gala-interior-quality-8shot-local`
- copied into `secondary-8shot/`
- result: `ok=true`, `overallQaVerdict=human-review-ready`, `8/8` technical, `8/8` readable.

ZIP eligibility:

- Visual ZIP may include only `before/manual-repro/*.png`, `after/manual-repro/*.png`, `debug/*.png`, `secondary-8shot/*.png`, `secondary-8shot/qa-3d-runtime-result.json`, `qa-real-user-walk-result.json`, and `visual-evidence-manifest.json`.
- Browser profile files, storage state, cookies, tokens, `.env`, JWTs, service-role keys, and auth artifacts must remain excluded.
- ZIP contents were checked after packaging; no forbidden path names were present.

## GALA Real-User Physics Fix Staging Evidence Set

External evidence location: `C:\qa\visual-evidence\20260623-182431-gala-real-user-physics-fix-staging`

Packaged outputs:

- source ZIP: `C:\qa\visual-evidence\20260623-182431-gala-real-user-physics-fix-staging-source.zip`
- visual ZIP: `C:\qa\visual-evidence\20260623-182431-gala-real-user-physics-fix-staging-visual.zip`

Deployment:

- preview URL: `https://app-staging-ij2ksbtwk-esaukans-6934s-projects.vercel.app`
- deployment id: `dpl_81AFgWPdhXqXcWJ45afYNanHdTX5`
- staging alias: `https://staging.30sek24.com`

Harness:

- `scripts/qa-gala-real-user-walk-physics.mjs --base-url=https://staging.30sek24.com`
- `qa3d=false`
- real-user home-studio path
- no fixed-shot camera mode
- no QA camera override

Before-failure evidence:

- source: accepted local repro `20260623-123000-gala-real-user-physics-fix-local`
- copied files: `before/manual-repro/*.png`
- merged JSON object: `qa-real-user-walk-result.json.before`
- failure state: `wallCollisionPass=false`, `walkSpeedPass=false`, `doorTraversalPass=false`, `floorVisualPass=false`, `openingGapPass=false`

Staging after-pass result:

- `realUserMode=true`
- `realUserModeUsesGalaPhysics=true`
- `realUserAndTestedPhysicsPathAligned=true`
- `walkSpeedPass=true`
- `wallCollisionPass=true`
- `doorTraversalPass=true`
- `floorVisualPass=true`
- `openingGapPass=true`
- `eyeHeightVisualPass=true`
- `canWalkThroughWalls=false`
- `productVisualAccepted=false`

Secondary 8-shot evidence:

- `C:\qa\visual-evidence\20260623-182431-gala-8shot-secondary-staging`
- `ok=true`
- `overallQaVerdict=human-review-ready`
- `8/8` technical screenshots valid
- `8/8` readable by harness checklist
- `productVisualAccepted=false`

ZIP eligibility:

- Visual ZIP may include only `before/manual-repro/*.png`, `after/manual-repro/*.png`, `debug/*.png`, `qa-real-user-walk-result.json`, and `visual-evidence-manifest.json`.
- Browser profile files, storage state, cookies, tokens, `.env`, JWTs, service-role keys, and auth artifacts must remain excluded.
- ZIP contents were checked after packaging; no forbidden path names were present.

## GALA Real-User Walk Physics Fix Evidence Set

External evidence location: `C:\qa\visual-evidence\20260623-123000-gala-real-user-physics-fix-local`

Packaged outputs:

- source ZIP: `C:\qa\visual-evidence\20260623-123000-gala-real-user-physics-fix-local-source.zip`
- visual ZIP: `C:\qa\visual-evidence\20260623-123000-gala-real-user-physics-fix-local-visual.zip`

Harness: `scripts/qa-gala-real-user-walk-physics.mjs --base-url=http://127.0.0.1:9231`

Route tested:

- `http://127.0.0.1:9231/modular-homes/studio?view=interior&homeStudio=1`

Mode:

- `qa3d=false`
- real-user home-studio path
- no fixed-shot camera mode
- no QA camera override

Before-fix reproduction:

- `wallCollisionPass=false`
- `walkSpeedPass=false`
- `doorTraversalPass=false`
- `floorVisualPass=false`
- `openingGapPass=false`
- `eyeHeightVisualPass=true`

After-fix result:

- `realUserMode=true`
- `realUserModeUsesGalaPhysics=true`
- `realUserAndTestedPhysicsPathAligned=true`
- `walkSpeedPass=true`
- `wallCollisionPass=true`
- `doorTraversalPass=true`
- `floorVisualPass=true`
- `openingGapPass=true`
- `eyeHeightVisualPass=true`
- `canWalkThroughWalls=false`
- `productVisualAccepted=false`

Evidence files:

- `before/manual-repro/*.png`
- `after/manual-repro/*.png`
- `debug/wall-collision-before-after.png`
- `debug/door-traversal-before-after.png`
- `debug/walk-speed-samples.png`
- `debug/floor-overlay-audit.png`
- `debug/opening-gap-closeups.png`
- `debug/eye-height-door-ratio.png`
- `qa-real-user-walk-result.json`
- `visual-evidence-manifest.json`

Secondary 8-shot evidence:

- `C:\qa\visual-evidence\20260623-123000-gala-8shot-secondary-local`
- result: `ok=true`, `overallQaVerdict=human-review-ready`, `8/8` technical, `8/8` readable, `productVisualAccepted=false`
- browser profile folder was generated separately and must not be packaged.

ZIP eligibility:

- Visual ZIP may include only `before/manual-repro/*.png`, `after/manual-repro/*.png`, `debug/*.png`, `qa-real-user-walk-result.json`, and `visual-evidence-manifest.json`.
- Browser profile files, storage state, cookies, tokens, `.env`, JWTs, service-role keys, and auth artifacts must remain excluded.
- ZIP contents were checked after packaging; no forbidden path names were present.

## GALA Walkable Geometry + Human-Scale Physics Staging Evidence Set

External evidence location: `C:\qa\visual-evidence\20260623-111046-gala-walkable-geometry-physics-staging`

Browser: `C:\Program Files\Google\Chrome\Application\chrome.exe`

Harness: `scripts/qa-3d-runtime-playwright.mjs --base-url=https://staging.30sek24.com --shot-set=modular-home-visual-readability`

Deployment:

- Promoted from local evidence: `20260623-100049-gala-walkable-geometry-physics-local`
- Preview URL: `https://app-staging-bd3ymfzwr-esaukans-6934s-projects.vercel.app`
- Staging alias: `https://staging.30sek24.com`
- Route checks:
  - `https://staging.30sek24.com/modular-homes/studio?view=exterior&homeStudio=1` -> `200`
  - `https://staging.30sek24.com/modular-homes/studio?view=interior&homeStudio=1` -> `200`

Result summary:

- `ok: true`
- `overallQaVerdict: human-review-ready`
- `summary.readableCount: 8`
- `summary.technicalCount: 8`
- `summary.totalShots: 8`
- `summary.geometrySanity.finishedFloorY=0`
- `summary.geometrySanity.floorZFightingFixed=true`
- `summary.geometrySanity.singleFinishedFloorSurface=true`
- `summary.geometrySanity.noCoplanarTransparentFloorOverlay=true`
- `summary.geometrySanity.cameraEyeHeightMeters=1.65`
- `summary.geometrySanity.cameraHeightValid=true`
- `summary.geometrySanity.playerStartsOnFinishedFloor=true`
- `summary.geometrySanity.playerStartsInsideWall=false`
- `summary.geometrySanity.playerStartsInsideFurniture=false`
- `summary.geometrySanity.noFlyModeInShowroom=true`
- `summary.geometrySanity.walkSpeedMps=1.35`
- `summary.geometrySanity.maxFrameStepMeters=0.08`
- `summary.geometrySanity.movementUsesDeltaTime=true`
- `summary.geometrySanity.noTeleportStep=true`
- `summary.geometrySanity.wallCollisionEnabled=true`
- `summary.geometrySanity.exteriorWallCollision=true`
- `summary.geometrySanity.partitionWallCollision=true`
- `summary.geometrySanity.doorOpeningsPassable=true`
- `summary.geometrySanity.canWalkThroughWalls=false`
- `summary.geometrySanity.openingFramesCoverWallGaps=true`
- `summary.geometrySanity.noDoorWindowVoidGaps=true`
- `summary.geometrySanity.noOpeningZFighting=true`
- `productVisualAccepted=false`

Shot outcome:

| shot | after | after-crop | readable |
| --- | --- | --- | --- |
| `exteriorFrontHero` | `after/01-exterior-front-hero.png` | `after-crop/01-exterior-front-hero-canvas.png` | yes |
| `exteriorSideAngle` | `after/02-exterior-side-angle.png` | `after-crop/02-exterior-side-angle-canvas.png` | yes |
| `exteriorRearAngle` | `after/03-exterior-rear-angle.png` | `after-crop/03-exterior-rear-angle-canvas.png` | yes |
| `exteriorElevatedCutaway` | `after/04-exterior-elevated-cutaway.png` | `after-crop/04-exterior-elevated-cutaway-canvas.png` | yes |
| `interiorOverview` | `after/05-interior-overview.png` | `after-crop/05-interior-overview-canvas.png` | yes |
| `interiorLiving` | `after/06-interior-living-zone.png` | `after-crop/06-interior-living-zone-canvas.png` | yes |
| `interiorKitchen` | `after/07-interior-kitchen-zone.png` | `after-crop/07-interior-kitchen-zone-canvas.png` | yes |
| `interiorSleepingBathroom` | `after/08-interior-sleeping-bathroom-zone.png` | `after-crop/08-interior-sleeping-bathroom-zone-canvas.png` | yes |

Debug evidence:

- `debug/floor-zfighting-check.png`
- `debug/player-eye-height-check.png`
- `debug/collision-wall-block-test.png`
- `debug/opening-gap-check.png`

Smoke:

- backend Supabase smoke passed;
- modular-home quote staging smoke passed and cleaned up quote id `8da79e5e-e7a9-4309-adce-3d04432b27aa`.

ZIP eligibility:

- Visual ZIP may include only `after/*.png`, `after-crop/*.png`, `debug/*.png`, `qa-3d-runtime-result.json`, and `visual-evidence-manifest.json`.
- Browser profile files, storage state, cookies, tokens, `.env`, JWTs, service-role keys, and auth artifacts must remain excluded.

## GALA Walkable Geometry + Human-Scale Physics Evidence Set

External evidence location: `C:\qa\visual-evidence\20260623-100049-gala-walkable-geometry-physics-local`

Browser: `C:\Program Files\Google\Chrome\Application\chrome.exe`

Harness: `scripts/qa-3d-runtime-playwright.mjs --base-url=http://127.0.0.1:9231 --shot-set=modular-home-visual-readability`

Result summary:

- `ok: true`
- `overallQaVerdict: human-review-ready`
- `summary.readableCount: 8`
- `summary.technicalCount: 8`
- `summary.totalShots: 8`
- `summary.geometrySanity.finishedFloorY=0`
- `summary.geometrySanity.floorZFightingFixed=true`
- `summary.geometrySanity.singleFinishedFloorSurface=true`
- `summary.geometrySanity.noCoplanarTransparentFloorOverlay=true`
- `summary.geometrySanity.cameraEyeHeightMeters=1.65`
- `summary.geometrySanity.cameraHeightValid=true`
- `summary.geometrySanity.playerStartsOnFinishedFloor=true`
- `summary.geometrySanity.playerStartsInsideWall=false`
- `summary.geometrySanity.playerStartsInsideFurniture=false`
- `summary.geometrySanity.noFlyModeInShowroom=true`
- `summary.geometrySanity.walkSpeedMps=1.35`
- `summary.geometrySanity.maxFrameStepMeters=0.08`
- `summary.geometrySanity.movementUsesDeltaTime=true`
- `summary.geometrySanity.noTeleportStep=true`
- `summary.geometrySanity.wallCollisionEnabled=true`
- `summary.geometrySanity.exteriorWallCollision=true`
- `summary.geometrySanity.partitionWallCollision=true`
- `summary.geometrySanity.doorOpeningsPassable=true`
- `summary.geometrySanity.canWalkThroughWalls=false`
- `summary.geometrySanity.openingFramesCoverWallGaps=true`
- `summary.geometrySanity.noDoorWindowVoidGaps=true`
- `summary.geometrySanity.noOpeningZFighting=true`
- `productVisualAccepted=false`

Shot outcome:

| shot | after | after-crop | readable |
| --- | --- | --- | --- |
| `exteriorFrontHero` | `after/01-exterior-front-hero.png` | `after-crop/01-exterior-front-hero-canvas.png` | yes |
| `exteriorSideAngle` | `after/02-exterior-side-angle.png` | `after-crop/02-exterior-side-angle-canvas.png` | yes |
| `exteriorRearAngle` | `after/03-exterior-rear-angle.png` | `after-crop/03-exterior-rear-angle-canvas.png` | yes |
| `exteriorElevatedCutaway` | `after/04-exterior-elevated-cutaway.png` | `after-crop/04-exterior-elevated-cutaway-canvas.png` | yes |
| `interiorOverview` | `after/05-interior-overview.png` | `after-crop/05-interior-overview-canvas.png` | yes |
| `interiorLiving` | `after/06-interior-living-zone.png` | `after-crop/06-interior-living-zone-canvas.png` | yes |
| `interiorKitchen` | `after/07-interior-kitchen-zone.png` | `after-crop/07-interior-kitchen-zone-canvas.png` | yes |
| `interiorSleepingBathroom` | `after/08-interior-sleeping-bathroom-zone.png` | `after-crop/08-interior-sleeping-bathroom-zone-canvas.png` | yes |

Debug evidence:

- `debug/floor-zfighting-check.png`
- `debug/player-eye-height-check.png`
- `debug/collision-wall-block-test.png`
- `debug/opening-gap-check.png`

Manifest additions:

- `repairScope=gala-walkable-geometry-physics-reset`
- `cameraChanged=false`
- `fovChanged=false`
- `shotPresetChanged=false`
- `floorZFightingFixed=true`
- `singleFinishedFloorSurface=true`
- `cameraEyeHeightMeters=1.65`
- `walkSpeedMps=1.35`
- `wallCollisionEnabled=true`
- `canWalkThroughWalls=false`
- `doorOpeningsPassable=true`
- `openingFramesCoverWallGaps=true`
- `noDoorWindowVoidGaps=true`
- `noOpeningZFighting=true`
- `productVisualAccepted=false`

Manual walk-through checks:

- stand inside and compare eye height to the 2.1m door;
- walk forward into an exterior wall and confirm movement stops;
- walk through bedroom and bathroom doors only through openings;
- move near windows/doors and check that frames cover wall gaps;
- look at the floor while walking and confirm there is no flicker or z-fighting.

ZIP eligibility:

- Visual ZIP may include only `after/*.png`, `after-crop/*.png`, `debug/*.png`, `qa-3d-runtime-result.json`, and `visual-evidence-manifest.json`.
- Browser profile files, storage state, cookies, tokens, `.env`, JWTs, service-role keys, and auth artifacts must remain excluded.

## GALA Interior Floorplan Reset Staging Evidence Set

External evidence location: `C:\qa\visual-evidence\20260623-064415-gala-interior-floorplan-reset-staging`

Browser: `C:\Program Files\Google\Chrome\Application\chrome.exe`

Harness: `scripts/qa-3d-runtime-playwright.mjs --base-url=https://staging.30sek24.com --shot-set=modular-home-visual-readability`

Deployment:

- Preview URL: `https://app-staging-9idnck0hr-esaukans-6934s-projects.vercel.app`
- Staging alias: `https://staging.30sek24.com`
- Route checks:
  - `https://staging.30sek24.com/modular-homes/studio?view=exterior&homeStudio=1` -> `200`
  - `https://staging.30sek24.com/modular-homes/studio?view=interior&homeStudio=1` -> `200`

Result summary:

- `ok: true`
- `overallQaVerdict: human-review-ready`
- `summary.readableCount: 8`
- `summary.technicalCount: 8`
- `summary.totalShots: 8`
- `summary.cameraChangedCount=0`
- `summary.fixedPresetAppliedCount=8`
- `summary.exteriorChanged=false`
- `summary.floorplanCoordinateSystemAdded=true`
- `summary.interiorLayoutRebuilt=true`
- `summary.furnitureBlocksDoors=false`
- `summary.furnitureBlocksWindows=false`
- `summary.circulationPathsClear=true`
- `productVisualAccepted=false`

Shot outcome:

| shot | after | after-crop | readable |
| --- | --- | --- | --- |
| `exteriorFrontHero` | `after/01-exterior-front-hero.png` | `after-crop/01-exterior-front-hero-canvas.png` | yes |
| `exteriorSideAngle` | `after/02-exterior-side-angle.png` | `after-crop/02-exterior-side-angle-canvas.png` | yes |
| `exteriorRearAngle` | `after/03-exterior-rear-angle.png` | `after-crop/03-exterior-rear-angle-canvas.png` | yes |
| `exteriorElevatedCutaway` | `after/04-exterior-elevated-cutaway.png` | `after-crop/04-exterior-elevated-cutaway-canvas.png` | yes |
| `interiorOverview` | `after/05-interior-overview.png` | `after-crop/05-interior-overview-canvas.png` | yes |
| `interiorLiving` | `after/06-interior-living-zone.png` | `after-crop/06-interior-living-zone-canvas.png` | yes |
| `interiorKitchen` | `after/07-interior-kitchen-zone.png` | `after-crop/07-interior-kitchen-zone-canvas.png` | yes |
| `interiorSleepingBathroom` | `after/08-interior-sleeping-bathroom-zone.png` | `after-crop/08-interior-sleeping-bathroom-zone-canvas.png` | yes |

Debug evidence:

- `debug/floorplan-layout-topdown.png`
- `debug/interior-circulation-paths.png`

Manifest additions:

- `repairScope=gala-interior-floorplan-reset-staging-promotion`
- `promotedFrom=20260623-075130-gala-interior-floorplan-reset-local`
- `cameraChanged=false`, `fovChanged=false`, `exteriorChanged=false`
- `interiorLayoutRebuilt=true`
- `floorplanCoordinateSystemAdded=true`
- `bedroomDoorExists=true`, `bathroomDoorExists=true`
- `bedroomDoorAccessible=true`, `bathroomDoorAccessible=true`
- `entryClear=true`
- `furnitureBlocksDoors=false`
- `furnitureBlocksWindows=false`
- `circulationPathsClear=true`
- `interiorGeometryConsistent=true`
- `playerStartsInsideFloorplan=true`
- `playerStartsInsideFurniture=false`
- `playerStartsInsideWall=false`
- `cameraHeightValid=true`
- `productVisualAccepted=false`

ZIP eligibility:

- Visual ZIP may include only `after/*.png`, `after-crop/*.png`, `debug/*.png`, `qa-3d-runtime-result.json`, and `visual-evidence-manifest.json`.
- Browser profile files, storage state, cookies, tokens, `.env`, JWTs, service-role keys, and auth artifacts must remain excluded.

## GALA Interior Floorplan Reset Evidence Set

External evidence location: `C:\qa\visual-evidence\20260623-075130-gala-interior-floorplan-reset-local`

External profile location: `C:\qa\visual-evidence\20260623-075130-gala-interior-floorplan-reset-local-chrome-profile`

Browser: `C:\Program Files\Google\Chrome\Application\chrome.exe`

Harness: `scripts/qa-3d-runtime-playwright.mjs --shot-set=modular-home-visual-readability`

Manual baseline copy:

- `before/*.png` was copied from `C:\qa\visual-evidence\20260623-052444-gala-facade-opening-correction-staging\after`, the promoted facade/opening baseline before the interior floorplan reset.

Result summary:

- `ok: true`
- `overallQaVerdict: human-review-ready`
- `summary.readableCount: 8`
- `summary.technicalCount: 8`
- `summary.totalShots: 8`
- `summary.cameraChangedCount=0`
- `summary.exteriorChanged=false`
- `summary.floorplanCoordinateSystemAdded=true`
- `summary.interiorLayoutRebuilt=true`
- `summary.furnitureBlocksDoors=false`
- `summary.furnitureBlocksWindows=false`
- `summary.circulationPathsClear=true`
- `cameraPositionDelta=0` for all fixed camera shots
- `productVisualAccepted=false` for all shots

Shot outcome:

| shot | before | after | after-crop | readable |
| --- | --- | --- | --- | --- |
| `exteriorFrontHero` | `before/01-exterior-front-hero.png` | `after/01-exterior-front-hero.png` | `after-crop/01-exterior-front-hero-canvas.png` | yes |
| `exteriorSideAngle` | `before/02-exterior-side-angle.png` | `after/02-exterior-side-angle.png` | `after-crop/02-exterior-side-angle-canvas.png` | yes |
| `exteriorRearAngle` | `before/03-exterior-rear-angle.png` | `after/03-exterior-rear-angle.png` | `after-crop/03-exterior-rear-angle-canvas.png` | yes |
| `exteriorElevatedCutaway` | `before/04-exterior-elevated-cutaway.png` | `after/04-exterior-elevated-cutaway.png` | `after-crop/04-exterior-elevated-cutaway-canvas.png` | yes |
| `interiorOverview` | `before/05-interior-overview.png` | `after/05-interior-overview.png` | `after-crop/05-interior-overview-canvas.png` | yes |
| `interiorLiving` | `before/06-interior-living-zone.png` | `after/06-interior-living-zone.png` | `after-crop/06-interior-living-zone-canvas.png` | yes |
| `interiorKitchen` | `before/07-interior-kitchen-zone.png` | `after/07-interior-kitchen-zone.png` | `after-crop/07-interior-kitchen-zone-canvas.png` | yes |
| `interiorSleepingBathroom` | `before/08-interior-sleeping-bathroom-zone.png` | `after/08-interior-sleeping-bathroom-zone.png` | `after-crop/08-interior-sleeping-bathroom-zone-canvas.png` | yes |

Debug evidence:

- `debug/floorplan-layout-topdown.png`
- `debug/interior-circulation-paths.png`

Manifest additions:

- `repairScope=gala-interior-floorplan-reset`
- `cameraChanged=false`, `fovChanged=false`, `exteriorChanged=false`
- `interiorLayoutRebuilt=true`
- `floorplanCoordinateSystemAdded=true`
- `bedroomDoorExists=true`, `bathroomDoorExists=true`
- `bedroomDoorAccessible=true`, `bathroomDoorAccessible=true`
- `entryClear=true`
- `furnitureBlocksDoors=false`
- `furnitureBlocksWindows=false`
- `circulationPathsClear=true`
- `interiorGeometryConsistent=true`
- `playerStartsInsideFloorplan=true`
- `playerStartsInsideFurniture=false`
- `playerStartsInsideWall=false`
- `cameraHeightValid=true`
- explicit floorplan coordinates for rooms, door clearances, and circulation paths

ZIP eligibility:

- Visual ZIP may include only `before/*.png`, `after/*.png`, `after-crop/*.png`, `debug/*.png`, `qa-3d-runtime-result.json`, and `visual-evidence-manifest.json`.
- Browser profile files, storage state, cookies, tokens, `.env`, JWTs, service-role keys, and auth artifacts must remain excluded.

## GALA Facade Opening Correction Evidence Set

External evidence location: `C:\qa\visual-evidence\20260623-045331-gala-facade-opening-correction-local`

External profile location: `C:\qa\visual-evidence\20260623-045331-gala-facade-opening-correction-local-chrome-profile`

Browser: `C:\Program Files\Google\Chrome\Application\chrome.exe`

Harness: `scripts/qa-3d-runtime-playwright.mjs --shot-set=modular-home-visual-readability`

Manual baseline copy:

- `before/*.png` was copied from `C:\qa\visual-evidence\20260623-025556-gala-cleanup-config-foundation-local\after`, the prior cleanup/config evidence before the facade-opening correction.

Result summary:

- `ok: true`
- `overallQaVerdict: human-review-ready`
- `summary.readableCount: 8`
- `summary.technicalCount: 8`
- `summary.totalShots: 8`
- `cameraPositionDelta=0` for all frozen fixed camera shots
- `productVisualAccepted=false` for all shots

Shot outcome:

| shot | before | after | after-crop | readable |
| --- | --- | --- | --- | --- |
| `exteriorFrontHero` | `before/01-exterior-front-hero.png` | `after/01-exterior-front-hero.png` | `after-crop/01-exterior-front-hero-canvas.png` | yes |
| `exteriorSideAngle` | `before/02-exterior-side-angle.png` | `after/02-exterior-side-angle.png` | `after-crop/02-exterior-side-angle-canvas.png` | yes |
| `exteriorRearAngle` | `before/03-exterior-rear-angle.png` | `after/03-exterior-rear-angle.png` | `after-crop/03-exterior-rear-angle-canvas.png` | yes |
| `exteriorElevatedCutaway` | `before/04-exterior-elevated-cutaway.png` | `after/04-exterior-elevated-cutaway.png` | `after-crop/04-exterior-elevated-cutaway-canvas.png` | yes |
| `interiorOverview` | `before/05-interior-overview.png` | `after/05-interior-overview.png` | `after-crop/05-interior-overview-canvas.png` | yes |
| `interiorLiving` | `before/06-interior-living-zone.png` | `after/06-interior-living-zone.png` | `after-crop/06-interior-living-zone-canvas.png` | yes |
| `interiorKitchen` | `before/07-interior-kitchen-zone.png` | `after/07-interior-kitchen-zone.png` | `after-crop/07-interior-kitchen-zone-canvas.png` | yes |
| `interiorSleepingBathroom` | `before/08-interior-sleeping-bathroom-zone.png` | `after/08-interior-sleeping-bathroom-zone.png` | `after-crop/08-interior-sleeping-bathroom-zone-canvas.png` | yes |

Detail evidence:

- `detail/front-door-opening-trim.png`
- `detail/window-cladding-clipped.png`
- `detail/terrace-step-cleanup.png`

Manifest additions:

- `repairScope=gala-facade-opening-correction`
- `cameraChanged=false`, `targetChanged=false`, `distanceChanged=false`, `fovChanged=false`
- `verticalFacadeRestored=true`
- `openingAwareCladding=true`
- `boardsDoNotCrossWindows=true`
- `boardsDoNotCrossDoors=true`
- `openingTrimVisible=true`
- `terraceFrontBoardStillFixed=true`
- `defaultFacadeStyle=vertical-timber`
- `verticalTimberIsReferenceDefault=true`
- `horizontalTimberOnlyOptionalVariant=true`
- `openingClippingAppliesToFacadeVariants=true`
- `productVisualAccepted=false`

## GALA Cleanup + Config Foundation Evidence Set

External evidence location: `C:\qa\visual-evidence\20260623-025556-gala-cleanup-config-foundation-local`

External profile location: `C:\qa\visual-evidence\20260623-025556-gala-cleanup-config-foundation-local-chrome-profile`

Browser: `C:\Program Files\Google\Chrome\Application\chrome.exe`

Harness: `scripts/qa-3d-runtime-playwright.mjs --shot-set=modular-home-visual-readability`

Manual baseline copy:

- `before/*.png` was copied from `C:\qa\visual-evidence\20260623-021822-gala-30deg-model-rebuild-local\after`, the previous accepted GALA model direction before cleanup/config changes.

Result summary:

- `ok: true`
- `overallQaVerdict: human-review-ready`
- `summary.readableCount: 8`
- `summary.technicalCount: 8`
- `summary.totalShots: 8`
- `cameraPositionDelta=0` for all frozen fixed camera shots
- `productVisualAccepted=false` for all shots

Shot outcome:

| shot | before | after | after-crop | readable |
| --- | --- | --- | --- | --- |
| `exteriorFrontHero` | `before/01-exterior-front-hero.png` | `after/01-exterior-front-hero.png` | `after-crop/01-exterior-front-hero-canvas.png` | yes |
| `exteriorSideAngle` | `before/02-exterior-side-angle.png` | `after/02-exterior-side-angle.png` | `after-crop/02-exterior-side-angle-canvas.png` | yes |
| `exteriorRearAngle` | `before/03-exterior-rear-angle.png` | `after/03-exterior-rear-angle.png` | `after-crop/03-exterior-rear-angle-canvas.png` | yes |
| `exteriorElevatedCutaway` | `before/04-exterior-elevated-cutaway.png` | `after/04-exterior-elevated-cutaway.png` | `after-crop/04-exterior-elevated-cutaway-canvas.png` | yes |
| `interiorOverview` | `before/05-interior-overview.png` | `after/05-interior-overview.png` | `after-crop/05-interior-overview-canvas.png` | yes |
| `interiorLiving` | `before/06-interior-living-zone.png` | `after/06-interior-living-zone.png` | `after-crop/06-interior-living-zone-canvas.png` | yes |
| `interiorKitchen` | `before/07-interior-kitchen-zone.png` | `after/07-interior-kitchen-zone.png` | `after-crop/07-interior-kitchen-zone-canvas.png` | yes |
| `interiorSleepingBathroom` | `before/08-interior-sleeping-bathroom-zone.png` | `after/08-interior-sleeping-bathroom-zone.png` | `after-crop/08-interior-sleeping-bathroom-zone-canvas.png` | yes |

Manifest additions:

- `repairScope=gala-cleanup-config-foundation`
- `cameraChanged=false`, `targetChanged=false`, `distanceChanged=false`, `fovChanged=false`
- `modelGeometryChanged=true`
- `straySideBoardsRemoved=true`
- `terraceFrontBoardFixed=true`
- `visualConfigIntroduced=true`
- `configSystem.visualConfigTypeAdded=true`
- `configSystem.facadeOptions=4`
- `configSystem.roofOptions=3`
- `configSystem.doorOptions=3`
- `configSystem.terraceOptions=3`
- `configSystem.interiorPackages=3`
- `configSystem.bomQuoteMappingReady=documented-foundation`

## GALA 30 Degree Model Rebuild Evidence Set

External evidence location: `C:\qa\visual-evidence\20260623-021822-gala-30deg-model-rebuild-local`

External profile location: `C:\qa\visual-evidence\20260623-021822-gala-30deg-model-rebuild-local-chrome-profile`

Browser: `C:\Program Files\Google\Chrome\Application\chrome.exe`

Harness: `scripts/qa-3d-runtime-playwright.mjs --shot-set=modular-home-visual-readability`

Reference package: `Koka_maja_GALA_30deg_pilns_komplekts.zip`

Manual baseline copy:

- `before/*.png` was copied from `C:\qa\visual-evidence\20260623-000646-model-only-visual-upgrade-local\after`, the previous rejected model-only/Minecraft-style evidence state.

Result summary:

- `ok: true`
- `overallQaVerdict: human-review-ready`
- `summary.readableCount: 8`
- `summary.technicalCount: 8`
- `summary.totalShots: 8`
- `fixedPresetApplied=true` for all 8 shots
- `productVisualAccepted=false` for all shots

Shot outcome:

| shot | before | after | after-crop | readable |
| --- | --- | --- | --- | --- |
| `exteriorFrontHero` | `before/01-exterior-front-hero.png` | `after/01-exterior-front-hero.png` | `after-crop/01-exterior-front-hero-canvas.png` | yes |
| `exteriorSideAngle` | `before/02-exterior-side-angle.png` | `after/02-exterior-side-angle.png` | `after-crop/02-exterior-side-angle-canvas.png` | yes |
| `exteriorRearAngle` | `before/03-exterior-rear-angle.png` | `after/03-exterior-rear-angle.png` | `after-crop/03-exterior-rear-angle-canvas.png` | yes |
| `exteriorElevatedCutaway` | `before/04-exterior-elevated-cutaway.png` | `after/04-exterior-elevated-cutaway.png` | `after-crop/04-exterior-elevated-cutaway-canvas.png` | yes |
| `interiorOverview` | `before/05-interior-overview.png` | `after/05-interior-overview.png` | `after-crop/05-interior-overview-canvas.png` | yes |
| `interiorLiving` | `before/06-interior-living-zone.png` | `after/06-interior-living-zone.png` | `after-crop/06-interior-living-zone-canvas.png` | yes |
| `interiorKitchen` | `before/07-interior-kitchen-zone.png` | `after/07-interior-kitchen-zone.png` | `after-crop/07-interior-kitchen-zone-canvas.png` | yes |
| `interiorSleepingBathroom` | `before/08-interior-sleeping-bathroom-zone.png` | `after/08-interior-sleeping-bathroom-zone.png` | `after-crop/08-interior-sleeping-bathroom-zone-canvas.png` | yes |

Manifest additions:

- `repairScope=gala-30deg-plan-based-model-rebuild`
- `modelGeometryRebuilt=true`
- `cameraChanged=false`, `targetChanged=false`, `distanceChanged=false`, `fovChanged=false`
- `referencePackageUsed=Koka_maja_GALA_30deg_pilns_komplekts`
- `cameraHeightValid=true`, `playerHeightValid=true`, `noThreeHouseHeightJump=true`
- Exterior checklist records 30 degree gable roof, opaque shell, schedule openings, vertical cladding, and residential terrace.
- Interior checklist records plan-based zones, living/kitchen/entry, bedroom, bathroom/utility, and zone readability without relying on labels.

## Model-Only Visual Upgrade Evidence Set

External evidence location: `C:\qa\visual-evidence\20260623-000646-model-only-visual-upgrade-local`

External profile location: `C:\qa\visual-evidence\20260623-000646-model-only-visual-upgrade-local-chrome-profile`

Browser: `C:\Program Files\Google\Chrome\Application\chrome.exe`

Harness: `scripts/qa-3d-runtime-playwright.mjs --shot-set=modular-home-visual-readability`

Manual baseline copy:

- `before/*.png` was copied from the prior frozen baseline evidence set so the comparison remains truthful even though the harness only emitted `after/` and `after-crop/`.

Result summary:

- `ok: false`
- `overallQaVerdict: blocked`
- `summary.readableCount: 4`
- `summary.technicalCount: 8`
- `summary.totalShots: 8`

Shot outcome:

| shot | before | after | after-crop | readable |
| --- | --- | --- | --- | --- |
| `exteriorFrontHero` | `before/01-exterior-front-hero.png` | `after/01-exterior-front-hero.png` | `after-crop/01-exterior-front-hero-canvas.png` | no |
| `exteriorSideAngle` | `before/02-exterior-side-angle.png` | `after/02-exterior-side-angle.png` | `after-crop/02-exterior-side-angle-canvas.png` | no |
| `exteriorRearAngle` | `before/03-exterior-rear-angle.png` | `after/03-exterior-rear-angle.png` | `after-crop/03-exterior-rear-angle-canvas.png` | no |
| `exteriorElevatedCutaway` | `before/04-exterior-elevated-cutaway.png` | `after/04-exterior-elevated-cutaway.png` | `after-crop/04-exterior-elevated-cutaway-canvas.png` | no |
| `interiorOverview` | `before/05-interior-overview.png` | `after/05-interior-overview.png` | `after-crop/05-interior-overview-canvas.png` | yes |
| `interiorLiving` | `before/06-interior-living-zone.png` | `after/06-interior-living-zone.png` | `after-crop/06-interior-living-zone-canvas.png` | yes |
| `interiorKitchen` | `before/07-interior-kitchen-zone.png` | `after/07-interior-kitchen-zone.png` | `after-crop/07-interior-kitchen-zone-canvas.png` | yes |
| `interiorSleepingBathroom` | `before/08-interior-sleeping-bathroom-zone.png` | `after/08-interior-sleeping-bathroom-zone.png` | `after-crop/08-interior-sleeping-bathroom-zone-canvas.png` | yes |

Notes:

- `productVisualAccepted` remains `false` for every shot.
- The model upgrade did not change the frozen camera set.
- The exterior four shots still fail the human-readable gate.

## Camera Lock Enforcement Evidence Set

External evidence location: `C:\qa\visual-evidence\20260622-235011-camera-lock-05-08-adjust-local`

External profile location: `C:\qa\visual-evidence\20260622-235011-camera-lock-05-08-adjust-local-chrome-profile`

Browser: `C:\Program Files\Google\Chrome\Application\chrome.exe`

Harness: `scripts/qa-3d-runtime-playwright.mjs --shot-set=modular-home-camera-lock-05-08-adjust`

Result summary:

- `ok: true`
- `overallQaVerdict: blocked`
- `summary.lockedCameraCount: 6`
- `summary.adjustedCameraCount: 2`
- `summary.humanReadableCount: 4`
- `summary.technicalCount: 8`
- `summary.totalShots: 8`

Shot outcome:

| shot | locked | adjustable | after | after-crop | lockStatus |
| --- | ---: | ---: | --- | --- | --- |
| `exteriorFrontHero` | yes | no | `after/01-exterior-front-hero.png` | `after-crop/01-exterior-front-hero-canvas.png` | `PASS` |
| `exteriorSideAngle` | yes | no | `after/02-exterior-side-angle.png` | `after-crop/02-exterior-side-angle-canvas.png` | `PASS` |
| `exteriorRearAngle` | yes | no | `after/03-exterior-rear-angle.png` | `after-crop/03-exterior-rear-angle-canvas.png` | `PASS` |
| `exteriorElevatedCutaway` | yes | no | `after/04-exterior-elevated-cutaway.png` | `after-crop/04-exterior-elevated-cutaway-canvas.png` | `PASS` |
| `interiorOverview` | no | yes | `after/05-interior-overview.png` | `after-crop/05-interior-overview-canvas.png` | `ADJUSTED` |
| `interiorLiving` | yes | no | `after/06-interior-living-zone.png` | `after-crop/06-interior-living-zone-canvas.png` | `PASS` |
| `interiorKitchen` | yes | no | `after/07-interior-kitchen-zone.png` | `after-crop/07-interior-kitchen-zone-canvas.png` | `PASS` |
| `interiorSleepingBathroom` | no | yes | `after/08-interior-sleeping-bathroom-zone.png` | `after-crop/08-interior-sleeping-bathroom-zone-canvas.png` | `ADJUSTED` |

Normalized camera comparison:

| shot | before distance | after distance | multiplier | targetChanged | geometryChanged | fovChanged |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `exteriorFrontHero` | `95.1315` | `95.1315` | `1` | false | false | false |
| `exteriorSideAngle` | `75.8288` | `75.8288` | `1` | false | false | false |
| `exteriorRearAngle` | `95.1315` | `95.1315` | `1` | false | false | false |
| `exteriorElevatedCutaway` | `114.1271` | `114.1271` | `1` | false | false | false |
| `interiorOverview` | `45.1774` | `50.5987` | `1.12` | false | false | false |
| `interiorLiving` | `27.8029` | `27.8029` | `1` | false | false | false |
| `interiorKitchen` | `28.7228` | `28.7228` | `1` | false | false | false |
| `interiorSleepingBathroom` | `20.0998` | `22.5117` | `1.12` | false | false | false |

Notes:

- `productVisualAccepted` remains `false` for every shot.
- The lock-enforcement run proves the six frozen cameras stayed on the baseline while only the two interior shots moved.
- The exterior four still fail the human-readable gate.

## Visual Readability Evidence Set

External evidence location: `C:\qa\visual-evidence\20260622-153957-visual-readability-pass-local`

External profile location: `C:\qa\visual-evidence\20260622-153957-visual-readability-pass-local-chrome-profile`

Browser: `C:\Program Files\Google\Chrome\Application\chrome.exe`

Harness: `scripts/qa-3d-runtime-playwright.mjs --shot-set=modular-home-visual-readability`

Manual baseline copy:

- `before/*.png` was copied from the restored baseline evidence set before the after-run.

Result summary:

- `ok: false`
- `overallQaVerdict: blocked`
- `summary.readableCount: 4`
- `summary.technicalCount: 8`
- `summary.totalShots: 8`

Shot outcome:

| shot | after | after-crop | readable |
| --- | --- | --- | --- |
| `exteriorFrontHero` | `after/01-exterior-front-hero.png` | `after-crop/01-exterior-front-hero-canvas.png` | no |
| `exteriorSideAngle` | `after/02-exterior-side-angle.png` | `after-crop/02-exterior-side-angle-canvas.png` | no |
| `exteriorRearAngle` | `after/03-exterior-rear-angle.png` | `after-crop/03-exterior-rear-angle-canvas.png` | no |
| `exteriorElevatedCutaway` | `after/04-exterior-elevated-cutaway.png` | `after-crop/04-exterior-elevated-cutaway-canvas.png` | no |
| `interiorOverview` | `after/05-interior-overview.png` | `after-crop/05-interior-overview-canvas.png` | yes |
| `interiorLiving` | `after/06-interior-living-zone.png` | `after-crop/06-interior-living-zone-canvas.png` | yes |
| `interiorKitchen` | `after/07-interior-kitchen-zone.png` | `after-crop/07-interior-kitchen-zone-canvas.png` | yes |
| `interiorSleepingBathroom` | `after/08-interior-sleeping-bathroom-zone.png` | `after-crop/08-interior-sleeping-bathroom-zone-canvas.png` | yes |

## Camera Solver Evidence Set

External evidence location: `C:\3d\tmp\qa-visual-evidence-camera-solver-staging`

External profile location: `C:\3d\tmp\qa-visual-evidence-camera-solver-staging\chrome-profile`

Browser: `C:\Program Files\Google\Chrome\Application\chrome.exe`

Harness: `scripts/qa-3d-runtime-playwright.mjs --shot-set=modular-home-camera-solver`

Modular-home root: `expo-zone-group:modular-home-preview`

| shot | file | technicalScreenshotValid | productObjectInFrame | productDominatesFrame | objectCentered | cameraInsideGeometryLikely | visualInspectionReady | humanReviewRequired | coverage | verdict |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `exteriorFrontHero` | `after/01-exterior-front-hero.png` | yes | no | no | no | false | no | yes | `0.064` | blocked |
| `exteriorSideAngle` | `after/02-exterior-side-angle.png` | yes | no | no | no | false | no | yes | `0.079` | blocked |
| `exteriorRearAngle` | `after/03-exterior-rear-angle.png` | yes | no | no | no | false | no | yes | `0.088` | blocked |
| `exteriorElevatedCutaway` | `after/04-exterior-elevated-cutaway.png` | yes | yes | no | no | false | no | yes | `1.000` | blocked |
| `interiorOverview` | `after/05-interior-overview.png` | yes | yes | no | no | false | no | yes | `0.430` | blocked |
| `interiorLiving` | `after/06-interior-living-zone.png` | yes | yes | no | no | false | no | yes | `0.535` | blocked |
| `interiorKitchen` | `after/07-interior-kitchen-zone.png` | yes | yes | no | no | false | no | yes | `0.544` | blocked |
| `interiorSleepingBathroom` | `after/08-interior-sleeping-bathroom-zone.png` | yes | yes | no | no | false | no | yes | `0.477` | blocked |

## File Checks

| file | exists | size | dimensions | visually useful |
| ---- | -----: | ---: | ---------- | --------------: |
| `after/01-exterior-front-hero.png` | yes | `190999` | `1440x900` | no |
| `after/02-exterior-side-angle.png` | yes | `194533` | `1440x900` | no |
| `after/03-exterior-rear-angle.png` | yes | `199925` | `1440x900` | no |
| `after/04-exterior-elevated-cutaway.png` | yes | `186726` | `1440x900` | no |
| `after/05-interior-overview.png` | yes | `196575` | `1440x900` | no |
| `after/06-interior-living-zone.png` | yes | `219117` | `1440x900` | no |
| `after/07-interior-kitchen-zone.png` | yes | `222776` | `1440x900` | no |
| `after/08-interior-sleeping-bathroom-zone.png` | yes | `216559` | `1440x900` | no |
| `after-crop/01-exterior-front-hero-canvas.png` | yes | `190999` | `1440x900` | no |
| `after-crop/02-exterior-side-angle-canvas.png` | yes | `194533` | `1440x900` | no |
| `after-crop/03-exterior-rear-angle-canvas.png` | yes | `199925` | `1440x900` | no |
| `after-crop/04-exterior-elevated-cutaway-canvas.png` | yes | `186726` | `1440x900` | no |
| `after-crop/05-interior-overview-canvas.png` | yes | `196575` | `1440x900` | no |
| `after-crop/06-interior-living-zone-canvas.png` | yes | `219117` | `1440x900` | no |
| `after-crop/07-interior-kitchen-zone-canvas.png` | yes | `222776` | `1440x900` | no |
| `after-crop/08-interior-sleeping-bathroom-zone-canvas.png` | yes | `216559` | `1440x900` | no |

## Result JSON

- `ok: false`
- `overallQaVerdict: blocked`
- `summary`:
  - `insideGeometryCount: 0`
  - `productDominatesCount: 0`
  - `productObjectCount: 5`
  - `technicalCount: 8`
  - `totalShots: 8`

## Notes

- The evidence directories are outside the repo and stay outside the source ZIP.
- No browser profile, cookies, tokens, JWTs, or storage-state contents are included here.
- `productVisualAccepted` remains `false` because the harness only proves runtime truth and frame readiness, not final product acceptance.
- The camera solver does not rescue the 8-angle contract: the existing modular-home scene is still not client-readable enough.
- The correct next move is to stop incremental 3D modular-home work and choose a different MVP direction.

## Fixed Camera Preset Evidence Set

Local updated-code evidence location: `C:\qa\visual-evidence\20260622-123455-fixed-camera-local`

Staging evidence location: `C:\qa\visual-evidence\20260622-123543-fixed-camera-staging`

Harness: `scripts/qa-3d-runtime-playwright.mjs --shot-set=modular-home-fixed-camera-8angle`

Required visual-evidence ZIP contents are limited to:

- `after/*.png`
- `after-crop/*.png`
- `qa-3d-runtime-result.json`
- `visual-evidence-manifest.json`

Local fixed preset result:

| shot | after | after-crop | fixedPresetApplied | humanReadableFrame | mostlyFlatPlane | uiDominates | productVisualAccepted |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: |
| `exteriorFrontHero` | `after/01-exterior-front-hero.png` | `after-crop/01-exterior-front-hero-canvas.png` | yes | no | no | no | no |
| `exteriorSideAngle` | `after/02-exterior-side-angle.png` | `after-crop/02-exterior-side-angle-canvas.png` | yes | no | no | no | no |
| `exteriorRearAngle` | `after/03-exterior-rear-angle.png` | `after-crop/03-exterior-rear-angle-canvas.png` | yes | no | no | no | no |
| `exteriorElevatedCutaway` | `after/04-exterior-elevated-cutaway.png` | `after-crop/04-exterior-elevated-cutaway-canvas.png` | yes | no | no | no | no |
| `interiorOverview` | `after/05-interior-overview.png` | `after-crop/05-interior-overview-canvas.png` | yes | yes | no | no | no |
| `interiorLiving` | `after/06-interior-living-zone.png` | `after-crop/06-interior-living-zone-canvas.png` | yes | no | yes | yes | no |
| `interiorKitchen` | `after/07-interior-kitchen-zone.png` | `after-crop/07-interior-kitchen-zone-canvas.png` | yes | yes | no | no | no |
| `interiorSleepingBathroom` | `after/08-interior-sleeping-bathroom-zone.png` | `after-crop/08-interior-sleeping-bathroom-zone-canvas.png` | yes | yes | no | no | no |

Local result JSON:

- `ok: false`
- `overallQaVerdict: blocked`
- `summary.readableCount: 3`
- `summary.technicalCount: 8`
- `summary.totalShots: 8`

Staging result JSON:

- `ok: false`
- `overallQaVerdict: blocked`
- `summary.readableCount: 0`
- `summary.technicalCount: 8`
- `summary.totalShots: 8`
- `fixedPresetApplied: false` for all shots because staging is still on the older QA hook.

No browser profiles, storage-state files, cookies, tokens, or auth artifacts are part of the visual evidence ZIP.

## Distance-Only Camera Repair Evidence Set

Local evidence location: `C:\qa\visual-evidence\20260622-132103-fixed-camera-distance-local`

Harness: `scripts/qa-3d-runtime-playwright.mjs --base-url=http://127.0.0.1:9231 --shot-set=modular-home-fixed-camera-distance`

Result JSON:

- `ok: false`
- `overallQaVerdict: blocked`
- `summary.readableCount: 4`
- `summary.technicalCount: 8`
- `summary.totalShots: 8`
- `summary.distanceOnlyCount: 8`

Evidence file groups:

- `before/*.png`
- `after/*.png`
- `after-crop/*.png`
- `qa-3d-runtime-result.json`
- `visual-evidence-manifest.json`

The distance-adjusted pass kept the same lookAt targets, widened FOV from `50` to `58`, and stepped back each camera by the configured multiplier. The crop was centered so the product crop no longer preserves the side UI rail.

| shot | after | after-crop | distance before | distance after | targetChanged | geometryChanged | humanReadableFrame | productVisualAccepted |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `exteriorFrontHero` | `after/01-exterior-front-hero.png` | `after-crop/01-exterior-front-hero-canvas.png` | `95.1315` | `171.0731` | false | false | no | false |
| `exteriorSideAngle` | `after/02-exterior-side-angle.png` | `after-crop/02-exterior-side-angle-canvas.png` | `75.8288` | `136.2865` | false | false | no | false |
| `exteriorRearAngle` | `after/03-exterior-rear-angle.png` | `after-crop/03-exterior-rear-angle-canvas.png` | `95.1315` | `171.0731` | false | false | no | false |
| `exteriorElevatedCutaway` | `after/04-exterior-elevated-cutaway.png` | `after-crop/04-exterior-elevated-cutaway-canvas.png` | `114.1271` | `205.2925` | false | false | no | false |
| `interiorOverview` | `after/05-interior-overview.png` | `after-crop/05-interior-overview-canvas.png` | `45.1774` | `65.3725` | false | false | yes | false |
| `interiorLiving` | `after/06-interior-living-zone.png` | `after-crop/06-interior-living-zone-canvas.png` | `27.8029` | `43.0293` | false | false | yes | false |
| `interiorKitchen` | `after/07-interior-kitchen-zone.png` | `after-crop/07-interior-kitchen-zone-canvas.png` | `28.7228` | `44.4573` | false | false | yes | false |
| `interiorSleepingBathroom` | `after/08-interior-sleeping-bathroom-zone.png` | `after-crop/08-interior-sleeping-bathroom-zone-canvas.png` | `20.0998` | `31.0644` | false | false | yes | false |

The visual evidence confirms the earlier read: the fixed cameras are technically sound, but the scene still only yields 4/8 readable shots under the current checklist.

## Rollback Evidence Set

Local evidence location: `C:\qa\visual-evidence\20260622-150025-rollback-to-fixed-camera-distance-local`

Harness: `scripts/qa-3d-runtime-playwright.mjs --base-url=http://127.0.0.1:9231 --shot-set=modular-home-fixed-camera-distance`

Result JSON:

- `ok: false`
- `overallQaVerdict: blocked`
- `summary.humanReadableCount: 4`
- `summary.technicalCount: 8`
- `summary.totalShots: 8`
- `summary.distanceOnlyCount: 8`

Evidence file groups:

- `before/*.png`
- `after/*.png`
- `after-crop/*.png`
- `qa-3d-runtime-result.json`
- `visual-evidence-manifest.json`

The rollback restored the prior fixed-camera-distance baseline. The pass kept the same lookAt targets, kept the same fixed FOV path (`50` to `58`), and preserved `targetChanged=false`, `geometryChanged=false`, and `productVisualAccepted=false` for every shot.

| shot | after | after-crop | distance before | distance after | multiplier | readable |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| `exteriorFrontHero` | `after/01-exterior-front-hero.png` | `after-crop/01-exterior-front-hero-canvas.png` | `95.1315` | `171.0731` | `1.8` | no |
| `exteriorSideAngle` | `after/02-exterior-side-angle.png` | `after-crop/02-exterior-side-angle-canvas.png` | `75.8288` | `136.2865` | `1.8` | no |
| `exteriorRearAngle` | `after/03-exterior-rear-angle.png` | `after-crop/03-exterior-rear-angle-canvas.png` | `95.1315` | `171.0731` | `1.8` | no |
| `exteriorElevatedCutaway` | `after/04-exterior-elevated-cutaway.png` | `after-crop/04-exterior-elevated-cutaway-canvas.png` | `114.1271` | `205.2925` | `1.8` | no |
| `interiorOverview` | `after/05-interior-overview.png` | `after-crop/05-interior-overview-canvas.png` | `45.1774` | `65.3725` | `1.45` | yes |
| `interiorLiving` | `after/06-interior-living-zone.png` | `after-crop/06-interior-living-zone-canvas.png` | `27.8029` | `43.0293` | `1.55` | yes |
| `interiorKitchen` | `after/07-interior-kitchen-zone.png` | `after-crop/07-interior-kitchen-zone-canvas.png` | `28.7228` | `44.4573` | `1.55` | yes |
| `interiorSleepingBathroom` | `after/08-interior-sleeping-bathroom-zone.png` | `after-crop/08-interior-sleeping-bathroom-zone-canvas.png` | `20.0998` | `31.0644` | `1.55` | yes |

The rollback did not change geometry or product content. It only returned the cameras to the restored fixed-camera-distance baseline.

## Interior-Only Pullback Evidence Set

Local evidence location: `C:\qa\visual-evidence\20260622-151953-interior-only-pullback-local`

Harness: `scripts/qa-3d-runtime-playwright.mjs --base-url=http://127.0.0.1:9231 --shot-set=modular-home-interior-only-pullback`

Result JSON:

- `ok: false`
- `overallQaVerdict: blocked`
- `summary.humanReadableCount: 4`
- `summary.technicalCount: 8`
- `summary.totalShots: 8`
- `summary.lockedExteriorCount: 4`
- `summary.interiorAdjustedCount: 4`

Evidence file groups:

- `before/*.png`
- `after/*.png`
- `after-crop/*.png`
- `qa-3d-runtime-result.json`
- `visual-evidence-manifest.json`

The exterior four shots are locked and unchanged. The interior four shots use the same targets and FOV but are pulled back slightly with a distance multiplier of `1.08`.

| shot | after | after-crop | distance before | distance after | distanceMultiplier | cameraChanged | readable |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: |
| `exteriorFrontHero` | `after/01-exterior-front-hero.png` | `after-crop/01-exterior-front-hero-canvas.png` | `171.0731` | `171.0731` | null | false | no |
| `exteriorSideAngle` | `after/02-exterior-side-angle.png` | `after-crop/02-exterior-side-angle-canvas.png` | `136.2865` | `136.2865` | null | false | no |
| `exteriorRearAngle` | `after/03-exterior-rear-angle.png` | `after-crop/03-exterior-rear-angle-canvas.png` | `171.0731` | `171.0731` | null | false | no |
| `exteriorElevatedCutaway` | `after/04-exterior-elevated-cutaway.png` | `after-crop/04-exterior-elevated-cutaway-canvas.png` | `205.2925` | `205.2925` | null | false | no |
| `interiorOverview` | `after/05-interior-overview.png` | `after-crop/05-interior-overview-canvas.png` | `65.3725` | `70.5834` | `1.08` | true | yes |
| `interiorLiving` | `after/06-interior-living-zone.png` | `after-crop/06-interior-living-zone-canvas.png` | `43.0293` | `46.4645` | `1.08` | true | yes |
| `interiorKitchen` | `after/07-interior-kitchen-zone.png` | `after-crop/07-interior-kitchen-zone-canvas.png` | `44.4573` | `48.0070` | `1.08` | true | yes |
| `interiorSleepingBathroom` | `after/08-interior-sleeping-bathroom-zone.png` | `after-crop/08-interior-sleeping-bathroom-zone-canvas.png` | `31.0644` | `33.5397` | `1.08` | true | yes |

Human review is required to decide whether the interior views are now less zoomed and whether the exterior baseline stayed acceptable.

## GALA Opening Void Fix Only Evidence Set

Local evidence location: `C:\qa\visual-evidence\20260623-201658-gala-opening-void-fix-local`

Opening harness:

```bash
node scripts/qa-gala-opening-voids.mjs --base-url=http://127.0.0.1:9231 --phase=before --out-dir=C:\qa\visual-evidence\20260623-201658-gala-opening-void-fix-local
node scripts/qa-gala-opening-voids.mjs --base-url=http://127.0.0.1:9231 --phase=after --out-dir=C:\qa\visual-evidence\20260623-201658-gala-opening-void-fix-local
```

Required close-up files:

- `before/openings/entry-door-closeup.png`
- `before/openings/living-window-closeup.png`
- `before/openings/kitchen-window-closeup.png`
- `before/openings/bedroom-doorway-closeup.png`
- `before/openings/bathroom-doorway-closeup.png`
- `before/openings/bedroom-window-closeup.png`
- `after/openings/entry-door-closeup.png`
- `after/openings/living-window-closeup.png`
- `after/openings/kitchen-window-closeup.png`
- `after/openings/bedroom-doorway-closeup.png`
- `after/openings/bathroom-doorway-closeup.png`
- `after/openings/bedroom-window-closeup.png`

Debug files:

- `debug/opening-assembly-cross-section.png`
- `debug/opening-void-redline-before-after.png`
- `debug/window-frame-seal-test.png`
- `debug/door-frame-seal-test.png`

JSON files:

- `qa-opening-void-result.json`
- `qa-real-user-walk-result.json`
- `visual-evidence-manifest.json`

Result summary:

- `repairScope=opening-void-fix-only`
- `entryDoorVoidFixed=true`
- `livingWindowVoidFixed=true`
- `kitchenWindowVoidFixed=true`
- `bedroomDoorwayVoidFixed=true`
- `bathroomDoorwayVoidFixed=true`
- `bedroomWindowVoidFixed=true`
- `transparentDoorSlabsInWalkMode=false`
- `closedDoorsAreNotPassThrough=true`
- `passableDoorwaysLookOpen=true`
- `productVisualAccepted=false`

Visual ZIP contents are constrained to `before/openings/*.png`, `after/openings/*.png`, `debug/*.png`, `qa-real-user-walk-result.json`, `qa-opening-void-result.json`, and `visual-evidence-manifest.json`. Raw screenshots, manual-repro screenshots, browser profiles, storage-state, cookies, tokens, `.env`, JWTs, service-role keys, auth artifacts, and customer PII are excluded.

## GALA Opening Void Fix Staging Evidence Set

Staging evidence location: `C:\qa\visual-evidence\20260625-110946-gala-opening-void-fix-staging`

Staging opening close-up command:

```bash
node scripts/qa-gala-opening-voids.mjs --base-url=https://staging.30sek24.com --out-dir=C:\qa\visual-evidence\20260625-110946-gala-opening-void-fix-staging
```

For package comparison, `before/openings/*.png` was copied from the accepted local pre-fix close-up baseline, and `after/openings/*.png` was captured from `https://staging.30sek24.com` after promotion.

Required close-up files:

- `before/openings/entry-door-closeup.png`
- `before/openings/living-window-closeup.png`
- `before/openings/kitchen-window-closeup.png`
- `before/openings/bedroom-doorway-closeup.png`
- `before/openings/bathroom-doorway-closeup.png`
- `before/openings/bedroom-window-closeup.png`
- `after/openings/entry-door-closeup.png`
- `after/openings/living-window-closeup.png`
- `after/openings/kitchen-window-closeup.png`
- `after/openings/bedroom-doorway-closeup.png`
- `after/openings/bathroom-doorway-closeup.png`
- `after/openings/bedroom-window-closeup.png`

Staging real-user physics evidence: `C:\qa\visual-evidence\20260625-111323-gala-real-user-physics-after-opening-fix-staging`

Secondary staging 8-shot evidence: `C:\qa\visual-evidence\20260625-111539-gala-opening-void-8shot-staging`

Staging results:

- opening close-up evidence passed with `repairScope=opening-void-fix-only`.
- real-user physics passed with `qa3d=false`, `realUserMode=true`, `wallCollisionPass=true`, `walkSpeedPass=true`, `doorTraversalPass=true`, `canWalkThroughWalls=false`.
- secondary 8-shot passed with `ok=true`, `overallQaVerdict=human-review-ready`, and `8/8` technical screenshots.
- `productVisualAccepted=false`.

Visual ZIP contents are constrained to `before/openings/*.png`, `after/openings/*.png`, `debug/*.png`, `qa-real-user-walk-result.json`, `qa-opening-void-result.json`, and `visual-evidence-manifest.json`. Browser profiles, storage-state, cookies, tokens, `.env`, JWTs, service-role keys, auth artifacts, raw opening captures, manual repro screenshots, and customer PII are excluded.

## GALA Openable Doors and Sealed Windows Local Evidence Set

Local evidence location: `C:\qa\visual-evidence\20260625-115752-gala-openable-doors-sealed-windows-local`

Commands:

```bash
node scripts/qa-gala-opening-voids.mjs --base-url=https://staging.30sek24.com --phase=before --out-dir=C:\qa\visual-evidence\20260625-115752-gala-openable-doors-sealed-windows-local
node scripts/qa-gala-opening-voids.mjs --base-url=http://127.0.0.1:9231 --phase=after --out-dir=C:\qa\visual-evidence\20260625-115752-gala-openable-doors-sealed-windows-local
node scripts/qa-gala-real-user-walk-physics.mjs --base-url=http://127.0.0.1:9231 --out-dir=C:\qa\visual-evidence\20260625-115752-gala-door-physics-local
node scripts/qa-3d-runtime-playwright.mjs --base-url=http://127.0.0.1:9231 --shot-set=modular-home-visual-readability --out-dir=C:\qa\visual-evidence\20260625-115752-gala-openable-doors-8shot-local
```

Before close-ups:

- `before/openings/entry-door-closed-see-through.png`
- `before/openings/window-void-closeup.png`
- `before/openings/facade-seams-cross-opening.png`

After close-ups:

- `after/openings/entry-door-closed-blocks.png`
- `after/openings/entry-door-open-passable.png`
- `after/openings/bedroom-door-closed-blocks.png`
- `after/openings/bedroom-door-open-passable.png`
- `after/openings/bathroom-door-closed-blocks.png`
- `after/openings/bathroom-door-open-passable.png`
- `after/openings/living-window-sealed.png`
- `after/openings/kitchen-window-sealed.png`
- `after/openings/bedroom-window-sealed.png`
- `after/openings/facade-seams-clipped-around-entry-door.png`
- `after/openings/facade-seams-clipped-around-window.png`

Debug evidence:

- `debug/door-state-collision-test.png`
- `debug/opening-frame-cross-section.png`
- `debug/facade-seam-clearance-test.png`
- `debug/window-glass-not-void-test.png`

JSON files:

- `qa-opening-void-result.json`
- `qa-real-user-walk-result.json`
- `visual-evidence-manifest.json`

Result summary:

- `repairScope=openable-doors-sealed-windows-clipped-facade-seams`
- `doorsAreOpenable=true`
- `closedDoorsBlockPlayer=true`
- `openDoorsArePassable=true`
- `transparentDoorSlabsInWalkMode=false`
- `windowsAreSealed=true`
- `windowsDoNotReadAsVoid=true`
- `facadeSeamsDoNotCrossOpenings=true`
- `facadeSeamsAreGroovesNotBattens=true`
- `productVisualAccepted=false`

Secondary 8-shot evidence at `C:\qa\visual-evidence\20260625-115752-gala-openable-doors-8shot-local` returned `ok=true`, `overallQaVerdict=human-review-ready`, and `8/8` technical screenshots.

Visual ZIP contents are constrained to `before/openings/*.png`, `after/openings/*.png`, `debug/*.png`, `qa-real-user-walk-result.json`, `qa-opening-void-result.json`, and `visual-evidence-manifest.json`. Raw screenshots, browser profiles, storage-state, cookies, tokens, `.env`, JWTs, service-role keys, auth artifacts, and customer PII are excluded.

## GALA Openable Doors / Sealed Windows Staging Evidence Set

Staging opening evidence location: `C:\qa\visual-evidence\20260625-131606-gala-openable-doors-sealed-windows-staging`

Commands:

```bash
node scripts/qa-gala-opening-voids.mjs --base-url=https://staging.30sek24.com --out-dir=C:\qa\visual-evidence\20260625-131606-gala-openable-doors-sealed-windows-staging
node scripts/qa-gala-real-user-walk-physics.mjs --base-url=https://staging.30sek24.com --out-dir=C:\qa\visual-evidence\20260625-131606-gala-door-physics-after-openable-doors-staging
node scripts/qa-3d-runtime-playwright.mjs --base-url=https://staging.30sek24.com --shot-set=modular-home-visual-readability --out-dir=C:\qa\visual-evidence\20260625-131606-gala-openable-doors-8shot-staging
```

For before/after package comparison, `before/openings/*.png` was copied from the accepted local pre-fix close-up evidence. `after/openings/*.png` was captured from `https://staging.30sek24.com` after promotion.

After close-ups:

- `after/openings/entry-door-closed-blocks.png`
- `after/openings/entry-door-open-passable.png`
- `after/openings/bedroom-door-closed-blocks.png`
- `after/openings/bedroom-door-open-passable.png`
- `after/openings/bathroom-door-closed-blocks.png`
- `after/openings/bathroom-door-open-passable.png`
- `after/openings/living-window-sealed.png`
- `after/openings/kitchen-window-sealed.png`
- `after/openings/bedroom-window-sealed.png`
- `after/openings/facade-seams-clipped-around-entry-door.png`
- `after/openings/facade-seams-clipped-around-window.png`

Staging result summary:

- `entryDoorClosedBlocks=true`
- `entryDoorOpenPasses=true`
- `bedroomDoorClosedBlocks=true`
- `bedroomDoorOpenPasses=true`
- `bathroomDoorClosedBlocks=true`
- `bathroomDoorOpenPasses=true`
- `windowsDoNotReadAsVoid=true`
- `facadeSeamsDoNotCrossOpenings=true`
- `facadeSeamsAreGroovesNotBattens=true`
- `productVisualAccepted=false`

Real-user physics evidence at `C:\qa\visual-evidence\20260625-131606-gala-door-physics-after-openable-doors-staging` returned `pass=true`, `walkSpeedPass=true`, `wallCollisionPass=true`, and `doorTraversalPass=true`.

Secondary 8-shot evidence at `C:\qa\visual-evidence\20260625-131606-gala-openable-doors-8shot-staging` returned `ok=true`, `overallQaVerdict=human-review-ready`, `8/8` technical screenshots, and `8/8` readable by harness checklist.

Visual ZIP contents are constrained to `before/openings/*.png`, `after/openings/*.png`, `debug/*.png`, `qa-real-user-walk-result.json`, `qa-opening-void-result.json`, and `visual-evidence-manifest.json`. Secondary 8-shot ZIP contents are constrained to `after/*.png`, `after-crop/*.png`, `qa-3d-runtime-result.json`, and `visual-evidence-manifest.json`. Browser profiles, storage-state, cookies, tokens, `.env`, JWTs, service-role keys, auth artifacts, raw opening captures, manual repro screenshots, and customer PII are excluded.

## GALA Construction Renderer Reset Local Evidence Set

Local evidence location: `C:\qa\visual-evidence\20260625-181252-gala-construction-renderer-reset-local`

Commands:

```bash
node scripts/qa-gala-construction-renderer.mjs --base-url=http://127.0.0.1:5173 --out-dir=C:\qa\visual-evidence\20260625-181252-gala-construction-renderer-reset-local
node scripts/qa-gala-opening-voids.mjs --base-url=http://127.0.0.1:5173 --out-dir=C:\qa\visual-evidence\20260625-181252-gala-opening-regression-after-construction-renderer-local
node scripts/qa-gala-real-user-walk-physics.mjs --base-url=http://127.0.0.1:5173 --out-dir=C:\qa\visual-evidence\20260625-181252-gala-physics-regression-after-construction-renderer-local
node scripts/qa-3d-runtime-playwright.mjs --base-url=http://127.0.0.1:5173 --shot-set=modular-home-visual-readability --out-dir=C:\qa\visual-evidence\20260625-181252-gala-construction-renderer-8shot-local
```

Primary after screenshots:

- `after/manual-repro/exterior-front-readable.png`
- `after/manual-repro/exterior-side-cladding-readable.png`
- `after/manual-repro/exterior-eaves-cladding-readable.png`
- `after/manual-repro/interior-entry-looking-to-living.png`
- `after/manual-repro/interior-bedroom-door-frame-sealed.png`
- `after/manual-repro/interior-bathroom-door-frame-sealed.png`
- `after/manual-repro/interior-ceiling-trim-continuous.png`
- `after/manual-repro/interior-floor-stable-near.png`
- `after/manual-repro/interior-floor-stable-far.png`
- `after/manual-repro/bedroom-layout-readable.png`
- `after/manual-repro/bathroom-layout-readable.png`

Debug evidence:

- `debug/runtime-mesh-inventory.json`
- `debug/wall-assembly-inventory.json`
- `debug/opening-assembly-inventory.json`
- `debug/floor-ceiling-stack.json`
- `debug/room-trim-continuity.json`
- `debug/facade-cladding-continuity.json`
- `debug/furniture-layout-audit.json`
- `debug/topdown-floorplan-with-furniture.png`
- `debug/wall-assembly-closeup.png`
- `debug/opening-assembly-closeup.png`
- `debug/cladding-assembly-closeup.png`

Regression JSON:

- `qa-gala-construction-renderer-result.json`
- `qa-opening-void-result.json`
- `qa-real-user-walk-result.json`
- `qa-3d-runtime-result.json`
- `visual-evidence-manifest.json`

Secondary 8-shot captures were copied under `secondary-8shot/` in the main evidence folder.

Result summary:

- `runtimeMeshInventoryIsActualSceneTraverse=true`
- `fragmentedPrimitivePatchLoopStopped=true`
- `singleConstructionModelCreated=true`
- `openableDoorsStillPass=true`
- `windowsStillSealed=true`
- `realUserPhysicsStillPasses=true`
- `secondary8ShotStillPasses=true`
- `stagingDeployPerformed=false`
- `productVisualAccepted=false`

Visual ZIP contents are constrained to `before/manual-repro/*.png`, `after/manual-repro/*.png`, `debug/*.png`, `debug/*.json`, `secondary-8shot/*.png`, `qa-gala-construction-renderer-result.json`, `qa-opening-void-result.json`, `qa-real-user-walk-result.json`, `qa-3d-runtime-result.json`, and `visual-evidence-manifest.json`. Browser profiles, storage-state, cookies, tokens, `.env`, JWTs, service-role keys, auth artifacts, raw private captures, and customer PII are excluded.
