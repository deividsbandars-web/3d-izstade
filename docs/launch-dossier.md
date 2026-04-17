# Launch Dossier

Date: 2026-04-17  
Phase: `P9-T2`  
Branch snapshot: `work/launch-dossier-p9`  
Reference commit at verification start: `40a1d4666adb15936e1b2a8445e89af4fb90b97c`

## Executive Recommendation

Current recommendation:

- `NOT READY FOR PREMIUM COMMERCIAL LAUNCH`

Reason:

- architecture recovery is materially advanced
- API coverage blockers for the current browser wrapper inventory are closed
- core builds and hygiene checks are green
- but several critical integrated acceptance gates still lack final proof:
  - premium visual review
  - explicit world visual sign-off batch
  - queue/worker runtime verification
  - deploy/production evidence in this task
  - truthful release treatment of simulated monetization/video behavior

## Verification Commands Run

### Root TypeScript build

Command:

```powershell
npx.cmd tsc -b
```

Result:

- `PASS`

### Backend server build

Command:

```powershell
cd C:\3d\backend-server
npm.cmd run build
```

Result:

- `PASS`

### Browser/backend source hygiene

Command:

```powershell
cd C:\3d
npm.cmd run check:source-boundaries
```

Result:

- `PASS`

## Evidence Inventory

### World and booth architecture

- [world-owner-contract.md](/C:/3d/docs/world-owner-contract.md)
- world checkpoint tag: `world-freeze-2026-04-17`
- [booth-tier-contract.md](/C:/3d/docs/booth-tier-contract.md)
- [api-coverage-matrix.md](/C:/3d/docs/api-coverage-matrix.md)
- [release-acceptance-checklist.md](/C:/3d/docs/release-acceptance-checklist.md)

### Scene and calculator contracts

- [expo-scene-contract.json](/C:/3d/docs/expo-scene-contract.json)
- [calculator-domain-contract.json](/C:/3d/docs/calculator-domain-contract.json)

## Gate Assessment

| Gate ID | Status | Evidence | Notes |
| --- | --- | --- | --- |
| `RA-001` World integrity | `WARN` | world freeze tag, world owner contract | trusted baseline exists, but this task did not collect fresh visual review screenshots for left/arrival/mid/right/rear |
| `RA-002` Ground and perimeter continuity | `WARN` | world owner and ground hierarchy docs from prior phases | structural cleanup exists, but this task did not produce integrated stadium/city seam evidence |
| `RA-003` Booth placement integrity | `WARN` | slot-bank + validation work already completed | architecture is in place, but this task did not capture final reviewed placement evidence |
| `RA-004` Booth tier differentiation | `WARN` | booth tier contract exists | contract and implementation exist, but no final side-by-side visual proof collected here |
| `RA-005` Screen ownership/readability | `WARN` | booth/world screen ownership changes completed | semantics are separated in code, but final integrated readability review is still missing |
| `RA-006` Expo scene contract alignment | `PASS` | [expo-scene-contract.json](/C:/3d/docs/expo-scene-contract.json), canonical scene work completed | contract exists and adapter path was implemented |
| `RA-007` Calculator correctness | `WARN` | [calculator-domain-contract.json](/C:/3d/docs/calculator-domain-contract.json) | heating is migrated; many categories remain on legacy-adapter paths |
| `RA-008` Browser/backend boundary enforcement | `PASS` | `npm run check:source-boundaries` | enforced scope passes |
| `RA-009` API route coverage | `PASS` | [api-coverage-matrix.md](/C:/3d/docs/api-coverage-matrix.md), root build, backend-server build | browser wrapper inventory no longer points at missing routes |
| `RA-010` Auth and privileged execution | `WARN` | server-side AI hardening, auth/session helper changes | architecture is improved, but this task did not run authenticated endpoint verification |
| `RA-011` Queue/governance reliability | `WARN` | queue/governance hardening code | bounded semantics exist, but no worker/runtime execution evidence collected here |
| `RA-012` Billing and monetization realism | `WARN` | billing routes exist | payment flow is still simulated; cannot be marketed as production-grade payments |
| `RA-013` Deploy health | `WARN` | local builds pass | this task did not independently verify live production/backend deployment state |
| `RA-014` Premium city/booth visual quality | `FAIL` | none sufficient | final integrated premium-quality screenshot batch is missing |
| `RA-015` Known-risk register | `PASS` | this dossier section below | risk register provided |

