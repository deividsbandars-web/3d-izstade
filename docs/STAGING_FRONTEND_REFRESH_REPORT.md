# Staging Frontend Refresh Report

## Scope

- Date: `2026-06-18`
- Target: `https://staging.30sek24.com`
- Goal: refresh staging so `/expo/admin` serves the current root Vite SPA build with the current `CompanyAdmin` implementation

## Deployment Target Check

- Canonical frontend confirmed:
  - repository root Vite SPA
- Staging Vercel target confirmed from repo config:
  - local Vercel link points to `app-staging`
- Existing repo staging workflow confirmed:
  - `npm run deploy:staging:preview`
  - `npm run promote:staging -- <deployment-url>`
- Production was not deployed in this task.

## Pre-Deploy Evidence Of Stale Staging

Before refresh, staging served stale frontend assets:

- `/expo/admin` HTML referenced:
  - `/assets/index-RyWCV_Cl.js`
- active staging entry bundle still contained:
  - `country:"LV"`
- staging CompanyAdmin chunk did not contain current source markers:
  - `EXPO ADMIN`
  - `Media Review`
  - `Sponsor Readiness`

That matched the earlier shell-only signed-in QA failure.

## Deploy Command Used

Preview deploy:

```powershell
npm run deploy:staging:preview
```

Result:

- preview deployment created successfully:
  - `https://app-staging-aeznzmhqg-esaukans-6934s-projects.vercel.app`

Promote to staging alias:

```powershell
npm run promote:staging -- https://app-staging-aeznzmhqg-esaukans-6934s-projects.vercel.app
```

Result:

- `https://staging.30sek24.com` now points to:
  - `https://app-staging-aeznzmhqg-esaukans-6934s-projects.vercel.app`

## Post-Deploy URL Checks

Read-only HTTP checks after promotion:

- `https://staging.30sek24.com/` -> `200`
- `https://staging.30sek24.com/expo-3d` -> `200`
- `https://staging.30sek24.com/expo/admin` -> `200`

## Post-Deploy Marker Check

Active staging entry bundle after refresh:

- `/assets/index-DfRDn9We.js`

Stale marker check:

- old `country:"LV"` insert in active entry bundle:
  - not found

Active staging CompanyAdmin chunk after refresh:

- `CompanyAdmin-Fx9Mz7Qj.js`

Current CompanyAdmin markers in staging chunk:

- `EXPO ADMIN` -> found
- `Media Review` -> found
- `Sponsor Readiness` -> found
- `Upload for review` -> found
- `Approve` -> found
- `Promote` -> found

Auth UI markers in the active staging entry bundle:

- `LOGIN` -> found
- `LOGOUT` -> found
- `Current account` -> found

## Sponsor / Admin Diagnose-Only QA

Not run in this shell.

Reason:

- no outside-repo `QA_STORAGE_STATE_PATH`
- no role-specific QA storage-state env path was available in the terminal session

Result:

- staging frontend refresh is complete
- signed-in sponsor/admin diagnose-only reruns remain blocked only by missing local storage-state path input in this shell, not by stale staging assets

## `/api/expo/scene` Safety Note

Existing Doppler-backed smoke remained green in this round:

- `/health -> 200`
- `/api/expo/scene -> 200`
- `authPolicy -> public-readonly`
- `sectors -> 3`
- `companies -> 3`
- `booths -> 3`

No private `expo_review_media` exposure was reported by the smoke helper.

## Go / No-Go Recommendation

- staging frontend refresh: `GO`
- signed-in sponsor/admin read-only QA: `GO` to rerun once outside-repo storage-state paths are provided in the shell
- mutation QA: still not run and still out of scope for this task
