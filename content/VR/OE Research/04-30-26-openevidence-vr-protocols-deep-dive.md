# VR Protocols Deep Dive: Conditions, Components, Sensors, EEG

Source: OpenEvidence research synthesis.

## Bottom Line

- **Chronic pain:** EaseVRx (8-week home VR with breathing biofeedback) and VRNT (neuroscience-based VR) both have RCT evidence. EaseVRx focuses on coping skills. VRNT targets pain elimination via brain reattribution.
- **PTSD:** BraveMind VRET (graded combat exposure, 6-10 sessions) is the dominant protocol. VRE matches imaginal exposure; better for comorbid depression.
- **Anxiety:** VR exposure within CBT (10-14 sessions) matches or beats in vivo exposure for social anxiety, phobias, panic.
- **Depression detection:** VR + eye tracking + ML classifiers hit 86% accuracy from gaze data.
- **Sensors:** Both proven VR pain therapies run on consumer headsets. EaseVRx needs only a breath sensor. VRNT needs nothing extra. EEG and HRV are research-stage for pain.
- **EEG protocols:** Theta is the most robust pain biomarker. Different bands target different conditions (ISF for low back, β1/β2 for neuropathic, SMR for fibromyalgia).

---

## Part 1: Protocols by Condition

### VR for Chronic Pain

**EaseVRx (Behavioral Skills-Based VR)**

The most rigorously studied protocol. Self-administered, home-based, 56-day (8-week) daily VR program. Content: pain neuroscience education, diaphragmatic breathing, biofeedback, mindfulness, cognitive defusion, guided relaxation. Daily use for 8 weeks.

- Landmark double-blind sham-controlled RCT (n=179): Cohen d 0.40-0.49 vs sham VR
- Pre-post effects: d = 1.17-1.30 for pain intensity and interference
- Effects persisted at 6 months [1][2]

**VR Neuroscience-Based Therapy (VRNT)**

Targets cognitive and affective neural processes maintaining chronic pain. Smaller RCT (n=61) for chronic back pain vs waitlist with pre/post MRI.

- Pain intensity: g = 0.63
- Pain interference: g = 0.84
- Mediated by reduced kinesiophobia and catastrophizing
- Associated changes in dorsomedial prefrontal connectivity [3]

**Meta-Analytic Picture**

122 RCTs, 9,138 patients. VR significantly reduced pain (SMD = -0.65). Effects not dependent on frequency or duration but stronger in moderate-to-severe pain and younger patients [4].

### VR for PTSD

**BraveMind (Combat-Related PTSD)**

Visual, auditory, haptic, olfactory immersion into virtual Iraq/Afghanistan scenarios. Graded exposure: 12 escalating VR events (distant gunfire, road ambush, IED detonation) in an 8-minute driving scenario repeated 3 times per session (~25 min VR per session).

- Typical: 6-10 sessions over 2-5 weeks
- Sessions ~60 min including setup and debrief [5][6]

**VR + D-cycloserine Augmentation**

Multisite RCT (n=192). 9 weeks of VRE or prolonged imaginal exposure (PE), with or without D-cycloserine.

- VRE and PE produced similar improvement
- VRE more effective for comorbid depression
- PE more effective for non-depressed [7]

**VR-Based Graded Exposure Therapy (VR-GET)**

- Large effect size g = 1.10 vs controls
- Outperforms conventional VRET in meta-analysis
- Dose-response: more sessions = larger effects
- Sustained at 3 and 6 months [8][9]

### VR for Anxiety Disorders

**Social Anxiety Disorder (SAD)**

10-14 weekly individual sessions (~60 min). CBT components (cognitive restructuring, psychoeducation) plus VR exposure to social scenarios (public speaking, job interviews, social interactions).

- RCT (n=59): VR more effective than in vivo on Liebowitz Social Anxiety Scale
- More practical for therapists
- Self-guided VRE (≥4 sessions): g = -0.54 to -1.11, maintained at 6 months [10][11][12]

**Specific Phobias and Panic Disorder**

- Specific phobias: g = 1.07 vs passive controls
- Panic/agoraphobia: g = 1.28
- Equivalent to in vivo exposure (g = -0.07)
- Head-mounted displays with phobia-specific graded hierarchies [13][14]

**Cross-Disorder**

Meta-analysis of 30 RCTs (1,057 participants): VRET produced large effect vs waitlist (g = 0.90), equivalent to in vivo exposure [13].

### VR for Depression Detection

**VR Eye-Movement Protocol**

VR headset with integrated eye tracker. Patient views emotional or cognitive stimuli. Eye movement features (fixation patterns, saccade characteristics) fed into ML classifiers.

- XGBoost and MLP models: 86% accuracy (MLP), 96% precision, 91% recall, AUC 0.86
- PHQ-9 prediction error: -0.6 to 0.6
- Fixation and saccade indices as primary biomarkers [15]

