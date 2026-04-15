# Payroll Reconciliation Tools for Mental Health Practices — Market Research

> Last updated: 2026-04-09

This file is a market scan for the Inzinna payroll-prep project. The goal is not to pick a new payroll vendor immediately. The goal is to understand the market gap around turning therapy-practice activity into a payroll-ready, audit-friendly ledger.

Pricing and procurement details should be re-verified before any vendor decision. The more durable takeaway is the product gap: generic payroll platforms handle filing and direct deposit, but they do not solve session-based compensation reconciliation well.

---

## What Carlos Is Most Likely Looking For

Based on the broader Inzinna workflow work already in this repo, the highest-value gap is not tax filing or direct deposit. It is the layer between:

1. session activity in SimplePractice
2. manual spreadsheet reconciliation
3. final payroll entry in a downstream provider

The likely need is a tool that:
- imports pay-period activity
- applies clinician compensation rules consistently
- explains each line item
- isolates exceptions before payroll is finalized
- exports a clean summary into the existing payroll provider

In other words: **payroll preparation and reconciliation**, not a full payroll engine.

## Market Takeaway

- General payroll vendors are good at tax filing, onboarding, and direct deposit
- Therapy-specific platforms understand session-based pay better, but they are still uneven on payroll depth
- The market gap is the reconciliation layer that explains why each clinician is owed a given amount
- That gap is especially painful in practices mixing completed sessions, cancellations, supervision, admin hours, and retro adjustments

## The Big 3 General Payroll Platforms

### Gusto — Most Popular for Small Practices
- **Pricing:** $40/mo + $6/employee (Simple); $60/mo + $9/ee (Plus); $80/mo + $12/ee (Premium)
- **Strengths:** Transparent pricing, unlimited payroll runs, clean UI, easy onboarding, auto tax filing. Integrates with QuickBooks, Xero, FreshBooks, Sage. Access to 9,000+ health insurance plans and 401(k) providers. Most recommended by therapist peers and accounting blogs.
- **Weaknesses:** Support limited to business hours (M-F, 5am-5pm PT). Doesn't understand therapy-specific pay models (per-session, percentage splits). No behavioral health features built in. Only imports summary journal entries to QuickBooks — not line-item detail.
- **Best for:** Solo or small group practices (<50 employees) that just need clean, affordable payroll
- **Community sentiment:** The default recommendation in therapist forums and bookkeeper blogs. Practice owners praise its simplicity but consistently note the manual work bridging SimplePractice session data into Gusto.

### OnPay — Best Value for Multi-State
- **Pricing:** $49/mo + $6/employee (single tier, all features included)
- **Strengths:** Multi-state payroll with no extra per-state upcharge. PTO management included in base plan (Gusto and ADP charge extra for this). W-2 and 1099 support. Tax accuracy guarantee — OnPay pays IRS penalties if they make an error. Integrates with QuickBooks Online, Xero, When I Work, Deputy.
- **Weaknesses:** No auto-run payroll — must manually trigger each period. Fewer third-party integrations than Gusto. Some users report slow support ticket response and chat timeouts.
- **Best for:** Remote/telehealth practices with clinicians in multiple states who want one flat price

### Paychex Flex — Best Dedicated Support
- **Pricing:** ~$39/mo + $5/employee
- **Strengths:** Dedicated payroll specialist assigned to your account, 24/7 phone support, good compliance tools
- **Weaknesses:** Charges per payroll run (costly if you run weekly). Custom pricing = opaque. Still generic — no therapy-specific features.
- **Best for:** Practices that want a human to call when things go wrong

### ADP — Enterprise Grade
- **Pricing:** ~$79/mo + $4-6/employee (quote-based)
- **Strengths:** Best for multi-state compliance, scalable, deep HR/benefits suite
- **Weaknesses:** Overkill and expensive for most therapy practices. Complex setup. Charges per run. Opaque pricing.
- **Best for:** Large group practices with 50+ employees across multiple states

