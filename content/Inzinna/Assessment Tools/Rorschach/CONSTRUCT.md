# CONSTRUCT.md

**Status:** Decision pending. Awaiting Dr. Inzinna's pick.
**Owner:** Inzinna decides; Anders frames options.

---

## Why this decision comes first

Every other decision in this project (stimulus style, scoring framework, sample, convergent measures, journal target) flows from what we say the instrument measures. The original Rorschach's scientific troubles came largely from claiming to measure too many things at once. A narrow construct publishes faster, validates cleaner, and gives us something defensible to submit for peer review.

The question is not "what can an inkblot measure." The question is: given that we want a publishable Phase 1 pilot in 12 to 18 months, what single construct do we anchor the instrument to?

---

## What a good construct looks like for us

A construct is a good fit if all of these are true:

1. It has an **existing validated self-report or interview measure** we can correlate with for convergent validity.
2. It has **clinical relevance** so the paper lands in a clinical psychology journal, not a methods journal.
3. It can be **elicited by ambiguous visual stimuli** (otherwise why inkblots).
4. It is **narrow enough to operationalize** in a scoring framework we can train raters on in one afternoon.
5. There is **a reason a projective format adds something** over the existing self-report.

---

## Candidate constructs

### Option 1. Thought disorder and perceptual organization

**What it measures.** How coherently a person organizes ambiguous visual input. Signs of loose associations, idiosyncratic logic, distorted form perception.

**Why it fits inkblots.** Classic Rorschach strength. The card pull is ambiguous by design. Weird responses under ambiguity have a long psychometric history (Thought Disorder Index, Perceptual Thinking Index).

**Convergent measures.** PID-5 Psychoticism scale, Schizotypal Personality Questionnaire (SPQ), Chapman Perceptual Aberration Scale, MMPI-3 Thought Dysfunction scale.

**Clinical relevance.** Subclinical schizotypy detection, psychosis risk screening, early intervention.

**Publication path.** Journal of Personality Assessment, Psychological Assessment, Schizophrenia Research. Solid fit.

**Risk.** Inherits some of the original Rorschach's baggage. Reviewers will immediately compare against Exner Perceptual Thinking Index.

---

### Option 2. Adult attachment style and relational schemas

**What it measures.** Internal working models of self and other, projected onto ambiguous stimuli (e.g., is the figure in the blot alone, with someone, threatening, nurturing).

**Why it fits inkblots.** What someone projects onto ambiguity is a well-theorized route to implicit attachment representations. Less "is this blot a bat" and more "tell me what is happening in this image."

**Convergent measures.** Experiences in Close Relationships Revised (ECR-R), Adult Attachment Interview (AAI, expensive), Relationship Scales Questionnaire (RSQ).

**Clinical relevance.** High. Attachment-informed therapy intake, couples assessment, clinical formulation.

**Publication path.** Attachment & Human Development, Journal of Personality Assessment, Psychotherapy Research.

**Risk.** Coding attachment themes is harder than coding perceptual organization. Rater training is longer.

---

### Option 3. Affect regulation under ambiguity

**What it measures.** How people manage emotional arousal when confronted with ambiguous emotionally-tinged stimuli. Do they approach, avoid, intellectualize, dysregulate.

**Why it fits inkblots.** Ambiguous stimuli safely elicit affective response without a specific trigger. Response latency, length, affective tone, and shifts across cards all index regulation.

**Convergent measures.** Difficulties in Emotion Regulation Scale (DERS), Emotion Regulation Questionnaire (ERQ), PID-5 Negative Affectivity.

**Clinical relevance.** High for DBT, MBT, emotion-focused intake. Pairs well with Inzinna's practice if that's a relevant population.

**Publication path.** Assessment, Journal of Personality Assessment, Psychological Assessment.

**Risk.** "Affect regulation" is contested construct space. Need to commit to a specific operational definition (appraisal? response latency? response content?).

---

### Option 4. Personality pathology signature (dimensional, PID-5 aligned)

