# Compact Timber 40 Unreal Import Checklist

Status: import checklist for the first local Unreal walkthrough package.

## Target Content Root

Import into:

- `/Game/Warpala/ModularHomes/CompactTimber40/`

Folder targets:

- `Levels/`
- `Blueprints/`
- `Collision/`
- `Data/`
- `Lighting/`
- `Materials/`
- `Meshes/Exterior/`
- `Meshes/Furniture/`
- `Meshes/Interior/`
- `Meshes/Modules/`

## Pre-Import Checks

- locked payload copied into `Data/`
- mesh naming matches the production task list
- material slot checklist reviewed
- Unreal project opens without fallback content path confusion

## Static Mesh Import

- import scale verified against meters-to-centimeters convention
- normals/tangents verified
- collision strategy decided per mesh group
- auto-generate collision disabled where custom simple collision is planned
- mesh pivots verified for placement and variant swapping

## Material Assignment

- assign stable master/material instance chain
- verify slot names exactly
- apply locked premium material defaults
- reserve non-POC variant material instances without enabling unsupported variants

## Level Assembly

- create `Level_ModularHome_CompactTimber40_POC`
- place root actor `BP_CT40_ModularHomeRoot`
- attach roof, terrace, windows and furniture variants for locked payload
- set up bounded walkthrough pawn
- add camera presets:
  - `exterior-hero`
  - `walkthrough-entry`
  - `living-kitchen`
  - `bedroom`
  - `bathroom-core`
  - `terrace`

## Data And Validation

- create or load `DA_CT40_LockedPocPayload`
- verify all locked payload tokens map cleanly
- unsupported variants log non-PII warnings only
- confirm no Pixel Streaming setup is required for local acceptance

## Import Acceptance

Accept the import only when:

- level opens cleanly
- locked payload matches visible result
- interior is walkable
- camera presets are useful
- no missing material slots remain
- no default Unreal placeholder materials remain on visible hero surfaces
