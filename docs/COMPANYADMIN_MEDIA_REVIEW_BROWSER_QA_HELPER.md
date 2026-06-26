# CompanyAdmin Media Review Browser QA Helper

## Scope

- Date: `2026-06-18`
- Script: `scripts/qa-companyadmin-media-review.mjs`
- Purpose: small signed-in browser QA helper for staging/test `CompanyAdmin` media review flow
- Companion capture helper: `scripts/capture-companyadmin-storage-state.mjs`

## Tooling Choice

This helper reuses the existing repo style:

- plain Node script
- Chrome/Chromium via CDP
- no Playwright
- no Cypress
- no password handling
- no committed browser state

## Required Environment Variables

- `QA_ROLE`
  - `sponsor` or `admin`
- `QA_STORAGE_STATE_PATH`
  - local non-committed authenticated browser storage-state JSON

## Supported Environment Variables

- `QA_BASE_URL`
  - default: `https://staging.30sek24.com`
- `QA_COMPANY_ADMIN_PATH`
  - default: `/expo/admin`
- `QA_EXPECT_MEDIA_REVIEW`
  - default: `true`
- `QA_DEBUG_TEXT_LIMIT`
  - default: `1200`
- `QA_DIAGNOSE_ONLY`
  - default: `false`
- `QA_RENDER_WAIT_MS`
  - default: `10000`
- `QA_DISABLE_BROWSER_CACHE`
  - default: `true`
- `QA_CLEAR_SERVICE_WORKER`
  - default: `true`
  - staging-scoped diagnostics only
- `QA_ROLE`
  - `sponsor` or `admin`
- `QA_STORAGE_STATE_PATH`
  - example: `C:\\qa\\storage-state-sponsor.json`
- `QA_ALLOW_MUTATION`
  - default: `false`
- `QA_TEST_BOOTH_ID`
  - required only if mutation mode is requested later
- `QA_TEST_FILE_PATH`
  - required only if mutation mode is requested later

## Optional Environment Variables

- `QA_BROWSER_JSON_URL`
  - default: `http://127.0.0.1:9234/json`
- `QA_BROWSER_PROFILE_DIR`
  - default: OS temp directory, outside the repo
- `QA_ALLOW_REPO_BROWSER_PROFILE_DIR`
  - default: `false`
  - required only if you intentionally want a repo-local browser profile dir and accept responsibility
- `QA_TIMEOUT_MS`
  - default: `45000`
- `QA_VISIBLE`
  - set `true` to use a visible Chrome window
- `QA_KEEP_BROWSER`
  - set `true` to leave Chrome open after the check

## What The Helper Checks

Always:

- `/api/expo/scene` returns `200`
- `/api/expo/scene` does not include `expo_review_media`

Sponsor role:

- `CompanyAdmin` loads
- `Media Review` section is visible
- `Upload for review` controls are visible
- approve, reject, and promote controls are hidden
- old `expo_assets` upload controls are hidden
- old asset-pack public-release shortcut is hidden

Admin role:

- `CompanyAdmin` loads
- `Media Review` section is visible
- `Upload for review` controls are visible
- concrete review-upload fixture evidence is detected only from actual upload-row content, not from the generic page shell or upload form
- admin review/promote controls are checked strictly when matching upload data exists
- admin review/promote coverage is reported as `NOT_COVERED` when no matching review-upload fixture is visible
- promoted uploads are reported explicitly as `PROMOTED` so the helper does not confuse a final promoted state with a missing fixture
- old public asset controls are snapshot-reported for admin visibility

## Safe Usage

Capture sponsor storage-state safely:

```powershell
$env:QA_ROLE = "sponsor"
$env:QA_STORAGE_STATE_OUTPUT_PATH = "C:\\qa\\storage-state-sponsor.json"
node scripts/capture-companyadmin-storage-state.mjs
```

Capture admin storage-state safely:

```powershell
$env:QA_ROLE = "admin"
$env:QA_STORAGE_STATE_OUTPUT_PATH = "C:\\qa\\storage-state-admin.json"
node scripts/capture-companyadmin-storage-state.mjs
```

The capture helper opens staging in a visible browser, waits for manual login, then saves storage state only after you press Enter in the terminal.

Read-only sponsor QA:

```powershell
$env:QA_ROLE = "sponsor"
$env:QA_STORAGE_STATE_PATH = "C:\\qa\\storage-state-sponsor.json"
doppler run -- node scripts/qa-companyadmin-media-review.mjs
```

Windows fallback for local Doppler access issues:

```powershell
$env:QA_ROLE = "sponsor"
$env:QA_STORAGE_STATE_PATH = "C:\\qa\\storage-state-sponsor.json"
powershell -ExecutionPolicy Bypass -File scripts/run-with-doppler.ps1 run -- node scripts/qa-companyadmin-media-review.mjs
```

Read-only sponsor diagnose-only:

```powershell
$env:QA_ROLE = "sponsor"
$env:QA_STORAGE_STATE_PATH = "C:\\qa\\storage-state-sponsor.json"
$env:QA_DIAGNOSE_ONLY = "true"
$env:QA_RENDER_WAIT_MS = "10000"
doppler run -- node scripts/qa-companyadmin-media-review.mjs
```

