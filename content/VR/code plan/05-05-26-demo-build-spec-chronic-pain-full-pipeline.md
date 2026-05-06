# Chronic Pain VR Demo Build Spec — Full Pipeline

## Context

Synthesized from all 11 original OE Research files plus 9 newer chronic-pain protocol files added 2026-05-05. The existing `demo-build-spec-chronic-pain-act.md` covers the ACT clouds + narration (already built). This plan builds the full EaseVRx-equivalent therapeutic pipeline on top of that foundation: six modalities, Muse S Gen 2 biofeedback, and the hand rehab gamification module (Tamilyn/Zone I FDP use case). Everything flows as a single linear session.

> **Scope note (2026-05-05 update):** This demo targets **chronic low back pain (CLBP)**. Fibromyalgia, neuropathic pain, and CRPS get materially different protocols (different default psychotherapy, EEG band, HRV duration). See `2026-05-05-openevidence-chronic-pain-condition-specific-adaptations.md` for branched flows.

> **Entry point:** Chronic pain will be a 4th mode on the left-controller `TopLevelModeSwitcher` (alongside social / act / breathing). Cycling to "chronic pain" loads this session flow.

Source files pulled from:

Original set:
- `content/VR/OE Research/openevidence-vr-protocols-deep-dive.md` — EaseVRx 6-component model, VRNT
- `content/VR/OE Research/openevidence-vr-hand-rehab-flexor-tendon.md` — Zone I FDP rehab, Tamilyn use case
- `content/VR/OE Research/openevidence-vr-act-biofeedback-blueprint.md` — ACT + HRV + EEG dual-loop
- `content/VR/OE Research/openevidence-vr-biofeedback-integration.md` — biofeedback mechanics
- `content/VR/OE Research/openevidence-vr-environment-design.md` — scene specs
- `content/VR/OE Research/openevidence-vr-device-compatibility.md` — hardware stack
- `content/VR/OE Research/openevidence-vr-sensor-technical-specs.md` — Muse S Gen 2 data streams
- `content/VR/OE Research/openevidence-vr-ml-adaptive-classification.md` — adaptive pacing
- `content/VR/OE Research/openevidence-vr-multimodal-integration.md` — multimodal session flow
- `content/VR/OE Research/openevidence-vr-clinical-trial-design.md` — outcome measures
- `content/VR/code plan/demo-build-spec-chronic-pain-act.md` — existing spec (narration + clouds DONE)
- `content/VR/code plan/demo-build-spec-nature-audio.md` — ocean scene spec

2026-05-05 additions (chronic-pain protocol stack):
- `2026-05-05-openevidence-vr-content-design-specification.md` — hard rules for what shows on screen during gameplay (no pain language, no rep counters, threat dial)
- `2026-05-05-openevidence-chronic-pain-vr-eeg-hrv-act-psychotherapy.md` — domain overview, PRT g=-1.74 evidence
- `2026-05-05-openevidence-chronic-pain-condition-specific-adaptations.md` — phenotype-matched protocols (CLBP→PRT, FM→EAET, neuropathic→β1/β2 NF)
- `2026-05-05-openevidence-chronic-pain-16-week-session-protocol.md` — 5-phase, ~30-session production model with RF test 4-7 bpm
- `2026-05-05-openevidence-chronic-pain-adaptive-decision-criteria.md` — Week 5 SMART decision logic, individual alpha peak frequency
- `2026-05-05-openevidence-chronic-pain-session-adaptation-framework.md` — three-timescale adaptation
- `2026-05-05-openevidence-chronic-pain-integrated-protocol-framework.md` — process-based, biomarker-guided framework
- `2026-05-05-openevidence-pcs-tsk-cpaq-instrument-detail.md` — CPAQ-2 ultra-brief (2 items, 30 sec) for pre/post
- `2026-05-05-openevidence-bpi-sf-instrument-detail.md` — BPI-SF severity + interference, MCID rules

---

## Why It Matters

Demo headline (CLBP scope, updated 2026-05-05):