**Multimodal VR Framework (Adolescents)**

EEG + eye tracking + HRV during 10-min VR emotional task. Depressed adolescents showed:

- Higher theta/beta ratios
- Reduced saccade counts
- Longer fixation durations
- Elevated LF/HF ratios
- SVM model: 81.7% accuracy, AUC 0.921 [16]

**Treatment Tracking**

Same VR eye-tracking system tracks treatment response. After 5 sessions of computerized CBT, fixation and saccade indices changed in parallel with PHQ-9 improvements [15].

### Summary Table

| Condition | Protocol | Duration | Mechanism | Effect Size |
|-----------|----------|----------|-----------|-------------|
| Chronic pain | EaseVRx | 56 days daily | PNE, mindfulness, biofeedback | d = 0.40-0.49 vs sham; pre-post d = 1.17-1.30 |
| Chronic pain | VRNT | Multi-session vs waitlist | Neural retraining | g = 0.63 (intensity), 0.84 (interference) |
| PTSD | BraveMind VRET | 6-10 sessions over 2-5 weeks | Graded multimodal exposure | d = 1.55 (PCL-C); g = 1.10 (VR-GET) |
| PTSD | VRE + D-cycloserine | 9 weeks | Exposure + cognitive enhancer | VRE > PE for comorbid depression |
| Social anxiety | CBT + VR exposure | 10-14 sessions | Graded social exposure | g = 0.83-1.17 vs passive |
| Phobias/panic | VRET graded | 4-14 sessions | Phobia-specific hierarchy | g = 0.90 vs waitlist; = in vivo |
| Depression Dx | VR eye tracking + ML | Single 10-min session | Fixation/saccade biomarkers | 86% accuracy, AUC 0.86-0.92 |

---

## Part 2: EaseVRx (RelieVRx) Component Breakdown

56-session, self-administered, home-based VR program. Six core therapeutic modalities in immersive 3D.

### 1. Pain Neuroscience Education (PNE)

Traditional PNE: chronic pain is a sensitized nervous system, not ongoing tissue damage. Pain reframed as brain-generated alarm signal that can be modulated.

In EaseVRx: delivered through immersive 3D visualizations. Patients see and interact with how pain signals travel, how the brain amplifies or dampens them. VR makes abstract neuroscience tangible and experiential [1][2][3].

### 2. Diaphragmatic Breathing

Slow deep belly breathing activates parasympathetic, reduces sympathetic arousal.

What VR adds: real-time visual biofeedback loop. NIH BACPAC protocol describes embedded biometric sensors that detect respiratory patterns [2]. User sees a 3D object (lungs, environmental element) sync with their actual breathing.

fNIRS research: VR breathing works through a different analgesic mechanism than traditional mindful breathing. VR breathing augments visual-auditory cortical activation, which **diminishes** functional connection with primary somatosensory cortex (S1), weakening S1-based pain processing. Traditional mindful breathing works through interoception by **strengthening** S1 connections. Both raise pain thresholds, opposite neural pathways [4].

### 3. Biofeedback

Embedded biometric sensors capture real-time heart rate and respiratory rate. Translated into visual or environmental changes.

Example: virtual landscape becomes calmer as physiological arousal decreases, or turbulent when stress rises. Closed-loop self-regulation [2].

VR biofeedback study showed: heightened breath awareness, greater focus on slow diaphragmatic breathing, increased respiratory sinus arrhythmia vs non-biofeedback VR [5]. Broader literature: VR biofeedback produces higher motivation, involvement, better user experience than classical biofeedback, even at similar clinical effect sizes [6].

### 4. Mindfulness

MBSR principles in immersive natural environments (forests, mountains, underwater). Body scans, present-moment awareness, non-judgmental observation.

Two VR advantages: (a) immersive presence deepens meditative state beyond audio-only, (b) the environment serves as attentional anchor, helping pain patients sustain focus [2][7].

### 5. Cognitive Defusion

From Acceptance and Commitment Therapy (ACT). Observe pain-related thoughts ("this pain will never end," "I'm broken") as mental events, not literal truths.

In EaseVRx: interactive VR exercises where patients practice "unhooking." Externalize and visualize thoughts (e.g., watch a thought float away as a cloud). Targets pain catastrophizing, a key mediator of chronic pain disability [1][8].

### 6. Guided Relaxation

Progressive muscle relaxation and guided imagery in immersive 3D. Spatial audio, ambient sounds, visual elements.

360-degree immersion creates distraction effect. Brain's attentional resources captured by environment, fewer resources available for pain processing [9][1].

### What VR Specifically Adds

EaseVRx is not just a video. NIH BACPAC trial protocol explicitly tested three tiers [2]:

- **Arm 1 (EaseVRx/RelieVRx):** Full immersive 3D therapeutic content with CBT, mindfulness, biofeedback via embedded sensors
- **Arm 2 (Distraction VR):** 360-degree nature videos, no therapeutic skill-building
- **Arm 3 (Sham VR):** 2D nature videos in headset, no immersion

