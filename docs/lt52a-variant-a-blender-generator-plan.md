# LT52A Variant A Blender Generator Plan

## Purpose
This plan defines the first practical path for rebuilding LT52A Variant A without relying on the simplified Rev C GLB shell.

The goal is to generate a clean architectural base model from structured data, then move that model into Unreal for premium visualization and later detail expansion.

This is a modeling pipeline document, not a structural approval or construction permit package.

## Source of Truth
- `C:\Users\esauk\OneDrive\Documents\Downloads\LT52_luksus_modulu_maja_3_planojuma_varianti_RevB.pdf`
- `C:\Users\esauk\OneDrive\Documents\Downloads\LT52A_luksus_koka_modulu_maja_RevC_pilna_pakete.zip`
- `C:\3d\tmp\lt52a_revc_unpack\LT52A_luksus_koka_modulu_maja_RevC_data.json`
- `C:\3d\tmp\lt52a_revc_unpack\LT52A_luksus_koka_modulu_maja_RevC_rasejumi.pdf`
- `C:\3d\tmp\lt52a_revc_unpack\LT52A_luksus_koka_modulu_maja_RevC_BOM_cutlist.xlsx`

## Product Basis
Chosen prototype: `Variant A`

Reason:
- recommended in Rev B;
- aligned with Rev C room data;
- transport-friendly;
- low prototype risk relative to more complex alternatives.

## Generator Scope
The first generator pass must create:
- two-module base footprint;
- floor slab / floor cassette shell;
- exterior wall shell;
- interior partitions;
- low-slope roof shell;
- terrace deck shell;
- controlled window and door openings;
- simple room-zone placeholders;
- simple furniture placeholders for premium layout reading.

The first pass must not pretend to create:
- full engineering joinery;
- every board;
- full stud-by-stud verified structure;
- fabrication-ready cut list geometry.

## Geometry Target
### Overall
- assembled size: `10.20m x 5.10m`
- terrace: `10.20m x 2.40m`
- wall height: `2.70m`
- wall thickness: `0.15m`
- module count: `2`
- module width: `2.55m`

### Room program
- living + kitchen: `6.50 x 5.10`
- bedroom: `3.70 x 2.55`
- bathroom: `2.30 x 2.55`
- technical / wardrobe: `1.40 x 2.55`

## Generator Phases
### Phase 1: Architectural shell
- floor base
- outer walls
- inner walls
- roof
- terrace
- openings

### Phase 2: Premium interior blockout
- kitchen line
- island
- dining block
- sofa block
- bed block
- wardrobe block
- bathroom fixtures as simple blocks
- technical cabinet block

### Phase 3: Presentation cleanup
- mesh naming
- material assignment placeholders
- logical collection grouping
- export-safe transforms

### Phase 4: Detail expansion
- facade board system
- terrace beam and deck logic
- roof edge logic
- window frame logic
- construction layer groups

## Blender Structure
Use these collections:
- `LT52A`
- `LT52A/Shell`
- `LT52A/Openings`
- `LT52A/Interior`
- `LT52A/Furniture`
- `LT52A/Terrace`
- `LT52A/Reference`

Use these object naming prefixes:
- `SM_` for export mesh objects
- `REF_` for helper/reference objects

## Export Intent
Preferred export targets:
- `.blend` as editable source
- `.fbx` for Unreal controlled import
- optional `.glb` for preview only

## Constraints
- no freeform editing in the generator itself;
- use controlled dimensions from Variant A source data;
- keep pivots and naming clean for Unreal import;
- keep mesh split logical, not fake-overdetailed.

## Success Criteria
The generator is good enough when:
- it produces the correct footprint and room arrangement;
- it clearly looks like the intended Variant A house;
- Unreal can import it as a clean architectural POC;
- later detail passes can attach to stable object names.

## Immediate Next Deliverables
1. create the first Blender Python generator script;
2. generate shell + room partitions + terrace + openings;
3. export first `Rev D base shell`;
4. import into Unreal as replacement for the simplified Rev C shell.
