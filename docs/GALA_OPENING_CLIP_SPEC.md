# GALA Opening Clip Spec

This spec defines the aperture rules for the GALA construction renderer. It is not product-owner acceptance.

## Aperture Contract

- Every scheduled window and door opening has an aperture volume derived from `GalaConstructionModel.ts`.
- No exterior cladding board, reveal strip, backing panel, interior board, or trim filler may exist inside an opening aperture volume unless it is the opening assembly itself.
- Wall-skin boards must be clipped or split around the aperture, not hidden behind casing.
- Reveal backing must also be clipped; backing panels may not fill a window or door aperture.
- Opening casing, jamb liners, headers, sills, threshold, glass, and door leaves are the only allowed objects inside opening assemblies.

## Window Rules

- Window glass must be transparent/readable as glass.
- Glass must sit inside the aperture and fill the framed pane area without reading as a black blocked void.
- Boards must not be visible through the glass as if the opening is still clad.

## Door Rules

- Closed door leaf may occupy the door aperture as the blocking slab.
- Open door leaf may exist only as an open leaf outside the clear portal path.
- The open door portal volume must remain visually clear.
- Jamb, casing, header, sill, and threshold may frame the portal, but may not fill it.

## QA Rules

- QA must traverse the scene and fail if board, reveal, or backing mesh names intersect or visibly occupy window/door aperture volumes.
- QA must fail if window glass opacity/material is opaque enough to read as a black blocked void.
- QA must fail if the open door state still shows cladding or backing in the clear portal volume.
- Screenshot readability is not acceptance.
