Date: 2026-04-18
Scope: final premium visual acceptance for the frozen Expo release-candidate state.
Goal: convert the remaining visual `WARN` and `FAIL` gates into explicit evidence.

## Required Capture Set

Each capture must be taken from the current frozen Expo runtime, not from stale screenshots.

### World

1. `left-skyline`
- focus: left skyline silhouette
- verify:
  - crown readability
  - tower/mass hierarchy
  - no obvious junk blocks dominating the skyline

2. `arrival-corridor`
- focus: main arrival axis
- verify:
  - gateway hierarchy
  - ground/plane continuity
  - premium first impression

3. `mid-city`
- focus: core civic zone
- verify:
  - landmark hierarchy
  - screen density discipline
  - skyline rhythm

4. `right-skyline`
- focus: right signal cluster
- verify:
  - signal/readability hierarchy
  - no clutter collapse
  - premium skyline balance

5. `rear-stadium`
- focus: rear campus + stadium transition
- verify:
  - perimeter continuity
  - no tone-fighting surfaces
  - no obvious seam or floating geometry

### Booths

6. `booth-row-arrival`
- focus: booth rhythm in arrival-facing district
- verify:
  - row spacing reads intentional
  - common booths do not look like broken placeholders
  - premium booths are visibly stronger

7. `booth-row-core`
- focus: booth rhythm in a central district
- verify:
  - tier mix reads commercially differentiated
  - no collision or reserve overlap
  - premium+ frontage reads deliberate

8. `tier-comparison`
- focus: one common, one premium, one elite, one hero in comparable framing
- verify:
  - common < premium < elite < hero is visually obvious
  - hero reads as flagship
  - elite is stronger than premium, not just a resized duplicate

### Screens

9. `screen-separation-near`
- focus: one booth screen and one nearby world screen
- verify:
  - booth screen reads as sponsor presentation
  - world screen reads as city signal / landmark / wayfinding
  - no semantic duplication

10. `screen-separation-far`
- focus: medium-to-far city view with world screens visible
- verify:
  - distant world screens do not flood the city with text noise
  - booth screens remain local presentation objects
  - premium glow is disciplined, not aggressive

## Evidence Rules

- Use PNG where possible.
- Keep one file per required capture.
- Name files with the capture IDs above.
- If a capture fails, keep it anyway and mark the issue instead of retaking until it hides the defect.

## Pass/Fail Mapping

- `RA-001` World integrity:
  - requires `left-skyline`, `arrival-corridor`, `mid-city`, `right-skyline`, `rear-stadium`
- `RA-002` Ground and perimeter continuity:
  - requires `arrival-corridor`, `rear-stadium`
- `RA-003` Booth placement integrity:
  - requires `booth-row-arrival`, `booth-row-core`
- `RA-004` Booth tier differentiation:
  - requires `tier-comparison`
- `RA-005` Screen ownership/readability:
  - requires `screen-separation-near`, `screen-separation-far`
- `RA-014` Premium city/booth visual quality:
  - requires the full capture set

## Review Output Format

For each capture:

- `capture_id`
- `status`: `PASS` | `WARN` | `FAIL`
- `notes`

At the end:

- overall recommendation
- blocking defects
- acceptable warnings
