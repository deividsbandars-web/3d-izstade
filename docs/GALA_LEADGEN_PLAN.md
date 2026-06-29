# GALA Modular Home — Lead-Gen Plan, Audit & Implementer Prompts

> **Purpose of this document**
> Architecture rationale + a staged plan to turn the GALA modular-home studio
> (`/modular-homes/studio?homeStudio=1`) into a **lead-generation experience**: a visitor
> should, in a few clicks, see the house *visibly* change, see the price update *live*, and
> be nudged to leave contact / request a quote with minimal friction.
>
> Product goal (confirmed with owner): **engage / capture people (lead-gen)**, favor clarity
> and "wow" over completeness. This file is the canonical context for that effort — hand the
> phase prompts below to an implementer.
>
> Created: 2026-06-29.

---

## 1. How it is built today (data flow)

```
ConfiguratorOptionsPanel.tsx   ← UI buttons (~30 option groups)
      ↓ setOption()
modularHomeConfigurator.ts     ← state (30+ options) + price/colour visuals
      ↓ useModularHomeConfigurator()
ModularHomeModel.tsx           ← connects config to 3D
      ↓ resolveGalaHouseVisualConfigFromModularHomeConfig()
GalaHouseConfig.ts             ← collapses 30 options → 9 visual fields
      ↓ visualConfig
GalaHouseShell → GalaConstructionRenderer → GalaWallSkinModel
                                          + useGalaConstructionPbrTextures (FIXED textures)
```

Pricing: `modularHomeEstimate.ts` + `modularHomeProducts.json`. **Good news:** the pricing
data is real and rich (e.g. facade `+€3200`, roof `+€6500`, terrace `+€24000`, etc. in
`modularHomeProducts.json:586+`).

Key source files:
- `src/modules/expo/runtime/modularHome/ConfiguratorOptionsPanel.tsx`
- `src/modules/expo/runtime/modularHome/modularHomeConfigurator.ts`
- `src/modules/expo/runtime/modularHome/ModularHomeModel.tsx`
- `src/modules/expo/runtime/modularHome/GalaHouseConfig.ts`
- `src/modules/expo/runtime/modularHome/GalaHouseShell.tsx`
- `src/modules/expo/runtime/modularHome/construction/GalaConstructionRenderer.tsx`
- `src/modules/expo/runtime/modularHome/construction/GalaWallSkinModel.ts`
- `src/modules/expo/runtime/modularHome/construction/GalaConstructionPbrTextures.ts`
- `src/modules/expo/runtime/modularHome/modularHomeEstimate.ts`
- `src/modules/expo/runtime/modularHome/ModularHomeDemoOverlay.tsx`
- `src/modules/expo/runtime/modularHome/ModularHomeQuoteForm.tsx`

---

## 2. Diagnostics — why it currently feels "broken" / like nothing changes

### A. Textures do not change — only the colour tint does
`useGalaConstructionPbrTextures()` (`GalaConstructionPbrTextures.ts`) loads a **fixed**
texture set per surface kind (`weathered_plank_siding`, `wood_plank_wall`,
`plank_flooring`...). Config only changes the `color` prop, which is **multiplied over the
same texture**. So "Natural timber" vs "Dark thermo wood" look almost identical — the wood
pattern never changes, only the tone. Visitors read this as "it doesn't work".

### B. Geometry never changes
`GalaHouseShell.tsx:20` — `resolveGalaConstructionModelForVisualConfig()` **ignores its
argument** and always returns the constant `GALA_CONSTRUCTION_MODEL` (one fixed house). So:
- `layoutVariant`, `dimensionPreset`, `windowPlacement`, `doorPlacement`, `terrace`, roof
  form — **do not affect the 3D model at all**. They only change price and text.
- The walkable house is always the same GALA. "Build your own house" is currently
  impossible — only colour tones differ.

