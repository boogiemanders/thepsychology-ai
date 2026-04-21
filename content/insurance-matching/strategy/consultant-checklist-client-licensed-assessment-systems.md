# Consultant Checklist for Client-Licensed Assessment Systems

## Summary

Use a reusable software platform, not a reusable content pool.

Safe defaults:

- Each practice buys and holds its own assessment licenses directly in its own name.
- Your system may be reused across clients, but each client's assessment content, reports, and data must stay tenant-isolated.
- Do not assume that buying a PDF or form transfers any right to OCR it, upload it to an LLM, rehost it, digitize it, automate scoring, or reuse it across clients. Those uses usually require written publisher permission.

## Operating Model

- Procurement default: the practice purchases each assessment directly from the publisher under the practice's legal entity, billing, and admin account. Do not buy under your company and "pass through" access unless the publisher expressly allows that structure in writing.
- Rights classification:
  - `Green`: client-authored forms, handouts, consent docs, or materials the client truly owns by work-for-hire or written assignment.
  - `Yellow`: reports, exports, score summaries, EMR transfers, and internal search over outputs. Allow only after publisher terms and HIPAA workflow are reviewed.
  - `Red`: test items, manuals, answer keys, scoring algorithms, norms, full forms, OCR of proprietary PDFs, model training on proprietary assessment content, or building a reusable assessment engine from publisher materials.
- Tenant boundary: no cross-client sharing of publisher files, embeddings, vector indexes, prompts, fine-tunes, caches, screenshots, or backups.
- AI boundary: no proprietary assessment content goes into a general-purpose AI workflow unless the publisher has approved that exact use in writing. "Zero retention" helps privacy, not copyright/license compliance.

## Client-Facing Interfaces

### Rights Matrix

Add a rights matrix for every engagement:

- Publisher
- Assessment name
- Account owner
- Proof of purchase/license
- Allowed uses
- Prohibited uses
- AI allowed? `yes` / `no` / `unknown`
- Report/EMR export allowed? `yes` / `no` / `unknown`
- Renewal/termination date

### Vendor Approval Gate

If a use case involves digitization, OCR, re-display, scoring, report generation, API integration, or AI ingestion, require written publisher approval before implementation.

### Client Warranty

Add this to the SOW/MSA:

- The client represents it holds all necessary rights for materials it asks you to ingest or automate.
- The client is responsible for publisher fees and renewals.
- You may suspend unsupported content if rights are unclear or lapse.

### HIPAA Package

Add a HIPAA package when PHI/ePHI is involved:

- BAA with hosting/vendors
- Access controls and audit logging
- Retention/deletion policy
- Incident response and breach workflow
- Export/access continuity on termination

## Implementation Rules

- Build the product as a shell around client-owned rights, not around copied publisher content.
- Store only the minimum approved artifact:
  - Prefer metadata, citations, and result summaries over full proprietary source files.
  - If full files are necessary, store them in the client tenant only and mark them with rights metadata.
- Block unsupported actions by default:
  - No OCR/import of third-party assessment PDFs
  - No scoring logic derived from publisher material
  - No re-rendering of test forms in your UI
  - No use of one client's licensed materials to configure another client
- If the client truly owns the material:
  - Obtain the contract showing work-for-hire or IP assignment.
  - Confirm there are no third-party restrictions embedded in the material.
- If the publisher offers an official platform/API/license:
  - Integrate through that channel instead of reproducing the assessment yourself.

## Acceptance Checks

- A new client cannot access, search, or retrieve any prior client content or embeddings.
- Unsupported proprietary PDFs are rejected until rights are documented.
- The system can be configured for a client using only:
  - That client's own purchased licenses, or
  - Materials the client demonstrably owns
- EMR/report export is enabled only where publisher permission and HIPAA controls are documented.
- If a license expires or a publisher objects, the content can be disabled and removed from active workflows without affecting the rest of the platform.

## Assumptions and Defaults

- Default answer to "can we upload/use this publisher PDF in the system?" is `no` until the rights matrix or written permission says otherwise.
- Better commercial structure: charge for setup/configuration/software, and have the client buy licenses directly.
- If you ever front the purchase yourself, treat that as a legal exception requiring publisher approval, because the license/account may attach to you rather than the practice.
- This is an operational risk framework, not a substitute for healthcare or IP counsel.

## References

- [U.S. Copyright Office: copyright owner rights](https://www.copyright.gov/what-is-copyright/)
- [PAR Licensing Team](https://www.parinc.com/about/connect-with-us/licensing-team)
- [WPS Rights & Permissions](https://www.wpspublish.com/copyrights-permissions)
- [Pearson Permissions & Licensing](https://www.pearsonassessments.com/footer/permissions---licensing.html)
- [MHS Terms and Conditions of Sale and Use](https://mhs.com/terms-conditions-of-sales-and-user/)
- [HHS: cloud provider + BAA for ePHI](https://www.hhs.gov/hipaa/for-professionals/faq/2075/may-a-hipaa-covered-entity-or-business-associate-use-cloud-service-to-store-or-process-ephi/index.html)
- [HHS: CSPs are generally business associates, not mere conduits](https://www.hhs.gov/hipaa/for-professionals/faq/2077/can-a-csp-be-considered-to-be-a-conduit-like-the-postal-service-and-therefore-not-a-business%20associate-that-must-comply-with-the-hipaa-rules/index.html)
