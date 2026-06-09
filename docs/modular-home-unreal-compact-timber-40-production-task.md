# Compact Timber 40 Unreal POC Production Task

Status: first actual production task for Blender/Unreal asset work. This document does not enable Pixel Streaming, Web runtime integration, backend submission, uploads, payments or production deployment.

## Locked POC Scope

Build one high-quality, walkable Unreal POC for:

- Product: `compact-timber-40`
- Layout: `oneBedroom`
- Facade: `naturalTimber`
- Roof: `pitched`
- Terrace: `frontDeck`
- Window placement: `balanced`
- Door placement: `frontEntry`
- Finish: `premium`
- Interior package: `premiumInterior`
- Furniture package: `premiumFurniture`

Reason for this scope:
- one model, one layout and one facade keeps production focused;
- the first goal is a credible premium walkthrough, not a full configurator in Unreal;
- Web3D remains the reliable public fallback while Unreal proves visual quality.

## Production Output

The POC is accepted when the Unreal team can open a local level, load the locked payload, walk through the Compact Timber 40 home, and later connect that level to Pixel Streaming staging.

Required output:
- one Blender source scene;
- one Unreal level;
- imported static meshes with stable names;
- material instances with stable slots;
- bounded walkthrough pawn;
- camera presets;
- local payload ingestion or static payload data asset;
- Pixel Streaming staging readiness plan;
- fallback notes for unsupported future variants.

Not included:
- production Web route;
- public Pixel Streaming route;
- real quote/backend integration;
- user uploads;
- AI drawing conversion;
- Family Timber 80 or Sauna Cabin 25 assets;
- engineering-grade BIM, IFC or cut-list output.

## Final Asset List

Recommended Unreal content root:

`/Game/Warpala/ModularHomes/CompactTimber40/`

### Level and blueprints

Required:
- `Level_ModularHome_CompactTimber40_POC`
- `BP_CT40_ModularHomeRoot`
- `BP_CT40_PayloadApplier`
- `BP_CT40_CameraPresetManager`
- `BP_ModularHomeWalkthroughPawn`
- `BP_CT40_StreamReadinessAnchor`
- `DA_CT40_LockedPocPayload`

Deferred:
- generic multi-product variant manager;
- runtime Web payload fetch;
- multi-user guided tour controls.

### Exterior shell and modules

Required static meshes:
- `SM_CT40_Root_BaseAnchor`
- `SM_CT40_FoundationPads_A`
- `SM_CT40_FloorCassette_Living_A`
- `SM_CT40_FloorCassette_Bedroom_A`
- `SM_CT40_ModuleSeam_LivingBedroom_A`
- `SM_CT40_ModuleSeam_ServiceCore_A`
- `SM_CT40_WallPanel_Front_A`
- `SM_CT40_WallPanel_Back_A`
- `SM_CT40_WallPanel_Left_A`
- `SM_CT40_WallPanel_Right_A`
- `SM_CT40_ServiceCore_OuterShell_A`
- `SM_CT40_FacadeBoards_HorizontalNatural_A`
- `SM_CT40_CornerTrim_A`
- `SM_CT40_BaseTrim_A`

Notes:
- keep the shell modular, not one merged mesh;
- make module seams visible but premium;
- do not bake the natural timber material into the mesh.

### Roof

Required:
- `SM_CT40_Roof_Pitched_A`
- `SM_CT40_Roof_RidgeTrim_A`
- `SM_CT40_Roof_EdgeGutter_A`
- `SM_CT40_Roof_Soffit_A`

Deferred:
- flat roof;
- green roof placeholder.

### Windows and doors

Required:
- `SM_CT40_Window_Balanced_Front_A`
- `SM_CT40_Window_Balanced_Back_A`
- `SM_CT40_Window_Balanced_Side_A`
- `SM_CT40_Window_Frame_Timber_A`
- `SM_CT40_Window_Glass_Clear_A`
- `SM_CT40_Door_FrontEntry_A`
- `SM_CT40_Door_Frame_A`
- `SM_CT40_Door_Handle_A`

Deferred:
- front panoramic glazing;
- corner feature glazing;
- side entry;
- terrace-facing slider.

### Terrace and exterior detail

Required:
- `SM_CT40_Terrace_FrontDeck_A`
- `SM_CT40_Terrace_Boards_A`
- `SM_CT40_Terrace_EdgeTrim_A`
- `SM_CT40_Terrace_Steps_A`
- `SM_CT40_Terrace_Posts_A`

