# GALA Performance Budget

This document defines the local performance guardrail for GALA modular-home studio evidence.

It is not product visual acceptance and does not authorize staging deploy.

## Local QA Budget

- Exterior route median FPS target: at least `45 FPS`; preferred `55-60 FPS`.
- Interior route median FPS target: at least `45 FPS`; preferred `55-60 FPS`.
- P95 frame time target: under `28ms`; preferred under `20ms`.
- Stationary and motion budgets must both be measured.
- Motion measurements must include real forward/backward walking and turning/pointer or keyboard camera motion in `homeStudio=1`.
- P95 frame time during movement must remain under `28ms`.
- Max frame time must be reported during movement.
- Frame spikes over `50ms` must be counted as stutters and reported.
- Draw calls must be reported for exterior and interior routes.
- Triangles must be reported for exterior and interior routes.
- Mesh count must be reported for exterior and interior routes.
- Material count must be controlled and reported.
- QA hooks must not invalidate motion performance measurements; motion QA should use the real homeStudio walk loop and only enable inventory/profiling hooks needed for measurement.

## Static Scene Rules

- Board mesh count must not explode per wall segment.
- Repeated boards, reveals, or grooves should use instancing or merged geometry where practical.
- Material count must be controlled; repeated identical construction elements should not create unnecessary material variants.
- No per-frame React state loop should drive static wall-skin geometry.
- QA/debug hooks must not cause production `homeStudio=1` lag.
- Sponsor/font/DOM layers must not cause black canvas or render stalls.

## Acceptance Rule

Performance QA is a guardrail only. Passing this budget does not set `productVisualAccepted=true`.
