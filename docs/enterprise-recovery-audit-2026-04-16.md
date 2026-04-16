# Enterprise Recovery Audit

Date: 2026-04-16  
Repo: `C:\3d`  
Branch at audit time: `work/world-owner-audit`  
Reference stash: `stash@{0}` `pre-world-audit-dirty-state`

## 1. Executive Diagnosis

This project is not blocked by one bug. It is blocked by workflow instability plus overlapping runtime owners.

The two main failure classes are:

1. Process failures
- work was done directly against unstable world state
- world cleanup, booth placement, rendering cleanup, and rollback work were mixed in the same flow
- targeted removals often happened at render-filter level instead of at builder/source level
- there was no stable checkpoint branch discipline until now

2. Architecture failures
- world geometry is generated and then filtered across multiple owner layers
- ground/perimeter visuals come from several overlapping systems
- booth placement previously depended on broad formulas instead of curated slot banks
- regressions appear because one layer re-exposes or suppresses geometry owned by another layer

The result is predictable:
- old blocks “come back”
- hidden junk reappears
- world silhouette changes while working on unrelated tasks
- booth placement keeps colliding with geometry
- time is lost redoing already-finished work

## 2. Current Snapshot

### Branches and recent commits

- Current local branch: `work/world-owner-audit`
- Current `main` / `origin/main`: `b0b2e5f`
- Recent commits:
  - `b0b2e5f` Merge pull request #1 from 30Sek24/work/world-architecture-audit
  - `6264e9c` Align GitHub Actions to Node 24
  - `e91853d` Stop tracking expo PNG assets with Git LFS
  - `b6dccdc` Add PR sanity workflow and narrow deploy trigger
  - `af3088b` Stabilize expo ground rendering and debug target tools

### Current local modified world files

At the time of this audit, these files are still locally modified relative to git index:

- `src/modules/expo/runtime/world/ExpoRearCampusLayout.ts`
- `src/modules/expo/runtime/world/WorldCityMasses.tsx`
- `src/modules/expo/runtime/world/WorldCityMegaLandmarks.tsx`
- `src/modules/expo/runtime/world/WorldCitySkeleton.tsx`
- `src/modules/expo/runtime/world/WorldCityTowers.tsx`

Important: these were restored toward the stash baseline, but `git status` may still show noise from line endings or trivial whitespace. Treat them as suspicious until explicitly verified.

### Build state

- TypeScript build command: `npx.cmd tsc -b`
- Last verified result during this session: clean

### Stable reference point

The last known local “user work already done” reference used in recovery was:

- `stash@{0}` `pre-world-audit-dirty-state`

That stash is critical. Do not drop it until the project is back in a stable checkpoint.

## 3. Confirmed Process / Infrastructure State

### GitHub

Already configured:
- `main` protected
- PR required before merge
- force push off on `main`
- delete off on `main`
- conversation resolution required

### GitHub Actions

Already configured:
- PR sanity workflow exists:
  - `.github/workflows/pr-sanity.yml`
- deploy workflow narrowed:
  - `.github/workflows/deploy.yml`
- Node version aligned to `24`

### Vercel

Already configured:
- production branch is `main`
- preview effectively disabled for non-main
- production deploy succeeded after LFS cleanup

### Git LFS

Already addressed:
- large Expo PNG assets were removed from LFS tracking
- `main` history was rewritten to stop Vercel production failures caused by `GIT_LFS_BUDGET_EXCEEDED`

This part is not the current blocker anymore.

## 4. Root-Cause Architecture Map

The project’s runtime scene is not owned by one system. The main owners are:

### A. City skeleton / builder aggregation

- `src/modules/expo/runtime/world/WorldCitySkeleton.tsx`
- `src/modules/expo/runtime/world/WorldCitySkeletonLayout.ts`

Risk:
- historically used large hidden ID sets and pattern filters
- this creates regressions when trying to clean up by suppression instead of by source ownership

### B. Rendered city masses

- `src/modules/expo/runtime/world/WorldCityMasses.tsx`

Risk:
- decorative and plinth-like mass suppression has been used to “shape” districts after generation
- this is fragile and can create “naked towers” or unexpected missing supports

### C. Rendered city towers

- `src/modules/expo/runtime/world/WorldCityTowers.tsx`

Risk:
- tower silhouette depends on both core volume and secondary decorative geometry
- if tower support logic changes, visual identity appears to “break” even when builder data still exists

