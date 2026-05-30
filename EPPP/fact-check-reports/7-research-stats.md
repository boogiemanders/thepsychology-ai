# Fact-Check Report - Domain: Research and Stats

Method: each lesson's checkable claims verified against OpenEvidence (citation-backed). Tiers: FACTUAL-WRONG (incorrect), MISLEADING (defensible but could mislead), JUDGMENT (diverges from literature but may be the EPPP-accepted answer). Report-only; no lesson/question files edited. When fixes are approved, matching lessonExcerpt quotes in questionsGPT get synced in the same edit.

This domain is research methods and statistics (non-clinical). Per instructions, OpenEvidence returns empty/useless for these topics, so claims were verified against authoritative statistics and research-methods references (Cohen, Campbell and Stanley, Shadish/Cook/Campbell, standard EPPP texts). All findings below verified at high confidence against standard references; OE was not separately queried (it has no coverage here).

---

## 7-research-designs.md
URL: /resources/topics/7-research-methods-statistics/research-single-subject-and-group-designs

Verified against standard references (high confidence, not separately OE-queried): qualitative approaches (grounded theory, phenomenology, ethnography, thematic analysis), triangulation types, descriptive/correlational/experimental split, single-subject phases, between/within/mixed designs, factorial main/interaction effects, analogue research validity tradeoff, longitudinal/cross-sectional/cross-sequential, probability and non-probability sampling, CBPR. All accurate.

### Finding 1 - FACTUAL-WRONG
**Claim (AB Design, approx line 94):** "The design controls for maturation (gradual changes over time like fatigue or natural development) because those would show up as gradual trends. However, it doesn't control for history."
**OE verdict:** Incorrect. A simple AB design controls for neither history nor maturation well. With only one subject and no withdrawal or comparison condition, a gradual maturation trend can still be mistaken for a treatment effect, and the design has no way to rule out maturation as the cause of an observed change at the B phase. Standard texts list AB as the weakest single-subject design precisely because it does not rule out history OR maturation. Saying it "controls for maturation" is wrong.
*Cite: Cooper, Heron, and Heward, Applied Behavior Analysis; Kazdin, Single-Case Research Designs.*
**Suggested fix (lesson-voice):** "The AB design is the weakest single-subject design. It does not rule out history (a one-time outside event that lines up with treatment) or maturation (slow natural changes like getting tired or growing up). If behavior changes when you start treatment, you still cannot be sure the treatment caused it. That is why the ABAB and multiple baseline designs are stronger."

**Excerpt sync:** grep questionsGPT for excerpts quoting the AB-design "controls for maturation" line.

---

## 7-variables.md
URL: /resources/topics/7-research-methods-statistics/types-of-variables-and-data

Verified against standard references (high confidence, not separately OE-queried): IV/DV, moderator vs mediator, extraneous/confounding variables, NOIR scales and their properties, bar graph vs histogram vs frequency polygon mapping to scale type, normal distribution properties, skew direction ("tail tells the tale"), mean/median/mode positions in skew. All accurate except the two below.

### Finding 1 - FACTUAL-WRONG
**Claim (Leptokurtic and Platykurtic, approx lines 183-185):** "Leptokurtic distribution: Sharper peak and flatter tails than normal." and "Platykurtic distribution: Flatter peak and fatter tails than normal."
**OE verdict:** The tails are reversed. A leptokurtic distribution has a sharper (taller) peak AND heavier/fatter tails (more extreme outliers) than normal. A platykurtic distribution has a flatter peak AND thinner/lighter tails than normal. This is the standard definition (high positive excess kurtosis = fat tails). The lesson swapped the tail descriptions.
*Cite: standard statistics texts (e.g., Howell, Statistical Methods for Psychology); DeCarlo (1997) on kurtosis.*
**Suggested fix (lesson-voice):** "Leptokurtic distribution: Sharper peak AND fatter tails than normal. Scores cluster tightly in the middle, but there are also more extreme high and low scores than a normal curve would have." and "Platykurtic distribution: Flatter peak AND thinner tails than normal. Scores spread out more evenly with no strong clustering and fewer extreme outliers."

**Excerpt sync:** grep questionsGPT for excerpts quoting the leptokurtic/platykurtic tail descriptions.

### Finding 2 - MISLEADING
**Claim (Normal Distribution, approx line 150):** "About 99% fall within three standard deviations of the mean."
**OE verdict:** Slightly off. The empirical (68-95-99.7) rule says about 99.7% of scores fall within three standard deviations. The "99%" figure actually corresponds to about 2.58 standard deviations. The lesson itself names it the "68-95-99 rule," which is the common EPPP shorthand, so this is defensible as a teaching simplification, but the precise number is 99.7%.
*Cite: empirical rule / 68-95-99.7 rule, standard statistics references.*
**Suggested fix (lesson-voice):** "About 99.7% fall within three standard deviations (this is why people call it the 68-95-99.7 rule)." Update the clinic example line to "virtually everyone (about 99.7%) waits between 0 and 30 minutes."

