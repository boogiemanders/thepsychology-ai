# Session-by-Session Content Adaptation Framework for Integrated Chronic Pain Protocol

Complete session-by-session content adaptation system — the decision rules, data inputs, and specific content modifications that occur at each session based on the patient's evolving clinical, psychological, and biomarker profile.

---

## OVERARCHING ADAPTATION FRAMEWORK

The adaptation system operates on three timescales, drawing from the AI-CBT-CP REACT trial model (which used reinforcement learning to optimize session modality based on daily patient-reported data) and the process-based therapy framework (which advocates idiographic, dynamically addressed treatment based on ongoing contextually sensitive assessment). [1][2]

1. **Between-session adaptation (before each session):** Therapist reviews daily diary data, weekly questionnaire scores, and biofeedback session metrics to modify the upcoming session's content emphasis, difficulty level, and technique selection.
2. **Within-session adaptation (during each session):** Therapist adjusts in real time based on the patient's verbal reports, observed behavior, autonomic state (HRV if monitored), and emotional responses.
3. **Phase-transition adaptation (at decision points — Weeks 2, 5, 8, 12):** Formal reassessment determines whether to continue, augment, switch tracks, or advance to the next phase.

---

## DATA INPUTS FOR ADAPTATION

The following data streams feed the adaptation decisions, modeled on the REACT trial's daily IVR system and the CFT RESTORE trial's movement sensor biofeedback: [1][3]

### Daily (via app or brief IVR call, <3 min):

- NRS pain intensity (0-10)
- NRS pain interference (0-10, 2 BPI items: general activity + sleep)
- Mood (single item, 0-10)
- Fear of movement (single item: "How afraid were you today of physical activity hurting your body?" 0-10)
- Skill practice completion (yes/no + which skill: somatic tracking, breathing, defusion, etc.)
- Step count (wearable)

### Weekly (pre-session, via app, ~5 min):

- PCS-4 (Items 3, 6, 8, 11 — capturing helplessness, magnification, and rumination)
- CPAQ-2 (Items 9 + 14 — activity engagement and pain willingness)
- Single-item self-efficacy: "How confident are you that you can manage your pain and still do the things that matter to you?" (0-10)
- Single-item pain attribution: "How much do you believe your pain is caused by structural damage in your body?" (0-10)

### Per biofeedback session:

- HRV metrics (RMSSD, coherence ratio, breathing rate)
- EEG metrics (target band power, ratio, percentage time above threshold)

---

## PHASE 1 ADAPTATIONS (Sessions 1-4: VR Pain Neuroscience Education)

### Session 1 → Session 2 adaptation:

- If pain attribution score remains ≥7/10 after Session 1 (patient still strongly believes pain = tissue damage): Session 2 increases emphasis on the imaging reappraisal component. The therapist spends additional time with the patient's own MRI/X-ray, using the PRT physician evaluation model to provide personalized evidence that structural findings are age-normal. The VR spine module is extended with additional interactive demonstrations of asymptomatic structural findings. [4][5]
- If pain attribution drops to ≤4/10: The imaging review is abbreviated, and Session 2 shifts emphasis to somatic tracking practice, as the cognitive foundation is already shifting.
- If daily fear-of-movement score is ≥8/10: Session 2 adds a brief (5-min) guided relaxation in VR before the educational content, to reduce arousal and increase receptivity to new information. High fear states impair new learning. [6]

### Session 2 → Session 3 adaptation:

- If somatic tracking homework completion is <3 of 7 days: Session 3 begins with troubleshooting barriers to practice (time, forgetting, fear of attending to pain). The therapist normalizes difficulty and simplifies the practice to 2 min/day.
- If somatic tracking homework is completed ≥5 of 7 days AND patient reports noticing pain fluctuations: Session 3 can accelerate the fear hierarchy construction, as the patient is already developing observational capacity.

### Session 3 → Session 4 adaptation:

- If the fear hierarchy reveals ≥5 items rated >70/100 (high fear): Session 4 adds additional time on neuroplasticity content and recovered-patient testimonials to build hope and self-efficacy before entering the psychotherapy phase. The Schemer et al. single-case study found that psychoeducational sessions alone did not produce change — exposure elements were needed — so the therapist should explicitly frame Session 4 as preparation for active exposure work. [7]
- If the fear hierarchy reveals most items rated <40/100 (low fear): The patient may not need the full Phase 4 VR graded exposure sequence. Flag for potential abbreviated Phase 4 (4 sessions instead of 8), with earlier transition to real-world exposure.

### End of Phase 1 (Session 4) decision:

- Repeat PCS and TSK. If PCS has decreased ≥5 points AND TSK has decreased ≥4 points from baseline: Strong early cognitive shift. Proceed to Phase 2 as planned.
- If PCS and TSK are unchanged or increased: Consider whether the patient needs additional pain neuroscience education (add 1-2 sessions) or whether the educational approach is not resonating and a more experiential approach (direct exposure or emotional processing) should be prioritized in Phase 2. [7]

---

## PHASE 2 ADAPTATIONS (Sessions 5-12: Psychotherapy Core)

### Track A: Pain Reprocessing Therapy — Session-by-Session Adaptations

**Session 5 → Session 6:**

- If pain attribution score has dropped ≥3 points from baseline (patient is beginning to reattribute pain to brain processes): Session 6 deepens somatic tracking with more challenging body positions (standing, gentle walking) rather than seated-only practice. The Ashar et al. secondary analysis showed that reattribution to mind-brain processes was the key mediator of PRT's effects, accounting for the majority of treatment benefit. [5]
- If pain attribution is unchanged: Session 6 returns to personalized evidence for centralized pain, using new examples from the patient's own experience (e.g., "You mentioned your pain is worse when you're stressed at work — what does that tell you about whether this is a tissue problem?").
- If daily NRS pain has increased ≥2 points since Session 5: Normalize the increase as a common early-treatment phenomenon ("Your brain's alarm system is being challenged and may temporarily increase its signal"). Increase somatic tracking time in Session 6 and reduce cognitive content.

**Session 7 → Session 8:**

- If the patient successfully completed the low-fear movement with somatic tracking (fear rating dropped ≥3 points during the exercise): Progress to moderate-fear movements in Session 8 as planned.
- If the patient refused or was unable to attempt the movement: Do not force progression. Session 8 repeats the same movement with additional therapist scaffolding — the therapist demonstrates the movement first, then performs it alongside the patient. The inhibitory learning literature emphasizes that the goal is expectancy violation, not fear reduction per se — the patient needs to learn that the predicted catastrophe does not occur. [8][6]
- If the patient attempted the movement but fear did not decrease: This is actually acceptable under the inhibitory learning model. The therapist explicitly processes the expectancy violation: "You predicted 8/10 pain and injury. What actually happened?" Even if fear remains high, the discrepancy between prediction and outcome is the therapeutic ingredient. [6]

**Session 9 (Week 5 adaptive decision point):**

This is the critical mid-treatment assessment. The adaptation decisions here are the most consequential:

- Review weekly PCS-4 trajectory: Plot the 5 weekly PCS-4 scores. If the trajectory shows a clear downward slope (even if the absolute score is still elevated), this suggests the mechanism is engaged and the current track should continue.
- Review daily pain attribution scores: If pain attribution has shifted ≥3 points toward "mind/brain processes," PRT is working through its intended mechanism. [5]
- Review daily fear-of-movement scores: If fear scores are declining, the graded exposure component is effective.
- **If the patient is a clinical responder (≥30% BPI reduction):** Continue PRT. Sessions 10-12 shift emphasis from pain reappraisal to emotional processing and positive affect, as the pain-specific work is consolidating.
- **If partial responder (15-29% BPI reduction) with declining PCS/TSK:** Continue PRT AND begin biofeedback augmentation. The biofeedback provides a complementary bottom-up pathway while PRT continues top-down cognitive work.
- **If non-responder (<15% BPI reduction) with unchanged pain attribution:** Consider track switching. If the patient has significant trauma history (PCL-5 ≥33) or reports emotional suppression, switch to EAET (Track B). If the patient shows high behavioral disengagement and values disconnection, switch to ACT (Track C). The Lumley & Schubiner integrative model recommends a progression from cognitive approaches to emotional processing when cognitive approaches alone are insufficient. [9]

