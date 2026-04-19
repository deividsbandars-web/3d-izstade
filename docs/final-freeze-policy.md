# Final Freeze Policy

Date: 2026-04-17  
Phase: `P9-T3`  
Status: `release-candidate freeze with open blockers`

## Freeze Decision

The project enters a controlled release-candidate freeze from this point forward.

This is **not** a premium commercial launch approval.

It is a stability rule set for the current integrated architecture state so:

- remaining acceptance blockers are handled explicitly
- no uncontrolled feature work contaminates the candidate
- rollback remains simple

## Frozen Reference Points

### World baseline

- world checkpoint tag: `world-freeze-2026-04-17`

### Acceptance artifacts

- [release-acceptance-checklist.md](/C:/3d/docs/release-acceptance-checklist.md)
- [launch-dossier.md](/C:/3d/docs/launch-dossier.md)

### Current release-candidate branch references

- release checklist branch: `work/release-acceptance-checklist-p9`
- launch dossier branch: `work/launch-dossier-p9`
- current freeze policy branch: `work/final-freeze-policy-p9`

### Current freeze commit

- `7909ec291318ed49a6e869b8ae93deefb6ce90e9` was the integrated verification reference at freeze entry

## What Is Frozen

Until blockers are explicitly reopened, these areas are frozen:

1. World owner files
- `src/modules/expo/runtime/world/*`
- no opportunistic skyline, perimeter, ground, or reserve edits

2. Booth architecture and placement
- `src/modules/expo/lib/boulevardLayout.ts`
- `src/modules/expo/layout-engine.ts`
- `src/modules/expo/runtime/booths/*`
- `src/modules/expo/components/BoothArchitectureKit.tsx`

3. Canonical contracts
- `docs/expo-scene-contract.json`
- `docs/calculator-domain-contract.json`
- scene/runtime contract types unless a blocker requires an explicit contract revision

4. Security boundary rules
- browser/backend boundary rules
- server-side AI execution rules
- queue/governance bounded semantics

5. API route coverage surface
- no casual route renaming or request/response shape churn without an explicit compatibility task

## Allowed Changes During Freeze

Allowed only through narrow hotfix branches:

- build breakers
- acceptance-blocking regressions
- security issues
- deploy failures
- critical contract bugs that invalidate current documented behavior
- evidence-gathering instrumentation that does not alter product behavior materially

## Forbidden Changes During Freeze

Not allowed without reopening the relevant domain explicitly:

- new feature work
- visual experimentation
- booth/world co-editing in one branch
- broad refactors not tied to a blocker
- changing simulated billing/video behavior to sound production-ready in docs or UI
- rewriting canonical contracts casually after acceptance artifacts were created

## Hotfix Branch Rules

Every freeze-period hotfix must:

1. branch from the freeze baseline or the latest accepted freeze hotfix
2. target one blocker only
3. include build validation
4. include a structured task report
5. update acceptance artifacts if the blocker status changes

Recommended hotfix naming:

- `hotfix/final-visual-review-blocker`
- `hotfix/authenticated-api-smoke-fix`
- `hotfix/worker-runtime-blocker`
- `hotfix/deploy-health-blocker`

## Current Open Blockers At Freeze Entry

These blockers remain open per the launch dossier:

1. Final integrated premium visual review is missing
2. Final world visual proof batch is missing
3. Final booth placement/tier proof batch is missing
4. Authenticated API smoke verification is missing
5. Worker/queue runtime verification is missing
6. Billing is still simulated rather than production-real
7. Deploy health evidence is incomplete in the launch dossier

## Merge Rule During Freeze

No branch may merge into the release-candidate line unless:

- it targets one listed blocker
- it includes clean validation evidence
- it updates the launch dossier or checklist status if relevant

## Exit Conditions For Freeze

Freeze ends only when one of these happens:

1. Launch approval
- critical gates are `PASS` or explicitly `DEFERRED` with sign-off
- launch dossier recommendation changes accordingly

2. Freeze reset
- a major regression invalidates the candidate
- the team resets to a prior trusted checkpoint and issues a new freeze policy

## Operational Note

This freeze is intentionally strict because the project has already suffered from mixed-scope churn.

From this point:

- blocker work must be explicit
- rollback paths must stay short
- documentation must stay truthful
