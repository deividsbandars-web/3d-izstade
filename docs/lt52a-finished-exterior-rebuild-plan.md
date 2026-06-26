# LT52A Finished Exterior Rebuild Plan

## Purpose
This plan defines how LT52A must look from outside as a finished timber modular house.

It replaces the current incorrect mixed facade logic with a controlled finished-exterior modeling direction.

This is for:
- Unreal exterior rebuild;
- future Blender/CAD rebuild;
- later presentation renders;
- alignment with the intended construction language.

## Exterior Goal
The outside must read as:
- a real timber modular house;
- strong perimeter framing logic;
- clear corner and opening hierarchy;
- premium but buildable facade;
- no exposed insulation;
- no random framing artifacts visible through the facade.

## Exterior Structural Reading
Visible from outside:
- thick perimeter corner posts / timber members;
- thick opening-side posts;
- clean head framing around openings;
- finished vertical cladding boards;
- proper terrace structure;
- proper roof planes and edges;
- dark or controlled base/plinth.

Not visible from outside:
- mineral wool;
- interior stud layer;
- internal service cavity framing;
- hidden inner board layers.

## Exterior Wall Composition
### Visual Layer Order
1. base/plinth
2. finished facade board layer
3. corner posts / trim posts
4. opening frame members
5. roof edge / fascia

### Primary Member Hierarchy
Use visually heavier members at:
- all four house corners;
- all exterior door sides;
- all window sides;
- major terrace opening boundaries.

Recommended visual class for heavy members:
- `90 x 140 mm` or `95 x 145 mm`

### Finished Cladding Direction
Use:
- vertical finish boards

Reason:
- aligns with the desired premium timber modular look;
- makes corner control and opening trimming cleaner;
- visually separates primary posts from field cladding.

Important:
- these visible vertical facade boards are not the same thing as the primary load-bearing stud grid;
- the stud grid remains behind the facade and belongs to technical cutaway logic.

## Opening Rules
### Window And Door Principles
- left and right side treatment must be symmetric unless intentionally different;
- no accidental tiny filler strips at one side;
- no boards crossing glazing;
- no fake grille/cross pattern unless explicitly requested;
- no external sill shelf unless intentionally designed.

### Terrace Side
Terrace facade must remain clean:
- large slider `SD1`
- companion window `W2`
- no cross on the terrace-side window
- premium but simple trim logic

### Rear Side
Rear facade now targets:
- one medium-large main window matching terrace-side width logic
- one secondary smaller window where functionally justified
- no unnecessary extra micro-window clutter

## Corner Logic
Use:
- clear corner post / corner trim strategy

Do not use:
- messy board wrapping around corners;
- overlapping boards from both directions;
- accidental visible board ends on both faces.

## Terrace Exterior Rules
Terrace must:
- sit flush to the house without a gap;
- have even decking rhythm;
- have centered stairs where stairs are used;
- have structurally believable posts / beams / edge;
- avoid random uneven deck board spacing.

## Roof Exterior Rules
Roof must:
- sit on the house, not inside it;
- have one clear consistent roof type;
- show clean roof board or roof-skin logic;
- show correct fascia / edge treatment;
- not read as a white placeholder plane.

## What Must Be Removed From Current Exterior
- placeholder benches / technical exterior blocks;
- random helper masses;
- improvised opening artifacts;
- fake crossing members in glazing zones;
- incorrect mono-pitch leftovers or internal roof planes;
- mismatched trim depths around openings.

## Exterior Rebuild Sequence
1. define clean wall perimeter faces
2. place heavy corner posts
3. place heavy jamb posts for all openings
4. define opening head logic
5. generate field cladding between primary members
6. resolve board stops around openings
7. resolve corner stops
8. rebuild terrace
9. rebuild roof edge
10. validate from exterior cameras

## Validation Cameras
Every exterior change must be reviewed from:
- `LT52A_Camera_Exterior`
- `LT52A_Camera_Overview`
- `LT52A_Camera_Terrace`
- `LT52A_Camera_Roof`

No exterior pass should be called complete without these checks.

## Success Criteria
Finished exterior is acceptable when:
- it clearly reads as a timber house;
- posts/openings/corners have hierarchy;
- no board crosses any glazing zone;
- no random narrow strips appear around openings;
- terrace reads as intentional structure;
- roof reads as a real roof, not a placeholder.
