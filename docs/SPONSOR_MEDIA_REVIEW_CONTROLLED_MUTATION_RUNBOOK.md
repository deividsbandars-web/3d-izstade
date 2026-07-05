# Sponsor Media Review Controlled Mutation Runbook

## Scope

- Date: `2026-06-18`
- Environment: staging only
- Status: preparation only
- Mutation lifecycle: **not performed in this task**

This runbook prepares the next approved staging-only sponsor media review lifecycle:

1. sponsor uploads private review media
2. admin sees a pending review item
3. admin approves or rejects
4. admin promotes approved media
5. promotion copies media into public `expo_assets`
6. public scene fields update only after explicit promote
7. `/api/expo/scene` never exposes private `expo_review_media`

## Current Green Baseline

Confirmed from the current repo state and read-only checks:

- staging frontend uses the current Supabase project ref `aasovfczmqytdtugcrmh`
- staging admin auth is working and the account chip resolves to `ADMIN`
- CompanyAdmin read-only QA passes
- `/api/expo/scene` returns `200`
- `/api/expo/scene` omits `expo_review_media`
- backend smoke passed with:
  - `/health -> 200`
  - `/api/expo/scene -> 200`
  - `authPolicy -> public-readonly`
  - `sectors -> 5`
  - `companies -> 3`
  - `booths -> 3`

## Safest Fixture Path

The safest available fixture path is to reuse the existing staging-only disposable booth candidate already surfaced in prior reports:

- booth id: `684aadc9-b538-4880-a78f-b2285bb3ecbf`

Use that booth only if the operator re-confirms all of the following:

- the booth is staging-only and disposable
- the booth is not a live sponsor or production fixture
- the booth is not carrying real sponsor/customer assets
- the booth is not currently promoted as public release content
- the booth is still present in the public scene and can be verified before mutation

If the booth cannot be re-confirmed as disposable, stop and create a new staging-only fixture in a later approved task.

## Fixture Discovery Step

Use read-only checks to confirm the booth is suitable before any mutation:

1. Confirm backend smoke is green.
2. Confirm admin auth is green with a real admin storage-state replay.
3. Confirm `/api/expo/scene` returns `200` and still omits `expo_review_media`.
4. Confirm the booth id exists in the public scene or can otherwise be manually verified as disposable staging-only data.
5. Confirm the booth does not appear to be a live sponsor release surface.

If the public scene does not expose enough detail to verify the booth identity, require explicit operator confirmation with:

- `QA_CONFIRM_DISPOSABLE_BOOTH=true`

That override is allowed only after manual confirmation that the booth is disposable staging-only test data.

## Preflight Checks Before Any Mutation

Run these checks before a sponsor upload is attempted:

1. `QA_TEST_BOOTH_ID` is set to a real booth id, not a placeholder.
2. The booth is confirmed disposable.
3. The booth is not currently live/public beyond normal staging visibility.
4. Admin auth is `ADMIN`.
5. `/api/expo/scene` returns `200`.
6. `/api/expo/scene` still omits `expo_review_media`.
7. Sponsor and admin storage-state files exist outside the repo.
8. Test media is a small disposable file outside the repo or in OS temp only.
9. `QA_ALLOW_MUTATION=true` is explicitly set only for the actual operator-run lifecycle step.

## Stop Conditions

Stop immediately if any of the following are true:

- fixture identity is unclear
- the booth is live/public in a way that makes it unsuitable as a disposable test fixture
- the booth carries real sponsor/customer assets
- `/api/expo/scene` is not `200`
- `/api/expo/scene` contains `expo_review_media`
- admin auth is not `ADMIN`
- `QA_TEST_BOOTH_ID` is missing or placeholder-like
- storage-state files are missing or not outside the repo
- test media is missing or not disposable
- production domains are involved

## Read-Only Command Set

These commands are safe and should be run before any mutation attempt.

### Backend smoke

