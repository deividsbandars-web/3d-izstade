# Modular Home Unreal Premium Visualizer Data Contract

Status: contract and POC handoff only. Pixel Streaming is not implemented or enabled by this document.

## Goal
Define the exact data payload that the Web Modular Home configurator can send to a future Unreal premium visualizer.

The Web app remains the source of truth for:
- selected product;
- layout variant;
- configuration options;
- module instances;
- material tokens;
- estimate summary;
- project/workspace id.

Unreal remains responsible for:
- high-fidelity visual assets;
- variant switching;
- walkthrough camera/pawn;
- streamed visual presentation;
- safe fallback if a variant or asset is unavailable.

## Contract Files
- Schema: `docs/modular-home-unreal-premium-visualizer-payload.schema.json`
- Compact standard example: `docs/modular-home-unreal-payload-compact-standard.example.json`
- Compact premium example: `docs/modular-home-unreal-payload-compact-premium.example.json`
- Family with terrace example: `docs/modular-home-unreal-payload-family-terrace.example.json`

## Payload Shape
The canonical payload is deterministic and enum-based. Web must not send arbitrary asset paths, user-uploaded files, URLs, raw material names, or contact/PII fields to Unreal.

Required top-level fields:
- `schemaVersion`
- `experience`
- `projectId`
- `productId`
- `layoutVariant`
- `moduleInstances`
- `facade`
- `roof`
- `terrace`
- `windowPlacement`
- `doorPlacement`
- `finish`
- `interiorPackage`
- `furniturePackage`
- `materialTokens`
- `safety`

Optional top-level fields:
- `estimateSummary`
- `notes`

## Token Reference
### productId
- `compact-timber-40`
- `family-timber-80`
- `sauna-cabin-25`

### layoutVariant
Compact Timber 40:
- `openStudio`
- `oneBedroom`
- `officeCabin`

Family Timber 80:
- `twoBedroom`
- `threeBedroomCompact`
- `largeLiving`

Sauna Cabin 25:
- `saunaOnly`
- `guestCabin`
- `saunaRestRoom`

### facade
- `naturalTimber`
- `darkThermoWood`
- `lightPainted`

### roof
- `flat`
- `pitched`
- `greenRoofPlaceholder`

### terrace
- `none`
- `frontDeck`
- `sideTerrace`
- `extendedTerrace`
- `coveredTerracePlaceholder`

### windowPlacement
- `balanced`
- `frontPanoramic`
- `sidePrivacy`
- `cornerFeature`

### doorPlacement
- `frontEntry`
- `sideEntry`
- `terraceFacing`

### finish
- `shell`
- `standard`
- `premium`

### interiorPackage
- `emptyShell`
- `standardInterior`
- `premiumInterior`
- `saunaWellnessInterior`

### furniturePackage
- `none`
- `standardFurniture`
- `premiumFurniture`
- `saunaWellnessFurniture`

## Module Instance Contract
Each module instance must come from Web product data and preserve quantity semantics.

Fields:
- `instanceId`: stable Web instance id.
- `moduleId`: module library id.
- `quantity`: integer count.
- `role`: user-readable role.
- `positionHint`: descriptive placement hint for Unreal layout mapping.
- `productionGroup`: production or visual grouping.

Unreal should not infer modules from product id alone. It should read `moduleInstances` and choose the closest authored variant for the product.

## Material Tokens
Material tokens are trusted ids from Web config. Unreal maps them to Material Instances.

Required:
- `facadeMaterialId`
- `roofMaterialId`
- `interiorMaterialIds`
- `terraceMaterialId`
- `glassMaterialId`
- `doorMaterialId`
- `trimMaterialId`

Unreal must map unknown material ids to a safe default and report a warning in debug telemetry.

