# Modular Home Unreal Hybrid POC Package

Status: actionable POC package only. No production Web, backend or Pixel Streaming behavior is enabled by this document.

## Objective
Prepare the first Unreal hybrid proof of concept for the Modular Home vertical without replacing the current Web3D configurator.

POC name:
- Compact Timber 40 Premium Interior Walkthrough

Primary goal:
- Let a high-intent buyer enter a high-fidelity streamed Unreal walkthrough of Compact Timber 40 after configuring the house in Web3D.

Non-goals:
- No production Pixel Streaming launch.
- No public autoscaling.
- No user file upload to Unreal.
- No AI drawing conversion.
- No final quote generation.
- No PII transfer to Unreal.
- No replacement of the existing Web3D home demo fallback.

## Current product source of truth
The Web configurator remains the source of truth for product, pricing, quote and workspace state.

Relevant Web product config:
- Product id: `compact-timber-40`
- Product name: `Compact Timber 40`
- Template id: `compactTimber40`
- Floor area: `40 m2`
- Footprint: `8.0 m x 5.0 m`
- Ceiling height: `2.6 m`
- Default modules:
  - `compact-40-living-01` -> `compact-living-module`
  - `compact-40-bedroom-01` -> `compact-bedroom-module`
  - `compact-40-bathroom-core-01` -> `bathroom-core-module`
- Default config:
  - facade: `naturalTimber`
  - roof: `pitched`
  - terrace: `frontDeck`
  - finishLevel: `standard`
  - windowPackage: `standardWindows`
  - doorPackage: `standardEntry`

POC target variant:
- facade: `naturalTimber`
- roof: `pitched`
- terrace: `frontDeck`
- finishLevel: `premium`
- windowPackage: `standardWindows`
- doorPackage: `standardEntry`
- camera initial preset: `walkthrough-entry`

## Web to Unreal payload schema
Canonical schema file:
- `docs/modular-home-unreal-compact-timber-40-poc-payload.schema.json`

Example payload file:
- `docs/modular-home-unreal-compact-timber-40-poc-payload.example.json`

Required payload rules:
- Payload must be deterministic and enum-based.
- Web sends product/config/module/material tokens only.
- Unreal maps trusted tokens to prepackaged assets and material instances.
- Unreal must not load arbitrary user URLs, uploaded files or raw material names.
- No quote contact fields or PII should be sent to Unreal in the first POC.
- Quote context is estimate-only and can be omitted if not needed by Unreal.

Payload sections:
- `schemaVersion`: fixed version for this POC.
- `experience`: `modular-home-visualizer`.
- `sessionId`: reservation/session id.
- `streamerId`: target Pixel Streaming streamer id.
- `product`: normalized product dimensions.
- `config`: Web option tokens.
- `modules`: module instances with quantity and production group.
- `materials`: trusted material tokens.
- `variants`: Unreal variant switches derived from config.
- `camera`: initial and allowed camera presets.
- `quoteContext`: optional estimate context, not final quote.
- `safety`: guarantees for no PII/upload/final quote.

## Compact Timber 40 asset list
Unreal content root recommendation:
- `/Game/Warpala/ModularHomes/CompactTimber40/`

Level:
- `Level_ModularHome_CompactTimber40_POC`

Blueprints:
- `BP_ModularHomeVariantManager`
  - Reads or receives the trusted payload.
  - Applies material variants.
  - Toggles roof, terrace, window, door and interior package variants.
  - Exposes current variant state in a local debug overlay.
- `BP_ModularHomeWalkthroughPawn`
  - Bounded walk/orbit controls for streamed clients.
  - Keyboard, touch and simple gamepad friendly input.
- `BP_ModularHomeCameraPresetManager`
  - Exterior hero.
  - Entry doorway.
  - Living/kitchen.
  - Bedroom.
  - Bathroom core.
  - Terrace.
- `BP_ModularHomeStreamHealthAnchor`
  - Optional local marker for startup/ready checks.

