# Fact-Check Report, Domain 1: Biopsychology (Neuroscience & Pharmacology)

Method: each lesson's checkable factual claims verified against OpenEvidence (Ask OE Light w/ citations). Findings tiered:
- **FACTUAL-WRONG**, claim is incorrect; should be fixed.
- **MISLEADING**, technically defensible but oversimplified in a way that could mislead.
- **JUDGMENT**, diverges from current literature but may be the EPPP-tested/accepted answer. Your call.

Report-only. No lesson or question files edited yet. When you approve fixes, matching `lessonExcerpt` quotes in questionsGPT get synced in the same edit.

---

## 1-cerebral-cortex.md, DONE (already fixed, commit c133374)
Frontal-lobe size, valence-model caveat, smell laterality. No further action.

---

## 1-hindbrain-midbrain-forebrain.md
URL: /resources/topics/1-biological-bases/brain-regions-functions-hindbrain-midbrain-and-subcortical-forebrain

### Finding 1, FACTUAL-WRONG
**Claim (line 34):** "Cranial nerve XII (hypoglossal nerve) originates in the medulla. Damage to this nerve causes articulation problems similar to those seen in **Broca's aphasia**."

**OE verdict:** Wrong terminology. CN XII damage causes **dysarthria**, a motor speech disorder (tongue weakness/atrophy → slurred, imprecise articulation), NOT aphasia. Broca's aphasia is a *language* deficit (impaired formulation/production from cortical damage), a fundamentally different thing. A CN XII patient still comprehends, picks words, and builds grammatical sentences; only mechanical execution fails.
*Cite: Yu YJ et al., Muscle & Nerve 2016; Stino AM et al., Muscle & Nerve 2016.*

**Suggested fix (lesson-voice):** "Damage to this nerve makes speech slurred and hard to form because the tongue muscles get weak. This is called **dysarthria**. It's a movement problem, not a language problem like Broca's aphasia."

**Excerpt sync:** grep questionsGPT Biopsychology for any excerpt quoting this line before applying.

### Finding 2, JUDGMENT
**Claim (line 57):** cerebellum "provides **excitatory inputs**" for smooth movement while basal ganglia "are **inhibitory**."

**OE verdict:** Oversimplified. NET cerebellar output (deep cerebellar nuclei → thalamus) *is* excitatory and NET basal ganglia output (GPi/SNr) *is* inhibitory, so the lesson's framing is defensible at the EPPP level. But both systems actually use mixed excitatory/inhibitory signaling (cerebellar Purkinje cells are inhibitory; the basal ganglia direct pathway facilitates movement via disinhibition).
*Cite: Benarroch, Neurology 2024; Calabresi et al., Nature Neuroscience 2014.*

**Suggested fix (optional):** add "net", "the cerebellum's *net output* is excitatory ... basal ganglia *net output* is inhibitory." Low priority; current text is EPPP-acceptable. Your call.

---

## 1-memory-and-sleep.md
URL: /resources/topics/1-biological-bases/memory-and-sleep

Verified H.M. case, Kandel/Aplysia, LTP, sleep stages (N1-N3/REM), 90-min cycles, REM-lengthens/N3-shortens across night, infant REM-first reversal, all accurate.

### Finding 1, JUDGMENT
**Claim (lines 155, 176):** "Older adults **don't actually need less sleep** than younger adults", framed as a "critical point that surprises many students."

**OE verdict:** This is the *dominant* teaching framework and guideline-supported (AASM/NSF/CDC recommend ~7-8h for 65+, essentially same as younger adults). But it's an actively debated question, not settled fact, some actigraphy/wearable data show small reductions or no shortfall in healthy elders. The age-related architecture changes the lesson lists (less N3, advanced phase, more awakenings, less REM) are all firmly correct.
*Cite: AASM/SRS Consensus 2015; Mander et al., Neuron 2017; Evans et al., Sleep 2021.*

**Suggested fix (optional):** soften the absolute, "The dominant view is that older adults need about the same total sleep but have more trouble obtaining it (though this remains debated)." EPPP-acceptable as-is. Your call. No factual error.

