# LT52A Finished Exterior Model Breakdown

## Purpose
This document converts the LT52A exterior architecture direction into a concrete modeling breakdown.

It defines:
- object groups;
- facade logic;
- opening logic;
- terrace logic;
- roof logic;
- validation order.

This is the bridge between concept/spec and actual modeling work.

## Exterior Modeling Goal
Build a finished exterior that reads as:
- a premium timber modular house;
- structurally believable;
- visually clean around corners and openings;
- compatible with later technical cutaway and schedule work.

## Model Layers

### Layer 1: Base / Plinth
Objects:
- `SM_LT52A_Plinth_Base`
- `SM_LT52A_Plinth_Front`
- `SM_LT52A_Plinth_Rear`
- `SM_LT52A_Plinth_Left`
- `SM_LT52A_Plinth_Right`

Purpose:
- separate house body from ground;
- avoid floating white slab look;
- provide clean dark base.

### Layer 2: Primary Exterior Structure
Objects:
- `SM_LT52A_Corner_Post_NW`
- `SM_LT52A_Corner_Post_NE`
- `SM_LT52A_Corner_Post_SW`
- `SM_LT52A_Corner_Post_SE`
- `SM_LT52A_Window_Post_*`
- `SM_LT52A_Door_Post_*`
- `SM_LT52A_Header_*`

Purpose:
- establish hierarchy;
- control facade stops;
- define opening symmetry;
- make the exterior read as timber-built.

### Layer 3: Exterior Wall Faces
Objects:
- `SM_LT52A_WallFace_North`
- `SM_LT52A_WallFace_South`
- `SM_LT52A_WallFace_East`
- `SM_LT52A_WallFace_West`

Purpose:
- provide continuous backing face behind cladding;
- do not present as final visible facade by themselves.

### Layer 4: Finished Cladding Boards
Objects by facade side:
- `SM_LT52A_Cladding_N_*`
- `SM_LT52A_Cladding_S_*`
- `SM_LT52A_Cladding_E_*`
- `SM_LT52A_Cladding_W_*`

Purpose:
- visible vertical timber facade;
- intentional board rhythm;
- proper cut/stop logic around openings and corners.

### Layer 5: Opening Frames
Objects:
- `SM_LT52A_Frame_W1`
- `SM_LT52A_Frame_W2`
- `SM_LT52A_Frame_W3`
- `SM_LT52A_Frame_SD1`
- `SM_LT52A_Frame_D1` only if the west-side exterior door remains in the final design

Purpose:
- give exterior openings correct depth and symmetry;
- stop boards cleanly;
- support later glazing/door units.

### Layer 6: Glazing / Door Units
Objects:
- `SM_LT52A_Glass_W1`
- `SM_LT52A_Glass_W2`
- `SM_LT52A_Glass_W3`
- `SM_LT52A_Door_SD1_Left`
- `SM_LT52A_Door_SD1_Right`
- `SM_LT52A_Door_D1` only if retained in product direction

Purpose:
- actual visible opening content;
- no fake grille pattern unless explicitly requested.

### Layer 7: Terrace
Objects:
- `SM_LT52A_Terrace_Frame`
- `SM_LT52A_Terrace_Posts`
- `SM_LT52A_Terrace_Beams`
- `SM_LT52A_Terrace_DeckBoards_*`
- `SM_LT52A_Terrace_Stairs`
- `SM_LT52A_Terrace_Stair_Stringers`

Purpose:
- present believable terrace structure;
- keep stairs centered and even;
- keep deck flush to house.

### Layer 8: Roof
Objects:
- `SM_LT52A_Roof_Plane_A`
- `SM_LT52A_Roof_Plane_B`
- `SM_LT52A_Ridge`
- `SM_LT52A_Roof_Fascia_Front`
- `SM_LT52A_Roof_Fascia_Rear`
- `SM_LT52A_Roof_Fascia_Left`
- `SM_LT52A_Roof_Fascia_Right`
- optional visible roof board rhythm objects

Purpose:
- keep roof outside the house volume;
- express final roof type clearly;
- remove white placeholder roof look.

## Exterior Opening Logic

### Rule 1
No visible random sliver pieces around openings.

### Rule 2
Each opening must have balanced left/right board stop logic.

### Rule 3
No cladding board can cross glazing or door leaf area.

### Rule 4
No unnecessary external sill shelf.

### Rule 5
Terrace-side window `W2` must stay clean:
- no decorative cross;
- no fake split panel unless explicitly required.

## Rear Facade Logic
Current intended rear composition:
- `W1` medium-large main window
- `W3` smaller secondary functional window
- no extra clutter window

This rear facade should read calmer than the terrace side.

## Corner Logic
Use:
- dedicated corner posts
- cladding boards terminating into those posts

Do not use:
- board overlap from both facades
- fake wrapped board geometry

## Exterior Board Rhythm Draft
Working visual rule:
- board width class: `120 mm`
- visible gap class: `8 to 12 mm`
- board thickness class: `20 to 25 mm`

This is a modeling rule, not yet final procurement data.

## Validation Sequence
Every exterior rebuild pass must be checked in this order:
1. `LT52A_Camera_Exterior`
2. `LT52A_Camera_Overview`
3. `LT52A_Camera_Terrace`
4. `LT52A_Camera_Roof`

## Immediate Rebuild Order
1. rebuild wall perimeter and primary posts
2. rebuild rear facade with new opening logic
3. rebuild terrace-side opening logic
4. rebuild vertical cladding boards with proper stops
5. rebuild terrace evenly
6. rebuild roof form and fascia
7. validate from cameras

