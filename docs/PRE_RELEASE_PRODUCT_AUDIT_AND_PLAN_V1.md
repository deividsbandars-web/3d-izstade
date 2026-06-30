# PIRMS-RELEASE PRODUKTA AUDITS & ATTĪSTĪBAS PLĀNS V1

> Arhitekta dziļā diagnostika par produkta funkcionālajām tēmām (ekrāni, booth
> sistēma, maksājumi, booth→ekrāna īres plūsma, moduļu māju iesaiste, pilsētas
> tekstūras/performance, web + kalkulatori, dekors, AI factory).
>
> **Šis dokuments papildina, nevis aizstāj** `docs/RELEASE_ROADMAP_V1.md`.
> Roadmap V1 = *stabilizācija* (backend packaging, refactor, QA, CI). Šis dokuments
> = *produkta funkcionalitāte un monetizācija* pirms un pēc release.
>
> Autors: Principal Architect (planning). Datums: 2026-06-30.
> Izpildītāji: skat. copy-paste promptus katrā Work Package (WP).

---

## 0. Kā lasīt šo dokumentu

1. **Diagnostika (§1)** atbild tieši uz katru tavu jautājumu: kas strādā, kas nē.
2. **Prioritāšu karte (§2)** sašķiro darbu P0→P3 pēc release-kritiskuma.
3. **Work Packages (§3–§12)** — katra tēma = atsevišķa sadaļa ar (a) pašreizējo
   stāvokli, (b) trūkumiem, (c) copy-paste promptu implementētājam, (d) DoD.
4. Visi WP **respektē "world freeze"** — neviens WP nemaina booth ģeometriju, kameru/FOV
   uz sponsor bulvāra, ne arī auth/quote uzvedību, ja vien WP to skaidri neatļauj.
5. Katrs WP beidzas, atjauninot `docs/CURRENT_TASK.md` un palaižot attiecīgos gate's
   no `RELEASE_ROADMAP_V1.md §9`.

---

## 1. DIAGNOSTIKA — atbildes uz katru jautājumu

### 1.1 Vai ekrāni strādā? Ko var uzlabot?
**Strādā daļēji.** Ekrānu sistēma ir reāla un strukturēta:
- `src/modules/expo/lib/sponsorScreenLayout.ts` definē 3 ekrānu klases:
  `facade` (fasādes), `medium_billboard` (vidējie), `ground_pylon` (zemes piloni),
  ar tier'iem `elite/premium/standard/city`.
- Saturs nāk no kompānijas media (`assets_3d.screen_content` → `mode: image |
  video-placeholder`, `imageUrl/videoUrl`) vai no placeholder tekstūrām
  (`/textures/expo/screen-placeholders-4k/...`, `hero-facade-screen-8k/...`).
- Scene builder (`src/backend/expo/sceneBuilder.ts`) sapludina "managed booth"
  ekrāna saturu pēc prioritātes (publicēts > ar media > placeholder).

**Galvenais trūkums:** "video" režīms ir **`video-placeholder`** — tā ir statiska
bilde, **nav īsta `THREE.VideoTexture`/HLS dzīvā video**. Nav arī per-booth ekrāna
satura rediģēšanas UX, kas dotu reālu priekšskatījumu (WYSIWYG) pirms publicēšanas.
→ Uzlabojumi: WP-A (§3).

### 1.2 Vai booth shēma strādā?
**Jā, tā ir spēcīgākā daļa.** Pilnībā datu-vadīta:
- Tier modelis: `common/premium/elite/hero` → render tier `standard/premium/elite/hero`
  (`docs/booth-tier-contract.md`, `BoothTierState.ts` ar `BOOTH_TIER_CONTRACT`).
- Katram tier ir mērāmas dimensijas + **`Required Screen Class`**
  (support/presentation/large-format/landmark) un landmark cue.
- Izvietojums: `docs/booth-slot-bank.json` — fiksēti sloti pa joslām
  (`arrival/showcase/media/discovery`) × lane (`left/right/center`) × tips
  (`hero/endcap/standard`), relatīvi district centram.
