# GALA Wood House Generator

This repository now includes a Blender add-on at `blender_addon/wood_house_generator`.

The single source of truth is `config/house_config_GALA.yaml` plus the five CSV schedules in `data/`. The previous 7-degree integrated-roof direction is intentionally not referenced: validation requires a 30-degree roof, two factory transport modules without the permanent roof, and `LOAD-3` for the permanent roof package.

Every generated physical object receives the requested custom properties:

`part_id`, `category`, `element_type`, `material`, `grade`, `width_mm`, `height_mm`, `cut_length_mm`, `quantity`, `module_id`, `wall_id`, `construction_stage`, `structural_status`, `approved_for_purchase`, `cut_left_deg`, `cut_right_deg`, `visible_cover_mm`, `rip_width_mm`, `transport_load`, `notes`.

Scene states are created exactly as:

- `FACTORY_MODULE_A`
- `FACTORY_MODULE_B`
- `LOAD_1`
- `LOAD_2`
- `LOAD_3`
- `SITE_MODULES_JOINED`
- `ROOF_TRUSSES_INSTALLED`
- `WEATHER_TIGHT`
- `ASSEMBLED_COMPLETE`

Validation enforces that `ENGINEER` and `PROVISIONAL` parts are not approved for purchase. Facade boards, roof panels and terrace boards are represented as factory-cut parts so site work remains numbered assembly, fastening, sealing and service connection only.

## Prompt 2 Architecture

The exact architectural plan is stored under `architecture` in `config/house_config_GALA.yaml`:

- Wall/module envelope: `10200 x 5000 mm`
- Finished facade width: `4920 mm`
- Module A: `Y 0..2500`
- Module B: `Y 2500..5000`
- Flat finished ceiling cassette in each module
- Terrace: `2400 x 2100 mm`, outside north facade, `X 3200..5600`
- Bathroom: `X 5150..7200`, internal `Y 450.7..2350`
- Bedroom partition: `X 7200`
- Remaining space: open kitchen/living/entrance

`data/openings_schedule.csv` now includes `start_mm`. The add-on derives framing members, sheathing segments and numbered facade-board segments from each rough-opening row, so changing an opening schedule row changes those generated physical objects.

## Prompt 3 Structure And Covers

Floor cassettes per module now include:

- GL24h `90x220` perimeter beams
- Two `10200 mm` longitudinal beams
- `2280 mm` end beams
- C24 `45x220` joists, `2280 mm` cut, maximum `600 mm` centres
- Two blocking rows
- Doubled joists near `X 5100` and `X 7200`
- `22 mm` OSB subfloor

Exterior walls now include `2700 mm` frame height, `45 mm` bottom plate, double top plates, C24 `45x195` studs cut `2565 mm`, maximum `600 mm` centres, and opening framing derived from `data/openings_schedule.csv`.

Ceiling cassettes now include C24 `45x145` joists at maximum `600 mm` centres, `2175 mm` clear cut length, GL24h `90x195` seam beam, `45 mm` service cavity, `12.5 mm` gypsum and target clear room height of approximately `2628 mm`. Attic insulation remains deferred until the permanent roof is weather-tight.

Temporary weather protection now has a reusable reinforced PVC cover, removable ridge/cross battens, `WEATHER_COVER_WATER_TEST`, `WEATHER_COVER_REMOVAL_SEQUENCE`, and a validation rule that modules are never left open to rain.

## Prompt 4 Wall Physics And Facade

The wall layer stack is now encoded in exact inside-to-outside order:

1. `12.5 mm` gypsum
2. `45x45` service battens with optional wool
3. Variable-permeability airtight vapour-control membrane
4. `12 mm` structural plywood/OSB
5. `45x195` C24 studs with mineral wool
6. `45x50` external cross battens with `50 mm` mineral wool
7. `25 mm` diffusion-open windproof wood-fibre board
8. `25x50` vertical ventilation battens
9. `25x50` horizontal cladding battens with `20 mm` drainage breaks
10. `21x145` vertical tongue-and-groove cladding with `135 mm` effective cover

Validation explicitly prohibits an exterior vapour barrier and requires open vertical drainage/ventilation paths.