Windows fallback for local Doppler access issues:

```powershell
$env:QA_ROLE = "sponsor"
$env:QA_STORAGE_STATE_PATH = "C:\\qa\\storage-state-sponsor.json"
$env:QA_DIAGNOSE_ONLY = "true"
$env:QA_RENDER_WAIT_MS = "10000"
powershell -ExecutionPolicy Bypass -File scripts/run-with-doppler.ps1 run -- node scripts/qa-companyadmin-media-review.mjs
```

Read-only admin QA:

```powershell
$env:QA_ROLE = "admin"
$env:QA_STORAGE_STATE_PATH = "C:\\qa\\storage-state-admin.json"
doppler run -- node scripts/qa-companyadmin-media-review.mjs
```

Windows fallback for local Doppler access issues:

```powershell
$env:QA_ROLE = "admin"
$env:QA_STORAGE_STATE_PATH = "C:\\qa\\storage-state-admin.json"
powershell -ExecutionPolicy Bypass -File scripts/run-with-doppler.ps1 run -- node scripts/qa-companyadmin-media-review.mjs
```

Read-only admin diagnose-only:

```powershell
$env:QA_ROLE = "admin"
$env:QA_STORAGE_STATE_PATH = "C:\\qa\\storage-state-admin.json"
$env:QA_DIAGNOSE_ONLY = "true"
$env:QA_RENDER_WAIT_MS = "10000"
doppler run -- node scripts/qa-companyadmin-media-review.mjs
```

Windows fallback for local Doppler access issues:

```powershell
$env:QA_ROLE = "admin"
$env:QA_STORAGE_STATE_PATH = "C:\\qa\\storage-state-admin.json"
$env:QA_DIAGNOSE_ONLY = "true"
$env:QA_RENDER_WAIT_MS = "10000"
powershell -ExecutionPolicy Bypass -File scripts/run-with-doppler.ps1 run -- node scripts/qa-companyadmin-media-review.mjs
```

Path override if staging mounts the owner surface somewhere else:

```powershell
$env:QA_COMPANY_ADMIN_PATH = "/expo/admin"
```

Help:

```powershell
node scripts/qa-companyadmin-media-review.mjs --help
node scripts/capture-companyadmin-storage-state.mjs --help
```

## Failure Diagnostics

When the helper does not reach the expected `CompanyAdmin` surface, it now reports:

- final current URL
- page title
- navigation status when Chromium exposes it
- final `document.readyState`
- whether the React root has children
- whether the URL contains `/expo/admin`
- marker presence for:
  - `EXPO ADMIN`
  - `Media Review`
  - `Upload for review`
  - `Sponsor Readiness`
  - `CompanyAdmin`
  - `Submit for review`
  - `Approve`
  - `Promote`
- login/account/logout text hints
- a redacted visible-text preview capped by `QA_DEBUG_TEXT_LIMIT`
- browser console warnings/errors summary
- `pageerror` / runtime exception summary
- failed network requests summary
- JS chunk response status snapshot
- loaded script URLs reduced to origin + filename only
- whether a `CompanyAdmin-*.js` chunk was requested
- service-worker registration count for the staging origin
- optional staging-only service-worker unregister result
- whether the helper reached the bounded CompanyAdmin marker wait target
- admin fixture diagnostics:
  - `adminFixtureReason`
  - `adminFixtureEvidence`
  - `adminNoSavedBoothsDetected`

Use this to distinguish:

- generic app shell only
- route mismatch
- stale/partial storage state
- signed-in but wrong role/context
- access denied
- valid admin render with no review-upload fixture yet

If the output only shows shell text such as the top-level brand/system labels and does not show `Media Review`, rerun with `QA_DIAGNOSE_ONLY=true` and inspect the final URL and marker snapshot before changing runtime code.

Extra diagnostic controls:

- `QA_RENDER_WAIT_MS`
  - increases the bounded wait for lazy route render markers
- `QA_DISABLE_BROWSER_CACHE=true`
  - disables browser cache during diagnostics
- `QA_CLEAR_SERVICE_WORKER=true`
  - unregisters service workers only for the current staging origin before reload

Interpretation guidance:

- `companyAdminChunkRequested=false`
  - likely route/render path issue before lazy CompanyAdmin load
- CompanyAdmin chunk requested but marker wait still false
  - likely runtime error, auth/context guard, or chunk execution failure
- JS chunk responses with non-`200`
  - possible stale HTML, CDN/cache, or asset fetch failure
- service worker registrations present before clear and gone after clear
  - stale service-worker cache was a plausible factor
- React root has children but markers still absent
  - generic shell rendered, but CompanyAdmin surface did not mount visibly
- admin review action fixture `NOT_PRESENT`
  - admin route/render may still be correct
  - approve/reject/promote controls are `NOT_COVERED` in that read-only run
  - do not treat this as an admin render failure

Stricter admin fixture definition:

