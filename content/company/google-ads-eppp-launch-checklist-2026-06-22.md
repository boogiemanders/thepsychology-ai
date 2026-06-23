# Google Ads Launch Checklist: EPPP Prep (US + Canada)

Campaign: **EPPP Prep - Search - US+CA**. Targets both the United States and Canada (the EPPP is used in both).
Everything below is paste-ready for the Google Ads UI. The repo work (above-the-fold CTAs + 3 conquest landing pages) ships in a separate PR; **the conquest landing pages only go live once that PR is merged and deployed**, so do not point ads at them until then.

---

## 0. Order of operations

1. Merge + deploy the landing-page PR (CTAs + conquest pages).
2. Confirm all 6 landing pages load with a "Start free trial" button above the fold.
3. Do conversion setup (Section 1). Confirm `purchase` imports BEFORE scaling spend.
4. Build the campaign, ad groups, keywords, negatives, RSAs (Sections 2-4).
5. Launch small, watch for ~15-30 purchases, then consider tCPA (Section 5).

---

## 1. Conversion tracking + tagging (do this first)

- **Link GA4 to Google Ads:** Tools > Data Manager > Linked products > Google Analytics (GA4). Link the existing property.
- **Import GA4 conversions:** Goals > Conversions > New > Import > GA4.
  - Set **`purchase` = Primary** (the only one that bids). It already fires server-side via Measurement Protocol on the Stripe webhook.
  - Set **`sign_up` = Secondary** (observe only).
  - Set **`begin_checkout` = Secondary** (observe only).
- **Auto-tagging ON:** Account Settings > Auto-tagging = enabled. Required for `gclid` and for GA4 to attribute the purchase back to the ad click.
- **Final URL suffix (campaign level), so your OWN dashboards also tag paid signups:**
  ```
  utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_content={creative}
  ```
  Your site already captures `utm_source/medium/campaign` at signup, so this makes paid signups show as google / cpc in your first-party reports. Auto-tagging (gclid) and this suffix work together; keep both.
- **Verify before scaling:** after the first real purchase, check Google Ads > Conversions shows a `purchase` count, and GA4 DebugView/Realtime shows the event. The purchase event returns 204 from Google even if dropped, so confirm in DebugView, do not assume.

> Note: there are currently **no native Google Ads conversion tags** in the site, by design. Conversions come from the GA4 import above. Optional future upgrade: Enhanced Conversions (pass hashed email/user_id) for better match rates. Not required to launch.

---

## 2. Campaign settings

- **Type:** Search. Networks: **uncheck Search Partners and Display Network** (cleaner data to start).
- **Locations:** United States AND Canada. Target both countries in the one campaign.
  - **Location options:** set to "Presence: people in or regularly in your targeted locations" (NOT "presence or interest"). This keeps spend on people actually in the US/Canada, not people merely searching about them.
  - **Exclude Quebec, Canada:** add Quebec as an excluded location. Psychologists there license through the OPQ, not the EPPP, so those clicks will not convert. The rest of Canada uses the EPPP.
- **Languages:** English.
- **Bidding:** Start **Manual CPC (enhanced off)** or **Maximize Conversions WITHOUT a target CPA**. Do not set tCPA until ~15-30 purchases have logged.
- **Budget (small test):** split roughly
  - **40%** -> AG1 (Comparison/Best) + AG5 (Practice Questions)
  - **35%** -> AG2 + AG3 + AG4 (Conquest)
  - **25%** -> AG6 (Pass Rate)
- **US + CA budget note:** in a single shared US+CA campaign, Google tends to spend mostly on the US (bigger, cheaper search volume). Split into separate US and Canada campaigns later only if you want guaranteed Canada budget. Check the Locations report after a week to see the real US/CA split.
- **Currency / pricing:** prices are in **USD** ($40/mo after the July 1 step-up). Canadian buyers are billed in USD and Stripe handles the conversion. You can optionally show "$40/mo USD" in ad copy so CA searchers know the currency up front. (Until July 1 checkout charges $30; it becomes $40/mo on 2026-07-01. A separate routine handles that price rewrite, do not edit it here.)
- **Ad rotation:** Optimize. **Ad schedule:** all day to start.
- **Match types:** launch **Exact + Phrase** only. Add Broad later, one term at a time, once you trust the data.

---

## 3. Campaign-level negative keyword list

Create one shared negative list and apply to the campaign:

```
jobs, salary, career, hiring, employment
license, licensure, licensing, reciprocity, asppb login, asppb
test date, exam date, scheduling, schedule, pearson vue, pearson vue login, accommodations, registration, register
pdf, torrent, anki, quizlet, free download, crack
reddit
school psychology, ncsp, praxis, school psychologist
definition, meaning, wiki, wikipedia, what does eppp stand for
```