Facade details now include natural/lightly toned vertical timber, black timber window/door trims, black eave/gable trims, black `70x70` corner profiles with two `23x25` rebates, hidden `3-5 mm` movement gaps, and a black sliding `45x120` end-wall module seam cover with EPDM.

The add-on calculates `calculated_individual_facade_board_segment` parts for every wall board from rough-opening locations. Each generated board segment stores its own cut length, wall id, visible cover and rip width.

## Prompt 5 Full Factory-Built Trusses

The roof truss contract now uses 18 full factory-built A trusses, not split half-trusses by default.

- Truss IDs: `TRUSS-01` through `TRUSS-18`
- Bearing span: `5000 mm`
- Full width with eave tails: `5500 mm`
- Pitch: `30 degrees`
- Ridge rise: `1443.4 mm`
- Profile bounding height: approximately `1587.7 mm`
- Spacing: `600 mm` along the `10200 mm` house length
- Transport: each full truss lengthwise in `LOAD-3`

Conceptual blanks remain ENGINEER-gated and `approved_for_purchase=false`:

- Two C24 `45x220 x 3175.4 mm` top chords
- One C24 `45x220 x 5000 mm` bottom chord
- One C24 `45x145 x 1443.4 mm` king post
- Two C24 `45x145 x 1250 mm` conceptual struts

The add-on generates a full-size truss jig, double-sided gusset proxy objects, erection numbering, conceptual crane lift points, `TRUSS_TEMPORARY_BRACING`, and `TRUSS_PERMANENT_BRACING`. It does not generate screw patterns or gusset dimensions because no engineer approval file is present.

Validation requires that a standing truss state is paired with temporary bracing.

## Prompt 6 Gables And Roof Finish

The roof package now includes two full factory-finished triangular gable panels:

- `GABLE-WEST` and `GABLE-EAST`
- Base `5000 mm`
- Height `1443.4 mm`
- C24 `45x95` conceptual framing
- Structural board
- Ventilation battens
- Individually cut vertical timber cladding
- Black raking trim
- Transported flat/lengthwise in `LOAD-3`

Roof finish package:

- Overall projection `10700 x 5500 mm`
- `250 mm` eave and gable overhangs
- `18 mm` structural roof deck
- Compatible underlay/separation layer
- Black standing-seam or equivalent metal roof
- Ventilated eave intake, ventilated ridge outlet and insect mesh
- Gutters on both eaves
- Four provisional downpipes
- Snow guards above entrance and terrace

## Prompt 7 Terrace LEGO Cassette

The terrace is modeled as one transportable cassette in `LOAD-3`, sized `2400 x 2100 mm`.

Frame schedule:

- two long perimeter beams: `45 x 145 x 2400 mm`, `C24/UC3`, `PROVISIONAL`
- two end beams: `45 x 145 x 2010 mm`, `C24/UC3`, `PROVISIONAL`
- five internal joists: `45 x 145 x 2010 mm`, `C24/UC3`, `PROVISIONAL`
- joist lines at `0, 400, 800, 1200, 1600, 2000, 2400 mm`

Deck schedule:

- `17` boards, all `2400 mm` long
- `15` full boards: `28 x 120 x 2400 mm`
- `2` edge boards: `28 x 102 x 2400 mm`
- `16` gaps at `6 mm`
- all boards are numbered and predrilled

Assembly aids are represented as physical objects: two removable shallow-marked guide strips and sixteen reusable `6 mm` spacers. Deep board grooves or notches in structural joists are explicitly forbidden by configuration and validation.

## Prompt 8 Logistics Simulation

The transport plan remains three loads:

- `LOAD-1`: Module A, `10200 x 2500 x approximately 3187 mm`
- `LOAD-2`: Module B, same transport envelope
- `LOAD-3`: full roof, gable, terrace and completion pack

`LOAD-3` includes 18 full A trusses stacked with the `5500 mm` span along the trailer length, two finished gable panels, gable-overhang ladder frames, roof deck and roof finish, gutters/flashings, attic insulation, the preassembled terrace cassette and numbered boards.

The Blender add-on generates logistics proxy geometry for:

- transport racks
- protection zones
- load centre-of-gravity proxies
- crane exclusion zones
- seven assembly-sequence animation markers
- temporary-to-permanent bracing sequence markers

`data/logistics_manifest.csv` is the load manifest for the logistics package and is exported to `exports/cutlists/logistics_manifest_export.csv`.

The logistics layer is explicitly not an approval engine. Configuration and validation state that geometric validation does not grant legal transport, crane operation or structural approval.

## Prompt 9 Exports And Validation

Cut-list exports in `exports/cutlists/`:

- `individual_parts.csv`
- `grouped_cut_list.csv`
- `materials_boq.csv`
- `truss_schedule.csv`
- `facade_board_schedule.csv`
- `terrace_board_schedule.csv`
- `load_manifest.csv`
- `structural_items_requiring_approval.csv`

Drawing sheets in `exports/drawings/`:

- `A01_floor_plan.md`
- `A02_30_degree_section.md`
- `A03_four_facades.md`
- `K01_floor_framing.md`
- `K02_full_truss_jig.md`
- `K03_roof_truss_plan.md`
- `K04_ceiling_cassette.md`
- `D01_wall_section.md`
- `D02_timber_corner.md`
- `D03_module_seam.md`
- `L01_three_load_plan.md`
- `T01_terrace_cassette.md`
- `S01_assembly_sequence.md`

Static validation fails on module transport width or height breaches, transverse `5500 mm` truss trailer assignment, clear height below `2500 mm`, truss spacing above `600 mm`, missing truss engineer approval reference, missing temporary/permanent bracing, weather-cover removal before `LOAD-3`, exterior vapour-tight membranes, blocked facade ventilation and duplicate part IDs.

Blender FBX export also runs a pre-export generated-object check for duplicate generated `instance_id` values, object dimensions against generated dimension metadata, invalid transforms and invalid mesh normals. `source_part_id` remains stable for the source schedule item; repeated scene-state copies use unique `instance_id` values.

## Prompt 10 Unreal Import

The Unreal handoff uses separate FBX packages instead of a combined mesh:

- `Module_A_Floor`
- `Module_A_Walls`
- `Module_A_Ceiling`
- `Module_A_Envelope`
- `Module_B_Floor`
- `Module_B_Walls`
- `Module_B_Ceiling`
- `Module_B_Envelope`
- `Temporary_Covers`
- `Roof_Trusses`
- `Roof_Bracing`
- `Gable_Panels`
- `Roof_Deck`
- `Roof_Finish`
- `Terrace_Frame`
- `Terrace_Boards`
- `Windows_Doors`

Blender export settings are locked in the add-on and manifest: apply rotation and scale, `Z Up`, `-Y Forward`, selected package objects only, no combined all-object export, preserved part IDs and material slots, UCX collision only for appropriate packages, and a separate `Calibration_1m_Cube.fbx`.

Package selection is explicit by element type and canonical source collection. Fabrication layouts, transport layouts and logistics proxy layouts are excluded from Unreal FBX package selection. Empty package selection is a hard export error.

Unreal content root is `/Game/WoodHouse_GALA`. The handoff mirror under `unreal/Content/WoodHouse_GALA/` defines import settings, material instances, Data Layers, levels and controller Blueprint specs. `exports/fbx/pre_unreal_import_report.json` is the generated pre-import placeholder. `unreal/import_woodhouse_gala.py` writes the post-runtime `unreal/Content/WoodHouse_GALA/Validation/import_validation_report.json` after importing the package set and verifying the calibration cube as `100 x 100 x 100 cm`.

## Round 11 Defect Closure

Round 11 addresses the critical Round 10 review defects:

- generated objects now carry `source_part_id`, unique `instance_id` and `source_collection`
- pre-export duplicate checks use `instance_id`, not repeated source IDs
- FBX package export filters out `FABRICATION_PARTS`, `LOAD_1`, `LOAD_2`, `LOAD_3` and `LOGISTICS_SIMULATION`
- package filters use exact element type sets/prefixes, not partial text search
- missing or zero-byte FBX packages fail export instead of being skipped
- Blender FBX export enables `use_custom_props=True`
- `Module_A_Envelope` and `Module_B_Envelope` include module envelope, wall layers and facade geometry
- detailed east end walls `E-A` and `E-B` are generated
- wall layers and facade boards are segmented around openings
- the module seam cover is modeled as vertical west/east end-wall covers at the module split
- `grade` is no longer populated from approval status in generated architectural objects
- Unreal scale settings use one import scale value, `1.0`, with the 1 m cube expected as `100 cm`
- Round 11 ZIP is allowlisted and uses forward-slash archive paths