Meshes for POC:
- `SM_CT40_FloorCassette_A`
- `SM_CT40_LivingWallPanels_A`
- `SM_CT40_BedroomWallPanels_A`
- `SM_CT40_BathroomCore_A`
- `SM_CT40_PitchedRoof_A`
- `SM_CT40_FlatRoof_A` deferred but safe to reserve naming.
- `SM_CT40_FacadeBoarding_Natural_A`
- `SM_CT40_FacadeBoarding_Dark_A` deferred optional.
- `SM_CT40_FacadeBoarding_Light_A` deferred optional.
- `SM_CT40_Window_Standard_A`
- `SM_CT40_Window_Panoramic_A` deferred optional.
- `SM_CT40_Window_Privacy_A` deferred optional.
- `SM_CT40_Door_StandardEntry_A`
- `SM_CT40_Door_TerraceSlider_A` deferred optional.
- `SM_CT40_Terrace_FrontDeck_A`
- `SM_CT40_Terrace_Extended_A` deferred optional.
- `SM_CT40_FoundationPads_A`
- `SM_CT40_KitchenLine_A`
- `SM_CT40_BathroomFixtures_A`
- `SM_CT40_Bed_A`
- `SM_CT40_Sofa_A`
- `SM_CT40_Table_A`
- `SM_CT40_Lighting_Static_A`
- `SM_CT40_CollisionBounds_A`

Minimum acceptable asset set for first streamed walkthrough:
- exterior shell;
- pitched roof;
- front deck;
- entry door;
- standard windows;
- living/kitchen placeholder;
- bedroom placeholder;
- bathroom wet core placeholder;
- basic lighting;
- bounded collision/walk area.

## Material list
Material instance naming recommendation:
- `MI_CT40_Facade_NaturalTimber`
- `MI_CT40_Facade_DarkThermoWood`
- `MI_CT40_Facade_LightPainted`
- `MI_CT40_Roof_MetalStandingSeam`
- `MI_CT40_Roof_GreenPlaceholder`
- `MI_CT40_Interior_Plywood`
- `MI_CT40_Bathroom_WetCore`
- `MI_CT40_Floor_WarmOakPlaceholder`
- `MI_CT40_Terrace_TimberDeck`
- `MI_CT40_Glass_ClearLowIron`
- `MI_CT40_Door_TimberEntry`
- `MI_CT40_Door_GlazedEntry`
- `MI_CT40_Furniture_NeutralFabric`
- `MI_CT40_Furniture_PremiumAccent`
- `MI_CT40_Foundation_ConcretePad`

Material rules:
- Use material instances, not unique materials per variant.
- Keep shader complexity low for streaming stability.
- Prefer baked/static lighting for the first POC.
- Avoid runtime texture downloads.

## Variant list
POC baseline variant:
- product: `compact-timber-40`
- facade: `naturalTimber`
- roof: `pitched`
- terrace: `frontDeck`
- finishLevel: `premium`
- windowPackage: `standardWindows`
- doorPackage: `standardEntry`

Supported switches for first POC if assets are ready:
- facade:
  - `naturalTimber`
  - `darkThermoWood`
  - `lightPainted`
- roof:
  - `pitched`
  - `flat`
- terrace:
  - `none`
  - `frontDeck`
- finishLevel:
  - `standard`
  - `premium`
- windowPackage:
  - `standardWindows`
  - `panoramicWindows` only if structural visual is already authored.
- doorPackage:
  - `standardEntry`
  - `terraceSlider` only if threshold and door opening are authored.

Deferred variants:
- `greenRoofPlaceholder`
- `sideTerrace`
- `extendedTerrace`
- `coveredTerracePlaceholder`
- `cornerGlazing`
- `compactPrivacy`
- `premiumGlazedEntry`
- Family Timber 80.
- Sauna Cabin 25.
- Uploaded GLB/IFC/DWG/PDF conversion.

## Pixel Streaming deployment plan
### Phase 0 - local Unreal asset POC
- Build the Unreal level and variant manager locally.
- Use a local JSON payload file first.
- Verify level loads without Web integration.
- Verify walkthrough controls and camera presets.
- Verify GPU memory, startup time and frame stability.

Exit gate:
- Local Unreal walkthrough runs reliably for 20 minutes.
- Variant manager applies baseline payload.
- No PII or uploaded files are consumed by Unreal.

### Phase 1 - local Pixel Streaming POC
- Launch local signaling/TURN stack already used by the repo.
- Use streamer id `home-compact-timber-40-premium-poc`.
- Connect from a local Web review URL only after Phase 0 passes.
- Keep Web3D fallback available.

Exit gate:
- Stream connects consistently from local browser.
- Input works.
- Audio can stay disabled unless needed.
- Fallback shows when streamer is unavailable.

### Phase 2 - staging single GPU POC
- Use one scheduled GPU instance for controlled demos.
- Run packaged Unreal app, signaling and TURN with TLS/WSS.
- Integrate through the existing session broker only behind an explicit review flag later.
- One interactive user per streamer unless shared guided mode is built.

