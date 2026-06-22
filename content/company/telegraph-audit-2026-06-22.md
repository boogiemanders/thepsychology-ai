# Question telegraph audit — 2026-06-22

Triggered by Josh M feedback on a Work-Satisfaction quiz item: the correct answer restated the question stem.

**Scope:** 5,886 questions (2,286 quiz bank + 3,600 static exams) -> 1,072 claim-style candidates -> 428 unique after dedupe. LLM judge + adversarial verify.

**Result:** 29 confirmed telegraphing (6 high, 21 medium, 2 low). 7 other flags were rejected on verification. 28 fixed + re-verified; 1 unresolved (Q0072).

Single-term recall items (~4,800, e.g. answer = "Cortisol") were excluded by design: naming the concept the stem describes IS the tested knowledge, so they cannot telegraph.

All edits are in branch `worktree-question-telegraph-audit`, not yet merged. Fixes propagate to every duplicate occurrence across the quiz bank and static exams.

---

## Q0055 — HIGH — FIXED
Occurrences (3): questionsGPT/2 3 5 6 I-O Psychology/2 3 Work Satisfaction.json; examsGPT/practice-exam-10.json; examsGPT/practice-exam-12.json

Why it leaked: job satisfaction correlates with job performance at roughly r = .30 ... propose a major initiative to raise satisfaction and expect productivity to climb in proportion

**Old stem:** Leadership at a large firm learns that, across the organization, job satisfaction correlates with job performance at roughly r = .30. Citing this finding, they propose a major initiative to raise satisfaction and expect productivity to climb in proportion. An industrial-organizational psychologist is asked to weigh in. Which caution about interpreting the satisfaction-performance link is best supported by the empirical literature?

**Old correct:** The association is correlational and modest, so boosting satisfaction may not yield proportional performance gains; satisfaction in fact predicts withdrawal behaviors such as turnover and absenteeism more reliably than it predicts output

**New stem:** Leadership at a large firm is preparing to fund a company-wide initiative to raise employee job satisfaction, on the premise that happier workers will directly drive up individual task output. They ask an industrial-organizational psychologist where, according to the empirical literature, increases in job satisfaction are most likely to show measurable effects on work outcomes. Which response is best supported by the research?

**New correct:** Higher satisfaction is most reliably associated with reduced withdrawal behaviors such as turnover and absenteeism, and only weakly associated with individual task performance

---

## Q0072 — HIGH — UNRESOLVED
Occurrences (2): questionsGPT/2 3 5 6 I-O Psychology/5 6 Leadership.json; examsGPT/practice-exam-6.json

Why it leaked: wanting to talk with other trainees who are in the same waiting period ... unsure whether her distress level is reasonable or excessive

**Old stem:** A psychologist-in-training is waiting to learn whether she passed a high-stakes oral examination. She feels anxious and is unsure whether her distress level is reasonable or excessive. Rather than seeking out faculty who have administered the exam many times, she finds herself wanting to talk with other trainees who are in the same waiting period. According to social comparison theory, what best explains this selective preference?

**Old correct:** She wants to compare her emotional response with similar others in the same situation to gauge whether her anxiety level is appropriate

**Status:** Failed de-telegraph twice. The construct (social comparison) is named in its own stem, so the correct rationale always paraphrases it. Needs a manual redesign or removal.

---

## Q0109 — HIGH — FIXED
Occurrences (2): questionsGPT/2 Learning and Memory/2 Operant Conditioning Interventions.json; examsGPT/practice-exam-2.json

Why it leaked: involves collecting information about the antecedents and consequences maintaining a target behavior and forming hypotheses about its function

**Old stem:** Which step in functional behavioral assessment involves collecting information about the antecedents and consequences maintaining a target behavior and forming hypotheses about its function?

**Old correct:** Step 2: Collect information about antecedents and consequences and develop hypotheses

**New stem:** A school psychologist conducting a functional behavioral assessment of a student's disruptive outbursts has completed indirect interviews and direct ABC observations, which suggest the outbursts are maintained by escape from difficult academic tasks. To establish this maintaining function with the greatest confidence before designing an intervention, what should the psychologist do next?

**New correct:** Systematically present and withdraw the suspected antecedents and consequences across conditions to see whether the behavior changes as predicted

---

## Q0192 — HIGH — FIXED
Occurrences (2): questionsGPT/4 Development/4 Bonding and Attachment.json; examsGPT/practice-exam-12.json