- **Pain Reprocessing Therapy (PRT)** (Ashar et al. JAMA Psychiatry 2022, n=151): g = −1.74 vs usual care, **73% pain-free or nearly pain-free** at post-treatment, durable at 12 months. PRT reattributes pain from peripheral tissue damage to reversible brain processes — exactly what immersive VR pain neuroscience + threat dial moments deliver.
- **EaseVRx RCT** (n=179): d = 0.40–0.49 vs sham VR for chronic pain. Effects persist 12 months (n=1,093). FDA-cleared.
- **VRNT** (n=61): pain intensity g = 0.63, interference g = 0.84. Pre/post MRI showed dmPFC connectivity change.
- **Ocean nature VR**: d = 1.60 for pain tolerance (Raghuraman et al., Lancet RH Am 2026). Largest single-session pain effect in the literature.
- **EAET in older veterans**: 63% achieved ≥30% pain reduction vs 17% with CBT (Yarns et al.).
- **StableHandVR** (n=150): +63% voluntary ROM vs control. Kinesiophobia is the #1 rehab dropout cause.
- **HRV biofeedback VR** (Xu et al. 2025): significant anxiety + HRV improvement in a single 5-min session. ACT without biofeedback showed no HRV change.
- Pain catastrophizing (PCS score) is the #1 mediator of chronic pain disability. Cognitive defusion targets it; the **threat dial** mechanism makes central sensitization tangible.

---

## Demo Goal

Single linear session: **CPAQ-2 pre (30 sec)** → HRV baseline (5 sec) → pain neuroscience narration (5-sec clip) → **threat dial moment (10 sec)** → breathing biofeedback (5 sec) → mindfulness nature (5 sec) → ACT clouds [already built — full duration OK] → guided relaxation (5 sec) → **CPAQ-2 post (30 sec)** → summary card with HRV delta + CPAQ-2 delta. Total demo runtime: under 6 minutes.

> The CPAQ-2 (2 items, ~30 sec) gives a "psychological flexibility delta" alongside HRV delta on the summary card. Replaces the pre/post 0-10 pain rating from earlier draft because (per `2026-05-05-openevidence-vr-content-design-specification.md:21`) pain ratings during sessions prime threat monitoring. CPAQ-2 also accounts for >60% of CPAQ-20 variance (`2026-05-05-openevidence-pcs-tsk-cpaq-instrument-detail.md:210`). Pain rating may still be collected pre-session and post-session if framed as outside the immersive flow.

---

## What's Already Done (Don't Rebuild)

Verified against `/Users/anderschan/vr-mvp/unity/Assets/` on 2026-05-05:

- **DONE:**
  - `ACTCloudSpawner` — PCS thought words, proximity dissolve, 8-15s spawn (word list needs review per Task 6)
  - `BreathingPacer` — 6 bpm orb with visual scaling
  - `HRVEnvironmentController` — fog/bloom/vignette modulation by RMSSD coherence
  - `BiofeedbackHUD` — right-hand HUD with HR/RMSSD + α/β/θ bars, spawned by `BiofeedbackBootstrap`
  - `TopLevelModeSwitcher` — social → act → breathing menu cycler
  - Forest scene (`NatureScene.unity`)
  - Ocean scene (`OceanNatureScene.unity` — exists bare, no spatial audio yet)
- **PARTIAL (needs work):**
  - Muse bridge — `BiofeedbackReceiver.cs` is WebSocket, not OSC. Will need swap or wrapper for the OSC streams Task 1 wants.
  - `ACTProfile.cs` baseline storage — has the right fields but ACT-scoped; rename or fork to `ChronicPainBaselineProfile`.
- **NOT BUILT:**
  - `EEGProcessor.cs` (FFT, FAA, individual peak frequency)
  - HRV baseline calibration scene
  - Pain narration scene + `NarrationTimer`
  - `RelaxationNarration` 5-prompt sequence
  - Hand rehab module entirely
  - Pre/post pain rating UI (now demoted — see Task 9 update)
  - Session summary card
  - **Session flow orchestrator** — nothing currently chains baseline → narration → breathing → ocean → ACT → relaxation → summary. The mode switcher is menu-level only, not intra-session.
  - Threat dial (Task 11)
  - CPAQ-2 (Task 12)

**Pending for social anxiety branch** (not this plan, but note): NPC faces need to be added to all three scenario characters before that work can be pushed to GitHub.

---

## DEMO vs. PRODUCTION TIMINGS

> All measurement/calibration phases = 5 seconds for demo. Real product timings below.

