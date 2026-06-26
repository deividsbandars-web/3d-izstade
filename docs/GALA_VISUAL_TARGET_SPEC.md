# GALA Visual Target Spec

## Purpose

This spec defines the intended local product-facing visual target for the GALA modular home. It is an enforceable guardrail for local visual remediation and QA. It is not product-owner acceptance.

## Exterior Target

- The house must read as a compact timber modular cabin.
- The facade must read as coherent vertical timber board cladding.
- Exterior board colors must stay within one controlled natural warm wood palette.
- Board variation is allowed only when subtle and tonal.
- Board rhythm must be consistent across walls and gables.
- Trim must be coherent dark or warm wood.
- Door and window frames must read as intentional wood or dark trim.
- The roof must be dark and readable without visually swallowing the house.
- Cladding details may include seams, board relief, grain cues, and scarf joints when they stay visually subordinate to the timber-board system.

## Exterior Forbidden Patterns

- Random per-board color assignment.
- Rainbow facade.
- Zebra facade.
- High-contrast alternating strips.
- Patchwork facade.
- Debug material colors.
- Unowned facade material definitions scattered across assemblies.
- Additional patch-stack geometry without clear ownership.

## Interior Target

- The interior must read as a warm, simple modular cabin.
- Walls, floor, and ceiling must read as intentional material finishes.
- Interior wood or panel lines must be coherent and subtle.
- Simplified furniture is acceptable when it reads as furniture, not broken blocks.
- Kitchen pieces must read as cabinets/counter/sink/cooktop at local review level.
- Bathroom fixtures must be recognizable as shower, vanity, sink, mirror, and WC.
- Furniture and fixtures must be grounded or wall-aligned where expected.

## Interior Forbidden Patterns

- Random stripes.
- Unfinished placeholder panels on product-facing surfaces.
- Large unresolved primitive blocks.
- Floating furniture or fixtures.
- Debug cue colors that dominate product-facing surfaces.
- Screenshot readability treated as design acceptance.

## QA Expectations

- Visual acceptance QA checks route/readability/overlay status only; it is not design acceptance.
- Mesh traversal does not replace DOM overlay QA.
- Construction renderer QA is supporting evidence only.
- Design-intent QA must explicitly check facade palette control, zebra/rainbow striping, debug colors, intentional interior finish, and furniture/fixture recognizability.
- Product-owner manual review is still required before `productVisualAccepted` can become true.

## Status Constraints

- `productVisualAccepted` must remain `false` until explicit product-owner approval is recorded.
- `stagingDeployAllowed` must remain `false` unless staging deployment is explicitly requested.
- `singleSourceRendererProven` remains `false` unless a separate ownership proof is completed.