---

## 1-neurons-and-neurotransmitters.md
URL: /resources/topics/1-biological-bases/nervous-system-neurons-and-neurotransmitters

Verified PNS/ANS divisions, sympathetic/parasympathetic cooperation, all-or-none action potentials, neuroplasticity types, dopamine hypothesis (revised), ACh/nicotinic-muscarinic, GABA/serotonin/NE associations, agonist-antagonist table, hyperserotonemia in autism, all accurate EPPP content.

### Finding 1, FACTUAL-WRONG
**Claim (line 22):** spinal cord injury facts: "Damage at C6-C7 = **leg paralysis plus some arm weakness**."

**OE verdict:** Misclassified. Per ASIA/ISNCSCI standards, *any* cervical cord injury (including C6-C7) is **tetraplegia**, it impairs all four limbs. The clinical reality at C6-C7 is total leg paralysis PLUS significant upper-limb impairment (loss of hand intrinsics, grip, fine motor; wrist flexion at C7), with only proximal arm function (shoulder, elbow flexion, C6 wrist extension) preserved. Calling it "leg paralysis plus some arm weakness" understates it and wrongly implies near-paraplegia.
*Cite: Rupp et al., ISNCSCI Revised 2019; Figueiredo, Neurol Sci 2017.*

**Suggested fix (lesson-voice):** "Damage at C6-C7 = all four limbs affected (this is still called tetraplegia). The legs are fully paralyzed and the hands and wrists are weak, but the shoulders and elbows often still work."

(C1-C5 = quadriplegia and T1-or-lower = paraplegia both check out. Minor nuance: T1 root contributes to hand intrinsics, but ASIA still classifies T1-and-below as paraplegia, so the lesson is fine there.)

**Excerpt sync:** grep questionsGPT Biopsychology for any excerpt quoting the spinal-cord line before applying.

---

## 1-neurological-endocrine-disorders.md
URL: /resources/topics/1-biological-bases/neurological-and-endocrine-disorders

Verified against standard references (high confidence, not separately OE-queried): stroke types/artery-symptom patterns (MCA, PCA, ACA), Ribot's law of retrograde amnesia, aprosodia, Huntington's genetics (chrom 4, autosomal dominant, 50%, caudate/putamen), Parkinson's TRAP+B and levodopa, focal vs generalized seizures, Jacksonian march, status epilepticus 5-min rule, hypertension as 90% essential, thyroid mimics, diabetes insipidus vs mellitus, Three P's, Alzheimer's NIA-AA 2011 stages + 20-year preclinical, imaging modalities (CT/MRI/DTI/PET/fMRI). OE-checked the 4 below.

### Finding 1 - FACTUAL-WRONG
**Claim (line 36):** TIA "the blockage clears in **less than five minutes**, symptoms are temporary."

**OE verdict:** The "five minutes" figure is not a real definition. Old WHO definition = symptoms resolve within 24 hours. Modern (AHA/ASA 2009) = tissue-based: brief neuro dysfunction from ischemia WITHOUT infarction on imaging. Most TIAs resolve within 1-2 hours in practice. Five minutes is wrong.
*Cite: Amarenco, NEJM 2020; Mendelson & Prabhakaran, JAMA 2021.*

**Suggested fix (lesson-voice):** "With a TIA, the symptoms are temporary and go away on their own (usually within an hour or two), and brain scans show no lasting damage. But it is a serious warning that a major stroke could be coming."

### Finding 2 - FACTUAL-WRONG (outdated number)
**Claim (line 249):** Gestational diabetes "Occurs in **1-3% of pregnancies**."

**OE verdict:** Major underestimate. Current U.S. prevalence ~6-9% (rising), global ~14%. The 1-3% figure is decades out of date (older criteria still gave ~4%).
*Cite: Sweeting et al., Lancet 2024; USPSTF, JAMA 2021.*

**Suggested fix (lesson-voice):** "Happens in about 6 to 9 out of every 100 pregnancies in the U.S. (newer testing finds even more). May lead to Type 2 diabetes later."