| Phase | DEMO | PRODUCTION |
|-------|------|------------|
| HRV baseline calibration | **5 sec** | 60 sec |
| RMSSD rolling window | **5 sec** | 30 sec |
| EEG FFT epoch | 2 sec | 2 sec (unchanged — already minimal) |
| FAA (frontal alpha asymmetry) | Directional only, no numeric display | Full metric — shown in session summary trend |
| EEG buffer for FAA reliability | **5 sec** | 30 sec minimum |
| Pre-exercise HRV warmup (breathing scene) | **5 sec** | 5 min |
| Mindfulness nature immersion | **5 sec** | 5–10 min |
| Guided relaxation | **5 sec** | 5–10 min |
| Hand exercise session (per phase) | **5 sec** | 15–20 min |
| Post-session HRV recovery window | **5 sec** | 5 min |
| Pain narration clip | **5-sec excerpt** | 60 sec full |
| Pain rating pause | Quick tap (no hold) | 10 sec hold |
| Session summary display | **5 sec auto-advance** | 1–2 min |
| Full program (EaseVRx model) | Demo = 1 session | 56 daily sessions (8 weeks) |
| Hand rehab program | Demo = 1 session | Weeks 3–12 post-op |

---

## Tasks

### Task 1 — Muse S Gen 2 Data Bridge (45 min)
*(Skip if already built for social anxiety branch — reuse same `MuseDataReceiver.cs`)*

OSC bridge from Muse to Unity. Streams needed:
- `/muse/eeg` — TP9, AF7, AF8, TP10 at 256 Hz
- `/muse/ppg` — HRV derivation
- `/muse/elements/alpha_absolute` — per-channel alpha power
- `/muse/elements/is_good` — signal quality gate

Circular buffer: **DEMO = 5 sec × 256 = 1,280 samples**. Real: 30-sec buffer (7,680 samples).

If `is_good` false >50% of demo buffer: show "Adjust headset" overlay, freeze baseline capture.

### Task 2 — HRV Baseline Calibration (30 min)

Ocean environment (use existing ocean scene from `demo-build-spec-nature-audio.md` or forest fallback). Floating breathing orb: expand 5s inhale, contract 5s exhale at 6 breaths/min.

Flow:
1. Prompt: "Sit still. Breathe naturally."
2. **DEMO: 5-sec countdown** (real: 60 sec)
3. Capture: mean HR, RMSSD, frontal alpha average (AF7+AF8), FAA (AF8−AF7)
4. Store as `ChronicPainBaselineProfile` ScriptableObject
5. Green checkmark → auto-advance 1 sec

> **Production note (2026-05-05):** 6 bpm is a **demo placeholder**, not the real protocol. Production Phase 0 runs an individualized resonance frequency (RF) test sweeping **4–7 bpm in 0.5-bpm increments**, picking the rate that produces the highest HRV amplitude. RF is unstable in 67% of patients — reassess every 2 weeks. Source: `2026-05-05-openevidence-chronic-pain-16-week-session-protocol.md:12,17`.

### Task 3 — Pain Narration Scene (15 min)

Already scripted. For demo: play first 5-second excerpt, then auto-advance. Real: play full 60 sec.

Implement `NarrationTimer` float: if `isDemoMode == true`, `clipDuration = 5f`, else `clipDuration = audioClip.length`.

Scene stays in ocean environment. Soft ambient audio underneath narration. No interaction required.

### Task 3b — EEG Processing Layer (30 min)
*(Spec from `openevidence-vr-act-biofeedback-blueprint.md`)*

Muse S Gen 2 gives 4-channel EEG: TP9, AF7, AF8, TP10. Add `EEGProcessor.cs` alongside `MuseDataReceiver.cs`.

**Band targets for chronic pain:**

| Band | Hz | Pain-relevant role |
|------|----|--------------------|
| Alpha | 8–12 Hz | Primary analgesic pathway — relaxed present-moment awareness. When alpha rises, pain gating activates. |
| Theta | 4–8 Hz | Mind-wandering / rumination proxy. Theta surge = patient drifted to catastrophizing thoughts. |
| High-Beta | 20–30 Hz | Stress/rumination proxy. Elevated high-beta = pain amplification state. |

**Frontal Alpha Asymmetry (FAA):**
- Compute: `FAA = log(AF8_alpha) - log(AF7_alpha)`
- Positive FAA = approach motivation (engaged, open). Negative FAA = withdrawal (avoidance, kinesiophobia in rehab).
- For hand rehab: low FAA before exercise = flag kinesiophobia state → switch to breathing scene first before exercise.

