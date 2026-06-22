# SOSA 8% Billing-Fee Audit

Checks whether SOSA (Sosa Practice Partners) applied their 8% fee correctly.
Per Service Agreement **Section 3(a)**, the 8% covers only billables tied to an
insurance claim they filed (insurance payments + copays/coinsurance/deductibles).
**Self-pay clients are out of the base.** SOSA has been charging 8% on gross
collections, which wrongly sweeps in self-pay money.

April 2026 result: **$783.68 overcharge** ($9,796 self-pay collected x 8%).

## Monthly workflow (no screenshots)

1. **Refresh the self-pay roster** (only when clients change billing type):
   - Open `https://secure.simplepractice.com/clients?billingType=Self-pay`
   - Click the **"Scrape self-pay"** bookmarklet (setup in `scrape-selfpay.bookmarklet.txt`)
   - It downloads `self-pay-roster.json` — drop it in this folder.
2. **Download from SimplePractice → Analytics:**
   - Appointment Status report (CSV) for the period
   - Income report (.docx) — optional, gives headline totals
3. **Run the audit:**
   ```
   python3 audit.py --appts ~/Downloads/appointment-status-report.csv \
                    --income ~/Downloads/"Dr Inzinna_income_report - AprXX.docx"
   ```
   It prints the overcharge, the self-pay payers SOSA included, and a
   **ROSTER DRIFT** section flagging any full-fee client missing from the roster
   (so the roster self-heals without re-scraping everyone).

## Files

| File | What |
|---|---|
| `audit.py` | the calculator (stdlib only, no installs) |
| `self-pay-roster.json` | self-pay client list (scraper overwrites this) |
| `scrape-selfpay.js` | readable scraper source (fix selectors here if SP changes) |
| `scrape-selfpay.bookmarklet.txt` | the one-line bookmarklet + setup steps |
| `SOSA-EMAIL-DRAFT-2026-04.md` | ready-to-send correction email |

## Caveat

Self-pay dollars are computed on a **date-of-service** basis (appointment report).
SOSA bills cash-basis, so a strict reconciliation can move the number a few dollars.
The method and ballpark are sound.