### D. Mega landmarks

- `src/modules/expo/runtime/world/WorldCityMegaLandmarks.tsx`

Risk:
- large named part sets and hidden landmark parts make it easy to remove the wrong silhouette components

### E. Stadium / rear campus / perimeter

- `src/modules/expo/runtime/world/ExpoRearCampus.tsx`
- `src/modules/expo/runtime/world/ExpoRearCampusLayout.ts`

Risk:
- very large amount of hardcoded geometry and connectors in one place
- easy to accidentally affect perimeter, ground continuity, or nearby booth zones

### F. Ground / promenade / helper planes

- `src/modules/expo/runtime/world/WorldGroundPlane.tsx`
- `src/modules/expo/runtime/world/WorldCityPlanes.tsx`
- `src/modules/expo/runtime/world/WorldPromenade.tsx`

Risk:
- multiple ground owners cause visible tone shifts and patch-field effects

### G. Booth placement and booth visuals

- `src/modules/expo/lib/boulevardLayout.ts`
- `src/modules/expo/runtime/booths/*`
- `src/modules/expo/components/BoothArchitectureKit.tsx`

Risk:
- booth placement was historically modified while world state was unstable
- booth changes were blamed for world regressions because both happened in the same working sessions

## 5. Project Health Assessment

### What is actually healthy now

- GitHub branch policy is much better than before
- Vercel production path is repaired
- CI sanity exists
- there is a known stash checkpoint
- the team now has enough evidence that direct edits on unstable `main` are a bad operating mode

### What is not healthy

- current world visual state is not trusted
- there is no formally accepted stable world checkpoint after the recent regression loop
- world ownership is still too diffuse
- booth work cannot safely continue until world baseline is frozen

## 6. Immediate Recovery Strategy

Do not continue “fixing forward” from a visually broken world state.

The correct short-term order is:

1. Recover or identify the last truly acceptable world baseline
2. Freeze that baseline in a dedicated branch and tag/checkpoint commit
3. Audit world owners from the baseline, not from a broken mixed state
4. Only after world is frozen, open a separate booth branch

## 7. Required Commands

### A. Verify current local state

```powershell
cd C:\3d
git status --short
git stash list
git log --oneline --decorate -n 12
npx.cmd tsc -b
```

### B. Inspect the stash that represents pre-audit world work

```powershell
git stash show --name-only stash@{0}
git diff --stat stash@{0} -- src/modules/expo/runtime/world
```

### C. Create a hard safety branch before any more recovery work

```powershell
git checkout work/world-owner-audit
git checkout -b work/world-recovery-freeze
```

### D. If the stash is still the best visual baseline, restore only world files from it

Use this carefully and only after reviewing the affected files:

```powershell
git checkout stash@{0} -- src/modules/expo/runtime/world/ExpoRearCampusLayout.ts
git checkout stash@{0} -- src/modules/expo/runtime/world/WorldCityMasses.tsx
git checkout stash@{0} -- src/modules/expo/runtime/world/WorldCityMegaLandmarks.tsx
git checkout stash@{0} -- src/modules/expo/runtime/world/WorldCitySkeleton.tsx
git checkout stash@{0} -- src/modules/expo/runtime/world/WorldCityTowers.tsx
```

Then verify:

```powershell
npx.cmd tsc -b
git diff -- src/modules/expo/runtime/world
```

### E. Create the first stable checkpoint commit

Do this only when the world baseline is visually accepted:

```powershell
git add src/modules/expo/runtime/world/ExpoRearCampusLayout.ts
git add src/modules/expo/runtime/world/WorldCityMasses.tsx
git add src/modules/expo/runtime/world/WorldCityMegaLandmarks.tsx
git add src/modules/expo/runtime/world/WorldCitySkeleton.tsx
git add src/modules/expo/runtime/world/WorldCityTowers.tsx
git commit -m "Checkpoint stable world baseline before refactor"
git push -u origin work/world-recovery-freeze
```

### F. Open the real architecture branch from the stable world checkpoint

```powershell
git checkout -b work/world-architecture-refactor
```

### G. Branch policy to keep

Always use:

```powershell
git checkout main
git pull --ff-only
git checkout -b work/<single-topic-name>
```

Examples:
- `work/world-architecture-refactor`
- `work/world-ground-owner-cleanup`
- `work/booth-placement-curated-slots`
- `work/booth-visual-tier-pass`

