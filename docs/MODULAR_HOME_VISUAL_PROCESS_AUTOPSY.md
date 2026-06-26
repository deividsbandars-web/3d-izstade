# Modular Home Visual Process Autopsy

Date: `2026-06-22`

Exact early-shell timestamps from the earlier modular-home work were not fully preserved. The timeline below is reconstructed from `VALIDATION.md`, the updated task docs, and the fresh QA capture run recorded in this audit.

## 1. Chronological Timeline

| time/start | time/end | duration | action | file/route touched | expected result | actual result | evidence |
| ---------- | -------: | -------: | ------ | ------------------ | --------------- | ------------- | -------- |
| `2026-06-22` | `2026-06-22` | approx. same-day iteration | Modular-home architecture reset work, including build/lint/smoke/deploy/promote and live browser checks, continued to focus on camera/state and scene presentation. | `src/modules/expo/runtime/modularHome/*`, `/modular-homes/studio` | one walkable house that looks product-ready | route flow and backend checks stayed green, but the live interior still read too flat/sparse | `docs/MODULAR_HOME_STUDIO_DETAIL_UPGRADE_REPORT.md`, `VALIDATION.md` |
| `2026-06-22T04:18:47Z` | `2026-06-22T04:19:08Z` | ~21s | Fresh QA Chrome started from a clean profile, connected to CDP port `9230`, and captured six viewport-only screenshots outside the repo. | `https://staging.30sek24.com/`, `/expo-3d`, `/modular-homes/studio?view=exterior`, `/modular-homes/studio?view=interior` | prove browser/CDP/screenshot capture works on a clean profile | succeeded; six PNGs were saved and a manifest was written | `C:\qa\visual-evidence\20260622-071846\visual-evidence-manifest.json` |
| `2026-06-22` | `2026-06-22` | same cleanup sweep | Controlled cleanup checked for stale QA Chrome after the capture run and found none remaining. | QA Chrome profile / port `9230` | remove only QA browser artifacts | no stale QA process remained; the fresh browser had already exited cleanly | `netstat` snapshot, current process inventory |

## 2. Exact Commands and Environment

Observed commands from the modular-home workstream:

- `npm.cmd run build`
- `npm.cmd run lint`
- `powershell.exe -ExecutionPolicy Bypass -File scripts/run-with-doppler.ps1 run -- node scripts/smoke-backend-supabase.mjs`
- `powershell.exe -ExecutionPolicy Bypass -File scripts/run-with-doppler.ps1 run -- node scripts/check-modular-home-quote-staging.mjs --json`
- `npm.cmd run deploy:staging:preview`
- `npm.cmd run promote:staging -- https://app-staging-o68j936eq-esaukans-6934s-projects.vercel.app`
- `npm.cmd run deploy:staging:preview`
- `npm.cmd run promote:staging -- https://app-staging-g7o25kzg3-esaukans-6934s-projects.vercel.app`
- `npm.cmd run deploy:staging:preview`
- `npm.cmd run promote:staging -- https://app-staging-n0ma7ye3s-esaukans-6934s-projects.vercel.app`

Fresh QA browser command and environment used for evidence repair:

- Chrome path: `C:\Program Files\Google\Chrome\Application\chrome.exe`
- Chrome mode: `--headless=new`
- CDP port: `9230`
- QA profile directory: `C:\qa\chrome-visual-clean-20260622-071846`
- QA evidence directory: `C:\qa\visual-evidence\20260622-071846`
- Browser JSON endpoint: `http://127.0.0.1:9230/json`
- Environment variables: `QA_VISUAL_DIR`, `QA_PROFILE_DIR`, `QA_BROWSER_JSON_URL`

## 3. Browser Proof Inventory

