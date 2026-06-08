# Compact Timber 40 Unreal POC Asset Plan

Status: asset production plan only. Pixel Streaming, Web runtime integration and backend session routing are not implemented in this round.

## Objective
Prepare one clear Unreal asset plan for the first premium walkthrough:

- Product: `compact-timber-40`
- Layout: `oneBedroom`
- Finish: `premium`
- Experience: high-fidelity exterior/interior walkthrough
- Contract input: `docs/modular-home-unreal-premium-visualizer-payload.schema.json`
- Primary example payload: `docs/modular-home-unreal-payload-compact-premium.example.json`

The first POC should prove that the Web configurator can drive a premium Unreal visualizer without replacing the existing Web3D Modular Home fallback.

## POC Boundaries
Included:
- authored Compact Timber 40 visual model;
- one-bedroom premium interior walkthrough;
- safe variant slots for facade, roof, terrace, windows, doors, finish and furniture;
- local Unreal review first;
- deterministic payload-to-variant mapping.

Not included:
- Pixel Streaming route;
- production deployment;
- autoscaling;
- real user uploads;
- AI conversion;
- final engineering/BIM output;
- quote/contact PII in Unreal.

## Unreal Content Root
Recommended root:

`/Game/Warpala/ModularHomes/CompactTimber40/`

Suggested folders:
- `Levels/`
- `Blueprints/`
- `Meshes/Exterior/`
- `Meshes/Interior/`
- `Meshes/Modules/`
- `Meshes/Furniture/`
- `Materials/`
- `Textures/`
- `Data/`
- `Lighting/`
- `Collision/`

## Model Structure
### Level
- `Level_ModularHome_CompactTimber40_POC`

Purpose:
- stable local POC level;
- contains shell, interior, lighting, collision and camera presets;
- can load a static example payload first before any Web integration.

### Root actor
- `BP_CT40_ModularHomeRoot`

Responsibilities:
- owns child component hierarchy;
- applies transform scale/origin consistently;
- exposes named attachment points for roof, terrace, windows, doors and furniture;
- provides debug metadata for selected variants.

### Variant manager
- `BP_CT40_VariantManager`

Responsibilities:
- reads trusted payload fields;
- validates supported tokens;
- maps tokens to static mesh visibility/material switches;
- emits non-PII warning list for unsupported variants;
- falls back to safe default actors/materials.

### Camera/pawn
- `BP_ModularHomeWalkthroughPawn`
- `BP_CT40_CameraPresetManager`

Required presets:
- `exterior-hero`
- `walkthrough-entry`
- `living-kitchen`
- `bedroom`
- `bathroom-core`
- `terrace`

## Required Meshes
Use one Unreal unit scale convention from the beginning and document it in the level. Recommended: model in meters in Blender/CAD and import to Unreal with 1 m -> 100 cm.

### Exterior shell
Required:
- `SM_CT40_ExteriorShell_Base`
- `SM_CT40_FloorCassette_A`
- `SM_CT40_FoundationPads_A`
- `SM_CT40_ModuleSeams_A`

Notes:
- Shell should be broken into modular pieces, not one opaque block.
- Keep seams visible enough to communicate modular construction.
- Do not bake facade material directly into mesh if facade variants are needed.

### Wall panels
Required:
- `SM_CT40_WallPanel_Front_A`
- `SM_CT40_WallPanel_Back_A`
- `SM_CT40_WallPanel_Left_A`
- `SM_CT40_WallPanel_Right_A`
- `SM_CT40_InteriorPartition_OneBedroom_A`
- `SM_CT40_ServiceCoreWalls_A`

Optional:
- `SM_CT40_WallPanel_Front_Panoramic_A`
- `SM_CT40_WallPanel_CornerFeature_A`

Notes:
- Openings should be controlled variants, not arbitrary cutouts.
- Panoramic/corner glazing can be represented as alternate wall panel meshes.

### Roof
Required:
- `SM_CT40_Roof_Pitched_A`
- `SM_CT40_Roof_Flat_A`
- `SM_CT40_RoofEdge_Gutter_A`

