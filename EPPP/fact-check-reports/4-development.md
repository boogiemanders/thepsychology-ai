# Fact-Check Report - Domain: Development

Method: each lesson's checkable claims verified against OpenEvidence (citation-backed). Tiers: FACTUAL-WRONG (incorrect), MISLEADING (defensible but could mislead), JUDGMENT (diverges from literature but may be the EPPP-accepted answer). Report-only; no lesson/question files edited. When fixes are approved, matching lessonExcerpt quotes in questionsGPT get synced in the same edit.

---

## 4-before-birth.md
URL: /resources/topics/4-growth-lifespan-development/early-influences-on-development-prenatal-development

Verified against standard references (high confidence, not separately OE-queried): germinal/embryonic/fetal period timing and the "all-or-none" effect; teratogen damage depends on type/amount/timing; embryonic period (weeks 3-8) is highest risk for major structural defects; CNS stays vulnerable through the fetal period; Prader-Willi (paternal 15), Angelman (maternal 15), cri-du-chat (chromosome 5); Down syndrome type percentages (~95% trisomy 21, ~4% translocation, ~1% mosaic) and translocation usually onto chromosome 14; translocation trisomy 21 not maternal-age linked; PKU recessive inheritance ratios and low-phenylalanine diet; Fragile X (FMR1) most common inherited intellectual disability; FASD subtypes. OE-checked the below.

### Finding 1 - MISLEADING
**Claim (maternal age connection, ~line 135):** "Risk for trisomy 21 increases with maternal age, particularly after age 30, with the risk curve steepening significantly."
**OE verdict:** The risk rises slowly from young ages but steepens MOST sharply starting around age 35, not 30. Age 35 is the traditional clinical "advanced maternal age" threshold and the inflection point where risk accelerates. The increase before 35 is modest (about 8/10,000 at 20, 14/10,000 at 30, 34/10,000 at 35, 116/10,000 at 40).
*Cite: ACOG Obstetric Care Consensus #11 (2023); Cuckle & Morris, Prenatal Diagnosis 2021.*
**Suggested fix (lesson-voice):** "Risk for trisomy 21 goes up with maternal age. It climbs slowly at first, then shoots up much faster starting around age 35. Doctors call 35 'advanced maternal age' for this reason. Cell division during egg formation gets more error-prone as women age."

**Excerpt sync:** grep questionsGPT for excerpts quoting "particularly after age 30."

### Finding 2 - MISLEADING
**Claim (Klinefelter features, ~line 78):** "Disproportionately long arms and legs / Taller than average height"
**OE verdict:** Tall stature is correct, and the extra height comes mainly from disproportionately long LEGS. Arms are not consistently long; arm span seldom exceeds height in Klinefelter (unlike classic eunuchoid proportions). Saying "long arms and legs" overstates the arm finding.
*Cite: Chang et al., J Clin Endocrinol Metab 2015; Lanfranco et al., Lancet 2004.*
**Suggested fix (lesson-voice):** "Taller than average height, mostly because of long legs"

**Excerpt sync:** grep questionsGPT for excerpts quoting "long arms and legs" or "disproportionately long limbs."

Note: Klinefelter social-cognitive deficits (face recognition, reading emotions, theory of mind) confirmed by OE. Rett normal-development window of 6-18 months confirmed. Age of viability ~22-26 weeks confirmed (22 weeks is the extreme lower bound, survival improves toward 25-26). Huntington's: each child of two affected (heterozygous) parents has a 75% chance of being affected, confirmed.

---

## 4-body-growth.md
URL: /resources/topics/4-growth-lifespan-development/physical-development

Verified against standard references (high confidence, not separately OE-queried): synaptogenesis/dendritic growth/myelination drive early brain growth (not new neurons); synaptic pruning continues through adolescence; prefrontal cortex matures into mid-20s; limbic/nucleus accumbens matures before PFC; rooting reflex; depth perception sequence; SIDS risk and protective factors; motor milestone sequence; sexual orientation twin and fraternal-birth-order findings; sexual fluidity vs bisexuality. OE-checked the below.