Why it leaked: infants preferred to be held by their caregiver rather than being fed by them

**Old stem:** In a study examining the attachment behaviors of infants with their caregivers, researchers found that infants preferred to be held by their caregiver rather than being fed by them. What does this preference suggest about attachment?

**Old correct:** Attachment is influenced by the emotional and physical comfort provided by caregivers.

**New stem:** An investigator rears infant rhesus monkeys with two artificial surrogate mothers: one is a bare wire frame fitted with a feeding bottle, and the other is covered in soft terrycloth but provides no food. The investigator wants to determine which surrogate the infants will treat as a secure base, especially when a frightening novel object is introduced into the cage. According to the classic findings from this paradigm, what outcome is observed and what does it imply about the development of attachment?

**New correct:** The infants cling to the cloth surrogate and flee to it when frightened, indicating that attachment forms around contact comfort rather than the reduction of hunger.

---

## Q0193 — HIGH — FIXED
Occurrences (1): questionsGPT/4 Development/4 Bonding and Attachment.json

Why it leaked: the strongest predictor of secure attachment at 12 months is not the amount of time the caregiver spends in physical contact with the infant, but the caregiver's prompt and appropriate responsiveness to the infant's signals

**Old stem:** A longitudinal study of human attachment finds that the strongest predictor of secure attachment at 12 months is not the amount of time the caregiver spends in physical contact with the infant, but the caregiver's prompt and appropriate responsiveness to the infant's signals. How does this finding extend the principles established in Harlow's research on rhesus monkeys?

**Old correct:** It extends Harlow's findings by showing that, beyond contact comfort, the quality of caregiver responsiveness is critical for human secure attachment — a dimension Harlow's wire-vs-cloth paradigm could not isolate.

**New stem:** Harlow's rhesus monkey experiments showed that infants preferred a soft cloth surrogate over a wire surrogate that dispensed milk. A developmental researcher wants to identify the analogous variable that best predicts secure attachment in human infants by 12 months of age. Based on the human attachment literature, which caregiver variable should the researcher expect to be the strongest predictor?

**New correct:** The caregiver's prompt and appropriate responsiveness to the infant's distress and social signals

---

## Q0209 — HIGH — FIXED
Occurrences (2): questionsGPT/4 Development/4 Morality.json; examsGPT/practice-exam-13.json

Why it leaked: Laws are social contracts that should serve democratic values, and when they don't, they should be changed

**Old stem:** When presented with the Heinz dilemma, a graduate student argues: 'Heinz should steal the drug because the law protecting property rights, while generally valid, fails to protect the more fundamental right to life in this case. Laws are social contracts that should serve democratic values, and when they don't, they should be changed.' This reasoning is MOST characteristic of which of Kohlberg's stages?

**Old correct:** Stage 5: Social Contract orientation, focused on democratically established rights and values

**New stem:** When presented with the Heinz dilemma, a graduate student argues: "Heinz should steal the drug. The law protecting the druggist's property usually deserves our respect, but rules like that are arrangements people agree to because they generally help everyone, not absolutes. When a rule ends up costing someone their life, it has stopped doing the job it was set up for, and the reasonable thing is to break it now and work to revise it later." This reasoning is MOST characteristic of which of Kohlberg's stages?

**New correct:** Rules are agreements that exist to protect rights and serve the general welfare, so they may be set aside and reformed when they fail that purpose

---

## Q0050 — MEDIUM — FIXED
Occurrences (2): questionsGPT/1 Biopsychology (Neuroscience & Pharmacology)/1 Sensory Perception.json; examsGPT/practice-exam-11.json

Why it leaked: recognize familiar shapes based on previous experiences

**Old stem:** In a psychological experiment, participants are asked to identify shapes presented briefly on a screen. Which processing method would most likely help them recognize familiar shapes based on previous experiences?

**Old correct:** Top-down processing allows participants to use their knowledge of shapes to interpret the visual input.

**New stem:** Participants in a tachistoscope study briefly view degraded line drawings of objects. In one block, each drawing is preceded by a category word (for example, "kitchen item"); in another block, no word precedes the drawing. Identification is markedly faster and more accurate when a category word precedes the image. Which account of perception best explains this pattern of results?

**New correct:** Top-down processing, in which stored expectations and context shape how incoming sensory data are interpreted

---

## Q0064 — MEDIUM — FIXED
Occurrences (2): questionsGPT/2 3 5 6 I-O Psychology/2 Work Motivation.json; examsGPT/practice-exam-5.json