Never mix:
- world + booths
- ground + perimeter + booth visual + rollback

in one branch.

## 8. Refactor Phases

### Phase 1. Recover Stable World Baseline

Goal:
- stop regressions
- get back to a world state the user accepts visually

Definition of done:
- no obvious junk blocks across left / arrival / mid / right
- no accidental silhouette loss that forces immediate rebuild work
- build passes
- checkpoint commit exists

### Phase 2. World Owner Rationalization

Goal:
- identify what each owner file is allowed to own

Target outcomes:
- `WorldCitySkeleton.tsx` becomes aggregation + minimal filtering, not a graveyard of hides
- `WorldCityMasses.tsx` stops carrying district-specific sculpting hacks
- `WorldCityTowers.tsx` separates core silhouette from optional decorative stack
- `WorldCityMegaLandmarks.tsx` becomes the primary signature-silhouette owner
- `ExpoRearCampus.tsx` / `ExpoRearCampusLayout.ts` get cleaner responsibilities around perimeter and stadium-side ownership

### Phase 3. Ground / Perimeter Ownership Cleanup

Goal:
- one clear source of truth for visible ground hierarchy

Target outcomes:
- remove overlapping helper planes that only create tone shifts
- perimeter connectors are explicit and local
- stadium base and city base do not fight for the same visual space

### Phase 4. Freeze World

Goal:
- stop touching world while booth work proceeds

Required artifact:
- stable branch merged or checkpointed
- branch name for world finalization
- documented “do not edit world while doing booths” rule

### Phase 5. Booth Placement

Goal:
- curated placement only

Rules:
- no formula-based free placement near structures
- use explicit slot banks by axis and approved empty pockets
- if a booth task needs world geometry changes, stop and split into separate world task

### Phase 6. Booth Visual Tier System

Goal:
- `common`, `premium`, `elite`, `hero` clearly differentiated
- large readable screens
- enterprise-grade presentation quality

### Phase 7. Business/Product Systems

Goal:
- calculators work across all categories
- 2D map and calculator outputs feed correctly into 3D city logic
- AI factory/workflow reaches enterprise quality
- production process is stable enough for commercial release

## 9. Non-Negotiable Working Rules

1. One problem = one owner file group  
2. One branch = one topic  
3. No direct pushes to `main`  
4. No booth work inside world branches  
5. No world changes inside booth branches  
6. No “quick hide” patches unless the owner is proven and the change is explicitly targeted  
7. Every stable visual state gets a checkpoint commit before the next risk pass  
8. Build must pass before a branch is considered reviewable  

## 10. What ChatGPT Should Be Asked To Do

Use the prompt below in ChatGPT. The goal is not generic advice. The goal is a hard architectural audit and an execution plan for Codex to implement.

## 11. Master Prompt For ChatGPT