- Render path: `DistrictBooth.tsx → BoothTierShells.tsx → BoothVisualAssembly.tsx`,
  saturs caur `BoothPresentationBinding.ts → sponsorBoothPresentation.ts`.

**Trūkums:** booth shēma ir *backend/render*-pusē nevainojama, bet **pircējam nav
vizuālas slotu kartes**, kur izvēlēties konkrētu slotu. → WP-C (§5).

### 1.3 Vai maksājumu sistēma strādā?
**NĒ — tā ir pilnībā simulēta (mock).** Tas ir lielākais monetizācijas blokeris:
- `src/backend/billing/payments/paymentService.ts` → `createCheckoutSession()`
  atgriež **fiktīvu** `https://checkout.stripe.com/pay/cs_test_<random>` URL.
- `src/services/stripeService.ts` → komentārs "Šī ir simulācija Edge funkcijai".
- Webhook handler (`handleWebhook`) ir "(simulated)".
- Billing modulis (`plans/credits/usage/quota`) eksistē, bet checkout nav īsts.

**Sekas:** neviens nevar reāli nopirkt booth/paketi. Pašreizējais modelis ir
**lead-gen**: `SponsorPackages.tsx` rāda cenu diapazonus kā **tekstu**
("Sākot no 1.5k-3k / kampaņa", "5k-15k", "15k-50k+") → forma
(`sponsorPackageRequest.ts`) → lead inbox → **manuāla** piešķire adminā.
→ WP-B (§4) productionizē reālu Stripe.

### 1.4 Kā zina, kurš ekrāns tiks īrēts? Vai var izvēlēties, kur ko īrēt?
**Šobrīd NEVAR pašapkalpoties.** Plūsma ir:
1. Tier nosaka **screen class** automātiski (`booth-tier-contract.md`): common→support,
   premium→presentation, elite→large-format, hero→landmark.
2. Admins manuāli piešķir kompānijai booth + slotu (`CompanyAdmin.tsx`, 2763 rindas).
3. Kompānija augšuplādē ekrāna media → tas saistās ar booth ekrāna plakni.

**Tātad pircējs NEizvēlas konkrētu slotu/ekrānu uz kartes — to dara admins.**
Lai būtu mūsdienīgi ("izvēlies slotu kartē → redzi cenu → nopērc"), vajag
**interaktīvu slotu-izvēles karti + checkout**. → WP-C (§5).

### 1.5 Kur boothi stāvēs?
**Deterministiski**, no `docs/booth-slot-bank.json`. Katrs slots ir fiksēts
(xOffset/zOffset/rotationY) relatīvi district centram. 4 joslas × 2–3 lanes ×
3 tipi. Hero sloti district priekšā, endcap stūros, standard rindās. Tas ir
"world freeze" iesaldēts — slotu pārvietošana prasa atsevišķu atļauju.

### 1.6 Ko vēl var uzlabot / modernizēt?
Skat. prioritāšu karti §2. Galvenie: reāls Stripe (P0), self-serve slotu izvēle (P1),
dzīvie video ekrāni (P1), error boundaries + WebGL fallback (P0, jau roadmap V1 Pack 3.2),
mobile performance pierādījums (P1), KTX2 tekstūru kompresija (P2).

### 1.7 Kā iesaistīt moduļu māju sistēmu?
**Jau daļēji iesaistīta:** 3D pilsētā ir `ModularHomeEntrancePortal.tsx` — kad
spēlētājs pienāk klāt, tas pārved uz `/modular-homes/studio` (GALA konfigurators).
Tā ir **atsevišķa route**, ne iegults pilsētā.
Iespējas: (a) cross-sell starp expo un GALA studiju, (b) GALA mājas modeļa
miniatūra pilsētā kā "showroom paviljons", (c) vienota lead/quote pipeline.
→ WP-G (§9).

