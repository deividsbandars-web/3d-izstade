# Release Scope Lock

Date: 2026-06-30
Scope: root Vite SPA release route surface

This document separates production release routes from internal/backoffice and demo/stub
routes. It complements `docs/RELEASE_ROADMAP_V1.md` and the pre-release product audit.

## Feature Flags

| Flag | Default | Purpose |
| --- | --- | --- |
| `VITE_ENABLE_DEMO` | `0` | Enables demo/stub routes that are not part of the release surface. |

Production builds must leave `VITE_ENABLE_DEMO` unset or set to `0`. Demo routes redirect
to `/` when the flag is disabled. SHIP and INTERNAL routes keep their existing behavior.

## Route Matrix

| Route | Status | Notes |
| --- | --- | --- |
| `/` | SHIP | Public entry. |
| `/login` | SHIP | Auth entry. |
| `/reset-password` | SHIP | Auth recovery. |
| `/privacy` | SHIP | Public legal page. |
| `/expo-3d` | SHIP | Canonical Web3D expo route. |
| `/expo` | SHIP | Redirects to `/expo-3d`. |
| `/expo/admin` | SHIP | Sponsor/company admin flow. |
| `/expo/sponsor-packages` | SHIP | Sponsor lead-gen package page. |
| `/expo/sponsor-leads` | SHIP | Sponsor lead inbox. |
| `/expo/booth/:id` | SHIP | Booth presentation route. |
| `/expo/booth/:id/stream` | SHIP | Booth stream room route. |
| `/expo/showroom/:id` | SHIP | Showroom route. |
| `/modular-homes/studio` | SHIP | GALA modular-home lead-gen studio. |
| `/modular-homes/quotes` | SHIP | Modular-home quote review/admin route. |
| `/calculators` | SHIP | Calculators lead-gen hub. |
| `/calculators/leads` | SHIP | Calculator lead inbox. |
| `/*-calculator` routes | SHIP | Calculator direct routes and existing redirects. |
| `/marketplace` | SHIP | Expo marketplace surface. |
| `/urgent-services` | SHIP | Expo service surface. |
| `/events` | SHIP | Expo events surface. |
| `/ads-network` | SHIP | Expo advertising surface. |
| `/sector/:id` | SHIP | Sector content route. |
| `/galerija` | SHIP | Digital gallery route. |
| `/projekcija` | SHIP | Projector route. |
| `/platform/dashboard` | INTERNAL | Backoffice/platform surface; not newly gated in WP-D. |
| `/platform/leads` | INTERNAL | Backoffice/platform surface; not newly gated in WP-D. |
| `/platform/marketplace` | INTERNAL | Backoffice/platform surface; not newly gated in WP-D. |
| `/platform/expo` | INTERNAL | Backoffice/platform surface; not newly gated in WP-D. |
| `/onboarding` | INTERNAL | Backoffice/product ops surface; not newly gated in WP-D. |
| `/workflows` | INTERNAL | Workflow builder surface; not newly gated in WP-D. |
| `/dashboard` | INTERNAL | Legacy dashboard route. |
| `/city-map` | INTERNAL | Legacy city map route. |
| `/projects` | INTERNAL | Project builder route. |
| `/clients` | INTERNAL | Client dashboard route. |
| `/inventory` | INTERNAL | Inventory manager route. |
| `/finances` | INTERNAL | Finance admin route. |
| `/leaderboard` | INTERNAL | Dashboard utility route. |
| `/my-portal` | INTERNAL | Client portal route. |
| `/studio` | INTERNAL | Studio manager route. |
| `/youtube` | INTERNAL | YouTube manager route. |
| `/documents` | INTERNAL | Document hub route. |
| `/settings` | INTERNAL | Settings route. |
| `/economy-simulator` | DEMO-ONLY | Disabled unless `VITE_ENABLE_DEMO=1`. |
| `/business-fleet` | DEMO-ONLY | Disabled unless `VITE_ENABLE_DEMO=1`. |
| `/business-economy` | DEMO-ONLY | Disabled unless `VITE_ENABLE_DEMO=1`. |
| `/autonomous-engine` | DEMO-ONLY | Disabled unless `VITE_ENABLE_DEMO=1`. |
| `/prototype` | DEMO-ONLY | Disabled unless `VITE_ENABLE_DEMO=1`. |
| `/platform/agents` | DEMO-ONLY | Disabled unless `VITE_ENABLE_DEMO=1`. |
| `/generator` | DEMO-ONLY | Disabled unless `VITE_ENABLE_DEMO=1`. |
| `/content-generator` | DEMO-ONLY | Disabled unless `VITE_ENABLE_DEMO=1`. |
| `/akcelerators` | DEMO-ONLY | Disabled unless `VITE_ENABLE_DEMO=1`. |
| `/ai-agent` | DEMO-ONLY | Disabled unless `VITE_ENABLE_DEMO=1`. |
| `/ai-matchmaker` | DEMO-ONLY | Disabled unless `VITE_ENABLE_DEMO=1`. |

## Release Rule

Demo/stub routes may remain in the repository, but they must not be part of the default
production route surface. They are available only when explicitly enabled for demo builds.

This WP-D change does not change sponsor boulevard camera/FOV/lookAt, booth geometry,
auth policy, quote behavior, payment behavior, backend packaging, staging, or production
deployment.
