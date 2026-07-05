# LT52A Wall Grid And Openings Source Plan

## Purpose
This document is the reset point for rebuilding LT52A correctly.

It replaces ad-hoc Unreal patching with a drawing-driven source plan.

This is the geometry source of truth for:
- wall axes
- opening axes
- 600 mm rhythm logic
- corner and opening heavy-member logic

## Base Envelope
- overall length: `10.20 m`
- overall width: `5.10 m`
- wall height: `2.70 m`
- nominal wall build-up baseline: `150 mm`
- terrace depth: `2.40 m`

## Exterior Sides
- `South`: terrace side
- `North`: rear side
- `West`: left side
- `East`: right side

## Confirmed Exterior Openings For Current Direction

### South
- `SD1`
  - type: terrace slider
  - width: `3.00 m`
  - height: `2.20 m`
  - x-range: `2.70 -> 5.70`
- `W2`
  - type: main terrace-side window
  - width: `2.40 m`
  - height: `1.20 m`
  - x-range: `6.90 -> 9.30`

### North
- `W1`
  - type: rear main window
  - target width: same class as terrace-side `W2`
  - current working x-range for rebuild pass: `2.25 -> 4.65`
- `W3`
  - type: smaller functional rear window
  - current working x-range for rebuild pass: `7.05 -> 7.75`

### West
- current exterior direction:
  - no separate visible side entrance door in the exterior presentation model

### East
- no current exterior openings

## Structural Layer Logic

### Layer A: Primary Members
Use heavy members for:
- all 4 outer corners
- both sides of each exterior opening
- all opening heads

Working class:
- `95 x 145 mm`

### Layer B: Main Vertical Stud Grid
Use vertical studs at:
- `600 mm` centers

Working class:
- `45 x 145 mm`

These sit:
- behind the outer membrane/support layer
- not in front of the facade boards

### Layer C: Outer Membrane / Boarding Layer
Visible from gaps only if facade is not fully tight.

For current exterior realism:
- do not show as bright wall plane
- keep dark and visually recessive

### Layer D: Horizontal Secondary Battens
Use as facade support layer above the membrane.

Current visual role:
- create depth between hidden wall build-up and visible facade boards

### Layer E: Finished Exterior Boards
Visible exterior boards:
- vertical
- tight to each other
- no fence-like gaps
- no crossing over glazing

## Critical Opening Rules

### Rule 1
Primary opening posts must sit under the facade layer, not proud of it.

### Rule 2
Opening frame outer face should align with the finished facade logic, not float outside it.

### Rule 3
No random narrow board remnants at either side of a window or door.

### Rule 4
Opening composition must be symmetric around the opening axis unless intentionally offset by design.

### Rule 5
Facade boards terminate into opening trim logic cleanly.

## 600 mm Rhythm Strategy
The `600 mm` rhythm must not be applied blindly from one corner across the whole wall.

Instead:
1. establish corner heavy members
2. establish opening heavy members
3. split each wall into framing bays between those elements
4. distribute vertical studs per bay
5. avoid leftover micro-bays at window sides

That means:
- the wall is a set of controlled framing bays
- not one continuous naive stud array

## Rebuild Order

### Pass 1
Rebuild the wall axes and primary members only:
- corners
- opening jamb members
- heads
- backing wall fields

### Pass 2
Rebuild structural bays:
- vertical stud bays at `600 mm`
- yellow insulation fields
- dark outer membrane/support layer

### Pass 3
Rebuild facade support and finish:
- horizontal battens
- vertical exterior boards with no gaps

### Pass 4
Rebuild openings:
- flush frame position
- terrace slider composition
- rear windows
- trim stops

### Pass 5
Rebuild terrace and roof only after the wall system is correct

## Immediate Next Step
Stop pretending the current exterior script is close to done.

Use this document to:
1. rebuild wall bays by side
2. rebuild openings by side
3. only then return to Unreal visual validation
