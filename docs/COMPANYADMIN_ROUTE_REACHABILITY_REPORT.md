# CompanyAdmin Route Reachability Report

## Scope

- Date: `2026-06-18`
- Route under diagnosis: `/expo/admin`
- Target environment: `staging`
- Goal: explain why signed-in read-only QA reached the route with HTTP `200` but rendered only the generic app shell

## Actual Route

- Canonical frontend route in source:
  - `src/App.tsx`
  - `<Route path="expo/admin" element={<CompanyAdmin />} />`
- Effective public URL:
  - `https://staging.30sek24.com/expo/admin`

Result:

- `/expo/admin` is the correct CompanyAdmin route in the current source tree.
- No alternate route path was found in the canonical frontend runtime.

## Context Requirement

Current source diagnosis:

- `CompanyAdmin.tsx` does not require a query param or route param to mount.
- The component computes managed booth data after mount, but its top-level page shell renders regardless.
- Current source always includes stable page-level markers such as:
  - `EXPO ADMIN`
  - `Media Review`
  - `Sponsor Readiness`
  - admin access notices like `Sign in required`, `Booth access required`, `Admin service unavailable`, `Admin unavailable`

Result:

- company or booth context is not required just to render the CompanyAdmin page shell
- a path like `/expo/admin?boothId=...` is not required by current source

## Why Shell-Only Output Happened

Observed signed-in diagnose facts:

- current URL remained `https://staging.30sek24.com/expo/admin`
- page title remained `Warpala OS`
- sign-in gate was not visible
- access denied was not visible
- visible text contained only the generic `Layout` shell markers:
  - `30Sek24.com`
  - `CHAT`
  - `MEZGLS: RTX_4080_ULTRA`
  - `SYSTEM_SYNC: ACTIVE`

Source comparison:

- `Layout.tsx` contains those exact shell strings
- current `CompanyAdmin.tsx` contains many strong markers that should also appear if the route mounted normally
- those markers were absent from the signed-in staging output

Conclusion:

- the generic shell rendered
- the `CompanyAdmin` route component did not present its current visible surface in staging

## Staging Staleness Diagnosis

Read-only staging bundle inspection found:

- staging `/expo/admin` HTML currently serves:
  - `/assets/index-RyWCV_Cl.js`
- staging entry bundle still contains the old `Login` signup insert with:
  - `country:"LV"`
- that is already known to be outdated relative to current source, where the `country` field was removed
- staging entry bundle loads CompanyAdmin from:
  - `/assets/CompanyAdmin-CT1VPeEh.js`
- staging CompanyAdmin chunk does not contain the current source markers:
  - `Media Review`
  - `Sponsor Readiness`

Additional note:

- the staging CompanyAdmin chunk clearly differs from current source and reflects an older CompanyAdmin implementation

Result:

- staging appears stale relative to the current repo state
- the signed-in shell-only QA failure is not explained by the current canonical route definition
- the strongest current root cause is stale frontend deploy content on staging

## Code / Helper Changes Made

- `scripts/qa-companyadmin-media-review.mjs`
  - added `EXPO ADMIN` as an additional stable route-surface marker in diagnostics
  - this does not change app runtime behavior

## Next QA Command

After staging is refreshed to a build that includes the current CompanyAdmin implementation, rerun:

Sponsor diagnose-only:

```powershell
$env:QA_ROLE = "sponsor"
$env:QA_STORAGE_STATE_PATH = "<outside-repo sponsor storage-state>"
$env:QA_DIAGNOSE_ONLY = "true"
doppler run -- node scripts/qa-companyadmin-media-review.mjs
```

Admin diagnose-only:

```powershell
$env:QA_ROLE = "admin"
$env:QA_STORAGE_STATE_PATH = "<outside-repo admin storage-state>"
$env:QA_DIAGNOSE_ONLY = "true"
doppler run -- node scripts/qa-companyadmin-media-review.mjs
```

## Practical Recommendation

- treat `/expo/admin` as the correct route
- do not add fake query params or test IDs
- do not change CompanyAdmin business logic for this issue
- refresh staging to a frontend build aligned with current source before trusting further signed-in route QA
