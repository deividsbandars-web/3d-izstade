Analyze the attached project bundle as a senior software architect with strong focus on long-lived system design, expo/Web3D runtime architecture, backend boundary design, and maintainability.

Your job is not to give generic advice. I need a concrete repo-level architecture review.

## Context

This project is a Web3D expo / exhibition platform called Warpala OS.

It includes:

- React + Vite frontend
- Web3D expo runtime
- booth rendering and expo planning logic
- Express backend (`backend-server`)
- Supabase schema and migrations
- signaling / TURN / deployment configuration
- staging and production split

The primary focus is the exhibition / expo architecture.

The main concern is that old architectural layers may still be poisoning new work. I want a stable architecture, not more patches on top of a decaying base.

## What I need from you

Please audit the bundle and produce a structured answer with these sections:

1. **Architecture Summary**
- Explain how the system is actually structured today.
- Identify the real runtime path for the expo.
- Identify deployment/runtime modes.

2. **Keep / Refactor / Delete / Rebuild**
- For each major area, classify it as:
  - Keep
  - Refactor
  - Delete
  - Rebuild
- Be explicit and opinionated.

3. **File-Level Relevance Review**
- For every included file or file group, say:
  - why it exists
  - whether it is still needed
  - whether it belongs in the current architecture
  - whether it should move, shrink, merge, or be removed

4. **Expo Architecture Diagnosis**
- Focus hard on:
  - city/world planning
  - booth runtime
  - screen planning
  - rear campus / stadium integration
  - runtime app vs legacy expo layer
- If the current world/screen architecture is wrong, say exactly why.

5. **Backend Architecture Diagnosis**
- Evaluate:
  - `backend-server`
  - `src/backend/*`
  - routes/controllers/services split
  - domain boundaries
  - staging vs production backend modes

6. **Structural Risks**
- Identify the top architectural risks that will keep causing regressions.
- Prioritize them by severity.

7. **Target Architecture**
- Propose the correct target architecture for this repo.
- Especially for expo.
- Give a directory-level target structure.

8. **Rewrite Strategy**
- Tell me what should be:
  - migrated incrementally
  - isolated first
  - fully rebuilt from scratch
- If some subsystem is rotten enough that it should not be patched further, say so clearly.

9. **90-Day Technical Recovery Plan**
- Give a realistic phased plan:
  - Phase 1: stabilization
  - Phase 2: isolation/refactor
  - Phase 3: rebuild
- Keep it practical for a real working codebase.

## Output requirements

- Be direct.
- Do not give generic startup advice.
- Do not avoid hard conclusions.
- If something is structurally bad, say it plainly.
- Prefer repo-specific reasoning over abstract theory.
- If multiple systems overlap, identify which one should become authoritative.

## Special emphasis

I especially want you to determine:

1. whether the expo world planning should be rebuilt around **zonal planners** instead of one central builder
2. whether the old expo module and new runtime expo module can continue to coexist
3. which files are actively harmful because they keep encouraging wrong changes in the wrong layer
4. whether the backend should remain controlled-hybrid:
   - public minimal production backend
   - full staging backend

Treat this as a serious architecture review, not a cosmetic cleanup.
