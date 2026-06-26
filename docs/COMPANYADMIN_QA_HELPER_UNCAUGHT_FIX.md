# CompanyAdmin QA Helper Uncaught Fix

The CompanyAdmin media review QA helper was fixed so the browser-evaluated page closure no longer references Node-scope helper functions.

## What changed

Inside the `Runtime.evaluate` page inspection, the helper now defines its own local normalization helpers:

* `normalizePageText`
* `normalizeAccountChipText`
* `hasAdminRoleMarker`

This keeps the page evaluation self-contained and avoids `Uncaught` runtime exceptions caused by calling Node-only helpers from the browser context.

## What stays strict

The helper still requires all admin-mode conditions to pass:

* account chip visible
* `ADMIN` role marker visible in the chip or explicit role text
* `LOGOUT` visible
* `LOGIN` hidden
* `SIGN IN REQUIRED` absent
* `Access denied` absent

## Diagnostics

If the browser evaluation throws, the helper now includes:

* exception description when available
* stack trace call frames when available

No secrets, storage-state values, cookies, or tokens are printed.

## Validation

Validated with:

* `node --check scripts/qa-companyadmin-media-review.mjs`
* `npm run build`
* `npm run lint`
* `node scripts/qa-companyadmin-media-review.mjs --help`
* safe negative helper runs without `QA_STORAGE_STATE_PATH`
* safe negative helper runs with a missing storage-state path

## Operator positive replay command

When the outside-repo admin storage state is available, rerun:

```powershell
$env:QA_ROLE="admin"
$env:QA_STORAGE_STATE_PATH="C:\qa\companyadmin\admin-storage-state.json"
$env:QA_ALLOW_MUTATION="false"
$env:QA_BASE_URL="https://staging.30sek24.com"
$env:QA_DIAGNOSE_ONLY="true"
$env:QA_RENDER_WAIT_MS="15000"
doppler run -- node scripts\qa-companyadmin-media-review.mjs
```

Do not commit storage-state files or browser profile artifacts.
