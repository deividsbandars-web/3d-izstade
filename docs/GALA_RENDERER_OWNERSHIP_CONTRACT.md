# GALA Renderer Ownership Contract

Generated for the renderer ownership remediation phase after the full architecture audit.

This contract applies to the real-user modular-home studio routes:

- `/modular-homes/studio?view=exterior&homeStudio=1`
- `/modular-homes/studio?view=interior&homeStudio=1`

`productVisualAccepted=false`. This document does not claim the renderer is single-source. The current renderer is ownership-contracted with documented adapters.

## Active Render Tree

`ExpoWorldSceneLayers.tsx` mounts `ModularHomeModel`.

`ModularHomeModel.tsx` gates the legacy module preview off with `renderLegacyModulePreview=false` and mounts `GalaHouseShell` for the active GALA model.

`GalaHouseShell.tsx` owns only the world transform, studio view-mode cutaway flag, and lighting wrapper. It must not mount independent house geometry except through `GalaConstructionRenderer`.

`GalaConstructionRenderer.tsx` is the active construction render coordinator. It mounts the documented roof adapter and the owned floor, wall, opening, cladding, terrace, and room assemblies.

## Owner Matrix

| Responsibility | Authoritative owner | Current status | Allowed consumers | Forbidden duplicate ownership |
| --- | --- | --- | --- | --- |
| Geometry dimensions | `GalaHouseDimensions.ts` | current | `GalaConstructionModel.ts`, `GalaRoof.tsx`, physics adapters | Ad hoc house length, width, roof rise, wall height, or preview scale constants inside render assemblies |
| Normalized construction model | `construction/GalaConstructionModel.ts` | adapter | Construction assemblies, ownership QA | Claiming this is a full single-source renderer while route state, physics, DOM overlays, and roof adapter remain external |
| Exterior wall and partition segments | `construction/GalaConstructionModel.ts` | current adapter data | `GalaWallAssembly.tsx`, `GalaFloorCeilingAssembly.tsx`, QA scripts | Silent wall or partition coordinate redefinition in wall, ceiling, opening, or furniture components |
| Openings | `GalaHouseDimensions.ts` for schedule source, normalized by `GalaConstructionModel.ts` | current adapter data | `GalaWallAssembly.tsx`, `GalaOpeningAssembly.tsx`, trim interruption generation | Hardcoded door/window widths, starts, or ids in floor/ceiling/wall assemblies outside the normalized construction openings |
| Door/window visual assembly | `construction/GalaOpeningAssembly.tsx` | current | Door runtime state, wall assembly | Independent frame/reveal/slab fragments in legacy `GalaOpenings.tsx` or `GalaInterior.tsx` must not be mounted in current route |
| Door state and interaction | `GalaDoorState.ts` plus `ExpoWorldPlayerLayer.tsx` for prompt/collision use | current runtime owner | `GalaOpeningAssembly.tsx`, player layer, QA scripts | Closed/open passability rules duplicated in visual components without using the runtime state |
| Furniture anchors and placement | `construction/GalaConstructionModel.ts` (`GALA_FURNITURE_ANCHORS`, `GALA_FURNITURE_LAYOUT`) | current adapter data | `GalaRoomAssembly.tsx`, QA scripts | Hardcoded furniture placement coordinates in `GalaRoomAssembly.tsx` or legacy furniture components mounted in current route |
| Furniture visual primitives | `construction/GalaRoomAssembly.tsx` | current consumer/renderer | Construction model placement and visual config | Owning placement coordinates or independent room layout rules |
| Roof geometry | `GalaRoof.tsx` mounted only through `GalaConstructionRenderer.tsx` | adapter | `GalaConstructionRenderer.tsx` | Mounting `GalaRoof` directly from `GalaHouseShell.tsx` or another parallel render path |
| Wall core/faces/trim | `construction/GalaWallAssembly.tsx` | current | `GalaConstructionModel.ts` walls and openings | Legacy interior/exterior wall assemblies mounted in active route |
| Exterior cladding | `construction/GalaCladdingAssembly.tsx` plus gable cladding inside `GalaConstructionRenderer.tsx` | current | `GalaWallAssembly.tsx`, visual config | Painted-line facade seams or independent cladding in legacy module preview path mounted in current route |
| Floor/ceiling/room trims | `construction/GalaFloorCeilingAssembly.tsx` | current | `GalaConstructionModel.ts` rooms and openings | Door trim interruption constants in the ceiling assembly; trim fragments in unrelated components mounted in current route |
| DOM/Html overlays | `ModularHomeModel.tsx` for the legacy floating demo label, with `shouldShowFloatingHomeDemoModelLabel(homeStudioEnabled)` gate; route DOM panels own their own UI | current gated owner | DOM overlay QA | Un-gated Drei `Html` labels in `homeStudio=1` real-user routes |
| Physics/collision | `GalaFloorplan.ts` data and `ExpoWorldPlayerLayer.tsx` runtime | current runtime owner | Door state runtime, real-user physics QA | Geometry renderer claiming collision pass without empirical real-user walk test |
| QA/evidence | `scripts/qa-gala-dom-overlay-audit.mjs`, `scripts/qa-gala-renderer-ownership-audit.mjs`, and targeted runtime scripts | current | Evidence folders and reports | Screenshot existence, mesh count, or self-reported flags standing in for DOM, ownership, collision, or human visual acceptance |

