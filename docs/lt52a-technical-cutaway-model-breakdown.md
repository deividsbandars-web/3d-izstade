# LT52A Technical Cutaway Model Breakdown

## Purpose
This document defines what the LT52A technical cutaway mode must contain as actual model groups.

It is used to show construction logic clearly without corrupting the finished exterior.

## Technical Mode Goal
Show:
- perimeter beams;
- main vertical studs at `600 mm`;
- opening posts;
- insulation fields;
- board layers;
- roof framing concept.

Do not try to make technical mode also be the hero exterior.

## Technical Model Groups

### Group 1: Floor / Base Framing
Objects:
- `SM_LT52A_Floor_Perimeter_Beams`
- `SM_LT52A_Floor_Joists`
- `SM_LT52A_Floor_Blocking`

### Group 2: Primary Wall Structure
Objects:
- `SM_LT52A_Cutaway_Corner_Posts`
- `SM_LT52A_Cutaway_Opening_Posts`
- `SM_LT52A_Cutaway_Headers`

### Group 3: Main Stud Grid
Objects:
- `SM_LT52A_Studs_North`
- `SM_LT52A_Studs_South`
- `SM_LT52A_Studs_East`
- `SM_LT52A_Studs_West`

Rule:
- vertical studs
- `600 mm` centers

### Group 4: Insulation
Objects:
- `SM_LT52A_Insulation_North`
- `SM_LT52A_Insulation_South`
- `SM_LT52A_Insulation_East`
- `SM_LT52A_Insulation_West`

### Group 5: Board Layers
Objects:
- `SM_LT52A_Outer_Board_Layer`
- `SM_LT52A_Inner_Board_Layer`

Optional later:
- `SM_LT52A_Service_Cavity_Layer`

### Group 6: Roof Structure
Objects:
- `SM_LT52A_Roof_Main_Members`
- `SM_LT52A_Roof_Secondary_Members`
- `SM_LT52A_Roof_Board_Layer`

### Group 7: Opening Assembly
Objects:
- `SM_LT52A_Cutaway_Window_W1`
- `SM_LT52A_Cutaway_Window_W2`
- `SM_LT52A_Cutaway_Window_W3`
- `SM_LT52A_Cutaway_Door_SD1`

## Cutaway Presentation Rules
- remove one or more wall/roof faces strategically;
- keep assembly readable;
- highlight the difference between structural members and finish boards;
- do not leave random floating fragments.

## Validation Goals
Technical cutaway is acceptable when:
- stud spacing is obvious;
- opening reinforcement is obvious;
- insulation fields are obvious;
- board layers are obvious;
- it can support later drawing and schedule work.