Original RCT (n=179): EaseVRx superior to sham VR (d = 0.40-0.49). Effects persisted at 3 months (d = 0.56-0.88), 6 months (d = 0.44-0.54) [1][10][8]. Largest trial (n=1,093) confirmed effects persist to 12 months. Over half maintained ≥2-point reductions in pain intensity and interference [11].

VR transforms a CBT/mindfulness workbook into an embodied, multisensory, closed-loop experience. Presence, attentional capture, real-time biofeedback, experiential learning.

---

## Part 3: VRNT Deep Dive

Fundamentally different from EaseVRx. EaseVRx teaches behavioral coping in VR. VRNT targets the cognitive and affective neural processes that perpetuate pain itself.

### Theoretical Foundation

Premise: chronic pain is generated and maintained by the brain. Drawn from Pain Reprocessing Therapy (PRT) framework (Ashar, Wager).

PRT trial: chronic back pain patients (mean ~10 years duration) taught to reconceptualize pain as reversible, brain-generated.

- 66% became pain-free or nearly pain-free (0-1/10) vs 20% placebo, 10% usual care
- Effects persisted at 1 year (g = -1.05 vs usual care) [2]

In ~85% of chronic back pain cases, no definitive peripheral cause. Pain maintained by fear-avoidance cycles, catastrophizing, threat appraisals locking the brain's pain circuits in a self-reinforcing loop [2].

VRNT combines PRT and Emotional Awareness and Expression Therapy (EAET, targets unprocessed trauma maintaining pain) [3].

### Therapeutic Targets

1. **Pain reattribution:** "my back is damaged" → "my brain is generating this signal, it can be changed." Mind/brain attributions mediated pain reductions at 1 year in PRT secondary analysis [4]
2. **Fear and threat reduction:** breaks the threat → pain → more threat → more pain loop [2]
3. **Emotional processing:** addresses suppressed emotions (grief, rage, guilt) maintaining pain through shared emotional/physical pain neural circuitry [3]

### What the VR Does

Makes neuroscience experiential not didactic. Patients can:

- Visualize their own pain pathways and how cognition/emotion modulate them
- Practice reappraising pain sensations in real time within the immersive environment
- Experience graded exposure to feared movements safely, challenging kinesiophobia
- Engage with emotional processing in embodied multisensory format

Trial (NCT04468074): 61 participants chronic back pain, randomized VRNT (n=31) vs waitlist usual care (n=30). Pre/post MRI [1].

### Clinical Results

- Pain intensity: g = 0.63
- Pain interference: g = 0.84
- Persisted at 2-week follow-up
- Partially mediated by reduced kinesiophobia and catastrophizing
- Secondary outcomes improved: disability, QoL, sleep, fatigue [1]

### Neuroimaging — The Brain Actually Changed

Only VR chronic pain RCT with pre/post neuroimaging.

- **Increased dorsomedial prefrontal cortex (dmPFC) functional connectivity** with superior somatomotor cortex, anterior prefrontal cortex, visual cortices. dmPFC is a hub for top-down pain regulation. Strengthened connectivity = enhanced prefrontal control [5][6]
- **Decreased white matter fractional anisotropy in corpus callosum adjacent to anterior cingulate cortex.** Structural change near a region central to pain affect and interoception [1]

Aligns with broader review of 10 RCTs with pre/post neuroimaging on psychological pain treatments. Four consistent themes: altered DMN/subcortical connectivity, lateral prefrontal/orbitofrontal regulation changes, reduced anterior midcingulate/insular activity, altered connectivity between cortical and somatomotor regions [7].

PRT trial showed analogous fMRI changes: reduced pain-evoked activity in anterior midcingulate, anterior prefrontal cortex, anterior insula. Increased resting connectivity from prefrontal/insular regions to primary somatosensory cortex [2].

### EaseVRx vs VRNT

| Feature | EaseVRx | VRNT |
|---------|---------|------|
| Core model | Behavioral skills (CBT/ACT/mindfulness) | Neuroscience-based pain reprocessing |
| Primary target | Coping with pain | Eliminating pain by changing brain processes |
| Pain belief change | Not primary | Central mechanism (body → brain attribution) |
| Emotional processing | Not emphasized | Targets suppressed emotions |
| Biofeedback | Real-time respiratory sensors | Not used |
| Neuroimaging | None | Pre/post MRI showing dmPFC connectivity changes |
| Sessions | 56 daily self-administered (8 weeks) | Multi-session vs waitlist |
| Effect on pain intensity | d = 0.40-0.49 vs sham | g = 0.63 vs waitlist |

Philosophical difference: EaseVRx teaches patients to **cope better** with persistent pain. VRNT teaches that pain is **reversible** because brain-generated. Mirrors the field's shift from pain management to pain reprocessing [2][10][11].

