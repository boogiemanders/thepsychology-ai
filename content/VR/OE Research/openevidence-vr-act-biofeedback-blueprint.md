# VR + ACT + Biofeedback Blueprint (Meta Quest + Muse S Gen 2)

This is a rich and rapidly evolving area. Here's a synthesis of the relevant research and practical guidance for building a VR biofeedback ACT application on Meta Quest.

**State of the Research: VR + ACT + Biofeedback**

The intersection of VR, ACT, and biofeedback is emerging but still early-stage. The most directly relevant work is the **DTx-ACT system** (Kim & Choi, 2025), which is the first published structured framework for translating ACT into immersive VR.[1] Broader VR psychotherapy research shows medium-to-large effect sizes for anxiety-related disorders compared to inactive controls, though not clearly superior to standard in-person therapy.[2][3] Separately, VR-based biofeedback has been shown to reduce depression (MADRS scores by 70%) and anxiety symptoms comparably to conventional therapist-delivered biofeedback, with advantages in **user motivation, engagement, and attentional focus**.[4][5]

**The DTx-ACT Framework — Your Closest Blueprint**

The DTx-ACT system modularized ACT's clinical protocol into **five immersive VR sessions (6–12 minutes each)** using a "Session Structuring System" model.[1] Key design elements include:

- **ACT metaphors rendered as interactive VR experiences** (e.g., the classic "passengers on the bus" or "leaves on a stream" metaphors become spatial, embodied interactions)
- **Gamification** to sustain engagement (progress tracking, interactive tasks, reward mechanics)
- **Multimodal arts-based guidance** (visual, auditory, and haptic feedback)
- **Real-time data collection** of behavioral patterns and sensor-based information for evaluation
- Three pillars: (1) evidence-based therapeutic protocol, (2) interactive VR elements, (3) data-driven evaluation framework

**ACT's Six Core Processes — How to Map Them to VR Modules**

ACT targets psychological flexibility through six processes.[6][7] Here's how each can be translated for a Unity/Meta Quest build, informed by the literature:

1. **Present-moment awareness** — VR-based mindfulness with HRV biofeedback is the strongest evidence base here. A recent pilot showed that interactive VR mindfulness with **real-time HRV biofeedback dynamically modulating the environment** (fog dissipation, auditory cues, visual transformations) significantly improved anxiety, mindfulness states, and HRV in a single 5-minute session. HRV-based slow-paced breathing in VR nature scenes also buffered stress and increased relaxation self-efficacy.[8][9]
2. **Acceptance** — VR body scan exercises have been used for chronic pain to train body-related attentional skills, helping users notice sensations without avoidance. Biofeedback can visualize the physiological correlates of resistance vs. acceptance (e.g., EDA spikes mapped to environmental turbulence that calms as the user practices acceptance).[10]
3. **Cognitive defusion** — The "leaves on a stream" metaphor is a natural VR candidate: users place distressing thoughts (via voice input or text) onto virtual leaves and watch them float away. The DTx-ACT system specifically uses ACT metaphors as interactive VR tasks.[1]
4. **Self-as-context (observing self)** — VR's unique capacity for **perspective-shifting and embodiment** is highly relevant. The "Explore Your Meanings" tool allows multi-perspective exploration of self-identity in 3D spaces, visualizing differences between perceived and ideal self. Avatar-based perspective-taking is a VR-unique affordance.[10]
5. **Values clarification** — Interactive 3D environments where users build or explore a "values landscape" (placing meaningful objects, creating scenes representing valued life directions). Gamification elements like progress along a values-aligned path can reinforce this.
6. **Committed action** — VR behavioral activation has shown moderate-to-large improvements in daily activity levels and reductions in depressive symptoms. Users can rehearse valued actions in VR before real-world implementation.[11]

**Biofeedback Integration — What Works on Meta Quest**

The most commonly used and effective biofeedback parameter in VR therapy is **heart rate / heart rate variability (HRV)**, used in 50% of VR-BF studies.[5] Other modalities include electrodermal activity (EDA) and skin temperature.[12] For Meta Quest specifically:

- The Meta Quest 3 has a built-in **PPG sensor** for heart rate, which can be accessed via the Oculus Platform SDK. This enables HRV-derived biofeedback without external hardware.
- For richer biofeedback, external Bluetooth-compatible sensors (e.g., Polar H10 chest strap for HRV, or Empatica-style wristbands for EDA) can pair with Quest via Bluetooth.
- **Environment-responsive biofeedback** is the key design pattern: the virtual environment should dynamically respond to physiological state (e.g., calmer HRV → clearer skies, blooming flowers; elevated stress → fog, wind). This creates a closed-loop system that reinforces self-regulation.[8][9]

**Key Design Considerations from the Evidence**

- **Presence matters clinically**: Higher VR presence correlates with greater reductions in anxiety (β = −0.24), stress (β = −0.37), and depression (β = −0.07), and with higher treatment satisfaction. Invest in visual fidelity, spatial audio, and interaction design.[13]
- **Cybersickness undermines outcomes**: Cybersickness inversely correlates with presence and satisfaction and is associated with smaller symptom improvements. On Quest, minimize locomotion-based movement; use teleportation or stationary experiences. Keep sessions to **6–12 minutes** per module as in DTx-ACT.[13][1]
- **Natural environments are the dominant paradigm**: 72% of VR-BF interventions use natural settings (islands, forests, beaches). These are well-suited to ACT metaphors and are computationally feasible on Quest's mobile GPU.[5]
- **Therapist guidance enhances outcomes**: Internet-based ACT with therapist guidance shows greater effectiveness for depression and psychological flexibility than unguided formats. Consider a hybrid model with optional therapist check-ins or AI-guided narration.[14]

**Practical Unity/Meta Quest Build Recommendations**

Based on the evidence, a minimum viable product could include:

- **5 modular sessions** (mirroring DTx-ACT), each targeting one or more ACT processes, 6–12 min each[1]
- **Core biofeedback loop**: Quest 3 PPG → HRV calculation → environment modulation (use the Oculus Platform SDK's body tracking/sensor APIs)
- **Nature-based environments** optimized for Quest's Snapdragon XR2 (baked lighting, optimized meshes, spatial audio)
- **Interactive ACT metaphors**: Leaves on a stream (defusion), weather systems reflecting internal states (acceptance), a values compass/landscape (values), guided body scan with biofeedback overlay (present moment)
- **Data logging**: Session duration, HRV metrics, interaction patterns, and pre/post self-report measures (PHQ-9, AAQ-II for psychological flexibility) for outcome tracking
- **Cybersickness mitigation**: Stationary or seated experiences, vignetting during any camera movement, short session lengths

**Evidence Gaps to Be Aware Of**

The overall evidence for VR-based interventions remains **low to very low certainty** per GRADE assessment, with over 50% of studies at high risk of bias.[2] VR-ACT specifically has only the DTx-ACT framework study and case reports — no large RCTs yet.[1][15] VR-BF shows comparable (not superior) efficacy to traditional biofeedback, with advantages primarily in engagement and user experience.[5] Digital ACT broadly has strong RCT support (53 RCTs, n = 10,730), but almost entirely via web/app delivery, not VR.[16]

This positions a well-designed VR biofeedback ACT tool as a genuinely novel contribution to the field, but also means rigorous outcome measurement should be built in from the start to contribute to the evidence base.

### References (Section 1)

1. Developing Interactive VR-based Digital Therapeutics for Acceptance and Commitment Therapy (ACT): A Structured Framework for the Digital Transformation Integrating Gamification and Multimodal Arts. Kim H, Choi Y. Frontiers in Psychiatry. 2025;16:1554394. doi:10.3389/fpsyt.2025.1554394.
2. The Effectiveness of Immersive Virtual Reality-Based Treatment for Mental Disorders: A Systematic Review With Meta-Analysis. Zeka F, Clemmensen L, Valmaggia L, et al. Acta Psychiatrica Scandinavica. 2025;151(3):210-230. doi:10.1111/acps.13777.
3. Evidence on Virtual Reality-Based Therapies for Psychiatric Disorders: Meta-Review of Meta-Analyses. Dellazizzo L, Potvin S, Luigi M, Dumais A. Journal of Medical Internet Research. 2020;22(8):e20889. doi:10.2196/20889.
4. Effect of Virtual Reality-Based Biofeedback for Depressive and Anxiety Symptoms: Randomized Controlled Study. Cho Y, Kim H, Seong S, et al. Journal of Affective Disorders. 2024;361:392-398. doi:10.1016/j.jad.2024.06.031.
5. Virtual Reality Biofeedback in Health: A Scoping Review. Lüddecke R, Felnhofer A. Applied Psychophysiology and Biofeedback. 2022;47(1):1-15. doi:10.1007/s10484-021-09529-9.
6. 'Third Wave' Cognitive and Behavioural Therapies Versus Treatment as Usual for Depression. Churchill R, Moore TH, Furukawa TA, et al. The Cochrane Database of Systematic Reviews. 2013;(10):CD008705. doi:10.1002/14651858.CD008705.pub2.
7. The Effects of Internet-Based Acceptance and Commitment Therapy on Process Measures: Systematic Review and Meta-Analysis. Han A, Kim TH. Journal of Medical Internet Research. 2022;24(8):e39182. doi:10.2196/39182.
8. Brief Interactive Virtual Reality Mindfulness Training With Real-Time Biofeedback for Anxiety Reduction: A Pilot Study. Xu Q, Gu Y, Hu X. Applied Psychophysiology and Biofeedback. 2025;:10.1007/s10484-025-09718-w. doi:10.1007/s10484-025-09718-w.
9. Heart Rate Variability Biofeedback Based on Slow-Paced Breathing With Immersive Virtual Reality Nature Scenery. Blum J, Rockstroh C, Göritz AS. Frontiers in Psychology. 2019;10:2172. doi:10.3389/fpsyg.2019.02172.
10. Virtual Reality in Psychotherapy: A Commentary on Strategies, Interventions, and Perspectives From Five Clinical Reports. Seinfeld S, Montesano A. Journal of Clinical Psychology. 2025;. doi:10.1002/jclp.23813.
11. Behavioral Activation Through Virtual Reality for Depression: A Single Case Experimental Design With Multiple Baselines. Colombo D, Suso-Ribera C, Ortigosa-Beltrán I, et al. Journal of Clinical Medicine. 2022;11(5):1262. doi:10.3390/jcm11051262.
12. Detection of Stress Levels From Biosignals Measured in Virtual Reality Environments Using a Kernel-Based Extreme Learning Machine. Cho D, Ham J, Oh J, et al. Sensors (Basel, Switzerland). 2017;17(10):E2435. doi:10.3390/s17102435.
13. Impact of Cybersickness and Presence on Treatment Satisfaction and Clinical Outcomes in Virtual Reality-Based Biofeedback for Depression and Anxiety. Moon DU, Lütt A, Kim H, et al. Journal of Psychiatric Research. 2025;187:53-61. doi:10.1016/j.jpsychires.2025.04.047.
14. Internet-Based Acceptance and Commitment Therapy: A Transdiagnostic Systematic Review and Meta-Analysis for Mental Health Outcomes. Thompson EM, Destree L, Albertella L, Fontenelle LF. Behavior Therapy. 2021;52(2):492-507. doi:10.1016/j.beth.2020.07.002.
15. Virtual Reality in Psychotherapy: A Three-Dimensional Framework to Navigate Immersive Clinical Applications. Montesano A, Seinfeld S. Journal of Clinical Psychology. 2025;. doi:10.1002/jclp.70004.
16. A Systematic Review and Meta-Analysis of Self-Guided Online Acceptance and Commitment Therapy as a Transdiagnostic Self-Help Intervention. Klimczak KS, San Miguel GG, Mukasa MN, Twohig MP, Levin ME. Cognitive Behaviour Therapy. 2023;52(3):269-294. doi:10.1080/16506073.2023.2178498.

---

# Part 2: VR + ACT + Muse S Gen 2 Multimodal Blueprint

Here is a comprehensive, updated blueprint for a **VR biofeedback ACT application on Meta Quest with Muse S Gen 2 integration**, incorporating both the cardiac/PPG and EEG/neurofeedback evidence.

---

**Overview: Why Muse S Gen 2 + Meta Quest Is a Strong Multimodal Platform**

The Muse S Gen 2 provides **4-channel EEG (TP9, AF7, AF8, TP10), PPG (heart rate/HRV), accelerometer, and gyroscope** via Bluetooth, making it one of the most data-rich consumer wearables available for this application. Combining it with the Meta Quest creates a **dual-loop biofeedback system**: an EEG neurofeedback loop targeting cortical states relevant to ACT processes, and an HRV biofeedback loop targeting autonomic regulation — both rendered as real-time environmental changes in VR. This multimodal approach is supported by meta-analytic evidence showing that both HRV biofeedback and EEG neurofeedback independently reduce depression and anxiety symptoms.[1][2]

**Important caveat on Muse signal quality**: Validation studies comparing the Muse to research-grade EEG systems have found **limited signal fidelity**, with the Muse showing broadband power increases, higher artifact susceptibility from eye blinks and muscle movement, and the poorest alignment with research-grade systems among consumer devices tested.[3][4][5] This means EEG-derived neurofeedback from the Muse should be treated as an **engagement and awareness tool rather than a precision neuroscience instrument**. A recent meta-analysis of 16 RCTs using consumer-grade neurofeedback (11/16 used Muse) found only a modest effect on psychological distress (g = −0.16) and no evidence that users actually modulated the targeted brain signals — raising the possibility that benefits may partly reflect "neurosuggestion" (placebo effects of neurotechnology).[6] This does not invalidate the approach, but it should inform how the EEG data is used in the application.

---

**The Six ACT Processes — Mapped to VR + Muse + Quest Biofeedback**

**1. Present-Moment Awareness (Mindfulness)**

This is the strongest evidence base for the combined system. A pilot study showed that interactive VR mindfulness with **real-time HRV biofeedback dynamically modulating the environment** (fog dissipation, auditory cues, visual transformations) significantly improved anxiety, mindfulness states, and HRV in a single 5-minute session.[7] VR HRV-BF also buffered stress and increased relaxation self-efficacy compared to standard biofeedback.[8]

- **HRV loop (Muse PPG)**: Slow-paced breathing → increased HRV coherence → environment clears (fog lifts, water calms, birdsong emerges). This is the best-validated VR-BF paradigm.[9]
- **EEG loop (Muse EEG)**: Target **enhanced alpha power (8–12 Hz)** at AF7/AF8 as a correlate of relaxed, present-moment awareness. Mindfulness meditation is most consistently associated with increased alpha and theta power compared to resting state, signifying a state of "relaxed alertness." Mind wandering is associated with increased theta amplitude and decreased alpha amplitude — the inverse pattern can serve as a real-time indicator of attentional drift.[10][11]
- **VR implementation**: Nature scene (forest, lakeside). When alpha is sustained and HRV coherence is high, the environment is vivid and calm. When mind wandering is detected (alpha drop, theta surge), subtle environmental cues (gentle chime, slight fog return) prompt re-engagement without being punitive.

**2. Acceptance**

Acceptance recruits prefrontal cognitive control networks (DLPFC, DMPFC, dACC) that overlap with reappraisal circuits, as demonstrated in an RCT comparing CBT and MBSR for social anxiety.[12] Both treatments increased PFC and parietal activation during acceptance tasks.

- **HRV loop**: During a guided body scan or exposure to mildly distressing stimuli (e.g., uncomfortable body sensations visualization), EDA-like arousal can be inferred from HRV reactivity. As the user practices acceptance (non-avoidance), HRV stabilization → environment calms.
- **EEG loop**: Target **frontal alpha asymmetry (FAA)** — specifically, relatively greater left frontal activation (lower alpha at AF7 relative to AF8). FAA neurofeedback has been shown to reduce negative affect and anxiety (p < .05) in depression patients, and combined alpha asymmetry + high-beta down-training neurofeedback significantly reduces both depression and anxiety symptoms in MDD.[13][14]
- **VR implementation**: Present a "weather system" metaphor — storm clouds represent resistance/avoidance, clearing skies represent acceptance. FAA shift toward approach motivation + HRV stabilization → storm dissipates. The user learns that acceptance (not fighting the storm) is what clears it.

**3. Cognitive Defusion**

- **EEG loop**: High-beta activity (20–30 Hz) at frontal sites is associated with rumination and anxious cognitive processing. High-beta down-training at parietal sites (P3/P4) has been shown to reduce both depression and anxiety symptoms in MDD patients. While Muse's electrode placement (frontal/temporal) limits parietal recording, frontal high-beta can still serve as a proxy for cognitive over-engagement.[14]
- **HRV loop**: Cognitive fusion (being "hooked" by thoughts) typically elevates sympathetic tone → decreased HRV. As defusion occurs, HRV should stabilize.
- **VR implementation**: Classic "leaves on a stream" metaphor. User speaks or types distressing thoughts → they appear on virtual leaves → float downstream. When EEG high-beta decreases and HRV stabilizes (indicating cognitive disengagement from the thought), the stream flows smoothly and the leaf dissolves. When the user is "fused" (high beta, low HRV), the stream slows or the leaf gets stuck, gently prompting the defusion practice.

**4. Self-as-Context (Observer Self)**

- **EEG loop**: Alpha/theta crossover states (theta increasing relative to alpha) have been associated with deep meditative states and perspective-shifting in experienced meditators. The Muse can track the alpha-theta ratio in real time.[15]
- **VR implementation**: A perspective-shifting exercise where the user observes themselves from a third-person viewpoint (avatar embodiment). VR's unique capacity for perspective-taking is a key affordance here. The user can "zoom out" from their avatar, observing their virtual self from above or from different angles. As alpha-theta ratio shifts toward a meditative/observer state, the perspective widens and the scene becomes more panoramic. This leverages VR's unique embodiment capabilities that no other medium can replicate.[16]

**5. Values Clarification**

- **Biofeedback role**: Less direct here, but HRV coherence can serve as a marker of emotional resonance. When users engage with values-aligned content, coherent HRV patterns may emerge naturally. EEG frontal asymmetry shifting leftward (approach motivation) when contemplating valued directions could serve as a subtle reinforcement signal.[13]
- **VR implementation**: An interactive "values landscape" — a 3D environment the user builds over sessions, placing meaningful objects (family, career, health, creativity) in a spatial map. Gamification elements: a compass that points toward valued directions, paths that illuminate when the user engages with values-aligned content. Session-over-session persistence of this landscape creates a tangible record of therapeutic progress, consistent with the DTx-ACT framework's emphasis on data-driven evaluation.[17]

**6. Committed Action**

- **Biofeedback role**: Behavioral rehearsal in VR with physiological monitoring. The user practices valued actions (e.g., having a difficult conversation, entering a feared situation) while HRV and EEG track arousal and regulation. Successful regulation during behavioral rehearsal → positive environmental feedback.
- **VR implementation**: Scenario-based behavioral activation. VR behavioral activation has shown moderate-to-large improvements in daily activity levels and reductions in depressive symptoms. Users rehearse committed actions in VR, with biofeedback confirming their ability to maintain regulation during challenging scenarios. This builds self-efficacy for real-world transfer.[18]

---

**Muse S Gen 2 — Specific Data Streams and How to Use Them**

| Data Stream | Muse Sensor | ACT-Relevant Biomarker | Clinical Evidence | References |
|---|---|---|---|---|
| EEG Alpha (8–12 Hz) | AF7, AF8, TP9, TP10 | Frontal alpha asymmetry (FAA) for approach/withdrawal; alpha power for relaxed awareness | FAA neurofeedback reduces negative affect and anxiety; alpha enhancement associated with mindfulness | [1], [2] |
| EEG Theta (4–8 Hz) | AF7, AF8, TP9, TP10 | Alpha/theta ratio for mind wandering detection; theta/alpha crossover for deep meditative states | Mind wandering = ↑theta, ↓alpha; meditation = elevated alpha + theta co-presence | [2], [3] |
| EEG High-Beta (20–30 Hz) | AF7, AF8 | Frontal high-beta as proxy for rumination/cognitive fusion | High-beta down-training reduces depression and anxiety in MDD | [4] |
| PPG → Heart Rate / HRV | PPG sensor | HRV coherence for autonomic regulation; RMSSD for vagal tone | HRV-BF meta-analysis: g = 0.81–0.83 for stress/anxiety reduction | [5], [6] |
| Accelerometer / Gyroscope | IMU | Head movement artifact rejection; stillness as behavioral marker of engagement | Movement artifacts are a major limitation of consumer EEG; motion data enables artifact rejection | [7], [8] |

---

**Dual-Loop Biofeedback Architecture (Unity Implementation)**

The core technical architecture should implement two parallel feedback loops that converge on a single environment state:

**Loop 1 — Autonomic (HRV via Muse PPG)**

- Muse PPG → R-R interval extraction → real-time RMSSD or coherence score (sliding 30-second window)
- Map coherence score to environment "calm" axis (0–1 float)
- Higher coherence → clearer skies, calmer water, warmer lighting, nature sounds
- This loop has the strongest evidence base and should be the primary driver of environmental feedback.[2][7]

**Loop 2 — Cortical (EEG via Muse EEG)**

- Muse EEG → band-power extraction (alpha, theta, high-beta) at AF7/AF8
- Compute: (a) FAA = log(AF8 alpha) − log(AF7 alpha); (b) alpha/theta ratio; (c) frontal high-beta power
- Map to environment "clarity" axis (0–1 float)
- Higher FAA (approach) + higher alpha/theta ratio (focused awareness) + lower high-beta (less rumination) → environment detail increases, colors saturate
- Given Muse's signal quality limitations, this loop should modulate **secondary** environmental features (particle effects, ambient detail, subtle color shifts) rather than primary scene elements, to avoid frustrating users with noisy feedback.[3][6]

**Convergence**: Both loops feed into a unified "environment state" that drives the VR scene. The HRV loop controls macro-environmental features (weather, lighting, water state); the EEG loop controls micro-environmental features (particle density, flora detail, ambient sound richness). This ensures the experience remains responsive even if one signal is noisy.

**Artifact rejection**: Use the Muse accelerometer/gyroscope to gate EEG processing — reject epochs with significant head movement. This is critical given that consumer EEG devices are highly susceptible to motion artifacts.[3][20]

---

**Session Structure — 5-Module Program**

Following the DTx-ACT framework of five sessions, 6–12 minutes each:[17]

1. **Session 1 — "Arriving" (Present-Moment Awareness)**: Guided breathing in a VR nature scene with HRV biofeedback + alpha enhancement neurofeedback. Teaches the biofeedback mechanics. Calibrates individual baselines for both HRV and EEG.
2. **Session 2 — "Weather Within" (Acceptance)**: Weather metaphor with FAA-driven storm/clearing dynamics. Introduces the concept of acceptance through non-avoidance of internal "weather."
3. **Session 3 — "Leaves on the Stream" (Cognitive Defusion)**: Interactive thought-labeling with high-beta monitoring. Thoughts placed on leaves; stream flow responds to defusion state.
4. **Session 4 — "The Observer" (Self-as-Context)**: Perspective-shifting exercise with alpha/theta ratio tracking. Third-person avatar observation with widening perspective as meditative depth increases.
5. **Session 5 — "Your Compass" (Values + Committed Action)**: Values landscape building with HRV resonance tracking + behavioral rehearsal scenarios. Integrates all prior skills.

---

**Data Logging and Outcome Measurement**

Build in from the start for research-grade outcome tracking:

- **Per-session**: Raw EEG (all 4 channels), PPG/HRV metrics (RMSSD, coherence, mean HR), accelerometer data, interaction events (timestamps of user actions), session duration, biofeedback loop states
- **Pre/post each session**: Visual analog scales for anxiety, mood, present-moment awareness
- **Pre/post program**: PHQ-9 (depression), GAD-7 (anxiety), AAQ-II (psychological flexibility — the core ACT outcome measure), CompACT or MPFI (multidimensional psychological flexibility)[21]
- **Longitudinal**: Session-over-session trends in biofeedback performance (HRV coherence improvement, alpha/theta ratio changes)

---

**Key Design Principles from the Evidence**

- **Presence drives outcomes**: Higher VR presence correlates with greater reductions in anxiety (β = −0.24) and stress (β = −0.37), and with higher treatment satisfaction. Invest in visual fidelity, spatial audio, and interaction design.[22]
- **Cybersickness undermines everything**: Inversely correlated with presence and clinical outcomes. Use stationary/seated experiences, teleportation only, vignetting during any camera movement, and keep sessions to 6–12 minutes.[22][17]
- **Nature environments dominate**: 72% of VR-BF interventions use natural settings — well-suited to ACT metaphors and computationally feasible on Quest's mobile GPU.[9]
- **VR enhances neurofeedback performance**: A sham-controlled study found that 3D VR-based neurofeedback produced a linear increase in SMR power over feedback runs, while conventional 2D bar feedback did not — suggesting VR's immersive quality itself enhances brain self-regulation learning.[23]
- **Therapist guidance matters**: Internet-based ACT with therapist guidance shows greater effectiveness than unguided formats. Consider a hybrid model with optional therapist check-ins or AI-guided narration.[24]
- **HRV biofeedback should be the anchor**: Given the stronger evidence base for HRV-BF (g = 0.81–0.83 for anxiety/stress) compared to consumer EEG neurofeedback (g = −0.16 for distress), the HRV loop should be the primary feedback mechanism, with EEG as an enriching secondary layer.[2][6]

---

**Evidence Gaps and Honest Limitations**

- **No published VR-ACT-EEG-HRV combined system exists** — this would be genuinely novel, which is both an opportunity and a risk.
- Consumer-grade EEG neurofeedback may work partly through **"neurosuggestion"** rather than true neural modulation. This is not necessarily a problem therapeutically (placebo effects are real effects), but it should be disclosed in any research context.[6]
- Muse signal quality is the weakest among tested consumer devices. Careful artifact rejection and conservative use of EEG-derived feedback are essential.[3][4]
- The overall VR therapy evidence base remains **low to very low certainty** per GRADE. Building in rigorous outcome measurement from the start is critical for contributing to the evidence base.[25]
- Combined EEG + HRV biofeedback has been studied in ADHD (showing large effect sizes, d > 1.0) but not yet in ACT-specific contexts.[26]

### References (Section 2)

1. Efficacy of Bio- And Neurofeedback for Depression: A Meta-Analysis. Fernández-Alvarez J, Grassi M, Colombo D, et al. Psychological Medicine. 2022;52(2):201-216. doi:10.1017/S0033291721004396.
2. The Effect of Heart Rate Variability Biofeedback Training on Stress and Anxiety: A Meta-Analysis. Goessl VC, Curtiss JE, Hofmann SG. Psychological Medicine. 2017;47(15):2578-2586. doi:10.1017/S0033291717001003.
3. Comparison of EEG Signal Spectral Characteristics Obtained With Consumer- And Research-Grade Devices. Mikhaylov D, Saeed M, Husain Alhosani M, F Al Wahedi Y. Sensors (Basel, Switzerland). 2024;24(24):8108. doi:10.3390/s24248108.
4. Resting-State EEG Recorded With Gel-Based vs. Consumer Dry Electrodes: Spectral Characteristics and Across-Device Correlations. Kleeva D, Ninenko I, Lebedev MA. Frontiers in Neuroscience. 2024;18:1326139. doi:10.3389/fnins.2024.1326139.
5. Comparison of Medical and Consumer Wireless EEG Systems for Use in Clinical Trials. Ratti E, Waninger S, Berka C, Ruffini G, Verma A. Frontiers in Human Neuroscience. 2017;11:398. doi:10.3389/fnhum.2017.00398.
6. Consumer-Grade Neurofeedback With Mindfulness Meditation: Meta-Analysis. Treves I, Bajwa Z, Greene KD, et al. Journal of Medical Internet Research. 2025;27:e68204. doi:10.2196/68204.
7. Brief Interactive Virtual Reality Mindfulness Training With Real-Time Biofeedback for Anxiety Reduction: A Pilot Study. Xu Q, Gu Y, Hu X. Applied Psychophysiology and Biofeedback. 2025;:10.1007/s10484-025-09718-w. doi:10.1007/s10484-025-09718-w.
8. Heart Rate Variability Biofeedback Based on Slow-Paced Breathing With Immersive Virtual Reality Nature Scenery. Blum J, Rockstroh C, Göritz AS. Frontiers in Psychology. 2019;10:2172. doi:10.3389/fpsyg.2019.02172.
9. Virtual Reality Biofeedback in Health: A Scoping Review. Lüddecke R, Felnhofer A. Applied Psychophysiology and Biofeedback. 2022;47(1):1-15. doi:10.1007/s10484-021-09529-9.
10. A Systematic Review of the Neurophysiology of Mindfulness on EEG Oscillations. Lomas T, Ivtzan I, Fu CH. Neuroscience and Biobehavioral Reviews. 2015;57:401-10. doi:10.1016/j.neubiorev.2015.09.018.
11. EEG Alpha-Theta Dynamics During Mind Wandering in the Context of Breath Focus Meditation: An Experience Sampling Approach With Novice Meditation Practitioners. Rodriguez-Larios J, Alaerts K. The European Journal of Neuroscience. 2021;53(6):1855-1868. doi:10.1111/ejn.15073.
12. Evaluation of Cognitive Behavioral Therapy vs Mindfulness Meditation in Brain Changes During Reappraisal and Acceptance Among Patients With Social Anxiety Disorder: A Randomized Clinical Trial. Goldin PR, Thurston M, Allende S, et al. JAMA Psychiatry. 2021;78(10):1134-1142. doi:10.1001/jamapsychiatry.2021.1862.
13. Frontal Alpha Asymmetry Neurofeedback for the Reduction of Negative Affect and Anxiety. Mennella R, Patron E, Palomba D. Behaviour Research and Therapy. 2017;92:32-40. doi:10.1016/j.brat.2017.02.002.
14. The Effects of Alpha Asymmetry and High-Beta Down-Training Neurofeedback for Patients With the Major Depressive Disorder and Anxiety Symptoms. Wang SY, Lin IM, Fan SY, et al. Journal of Affective Disorders. 2019;257:287-296. doi:10.1016/j.jad.2019.07.026.
15. From Thoughtless Awareness to Effortful Cognition: Alpha - Theta Cross-Frequency Dynamics in Experienced Meditators During Meditation, Rest and Arithmetic. Rodriguez-Larios J, Faber P, Achermann P, Tei S, Alaerts K. Scientific Reports. 2020;10(1):5419. doi:10.1038/s41598-020-62392-2.
16. Virtual Reality in Psychotherapy: A Commentary on Strategies, Interventions, and Perspectives From Five Clinical Reports. Seinfeld S, Montesano A. Journal of Clinical Psychology. 2025;. doi:10.1002/jclp.23813.
17. Developing Interactive VR-based Digital Therapeutics for Acceptance and Commitment Therapy (ACT): A Structured Framework for the Digital Transformation Integrating Gamification and Multimodal Arts. Kim H, Choi Y. Frontiers in Psychiatry. 2025;16:1554394. doi:10.3389/fpsyt.2025.1554394.
18. Behavioral Activation Through Virtual Reality for Depression: A Single Case Experimental Design With Multiple Baselines. Colombo D, Suso-Ribera C, Ortigosa-Beltrán I, et al. Journal of Clinical Medicine. 2022;11(5):1262. doi:10.3390/jcm11051262.
19. A Meta-Analysis on Heart Rate Variability Biofeedback and Depressive Symptoms. Pizzoli SFM, Marzorati C, Gatti D, et al. Scientific Reports. 2021;11(1):6650. doi:10.1038/s41598-021-86149-7.
20. Signal Quality and Patient Experience With Wearable Devices for Epilepsy Management. Nasseri M, Nurse E, Glasstetter M, et al. Epilepsia. 2020;61 Suppl 1:S25-S35. doi:10.1111/epi.16527.
21. Examining Domains of Psychological Flexibility and Inflexibility as Treatment Mechanisms in Acceptance and Commitment Therapy: A Comprehensive Systematic and Meta-Analytic Review. Macri JA, Rogge RD. Clinical Psychology Review. 2024;110:102432. doi:10.1016/j.cpr.2024.102432.
22. Impact of Cybersickness and Presence on Treatment Satisfaction and Clinical Outcomes in Virtual Reality-Based Biofeedback for Depression and Anxiety. Moon DU, Lütt A, Kim H, et al. Journal of Psychiatric Research. 2025;187:53-61. doi:10.1016/j.jpsychires.2025.04.047.
23. Effects of Virtual Reality-Based Feedback on Neurofeedback Training Performance-a Sham-Controlled Study. Berger LM, Wood G, Kober SE. Frontiers in Human Neuroscience. 2022;16:952261. doi:10.3389/fnhum.2022.952261.
24. Internet-Based Acceptance and Commitment Therapy: A Transdiagnostic Systematic Review and Meta-Analysis for Mental Health Outcomes. Thompson EM, Destree L, Albertella L, Fontenelle LF. Behavior Therapy. 2021;52(2):492-507. doi:10.1016/j.beth.2020.07.002.
25. The Effectiveness of Immersive Virtual Reality-Based Treatment for Mental Disorders: A Systematic Review With Meta-Analysis. Zeka F, Clemmensen L, Valmaggia L, et al. Acta Psychiatrica Scandinavica. 2025;151(3):210-230. doi:10.1111/acps.13777.
26. Z-Score Neurofeedback and Heart Rate Variability Training for Adults and Children With Symptoms of Attention-Deficit/Hyperactivity Disorder: A Retrospective Study. Groeneveld KM, Mennenga AM, Heidelberg RC, et al. Applied Psychophysiology and Biofeedback. 2019;44(4):291-308. doi:10.1007/s10484-019-09439-x.

---

# Part 3: ACT Metaphors Operationalized in Digital Therapeutics

Here is a comprehensive synthesis of how specific ACT metaphors have been operationalized across existing digital therapeutics, organized by the ACT process each metaphor targets, with direct implications for the VR build.

---

**1. Present-Moment Awareness — The VR River Metaphor (Most Extensively Studied)**

The **"floating down a virtual river"** paradigm is the single most well-validated VR operationalization of an ACT-adjacent mindfulness exercise. Developed by Hoffman, Navarro-Haro, and colleagues for DBT mindfulness skills training, it has been tested across multiple clinical populations:

- **Borderline personality disorder**: A patient who previously could not practice mindfulness due to emotional reactivity and concentration difficulties was able to engage when floating down a 3D computer-generated river while listening to DBT mindfulness audio instructions. Suicidal urges, self-harm urges, substance use urges, and negative emotions all decreased after each VR session.[1]
- **Spinal cord injury**: Two quadriplegic/paretic patients floated down the virtual river with DBT mindfulness audio. Both reported feeling less depressed, less anxious, and less emotionally upset. One patient showed large reductions in acute stress/PTSD symptoms after a single session.[2]
- **Severe burns**: A hospitalized patient with >35% TBSA burns used the VR river with Oculus Rift DK2 across four sessions. He reported increased positive emotions, decreased negative emotions, and stated the sessions helped him "become more comfortable with his emotions."[3]
- **Generalized anxiety disorder**: In a pilot comparing standard mindfulness-based intervention (MBI) alone vs. MBI + 10-minute VR DBT mindfulness, both groups showed large improvements in GAD-7 scores (d = −1.36 and d = −1.33 respectively). Critically, the VR-augmented group had **100% treatment completion vs. 70%** in the MBI-alone group (p = 0.020) — demonstrating VR's primary advantage may be in adherence rather than efficacy.[4]
- **Meditation experts**: 44 participants at a mindfulness conference used the VR river and reported significantly less sadness, anger, and anxiety, and significantly more relaxation. They reported moderate-to-high presence and high acceptance of VR as a mindfulness technique.[5]

**Design takeaway for the build**: The river environment is a proven, replicable paradigm. The scene includes rocks, boulders, trees, mountains, and clouds, with the user passively floating downstream. This is inherently **stationary/seated** (no locomotion-induced cybersickness), computationally lightweight for Quest, and naturally maps to both ACT present-moment awareness and the "leaves on a stream" defusion metaphor. The Muse HRV biofeedback can modulate river flow speed and environmental clarity; EEG alpha can modulate visual detail and ambient sound richness.

---

**2. Cognitive Defusion — Multiple Digital Operationalizations**

Defusion — the process of perceiving thoughts as transient mental events rather than literal truths — has been operationalized in several ways across digital platforms:[6]

- **"Leaves on a stream" (text-based apps)**: In **ACT Daily**, users receive randomly prompted ecological momentary assessments, and when cognitive fusion is detected, the app delivers targeted defusion skill coaching. Users label thoughts and practice observing them as passing events. The app showed significant in-the-moment improvements in psychological inflexibility immediately following skill coaching, with effects becoming **larger over time** — suggesting a learning curve for defusion skills.[7]
- **Immersive art installation (physical/multisensory)**: The **"Beyond Words" ACT immersive art exhibition** for immigrants in Germany created a dedicated **Cognitive Defusion station** where participants physically experienced the "ability to distance thoughts from self" through multisensory audiovisual aesthetics. Participants reported that the multisensory environment helped **externalize difficult thoughts** and foster an "Observer Self" perspective — a shift from "cognitive entanglement to flow of mind." The study concluded that immersive environments can "translate abstract therapeutic rationales into tangible experiences."[8]
- **DTx-ACT VR system**: The DTx-ACT framework specifically incorporates ACT metaphors as interactive VR tasks within its five-session structure, using gamification to sustain engagement with defusion exercises. The Session Structuring System (SSS) model modularizes the clinical ACT protocol so that each metaphor becomes a discrete interactive VR experience with multisensory feedback.[9]

**Design takeaway**: For VR, the "leaves on a stream" metaphor can be layered directly onto the river environment from the mindfulness module. Users speak or type distressing thoughts → they materialize as text on virtual leaves → the leaves float downstream and dissolve. The Muse EEG high-beta signal (frontal rumination proxy) can modulate whether the leaf flows freely (defusion achieved) or gets stuck on a rock (fusion persists), providing a closed-loop biofeedback cue to practice the skill.

---

**3. Creative Hopelessness — The Entry Point**

Creative hopelessness — recognizing that attempts to control or suppress difficult experiences are themselves the problem — is typically the first therapeutic move in ACT and has been operationalized in immersive formats:

- **"Beyond Words" immersive art**: The first station was dedicated to Creative Hopelessness, designed to physically manifest the "process of recognizing that controlling experiences leads to suffocation." The multisensory environment made the abstract concept tangible — participants could feel the futility of control strategies through the immersive experience itself.[8]
- **Stanza (FDA-cleared DTx)**: The Stanza app for fibromyalgia structures creative hopelessness as part of its early chapters, using lessons and guided audio awareness activities to help patients recognize that avoidance and control strategies for pain are counterproductive, before introducing acceptance and willingness skills.[10]

**Design takeaway**: In VR, creative hopelessness can be operationalized as an introductory experience where the user attempts to "control" environmental elements (e.g., pushing away storm clouds, trying to stop rain) and discovers that effort makes things worse, while letting go allows the environment to settle naturally. Biofeedback can reinforce this: muscular tension (inferred from HRV sympathetic activation) during control attempts → environment worsens; physiological relaxation during acceptance → environment calms.

---

**4. Acceptance — From Audio Exercises to Embodied VR**

- **Stanza**: Each daily session includes a **guided audio awareness activity** specifically targeting acceptance skills, plus a journaling activity for reflection. The 42-session program gates content serially, requiring completion before progression — ensuring acceptance skills are practiced before more advanced processes.[10]
- **ACT for PTSD app**: An RCT of app-delivered ACT for PTSD (n = 221) showed that the ACT app produced significantly greater improvements in PTSD symptoms (d = −0.79), anxiety (d = −0.62), depression (d = −0.51), and psychological flexibility (d = 0.76) compared to waitlist. Notably, ACT outperformed a mindfulness-only app specifically on **psychological flexibility** (d = −0.37), suggesting that the acceptance and defusion components add value beyond mindfulness alone.[11]
- **"Beyond Words" immersive art**: The Acceptance station was designed around the "process of making space for any emotions," using multisensory aesthetics to create a physical experience of openness to difficult internal states.[8]
- **VR body scan for chronic pain**: VR-based body scan exercises have been used to train body-related attentional skills, helping individuals focus on sensations (including pain) without avoidance — a direct operationalization of acceptance.[12]

**Design takeaway**: The weather metaphor from the previous blueprint remains strong. Additionally, a VR body scan with Muse biofeedback overlay — where the user sees a translucent body map with HRV-derived arousal zones highlighted — can make acceptance tangible. As the user practices non-avoidance (staying present with highlighted areas rather than looking away), the arousal zones gradually shift from red to blue.

---

**5. Self-as-Context — VR's Unique Affordance**

- **"Explore Your Meanings" VR tool**: This tool enables immersive **multi-perspective exploration of self-identity in 3D spaces**, where users can visualize differences between their perceived and ideal self. It leverages VR's unique capacity for perspective-taking — users can literally see themselves from different viewpoints, fostering the "observer self" that is central to self-as-context.[12][13]
- **VR Avatar Therapy**: Originally developed for auditory hallucinations, avatar therapy enables individuals to have a dialogue with externalized aspects of their experience embodied in avatars. This promotes **symptom externalization and self-identity exploration** — directly relevant to the ACT concept of self-as-context, where the self is the context in which experiences occur rather than the experiences themselves.[12]
- **"Beyond Words" immersive art**: Participants spontaneously reported that the multisensory environment fostered an "Observer Self" perspective — the immersive quality itself seemed to facilitate the shift from being embedded in experience to observing it.[8]

**Design takeaway**: VR is uniquely suited to self-as-context because it can literally shift perspective. A module where the user rises above their avatar and observes themselves from a third-person "witness" perspective, with the environment reflecting their internal state via biofeedback, is a VR-native operationalization that no other medium can replicate.

---

**6. Values and Committed Action — Structured Digital Programs**

- **Stanza**: Values clarification and committed action are the culminating chapters of the 42-session program. After learning acceptance, defusion, and mindfulness, patients clarify personal values through lessons and journaling, then commit to values-aligned behavioral changes (paced activities, exercise). The program includes a **reinforcement phase** after the core content for ongoing practice. The Phase 3 PROSPER-FM trial (n = 275) showed that this structured approach produced significant improvements in fibromyalgia impact (FIQ-R), with 73% of participants reporting global improvement vs. 22% in the control group. Stanza received **FDA clearance** in May 2023 based on these results.[10]
- **ACTing Minds video game**: This single-player adventure game (~1 hour) educates users on ACT principles through narrative gameplay. Qualitative analysis revealed that participants used the game for "exploring emotions" and reported applying learning to the real world at 3-week follow-up. The game produced small-to-large effect sizes for decreases in depression (ηp² = 0.011), anxiety (ηp² = 0.096), and stress (ηp² = 0.108), and increases in psychological flexibility (ηp² = 0.060) and participation in usual activities (ηp² = 0.307).[14]
- **ACT Daily app**: Uses a **tailored skill coaching approach** based on randomly prompted ecological momentary assessments. When the app detects elevated inflexibility, it delivers targeted ACT skill coaching (including values-based prompts). This "just-in-time" adaptive intervention model showed effects that became larger over time, suggesting skill acquisition and generalization.[7]

**Design takeaway**: Values work in VR can combine the spatial persistence of a "values landscape" (built over sessions) with the just-in-time coaching model of ACT Daily. The Muse can add a biofeedback dimension: when users engage with values-aligned content and show HRV coherence (emotional resonance) or leftward frontal alpha asymmetry (approach motivation), the environment responds with warmth and growth (flowers blooming, paths illuminating).

---

**Cross-Cutting Design Principles from the Evidence**

Several patterns emerge across all these operationalizations:

- **Serial gating works**: Both Stanza and DTx-ACT gate content sequentially, preventing users from rushing through. This mirrors the therapeutic progression of ACT (creative hopelessness → acceptance → defusion → self-as-context → values → committed action). The VR build should follow this same progression.[10][9]
- **Multimodal > unimodal**: The immersive art study, DTx-ACT, and VR river studies all emphasize that **multisensory engagement** (visual + auditory + haptic) enhances the translation of abstract ACT concepts into felt experience. The Muse + Quest combination enables visual biofeedback, spatial audio modulation, and controller haptics — all three channels should be used.[8][9]
- **Gamification reduces attrition**: An RCT of a gamified mental health app (eQuoo) showed **21% higher retention** than a standard CBT journal app, with significant increases in resilience and personal growth. DTx-ACT specifically incorporates gamification (progress tracking, interactive tasks, reward mechanics) to sustain engagement.[15][9]
- **Journaling/reflection enhances transfer**: Both Stanza and ACT Daily include reflective components (journaling, self-assessment) that bridge the digital experience to real-world application. Consider a post-session reflection prompt within the VR environment or a companion mobile component.[10][7]
- **The VR advantage is primarily engagement and adherence, not necessarily efficacy**: The GAD study showed equivalent symptom reduction but **100% vs. 70% completion** with VR augmentation. This is the strongest argument for VR delivery — it keeps people practicing.[4]

---

**Summary Table: ACT Metaphors Operationalized in Digital Therapeutics**

| ACT Process | Classic Metaphor | Digital Operationalization | Platform | Key Finding | References |
|---|---|---|---|---|---|
| Present-Moment Awareness | Observing the breath | VR river float + DBT mindfulness audio | Oculus Rift VR | 100% completion rate vs. 70% without VR; reduced anxiety, sadness, anger across multiple populations | [1], [2], [3], [4], [5] |
| Creative Hopelessness | Tug of war with a monster | Immersive art station: "controlling leads to suffocation" | Physical installation | Participants reported shift from cognitive entanglement to flow of mind | [6] |
| Acceptance | Quicksand / Willingness | Guided audio awareness + journaling (Stanza); VR body scan | Mobile app; VR | FDA-cleared; 73% global improvement vs. 22% control; d = 0.76 for psychological flexibility | [7], [8], [9] |
| Cognitive Defusion | Leaves on a stream | EMA-triggered skill coaching (ACT Daily); multisensory externalization (immersive art); interactive VR tasks (DTx-ACT) | Mobile app; installation; VR | In-the-moment improvements that grew larger over time; externalization of thoughts via multisensory aesthetics | [6], [10], [11] |
| Self-as-Context | Chessboard / Observer | "Explore Your Meanings" 3D identity exploration; VR avatar therapy; immersive art "Observer Self" | VR | Multi-perspective self-identity visualization; spontaneous observer-self reports | [6], [9], [12] |
| Values + Committed Action | Compass / Life direction | 42-session gated program (Stanza); adventure game narrative (ACTing Minds); just-in-time coaching (ACT Daily) | Mobile app; PC game; mobile app | Large effect on participation in usual activities (ηp² = 0.307); FDA clearance for Stanza | [7], [10], [13] |

The strongest evidence-based design pattern for the VR build is to **layer the river environment as the foundational scene** (proven across 5+ clinical populations), then progressively introduce ACT-specific interactive elements (leaves for defusion, weather for acceptance, perspective shifts for self-as-context, landscape building for values) across gated sessions, with Muse biofeedback modulating the environment throughout.

### References (Section 3)

1. The Use of Virtual Reality to Facilitate Mindfulness Skills Training in Dialectical Behavioral Therapy for Borderline Personality Disorder: A Case Study. Nararro-Haro MV, Hoffman HG, Garcia-Palacios A, et al. Frontiers in Psychology. 2016;7:1573. doi:10.3389/fpsyg.2016.01573.
2. The Use of Virtual Reality to Facilitate Mindfulness Skills Training in Dialectical Behavioral Therapy for Spinal Cord Injury: A Case Study. Flores A, Linehan MM, Todd SR, Hoffman HG. Frontiers in Psychology. 2018;9:531. doi:10.3389/fpsyg.2018.00531.
3. The Use of Virtual Reality Facilitates Dialectical Behavior Therapy® "Observing Sounds and Visuals" Mindfulness Skills Training Exercises for a Latino Patient With Severe Burns: A Case Study. Gomez J, Hoffman HG, Bistricky SL, et al. Frontiers in Psychology. 2017;8:1611. doi:10.3389/fpsyg.2017.01611.
4. Evaluation of a Mindfulness-Based Intervention With and Without Virtual Reality Dialectical Behavior Therapy® Mindfulness Skills Training for the Treatment of Generalized Anxiety Disorder in Primary Care: A Pilot Study. Navarro-Haro MV, Modrego-Alarcón M, Hoffman HG, et al. Frontiers in Psychology. 2019;10:55. doi:10.3389/fpsyg.2019.00055.
5. Meditation Experts Try Virtual Reality Mindfulness: A Pilot Study Evaluation of the Feasibility and Acceptability of Virtual Reality to Facilitate Mindfulness Practice in People Attending a Mindfulness Conference. Navarro-Haro MV, López-Del-Hoyo Y, Campos D, et al. PloS One. 2017;12(11):e0187777. doi:10.1371/journal.pone.0187777.
6. A Process-Based Analysis of Cognitive Defusion in Acceptance and Commitment Therapy. Assaz DA, Tyndall I, Oshiro CKB, Roche B. Behavior Therapy. 2023;54(6):1020-1035. doi:10.1016/j.beth.2022.06.003.
7. Evaluating an Adjunctive Mobile App to Enhance Psychological Flexibility in Acceptance and Commitment Therapy. Levin ME, Haeger J, Pierce B, Cruz RA. Behavior Modification. 2017;41(6):846-867. doi:10.1177/0145445517719661.
8. Beyond Words: A Reflexive Thematic Analysis of Acceptance and Commitment Therapy (ACT) in Immersive Art Experiences for Cultural Minorities in Germany. Tong KH, Chik CH, Yeung HY, Li AWK. International Review of Psychiatry (Abingdon, England). 2026;:1-11. doi:10.1080/09540261.2026.2627506.
9. Developing Interactive VR-based Digital Therapeutics for Acceptance and Commitment Therapy (ACT): A Structured Framework for the Digital Transformation Integrating Gamification and Multimodal Arts. Kim H, Choi Y. Frontiers in Psychiatry. 2025;16:1554394. doi:10.3389/fpsyt.2025.1554394.
10. Self-Guided Digital Behavioural Therapy Versus Active Control for Fibromyalgia (PROSPER-FM): A Phase 3, Multicentre, Randomised Controlled Trial. Gendreau RM, McCracken LM, Williams DA, et al. Lancet (London, England). 2024;404(10450):364-374. doi:10.1016/S0140-6736(24)00909-7.
11. Efficacy and Acceptability of Mobile Application-Delivered Acceptance and Commitment Therapy for Posttraumatic Stress Disorder in China: A Randomized Controlled Trial. Zhao C, Zhao Z, Levin ME, et al. Behaviour Research and Therapy. 2023;171:104440. doi:10.1016/j.brat.2023.104440.
12. Virtual Reality in Psychotherapy: A Commentary on Strategies, Interventions, and Perspectives From Five Clinical Reports. Seinfeld S, Montesano A. Journal of Clinical Psychology. 2025;. doi:10.1002/jclp.23813.
13. Virtual Reality in Psychotherapy: A Three-Dimensional Framework to Navigate Immersive Clinical Applications. Montesano A, Seinfeld S. Journal of Clinical Psychology. 2025;. doi:10.1002/jclp.70004.
14. Mixed-Methods Feasibility Outcomes for a Novel ACT-based Video Game 'ACTing Minds' to Support Mental Health. Gordon TC, Kemp AH, Edwards DJ. BMJ Open. 2024;14(3):e080972. doi:10.1136/bmjopen-2023-080972.
15. Gamification as an Approach to Improve Resilience and Reduce Attrition in Mobile Mental Health Interventions: A Randomized Controlled Trial. Litvin S, Saunders R, Maier MA, Lüttke S. PloS One. 2020;15(9):e0237220. doi:10.1371/journal.pone.0237220.