```text
You are a super-master software architect, systems fixer, runtime diagnostics expert, enterprise frontend/backend architect, and production recovery planner.

You are helping rescue and finish a large commercial expo/city project.

Your job is not to give shallow suggestions. Your job is to:
1. find root-cause failures,
2. identify architectural debt,
3. propose a rigorous phased recovery plan,
4. define clean execution boundaries,
5. produce outputs that a separate implementation agent (Codex) can execute exactly.

Important operating model:
- ChatGPT is the master architect, auditor, reviewer, planner, and root-cause diagnostician.
- Codex is the implementer/coder who will apply the plan.
- We only accept plans that are concrete, file-aware, phase-based, and implementation-ready.
- We need enterprise-grade outcomes, not partial fixes.

Project goals:
- fully stabilize the 3D expo/city architecture
- eliminate regression loops
- repair world geometry ownership
- finish premium city presentation
- finish booth system with large screens and clear tier separation
- finish calculators across all categories
- connect map/calculator outputs into the 3D city correctly
- bring the AI factory/business workflow to enterprise level
- make the project commercially launchable

Known current problems:
- world geometry ownership is split across multiple overlapping runtime systems
- old geometry/junk blocks reappear during unrelated work
- hidden-ID and render-level suppression were used heavily, causing regressions
- ground/perimeter/planes have historically overlapped and conflicted
- booth work was repeatedly blocked by unstable world geometry
- previous work mixed world edits and booth edits in the same branch or session
- this caused repeated rollback/rebuild cycles and major time loss

Known repo/runtime ownership areas:
- WorldCitySkeleton.tsx
- WorldCitySkeletonLayout.ts
- WorldCityMasses.tsx
- WorldCityTowers.tsx
- WorldCityMegaLandmarks.tsx
- ExpoRearCampus.tsx
- ExpoRearCampusLayout.ts
- WorldGroundPlane.tsx
- WorldCityPlanes.tsx
- WorldPromenade.tsx
- boulevardLayout.ts
- booth runtime/components files

Required output format:
- Output ONLY valid JSON.
- No markdown.
- No prose outside JSON.

Required top-level JSON schema:
{
  "diagnosis": {
    "summary": "string",
    "root_causes": [
      {
        "id": "string",
        "severity": "critical|high|medium|low",
        "area": "world|ground|perimeter|booths|workflow|ci|deploy|data|ai-factory|calculators|map-3d-integration",
        "problem": "string",
        "evidence_needed": ["string"],
        "likely_owner_files": ["string"],
        "why_it_breaks_work": "string"
      }
    ]
  },
  "phases": [
    {
      "phase_id": "string",
      "title": "string",
      "goal": "string",
      "entry_conditions": ["string"],
      "tasks": [
        {
          "task_id": "string",
          "title": "string",
          "owner_area": "string",
          "target_files": ["string"],
          "actions": ["string"],
          "validation": ["string"],
          "rollback_plan": ["string"]
        }
      ],
      "exit_conditions": ["string"]
    }
  ],
  "branch_strategy": {
    "rules": ["string"],
    "branch_examples": ["string"],
    "merge_rules": ["string"]
  },
  "implementation_contract_for_codex": {
    "rules": ["string"],
    "allowed_change_scope": ["string"],
    "forbidden_patterns": ["string"],
    "required_validation_after_each_task": ["string"]
  },
  "diff_review_contract": {
    "required_output_per_task": {
      "summary": "string",
      "files_changed": [
        {
          "path": "string",
          "change_type": "add|modify|delete",
          "reason": "string"
        }
      ],
      "risk_notes": ["string"],
      "tests_run": ["string"],
      "follow_up_checks": ["string"]
    }
  },
  "enterprise_completion_targets": {
    "world_architecture": ["string"],
    "booths_and_screens": ["string"],
    "calculators": ["string"],
    "map_to_3d_city": ["string"],
    "ai_factory": ["string"],
    "security_and_release": ["string"]
  }
}

Additional instructions:
- Be severe and exact.
- Prefer root-cause fixes over cosmetic fixes.
- Assume the project has already lost time to regression loops.
- Separate recovery work from feature work.
- If an area should be frozen while another area is repaired, say so explicitly.
- If the current architecture requires refactor instead of patching, say so explicitly.
- Identify where hidden-ID cleanup should be replaced by source-owner cleanup.
- Make the plan large and serious, not minimal.
- The project is only considered complete when it is stable enough for premium commercial release.
```

## 12. How Codex Should Execute Against ChatGPT’s Plan

When ChatGPT returns JSON:

1. Store the JSON response as a project artifact under `docs/` or `diagnostics/`
2. Execute one `task_id` at a time
3. After each implementation task, Codex should report back in structured form:

```json
{
  "task_id": "example-task",
  "summary": "What was changed",
  "files_changed": [
    {
      "path": "src/example.ts",
      "change_type": "modify",
      "reason": "Why this file changed"
    }
  ],
  "tests_run": [
    "npx.cmd tsc -b"
  ],
  "risk_notes": [
    "Any known residual risk"
  ],
  "follow_up_checks": [
    "What to visually verify or validate next"
  ]
}
```

4. ChatGPT should then review the result against the task contract before the next task begins

## 13. ZIP Bundle Policy

The ZIP bundle created with this audit intentionally excludes heavy runtime artifacts so it can be shared for architecture review.

Excluded from ZIP:
- `.git`
- `node_modules`
- `dist`
- `WarpalaUE5`
- `.vercel`
- heavy `public` asset trees
- local env files

Included in ZIP:
- source code
- config
- scripts
- backend/server code
- docs including this audit
- CI/workflow files

## 14. Recommendation

Do not continue random feature work from the current visual uncertainty.

The correct next move is:
- freeze a trustworthy world checkpoint
- run a serious architecture review with the JSON contract above
- implement strictly by phase
- keep Codex as implementer only, not planner plus implementer plus rollback guesser at the same time

