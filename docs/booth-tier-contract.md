# Booth Tier Contract

Accepted contract date: 2026-04-17  
Scope: booth tier semantics only. This contract does not authorize world edits.

## Canonical tiers

The commercial booth tier model is:

- `common`
- `premium`
- `elite`
- `hero`

Runtime compatibility:

- `common` maps to render tier `standard`
- `premium` maps to render tier `premium`
- `elite` maps to render tier `elite`
- `hero` maps to render tier `hero`

## Ownership rules

- `BoothTierState.ts` owns commercial tier resolution and tier contract numbers.
- `BoothArchitectureKit.tsx` owns template baselines and measurable booth geometry metrics.
- A template family may define a baseline, but it does not override commercial tier rules.
- `elite` may reuse premium template families, but it must still receive elite contract dimensions and presentation treatment.

## Measurable contract

| Tier | Render Tier | Base Template Family | Front Apron Width | Front Apron Depth | Stage Scale | Info Band Padding | Required Screen Class | Openness | Landmark Cue |
| --- | --- | --- | ---: | ---: | ---: | ---: | --- | --- | --- |
| common | standard | `standard_*` | 0.0 | 0.0 | 1.08 | 2.8 | support | compact | none |
| premium | premium | `premium_*` | 20.5 | 3.5 | 1.30 | 4.5 | presentation | open-front | portal |
| elite | elite | `premium_*` with elite treatment | 25.0 | 4.6 | 1.56 | 6.1 | large-format | ceremonial | monolith |
| hero | hero | `hero_*` | 30.0 | 5.6 | 1.82 | 6.8 | landmark | anchor | signature |

## Required commercial interpretation

### common
- Compact readable booth.
- Support-grade local screen presence only.
- No ceremonial frontage requirement.

### premium
- Strong front-facing presentation booth.
- Clear portal-like frontage.
- Screen presence must read from standard walking distance.

### elite
- Buyer-suite or flagship commercial booth.
- Larger apron and larger information band than premium.
- Large-format readable screen presence is mandatory.
- Must read as a stronger event object than premium, even if the underlying template family is shared.

### hero
- Signature anchor booth.
- Largest frontage, strongest stage scale, and strongest screen presence.
- Must read as a district anchor and landmark-tier sponsor object.

## Code mapping

- `resolveBoothCommercialTier(...)` in `BoothTierState.ts` is authoritative for tier resolution.
- `BOOTH_TIER_CONTRACT` in `BoothTierState.ts` is authoritative for contract numbers.
- `getBoothArchitectureContractBaseline(...)` in `BoothArchitectureKit.tsx` exposes template-family baselines.

## Explicit anti-patterns

- Do not infer tier semantics from scattered template conditionals alone.
- Do not let `elite` collapse into `premium` just because they share a template family.
- Do not introduce world geometry edits to compensate for booth tier weakness.
- Do not embed new tier numbers ad hoc in unrelated booth rendering files.