Deferred:
- side terrace;
- extended terrace;
- covered terrace placeholder.

### Interior shell

Required:
- `SM_CT40_InteriorFloor_A`
- `SM_CT40_InteriorCeiling_A`
- `SM_CT40_InteriorWall_LivingBedroom_A`
- `SM_CT40_InteriorWall_BathroomCore_A`
- `SM_CT40_InteriorDoor_Bedroom_A`
- `SM_CT40_InteriorDoor_Bathroom_A`
- `SM_CT40_EntryStorage_Wall_A`
- `SM_CT40_InteriorTrim_A`

Interior zones:
- living / kitchen;
- bedroom;
- bathroom core;
- entrance / storage.

### Kitchen, bathroom and furniture

Required:
- `SM_CT40_KitchenLine_Base_A`
- `SM_CT40_KitchenLine_Upper_A`
- `SM_CT40_KitchenCounter_A`
- `SM_CT40_Bathroom_WetCore_A`
- `SM_CT40_Bathroom_ShowerPlaceholder_A`
- `SM_CT40_Bathroom_VanityPlaceholder_A`
- `SM_CT40_Bathroom_ServiceRiser_A`
- `SM_CT40_Sofa_Premium_A`
- `SM_CT40_Table_Premium_A`
- `SM_CT40_Bed_Premium_A`
- `SM_CT40_Wardrobe_Premium_A`
- `SM_CT40_Lighting_Premium_Pendants_A`

Notes:
- furniture is visual placeholder, not a final procurement list;
- bathroom core must read as a wet/service module;
- kitchen line should be simple but credible.

### Collision, navigation and camera

Required:
- `SM_CT40_Collision_WalkBounds_A`
- `SM_CT40_Collision_ExteriorBlockers_A`
- `SM_CT40_Collision_InteriorWalls_A`
- `BP_CT40_CameraPreset_ExteriorHero`
- `BP_CT40_CameraPreset_Entry`
- `BP_CT40_CameraPreset_LivingKitchen`
- `BP_CT40_CameraPreset_Bedroom`
- `BP_CT40_CameraPreset_Bathroom`
- `BP_CT40_CameraPreset_Terrace`

Rules:
- use simple collision volumes;
- no complex collision on all furniture;
- keep walkthrough bounded and comfortable;
- include a reset-to-entry input.

## Blender Task List

1. Scene setup
   - Set units to meters.
   - Use origin at house base center.
   - Document scale: 1 m in Blender imports as 100 cm in Unreal.
   - Create collection names matching mesh groups.

2. Base module modeling
   - Model 8.0 m x 5.0 m Compact Timber 40 footprint.
   - Split living, bedroom and bathroom/service core areas.
   - Add foundation pad placeholders.
   - Add floor cassette seams.

3. Exterior shell
   - Model wall panels as separate authored panels.
   - Add horizontal natural timber board detail.
   - Add corner trim and base trim.
   - Add panel seams aligned to module logic.

4. Openings
   - Add balanced window placement.
   - Add front entry door.
   - Add frame and trim detail.
   - Do not create arbitrary free-cut openings.

5. Roof
   - Model pitched roof as separate roof mesh.
   - Add ridge trim, soffit and gutter placeholder.
   - Keep material slots separate for roof main and roof edge.

6. Terrace
   - Model front deck with board spacing.
   - Add edge trim and simple step.
   - Keep deck boards separate enough to read in Unreal.

7. Interior
   - Model living/kitchen, bedroom, bathroom core and entry/storage zones.
   - Keep ceiling readable but not claustrophobic.
   - Add interior trim and simple doors.

8. Premium interior placeholders
   - Add sofa, table, bed, wardrobe, kitchen line and bathroom placeholders.
   - Keep meshes low-poly and clean.
   - Avoid heavy decorative assets.

9. Material slot assignment
   - Assign stable material slots listed in this document.
   - Do not bake colors or textures into geometry.

10. Export package
   - Save source as `CT40_Unreal_POC_v001.blend`.
   - Export FBX files by mesh group.
   - Optional GLB export for quick visual review.
   - Include a simple preview render for asset review.

## Unreal Task List

1. Project setup
   - Create content folders under `/Game/Warpala/ModularHomes/CompactTimber40/`.
   - Import FBX assets with stable names.
   - Verify scale, pivot and origin.

