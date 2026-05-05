# Chronic Pain VR Demo Build Spec — Full Pipeline

## Context

Synthesized from all 11 OE Research files. The existing `demo-build-spec-chronic-pain-act.md` covers the ACT clouds + narration (already built). This plan builds the full EaseVRx-equivalent therapeutic pipeline on top of that foundation: six modalities, Muse S Gen 2 biofeedback, and the hand rehab gamification module (Tamilyn/Zone I FDP use case). Everything flows as a single linear session.

Source files pulled from:
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

---

## Why It Matters

- **EaseVRx RCT** (n=179): d = 0.40–0.49 vs sham VR for chronic pain. Effects persist 12 months (n=1,093).
- **VRNT** (n=61): pain intensity g = 0.63, interference g = 0.84. Pre/post MRI showed actual dmPFC connectivity changes — the brain physically changed.
- **Ocean nature VR**: d = 1.60 for pain tolerance (Raghuraman et al., Lancet RH Am 2026). Largest single-session pain effect in the literature.
- **StableHandVR** (n=150): +63% voluntary ROM vs control. Kinesiophobia is the #1 rehab dropout cause — VR directly eliminates it.
- **HRV biofeedback VR** (Xu et al., 2025): significant anxiety + HRV improvement in a single 5-min session. ACT without biofeedback showed no HRV change.
- Pain catastrophizing (PCS score) is the #1 mediator of chronic pain disability. Cognitive defusion — ACT clouds — directly targets it.

---

## Demo Goal

Single linear session: HRV baseline (5 sec) → pain neuroscience narration (5-sec clip) → breathing biofeedback (5 sec) → mindfulness nature (5 sec) → ACT clouds [already built — full duration OK] → guided relaxation (5 sec) → summary card with HRV + pain delta. Total demo runtime: under 6 minutes.

---

## What's Already Done (Don't Rebuild)

- ACT cognitive defusion clouds (`ACTCloudSpawner`) — PCS thought words, proximity dissolve, 8-15s spawn
- Pain neuroscience narration audio + script
- Pre/post pain rating UI (stretch from existing spec — check if done)
- Forest nature environment (base scene)

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

**EEG biofeedback triggers in session:**
- Alpha ≥ 1.1× baseline → subtle green shimmer on ocean surface, soft chime (mindfulness reward)
- Theta surge (theta > 1.3× baseline + alpha drops) → gentle environmental cue: bird call in periphery redirects attention without interrupting flow
- High-beta spike (>1.5× baseline) → increase wave sound volume slightly, no text prompt (avoid conscious interruption)

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

### Task 6 — ACT Cognitive Defusion (ALREADY DONE)

`ACTCloudSpawner` is built. PCS words spawning: "broken", "never end", "afraid", "useless", "stuck", "ruined", "trapped", "alone". Proximity dissolve working.

Wire into session flow: start spawner on scene load, stop and despawn all clouds after 60 sec (real) or 30 sec (demo). Auto-advance on timer.

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
2. **Safe ROM zone visualization**: Green zone overlay on DIP joint. 0–75° = green, beyond = yellow warning. No red zone — avoid pain-conditioned fear.
3. **RMSSD-triggered pause**: if RMSSD drops >20% below baseline mid-exercise → orb pulses orange → "Pause. One breath." prompt → resumes when RMSSD recovers to 90% baseline or after **5 sec demo** (real: waits for genuine recovery).
4. **Rep counter**: count ring DIP flexion cycles. Target: 40–80 reps (shown as progress fill).
5. **Anders avatar**: static friendly avatar seated across from patient. No interaction needed for demo — just presence. (Add face when NPC face system is done.)

VR adds: +63% ROM adherence, kinesiophobia reduction, early adhesion detection via ROM plateau.

Highest-value rehab windows: **Weeks 3–6** (rupture vs adhesion balance) and **Weeks 6–12** (stiffness window, adherence matters most).

**DEMO: 5-sec rep sequence** showing green zone + one RMSSD-triggered pause + recovery.