Why it leaked: assign additional tasks at the same skill level ... greater decision-making authority, project ownership, and opportunities for professional growth

**Old stem:** A human resources consultant is advising a technology company on strategies to improve employee motivation. She recommends redesigning several positions to include greater decision-making authority, project ownership, and opportunities for professional growth. A colleague suggests instead that the company simply assign additional tasks at the same skill level to keep employees busier. The consultant's recommendation reflects which approach, and how does it differ from her colleague's suggestion?

**Old correct:** Job enrichment (adding depth and meaning) versus job enlargement (adding more tasks at the same level)

**New stem:** A human resources consultant is advising a technology company on improving employee motivation. For the analyst role, she recommends giving each analyst authority to set their own project priorities, sign off on deliverables, and mentor newer staff, while leaving the number of accounts each one handles unchanged. A colleague counters that the company should instead keep each analyst's authority where it is but assign each one several more accounts of the same type they already manage. The consultant's recommendation and the colleague's suggestion, respectively, are best classified as which two approaches?

**New correct:** Job enrichment and job enlargement

---

## Q0083 — MEDIUM — FIXED
Occurrences (2): questionsGPT/2 3 5 6 I-O Psychology/5 Do Hiring Tools Work.json; examsGPT/practice-exam-8.json

Why it leaked: The company had not validated these requirements as related to successful job performance, and Black employees were disproportionately excluded.

**Old stem:** In 1971, the U.S. Supreme Court ruled in Griggs v. Duke Power Co. that Duke Power's requirement of a high school diploma and passing scores on two general intelligence tests for internal job transfers was unlawful under Title VII of the Civil Rights Act. The company had not validated these requirements as related to successful job performance, and Black employees were disproportionately excluded. Which of the following most accurately captures the central principle established by this ruling for employment selection testing?

**Old correct:** Employment selection procedures that produce disparate impact on a protected class must be demonstrably job-related and justified by business necessity

**New stem:** A power company requires a high school diploma and passing scores on two general aptitude tests for employees seeking transfer into its higher-paying departments. The tests were chosen because management believed they measured general trainability, and the same standards are applied to every applicant regardless of group membership. A group of employees challenges the practice under Title VII of the Civil Rights Act, presenting evidence that the requirements screen out a far higher proportion of one racial group than another. Under the standard the U.S. Supreme Court established in this situation, what must the employer show for such selection requirements to be lawful?

**New correct:** That the requirements bear a demonstrable relationship to successful performance of the jobs for which they are used

---

## Q0106 — MEDIUM — FIXED
Occurrences (3): questionsGPT/2 Learning and Memory/2 Operant Conditioning Interventions.json; examsGPT/practice-exam-7.json; examsGPT/practice-exam-8.json

Why it leaked: this works because the preferred activity is being used as a consequence for completing the less preferred one

**Old stem:** A behavioral therapist instructs a highly distractible adult client to allow himself to browse news websites for 15 minutes, but only after completing 30 minutes of uninterrupted report writing. The therapist explains that this works because the preferred activity is being used as a consequence for completing the less preferred one. Which operant principle most precisely describes this intervention?

**Old correct:** The Premack principle, because a high-frequency behavior is used to reinforce a low-frequency behavior

**New stem:** A behavioral therapist gathers baseline data on a distractible adult client and finds that, left to his own choices, he spends large amounts of time browsing news websites and very little time on report writing. The therapist sets up an arrangement in which the client may browse news websites only after he has written reports for 30 uninterrupted minutes. Which operant principle most precisely describes this intervention?

**New correct:** The Premack principle, because access to a more probable behavior is made contingent on performance of a less probable behavior

---

## Q0108 — MEDIUM — FIXED
Occurrences (2): questionsGPT/2 Learning and Memory/2 Operant Conditioning Interventions.json; examsGPT/practice-exam-12.json

Why it leaked: which is incompatible with the student's usual behavior of leaving their seat frequently

**Old stem:** A teacher reinforces a student for staying seated for 30 minutes, which is incompatible with the student's usual behavior of leaving their seat frequently. This is an example of:

**Old correct:** Differential reinforcement of incompatible behavior (DRI)

**New stem:** A student frequently gets up and wanders during class. To address this, the teacher stops attending to the wandering and instead delivers praise and a token each time the student remains in their seat for a sustained stretch of the lesson. Which differential reinforcement procedure does this intervention most precisely exemplify?

