---
topic_name: Inferential Statistical Tests
domain: 7: Research Methods & Statistics
slug: inferential-statistical-tests
generated_at: 2025-11-15T21:26:07.878Z
model: claude-sonnet-4-5-20250929
version: 1
---

## Why Inferential Statistics Matter for Your Psychology Career

Picture this: You've spent months developing a new therapy protocol for anxiety. Your patients seem to be improving, but is that real change or just random chance? Or imagine you're reviewing research about whether teletherapy works as well as in-person sessions. How do you know if the differences between groups actually mean something?

This is where inferential statistics become your best friend. These tools help you answer one critical question: "Is what I'm seeing real, or could it be just luck?" Whether you're conducting research, reading journal articles to inform your practice, or evaluating treatment outcomes, understanding these tests helps you separate meaningful patterns from statistical noise.

## The Foundation: Two Families of Tests

Think of inferential statistics like a restaurant menu divided into two sections. One section is for people with dietary restrictions, and the other is for everyone else. In statistics, we have nonparametric tests (the restricted menu) and parametric tests (the regular menu).

**Parametric tests** are like high-performance sports cars. They're powerful and efficient, but they need specific conditions to work properly. They require:
- Data measured on interval or ratio scales (numbers with equal distances between them)
- Normal distribution (that bell curve shape you've seen)
- Similar variances across groups (the spread of scores should be comparable)

Common parametric tests include t-tests and analysis of variance (ANOVA).

**Nonparametric tests** are like all-terrain vehicles. They're not as powerful, but they work under rougher conditions. You use them when:
- Your data are categories or ranks (nominal or ordinal data)
- Your assumptions for parametric tests aren't met
- Your sample sizes are small and unequal

The chi-square test is your go-to nonparametric option.

Here's a practical rule: If you have interval or ratio data but your groups are small, unequal, and your data look weird (not normally distributed), switch to the nonparametric option even though you technically have the "right" type of data for parametric tests.

## Choosing Your Statistical Test: A Decision Tree

Selecting the right test is like diagnosing a patient. You gather information systematically:

1. **What type of data do you have?** (This narrows your options significantly)
2. **How many independent variables?**
3. **How many levels of each independent variable?**
4. **Are your groups related or independent?**
5. **Do you need to control for something?**
6. **How many dependent variables?**

Let's break down each test you'll need to know.

## The Chi-Square Test: Working with Categories

The chi-square test analyzes frequencies—how many people fall into different categories. You're essentially asking: "Does the pattern I'm seeing match what I'd expect by chance?"

There are two versions:

### Single-Sample Chi-Square (Goodness-of-Fit)

Use this when you have one variable with different categories. 

**Example:** You survey 200 psychology students about their preferred study method: video lectures, reading, or practice tests. You want to know if preferences are equally distributed or if one method is significantly more popular.

### Multiple-Sample Chi-Square (Test for Contingency Tables)

Use this when you have two or more variables and want to see if they're related.

**Example:** You expand your study to examine both preferred study method AND course format (online vs. in-person). Now you have two variables creating multiple categories: prefer videos/online course, prefer videos/in-person course, prefer reading/online course, etc.

A helpful trick: Count ALL your variables. One variable = single-sample test. Two or more variables = multiple-sample test.

| Chi-Square Type | Number of Variables | Example |
|----------------|---------------------|---------|
| Single-sample (goodness-of-fit) | 1 | Do therapy clients prefer morning, afternoon, or evening appointments? |
| Multiple-sample (contingency) | 2+ | Is there a relationship between client age group (young/middle/older) and preferred appointment time? |

## The t-Test: Comparing Two Means

The t-test is your tool when you're comparing two averages. Think of it like comparing your bank account balance before and after payday, or comparing your average Uber rating as a driver versus your friend's.

You need:
- One independent variable with exactly two levels (two groups)
- One dependent variable measured on an interval or ratio scale

### Three Types of t-Tests

**1. Single-Sample t-Test**

Compare your sample to a known standard.

**Example:** The average score on a depression inventory for the general population is 10. You test a sample of college students during finals week and get an average of 18. Is this significantly different from the general population?

**2. t-Test for Unrelated (Independent) Samples**

Compare two separate groups.

**Example:** You randomly assign clients to either cognitive-behavioral therapy or psychodynamic therapy and compare their depression scores after treatment. The groups are independent—different people in each group.

**3. t-Test for Related (Paired) Samples**

Compare two means when there's a connection between the groups. This happens in three scenarios:

- **Natural pairs:** Comparing identical twins where one twin gets treatment A and the other gets treatment B
- **Matched pairs:** You pair clients based on initial severity scores, then assign one from each pair to different treatments
- **Same person measured twice:** Your classic pretest-posttest design (which is why it's called "related"—each person is literally related to themselves!)

**Example:** You measure anxiety levels in clients before therapy starts and again after 12 sessions. Each person serves as their own control.

## One-Way ANOVA: Comparing Multiple Groups

When you have more than two groups to compare, the one-way ANOVA (Analysis of Variance) takes over. You could technically do multiple t-tests, but there's a problem: every time you run another statistical test, you increase your chances of finding a "significant" result by pure luck.

It's like playing the lottery. Buy one ticket, your odds of winning are low. Buy 100 tickets, your odds go up—not because you're luckier, but because you're taking more chances. In statistics, this increased risk of a false positive is called **experimentwise error rate**.

### The ANOVA Solution

Say you're comparing three therapy approaches: CBT, ACT, and interpersonal therapy. Instead of three separate t-tests (CBT vs. ACT, CBT vs. interpersonal, ACT vs. interpersonal), one-way ANOVA analyzes all groups simultaneously while keeping your error rate under control.

### Understanding the F-Ratio

ANOVA produces an F-ratio, which is essentially a fraction:

**F = Variation between groups (treatment effect + error) / Variation within groups (error only)**

Think of this like signal-to-noise ratio on your phone. The top number (numerator) includes the actual signal you want plus background static. The bottom number (denominator) is just the static. If your F-ratio is bigger than 1.0, you've got more signal than noise—suggesting your treatment actually did something.

Whether this reaches "statistical significance" depends on:
- Your alpha level (usually .05)
- Your degrees of freedom (calculated from sample size and number of groups)

**Degrees of freedom for one-way ANOVA:**
- Between groups: Number of groups - 1
- Within groups: Total sample size - Number of groups

**Example:** You test three medications with 12 patients per group (36 total). Your degrees of freedom are 2 (3-1) and 33 (36-3).

## Extended Family: Other ANOVA Types

| ANOVA Type | When to Use | Example |
|-----------|-------------|---------|
| **Factorial ANOVA** | Multiple independent variables | Comparing therapy type (CBT/ACT/Control) AND therapist experience (novice/expert) |
| **Mixed ANOVA** | At least one between-subjects AND one within-subjects variable | Testing medication (between: different patients get different meds) over time (within: same patients measured monthly) |
| **Randomized Block ANOVA** | Control an extraneous variable by including it as an IV | Including depression severity as a factor when testing anxiety treatments |
| **ANCOVA** | Control an extraneous variable statistically | Removing the effect of baseline anxiety when comparing post-treatment scores |
| **MANOVA** | Multiple dependent variables | Measuring both depression AND anxiety as outcomes |
| **Trend Analysis** | Looking for linear or curved relationships | Testing if therapy effectiveness increases steadily with session number or peaks then levels off |

## Digging Deeper: Planned Comparisons and Post Hoc Tests

Here's a frustrating moment: Your ANOVA comes back significant. Great! But... which groups are actually different from each other? That F-ratio just told you "something's different somewhere," not where the differences are.

### Planned Comparisons (A Priori Tests)

These are predictions you make BEFORE collecting data, based on theory or past research.

**Example:** You're testing four study methods but specifically hypothesize that spaced repetition will outperform cramming. You don't care about all possible comparisons—just that specific one. You plan this comparison upfront, which gives you more statistical power and requires fewer corrections.

### Post Hoc Tests (A Posteriori Tests)

These are fishing expeditions AFTER finding a significant F-ratio. You want to know which specific groups differ.

**Example:** Your ANOVA showed a significant difference among your four study methods, so now you compare all possible pairs: Method A vs. B, A vs. C, A vs. D, B vs. C, B vs. D, and C vs. D.

The problem? Remember that experimentwise error rate? With six comparisons at alpha = .05 each, your actual risk of a false positive skyrockets.

### Controlling Error Rate

**Bonferroni correction:** Divide your alpha by the number of tests. With 6 comparisons and alpha = .05, each test uses alpha = .0083 (.05/6). It's simple but conservative—sometimes too conservative, making it harder to find real differences.

**Specialized post hoc tests:** Different situations call for different tests:
- **Tukey's HSD:** Good all-around choice for comparing all pairs
- **Scheffé test:** Most conservative, best for complex comparisons
- **Newman-Keuls:** Less conservative, sequential approach

## Beyond Statistical Significance: Does It Actually Matter?

Here's where statistics gets real. Your study found a "statistically significant" difference. Congratulations! But should anyone care?

### Practical Significance (Effect Size)

Statistical significance tells you if an effect is real. Effect size tells you if it's big enough to matter.

**Cohen's d** measures the difference between groups in standard deviation units:

d = (Mean difference between groups) / (Pooled standard deviation)

**Example:** Your new therapy reduces anxiety by 5 points compared to a control group. The pooled standard deviation is 10. Cohen's d = 5/10 = 0.5

**Interpretation guidelines:**
- d < 0.2: Small effect (like losing 2 pounds)
- d = 0.2 to 0.8: Medium effect (like losing 10 pounds)
- d > 0.8: Large effect (like losing 40 pounds)

Here's the catch: With a huge sample size, even tiny, practically meaningless differences can be "statistically significant." A medication might lower anxiety by 0.5 points (barely noticeable), but with 10,000 participants, that tiny difference could be statistically significant. Effect size prevents you from being fooled.

### Clinical Significance: Real-World Change

Even a large effect size doesn't guarantee clinical significance—meaningful improvement in someone's life.

**Example:** Your therapy reduces depression scores by a full standard deviation (large effect!). But does that mean your clients went from "clinically depressed" to "functioning normally"? Or from "severely depressed" to "moderately depressed"? The former matters more to actual lives.

### The Jacobson-Truax Method

This two-step approach evaluates clinical significance for each individual:

**Step 1: Reliable Change Index (RCI)**

RCI = (Posttest score - Pretest score) / Standard error of the difference

If RCI is greater than +1.96 or less than -1.96, the change is reliable (not just measurement error).

**Step 2: Cutoff Score**

Determine the score that separates "dysfunctional" from "functional." Often calculated as the midpoint between clinical and normal populations.

**Classification:**
- **Recovered:** Reliable improvement AND crossed into functional range
- **Improved:** Reliable improvement BUT still in dysfunctional range
- **Unchanged:** No reliable change
- **Deteriorated:** Reliable change in the wrong direction

**Real scenario:** Your client started therapy with a depression score of 35 (clinical range). After treatment, their score is 12 (normal range). The RCI shows this change is reliable, and they crossed the cutoff score of 20. They're classified as recovered—this is clinically significant change.

## Common Misconceptions

**Myth #1:** "Parametric tests are always better than nonparametric tests."

Reality: Only when assumptions are met. With small, skewed samples, nonparametric tests are more accurate.

**Myth #2:** "A p-value of .051 means there's no effect."

Reality: Statistical significance is arbitrary. The difference between p = .049 and p = .051 is trivial, but one crosses a magic line we've agreed upon. Always consider effect size and practical significance.

**Myth #3:** "I can't use ANOVA with only two groups."

Reality: You can, but t-test is traditional. They actually give equivalent results (F = t²).

**Myth #4:** "Statistical significance means my treatment works well."

Reality: It means your treatment had a detectable effect. "Well" requires examining effect size and clinical significance.

**Myth #5:** "Post hoc tests are a backup plan for when I didn't plan ahead."

Reality: While they're conducted after finding significance, well-designed studies often anticipate needing them. Planned comparisons are different—they're specific hypotheses made before data collection.

## Practice Tips for Remembering

**For choosing tests, use this decision tree:**

1. What type of data? → Categories = Chi-square; Numbers = Move to #2
2. How many groups to compare? → Two = t-test; More than two = ANOVA
3. (For t-test) Related groups? → Yes = Paired t-test; No = Independent t-test
4. (For ANOVA) Multiple IVs? → Yes = Factorial; One IV = One-way
5. Need to control something? → Yes = ANCOVA or randomized block

**Memory aid for chi-square:** "Chi" sounds like "category"—both start with 'c', and chi-square works with categorical data.

**Memory aid for related vs. unrelated:** Related = repeated or matched. Ask: "Are people connected somehow?" Same person twice? Matched pairs? Siblings? Then use related samples test.

**Memory aid for F-ratio:** F = Fancy effect / Fundamental noise. You want the fancy treatment effect to be bigger than fundamental random noise.

**Bonferroni trick:** Just remember "Bon" = "Divide" (bond/divide, both have d's). Bonferroni = divide alpha by number of tests.

**Effect size relevance:** Small, Medium, Large = .2, .5, .8 for Cohen's d. Think "2-5-8" like a phone number prefix.

## Key Takeaways

- **Parametric tests** (t-test, ANOVA) are for interval/ratio data with normal distributions; **nonparametric tests** (chi-square) are for categorical data or when assumptions are violated

- **Chi-square** analyzes frequencies across categories; count your variables to pick the right version (one variable = single-sample, multiple variables = multiple-sample)

- **t-tests** compare two means; choose based on sample relationship (single sample vs. population, independent groups, or related/paired groups)

- **One-way ANOVA** compares three or more groups while controlling experimentwise error rate; produces an F-ratio comparing between-group to within-group variation

- **Extended ANOVAs** handle complex designs: factorial (multiple IVs), mixed (between and within), ANCOVA (controlling covariates), MANOVA (multiple DVs)

- **Planned comparisons** test specific pre-specified hypotheses; **post hoc tests** explore all pairwise differences after significant ANOVA

- **Statistical significance** alone isn't enough—also consider **effect size** (Cohen's d) and **clinical significance** (Jacobson-Truax method)

- **Experimentwise error rate** increases with multiple tests; control it using Bonferroni correction or specialized post hoc tests

- The Jacobson-Truax method classifies individuals as recovered, improved, unchanged, or deteriorated based on reliable change AND crossing functional thresholds

Understanding these tests transforms you from a passive consumer of research to someone who can critically evaluate evidence and make informed clinical decisions. That's the real goal behind all these numbers.