# Web3D Codex Review System Plan

Date: 2026-04-29
Goal: create a repeatable review system where ChatGPT plans, Codex implements, and Web3D changes are inspectable, attributable, and visibly verifiable.

## 1. Target Outcome

The target system should let an agent or reviewer:

- enter named world review locations
- inspect nearest world objects and clicked stacks
- see exact object ids
- know which file owns the object
- know which planning seam generated it
- know what diagnostics currently exist
- know whether the correct fix seam is planning, runtime, interaction, or route layer

This should reduce:

- blind edits
- visual no-effect edits
- wrong-layer fixes
- wasted manual review

## 2. What Already Exists

Existing foundations:

- operator mode via `?operator=1`
- review zones and start views
- center-screen and click-stack inspection
- target basket highlighting
- section/layer toggles
- planning diagnostics for screens and booths

This means the review system should be an extension, not a rewrite.

## 3. What Is Missing

### 3.1 World Object Registry

Needed output per object:

- `id`
- `layer`
- `position`
- `sourceKind`
- `sourceFile`
- `sourceFunction`
- `planningZone`
- `interactionOwner`
- `diagnosticOwners`
- `safeEditSeam`

### 3.2 Review Export Contract

Needed outputs:

- machine-readable JSON snapshot for the current world
- machine-readable JSON snapshot for predefined review locations
- deterministic nearest-object reports

### 3.3 Location-Based Review Recipes

Needed:

- arrival
- left marquee
- center spine
- right marquee
- tower cluster
- rear campus
- selected booth-focused views

Each recipe should define:

- camera start
- expected visible layers
- expected key object ids
- known issues to watch

### 3.4 Fix Classification

Every issue should classify into exactly one owner bucket:

- `scene-data`
- `world-contract`
- `planning-geometry`
- `planning-screen`
- `runtime-world-render`
- `runtime-interaction`
- `booth-presentation`
- `routes-and-navigation`
- `diagnostics-only`

## 4. Recommended Build Order

### Phase A: World Object Registry First Slice

Build a pure registry export from canonical plan + booth placements:

- no runtime mutation
- no rendering dependency
- JSON export only

### Phase B: Operator Export Bridge

Expose current operator inspection targets and nearest targets as structured JSON.

### Phase C: Location Snapshot Recipes

Add fixed review recipes for the most important city locations.

### Phase D: Diagnostic Aggregation

Combine:

- screen orientation
- screen bounds
- screen overlap
- booth frontality

into a single review report.

### Phase E: Source Ownership Overlay

Display:

- object id
- owner file
- owner seam
- fix hint

for the current center/click target.

## 5. Correct Operating Model

### ChatGPT role

- architecture reviewer
- plan author
- issue classifier
- phase designer

### Codex role

- code explorer
- implementer
- validator
- bundle builder

### Human role

- approve priority and product direction
- reject broad redesign
- inspect visual impact where necessary

This is the right split because it keeps architecture thinking separate from code execution.

## 6. Definition Of A Good Web3D Fix

A fix is good only if all of these are true:

- visible or measurable effect exists
- ownership seam is correct
- no unrelated layer was changed
- diagnostics still pass or become stronger
- the change can be explained in one sentence:
  - what changed
  - where it lives
  - why that seam is correct

If not, the fix is weak even if it compiles.

## 7. Immediate Next Practical Step

The best next step for the review system is:

- `SCREEN SURFACE DIAGNOSTIC SCAN CORRECTION`

Reason:

- current screen invalid-position incident was traced to a scan invocation seam
- until the scan path is trustworthy, higher-level automated geometry review remains noisy

## 8. After That

Best follow-on sequence:

1. `WORLD OBJECT REGISTRY REVIEW`
2. `OPERATOR INSPECTION EXPORT REVIEW`
3. `LOCATION SNAPSHOT REVIEW`
4. `SCREEN-BOOTH PROXIMITY REVIEW` after booth-local geometry seam is clarified

