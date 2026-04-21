# DIPS Chatbot Knowledge Base Outline

Maps the **DIPS Clinic Manual** and **DIPS Employee Handbook** to a structured knowledge base for an internal staff chatbot.

## Scope note

The two uploaded docs are **internal/staff-facing**, not patient-facing. This KB supports a bot for DIPS clinicians and admins — answering questions about ops, compliance, booking workflows, billing, HR, and benefits.

Patient-facing bot is a separate phase and would reuse: cancellation policy script, services offered, informed consent, and referral resources.

## Chunk Schema

Every section becomes one chunk:

```
{
  id: "mandated-reporting",
  doc: "clinic-manual" | "employee-handbook",
  title: "Mandated Reporting",
  category: "faq" | "booking" | "billing" | "crisis" | "compliance" | "hr" | "benefits" | "how-to",
  audience: "clinician" | "admin" | "supervisor" | "all-staff",
  content: "<markdown>",
  links: ["1-800-342-3720", "..."],
  related: ["confidentiality", "emergency-procedures"]
}
```

Chunk on H2/H3 boundaries. The manual's `{#anchor}` slugs become the chunk ids.

## Category Map — Clinic Manual

| Section | Category | Audience | Notes |
|---|---|---|---|
| Contacts | faq | all-staff | "Who do I call for X?" |
| Ethical Principles | compliance | clinician | APA code link |
| Services Offered / Scope of Care | faq | all-staff | What we treat |
| Referral & Exclusion Criteria | compliance | clinician | Decision tree — can we take this client? |
| HIPAA Privacy & Security | compliance | all-staff | Approved platforms, access rules |
| Mandated Reporting | crisis | clinician | NY hotlines, 24/7 numbers |
| Confidentiality & ROI | compliance | clinician | Minimum necessary rule |
| Emergency & Crisis Procedures | crisis | clinician | 7-step workflow |
| Crisis Protocols (beyond emergency) | crisis | clinician | Decision tree |
| Boundaries in Communication | compliance | clinician | |
| Supervision & Scope of Practice | faq | clinician (pre-licensed) | |
| Telehealth Policy | compliance | clinician | Session-start checklist |
| Confidentiality & Privacy Practices | compliance | all-staff | |
| Record Retention & Access | compliance | admin | NY rules |
| **Billing & Financial Policies** | billing | admin, clinician | |
| Professional Boundaries | compliance | clinician | |
| DEI | faq | all-staff | |
| Grievance Procedures | how-to | all-staff | Client + employee paths |
| Informed Consent | compliance | clinician | Document links |
| DIPS AI Usage Policy | compliance | all-staff | Permitted / not permitted lists |
| Simple Practice | how-to | all-staff | Intro + compliance guides |
| Justworks | how-to | all-staff | HR/payroll platform |
| Risk Management | compliance | clinician | |
| Zocdoc | how-to | admin | Support contact |
| **Patient Bookings (7-step)** | booking | admin | Workflow |
| **Cancellation Policy + script** | billing | admin, clinician | Patient-script is reusable |
| Clinical Documentation Standards | how-to | clinician | Note template checklist |
| Progress vs psychotherapy notes | faq | clinician | |
| **CPT Codes** | billing | clinician | Lookup table |
| Termination and Transfer of Care | how-to | clinician | Workflow |
| Psychiatric Consultation | how-to | clinician | Referral paths |
| Referral Resources | how-to | clinician | Outbound directory |

## Category Map — Employee Handbook

