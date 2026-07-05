# MVP Product Experience And Visual QA Audit

**Date:** 2026-06-20
**Environment:** Staging only
**Verdict:** GO WITH PRODUCT WARNINGS

## Scope

Read-only product audit of the current staging MVP surfaces:

- public expo / booth experience
- CompanyAdmin booth/media flow
- modular home customer flow
- graphics / visual quality
- broken states, fake controls, dead ends, and misleading claims

No staging data was mutated.

## Executive Summary

The public expo sales/demo path is good enough for a controlled staging demo. The modular home studio is also usable and visibly responds to option changes, but it is a limited preset configurator, not a full detail-level builder.

The weakest area is the booth-room / premium-streaming path. The live booth route loads, but it is still a degraded fallback with `NO_ACTIVE_STREAMER` and `PREMIUM UNREAL DEGRADED`, so it should not be sold as a polished booth-room experience.

CompanyAdmin follow-through could not be fully reopened in this audit because the available outside-repo storage-state is spent and the protected login page surfaced refresh-token errors. That is a QA/auth-session limitation, not a staging data mutation.

## Method

Evidence was gathered with:

- `npm run build`
- `npm run lint`
- backend smoke through the Windows Doppler wrapper / explicit Doppler executable path
- live browser QA on staging
- screenshot capture
- console and network failure capture

## Evidence Summary

### Public expo / booth experience

Routes checked:

- `https://staging.30sek24.com/expo-3d?salesDemo=1`
- `https://staging.30sek24.com/expo/booth/58fda8a0-ef41-42db-9cdd-cb8c89b527fa`

Screenshots:

- `C:\Users\esauk\AppData\Local\Temp\mvp-product-audit-public\expo-3d-sales-desktop.png`
- `C:\Users\esauk\AppData\Local\Temp\mvp-product-audit-public\expo-3d-sales-mobile.png`
- `C:\Users\esauk\AppData\Local\Temp\mvp-product-audit-public\expo-booth-room-desktop.png`

Findings:

- `/expo-3d` loads reliably on desktop and mobile.
- The public sales/demo shell is visually strong, readable, and responsive.
- The route has meaningful navigation and call-to-action controls.
- The booth-room route is only a degraded fallback at the moment. It is technically alive, but not a convincing premium booth-room demo.
- No console errors or network failures were captured on the public expo route.

Verdict:

- `Route health`: PASS
- `Navigation clarity`: PASS
- `Content completeness`: PASS for public expo, PARTIAL for booth-room detail
- `Visual quality`: PASS for public expo, PARTIAL for booth-room detail
- `Interaction quality`: PASS for public expo, PARTIAL for booth-room detail
- `Demo readiness`: PASS for controlled public demo, NOT demo-ready for premium booth-room claims

### CompanyAdmin booth/media flow

Routes checked:

- `https://staging.30sek24.com/login?next=/expo/admin`
- `https://staging.30sek24.com/expo/admin`
- `https://staging.30sek24.com/modular-homes/quotes`

Screenshots:

- `C:\Users\esauk\AppData\Local\Temp\mvp-product-audit-public\companyadmin-login-desktop.png`
- `C:\Users\esauk\AppData\Local\Temp\mvp-product-audit-public\modular-home-quotes-desktop.png`

Findings:

- The login gate loads normally.
- The current outside-repo admin storage-state is spent, so the audit could not reopen the protected admin shell cleanly.
- The login page surfaced refresh-token errors from Supabase auth refresh, which is consistent with an expired QA session rather than a staging data mutation.
- No direct browser writes to sensitive tables were observed.
- No private `expo_review_media` exposure was observed.

Verdict:

- `Auth/admin confidence`: PARTIAL
- `Current-state clarity`: PASS for the login gate, PARTIAL for protected admin content
- `Media review UX`: PARTIAL / blocked by spent QA session
- `Safety/non-leak`: PASS
- `Demo readiness`: NOT demo-ready as a live admin walkthrough without a fresh valid QA session

### Modular home customer flow

Routes checked:

- `https://staging.30sek24.com/modular-homes/studio`
- `https://staging.30sek24.com/modular-homes/studio?homeStudio=1&homeDemo=1`
- `https://staging.30sek24.com/modular-homes/quotes`

Screenshots:

- `C:\Users\esauk\AppData\Local\Temp\mvp-product-audit-public\modular-home-studio-desktop.png`
- `C:\Users\esauk\AppData\Local\Temp\mvp-product-audit-public\modular-home-studio-mobile.png`
- `C:\Users\esauk\AppData\Local\Temp\mvp-modular-design-proof\modular-home-design-proof.png`

Findings:

