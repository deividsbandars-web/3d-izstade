# LT52A Exterior Generator Rewrite Plan

## Purpose
This document defines how the current LT52A Unreal exterior generator must be rewritten.

It is not another facade tweak plan.
It is the actual rewrite plan for moving from the current monolithic placeholder-heavy script to a controlled architectural exterior generator.

Current generator file:
- `C:\3d\scripts\unreal\build_lt52a_exterior_shell_session.py`

## Why Rewrite Is Needed
The current script mixes:
- shell generation;
- cladding generation;
- opening treatment;
- terrace hacks;
- roof fixes;
- cleanup logic.

That made iteration possible, but it is now the wrong structure for:
- correct facade logic;
- correct framing hierarchy;
- correct roof logic;
- correct opening symmetry;
- later technical cutaway mode.

## Rewrite Goals
The rewritten generator must:
1. build a clean finished exterior only
2. separate primary timber members from field cladding
3. generate opening-aware cladding cleanly
4. treat terrace and roof as first-class systems, not afterthoughts
5. support future technical cutaway as a separate generator or mode

## What Can Stay
The following low-level helpers are still useful:
- `ensure_flat_material`
- `load_cube`
- `local_x`
- `local_y`
- `spawn_block`
- `wall_x`
- `wall_y`
- `subtract_intervals`

These are utility functions and do not need conceptual redesign first.

## What Must Change

### 1. `destroy_previous()`
Current problem:
- too many cleanup assumptions;
- mixes old import cleanup with new generated asset cleanup.

Rewrite direction:
- split into:
  - `destroy_generated_exterior_only()`
  - optional legacy cleanup helper

### 2. `build_shell()`
Current problem:
- shell, plinth, and openings are too entangled;
- wall faces are treated too much like final facade.

Rewrite direction:
- split into:
  - `build_plinth()`
  - `build_primary_wall_faces()`
  - `build_primary_posts_and_headers()`

### 3. `build_cladding()`
Current problem:
- cladding still behaves too procedurally;
- board stop logic is not strong enough as a first-class system;
- corner and opening discipline is too weak.

Rewrite direction:
- split into:
  - `build_corner_posts()`
  - `build_opening_posts()`
  - `build_field_cladding_by_face()`
  - `build_cladding_stop_logic()`

### 4. `build_opening_frames()`
Current problem:
- too much detail for some openings;
- not enough reusable logic;
- north/south openings handled too differently.

Rewrite direction:
- split into:
  - `build_window_frame_units()`
  - `build_slider_units()`
  - `build_rear_opening_units()`
  - `build_opening_trim()`

### 5. `build_terrace_structure()`
Current problem:
- terrace evolved through many fixes;
- still not isolated enough as its own subsystem.

Rewrite direction:
- split into:
  - `build_terrace_primary_frame()`
  - `build_terrace_decking()`
  - `build_terrace_stairs()`
  - `build_terrace_edge_members()`

### 6. `build_roof_edge_and_entry_trim()`
Current problem:
- roof and entry were coupled incorrectly;
- roof type changes became dangerous.

Rewrite direction:
- split into:
  - `build_roof_planes()`
  - `build_roof_edges_and_fascia()`
  - `build_entry_zone()`

### 7. `build_entry_portal()`
Current problem:
- entry zone is currently too patch-like.

Rewrite direction:
- fold it into a dedicated:
  - `build_entry_zone()`

## Target Generator Structure
Recommended top-level structure:

1. `build_material_library()`
2. `destroy_generated_exterior_only()`
3. `build_plinth()`
4. `build_primary_wall_faces()`
5. `build_primary_posts_and_headers()`
6. `build_cladding_system()`
7. `build_opening_system()`
8. `build_terrace_system()`
9. `build_roof_system()`
10. `build_entry_zone()`
11. `finalize_viewports_and_save()`

## Primary Exterior Systems

### System A: Primary Structure
Must create:
- corner posts
- opening jamb posts
- opening heads
- primary wall backing faces

### System B: Finished Facade
Must create:
- vertical cladding boards
- clean corner stops
- clean opening stops
- no glazing crossover

### System C: Openings
Must create:
- terrace-side slider
- terrace-side window
- rear main window
- rear small functional window

Must avoid:
- fake crossbars unless explicitly requested
- random lower panel logic where not desired

### System D: Terrace
Must create:
- flush terrace frame
- even deck board spacing
- centered stairs
- stable edge members

### System E: Roof
Must create:
- correct roof type
- roof planes above wall top
- fascia
- clean roof perimeter edges

Must avoid:
- roof planes inside the house volume
- white placeholder plane look

## Immediate Rewrite Order

### Rewrite Pass 1
Stabilize structure only:
- plinth
- wall faces
- corner posts
- opening posts
- opening heads

### Rewrite Pass 2
Rebuild finished facade:
- vertical cladding
- board stop logic
- corner trim logic

### Rewrite Pass 3
Rebuild openings:
- rear facade windows
- terrace-side window
- terrace-side slider

### Rewrite Pass 4
Rebuild terrace:
- frame
- deck
- stairs

### Rewrite Pass 5
Rebuild roof:
- roof type
- roof planes
- fascia
- edges

## Validation Discipline
After each pass, validate from:
- `LT52A_Camera_Exterior`
- `LT52A_Camera_Overview`
- `LT52A_Camera_Terrace`
- `LT52A_Camera_Roof`

No pass should be called finished without this.

## What Must Wait Until After Rewrite
These should not be faked before the rewrite is stable:
- exact cut list
- exact board-by-board saw schedule
- engineering-approved header sizing
- exact roof timber schedule

## Expected Outcome
After this rewrite, LT52A exterior generation should finally become:
- predictable;
- architecturally consistent;
- easier to review;
- ready for a separate technical cutaway generator.