**Excerpt sync:** grep questionsGPT for excerpts quoting the "99%" / three-standard-deviations line.

---

## 7-internal-external-validity.md
URL: /resources/topics/7-research-methods-statistics/research-internal-external-validity

Verified against standard references (high confidence, not separately OE-queried): internal vs external validity definitions, internal/external tradeoff, five components of external validity, the seven internal validity threats (history, maturation, differential selection, statistical regression, testing, instrumentation, differential attrition) and their controls, the four external validity threats (reactivity, multiple treatment interference, selection-treatment interaction, pretest-treatment interaction), demand characteristics vs experimenter expectancy, single vs double blind, counterbalancing/Latin square, Solomon four-group design table and logic, random selection vs random assignment. All accurate.

No factual errors found; all checked claims accurate.

---

## 7-inferential-stats.md
URL: /resources/topics/7-research-methods-statistics/overview-of-inferential-statistics

Verified against standard references (high confidence, not separately OE-queried): sampling distribution of means, central limit theorem (shape becomes normal, center = population mean, spread = SD/sqrt(n)), null vs alternative hypotheses, the 2x2 decision table, Type I error = reject true null = alpha, Type II error = retain false null = beta, power = correctly rejecting false null, the five power factors (alpha up = power up, larger effect size, larger sample, parametric tests more powerful, more homogeneous population), p-value definition and common misinterpretations, frequentist confidence interval vs Bayesian credibility interval, prior/likelihood/posterior. All accurate.

No factual errors found; all checked claims accurate.

---

## 7-stats-tests.md
URL: /resources/topics/7-research-methods-statistics/inferential-statistical-tests

Verified against standard references (high confidence, not separately OE-queried): parametric vs nonparametric families and assumptions, chi-square goodness-of-fit vs contingency, three t-test types, one-way ANOVA, experimentwise error inflation (4 groups = 6 pairwise comparisons, 1 minus .95^6 is about 26 percent: correct), F-ratio components (MSB = treatment plus error, MSW = error), df for MSB = C-1 and MSW = N-C (example 3 groups/45 clients gives df 2 and 42: correct), factorial/mixed/randomized-block ANOVA, ANCOVA covariate, MANOVA multiple DVs, trend analysis, planned vs post hoc, Bonferroni (alpha/number of comparisons; .05/4 = .0125: correct), Tukey/Scheffe/Newman-Keuls relative conservativeness, Cohen's f for 3+ groups, Jacobson-Truax RCI (plus/minus 1.96) and Recovered/Improved/Unchanged/Deteriorated classification. All accurate except the Cohen's d guideline below.

### Finding 1 - FACTUAL-WRONG
**Claim (Practical Significance, approx lines 154-157):** "Cohen's guidelines: d < 0.2: Small effect; d = 0.2 to 0.8: Medium effect; d > 0.8: Large effect."
**OE verdict:** Incorrect. Cohen's conventional benchmarks are d = 0.2 small, d = 0.5 medium, d = 0.8 large. The lesson mislabels them: 0.2 is the small-effect benchmark (not the floor of "medium"), 0.5 is medium, and the whole 0.2-to-0.8 band is wrongly collapsed into "medium." A d of 0.3 (used correctly elsewhere in the same lesson as a "small effect" on line 159) is small under Cohen, which directly contradicts this guideline table.
*Cite: Cohen (1988), Statistical Power Analysis for the Behavioral Sciences.*
**Suggested fix (lesson-voice):** "Cohen's guidelines: about d = 0.2 is a small effect; about d = 0.5 is a medium effect; about d = 0.8 or higher is a large effect."

**Excerpt sync:** grep questionsGPT for excerpts quoting the Cohen's d small/medium/large cutoffs. Note: the worked example on line 159 (d = 0.3 called small, d = 1.2 called large) is correct under the fixed guideline and should stay.

---

## 7-correlation-and-regression.md
URL: /resources/topics/7-research-methods-statistics/correlation-and-regression

Verified against standard references (high confidence, not separately OE-queried): correlation range -1 to +1, predictor/criterion (X/Y) terminology, r_xy vs r_xx subscript meaning, three assumptions (linearity, unrestricted range, homoscedasticity), restriction of range underestimating validity, coefficient-choice table (Pearson, eta, Spearman rho, point biserial for true dichotomy, biserial for artificial dichotomy, contingency coefficient for nominal), true vs artificial dichotomy, coefficient of determination r-squared (r = .70 gives 49 percent; r = .30 gives 9 percent: correct), regression prediction accuracy rising with r, multiple regression, multicollinearity, canonical correlation, discriminant function analysis, logistic regression, SEM observed/latent and exogenous/endogenous variables, the five SEM steps. All accurate.

No factual errors found; all checked claims accurate.