**New correct:** Reinforcing a response that is topographically incompatible with the target behavior

---

## Q0150 — MEDIUM — FIXED
Occurrences (3): questionsGPT/3 Cultural Considerations/3 Cultural Concepts.json; examsGPT/practice-exam-12.json; examsGPT/practice-exam-9.json

Why it leaked: individuals have control over their outcomes but do not feel personally responsible for their failures

**Old stem:** Which worldview in Sue's framework reflects a belief that individuals have control over their outcomes but do not feel personally responsible for their failures?

**Old correct:** Internal locus of control and external locus of responsibility (IC-ER)

**New stem:** A client repeatedly tells her therapist that she is confident in her own abilities and certain she can reach her career goals through her own effort, yet she attributes the promotions she has been passed over for to entrenched racial bias in her workplace rather than to anything about herself. Within Sue's worldview framework, which quadrant best characterizes her orientation?

**New correct:** Internal locus of control and external locus of responsibility (IC-ER)

---

## Q0163 — MEDIUM — FIXED
Occurrences (2): questionsGPT/3 Social Psychology/3 Group Influences.json; examsGPT/practice-exam-6.json

Why it leaked: individually favors a moderately conservative approach ... they collectively decide on an even more cautious plan than any individual member originally endorsed

**Old stem:** A clinical treatment team individually favors a moderately conservative approach to a complex case. After extensive group discussion, they collectively decide on an even more cautious plan than any individual member originally endorsed. This outcome is best explained by:

**Old correct:** Group polarization, because discussion amplified the group's initial cautious inclination

**New stem:** Before a case conference, each member of a clinical treatment team privately rates how aggressive a treatment plan they would recommend for a complex patient, and the ratings cluster on one side of the scale. The team then discusses the case at length and reaches a consensus recommendation. Based on the research on group decision-making, the team's consensus is most likely to:

**New correct:** Become more extreme than the members' average pre-discussion rating, in the same direction the members already leaned

---

## Q0178 — MEDIUM — FIXED
Occurrences (3): questionsGPT/3 Social Psychology/3 Why People Do Things.json; examsGPT/practice-exam-8.json; examsGPT/practice-exam-9.json

Why it leaked: the client becomes notably more engaged when the psychologist offers concrete coping strategies and a structured plan for managing workplace conflicts

**Old stem:** A licensed psychologist begins treatment with a first-generation Korean American client presenting with chronic occupational stress and somatic complaints. The client appears disengaged during open-ended reflective questioning and responds minimally to exploratory affect-focused techniques. However, the client becomes notably more engaged when the psychologist offers concrete coping strategies and a structured plan for managing workplace conflicts. Which adjustment would be MOST consistent with culturally competent practice for this client?

**Old correct:** Transitioning to more directive, structured, and problem-focused interventions consistent with the client's cultural expectations

**New stem:** A licensed psychologist conducts an initial session with a 42-year-old first-generation Korean American client who immigrated eight years ago. The client was referred by a primary care physician after a workup found no medical cause for persistent headaches, fatigue, and gastrointestinal discomfort that began amid mounting demands at work. The client attends on time, answers questions politely and briefly, and offers little elaboration beyond the physical symptoms and the work situation. Drawing on the literature on culturally responsive practice with this population, which initial treatment approach is MOST likely to support engagement and retention?

**New correct:** A directive, structured approach in which the psychologist takes a credible expert role and provides concrete, symptom- and problem-focused strategies early in treatment

---

## Q0194 — MEDIUM — FIXED
Occurrences (2): questionsGPT/4 Development/4 Bonding and Attachment.json; examsGPT/practice-exam-8.json

Why it leaked: after removal from a severely neglectful home

**Old stem:** A 5-year-old child recently placed with foster parents after removal from a severely neglectful home readily approaches unfamiliar adults at the park, climbs onto strangers' laps, and agrees to leave with people she has just met without hesitation or glancing back at her caregiver. She shows no stranger wariness and initiates physical contact indiscriminately. The foster parents report this behavior has been consistent across multiple settings since placement. According to DSM-5, which of the following etiological conditions must be present to diagnose Disinhibited Social Engagement Disorder (DSED)?

**Old correct:** A history of social neglect or other forms of pathogenic care reflecting insufficient caregiving