---

## Part 4: Sensor Requirements (Surprising)

### EaseVRx — Embedded Breathing Sensor Only

Embedded biometric sensors built into the headset. Respiratory only. No external HRV monitors, EEG caps, or chest straps. Biofeedback loop is entirely respiratory [1].

NIH BACPAC trial used a Fitbit Charge 4 for outcome data (steps, sleep, activity) but not for driving therapeutic content [1].

Hardware = standalone VR headset with built-in breath sensor. Nothing else for the therapy itself.

### VRNT — No Real-Time Biometric Sensors

Purely cognitive-experiential. No biofeedback loop, no physiological monitoring, no real-time adaptation. MRI scans were research outcome measures only, not part of therapy [2].

### Where HRV and EEG Show Up in Pain Research

- **EEG:** mechanistic studies. 32-channel EEG with VR found distraction correlated with increased pre-stimulus gamma; mindfulness with increased alpha. Different content types produce analgesia through distinct neural mechanisms. Research paradigm, not clinical protocol [3]
- **VR-Neurofeedback (VR-NFB):** experimental approach fusing real-time EEG with VR. Case report: 1 year sustained analgesia in centralized pain. Investigational [4]
- **HRV:** strong biomarker of chronic pain (meta-analysis of 51 studies, decreased HF-HRV implicating parasympathetic dysregulation). Not used as input by EaseVRx or VRNT [5]

### Practical Takeaway

Both proven VR pain therapies run on consumer-grade headsets with minimal extra hardware. EaseVRx needs only a breath sensor (already embedded). VRNT needs nothing. Sophistication is in the content, not the hardware.

---

## Part 5: VR-Neurofeedback vs HRV Biofeedback Integration

### VR-NFB: Core Concept

EEG cap inside VR headset. Brainwave patterns directly control elements of the virtual environment. Patient learns to volitionally modulate pain-related neural oscillations.

Different from EaseVRx (behavioral skills) and VRNT (cognitive reappraisal), which require no brain sensors.

### VR-NFB Pain Evidence (Thin)

Single published case report. 55-year-old woman with chronic centralized pain from spondylolisthesis. VR + EEG neurofeedback fused. Sustained analgesia for 1 year, improvements in ADLs and physical therapy participation [1]. No controlled trials.

### Standard EEG Neurofeedback (No VR) for Pain

- Meta-analysis of RCTs: medium effect d = -0.76 (95% CI -1.31 to -0.20) for chronic pain. Pain reductions 6% to 82% across 21 studies. Improvements in depression, anxiety, fatigue, sleep [2]
- Largest rigorous RCT (n=116, blinded sham-controlled): **no significant difference** between active EEG NFB (alpha at C4) and sham (mean diff -0.04, p = 0.90). 44-45% in both groups achieved ≥30% pain reduction (placebo/engagement effect). Sham was partially active [3]
- Scoping review (32 studies): about half reinforce alpha/SMR while suppressing theta/beta. Neurophysiological rationale unclear. Short-term effects probable, long-term less certain [4]
- **Infraslow neurofeedback** targeting pgACC (pilot RCT n=60): 53% achieved clinically meaningful pain reduction. 80% reduced pain interference. 73% reduced disability at 1 month [5]
- **Fibromyalgia amygdala-EFP** (sham-controlled n=34): real NFB improved REM sleep latency immediately. Delayed pain reduction at long-term follow-up (3 years), mediated through sleep [6]

### Bottom Line on VR-NFB vs Simpler VR

No head-to-head trial vs EaseVRx or VRNT. Theoretical advantage: closed-loop direct modulation. But largest sham-controlled EEG NFB trial failed to show superiority over sham. EaseVRx and VRNT both demonstrated superiority over their controls [3][7]. Question whether added EEG hardware cost is justified.

### HRV Biofeedback in VR

Rationale: chronic pain associated with decreased HF-HRV (parasympathetic dysregulation) [8]. HRVBF trains vagal tone via resonance-frequency breathing.

- PTSD: 24.3% PCL reduction, d = -1.89
- Depression: 64% BDI reduction vs 25% controls
- Pain interference: 24.9% reduction, d = -1.14 [9][10]

### VR + HRVBF Trials