**Sessions 10-12 content adaptation based on Week 5 profile:**

- High catastrophizing persists (PCS ≥30) but fear is declining: Sessions 10-12 emphasize the helplessness subscale of the PCS — the component that uniquely predicts pain severity and interference beyond the other subscales. Specific interventions target helplessness cognitions ("There's nothing I can do") through mastery experiences and self-efficacy building. [10]
- Fear is declining but pain intensity is unchanged: This is expected — the Bontinck et al. single-case study found that fear reductions precede pain reductions, with fear declining in the first weeks while pain levels reduced later or remained unchanged. Reductions in fear were seen in 65% of patients, while pain reductions occurred in only 20% during the active treatment phase. The therapist normalizes this temporal dissociation and encourages continued exposure. [11]
- Emotional triggers identified (Session 8 diary reveals strong stress-pain correlations): Sessions 10-12 shift toward emotional processing — identifying and expressing suppressed emotions, particularly anger and grief. This represents a natural bridge toward EAET content within the PRT framework. [9]
- Sleep disturbance is the dominant interference domain (BPI sleep item ≥7): Sessions 10-12 add a sleep-specific module: stimulus control, sleep restriction, and cognitive restructuring of sleep-related catastrophizing. Poor sleep increases pain sensitivity and impairs new learning during exposure. [12]

### Track B: EAET — Session-by-Session Adaptations

**Session 5 → Session 6:**

- If the patient engaged emotionally during the Session 5 trial of emotional processing (reported feeling emotions in the body, showed visible affect): Session 6 proceeds with deeper psychoeducation and begins identifying specific adverse experiences.
- If the patient intellectualized or dissociated during emotional processing: Session 6 slows down. The therapist uses more grounding techniques (body scan, breathing) before attempting emotional engagement. Additional psychoeducation on the difference between "thinking about" emotions and "feeling" emotions is provided.

**Sessions 7-8 adaptation:**

- If the patient identifies a clear index trauma or unresolved conflict: Sessions 7-8 focus intensively on processing that specific experience. The therapist facilitates full emotional expression — anger, grief, fear — related to that event.
- If the patient reports diffuse emotional suppression without a clear index event: Sessions 7-8 use a broader approach — identifying patterns of emotional avoidance across relationships and life domains, rather than focusing on a single event.
- If the patient reports increased pain after emotional processing sessions: This is common and expected in EAET. The therapist normalizes it as the brain's alarm system responding to the emotional threat that is being uncovered. The Yarns et al. trial showed that EAET produced larger pain reductions than CBT despite this temporary increase, suggesting that emotional processing must be completed rather than avoided. [13]

**Sessions 9-12 adaptation:**

- If emotional processing is producing pain relief (NRS declining): Continue deepening emotional work. Sessions 10-12 can address additional unresolved conflicts or shift to assertiveness training and adaptive communication.
- If emotional processing is not producing pain relief but is producing mood improvement (PHQ-9 declining): Continue EAET — mood improvement often precedes pain improvement. Add somatic tracking from PRT to bridge emotional processing with pain-specific attention.
- If the patient is becoming destabilized (PHQ-9 increasing, suicidal ideation emerging): Pause deep emotional processing. Shift to stabilization: grounding techniques, safety planning, and consider psychiatric consultation. Resume emotional processing only when the patient is stabilized.

### Track C: ACT — Session-by-Session Adaptations

**Session 5 → Session 6:**

- If creative hopelessness resonated (patient acknowledges that control strategies have failed): Session 6 proceeds directly to values clarification.
- If the patient resists creative hopelessness ("But I haven't tried everything yet"): Session 6 revisits creative hopelessness with a more experiential approach — the therapist uses metaphors (e.g., "tug of war with a monster" — the solution is to drop the rope, not pull harder) and asks the patient to list every strategy they've tried and rate its long-term effectiveness.