### Finding 3 - MISLEADING (match DSM-5-TR)
**Claim (line 94):** Huntington's "Life expectancy after symptom onset is usually **10 to 30 years**."

**OE verdict:** Upper bound too high. DSM-5-TR says ~10-20 years after diagnosis; most clinical literature says 15-20. Since the EPPP leans on DSM, the 30-year top end is off.
*Cite: DSM-5-TR; Rodriguez Santana et al., Neurol Clin Pract 2022.*

**Suggested fix (lesson-voice):** "After symptoms start, people usually live about 10 to 20 years (this matches the DSM-5-TR). There's no cure."

### Finding 4 - MISLEADING (terminology)
**Claim (line 190):** "**Cushing's Disease:** Oversecretion of corticosteroids."

**OE verdict:** Imprecise. The umbrella term for too much cortisol from any cause is **Cushing's syndrome**. "Cushing's disease" is the specific subtype caused by a pituitary tumor making too much ACTH (~60-70% of endogenous cases). Labeling all corticosteroid oversecretion "Cushing's disease" conflates the two. (Addison's is correctly a disease.)
*Cite: Reincke & Fleseriu, JAMA 2023.*

**Suggested fix (lesson-voice):** rename heading to "**Cushing's Syndrome:** Too much corticosteroid (cortisol)." Optional add: "When it's caused by a pituitary tumor, it's called Cushing's disease."

**Excerpt sync:** grep questionsGPT Biopsychology for excerpts quoting any of these 4 lines before applying.

---

## 1-pharmacology-antidepressants-antipsychotics.md
URL: /resources/topics/1-biological-bases/psychopharmacology-antipsychotics-and-antidepressants

Verified against standard references (high confidence, not separately OE-queried): agonist/antagonist/reuptake-inhibitor definitions; FGAs block D2; "-azine" naming; FGA positive-symptom efficacy and weak negative-symptom effect; the three FGA side-effect categories (anticholinergic, EPS, NMS); tardive dyskinesia onset/features/irreversibility; clozapine agranulocytosis + blood monitoring; SGA metabolic syndrome; SSRI/SNRI/NDRI/TCA/MAOI mechanisms and named exemplars; bupropion no sexual dysfunction + seizure risk; TCA cardiotoxicity/overdose lethality + secondary vs tertiary amines; MAOI tyramine/hypertensive crisis + food list; serotonin syndrome; discontinuation syndrome; tachyphylaxis. OE-checked the below.

### Finding 1 - MISLEADING
**Claim (line 66, and comparison table line 210):** SGAs "block both dopamine receptors (especially D2, D3, and D4) and serotonin receptors (especially 5-HT2A)."
**OE verdict:** The defining feature of SGAs is combined D2 antagonism plus potent 5-HT2A antagonism. D3 and D4 are NOT defining for the class. D3 affinity is usually a bit lower than D2, and D4 affinity varies wildly by drug (clozapine has high D4, quetiapine has almost none). Listing "D2, D3, and D4" as the SGA signature is inaccurate.
*Cite: Meltzer & Massey, Curr Opin Pharmacol 2011; Schotte et al., Psychopharmacology 1996.*
**Suggested fix (lesson-voice):** "SGAs block dopamine D2 receptors and also block serotonin 5-HT2A receptors. This mix of the two is what makes them work more broadly. (Some SGAs touch other dopamine receptors like D3 and D4 too, but that changes from drug to drug.)"

### Finding 2 - JUDGMENT
**Claim (line 130, key takeaway line 291):** "Initial effects appear around 2-4 weeks, but full therapeutic benefits take 6-8 weeks."
**OE verdict:** The 2-4 week initial-effect figure is well supported. The "full benefit by 6-8 weeks" upper bound is a touch optimistic. Current reviews put full relief closer to 6-12 weeks (NEJM says 8-12). But 6-8 weeks is the standard textbook/EPPP figure, so this is a judgment flag, not an error.
*Cite: Park & Zarate, NEJM 2019; Simon et al., JAMA 2024.*
**Suggested fix (optional):** soften upper bound, e.g. "full benefits often take 6 weeks or more (sometimes up to 12)." EPPP-acceptable as written. Your call.

