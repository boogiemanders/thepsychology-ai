# Fact-Check Report - Domain: Test Construction

Method: each lesson's checkable claims verified against OpenEvidence (citation-backed). Tiers: FACTUAL-WRONG (incorrect), MISLEADING (defensible but could mislead), JUDGMENT (diverges from literature but may be the EPPP-accepted answer). Report-only; no lesson/question files edited. When fixes are approved, matching lessonExcerpt quotes in questionsGPT get synced in the same edit.

NOTE: This domain is pure psychometrics and statistics. It is non-clinical, so OpenEvidence returns nothing useful here. All claims were verified against authoritative psychometric/statistics references (Anastasi & Urbina, Crocker & Algina, Nunnally, the 2014 Standards, Cohen's textbook, standard EPPP prep sources). Findings are marked "verified against standard references (high confidence, not separately OE-queried)." No genuinely clinical/biological claim appeared that warranted an OE call.

---

## 5-items-and-reliability.md
URL: /resources/topics/5-test-construction/item-analysis-and-test-reliability

Verified against standard references (high confidence, not separately OE-queried): CTT model (obtained = true + error); reliability coefficient interpreted as proportion of true-score variance; the four reliability types and their uses; internal consistency inappropriate for speed tests; Cronbach's alpha / KR-20 (dichotomous) / split-half + Spearman-Brown; Cohen's kappa corrects for chance on nominal data; consensual observer drift; factors raising/lowering reliability (homogeneity, range, guessing); reliability index = sqrt(reliability); item difficulty p = proportion correct; optimal p halfway between 1.0 and chance (4-option = .625, T/F = .75); discrimination D = top 27% minus bottom 27%, want D >= .30; SEM = SD * sqrt(1 - reliability) and the worked example (15 * sqrt(.09) = 4.5); confidence intervals 1/2/3 SEM = 68/95/99%; IRT vs CTT contrasts, ICC, a/b/c parameters, CAT.

No factual errors found; all checked claims accurate.

Minor note (not flagged as an error): the line "Reliability coefficients range from 0 to 1.0" is the standard EPPP framing. In rare cases sample formulas can yield small negative values, but 0 to 1.0 is the correct conceptual/tested range. Leave as is.

---

## 5-what-tests-measure.md
URL: /resources/topics/5-test-construction/test-validity-content-and-construct-validity

Verified against standard references (high confidence, not separately OE-queried): 2014 Standards definition of validity as one unified concept and the five sources of validity evidence; traditional three-type framework still EPPP-tested; content validity established by domain definition + representative sampling + expert review (not statistical); content vs face validity distinction; construct validity for unobservable traits; convergent vs divergent (discriminant) validity; multitrait-multimethod matrix (Campbell & Fiske) and the four coefficients (monotrait-monomethod = reliability/high, monotrait-heteromethod = convergent/high, heterotrait-monomethod = divergent/low, heterotrait-heteromethod = divergent/low); factor analysis steps (administer, correlate, extract, rotate); factor loadings as test-factor correlations; squared loading = variance explained; communality = sum of squared loadings when factors are orthogonal (Test A: .64 + .01 = .65, checks out).

No factual errors found; all checked claims accurate.

---

## 5-can-tests-predict.md
URL: /resources/topics/5-test-construction/test-validity-criterion-related-validity

Verified against standard references (high confidence, not separately OE-queried): predictor vs criterion; concurrent (same time, current status) vs predictive (time-lagged, future status) validity; validity coefficient -1 to +1, squared = shared variance (.70^2 = 49%); shrinkage on cross-validation, worse with small samples / many predictors; standard error of estimate = SD_criterion * sqrt(1 - r^2) and worked example (5 * sqrt(.64) = 4); SEest ranges from 0 (r = +/-1) to full SD (r = 0); confidence intervals 1/2/3 SE = 68/95/99%; correction for attenuation; incremental validity = positive hit rate minus base rate (base rate 25/55 = .45, positive hit rate 15/20 = .75, increment = .30); cutoff-raising/lowering effects on the four cells; diagnostic-efficiency 2x2 stats all recomputed and correct: sensitivity 36/56 = .64, specificity 140/144 = .97, hit rate 176/200 = .88, PPV 36/40 = .90, NPV 140/160 = .875; predictive values shift with prevalence (PPV up / NPV down as prevalence rises) while sensitivity and specificity stay relatively stable; reliability sets ceiling on validity, max validity = sqrt(reliability).

No factual errors found; all checked claims accurate. (Every formula and worked arithmetic was independently recomputed and matches.)

---

## 5-interpreting-scores.md
URL: /resources/topics/5-test-construction/test-score-interpretation

Verified against standard references (high confidence, not separately OE-queried): raw scores need norms/standardization; norm-referenced (percentile ranks, standard scores) vs criterion-referenced (mastery); percentile rank = % at or below; percentile-rank transformation is nonlinear and flattens the distribution to rectangular; standard scores are linear transformations that preserve distribution shape; z (M=0, SD=1), T (M=50, SD=10), IQ Wechsler/Stanford-Binet (M=100, SD=15), stanine (M=5, SD=2, each stanine ~ half an SD, stanine 5 spans -.25 to +.25 SD); z formula (X-M)/SD and example (110-100)/5 = +2.0; the conversion table -2/-1/0/+1/+2 SD = z -2/-1/0/+1/+2 = T 30/40/50/60/70 = IQ 70/85/100/115/130 = stanine 1/3/5/7/9 = percentile 2/16/50/84/98 (all correct); +1 SD shifts percentile by 34 points; T-score of 65 (+1.5 SD) ~ 93rd percentile; percentage scores vs percentile ranks distinction; expectancy tables; cutoff/ranking/banding selection methods; banding uses SEM and can reduce adverse impact.

No factual errors found; all checked claims accurate.

Minor note (not flagged as an error): the description "the highest 1% become percentile rank 100, the next 1% become percentile rank 99" is a slight simplification of how percentile ranks are assigned, but it correctly conveys the key tested idea (the resulting distribution is rectangular/flat). Conceptually fine for the EPPP; leave as is.