**Per-ad-group extra negatives:**
- **AG1, AG2, AG3, AG4, AG6:** add `free` (the only ad group allowed to bid on "free" is AG5).
- **Conquest cross-negatives:** in AG2 add `psychprep, prepjet, taylor, mometrix, academic review` as negatives; in AG3 add `aatbs, prepjet, taylor, mometrix, academic review`; in AG4 add `aatbs, psychprep`. This keeps each brand's traffic in its own ad group.

---

## 4. Ad groups: keywords + RSAs

Display paths for every ad group RSA: **EPPP-Prep** and **Free-Trial** (AG5 uses **EPPP-Practice** / **Free-Trial**).
RSA rules already enforced: every headline <=30 chars, every description <=90 chars, no em dashes, no emojis, conquest groups contain NO competitor brand names in the ad text.

---

### AG1 - Comparison / Best  (top priority)
**Landing page:** `/blog/eppp-prep-programs-compared-2026`

**Keywords (Phrase):**
```
"best eppp prep"
"best eppp study materials"
"best eppp prep course"
"eppp prep comparison"
"eppp study programs compared"
"best eppp practice questions"
"eppp prep reviews"
"top eppp prep courses"
"affordable eppp prep"
"cheapest eppp prep"
"best online eppp prep"
```

**Headlines:**
```
Compare EPPP Prep Programs
Honest EPPP Prep Compared
Adaptive EPPP Practice
Practice That Adapts to You
Full-Length EPPP Exams
Big EPPP Question Bank
Try EPPP Prep, 7-Day Trial
7-Day Trial, No Card
No Credit Card to Start
Lock In $30/mo Before July
Join in June for $30/mo
$40/mo Starting July 2026
See How We Compare
Smarter EPPP Prep, Less Cost
Pass the EPPP With Adaptive
```
**Descriptions:**
```
Compare EPPP programs honestly. Adaptive practice and full-length exams in one place.
Start a 7-day trial with no credit card. See if adaptive EPPP prep fits you.
Lock in $30/mo before the July 2026 rise to $40/mo. Cancel anytime.
Adaptive questions target your weak areas so you study less and retain more.
```
**Pinning:** Pin "Compare EPPP Prep Programs" to Headline 1 (comparison intent, no unprovable superlative). Pin the first description to Description 1. Leave the rest unpinned.

---

### AG2 - Conquest AATBS
**Landing page:** `/blog/thepsychology-vs-aatbs`

**Keywords (Phrase + Exact):**
```
"aatbs"  / [aatbs]
"aatbs review"
"aatbs alternative"
"aatbs cost"
```

**Headlines:**
```
Adaptive EPPP Exam Prep
Adaptive, Not a Static Bank
Lower-Cost EPPP Prep
Free 7-Day Trial, No Card
Lock In $30/mo Before July
$40/mo Starting July 2026
Adaptive EPPP Practice
Full-Length Practice Exams
Smarter EPPP Question Bank
Prep That Adapts to You
Try EPPP Prep Free 7 Days
No Credit Card to Start
Pass the EPPP for Less
Targets Your Weak Domains
Join in June for $30/mo
```
**Descriptions:**
```
Adaptive EPPP prep that targets your weak domains, not a static question bank.
Start a free 7-day trial. No credit card. Then $30/mo, rising to $40 in July.
Full-length practice exams plus adaptive questions that adjust to your level.
Lower-cost EPPP prep built to focus your study time where it counts most.
```
**Pinning:** Pin "Adaptive, Not a Static Bank" to Headline 1. Pin first description to Description 1. Leave the rest unpinned.

---

### AG3 - Conquest PsychPrep
**Landing page:** `/blog/thepsychology-vs-psychprep`

**Keywords (Phrase + Exact):**
```
"psychprep"  / [psychprep]
"psychprep review"
"psychprep alternative"
```

**Headlines:**
```
Adaptive EPPP Prep
EPPP Prep That Adapts
Practice the Real EPPP
Questions Like the Exam
Adaptive, Not Static Bank
Full-Length EPPP Exams
Free 7-Day Trial
No Credit Card Needed
Lock In $30/mo Before July
$40/mo Starting July
Join in June for $30/mo
Lower-Cost EPPP Prep
Targeted EPPP Question Bank
Study Smarter for the EPPP
Pass the EPPP With Less
```
**Descriptions:**
```
Adaptive practice that targets your weak spots with questions that match the real EPPP.
Free 7-day trial, no credit card. Then $30/mo, rising to $40/mo in July. Lock it in now.
Full-length practice exams plus a deep question bank built for the real EPPP.
Smarter EPPP prep for less. Start your free 7-day trial today, no credit card required.
```
**Pinning:** Pin "Adaptive EPPP Prep" to Headline 1. Pin first description to Description 1. Leave the rest unpinned.

---

### AG4 - Conquest Other (PrepJet / Taylor / Academic Review / Mometrix)
**Landing page:** `/blog/thepsychology-vs-prepjet` (for PrepJet terms). For Taylor / Academic Review / Mometrix terms you can also use `/blog/eppp-prep-programs-compared-2026`.