- **Surgical pain (RCT n=30 TKA):** Nature VR + HRVBF reduced pain and anxiety more than controls (p < 0.01). Significantly outperformed 2D screen + HRVBF, suggesting immersion adds value [11]
- **Anxiety (RCT n=75):** 5-min interactive VR mindfulness with real-time HRV-modulated environment (fog dissipation, audio cues, visual changes). Significantly improved anxiety, mindfulness, HRV. Audio-based mindfulness and controls showed no HRV changes. The interactive VR-HRV loop produces physiological changes passive approaches do not [12]
- **Depression and anxiety (RCT n=118):** VR-based biofeedback: 70% MADRS reduction, 64% PHQ-9, 30% STAI. **No significant difference vs conventional therapist-delivered biofeedback.** VR can replace the therapist without losing efficacy. Enables scalable home delivery [13]
- **Mindfulness (RCT n=72):** VR + biofeedback group showed significantly greater improvements in receptive awareness and attentional focus vs VR-only or audio mindfulness. All three groups showed similar reductions in stress, anxiety, HR. Biofeedback specifically enhanced present-moment engagement [14]
- **HRV predicting VR-PTSD response:** veteran HRV recovery after VR combat scenes significantly predicted 6-month PTSD severity. Greater baseline HRV recovery → lower PTSD. HRV could serve as biomarker for treatment matching [15]

### Scoping Review

18 VR biofeedback studies. HRV most frequent biofeedback parameter (50%). Most used natural environments (72.2%). VR-biofeedback at least as effective as classical biofeedback for anxiety, stress, pain, with higher motivation, involvement, user experience. Could improve adherence in long-term programs [16].

### Comparative Summary

| Approach | Hardware | Evidence | Pain Effect Size | Key Advantage | Key Limitation |
|----------|----------|----------|------------------|---------------|----------------|
| EaseVRx | Headset + breath sensor | Large RCT (n=1,093), 12-mo data | d = 0.40-0.49 | Proven, FDA-authorized, scalable | Coping not elimination |
| VRNT | Headset only | RCT (n=61) with neuroimaging | g = 0.63-0.84 | Targets pain elimination, brain changes shown | Small trial, waitlist control |
| VR-NFB | Headset + EEG | Single case report | 1 year sustained (n=1) | Direct brain modulation | No controlled trials; EEG NFB alone failed largest RCT |
| VR + HRVBF | Headset + HR sensor | Small RCTs (n=30-75) | Superior to 2D + HRVBF (p < 0.01) | Engagement, physiological change | Small samples, mostly perioperative |
| Standard HRVBF | HR sensor only | Meta-analysis (k=18) | g = -0.41 depression; d = -1.89 PTSD | Strong PTSD/depression evidence, simple | No immersion |

Emerging picture: simpler VR (EaseVRx, VRNT) currently has stronger evidence than VR-NFB despite the latter being more sophisticated. Adding HRVBF to VR appears to enhance engagement and produce physiological changes VR alone does not. Most promising near-term integration: combining VRNT's pain reprocessing framework with EaseVRx's respiratory biofeedback loop. No EEG required.

---

## Part 6: EEG Frequency Protocols for Pain

Mega-analysis of 614 chronic pain patients across 5 countries plus systematic reviews mapped the EEG landscape with increasing precision [1][2][3].

### Frequency Bands and What They Do

**Theta (4-8 Hz) — The Pain Chronification Signal**

Most robust EEG biomarker of chronic pain. Mega-analysis: pain intensity most robustly associated with large-scale brain network connectivity at theta, particularly limbic network [3]. Chronic pain patients show increased theta connectivity in frontal areas. Clinical improvement after multimodal pain therapy associated with increased global theta network efficiency. Theta network reorganization tracks recovery [2][4].

In neuropathic pain: EEG signal power increased in theta. Consistent with thalamocortical dysrhythmia model — deafferentation causes thalamic neurons to shift into low-frequency theta bursting, driving cortical theta and maintaining pain [1][5].

**Alpha (8-12 Hz) — Cortical Gating**

Alpha inhibits sensory processing in task-irrelevant regions. In chronic pain: resting-state alpha may be increased (compensatory) but normal alpha desynchronization during sensory processing is disrupted [1][5]. During noxious stimulation, decreases in sensorimotor alpha encode **stimulus intensity** (physical input), distinct from subjective pain [6]. VR mindfulness scenes induce strong pre-stimulus alpha, correlating with analgesia. VR mindfulness works by enhancing cortical gating [7].

**Sensorimotor Rhythm / SMR (12-15 Hz) — Motor-Sensory Interface**

At alpha-beta boundary over sensorimotor cortex. Critical for somatomotor processing. In fibromyalgia: successful SMR neurofeedback (>70% modulation accuracy) produced significant pain reduction and enhanced functional connectivity of motor and somatosensory cortices. Only "good responders" showed brain changes. "Bad responders" and sham controls showed nothing [8].

**Beta (13-30 Hz) — Subdivided**

Not monolithic. In neuropathic pain: high-alpha/low-beta (10-20 Hz) shows decreased power. High-beta (20-30 Hz) shows increased power [1].

Neuropathic pain RCT (n=32) directly compared two beta protocols:

- β1/β2 ratio training: reduced ongoing and evoked pain intensity
- α/θ training: reduced anxiety and depression
- Responders to β1/β2 showed increased β1 in resting-state EEG [9]

**Gamma (>30 Hz) — Subjective Pain Encoder**