### C. 30 options → 9 visual fields (most are "dead")
`resolveGalaHouseVisualConfigFromModularHomeConfig` compresses everything to 9 fields. With
no visual effect: `facadeBoardWidth`, `facadeBoardSpacing`, `windowFrameType`,
`roofGutterStyle`, `kitchenFinish`, `furnitureMood`, `interiorZoneFocus`,
`window/door package & placement`. Clicking them shows nothing → "confusing, broken".

### D. UI is for engineers, not buyers ("too much info")
- **7 tabs**: Design / Overview / Estimate / **BOM** / Quote / **Projects** / **Upload**.
  BOM, manufacturing/material takeoff are factory-facing, not buyer-facing.
- Each option carries 2 engineering badges: "Requires review", "Blocked", "Production next
  step", "supplier placeholder" — `ConfiguratorOptionsPanel.tsx:520-554`.
- The estimate carries confidence levels, source types, VAT/margin/contingency placeholders
  — `modularHomeEstimate.ts` is ~1450 lines of logic a buyer does not need.
- **The price is not shown next to the choice** — the total lives in a separate "Estimate"
  tab; buttons only show a "+€X" delta. There is no live running total that changes as you
  click.

---

## 3. How much can be done

The foundation is **much better than it looks**: pricing data, BOM, material lists already
exist. The only real problems are (1) weak visual feedback and (2) engineer-oriented UX. A
genuine "build it yourself" feeling can be reached in waves — and for a **lead-gen** goal,
material swaps + live price already deliver ~80% of the effect without any geometry work.

---

## 4. Priority summary (lead-gen goal)
1. **Phase 0 + live price** → biggest effect, lowest risk, can start immediately.
2. **Phase 1 (materials actually change)** → removes the "doesn't work" feeling.
3. **Phase 2 (presets + share + CTA)** → converts interest into contacts.
4. **Phase 3 (geometry)** → only if true "building" is wanted later. Not required for lead-gen.

---

## 5. Shared context (include in every prompt, or give once)

```
Project: canonical root Vite SPA. Route under test: /modular-homes/studio?homeStudio=1
The modular-home "GALA" studio lets a visitor configure a wooden modular home.
State flow: ConfiguratorOptionsPanel → modularHomeConfigurator.ts → ModularHomeModel.tsx
→ resolveGalaHouseVisualConfigFromModularHomeConfig (GalaHouseConfig.ts)
→ GalaHouseShell → GalaConstructionRenderer (+ GalaWallSkinModel, GalaConstructionPbrTextures).
Pricing: calculateModularHomeEstimate (modularHomeEstimate.ts), data in modularHomeProducts.json.

Product goal for ALL phases: this is a LEAD-GEN experience. A visitor should, in a few
clicks, see the house visibly change, see the price update live, and be nudged to leave
contact / request a quote with minimal friction. Favor clarity and "wow" over completeness.

Hard constraints (do NOT change unless the task explicitly says so):
- No backend, auth, quote-submit API, payment, sponsor boulevard, Unreal, Pixel Streaming,
  staging, or deploy changes.
- Do not change camera/FOV/lookAt or movement physics.
- Keep the GALA construction geometry, collision, and door runtime intact.
Validation gates (run all, report results):
  npm.cmd run lint
  npm.cmd run check:expo-boundaries
  npm.cmd run build   (existing Vite large-chunk warning is OK)
Then append a dated entry to docs/CURRENT_TASK.md describing what changed and touched files.
Do not record product visual acceptance; leave productVisualAccepted=false.
```

---

## 6. Phase prompts

### 🟢 Phase 0 — UX cleanup + live price (no 3D work)

