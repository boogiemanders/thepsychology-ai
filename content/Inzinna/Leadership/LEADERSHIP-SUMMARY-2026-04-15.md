# Inzinna Build Summary — Week of April 8–15, 2026

> For leadership meeting, April 15, 2026

## The short version

Three Chrome plugins and a pair of live assessment tools built or pushed forward this week. The plugins run on the clinician's own computer — patient info stays local. If anything goes to a cloud service, names and details get scrubbed first.

1. **SimplePractice Notes plugin** — biggest push. Pulls intake data, writes SOAP notes, preps for supervision, and now suggests diagnoses.
2. **ZocDoc → SimplePractice plugin** — polished up. Ready for P02's pilot (VOB is her #1 ask).
3. **JustWorks Payroll Autofill plugin** — brand new. Reads the SP payroll CSV, runs the pay rules per clinician, fills JustWorks time cards.
4. **Assessment tools for Bret (BAARS + ADHD-RS)** — live on the lab site. Real scoring, real norms, clinician-facing summary.

**We have not shipped the plugins to clinicians yet.** We're stuck on a few setup items. Details below.

---

## 1. SimplePractice Notes plugin

**What it does now:**

- **Pulls intake data** — reads SP intake forms straight from the page. Packs it into ICE fields (HPI, medical history, social, main complaint, MSE).
- **Cleans up the AI note** — scrubs patient info out, sends to GPT-4o-mini, gets back clean ICE fields. If there's no API key, falls back to a simpler rule-based version. Keeps old intake notes so details don't get lost.
- **Writes SOAP drafts after a session** — runs on a local model (Ollama) by default. Clinician reads and edits before anything gets saved.
- **Supervision prep tab** — builds a case summary, a meeting agenda, discussion questions, and a short AI-use reflection.
- **AI diagnosis suggestions (new this week)** — two passes:
  - Pass 1: picks 3–5 likely diagnoses from a list of 161 DSM-5 disorders.
  - Pass 2: goes through each DSM criterion one at a time and checks if it fits.
  - Shows a confidence badge. You can open up each one and see the reasons. Click "pin" to save it to the case.
  - Tested on a real case (David): the 4 diagnoses we expected all showed up. No fake PTSD. No made-up timelines.
- **The old rules engine still runs too** — so PHQ-9 and GAD-7 scoring stays solid.

**Five tabs in the side panel:** Intake, SOAP, Tx Plan, Supervision, AI Suggestions.

**Name + privacy:** now branded "Inzinna SP Notes." Privacy policy written. Anything under copyright got pulled out of the zip.

## 2. ZocDoc → SimplePractice plugin

**What it does now:**

- Pulls new patient info from ZocDoc (name, DOB, email, phone, insurance, who referred them).
- Fills SP demographics (clinician, office, CPT code, billing type, status, reminders).
- Handles SP's dropdown menus correctly.
- Only saves as a draft. Clinician still has to hit send.

**This week:** cleaned up the UI. Redesigned the lab demo page into a simple scroll-through walkthrough. Added the Inzinna logo. Ready for P02 — her #1 ask in the survey was VOB automation, and that's exactly what this hits.

## 3. JustWorks Payroll Autofill (new this week)

**What it does now:**

- Reads the SP payroll CSV.
- Applies the pay rules for all 10 clinicians. I built a master pay legend and checked it against real Excel sheets.
- Works out real hours per day from the CPT codes.
- Picks an hourly rate that makes `rate × hours = exact total pay`.
- **Minute nudge trick** — if rounding leaves a small gap, it tries moving the end time ±30 minutes and picks the minute count that lands on the exact total.
- Fills JustWorks time cards using real page selectors. Works even with JustWorks' React inputs (uses a native setter trick so React sees the change).

**How close are we?** 5 of 9 clinicians match their real pay exactly. The other 4 have hand-added extras (admin hours, Fusion events). Those are on the question list for Carlos.

**Lab demo page:** `/lab/inzinna/payroll` with a worked example.

## 4. Assessment tools for Bret (BAARS + ADHD-RS)

Built on the lab site, not as plugins. Bret asked for ADHD scoring help. These give him a fast, clean scorer he can use during or after a session.