Optional/deferred:
- `SM_CT40_Roof_GreenPlaceholder_A`

Notes:
- Pitched roof is first POC default.
- Flat roof is useful for variant testing.
- Green roof remains review-required and can fall back to metal roof.

### Windows and doors
Required:
- `SM_CT40_Window_Balanced_A`
- `SM_CT40_Window_FrontPanoramic_A`
- `SM_CT40_Window_SidePrivacy_A`
- `SM_CT40_Door_FrontEntry_A`
- `SM_CT40_Door_TerraceFacing_A`

Optional/deferred:
- `SM_CT40_Window_CornerFeature_A`
- `SM_CT40_Door_SideEntry_A`
- `SM_CT40_Door_PremiumGlazedEntry_A`

Notes:
- `frontPanoramic` and `cornerFeature` must show an engineering-review warning in debug/QA overlay.
- Door placement should use authored attachment points, not runtime mesh cutting.

### Terrace
Required:
- `SM_CT40_Terrace_FrontDeck_A`
- `SM_CT40_Terrace_NoneAnchor_A`
- `SM_CT40_Terrace_Railing_A`

Optional/deferred:
- `SM_CT40_Terrace_Extended_A`
- `SM_CT40_Terrace_Side_A`
- `SM_CT40_Terrace_CoveredPlaceholder_A`

Notes:
- Deck boards should have visible spacing.
- Extended/covered terrace requires site/foundation review warning.

### Interior shell
Required:
- `SM_CT40_InteriorFloor_A`
- `SM_CT40_InteriorCeiling_A`
- `SM_CT40_InteriorWallFinish_A`
- `SM_CT40_InteriorTrim_A`
- `SM_CT40_InteriorDoor_Bedroom_A`
- `SM_CT40_InteriorDoor_Bathroom_A`

Notes:
- First POC should support roof-hidden/cutaway review in editor even if streamed walkthrough starts in normal exterior mode.
- Interior must feel finished enough for a premium walkthrough, but remain modular and truthful.

### Kitchen and bathroom placeholders
Required:
- `SM_CT40_KitchenLine_Base_A`
- `SM_CT40_KitchenLine_Upper_A`
- `SM_CT40_KitchenCounter_A`
- `SM_CT40_BathroomWetCore_A`
- `SM_CT40_ShowerPlaceholder_A`
- `SM_CT40_VanityPlaceholder_A`
- `SM_CT40_ServiceRiser_A`

Notes:
- These are placeholders for sales walkthrough, not final specification.
- Bathroom wet core should be visually distinct from general interior finish.

### Furniture package
Required standard:
- `SM_CT40_Sofa_Standard_A`
- `SM_CT40_Table_Standard_A`
- `SM_CT40_Bed_Standard_A`
- `SM_CT40_Wardrobe_Standard_A`

Required premium:
- `SM_CT40_Sofa_Premium_A`
- `SM_CT40_Table_Premium_A`
- `SM_CT40_Bed_Premium_A`
- `SM_CT40_LoungeAccent_Premium_A`
- `SM_CT40_Lighting_Premium_A`

Notes:
- Furniture should be grouped so `furniturePackage` can show/hide actor sets.
- Premium should look better, but should not imply final procurement.

## Material Slots
Every mesh that needs variants should expose stable material slot names.

Recommended slots:
- `Facade_Main`
- `Facade_Trim`
- `Roof_Main`
- `Roof_Edge`
- `Window_Frame`
- `Window_Glass`
- `Door_Main`
- `Door_Glass`
- `Terrace_Deck`
- `Terrace_Rail`
- `Interior_Wall`
- `Interior_Floor`
- `Bathroom_WetCore`
- `Kitchen_Cabinet`
- `Kitchen_Counter`
- `Furniture_Main`
- `Furniture_Accent`
- `Foundation_Concrete`