### 1.8 Vai var uzlikt pilsētas tekstūras bez lagošanas?
**Jā.** Infrastruktūra jau ir: `expoTexturePipeline`, `InstancedCityLayer.ts`,
`ZoneSystem.ts`, `cityPerformanceBudget.ts`, GALA draw-call/tri budžeti
(exterior ≈274 draw calls, interior ≈208). Atslēga: **KTX2/Basis kompresija + mipmaps
+ instancing + DPR caps + zone culling**, nevis lielāki PNG. → WP-H (§10).

### 1.9 Web + kalkulatori — vai var iesaistīt 3D web pilsētā?
**Šobrīd NĒ.** ~20 kalkulatori (`src/modules/calculators/`: Roof, Heating, Foundation,
Timber, Windows, Facade, Floor, Plumbing, Fence, Paving, Cleaning, Autoservice utt.)
ir **2D routes** + `CalculatorsHub`, ar lead capture (`calculatorLeadCapture.ts`).
Tie **nav** 3D pilsētā. Iespēja: "kalkulatoru kioski" pilsētā, kas deep-link uz
kalkulatoru, vai iegulti paneļi booth iekšienē. → WP-I (§11).

### 1.10 Kas ir dekors un kas nav?
- **Dekors** = `expoCuratedPropPlacement.ts` + zonu ģeometrija
  (`planning/zones/*/geometry.ts`) — vizuāli propi (koki, soli, apgaismojums, utt.),
  kas **netiek pārdoti** un nesatur sponsoru saturu.
- **NAV dekors** = booth (pārdodami sponsoru objekti ar ekrāniem), ekrānu plaknes,
  modular home portāls, navigācijas landmarki. Tie ir funkcionāli/monetizējami.
→ Skaidru robežu dokumentē WP-J (§12).

### 1.11 Kas ir AI factory?
`src/agents/` (adsAgent, articleAgent, salesAgent, seoAgent, keywordAgent, leadAgent,
marketingAgent, productAgent) + `src/modules/ai-tools/` (AiAgentDashboard, AiGenerator,
AiMatchmaker, BusinessAccelerator, ContentGenerator) + `AgentsPage.tsx` ar
`agentControlService.runAgentTask()`. **Daļa ir stub** (`disableAgent` = "Simulated").
LLM serviss: `src/backend/ai/llmService.ts`. → Pirms release tas jāizolē no release
scope vai jāproductionizē ar reālu Claude API. → WP-K (§12-AI).

---

## 2. PRIORITĀŠU KARTE

| Prioritāte | Work Package | Tēma | Kāpēc tagad |
| --- | --- | --- | --- |
| **P0** | WP-B | Reāls Stripe checkout | Bez tā nav monetizācijas; mock nedrīkst iet produkcijā |
| **P0** | WP-D | Release scope lock | Atdalīt to, kas iet release, no demo/stub funkcijām |
| **P1** | WP-C | Self-serve booth slotu izvēles karte + checkout | "Izvēlies kur stāvi" mūsdienīgā plūsma |
| **P1** | WP-A | Dzīvie video ekrāni + ekrāna satura UX | Ekrāni izskatās moderni, nevis statiski |
| **P1** | WP-E | Mobile + WebGL fallback + error boundaries | Reāli lietotāji uz telefoniem |
| **P2** | WP-H | KTX2 tekstūras + performance bez lagošanas | Vizuāls līmenis bez FPS zuduma |
| **P2** | WP-G | Moduļu māju iesaiste / cross-sell | Otrs produkts vienā pieredzē |
| **P2** | WP-F | Booth analytics → sponsoram (ROI dashboard) | Pārdošanas arguments |
| **P3** | WP-I | Kalkulatoru kioski 3D pilsētā | Nice-to-have integrācija |
| **P3** | WP-J | Dekors vs funkcionāls robežas dokuments | Higiēna nākotnes darbam |
| **P3** | WP-K | AI factory: izolēt vai productionizēt | Tikai ja iet release scope |

> P0 jāpabeidz pirms release. P1 ideāli pirms, pieļaujami fast-follow. P2/P3 = post-release.

