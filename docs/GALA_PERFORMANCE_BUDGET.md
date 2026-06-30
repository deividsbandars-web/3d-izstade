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

## Device Profiles

The static and motion performance audits default to the existing desktop profile. They
also support mobile evidence profiles for release-readiness checks:

| Profile | Viewport | Device scale | CPU throttle | Median FPS minimum | P95 frame max |
| --- | ---: | ---: | ---: | ---: | ---: |
| `desktop` | `1440x900` | `1` | `1x` | `45` | `28ms` |
| `mobile` | `390x844` | `3` | `1x` | `30` | `40ms` |
| `constrained-mobile` | `390x844` | `3` | `4x` | `30` | `40ms` |

Example constrained-mobile commands:

```powershell
node scripts/qa-gala-performance-budget-audit.mjs --base-url=https://staging.30sek24.com --profile=constrained-mobile --out-dir=artifacts/phase6-2-constrained-mobile/static
node scripts/qa-gala-motion-performance-audit.mjs --base-url=https://staging.30sek24.com --profile=constrained-mobile --out-dir=artifacts/phase6-2-constrained-mobile/motion
```

## Static Scene Rules

- Board mesh count must not explode per wall segment.
- Repeated boards, reveals, or grooves should use instancing or merged geometry where practical.
- Material count must be controlled; repeated identical construction elements should not create unnecessary material variants.
- No per-frame React state loop should drive static wall-skin geometry.
- QA/debug hooks must not cause production `homeStudio=1` lag.
- Sponsor/font/DOM layers must not cause black canvas or render stalls.

## Acceptance Rule

Performance QA is a guardrail only. Passing this budget does not set `productVisualAccepted=true`.

## Canonical QA Suite

Use `node scripts/qa-gala-suite.mjs --base-url=<local-preview-url> --out-dir=artifacts/qa-gala-suite` as the single orchestrator for release-scope GALA QA evidence. The suite keeps one active owner per concern so stale historical scripts cannot contradict the release report.

| Concern | Canonical script | Scope |
| --- | --- | --- |
| `ownership` | `scripts/qa-gala-renderer-ownership-audit.mjs` | Active renderer ownership and legacy import boundary |
| `dom-overlay` | `scripts/qa-gala-dom-overlay-audit.mjs` | Visitor overlay does not block the studio canvas |
| `wall-skin-coverage` | `scripts/qa-gala-wall-skin-coverage-audit.mjs` | Wall skin ownership and runtime coverage; interior/exterior palette matching is delegated to design-intent |
| `floor-ground-isolation` | `scripts/qa-gala-floor-ground-isolation-audit.mjs` | Floor/ground/void isolation |
| `geometry-clip` | `scripts/qa-gala-opening-clip-audit.mjs` | Openings, frames, cladding clip, and door slab visibility |
| `furniture-clearance` | `scripts/qa-gala-furniture-clearance-audit.mjs` | Furniture and fixture clearance |
| `static-budget` | `scripts/qa-gala-performance-budget-audit.mjs` | Stationary FPS, draw-call, mesh, material, triangle budgets |
| `motion-perf` | `scripts/qa-gala-motion-performance-audit.mjs` | Real movement frame-time and stutter budget |
| `visual-design-intent` | `scripts/qa-gala-visual-design-intent-audit.mjs` | Current material/design intent, including facade/floor/wall color expectations |
| `visual-acceptance-preflight` | `scripts/qa-gala-visual-acceptance-local.mjs` | Technical preflight only; human product acceptance remains separate |

### Retired Or Diagnostic Scripts

The following scripts remain in the repo for historical evidence or focused diagnosis, but are not canonical release gates:

- `scripts/qa-gala-construction-renderer.mjs`: retired from the canonical suite because stale floor-color userData flags can contradict `qa-gala-visual-design-intent-audit.mjs`.
- `scripts/qa-gala-cladding-dimension-audit.mjs`: superseded by wall-skin coverage and design-intent checks.
- `scripts/qa-gala-opening-voids.mjs`: historical opening capture pack; superseded by opening clip.
- `scripts/qa-gala-opening-motion-flicker-audit.mjs`: specialized flicker diagnostic; keep opening clip and motion perf separate.
- `scripts/qa-gala-final-fit.mjs`, `scripts/qa-gala-visual-construction.mjs`, `scripts/qa-gala-defect-root-cause.mjs`: historical visual/capture packs, not release gates.
- `scripts/qa-gala-view-readability-diagnostic.mjs`, `scripts/qa-gala-devtools-trace.mjs`, `scripts/qa-gala-camera-fov-composition.mjs`: targeted diagnostics only.
- `scripts/qa-gala-full-architecture-audit.mjs`: meta-audit of QA false-positive risk, not a release gate.
- `scripts/qa-gala-real-user-walk-physics.mjs`: targeted walk-physics diagnostic; geometry clip and motion perf remain the suite gates.