```powershell
& 'C:\Users\esauk\AppData\Local\Microsoft\WinGet\Packages\Doppler.doppler_Microsoft.Winget.Source_8wekyb3d8bbwe\doppler.exe' run -- node scripts\smoke-backend-supabase.mjs
```

### Helper help / safety check

```powershell
node scripts\qa-companyadmin-media-review-mutation.mjs --help
```

### Read-only readiness check

```powershell
$env:QA_BASE_URL = "https://staging.30sek24.com"
$env:QA_SPONSOR_STORAGE_STATE_PATH = "<outside-repo sponsor storage-state>"
$env:QA_ADMIN_STORAGE_STATE_PATH = "<outside-repo admin storage-state>"
$env:QA_TEST_BOOTH_ID = "684aadc9-b538-4880-a78f-b2285bb3ecbf"
$env:QA_TEST_MEDIA_PATH = "<outside-repo tiny test image>"
$env:QA_ALLOW_MUTATION = "false"
node scripts\qa-companyadmin-media-review-mutation.mjs
```

If the booth cannot be verified from the public scene, add:

```powershell
$env:QA_CONFIRM_DISPOSABLE_BOOTH = "true"
```

Use that override only after manual confirmation.

## Manual Mutation Runbook

All steps below are **PENDING OPERATOR CONFIRMATION**.

### Step 1: Sponsor upload

**PENDING OPERATOR CONFIRMATION**

Upload a tiny disposable PNG/JPG/WEBP for booth `684aadc9-b538-4880-a78f-b2285bb3ecbf` using the staging sponsor account and the protected upload path.

Checks:

- upload goes through the protected backend route
- file lands in private `expo_review_media`
- metadata is written to `assets_3d.media_review.uploads`
- `/api/expo/scene` still returns `200`
- `/api/expo/scene` still omits `expo_review_media`

### Step 2: Admin sees pending review

**PENDING OPERATOR CONFIRMATION**

Open CompanyAdmin as the staging admin account and confirm:

- pending review row is visible
- status reads `pending_review`
- sponsor-only controls remain hidden

### Step 3: Admin approve or reject

**PENDING OPERATOR CONFIRMATION**

Approve or reject the pending upload only from the admin account.

Checks:

- sponsor cannot approve, reject, or promote
- admin-only controls are visible
- rejected upload remains private

### Step 4: Admin promote approved upload

**PENDING OPERATOR CONFIRMATION**

If approved, promote the upload explicitly to the correct public slot.

Checks:

- promote is allowed only from `approved`
- file copies into public `expo_assets`
- public company/booth fields are updated only during explicit promote
- promoted object receives a public path / URL

### Step 5: Post-promote verification

**PENDING OPERATOR CONFIRMATION**

Confirm:

- `/api/expo/scene` remains `200`
- `/api/expo/scene` still omits `expo_review_media`
- public scene only reflects the explicit promoted media
- non-promoted uploads remain private

## Field / Status Expectations

Review upload statuses:

- `pending_review`
- `approved`
- `rejected`
- `promoted`

Allowed flow:

- `pending_review -> approved`
- `pending_review -> rejected`
- `approved -> promoted`

Blocked flow:

- `pending_review -> promote`
- `promoted -> reject`
- invalid promote target

## Go / No-Go Checklist for the Next Lifecycle Run

Go only if all are true:

- staging smoke is green
- admin auth is `ADMIN`
- `QA_TEST_BOOTH_ID` is a real disposable booth id
- booth disposable status is manually confirmed
- sponsor/admin storage-state files are outside the repo
- test media is disposable and outside the repo / temp only
- `/api/expo/scene` is `200`
- `/api/expo/scene` omits `expo_review_media`
- the operator explicitly approves mutation

No-go if any are true:

- booth identity is uncertain
- the booth is live/public or carries real assets
- admin auth is not `ADMIN`
- `/api/expo/scene` fails
- private review paths leak into the public scene
- storage-state or test media artifacts are not staged safely outside the repo

## Notes

- No mutation was performed in this task.
- This runbook is staging-only.
- Do not use production domains or production data.
