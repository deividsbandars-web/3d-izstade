# Expo Review Access Layer

This document defines the protected API surface used to inspect the Expo world without relying on screenshots or direct browser control.

## Purpose

- give Codex a stable review surface for the live Expo state
- expose world-contract and placement diagnostics through authenticated API calls
- keep review work inside the existing backend boundary instead of browser-only inspection

## Endpoints

### `GET /api/expo/review/snapshot`

Protected.

Returns:
- scene contract metadata
- world counts and quality profile inputs
- district summaries with visual profile data
- placement diagnostics
- recommended camera/review zones

Primary use:
- city review
- district hierarchy review
- placement and slot diagnostics review

### `GET /api/expo/review/booths/:boothId`

Protected.

Returns:
- booth record
- localized booth scene payload
- booth analytics when available
- resolved runtime placement summary
- global review context

Primary use:
- booth premium review
- booth placement verification
- booth-level troubleshooting without browser-only inspection

## Review workflow

1. authenticate with a real app user token
2. call `/api/expo/review/snapshot`
3. identify district, skyline, placement, or quality anomalies
4. if needed, call `/api/expo/review/booths/:boothId`
5. implement scoped fixes in the correct owner branch

## Constraints

- this layer is a review/debug surface, not a public client contract
- endpoints remain protected by Supabase JWT auth
- browser screenshots are still useful for final aesthetic sign-off, but no longer required for every review step