---

## 3. WP-A — Dzīvie video ekrāni + ekrāna satura UX

**Stāvoklis:** `sponsorScreenLayout.ts` izveido ekrānu mezglus; saturs = statiska bilde
vai `video-placeholder`. Nav `THREE.VideoTexture`/HLS. Admins augšuplādē media, bet bez
WYSIWYG priekšskata uz ekrāna plaknes.

**Trūkumi:** (1) nav dzīvā video; (2) nav per-booth priekšskata; (3) nav video
fallback uz statisku kadru, ja tīkls lēns; (4) nav mobile-saudzīga video politika.

**Prompt implementētājam:**
> Mērķis: ieviest reālu video atskaņošanu uz sponsoru ekrāniem ar drošu fallback.
> Faili: `src/modules/expo/lib/sponsorScreenLayout.ts`,
> `src/modules/expo/runtime/booths/BoothFeatureContent.tsx`,
> `src/backend/expo/sceneBuilder.ts` (screen_content modes),
> `src/pages/expo/CompanyAdmin.tsx` (media UX), jauns
> `src/modules/expo/runtime/booths/BoothScreenVideoTexture.tsx`.
> Uzdevums: (1) Pievieno `screen_content.mode = 'video'` ar `videoUrl` (mp4/HLS), kas
> renderē `THREE.VideoTexture` tikai kad ekrāns ir kameras frustumā un attālumā
> < N (lazy mount/unmount, `muted`, `playsInline`, `loop`). (2) Ārpus attāluma vai uz
> mobile/low-quality profila — krīt atpakaļ uz `posterUrl` statisku kadru (NEspēlē
> video, lai netaupītu GPU/akumulatoru). (3) CompanyAdmin: rādi ekrāna priekšskatu ar
> īsto ekrāna proporciju (16:9 facade, 9:16 vertical) pirms publicēšanas. (4) Nemaini
> placeholder ceļus eksistējošiem booth bez media. Pierādi ar
> `qa-gala-motion-performance-audit.mjs` ekvivalentu, ka video mount/unmount nepārkāpj
> motion budžetu (0 stutters > 50ms).
> Validācija: `npm run lint`, `npm run build`, motion perf audits (desktop + throttled).
> DoD: dzīvs video tikai tuvumā/desktopā; statisks fallback citur; priekšskats adminā;
> 0 jaunu stutter regresiju.

---

## 4. WP-B — Reāls Stripe checkout (P0)

**Stāvoklis:** `paymentService.ts` un `stripeService.ts` ir **mock**. Webhook simulēts.
Billing plans/credits/usage eksistē, bet bez reāla maksājuma.

**Prompt implementētājam:**
> Mērķis: aizvietot simulēto maksājumu ar reālu Stripe Checkout + webhook, drošu un
> testētu. Faili: `src/backend/billing/payments/paymentService.ts`,
> `src/services/stripeService.ts`, `backend-server/routes/api.ts` (jauns
> `POST /api/billing/checkout-session` + `POST /api/billing/webhook`), jauns
> `backend-server/controllers/billingCheckoutController.ts`,
> `backend-server/config/runtimeEnv.ts` (Stripe env), Supabase migration `invoices`/
> `payments` tabulai ar RLS default-deny + service-role-only.
> Uzdevums: (1) Reāla `stripe.checkout.sessions.create` ar `STRIPE_SECRET_KEY`
> (env-gated; ja nav atslēgas — endpoint atgriež 503, NEvis mock URL). (2) Webhook ar
> `stripe.webhooks.constructEvent` parakstu verifikāciju (`STRIPE_WEBHOOK_SECRET`);
> apstrādā `checkout.session.completed` → atjauno booth/paketes statusu idempotenti pēc
> `session.id`. (3) Frontend `stripeService` izsauc backend endpoint, NEvis veido sesiju
> klientā. (4) Visas summas + produkti autoritatīvi serverī (NEkad neuzticies klienta
> cenai). (5) Pievieno backend testus: sesijas izveide, paraksta noraidījums, idempotents
> webhook, 503 bez atslēgas. Nemaini lead-gen plūsmu — pievieno checkout paralēli.
> Validācija: backend `tsc -p tsconfig.json`, jaunie testi, `npm run lint`.
> DoD: reāls Stripe aiz env flag; paraksta-verificēts webhook; idempotents; mock kods
> izņemts; RLS uz maksājumu tabulām default-deny.

