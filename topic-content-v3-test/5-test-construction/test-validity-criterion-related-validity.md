---
topic_name: Test Validity – Criterion-Related Validity
domain: 5: Test Construction
slug: test-validity-criterion-related-validity
generated_at: 2025-11-16T16:23:55.172Z
model: claude-sonnet-4-5-20250929
version: 3
---

## Why Criterion-Related Validity Should Matter to You

Here's a scenario you'll face as a psychologist: A client walks into your office, clearly struggling. You need to decide which assessment to use, and you have limited time. Should you use a brief screening test, or do you need the full diagnostic battery? The answer depends entirely on understanding criterion-related validity – how well one test predicts or estimates performance on another measure.

This isn't just exam trivia. Understanding criterion-related validity helps you make smarter decisions about which assessments to trust, how to interpret test scores, and how to explain limitations to clients, courts, or employers. Let's break this down into concepts you can actually use.

## The Foundation: What Is Criterion-Related Validity?

When psychologists talk about criterion-related validity, they're asking a straightforward question: Can scores on Test A help us predict or estimate scores on Test B? 

The test we're evaluating is called the **predictor** (the test we're considering using). The measure we're trying to predict is called the **criterion** (the outcome we care about).

{{M}}Think of it like dating apps. The dating profile (predictor) tries to predict whether you'll have good chemistry on an actual date (criterion). The app's "validity" depends on how well those profile matches actually translate to real compatibility.{{/M}}

In psychology, we might use a job knowledge test (predictor) to predict future job performance (criterion). Or we might use a brief depression screening (predictor) to estimate scores on a comprehensive diagnostic interview (criterion).

## Two Types: Concurrent vs. Predictive Validity

### Concurrent Validity: Right Now

**Concurrent validity** means we collect predictor and criterion scores at roughly the same time. We use this when we want to estimate someone's *current* status.

{{M}}Imagine you're at the doctor's office. The nurse takes your temperature with a digital thermometer in 10 seconds, while simultaneously another nurse uses an old-fashioned mercury thermometer that takes 5 minutes. They're checking if the quick digital version (predictor) matches the established mercury version (criterion) right now.{{/M}}

In psychology, concurrent validity matters when you want a quick assessment to substitute for a longer, established test. For example, you might validate a 10-minute intelligence screener against a 2-hour comprehensive IQ test, administering both to the same people on the same day.

### Predictive Validity: Future Outcomes

**Predictive validity** means we collect predictor scores first, then wait to collect criterion scores later. We use this when we want to estimate someone's *future* status.

This is crucial for selection decisions. {{M}}It's like a job interview (predictor) trying to predict your actual performance six months into the job (criterion).{{/M}} You collect interview data today, hire people, then evaluate their job performance months later.

In clinical settings, you might use a suicide risk assessment today (predictor) to predict which patients will attempt suicide in the next year (criterion).

## Understanding the Validity Coefficient

Both types of criterion-related validity produce a **validity coefficient** – a correlation between predictor and criterion scores that ranges from -1.0 to +1.0. The closer to plus or minus 1.0, the better the prediction.

Here's what really matters: You can square this coefficient to understand how much of the criterion's variability is explained by the predictor.

Let's say a job knowledge test has a validity coefficient of .70 with job performance. Square that: .70 × .70 = .49, or 49%. This means the knowledge test explains 49% of why some employees perform better than others. The remaining 51% is due to other factors – motivation, workplace support, physical health, whatever.

This squared coefficient helps you stay humble about your predictions. Even a strong validity coefficient of .70 means you're explaining less than half the story.

## The Problem of Shrinkage

Here's something that trips up many test developers. When you first create a predictor, you select the items that correlate most highly with your criterion. But some of those high correlations happened by chance – random fluctuations in your specific sample.

When you test your predictor on a new sample (called **cross-validation**), those chance factors aren't present anymore, and your validity coefficient gets smaller. It "shrinks."

{{M}}It's like when you discover a new route to work that seems amazing – you hit all green lights and no traffic. But when you try it again over the next few weeks, it's never quite as good as that first time. That initial experience included some lucky factors that don't repeat.{{/M}}

Shrinkage is worst when:
- Your initial sample size is small
- You're using many predictors (creating a complex prediction formula)