## Variant Mapping Table
| Web token group | Web token | Unreal target | Fallback |
| --- | --- | --- | --- |
| productId | `compact-timber-40` | `Level_ModularHome_CompactTimber40_POC` / `BP_CT40_VariantSet` | Web3D home demo |
| productId | `family-timber-80` | `Level_ModularHome_FamilyTimber80_POC` / `BP_FT80_VariantSet` | Use Web3D home demo until Family Unreal assets exist |
| productId | `sauna-cabin-25` | `Level_ModularHome_SaunaCabin25_POC` / `BP_SC25_VariantSet` | Use Web3D home demo until Sauna Unreal assets exist |
| facade | `naturalTimber` | `MI_ModHome_Facade_NaturalTimber` | Natural timber |
| facade | `darkThermoWood` | `MI_ModHome_Facade_DarkThermoWood` | Natural timber |
| facade | `lightPainted` | `MI_ModHome_Facade_LightPainted` | Natural timber |
| roof | `flat` | `SM_*_Roof_Flat` + `MI_ModHome_Roof_Metal` | Pitched roof if flat mesh missing |
| roof | `pitched` | `SM_*_Roof_Pitched` + `MI_ModHome_Roof_Metal` | Flat roof if pitched mesh missing |
| roof | `greenRoofPlaceholder` | `SM_*_Roof_GreenPlaceholder` + `MI_ModHome_Roof_GreenPlaceholder` | Metal roof + review warning |
| terrace | `none` | Hide terrace actors | None |
| terrace | `frontDeck` | Show front deck actor | None |
| terrace | `sideTerrace` | Show side terrace actor | Front deck if side asset missing |
| terrace | `extendedTerrace` | Show extended deck actor | Front deck + review warning |
| terrace | `coveredTerracePlaceholder` | Show covered terrace placeholder actor | Front deck + review warning |
| windowPlacement | `balanced` | Standard window schedule | Balanced |
| windowPlacement | `frontPanoramic` | Front panoramic window schedule | Balanced + review warning |
| windowPlacement | `sidePrivacy` | Side privacy window schedule | Balanced |
| windowPlacement | `cornerFeature` | Corner glazing feature schedule | Balanced + review warning |
| doorPlacement | `frontEntry` | Front entry door actor | Front entry |
| doorPlacement | `sideEntry` | Side entry door actor | Front entry + review warning |
| doorPlacement | `terraceFacing` | Terrace-facing door/slider actor | Front entry if terrace absent |
| finish | `shell` | Shell-only interior variant | Shell |
| finish | `standard` | Standard finish variant | Shell |
| finish | `premium` | Premium finish variant | Standard if premium assets missing |
| interiorPackage | `emptyShell` | No furniture, exposed interior shell | Empty shell |
| interiorPackage | `standardInterior` | Standard interior materials/furniture | Empty shell |
| interiorPackage | `premiumInterior` | Premium interior package | Standard interior |
| interiorPackage | `saunaWellnessInterior` | Sauna/wet-core interior set | Empty shell + warning if unavailable |
| furniturePackage | `none` | Hide loose furniture actors | None |
| furniturePackage | `standardFurniture` | Standard furniture actor group | None |
| furniturePackage | `premiumFurniture` | Premium furniture actor group | Standard furniture |
| furniturePackage | `saunaWellnessFurniture` | Sauna bench/rest furniture group | None + warning if unavailable |

## Unreal Asset Requirements
### Shared systems
- `BP_ModularHomePayloadValidator`
  - validates schema version and required tokens;
  - rejects arbitrary asset paths;
  - emits warning list for unsupported variants.
- `BP_ModularHomeVariantManager`
  - applies product, material, roof, terrace, window, door, finish and furniture variants;
  - exposes current variant state for QA overlay.
- `BP_ModularHomeWalkthroughPawn`
  - bounded walk/orbit movement;
  - keyboard and touch friendly;
  - no unrestricted fly-through for client demo.
- `BP_ModularHomeCameraPresetManager`
  - exterior hero;
  - entry doorway;
  - living/kitchen;
  - bedroom;
  - bathroom/wet core;
  - terrace;
  - floorplan/top-down optional later.
