---
topic_name: Overview of Inferential Statistics
domain: 7: Research Methods & Statistics
slug: overview-of-inferential-statistics
generated_at: 2025-11-16T16:36:08.742Z
version: 3
---

## Introduction: Why Inferential Statistics Matter for Your Psychology Career

You've collected data from your research study. Now comes the million-dollar question: Are your results real, or did they happen by chance? This is where inferential statistics come in, and honestly, this might be one of the most practical skills you'll use throughout your career. Whether you're evaluating treatment outcomes, reading research to guide your practice, or conducting your own studies, you need to know if what you're seeing is a genuine effect or just random noise.

Inferential statistics help us make educated guesses about larger populations based on the smaller samples we actually study. We can't survey every single person with depression or test every child with autism, so we study samples and use statistical tools to infer what's probably true for everyone.

## The Foundation: Sampling Distributions and Probability

Let's start with a core concept that trips up many students: the sampling distribution of means.

Here's what you need to understand: {{M}}Imagine you're taste-testing coffee to determine the average quality at a new café. You take one sip on Monday morning. Then another visit on Tuesday afternoon. Then Wednesday evening. Each time, the coffee tastes slightly different. Not because the café's quality wildly changes, but because of random variations in how hot it is, which beans were used that batch, whether you just ate something sweet, and so on.{{/M}}

A sampling distribution works the same way. If you could magically draw hundreds of different samples from the same population and calculate the mean for each one, you'd get a distribution of those means. Some would be higher than the true population mean, some lower, not because anything actually changed, but because of **sampling error**. Random variation that happens when you select different people.

The brilliant news? You don't actually need to draw hundreds of samples. This is where the **central limit theorem** becomes your best friend.

### The Central Limit Theorem: Three Critical Predictions

The central limit theorem tells us three things about sampling distributions:

1. **Shape**: As your sample size increases, the distribution of sample means will look increasingly normal (bell-curved), even if your original population distribution is weird and skewed.

2. **Center**: The mean of all those sample means equals the actual population mean. In other words, on average, samples give you the right answer.

3. **Spread**: The standard deviation of this sampling distribution (called the **standard error**) equals the population standard deviation divided by the square root of your sample size.

That third point is huge for understanding why bigger samples are better, the standard error gets smaller as sample size increases, meaning your sample means cluster more tightly around the true population mean.

## Setting Up Your Statistical Test: Hypotheses

Before you run any statistical test, you need to set up two competing hypotheses:

**The null hypothesis (H₀)**: This is the skeptical position. It says your independent variable has NO effect on your dependent variable. Any differences you observe are just due to chance or sampling error.

**The alternative hypothesis (H₁)**: This is usually what you actually believe. That your independent variable DOES have a real effect.

{{M}}Think of it like a trial in the legal system. The null hypothesis is "innocent until proven guilty." You start by assuming there's no effect (innocence), and you need strong enough evidence to reject that assumption.{{/M}}

For example, if you're testing whether a new therapy reduces anxiety:
- **Null hypothesis**: The therapy has no effect on anxiety levels
- **Alternative hypothesis**: The therapy does reduce anxiety levels

## Making Decisions: The Four Possible Outcomes

When you run your statistical test, you'll make a decision: either retain (keep) the null hypothesis or reject it. Since we're dealing with probability, not certainty, you could be right or wrong. Here's how it breaks down:

| Your Decision | True State of Reality | Result |
|--------------|---------------------|---------|
| Retain null hypothesis | Null is actually true | ✓ Correct decision |
| Reject null hypothesis | Null is actually false | ✓ Correct decision (you detected a real effect!) |
| Reject null hypothesis | Null is actually true | ✗ **Type I Error** (false positive) |
| Retain null hypothesis | Null is actually false | ✗ **Type II Error** (false negative) |

### Type I Error: The False Alarm

A **Type I error** happens when you reject a true null hypothesis. {{M}}You've declared something works when it actually doesn't, like announcing you've found your soulmate on the third date, only to realize six months later there's no real connection.{{/M}}

The probability of making a Type I error is **alpha (α)**, also called your **significance level**. Researchers typically set this at .05 or .01 before collecting data. If α = .05, you're accepting a 5% chance of a false positive. If α = .01, you're being more conservative with only a 1% chance.