### Task 9 — Pre/Post Pain Rating UI (15 min)

World-space Canvas, 0–10 numeric pad. Show pre-session after baseline, show post-session after relaxation.

Store delta: `painDelta = preRating - postRating`. Display on summary card.

Already partially built per existing spec — verify it wires up to session flow.

### Task 10 — Session Summary Card (20 min)

Appears after guided relaxation (or hand rehab if that module ran). World-space panel.

Shows:
- "Pain: [pre] → [post]" (if pain rating done)
- "HRV change: +[X]%" vs baseline
- "Alpha coherence: [X]% of session"
- ACT reflection prompt: "What did you notice about your thoughts during that?"
- Optional: "HRV recovery speed: [X] sec" (capped at 5 for demo — but shows the real number)

**DEMO: 5-sec auto-advance** then fade to black. Real: user reads + taps to dismiss.

---

## Demo Session Flow (Total ~5 min)

```
Muse connect (30 sec)
→ HRV baseline [5 sec]
→ Pain narration excerpt [5 sec]
→ Breathing + HRV biofeedback [5 sec]
→ Mindfulness ocean [5 sec]
→ ACT clouds [~30 sec — real content]
→ Guided relaxation [25 sec — 5 prompts × 5 sec]
→ Summary card [5 sec auto-advance]
→ Done
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
| Polish + demo recording | 30 min |
| **Total (no hand rehab)** | **~3.5 hrs** |
| **Total (with hand rehab)** | **~4.5 hrs** |

---

## Skip If Running Short

Non-negotiable for demo:
1. HRV baseline (Task 2) — without this, biofeedback has no reference
2. Breathing + HRV loop (Task 4) — this IS the demo's science moment
3. ACT clouds already built — just confirm they fire in session flow (Task 6)
4. Summary card with HRV delta (Task 10) — the "proof it worked" moment

Can skip:
- Hand rehab module (Task 8) — separate demo anyway
- EEG processing layer (Task 3b) — drop to HRV-only if Muse EEG is unreliable on the day
- Guided relaxation narration (Task 7) — shorten to 1 prompt
- Pain rating UI (Task 9) — skip, just show HRV delta on summary
- Mindfulness ocean scene (Task 5) — go straight from breathing to ACT clouds
- Muse bridge (Task 1) if already built for social anxiety branch

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

- Extend all demo timings to production values (see table above)
- Full 56-day program structure: daily sessions with progress curve
- EaseVRx model: increase session duration 6–12 min per module
- VRNT add-on: pain reprocessing narration ("your pain is brain-generated, not tissue damage") as optional module — strongest evidence for pain belief change
- Adaptive pacing via ML: track RMSSD trend across sessions → auto-adjust session intensity (from `openevidence-vr-ml-adaptive-classification.md`)
- Weekly ROM tracking dashboard (hand rehab): trend lines, adherence rate, plateau detection flag to therapist
- Full program outcome measures: VAS (pain intensity), PCS (catastrophizing), RMDQ (disability), RMSSD trend, alpha coherence trend

---

## Research Basis

| Evidence | Source |
|----------|--------|
| EaseVRx d=0.40–0.49, n=179 RCT | FDA-cleared 2021, openevidence-vr-protocols-deep-dive.md |
| 12-month durability, n=1,093 | protocols-deep-dive.md |
| VRNT g=0.63 pain intensity, MRI change | protocols-deep-dive.md |
| Ocean nature d=1.60 pain tolerance | Raghuraman et al., Lancet RH Am 2026; hand-rehab file |
| StableHandVR +63% ROM, kinesiophobia | hand-rehab-flexor-tendon.md |
| HRV biofeedback VR single session effect | Xu et al. 2025; act-biofeedback-blueprint.md |
| ACT defusion → pain catastrophizing | protocols-deep-dive.md, act-biofeedback-blueprint.md |
| HRV coherence resonance: 6 breaths/min | Lehrer & Gevirtz 2014; biofeedback-integration.md |
| Zone I FDP Evans protocol | hand-rehab-flexor-tendon.md |