### Finding 1 - JUDGMENT
**Claim (Vision, ~line 57):** "By 7-8 months, though, infants have visual acuity similar to normal adults."
**OE verdict:** Newborn acuity of 20/400-20/600 is correct. But acuity does NOT reach adult levels by 7-8 months. Research shows about a fivefold improvement by 6 months, with adult-level acuity not reached until roughly 4 to 6 years of age (contrast sensitivity even later). The "7-8 months" figure overstates how fast acuity matures. This may still be the EPPP-expected answer from older developmental texts, so flagging as JUDGMENT, not an error.
*Cite: Maurer, Mondloch & Lewis, Developmental Science 2007; Leone et al., Acta Ophthalmologica 2014.*
**Suggested fix (lesson-voice):** "Vision improves fast in the first months, but full adult-level sharpness takes years to reach. (Note: some EPPP prep texts say acuity is near-adult by 7-8 months. If you see that on the exam, go with it.)"

**Excerpt sync:** grep questionsGPT for excerpts quoting "7-8 months" / "visual acuity similar to normal adults."

### Finding 2 - MISLEADING (unverifiable stat - check source)
**Claim (Adolescent Substance Use, ~line 199):** "According to 2024 data from youth ages 12-17: 6.6% past-month alcohol, 6.0% nicotine vaping, 6.0% marijuana, 1.9% tobacco product use."
**OE verdict:** Not a clinical-literature question, so not OE-verifiable. These look like survey figures (NSDUH/Monitoring the Future). The numbers are oddly close to each other and should be checked against the actual 2024 NSDUH or MTF release before being stated as fact, since survey percentages shift year to year and are easy to transcribe wrong.
*Cite: standard reference - verify against 2024 NSDUH / Monitoring the Future tables.*
**Suggested fix (lesson-voice):** Confirm each percent against the cited 2024 survey table, or soften to "recent national surveys show roughly X percent." Keep the point that alcohol, vaping, and marijuana are the most common.

**Excerpt sync:** grep questionsGPT for excerpts quoting these substance-use percentages.

Note: Brain weight (about 25% of adult at birth, about 80% by age 2) confirmed. SIDS peak 2-4 months and medullary serotonin link confirmed (AAP 2022 calls serotonergic brainstem abnormalities the most consistent finding). Presbyopia onset ~40-45 confirmed. Presbycusis-dementia link confirmed (hearing loss is the single largest modifiable dementia risk factor per 2020 Lancet Commission). Growth spurt: lesson's onset ages (girls 10-11, boys 12-13) run slightly later than research "takeoff" (~9 girls / ~11 boys) but the ~2-year gender gap and peak-height-velocity ages (~11.5 girls / ~13.5 boys) are correct; lesson's ranges are defensible textbook values.

---

## 4-bonding-and-attachment.md
URL: /resources/topics/4-growth-lifespan-development/socioemotional-development-attachment-emotions-and-social-relationships

This lesson is almost entirely classic developmental theory (Harlow contact comfort, Bowlby ethological theory and 4 stages, Ainsworth Strange Situation and 4 patterns, Adult Attachment Interview categories, Selman friendship levels, Parten play types, Crick & Dodge social information processing, Patterson coercive family model, Carstensen socioemotional selectivity, Rowe & Kahn, Baltes SOC). OpenEvidence does not cover this social/cognitive-theory material, so it was verified against standard references.

Verified against standard references (high confidence, not separately OE-queried): Harlow contact comfort over food; Bowlby's 4 attachment stages and approximate ages; internal working models; social referencing (~6-8 mo), separation anxiety onset ~6-8 mo and peak ~14-18 mo, stranger anxiety ~8-10 mo; Ainsworth's 4 patterns and caregiver correlates; AAI categories (autonomous-secure, preoccupied-resistant, dismissing-avoidant); cross-cultural pattern (avoidant more common in individualistic cultures, resistant more common in collectivist cultures - the classic van IJzendoorn & Kroonenberg finding and the EPPP-accepted answer); primary vs secondary emotion timeline; shame ("I am bad") vs guilt ("I did something bad"); instrumental vs hostile aggression and physical/verbal/relational forms; Crick & Dodge 6 steps and hostile attribution bias; Patterson coercive cycle; Selman's 5 friendship levels; Parten's 6 play types; positivity effect; socioemotional selectivity theory; Rowe & Kahn 3-component model; Baltes & Baltes SOC.

