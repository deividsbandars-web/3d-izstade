# Phase 130 Diagnostics

## Purpose

Audit the smallest safe path for turning existing AI/chat capability into a visible in-world Web3D stand entrypoint.

## Key Findings

- `GlobalChat` is a route-independent overlay mounted in `Layout.tsx`
- `GlobalChat` uses local `isOpen` state and exposes no public open/focus API
- `GlobalChat` uses Supabase `chat_messages` through `expoService`, not `aiController`
- LLM/API endpoints exist separately through `backend-server/controllers/aiController.ts`
- current booth CTA/action model only supports `navigate` and `external`
- the existing booth feature seam is still the narrowest proven visible in-world host

## Decision

Selected next target:

- `AI BOOTH FEATURE SURFACE FIRST SLICE`

Reason:

- best visible value for the smallest implementation
- reuses proven booth feature surface
- only needs a tiny new trigger seam for `GlobalChat`
- avoids `worldContract`, placement, and backend rewrite work

## Non-Selected Options

- `AI global chat open/focus action` alone: too invisible as a product slice
- dedicated AI pavilion / stand: too broad
- AI route/modal first: less direct than opening the existing chat overlay
- AI sponsor screen surface: broader and less interactive than booth feature content

## Validation Outcome

Passed in sandbox:

- `npm.cmd run check:expo-boundaries`
- `npm.cmd run check:backend-boundaries`
- `npx.cmd tsc -b`
- `npm.cmd --prefix backend-server run build`

Sandbox `spawn EPERM`, then rerun outside sandbox on the same machine:

- `npm.cmd run build`
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.controller.test.ts`

## Baseline

- domain duplicate warnings: `0`
- leads duplicate warnings: `0`
- billing boundary warnings: `0`
- violations: `0`