**Keywords (Phrase):**
```
"prepjet eppp"
"taylor study method"
"taylor study method review"
"taylor study method cost"
"academic review eppp"
"mometrix eppp"
```

**Headlines:**
```
Adaptive EPPP Exam Prep
EPPP Prep That Adapts
Smarter EPPP Practice
Adaptive, Not Static Bank
Full-Length EPPP Exams
EPPP Question Bank
Practice That Knows You
Try EPPP Prep Free 7 Days
Free 7-Day Trial, No Card
Lock In $30/mo Before July
$40/mo Starting July
Join in June for $30/mo
Transparent Low Price
Pass the EPPP With Less
Targeted EPPP Practice
```
**Descriptions:**
```
Adaptive EPPP practice that learns your weak areas. Free 7-day trial, no credit card.
Full-length practice exams and a deep question bank. Start your free trial today.
Honest pricing: $30/mo now, $40/mo in July. Lock in the lower rate this month.
Continuous adaptive practice that targets your gaps. Free trial, no credit card needed.
```
**Pinning:** Pin "Adaptive EPPP Exam Prep" to Headline 1, "Adaptive, Not Static Bank" to Headline 2. Pin first description to Description 1. Leave the rest unpinned.

---

### AG5 - Practice Questions  (the only group where "free" is allowed)
**Landing page:** `/blog/free-eppp-practice-questions`

**Keywords (Phrase):**
```
"eppp practice questions"
"eppp practice test"
"eppp practice exam"
"free eppp practice questions"
"eppp question bank"
"eppp sample questions"
"eppp quiz"
"adaptive eppp practice"
"best eppp question bank"
```

**Headlines:**
```
Free EPPP Practice Questions
EPPP Practice Test Online
Adaptive EPPP Practice
Full-Length Practice Exams
Huge EPPP Question Bank
Try EPPP Questions Free
Free 7-Day Trial, No Card
EPPP Quiz That Adapts
Practice Exams + Question Bank
Lock In $30/mo Before July
$40/mo Starting in July
Realistic EPPP Practice
Adaptive Questions, Free Trial
Pass the EPPP With Practice
Start Free, No Credit Card
```
**Descriptions:**
```
Adaptive EPPP practice that targets your weak spots. Free 7-day trial, no credit card.
Thousands of EPPP questions plus full-length practice exams. Start free in minutes.
Lock in $30/mo before the July rise to $40/mo. Cancel anytime, no credit card to start.
Practice questions that adapt to you, with realistic full-length EPPP exams.
```
**Pinning:** Pin "Free EPPP Practice Questions" to Headline 1 (matches search intent). Pin first description to Description 1. Leave the rest unpinned. If Ad Strength drops to Poor, pin 2-3 rotating headlines to position 1 instead of one.

---

### AG6 - Pass Rate
**Landing page:** `/blog/eppp-pass-rates`

**Keywords (Phrase):**
```
"eppp pass rate"
"eppp passing score"
"how hard is the eppp"
"eppp fail rate"
"how to pass the eppp"
"eppp first attempt pass rate"
"eppp score needed to pass"
```

**Headlines:**
```
Pass the EPPP With Confidence
Adaptive EPPP Exam Prep
Prep That Targets Weak Areas
Study Smarter, Pass Faster
Full-Length Practice Exams
EPPP Question Bank Included
Try It Free for 7 Days
No Credit Card to Start
Lock In $30/mo Before July
$40/mo Starting July
Join in June for $30/mo
How to Pass the EPPP
Worried the EPPP Is Hard?
Adaptive Prep, Real Results
Find Your Weak Spots Fast
```
**Descriptions:**
```
Adaptive EPPP prep finds your weak areas and drills them so you walk in ready to pass.
Full-length practice exams and a deep question bank built to lift your pass odds.
Start a 7-day free trial. No credit card needed. Lock in $30/mo before it rises in July.
Worried the EPPP is hard? Targeted practice turns weak spots into your strongest answers.
```
**Pinning:** Pin "Adaptive EPPP Exam Prep" to Headline 1. Pin first description to Description 1. Leave the rest unpinned.

---

## 5. After launch

- Skip on paid (own with SEO): broad informational terms like "what is the eppp", "eppp domains", "how to study for the eppp".
- Watch the search terms report daily for the first 2 weeks; add junk as negatives.
- Once **~15-30 purchases** have logged, consider switching to **Maximize Conversions with a target CPA** set near your observed CPA.
- Add Broad match one keyword at a time, only after Exact/Phrase data is healthy.

---

## 6. Open dependency: the $30 -> $40 price change

The RSAs and conquest pages say "$30/mo now, $40/mo in July". That copy is only accurate if checkout actually charges $30 in June and $40 from July 1. The price-change implementation is a separate task (Stripe price + env + a few copy lines, reusing your existing founding/standard switch). **Ship that before July 1 so the ad copy matches checkout.** Until it ships, $30 copy is accurate (checkout already charges $30 today).
