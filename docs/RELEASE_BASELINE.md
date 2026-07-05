# Release Baseline

Date: 2026-06-29

Branch: `release/v1-stabilization`

Freeze commit SHA: `f4244e8a3d4f6c27da22bdb5087b682f74cdc190`

Baseline tag: `v1-baseline`

## Frontend Build

Command: `npm.cmd run build`

Result: PASS

Summary:

- `tsc -b` completed.
- `vite v7.3.1` transformed 1663 modules.
- Build completed in 12.73s.
- PWA generated `dist/sw.js` and `dist/workbox-8c29f6e4.js`.
- PWA precache: 89 entries, 4632.63 KiB.
- Existing Vite warning remains: some chunks are larger than 500 kB after minification.

## Chunk Sizes

Sizes below are the Vite build output values from `npm.cmd run build`.

| Asset | Size | Gzip |
| --- | ---: | ---: |
| `assets/react-three-vendor-D7nREoCv.js` | 1,305.97 kB | 469.45 kB |
| `assets/three-core-BBl2jUKS.js` | 725.36 kB | 187.82 kB |
| `assets/Expo3D-Vaw6nh4T.js` | 662.99 kB | 162.47 kB |
| `assets/modular-home-CxdQyuZn.js` | 565.71 kB | 128.00 kB |
| `assets/AgentsPage-BwQwAWhj.js` | 278.96 kB | 67.18 kB |
| `assets/react-vendor-BNgFkOPC.js` | 230.18 kB | 73.72 kB |
| `assets/supabase-vendor-Bq9hiOOC.js` | 171.64 kB | 45.65 kB |
| `assets/llmService-jIR2IgtW.js` | 115.89 kB | 32.31 kB |
| `assets/CompanyAdmin-CjYPBycJ.js` | 76.88 kB | 19.05 kB |
| `assets/index-ChsXXSdx.js` | 54.97 kB | 15.36 kB |
| `assets/sceneDataSource-DiftXHvC.js` | 52.55 kB | 14.34 kB |
| `assets/SponsorLeadInbox-BTTmjzru.js` | 41.75 kB | 10.85 kB |
| `assets/ModularHomeQuoteReview-f3OJns4p.js` | 28.20 kB | 7.87 kB |
| `assets/SponsorPackages-BBXqlQzq.js` | 24.25 kB | 7.45 kB |
| `assets/CalculatorLeadInbox-SSIoTylv.js` | 22.14 kB | 5.93 kB |
| `assets/index-CphfkB9B.css` | 5.58 kB | 1.73 kB |
| `assets/ModularHomeStudioPage-CdYpoJdE.js` | 3.53 kB | 1.45 kB |
| `index.html` | 1.05 kB | 0.48 kB |
| `manifest.webmanifest` | 0.46 kB | n/a |
| `registerSW.js` | 0.13 kB | n/a |

Emitted JS/CSS asset count from `dist/assets`: 82.

## Root Check Gate

Command: `npm.cmd run check:all`

Result: PASS

Summary:

- `check:expo-boundaries`: PASS, 0 violations.
  - shared files scanned: 14
  - backend-server files scanned: 2872
  - `src/backend/expo` files scanned: 12
- `check:backend-boundaries`: PASS, 0 violations.
  - route files scanned: 3
  - controller/expo/distribution/platform/agents files scanned: 76
  - duplicate/cross-domain/billing warnings: 0
- `check:backend-shared-boundaries`: PASS, 0 violations.
  - `src/backend` files scanned: 108
  - `src/lib` files scanned: 1
  - `src/core` files scanned: 6
  - `src/services` files scanned: 32

## Backend TypeScript Gates

Working directory: `backend-server`

| Command | Result | Notes |
| --- | --- | --- |
| `npx.cmd tsc --noEmit -p tsconfig.json` | PASS | No compiler output. |
| `npx.cmd tsc --noEmit -p tsconfig.docker.json` | PASS | No compiler output. |

## Release Pin

- Branch `release/v1-stabilization` was created from `f4244e8a3d4f6c27da22bdb5087b682f74cdc190`.
- Annotated tag `v1-baseline` dereferences to `f4244e8a3d4f6c27da22bdb5087b682f74cdc190`.
- `productVisualAccepted=false`; product visual acceptance remains a human gate.