**Sessions 7-8 adaptation:**

- If CPAQ-2 Activity Engagement is low but Pain Willingness is moderate: The patient is willing to have pain but isn't engaging in valued activities. Sessions 7-8 emphasize behavioral activation and committed action rather than acceptance exercises.
- If CPAQ-2 Pain Willingness is very low but Activity Engagement is moderate: The patient is active despite pain but is fighting against pain sensations. Sessions 7-8 emphasize acceptance and defusion exercises rather than behavioral activation. The CPAQ latent class analysis identified this "discrepant" profile as having intermediate functioning. [14]

**Sessions 9-12 adaptation:**

- If psychological flexibility is increasing (CPAQ-2 rising) but pain interference is unchanged: Continue ACT — the mechanism is engaged but behavioral change has not yet translated to functional improvement. Sessions 10-12 increase the dose of committed action with specific, measurable behavioral goals tied to identified values.
- If the patient is struggling with defusion (still fused with pain thoughts): Sessions 10-12 add more experiential defusion exercises and consider adding mindfulness meditation practice (10 min/day) as homework. The Burns et al. trial found that MBSR, CT, and BT all produced similar effects by session 6, suggesting that mindfulness components can be flexibly integrated. [15]

---

## PHASE 3 ADAPTATIONS (Sessions concurrent with Phase 2: Biofeedback)

### HRV Biofeedback Session Adaptations

- **Sessions 1-2:** Use the resonance frequency identified at baseline. If the patient cannot achieve coherence at the prescribed rate, test ±0.5 breaths/min adjustments.
- **Session 3:** If RMSSD has not increased from Session 1 baseline → reassess resonance frequency (RF is unstable in 67% of individuals). Test 3 new breathing rates and select the one producing the highest HRV amplitude. [16]
- **Session 4:** The minimum effective dose threshold. If RMSSD has increased and breathing rate has decreased compared to Session 1 → the patient is responding. If not → add VR immersion to enhance engagement (the Cuneo et al. combined biofeedback-VR study showed enhanced effects with VR augmentation). [17][8]
- **Sessions 5-8:** Progressive reduction of visual pacer reliance. Session 5: pacer visible 75% of the time. Session 6: 50%. Session 7: 25%. Session 8: no pacer — patient breathes at RF from memory. This trains autonomous self-regulation.
- If the patient reports using RF breathing during pain flares (daily diary): Reinforce this as a key self-management skill. Track whether flare-associated pain ratings are lower on days when RF breathing was used.

### EEG Neurofeedback Session Adaptations

- **Sessions 1-3:** Establish baseline learning curve. The threshold for reward is set at the 60th percentile of the patient's own baseline distribution (i.e., the patient receives reward when their target ratio exceeds their own 60th percentile, not an absolute value).
- **Session 4:** Adjust threshold. If the patient is achieving reward >70% of the time → increase threshold to 65th percentile (make it harder). If achieving reward <30% of the time → decrease threshold to 55th percentile (make it easier). The goal is ~50-60% reward rate to maintain engagement and learning. [18][19]
- **Sessions 5-8:** Introduce "transfer trials" — 2-minute blocks without feedback where the patient attempts to maintain the trained state. If transfer trial performance is ≥80% of feedback trial performance → the patient is learning self-regulation. If <50% → increase feedback training time and reduce transfer trials.
- If the patient shows increased alpha fractional occupancy and dwell time during training: This is the strongest predictor of clinical response. Reinforce and continue the current protocol. [20]
- If the patient shows no EEG learning after 6 sessions: Consider switching the neurofeedback protocol (e.g., from alpha upregulation to SMR upregulation, or from β1/β2 ratio to α/θ ratio). The Mussigmann et al. trial found that different patients responded to different protocols. [18]

---

## PHASE 4 ADAPTATIONS (Sessions 13-20: VR Graded Movement Exposure)