## Round 12 Runtime Export Hardening

Round 12 addresses the remaining Round 11 runtime blockers:

- `_safe_id()` preserves signed tokens as `_PLUS_` and `_MINUS_` and appends a stable hash of the original text, preventing gusset face `+1/-1` collisions
- FBX export now works on temporary object copies, applies rotation/scale to the copies, exports them, then removes the temporary objects and mesh data
- the canonical Blender scene is no longer mutated by `_export_selected_fbx()`
- `Calibration_1m_Cube` is idempotent; old calibration cube objects are removed before the export cube is recreated
- interior partitions are assigned to Module A or Module B and included in the module wall FBX packages
- terrace removable guide strips and reusable spacers are included in `Terrace_Frame`
- generated Blender-object `grade` values no longer use approval statuses such as `APPROVED` or `PROVISIONAL`
- existing JSON handoff files are written as UTF-8 without BOM
- Unreal importer now fails if an FBX task returns no imported asset paths
- Unreal importer now attempts material instance and level setup where the target Unreal version exposes compatible Editor Python APIs, and reports skipped/version-dependent work explicitly

## Round 13 Geometry And Package Selection

Round 13 addresses the remaining physical-geometry and FBX selection defects:

- `Roof_Trusses` now exports `double_sided_gusset_proxy` objects from `TRUSS_TEMPORARY_BRACING` without also pulling temporary bracing members into the truss package
- `Roof_Deck` and `Roof_Finish` use two 30-degree sloped roof planes per layer instead of one horizontal full-width slab
- gable panels are generated as triangular prism mesh objects, not rectangular cube proxies
- gable panels now include individual vertical cladding board geometry and ventilation battens
- black raking trims are rotated to the roof pitch
- module envelope FBX selection excludes solid `architectural_module_envelope` proxies
- `Temporary_Covers` exports physical covers and battens only from the canonical water-test collection, excluding duplicate factory/load copies and the removal-sequence control proxy
- `Windows_Doors` exports simplified frame/glass/door/threshold geometry and excludes `rough_opening_void` markers
- the Blender UI export operator checks for the `GALA_GENERATED` collection instead of global default scene objects
- Unreal import validation is intentionally conservative: missing material masters, incomplete Data Layer creation or Blueprint JSON-only handoff prevents a production `passed` status

## Round 14 Roof And Opening Geometry Correction

Round 14 addresses the roof valley and connected geometry defects:

- roof south plane uses `+30°`, north plane uses `-30°`
- roof plane centres are `Y=1125` and `Y=3875`, with eaves at `Y=-250/5250` and ridge at `Y=2500`
- roof plane centre height is derived from eave/ridge geometry, approximately `Z=3349.9 mm`
- truss top-chord rotations are flipped to match the corrected roof pitch
- roof gutters, ridge outlet, downpipes and snow guards are positioned from the corrected roof geometry
- gable panels are placed on wall end planes `X=0` and `X=10200`; ladder frames remain at the overhang planes
- west gable cladding and ventilation battens use the negative-X exterior side
- triangular gable prism face ordering is corrected for exterior-facing normals
- window and door frames are generated from four profile members, not one solid blocking cube
- production `Roof_Trusses` excludes truss jig, crane lift point proxies and erection number markers

## Round 15 Roof/Truss Synchronisation

Round 15 addresses the remaining runtime blocker and roof alignment defects:

- fixed the snow-guard tuple unpacking bug by iterating `guard_id, x, y, length, rotation`
- roof layers use normal-offset placement instead of global-Z-only offsets
- truss top-chord centres use the same 5500 mm roof width projection as the roof planes: `Y=1125/3875`
- truss top-chord vertical centre is derived from eave/ridge geometry instead of the old king-post-centred approximation
- downpipe height and centre are calculated from bottom/top Z so the top reaches the gutter line
- black gable raking trim signs are corrected to `-60°/+60°` from vertical and centred from roof geometry
- gable ladder frames are generated as fly rafters plus cross ties instead of one solid slab

## Round 16 Roof X Reference And Deck Bearing

Round 16 addresses the roof X offset and deck/truss bearing defects:

- roof geometry now defines `west_edge_x=-250`, `east_edge_x=10450` and `center_x=5100`
- `create_roof_plane()` takes an explicit `center_x_mm` instead of deriving X from `length_mm / 2`
- roof deck, underlay, metal finish, gutters and ridge outlet use the corrected `center_x`
- downpipes use the corrected roof edge references instead of the old `10550 mm` east-side coordinate
- roof deck centre is offset from the truss top-chord centre by `top_chord_half_depth + deck_half_thickness = 119 mm` along the roof normal
- underlay and metal roof offsets are calculated from adjacent layer half-thicknesses, avoiding unintended gaps
- gable ladder cross ties now span from fly rafter to end truss: west `-250..0`, east `10200..10450`
- gable ventilation battens are limited by the triangular panel height at their Y position

## Round 17 Shared Roof Reference Plane

Round 17 rebases production roof geometry onto the truss top-chord centre plane:

- `_roof_geometry()` now defines `center_z/eave_z/ridge_z` as the top-chord centre line, not the old lower roof proxy line
- truss top chords and roof package layers share the same roof reference plane
- roof deck centre is placed at `top_chord_depth / 2 + deck_thickness / 2` above the truss top-chord centre along the roof normal
- underlay and metal roof layers stack from the deck using adjacent layer half-thicknesses
- ridge outlet, gutters, downpipes and snow guards are referenced to the final metal roof layer rather than the lower base line
- Round 17 regression checks project the deck centre back onto the roof normal and require `119 mm` above the truss top-chord centre
- Numbered gable-overhang ladder frame assemblies: `GABLE-LADDER-WEST`, `GABLE-LADDER-EAST`

## Round 18 True 30-Degree Roof Reference

Round 18 corrects the shared roof reference plane itself:

- `_roof_geometry()` now treats `1443.4 mm` as the rise from the wall bearing line to the ridge over the 2500 mm half-span
- the outer eave top-chord centre is dropped by `250 * tan(30 degrees) = 144.34 mm`
- the top-chord centre reference points are now: south outer eave `Y=-250, Z=2665.7`, wall bearing `Y=0, Z=2810.0`, ridge `Y=2500, Z=4253.4`
- the roof top-chord centre plane is a true 30-degree plane from outer eave to ridge, with south/north centres at `Y=1125/3875, Z=3459.5`
- `_create_single_truss()` uses the same roof reference helper as the roof package, removing the separate hardcoded truss plane
- roof deck, underlay, metal roof, ladder frame, ridge, gutters and snow guards continue to derive from the shared reference plane and layer-normal offsets
- Round 18 regression checks verify the 30-degree slope, the bearing-line Z coordinate and the 119 mm deck offset above the truss top-chord centre

## Round 19 Roof Layer Boundaries And Production Filtering

Round 19 addresses the remaining production blockers around roof-layer clipping and FBX package content:

- roof deck, underlay and metal planes are clipped to a defined `80 mm` ridge opening instead of inheriting accidental gaps from normal-offset placement
- layer profile generation now keeps the nominal eave edge at `Y=-250/5250` and trims the ridge edge to `Y=2460/2540`
- `_roof_layer_z_at_y()` evaluates the shifted roof plane equation using both the Y and Z components of the normal offset
- gutters, downpipes, ridge outlet and snow guards are now referenced to the actual shifted metal roof plane, not a base plane plus Z-only offset
- `Roof_Trusses` production FBX selection excludes `truss_king_post` and `truss_conceptual_strut` until their member lines are generated from engineer-approved node intersections
- gable cladding boards are generated as mesh strips with sloped top cuts; boards crossing the ridge use two top facets instead of a horizontal top
- the LOAD-3 gable transport proxy is a triangular prism rather than a full rectangular block
- delivery text files are normalized to UTF-8 without BOM