- The modular home studio loads and presents a coherent browser-based product shell.
- The Design tab is interactive.
- Clicking a design option changes visible state in the DOM and in the on-screen summary.
- The UI exposes a limited preset configurator, not a free-form every-detail editor.
- The quote area is present, but the safe audit did not submit a live quote.
- The protected quote-review page is behind auth and was not accessible with the spent QA session.

Proof of state change:

- Before clicking Design, `data-home-demo-active-tab` was `overview`.
- After clicking Design, `data-home-demo-active-tab` became `design`.
- After clicking a facade option, `data-home-config-product-id` remained stable while the summary updated to the selected preset state.

Verdict:

- `Configurator functionality`: PASS
- `Option depth`: PARTIAL
- `Design selection quality`: PASS for preset selection
- `Visual quality`: PASS
- `Quote flow integrity`: PARTIAL, preview-only in this audit
- `Mobile usability`: PASS
- `Demo readiness`: PASS for controlled preset demo, NOT a full custom-home builder

### Graphics quality

Evidence used:

- public expo desktop and mobile screenshots
- booth-room fallback screenshot
- modular-home studio screenshots
- modular-home design-proof screenshot

Assessment:

- Public expo visuals are polished enough for a controlled demo.
- Modular-home studio visuals are cohesive and legible.
- Booth-room fallback visuals are weak compared with the public expo and should not be pitched as premium Unreal quality.
- No broken textures, broken images, or missing hero assets were observed in the public expo and modular-home studio paths exercised here.

Verdict:

- `Load quality`: PASS
- `Layout polish`: PASS for public expo and modular-home studio
- `Image sharpness`: PASS for screenshots captured
- `Visual consistency`: PASS with warnings
- `Missing assets`: None observed on the tested public/demo paths
- `3D/panorama realism`: PARTIAL; the booth-room fallback is not premium-grade
- `Perceived demo quality`: GOOD ENOUGH FOR CONTROLLED DEMO for public expo and modular-home studio, ACCEPTABLE WITH WARNINGS overall

## Can Every Detail Be Changed?

| Detail/category | User can change it? | Visible result? | Persisted to quote/admin? | Evidence | Gap severity |
| --- | --- | --- | --- | --- | --- |
| Exterior style / design | Yes, but only through presets | Yes | Not tested in this read-only audit | Design tab and facade options updated the summary and selected state | Medium |
| Room / panorama / design preset | Partial | Yes | Not tested | Preset tabs and room-use options changed the selected state | Medium |
| Color / material selections | Yes, within preset options | Yes | Not tested | Facade choices such as natural timber / dark thermo wood / light painted were visible and selectable | Medium |
| Layout / size / model options | Yes, within preset options | Yes | Not tested | Template, layout variant, and dimension preset controls were present | Medium |
| Interior / exterior visual options | Partial | Yes | Not tested | View-mode and interior selection controls were present, but the flow is still preset-driven | Medium |
| Quote contact / details | Yes, as form inputs | Yes | Preview-only in this audit | Quote form fields were editable in the studio | Low |
| Admin follow-through state | No, not fully verified here | Partial | Not tested | Protected quote/admin pages remained behind auth and the available QA session was spent | High |

Conclusion:

- The product supports limited preset customization.
- It is not a full detail-level configurator.
- Any claim that "every detail" can be changed would be overstated.

## Console And Network Summary

- Public expo route: no errors, no network failures, only the benign `THREE.Clock` warning.
- Modular home studio: no errors, no network failures, only the benign `THREE.Clock` warning.
- Booth-room fallback: no errors, but the route itself is a degraded fallback.
- Login / quote-review gated routes: refresh-token errors were observed because the QA storage-state was spent.

## Do Not Claim

- Do not claim the booth-room route is premium-grade Unreal.
- Do not claim full per-detail customization.
- Do not claim quote submission persistence was verified here.
- Do not claim protected CompanyAdmin follow-through was fully reopened in this audit.
- Do not claim graphics are production quality; only controlled-demo quality was verified.

## Verdict

**GO WITH PRODUCT WARNINGS**

Reasons:

- Public expo and modular-home studio are usable and visually solid.
- The modular-home configurator responds to option changes.
- The booth-room / premium-streaming path is still a degraded fallback.
- Protected admin follow-through was blocked by a spent QA session, so it remains partially unverified in this read-only audit.

## Next Implementation Priorities

1. Improve the booth-room fallback so it reads as an intentional demo state, not a near-empty technical fallback.
2. Decide whether the modular-home quote flow should expose a read-only preview-only submit path or remain a local-only concept.
3. Refresh the outside-repo admin QA session when a fresh storage-state is available, then reopen the protected admin/quote review path.
4. Keep the public expo and modular-home studio paths visually consistent with the current polished shell.