This is why responsible test development requires validation on multiple samples, not just the one where you developed the test.

## Predicting Individual Scores: Standard Error of Estimate

The validity coefficient tells you about group trends, but what about predicting an individual person's score? This is where the **standard error of estimate** becomes essential.

Unless your validity coefficient is exactly +1.0 or -1.0 (which never happens in real life), there's going to be error in your predictions. The standard error of estimate tells you how much error to expect.

### How to Calculate It

The formula is: Standard Error = SD of criterion × √(1 - r²)

Where SD is the standard deviation of your criterion measure, and r is the validity coefficient.

Let's work through an example: Your criterion measure has a standard deviation of 5, and your validity coefficient is .60.

1. Square the validity coefficient: .60² = .36
2. Subtract from 1: 1 - .36 = .64
3. Take the square root: √.64 = .8
4. Multiply by the SD: 5 × .8 = 4

Your standard error of estimate is 4.

### Building Confidence Intervals

Here's where this gets practical. {{M}}Just like weather forecasts give you a range of likely temperatures rather than one exact number{{/M}}, you should report a range for predicted criterion scores.

Because the standard error functions like a standard deviation, you can use it to build confidence intervals:

- **68% confidence interval**: Predicted score ± 1 standard error
- **95% confidence interval**: Predicted score ± 2 standard errors
- **99% confidence interval**: Predicted score ± 3 standard errors

In our example above, if you predict someone will score 80 on the criterion, you'd say:
- 68% confidence: Their true score is likely between 76 and 84
- 95% confidence: Their true score is likely between 72 and 88
- 99% confidence: Their true score is likely between 68 and 92

Notice how wider confidence (99% vs. 68%) requires a wider range. You can be more certain, but less precise.

### What This Range Tells You

The standard error ranges from 0 (when r = ±1.0, perfect prediction, no error) to the full standard deviation of the criterion (when r = 0, no relationship, maximum error).

This has real implications. {{M}}If you're testifying in court about test results, you better report that confidence interval. A lawyer will eat you alive if you claim someone's "predicted IQ is exactly 98" without acknowledging the measurement error.{{/M}}

## Correction for Attenuation: Reliability's Role

Here's an important limitation: The reliability of both your predictor and criterion affects the validity coefficient you can obtain. When either measure has low reliability, **measurement error** reduces (attenuates) the validity coefficient you observe.

The **correction for attenuation** formula estimates what your maximum validity coefficient would be if both measures had perfect reliability (1.0). This is theoretical – you can't actually achieve it – but it helps you understand whether low validity is due to a genuine lack of relationship or just unreliable measures.

{{M}}Think of trying to measure the relationship between how much coffee you drink and your productivity, but your coffee tracker app keeps crashing and your productivity measure keeps changing definitions. Even if there's a real relationship, your unreliable measures will obscure it.{{/M}}

## Clinical Utility: Does This Test Actually Help?

Even a test with high validity might not be clinically useful. **Clinical utility** asks: Does using this test improve outcomes in the real world?

Two key ways to evaluate clinical utility are incremental validity and diagnostic efficiency.

### Incremental Validity: Adding Value

**Incremental validity** asks: Does this new predictor improve prediction accuracy beyond what we already have?

{{M}}It's like asking whether adding a GPS app improves your navigation beyond just using street signs. If you already know the area well, the GPS might not add much value.{{/M}}

Here's how to evaluate it with a real example:

You develop a new selection test for hiring. Over six months, you give it to all job applicants but don't use the scores – you hire people using your usual methods. Three months after hiring, you measure job performance. Now you have both predictor and criterion scores for 55 employees.

You set cutoff scores (what counts as "high" on each measure) and categorize everyone:

| **Category** | **Predictor Score** | **Criterion Score** | **Interpretation** |
|--------------|---------------------|---------------------|-------------------|
| True Positives | High | High | Would correctly hire |
| False Positives | High | Low | Would incorrectly hire |
| True Negatives | Low | Low | Would correctly reject |
| False Negatives | Low | High | Would incorrectly reject |

Let's say your data looks like this:

| True Positives: 15 | False Positives: 5 |
|-------------------|-------------------|
| False Negatives: 10 | True Negatives: 25 |