Material instances:
- `MI_CT40_Facade_NaturalTimber`
- `MI_CT40_Facade_DarkThermoWood`
- `MI_CT40_Facade_LightPainted`
- `MI_CT40_Trim_Timber`
- `MI_CT40_Trim_DarkMetal`
- `MI_CT40_Roof_Metal`
- `MI_CT40_Roof_GreenPlaceholder`
- `MI_CT40_Glass_Clear`
- `MI_CT40_Glass_Panoramic`
- `MI_CT40_Glass_Privacy`
- `MI_CT40_Door_TimberEntry`
- `MI_CT40_Door_TerraceSlider`
- `MI_CT40_Terrace_TimberDeck`
- `MI_CT40_Interior_Plywood`
- `MI_CT40_Interior_PremiumWall`
- `MI_CT40_Bathroom_WetCore`
- `MI_CT40_Kitchen_Standard`
- `MI_CT40_Kitchen_Premium`
- `MI_CT40_Furniture_Standard`
- `MI_CT40_Furniture_Premium`
- `MI_CT40_Foundation_ConcretePad`

Material rules:
- Use material instances, not unique materials per mesh.
- Avoid runtime downloads.
- Keep shader complexity modest for future streaming.
- Prefer baked/static lighting for the first POC.

## Variant Slots
Variant slots should map directly to Round108 payload tokens.

| Payload field | Supported first POC values | Unreal slot | First POC fallback |
| --- | --- | --- | --- |
| `facade` | `naturalTimber`, `darkThermoWood`, `lightPainted` | `CT40_FacadeVariant` | `naturalTimber` |
| `roof` | `pitched`, `flat` | `CT40_RoofVariant` | `pitched` |
| `roof` | `greenRoofPlaceholder` | `CT40_RoofVariant` warning path | `pitched` + warning |
| `terrace` | `none`, `frontDeck`, `extendedTerrace` | `CT40_TerraceVariant` | `frontDeck` if requested asset missing |
| `windowPlacement` | `balanced`, `frontPanoramic`, `sidePrivacy` | `CT40_WindowPlacementVariant` | `balanced` |
| `windowPlacement` | `cornerFeature` | review/deferred path | `balanced` + warning |
| `doorPlacement` | `frontEntry`, `terraceFacing` | `CT40_DoorPlacementVariant` | `frontEntry` |
| `doorPlacement` | `sideEntry` | review/deferred path | `frontEntry` + warning |
| `finish` | `shell`, `standard`, `premium` | `CT40_FinishVariant` | `standard` |
| `interiorPackage` | `emptyShell`, `standardInterior`, `premiumInterior` | `CT40_InteriorPackageVariant` | `standardInterior` |
| `furniturePackage` | `none`, `standardFurniture`, `premiumFurniture` | `CT40_FurniturePackageVariant` | `standardFurniture` |

## Payload Mapping Checklist
For the first POC, Unreal should load:
- `schemaVersion`: `modular-home-unreal-visualizer-v2`
- `experience`: `modular-home-premium-visualizer`
- `productId`: `compact-timber-40`
- `layoutVariant`: `oneBedroom`
- `moduleInstances`: living, bedroom, bathroom core
- `facade`: preferred POC `darkThermoWood` or `naturalTimber`
- `roof`: `pitched`
- `terrace`: `frontDeck`
- `windowPlacement`: `balanced` first, `frontPanoramic` as review variant
- `doorPlacement`: `frontEntry` first, `terraceFacing` as review variant
- `finish`: `premium`
- `interiorPackage`: `premiumInterior`
- `furniturePackage`: `premiumFurniture`

Reject or fallback if:
- unknown product id;
- unknown layout variant;
- module instance list is empty;
- payload contains arbitrary asset path fields;
- payload claims final quote or includes PII.

## Export / Import Pipeline
### Preferred POC pipeline: Blender -> Unreal
1. Author Compact Timber 40 shell and interior in Blender.
2. Keep object names aligned with Unreal mesh names.
3. Model in meters.
4. Apply transforms before export.
5. Separate variant objects by group:
   - roof variants;
   - terrace variants;
   - window/door placement variants;
   - furniture packages.
6. Export FBX for Unreal import.
7. Use glTF/GLB only as fallback for quick geometry review.
8. Create Unreal Material Instances after import.