**New stem:** A 5-year-old girl in a pediatric clinic readily approaches the unfamiliar examiner, climbs onto his lap, and states she would happily go home with him, showing no hesitation and no checking back with the adult who brought her. The accompanying adult reports the child behaves this way with virtually any new person and has done so across home, daycare, and family gatherings for as long as they have known her. Her receptive and expressive language are age-appropriate, and she meets developmental milestones. A clinician is considering Disinhibited Social Engagement Disorder. Beyond the overtly familiar and culturally inappropriate behavior toward strangers, which additional condition must be satisfied for the DSM-5 diagnosis to be made?

**New correct:** The behaviors must occur in the context of extremes of insufficient care, such as repeated changes of caregivers or rearing in settings that limit selective attachments

---

## Q0201 — MEDIUM — FIXED
Occurrences (3): questionsGPT/4 Development/4 Cognitive Development.json; examsGPT/practice-exam-16.json; examsGPT/practice-exam-8.json

Why it leaked: the child focuses on the single dimension of height while ignoring that the cylinder is narrower

**Old stem:** A 4-year-old watches as an experimenter pours water from a short, wide beaker into a tall, narrow cylinder and asks whether the amount of water changed. The child says 'there's more now because it's taller,' ignoring that the cylinder is narrower. According to Piaget, the specific cognitive limitation most directly responsible for this error is:

**Old correct:** Centration, because the child focuses on the single dimension of height while ignoring the dimension of width

**New stem:** A 4-year-old watches an experimenter pour water from a short, wide beaker into a tall, narrow cylinder, then asks whether the amount of water is the same. The child looks at the cylinder, points to the high water line, and says, "There's more now." According to Piaget, which preoperational limitation most directly accounts for the child's judgment?

**New correct:** Centration: the child attends to one salient feature of the display at a time rather than coordinating multiple features simultaneously

---

## Q0216 — MEDIUM — FIXED
Occurrences (3): questionsGPT/4 Development/4 School and Family.json; examsGPT/practice-exam-5.json; examsGPT/practice-exam-7.json

Why it leaked: significant distress at school, including refusal to use the girls' restroom and daily crying before school

**Old stem:** A 7-year-old child assigned female at birth has, for the past 8 months, strongly insisted on being called by a male name, expressed a persistent desire to be a boy, preferred rough-and-tumble play exclusively with male peers, and refused to wear feminine clothing. The child's parents report significant distress at school, including refusal to use the girls' restroom and daily crying before school. According to DSM-5, which of the following is required in addition to the specified incongruence criteria to diagnose Gender Dysphoria in Children?

**Old correct:** Clinically significant distress or impairment in social, school, or other important areas of functioning

**New stem:** A 7-year-old child assigned female at birth has, for the past 8 months, strongly insisted on being called by a male name, expressed a persistent desire to be a boy, preferred rough-and-tumble play exclusively with male peers, and refused to wear feminine clothing. The clinician has confirmed that the marked incongruence between the child's experienced gender and assigned gender meets the indicator criteria. According to DSM-5, what else must be established before the diagnosis of Gender Dysphoria in Children can be made?

**New correct:** The incongruence is associated with clinically significant distress or impairment in important areas of functioning

---

## Q0252 — MEDIUM — FIXED
Occurrences (1): questionsGPT/5 Assessment/5 MMPI.json

Why it leaked: the measure omits supervisory competence, interdisciplinary consultation skills, administrative contributions, and training program involvement—all of which are established components of the performance domain for this role

**Old stem:** A researcher develops a performance appraisal instrument for hospital-based clinical psychologists that measures only session count, client symptom reduction scores, and therapy completion rates. An expert review panel notes that the measure omits supervisory competence, interdisciplinary consultation skills, administrative contributions, and training program involvement—all of which are established components of the performance domain for this role. The panel's primary psychometric concern regarding this instrument is best described as:

**Old correct:** Criterion deficiency, because the criterion measure fails to capture the full scope of the performance construct

**New stem:** A researcher develops a performance appraisal instrument for hospital-based clinical psychologists. Each psychologist is scored only on session count, client symptom reduction scores, and therapy completion rates. In this hospital, the formal duties of the role also include providing clinical supervision, participating in interdisciplinary consultation, handling administrative responsibilities, and contributing to training programs. An expert review panel examines how the instrument functions as a measure of overall job performance. The psychometric concern the panel should raise is best described as:

**New correct:** Criterion deficiency

---

## Q0280 — MEDIUM — FIXED
Occurrences (3): questionsGPT/6 Clinical Interventions/6 Brief Therapies.json; examsGPT/practice-exam-15.json; examsGPT/practice-exam-5.json

