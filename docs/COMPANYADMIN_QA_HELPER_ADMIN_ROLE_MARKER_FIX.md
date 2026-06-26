# CompanyAdmin QA Helper Admin Role Marker Fix

The signed-in CompanyAdmin QA helper had a false-negative for the admin role chip.

## What was fixed

`scripts/qa-companyadmin-media-review.mjs` now normalizes the visible account chip text before checking for the admin role marker.

This makes the helper recognize visible chip text such as:

`d***@g***.com · ADMIN`

while still failing when the chip shows:

`d***@g***.com · USER`

## What stays strict

The helper still fails if any of these are true in admin mode:

* `LOGIN` is visible
* `LOGOUT` is not visible
* `SIGN IN REQUIRED` is visible
* `Access denied` is visible
* the account chip is missing
* the account chip does not expose `ADMIN`

## Validation

Validated with:

* `npm run build`
* `npm run lint`
* `node scripts/qa-companyadmin-media-review.mjs --help`
* safe negative helper runs without `QA_STORAGE_STATE_PATH`
* safe negative helper runs with a missing storage-state path

## Expected positive replay command

When an outside-repo authenticated admin storage state exists, rerun:

```powershell
$env:QA_ROLE='admin'
$env:QA_DIAGNOSE_ONLY='true'
$env:QA_STORAGE_STATE_PATH='C:\qa\companyadmin\admin-storage-state.json'
node scripts\qa-companyadmin-media-review.mjs
```

Do not commit storage-state files or browser profile artifacts.