### CAD/BIM pipeline: Datasmith if applicable
Use Datasmith when source assets come from:
- Revit;
- SketchUp;
- Archicad;
- Rhino;
- 3ds Max.

Datasmith is preferred for architecture/CAD scenes because it preserves hierarchy, materials and metadata better than generic mesh export. For first POC, Datasmith is optional unless a real CAD model already exists.

### glTF fallback
Use GLB/glTF for:
- quick visual review;
- transferring simple Blender-authored assets;
- debugging scale/origin issues.

Do not use GLB as the final production path if Datasmith/CAD source is available and higher fidelity is needed.

### Naming and import rules
- Prefix static meshes with `SM_CT40_`.
- Prefix blueprints with `BP_CT40_` or shared `BP_ModularHome_`.
- Prefix material instances with `MI_CT40_`.
- Keep mesh pivots predictable.
- Keep origin at house base center or documented root anchor.
- Avoid merged single-mesh exports for variant parts.
- Generate simple collision separately; do not use complex collision for every furniture mesh.

## Estimated Production Effort
These are planning estimates for one experienced technical artist/Unreal developer, not fixed quotes.

### Minimum local POC
Scope:
- exterior shell;
- pitched roof;
- front deck;
- standard windows/doors;
- premium interior placeholders;
- simple lighting;
- payload variant manager with one premium payload.

Estimated effort:
- Asset modeling/import: 2-4 days.
- Materials/lighting: 1-2 days.
- Blueprint variant manager: 1-2 days.
- Walkthrough pawn/cameras/collision: 1-2 days.
- QA/polish: 1 day.
- Total: 6-11 working days.

### Better sales-quality POC
Scope:
- more refined exterior boards/panels;
- credible kitchen/bathroom;
- standard vs premium furniture sets;
- facade/roof/terrace/window/door variant switches;
- debug overlay and fallback warnings.

Estimated effort:
- Asset modeling/import: 5-8 days.
- Materials/lighting: 2-3 days.
- Blueprint variant manager/camera systems: 3-4 days.
- QA/polish/performance: 2-3 days.
- Total: 12-18 working days.

### Not included in estimates
- Pixel Streaming deployment.
- GPU hosting setup.
- backend session broker integration.
- web launcher UX.
- production BIM/CAD deliverables.
- engineering validation.

## Risks
### Asset fidelity vs speed
Risk:
- Quick assets may still look too blocky for a premium demo.

Mitigation:
- Prioritize shell, facade boards, windows, doors, lighting and interior material quality before adding many furniture props.

### Variant complexity
Risk:
- Too many variants can slow the first POC.

Mitigation:
- Start with one premium payload, then add only facade/roof/terrace/window/door variants that have authored assets.

### Scale and collision
Risk:
- Bad scale/origin/collision makes walkthrough feel broken.

Mitigation:
- Lock import scale early, test with walkthrough pawn from day one, use simple collision volumes.

### Pixel Streaming performance later
Risk:
- High-fidelity lighting/materials may become expensive for streamed runtime.

Mitigation:
- Use static/baked lighting, material instances, low shader complexity and minimal dynamic effects.

### Product truthfulness
Risk:
- Unreal may look like a final engineering model.

Mitigation:
- Keep clear "visualization preview, final engineering review required" messaging in any future Web/Unreal launcher.

### Data contract drift
Risk:
- Web configurator tokens evolve and Unreal mapping becomes stale.

Mitigation:
- Version payloads via `schemaVersion`; add payload validation tests before Web runtime integration.

## First POC Acceptance Checklist
- Compact Timber 40 level opens locally.
- Premium payload example is loaded from local JSON.
- Variant manager applies:
  - facade material;
  - pitched roof;
  - front deck;
  - balanced/front panoramic windows;
  - front/terrace-facing door;
  - premium finish;
  - premium furniture package.
- User can inspect:
  - exterior shell;
  - living/kitchen zone;
  - bedroom;
  - bathroom core;
  - terrace.
- Unsupported tokens fallback without crash.
- No PII, uploads, external URLs or final quote data are consumed by Unreal.
- Web3D Modular Home remains the fallback experience.