> **Atkarība:** WP-B ir priekšnosacījums WP-C self-serve pirkumam.

---

## 5. WP-C — Self-serve booth slotu izvēles karte + checkout (P1)

**Stāvoklis:** slotu banka (`booth-slot-bank.json`) un tier kontrakts eksistē, bet
pircējam nav UI izvēlēties slotu. Piešķire ir manuāla adminā.

**Prompt implementētājam:**
> Mērķis: ļaut sponsoram interaktīvi izvēlēties brīvu booth slotu kartē, redzēt cenu un
> nopirkt (caur WP-B Stripe). Faili: jauns `src/pages/expo/BoothMarketplace.tsx` (2D/2.5D
> slotu karte), jauns `src/app/expo/boothSlotAvailability.ts`,
> `backend-server/routes/api.ts` (`GET /api/expo/booth-slots` ar availability,
> `POST /api/expo/booth-slots/:slotId/reserve` ar īslaicīgu hold), Supabase migration
> `booth_slot_reservations` (RLS, hold TTL). Avots: `docs/booth-slot-bank.json` +
> `docs/booth-tier-contract.md` (cena/tier/screen class).
> Uzdevums: (1) Renderē district joslu karti ar slotiem, krāsotiem pēc tier; brīvie
> klikšķināmi, aizņemtie pelēki. (2) Izvēloties slotu — rādi tier, screen class, cenu,
> mockup ekrāna izmēru. (3) "Rezervēt" izveido īslaicīgu hold (piem. 15 min) →
> Stripe Checkout (WP-B) → pēc `checkout.session.completed` slots kļūst `assigned`
> kompānijai un parādās 3D ainā caur eksistējošo sceneBuilder managed-booth ceļu.
> (4) NEmaini slotu ģeometriju vai world freeze — tikai availability/assignment slānis
> virs esošās slotu bankas. (5) Konkurences drošība: rezervācija ir atomāra (unikāls
> constraint uz `slot_id` kamēr aktīvs hold/assignment).
> Validācija: backend testi (reserve/expire/double-book noraidījums), `npm run lint`,
> `npm run build`, `check:expo-boundaries`.
> DoD: sponsors var izvēlēties brīvu slotu → samaksāt → booth parādās viņa ainā; nav
> double-booking; manuālā admin piešķire paliek kā fallback.

---

## 6. WP-D — Release scope lock (P0)

**Stāvoklis:** repo satur produkcijas ceļu + daudz demo/stub lapu (AutonomousEngine,
EconomySimulator, AiPlatformPrototype, BusinessEconomy, AI agents ar simulētiem
servisiem). Risks: stub funkcijas noplūst produkcijā.

**Prompt implementētājam:**
> Mērķis: skaidri atdalīt release-scope route's no demo/stub. Faili: `src/App.tsx`,
> jauns `docs/RELEASE_SCOPE_LOCK.md`, `src/config/featureFlags.ts` (ja nav — izveido).
> Uzdevums: (1) Sastādi tabulu: katra route → SHIP / DEMO-ONLY / INTERNAL. SHIP =
> `/expo-3d`, `/modular-homes/studio`, sponsor flow, calculators+lead, auth. DEMO =
> AutonomousEngine, EconomySimulator, AiPlatformPrototype, BusinessEconomy, AI agent
> dashboards (kamēr nav reāla LLM). (2) DEMO-ONLY route's slēdz aiz `VITE_ENABLE_DEMO=1`
> flag (default off produkcijā), lai tās netiek mountētas un netiek bundlētas default
> chunk. (3) Dokumentē `RELEASE_SCOPE_LOCK.md`. Nemaini SHIP route uzvedību.
> Validācija: `npm run build` (apstiprini DEMO chunks nav default entry), `npm run lint`.
> DoD: produkcijas bundle satur tikai SHIP funkcijas; DEMO aiz flag; scope dokumentēts.

