# LT52A Wall System And Facade Spec

## Purpose
This document fixes the architectural direction for LT52A wall construction, facade modeling, and future drawing logic.

It is the working specification for:
- Unreal exterior modeling;
- technical cutaway modeling;
- future board/stud/bracing/cut planning;
- later drawing package preparation.

This is not a structural approval package and not a final engineering cut list.

## Core Correction
The current LT52A exterior is architecturally wrong because it mixes:
- finished facade appearance;
- partial framing logic;
- placeholder window/door treatment.

The model must be rebuilt around a real wall system.

## Important Modeling Rule
There must be two different representations:

### 1. Finished Exterior
What a real finished house looks like from outside.

Visible from outside:
- finished timber facade boards;
- corner posts / trim;
- window and door perimeter framing;
- roof edge;
- plinth/base;
- terrace.

Not visible from outside:
- insulation;
- inner stud grid;
- internal service framing;
- internal wool fill.

### 2. Technical Cutaway / Assembly View
Used for understanding construction and later build planning.

Visible in cutaway:
- perimeter beams;
- corner posts;
- opening posts;
- regular framing rhythm;
- insulation layers;
- inner and outer boarding layers.

This distinction is mandatory. If we try to show everything in one closed exterior model, the facade will stay wrong.

## Source Basis
- `C:\3d\tmp\lt52a_revc_unpack\LT52A_luksus_koka_modulu_maja_RevC_data.json`
- LT52A current project basis:
  - overall length: `10.20 m`
  - overall width: `5.10 m`
  - module width: `2.55 m`
  - wall height: `2.70 m`
  - terrace depth: `2.40 m`
  - wall thickness in current source data: `150 mm`

## Working Interpretation Of User Vision
User-described architectural intent is interpreted as:

1. Strong perimeter beam logic.
2. Heavier timber members at:
- corners;
- window sides;
- door sides;
- key perimeter transitions.
3. Repeating structural rhythm at `600 mm`.
4. Insulation-filled wall build-up.
5. Clean, symmetric board stopping logic around openings and corners.
6. No random narrow strips around openings.
7. Facade boards must terminate intentionally, not overlap incorrectly across corners.

## Clarified Framing Interpretation
The intended wall framing interpretation is now fixed as:

- main load-bearing wall studs are vertical;
- stud spacing target is `600 mm` centers;
- exterior finish cladding is also vertical, but it is a separate outer finish layer;
- the finished cladding must not be confused with the structural stud grid behind it.

This means the model must distinguish between:
- structural vertical studs behind the wall surface; and
- visible finished vertical facade boards on the exterior.

## Proposed LT52A Technical Wall Logic
This is the working model logic until an engineer-approved structural package replaces it.

### A. Primary Perimeter Members
Use heavier members at:
- 4 main external corners;
- both sides of every exterior opening;
- major wall start/end conditions.

Working visual size for primary members:
- `90 x 140 mm` or `95 x 145 mm` visual class

Note:
- actual final structural section must be confirmed against load path, roof system, transport loads, and local code.

### B. Regular Structural Rhythm
Use repeating framing centers at:
- `600 mm`

Working interpretation:
- main wall stud rhythm at `600 mm` centers;
- secondary support/rainscreen rhythm also resolved to `600 mm` logic where relevant.

### C. Insulation Zones
Technical cutaway view should show:
- wall insulation between main framing members;
- secondary insulation/service layer if used;
- no exposed insulation in finished exterior mode.

Visual material placeholders:
- stone wool / mineral wool;
- optional service cavity insulation if used in detailed assembly mode.

### D. Board Layers
For modeling purposes, separate these layers conceptually:

1. Exterior finish boards
2. Structural/boarding layer beneath
3. Insulated framing zone
4. Interior boarding layer

The exact legal/structural wall assembly can vary, but the model must stop pretending a single white slab is the wall.

## Facade Design Rules

### Exterior Finished Facade
Recommended finished facade direction:
- vertical finished cladding boards;
- visible board rhythm;
- proper corner trims;
- window/door trim boards;
- no external sill shelves unless intentionally designed.

### Corner Logic
Boards must not fake-wrap badly across corners.

Use one of these clean strategies:
- trimmed corner post system; or
- alternating return-board logic.

For LT52A, use:
- `corner post / corner trim` strategy

Reason:
- cleaner;
- easier to model;
- easier to build;
- better for transportable premium module appearance.

### Opening Logic
At each exterior opening:
- equal visual stopping logic left/right;
- equal head treatment;
- no tiny accidental leftover strip on one side;
- no board overlap across glazing;
- no asymmetric random sliver pieces.

For Unreal model:
- opening framing must be generated from opening centerlines and board spacing rules,
- not hand-hacked.

## Opening Framing Rules

### Exterior Window / Door Edge Members
Use heavier visual framing members at:
- left jamb;
- right jamb;
- head;
- sill only if intentionally designed.

User direction so far:
- no unnecessary outside sill shelf look

Therefore:
- finished exterior should avoid protruding sill boards unless explicitly needed.

### Symmetry Rule
For each opening:
- left and right board stop distances should be intentionally balanced;
- if one side would create a tiny strip, the whole board layout must shift or be recomposed.

This must be solved algorithmically in the next facade generator pass.

## Terrace Side
Terrace side must remain premium and simple:
- large sliding door opening;
- companion window without fake crossbars;
- terrace decking aligned and flush to house;
- stair run centered and even;
- terrace edge logic resolved cleanly.

## Roof Direction
The roof currently remains unresolved.

What is clear from user direction:
- roof must not be a random internal plane;
- roof must read as real timber roof construction;
- raised center / V-form intent has been referenced.

Next roof pass must decide one clear architectural system and stay consistent:
- visible exterior roof planes;
- correct ridge/high point location;
- correct relation to wall top;
- no roof planes inside the house volume.

## What The Unreal Model Must Become

### Finished Exterior Mode
Should show:
- correct facade board rhythm;
- strong corner timber logic;
- proper opening surrounds;
- corrected terrace;
- corrected roof.

### Technical Cutaway Mode
Should show:
- perimeter beams;
- corner posts;
- opening posts;
- 600 mm stud rhythm;
- insulation fields;
- internal board layers.

This is the right way to express the real architecture without corrupting the exterior view.

## What Is Still Missing Before Build-Ready Drawings
The following cannot be honestly claimed yet:
- engineer-approved span design;
- transport load verification;
- fastening schedule;
- moisture layer specification;
- final fire/acoustic compliance;
- final timber species/grade lock;
- exact production cut optimization.

## Correct Next Deliverables

### 1. Unreal / Modeling
- rebuild LT52A exterior as finished facade only;
- create separate technical cutaway wall assembly mode;
- stop mixing these two modes.

### 2. Drawing Logic
Prepare:
- wall section concept;
- opening framing section concept;
- corner detail concept;
- terrace edge concept;
- roof section concept.

### 3. Material / Timber Planning
Prepare controlled schedules for:
- primary perimeter members;
- opening posts;
- repeating studs at `600 mm`;
- exterior cladding boards;
- interior board layers;
- terrace framing;
- roof framing members.

### 4. Construction Workflow
Prepare step-by-step build workflow:
- floor frame;
- perimeter beams;
- studs/opening posts;
- insulation;
- boarding layers;
- facade cladding;
- openings;
- terrace;
- roof.

## Immediate Next Step
Next round should not continue random facade patching.

Next round should do:
1. `finished exterior facade rebuild`
2. `technical cutaway wall assembly mode`
3. `draft wall section / framing schedule document`
