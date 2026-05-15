---
topic_name: Test Validity – Criterion-Related Validity
domain: 5: Test Construction
slug: test-validity-criterion-related-validity
generated_at: 2025-11-15T21:15:40.507Z
model: claude-sonnet-4-5-20250929
version: 1
---

# Criterion-Related Validity: Making Predictions That Actually Work

## Why This Matters for Your Psychology Career

Imagine you're hiring a clinical supervisor for your practice. You've created a test to predict who will be a great supervisor, but how do you know if your test actually works? Or picture yourself choosing between two depression screening tools – which one will actually identify the clients who need immediate intervention? These questions are at the heart of criterion-related validity.

As a psychologist, you'll constantly use tests to make predictions about people's futures: Will this client benefit from therapy? Is this person at risk for suicide? Can this employee handle the stress of a management position? Criterion-related validity tells us whether our predictions are worth anything – or if we're just guessing with expensive paperwork.

## The Core Concept: Predictor Meets Reality

**Criterion-related validity** asks one simple question: Does this test score tell us anything useful about what we really care about?

Think of it like online dating. Your dating profile (the predictor) is supposed to predict whether you'll be compatible with someone in real life (the criterion). A profile has "validity" if people who seem great on paper actually turn out to be great in person. If everyone who writes "loves hiking" never actually goes outside, that profile item has poor validity.

In psychology terms:
- The **predictor** is your test or measure (like a job knowledge exam)
- The **criterion** is what you actually care about (like job performance six months later)
- The **validity coefficient** tells you how well the predictor does its job

## Two Types: Concurrent vs. Predictive Validity

### Concurrent Validity: Right Now Predictions

**Concurrent validity** checks whether your test can estimate someone's *current* status on something. You collect both the predictor and criterion scores at roughly the same time.

Real-world example: You've developed a quick 10-minute depression screener for busy primary care offices. You want to know if it matches up with what clients score on a comprehensive 45-minute depression inventory given the same day. If your quick screener correlates highly with the established measure, it has good concurrent validity.

This is like checking if your fitness tracker's heart rate monitor matches what the doctor's equipment reads during the same appointment. Both measurements happen now, and you're checking if the convenient option accurately reflects the gold standard.

### Predictive Validity: Future Forecasting

**Predictive validity** checks whether your test can forecast someone's *future* status. You collect predictor scores first, then wait to collect criterion scores later.

Real-world example: A clinical psychology graduate program uses a written exam to predict which applicants will be successful therapists three years later (measured by supervisor ratings and client outcomes). The exam has good predictive validity if high scorers actually become effective therapists.

This is like checking whether your relationship's three-month mark actually predicts whether you'll still be together at the two-year mark. You have to wait for time to pass to see if your early prediction holds up.

## Understanding the Validity Coefficient

The criterion-related validity coefficient ranges from -1 to +1, just like any correlation. The closer to +1 or -1, the better your predictions will be.

Here's what different coefficients mean practically:

| Validity Coefficient | What It Means | Real-World Impact |
|---------------------|---------------|-------------------|
| .90 | Excellent prediction | Your test is highly useful |
| .70 | Good prediction | Your test adds real value |
| .50 | Moderate prediction | Your test helps but isn't definitive |
| .30 | Weak prediction | Your test provides limited information |
| .00 | No prediction | Your test is worthless for this purpose |

### The Variance Explained Concept

When you square the validity coefficient, you get the percentage of variance explained. This tells you how much of what you care about (criterion performance) can be explained by what you measured (predictor scores).

Example: A cognitive screening test has a validity coefficient of .70 for predicting functional independence in elderly clients. Square that (.70 × .70 = .49), and you learn that 49% of the differences in functional independence can be explained by cognitive abilities. The other 51%? That's influenced by things like physical health, social support, motivation – factors your cognitive test doesn't capture.

This is like knowing that 49% of whether you enjoy a vacation depends on the weather (what you can predict), while 51% depends on who you're traveling with, your mood, unexpected events, and how good the local food is (what you can't predict from weather forecasts alone).

## Cross-Validation and Shrinkage: When Reality Hits

