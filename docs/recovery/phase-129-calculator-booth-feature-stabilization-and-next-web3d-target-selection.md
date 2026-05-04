# Phase 129 - Calculator Booth Feature Surface Stabilization And Next Web3D Target Selection

## Summary

Phase 129 was a stabilization and selection checkpoint.

Outcome:

- Phase 128 calculator booth feature surface is stable at the current seam
- calculator booth surface remains visible in booth UI
- calculator booth surface still routes through the existing action seam to `/calculators`
- no regression was found in the booth action split between calculator access and `demo_room`
- the next Web3D target selected for audit is `AI IN-WORLD STAND REVIEW`

No implementation was performed in this phase.

## Calculator Feature Surface Stabilization Audit

Inspected:

- `src/modules/expo/runtime/booths/BoothFeatureContent.tsx`
- `src/modules/expo/lib/sponsorBoothPresentation.ts`
- `src/modules/expo/runtime/booths/BoothInteractions.ts`
- `src/modules/expo/__tests__/sponsorBoothPresentation.test.ts`
- `src/App.tsx`

Stabilization findings:

- `BoothCalculatorFeature` still exists as explicit booth feature content
- `BoothInfoBand` still resolves `calculatorAction` from `ctaActions`
- the calculator panel is still rendered as visible content under the CTA strip
- the CTA strip still renders separately through `SponsorCtaStrip`
- calculator action metadata still comes from the shared booth CTA model
- route intent still resolves to `/calculators`
- `demo_room` intent still resolves to `presentation.demoRoomPath`
- `handleBoothAction()` still preserves separate `demo_room` behavior

This confirms that calculator presence is still a real booth feature surface, not just a hidden button strip action.

## Route / Action Behavior Confirmation

Confirmed:

- `CALCULATORS_ROUTE = '/calculators'` still exists in `sponsorBoothPresentation.ts`
- `buildSponsorCtas()` still includes `kind: 'calculators'`
- `resolveSponsorCtaIntent()` still maps calculator actions to `/calculators`
- `handleBoothAction()` still routes calculator navigation directly
- `handleBoothAction()` still routes `demo_room` through `openShowcaseRoom()`
- `/calculators` still exists in `src/App.tsx`
- hub-advertised calculator routes remain registered in `src/App.tsx`

The route bridge remains intact.

## Regression Check

No regression was found in the audited seam.

Confirmed unchanged or still out of scope:

- calculator UI internals were not changed
- calculator formulas were not changed
- no standalone calculator city placement system was added
- no calculator stand registry was added
- no `worldContract` redesign happened
- no AI stand implementation happened
- no broad city layout redesign happened

## Candidate Web3D Target Comparison

### A. AI IN-WORLD STAND REVIEW

Strengths:

- highest visible product value among the narrow audit options
- existing AI surface already exists in `src/components/chat/GlobalChat.tsx`
- existing app shell already hosts AI globally via `src/components/Layout.tsx`
- clear gap remains: AI exists, but not as a physical in-world stand
- likely next implementation can reuse booth/feature/action patterns instead of forcing city-wide redesign first

Risks:

- AI feature scope can sprawl if it jumps into backend/chat redesign
- must stay focused on physical entry surface, not full AI system rewrite

### B. 2D STAND PLACEMENT REVIEW

Strengths:

- high visual value
- directly tied to city surface readability

Risks:

- current seam is fragmented across screen layout, world screen surfaces, and planning layers
- likely broader than AI for the next audit because placement logic is distributed
- higher risk of turning into broad scene/layout analysis

### C. CALCULATOR STAND REGISTRY REVIEW

Strengths:

- directly adjacent to Phase 128
- route-first metadata review is feasible

Risks:

- lower immediate product novelty after just shipping booth calculator presence
- registry work is less visibly differentiated than AI as the next user-facing Web3D target
- may create metadata work before a second visibly distinct in-world feature is proven

### D. BOOTH / SCREEN ORIENTATION VALIDATION REVIEW

Strengths:

- strong correctness and safety value
- helps prevent frontality, wall-facing, and overlap issues

Risks:

- more validation/safety oriented than visibly product-forward
- audit seam is spread across planning and world rendering layers
- less suitable as the immediate next “visible value” checkpoint

## Selected Decision

Selected next target:

- `AI IN-WORLD STAND REVIEW`

## Selection Rationale

This is the best next target because it balances narrowness with visible product value.

Why it beats the others now:

- it has a concrete existing product seam in `GlobalChat.tsx`
- it has a clear missing in-world translation problem
- it can likely reuse the same design philosophy proven by calculator booth presence:
  - keep product access visible in-world
  - keep opening/interaction behavior narrow
  - avoid broad city redesign

Why not `2D STAND PLACEMENT REVIEW` yet:

- 2D stand placement is promising, but the seam is more fragmented and likely broader

Why not `CALCULATOR STAND REGISTRY REVIEW` yet:

- calculator presence just gained its first visible booth surface
- the next most valuable move is to prove a second visible in-world product class

Why not `BOOTH / SCREEN ORIENTATION VALIDATION REVIEW` yet:

- important for quality, but less directly product-visible than AI as the next checkpoint

## Files Likely Affected Next Phase

If the next phase is `AI IN-WORLD STAND REVIEW`, likely inspection files include:

- `src/components/chat/GlobalChat.tsx`
- `src/components/Layout.tsx`
- `src/modules/expo/runtime/booths/BoothFeatureContent.tsx`
- `src/modules/expo/runtime/booths/BoothVisualAssembly.tsx`
- `src/modules/expo/runtime/booths/DistrictBooth.tsx`
- any small AI route/action metadata seam if one already exists

## Files Explicitly Out Of Scope Next Phase

Still out of scope for the next phase unless a review explicitly requires only reading:

- `src/modules/calculators/*`
- `src/shared/expo/worldContract.ts`
- broad city/world layout files
- backend duplicate cleanup files
- full AI backend rewrite
- booth/screen orientation implementation work

## Validation Results

Passed in sandbox:

- `npm.cmd run check:expo-boundaries`
- `npm.cmd run check:backend-boundaries`
- `npx.cmd tsc -b`
- `npm.cmd --prefix backend-server run build`

Sandbox `spawn EPERM`, then rerun outside sandbox on the same machine:

- `npm.cmd run build`
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.controller.test.ts`

Backend baseline remains:

- domain duplicate warnings: `0`
- leads duplicate warnings: `0`
- billing boundary warnings: `0`
- violations: `0`

## Remaining Risks

- booth calculator surface is confirmed by code seam and tests, but not by visual snapshot automation
- AI review can sprawl if not constrained to an in-world entry surface audit
- 2D placement and orientation correctness remain unresolved follow-on quality topics

## Next-Cycle Recommendation

Next phase:

- `AI IN-WORLD STAND REVIEW`

The next audit should stay narrow and answer one question: what is the smallest existing Web3D seam that can turn current AI/chat capability into a visible in-world stand without triggering a broad city redesign?