Now calculate two key rates:

**Base Rate** = (True Positives + False Negatives) / Total
= (15 + 10) / 55 = .45 or 45%

This is the proportion who succeeded without using your new test.

**Positive Hit Rate** = True Positives / All Positives
= 15 / (15 + 5) = .75 or 75%

This is the proportion who would succeed if you used your new test.

**Incremental Validity** = Positive Hit Rate - Base Rate
= .75 - .45 = .30 or 30%

Your new test would increase successful hires by 30 percentage points. Whether that's worth the cost and effort depends on your situation.

### Understanding Cutoff Score Effects

Here's a critical concept: Changing where you set the predictor cutoff score affects everything.

**Raising the cutoff** (making it harder to "pass"):
- Fewer people selected
- Fewer true positives (miss some good candidates)
- Fewer false positives (avoid some bad candidates)
- More true negatives (correctly reject more)
- More false negatives (incorrectly reject more)

**Lowering the cutoff** (making it easier to "pass"):
- More people selected
- More true positives (catch more good candidates)
- More false positives (accidentally accept more bad candidates)
- Fewer true negatives (reject fewer people correctly)
- Fewer false negatives (miss fewer good candidates)

{{M}}It's like adjusting your standards on a dating app. Set your filters too strict, and you'll avoid bad matches but also miss good ones. Set them too loose, and you'll catch all the good matches but also get swamped with incompatible people.{{/M}}

### Diagnostic Efficiency: Screening and Diagnosis

**Diagnostic efficiency** (also called diagnostic validity or accuracy) evaluates how well a test distinguishes between people who do and don't have a particular condition.

Let's use a concrete example: You're validating a quick screening test for alcohol use disorder (AUD). You give the screening test to 200 clinic clients who've already been evaluated using the full DSM diagnostic procedure.

Here are your results:

|  | **Has AUD** | **Doesn't Have AUD** |
|---------------------------|-------------|---------------------|
| **Screening Test Positive** | 36 (True Pos) | 4 (False Pos) |
| **Screening Test Negative** | 20 (False Neg) | 140 (True Neg) |

From this table, you can calculate five important statistics:

#### 1. Sensitivity

**Sensitivity** = True Positives / (True Positives + False Negatives)
= 36 / (36 + 20) = .64 or 64%

This is the proportion of people *with* the disorder who test positive. It answers: "If someone has AUD, what's the probability the test will catch it?"

#### 2. Specificity

**Specificity** = True Negatives / (True Negatives + False Positives)
= 140 / (140 + 4) = .97 or 97%

This is the proportion of people *without* the disorder who test negative. It answers: "If someone doesn't have AUD, what's the probability the test will correctly show negative?"

#### 3. Hit Rate (Overall Accuracy)

**Hit Rate** = (True Positives + True Negatives) / Total
= (36 + 140) / 200 = .88 or 88%

This is simply the proportion of people correctly categorized overall.

#### 4. Positive Predictive Value

**Positive Predictive Value** = True Positives / (True Positives + False Positives)
= 36 / (36 + 4) = .90 or 90%

This answers: "If someone tests positive, what's the probability they actually have the disorder?"

#### 5. Negative Predictive Value

**Negative Predictive Value** = True Negatives / (True Negatives + False Negatives)
= 140 / (140 + 20) = .88 or 88%

This answers: "If someone tests negative, what's the probability they actually don't have the disorder?"

### The Prevalence Problem

Here's something crucial that many students miss: While sensitivity and specificity remain relatively stable across settings, **predictive values change** based on disorder prevalence in each setting.

{{M}}Imagine using the same COVID test in two places: a hospital emergency room where many people are sick (high prevalence) versus a random community screening (low prevalence).{{/M}}

When prevalence is **high** (lots of people have the condition):
- Positive predictive value increases (positive results are more trustworthy)
- Negative predictive value decreases (negative results are less trustworthy)

When prevalence is **low** (few people have the condition):
- Positive predictive value decreases (many positive results are false alarms)
- Negative predictive value increases (negative results are more trustworthy)

This is why the same screening test might work great in a psychiatric hospital but produce many false positives when used in a general primary care setting.

## The Reliability-Validity Relationship

Here's a fundamental rule: A test's **reliability always sets a ceiling on its validity**.