---

## 7. WP-E — Mobile + WebGL fallback + error boundaries (P1)

> Pārklājas ar `RELEASE_ROADMAP_V1.md` Pack 3.2/3.3/3.4 — **izpildi tos**, šis WP ir
> norāde, nevis dublikāts. Galvenais: route error boundaries uz `/expo-3d` un
> `/modular-homes/studio`, WebGL probe ar statisku fallback + CTA uz quote/lead formu,
> mobile DPR caps ar 30 FPS pierādījumu uz throttled profila.

---

## 8. WP-F — Booth analytics → sponsora ROI dashboard (P2)

**Stāvoklis:** ir `ExpoWorldAnalyticsLayer.tsx` + lead inbox. Nav apkopota sponsoram
domāta ROI skata (apmeklējumi, klikšķi uz ekrāna CTA, leadi no viņa booth).

**Prompt implementētājam:**
> Mērķis: dot sponsoram dashboard ar viņa booth metriku. Faili:
> `src/pages/expo/CompanyAdmin.tsx` (jauna sadaļa vai apakšroute),
> `backend-server/routes/api.ts` (`GET /api/expo/booth/:id/analytics`, adminOnly/owner),
> izmanto eksistējošos analytics eventus. Uzdevums: agregē per-booth proximity views,
> CTA klikšķus, lead skaitu periodā; rādi grafiku + skaitļus. RLS: sponsors redz tikai
> savu booth. Nemaini event capturing — tikai lasi/agregē.
> DoD: sponsors redz sava booth ROI; tikai savu; testēts owner-scoping.

---

## 9. WP-G — Moduļu māju iesaiste / cross-sell (P2)

**Stāvoklis:** `ModularHomeEntrancePortal.tsx` jau pārved no pilsētas uz GALA studiju.
Quote endpoint staging-only (skat. memory `gala-quote-endpoint-staging-only`).

**Prompt implementētājam:**
> Mērķis: ciešāka divu produktu integrācija. Opcijas (izvēlies ar product-owner):
> (a) GALA mājas miniatūras "showroom" paviljons pilsētā ar portālu (esošs portāls +
> reāls modeļa teaser); (b) cross-sell baneris GALA studijā uz expo booth pirkumu un
> otrādi; (c) vienota lead pipeline (sponsor lead + modular quote → viens inbox skats).
> Sāc ar (b) — zemākais risks. Faili: `ModularHomeStudioPage.tsx`,
> `ModularHomeEntrancePortal.tsx`, sponsor flow lapas. Nemaini GALA render path vai
> quote gating. Validācija: `npm run build`, `check:expo-boundaries`.
> DoD: skaidrs cross-sell ceļš starp produktiem; nav render/quote regresijas.

---

## 10. WP-H — Pilsētas tekstūras bez lagošanas (P2)

**Stāvoklis:** ir texture pipeline + instancing + budžeti. Risks: lielāki PNG = lags.

**Prompt implementētājam:**
> Mērķis: paaugstināt vizuālo līmeni BEZ FPS zuduma. Faili:
> `scripts/build-expo-texture-pipeline.mjs`, `scripts/check-expo-texture-pipeline.mjs`,
> `src/modules/expo/lib/expoTexturePipeline.ts`, `src/modules/city/InstancedCityLayer.ts`,
> `src/modules/city/cityPerformanceBudget.ts`, `vite.config.ts` (PWA precache).
> Uzdevums: (1) Pārvērt lielās ekrānu/fasāžu tekstūras uz **KTX2/Basis** (GPU-kompresēts,
> mazāka VRAM) ar mipmaps; izmanto `KTX2Loader`. (2) Apstiprini visa atkārtotā ģeometrija
> (cladding, sienu šūnas, props) iet caur instancing. (3) DPR caps uz mobile (30 FPS
> mērķis), zone culling. (4) Nepārsniedz esošos draw-call/tri budžetus (exterior ≈274,
> interior ≈208). (5) Pievieno KTX2 assets workbox precache loģikai (ievēro 5MB cap —
> flag lielākus). Pierādi before/after FPS + VRAM ar perf audit skriptiem.
> Validācija: `check:expo-texture-pipeline`, perf budget audit, `npm run build`.
> DoD: augstāka kvalitāte, mazāka VRAM, FPS budžeti tur; nav silent precache drop.

