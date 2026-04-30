# Questions for Carlos

> For next meeting — 2026-04-15

## Compensation Clarifications
- [ ] Does Filomena have a no-show rate? (other clinicians have $40 for 00001/00002)
- [ ] Does Isabelle have a no-show rate? (she's $50 flat for all CPT — is no-show also $50 or different?)
- [ ] What is "Fusion Trip" / "Fusion Event"? Shows up on Izzy's and Rachel's sheets ($50, no CPT code, no supervision value)
- [ ] Izzy's supervision value for 96132 — is it payer-dependent? Sheet1 shows (U)96132 = $143.62 vs (A)96132 = $93.53
- [ ] Does Karen have a no-show rate? No 00001/00002 entries in her sheet
- [ ] Sebby Boyer's 90837 rate for Bret is $161.71 — doesn't match Aetna ($160.89) or United ($161.78). Third payer?

## Data / Export Questions
- [ ] SimplePractice CSV export has no insurance payer column — Bret's pay depends on payer. How do you currently know which payer each session belongs to? Is there a different SP report that includes payer?
- [ ] Are some of Bret's clients private pay at $250 (so 80% = $200 flat)? Sinjun Strom and T Mendez show $200 on his payroll sheet — matches $250 x 0.80 exactly
- [ ] Rows with "Client Payment Status = NO CHARGE" — should these still pay the clinician? Example: 3/30 Harry Steves 90791 shows NO CHARGE but plugin currently pays Bret $200. Skip these rows, or pay anyway?
- [ ] "Rate per Unit" vs "Charge" mismatch: e.g. 3/23 Kev Lynch 96132 shows Rate=$250 but Charge=$20. Plugin pays Bret 80% of $250 = $200, but clinic only billed $20. For payer-dependent clinicians (Bret), should pay be 80% of Rate per Unit, 80% of Charge, or 80% of Paid amount?

## Manual Additions (not in CSV)
- [ ] Filomena gets 1 admin hour/week ($65) — where does this come from? Is it always 1/week or variable?
- [ ] "Fusion Trip" (Izzy) and "Fusion Event" (Rachel) — $50 each, added manually. What triggers these and how should automation know to include them?

## Open Items from Checkin (2026-04-10)
- [ ] Compliance check: is it permissible to change clinician hourly pay rates weekly in JustWorks?
- [x] Bret's supervision pay: confirmed 5% of supervisee session totals — validated across multiple pay periods via Excel sheets

## Chrome Extension Distribution to Clinicians
> For shipping SimplePractice Notes + ZocDoc-to-SimplePractice extensions to Inzinna clinicians without side-loading

**What we need:**

- [x] Chrome Web Store developer account — already purchased ($5 one-time)
- [ ] Publish extensions as **Unlisted** or **Private** (domain-only), submit for Chrome Web Store review
  - Private = only visible to users in Inzinna Google Workspace domain
  - First review takes ~1–3 days; faster after. Don't plan last-minute pushes before a pilot
- [ ] **Google Workspace account for Inzinna** (if not already set up)
  - Needed to restrict extension visibility to the domain
  - Needed for force-install via Chrome admin policy
- [ ] **Google Workspace admin access** (admin.google.com)
  - Devices → Chrome → Apps & Extensions → force-install by extension ID to clinician OU
  - Pins extension to toolbar, locks permissions so clinicians can't disable
- [ ] **Sign Google Workspace BAA** (HIPAA)
  - Free — request in admin console under Account → Legal & Compliance
  - Covers the browser environment the extensions run in
  - Does NOT cover the extensions' own logic (that's on us — PHI stays local, de-id before any cloud call)

**Ship flow once all above are in place:**
1. Zip `dist/`, upload to Chrome Web Store, set visibility = Private (Inzinna domain)
2. Submit for review, wait 1–3 days
3. In Workspace admin, force-install by extension ID to clinician OU
4. Clinicians open Chrome — extension appears automatically, no dev mode needed