No factual errors found; all checked claims accurate and correctly attributed. (Note: this lesson was not OE-queried because its content is developmental/social theory outside OpenEvidence's clinical-literature scope.)

---

## 4-cognitive-development.md
URL: /resources/topics/4-growth-lifespan-development/cognitive-development

This lesson is cognitive-developmental theory (Piaget, Vygotsky, information processing, theory of mind, memory, eyewitness suggestibility, sex differences). OpenEvidence does not cover this material, so it was verified against standard references.

Verified against standard references (high confidence, not separately OE-queried): Piaget's equilibration/assimilation/accommodation; four stages and ages (sensorimotor 0-2, preoperational 2-7, concrete operational 7-12, formal operational 12+); the six sensorimotor substages and ages; object permanence beginning substage 4 (~8-12 mo); representational thought substage 6 (~18-24 mo); Piaget underestimated infants (deferred imitation earlier than substage 6); preoperational features (egocentrism, animism, centration, irreversibility, lack of conservation); conservation sequence and horizontal decalage; formal-operations imaginary audience and personal fable (Elkind); Vygotsky ZPD, scaffolding, private speech internalizing by ~age 7, interpersonal-to-intrapersonal; information-processing continuous view and neo-Piagetian blend; theory of mind developing 3-5 with false-belief task (fail under 4, pass ~4.5-5); childhood amnesia before ages 3-4; reminiscence bump ages 15-25; age-related memory pattern (recent long-term and working memory decline most, short-term storage and remote memory stable, episodic declines / semantic stable); synchrony effect (older adults peak in morning); small sex differences in cognition.

No factual errors found; all checked claims accurate and correctly attributed. (Note: not OE-queried because the content is cognitive/developmental theory outside OpenEvidence's clinical-literature scope. The sex-difference and self-esteem "Black self-esteem advantage" claims are EPPP-standard summaries; current research debates their size, but they match the commonly tested answer.)

---

## 4-heredity-and-environment.md
URL: /resources/topics/4-growth-lifespan-development/early-influences-on-development-nature-vs-nurture

Verified against standard references (high confidence, not separately OE-queried): definition of heritability as a population variance statistic (not an individual split); heritability changes across environments and rises into adulthood; passive/evocative/active gene-environment correlations; gene-environment interaction (GxE) and diathesis-stress; epigenetics (gene expression changes without DNA sequence change); twin/adoption/family research designs; MZ share 100% DNA, DZ share 50%. OE-checked the heritability estimates below.

### Finding 1 - FACTUAL-WRONG
**Claim (Heritability Estimates list, ~line 175-176):** Schizophrenia and major depression are both placed in "Moderate-high heritability (0.50-0.70)."
**OE verdict:** Both placements are off.
- Schizophrenia heritability is about 0.80 (meta-analytic 81%, NEJM/Danish ~79-80%), NOT 0.50-0.70. It belongs in the "very high" band. This is also the classic EPPP figure, so the lesson is wrong by both research and exam standards.
- Major depression heritability is about 0.30-0.50 (commonly ~0.37, the LOWEST of the disorders listed), NOT 0.50-0.70. It is too high in the lesson.
*Cite: Sullivan, Kendler & Neale, Arch Gen Psychiatry 2003 (schizophrenia 81%); Hilker et al., Biol Psychiatry 2018 (79%); Kendall et al., Psychol Med 2021 (MDD 30-50%).*
**Suggested fix (lesson-voice):** Move schizophrenia up to the very-high band. "Very high heritability (about 0.70-0.90): height, eye color, ADHD, autism spectrum, bipolar disorder, schizophrenia." Then list major depression lower: "Lower heritability (about 0.30-0.50): major depression, attitudes, specific fears, some personality aspects." Add a line: "Major depression is one of the least heritable, around 0.37, so life events and stress play a big role."

**Excerpt sync:** grep questionsGPT for excerpts quoting "0.50-0.70," "schizophrenia, major depression," or the heritability band lists.

Note: ADHD heritability 0.70-0.80 confirmed (~0.74-0.76). Bipolar very-high placement confirmed (~0.60-0.90). Autism very-high confirmed (often 0.80-0.90+).

---

## 4-language-development.md
URL: /resources/topics/4-growth-lifespan-development/language-development

This lesson is language-acquisition theory and developmental milestones (learning/nativist/social-interactionist theories, Chomsky LAD, five language components, milestone timeline, critical period, bilingualism). OpenEvidence does not cover this material, so it was verified against standard references.

Verified against standard references (high confidence, not separately OE-queried): three theories and the limitation of learning theory; Chomsky LAD and nativist evidence; child-directed speech ("parentese") aids learning; five components phonology/morphology/syntax/semantics/pragmatics; milestone ages (cooing 6-8 wk, babbling, canonical/variegated babbling, first words 10-15 mo, holophrastic, vocabulary spurt, telegraphic 18-24 mo, simple sentences 24-36 mo); babbling narrows to native language by ~9-12 mo; deaf infants manual babbling; comprehension precedes production; critical period and different sensitive periods by component; overextension/underextension/overregularization as signs of rule learning; paralanguage/prosody/kinesics; code-switching; language brokering mixed outcomes.

### Finding 1 - MISLEADING (minor)
**Claim (Five Components table, ~line 49):** "English has ~50 phonemes"
**OE verdict:** Not a clinical question (not OE-queried). Standard linguistics counts English at about 44 phonemes (roughly 24 consonants and 20 vowels, dialect-dependent). "~50" is on the high side. Minor; the point that phonemes are the smallest sound units is correct.
*Cite: standard linguistics references.*
**Suggested fix (lesson-voice):** "English has about 44 phonemes, like the sounds for 'c,' 't,' and 'th'"

**Excerpt sync:** grep questionsGPT for excerpts quoting "~50 phonemes" or "50 phonemes."

No other factual errors found; milestone ages and theory attributions are accurate. (Note: the semantics-row example "I could eat a horse = actually wanting to eat a horse" is fine as an illustration of literal vs figurative meaning, not an error.)

---

## 4-morality.md
URL: /resources/topics/4-growth-lifespan-development/socioemotional-development-moral-development

This lesson is moral-development theory (Piaget, Kohlberg, Gilligan, Hoffman discipline styles). OpenEvidence does not cover this material, so it was verified against standard references.

Verified against standard references (high confidence, not separately OE-queried): Piaget's three stages (premoral 0-5, heteronomous 5-10/11 with moral realism / consequences over intentions, autonomous 10/11+ with intentions); critiques (underestimated young children, ended too early); Kohlberg's three levels and six stages and the stage names/key questions (preconventional 1-2, conventional 3-4, postconventional 5-6); Heinz dilemma logic (reasoning not conclusion); universal/invariant claim; cognitive development necessary; Gilligan's care-vs-justice gender critique; cultural-bias and hypothetical-vs-real critiques; peers-over-parents claim; Hoffman's discipline styles (induction most effective, power assertion, love withdrawal).

No factual errors found; all checked claims accurate and correctly attributed. (Note: not OE-queried, as moral-development theory is outside OpenEvidence's clinical-literature scope.)

---

## 4-school-and-family.md
URL: /resources/topics/4-growth-lifespan-development/school-and-family-influences

Verified against standard references (high confidence, not separately OE-queried): Gottman's Four Horsemen (criticism, contempt, defensiveness, stonewalling) and contempt as strongest single predictor; divorce risk factors; gender-differentiated divorce effects; high-conflict-intact worse than low-conflict-divorced; sleeper effect in girls; father-involvement quality over contact frequency; stepfamily dynamics; helicopter-parenting outcomes; gay/lesbian parenting research consensus; empty-nest findings; maternal-employment and daycare effects; Head Start fade-out of IQ gains but lasting life outcomes; Walker's Cycle of Violence (tension building, acute battering, loving contrition); Johnson's four IPV types (situational couple violence most common, mutual violent control least common); PCIT (ages ~2-12) and TF-CBT (ages ~3-18); cultural socialization benefits; Rosenthal & Jacobson self-fulfilling-prophecy study; gender-biased teacher attention. OE-checked the child-maltreatment epidemiology below.

### Finding 1 - JUDGMENT
**Claim (Child Maltreatment Risk Factors, ~line 282-283):** "Gender: Girls have higher rates than boys" and "Race/ethnicity: Highest rates for American Indian/Alaska Native children, then African American children."
**OE verdict:** Both are defensible but data-source dependent.
- Type order (neglect most common, then physical, sexual, psychological) and highest risk under age 1: confirmed.
- Gender: older USPSTF/NCANDS framed boy and girl rates as "similar." The most recent whole-population analysis (2012-2023) finds girls modestly higher overall (driven mainly by much higher sexual-abuse rates). So "girls higher" is supported by current data but conflicts with the older "roughly equal" figure many EPPP texts use.
- Race: by annual per-capita victimization rate (the federal Child Maltreatment report the EPPP usually cites), AI/AN children rank highest, then Black children, which matches the lesson. A newer longitudinal study ranks Black children highest. Both orderings exist; the lesson follows the standard annual-report ordering.
*Cite: USPSTF JAMA 2024; Liu, Levin & Turnamian, JAMA Pediatrics 2026 (whole-population trends); federal NCANDS Child Maltreatment annual reports.*
**Suggested fix (lesson-voice):** Optional. Could add a hedge: "Girls and boys are maltreated at fairly similar rates overall, though recent national data show girls a bit higher, mostly because of higher sexual-abuse rates." Keep AI/AN as the highest-rate group, since that matches the federal annual report the exam uses.

**Excerpt sync:** grep questionsGPT for excerpts quoting the gender/race maltreatment risk lines.

Note: Maltreatment type order and the under-1 highest-risk-age claim confirmed by OE.

---

## 4-temperament-and-personality.md
URL: /resources/topics/4-growth-lifespan-development/socioemotional-development-temperament-and-personality

This lesson is developmental personality theory (Thomas & Chess, Rothbart, Kagan, Freud, Erikson, Baumrind, Big Five change, Bem, Kohlberg gender theory, Marcia). OpenEvidence does not cover this material, so it was verified against standard references.

Verified against standard references (high confidence, not separately OE-queried): temperament low-to-moderate stability increasing after age 3; Thomas & Chess nine dimensions and three types with classic percentages (easy ~40%, slow-to-warm-up ~15%, difficult ~10%, ~35% unclassified) and goodness-of-fit; Rothbart reactivity (surgency, negative affectivity) and self-regulation/effortful control; Kagan behavioral inhibition (~15-20%) and anxiety risk; Freud's five psychosexual stages, ages, and fixation outcomes; Erikson's eight psychosocial stages, ages, crises, and virtues; Baumrind's four parenting styles on demandingness x responsiveness and their outcomes (authoritarian linked to bullying others, permissive to being bullied, uninvolved worst); cultural caveat on authoritative parenting and achievement; rank-order stability vs mean-level change and the maturity principle (neuroticism decreases, agreeableness and conscientiousness increase); sex differences in personality; mirror self-recognition 18-24 mo enabling secondary emotions; self-understanding progression; Kohlberg gender identity/stability/constancy (2-3, 4, 6-7) and the gender-typing-before-constancy critique; social learning theory; Bem gender schema theory and Sex Role Inventory / androgyny; Egan & Perry five components; Marcia's four identity statuses (crisis x commitment).

No factual errors found; all checked claims accurate and correctly attributed. (Note: not OE-queried, as developmental personality theory is outside OpenEvidence's clinical-literature scope. The personality mean-level-change patterns and sex differences are EPPP-standard summaries consistent with the maturity-principle literature.)