### Session-to-session VR environment progression rules:

The progression through VR environments is not fixed — it is adapted based on the patient's fear hierarchy scores and within-session performance:

- **Advancement criterion:** The patient advances to the next VR environment when they complete the current environment's movement demands with a post-session fear rating ≤3/10 AND predicted-vs-actual harm discrepancy ≥4 points (i.e., they predicted much more harm than occurred). This ensures genuine expectancy violation has occurred. [8][6]
- **Repetition criterion:** If post-session fear remains ≥6/10 OR the patient used safety behaviors (e.g., bracing, breath-holding, moving very slowly), the same environment is repeated with modifications: (a) the therapist provides more active coaching, (b) the movement demands are slightly reduced, and (c) the patient explicitly states their prediction before each movement and rates the outcome after.
- **Acceleration criterion:** If the patient completes an environment with fear ≤2/10 and no safety behaviors on the first attempt, skip the next environment and advance two levels. Some patients will complete Phase 4 in 5-6 sessions rather than 8.
- **Deceleration criterion:** If the patient experiences a pain flare (NRS increase ≥3 points from pre-session) during a VR session, the next session returns to the previous (easier) environment and adds 5 min of HRV biofeedback breathing before movement begins. The flare is explicitly processed: "Your brain sent a stronger alarm signal. That doesn't mean damage occurred. Let's check — did anything actually change in your body?"

### Within-session VR adaptations:

- If HRV coherence drops sharply during a movement (indicating autonomic threat response): The VR environment subtly shifts to a calming state (lighting softens, ambient sounds become more soothing) and a breathing pacer appears briefly. The patient takes 3 resonance-frequency breaths before continuing. This integrates the Phase 3 biofeedback skill into the exposure context.
- If the patient spontaneously increases movement range beyond the game's requirements (e.g., bending deeper than needed to pick up a virtual object): The game provides bonus rewards (extra points, hidden collectibles) to reinforce exploratory movement behavior. This is consistent with the inhibitory learning recommendation to reinforce approach behaviors. [6]
- If the patient verbalizes catastrophic predictions during gameplay ("I shouldn't bend that far"): The therapist uses this as a real-time somatic tracking opportunity: "Notice that thought. Now notice what your body is actually telling you. Is there danger, or is there sensation?"

### Session 19 (Mixed Reality) specific adaptations:

- The activities performed in mixed reality are selected from the patient's personal fear hierarchy (built in Session 3), not from a standardized list. The top 5 most-feared real-world activities are targeted.
- If the patient has already achieved significant fear reduction in VR (TSK decreased ≥10 points from baseline), Session 19 can be conducted without the VR overlay — proceeding directly to real-world exposure with wearable HRV monitoring only.
- If the patient remains highly fearful (TSK decreased <5 points), Session 19 maintains full VR overlay with coaching prompts and HRV biofeedback integration.

### Session 20 (Graduation) specific adaptations:

- The "Movement Confidence Card" is personalized based on the patient's specific fear hierarchy. It lists each feared activity, the patient's original fear rating, and their final fear rating after completing it, along with the actual pain experienced. This creates a concrete, portable reminder of expectancy violations.
- If the patient has not achieved ≥30% BPI reduction by Session 20, the graduation session includes a collaborative discussion about maintenance needs: additional booster sessions, continued home VR practice, or referral for additional treatment (e.g., interdisciplinary pain rehabilitation).

---

## PHASE 5 ADAPTATIONS (Weeks 13-16: Maintenance)

### Home VR content selection is adaptive

The app recommends daily VR content based on the patient's daily diary data, modeled on the AI-CBT-CP reinforcement learning approach: [1]

- If daily pain is elevated (NRS ≥6): Recommend the **Flare Management** module (guided breathing + somatic tracking in calming VR environment).
- If daily fear-of-movement is elevated (≥5/10): Recommend a **Movement Maintenance** game at the patient's current comfort level.
- If daily mood is low (≤3/10): Recommend a **Relaxation** environment with guided self-compassion meditation.
- If all metrics are stable/good: Recommend a **Pain Neuroscience Refresher** or a progressive **Movement Maintenance** game at a higher difficulty level.

