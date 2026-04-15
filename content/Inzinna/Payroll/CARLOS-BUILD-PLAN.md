# Payroll Automation Build Plan

> Last updated: 2026-04-14

## Objective

Automate payroll prep from ~1 hour to ~10 minutes (stretch: 1 minute). Carlos drops in a SimplePractice CSV, gets back JustWorks-ready pay totals per clinician.

## What We Now Know (Confirmed)

### Carlos's Current Manual Process
1. Export CSV from SimplePractice (appointment status report)
2. Hide columns F-L (Units through Unpaid)
3. Clear column E (Rate per Unit — the billing rate)
4. Manually fill column E with clinician's pay rate by looking up Billing Code in the legend
5. Add supervision column for Bret's supervisees (Izzy, Carlos, Karen)
6. Sum totals per clinician
7. Manually enter into JustWorks

### Data Sources
- **Input**: SimplePractice appointment status report CSV
- **Columns used**: Date of Service, Client, Clinician, Billing Code (A-D)
- **Column E** (Rate per Unit): cleared and replaced with pay rates from legend
- **Columns F-L**: hidden (Units, Total Fee, Client Payment Status, Charge, Uninvoiced, Paid, Unpaid)

### Compensation Legend
Complete for all 10 clinicians — see `COMPENSATION-LEGEND.md`

**Complexity tiers:**
1. **Simple flat rate**: Joelle Gill ($50), Rachel Beyer ($50)
2. **Flat rate + supervision column**: Isabelle Feinstein ($50 + supe for Bret), Juan Carlos Espinal ($80 + supe for Bret)
3. **CPT-based rates**: Anders Chan, Emily Underwood, Filomena DiFranco, Karen Terry (+ supe), Lorin Singh
4. **Payer-dependent + 80% + supervision**: Bret Boatwright (most complex)

### Bret's Pay Formula
1. Look up rate by payer (Aetna/United/Kramer/private pay?) + CPT code
2. Sum all session rates = session total
3. Session total x 0.80 = Bret's session pay
4. Add supervision: (Izzy supe total + Carlos supe total + Karen supe total) x 5%
5. Session pay + supervision = grand total

### JustWorks Constraints
- Hour-based system — sessions must convert to hours
- Proposed solution: adjust calculated weekly hourly rate so total pay is accurate (pending compliance check)
- Gregory Inzinna is owner — not on payroll

## What the Automation Does

### For everyone except Bret:
```
CSV row -> match Clinician + Billing Code -> look up pay rate from legend -> write to column E -> sum per clinician
```

### For Bret:
```
CSV row -> determine payer (HOW? — open question) -> look up payer + CPT rate -> apply 80% -> add supervision from supervisee totals
```

### For supervisees (Izzy, Carlos, Karen):
```
CSV row -> match Billing Code to supervision value table -> sum supervision column -> multiply by 5% -> add to Bret's pay
```

## Open Questions — See `QUESTIONS-FOR-CARLOS.md`

Critical blocker:
- **How to determine insurance payer from SimplePractice data** (CSV has no payer column — needed for Bret's rate lookup)

## Build Order
1. Simple flat rate clinicians (Joelle, Rachel) — prove the basic pipeline
2. CPT-based rate clinicians (Anders, Emily, Filomena, Lorin)
3. Supervised clinicians (Izzy, Carlos, Karen) — adds supervision column calc
4. Bret — needs payer resolution, 80% calc, supervision aggregation

## First Deliverable
Google Sheets-based: drop in CSV, get per-clinician pay totals with breakdown.

## Testing Plan
- Run new system in parallel with Carlos's manual process for 2-3 pay cycles
- Compare outputs, identify discrepancies
- Target: system perfected by intern arrival in July 2026

## Reference Files
- `COMPENSATION-LEGEND.md` — all clinician pay rates
- `QUESTIONS-FOR-CARLOS.md` — open items for next meeting
- `CHECKIN-2026-04-10.md` — original meeting notes