| screenshot file | route | viewport | timestamp | what it was supposed to prove | actual visual verdict | included in source ZIP? |
| --------------- | ----- | -------: | --------- | ----------------------------- | --------------------- | ----------------------: |
| `01-health-staging-home.png` | `/` | `1440x900` | `2026-06-22T04:18:49.769Z` | staging home page is capturable from a fresh browser profile | useful, non-blank, correct route | no |
| `02-expo-city.png` | `/expo-3d` | `1440x900` | `2026-06-22T04:18:52.775Z` | public expo city loads and can be captured | useful, correct city route | no |
| `03-modular-home-studio-start.png` | `/modular-homes/studio?view=exterior` | `1440x900` | `2026-06-22T04:18:55.523Z` | dedicated modular-home studio starts on the exterior route | useful, canonical exterior URL preserved | no |
| `04-modular-home-walk-control-proof.png` | `/modular-homes/studio?view=interior` after `Living` click | `1440x900` | `2026-06-22T04:18:59.602Z` | room controls respond in the shared house scene | useful, interior control state changed | no |
| `05-modular-home-door-area.png` | `/modular-homes/studio?view=exterior` | `1440x900` | `2026-06-22T04:19:02.737Z` | exterior/door area remains capturable as part of the same scene | useful, door/exterior frame present | no |
| `06-modular-home-inside-house.png` | `/modular-homes/studio?view=interior` after `Overview` click | `1440x900` | `2026-06-22T04:19:07.476Z` | inside-house route is capturable without a new instance | useful, interior URL preserved | no |

No durable screenshot evidence was preserved before this run; previous visual claims could not be independently verified from the handoff. This run repaired that gap.

## 4. What Exactly Failed Visually

| route/view | observed failure | likely cause | next required fix |
| ---------- | ---------------- | ------------ | ----------------- |
| `/modular-homes/studio?view=exterior` | the 3D field still reads like a light shell with the rail dominating the composition | the current cutaway/presentation geometry is not yet strong enough to read as a product-ready exterior | rebuild the shell so the facade, door, windows, roof edge, and deck are visibly dominant |
| `/modular-homes/studio?view=interior` | the interior captures are still visually weak and can look like a flat room wash rather than a finished home | the room layout and camera framing are not yet carrying enough depth and object mass | add a stronger room shell, visible furniture mass, and a less timid camera target set |
| room-focus buttons (`Living`, `Overview`) | the controls respond, but they do not rescue the underlying scene quality | the scene composition itself is the bottleneck, not the button plumbing | keep the controls, but change the scene geometry/presentation first |
| door entry flow | the transition exists, but it still does not read as one physically coherent home in the live captures | the scene has continuity, but the visual proof is too weak to sell the continuity | make the interior/exterior connection obvious in one open-sided model |

## 5. Why the Method Failed

Root cause of wasted work:

- I spent too much time on camera/preset/state mechanics while the scene composition itself remained too weak.
- I treated route/build/smoke success as if it were visual acceptance.
- Earlier browser observations were transient; screenshot evidence was not preserved, so the visual truth could not be audited later.
- The browser/CDP path itself was not the blocker in this audit. The blocker was a process that let acceptance language outrun durable evidence.

What I will stop doing:

- stop claiming product progress from route-load or smoke pass alone;
- stop treating transient browser checks as durable evidence;
- stop iterating camera presets as the primary fix when the scene geometry is the real bottleneck;
- stop packaging visual claims without a preserved screenshot manifest.

## 6. Current Product Truth

- Canonical route flow: green
- Backend smoke: green
- Quote smoke: green
- Security scene contract: green
- Walkable house requirement: blocked
- Camera control requirement: blocked
- Unified exterior+interior requirement: blocked
- Client-ready visual requirement: blocked

If a claim is not supported by preserved screenshot evidence, it is blocked.

## 7. What Must Change Before Coding Continues

Recommended direction: **Option B - Build a new simplified walkable house component**

- Create a single walkable house component that owns both exterior and interior presentation.
- Deprecate the old split exterior/interior presentation path as the product story.
- Use open-side / cutaway geometry from the start instead of trying to rescue a sealed shell.
- Keep the controls, but do not let them hijack the camera or hide the scene problem.

Why this is the right next step:

- Option A keeps the current geometry debt alive.
- Option C would retreat from the product requirement instead of solving it.
- Option B gives a clean, honest reset point for the one-house walkthrough the product actually needs.

## 8. Evidence Packaging

Source/doc handoff ZIP:

- `docs/MODULAR_HOME_VISUAL_PROCESS_AUTOPSY.md`
- `docs/CURRENT_TASK.md`
- `docs/MODULAR_HOME_STUDIO_DETAIL_UPGRADE_REPORT.md`
- `CHANGELOG.md`
- `VALIDATION.md`
- `FILES_CHANGED.txt`
- `docs/VISUAL_QA_PIPELINE_AUDIT.md`
- `docs/VISUAL_QA_EVIDENCE_MANIFEST.md`

Separate visual evidence bundle:

- external evidence path: `C:\qa\visual-evidence\20260622-071846`
- screenshots are not included in the source ZIP
- browser profile data is not included in the source ZIP

