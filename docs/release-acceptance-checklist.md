# Release Acceptance Checklist

Date: 2026-04-17  
Phase: `P9-T1`  
Scope: integrated release gates only. This checklist is a launch gate artifact, not a roadmap.

## Rule

No release candidate is acceptable unless every critical gate below is either:

- `PASS` with evidence, or
- explicitly deferred with business sign-off and a named remediation task

`WARN` is not enough for critical gates.

## Status Vocabulary

- `PASS`
- `FAIL`
- `WARN`
- `DEFERRED`

## Evidence Rule

Every gate must link to at least one of:

- build/test command output
- screenshot or visual review batch
- API contract artifact
- runtime verification note
- docs artifact in this repo
- PR/commit reference

## Gate Matrix

| Gate ID | Area | Critical | Owner | Required Evidence | Current Status |
| --- | --- | --- | --- | --- | --- |
| `RA-001` | World integrity | yes | world owner branch | accepted world checkpoint, freeze policy, reviewed left/arrival/mid/right/rear views | `WARN` |
| `RA-002` | Ground and perimeter continuity | yes | world/perimeter branch | reviewed stadium/city transition, ground hierarchy contract, no visible seam regressions | `WARN` |
| `RA-003` | Booth placement integrity | yes | booth branch | slot-bank artifact, collision validation, reviewed arrival/showcase/media/discovery placement | `WARN` |
| `RA-004` | Booth tier differentiation | yes | booth branch | reviewed common/premium/elite/hero comparisons with screenshots or runtime notes | `WARN` |
| `RA-005` | Screen ownership/readability | yes | booth + world screen branch | proof that booth screens and world screens are semantically distinct and readable | `WARN` |
| `RA-006` | Expo scene contract alignment | yes | map/3D contract branch | `docs/expo-scene-contract.json`, runtime scene verification, 2D/3D agreement note | `WARN` |
| `RA-007` | Calculator correctness | yes | calculator branch | `docs/calculator-domain-contract.json`, migrated engine evidence, deterministic validation fixtures | `WARN` |
| `RA-008` | Browser/backend boundary enforcement | yes | hardening branch | `npm run check:source-boundaries`, no direct backend imports in browser scope | `PASS` |
| `RA-009` | API route coverage | yes | API branches | `docs/api-coverage-matrix.md`, backend-server build, root build | `PASS` |
| `RA-010` | Auth and privileged execution | yes | security branch | server-side AI proof, auth/session review, no browser privileged key path | `WARN` |
| `RA-011` | Queue/governance reliability | yes | security branch | bounded retry/poison semantics, lineage-based governance, worker verification note | `WARN` |
| `RA-012` | Billing and monetization realism | yes | billing/API branch | billing route verification, explicit note on simulated vs real payment flow | `WARN` |
| `RA-013` | Deploy health | yes | platform/release branch | production deploy reachable, CI green, backend-server build green | `WARN` |
| `RA-014` | Premium city/booth visual quality | yes | integrated review | curated review proving city, booths, and screens read as premium | `WARN` |
| `RA-015` | Known-risk register | yes | release owner | launch dossier risk table with blockers, deferrals, and rollback references | `FAIL` |

## Gate Details

### `RA-001` World integrity

Required:

- trusted world checkpoint reference
- frozen world policy reference
- confirmation that no booth branch reopened world owners
- reviewed camera zones:
  - left
  - arrival
  - mid
  - right
  - rear/stadium

Evidence candidates:

- [world-owner-contract.md](/C:/3d/docs/world-owner-contract.md)
- world checkpoint/tag `world-freeze-2026-04-17`
- world review screenshots or acceptance notes

### `RA-002` Ground and perimeter continuity

Required:

- accepted ground hierarchy
- accepted rear-campus/perimeter continuity review
- no unexplained helper-plane regressions

Evidence candidates:

- [world-ground-hierarchy.md](/C:/3d/docs/world-ground-hierarchy.md)

### `RA-003` Booth placement integrity

Required:

- curated slot-bank exists
- placement validation exists
- collision/rejection diagnostics are inspectable

Evidence candidates:

- [booth-slot-bank.json](/C:/3d/docs/booth-slot-bank.json)
- placement diagnostics from runtime/dev logs

