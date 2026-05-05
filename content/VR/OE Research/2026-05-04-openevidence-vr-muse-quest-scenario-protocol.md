# Scenario Design, UI/UX, and Protocol for a Muse S Gen 2 + Meta Quest VR Biofeedback System

Given the Muse S Gen 2 provides **EEG (4-channel: TP9, AF7, AF8, TP10), PPG-derived HR/HRV, and accelerometer** data, but no EDA or direct respiratory rate, here's a detailed build plan grounded in the evidence.

---

## Signals to Capture and Use

With the Muse S, the usable biofeedback channels are:

- **HR and HRV (RMSSD, SDNN)** from PPG: the most validated anxiety biomarkers, with large effect sizes for biofeedback-driven anxiety reduction. For a 60-second baseline, **RMSSD is the most reliable time-domain metric** at ultra-short durations.[1][2]
- **EEG frontal alpha asymmetry (AF7 vs AF8)**: greater relative right frontal activity is associated with anxiety and withdrawal motivation, while greater left frontal activity correlates with approach behavior. This is a well-established marker in social anxiety research. The Muse's AF7/AF8 placement is ideal for this.[3]
- **EEG alpha power (8–12 Hz)**: decreased alpha power reflects cortical arousal/anxiety; increased alpha reflects relaxation. Alpha neurofeedback has been used in anxiety treatment protocols.
- **EEG beta/alpha ratio**: elevated high-beta (20–30 Hz) relative to alpha is a stress/rumination marker. This can serve as a secondary real-time indicator.

Respiratory rate can be **estimated from HRV** (respiratory sinus arrhythmia): the Muse SDK may already provide this derived metric, worth checking.

---

## The Three Scenarios: Detailed Build Specs

Each scenario should have **three difficulty tiers** that the user can self-select or progress through, consistent with the graded exposure model that produced significant anxiety reduction across all measures.[4]

### Scenario 1: Job Interview

| Tier | Setting | NPCs | Behavior |
|------|---------|------|----------|
| Easy | Small, warm office. One friendly interviewer across a desk. Soft lighting, plants. | 1 interviewer | Smiles, nods, relaxed posture. Asks simple icebreaker questions ("Tell me about yourself"). Long pauses feel comfortable. |
| Medium | Conference room. Two interviewers, one neutral, one slightly formal. | 2 interviewers | Mixed feedback: one nods, one takes notes without looking up. Questions become more pointed ("Why should we hire you?"). |
| Hard | Large boardroom. Panel of 4–5. Glass walls, visible hallway traffic. | 4–5 interviewers | Some look skeptical, check watches, whisper to each other. Interruptions. Challenging follow-ups ("Can you explain this gap in your resume?"). |

**Key design note:** The self-guided VRE trial that validated job interview anxiety reduction used scenarios where users practiced responding aloud to interview prompts.[5] **Users should speak aloud**: the system doesn't need speech recognition, just the act of verbal production under social pressure is the therapeutic mechanism.

### Scenario 2: Public Speaking

| Tier | Setting | NPCs | Behavior |
|------|---------|------|----------|
| Easy | Small seminar room. 5–8 seated audience members. Podium optional. | 5–8 | Attentive, friendly faces. Occasional nodding. No distractions. |
| Medium | Medium lecture hall. 20–30 audience members. Microphone on podium. | 20–30 | Mixed attention: some take notes, some look at phones. One person leaves mid-talk. |
| Hard | Large auditorium or conference stage. 100+ audience, bright stage lighting, camera visible. | 100+ (instanced) | Coughing, murmuring, visible boredom in some. One person raises hand to challenge a point. Recording light is on. |

**Key design note:** The RCT on attentional focus found that **encouraging users to look at audience faces** (social external focus) produced greater positive affect and more eye contact than looking at non-social objects.[6] Build in a subtle prompt (not forced) encouraging the user to scan faces. The 360° video VRET study for public speaking used a standalone HMD and achieved η² = 0.90: the Quest is well-suited for this.[7]

### Scenario 3: Social Gathering / Party

| Tier | Setting | NPCs | Behavior |
|------|---------|------|----------|
| Easy | Small get-together. Living room, 4–6 people. Familiar casual setting, music low. | 4–6 | One NPC approaches warmly, initiates easy small talk ("Hey, how do you know the host?"). Others are in their own conversations. |
| Medium | House party. 15–20 people. Kitchen/living room. Louder music, multiple conversation clusters. | 15–20 | User must approach a group already talking. Some NPCs glance over, one makes space. Brief awkward pause before inclusion. |
| Hard | Crowded networking event or bar. 40+ people. Loud ambient noise. Standing room. | 40+ | Groups seem closed off. One NPC gives a dismissive glance. User must initiate conversation. Some NPCs give short answers. Moments of standing alone are built in. |

