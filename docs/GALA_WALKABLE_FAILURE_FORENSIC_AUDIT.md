# GALA Walkable Geometry Failure Forensic Audit

Date: 2026-06-23

Scope: forensic audit only. No model, camera, physics, collision, UI, QA semantics, route, backend, quote, or staging promotion changes were made.

`productVisualAccepted` remains `false`.

## Follow-Up Fix Status

The follow-up fix task now addresses the audit root cause with a real-user non-`qa3d` harness instead of relying on the old 8-shot QA path.

Evidence:

- local evidence: `C:\qa\visual-evidence\20260623-123000-gala-real-user-physics-fix-local`
- new harness: `scripts/qa-gala-real-user-walk-physics.mjs`
- result JSON: `qa-real-user-walk-result.json`

The new harness reproduced the manual failures before the fix:

- `wallCollisionPass=false`
- `walkSpeedPass=false`
- `doorTraversalPass=false`
- `floorVisualPass=false`
- `openingGapPass=false`

The same real-user non-`qa3d` harness passed after the fix:

- `realUserMode=true`
- `qa3d=false`
- `realUserModeUsesGalaPhysics=true`
- `realUserAndTestedPhysicsPathAligned=true`
- `walkSpeedPass=true`
- `wallCollisionPass=true`
- `doorTraversalPass=true`
- `floorVisualPass=true`
- `openingGapPass=true`
- `eyeHeightVisualPass=true`
- `canWalkThroughWalls=false`

This follow-up does not treat static `geometrySanity` flags as proof. Walk speed, wall collision, door traversal, floor/overlay state, opening gaps, and eye height are now measured or visually captured in the real-user route. `productVisualAccepted` remains `false`.

Audited staging state:

- Exterior route: `https://staging.30sek24.com/modular-homes/studio?view=exterior&homeStudio=1`
- Interior route: `https://staging.30sek24.com/modular-homes/studio?view=interior&homeStudio=1`
- Rejected handoff: `20260623-111046-gala-walkable-geometry-physics-staging`
- Audit evidence: `C:\qa\visual-evidence\20260623-115905-gala-walkable-failure-forensic-audit`

## 1. Executive Summary

The previous staging handoff claimed `overallQaVerdict=human-review-ready`, but manual staging walk-through still failed because the QA harness did not prove the real walkable experience.

Primary finding:

```text
Does qa3d mode exercise the same movement/collision path as real staging user?
NO
```

`scripts/qa-3d-runtime-playwright.mjs` forces `qa3d=1` for the 8-shot visual harness. The real GALA showroom physics path in `ExpoWorldPlayerLayer.tsx` is enabled only when `homeStudioEnabled && !isExpo3dQaEnabled()`. Therefore the accepted staging evidence did not exercise the same movement, collision, height, and real-user runtime path that manual users exercise.

The previous JSON also trusted self-reported `geometrySanity` flags. Many of those flags are constants or runtime assertions, not empirical tests. Examples include `canWalkThroughWalls:false`, `floorZFightingFixed:true`, `doorOpeningsPassable:true`, and `openingFramesCoverWallGaps:true`.

Audit movement probes in the real staging user path show invalid behavior:

| probe | duration | moved approx | result |
| --- | ---: | ---: | --- |
| `KeyW` | `6000ms` | `3.82m` | final position inside a north exterior wall collision AABB |
| `KeyA` | `8000ms` | `8.24m` | final position outside the house envelope |
| `KeyD` | `8000ms` | `4.97m` | final position inside north/west exterior wall collision AABBs |
| `KeyS` | `6000ms` | `3.37m` | final position inside a south exterior wall collision AABB |

This means the `canWalkThroughWalls=false` claim is a false positive for product-readiness purposes.

## 2. What User Reported

Human review reported:

- floor still glitches and renders as transparent overlapping layers;
- floor strips/layers look airborne or at the wrong Y level;
- furniture appears airborne or detached from the floor relationship;
- door/window frames still show voids/gaps;
- eye height feels closer to 50cm than 1.65m;
- view against doors feels unrealistic;
- walk speed remains too fast;
- the user can still walk through walls;
- QA JSON says PASS while the staging product fails.

The audit evidence supports the core complaint: QA did not test the same path, and the self-reported flags are not proof.

## 3. What The Previous Agent Claimed

The rejected handoff claimed the following through the staging harness:

- `floorZFightingFixed=true`
- `singleFinishedFloorSurface=true`
- `noCoplanarTransparentFloorOverlay=true`
- `cameraEyeHeightMeters=1.65`
- `cameraHeightValid=true`
- `walkSpeedMps=1.35`
- `movementUsesDeltaTime=true`
- `maxFrameStepMeters=0.08`
- `noTeleportStep=true`
- `wallCollisionEnabled=true`
- `canWalkThroughWalls=false`
- `doorOpeningsPassable=true`
- `openingFramesCoverWallGaps=true`
- `noDoorWindowVoidGaps=true`
- `noOpeningZFighting=true`

Those values appeared in `qa-3d-runtime-result.json`, but most were not independently measured by the harness.

## 4. Claimed Vs Actual Audit

| Claim | Source of claim | How it was supposedly proven | Manual/audit evidence | Actual verdict |
| --- | --- | --- | --- | --- |
| `floorZFightingFixed=true` | `GalaFloorplan.ts:412`; `ExpoWorldPlayerLayer.tsx:943`; `GalaInterior.tsx:162` | static flag/userData and 8 screenshots | manual review still sees floor glitches; no material-depth scene graph test exists | FALSE POSITIVE / HARDCODED FLAG |
| `singleFinishedFloorSurface=true` | `GalaFloorplan.ts:425`; `GalaInterior.tsx:153` | static flag/userData | one floor slab may exist, but visible walk view still has transparent shell and airborne floor-related details | PARTIAL / NOT SUFFICIENT |
| `noCoplanarTransparentFloorOverlay=true` | `GalaFloorplan.ts:414` | static flag | interior mode intentionally makes shell/opening cells transparent; no full scene graph material dump was run | FALSE POSITIVE / NOT TESTED |
| `cameraEyeHeightMeters=1.65` | `GalaFloorplan.ts:406`; `ExpoWorldPlayerLayer.tsx:938` | config constant | real user player Y was `8.91`; QA mode player Y was `5`; visual door relationship still failed manual review | REAL CONSTANT, NOT PROOF |
| `cameraHeightValid=true` | `GalaFloorplan.ts:407` | static flag | no automated door-height comparison; manual view feels too low | FALSE POSITIVE / HARDCODED FLAG |
| `walkSpeedMps=1.35` | `GalaFloorplan.ts:427`; `ExpoWorldPlayerLayer.tsx:955` | config constant | real movement probe moved `8.24m` in `8s` and left the house envelope | REAL CONSTANT, NOT ACCEPTANCE |
| `movementUsesDeltaTime=true` | `GalaFloorplan.ts:413`; movement code uses `stableDelta` | source inspection only | old QA never held movement keys in real-user mode | REAL IN CODE / NOT TESTED BY OLD QA |
| `maxFrameStepMeters=0.08` | `GalaFloorplan.ts:411`; `ExpoWorldPlayerLayer.tsx:589`, `603` | source inspection only | old QA did not measure per-frame movement; real movement still exits invalid zones | REAL IN CODE / NOT SUFFICIENT |
| `noTeleportStep=true` | `GalaFloorplan.ts:419` | static flag | no step-size audit was in the old harness | HARDCODED FLAG / NOT TESTED |
| `wallCollisionEnabled=true` | `GalaFloorplan.ts:426`; `ExpoWorldPlayerLayer.tsx:953` | static/runtime flag | real-user long-hold probes end inside wall AABBs or outside house envelope | FALSE POSITIVE |
| `canWalkThroughWalls=false` | `GalaFloorplan.ts:408`; `ExpoWorldPlayerLayer.tsx:941` | static/runtime flag | `KeyW`, `KeyD`, `KeyS` end in collision AABBs; `KeyA` leaves house envelope | FALSE POSITIVE |
| `doorOpeningsPassable=true` | `GalaFloorplan.ts:409` | static flag | no old door traversal test; only 8 fixed screenshots | HARDCODED FLAG / NOT TESTED |
| `openingFramesCoverWallGaps=true` | `GalaFloorplan.ts:421` | static flag | manual review still sees gaps/voids; close-up crops captured for audit | FALSE POSITIVE / NOT TESTED |
| `noDoorWindowVoidGaps=true` | `GalaFloorplan.ts:416` | static flag | manual review reports void gaps; no pixel/close-up pass/fail existed | FALSE POSITIVE / HARDCODED FLAG |
| `noOpeningZFighting=true` | `GalaFloorplan.ts:418` | static flag | no material overlap test; opening offsets are small but not empirically verified | FALSE POSITIVE / NOT TESTED |