**What it measures.** Projective signatures of the five PID-5 domains (Negative Affectivity, Detachment, Antagonism, Disinhibition, Psychoticism). Basically: can inkblot responses predict dimensional personality pathology scores.

**Why it fits inkblots.** Classic projective hypothesis applied to modern dimensional model. Each domain gets its own theoretically-driven coding rubric.

**Convergent measures.** PID-5, Level of Personality Functioning Scale Self Report (LPFS-SR), PAI, MMPI-3.

**Clinical relevance.** Very high. DSM-5-TR Alternative Model for Personality Disorders is the field direction. A projective instrument aligned to AMPD is publishable and clinically useful.

**Publication path.** Personality Disorders: Theory, Research, and Treatment. Assessment. Journal of Personality Assessment.

**Risk.** Most ambitious option. Five constructs at once dilutes the pilot. Could narrow to one or two domains for Phase 1.

---

### Option 5. Creativity and imaginative flexibility

**What it measures.** Divergent thinking, fluency, originality, elaboration in response to ambiguous stimuli.

**Why it fits inkblots.** Low-hanging fruit. Inkblots naturally elicit multiple responses.

**Convergent measures.** Alternative Uses Task (AUT), Torrance Tests of Creative Thinking (TTCT), Remote Associates Test.

**Clinical relevance.** Low. More of an educational / organizational psych construct.

**Publication path.** Thinking Skills and Creativity, Creativity Research Journal, Journal of Creative Behavior.

**Risk.** Weakest clinical fit. Good if Anders wants a faster publication but moves the project away from Inzinna's clinical frame.

---

### Option 6. AI-scoring methodology as the primary contribution

**What it measures.** Not a construct about the person. A construct about the method: can LLMs score projective responses with acceptable interrater reliability against human raters, and does LLM-scored output predict an external criterion as well as human-scored output.

**Why it fits inkblots.** The novel contribution is the pipeline, not the instrument. The instrument is a testbed.

**Convergent measures.** IRR (human vs human, human vs LLM), convergent validity with any chosen external measure.

**Clinical relevance.** Indirect. Clinical value comes from making projective assessment cheap and scalable if validated.

**Publication path.** Psychological Assessment (methods piece), Behavior Research Methods, Assessment.

**Risk.** Reviewers will ask "okay but what does the instrument measure." Need to pair with one of Options 1 to 4 as the "example construct" so the paper has a point.

---

## My recommendation framework

Rank by fit for Anders's postdoc publication pipeline + Inzinna's clinical frame:

1. **Option 4 (PID-5 aligned, narrowed to one or two domains)** paired with **Option 6 (AI scoring)**. Most publishable, most defensible, most aligned with DSM-5-TR direction, methodologically novel. Ambitious but tractable if narrowed.
2. **Option 2 (attachment)** paired with **Option 6 (AI scoring)**. High clinical value, clear theoretical grounding, good convergent measures. Solid second choice.
3. **Option 1 (thought disorder)**. Safest psychometrically. Will invite direct Rorschach comparisons, which we want to avoid.
4. **Option 3 (affect regulation)**. Interesting but construct is contested.
5. **Option 5 (creativity)**. Fastest to publication but pulls away from clinical frame.

---

## Decision needed from Inzinna

1. **Which construct (or construct pair) do we anchor to for Phase 1?**
2. **Do we pair the chosen construct with the AI-scoring methodology angle, or keep scoring human-only for Phase 1?**
3. **Journal target** so we know what the reviewer profile is.

Once answered, STIMULUS-GEN.md, SCORING-FRAMEWORK.md, and VALIDATION-PROTOCOL.md can be drafted within a week.

---

## Naming

The instrument should not be called "Rorschach" or "Inzinna Rorschach" or similar in public-facing artifacts, to avoid implying derivation from or replacement of the protected instrument. Working title recommendation: something neutral like "Ambiguous Stimulus Response Task (ASRT)" or a name tied to the specific construct ("Projective Attachment Task", "Dimensional Personality Projective"). Final name after Inzinna picks construct.

Internal repo folder `Rorschach/` can stay for now because it reflects the research origin, but the instrument itself gets a different name once published.
