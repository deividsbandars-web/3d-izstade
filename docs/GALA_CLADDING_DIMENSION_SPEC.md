# GALA Cladding Dimension Spec

## Purpose

This spec defines the accepted local design-intent proportions for GALA exterior vertical timber cladding. It exists because prior QA passed route/readability checks while the facade still violated the intended board/gap design.

This spec is not product-owner acceptance.

## Board System

- Board orientation: vertical.
- Target board width: `0.16-0.22m`.
- Preferred board width for the active simplified model: `0.18m`.
- Target reveal/gap: `0.01-0.02m`.
- Preferred reveal/gap for the active simplified model: `0.014m`.
- Max reveal/gap: `0.025m`.
- Board-to-gap ratio: board width must be at least `8x` gap width.
- Facade surface must be mostly warm timber board color, not mostly dark groove color.
- Grooves/reveals must read as shadow-thin board seams.

## Forbidden Patterns

- Any reveal/gap visually approaching board width.
- Any reveal/gap that reads as a dark stripe system.
- Extra decorative vertical strips beyond actual board seams.
- Thick dark strips as separate visual elements.
- Rainbow, zebra, random alternation, or debug striping.
- Scattered board width/gap/reveal constants across multiple active files.
- Post-config material overrides that replace the documented facade board material.

## Trim And Openings

- Trim, door frames, and window frames are separate from board seams.
- Opening reveals may be darker than board faces, but must not be confused with repeated cladding grooves.
- Door/window trim interruptions must not create random extra-wide dark board gaps.

## Simplified Style Allowance

The low-poly construction style is acceptable only when board and gap proportions are correct:

- boards visually dominate the facade
- dark reveals remain thin
- board rhythm is consistent
- gaps remain within the target or max range
- screenshot readability is not treated as design acceptance

## Acceptance Gate

Automated QA may confirm this dimension spec, but product-owner manual review is still required before `productVisualAccepted` can become `true`.