### `RA-004` Booth tier differentiation

Required:

- measurable tier contract exists
- common/premium/elite/hero are visibly distinct

Evidence candidates:

- [booth-tier-contract.md](/C:/3d/docs/booth-tier-contract.md)
- visual comparison notes/screenshots

### `RA-005` Screen ownership/readability

Required:

- booth presentation surfaces do not duplicate world landmark semantics
- screens remain readable at intended viewing distance

Evidence candidates:

- booth/world screen review screenshots
- relevant branch/task reports

### `RA-006` Expo scene contract alignment

Required:

- canonical contract artifact
- map/runtime/business agreement check

Evidence candidates:

- [expo-scene-contract.json](/C:/3d/docs/expo-scene-contract.json)

### `RA-007` Calculator correctness

Required:

- canonical calculator contract exists
- migrated domain-engine proof at least for active categories
- explicit note on remaining legacy adapters

Evidence candidates:

- [calculator-domain-contract.json](/C:/3d/docs/calculator-domain-contract.json)

### `RA-008` Browser/backend boundary enforcement

Required:

- no direct browser imports of backend modules in enforced scope
- no duplicate JS implementation artifacts in `src`

Evidence candidates:

- `npm run check:source-boundaries`

### `RA-009` API route coverage

Required:

- browser wrapper inventory does not point at missing backend routes
- backend-server build passes

Evidence candidates:

- [api-coverage-matrix.md](/C:/3d/docs/api-coverage-matrix.md)
- `npm run build` in `backend-server`
- `npx tsc -b`

### `RA-010` Auth and privileged execution

Required:

- no browser privileged AI path
- protected routes require valid auth
- server auth/session semantics documented enough for operation

Evidence candidates:

- `src/services/aiService.ts`
- `src/backend/ai/llmService.ts`
- `server/auth.ts`

### `RA-011` Queue/governance reliability

Required:

- bounded task attempts
- poison/quarantine handling
- lineage-based workflow halt semantics

Evidence candidates:

- `src/backend/queue/taskQueue.ts`
- `src/backend/governance/loopDetector.ts`
- `src/backend/agents/engine/agentCoordinator.ts`

### `RA-012` Billing and monetization realism

Required:

- explicit statement whether payment flow is simulated or real
- no hidden assumption that mocked checkout equals production readiness

Evidence candidates:

- billing controller verification
- payment service review note

### `RA-013` Deploy health

Required:

- root build green
- backend-server build green
- current production deployment reachable
- CI sanity green

Evidence candidates:

- `npx tsc -b`
- `backend-server npm run build`
- GitHub Actions check state
- Vercel production check

### `RA-014` Premium city/booth visual quality

Required:

- integrated visual review that confirms the product reads premium, not merely functional
- specific review of:
  - skyline
  - booth rhythm
  - screens
  - stadium transition

Evidence candidates:

- final integrated screenshot set
- launch dossier visual section

### `RA-015` Known-risk register

Required:

- every unresolved risk listed with:
  - severity
  - owner
  - mitigation
  - rollback path

This gate cannot pass until the launch dossier exists.

## Mandatory Commands Before Release Sign-Off

Run and record results for:

```powershell
npx.cmd tsc -b
```

```powershell
cd C:\3d\backend-server
npm.cmd run build
```

```powershell
cd C:\3d
npm.cmd run check:source-boundaries
```

## Mandatory Visual Review Zones

- left skyline
- arrival corridor
- central/mid city line
- right skyline
- rear/stadium transition
- booth rows across arrival/showcase/media/discovery
- hero vs elite vs premium vs common booth comparison
- nearby booth screen vs nearby world screen comparison

## Forbidden Sign-Off Shortcuts

- Do not sign off because “build passed”.
- Do not sign off because “routes exist”.
- Do not sign off because one happy-path page loaded once.
- Do not sign off while simulated billing/video behavior is being represented as production-ready reality.
- Do not sign off without a known-risk register.

## Exit Condition For P9-T1

This checklist task is complete when:

- release gates are explicitly listed
- each gate has an owner
- each gate has an evidence requirement
- launch cannot proceed honestly without filling the checklist
