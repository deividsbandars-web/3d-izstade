# GALA Floor And Ground Isolation Spec

This spec defines ownership between the modular home interior floor and the expo world ground. It is not product-owner acceptance.

## Ownership

- The house interior floor owns the visible walking and floor surface inside the GALA footprint.
- World ground owns only the exterior environment.
- `world-ground-detail`, sponsor anchors, arrival anchors, and transition ribbons must not overlap, show through, or visually contaminate the house interior floor.

## HomeStudio Rules

- In `homeStudio=1`, world-ground detail and sponsor/arrival/transition floor anchors must be clipped, hidden, lowered, or masked from the interior house bounds.
- A low exterior base surface may remain outside or below the foundation only if it cannot show through the interior floor.
- The interior floor must be opaque, stable, and visually above any exterior ground layer.

## Visual Requirements

- No blue void or blue/city ground material may appear inside the house.
- Floor color must remain stable during forward and backward walking.
- Floor detail may show intentional plank seams, but no z-fighting, transparent overlay, or city-ground bleed is allowed.

## QA Rules

- QA must fail if any `world-ground-detail:*` mesh is mounted in homeStudio where it can overlap the house footprint.
- QA must fail if blue/city/sponsor ground colors are visible or sampled inside the interior floor view.
- QA must compare near, far, and backward-motion floor evidence.
- Screenshot readability is not acceptance.