Why it leaked: deliberately try to stay awake as long as you possibly can. Do not try to sleep.' The therapist explains that attempting to follow this instruction will interrupt the performance anxiety that is perpetuating the insomnia

**Old stem:** A therapist treating a client with chronic insomnia instructs her: 'Tonight, instead of trying to force yourself to fall asleep, I want you to lie in bed in the dark and deliberately try to stay awake as long as you possibly can. Do not try to sleep.' The therapist explains that attempting to follow this instruction will interrupt the performance anxiety that is perpetuating the insomnia. This intervention is best identified as:

**Old correct:** Paradoxical intention, in which the client is instructed to deliberately attempt to produce or amplify the very symptom causing distress

**New stem:** A therapist treating a client with chronic insomnia gives her the following instruction: "Tonight, when you get into bed, lie in the dark and keep your eyes open. Make it your goal to remain awake for as long as you can, rather than working at falling asleep." The client follows the instruction over the next two weeks and reports that her sleep latency has noticeably decreased. This intervention is best identified as:

**New correct:** Paradoxical intention

---

## Q0310 — MEDIUM — FIXED
Occurrences (2): questionsGPT/7 Research and Stats/7 Correlation and Regression.json; examsGPT/practice-exam-5.json

Why it leaked: the spread of Y scores is roughly the same at every level of X, and the data points form a circular cloud with no discernible pattern

**Old stem:** A researcher plots the relationship between a predictor variable (X) and a criterion variable (Y) on a scatterplot. She notices that the spread of Y scores is roughly the same at every level of X, and the data points form a circular cloud with no discernible pattern. Which of the following BEST describes this situation?

**Old correct:** The variables show homoscedasticity with a correlation near zero

**New stem:** A researcher plots a predictor variable (X) against a criterion variable (Y). Near the low end of X, the Y values sit in a tight, narrow band; as X increases, the points fan outward into an increasingly wide vertical band. Across the whole plot the points still trend clearly and consistently upward from lower-left to upper-right. Which of the following BEST describes this situation?

**New correct:** The data show a strong positive correlation accompanied by heteroscedasticity

---

## Q0312 — MEDIUM — FIXED
Occurrences (2): questionsGPT/7 Research and Stats/7 Correlation and Regression.json; examsGPT/practice-exam-6.json

Why it leaked: clients of therapists with fewer than 5 years of experience show highly variable outcome ratings ... while clients of therapists with more than 15 years of experience show consistently high ratings with little variability

**Old stem:** A researcher creates a scatterplot showing the relationship between therapist experience (X) and client outcome ratings (Y). She notices that clients of therapists with fewer than 5 years of experience show highly variable outcome ratings (ranging from very poor to excellent), while clients of therapists with more than 15 years of experience show consistently high ratings with little variability. This pattern MOST directly indicates a violation of which assumption?

**Old correct:** Homoscedasticity, meaning the variability in criterion scores differs across levels of the predictor

**New stem:** A researcher fits a linear regression predicting client outcome ratings (Y) from therapist years of experience (X). When she plots the residuals against the predicted values, the points form a fan shape: the residuals are widely scattered at low predicted values and cluster tightly near zero at high predicted values. Which assumption of ordinary least squares regression does this residual pattern MOST directly indicate has been violated?

**New correct:** Homoscedasticity

---

## Q0318 — MEDIUM — FIXED
Occurrences (3): questionsGPT/7 Research and Stats/7 Internal and External Validity.json; examsGPT/practice-exam-12.json; examsGPT/practice-exam-9.json

Why it leaked: a significant political event occurs that influences participants' responses

**Old stem:** During a psychological experiment, a significant political event occurs that influences participants' responses. This scenario demonstrates a threat to validity known as:

**Old correct:** History, since an external event has influenced the study.

**New stem:** A researcher uses a single-group pretest-posttest design to evaluate an 8-month workplace stress-reduction program. Employees complete the same anxiety inventory at baseline and again at the end of the program. Midway through the study period, the company announces a large, unexpected round of layoffs. Posttest anxiety scores are higher than pretest scores. Which threat to internal validity is the BEST explanation for the score change?

**New correct:** History, because an event unrelated to the program occurred during the study period and could account for the score change

---

## Q0324 — MEDIUM — FIXED
Occurrences (2): questionsGPT/7 Research and Stats/7 Research Designs.json; examsGPT/practice-exam-8.json