| Section | Category | Audience |
|---|---|---|
| Welcome / At-Will | hr | all-staff |
| Ethics Code | compliance | all-staff |
| Mission / Vision / Values | faq | all-staff |
| Pregnancy / Childbirth Accommodations | hr | all-staff |
| Conflicts of Interest | compliance | all-staff |
| Disability Accommodation | hr | all-staff |
| I-9 / Employment Authorization | hr | all-staff |
| Employment of Relatives | hr | all-staff |
| Job Descriptions | hr | all-staff |
| New Hires / Intro Period (30 days) | hr | new-staff |
| Religious Accommodation | hr | all-staff |
| Training Program | hr | all-staff |
| **Attendance / Caseload (30 FT / 15 PT)** | hr | clinician |
| Business Expenses | hr | all-staff |
| Direct Deposit | hr | all-staff |
| Employment Classifications | hr | all-staff |
| Wage & Hour Intro | hr | all-staff |
| Paycheck Deductions | hr | all-staff |
| Recording Time | hr | all-staff |
| Criminal Activity / Arrests | compliance | all-staff |
| Disciplinary Process | hr | all-staff |
| Employment Verification | hr | all-staff |
| Exit Interview | hr | all-staff |
| Open Door / Conflict Resolution | hr | all-staff |
| Pay Raises / Performance Reviews | hr | all-staff |
| Standards of Conduct | compliance | all-staff |
| Workforce Reductions (Layoffs) | hr | all-staff |
| Computer Security / Software | compliance | all-staff |
| Social Events | hr | all-staff |
| Nonsolicitation / Nondistribution | compliance | all-staff |
| Off-Duty Use of Property | compliance | all-staff |
| Personal Appearance | hr | all-staff |
| Personal Data Changes | hr | all-staff |
| Social Media | compliance | all-staff |
| Workplace Privacy | compliance | all-staff |
| **401(k) Plan** | benefits | all-staff |
| Dental Insurance | benefits | all-staff |
| Federal Jury Duty Leave | benefits | all-staff |
| **Health Insurance** | benefits | all-staff |
| Military Leave (USERRA) | benefits | all-staff |
| Vision Care | benefits | all-staff |
| Workers' Comp | benefits | all-staff |
| General Safety | compliance | all-staff |
| EEO / Nonharassment (NY) | compliance | all-staff |
| Reproductive Health Rights (NY) | compliance | all-staff |
| Sexual Harassment Prevention (NY) | compliance | all-staff |
| Nursing Accommodations (NY) | benefits | all-staff |
| Meal Periods (NY) | hr | all-staff |
| Overtime (NY) | hr | all-staff |
| Pay Period (NY) | hr | all-staff |
| Domestic Violence Accommodations (NY) | benefits | all-staff |
| Crime Victim / Witness Leave (NY) | benefits | all-staff |
| Disability Benefits (NY) | benefits | all-staff |
| Jury Duty Leave (NY) | benefits | all-staff |
| **Paid Family Leave (NY)** | benefits | all-staff |
| **Paid Prenatal Personal Leave (NY)** | benefits | all-staff |
| **Paid Sick Leave — accrual (NY)** | benefits | all-staff |
| **Paid Sick Leave — frontloading (NY)** | benefits | all-staff |
| Voting Leave (NY) | benefits | all-staff |
| Airborne Infectious Disease Exposure Plan | compliance | all-staff |

## FAQ Seed Set (30 Questions)

### Booking & Scheduling
1. How do I book a new Zocdoc lead? → `patient-bookings`
2. What are the 7 steps in the booking workflow? → `patient-bookings`
3. What's our cancellation policy? → `cancellation-policy`
4. Can I take this client (has self-harm / substance use)? → `referral-and-exclusion-criteria`, `scope-of-care`
5. What's the minimum caseload? → handbook `4.1 attendance`

### Billing & Payments
6. What CPT code for a 45-minute session? → `guide-to-cpt-codes`
7. What CPT code for an intake? → `guide-to-cpt-codes`
8. How do I send a Verification of Benefits request? → `patient-bookings` step 7
9. Do we charge for no-shows? → `cancellation-policy`
10. Sample script for explaining cancellation fees? → `sample-script-for-explaining-the-cancellation-policy`

### Crisis & Safety
11. Client is suicidal, what do I do? → `emergency-and-crisis-procedures`
12. Do I need to make a mandated report? → `mandated-reporting`
13. NY Child Abuse Hotline? → `1.-child-abuse-or-maltreatment` (1-800-342-3720)
14. Adult Protective Services phone for my borough? → `2.-adult-protective-services`
15. Client reports domestic violence — steps? → `emergency-and-crisis-procedures`, `mandated-reporting`