Gamma in medial prefrontal cortex encodes **subjective pain intensity** (vs stimulus intensity). Independent of body side stimulated [10][6]. Chronic pain patients show increased frontal gamma connectivity [2]. VR distraction produces analgesia through increased pre-stimulus gamma, correlating with immersion. More immersed → more gamma → less pain [7]. ML using theta and gamma from medial prefrontal plus lower beta from contralateral sensorimotor classifies pain with 89.6% accuracy [10].

**Infraslow (<0.1 Hz) — Bridge to fMRI**

Infraslow fluctuations bridge EEG and fMRI BOLD signals, allowing scalp-EEG targeting of deep regions like the pregenual anterior cingulate cortex (pgACC). ISF neurofeedback at pgACC for chronic low back pain (RCT n=60): 53% achieved clinically meaningful pain reduction, 80% reduced interference, 73% reduced disability at 1 month [11].

### Protocol-by-Condition Mapping

| Condition | Best-Supported Protocol | Frequency | Electrode | Outcome |
|-----------|------------------------|-----------|-----------|---------|
| Chronic low back pain | Infraslow NF | 0.1 Hz | pgACC (Fpz/Fz) | 53% clinically meaningful reduction |
| Neuropathic pain | β1/β2 ratio | 13-20 / 20-30 Hz | Central (C3/C4 contralateral) | Reduced ongoing + evoked pain |
| Neuropathic pain (mood) | α/θ ratio | 8-12 / 4-8 Hz | Central | Reduced anxiety/depression, not pain |
| Fibromyalgia (SMR) | SMR sync/desync | 12-15 Hz | Sensorimotor (C3/C4) | Pain reduction in good responders; somatomotor connectivity ↑ |
| Fibromyalgia (limbic) | Amygdala-EFP down-mod | Amygdala fingerprint | Scalp-derived amygdala proxy | Delayed pain reduction via sleep; effects at 3 years |
| Mixed chronic | Alpha up / theta-beta down | 8-12 ↑ / 4-8 + 20-30 ↓ | Central or frontal | Meta-analytic d = -0.76 |
| Phantom limb | Motor imagery BCI | Mu/beta desync | Sensorimotor | >80% reduction in paroxysmal pain |

### EEG-VR Integration: Engineering Realities

**Signal Quality**

Primary concern: EM interference from VR HMDs. Structured testing (64-channel EEG with Oculus Rift, HTC Vive Pro): HMDs introduce artifacts at 50 Hz (line hum) and 90 Hz (HMD refresh) and harmonics. **The frequency range most important for neurofeedback (<40 Hz) remains usable** [16]. ERPs (N1, P1, P3) acquirable in VR. N1 amplitudes actually higher in VR than computer screens, suggesting enhanced early sensory processing [18].

**Synchronization**

Validated method achieved 36 ms latency between EEG and VR eye-tracking streams. Mean jitter 5.76 ms. Sufficient for real-time NFB [19].

**Embodiment Advantage**

VR-based NFB produces significantly higher embodiment than screen-based. Embodiment positively correlates with NFB performance — but only in VR, not screens. VR doesn't just make NFB more entertaining. It enhances the brain's ability to learn self-regulation through embodied presence [20].

**Systematic Review Verdict**

24 VR-EEG NFB trials. VR-based NFB classified as "probably efficacious" for attention. "Possibly efficacious" for pain, emotions, mood, relaxation, impulsiveness. Users rate VR feedback more positively than 2D, addressing a major adoption barrier (session count, monotony) [21][15].

### GHOST System — Most Advanced VR-EEG Pain Platform

For phantom limb pain. Portable EEG-based BCI coupled with immersive VR. Patient controls a virtual limb via motor imagery in real time.

Pilot trial (n=7): all participants achieved BCI control of virtual hand with >70% success. >80% median decrease in weekly cumulated paroxysmal pain episode intensity (p < 0.05) [14].

### Optimal VR-EEG Architecture for Pain

Based on the evidence, an optimally designed system would have:

1. **Condition-specific frequency targeting:** ISF-NF for low back (pgACC), β1/β2 for neuropathic, SMR for fibromyalgia, motor imagery BCI for phantom limb [9][11][8][14]
2. **Multiband monitoring:** theta-gamma frontal connectivity as biomarker of pain state and treatment response — most robust EEG signature across conditions [2][3]
3. **Consumer-grade EEG:** critical bands (<40 Hz) usable despite HMD interference [16]
4. **Embodiment-maximizing VR:** maximize body ownership and agency [20]
5. **Adaptive difficulty:** GHOST showed >70% success rates with rising difficulty maintains engagement [14]
6. **HRV co-monitoring:** dual-loop biofeedback (cortical + autonomic) with optical heart rate sensor adds value without significant hardware burden [22][23][24]

---

## References

### Part 1 References