## Current vs Adapter vs Legacy

Current active render owners:

- `GalaHouseShell.tsx`
- `construction/GalaConstructionRenderer.tsx`
- `construction/GalaConstructionModel.ts`
- `construction/GalaWallAssembly.tsx`
- `construction/GalaOpeningAssembly.tsx`
- `construction/GalaFloorCeilingAssembly.tsx`
- `construction/GalaCladdingAssembly.tsx`
- `construction/GalaRoomAssembly.tsx`
- `GalaRoof.tsx` as a documented roof adapter mounted under the construction renderer

Current runtime owners:

- `GalaDoorState.ts`
- `GalaFloorplan.ts`
- `ExpoWorldPlayerLayer.tsx`

Legacy or inactive in the current route:

- `GalaInterior.tsx`
- `GalaInteriorConstruction.tsx`
- `GalaInteriorFurniture.tsx`
- `GalaOpenings.tsx`
- `GalaCeiling.tsx`
- legacy module preview helpers inside `ModularHomeModel.tsx` behind `renderLegacyModulePreview=false`

These legacy files may remain in the repository, but they must not be mounted in the current `homeStudio=1` route unless this contract is updated.

## Single-Source Assessment

`GALA_CONSTRUCTION_MODEL` is an adapter, not a proven single source of truth. It normalizes dimensions, construction walls, normalized openings, room zones, and furniture placement for the construction renderer. The route still has separate documented owners for:

- DOM overlays;
- real-user physics/collision;
- door runtime state;
- roof adapter rendering;
- QA/evidence.

Therefore `singleSourceRendererProven=false`.

## Duplicate Ownership Rules

- Openings resolve through `GALA_OPENING_SCHEDULE` into `GALA_CONSTRUCTION_WALLS` and `GALA_CONSTRUCTION_MODEL.openings`.
- Construction assemblies may consume normalized openings but must not redefine `D-ENTRY`, `D-TERRACE`, `D-BEDROOM`, `D-BATHROOM`, or window dimensions locally.
- Furniture placement resolves through `GALA_FURNITURE_LAYOUT`. `GalaRoomAssembly.tsx` may render furniture primitives, but it must not own primary placement coordinates.
- `GalaRoof` may render roof primitives only as the roof adapter mounted under `GalaConstructionRenderer`.
- Mesh traversal QA is not visual safety. DOM overlay QA is required for every construction renderer evidence run that claims central scene visibility.

## Remaining Blockers

- The product is not visually accepted.
- The renderer is ownership-contracted, not single-source.
- Broader QA false-positive risk remains outside the ownership and DOM overlay checks.
- Manual visual acceptance still requires later remediation and review.
