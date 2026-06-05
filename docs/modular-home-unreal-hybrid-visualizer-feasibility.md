# Modular Home Unreal Hybrid Visualizer Feasibility Plan

Status: feasibility and implementation plan only. Pixel Streaming is not implemented or enabled in this round.

## Goal
Create a future Unreal-powered premium visualizer for Modular Home buyers while keeping the current Web3D configurator as the fast, mobile-safe default.

First POC target:
- Product: Compact Timber 40
- Config: premium interior preview
- Experience: guided walkthrough inside/outside the house
- Delivery: Pixel Streaming session launched only from explicit review path later

## Current repo context
Existing Web3D/Pixel Streaming foundation:
- Frontend Pixel Streaming viewer: `src/modules/expo/PixelStreamingViewer.tsx`.
- Frontend runtime config/session helpers: `src/modules/expo/services/pixelStreamingConfig.ts`.
- Backend status/session endpoints:
  - `GET /api/pixel-streaming/status`
  - `POST /api/pixel-streaming/session`
- Backend services:
  - `backend-server/services/pixelStreamingStatus.ts`
  - `backend-server/services/pixelStreamingSessionBroker.ts`
- Local launcher scripts:
  - `npm run start:expo:stack`
  - `npm run start:expo:unreal`
  - `npm run start:expo:commercial`
- Unreal project exists at `WarpalaUE5/WarpalaUE5.uproject`.
- Existing signaling service exists under `deployment/signaling`.

No production Modular Home Pixel Streaming path should be added until the POC proves stability, hosting cost and UX.

## Data contract: Web configurator -> Unreal
The Web configurator should send a compact, deterministic variant payload. It must not send arbitrary user code or untrusted asset paths.

Recommended payload shape:

```json
{
  "experience": "modular-home-visualizer",
  "sessionId": "uuid-or-server-reservation-id",
  "productId": "compact-timber-40",
  "templateId": "compactTimber40",
  "variant": {
    "facade": "naturalTimber",
    "roof": "pitched",
    "terrace": "smallTerrace",
    "finishLevel": "premium",
    "interiorPackage": "premiumInteriorPreview"
  },
  "modules": [
    { "instanceId": "compact-40-living-01", "moduleId": "compact-living-module", "quantity": 1, "role": "Living and kitchen module" },
    { "instanceId": "compact-40-bedroom-01", "moduleId": "compact-bedroom-module", "quantity": 1, "role": "Bedroom module" },
    { "instanceId": "compact-40-bathroom-core-01", "moduleId": "bathroom-core-module", "quantity": 1, "role": "Bathroom core" }
  ],
  "materials": {
    "facadeMaterialId": "natural-timber-siding",
    "roofMaterialId": "metal-roof",
    "interiorMaterialIds": ["interior-plywood", "bathroom-wet-core"]
  },
  "cameraPreset": "walkthrough-entry",
  "quoteContext": {
    "estimatedTotal": 94600,
    "currency": "EUR",
    "disclaimer": "Estimate only; final quote requires site and engineering review."
  }
}
```

Minimum fields for POC:
- `productId`
- `templateId`
- `facade`
- `roof`
- `terrace`
- `finishLevel`
- `interiorPackage`
- `moduleIds` or `moduleInstances`
- `cameraPreset`

Do not send:
- raw uploaded files;
- user-supplied URLs for Unreal to load directly;
- arbitrary material names;
- PII/contact fields unless the session explicitly needs them, which the first POC does not.

## Unreal project requirements
For POC, Unreal needs one clean level and one blueprint-driven variant manager.

Recommended Unreal level:
- `Level_ModularHome_CompactTimber40_POC`

Required Unreal actors/blueprints:
- `BP_ModularHomeVariantManager`
  - accepts trusted variant payload;
  - applies material variants;
  - toggles roof/terrace/interior packages;
  - exposes current variant for debug overlay.
- `BP_ModularHomeWalkthroughPawn`
  - first-person or orbit/walk hybrid;
  - restricted movement bounds;
  - mobile-friendly input mapping for streamed client.
- `BP_ModularHomeCameraRail` or preset cameras
  - exterior hero;
  - entry/doorway;
  - living/kitchen;
  - bedroom;
  - bathroom core;
  - terrace.
- `BP_ModularHomeInteractionSurface` optional later
  - not needed in first POC.

Required Unreal content:
- Compact Timber 40 exterior shell.
- Premium interior placeholder assets.
- Natural timber facade material.
- Metal/standing seam roof material.
- Bathroom wet core material.
- Interior plywood material.
- Low-cost lighting profile for Pixel Streaming.

Unreal should own high-fidelity visuals. Web should own pricing/config/state.