**Processing pipeline:**
- FFT window: **2-second epochs** (unchanged in demo and real — already minimal)
- Normalize each band vs baseline: `alphaNorm = currentAlpha / baselineAlpha`
- Update rate: 0.5 Hz (every 2 sec, matching FFT epoch)

**EEG biofeedback triggers in session (DEMO PLACEHOLDER VALUES):**
- Alpha ≥ 1.1× baseline → subtle green shimmer on ocean surface, soft chime (mindfulness reward)
- Theta surge (theta > 1.3× baseline + alpha drops) → gentle environmental cue: bird call in periphery redirects attention without interrupting flow
- High-beta spike (>1.5× baseline) → increase wave sound volume slightly, no text prompt (avoid conscious interruption)

> **Real thresholds (2026-05-05):** The 1.1× / 1.3× / 1.5× ratios above are demo placeholders, NOT clinically validated thresholds. Production targets:
> - **Individual alpha peak frequency**, not fixed 8-12 Hz. Chronic pain patients have shifted dominant alpha (mean ≈7.6 Hz). Neurofeedback at the individual peak ± 2 Hz produces significantly larger pain reduction than fixed-band targeting (`2026-05-05-openevidence-chronic-pain-adaptive-decision-criteria.md:38`).
> - **Alpha state dynamics** (fractional occupancy, dwell time, low-to-high transition probability) correlate r = -0.45 to -0.48 with pain reduction — more sensitive than mean alpha power (`adaptive-decision-criteria.md:45`).
> - For neuropathic pain phenotype, target **β1/β2 contralateral** instead of alpha (Mussigmann et al.) — see `2026-05-05-openevidence-chronic-pain-condition-specific-adaptations.md:118`.
> - For fibromyalgia, HRV recording should be **≥10 min**, not 5 (systemic dysregulation requires longer protocols).

**Dual-loop architecture** (HRV = primary, EEG = secondary):
- HRV loop: fog lifts / flower blooms as RMSSD coherence rises — strongest evidence (g=0.81–0.83)
- EEG loop: environmental texture responds to alpha/theta — secondary reinforcement layer
- Both run simultaneously. If HRV coherence AND alpha both above baseline = "deep coherence" state → trigger brief sparkle particle effect, longer chime

**DEMO vs PRODUCTION:**
- DEMO: 2-sec epoch, 5-sec buffer — FAA is directional only, don't show numeric value
- PRODUCTION: 30-sec baseline for FAA reliability, show FAA trend card in session summary

### Task 4 — Diaphragmatic Breathing + HRV Biofeedback Scene (30 min)

Virtual flower (or orb) expands as HRV coherence rises. Fog lifts when RMSSD ≥ baseline. Turbulence/fog returns if RMSSD drops.

Dual-loop active here (both run simultaneously):

**HRV loop (primary — strongest evidence):**
- Sample RMSSD every 1 sec from 5-sec rolling window (demo) / 30-sec window (real)
- Normalize: `coherence = clamp((RMSSD / baselineRMSSD), 0, 2)`
- Map coherence → flower bloom scale (0.3 min, 1.0 max), fog density (1.0 → 0.0)
- Haptic on Quest controller: 100ms pulse every ~5 sec at 6 breaths/min

**EEG loop (secondary — from `openevidence-vr-act-biofeedback-blueprint.md`):**
- Alpha ≥ 1.1× baseline → green ocean shimmer + soft chime
- Theta surge (>1.3× baseline) → peripheral bird call to redirect attention (no text)
- High-beta spike (>1.5× baseline) → raise wave ambient volume slightly
- Deep coherence (HRV + alpha both above threshold) → sparkle particles + longer chime

**DEMO: 5-sec auto-advance** after window completes. Real: scene runs until coherence holds ≥ 1.1× baseline for 30 sec.

### Task 5 — Mindfulness Nature Scene (20 min)

Ocean environment. Fully passive — no NPC, no interaction. Patient just looks around.

Scene specs (from `demo-build-spec-nature-audio.md`):
- 200×200 plane, Crest Ocean or Unity Standard Water
- 5500K directional light at 45°
- Three spatial audio sources: waves (5–50m falloff), seabirds (10–30m), wind (ambient, 2D)
- Gentle particle fog in periphery

