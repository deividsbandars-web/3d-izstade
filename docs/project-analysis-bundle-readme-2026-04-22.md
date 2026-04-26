# Project Analysis Bundle 2026-04-22

This bundle is a curated subset of the repo for architecture analysis with expo priority.

## Included areas

- root manifests and deployment files
- frontend expo runtime
- expo-facing frontend services and pages
- backend expo/platform server
- selected `src/backend` runtime domains
- selected docs that describe current release/deploy/runtime assumptions
- selected Supabase migrations related to expo/platform/runtime
- signaling and sync infrastructure files required to understand deployment shape

## Why this is curated

The full repo contains many artifacts that are not useful for architecture review:

- `node_modules`
- `dist`
- screenshots and temp captures
- generated assets
- local machine logs

This bundle aims to preserve architectural truth while avoiding analysis noise.

## Intended use

Use this bundle with the companion prompt:

- [chatgpt-architecture-audit-prompt-2026-04-22.md](/C:/3d/docs/chatgpt-architecture-audit-prompt-2026-04-22.md)

The reviewer should classify what to keep, refactor, delete, and rebuild, with expo as the primary focus.
