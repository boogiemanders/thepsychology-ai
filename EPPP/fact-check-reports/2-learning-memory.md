# Fact-Check Report - Domain: Learning and Memory

Method: each lesson's checkable claims verified against OpenEvidence (citation-backed). Tiers: FACTUAL-WRONG (incorrect), MISLEADING (defensible but could mislead), JUDGMENT (diverges from literature but may be the EPPP-accepted answer). Report-only; no lesson/question files edited. When fixes are approved, matching lessonExcerpt quotes in questionsGPT get synced in the same edit.

Note on coverage: most Learning and Memory content is non-clinical learning theory (Pavlov, Skinner, Atkinson-Shiffrin, Baddeley, schedules, mnemonics). These are universally accepted textbook facts verified against standard references (high confidence, not separately OE-queried). OE was used for the clinical/biological claims (stress neurobiology, exposure therapy outcomes, EMDR).

---

## 2-pavlov-and-classical-conditioning.md
URL: /resources/topics/2-cognitive-affective-bases/classical-conditioning

Verified against standard references (high confidence, not separately OE-queried): US/UR/CS/CR definitions; CR weaker than UR; the four conditioning procedures (delay, trace, simultaneous, backward) and their relative effectiveness; extinction, spontaneous recovery, internal inhibition; stimulus generalization and discrimination; Little Albert (Watson, ~9-month-old, white rat + loud noise, generalization to furry objects); experimental neurosis; conditioned inhibition; higher-order conditioning; blocking (Rescorla-Wagner) and overshadowing; taste aversion as one-trial learning with long delay. These are standard, accurate behavioral-learning facts.

### Finding 1 - JUDGMENT
**Claim (Four Conditioning Procedures table + Key Takeaways):** "Delay Conditioning ... MOST EFFECTIVE, especially with about 0.5 second delay" / "the optimal procedure is delay conditioning with about 0.5-second overlap."
**OE verdict:** Not OE-queried (pure learning theory). The "~0.5 second" optimal interval is real but comes specifically from eyeblink/short-latency reflex conditioning. It is not a universal constant across all responses (autonomic and taste-aversion conditioning use very different optimal intervals). As a general "delay conditioning is most effective" statement it is the standard EPPP-accepted teaching, so flag as JUDGMENT, not an error.
**Suggested fix (lesson-voice):** Optional clarity tweak only: "Delay conditioning usually works best. For fast reflexes like an eye blink, a short gap of about half a second between the CS starting and the US works best. Other kinds of learning use different timing."

**Excerpt sync:** if changed, grep questionsGPT for excerpts quoting the "0.5 second" line.

No factual errors found; all checked claims accurate.

---

## 2-memory.md
URL: /resources/topics/2-cognitive-affective-bases/memory-and-forgetting

Verified against standard references (high confidence, not separately OE-queried): Atkinson-Shiffrin multi-store model (1968); iconic ~0.5 s, echoic ~2-4 s sensory memory; short-term ~20 s without rehearsal, Miller 7±2; chunking; Baddeley working memory (central executive, phonological loop, visuo-spatial sketchpad, episodic buffer); procedural/declarative, semantic/episodic, explicit/implicit, retrospective/prospective; priming preserved in amnesia; DRM false-memory paradigm; Loftus lost-in-the-mall and imagination inflation; reconstructive memory; trace decay vs interference (proactive/retroactive); elaborative rehearsal and semantic encoding; serial position effect (primacy/recency); encoding specificity, context- and state-dependent learning; testing effect (Dunlosky 2013 high-utility); Tolman latent learning/cognitive maps; Kohler insight (Sultan); Bandura Bobo doll, four observational-learning processes (attention, retention, production/reproduction, motivation), learning vs performance, coping vs mastery models. All accurate.

### Finding 1 - JUDGMENT
**Claim (Common Misconceptions):** "Working memory and short-term memory are different systems ... Reality: Working memory is part of short-term memory. It's the active processing component."
**OE verdict:** Not OE-queried (pure cognitive theory). This is the classic EPPP-accepted framing. Note that in Baddeley's own model, working memory largely replaced the older unitary short-term store rather than being a sub-part of it, so some textbooks treat them as competing models, not nested. Defensible as written for the EPPP; flag JUDGMENT only.
**Suggested fix (lesson-voice):** None needed for the exam. The current framing matches standard EPPP prep.