Two analgesia pathways active simultaneously:
1. Gamma pathway (immersion): high presence → attention off pain
2. Alpha pathway (mindfulness): EEG alpha target (8–12 Hz at AF7+AF8), subtle chime when ≥ baseline

**DEMO: 5-sec** then auto-advance. Real: 5–10 min.

### Task 6 — ACT Cognitive Defusion (ALREADY BUILT — needs word-list review)

`ACTCloudSpawner` is built. Currently spawning PCS words: "broken", "never end", "afraid", "useless", "stuck", "ruined", "trapped", "alone". Proximity dissolve working.

Wire into session flow: start spawner on scene load, stop and despawn all clouds after 60 sec (real) or 30 sec (demo). Auto-advance on timer.

> **Content design conflict (2026-05-05):** `2026-05-05-openevidence-vr-content-design-specification.md:21` forbids "pain-related language on screen during gameplay" because it primes threat monitoring. The current PCS word list is exactly that. Three options:
> 1. **Replace PCS words with non-pain self-criticism words** ("not enough", "judged", "fail", "behind") — keeps defusion mechanism, removes pain priming. Loses direct PCS-mapping but matches new content rule.
> 2. **Move ACT clouds to a clearly framed "thought defusion exercise"** screen with a brief verbal pre-frame ("notice these as thoughts passing through"). The pre-frame may be the carve-out — content rule applies to gameplay, not to explicitly framed psychological exercises.
> 3. **Drop ACT clouds entirely from the chronic-pain demo** and substitute the **threat dial** moment (Task 11) which is the new content-design file's recommended interactive element for pain reattribution.
> **Recommend Option 1 for CLBP demo** — keeps the already-built spawner, swaps the word source. Cheapest path. Decision needed before next demo build.

### Task 7 — Guided Relaxation Scene (25 min)

Progressive muscle relaxation narration over ocean environment. No movement required.

Narration sequence (5 prompts, 5 sec each for demo / 30 sec each real):
1. "Soften your shoulders."
2. "Release your hands."
3. "Let your jaw drop slightly."
4. "Notice your weight in the chair."
5. "You're safe here."

Implement as `RelaxationNarration` MonoBehaviour: `float promptDuration = isDemoMode ? 5f : 30f`. AudioSource with overlapping soft ambient underneath.

**DEMO: full sequence = 25 sec total** (5 prompts × 5 sec). Real: 2.5 min.

### Task 8 — Hand Rehab Module — Gamified Exercise Scene (60 min)

Optional module, separate scene. Activate for Tamilyn use case / PT demo.

Components:
1. **Optical hand tracking** via Quest 3 hand tracking API. No controller.
2. **Safe ROM zone visualization**: Green zone overlay on DIP joint. 0–75° = green, beyond = soft fade (NOT yellow warning — avoid pain-conditioned fear). No red zone.
3. **RMSSD-triggered pause**: if RMSSD drops >20% below baseline mid-exercise → orb pulses orange → "Pause. One breath." prompt → resumes when RMSSD recovers to 90% baseline or after **5 sec demo** (real: waits for genuine recovery).
4. ~~**Rep counter**~~ → **Game-framed movement loop**: pick a virtual fruit, place it in basket, repeat. Movement count tracked silently in background for clinician dashboard, NEVER shown to patient. Per `2026-05-05-openevidence-vr-content-design-specification.md:22`: "no movement counters, rep counters, or exercise labels — reactivates patient identity as someone doing rehab." Target 40–80 movement cycles same as before, just hidden.
5. **Anders avatar**: static friendly avatar seated across from patient. No interaction needed for demo — just presence. (Add face when NPC face system is done.)
6. **Embodied virtual hands** required (not abstract pointers). Visual underestimation of one's own movement increases pain-free ROM by ~+20% (Jordán-López 2025, cited in content-design file).

VR adds: +63% ROM adherence, kinesiophobia reduction, early adhesion detection via ROM plateau.

Highest-value rehab windows: **Weeks 3–6** (rupture vs adhesion balance) and **Weeks 6–12** (stiffness window, adherence matters most).

**DEMO: 5-sec rep sequence** showing green zone + one RMSSD-triggered pause + recovery.

### Task 9 — Pre/Post Pain Rating UI (15 min) — DEMOTED, see Task 12

World-space Canvas, 0–10 numeric pad. Show pre-session after baseline, show post-session after relaxation.