Here's an uncomfortable truth: Your validity coefficient from the first study will almost always look better than it actually is. This happens because of **shrinkage**.

When researchers develop a predictor, they keep the test items that correlate most strongly with the criterion. But some of those correlations are flukes – random chance making certain items look better than they really are. When you test the predictor on a new sample (cross-validation), those random factors disappear, and your validity coefficient "shrinks."

Think of it like going on a first date after weeks of great texting. The texting chemistry (initial validation) seemed perfect, but in-person chemistry (cross-validation) often isn't quite as strong. Some of what seemed like amazing compatibility was just the flattering filter of messaging – the random factors that made things look better than they were.

Shrinkage is worst when:
- Your original sample was small (like judging a restaurant after one visit)
- You're using many predictors together (like having too many variables in your dating criteria)

The solution? Always cross-validate with a new sample before trusting your validity coefficient.

## Making Predictions with Confidence Intervals

When you have a valid predictor, you can create a regression equation to predict someone's criterion score from their predictor score. But unless your validity coefficient is perfect (±1.0), there will be prediction errors.

### The Standard Error of Estimate

The **standard error of estimate** quantifies your prediction errors. It tells you how much "wiggle room" to expect around your predicted scores.

Here's the formula: Standard Error = SD of criterion × √(1 - validity coefficient²)

Example calculation: Your job performance measure has a standard deviation of 5, and your hiring test has a validity coefficient of .60.

- Step 1: Square the coefficient: .60² = .36
- Step 2: Subtract from 1: 1 - .36 = .64
- Step 3: Take the square root: √.64 = .8
- Step 4: Multiply by criterion SD: 5 × .8 = 4

Your standard error of estimate is 4.

### Building Confidence Intervals

Just like you learned in statistics, you can use this standard error to build confidence intervals:

- **68% confident**: predicted score ± 1 standard error
- **95% confident**: predicted score ± 2 standard errors  
- **99% confident**: predicted score ± 3 standard errors

Practical example: You predict a job applicant will score 75 on your job performance measure (which has a range of 0-100). With a standard error of 4:

- You're 68% confident their true score will fall between 71-79
- You're 95% confident it'll fall between 67-83
- You're 99% confident it'll fall between 63-87

This is like predicting what time you'll arrive somewhere. With GPS (your predictor), you might predict 2:30 PM. But depending on unpredictable factors (traffic, weather, construction), you give yourself a range: "I'll be there between 2:15 and 2:45" (your confidence interval). The less predictable the route, the wider your confidence interval needs to be.

## Correction for Attenuation: The Reliability Factor

Here's a critical point: **Unreliable tests can never be highly valid.** Measurement error from low reliability puts a ceiling on how valid a test can be.

The **correction for attenuation** formula estimates what your validity coefficient *could* be if your predictor and criterion were perfectly reliable (reliability = 1.0). This helps you understand whether your validity coefficient is low because of a genuinely weak relationship or just because of measurement error.

Think of it like trying to predict someone's career success from their college GPA. If grades are assigned randomly (low reliability), GPA can't possibly predict career outcomes well – not because education doesn't matter, but because the grades don't accurately reflect learning.

## Clinical Utility: Does This Test Actually Help?

A test can have good validity but still not be clinically useful. **Clinical utility** asks: Does using this test improve my decision-making enough to be worth the time, cost, and effort?

### Incremental Validity: Are You Adding Value?

**Incremental validity** is the increase in prediction accuracy you get by adding a new test to your current methods.

Real-world scenario: Your therapy practice currently screens for depression using just a brief clinical interview. You're considering adding a 20-minute standardized depression inventory. The question: Will this test tell you anything beyond what you already know from the interview?

To evaluate this, you'd compare:
- **Base rate**: How many clients you correctly identified with depression using just the interview
- **Positive hit rate**: How many clients you'd correctly identify if you also used the inventory

If the inventory increases your accuracy from 60% to 85%, that's substantial incremental validity. If it only increases from 60% to 63%, you might decide the extra 20 minutes isn't worth it.

### Understanding True Positives, False Positives, and Their Friends

When evaluating incremental validity or diagnostic efficiency, you'll work with four categories:

| Test Says... | Reality: High Performance | Reality: Low Performance |
|--------------|-------------------------|-------------------------|
| **High Performance** | True Positive ✓ | False Positive ✗ |
| **Low Performance** | False Negative ✗ | True Negative ✓ |

- **True Positives**: You predicted success, they succeeded (correct!)
- **False Positives**: You predicted success, they failed (oops!)
- **True Negatives**: You predicted failure, they failed (correct!)
- **False Negatives**: You predicted failure, they succeeded (missed opportunity!)

### The Cutoff Score Trade-Off

Here's where things get strategic. When you raise or lower your test's cutoff score, you change the balance of errors:

**Raising the cutoff** (being more selective):
- Fewer false positives (you make fewer bad "yes" decisions)
- More false negatives (you miss more people who would've succeeded)
- Example: Making a therapy program super selective means fewer clients who don't benefit (good), but you reject clients who actually would've benefited (bad)

**Lowering the cutoff** (being more inclusive):
- Fewer false negatives (you miss fewer people who would succeed)
- More false positives (more bad "yes" decisions)
- Example: A suicide screening with a very low cutoff catches almost everyone at risk (good), but flags many people who aren't actually suicidal (creates unnecessary interventions)

The right choice depends on the consequences. Missing someone who's suicidal (false negative) is catastrophic, so suicide screenings typically use low cutoffs, accepting many false positives. For expensive training programs, you might use higher cutoffs to avoid wasting resources on false positives.

## Diagnostic Efficiency: How Well Does Your Test Categorize?

**Diagnostic efficiency** evaluates how accurately a test distinguishes between people who do and don't have a disorder or characteristic. This is crucial for screening and assessment tools.

Let's use a practical example: You're evaluating a new PTSD screener for veterans.

| | Has PTSD (Established Diagnosis) | No PTSD |
|-------------|----------|---------|
| **Screener Positive** | True Positives: 85 | False Positives: 10 |
| **Screener Negative** | False Negatives: 15 | True Negatives: 90 |

From this data, you can calculate five important statistics:

### 1. Sensitivity

**Formula**: TP/(TP + FN) = 85/(85 + 15) = .85 or 85%

**What it means**: Of all veterans who actually have PTSD, your screener correctly identifies 85% of them.

**Real-world interpretation**: Your screener catches most people who need help, but misses 15% (the false negatives). These missed cases are concerning for a PTSD screener.

### 2. Specificity

**Formula**: TN/(TN + FP) = 90/(90 + 10) = .90 or 90%

**What it means**: Of all veterans who don't have PTSD, your screener correctly identifies 90% as not having it.

**Real-world interpretation**: Your screener rarely flags people unnecessarily, though 10% get false alarms.

### 3. Hit Rate (Overall Accuracy)

**Formula**: (TP + TN)/(All Cases) = (85 + 90)/200 = .875 or 87.5%

**What it means**: Your screener is correct 87.5% of the time overall.

**Real-world interpretation**: For most veterans, your screener gives the right answer.

### 4. Positive Predictive Value

**Formula**: TP/(TP + FP) = 85/(85 + 10) = .89 or 89%

**What it means**: When your screener says "PTSD," there's an 89% chance the person actually has it.

**Real-world interpretation**: A positive screen is pretty reliable – most people flagged actually need services.

### 5. Negative Predictive Value

**Formula**: TN/(TN + FN) = 90/(90 + 15) = .86 or 86%

**What it means**: When your screener says "no PTSD," there's an 86% chance the person actually doesn't have it.

**Real-world interpretation**: A negative screen is fairly reliable, though 14% of negative screens are wrong (these are your missed cases).

### The Prevalence Problem

Here's a crucial point that trips people up: **Sensitivity and specificity stay constant across settings, but predictive values change based on prevalence.**

Example: Your PTSD screener might have 85% sensitivity and 90% specificity whether you use it in a VA hospital or a college campus. But:

- **High prevalence setting** (VA hospital where 50% have PTSD): Positive predictive value will be high – most positive screens are correct
- **Low prevalence setting** (college campus where 5% have PTSD): Positive predictive value drops – many positive screens will be false alarms

Think of it like a smoke detector. It has the same sensitivity and specificity whether installed in a kitchen (high fire prevalence) or bedroom (low fire prevalence). But in the kitchen, when it goes off, there's a better chance there's actually a fire (high positive predictive value). In the bedroom, it's more likely to be a false alarm (lower positive predictive value).

## The Reliability-Validity Connection

Remember this ironclad rule: **Reliability puts a ceiling on validity.**

Specifically, a predictor's validity coefficient can never exceed its **reliability index** (the square root of its reliability coefficient).

Example: Your anxiety measure has a reliability coefficient of .64.
- Reliability index = √.64 = .80
- Therefore, its validity coefficient can't exceed .80

This makes intuitive sense. If your test gives different scores each time someone takes it (low reliability), those scores can't possibly predict anything consistently. It's like trying to navigate using a compass that spins randomly – it can't guide you accurately if it's not working consistently.

## Common Misconceptions

**Misconception 1**: "A test is either valid or not valid."
**Reality**: Validity isn't all-or-nothing. A test might have excellent validity for one purpose and terrible validity for another. An IQ test might predict academic performance well but predict happiness poorly.

**Misconception 2**: "High validity means I can trust individual predictions."
**Reality**: Even with good validity, there's always a confidence interval around predictions. A validity coefficient of .70 is considered good, but squaring it reveals you're only explaining 49% of criterion variance.

**Misconception 3**: "Sensitivity and specificity tell me everything I need to know."
**Reality**: Predictive values matter more for day-to-day decisions, and they change based on prevalence. A test with great sensitivity and specificity can still have poor positive predictive value in low-prevalence settings.

**Misconception 4**: "More predictors always increase validity."
**Reality**: Adding predictors can increase multiple correlation, but it also increases risk of shrinkage, especially with small samples. Quality beats quantity.

**Misconception 5**: "If my initial validity study looks good, I'm done."
**Reality**: Always cross-validate. Initial coefficients almost always shrink on subsequent testing.

## Practice Tips for Remembering

**For concurrent vs. predictive**:
- *Concurrent* = "concurrent events" = happening together NOW
- *Predictive* = "predicting the future" = testing LATER

**For true/false positives/negatives**, use this grid in your mind:

```
             REALITY
             Success | Failure
TEST Says   ---------+---------
Success  =  | TP ✓  | FP ✗  |
Failure  =  | FN ✗  | TN ✓  |
            ---------+---------
```

The diagonal (TP and TN) represents correct decisions.

**For sensitivity vs. specificity**:
- **Sen**sitivity = finding **sen**sitive cases (people who DO have the disorder)
- **Spec**ificity = **spec**ifying who's healthy (people who DON'T have it)