---

## 11. WP-I — Kalkulatoru kioski 3D pilsētā (P3)

**Stāvoklis:** ~20 kalkulatoru kā 2D routes; nav 3D pilsētā.

**Prompt implementētājam:**
> Mērķis: iesaistīt kalkulatorus 3D pieredzē kā lead-gen punktus. Faili: jauns
> `src/modules/expo/runtime/world/CalculatorKioskLayer.tsx`, deep-link uz
> `src/modules/calculators/*`, izmanto `calculatorLeadCapture.ts`. Uzdevums: novieto
> dažus "kioskus" district zonās (kā dekoratīvi objekti ar interakcijas zonu); pieejot
> klāt — Html overlay ar CTA "Atvērt [Jumta] kalkulatoru" → deep-link uz kalkulatoru ar
> avota atribūciju. NEiegul pašu kalkulatoru kanvā (performance). Respektē world freeze:
> kioski ir jauni props, ne booth slotu maiņa. Validācija: `npm run build`, perf audit.
> DoD: kioski pilsētā deep-linko uz kalkulatoriem ar lead atribūciju; nav FPS regresijas.

---

## 12. WP-J & WP-K — Dekors robežas (P3) + AI factory lēmums (P3)

**WP-J (dekors):**
> Dokumentē `docs/EXPO_DECOR_VS_FUNCTIONAL_CONTRACT.md`: kas ir dekoratīvs prop
> (`expoCuratedPropPlacement.ts`, zonu ģeometrija) vs funkcionāls/monetizējams (booth,
> ekrāni, portāls, landmarki). Pievieno check skriptu, kas neļauj dekoram nēsāt sponsoru
> saturu vai dekoram pārklāt booth slotus. Validācija: jaunais check + `check:all`.

**WP-K (AI factory):**
> Lēmums ar product-owner: (a) izolēt AI factory aiz `VITE_ENABLE_DEMO` (WP-D), JA tas
> neiet release; vai (b) productionizēt — `src/app/agents/agentControlService.ts` un
> `src/backend/ai/llmService.ts` pieslēgt **reālam Claude API** (model id
> `claude-opus-4-8` vai `claude-haiku-4-5-20251001` lētākiem uzdevumiem), aizvietot
> "Simulated" atbildes, pievienot env `ANTHROPIC_API_KEY` + rate limit + izmaksu
> kontroli. Sāc ar (a), jo zemāks risks pirms release.

---

## 13. Izpildes secība (kopsavilkums)

```
P0 (pirms release):  WP-D (scope lock) ─► WP-B (Stripe)
                                            │
P1 (pirms/fast-follow): WP-C (slotu pirkums) ◄┘
                        WP-A (video ekrāni)  ║ paralēli
                        WP-E (mobile/fallback)║ (pārklājas ar Roadmap V1 Ph.3)
P2 (post-release):   WP-H (tekstūras) · WP-G (modular cross-sell) · WP-F (analytics)
P3 (vēlāk):          WP-I (kalkulatoru kioski) · WP-J (dekors) · WP-K (AI factory)
```

**Saistība ar Roadmap V1:** šis dokuments ir *produkta* slānis virs Roadmap V1
*stabilizācijas* slāņa. Stabilizācija (backend packaging, refactor, CI) jāpabeidz, lai
P0/P1 šeit būtu droši izpildāmi. WP-E tieši pārklājas ar Roadmap V1 Phase 3.
