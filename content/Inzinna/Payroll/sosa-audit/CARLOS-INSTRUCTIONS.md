# JW Autofill v1.1.0 — SOSA Fee Check (for Carlos)

The plugin now also checks SOSA's monthly bill. SOSA's 8% fee only applies to
insurance-related money (claims, copays, deductibles). It does NOT apply to
self-pay clients. SOSA has been charging 8% on everything, so they've been
overbilling us (April was $783.68 too much). The plugin now catches this
automatically every payroll run.

## 1. Update the plugin (one time, ~2 minutes)

1. You'll get a file: `inzinna-jw-autofill-v1.1.0.zip`. Unzip it.
2. Open Chrome and go to `chrome://extensions`
3. Find **Inzinna JW Autofill** and click **Remove**.
4. Turn on **Developer mode** (toggle, top right) if it's off.
5. Click **Load unpacked** and pick the unzipped folder.
6. Chrome may ask about new permissions (SimplePractice access). Accept.
7. You should see version **1.1.0** on the card. Done.

## 2. First-time setup: pull the self-pay list (one click)

1. Make sure you're logged into SimplePractice in Chrome.
2. Open the plugin popup.
3. Click **Refresh self-pay roster** (small button under the roster area).
4. A SimplePractice tab opens and scrolls by itself for ~20 seconds. Don't touch it.
5. The popup will say something like "Self-pay roster updated: 68 clients."

That's it. The list is saved. You only click this again when a client switches
between insurance and self-pay (or once a month to be safe).

## 3. Every payroll run: read the SOSA box

Upload the SimplePractice CSV like you always do. In the results you'll now see
a new box:

- **Self-pay collected (not fee-eligible)** — cash-client money SOSA must NOT
  take 8% of.
- **SOSA 8% overcharge on self-pay** — if SOSA bills 8% on everything like
  they've been doing, this is how much they overcharged us this period.
- **Verify (full-fee, not in self-pay roster)** — if names show here, those
  clients paid full price but aren't marked self-pay. Check their billing type
  in SimplePractice, then click "Refresh self-pay roster" again.

## 4. What SOSA should actually be paid each month

When SOSA's invoice arrives:

```
Correct service fee = SOSA's "Service Fee" on the invoice
                      MINUS the plugin's "SOSA 8% overcharge on self-pay"
```

Example (April 2026): they billed $4,996.34, plugin overcharge $783.68,
so the right number was **$4,212.66**.

Quick sanity checks:
- SOSA's Service Fee should equal 8% of "Total Income Collected" on their own
  report. If it does, they're still charging on everything (including self-pay).
- Credit card fees on their invoice are separate. Leave those alone.
- If the plugin's number and the invoice month don't line up exactly, it's
  because the plugin counts by session date and SOSA counts by payment date.
  Small differences are normal; big ones are not.

Flag the overcharge to Dr. Inzinna before paying. He handles the SOSA email.