- fixture `PRESENT` requires concrete review-upload evidence such as:
  - an upload filename row
  - private storage detail copy tied to an upload item
  - kind/MIME/size row for an uploaded item
  - promotion/review detail copy tied to a saved upload row
- fixture `NOT_PRESENT` applies when only the generic `Media Review` section and upload form are visible
- fixture `NOT_PRESENT` also applies when the page shows:
  - `No saved booths loaded for this account yet`

## Coverage Summary

The helper now prints a concise coverage summary:

- `sponsorVisibility`
  - `PASS`, `FAIL`, or `N/A`
- `adminRenderVisibility`
  - `PASS`, `FAIL`, or `N/A`
- `adminReviewActionFixture`
  - `PRESENT`, `NOT_PRESENT`, or `N/A`
- `adminReviewActionControls`
  - `PASS`, `FAIL`, `NOT_COVERED`, or `N/A`
- `adminReviewFixtureState`
  - `PENDING_REVIEW`, `APPROVED`, `PROMOTED`, `REJECTED`, `NOT_PRESENT`, or `N/A`
- `adminFixtureReason`
  - why the helper classified fixture coverage the way it did
- `adminFixtureEvidence`
  - the concrete evidence markers used by the helper
- `adminNoSavedBoothsDetected`
  - `true`, `false`, or `N/A`

Meaning:

- `PASS`
  - the covered check succeeded
- `FAIL`
  - the covered check failed and should be treated as a real regression
- `NOT_COVERED`
  - a fixture-dependent admin action check could not be exercised in the current read-only session
- `PROMOTED`
  - the fixture already reached the final promoted state, so the helper reports the final state instead of treating it as missing coverage
- `N/A`
  - that coverage category does not apply to the current role

## Forbidden Usage

Do not:

- commit storage-state JSON files
- place storage-state JSON files under the repo
- save captured storage-state files under `handoff/`, `docs/`, `scripts/`, `review_artifacts/`, or any repo-local temp folder
- place browser profile dirs under the repo unless you explicitly set `QA_ALLOW_REPO_BROWSER_PROFILE_DIR=true`
- store passwords in env or script arguments
- point mutation mode at `www.30sek24.com`
- use production for storage-state capture unless you explicitly override the refusal, and even then it is not recommended
- use real production sponsor/admin sessions for mutation testing
- treat this helper as a credential generator or login automation tool

Forbidden repo-local auth/session artifact paths include:

- `review_artifacts/`
- `handoff/`
- `docs/`
- `scripts/`
- any other path under the repo root

## Mutation Mode

Current status:

- default mode is read-only
- `QA_ALLOW_MUTATION=true` is guarded and refuses unsafe usage
- production hosts are refused
- this minimal helper does not automate approve/reject/promote or uploads yet

If mutation mode is requested later, it must use:

- disposable staging/test booth only
- disposable sponsor/admin session only
- explicit `QA_TEST_BOOTH_ID`
- explicit `QA_TEST_FILE_PATH`

## Storage State Notes

This helper expects an already-authenticated local storage-state JSON file.

It does not:

- create the file
- export the file
- save cookies
- write tokens back to disk

Use only non-committed local files outside the repo or in ignored local paths.

Storage-state capture workflow:

1. run `scripts/capture-companyadmin-storage-state.mjs`
2. log in manually in the opened staging browser
3. navigate to `/expo/admin` if needed
4. press Enter in terminal
5. confirm the JSON file exists outside the repo
6. keep the file local and unshared

## Browser Profile Cleanup

Default behavior:

- browser profile data is created under the OS temp directory
- the temp browser profile is deleted after the run

Cleanup is skipped only when:

- `QA_KEEP_BROWSER=true`, or
- you explicitly provided `QA_BROWSER_PROFILE_DIR`

If you explicitly provide `QA_BROWSER_PROFILE_DIR`, you are responsible for its cleanup.

## Output Redaction

The helper does not print full local storage-state paths.

Output redaction rules:

- `storageStatePath` is reported as `<redacted>`
- profile directory is reported as `<temp>` when using the default transient temp profile
- explicit local profile paths are reduced to basename-only when included in structured output
- capture helper logs only the basename of the saved storage-state file, not the full path
- diagnose-only output follows the same redaction rules
- script URL diagnostics are reduced to origin + asset filename only

## Run Read-Only QA After Capture

After capture, run the existing read-only helper with the saved file:

```powershell
$env:QA_ROLE = "sponsor"
$env:QA_STORAGE_STATE_PATH = "C:\\qa\\storage-state-sponsor.json"
doppler run -- node scripts/qa-companyadmin-media-review.mjs
```

```powershell
$env:QA_ROLE = "admin"
$env:QA_STORAGE_STATE_PATH = "C:\\qa\\storage-state-admin.json"
doppler run -- node scripts/qa-companyadmin-media-review.mjs
```

If bare `doppler run` fails on this Windows machine, set `DOPPLER_BIN` to a valid `doppler.exe` path or use:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/run-with-doppler.ps1 run -- node scripts/qa-companyadmin-media-review.mjs
```