## 5. Which Claims Are False-Positive

False-positive claims:

- `floorZFightingFixed=true`
- `noCoplanarTransparentFloorOverlay=true`
- `cameraHeightValid=true`
- `wallCollisionEnabled=true`
- `canWalkThroughWalls=false`
- `openingFramesCoverWallGaps=true`
- `noDoorWindowVoidGaps=true`
- `noOpeningZFighting=true`

These were either constants or runtime assertions. They were not proven by a real-user movement/collision/floor/opening test.

## 6. Which Claims Are Hardcoded Flags

Hardcoded or self-reported flags are defined in `src/modules/expo/runtime/modularHome/GalaFloorplan.ts:405-427` as `GALA_GEOMETRY_SANITY`.

The QA hook then merges those constants into the result:

- `src/modules/expo/runtime/world/scene/Expo3DQAHook.tsx:588-596`
- `src/modules/expo/runtime/world/scene/Expo3DQAHook.tsx:634`

The real-user runtime also writes debug flags in `src/modules/expo/runtime/world/scene/ExpoWorldPlayerLayer.tsx:937-955`, including `canWalkThroughWalls:false`, `floorZFightingFixed:true`, and `wallCollisionEnabled:true`.

This is a self-reported runtime flag, not proof.

## 7. Which Claims Were Never Tested In Real User Mode

The old staging 8-shot harness did not test:

- hold-W wall collision;
- side/back wall collision;
- door opening traversal;
- actual walking speed over time;
- actual frame-step distance;
- material transparency/depthWrite/renderOrder scene graph state;
- door/window gap close-ups;
- eye height against a 2.1m rendered door;
- start position against walls/furniture;
- user path without `qa3d=1`.

The audit script confirmed the path mismatch:

| mode | URL | QA hook | GALA runtime sanity object | player Y |
| --- | --- | ---: | ---: | ---: |
| real user | `/modular-homes/studio?view=interior&homeStudio=1` | false | true | `8.91` |
| QA mode | `/modular-homes/studio?view=interior&homeStudio=1&qa3d=1` | true | false | `5` |

The old harness explicitly adds QA mode at `scripts/qa-3d-runtime-playwright.mjs:364-366`. GALA showroom physics is gated behind non-QA mode at `ExpoWorldPlayerLayer.tsx:512`.

## 8. Root Causes Ranked

### P0: QA tested a different runtime path than the user

`qa3d=1` enables the QA hook and fixed camera workflow, but disables `useGalaShowroomPhysics`. The staging screenshots were valid as fixed camera screenshots, but they did not validate walk speed, eye height, wall collision, door traversal, or start position in the real user mode.

### P0: Geometry sanity flags were treated as empirical tests

`GALA_GEOMETRY_SANITY` contains values that read like measured assertions, but they are mostly static constants. The previous report used those flags as proof.

### P0: Collision was not verified by movement

The audit long-hold movement tests show invalid final positions:

- `KeyW`: inside `north-exterior-wall-right-of-terrace-door`
- `KeyA`: outside the house envelope
- `KeyD`: inside `north-exterior-wall-left-of-terrace-door` / `west-exterior-wall`
- `KeyS`: inside `south-exterior-wall-left-of-entry`

This invalidates `canWalkThroughWalls=false` as a product-readiness claim.

### P1: Transparent shell/opening geometry remains in user walk view

Interior mode sets transparent shell behavior:

- `GalaHouseShell.tsx:28-29` uses opacity `0.3` for transparent cutaway.
- `GalaHouseShell.tsx:210` enables transparent cutaway for `interior`.
- `GalaHouseShell.tsx:229-237` passes that transparent state to walls, gables, and roof.
- `GalaOpenings.tsx:100`, `157-159`, and `357-359` keep transparent wall cells/seams in this path.

The previous `noCoplanarTransparentFloorOverlay=true` flag did not test the full transparent scene graph.

### P1: Floor/furniture relationship is not visually validated

`GalaInterior.tsx` reports a stable single floor, but several nearby details are intentionally above the floor plane:

- thresholds at `GalaInterior.tsx:117` and `134` are centered at `Y=0.09`;
- living rug at `GalaInterior.tsx:212` has bottom above the floor;
- sofa at `GalaInterior.tsx:213` has bottom above the floor;
- bed base at `GalaInterior.tsx:235` has bottom above the floor.

Some of this can be valid object height, but the current QA did not verify visual floor contact or rule out floating-looking geometry.

### P1: Door/window gap checks are not empirical

Opening offsets exist:

- `GalaOpenings.tsx:28-30` defines `WALL_FACE_OFFSET`, `GLASS_OFFSET`, and `TRIM_DEPTH`.
- `GalaOpenings.tsx:184-192` derives frame/glass offsets.

But there is no real close-up pass/fail test that proves trim covers wall gaps, glass does not z-fight, or voids are absent.

### P2: Collision transform alignment is source-plausible but unproven

The collision transform uses GALA preview position, scale, and modular-home rotation. Source inspection suggests the formula may match the rendered parent/child transform path, but there is no overlay or rendered-wall-vs-collision-wall alignment test. This remains unproven, not cleared.

## 9. Evidence Screenshots And JSON

Audit evidence folder:

```text
C:\qa\visual-evidence\20260623-115905-gala-walkable-failure-forensic-audit
```

Packaged outputs:

- Source ZIP: `C:\qa\visual-evidence\20260623-115905-gala-walkable-failure-forensic-audit-source.zip`
- Visual/audit ZIP: `C:\qa\visual-evidence\20260623-115905-gala-walkable-failure-forensic-audit-visual.zip`

Key files:

- `qa-audit-result.json`
- `manual-repro/real-user-initial.png`
- `manual-repro/qa-mode-initial.png`
- `manual-repro/real-user-keyw-after-6000ms.png`
- `manual-repro/real-user-keya-after-8000ms.png`
- `manual-repro/real-user-keyd-after-8000ms.png`
- `manual-repro/real-user-keys-after-6000ms.png`
- `debug/qa-mode-vs-real-user-summary.png`
- `debug/entry-door-gap-closeup.png`
- `debug/window-gap-closeup.png`
- `debug/bathroom-door-gap-closeup.png`

The summary image notes the primary mismatch: QA mode and real-user mode do not test the same walk-physics path.

## 10. Exact Files And Lines Responsible

Primary mismatch:

- `scripts/qa-3d-runtime-playwright.mjs:364-366` forces `qa3d=1`.
- `src/modules/expo/runtime/world/scene/ExpoWorldPlayerLayer.tsx:512` enables GALA showroom physics only when `homeStudioEnabled && !isExpo3dQaEnabled()`.

Self-reported flags:

- `src/modules/expo/runtime/modularHome/GalaFloorplan.ts:405-427`
- `src/modules/expo/runtime/world/scene/Expo3DQAHook.tsx:588-596`
- `src/modules/expo/runtime/world/scene/Expo3DQAHook.tsx:634`
- `src/modules/expo/runtime/world/scene/ExpoWorldPlayerLayer.tsx:937-955`
- `src/modules/expo/runtime/world/scene/ExpoWorldPlayerLayer.tsx:1154-1155`

Movement and collision path:

- `src/modules/expo/runtime/world/scene/ExpoWorldPlayerLayer.tsx:568`
- `src/modules/expo/runtime/world/scene/ExpoWorldPlayerLayer.tsx:589`
- `src/modules/expo/runtime/world/scene/ExpoWorldPlayerLayer.tsx:603`
- `src/modules/expo/runtime/world/scene/ExpoWorldPlayerLayer.tsx:641`
- `src/modules/expo/runtime/world/scene/ExpoWorldPlayerLayer.tsx:932`

Transparent shell/opening path:

- `src/modules/expo/runtime/modularHome/GalaHouseShell.tsx:28-29`
- `src/modules/expo/runtime/modularHome/GalaHouseShell.tsx:210`
- `src/modules/expo/runtime/modularHome/GalaHouseShell.tsx:229-237`
- `src/modules/expo/runtime/modularHome/GalaOpenings.tsx:100`
- `src/modules/expo/runtime/modularHome/GalaOpenings.tsx:157-159`
- `src/modules/expo/runtime/modularHome/GalaOpenings.tsx:238-240`
- `src/modules/expo/runtime/modularHome/GalaOpenings.tsx:357-359`

Floor/contact relationship:

- `src/modules/expo/runtime/modularHome/GalaInterior.tsx:117`
- `src/modules/expo/runtime/modularHome/GalaInterior.tsx:134`
- `src/modules/expo/runtime/modularHome/GalaInterior.tsx:153`
- `src/modules/expo/runtime/modularHome/GalaInterior.tsx:162`
- `src/modules/expo/runtime/modularHome/GalaInterior.tsx:212-213`
- `src/modules/expo/runtime/modularHome/GalaInterior.tsx:235`

Opening offsets:

- `src/modules/expo/runtime/modularHome/GalaOpenings.tsx:28-30`
- `src/modules/expo/runtime/modularHome/GalaOpenings.tsx:184-192`

## 11. Recommended Next Fix Plan

Do not start by tuning cameras or adding more flags.

Recommended order:

1. Add a real-user non-`qa3d` walk QA script that does not enable the fixed-camera QA hook.
2. Add measured wall collision tests before making new physics changes.
3. Add measured door traversal tests for entry, bedroom, bathroom, and terrace openings.
4. Add an actual speed measurement test with key holds at 250ms, 500ms, 1000ms, and 2000ms.
5. Add a scene graph/material dump for floor, slab, deck, glass, shell, cutaway, overlay, and transparent objects.
6. Add close-up door/window gap screenshots with pass/fail criteria.
7. Add eye height verification against a rendered 2.1m door, not just `PLAYER_EYE_HEIGHT`.
8. Only then change runtime physics or geometry.

## 12. QA Requirements Before Any Future Fix

Required future tests:

- Real-user non-`qa3d` walk test.
- Hold-W wall collision test.
- Side/back wall collision tests.
- Door opening traversal test.
- Actual speed measurement test.
- Scene graph z-fighting/material audit.
- Door/window close-up audit.
- Eye height against 2.1m door test.
- Collision debug overlay comparing rendered wall bounds and collision wall bounds.

Until these are in place, `overallQaVerdict=human-review-ready` must not be treated as proof of walkable geometry.

## 13. Final Finding

The previous fix claimed success because the harness validated fixed-camera screenshot readability and accepted self-reported geometry flags. It did not validate the real staging user walk path. In real user mode, movement still reaches invalid wall/outside zones, the visual floor/opening defects remain visible to manual review, and the QA JSON is not trustworthy as proof.

No product fix was performed in this audit.
