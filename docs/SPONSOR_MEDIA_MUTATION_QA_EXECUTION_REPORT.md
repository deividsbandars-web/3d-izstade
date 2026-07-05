# Sponsor Media Mutation QA Execution Report

## Scope

- Date: `2026-06-18`
- Environment: `staging` only
- Booth id: `684aadc9-b538-4880-a78f-b2285bb3ecbf`
- Goal: document the controlled sponsor media upload/review/promote mutation QA round without automating destructive lifecycle actions
- Status: manual lifecycle `NOT_RUN` in this shell

## Handling Notes

Storage-state handling:

- no storage-state files were committed
- no storage-state contents were printed
- this shell did not have the operator's outside-repo sponsor/admin storage-state env vars injected
- readiness rerun for this report used temporary outside-repo placeholder JSON files only to exercise the helper's non-secret path checks

Test media handling:

- no real sponsor media was committed
- no generated media was kept in the repo
- readiness rerun used helper-generated temp media outside the repo and deleted it immediately after the run

## Readiness Result

Latest readiness rerun in this shell:

- `actionMode: READINESS_ONLY`
- `ready: true`
- `refusedMutation: true`
- `baseUrl: https://staging.30sek24.com`
- `apiBaseUrl: https://api-staging.30sek24.com`
- sponsor/admin outside-repo path checks: `PASS`
- `QA_TEST_BOOTH_ID` validation: `PASS`
- booth existence in public scene: `FOUND`
- `/api/expo/scene` returned `200`
- `/api/expo/scene` omitted `expo_review_media`

Important limitation:

- the readiness helper does not prove authenticated sponsor/admin session validity
- the authoritative signed-in baseline remains the closed read-only QA documented in:
  - `docs/SPONSOR_MEDIA_SIGNED_IN_READONLY_QA_REPORT.md`

## Manual Lifecycle Steps

### 1. Sponsor uploads private review media for booth `684aadc9-b538-4880-a78f-b2285bb3ecbf`

- Classification: `NOT_RUN`
- Observed result:
  - not executed in this shell
- Blocker:
  - no operator-confirmed live sponsor session was injected into this shell
  - task instructions explicitly forbade automating destructive mutation without explicit operator execution

### 2. Confirm upload is stored as private review media under `expo_review_media`

- Classification: `NOT_RUN`
- Observed result:
  - no upload occurred, so no new storage object was available to inspect

### 3. Confirm `/api/expo/scene` remains `200` and does not expose `expo_review_media`

- Classification: `PASS`
- Observed result:
  - final public scene check returned:
    - `statusCode=200`
    - `authPolicy=public-readonly`
    - `sectors=3`
    - `companies=3`
    - `booths=3`
    - `containsExpoReviewMedia=false`

### 4. Admin sees `pending_review` item for the disposable staging booth

- Classification: `NOT_RUN`
- Observed result:
  - no sponsor upload occurred, so no pending review item could be created or observed

### 5. Admin approves or rejects the upload

- Classification: `NOT_RUN`
- Observed result:
  - no pending review upload fixture existed in this shell run

### 6. If approved, admin promotes the upload

- Classification: `NOT_RUN`
- Observed result:
  - no approved review upload existed in this shell run

### 7. Confirm promote copies media into public `expo_assets`

- Classification: `NOT_RUN`
- Observed result:
  - no promote action occurred

### 8. Confirm public scene fields are updated only after explicit promote

- Classification: `NOT_RUN`
- Observed result:
  - no mutation lifecycle was executed

### 9. Confirm `/api/expo/scene` still does not expose private `expo_review_media`

- Classification: `PASS`
- Observed result:
  - final scene recheck still omitted `expo_review_media`

## Cleanup / Rollback Notes

- no sponsor upload was executed
- no admin review or promote action was executed
- no disposable staging booth data was mutated
- no cleanup action was required

## Remaining Blockers

- a real operator-run sponsor upload has not been executed in this shell
- a real operator-run admin approve/reject/promote sequence has not been executed in this shell
- no post-upload fixture exists yet for validating:
  - `pending_review`
  - `approved`
  - `promoted`
  - public `expo_assets` copy behavior

## Go / No-Go Recommendation

- readiness baseline: `GO`
- signed-in read-only sponsor/admin baseline: `GO`
- public scene non-leak baseline: `GO`
- manual mutation lifecycle: `NOT_RUN`

Recommendation:

- acceptable to proceed to a controlled staging-only operator mutation round
- not enough evidence yet to mark upload/approve/promote lifecycle as passed
- do not broaden claims beyond:
  - readiness is green
  - signed-in read-only QA is green
  - `/api/expo/scene` non-leak remains green

## Next Operator-Run Step

1. Use the disposable sponsor staging account to upload a tiny disposable image for booth `684aadc9-b538-4880-a78f-b2285bb3ecbf`.
2. Confirm the new item appears as `pending_review` in the admin surface.
3. Approve or reject from the disposable admin account.
4. If approved, promote once.
5. Re-check public scene health and confirm no `expo_review_media` exposure.
