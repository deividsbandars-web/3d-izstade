# CompanyAdmin QA Helper Role Token Detection Fix

The CompanyAdmin media review QA helper now detects the admin role marker from tokenized visible account text inside the browser-evaluated page closure.

## What changed

The browser-side page inspection now:

* normalizes non-breaking spaces and separator glyphs
* collapses repeated whitespace
* uppercases the visible account chip text
* splits on non-letter characters
* checks whether the token list includes `ADMIN`

This correctly handles:

* `d***@g***.com · ADMIN`
* `d***@g***.com ADMIN`
* `Current account d***@g***.com · ADMIN`

and still rejects:

* `d***@g***.com · USER`
* missing account chip
* sign-in required states

## Why this was needed

The previous browser-evaluated implementation used escape-sensitive regex logic. That created a false-negative even when the visible page text clearly contained `ADMIN`.

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