(Verified accurate: clozapine is still the ONLY FDA-approved drug specifically for treatment-resistant schizophrenia; aripiprazole/TGA compulsive-gambling and impulse-control risk is real and FDA-warned (2016); post-SSRI sexual dysfunction can persist after stopping. "Third-generation antipsychotic" and "dopamine-serotonin stabilizer / partial agonist" are accepted terms, though some sources still file these under SGAs.)

**Excerpt sync:** grep questionsGPT Biopsychology for any excerpt quoting the SGA-receptor line (D2/D3/D4) before applying.

---

## 1-pharmacology-other-drugs.md
URL: /resources/topics/1-biological-bases/psychopharmacology-other-psychoactive-drugs

Verified against standard references (high confidence, not separately OE-queried): benzodiazepine GABA mechanism + "-pam/-lam" naming + fast onset + dependence/tolerance/withdrawal; benzo paradoxical effect in children/elderly; benzo + alcohol synergistic lethality; barbiturate GABA + higher danger; opioid endorphin mimicry + methadone maintenance + side effects/withdrawal; beta-blocker (propranolol) physical-anxiety/performance-anxiety use + taper warning; lithium first-line for classic mania + narrow therapeutic window + monitoring; carbamazepine/valproate uses + liver/agranulocytosis/aplastic-anemia monitoring; cholinesterase inhibitors + memantine/NMDA/glutamate; stimulant dopamine/NE mechanism + growth suppression + academic-achievement nuance; cross-tolerance among CNS depressants; half-life definition + longer in elderly + "start low go slow"; SUD meds table (disulfiram, naltrexone, acamprosate, topiramate, NRT). OE-checked the below.

### Finding 1 - FACTUAL-WRONG
**Claim (line 93):** lists "pemoline (Cylert)" as a current go-to ADHD psychostimulant.
**OE verdict:** Pemoline (Cylert) was pulled from the US market (around 2005) because it caused fatal liver failure. 13 children had total liver failure, 11 died or needed a transplant. The AASM says it is no longer available or recommended. Listing it as a current option is wrong.
*Cite: Greenhill et al., J Am Acad Child Adolesc Psychiatry 2002; Morgenthaler et al., Sleep 2007.*
**Suggested fix (lesson-voice):** drop pemoline from the current-use list. If you want to keep it for history: "Pemoline (Cylert) was an older stimulant, but it was taken off the U.S. market because it could cause deadly liver damage. It is not used anymore."

### Finding 2 - FACTUAL-WRONG
**Claim (line 105):** "Atomoxetine (Strattera): ... More effective than stimulants for patients with comorbid tic disorders, sleep disorders, anxiety, or depression."
**OE verdict:** Backwards. Atomoxetine is LESS effective than stimulants for ADHD (effect size ~0.56 vs ~0.78-1.02 for stimulants). It is sometimes preferred or better tolerated in certain comorbid cases (tics worsening on stimulants, substance-misuse risk, stimulant intolerance), but it is not more effective. Stimulants stay first-line even with comorbid tics or anxiety.
*Cite: Cortese et al., Lancet Psychiatry 2018; Volkow & Swanson, NEJM 2013.*
**Suggested fix (lesson-voice):** "Atomoxetine (Strattera): a norepinephrine reuptake inhibitor and the most common non-stimulant for ADHD. It does not work as well as stimulants overall, but it can be a better fit when someone has tics that get worse on stimulants, a sleep or anxiety problem, depression, or a risk of misusing stimulants."

### Finding 3 - MISLEADING
**Claim (lines 178-180):** "Narrow therapeutic window (TI = 1.0 or less)... Wide therapeutic window (TI greater than 1.0)."
**OE verdict:** The hard cutoff at 1.0 is not real. There is no agreed number that splits "narrow" from "wide." A TI of exactly 1.0 means the effective dose equals the toxic/lethal dose, which is basically an unusable drug, so it is a bad dividing line. TI is a relative idea: the higher the number, the safer the drug. (The LD50/ED50 and TD50/ED50 formulas themselves are correct.)
*Cite: Muller & Milton, Nat Rev Drug Discov 2012; Donnelly et al., Clin Pharmacol Ther 2025.*
**Suggested fix (lesson-voice):** "There is no exact number that splits safe from dangerous. The idea is relative: the bigger the gap between the helpful dose and the harmful dose, the higher the TI and the safer the drug. A small gap (low TI) means the drug needs close monitoring. Lithium is a classic low-TI example."