Store delta: `painDelta = preRating - postRating`. Display on summary card.

> **2026-05-05 update:** Pain rating during the immersive flow conflicts with content-design rule (`vr-content-design-specification.md:21`). For demo, **collect pain rating OUTSIDE VR** (clipboard before/after the headset goes on/off) and feed it into the summary card. The CPAQ-2 in Task 12 carries the in-session psychological delta. If you keep an in-VR pain pad anyway, frame it as a "menu/intake screen" visually distinct from the immersive scenes.

### Task 10 — Session Summary Card (20 min)

Appears after guided relaxation (or hand rehab if that module ran). World-space panel.

Shows:
- "Pain: [pre] → [post]" (collected outside VR per Task 9 update)
- "Acceptance shift: [+/-X]" (CPAQ-2 delta from Task 12)
- "HRV change: +[X]%" vs baseline
- "Alpha coherence: [X]% of session"
- ACT reflection prompt: "What did you notice about your thoughts during that?"
- Optional: "HRV recovery speed: [X] sec" (capped at 5 for demo — but shows the real number)

**DEMO: 5-sec auto-advance** then fade to black. Real: user reads + taps to dismiss.

### Task 11 — Threat Dial Interactive Moment (30 min) — NEW (2026-05-05)

Per `2026-05-05-openevidence-vr-content-design-specification.md:35` and `chronic-pain-16-week-session-protocol.md:27`. Most demo-able moment in the new content design — patient manipulates a virtual control and watches the pain signal grow or shrink in real time at each brain relay station. Makes central sensitization tangible.

Components:
- World-space dial (0–10) on left controller, patient turns it
- Thalamic / cortical signal nodes pulse brighter/dimmer in lockstep with the dial
- Voiceover: "When fear goes up, the pain signal amplifies. When fear goes down, it quiets."
- Single interaction: turn dial down from high to low, see signal quiet → narration confirms
- Connects directly to PRT mechanism (reattribution to brain processes)

**DEMO: 10 sec** — turn dial once, hold, narration plays, auto-advance. No score or counter.
**PRODUCTION:** Embedded in Phase 1 VRNT sessions. Patient explores brain anatomy, manipulates threat at multiple sites.

### Task 12 — CPAQ-2 Pre/Post (15 min) — NEW (2026-05-05)

Two-item ultra-brief acceptance measure (`pcs-tsk-cpaq-instrument-detail.md:203-210`). Replaces in-session pain rating.

Items (7-point Likert, 0=never true, 6=always true):
- Item 9 (AE): "I lead a full life even though I have chronic pain."
- Item 14 (PW, reverse-scored): "Before I can make any serious plans, I have to get some control over my pain."

Score: AE − PW (range −6 to +6). Higher = more acceptance.

Flow:
- Pre: shown after Muse connect, before HRV baseline. World-space panel, two sliders or 7-button rows.
- Post: shown after guided relaxation, before summary card.
- Delta displayed on summary card.

**Demo time: 30 sec each = 60 sec total. Adds one minute to demo runtime — worth it for the "psych delta" headline.**

These two items account for >60% of CPAQ-20 variance. Adequate for demo, NOT clinically valid for individual decisions (use full CPAQ-20 in production trials per `pcs-tsk-cpaq-instrument-detail.md:240`).

---

## Demo Session Flow (Total ~6 min)

```
Pain rating pre (outside VR, on clipboard, 30 sec)
→ Muse connect (30 sec)
→ CPAQ-2 pre [30 sec]
→ HRV baseline [5 sec]
→ Pain narration excerpt [5 sec]
→ Threat dial moment [10 sec]
→ Breathing + HRV biofeedback [5 sec]
→ Mindfulness ocean [5 sec]
→ ACT clouds [~30 sec — non-pain word list per Task 6 update]
→ Guided relaxation [25 sec — 5 prompts × 5 sec]
→ CPAQ-2 post [30 sec]
→ Summary card [5 sec auto-advance]
→ Done → headset off → pain rating post (clipboard, 30 sec)
```

Hand rehab module: separate demo path, not in main chronic pain flow.

---

## Estimated Time