### Compliance & Ethics
16. Can I use ChatGPT with client info? → `dips-ai-usage-policy` (No PHI rule)
17. What platforms are HIPAA-compliant here? → `hipaa-privacy-and-security-practices`, `simple-practice`
18. Can I see a former client socially? → `professional-boundaries-and-dual-relationships`
19. What are the ROI requirements? → `confidentiality-&-information-sharing`
20. How long do we keep records? → `record-retention-&-access`

### HR / Employment
21. How much paid sick leave do I get? → handbook `Paid Sick Leave`
22. Am I eligible for Paid Family Leave? → handbook `Paid Family Leave`
23. 401(k) vesting schedule? → handbook `7.1 401(k) Plan`
24. How do I request time off? → handbook `4.1 Attendance` + Justworks
25. Paid Prenatal Leave — how many hours? → handbook `Paid Prenatal Personal Leave`

### Supervision & Training
26. How do I schedule supervision? → `supervision-structure`
27. Pre-licensed scope limits? → `supervision-for-pre-licensed-providers`
28. How often are evaluations? → `evaluation-and-professional-growth`
29. Who do I call for clinical vs admin questions? → `contacts` (Greg/Bret clinical, Carlos admin)
30. What's mandatory to complete before seeing clients? → `mandated-reporting` (NYS OCFS training)

## Booking Rules — 7-Step Workflow

From manual p. 58-61. Each step = its own chunk so the bot can walk users through.

1. **Receive Booking** — Zocdoc notification arrives
2. **Create client in Simple Practice**
3. **Select intake forms** — match to service type (adult, child, couples, assessment)
4. **Review email** — confirmation email to client
5. **Schedule the appointment** — on clinician's calendar
6. **Input all information from Zocdoc into Simple Practice** — demographics, insurance, referral source
7. **Send Verification of Benefits (VOB) Request** — confirms coverage before session

## Billing Scenarios — Lookup Table

| Scenario | Source chunk | Answer pattern |
|---|---|---|
| CPT for session length | `guide-to-cpt-codes` | Table lookup (intake 90791, 45-min 90834, 60-min 90837, etc.) |
| Late cancel / no-show | `cancellation-policy` | Policy + script |
| VOB request | `7.-send-verification-of-benefits-(vob)-request` | Workflow step |
| Client asks about sliding scale | `billing-&-financial-policies` | Policy text |
| Client balance owed | `billing-&-financial-policies` | Policy + Simple Practice flow |
| Insurance denied | `billing-&-financial-policies` | Appeal + client-communication script |

## Retrieval Architecture (recommended)

**MVP:** JSONL file of chunks + OpenAI embeddings in Supabase `pgvector` table. Hybrid search:
- **Exact match** (BM25 / Postgres full-text) for phone numbers, CPT codes, dollar amounts
- **Semantic match** (vector) for policy questions, scenarios

**Why Supabase:** Already in the stack, `DATABASE_URL` is available locally, no new infra.

**Answer format:** Every bot reply must cite the source chunk with a link back to the exact section — no ungrounded answers.

## Next Steps

1. Convert `DIPS_Employee_Handbook_589773_en.pdf` → markdown (`pdftotext` or similar).
2. Write chunker: walks both `.md` files, splits on headings, emits `kb.jsonl` with the chunk schema.
3. Seed the eval set: turn the 30 FAQ questions above into a `faqs.jsonl` with `question` + `expected_chunk_id`.
4. Decide embeddings provider (OpenAI vs Ollama). For MVP, OpenAI is simpler.
5. Build the bot UI under `src/app/lab/inzinna/chatbot/` following existing Inzinna lab patterns.
6. Ship with eval accuracy gate — ≥85% correct chunk retrieval on the 30-question set before launching internally.
