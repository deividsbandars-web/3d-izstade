# Launch Readiness Snapshot 2026-06-17

## Status

- Snapshot date: `2026-06-17`
- Canonical frontend: root Vite SPA
- Canonical backend: `backend-server`
- Canonical public scene contract: `/api/expo/scene`
- Current recommendation: safe for controlled demo review
- Current caution: not yet ready for broad paid sponsor launch

## Completed Milestones

Completed or established in the current repo direction:

- `PROJECT_CONTEXT_LOCK` established
- no-GLB / no-Unreal MVP direction established
- Web Booth Studio UI direction established
- Modular Home manual-review / no-GLB workflow established
- Home Design Instance shell added
- procedural modular home exterior polish added
- Interior Rooms / panorama scaffold added
- Supabase restored through Doppler-managed workflow
- Supabase migrations aligned on the restored managed project
- local backend Supabase smoke passed
- staging backend/frontend smoke passed
- production read smoke passed

## Green Smoke Facts

Local backend smoke from the restore/smoke reports:

- local `/health -> 200`
- local `/api/expo/scene -> 200`
- local `authPolicy=public-readonly`
- local `sectors=3`
- local `companies=3`
- local `booths=3`

Staging smoke:

- `https://api-staging.30sek24.com/health -> 200`
- `https://api-staging.30sek24.com/api/expo/scene -> 200`
- staging `authPolicy=public-readonly`
- staging `sectors=3`
- staging `companies=3`
- staging `booths=3`
- `https://staging.30sek24.com -> 200`
- `https://staging.30sek24.com/expo-3d -> 200`

Production read smoke:

- `https://api.30sek24.com/health -> 200`
- `https://api.30sek24.com/api/expo/scene -> 200`
- production `authPolicy=public-readonly`
- production `sectors=3`
- production `companies=3`
- production `booths=3`
- `https://www.30sek24.com -> 200`
- `https://www.30sek24.com/expo-3d -> 200`

## Remaining Risks

- no automated production Hetzner env apply / restart path was found in repo conventions
- no root `test` script exists
- Vite chunk-size warnings remain
- backend smoke helper is local and not CI-integrated
- sponsor publish / review flow is still mostly UI + docs direction, not a fully verified self-service workflow
- sponsor media upload / reviewed asset storage flow is still not implemented end-to-end
- payment / checkout flow is not implemented or not verified as launch-ready
- old Unreal / streaming infrastructure is preserved, but it remains optional infrastructure rather than the MVP baseline

## Next 5 MVP Tasks

1. integrate CI or staging-safe smoke script coverage for backend, scene, and frontend route checks
2. implement and verify sponsor publish / review data flow end-to-end
3. implement sponsor media placeholder to reviewed asset workflow
4. complete modular home quote / admin follow-through smoke verification
5. reduce `/expo-3d` performance and chunk budget risk

## Go / No-Go Recommendation

Go:

- safe for controlled demo review
- safe for guided sponsor walkthroughs where operator support is available

No-go for broad paid launch yet:

- do not treat it as ready for broad paid sponsor self-service launch until sponsor self-service, review/publish flow, and analytics verification are completed

## Summary

- platform direction is now materially clearer and more stable than the earlier mixed Unreal / GLB-first state
- Supabase restore and scene-contract smoke evidence are green across local, staging, and production read checks
- launch risk has shifted from infrastructure recovery to workflow completeness, verification depth, and release hardening