```
TASK: Make the modular-home studio overlay consumer-facing and lead-gen oriented.
This phase is UI-only; do not touch any 3D/renderer/material code.

1. Reduce tabs from 7 to 3 for the visitor.
   - File: src/modules/expo/runtime/modularHome/ModularHomeDemoOverlay.tsx (HOME_DEMO_TABS ~line 49).
   - Keep: "Design", "Cena/Estimate", "Pieprasīt piedāvājumu/Quote".
   - Hide (do not delete code) BOM, Projects, Upload, Overview behind a single toggle
     labeled "Pro skats" / "Advanced". Default visible set = the 3 above. Default tab = Design.

2. Add a persistent live price banner.
   - New small component, mounted by ModularHomeDemoOverlay, fixed to the bottom of the
     overlay, always visible regardless of active tab.
   - Show base "no €X" and the live total from calculateModularHomeEstimate(config)
     (estimate.totalPrice) formatted via formatHomeEstimateEur.
   - It must update on every option change (config already drives a re-render).
   - Include a prominent CTA button "Saņemt cenu" that calls setActiveHomeDemoTab('quote').

3. Split the configurator option groups into "Primary" (always shown) and "More".
   - File: src/modules/expo/runtime/modularHome/ConfiguratorOptionsPanel.tsx
     (createConfiguratorGroups ~line 249, render loop ~line 451).
   - Primary groups (shown first, no collapse): facade, roof, terrace, floorFinish,
     interiorWallFinish, furniturePackage.
   - All remaining groups go under a collapsible "Vairāk opciju" section, collapsed by default.

4. Remove engineering jargon from the visitor view.
   - In ConfiguratorOptionsPanel.tsx hide the constraint/production badges
     (the spans around lines 520–554: constraintStatus label + productionConstraintSeverity).
   - Keep the per-option price delta text (formatOptionPriceDelta) — that is the lead-gen hook.
   - Keep all data-* attributes used by QA scripts; only stop RENDERING the visible badge text.

DONE WHEN: visitor sees 3 tabs, a live-updating price banner with a CTA, ~6 primary options
plus a collapsed "more" section, and no "requires review / blocked / next step" badges.
Run the validation gates above.
```

### 🟢 Phase 1 — materials actually change

```
TASK: Make facade / floor / interior-wall selections swap real PBR texture sets (not just
a color tint over one fixed texture), and wire up the currently "dead" visual options.

Background: useGalaConstructionPbrTextures(kind) in
src/modules/expo/runtime/modularHome/construction/GalaConstructionPbrTextures.ts loads ONE
fixed texture set per kind. Selecting a different facade only multiplies a color over the
same texture, so changes look invisible. resolveGalaHouseVisualConfigFromModularHomeConfig
(GalaHouseConfig.ts) collapses ~30 options to 9 fields; several reach nothing visual.

0. FIRST audit available assets under public/models/gala/ and list which texture sets exist.
   Only map options to texture sets that actually have diffuse+normal+arm maps present.
   For options without a dedicated set, fall back to the nearest existing set + color tint
   and note it. Report the mapping you chose before/while implementing.

1. Generalize the texture hook to take a variant.
   - Change GALA_CONSTRUCTION_TEXTURE_PATHS so a kind (e.g. 'exterior','floor','interiorWall')
     can resolve to one of several variant keys. Add an overload/param:
     useGalaConstructionPbrTextures(kind, variant?) → variant defaults to current behavior.
   - Keep the existing WeakMap caching and triplanar/repeat handling intact.

2. Plumb the selected variant from config to the renderer.
   - Extend GalaHouseVisualConfig (GalaHouseConfig.ts) and resolveGalaWallSkin
     (GalaWallSkinModel.ts) so the resolved skin carries a texture-variant id for
     exterior, floor, and interior wall.
   - In GalaConstructionRenderer.tsx pass that variant into useGalaConstructionPbrTextures
     at every call site that renders exterior cladding, floor, and interior walls.

3. Activate options that are currently paid-for but visually inert.
   - In resolveGalaHouseVisualConfigFromModularHomeConfig wire: facade (texture variant,
     not only tone), floorFinish (variant), wallPanelStyle/interiorWallFinish (variant),
     windowFrameColor, trimColor, roofEdgeColor — so each visibly changes the model.

CONSTRAINTS: do not change geometry, collision, dimensions, or camera. No new heavy assets
unless a set already exists in public/models/gala/. Keep texture count reasonable (reuse
shared sets; do not clone textures per mesh).

DONE WHEN: switching facade / floor / interior-wall / trim / frame color produces a clearly
visible material change in both exterior and interior views, with no shader/console/asset
errors. Run validation gates and capture before/after screenshots under artifacts/.
```