| Task | Time |
|------|------|
| Task 1: Muse bridge (if not reused) | 45 min |
| Task 2: HRV baseline scene | 30 min |
| Task 3: Narration demo timer | 15 min |
| Task 3b: EEG processing layer | 30 min |
| Task 4: Breathing + HRV biofeedback | 30 min |
| Task 5: Mindfulness ocean scene | 20 min |
| Task 6: ACT clouds wire-up | 10 min |
| Task 7: Guided relaxation scene | 25 min |
| Task 8: Hand rehab module | 60 min |
| Task 9: Pain rating UI wire-up | 15 min |
| Task 10: Session summary card | 20 min |
| Task 11: Threat dial moment (NEW 2026-05-05) | 30 min |
| Task 12: CPAQ-2 pre/post (NEW 2026-05-05) | 15 min |
| Polish + demo recording | 30 min |
| **Total (no hand rehab)** | **~4.25 hrs** |
| **Total (with hand rehab)** | **~5.25 hrs** |

---

## Skip If Running Short

Non-negotiable for demo:
1. HRV baseline (Task 2) — without this, biofeedback has no reference
2. Breathing + HRV loop (Task 4) — this IS the demo's science moment
3. ACT clouds already built — just confirm they fire in session flow with non-pain word list (Task 6)
4. **Threat dial moment (Task 11)** — the new "feel the science" moment, ties directly to PRT mechanism
5. Summary card with HRV + CPAQ-2 delta (Task 10 + Task 12) — the "proof it worked" moment

Can skip:
- Hand rehab module (Task 8) — separate demo anyway
- EEG processing layer (Task 3b) — drop to HRV-only if Muse EEG is unreliable on the day
- Guided relaxation narration (Task 7) — shorten to 1 prompt
- Pain rating UI (Task 9) — skip, do clipboard pre/post outside VR
- Mindfulness ocean scene (Task 5) — go straight from breathing to ACT clouds
- Muse bridge (Task 1) if already built for social anxiety branch
- CPAQ-2 (Task 12) — if very tight on time, skip; but the psych delta is a strong demo moment

---

## Don't Break

- ACT clouds are already working — do NOT refactor `ACTCloudSpawner`. Only wire its start/stop into session flow.
- Ocean scene shader (URP/Lit + Crest or Standard Water): test on Quest 3 standalone build BEFORE adding spatial audio. Water shaders are GPU-heavy — profile before adding biofeedback overlay on top.
- Muse bridge requires Android build target — same as social anxiety branch.
- 5-sec RMSSD window has high variance by design. Do NOT present the number as clinically valid in the demo. Frame it as "directional signal, not medical measurement."
- Hand tracking (Task 8) requires Quest 3 — will not work on Quest 2. Verify build target before demoing rehab module.
- Multiplayer (Photon Fusion) branch: don't touch. Anders avatar in hand rehab is a static non-networked asset for demo.
- NPC faces (social anxiety branch): that work is separate. Don't let this build overwrite the social anxiety scenes.

---

## Production Expansion (Post-Demo)

> **Program model resolved (2026-05-05):** Earlier draft mentioned both "EaseVRx 56 daily sessions × 8 weeks" AND a 16-week structure. The new chronic-pain protocol stack is the production model. EaseVRx remains the FDA-cleared comparator/headline evidence. **Use the 16-week / 5-phase / ~30-session protocol for production builds.**

- Extend all demo timings to production values (see table above)
- **16-week / 5-phase production protocol** (`2026-05-05-openevidence-chronic-pain-16-week-session-protocol.md`):
  - Phase 0 (Visit 1-2): intake, instrument battery, EEG resting state, RF test 4-7 bpm
  - Phase 1 (Weeks 1-2): VRNT × 2-4 sessions (pain neuroscience + threat dial)
  - Phase 2 (Weeks 3-5): phenotype-matched psychotherapy core (PRT for CLBP, EAET for fibromyalgia, ACT for nociplastic-disengaged)
  - Phase 3 (Weeks 5-12): adaptive biofeedback augmentation for non-responders, 12-session NF dose, HRV BFB at individual RF
  - Phase 4 (Weeks 12-16): real-world wearable HRV practice, daily 10-min RF breathing
  - Phase 5: maintenance + Week 28/52 follow-up