**Key design note:** Social interaction fear and performance fear are the two core SAD domains.[8] The party scenario specifically targets **interaction anxiety and fear of initiating/joining conversations**, which is distinct from the performance anxiety targeted by the other two scenarios.

---

## UI/UX Design Decisions

### Pre-Exposure Phase (60-Second Baseline)

- Environment: a **neutral, calming space**: a quiet room with a window showing nature, or a serene outdoor setting. No social stimuli. This is critical to get a clean resting baseline.
- On-screen: a simple breathing guide (expanding/contracting circle) to standardize the baseline state. Display text: "Relax and breathe naturally. We're calibrating your session."
- Under the hood: capture mean HR, RMSSD, SDNN, frontal alpha asymmetry (AF7 vs AF8 alpha power ratio), and absolute alpha power. These become the **reference values** for the session.
- At the end of 60 seconds: display a simple readiness indicator (e.g., a calm-to-activated color spectrum showing where the user falls). No raw numbers. Keep it intuitive.

### Scenario Selection Screen

- Present the three scenarios as **visual cards** (a desk/office, a podium/audience, a social scene) with clear labels. Each card shows the three difficulty tiers as selectable sub-options (labeled "Comfortable Challenge," "Moderate Challenge," "Full Challenge"; avoid clinical language like "easy/hard").
- Recommendation engine: if this isn't the first session, suggest the next scenario/tier based on prior session data (e.g., "Last time you completed the moderate job interview, ready to try the full challenge?"). The participatory design study found that **user self-selection of difficulty** was key to engagement and outcomes.[4]

### During Exposure: Biofeedback Overlay

This is the most critical UX decision. The evidence supports **subtle, peripheral biofeedback** that doesn't break immersion:[9]

- **Primary indicator, ambient environmental cue:** a soft color wash at the very periphery of the visual field (e.g., edges of the VR environment subtly shift from cool blue/green toward warm amber/red as arousal increases). This leverages peripheral vision without requiring the user to look away from the social scene.
- **Secondary indicator, haptic pulse:** use Quest controller vibration to deliver a slow, rhythmic pulse matching a target breathing rate (~6 breaths/min, the resonance frequency used in HRV biofeedback). When the user's HR/HRV deviates significantly from baseline, the pulse gently activates as a cue to breathe with it. This is non-visual and non-distracting.[1]
- **EEG-driven adaptation:** use frontal alpha asymmetry as a **session-level metric** rather than a moment-to-moment display. If the asymmetry shifts strongly rightward (withdrawal/anxiety) and HRV drops simultaneously, this dual-signal confirmation can trigger a **gentle intervention**: e.g., the scenario briefly pauses, an NPC says something supportive, or a brief breathing prompt appears.

**What NOT to do:** avoid numerical dashboards, heart rate numbers, or graph overlays during exposure. These pull attention inward (self-focused attention), which is the exact cognitive pattern that maintains social anxiety.[6]

### Post-Exposure Phase

- **Immediate cooldown (60–90 sec):** return to the calming baseline environment. Display the breathing guide again. Capture post-exposure HR/HRV/EEG for comparison.
- **Cognitive reflection prompt:** display 2–3 simple questions consistent with CBT debrief principles:[10][11]
  - "What were you most worried would happen?"
  - "What actually happened?"
  - "What did you handle well?"

These can be multiple-choice or free-text (voice input via Quest microphone). This brief cognitive restructuring component is what differentiates therapeutic VRE from simple exposure.

- **Session summary:** show a simple before/during/after comparison; not raw data, but an intuitive visualization (e.g., three circles showing baseline calm, peak activation during scenario, and recovery state). Highlight progress across sessions.

---

## Session Protocol

Based on the effective protocols in the literature:[5][4][3]

### Single Session Structure (~20–30 min)

1. Baseline calibration: 60 sec
2. Scenario selection: 30 sec
3. Scenario briefing ("Here's what will happen"): 30 sec
4. Exposure: **8–15 min** (this is the therapeutic core)
5. Cooldown + physiology recovery: 60–90 sec
6. Cognitive reflection: 2–3 min
7. Session summary + next session recommendation: 1 min

### Program Structure

- Minimum **4 sessions** to expect meaningful anxiety reduction, based on the self-guided VRE pilot[5]
- Recommended: **8 sessions over 2–4 weeks**, consistent with the short-term self-training protocol that showed neural changes on fMRI[3]
- Allow flexible scheduling but encourage at minimum **2 sessions per week**: the effective protocols used 1–4 sessions/week[5][4][3]
- **Progression logic:** users can repeat any scenario/tier. Suggest advancing to the next tier when post-exposure HRV recovery time shortens and/or frontal alpha asymmetry normalizes faster compared to earlier sessions at the same tier.

### NPC Audio Design

