# GALA Furniture Clearance Spec

This document defines furniture and fixture clearance rules for the GALA modular-home construction renderer.

It is not product visual acceptance and does not authorize staging deploy.

## Clearance Rules

- No furniture mesh may intersect exterior or interior wall volumes.
- No bathroom fixture may intersect exterior or interior wall volumes.
- Minimum clearance from walls: `0.03m`, unless the object is intentionally wall-mounted and documented.
- Wall-mounted objects must have explicit mount rules and must sit outside the wall-core volume.
- Furniture bounding boxes must be checked against wall, opening, and collision volumes.
- Objects must not be visible through walls from standard routes.
- Placement anchors must be owned in one layout/model file.
- Dimensions must be owned in one furniture/fixture model file or documented in the same layout model.

## Current Ownership Contract

- Furniture and fixture placement owner: `src/modules/expo/runtime/modularHome/construction/GalaConstructionModel.ts`.
- Furniture and fixture rendering consumer: `src/modules/expo/runtime/modularHome/construction/GalaRoomAssembly.tsx`.
- Wall/collision geometry owner: `src/modules/expo/runtime/modularHome/construction/GalaConstructionModel.ts` and `src/modules/expo/runtime/modularHome/construction/GalaWallAssembly.tsx`.

## QA Rule

Furniture clearance QA must fail when any furniture or fixture intersects wall-core geometry or when through-wall visibility risk is detected.