**For cutoff score effects**, remember:
- RAISE cutoff = MORE restrictive = FEWER hired = FEWER false positives
- LOWER cutoff = MORE inclusive = MORE hired = FEWER false negatives

**For predictive values and prevalence**:
- HIGH prevalence = better POSITIVE predictive value (positive results more trustworthy)
- LOW prevalence = better NEGATIVE predictive value (negative results more trustworthy)

## Key Takeaways

- **Criterion-related validity** tells you whether a test (predictor) accurately forecasts performance on what you care about (criterion)

- **Concurrent validity** estimates current status; **predictive validity** forecasts future performance

- Validity coefficients range from -1 to +1; square them to get percentage of variance explained

- **Cross-validation** is essential because initial validity coefficients almost always shrink

- Use the **standard error of estimate** to build confidence intervals around predicted scores

- **Incremental validity** tells you if adding a test improves prediction accuracy beyond current methods

- **Diagnostic efficiency** includes sensitivity, specificity, hit rate, and predictive values

- Raising cutoff scores decreases false positives but increases false negatives (and vice versa)

- Sensitivity and specificity are stable, but predictive values change with prevalence

- **Reliability limits validity**: A test's validity can't exceed its reliability index

- Always consider clinical utility, not just statistical significance – does the test add enough value to justify using it?

Remember: The goal isn't just to understand these concepts for the exam. These principles will guide critical decisions throughout your career – which assessments to use, how to interpret scores, and when to trust (or question) your clinical predictions. Master these concepts, and you'll make better decisions for the people you serve.