### Booster session adaptations (Weeks 14 and 16):

- If the patient is maintaining gains (BPI within 1 point of Week 12 score): Booster session is brief (15 min), focused on reinforcement and troubleshooting any emerging barriers.
- If the patient is showing regression (BPI increased ≥2 points from Week 12): Booster session is extended (45 min) and includes: (a) identification of the regression trigger (life stressor, pain flare, return of catastrophizing), (b) review and practice of the most effective skill from treatment, and (c) adjustment of the home VR practice schedule. This mirrors the CFT RESTORE booster session design, which was added specifically because previous studies showed reduction in treatment effects between 6 and 12 months without it. [3][21]
- If daily diary data shows the patient has stopped practicing skills (skill practice <2 days/week for 2 consecutive weeks): The app sends an automated motivational message and the therapist contacts the patient proactively to troubleshoot engagement barriers. The REACT trial found that patients who missed >4 daily calls in a week were automatically assigned a live session. [1]

---

## CROSS-PHASE ADAPTATION: TRACK SWITCHING RULES

| Trigger | From → To | Rationale | Refs |
|---|---|---|---|
| PRT non-response (Week 5) + high PCL-5 / trauma history | PRT → EAET | Emotional processing pathway over reattribution | [13][9] |
| PRT non-response (Week 5) + low CPAQ / behavioral disengagement | PRT → ACT | Psychological flexibility pathway | [22][23] |
| EAET destabilization (PHQ-9 rising, SI emerging) | EAET → stabilization (CBT/grounding) | Safety first; resume when stable | [13] |
| ACT non-response with high catastrophizing | ACT → PRT | Reattribution may unlock fused beliefs | [4][5] |
| Any track non-response + fear-avoidance dominant | Add VR graded exposure earlier | Expectancy violation as primary mechanism | [8][6] |
| Any track non-response + autonomic dysregulation severe | Add HRV biofeedback (or earlier in fibromyalgia) | Bottom-up regulation complement | [2][24] |

---

## IMPORTANT CAVEATS

This adaptation system synthesizes principles from multiple evidence-based frameworks: the AI-CBT-CP REACT trial's reinforcement learning approach to session modality optimization, the CFT RESTORE trial's individualized clinical reasoning framework, the inhibitory learning model's recommendations for optimizing exposure, and the process-based therapy framework's call for idiographic, dynamically addressed treatment. [1][3][6][2][25] However, the specific adaptation rules proposed here — particularly the quantitative thresholds for track switching, VR environment progression, and biofeedback protocol modification — are proposed decision rules that have not been prospectively validated. The Hofmann et al. protocol for personalizing CBT using network analysis represents the closest methodological approach to what is proposed here, but that study is still in progress. [26] The most robust adaptation element is the Week 5 clinical response threshold (≥30% BPI reduction), which has been validated across multiple large RCTs. [27][28][29]

---

## References

