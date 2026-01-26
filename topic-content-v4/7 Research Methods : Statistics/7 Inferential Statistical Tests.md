---
topic_name: Inferential Statistical Tests
domain: 7: Research Methods & Statistics
slug: inferential-statistical-tests
generated_at: 2025-11-16T16:34:52.034Z
model: claude-sonnet-4-5-20250929
version: 3
---

## Why Statistical Tests Matter More Than You Think

You're sitting at your desk, analyzing data from a study comparing three therapy approaches for depression. You have numbers, spreadsheets, and a nagging question: "Do these differences actually mean something, or could they have happened by chance?" This is where inferential statistics comes in, the decision-making tool that helps you distinguish between real patterns and statistical noise.

For the EPPP, understanding which statistical test to use isn't about memorizing formulas. It's about developing a mental map that guides you from research question to appropriate analysis. Let's build that map together.

## The Two Main Families of Statistical Tests

Statistical tests fall into two camps: parametric and nonparametric. Understanding the difference will immediately cut your options in half when choosing the right test.

**Parametric tests** work with interval and ratio data (the kind where numbers have consistent meaning across the scale. They include t-tests and ANOVAs. However, these tests are picky. They assume your data is normally distributed (follows a bell curve pattern) and that different groups have similar variances (homogeneity of variances). {{M}}Think of parametric tests like high-maintenance friends who only show up when conditions are perfect{{/M}}) but when they do, they provide powerful insights.

**Nonparametric tests** handle nominal and ordinal data. Categories and rankings. The chi-square test is the main player here. These tests don't require the strict assumptions of parametric tests. Even when you have interval or ratio data, you'll use nonparametric tests if your sample is small, groups are unequal in size, and those parametric assumptions are violated.

Here's the decision path:

| Data Type | Assumptions Met? | Sample Size | Test Family |
|-----------|-----------------|-------------|-------------|
| Interval/Ratio | Yes | Adequate | Parametric |
| Interval/Ratio | No | Small & unequal | Nonparametric |
| Nominal/Ordinal | N/A | Any | Nonparametric |

## The Selection Process: Your Decision Framework

Choosing the right statistical test requires answering specific questions in order:

1. **What's your measurement scale?** (Nominal, ordinal, interval, ratio)
2. **How many independent variables?** (One, two, three or more)
3. **How many levels does each independent variable have?** (Two groups, three groups, etc.)
4. **Are groups related or unrelated?** (Same people measured twice vs. different people)
5. **How many dependent variables?** (One outcome vs. multiple outcomes)
6. **Do you need to control for an extraneous variable?**

Each answer narrows your choices until you land on the right test. Let's explore the major tests you'll encounter.

## The Chi-Square Test: Analyzing Categories

The chi-square test works with nominal data. Frequencies and categories. There are two versions, and a simple trick makes them easy to distinguish: substitute the word "variable" for "sample."

**Single-Sample Chi-Square (Goodness-of-Fit Test):** Use this when you have one variable with multiple categories. {{M}}Imagine surveying your therapy clients about their preferred session format: in-person, telehealth, or hybrid. You have one variable (preference) with three categories.{{/M}} The test tells you whether the distribution of preferences differs from what you'd expect by chance.

**Multiple-Sample Chi-Square (Test for Contingency Tables):** Use this when you have two or more variables. This includes both descriptive studies with multiple variables and experimental studies with independent and dependent variables.

Here's a crucial point: Count ALL variables when deciding which chi-square test to use.

**Example:** You want to know if college students prefer hard-copy or digital textbooks. That's one variable (preference) with two categories. Use the single-sample chi-square.

Now expand this: You also want to see if preference varies by course type (online vs. face-to-face). Now you have two variables: textbook preference and course type. This creates four possible combinations:
- Prefers hard-copy/face-to-face course
- Prefers hard-copy/online course  
- Prefers digital/face-to-face course
- Prefers digital/online course

You'd use the multiple-sample chi-square to analyze these frequencies.

## The Student's t-Test: Comparing Two Means

When you have one independent variable with exactly two levels and one dependent variable measured on an interval or ratio scale, you need a t-test. The t-test compares two means to determine if they're significantly different.