## Integrated Findings

### Proven in this task

- root build is green
- backend-server build is green
- browser/backend boundary hygiene passes
- API route coverage for current browser wrapper inventory is materially closed

### Proven by prior completed phase artifacts

- world recovery baseline exists
- world freeze checkpoint exists
- canonical scene contract exists
- calculator contract exists
- booth tier contract exists
- API coverage matrix exists and shows current wrapper coverage closure

### Not proven yet

- final premium integrated visual quality
- final world skyline/perimeter screenshot batch
- final booth placement/tier screenshot batch
- real end-to-end authenticated API exercise across all new routes
- real worker queue exercise under runtime load
- real production payment flow

## Known Risk Register

| Risk ID | Severity | Area | Description | Mitigation | Rollback |
| --- | --- | --- | --- | --- | --- |
| `KR-001` | critical | visuals | Final premium visual quality is not yet evidenced by an integrated screenshot/review batch. | Run a dedicated final visual review across required zones and attach artifacts. | Use world freeze tag and booth checkpoint branches as rollback references. |
| `KR-002` | high | monetization | Billing API exists, but payment flow remains simulated. | Mark billing as simulation-only until real checkout integration is implemented and verified. | Keep current billing routes but do not advertise them as production payments. |
| `KR-003` | high | queue/runtime | Queue and governance semantics were hardened, but no runtime worker verification was collected in this dossier. | Run backend worker against realistic queued tasks and capture outcomes. | Revert to previous security branch commits if hardening causes runtime faults. |
| `KR-004` | high | auth | Protected routes now depend on Supabase bearer forwarding; this dossier did not collect authenticated browser proof. | Test authenticated browser flows for Expo, workflows, marketplace, billing, and platform routes. | Revert `src/services/serverApi.ts` auth forwarding change if it causes systemic breakage, but only with a replacement plan. |
| `KR-005` | medium | calculators | Only heating is migrated to domain-engine; many calculator families remain legacy-adapter. | Continue category-by-category calculator migration and add deterministic fixtures per family. | Keep legacy adapters active while migrating one family at a time. |
| `KR-006` | medium | deploy | Local builds pass, but this dossier does not independently prove current live production and backend health. | Verify current deploy targets and attach endpoint reachability evidence in the next acceptance pass. | Freeze release and continue from stable release-acceptance branch. |

## Honest Launch Position

The project is now in a materially stronger enterprise posture than before:

- owner boundaries are clearer
- world freeze discipline exists
- booth architecture is structured
- browser/backend boundary is enforced in scope
- API coverage for the current browser wrapper inventory is materially closed

But the project is still not honestly ready for premium commercial launch review because:

- final integrated visual acceptance is missing
- monetization is not yet production-real
- some operational proofs are architectural rather than runtime-demonstrated

## Next Required Actions

1. Final integrated visual review batch  
Evidence needed:
- left skyline
- arrival corridor
- central/mid city
- right skyline
- rear/stadium transition
- booth rows across districts
- hero/elite/premium/common comparison
- booth vs world screen comparison

2. Authenticated API smoke pass  
Evidence needed:
- one successful protected request per major API family

3. Worker/queue runtime pass  
Evidence needed:
- queued task lifecycle proof
- retry/quarantine proof if possible

4. Billing realism decision  
Evidence needed:
- explicit business sign-off that current billing is simulated, or
- real payment integration before launch

## Exit Condition For P9-T2

This dossier task is complete because:

- integrated build evidence was gathered
- gate statuses were assigned honestly
- unresolved critical gaps were documented explicitly
- the project now has a concrete launch recommendation based on evidence instead of assumptions
