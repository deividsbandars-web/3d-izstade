# Compact Timber 40 Unreal POC Asset Production Kickoff

Status: active production kickoff for the first Unreal Modular Home POC. This round prepares asset structure and production checklists only. It does not enable Pixel Streaming, Unreal runtime routing, backend integration or public deployment.

## Locked Scope

Use the accepted locked payload from:

- `docs/modular-home-unreal-compact-timber-40-production-task.payload.json`

Locked POC target:

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

## Production Deliverables In This Round

This kickoff creates:

- source asset intake structure for Blender/material/reference work;
- Unreal content target structure for the first POC package;
- material slot checklist;
- Blender blockout checklist;
- Unreal import checklist;
- screenshot target checklist.

## Source Asset Intake Root

Working intake root:

- `assets-intake/modular-home/unreal-poc/compact-timber-40/`

Expected use:

- `blender/`
- `blender/exports/`
- `blender/references/`
- `materials/`
- `payload/`
- `review/`
- `screenshots/`
- `textures/`

## Unreal Content Target Root

Target Unreal content root:

- `WarpalaUE5/Content/Warpala/ModularHomes/CompactTimber40/`

Expected use:

- `Blueprints/`
- `Collision/`
- `Data/`
- `Levels/`
- `Lighting/`
- `Materials/`
- `Meshes/Exterior/`
- `Meshes/Furniture/`
- `Meshes/Interior/`
- `Meshes/Modules/`

## Execution Order

1. Confirm the locked payload remains unchanged.
2. Build the Blender blockout with correct dimensions and origin.
3. Export stable modular meshes using the agreed naming scheme.
4. Import into Unreal target folders without renaming slot-critical meshes.
5. Create material instances with stable slot names.
6. Assemble the local walkthrough level.
7. Capture the screenshot target list for review.

## Non-Goals

Do not do these in this round:

- Pixel Streaming setup
- web route integration
- live payload fetch
- admin/backend integration
- family/sauna Unreal production
- engineering BIM or production cut list export