## Round 20 Ridge Side And Gable Profile Unification

Round 20 addresses the ridge-helper and gable cut-list/model mismatch:

- `_roof_layer_z_at_y()` now requires an explicit `side` argument, so a south roof query at the ridge cannot silently switch to the north slope equation after normal-offset Y shifting
- the ridge outlet is positioned from both clipped metal ridge-edge coordinates and uses their averaged Z value
- gable cladding profiles are generated by one shared `gable_cladding_board_profiles()` function used by both the Blender mesh and cut-list generation
- fronton cladding now produces 37 boards per gable, 74 total; the invalid extra `CLADDING-038` fragments are not generated
- gable board `cut_length_mm` is the long edge, not the centre-point height
- `gable_cladding_export.csv` includes `short_edge_mm`, `long_edge_mm` and `slope_direction` fields for factory cutting
- edge gable boards are triangular-prism mesh strips when one top edge reaches zero height, avoiding degenerate zero-area end faces
- LOAD-3 gable transport panels are rotated flat, with the 120 mm panel thickness becoming the transport height

## Round 21 Final Geometry Risk Fixes

Round 21 addresses the remaining static geometry risks found after Round 20 verification:

- gable cladding mesh face winding now follows the exterior side, so WEST boards expose the negative-X face and EAST boards expose the positive-X face
- LOAD-3 flat gable transport panels are placed in separate Y lanes and no longer overlap in the transport layout
- the ridge opening value is now a physical clear opening, not a centreline gap
- Round 22 supersedes the Round 21 ridge-opening formula; see below for the corrected rotated-cuboid projection
- regression checks cover the physical ridge-opening compensation and flat gable-panel transport spacing

## Round 22 Rotated Roof-Layer Clear Opening

Round 22 corrects the physical ridge-opening calculation and the remaining geometry risks:

- roof-layer centreline ridge opening now uses the rotated cuboid Y projection: `clear_opening + layer_thickness * sin(pitch)`
- the 30-degree centreline gaps are now deck `89.0 mm`, underlay `81.5 mm` and metal `97.5 mm`
- those gaps preserve an actual `80.0 mm` physical clear opening after layer thickness is projected into world Y
- snow guards are offset along the roof normal instead of being lifted only in global Z
- gable layer X stacking is explicit: structural panel, ventilation battens, cladding and raking trim are placed outward without interpenetration
- `Roof_Trusses` is explicitly marked `incomplete_engineering_representation` in the Unreal FBX package manifest until engineer-approved king-post and strut member-line geometry is added

## Round 23 Runtime Validation Readiness

Round 23 closes the remaining static blockers before Blender/Unreal runtime validation:

- fixed the ridge clipped-slope regression expectation to `3124.0 mm`
- LOAD-3 flat gable panels are raised so the 120 mm panel thickness sits on top of the transport platform instead of half below `Z=0`
- gable ventilation battens, cladding and raking trim now touch in X without unintended inter-layer gaps
- raking trim Y/Z centreline is tied to the gable panel edge, not the higher roof top-chord centreline
- full A-truss production geometry remains intentionally incomplete and still requires engineer-approved king-post/strut member-line geometry before final production acceptance

## Round 24 Deterministic Handoff Files

Round 24 addresses the reproducibility conflict between packaged handoff files and generator output:

- tests now run non-Blender exports in an isolated temporary project copy instead of overwriting the repository root
- a reproducibility regression compares generated `exports/` and `unreal/Content/WoodHouse_GALA` handoff files against the delivered files
- JSON handoff comparison is semantic, so formatting-only differences do not hide or create failures
- Unreal handoff JSON files are aligned with the current generator contract: 11 material instances, `site_assembly` and `water_test` Data Layers, and no stale `transport_simulation` or `export` Data Layers
- FBX package manifests include full package metadata such as `category`, `module_id`, collision policy and `Roof_Trusses` `incomplete_engineering_representation`
- root-level export tests no longer mutate delivered files during pytest

No roofing material is cut on site. The metal roof uses the supplier panel schedule.