- `BP_ModularHomeFallbackOverlay`
  - shows "premium visualizer unavailable" if payload, streamer or asset readiness fails.

### Compact Timber 40 minimum POC assets
- `Level_ModularHome_CompactTimber40_POC`
- `SM_CT40_FloorCassette_A`
- `SM_CT40_WallPanels_A`
- `SM_CT40_BathroomCore_A`
- `SM_CT40_PitchedRoof_A`
- `SM_CT40_FlatRoof_A`
- `SM_CT40_FacadeBoarding_A`
- `SM_CT40_Window_Balanced_A`
- `SM_CT40_Window_FrontPanoramic_A`
- `SM_CT40_Door_FrontEntry_A`
- `SM_CT40_Door_TerraceFacing_A`
- `SM_CT40_Terrace_FrontDeck_A`
- `SM_CT40_Terrace_Extended_A`
- `SM_CT40_KitchenLine_A`
- `SM_CT40_BathroomFixtures_A`
- `SM_CT40_Furniture_Standard_A`
- `SM_CT40_Furniture_Premium_A`
- `SM_CT40_CollisionBounds_A`
- `SM_CT40_Lighting_Static_A`

### Family Timber 80 POC assets
Can start as deferred, but the data contract already supports it.
- `Level_ModularHome_FamilyTimber80_POC`
- larger shell/floor/wall/roof variants;
- two-bedroom and large-living layout actor groups;
- extended terrace actor;
- panoramic front window actor group.

### Sauna Cabin 25 POC assets
Can start as deferred, but the data contract already supports it.
- `Level_ModularHome_SaunaCabin25_POC`
- sauna/wellness wet-core actor group;
- privacy glazing actor group;
- sauna bench/rest package.

## Fallback Behavior
Fallback must be deterministic.

Payload validation failure:
- Do not start Unreal stream.
- Show Web3D Modular Home fallback.
- Log non-PII validation code only.

Unsupported product:
- If product is not authored in Unreal, show Web3D fallback.
- Do not try to construct a house from arbitrary module ids.

Unsupported option:
- Use safe default for that option.
- Show review warning in Unreal QA overlay.
- Keep Web configurator state unchanged.

Streamer unavailable:
- Stay in Web3D.
- Show "Premium visualizer unavailable, continue in Web preview."
- Do not drop the current Web project/config state.

Estimate unavailable:
- Continue visualizer without estimate.
- Display "Estimate unavailable in premium visualizer; review Web summary."

## POC Scope
First POC:
- Compact Timber 40.
- `layoutVariant`: `oneBedroom`.
- `finish`: `premium`.
- `interiorPackage`: `premiumInterior`.
- `furniturePackage`: `premiumFurniture`.
- `facade`: `naturalTimber`.
- `roof`: `pitched`.
- `terrace`: `frontDeck`.
- `windowPlacement`: `balanced`.
- `doorPlacement`: `frontEntry`.

POC success criteria:
- Unreal can load the example Compact premium payload.
- Variant manager applies facade, roof, terrace, windows, doors, finish and furniture.
- Walkthrough starts from entry preset.
- Living/kitchen, bedroom and bathroom core are visible.
- Fallback works when streamer or payload validation fails.
- No contact data, uploaded drawings, localStorage data or backend quote data is sent to Unreal.

Deferred:
- Pixel Streaming route.
- Backend session reservation.
- Production queueing/autoscaling.
- Uploaded GLB/IFC/DWG/PDF conversion.
- Family/Sauna high-fidelity walkthroughs.
- Engineering-grade BIM/BOM output.

## Security and Privacy Rules
- No PII in payload.
- No raw user uploads in payload.
- No arbitrary file paths or external URLs.
- No final quote claims.
- No production collection enabled by this contract.
- Any future backend handoff must validate payload server-side before reserving a stream.
