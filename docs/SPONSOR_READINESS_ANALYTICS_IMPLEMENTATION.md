# Sponsor Readiness Analytics Implementation

## Scope

- Date: `2026-06-18`
- Goal: lightweight sponsor readiness and analytics MVP surface
- Change type: minimal frontend + docs diff

## Fields Reused

This step reuses existing sponsor/admin data without adding new tables, tracking SDKs, or migrations.

Reused booth/company/status data:

- booth publication status
  - `draft`
  - `review`
  - `approved`
  - `active`
  - `rejected`
  - `archived`
- `assets_3d.media_review`
  - `logoUrl`
  - `posterUrl`
  - `heroImageUrl`
  - `heroVideoUrl`
  - `websiteUrl`
  - `bookingUrl`
  - `ctaLabel`
  - `tagline`
  - `mediaNotes`
- `assets_3d.sponsor_asset_pack`
  - `packageTier`
  - sponsor asset readiness fields already used by `CompanyAdmin`
- `assets_3d.screen_content`
  - existing visible booth screen readiness path
- `contact_info.description`
  - reused as fallback sponsor story/copy signal

Reused business signals:

- booth analytics counters from existing booth analytics read path
  - `visits`
  - `interactions`
  - `leads_generated`
- protected managed booth lead inbox count from the existing review surface

## Readiness Rules

The new `Sponsor Readiness` panel in `CompanyAdmin` derives a simple sponsor/admin-facing category from existing data:

- `Archived`
  - booth status is `archived`
- `Published`
  - booth status is `active`
- `Waiting for approval`
  - booth status is `review` or `approved`
- `Needs media review`
  - reviewed media references are incomplete or fail existing validation
- `Needs CTA/contact info`
  - CTA copy or website/booking path is missing
- `Ready for demo`
  - booth is not public yet, but it has enough package/media/contact coverage for a guided preview

The panel also shows read-only sub-checks for:

- publication status
- public-scene eligibility / scene presence
- media review completeness
- CTA/contact completeness
- package tier/material readiness
- lead count
- analytics availability

## Metrics Shown

Shown only when already available from the existing repo flow:

- booth publication label
- public-scene eligibility status
- package tier
- lead count
- booth analytics counters:
  - visits
  - interactions
  - leads generated

## Metrics Not Yet Tracked

This step does not invent or simulate analytics that do not already exist.

If booth analytics are unavailable in the current read path, the UI now shows:

- `Not tracked yet`

Not added in this step:

- third-party tracking SDKs
- ad/conversion attribution
- sponsor media engagement funnel
- CTA click dashboards
- per-screen event reporting UI
- new analytics tables or migrations

## Frontend Changes

Updated existing sponsor/admin surface only:

- `src/pages/expo/CompanyAdmin.tsx`

Added:

- a new `Sponsor Readiness` panel in the right-side admin summary column
- readiness category styling and summary text
- read-only readiness cards derived from the current booth/media/package/lead/analytics data
- clearer analytics fallback copy when counters are not available

## Backend Changes

- none

This step reuses existing read-only data already loaded by the admin page:

- managed booth review snapshot
- lead inbox
- booth analytics

## MVP Limitations

- readiness remains a heuristic summary, not a formal release workflow engine
- no new reviewer approval metadata was added
- no direct publish gating was added beyond the existing status flow
- no new analytics ingestion or event tracking was added
- lead counts are read-only and continue using the existing protected lead flow
- public `/api/expo/scene` contract and visibility behavior remain unchanged
