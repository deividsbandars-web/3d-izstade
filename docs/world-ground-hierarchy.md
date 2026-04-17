## World Ground Hierarchy

This document defines the visible ground ownership contract for the expo world.

### Primary visible ground owners

1. `WorldGroundPlane.tsx`
- Owns the global fallback base under the entire expo world.
- Must remain visually quiet and continuous.
- Must not be used to fake local district identity.

2. `WorldCityPlanes.tsx`
- Owns structural city-facing surface patches that are large enough to read as intentional district ground.
- Must not own decorative filler planes whose only purpose is to mask tone mismatch.
- Any remaining city planes should be treated as structural overlays, not a second global base.

3. `ExpoRearCampus.tsx`
- Owns rear-campus and stadium-adjacent ground shells plus localized perimeter connectors.
- Stadium bowl/ring surfaces belong here, not in city plane owners.
- Connectors must stay local to stadium continuity, not bleed into general city ground ownership.

4. `WorldPromenade.tsx`
- Promenade is currently disabled as a visible ground owner.
- If reintroduced later, it must own only explicit promenade-specific surfaces, not another global center strip.

### Non-owners / forbidden patterns

- Decorative helper planes (`carpet`, `ribbon`, `band`, `threshold`, `connector`, `pocket`, `pad`, `gallery`, `terminal`) are not primary visible ground owners.
- Ground continuity must not depend on overlapping same-color filler planes from multiple files.
- Booth work must not modify these files unless a reserve-compatibility shim is explicitly required by plan.

### Temporary quarantine still present

- `WorldCityPlanes.tsx` still uses heuristic decorative-plane suppression and area-threshold filtering.
- This is transitional debt and will be replaced in `P4-T2` with typed plane roles from source builders.

### Target end state

- One quiet global base.
- One explicit structural city-plane layer.
- One localized rear-campus/stadium ground layer.
- Optional promenade surfaces only if contractually needed and visually distinct.