**BAARS-IV — what it does now:**

- **Four forms in one scorer:** adult self-report (current + childhood), other-report (current + childhood). Respondent info stays put when you switch forms.
- **Scoring that actually helps:** shows raw totals, percentiles, and clinical cutoffs inline.
- **Clinical summary page:** builds a written summary with pronoun handling, the respondent's name, and percentile bands in plain language. Updates live as you score.
- **Nice to use:** keyboard-only scoring, collapsible sections, mobile sheet view, sticky scale header. Designed to match the lab site's look.
- **Demo live at:** `/lab/inzinna/baars`

**ADHD-RS — what it does now:**

- Home scorer is live (parent/self form).
- Norms tables built in (home + school).
- Matches the BAARS look so clinicians have one mental model across tools.
- **Demo live at:** `/lab/inzinna/adhd-rs`

**Why this matters for the meeting:** these don't need Chrome Web Store or Workspace to ship. They're already live. Bret can use them today. Same for any clinician we share the link with.

---

## Shipping to clinicians — where we're stuck

We have not force-installed anything on clinician computers yet. What's open:

- [x] Chrome Web Store developer account — bought
- [ ] Submit the plugins to the Web Store as Unlisted or Private (review takes 1–3 days)
- [ ] A Google Workspace set up for inzinna.com
- [ ] Admin access to that Workspace so we can push plugins by policy
- [ ] Signed HIPAA BAA with Google Workspace (this covers the browser the plugins run inside)
- [ ] **Access to the Inzinna website** — so we can host the privacy policy there. Google Chrome needs a link to a privacy policy. Long term I don't want to host Inzinna's policy on my own site

**Flow once those are done:**
1. Zip the built plugin, upload to the Web Store, set it to Private for the Inzinna domain.
2. Wait for review.
3. In Workspace admin, turn on force-install to the clinician group.
4. Plugin shows up on clinician computers on its own. No dev mode, no "load unpacked."

---

## Questions for Carlos (April 15, 2026)

### Pay rules
- Does Filomena have a no-show rate? Other clinicians get $40 for codes 00001/00002.
- Does Isabelle have a no-show rate? She's $50 flat for all CPT — is no-show the same or different?
- What is "Fusion Trip" / "Fusion Event"? Shows on Izzy's and Rachel's sheets. $50 each. No CPT code.
- Izzy's 96132 supervision rate — does it change by payer? Sheet shows (U)96132 = $143.62 but (A)96132 = $93.53.
- Does Karen have a no-show rate? No 00001/00002 rows on her sheet.
- Sebby Boyer's 90837 rate for Bret is $161.71. That doesn't match Aetna ($160.89) or United ($161.78). Is there a third payer?

### Data we can't see in the CSV
- The SP CSV doesn't show which insurance paid. Bret's pay depends on the payer. Is there a different SP report that shows payer?
- On Bret's sheet, Sinjun Strom and T Mendez show $200. Are they private pay at $250 (so 80% = $200)?
- "NO CHARGE" rows — skip them or pay anyway? Example: 3/30 Harry Steves 90791 is NO CHARGE but the plugin pays Bret $200.
- "Rate per Unit" doesn't always match "Charge." Example: 3/23 Kev Lynch 96132 — Rate = $250, Charge = $20. For payer-based clinicians, should we pay 80% of Rate, 80% of Charge, or 80% of what was paid?

### Stuff added by hand
- Filomena gets 1 admin hour a week at $65. Where does that come from? Is it always 1 hour, or does it move?
- "Fusion Trip" (Izzy) and "Fusion Event" (Rachel) are $50 each, added by hand. What kicks these off? How should the plugin know to include them?

### Setup and compliance
- Is it okay in JustWorks to change a clinician's hourly pay rate every week?
- Is there already an inzinna.com Google Workspace set up? Can I get admin access?
- Is the Google Workspace HIPAA BAA already signed, or do I need to request it?
- **Can I get access to the Inzinna website?** I need to host the plugin privacy policy there. Google Chrome requires a link to it, and long term I shouldn't be hosting Inzinna's privacy policy on my personal site.

### Already answered
- [x] Bret's supervision pay = 5% of his supervisees' session totals. Checked against real pay periods.