1. Garcia LM, et al. JMIR. 2021;23(2):e26292. doi:10.2196/26292.
2. Garcia L, et al. JMIR. 2022;24(5):e37480. doi:10.2196/37480.
3. Čeko M, et al. Pain. 2024;165(8):1860-1874. doi:10.1097/j.pain.0000000000003198.
4. Lier EJ, et al. Pain. 2023;164(8):1658-1665. doi:10.1097/j.pain.0000000000002883.
5. Folke S, et al. Cyberpsychol Behav Soc Netw. 2023;26(6):425-431. doi:10.1089/cyber.2022.0236.
6. van 't Wout-Frank M, et al. JAMA Psychiatry. 2024;81(5):437-446. doi:10.1001/jamapsychiatry.2023.5661.
7. Difede J, et al. Transl Psychiatry. 2022;12(1):299. doi:10.1038/s41398-022-02066-x.
8. Heo S, Park JH. Int J Environ Res Public Health. 2022;19(23):15911. doi:10.3390/ijerph192315911.
9. Deng W, et al. J Affect Disord. 2019;257:698-709. doi:10.1016/j.jad.2019.07.086.
10. Bouchard S, et al. Br J Psychiatry. 2017;210(4):276-283. doi:10.1192/bjp.bp.116.184234.
11. Ørskov PT, et al. Front Psychiatry. 2022;13:991755. doi:10.3389/fpsyt.2022.991755.
12. Zainal NH, et al. Behav Res Ther. 2021;147:103984. doi:10.1016/j.brat.2021.103984.
13. Carl E, et al. J Anxiety Disord. 2019;61:27-36. doi:10.1016/j.janxdis.2018.08.003.
14. Zeka F, et al. Acta Psychiatr Scand. 2025;151(3):210-230. doi:10.1111/acps.13777.
15. Zheng Z, et al. Front Psychiatry. 2024;15:1280935. doi:10.3389/fpsyt.2024.1280935.
16. Wu Y, et al. Front Psychiatry. 2025;16:1655554. doi:10.3389/fpsyt.2025.1655554.

### Part 2 References (EaseVRx)

1. Garcia LM, et al. JMIR. 2021;23(2):e26292.
2. Birckhead B, et al. BMJ Open. 2021;11(6):e050545. doi:10.1136/bmjopen-2021-050545.
3. McConnell R, et al. Ann Med. 2024;56(1):2311846. doi:10.1080/07853890.2024.2311846.
4. Hu XS, et al. JMIR. 2021;23(10):e27298. doi:10.2196/27298.
5. Blum J, et al. Appl Psychophysiol Biofeedback. 2020;45(3):153-163. doi:10.1007/s10484-020-09468-x.
6. Lüddecke R, Felnhofer A. Appl Psychophysiol Biofeedback. 2022;47(1):1-15. doi:10.1007/s10484-021-09529-9.
7. Medina S, et al. Br J Anaesth. 2024;133(3):486-490. doi:10.1016/j.bja.2024.06.005.
8. Garcia LM, et al. J Pain. 2022;23(5):822-840. doi:10.1016/j.jpain.2021.12.002.
9. Flanagan K, et al. Cochrane Database Syst Rev. 2024;11:CD016078. doi:10.1002/14651858.CD016078.
10. Garcia L, et al. JMIR. 2022;24(5):e37480.
11. Maddox T, et al. Pain Rep. 2024;9(5):e1182. doi:10.1097/PR9.0000000000001182.

### Part 3 References (VRNT)

1. Čeko M, et al. Pain. 2024;165(8):1860-1874.
2. Ashar YK, et al. JAMA Psychiatry. 2022;79(1):13-23. doi:10.1001/jamapsychiatry.2021.2669.
3. Yarns BC, et al. JAMA Netw Open. 2024;7(6):e2415842. doi:10.1001/jamanetworkopen.2024.15842.
4. Ashar YK, et al. JAMA Netw Open. 2023;6(9):e2333846. doi:10.1001/jamanetworkopen.2023.33846.
5. Che X, et al. NeuroImage. 2019;201:116053. doi:10.1016/j.neuroimage.2019.116053.
6. Ong WY, et al. Mol Neurobiol. 2019;56(2):1137-1166. doi:10.1007/s12035-018-1130-9.
7. Vase L, et al. Lancet. 2025;405(10491):1781-1790. doi:10.1016/S0140-6736(25)00404-0.

### Part 4 References (Sensors)

1. Birckhead B, et al. BMJ Open. 2021;11(6):e050545.
2. Čeko M, et al. Pain. 2024;165(8):1860-1874.
3. Li J, et al. Br J Anaesth. 2023;131(6):1082-1092. doi:10.1016/j.bja.2023.09.001.
4. Orakpo N, et al. Front Psychiatry. 2021;12:660105. doi:10.3389/fpsyt.2021.660105.
5. Tracy LM, et al. Pain. 2016;157(1):7-29. doi:10.1097/j.pain.0000000000000360.

### Part 5 References (VR-NFB + HRV)

