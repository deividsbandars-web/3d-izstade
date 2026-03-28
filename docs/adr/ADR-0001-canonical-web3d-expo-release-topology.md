# ADR-0001: Canonical Web3D Expo Release Topology

Date: 2026-03-28
Status: Accepted

## Context

Warpala currently contains multiple runtime surfaces and historical paths:

- root Vite Web3D frontend
- `apps/frontend` Next.js app
- backend Node API
- optional Pixel Streaming signaling/runtime
- temporary operator workflows such as quick tunnels and local-only proxy paths

This ambiguity increases release risk. The sponsor boulevard release path must have one unambiguous topology.

## Decision

Warpala defines exactly one canonical sponsor release topology:

- Release frontend deployable: root Vite SPA at the repository root
- Release backend deployable: `backend-server`
- Canonical sponsor scene contract: `GET /api/expo/scene`
- Canonical backend API base:
  - staging: `https://api-staging.30sek24.com`
  - production: `https://api.30sek24.com`

Optional premium services:

- Pixel Streaming is a non-baseline premium capability.
- Pixel Streaming readiness must never gate sponsor boulevard usability.

Explicit non-canonical paths:

- `apps/frontend` is not the canonical Web3D sponsor release surface.
- local-only tunnels are not valid release topology.
- same-origin `/api` assumptions are not valid release contract unless explicitly reverse-proxied by the production frontend origin.

## Consequences

Positive:

- One frontend, one backend, one sponsor scene source of truth
- Cleaner staging/production rollout
- Fewer hidden runtime drifts
- Clearer incident ownership

Tradeoffs:

- Release docs and env expectations must be explicit
- Temporary/local operator shortcuts must be removed from release guidance

## Follow-up

- PR2 adds typed environment validation and fail-fast boot rules
- PR3 hardens the sponsor scene contract and deterministic normalization