### Finding 4 - MISLEADING (minor)
**Claim (line 43):** buspirone has "no sedation, no dependence, no tolerance."
**OE verdict:** The no-dependence and no-tolerance parts are accurate (FDA label confirms). "No sedation" is slightly overstated. Buspirone is far less sedating than benzodiazepines, but drowsiness still shows up in about 10% of patients (about the same as placebo), and dizziness is more common. Better said as "barely any sedation."
*Cite: FDA buspirone label.*
**Suggested fix (lesson-voice):** "The big advantages: barely any sedation, no dependence, no tolerance."

(Verified accurate: opioid/overdose-leading-cause claim is reasonable for teaching (opioids ~70-76% of overdose deaths); LSD breakthrough designation for GAD (MM120) and psilocybin breakthrough for MDD and treatment-resistant depression both real; varenicline partial nicotinic agonist; dronabinol/Syndros approvals for AIDS anorexia and chemo nausea.)

**Excerpt sync:** grep questionsGPT Biopsychology for any excerpt quoting the pemoline line, the atomoxetine "more effective" line, or the TI 1.0 cutoff before applying.

---

## 1-sensory-perception.md
URL: /resources/topics/1-biological-bases/sensation-and-perception

Verified against standard references (high confidence, not separately OE-queried): sensation vs perception; bottom-up vs top-down processing; rods (low light, no color, peripheral) vs cones (color, detail, fovea); trichromatic at retina vs opponent-process post-retina; negative afterimages; red-green colorblindness X-linked recessive (~8% males, ~0.5% females); blue-yellow colorblindness autosomal dominant, equal sex distribution; binocular cues (retinal disparity, convergence) vs monocular cues; IASP pain definition; gate control theory (small unmyelinated open gate, large myelinated close gate, descending brain control); Fechner logarithmic law; Stevens power law + magnitude estimation; signal detection theory (d-prime, criterion, hit/miss/FA/CR 2x2). OE-checked the below.

### Finding 1 - JUDGMENT
**Claim (line 146):** "the JND for weight is about 2%."
**OE verdict:** On the optimistic/low side. The ~2% figure shows up in some textbooks for small hand-held weights under ideal lab conditions, but empirical studies more consistently land at 3-5% (and higher in older adults). Weber's own work put weight discrimination around 5%. The "about 2%" is a defensible textbook number, just the rosiest one, so this is a judgment flag, not an error. The Weber's-law concept itself (JND is a constant proportion) is correct.
*Cite: Karwowski et al., Ergonomics 1992; Norman et al., Perception 2009.*
**Suggested fix (optional):** soften to "about 2 to 3 percent (some studies find a bit higher)." EPPP-acceptable as written. Your call.

### Finding 2 - JUDGMENT (minor)
**Claim (line 36):** "Roughly 30% of your brain's cortex is dedicated to processing visual information."
**OE verdict:** Reasonable approximation. The most rigorous human fMRI estimate is closer to 25%, but ~25-30% is the range commonly cited in neuroscience texts, so 30% is defensible. Not an error.
*Cite: Benson et al., J Vision 2018 (HCP 7T retinotopy); Felleman & Van Essen, Cereb Cortex 1991.*
**Suggested fix (optional):** "Roughly a quarter to a third of your brain's cortex..." Low priority. Your call.

(Verified accurate: colorblindness genetics and prevalence for both red-green and blue-yellow; synesthesia ~2-4% (Simner et al. found ~4.4% for any form) is well supported.)

**Excerpt sync:** grep questionsGPT Biopsychology for any excerpt quoting the weight-JND line or the 30%-cortex line before applying (both are JUDGMENT/optional, low priority).