- **Week 5 SMART decision point** (`2026-05-05-openevidence-chronic-pain-adaptive-decision-criteria.md`): three-tier responder logic — clinical (≥30% BPI reduction), EEG (alpha fractional occupancy + theta/alpha ratio), HRV (RMSSD age/sex quartile)
- VRNT add-on: pain reprocessing narration + threat dial — strongest evidence for pain belief change
- Adaptive pacing via ML: track RMSSD trend across sessions → auto-adjust intensity (from `openevidence-vr-ml-adaptive-classification.md`)
- Three-timescale adaptation (`2026-05-05-openevidence-chronic-pain-session-adaptation-framework.md`): between-session daily diary, within-session real-time HRV (60th-percentile-of-self threshold), phase-transition (Week 2/5/8/12). Pacer reliance fades 75% → 0% across sessions 5-8.
- **Phenotype-matched protocol branches** (`2026-05-05-openevidence-chronic-pain-condition-specific-adaptations.md`):
  - **CLBP** → PRT default (g=-1.74, 73% pain-free, Ashar et al.). Alt: EAET if trauma history.
  - **Fibromyalgia** → EAET (63% ≥30% reduction). Alt: ACT (Lai meta-analysis g=0.44 for FM specifically). HRV recording ≥10 min. NOT PRT (FM patients already understand pain isn't structural).
  - **Neuropathic** → β1/β2 contralateral neurofeedback (Mussigmann). NOT PRT (real nerve damage). EAET if trauma comorbidity.
  - **CRPS** → add thermal biofeedback.
- Weekly ROM tracking dashboard (hand rehab): trend lines, adherence rate, plateau detection (clinician-only — patient never sees rep counts)
- Full program outcome measures: BPI-SF (severity + interference, MCID = 1 pt or ≥30%), PCS (catastrophizing, MCIC 8 pts; 11 if baseline ≥30), TSK-17 (kinesiophobia ≥37 cutoff), CPAQ-20 formal + CPAQ-2 per-session, RMSSD trend, alpha coherence trend

---

## Research Basis

| Evidence | Source |
|----------|--------|
| **PRT g=-1.74, 73% pain-free or near, n=151 CLBP RCT** | Ashar et al. JAMA Psychiatry 2022; 2026-05-05-openevidence-chronic-pain-vr-eeg-hrv-act-psychotherapy.md:31 |
| **EAET 63% ≥30% pain reduction vs CBT 17%** | Yarns et al.; 2026-05-05-openevidence-chronic-pain-vr-eeg-hrv-act-psychotherapy.md:32 |
| EaseVRx d=0.40–0.49, n=179 RCT | FDA-cleared 2021, openevidence-vr-protocols-deep-dive.md |
| 12-month durability, n=1,093 | protocols-deep-dive.md |
| VRNT g=0.63 pain intensity, MRI change | protocols-deep-dive.md |
| Ocean nature d=1.60 pain tolerance | Raghuraman et al., Lancet RH Am 2026; hand-rehab file |
| StableHandVR +63% ROM, kinesiophobia | hand-rehab-flexor-tendon.md |
| HRV biofeedback VR single session effect | Xu et al. 2025; act-biofeedback-blueprint.md |
| HRV reduced in chronic pain (g=-0.52, n=3,641) | 2026-05-05-openevidence-chronic-pain-vr-eeg-hrv-act-psychotherapy.md:19 |
| ACT defusion → pain catastrophizing (g=0.44 FM-specific) | protocols-deep-dive.md; 2026-05-05-condition-specific-adaptations.md:40 |
| **Individual alpha peak frequency (mean ≈7.6 Hz in chronic pain)** | 2026-05-05-openevidence-chronic-pain-adaptive-decision-criteria.md:38 |
| **Alpha fractional occupancy r=-0.45 to -0.48 with pain reduction** | 2026-05-05-openevidence-chronic-pain-adaptive-decision-criteria.md:45 |
| HRV resonance frequency individualized 4-7 bpm in 0.5 increments | Lehrer & Gevirtz 2014; 2026-05-05-openevidence-chronic-pain-16-week-session-protocol.md:17 |
| **CPAQ-2 accounts for >60% of CPAQ-20 variance** | 2026-05-05-openevidence-pcs-tsk-cpaq-instrument-detail.md:210 |
| **No pain language / no rep counters during gameplay** | 2026-05-05-openevidence-vr-content-design-specification.md:21,22 |
| **Embodied virtual hands → +20% pain-free ROM (Jordán-López 2025)** | 2026-05-05-openevidence-vr-content-design-specification.md |
| Zone I FDP Evans protocol | hand-rehab-flexor-tendon.md |
