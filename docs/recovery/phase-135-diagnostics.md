## Phase 135 Diagnostics

Helper stabilization findings:
- `src/modules/expo/runtime/planning/screens/screenOrientationDiagnostics.ts`
  - pure/read-only
  - returns diagnostics only
  - does not mutate screen surfaces
  - does not call any runtime renderer or planner mutation path
- `src/modules/expo/__tests__/screenOrientationDiagnostics.test.ts`
  - still checks only conservative fixture cases
  - does not over-enforce center/tower/rear orientation

Integration status:
- helper is referenced only by:
  - `src/modules/expo/__tests__/screenOrientationDiagnostics.test.ts`
- helper is not yet integrated into:
  - `buildScreenSurfacePlan.ts`
  - `buildScreenSocketPlan.ts`
  - `WorldCityScreenSurfaces.tsx`
  - `worldContract.ts`
- conclusion:
  - helper is groundwork, not an active gate

Real planned-surface diagnostic scan:
- safe one-off scan path exists:
  - build fallback scene
  - build world contract
  - build canonical world plan
  - run `diagnoseScreenOrientation(plan.filteredScreenSurfaces)`
- result:
  - `screenSurfaceCount: 24`
  - `diagnostic total: 0`
- implication:
  - no exact bad-yaw case is currently proven by this helper

Regression confirmation:
- no `buildScreenSurfacePlan.ts` changes after Phase 134
- no `sponsorScreenLayout.ts` changes for this checkpoint
- no `WorldCityScreenSurfaces.tsx` changes
- no `worldContract.ts` changes
- no booth/calculator/AI source changes in this phase

Candidate next target comparison:
1. Booth frontality diagnostic review
   - risk: low
   - value: medium/high
   - rationale: next closest authored-orientation seam with no need for object movement

2. 2D stand placement review
   - risk: medium
   - value: high
   - rationale: visible product value, but broader than the next narrow checkpoint

3. Orientation fix review
   - not selected
   - blocker: no concrete bad-yaw proof from current diagnostics

4. Screen diagnostic integration review
   - viable later
   - lower immediate value than booth frontality target