Why it leaked: a significant interaction effect but NO significant main effects

**Old stem:** A researcher conducts a 2 × 3 factorial ANOVA examining the effects of therapy type (CBT vs. psychodynamic) and session frequency (weekly, biweekly, monthly) on depression scores. The results reveal a significant interaction effect but NO significant main effects. Which interpretation is MOST appropriate?

**Old correct:** The effect of therapy type on depression depends on session frequency, even though neither variable has a consistent overall effect across all conditions

**New stem:** A researcher runs a 2 x 3 factorial ANOVA on depression scores (lower = better) crossing therapy type (CBT vs. psychodynamic) with session frequency (weekly, biweekly, monthly). The cell means are: CBT/weekly = 10, CBT/biweekly = 20, CBT/monthly = 30; psychodynamic/weekly = 30, psychodynamic/biweekly = 20, psychodynamic/monthly = 10. (Each marginal mean for therapy type and for frequency equals 20.) Which interpretation of this pattern is MOST appropriate?

**New correct:** Which therapy produces lower depression scores reverses across frequency levels, so neither therapy nor frequency has an overall advantage even though they jointly determine outcomes

---

## Q0330 — MEDIUM — FIXED
Occurrences (4): questionsGPT/7 Research and Stats/7 Stats Tests.json; examsGPT/practice-exam-10.json; examsGPT/practice-exam-12.json; examsGPT/practice-exam-9.json

Why it leaked: where some married couples are both included in the sample

**Old stem:** A researcher uses a chi-square test to examine whether diagnosis type (anxiety disorder, mood disorder, or personality disorder) is associated with treatment preference (medication, psychotherapy, or combined). She collects data by surveying 150 clients at a clinic, where some married couples are both included in the sample. What assumption of the chi-square test is MOST likely violated?

**Old correct:** The assumption of independence of observations, because married couples' responses may be correlated

**New stem:** A researcher runs a chi-square test of independence to examine whether diagnosis type (anxiety, mood, or personality disorder) is associated with treatment preference (medication, psychotherapy, or combined). To reach 150 responses quickly, she surveys 75 clients and also has each client's cohabiting partner, who attends the same clinic, complete the survey, entering all 150 responses into one contingency table. Which assumption of the chi-square test does this sampling procedure MOST directly violate?

**New correct:** Independence of observations, because pairing partners from the same household links responses that the test requires to be unrelated

---

## Q0356 — MEDIUM — FIXED
Occurrences (3): questionsGPT/8 Ethics/8 Standards 3 and 4.json; examsGPT/practice-exam-13.json; examsGPT/practice-exam-7.json

Why it leaked: she also has direct hiring and firing authority ... regarding multiple relationships in supervision, which factor creates the GREATEST ethical concern

**Old stem:** Dr. Torres is the clinical director of a community mental health center. She is asked to provide individual clinical supervision to Dr. Reyes, a newly licensed psychologist at the center, over whom she also has direct hiring and firing authority. According to ethical considerations regarding multiple relationships in supervision, which factor creates the GREATEST ethical concern in this arrangement?

**Old correct:** The combination of evaluative supervisory power and administrative authority over employment creates a significant power differential

**New stem:** Dr. Torres is the clinical director of a community mental health center. She provides Dr. Reyes, a staff psychologist at the center, with weekly individual clinical supervision and also conducts the annual performance evaluation that determines whether Dr. Reyes's employment contract is renewed. The arrangement is disclosed to and permitted by the agency. A colleague raises a concern about combining these two roles. From an ethical standpoint, what is the principal reason this dual-role arrangement warrants caution?

**New correct:** Layering employment-decision authority onto the supervisory role gives the supervisor coercive leverage that can pressure the supervisee's clinical and professional choices, compromising the supervisee's autonomy

---

## Q0365 — MEDIUM — FIXED
Occurrences (9): questionsGPT/8 Ethics/8 Standards 3 and 4.json; examsGPT/practice-exam-10.json; examsGPT/practice-exam-11.json; examsGPT/practice-exam-12.json; examsGPT/practice-exam-13.json; examsGPT/practice-exam-15.json; examsGPT/practice-exam-16.json; examsGPT/practice-exam-8.json; examsGPT/practice-exam-9.json

Why it leaked: clinical psychologist who also serves as the clinical director ... One of her direct supervisees has requested that she also provide individual clinical supervision ... Which factor ... would be MOST relevant