### Type II Error: The Missed Opportunity

A **Type II error** happens when you retain a false null hypothesis. {{M}}Something really does work, but you failed to detect it, like dismissing a great job candidate because they had a bad interview day, missing out on someone who would have been excellent.{{/M}}

The probability of making a Type II error is **beta (β)**. Unlike alpha, you don't directly set beta. However, you can reduce it by increasing your study's **statistical power**.

## Statistical Power: Your Ability to Detect Real Effects

**Statistical power** is the probability that you'll correctly reject a false null hypothesis. In other words, your ability to detect a real effect when one exists. Think of it as the sensitivity of your study.

Power is affected by five main factors:

### 1. Alpha Level
Increasing alpha increases power. If you use α = .10 instead of α = .05, you're more likely to detect effects. However, this also increases your Type I error risk, which is why researchers rarely go above .05.

### 2. Effect Size
This is about how strong the independent variable's effect actually is. {{M}}If you're testing whether a single therapy session reduces severe trauma symptoms, you're looking for a subtle effect. If you're testing whether twelve weeks of intensive therapy helps, you're likely to see a larger effect.{{/M}} Bigger, more sustained interventions generally produce larger effects that are easier to detect.

### 3. Sample Size
This is the most practical factor you can control. Larger samples increase power substantially. {{M}}It's like trying to hear a whisper in a noisy restaurant versus a quiet library, the "signal" (real effect) becomes clearer when you reduce the "noise" (random variation), and bigger samples do exactly that.{{/M}}

### 4. Type of Statistical Test
**Parametric tests** (like t-tests and ANOVA) are more powerful than **nonparametric tests** (like chi-square). However, parametric tests require:
- Interval or ratio data (not just categories)
- Certain assumptions about your data (like normal distribution)

When you can legitimately use parametric tests, do so. They give you better odds of detecting real effects.

### 5. Population Homogeneity
If your population is very similar on the dependent variable, it's easier to detect differences caused by your independent variable. However, unlike the other factors, you can't control this. It's just a characteristic of what you're studying.

## A Modern Alternative: Bayesian Statistics

Everything we've discussed so far falls under **frequentist statistics**, the traditional approach that's dominated psychology for decades. But there's an alternative approach gaining popularity: **Bayesian statistics**.

### The Fundamental Difference

**Frequentist approach**: Your current study's data is everything. You calculate whether results could have happened by chance.

**Bayesian approach**: You combine what's already known (previous research) with your current data to get updated knowledge. It's cumulative and collaborative.

### How Probability is Defined

Here's where things get philosophically interesting:

**Frequentist probability**: {{M}}If you could rerun your study infinite times under identical conditions, probability tells you how often you'd get certain results.{{/M}} For example, a p-value of .03 means that if the null hypothesis were true and you repeated the study many times, you'd get results this extreme or more only 3% of the time.

**Bayesian probability**: This represents your degree of certainty or belief that something is true. It's more intuitive and subjective.

### Confidence Intervals vs. Credibility Intervals

This difference shows up clearly in how we interpret intervals:

**95% Frequentist Confidence Interval**: If we repeated this study many times and calculated a confidence interval each time, 95% of those intervals would contain the true population mean. (Note: We CANNOT say there's a 95% chance the true mean is in THIS specific interval. But people often make this mistake.)

**95% Bayesian Credibility Interval**: There's a 95% probability that the true population mean falls within this specific interval. This is actually how most people intuitively want to interpret confidence intervals!

### The Bayesian Process: Prior, Likelihood, and Posterior

Bayesian analysis uses three components:

| Component | Definition | Source |
|-----------|-----------|---------|
| **Prior** | Your probability distribution for a parameter BEFORE seeing new data | Previous research, expert opinion, or theoretical assumptions |
| **Likelihood Function** | The probability distribution from your current study's data | Your actual collected data |
| **Posterior** | The updated probability distribution combining prior and likelihood | Mathematical synthesis using Bayes' theorem |

The posterior becomes your final answer. And could serve as the prior for the next study, creating a knowledge-building chain.

### Advantages of Bayesian Statistics

1. **Incorporates existing knowledge**: You're not treating each study as if it exists in a vacuum
2. **More intuitive interpretation**: Credibility intervals mean what people think they mean
3. **Direct hypothesis testing**: You can directly assess evidence for your research hypothesis, not just against the null
4. **User-friendly software**: Programs like JASP make Bayesian analysis accessible

### The Major Criticism

The **prior** is subjective. Two researchers could use different priors for the same study and reach different conclusions. {{M}}It's like two movie critics watching the same film. One comes in having loved the director's previous work (positive prior), another hated it (negative prior), and they walk out with different overall impressions despite seeing identical content.{{/M}}

Critics argue this subjectivity undermines the objectivity that science requires. Supporters counter that making assumptions explicit (choosing a prior) is more honest than pretending frequentist methods don't also involve subjective choices.

## Common Misconceptions to Avoid

**Misconception 1**: "A p-value tells you the probability that the null hypothesis is true."

**Reality**: A p-value tells you the probability of getting your results (or more extreme) IF the null hypothesis were true. It's backward from what people think.

**Misconception 2**: "Statistical significance means practical importance."

**Reality**: With large enough samples, even tiny, meaningless effects can be statistically significant. Always consider effect size, not just p-values.

**Misconception 3**: "Failing to reject the null hypothesis proves there's no effect."

**Reality**: It means you didn't find sufficient evidence of an effect. The effect might exist but be too small for your study to detect (Type II error).

**Misconception 4**: "Confidence intervals can be interpreted as probability ranges."

**Reality**: Not for frequentist confidence intervals! That interpretation only works for Bayesian credibility intervals.

**Misconception 5**: "Bigger alpha always means better studies."

**Reality**: Increasing alpha increases power but also increases Type I error risk. It's a trade-off.

## Practice Tips for Remembering

**For Type I and Type II Errors**: Create a simple reference table and memorize it. On exam day, quickly sketch it out if you get confused:

| Error Type | What Happened | Memory Trick |
|-----------|---------------|--------------|
| Type I | Rejected true null (false positive) | "I thought there was an effect, but I was wrong" |
| Type II | Retained false null (false negative) | "II (two) can mean 'missed it too'" |

**For increasing power**: Remember the acronym **ASETH**:
- **A**lpha (increase it, though rarely done)
- **S**ample size (increase it)
- **E**ffect size (larger effects easier to detect)
- **T**est type (use parametric when possible)
- **H**omogeneity (more homogeneous populations help, though you can't control this)

**For Bayesian components**: Think **PLP**. Prior, Likelihood, Posterior. {{M}}It's like updating your GPS route: you start with a planned route (prior), get current traffic data (likelihood), and generate an updated route (posterior).{{/M}}

**For the Central Limit Theorem**: Remember "SCS". Shape (becomes normal), Center (equals population mean), Spread (standard error = SD/√n).

## Key Takeaways

- **Inferential statistics** help us determine if research results reflect real effects or just sampling error by comparing sample values to sampling distributions

- The **central limit theorem** tells us that sampling distributions of means become normal as sample size increases, center on the population mean, and have standard error equal to SD/√n

- The **null hypothesis** states no effect exists; the **alternative hypothesis** states an effect exists

- **Type I error** (false positive): rejecting a true null hypothesis, with probability = alpha (typically .05 or .01)

- **Type II error** (false negative): retaining a false null hypothesis, with probability = beta

- **Statistical power** (probability of correctly detecting real effects) increases with: larger alpha, larger effect sizes, larger samples, parametric tests, and more homogeneous populations

- **Frequentist statistics** (traditional approach) analyzes current data using probability as long-run frequency

- **Bayesian statistics** (alternative approach) combines prior knowledge with current data using probability as degree of belief

- Bayesian **credibility intervals** can be interpreted as probability ranges, but frequentist **confidence intervals** cannot (despite common misinterpretation)

- The Bayesian process uses a **prior** (previous knowledge), **likelihood function** (current data), and produces a **posterior** (updated knowledge)

- Main criticism of Bayesian statistics: subjectivity in choosing priors can lead different researchers to different conclusions from the same data

Understanding these concepts isn't just about passing the EPPP. It's about being able to critically evaluate research throughout your career and make evidence-based decisions in your practice. Every treatment outcome study, assessment validation study, and meta-analysis you read will use these principles. Master them now, and you'll be a more informed, effective psychologist for decades to come.