2. Materials
   - Create material instances listed below.
   - Assign all mesh slots.
   - Keep shader complexity low for future Pixel Streaming.

3. Level assembly
   - Create `Level_ModularHome_CompactTimber40_POC`.
   - Place root actor and all required meshes.
   - Add static lighting or lightweight dynamic lighting.
   - Add reflection captures only if needed.

4. Payload application
   - Create `DA_CT40_LockedPocPayload` from `docs/modular-home-unreal-compact-timber-40-production-task.payload.json`.
   - `BP_CT40_PayloadApplier` validates the locked values and applies known material/mesh visibility.
   - Unknown tokens must fall back to the locked safe baseline.

5. Walkthrough
   - Add bounded walkthrough pawn.
   - Add camera presets.
   - Verify keyboard/mouse input.
   - Verify mobile/touch input later during Pixel Streaming test.

6. QA overlay
   - Add editor or debug-only display for current payload tokens.
   - Include warning text: `Visualization preview - production verification required`.
   - Do not show quote PII or final price.

7. Packaging
   - Package a Windows build after local level is stable.
   - Use streamer id `home-compact-timber-40-poc`.
   - Keep Web3D fallback outside Unreal.

## Material Slots

All variant-capable meshes must expose these stable material slot names:

| Slot | First POC material instance | Notes |
| --- | --- | --- |
| `Facade_Main` | `MI_CT40_Facade_NaturalTimber` | Natural timber only in first POC |
| `Facade_Trim` | `MI_CT40_Trim_Timber` | Corner/base/window trim |
| `Roof_Main` | `MI_CT40_Roof_MetalGraphite` | Pitched metal roof |
| `Roof_Edge` | `MI_CT40_RoofEdge_Graphite` | Gutter/edge placeholder |
| `Window_Frame` | `MI_CT40_WindowFrame_Timber` | Timber frame baseline |
| `Window_Glass` | `MI_CT40_Glass_ClearLowIron` | Clear glass, no runtime video |
| `Door_Main` | `MI_CT40_Door_TimberEntry` | Front entry door |
| `Door_Hardware` | `MI_CT40_DoorHardware_DarkMetal` | Handle/hinge detail |
| `Terrace_Deck` | `MI_CT40_Terrace_NaturalTimber` | Deck boards |
| `Terrace_Trim` | `MI_CT40_Terrace_Trim` | Edge and step trim |
| `Interior_Wall` | `MI_CT40_Interior_PremiumPanel` | Premium interior wall finish |
| `Interior_Floor` | `MI_CT40_Interior_WarmOak` | Premium floor placeholder |
| `Interior_Ceiling` | `MI_CT40_Interior_PlywoodCeiling` | Light timber ceiling |
| `Bathroom_WetCore` | `MI_CT40_Bathroom_WetCore` | Service/bathroom zone |
| `Kitchen_Cabinet` | `MI_CT40_Kitchen_PremiumCabinet` | Kitchen line |
| `Kitchen_Counter` | `MI_CT40_Kitchen_Counter` | Countertop |
| `Furniture_Main` | `MI_CT40_Furniture_NeutralFabric` | Sofa/bed base |
| `Furniture_Accent` | `MI_CT40_Furniture_PremiumAccent` | Accent pillows/detail |
| `Foundation_Concrete` | `MI_CT40_Foundation_ConcretePad` | Foundation placeholders |

Material rules:
- use material instances, not unique materials per object;
- no runtime downloaded textures;
- no high-cost translucent effects except simple glass;
- baked/static lighting preferred for the first POC.

## Payload Mapping

Locked payload file:

`docs/modular-home-unreal-compact-timber-40-production-task.payload.json`

Mapping table:

| Payload field | Locked value | Unreal action |
| --- | --- | --- |
| `schemaVersion` | `modular-home-unreal-visualizer-v2` | Validate supported payload version |
| `experience` | `modular-home-premium-visualizer` | Open Compact Timber 40 visualizer path |
| `productId` | `compact-timber-40` | Load `Level_ModularHome_CompactTimber40_POC` |
| `layoutVariant` | `oneBedroom` | Show one-bedroom interior partitions |
| `moduleInstances` | living, bedroom, bathroom core | Validate expected module set |
| `facade` | `naturalTimber` | Apply natural timber facade material |
| `roof` | `pitched` | Show pitched roof mesh |
| `terrace` | `frontDeck` | Show front deck actor group |
| `windowPlacement` | `balanced` | Show balanced window mesh set |
| `doorPlacement` | `frontEntry` | Show front entry door actor |
| `finish` | `premium` | Apply premium interior finish set |
| `interiorPackage` | `premiumInterior` | Show premium interior material/detail set |
| `furniturePackage` | `premiumFurniture` | Show premium furniture actor group |
| `materialTokens.facadeMaterialId` | `natural-timber-siding` | Map to `MI_CT40_Facade_NaturalTimber` |
| `materialTokens.roofMaterialId` | `metal-roof` | Map to `MI_CT40_Roof_MetalGraphite` |
| `materialTokens.interiorMaterialIds` | `interior-plywood`, `bathroom-wet-core` | Map interior and bathroom materials |
| `safety.*` | all false for PII/uploads/final quote | Reject unsafe payloads |

Unreal must reject or fallback on:
- arbitrary asset paths;
- external asset URLs;
- uploaded user files;
- PII/contact fields;
- final quote claims;
- unknown product id.

## Pixel Streaming Staging Plan

This is a staging plan only. Do not enable public production streaming from this task.

### Phase 0 - local Unreal level

Goal:
- prove asset quality, scale, collision, lighting and walkthrough locally.

Tasks:
- open `Level_ModularHome_CompactTimber40_POC`;
- load `DA_CT40_LockedPocPayload`;
- verify all required camera presets;
- run for 20 minutes without editor/runtime crash.

Exit gate:
- local packaged build starts and walkthrough works.

### Phase 1 - local Pixel Streaming smoke

Goal:
- prove the packaged Unreal app can stream locally before staging.

Configuration:
- streamer id: `home-compact-timber-40-poc`
- signaling: local existing Pixel Streaming stack
- Web route: local test page only

Checks:
- streamer registers;
- browser connects;
- input works;
- fallback appears when streamer is stopped;
- no PII or quote data is sent to Unreal.

Exit gate:
- 3 consecutive local stream launches connect successfully.

### Phase 2 - staging single-streamer POC

Goal:
- controlled staging demo for one viewer/operator at a time.

Recommended deployment:
- GPU-capable Windows host or GPU cloud instance for packaged Unreal app;
- existing Hetzner/backend can remain API/signaling/support host only if it has no GPU;
- WSS signaling and TURN configured for staging;
- streamer id remains `home-compact-timber-40-poc`;
- explicit future gate, for example `?homeUnrealPoc=1`, before exposing from Web.

Required environment/config values later:
- `PIXEL_STREAMING_HOME_VISUALIZER_ENABLED=false` by default
- `PIXEL_STREAMING_HOME_VISUALIZER_STREAMER_ID=home-compact-timber-40-poc`
- `PIXEL_STREAMING_HOME_VISUALIZER_REQUIRE_AUTH=true`
- `PIXEL_STREAMING_HOME_VISUALIZER_SIGNALLING_URL=wss://...`

Exit gate:
- staging status endpoint reports streamer available;
- one staging browser session connects;
- input works;
- Web3D fallback remains available;
- stream can be stopped without breaking normal `/expo-3d?homeDemo=1`.

### Phase 3 - client demo readiness

Goal:
- use Unreal only for scheduled premium walkthroughs.

Rules:
- do not make Unreal the default public Modular Home path;
- keep Web3D configurator as default;
- schedule GPU runtime windows;
- document operator recovery steps;
- track active GPU cost per demo.

## Production Acceptance Checklist

Blender asset handoff:
- source `.blend` exists;
- FBX exports use stable names;
- mesh scale/origin verified;
- material slots assigned;
- no single merged mesh for all variants.

Unreal handoff:
- level opens locally;
- payload applies locked values;
- premium interior is visible;
- camera presets work;
- walkthrough collision is stable;
- fallback warnings exist for unsupported tokens;
- packaged build launches.

Pixel Streaming staging readiness:
- streamer id defined;
- local stream smoke passes;
- staging GPU host decision documented;
- signaling/TURN plan documented;
- Web fallback remains the default.

Commercial readiness:
- home looks credible enough for first investor/client walkthrough;
- no final quote claims;
- no PII sent to Unreal;
- no production public streaming enabled by this document.

