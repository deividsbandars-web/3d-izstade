# LT52A Variant A Generator Task Pack

## Goal
Build a parametric architectural base model for LT52A Variant A that replaces the simplified Rev C GLB as the visual source for Unreal.

## Priority Order
### Task 1: Base shell
- create floor base
- create outer walls
- create inner walls
- create roof shell
- create terrace shell

### Task 2: Openings
- place exterior door `D1`
- place terrace slider `SD1`
- place windows `W1`, `W2`, `W3`, `W4`
- place interior doors `ID1`, `ID2`, `ID3`

### Task 3: Interior readability
- place kitchen line
- place kitchen island
- place dining table block
- place sofa block
- place bed block
- place wardrobe block
- place shower/WC/vanity blocks
- place technical cabinet block

### Task 4: Export hygiene
- apply transforms
- confirm object names
- confirm logical collections
- confirm material slots
- confirm world origin and pivots

## Required Output Objects
### Shell
- `SM_LT52A_Floor_Base`
- `SM_LT52A_ExteriorWalls`
- `SM_LT52A_InteriorWalls`
- `SM_LT52A_Roof_Base`
- `SM_LT52A_Terrace_Base`

### Openings
- `SM_LT52A_Opening_D1`
- `SM_LT52A_Opening_SD1`
- `SM_LT52A_Opening_W1_A`
- `SM_LT52A_Opening_W1_B`
- `SM_LT52A_Opening_W2`
- `SM_LT52A_Opening_W3`
- `SM_LT52A_Opening_W4`
- `SM_LT52A_Opening_ID1`
- `SM_LT52A_Opening_ID2`
- `SM_LT52A_Opening_ID3`

### Interior blocks
- `SM_LT52A_Kitchen_Line_Block`
- `SM_LT52A_Kitchen_Island_Block`
- `SM_LT52A_Dining_Block`
- `SM_LT52A_Sofa_Block`
- `SM_LT52A_Bed_Block`
- `SM_LT52A_Wardrobe_Block`
- `SM_LT52A_Shower_Block`
- `SM_LT52A_WC_Block`
- `SM_LT52A_Vanity_Block`
- `SM_LT52A_Technical_Block`

## Known Limits
- opening positions are first-pass architectural placements;
- roof shape is presentation-grade, not engineering-grade;
- no studs, cassettes, or facade boards in the first pass;
- furniture is blockout only;
- not fabrication-ready.

## Upgrade Path After First Pass
1. split shell by module;
2. split exterior walls by facade side;
3. add facade board system;
4. add window frame depth;
5. add terrace beam/deck logic;
6. add interior finish layers;
7. add construction grouping for BOM linkage.