Specifically, a predictor's validity coefficient cannot exceed its **reliability index**, which equals the square root of its reliability coefficient.

If a test has reliability of .81:
- Reliability index = √.81 = .90
- Maximum possible validity = .90

This makes intuitive sense. {{M}}A test that gives inconsistent results (like a bathroom scale that shows different weights each time you step on it) can't possibly predict anything accurately.{{/M}} You need reliable measurement before you can have valid prediction.

## Common Misconceptions Students Have

**Misconception 1**: "High validity means the test is perfect."
**Reality**: Even a validity coefficient of .70 (quite good) only explains 49% of criterion variance. There's always substantial unexplained variability.

**Misconception 2**: "Concurrent validity and predictive validity are interchangeable."
**Reality**: The type matters. Use concurrent when estimating current status, predictive when estimating future status. Using the wrong type for your purpose undermines your interpretation.

**Misconception 3**: "A test with high sensitivity is better than one with high specificity."
**Reality**: It depends on your goal. For serious conditions where missing cases is dangerous (like suicide risk), you want high sensitivity. For conditions where false positives create problems (like labeling someone with a stigmatizing diagnosis), you might prioritize specificity.

**Misconception 4**: "Predictive values are stable test properties."
**Reality**: Predictive values change with prevalence. Always consider your specific setting's base rates.

**Misconception 5**: "If my validity coefficient is significant, the test is useful."
**Reality**: Statistical significance just means the relationship isn't zero. A coefficient of .20 might be statistically significant with a large sample but practically useless for individual prediction.

## Practice Tips for Remembering

**For the two types of validity**: Think "Con-CURRENT = right now" (same time). Predictive has "future" built into its meaning.

**For incremental validity**: Remember it's always about "adding value." Base rate tells you where you started; positive hit rate tells you where the new test gets you; the difference is what you gained.

**For true/false positives/negatives**: Make a quick 2×2 table every time. Put reality (criterion) across the top, test decision down the side. True = test agrees with reality. False = test disagrees with reality. Positive/negative refers to the test result.

**For sensitivity vs. specificity**: 
- Sensitivity is about Sick people (both start with S) – does it catch the sick ones?
- Specificity is about healthy people – does it correctly identify the Not sick? (sPecificity = sPare the healthy)

**For predictive values**: 
- Positive predictive value: "I tested positive; what's MY risk?" (personal relevance)
- Negative predictive value: "I tested negative; am I safe?" (reassurance)

**For raising/lowering cutoffs**: Higher cutoff = fewer people pass = fewer of everything with "positive" in the name (true positives, false positives), more of everything with "negative" in the name (true negatives, false negatives).

**For standard error of estimate**: Notice that when r = 0 (no validity), the standard error equals the full SD of the criterion (maximum error). When r = ±1.0 (perfect validity), standard error = 0 (no error). Everything else falls between these extremes.

## Key Takeaways

- **Criterion-related validity** evaluates how well a predictor estimates or predicts criterion performance
- **Concurrent validity** uses simultaneous measurement for estimating current status
- **Predictive validity** uses time-lagged measurement for estimating future status
- **Validity coefficients** range from -1 to +1; square them to find shared variance
- **Shrinkage** happens on cross-validation, especially with small samples or many predictors
- **Standard error of estimate** quantifies prediction error for individuals; use it to build confidence intervals
- **Correction for attenuation** shows how unreliable measures reduce observed validity
- **Incremental validity** determines if a new test adds value beyond existing methods
- Calculate it as: positive hit rate minus base rate
- **Raising cutoff scores** reduces true and false positives, increases true and false negatives
- **Diagnostic efficiency** includes sensitivity, specificity, hit rate, and predictive values
- **Sensitivity** catches people with the condition (true positive rate)
- **Specificity** correctly identifies people without the condition (true negative rate)
- **Predictive values** change with prevalence; they're not stable test properties
- **Reliability sets the ceiling** for validity; maximum validity equals the square root of reliability

Understanding criterion-related validity helps you choose appropriate tests, interpret scores with appropriate humility, set reasonable expectations, and explain both the power and limitations of psychological assessment to clients, colleagues, and courts. Master these concepts, and you'll think more clearly about every assessment decision you make in practice.