### 🟢 Phase 2 — engagement mechanics (presets + share + CTA)

```
TASK: Add low-friction lead-gen mechanics on top of the working configurator. UI/state only.

1. "Start from a style" presets.
   - Add 3–4 preset buttons (e.g. Natural / Nordic light / Dark premium) at the TOP of the
     Design panel in ConfiguratorOptionsPanel.tsx.
   - Each preset calls setConfig(...) with a full ModularHomeConfiguratorState (build them
     from DEFAULT_MODULAR_HOME_CONFIG in modularHomeConfigurator.ts with style-specific
     overrides). Reuse getDefaultHomeConfig for the product base where helpful.

2. Contextual CTA after engagement.
   - Track an interaction count (number of option changes) in ModularHomeDemoOverlay state.
   - After N changes (start with N=4) OR when the visitor clicks "Start inside", show a
     dismissible nudge: "Patīk? Saņem precīzu cenu →" that switches to the quote tab.
   - Must be dismissible and must not block the 3D canvas or movement.

3. Save / share configuration.
   - ModularHomeShareLinkPanel + modularHomeShareUrl.ts already encode config in the URL.
     Surface a clear "Saglabā / kopīgo savu māju" button in the primary Design view that
     copies the canonical share URL, and confirm a shared URL restores the config on load
     (decodeModularHomeConfigFromUrl is already wired in the overlay).

4. Shorten the quote form for conversion.
   - In ModularHomeQuoteForm.tsx make email + phone the only required fields; everything else
     optional/collapsed. The current configuration + estimate must auto-attach to the
     submission payload (do not change the submit endpoint/contract — only the form UX and
     which fields are required/visible).

CONSTRAINTS: no backend/endpoint/schema changes; no analytics SDK additions unless one is
already present. Keep existing QA data-* hooks.

DONE WHEN: a visitor can one-click a style, gets nudged toward the quote after engaging,
can copy a working share link, and faces a 2-field quote form that carries their config.
Run validation gates.
```

### 🟡 Phase 3 — geometry changes (later, biggest effort — optional for lead-gen)

```
TASK (OPTIONAL / LATER): Make terrace, roof shape, and window/door placement actually change
the 3D model, instead of only price/text.

Background: GalaHouseShell.tsx (~line 20) resolveGalaConstructionModelForVisualConfig(_)
currently IGNORES its argument and always returns the single fixed GALA_CONSTRUCTION_MODEL.
So layoutVariant, dimensionPreset, windowPlacement, doorPlacement, terrace, and roof form
have no geometric effect.

Recommended staged approach (pick the smaller scope first, confirm before going further):
  A) Lowest risk: make resolveGalaConstructionModelForVisualConfig return a variant of the
     construction model for a SMALL, enumerated set of changes that are additive and do not
     break collision — start with terrace presence/size and roof edge/gutter profile.
  B) Medium: switch between a few hand-authored module layouts (the createModuleLayout data
     in ModularHomeModel.tsx already differs per product) so footprint/room layout changes.
  C) High effort (only if product wants true "build it yourself"): parametric geometry driven
     by dimensionPreset/windowPlacement. This touches GalaConstructionModel.ts, GalaFloorplan.ts
     (collision segments), and door interaction zones — must keep walk physics and door
     collisions correct.

CONSTRAINTS: any geometry change MUST keep collision segments, door interaction zones, and
finished-floor levels consistent (see GalaFloorplan.ts, GalaConstructionModel.ts). Re-run the
walk-physics and opening-clip QA scripts in scripts/ for any layout you enable.

DONE WHEN: at least the terrace and roof-edge changes are visible in 3D with correct
collision/movement, validated by the existing motion/clearance QA scripts. Run validation gates.
```