## Asset pipeline
Target pipeline:
1. Product design source
   - Blender for authored visualization assets.
   - CAD/BIM source if available later.
2. Export/import path
   - Blender -> FBX/glTF for quick POC assets.
   - CAD/Revit/SketchUp -> Datasmith -> Unreal for production-quality archviz.
   - IFC -> review/conversion pipeline later, not first POC.
3. Unreal preparation
   - Nanite only if it helps and stream GPU can handle it.
   - Baked or mostly static lighting where possible.
   - LODs for interior props.
   - Material instances for facade/roof/interior variants.
4. Web config -> Unreal variant selection
   - Web sends normalized product/config payload to backend/session broker.
   - Backend reserves streamer and forwards or stores session variant payload.
   - Unreal fetches variant by session id or receives it over Pixel Streaming data channel after connection.

Recommended first POC path:
- Hardcode Compact Timber 40 premium assets in Unreal.
- Use a small JSON variant file or command line argument first.
- Only after stable: connect Web config payload via backend session reservation.

## Pixel Streaming hosting estimate
These are planning estimates, not final quotes.

### Local/dev POC
- One Windows workstation with RTX-class GPU.
- Existing local signaling/TURN scripts.
- Cost: local machine only.
- Best for validating project setup, controls, materials and first walkthrough.

### Single-user staging POC
- One GPU VM running Unreal packaged app + streamer.
- Signaling service and TURN reachable from staging.
- Expected range: roughly EUR 250-900/month depending on GPU provider, uptime and region.
- Use scheduled uptime, not 24/7, during early demos.

### Small demo pool
- 1-3 GPU instances with session broker.
- One active user per Unreal streamer unless using spectator/shared mode.
- Expected range: roughly EUR 800-3000+/month depending on concurrency and uptime.

### Production scale
- Per-session or pooled GPU scaling.
- Needs autoscaling, queueing, idle shutdown, TURN bandwidth cost monitoring and observability.
- Cost can grow quickly if every visitor gets a dedicated stream.

## Risks
### GPU cost
- Dedicated GPU per concurrent interactive stream can be expensive.
- Idle GPU time is wasteful.
- Mitigation: keep Web3D default, start Unreal only for high-intent premium walkthroughs, auto-shutdown idle streams.

### Latency
- User movement and camera quality depend on region, TURN usage and network quality.
- Mitigation: deploy streamers near primary market, use TURN only when needed, add graceful fallback to Web3D model.

### Scaling
- Pixel Streaming is not normal static web scaling.
- One streamer is usually one interactive session unless designed otherwise.
- Mitigation: session broker, queueing, scheduled demos, shared guided mode for sales calls.

### Mobile bandwidth
- High-quality stream can be too heavy on mobile networks.
- Mitigation: default Web3D mobile view, expose Unreal as premium walkthrough button, cap resolution/bitrate, show bandwidth warning.

### Content pipeline
- High-fidelity archviz assets require clean naming, LODs and material variants.
- Mitigation: define asset naming convention before importing many houses.

### Product truthfulness
- Unreal visuals can look more final than the quote/config actually is.
- Mitigation: clear disclaimer: visualization preview, final engineering and site review required.

## First POC target
POC name:
- `Compact Timber 40 Premium Interior Walkthrough`

POC success criteria:
- Unreal level opens reliably locally.
- Pixel Streaming connects from Web route locally.
- Variant manager applies one payload:
  - `compact-timber-40`
  - natural timber facade
  - pitched roof
  - small terrace
  - premium interior preview
- User can walk/orbit inside living zone, bedroom and bathroom core.
- Visual quality is clearly better than Web3D but not unstable.
- Fallback remains Web3D Modular Home demo if stream is unavailable.
- No quote PII is sent to Unreal.

Suggested POC route later:
- `/expo-3d?homeDemo=1&homeUnrealPreview=1`

Suggested stream id later:
- `home-compact-timber-40-premium-poc`

## Implementation sequence after approval
1. Prepare Unreal Compact Timber 40 level and assets.
2. Add local Unreal variant JSON loader or command-line config.
3. Verify packaged or editor Pixel Streaming with local signaling.
4. Add frontend review-only launcher behind explicit flag.
5. Add backend session reservation context for home visualizer.
6. Add staging GPU deployment only after local stability.
7. Add UX fallback and cost guardrails.

## Non-goals for now
- No production Pixel Streaming enablement.
- No autoscaling implementation.
- No user-uploaded BIM/IFC to Unreal conversion.
- No AI drawing conversion.
- No real quote submission coupling.
- No payment flow.
- No mobile default Unreal launch.