**Old stem:** Dr. Okafor is a clinical psychologist who also serves as the clinical director at a community mental health center. One of her direct supervisees has requested that she also provide individual clinical supervision for licensure hours. Which factor from Gottlieb's decision-making model would be MOST relevant in evaluating this arrangement?

**Old correct:** The power differential inherent in Dr. Okafor's administrative authority combined with supervisory authority

**New stem:** A licensed psychologist who already holds an ongoing professional relationship with a less-experienced colleague is weighing whether to take on an additional, second professional role with that same person. The psychologist decides to work through Gottlieb's decision-making model before agreeing. Across which set of dimensions does Gottlieb's model direct the psychologist to evaluate each of the two relationships when deciding whether the added role is likely to be harmful?

**New correct:** The degree of power held over the other person, the expected duration of the relationship, and the clarity with which the relationship will eventually terminate

---

## Q0413 — MEDIUM — FIXED
Occurrences (2): examsGPT/practice-exam-12.json; examsGPT/practice-exam-8.json

Why it leaked: chronic stress from financial insecurity, restricted access to healthcare, exposure to neighborhood violence, and lack of social capital directly cause the elevated rates of psychiatric disorder in low-SES communities

**Old stem:** A community mental health researcher documents that the prevalence of major depressive disorder, schizophrenia, and anxiety disorders is significantly higher in the lowest income quintile than in the highest. She argues that chronic stress from financial insecurity, restricted access to healthcare, exposure to neighborhood violence, and lack of social capital directly cause the elevated rates of psychiatric disorder in low-SES communities. This argument is most consistent with which theoretical position?

**Old correct:** The social causation hypothesis, which proposes that the adversity conditions associated with low SES directly increase vulnerability to mental illness

**New stem:** A community mental health researcher tracks a birth cohort from childhood into adulthood. Children raised in the lowest income quintile go on to develop major depressive disorder, anxiety disorders, and schizophrenia at substantially higher rates than children raised in the highest quintile, even after the researcher statistically controls for each participant's own adult income and adjusts for any decline in status that followed illness onset. To explain why the association between low childhood SES and later psychiatric disorder persists after these controls, which theoretical position is the researcher's finding most consistent with?

**New correct:** The social causation hypothesis

---

## Q0054 — LOW — FIXED
Occurrences (3): questionsGPT/2 3 5 6 I-O Psychology/2 3 Work Satisfaction.json; examsGPT/practice-exam-10.json; examsGPT/practice-exam-16.json

Why it leaked: units with the lowest mean job satisfaction scores show the highest rates of voluntary employee turnover

**Old stem:** An industrial-organizational psychologist reviews exit interview data and employee satisfaction surveys from a large healthcare organization. She finds that units with the lowest mean job satisfaction scores show the highest rates of voluntary employee turnover. Which of the following best characterizes this statistical relationship?

**Old correct:** A negative correlation, indicating that lower satisfaction predicts greater likelihood of leaving

**New stem:** An industrial-organizational psychologist is consulting with a large healthcare organization that wants to reduce voluntary employee turnover. Leadership asks her to summarize what the empirical research literature establishes about the link between employees' job satisfaction and their decision to quit. Which statement most accurately reflects the findings on this relationship?

**New correct:** Job satisfaction shows a modest negative association with voluntary turnover, and its influence operates largely through withdrawal cognitions such as intention to quit

---

## Q0351 — LOW — FIXED
Occurrences (3): questionsGPT/8 Ethics/8 Standards 1 and 2.json; examsGPT/practice-exam-1.json; examsGPT/practice-exam-4.json

Why it leaked: psychologists whose personal conduct may impact their professional role

**Old stem:** Which of the following best reflects the ethical considerations for psychologists whose personal conduct may impact their professional role, according to APA guidelines?

**Old correct:** Psychologists should evaluate if personal actions overlap professional roles and potentially affect credibility or clients

**New stem:** A licensed psychologist is arrested for shoplifting at a department store on a weekend. The incident does not involve any current or former client, occurs while the psychologist is off duty, and is not publicized. A colleague who learns of it files a complaint with the APA Ethics Committee asserting that the arrest reflects poorly on the profession. In deciding whether the Ethics Code reaches this conduct, which standard governs the Committee's jurisdictional analysis?

**New correct:** Whether the conduct is part of the psychologist's scientific, educational, or professional activities, since the Code's applicability is defined by that role connection rather than by where or when the behavior occurs

---

