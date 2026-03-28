# ADR-0002: Expo Collision Layer Policy

## Status
Accepted

## Context

The sponsor boulevard runtime mixes imported scenic assets, sponsor-facing architecture, and movement/collision logic in one assembled scene.
That creates repeated regressions:

- skyline meshes accidentally affecting spawn framing
- scenic shells reading like gameplay blockers
- booth collision extending beyond visible architecture

## Decision

The release-safe sponsor runtime uses three collision roles:

1. `gameplay-critical`
   - explicit booth blocker segments
   - future intentional route blockers only

2. `scenic-non-colliding`
   - `realistic_city.glb`
   - `CuratedSkylineRing`
   - `ExpoLandmarkLayer`
   - `DistrictAnchorNodes`
   - facade decor and imported skyline depth

3. `containment-only`
   - sponsor walk-region logic
   - route shaping that keeps users out of backstage and backside-only areas

## Consequences

- Imported scenic assets must not become implicit blockers.
- User movement is controlled by sponsor route containment plus explicit architectural blockers.
- Future skyline/landmark additions must pass corridor clearance validation before entering the release path.