Exit gate:
- Staging stream starts within approved startup time.
- Session readiness endpoint reports streamer available.
- Mobile fallback is shown on poor bandwidth.
- Cost and idle shutdown rules are approved.

### Phase 3 - controlled client demo
- Use scheduled demo slots.
- Keep Web3D home demo as public default.
- Unreal stream is positioned as a premium walkthrough, not default web experience.

Exit gate:
- Demo operator can recover from streamer crash.
- Fallback path is documented and tested.
- Costs are reviewed after each demo window.

## Deployment requirements
Infrastructure requirements:
- Windows GPU VM or GPU workstation for packaged Unreal app.
- Reachable signaling service over WSS.
- TURN configured for restricted networks.
- Existing backend session/status service reused where possible.
- Streamer id isolation per visualizer POC.
- Idle shutdown or manual shutdown process.
- Logs with no quote PII.

Recommended environment names later:
- `PIXEL_STREAMING_HOME_VISUALIZER_ENABLED=false`
- `PIXEL_STREAMING_HOME_VISUALIZER_STREAMER_ID=home-compact-timber-40-premium-poc`
- `PIXEL_STREAMING_HOME_VISUALIZER_SIGNALLING_URL=wss://...`
- `PIXEL_STREAMING_HOME_VISUALIZER_REQUIRE_AUTH=true`

Do not enable these in production until Phase 2 exits successfully.

## Cost estimate
These are planning ranges only and not vendor quotes.

Local/dev POC:
- Infrastructure: EUR 0 additional, excluding existing workstation/GPU.
- Setup effort: 1-3 engineering days after assets are ready.
- Best use: asset quality, controls and local streaming stability.

Single scheduled staging GPU:
- GPU compute: roughly EUR 1-4 per active hour, provider dependent.
- If used 40-120 hours/month: roughly EUR 80-480/month compute.
- If always-on: roughly EUR 600-1800/month depending GPU/provider.
- TURN/bandwidth: roughly EUR 20-150/month for controlled demos.
- Storage/logs: roughly EUR 10-50/month.
- Ops/setup effort: 2-5 engineering days.

Small controlled demo pool:
- 2-3 GPU instances, scheduled: roughly EUR 300-1500/month for controlled usage.
- Always-on pool: roughly EUR 1500-5000+/month.
- Requires queueing, observability and idle shutdown.

Commercial recommendation:
- Do not make Unreal the default public path.
- Use Web3D for browsing and quote flow.
- Use Unreal for booked premium walkthroughs and sponsor/client calls.

## Fallback plan
Fallback levels:
1. Stream unavailable
   - Show existing Web3D Modular Home model/configurator.
   - Keep quote preview/local project workspace available.
2. Stream busy
   - Show Web3D fallback and schedule/demo message.
   - Do not block the user from using the configurator.
3. Mobile or low bandwidth
   - Default to Web3D fallback.
   - Offer Unreal walkthrough only after warning/intent.
4. Variant unsupported in Unreal
   - Apply closest supported visual variant.
   - Show a non-blocking warning in review mode only.
   - Do not crash or hide the Web3D estimate.
5. Unreal crash/session drop
   - Return to Web3D home demo with current config preserved.

Fallback rule:
- Web3D must remain the reliable product path. Unreal is a premium visualization layer.

## First POC scope checklist
Build only:
- Compact Timber 40 exterior shell.
- Premium interior placeholder.
- Living/kitchen walkthrough zone.
- Bedroom walkthrough zone.
- Bathroom core placeholder.
- Front deck/exterior hero view.
- Natural timber facade.
- Pitched metal roof.
- Standard windows and standard entry door.
- Camera presets and bounded pawn.
- Local payload ingestion.
- Local Pixel Streaming smoke test.

Do not build in first POC:
- Family Timber 80.
- Sauna Cabin 25.
- User upload import.
- AI drawing conversion.
- Real quote coupling.
- Payment or booking.
- Multi-user production scaling.
- Public production route.

## Acceptance criteria
The POC package is ready when:
- Payload schema is stable enough for Unreal implementation.
- Asset list is clear enough for Blender/Unreal production.
- Material/variant list is bounded.
- Pixel Streaming deployment path has phases and gates.
- Cost model is visible before implementation.
- Fallback plan protects the current Web3D product.
- No production code is enabled by this package.