{{M}}Picture comparing average depression scores between clients receiving cognitive-behavioral therapy versus interpersonal therapy.{{/M}} You have two groups (two levels of your independent variable) and one outcome measured on a continuous scale.

There are three types of t-tests, each for a specific situation:

**t-Test for a Single Sample:** Compares a sample mean to a known population mean. {{M}}Say you want to know if psychologists who attended your EPPP workshop scored differently than the national average. You compare your group's mean score to the known population mean.{{/M}}

**t-Test for Unrelated Samples (Independent Samples):** Compares means from two separate, unrelated groups. Typically, this means participants were randomly assigned to groups. These people have no connection to each other before the study.

**t-Test for Related Samples (Paired Samples):** Compares means when there's a meaningful relationship between groups. This happens in three scenarios:

1. Natural pairs (identical twins, spouses)
2. Matched pairs (you pair participants based on similar characteristics, then assign one to each group)
3. Repeated measures (same people measured at two time points. They're "paired with themselves")

| t-Test Type | When to Use | Example |
|-------------|-------------|---------|
| Single sample | Compare sample to known population | Workshop attendees vs. national average |
| Unrelated samples | Two separate groups, randomly assigned | CBT group vs. IPT group |
| Related samples | Paired participants or repeated measures | Same clients at pretest and posttest |

## One-Way ANOVA: Comparing Multiple Groups

When you have one independent variable with more than two levels and one dependent variable on an interval or ratio scale, you need a one-way analysis of variance (ANOVA).

{{M}}Imagine you're comparing four different meditation apps to see which reduces anxiety most effectively. You randomly assign clients to use one of the four apps for eight weeks, then measure their anxiety levels.{{/M}} You have one independent variable (app type) with four levels and one dependent variable (anxiety score).

**Why not just run multiple t-tests?** You could compare App 1 vs. App 2, then App 1 vs. App 3, then App 1 vs. App 4, and so on. But here's the problem: Each statistical test carries a risk of Type I error (falsely concluding there's an effect when there isn't one). When you set alpha at .05, you're accepting a 5% chance of this error per test.

Running multiple tests inflates this risk, the **experimentwise error rate**. With four groups, you'd need six separate t-tests to compare all pairs. If each test has a 5% error rate, your overall risk of making at least one false positive jumps to about 26%. The one-way ANOVA solves this by comparing all groups simultaneously while maintaining your chosen alpha level.

## Understanding the F-Ratio

The ANOVA produces an F-ratio, which has two components:

**Numerator (Mean Square Between. MSB):** Measures variability between groups. This includes both treatment effects (real differences caused by your independent variable) plus random error.

**Denominator (Mean Square Within (MSW):** Measures variability within groups. This is error only) individual differences, measurement inconsistency, and random fluctuation.

When the F-ratio is larger than 1.0, the between-group differences exceed within-group variability, suggesting your independent variable had an effect. Whether this is statistically significant depends on your alpha level and degrees of freedom.

For a one-way ANOVA:
- **Degrees of freedom for MSB** = C, 1 (where C = number of groups)
- **Degrees of freedom for MSW** = N. C (where N = total participants)

{{M}}If you're testing three therapy approaches with 45 total clients (15 per group), you'd have df = 2 for MSB (3-1) and df = 42 for MSW (45-3).{{/M}}

## Advanced ANOVA Variations You Need to Know

**Factorial ANOVA:** For studies with multiple independent variables. A two-way ANOVA has two IVs, a three-way ANOVA has three IVs, and so on. This design produces separate F-ratios for each main effect and all possible interactions. {{M}}For instance, you might study how both therapy type (CBT, ACT, IPT) and session frequency (weekly, biweekly) affect depression. That's a 3 × 2 factorial design.{{/M}}

**Mixed ANOVA (Split-Plot ANOVA):** Used when you have both between-subjects and within-subjects variables in the same study. {{M}}Imagine comparing three therapy types (between-subjects) while measuring clients at baseline, midpoint, and endpoint (within-subjects).{{/M}} This design combines elements of independent and repeated measures.

**Randomized Block ANOVA:** Controls for an extraneous variable by including it as a factor in your analysis. The extraneous variable becomes the "blocking variable." {{M}}If you suspect age affects treatment response, you could block participants into age groups (20-30, 31-40, 41-50) and analyze both treatment effects and age effects.{{/M}}

**ANCOVA (Analysis of Covariance):** Another way to control for an extraneous variable, but instead of including it as a factor, ANCOVA statistically removes its effects from the dependent variable. This variable is called the "covariate." {{M}}You might use baseline depression scores as a covariate when analyzing posttreatment scores. Essentially asking "Do treatments differ after accounting for where people started?"{{/M}}

**MANOVA (Multivariate Analysis of Variance):** For studies with multiple dependent variables, each measured on an interval or ratio scale. {{M}}Rather than running separate ANOVAs for depression scores, anxiety scores, and quality of life scores, MANOVA analyzes all three outcomes simultaneously.{{/M}}

**Trend Analysis:** Used with quantitative independent variables to determine if there's a linear or nonlinear relationship with the dependent variable. {{M}}You might examine how therapy dose (4, 8, 12, or 16 sessions) relates to outcome, testing whether the relationship is linear (steady improvement) or quadratic (rapid initial gains that plateau).{{/M}}

## Digging Deeper: Planned Comparisons and Post Hoc Tests

A significant F-ratio tells you that at least one group differs from others. But not which specific groups differ. This is where planned comparisons and post hoc tests come in.

**Planned Comparisons (A Priori Tests):** Specified before data collection based on theory or hypotheses. {{M}}Suppose you're testing four teaching methods: lectures only (L), lectures with peer study groups (LP), lectures with instructor-led in-person sessions (LIP), and lectures with instructor-led Zoom sessions (LIZ). If your hypothesis specifically predicts that instructor-led sessions outperform lectures alone, you'd plan to compare only L vs. LIP and L vs. LIZ. Not all possible combinations.{{/M}}

**Post Hoc Tests (A Posteriori Tests):** Conducted after obtaining a significant F-ratio when you want to examine all possible group differences. These tests compare every pair of means.

Both approaches face the experimentwise error rate problem. Solutions include:

**Bonferroni Correction:** Divide your alpha by the number of comparisons. If you're making four comparisons with alpha = .05, each comparison uses alpha = .0125 (.05/4). Simple but conservative. It reduces power to detect real effects.

**Specialized Post Hoc Tests:** Different tests for different situations:
- **Tukey's HSD (Honestly Significant Difference):** Good general-purpose test; maintains error rate well
- **Scheffé Test:** Most conservative; use when making complex comparisons
- **Newman-Keuls Test:** Less conservative; more likely to detect real differences but slightly higher error risk

## Beyond Statistical Significance: What Really Matters

A statistically significant result tells you that an effect probably isn't due to chance. But it doesn't tell you if the effect is meaningful. This distinction matters enormously in clinical practice.

**Practical Significance (Effect Size):** Measures the magnitude of an intervention's effect. **Cohen's d** is the most common measure, expressing the difference between groups in standard deviation units.

Calculate it by: (Mean₁. Mean₂) / Pooled SD

Cohen's guidelines:
- **d < 0.2:** Small effect
- **d = 0.2 to 0.8:** Medium effect  
- **d > 0.8:** Large effect

{{M}}Imagine two therapy approaches both show statistically significant improvement over a control group. Therapy A has d = 0.3 (small effect), while Therapy B has d = 1.2 (large effect). Both "work," but Therapy B produces much more substantial change.{{/M}}

For designs with more than two groups, use Cohen's f instead of Cohen's d.

**Clinical Significance:** Even practical significance doesn't tell you if clients move from dysfunctional to functional. {{M}}A therapy might produce statistically significant and practically meaningful reductions in depression symptoms, but do clients actually recover? Do they move from clinical depression to normal mood functioning?{{/M}}

The **Jacobson-Truax Method** assesses clinical significance through two steps:

**Step 1: Calculate Reliable Change Index (RCI)**

RCI = (Posttest score. Pretest score) / Standard error of difference

When RCI exceeds ±1.96 in the expected direction, the change is considered reliable (not due to measurement error).

**Step 2: Determine Cutoff Score**

Identify the score that separates dysfunctional from functional populations. Often calculated as the midpoint between clinical and non-clinical population means.

Then classify each individual:
- **Recovered:** Passed both RCI and cutoff criteria (reliable change into functional range)
- **Improved:** Passed RCI but not cutoff (reliable change, still in dysfunctional range)
- **Unchanged:** Passed neither criterion
- **Deteriorated:** Passed RCI in wrong direction (reliable worsening)

{{M}}This approach is like evaluating a weight loss program not just by average pounds lost, but by how many participants moved from obese to healthy BMI ranges and maintained that change reliably.{{/M}}

## Common Mistakes to Avoid

**Confusing chi-square tests:** Remember the "variable" substitution trick. Count all variables in your study. One variable = single-sample chi-square. Two or more variables = multiple-sample chi-square.

**Using multiple t-tests instead of ANOVA:** This inflates your Type I error rate. When comparing more than two groups, start with ANOVA.

**Forgetting the "related" in related t-tests:** Participants must be meaningfully paired. Through matching, natural relationships, or repeated measurement of the same people.

**Ignoring assumptions:** Parametric tests require normally distributed data and homogeneity of variance. With small, unequal groups and violated assumptions, switch to nonparametric alternatives.

**Stopping at statistical significance:** Always consider effect size. A finding can be statistically significant but practically trivial, especially with large sample sizes.

**Overlooking clinical significance:** In applied settings, ask whether interventions produce meaningful improvement in people's lives, not just significant p-values.

## Memory Aids for Test Selection

**The Scale Narrows Your Choices:**
- Nominal/Ordinal data → Chi-square
- Interval/Ratio data → t-test or ANOVA family

**Count Your IVs and Their Levels:**
- One IV, two levels → t-test
- One IV, 3+ levels → One-way ANOVA
- Multiple IVs → Factorial ANOVA

**Check the Relationship:**
- Unrelated groups → Between-subjects design
- Related groups (paired, matched, repeated) → Within-subjects design
- Both → Mixed ANOVA

**Special Circumstances:**
- Need to control extraneous variable → ANCOVA or Randomized Block ANOVA
- Multiple DVs → MANOVA
- Quantitative IV, examining shape of relationship → Trend Analysis

**Quick Reference Table:**

| Research Question | Test |
|-------------------|------|
| One categorical variable, frequency counts | Single-sample chi-square |
| Two+ categorical variables, frequency counts | Multiple-sample chi-square |
| Compare sample mean to population mean | One-sample t-test |
| Compare two unrelated group means | Independent samples t-test |
| Compare two related group means | Paired samples t-test |
| Compare 3+ unrelated group means | One-way ANOVA |
| Compare groups across 2+ IVs | Factorial ANOVA |
| Compare groups controlling for covariate | ANCOVA |
| Compare groups on multiple DVs | MANOVA |

## Key Takeaways

- **Statistical tests divide into parametric (interval/ratio data, strict assumptions) and nonparametric (nominal/ordinal data, fewer assumptions)**

- **Chi-square analyzes categorical data: single-sample for one variable, multiple-sample for two or more variables**

- **t-tests compare two means: single-sample (vs. population), independent samples (unrelated groups), or paired samples (related groups)**

- **One-way ANOVA compares 3+ group means while controlling experimentwise error rate**

- **Factorial ANOVA handles multiple independent variables; mixed ANOVA combines between and within-subjects factors**

- **ANCOVA controls extraneous variables statistically; randomized block ANOVA includes them as factors**

- **MANOVA analyzes multiple dependent variables simultaneously**

- **Significant F-ratios require follow-up: planned comparisons (theory-driven) or post hoc tests (exploratory)**

- **Effect size (Cohen's d) measures practical significance beyond statistical significance**

- **Clinical significance (Jacobson-Truax method) determines whether individuals move from dysfunctional to functional**

- **Bonferroni correction and specialized post hoc tests control experimentwise error rate**

Understanding these tests isn't about memorization. It's about recognizing patterns. Each research design creates a unique signature that points to a specific test. With practice, you'll develop intuition for matching questions to analyses, a skill that serves you well beyond the EPPP into actual research and practice.