### QuickBooks Payroll — Best If Already on QBO
- **Pricing:** $45/mo + $5/employee (Core); scales up with tiers
- **Strengths:** Lives inside QuickBooks Online — payroll and tax entries post directly to books with full line-item detail (more granular than Gusto's summary import). Next-day or same-day direct deposit. Seamless if practice already uses QBO for accounting.
- **Weaknesses:** HR features are thin compared to Gusto. Caps at ~150 employees. Not built for session-based or percentage pay. No therapy-specific logic.
- **Best for:** Practices already using QuickBooks Online who want payroll and accounting in one place

### Rippling — Most Powerful All-in-One
- **Pricing:** Quote-based (starts ~$8/employee/mo for payroll module)
- **Strengths:** Unified HR + payroll + IT + benefits in one platform. Integrates with EHR/EMR systems (WellSky, eClinicalWorks, etc.). Automated onboarding workflows — clinicians get app access, benefits, payroll setup in one flow. Unlimited payroll runs. Multi-state and global payroll (185+ countries). Strongest automation of any platform reviewed.
- **Weaknesses:** Quote-based pricing is opaque. More powerful than most small practices need. Setup complexity. No therapy-specific compensation logic.
- **Best for:** Growing group practices (20+) that want HR, IT provisioning, and payroll unified

### Netchex — Best for Healthcare-Specific Compliance
- **Pricing:** Quote-based, per-employee-per-month (not per payroll run). Rated low-cost (2/10 on ITQlick scale).
- **Strengths:** Built for healthcare workforce reality. Native PBJ (Payroll-Based Journal) reporting, credential tracking connected to scheduling, every pay type calculated automatically. Handles multiple pay rates per employee. Award-winning US-based customer support (live chat, phone, email). Includes AskHR AI for employee self-service and AI-powered data analysis. Sweet spot is <500 employees.
- **Weaknesses:** Not therapy-specific — built for broader healthcare (hospitals, clinics, nursing). No session-based compensation logic. Still requires manual reconciliation of EHR activity to payroll inputs.
- **Best for:** Mid-size behavioral health organizations (50-500) that need healthcare compliance baked in

---

## Therapy-Specific Payroll Tools

### TherapyPM
- **Strengths:** Built for behavioral health. Integrates scheduling, billing, documentation, AND payroll in one platform. Tracks billable hours, clock-ins, overtime. Generates payroll reports by service type or rate. Integrates with QuickBooks and clearing houses.
- **Weaknesses:** Smaller company = less mature product. Payroll is part of the platform, not a standalone deep payroll system. Less robust tax filing than Gusto/ADP.

### FRIDAY
- **Pricing:** Free 14-day trial; subscription pricing (contact for quote)
- **Strengths:** Handles session-based pay, supervision hours, mileage reimbursements, and fixed salaries — all the weird therapy compensation structures. Automated direct deposit, tax filings, W-2s, 1099s. Built-in PTO tracking with automated accruals, request approvals, and real-time payroll syncing. Integrates with health benefits providers for enrollment and premium deductions.
- **Weaknesses:** Originally built for ABA providers (BCBAs, RBTs) — may not map perfectly to general psych/SW practices. Newer/smaller player. Less proven at scale.

### PimsyEHR — EHR with Built-In Payroll
- **Pricing:** Starts at $99/mo (Prime plan); scales by users and modules
- **Strengths:** Full behavioral health EHR with payroll baked in. Automates hourly, salary, or commission-based pay. Tracks PTO, flat rates, and percentage-based pay. Monitors all past sessions to minimize overpayments and catch payer recoupments. Staff renewal tracking and HR features included. HIPAA and 42 CFR Part 2 compliant. In the market since 2007 — most tenure of any therapy-specific option.
- **Weaknesses:** Payroll is a module inside an EHR, not a standalone payroll engine. Requires adopting their full EHR to get payroll — not practical if practice is already on SimplePractice or TherapyNotes. Pricing scales up quickly with users and add-ons.

### Heard — Bookkeeping + Payroll Bundle for Therapists
- **Pricing:** Subscription-based (Essential for solo/LLC, Premium for S-Corp/group). Payroll add-on via Gusto at $39/mo + $6/person. Annual subscribers save 15%.
- **Strengths:** Only financial platform built specifically for therapists. Done-for-you monthly bookkeeping — auto-syncs accounts, categorizes transactions, handles reconciliation. Tax prep and quarterly estimates included. Payroll transactions sync directly with bookkeeping so the books stay clean. Claims to save therapists 60+ hours/year and $5k+/year in taxes. Uses Gusto's embedded payroll API so setup is streamlined.
- **Weaknesses:** Payroll is just white-labeled Gusto — same limitations (no session-based pay logic, summary-only journal entries). Mixed reviews: some users report unbalanced books and had to hire additional accountants to fix errors. Limited to therapy sector. Premium pricing for what is essentially Gusto + a bookkeeper.

### ClinicTracker — EHR with Rules-Based Payroll Calc
- **Pricing:** Quote-based, scales by practice size and modules
- **Strengths:** Full behavioral health EHR that connects billing data directly to payroll calculations. **Key differentiator: supports reimbursement rules based on percentage of billed amount, percentage of collected amount, fixed amount per service, or fixed amount per unit.** Generates payroll reports segregated by clinician. Handles time-based billing with nuanced rules. Covers intake to discharge: scheduling, messaging, workflow, documentation, compliance, billing, collections, and payroll. HIPAA compliant.
- **Weaknesses:** Requires adopting ClinicTracker as your full EHR — not useful if already on SimplePractice or TherapyNotes. Quote-based pricing. Older UI compared to newer competitors. Learning curve for full feature set.
- **Why it matters for Inzinna:** ClinicTracker's rules-based payroll calculation (% of billed, % of collected, fixed per service, fixed per unit) is the closest existing product to what a reconciliation layer would need to do. Worth studying as a reference for how compensation rules should be modeled.

### AlohaABA — Best Value for ABA Practices
- **Pricing:** $29.99/staff/mo (Practice Management); $39.99/client/mo (One Simple Solution)
- **Strengths:** All-in-one for ABA: scheduling, billing, payroll, and EMR. Easy to use for beginners. Strong customer support with training included. Voted "Best Value" on Capterra 2024. Affordable entry point.
- **Weaknesses:** ABA-specific — not built for general psych/SW/counseling. Slow documentation reported by some users. Steep learning curve despite being "easy." Rigid workflows. Time-intensive initial setup.

### Theralytics — Growing ABA Platform
- **Pricing:** Custom/quote-based, scales with practice size
- **Strengths:** All-in-one ABA management: billing, payroll, scheduling, data collection, documentation, reporting. 4.8/5 rating on Capterra. Strong customer service and responsiveness. Affordable compared to competitors. Built to scale with growing clinics.
- **Weaknesses:** ABA-focused — limited applicability to general mental health/SW. Custom pricing makes comparison difficult. Smaller market presence than TherapyPM or PimsyEHR.

### Clinician Nexus — Enterprise Compensation Intelligence (New Entrant)
- **Pricing:** Enterprise/quote-based (health systems, not small practices)
- **Strengths:** Just launched next-gen platform (March 2026) with AI-powered compensation management. Users can describe compensation plans in plain English and the system builds them in real-time. Connects to HRIS/Payroll, EMR, Scheduling, and Patient Experience systems. Provides detailed Work RVU visibility. Gives clinicians transparent insight into how their pay is calculated. HIPAA compliant.
- **Weaknesses:** Built for health systems and large organizations, not small/mid therapy practices. Physician-focused — not behavioral health specific. Enterprise pricing. Overkill for a 5-20 person practice.
- **Why it matters for Inzinna:** Clinician Nexus's "describe compensation plans in plain English" approach and their focus on pay transparency/explainability is directionally aligned with the reconciliation layer concept. Their product validates that "why was I paid this amount?" is a real market need, even if their solution targets a different segment.

---

## What Practitioners Actually Say (Community Pain Points)

These themes come from therapist forums, accounting blogs, and practice-owner discussions:

1. **"I spend hours in spreadsheets before I can even open Gusto."** The most common complaint. Practice owners manually pull session data from SimplePractice, cross-reference insurance payments, calculate per-session or percentage-based pay, and then type final numbers into their payroll provider. The payroll tool itself works fine — the prep work is brutal.

2. **"Why did this clinician get paid this amount?"** When a clinician questions their pay, the practice owner has to reverse-engineer the answer from multiple systems (EHR, insurance EOBs, spreadsheets). There's no single audit trail.

3. **"We accidentally overpaid / underpaid and didn't catch it for months."** With manual reconciliation, errors compound silently. Payer recoupments (insurance clawbacks) are especially easy to miss.

4. **"Our associates are 1099 but probably shouldn't be."** Misclassification is rampant. Associates who use the practice's name, systems, policies, and client flow are almost always W-2 employees legally. Practices that get this wrong face back taxes, penalties, and unpaid overtime liability.

5. **"We collect payments from 4-5 sources and each records transactions differently."** Insurance, copays, self-pay, sliding scale, EAP — each has different timing, formatting, and reconciliation needs. Payroll tools don't normalize any of this.

6. **"Cancellations and no-shows wreck our payroll math."** Late cancellation fees, no-show policies, and retro insurance adjustments all create exceptions that don't fit neatly into any payroll tool's model.

7. **"Insurance reimbursement delays mean we can't always make payroll on time."** Cash flow is lumpy when 60-70% of revenue comes from insurance with 30-90 day payment cycles but payroll is biweekly.

---

## The Core Problem in This Space

The real pain point isn't just "running payroll" — it's the **compensation model complexity**:

1. **Mixed pay structures** — Some clinicians are salaried, some per-session, some on percentage-of-collections. Many practices have all three.
2. **Misclassification risk** — Many practices treat associates as 1099 contractors when they legally should be W-2 employees (they use the practice's systems, follow its policies, depend on it for clients). This is a major compliance liability.
3. **Overtime calculation** — Per-session clinicians who work 40+ hours are entitled to overtime, but calculating it on non-hourly pay requires a specific FLSA method most practices get wrong.
4. **Supervision time** — Often compensable but rarely tracked or paid correctly.
5. **Insurance reimbursement delays** — Cash flow gaps make it hard to meet payroll on time.

Generic payroll tools (Gusto, ADP) handle the *mechanics* of payroll but don't understand these therapy-specific structures. The therapy-specific tools (TherapyPM, FRIDAY) understand the structures but are less mature on the payroll engine side.

**Nobody owns this gap well yet** — which is why most practices cobble together SimplePractice/TherapyNotes for scheduling + Gusto for payroll + QuickBooks for accounting, and manually bridge the data between them.

## What This Means For Inzinna

The most promising direction is:

- keep the downstream payroll provider in place
- treat SimplePractice and existing spreadsheets as source material to normalize
- build or define a payroll-ready ledger plus exception queue
- focus first on explainability and trust, not tax-compliance replacement

That is a smaller, cleaner v1 than "build payroll software." It matches the likely Carlos use case much better.

## Vendor Implications

- **If the practice is mostly asking "how do we actually run payroll?"** then Gusto/Paychex/ADP evaluation matters
- **If the practice is asking "why did this clinician get paid this amount?"** then the real need is a reconciliation and audit layer
- **If the practice has unusual compensation structures but does not want to replace core systems** then a prep/export layer is a better fit than a full platform migration

## Sources

### Payroll Platform Reviews
- [Best Payroll Software For Therapists | TL;DR Accounting](https://www.tldraccounting.com/payroll-software-for-therapists/)
- [How to Choose Payroll Software for Your Therapy Practice | Heard](https://www.joinheard.com/articles/how-to-choose-payroll-software-for-your-therapy-practice)
- [ADP vs Paychex vs Gusto Comparison](https://lifthcm.com/article/adp-vs-paychex-vs-gusto-comparison)
- [Gusto vs QuickBooks Payroll Comparison 2026](https://gusto.com/product/compare/gusto-vs-quickbooks-payroll)
- [Gusto vs QuickBooks Payroll | NerdWallet](https://www.nerdwallet.com/article/small-business/gusto-vs-quickbooks-payroll)
- [OnPay Review 2026 | Research.com](https://research.com/software/reviews/on-pay-review)
- [OnPay Review 2026 | Business.com](https://www.business.com/reviews/onpay/)
- [Rippling Review 2026 | Expert Market](https://www.expertmarket.com/payroll-services-rippling-review)
- [Rippling Healthcare Industries](https://www.rippling.com/industries/healthcare)
- [Netchex 5 Best Payroll for Healthcare 2026](https://netchex.com/the-5-best-payroll-software-platforms-for-healthcare-2026/)
- [Netchex Review 2026 | Research.com](https://research.com/software/reviews/netchex)

### Therapy-Specific Platforms
- [TherapyPM Payroll Solutions](https://therapypms.com/payroll-solution/)
- [FRIDAY Payroll for ABA Therapy Providers](https://fridayapp.com/best-payroll-for-aba-therapy-providers/)
- [PimsyEHR Payroll Features](https://pimsyehr.com/solutions/payroll/)
- [PimsyEHR Pricing](https://pimsyehr.com/pricing/)
- [Heard Pricing](https://www.joinheard.com/pricing)
- [Heard Review 2026 | Fahimai](https://www.fahimai.com/heard)
- [Heard Embedded Payroll Case Study | Gusto Embedded](https://embedded.gusto.com/blog/heard-embedded-payroll-streamlining-therapist-finances/)
- [ClinicTracker Payroll Management](https://clinictracker.com/clinical-treatment-billing/clinic-payroll-management/)
- [ClinicTracker Payroll Features](https://clinictracker.com/features/payroll-management)
- [AlohaABA Pricing](https://alohaaba.com/pages/pricing)
- [AlohaABA Review | Passage Health](https://www.passagehealth.com/blog/aloha-aba-reviews)
- [Theralytics Best ABA Software](https://www.theralytics.net/blogs/best-aba-practice-management-software)
- [Clinician Nexus Compensation Management](https://cliniciannexus.com/compensation-management)
- [Clinician Nexus Next-Gen Platform Launch (March 2026)](https://www.businesswire.com/news/home/20260316569629/en/)

### Compensation Models & Compliance
- [How Group Practices Pay Their Clinicians | SimplePractice](https://www.simplepractice.com/blog/group-practice-payroll-models/)
- [Payroll Compliance for Behavioral Health Practices | Savvy HR](https://www.savvyhrpartner.com/post/behavioral-health-payroll)
- [Common Compensation Models for Group Practices | TherapyNotes](https://blog.therapynotes.com/common-compensation-models-for-group-practices)
- [Compensation Models Comparison | Solomon Advising](https://www.solomonadvising.com/compensation-models-comparison)
- [Paying Therapists 101 | Green Oak Accounting](https://www.greenoakaccounting.com/post/paying-therapists-101)
- [Calculating Payroll for Group Practices | SimplePractice Support](https://support.simplepractice.com/hc/en-us/articles/360006662872-Calculating-payroll-for-group-practices)

### Practitioner Perspectives
- [Payroll Made Simple for Therapists | Guided Wellness Counseling](https://guidedwellnesscounselingut.com/payroll-made-simple-for-therapists-the-system-i-use-to-confidently-run-my-counseling-private-practice/)
- [The Tools You Need to Run a Private Practice | Matthew Ryan LCSW](https://www.matthewryanlcsw.com/blog/all-the-services-i-use-in-private-practice)
- [QuickBooks for Therapists | Focal Point Bookkeepers](https://www.focalpointbookkeepers.com/blog/quickbooks-for-therapists)
