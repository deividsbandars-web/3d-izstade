# CompanyAdmin QA Helper Node Role Assertion Fix

The CompanyAdmin media review QA helper now derives the final admin role assertion in Node from the returned account chip text, instead of trusting only the browser-side marker.

## What changed

The helper computes a Node-side admin-role boolean from:

* `page.currentAccountChipText`
* fallback `page.currentAccountText`

The Node-side logic:

* normalizes non-breaking spaces
* normalizes middle-dot / bullet separators
* collapses repeated whitespace
* uppercases the text
* splits on non-letter characters
* passes only when one token equals `ADMIN`

## What stays strict

The helper still fails if any of these are true in admin mode:

* `LOGIN` is visible
* `LOGOUT` is absent
* `SIGN IN REQUIRED` is visible
* `Access denied` is visible
* the account chip is missing
* the account chip resolves to `USER` or any non-admin role

## Diagnostics preserved

The helper still reports:

* `currentAccountText`
* `currentAccountChipText`
* `currentAccountRoleVisible` from the browser-side page evaluation
* `currentAccountRoleVisibleNode` from the Node-side assertion

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
