# Google Ads EPPP - Continuation Notes (2026-06-23)

Builds on `google-ads-eppp-launch-checklist-2026-06-22.md`. Campaign: **EPPP Prep - Search - US+CA**, $10/day, Maximize Conversions (no tCPA yet), US+CA, Quebec excluded. Currently running: AG1 (Comparison/Best) + AG5 (Practice Questions).

---

## FIX NOW: AG1 is on Broad match (should be Phrase)

The live AG1 keywords were entered as **Broad match**. The launch plan is **Phrase only** (add Broad later, one term at a time, once the data is trusted). Broad match on a new account with no conversion history will spend the daily budget on loosely related searches and teach the algorithm nothing useful.

**Fix:** delete the broad keywords and re-add them wrapped in quotes (= Phrase). Also 3 keywords were missing. Full corrected AG1 list (Phrase):

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

Several show "Low search volume / Not eligible" (e.g. best eppp prep course, affordable eppp prep, best online eppp prep). That is normal for niche terms; Google activates them automatically if volume appears. Leave them in.

---

## AG6 - Study Materials (new ad group)

Replaces the original AG6 "Pass Rate" slot. **Recommendation: keep Pass Rate too, as AG7** (its terms like "eppp pass rate" / "how hard is the eppp" are high-intent and cheap). Pass Rate spec is unchanged in the 06-22 checklist.

**Landing page:** `/blog/eppp-prep-programs-compared-2026` (allowlisted paid page: above-the-fold "Start free trial" card with correct $30 -> $40 July pricing).

**Display paths:** `EPPP-Study` / `Free-Trial`

**Keywords (Phrase):**
```
"eppp study materials"
"eppp exam study guide"
"eppp exam prep"
```

**Headlines (all <=30 chars, verified):**
```
EPPP Study Materials
All-in-One EPPP Study
EPPP Study Guide Online
Adaptive EPPP Study Tool
Study Smarter for the EPPP
Full-Length EPPP Exams
Big EPPP Question Bank
Practice That Adapts to You
Try EPPP Prep, 7-Day Trial
7-Day Trial, No Card
No Credit Card to Start
Lock In $30/mo Before July
Join in June for $30/mo
$40/mo Starting July 2026
EPPP Prep in One Place
```

**Descriptions (all <=90 chars, verified):**
```
EPPP study materials that adapt to you. Full-length exams and a deep question bank.
Start a 7-day free trial, no credit card. See if adaptive EPPP study fits you.
Lock in $30/mo before the July 2026 rise to $40/mo. Cancel anytime.
One place for EPPP study guides, practice exams, and adaptive questions.
```

**Pinning:** Pin "EPPP Study Materials" to Headline 1 (matches search intent, no superlative). Pin the first description to Description 1. Leave the rest unpinned.

**Per-group negative:** add `free` (only AG5 bids on "free"). No conquest cross-negatives needed (these are non-brand terms).

---

## Conquest URLs (AG2/AG3/AG4): the 06-22 checklist slugs are CORRECT

Use the `thepsychology-vs-*` slugs exactly as written in the checklist:
- AG2 AATBS -> `/blog/thepsychology-vs-aatbs`
- AG3 PsychPrep -> `/blog/thepsychology-vs-psychprep`
- AG4 PrepJet -> `/blog/thepsychology-vs-prepjet` (Taylor/Academic Review/Mometrix terms -> `/blog/eppp-prep-programs-compared-2026`)

These are the allowlisted paid pages: above-the-fold "Start free trial" card + correct $30 -> $40 July price. Keywords, RSAs, and cross-negatives for AG2/3/4 are already in the 06-22 checklist Sections 3-4; nothing changed.

### SEO cleanup (not blocking the launch)
Older organic twins exist and are also live + in the sitemap: `thepsychology-ai-vs-aatbs`, `-psychprep`, `-prepjet` (and `-mometrix`). They are NOT allowlisted (no top CTA) and state only "$30/month" with no July step-up. Two near-identical indexed pages per competitor = duplicate-content / cannibalization. **Do not point any ad at the `-ai-vs-*` versions.** Fix later: 301 the `-ai-vs-*` pages to the `vs-*` pages (or cross-canonical) and drop them from the sitemap.

---

## Reminders carried over

- **AG5 demographics:** AG5 > Audiences > Edit demographics, uncheck 18-24 and 65+ (was done on AG1, not AG5).
- **Verify purchase conversion:** after the next real paid signup, Google Ads > Goals > Conversions > Summary should show `purchase` increment; also confirm in GA4 DebugView (the event returns 204 even if dropped, so verify, do not assume).
- **Vercel env vars before July 1** (prod): `STRIPE_PRICE_ID_PRO_CURRENT` = new $40 Stripe price ID; `STANDARD_PRICE_INCREASES_AT` = `2026-07-01T00:00:00Z`. Blocked on creating the $40 Stripe price first.

---

## Google Ads API (developer token)

A developer token alone is not enough to make changes to the live account, and a freshly created token almost certainly cannot touch the production account yet. To mutate the account via API you need:
1. Developer token (have it) - but new tokens default to **Test access**, which can only call **test/sandbox** accounts. You must apply for **Basic access** in the API Center and wait for Google approval (typically a few business days) before it can touch the live account.
2. OAuth2 client (client ID + secret) from a Google Cloud project with the Google Ads API enabled.
3. A refresh token from authorizing that client against the Google login that owns the Ads account.
4. The manager (login) customer ID + the target customer ID.

For a one-time launch, the manual UI steps (uncheck AG5 demographics ~30s, build AG6 + paste keywords/RSAs ~5min, add cross-negatives ~2min) are faster than wiring OAuth and waiting on Basic-access approval. The API is worth it later for recurring ops (daily search-term negative mining, bid/budget tweaks, reporting). Recommend: launch by hand now; build the API integration afterward if we want automation.