1. Piette JD, Newman S, Krein SL, et al. Patient-Centered Pain Care Using Artificial Intelligence and Mobile Health Tools: A Randomized Comparative Effectiveness Trial. JAMA Internal Medicine. 2022;182(9):975-983. doi:10.1001/jamainternmed.2022.3178.
2. McCracken LM. Personalized Pain Management: Is It Time for Process-Based Therapy for Particular People With Chronic Pain? European Journal of Pain (London, England). 2023;27(9):1044-1055. doi:10.1002/ejp.2091.
3. Kent P, Haines T, O'Sullivan P, et al. Cognitive Functional Therapy With or Without Movement Sensor Biofeedback Versus Usual Care for Chronic, Disabling Low Back Pain (RESTORE): A Randomised, Controlled, Three-Arm, Parallel Group, Phase 3, Clinical Trial. Lancet (London, England). 2023;401(10391):1866-1877. doi:10.1016/S0140-6736(23)00441-5.
4. Ashar YK, Gordon A, Schubiner H, et al. Effect of Pain Reprocessing Therapy vs Placebo and Usual Care for Patients With Chronic Back Pain: A Randomized Clinical Trial. JAMA Psychiatry. 2022;79(1):13-23. doi:10.1001/jamapsychiatry.2021.2669.
5. Ashar YK, Lumley MA, Perlis RH, et al. Reattribution to Mind-Brain Processes and Recovery From Chronic Back Pain: A Secondary Analysis of a Randomized Clinical Trial. JAMA Network Open. 2023;6(9):e2333846. doi:10.1001/jamanetworkopen.2023.33846.
6. Gatzounis R, den Hollander M, Meulders A. Optimizing Long-Term Outcomes of Exposure for Chronic Primary Pain From the Lens of Learning Theory. The Journal of Pain. 2021;22(11):1315-1327. doi:10.1016/j.jpain.2021.04.012.
7. Schemer L, Vlaeyen JWS, Doerr JM, et al. Treatment Processes During Exposure and Cognitive-Behavioral Therapy for Chronic Back Pain: A Single-Case Experimental Design With Multiple Baselines. Behaviour Research and Therapy. 2018;108:58-67. doi:10.1016/j.brat.2018.07.002.
8. den Hollander M, Smeets RJEM, van Meulenbroek T, et al. Exposure in Vivo as a Treatment Approach to Target Pain-Related Fear: Theory and New Insights From Research and Clinical Practice. Physical Therapy. 2022;102(2):pzab270. doi:10.1093/ptj/pzab270.
9. Lumley MA, Schubiner H. Psychological Therapy for Centralized Pain: An Integrative Assessment and Treatment Model. Psychosomatic Medicine. 2019;81(2):114-124. doi:10.1097/PSY.0000000000000654.
10. Craner JR, Gilliam WP, Sperry JA. Rumination, Magnification, and Helplessness: How Do Different Aspects of Pain Catastrophizing Relate to Pain Severity and Functioning? The Clinical Journal of Pain. 2016;32(12):1028-1035. doi:10.1097/AJP.0000000000000355.
11. Bontinck J, den Hollander M, Kaas AL, De Jong JR, Timmers I. Individual Patterns and Temporal Trajectories of Changes in Fear and Pain During Exposure in Vivo: A Multiple Single-Case Experimental Design in Patients With Chronic Pain. Journal of Clinical Medicine. 2022;11(5):1360. doi:10.3390/jcm11051360.
12. Cohen SP, Vase L, Hooten WM. Chronic Pain: An Update on Burden, Best Practices, and New Advances. Lancet (London, England). 2021;397(10289):2082-2097. doi:10.1016/S0140-6736(21)00393-7.
13. Yarns BC, Jackson NJ, Alas A, et al. Emotional Awareness and Expression Therapy vs Cognitive Behavioral Therapy for Chronic Pain in Older Veterans: A Randomized Clinical Trial. JAMA Network Open. 2024;7(6):e2415842. doi:10.1001/jamanetworkopen.2024.15842.
14. Rovner G, Vowles KE, Gerdle B, Gillanders D. Latent Class Analysis of the Short and Long Forms of the Chronic Pain Acceptance Questionnaire: Further Examination of Patient Subgroups. The Journal of Pain. 2015;16(11):1095-105. doi:10.1016/j.jpain.2015.07.007.
15. Burns JW, Jensen MP, Thorn B, et al. Cognitive Therapy, Mindfulness-Based Stress Reduction, and Behavior Therapy for the Treatment of Chronic Pain: Randomized Controlled Trial. Pain. 2022;163(2):376-389. doi:10.1097/j.pain.0000000000002357.
16. Flynn D, Eaton LH, Langford DJ, et al. A SMART Design to Determine the Optimal Treatment of Chronic Pain Among Military Personnel. Contemporary Clinical Trials. 2018;73:68-74. doi:10.1016/j.cct.2018.08.008.
17. De Paepe AL, Crombez G, Martin KR, Bennett DLH, Scott W. An Analysis of the Relevance of the Brief Pain Inventory Interference Items for Measuring Pain-Related Disability. The Journal of Pain. 2025;:105588. doi:10.1016/j.jpain.2025.105588.
18. Window P, McGrath M, Harvie DS, et al. Pain Education and Virtual Reality Improves Pain, Pain-Related Fear of Movement, and Trunk Kinematics in Individuals With Persistent Low Back Pain. The Clinical Journal of Pain. 2024;40(8):478-489. doi:10.1097/AJP.0000000000001221.
19. MacIntyre E, Sigerseth M, Larsen TF, et al. Get Your Head in the Game: A Replicated Single-Case Experimental Design Evaluating the Effect of a Novel Virtual Reality Intervention in People With Chronic Low Back Pain. The Journal of Pain. 2023;24(8):1449-1464. doi:10.1016/j.jpain.2023.03.013.
20. Kroenke K, Krebs EE, Wu J, et al. Telecare Collaborative Management of Chronic Pain in Primary Care: A Randomized Clinical Trial. JAMA. 2014;312(3):240-8. doi:10.1001/jama.2014.7689.
21. Hancock M, Smith A, O'Sullivan P, et al. Cognitive Functional Therapy With or Without Movement Sensor Biofeedback Versus Usual Care for Chronic, Disabling Low Back Pain (RESTORE): 3-Year Follow-Up of a Randomised, Controlled Trial. The Lancet Rheumatology. 2025;7(11):e789-e798. doi:10.1016/S2665-9913(25)00135-3.
22. Weiss ES, Zamir O. Novel Psychotherapy Approaches for Patients With Chronic Noncancer Pain: Effective Modalities Relevant to Family Practice. Canadian Family Physician. 2025;71(10):629-634. doi:10.46747/cfp.7110629.
23. McCracken LM, Yu L, Vowles KE. New Generation Psychological Treatments in Chronic Pain. BMJ (Clinical Research Ed.). 2022;376:e057212. doi:10.1136/bmj-2021-057212.
24. Boersma K, Södermark M, Hesser H, et al. Efficacy of a Transdiagnostic Emotion-Focused Exposure Treatment for Chronic Pain Patients With Comorbid Anxiety and Depression: A Randomized Controlled Trial. Pain. 2019;160(8):1708-1718. doi:10.1097/j.pain.0000000000001575.
25. Scholten S, Glombiewski JA. Enhancing Psychological Assessment and Treatment of Chronic Pain: A Research Agenda for Personalized and Process-Based Approaches. Current Opinion in Psychology. 2025;62:101958. doi:10.1016/j.copsyc.2024.101958.
26. Hofmann VE, Glombiewski JA, Kininger F, Scholten S. How to Personalise Cognitive-Behavioural Therapy for Chronic Primary Pain Using Network Analysis: Study Protocol for a Single-Case Experimental Design With Multiple Baselines. BMJ Open. 2024;14(12):e089319. doi:10.1136/bmjopen-2024-089319.
27. Čeko M, Baeuerle T, Webster L, Wager TD, Lumley MA. The Effects of Virtual Reality Neuroscience-Based Therapy on Clinical and Neuroimaging Outcomes in Patients With Chronic Back Pain: A Randomized Clinical Trial. Pain. 2024;165(8):1860-1874. doi:10.1097/j.pain.0000000000003198.
28. France CR, Thomas JS. Virtual Immersive Gaming to Optimize Recovery (VIGOR) in Low Back Pain: A Phase II Randomized Controlled Trial. Contemporary Clinical Trials. 2018;69:83-91. doi:10.1016/j.cct.2018.05.001.
29. Eccleston C, Fisher E, Liikkanen S, et al. A Prospective, Double-Blind, Pilot, Randomized, Controlled Trial of an "Embodied" Virtual Reality Intervention for Adults With Low Back Pain. Pain. 2022;163(9):1700-1715. doi:10.1097/j.pain.0000000000002617.