NPCs should speak. Use pre-recorded or high-quality TTS audio for NPC dialogue. Key considerations:

- Build in **natural pauses** after NPCs speak: the silence is where anxiety peaks and where therapeutic exposure occurs
- Include ambient social audio (murmuring, laughter in background) scaled to difficulty tier
- NPCs should occasionally **look directly at the user**: gaze direction is a potent social anxiety trigger and a key exposure element[6]

---

## Technical Notes for Unity Build

- **Muse S to Unity pipeline:** use the Muse SDK or LSL (Lab Streaming Layer) to stream EEG and PPG into Unity in real time. Compute RMSSD on a rolling 30-second window during exposure (updated every 5 seconds). Compute alpha power and asymmetry using FFT on 2-second epochs.
- **NPC animation:** use blend shapes for facial expressions and gaze tracking (NPCs should look at the user's head position). Mixamo or Ready Player Me rigs work well on Quest.
- **Performance on Quest:** keep polygon counts low for large audience scenes; use LOD (level of detail) aggressively for background NPCs. Instanced rendering for 100+ audience members in the public speaking hard tier.
- **Data logging:** log all physiological streams time-synced with scenario events (NPC speech onset, user speech onset, difficulty transitions) for longitudinal tracking and potential research use.

---

Open follow-up: explore the specific EEG alpha asymmetry thresholds and HRV-based trigger logic for the adaptive difficulty system: what numerical cutoffs should drive the real-time scenario adjustments.

## References

1. The Effect of Heart Rate Variability Biofeedback Training on Stress and Anxiety: A Meta-Analysis. Goessl VC, Curtiss JE, Hofmann SG. Psychological Medicine. 2017;47(15):2578-2586. doi:10.1017/S0033291717001003.
2. Heart Rate Variability: Evaluating a Potential Biomarker of Anxiety Disorders. Tomasi J, Zai CC, Pouget JG, Tiwari AK, Kennedy JL. Psychophysiology. 2024;61(2):e14481. doi:10.1111/psyp.14481.
3. Neural Effects of a Short-Term Virtual Reality Self-Training Program to Reduce Social Anxiety. Kim MK, Eom H, Kwon JH, Kyeong S, Kim JJ. Psychological Medicine. 2022;52(7):1296-1305. doi:10.1017/S0033291720003098.
4. Effectiveness of a Participatory and Interactive Virtual Reality Intervention in Patients With Social Anxiety Disorder: Longitudinal Questionnaire Study. Kim HJ, Lee S, Jung D, et al. Journal of Medical Internet Research. 2020;22(10):e23024. doi:10.2196/23024.
5. Pilot Randomized Trial of Self-Guided Virtual Reality Exposure Therapy for Social Anxiety Disorder. Zainal NH, Chan WW, Saxena AP, Taylor CB, Newman MG. Behaviour Research and Therapy. 2021;147:103984. doi:10.1016/j.brat.2021.103984.
6. Look at the Audience? A Randomized Controlled Study of Shifting Attention From Self-Focus to Nonsocial vs. Social External Stimuli During Virtual Reality Exposure to Public Speaking in Social Anxiety. Wechsler TF, Pfaller M, van Eickels RE, Schulz LH, Mühlberger A. Frontiers in Psychiatry. 2021;12:751272. doi:10.3389/fpsyt.2021.751272.
7. 360° Video Virtual Reality Exposure Therapy for Public Speaking Anxiety: A Randomized Controlled Trial. Reeves R, Elliott A, Curran D, Dyer K, Hanna D. Journal of Anxiety Disorders. 2021;83:102451. doi:10.1016/j.janxdis.2021.102451.
8. Systematic Review and Meta-Analysis of Randomised Controlled Trials for Evaluating the Effectiveness of Virtual Reality Therapy for Social Anxiety Disorder. Wong KP, Lai CYY, Qin J. Journal of Affective Disorders. 2023;333:353-364. doi:10.1016/j.jad.2023.04.043.
9. Biofeedback-Based Connected Mental Health Interventions for Anxiety: Systematic Literature Review. Alneyadi M, Drissi N, Almeqbaali M, Ouhbi S. JMIR mHealth and uHealth. 2021;9(4):e26038. doi:10.2196/26038.
10. Virtual Reality Compared With Exposure in the Treatment of Social Anxiety Disorder: A Three-Arm Randomised Controlled Trial. Bouchard S, Dumoulin S, Robillard G, et al. The British Journal of Psychiatry: The Journal of Mental Science. 2017;210(4):276-283. doi:10.1192/bjp.bp.116.184234.
11. Third-Wave Therapy With Virtual Reality Exposure: Transdiagnostic Proof of Concept for the Treatment of Social Anxiety. Bravo MA, Binette MA, Lepage M, et al. Journal of Affective Disorders. 2025;:120898. doi:10.1016/j.jad.2025.120898.
