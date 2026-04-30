# Schedule A — Prior Intellectual Property (DRAFT)

**Status:** Draft for Anders Chan's review before May 1, 2026 Effective Date of the Employment Agreement v2.0 (Dr. Inzinna Psychological Services PLLC).

**Purpose:** Under Section 10.7 of the Employment Agreement, the Employee may list on Schedule A any Prior Intellectual Property to be expressly excluded from assignment under Section 10.2 ("Employer Work Product"). **Failure to list an item does not by itself create Employer ownership**, but listing is the cleanest protection — without it, anything developed using Employer time, compensation, equipment, paid AI tools/APIs, supplies, facilities, confidential information, patient information, or proprietary materials defaults to Employer Work Product.

**Critical context:** Inzinna covers Anders's Claude Code / AI tooling subscription. That means any work product produced via Claude Code after May 1, 2026 arguably falls under Section 10.2 unless (a) the underlying Prior IP is listed here, or (b) the work is independent (Section 10.3), developed entirely on Anders's own time without Employer resources.

---

## A1. Pre-existing Software — Chrome Extensions

### SimplePractice Notes extension
- **Repo path:** `content/Inzinna/SimplePractice Notes/` (in `thepsychology-ai` repo)
- **First commit / creation:** predates May 1, 2026 Effective Date
- **Scope preserved:** underlying architecture, prompt library, clinical-knowledge corpus loader, diagnostic engine heuristics, SOAP prompt templates, general-purpose extension shell (manifest, content-script scaffolding, sidepanel UI framework)
- **Carve-out:** Any Inzinna-specific workflow code (DIPS-form selectors, ICE-form field maps, Inzinna-branded UI) developed ON or AFTER May 1, 2026 using Employer resources is acknowledged as Employer Work Product.

### ZocDoc → SimplePractice extension
- **Repo path:** `content/Inzinna/zocdoc-to-simplepractice/`
- **First commit / creation:** predates May 1, 2026 Effective Date
- **Scope preserved:** underlying architecture, payer typeahead approach, VOB email template engine, PHI-cleanup alarm pattern, Ember-aware field-fill utilities (as generalized library)
- **Carve-out:** Inzinna-specific payer lists, CPT code sets, office IDs, provider signature blocks ON or AFTER May 1, 2026 are Employer Work Product.

## A2. Pre-existing Software — Assessment Tools

### BAARS (Barkley Adult ADHD Rating Scale) scorer
- **Repo path:** `content/Inzinna/Assessment Tools/BAARS/` (scorer + norm tables)
- **Lab-site integration path:** `src/app/lab/baars/` (in `thepsychology-ai` repo)
- **Scope preserved:** scoring engine, norm-table data structure, BAARS-specific interpretation logic, lab-site component library
- **Note:** BAARS source materials (Barkley workbooks) are third-party copyrighted and not Anders's IP.

### ADHD-RS-5 scorer (home + school forms)
- **Repo path:** `content/Inzinna/Assessment Tools/ADHD-RS/`
- **Scope preserved:** scoring engine, norm-table structure, parent-vs-teacher comparison approach
- **Note:** ADHD-RS-5 source materials are third-party copyrighted and not Anders's IP.

## A3. Pre-existing Frameworks and Generalized IP

- **Prompt library and clinical-knowledge loader patterns** — generalized across health-tech projects beyond Inzinna
- **Chrome extension architecture templates** (Manifest V3, background/content/sidepanel split, PHI-cleanup patterns, Ollama integration pattern)
- **Domain-general AI prompt engineering frameworks** (theme-based SOAP generation, DSM-5 criterion evidence scoring)
- **Didactic and teaching frameworks** Anders has authored or compiled prior to May 1, 2026 (dissertation materials, PSY 895/897/898 coursework, EPPP-study curricula)

## A4. Pre-existing Research & Writing

- Dissertation (Anders Chan, Long Island University Post Campus, 2024)
- Clinical Psychology Doctoral Program materials (PSY 895, 897, 898)
- EPPP 30-Day Sprint Curriculum (v2.1)
- All audio recordings, research transcripts, and session notes created prior to May 1, 2026

## A5. Independent Ventures (kept separate from Employer scope)

- `thepsychology.ai` as a commercial brand and platform (distinct from Inzinna internal tools)
- `inzinna-lab` aesthetic / lab-site product — to the extent it is marketed or licensed outside Inzinna, the underlying framework is preserved
- Any future AI-product or SaaS venture built on Anders's own time without Employer-paid resources (Section 10.3)

---

## Explicitly NOT Excluded (acknowledged as Employer Work Product under Section 10.2)

- Inzinna-specific patient lists, templates, SOPs
- Any modification to DIPS forms, ICE forms, D&TP forms, or other Inzinna-branded workflows on or after May 1, 2026
- Compensation rules, payroll logic, and internal operational improvements developed for Inzinna payroll tooling
- Internal training decks, recordings, and reference lists delivered as didactics under Section 6.2 (Employer Work Product per Section 10.2)

---

## Action Items

- [ ] Anders review and redline this draft
- [ ] Confirm each A1 / A2 item's pre-5/1 status with a git log snapshot (timestamp proof)
- [ ] Attach finalized Schedule A to the signed agreement before May 1, 2026
- [ ] Send Inzinna a copy of the git-log evidence together with the signed Schedule A
- [ ] Re-read Sections 10.2, 10.3, 10.5, 10.6, 10.7 after revisions to confirm alignment

## Notes on Enforcement

- Section 10 carries an express acknowledgement that the parties negotiated at arm's length and that each was given opportunity to seek counsel. If Anders has NOT reviewed Section 10 with an attorney, do so before signing — Section 10 is the single most consequential section for long-term IP ownership.
- Section 10.3 protects independent IP developed on own time without Employer resources — keep a clear log of which tools/features were developed in which mode going forward.

---

**This draft is NOT legal advice. Review with counsel before execution.**
