# LT52A Technical Cutaway Mode Plan

## Purpose
This plan defines the separate LT52A technical mode used to show real construction logic.

It exists because the finished exterior must stay clean, while the technical model must reveal:
- framing;
- insulation;
- layer build-up;
- opening structure.

## Core Rule
Technical cutaway is not the same thing as finished exterior.

The model must switch between:
- `Finished Exterior`
- `Technical Cutaway`

## What Technical Cutaway Must Show
### Primary Frame
- perimeter beams
- corner posts
- opening side posts
- major head members

### Repeating Structure
- regular framing centers at `600 mm`
- consistent rhythm along walls
- controlled edge conditions at corners and openings

Clarified interpretation:
- this `600 mm` rhythm applies to the main vertical structural wall studs;
- finished outer facade boards are another layer and must not be modeled as if they are the same members.

### Insulation
- insulation fields between framing members
- visually separate from timber
- no claim of exact vapor/moisture layer engineering unless later specified

### Layer Logic
Show conceptual layers:
1. outer finish board layer
2. outer structural boarding or sheathing layer
3. framed insulation zone
4. optional internal service layer
5. inner boarding layer

## Working Interpretation Of User Construction Vision
The user described:
- large thick beams around perimeter;
- heavier members at corners and opening edges;
- repeating rhythm at `600 mm`;
- insulation between structural members;
- interior and exterior boarded faces.

To make that buildable in modeling terms, technical cutaway should show:
- heavy structural perimeter members;
- main stud system at `600 mm`;
- layered wall section;
- insulation infill volumes;
- board faces on each side of structure.

## Recommended Working Wall Assembly For Technical View
This is a modeling assembly, not an engineer-approved final wall:

### Primary Perimeter Members
- `95 x 145 mm` visual class

### Main Stud Grid
- `45 x 145 mm` visual class
- at `600 mm` centers

### Optional Service / Secondary Layer
- `45 x 45 mm` or `45 x 70 mm` visual class if needed later

### Insulation
- mineral wool / stone wool fields between studs

### Board Layers
- outer board/sheathing layer
- inner board layer

## Opening Construction Logic
Each opening must show:
- paired or strengthened jamb logic
- head member
- clean edge to cladding boards
- no random sliver framing

If one side creates a tiny filler strip:
- shift board layout or opening trim module
- do not leave an accidental scrap strip in the model

## Technical Mode Output Objects
Suggested object groups:
- `SM_LT52A_Perimeter_Beams`
- `SM_LT52A_Corner_Posts`
- `SM_LT52A_Opening_Posts`
- `SM_LT52A_Studs_North`
- `SM_LT52A_Studs_South`
- `SM_LT52A_Studs_East`
- `SM_LT52A_Studs_West`
- `SM_LT52A_Insulation_North`
- `SM_LT52A_Insulation_South`
- `SM_LT52A_Insulation_East`
- `SM_LT52A_Insulation_West`
- `SM_LT52A_Outer_Board_Layer`
- `SM_LT52A_Inner_Board_Layer`

## Technical Validation Goals
Technical cutaway is acceptable when:
- the wall build-up is easy to read;
- the 600 mm rhythm is obvious;
- corner logic is obvious;
- opening framing is obvious;
- insulation placement is obvious;
- it looks like a real assembly, not random cubes.

## Next Technical Deliverables
1. wall section draft
2. corner detail draft
3. opening detail draft
4. framing schedule draft
5. build sequence draft