No factual errors found; all checked claims accurate.

---

## 2-skinner-and-operant-conditioning.md
URL: /resources/topics/2-cognitive-affective-bases/operant-conditioning

Verified against standard references (high confidence, not separately OE-queried): Thorndike puzzle boxes (1898, cats, trial-and-error) and law of effect; Skinner (1938) operant conditioning; four consequences (positive/negative reinforcement, positive/negative punishment); continuous vs intermittent schedules; FI (scalloping, low rate), VI (steady moderate), FR (high steady with post-reinforcement pause), VR (highest rate, most resistant to extinction); extinction and extinction burst; thinning; behavioral contrast (positive/negative); matching law; primary/secondary/generalized reinforcers; stimulus control, SD and S-delta; two-factor learning; prompts and fading; escape vs avoidance conditioning (avoidance highly resistant to extinction); superstitious behavior (Skinner's pigeons, food every 15 s); response vs stimulus generalization; habituation and limits of punishment. All accurate and consistent with standard behavioral references.

No factual errors found; all checked claims accurate.

---

## 2-classical-conditioning-interventions.md
URL: /resources/topics/2-cognitive-affective-bases/interventions-based-on-classical-conditioning

Verified against standard references (high confidence, not separately OE-queried): extinction vs counterconditioning framing; exposure with response prevention; flooding vs graded exposure; in vivo / VR / imaginal formats (in vivo generally most effective); safety-behavior debate; cue exposure for SUD; implosive therapy (imaginal flooding + psychodynamic, now rarely used); systematic desensitization (Wolpe, reciprocal inhibition, three steps); dismantling studies suggesting extinction is the active mechanism; aversion therapy, covert sensitization, relief scene; ethical limits on aversive methods. These are accurate.

### Finding 1 - JUDGMENT (with a MISLEADING sub-claim)
**Claim (Exposure with Response Prevention, EPPP tip + Misconception 3 + Key Takeaways):** "Research shows that prolonged exposure (e.g., 45 minutes) is more effective than multiple, briefer periods of exposure, which can actually make the fear worse" and "anxiety must decrease before the session ends" / "If they bail while still panicking, you've just reinforced that the situation is dangerous."
**OE verdict:** This is the older emotional-processing / within-session-habituation model. Current evidence: single longer-session and multiple shorter-session exposure produce equivalent (large) outcomes; within-session habituation is NOT required and does not reliably predict long-term outcome. The dominant modern framework (Craske inhibitory learning) ends exposures on expectancy violation, not on anxiety dropping. So:
- "Prolonged is more effective than briefer" = JUDGMENT (this is the traditional EPPP-taught view; the exam may still score it correct, but it diverges from current literature).
- "Briefer exposure can actually make the fear worse" = MISLEADING (not consistently supported; old EPT concern, not a robust finding).
*Cite: Odgers 2022 Behav Res Ther meta-analysis (single vs multi-session equivalent); Craske 2022 Behav Res Ther (inhibitory learning, expectancy violation); Foa 2006 deemphasized within-session habituation.*
**Suggested fix (lesson-voice):** Keep the EPPP-tested point but soften the overclaim: "Older research said one long exposure (like 45 minutes) works better than several short ones, and the EPPP may still test it that way. Newer research is more mixed: short and long sessions can work about equally well, and the key is that the feared bad thing does not happen (the client's scary prediction gets proven wrong), not just that their anxiety drops during the session."

**Excerpt sync:** grep questionsGPT for excerpts quoting "45 minutes," "prolonged exposure," or "make the fear worse."

### Finding 2 - No issue (EMDR)
**Claim (EMDR section):** EMDR is evidence-based for PTSD, works as well as other evidence-based PTSD treatments, and the role of the eye movements is genuinely debated with mixed dismantling results; based on Shapiro's adaptive information processing model.
**OE verdict:** Confirmed accurate. EMDR is a first-line PTSD treatment (VA/DoD 2023, international guidelines), efficacy comparable to trauma-focused CBT, and whether eye movements are a necessary active ingredient remains unresolved (dismantling studies mixed).
*Cite: Schnurr 2024 Ann Intern Med (VA/DoD 2023 CPG); Wright 2024 Psychol Med IPD meta-analysis; APA 2025 PTSD CPG.*

---

## 2-operant-conditioning-interventions.md
URL: /resources/topics/2-cognitive-affective-bases/interventions-based-on-operant-conditioning

Verified against standard references (high confidence, not separately OE-queried): functional behavioral assessment (FBA) steps; shaping (successive approximations, intermediate steps drop out) vs chaining (task analysis, forward/backward, steps remain); backward chaining often more motivating; Premack principle; punishment-effectiveness rules (max intensity first, certain, immediate, punish early in chain); overcorrection (restitution + positive practice); response cost (specific reinforcer removed); time out from positive reinforcement (1-10 min, ~1 min/year of age, immediate, consistent, end on compliance, pair with reinforcement, escape-maintained caution); extinction, extinction burst, spontaneous recovery; differential reinforcement DRI/DRA/DRO/DRL; function-matched intervention logic. All accurate and consistent with applied behavior analysis references.

No factual errors found; all checked claims accurate.

---

## 2-stress-and-emotion.md
URL: /resources/topics/2-cognitive-affective-bases/emotions-and-stress
(Note: this lesson's frontmatter lists "domain: 1: Biological Bases" but the file lives in the Learning and Memory folder. Content is biological-bases material. Not a factual error, just a placement/tagging note.)

Verified against standard references (high confidence, not separately OE-queried): limbic structures (amygdala threat detection, hippocampus context/spatial memory, hypothalamus autonomic/endocrine control, PFC top-down regulation, ACC conflict/pain overlap, insula interoception); SAM (fast: epinephrine/norepinephrine from adrenal medulla) vs HPA axis (CRH -> ACTH -> cortisol from adrenal cortex); cortisol negative feedback; neurotransmitters (NE/locus coeruleus, serotonin, GABA/benzodiazepines at GABA-A, dopamine/mesolimbic, glutamate/excitotoxicity); ANS sympathetic vs parasympathetic effects, vagus nerve and vagal tone; James-Lange, Cannon-Bard, Schachter-Singer two-factor (epinephrine confederate studies); Porges polyvagal theory; cortisol diurnal rhythm (morning peak); SAM-HPA interaction (NE stimulates CRH). All accurate.

OE-checked the biological stress claims below.

### Finding 1 - No issue (hippocampal damage / volume)
**Claim (Chronic Stress):** "Elevated cortisol can be toxic to hippocampal neurons, particularly in the CA3 region ... reduced hippocampal volume in people with chronic PTSD and major depression."
**OE verdict:** Confirmed. Sustained glucocorticoids cause CA3 dendritic atrophy and can progress to neuronal loss; reduced hippocampal volume is well-replicated in both PTSD (large ENIGMA-PGC meta-analysis) and recurrent MDD.
*Cite: McEwen 1998 NEJM; Sapolsky 2000 Arch Gen Psychiatry; Belleau 2019 Biol Psychiatry.*

### Finding 2 - No issue (blunted cortisol in PTSD)
**Claim (PTSD section):** PTSD shows "altered HPA axis function (often blunted cortisol response)."
**OE verdict:** Confirmed. Morning and 24-hour cortisol are lower in PTSD; cortisol response to stress is blunted; mechanism is enhanced glucocorticoid-receptor sensitivity with exaggerated negative feedback. (Correctly contrasted with elevated cortisol in depression elsewhere in the lesson.)
*Cite: Schumacher 2019 Neurosci Biobehav Rev; Pan 2020 PLoS One; Morris 2012 Clin Psychol Rev.*

### Finding 3 - No issue (BDNF)
**Claim (Chronic Stress / Depression):** "Chronic stress reduces brain-derived neurotrophic factor (BDNF)."
**OE verdict:** Confirmed. Chronic stress downregulates BDNF in hippocampus and PFC (region-dependent: down in CA3, up in basolateral amygdala); higher chronic stress predicts lower basal BDNF in humans.
*Cite: Gray 2013 Neuroscience; Benarroch 2025 Neurology; Herhaus 2024 Psychoneuroendocrinology.*

No factual errors found; all checked claims accurate.