1. Orakpo N, et al. Front Psychiatry. 2021;12:660105.
2. Patel K, et al. Eur J Pain. 2020;24(8):1440-1457. doi:10.1002/ejp.1612.
3. Rice DA, et al. J Pain. 2024;25(11):104651. doi:10.1016/j.jpain.2024.104651.
4. Schuurman BB, et al. J Clin Med. 2024;13(10):2813. doi:10.3390/jcm13102813.
5. Adhia DB, et al. Sci Rep. 2023;13(1):1177. doi:10.1038/s41598-023-28344-2.
6. Goldway N, et al. NeuroImage. 2019;186:758-770. doi:10.1016/j.neuroimage.2018.11.001.
7. Čeko M, et al. Pain. 2024;165(8):1860-1874.
8. Tracy LM, et al. Pain. 2016;157(1):7-29.
9. Blase K, et al. Int J Environ Res Public Health. 2021;18(7):3329. doi:10.3390/ijerph18073329.
10. Chadwick TM, et al. J Affect Disord. 2026;394(Pt A):120558. doi:10.1016/j.jad.2025.120558.
11. Girishan Prabhu V, et al. Aging Ment Health. 2024;28(5):738-753. doi:10.1080/13607863.2023.2270442.
12. Xu Q, et al. Appl Psychophysiol Biofeedback. 2025. doi:10.1007/s10484-025-09718-w.
13. Cho Y, et al. J Affect Disord. 2024;361:392-398. doi:10.1016/j.jad.2024.06.031.
14. Domingues A, et al. Cyberpsychol Behav Soc Netw. 2025. doi:10.1177/21522715251397933.
15. Pyne JM, et al. Cyberpsychol Behav Soc Netw. 2023;26(12):896-903. doi:10.1089/cyber.2023.0164.
16. Lüddecke R, Felnhofer A. Appl Psychophysiol Biofeedback. 2022;47(1):1-15.

### Part 6 References (EEG Frequencies)

1. Mussigmann T, Bardel B, Lefaucheur JP. NeuroImage. 2022;258:119351. doi:10.1016/j.neuroimage.2022.119351.
2. Ta Dinh S, et al. Pain. 2019;160(12):2751-2765. doi:10.1097/j.pain.0000000000001666.
3. Bott FS, et al. EBioMedicine. 2025;120:105955. doi:10.1016/j.ebiom.2025.105955.
4. Heitmann H, et al. Pain. 2022;163(9):e997-e1005. doi:10.1097/j.pain.0000000000002565.
5. Pinheiro ES, et al. PLoS One. 2016;11(2):e0149085. doi:10.1371/journal.pone.0149085.
6. Nickel MM, et al. NeuroImage. 2017;148:141-147. doi:10.1016/j.neuroimage.2017.01.011.
7. Li J, et al. Br J Anaesth. 2023;131(6):1082-1092.
8. Terrasa JL, et al. Front Neurosci. 2020;14:236. doi:10.3389/fnins.2020.00236.
9. Mussigmann T, et al. Eur J Neurol. 2025;32(9):e70363. doi:10.1111/ene.70363.
10. Misra G, et al. J Neurophysiol. 2017;117(2):786-795. doi:10.1152/jn.00650.2016.
11. Adhia DB, et al. Sci Rep. 2023;13(1):1177.
12. Goldway N, et al. NeuroImage. 2019;186:758-770.
13. Hesam-Shariati N, et al. Eur J Neurol. 2022;29(3):921-936. doi:10.1111/ene.15189.
14. Roualdes V, et al. Front Hum Neurosci. 2026;20:1697837. doi:10.3389/fnhum.2026.1697837.
15. Kober SE, Wood G, Berger LM. Appl Psychophysiol Biofeedback. 2024. doi:10.1007/s10484-024-09677-8.
16. Weber D, et al. Front Neurosci. 2021;15:733673. doi:10.3389/fnins.2021.733673.
17. Ocklenburg S, Peterburs J. Curr Top Behav Neurosci. 2023;65:47-71. doi:10.1007/7854_2023_423.
18. Aksoy M, et al. Exp Brain Res. 2021;239(10):3007-3022. doi:10.1007/s00221-021-06158-w.
19. Larsen OFP, et al. Front Hum Neurosci. 2024;18:1347974. doi:10.3389/fnhum.2024.1347974.
20. Juliano JM, et al. Sensors (Basel). 2020;20(4):E1204. doi:10.3390/s20041204.
21. Castanho L, et al. Appl Psychophysiol Biofeedback. 2025. doi:10.1007/s10484-025-09730-0.
22. Girishan Prabhu V, et al. Aging Ment Health. 2024;28(5):738-753.
23. Xu Q, et al. Appl Psychophysiol Biofeedback. 2025.
24. Pyne JM, et al. Cyberpsychol Behav Soc Netw. 2023;26(12):896-903.
