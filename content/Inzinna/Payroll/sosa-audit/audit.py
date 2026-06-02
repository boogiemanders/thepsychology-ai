#!/usr/bin/env python3
"""
SOSA billing-fee audit.

SOSA (Sosa Practice Partners) charges 8% per the Service Agreement, Section 3(a):
the fee applies to billables tied to an insurance claim they filed (insurance
payments + copays/coinsurance/deductibles). It does NOT apply to self-pay clients
(no claim filed). SOSA has been applying 8% to gross collections, which sweeps in
self-pay money. This tool quantifies the overcharge.

Inputs (download from SimplePractice each cycle):
  --appts   appointment-status-report CSV  (per-client payments)
  --income  income report .docx            (optional; for headline totals + cross-check)
  --roster  self-pay-roster.json           (default: alongside this script)

Usage:
  python3 audit.py --appts ~/Downloads/appointment-status-report.csv \\
                   --income ~/Downloads/"Dr Inzinna_income_report - Apr26.docx"

No external dependencies (stdlib only).
"""
import argparse, csv, json, os, re, sys, zipfile
from collections import defaultdict

FEE_RATE = 0.08

def norm(s: str) -> str:
    s = s.lower().strip().replace("&", "and")
    s = re.sub(r"[^a-z0-9 ]", "", s)
    return re.sub(r"\s+", " ", s)

def money(x: str) -> float:
    try:
        return float(str(x).replace("$", "").replace(",", "").replace("(", "-").replace(")", ""))
    except ValueError:
        return 0.0

def load_roster(path):
    data = json.load(open(path))
    names = data.get("self_pay", [])
    return {norm(n) for n in names}, len(names), data.get("captured", "?")

def parse_appts(path):
    """Return per-client dicts: paid, total_fee, charge, full_fee_only(bool)."""
    agg = defaultdict(lambda: {"paid": 0.0, "fee": 0.0, "charge": 0.0, "copay_rows": 0, "rows": 0})
    with open(path, newline="") as fh:
        for r in csv.DictReader(fh):
            c = (r.get("Client") or "").strip()
            if not c:
                continue
            fee, charge, paid = money(r.get("Total Fee")), money(r.get("Charge")), money(r.get("Paid"))
            d = agg[c]
            d["rows"] += 1
            d["paid"] += paid
            d["fee"] += fee
            d["charge"] += charge
            if fee > 0 and charge < fee - 0.01:
                d["copay_rows"] += 1
    return agg

def parse_income_docx(path):
    """Pull the Totals row: (client_payments, insurance_payments, gross). Best-effort."""
    try:
        xml = zipfile.ZipFile(path).read("word/document.xml").decode("utf-8", "ignore")
    except Exception:
        return None
    text = re.sub(r"<[^>]+>", "\n", xml)
    text = re.sub(r"&amp;", "&", text)
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    for i, l in enumerate(lines):
        if l.lower() == "totals":
            amts = []
            for nxt in lines[i + 1:i + 12]:
                if re.match(r"^\$?\(?[\d,]+\.\d{2}\)?$", nxt):
                    amts.append(money(nxt))
                if len(amts) >= 3:
                    break
            if len(amts) >= 3:
                return {"client": amts[0], "insurance": amts[1], "gross": amts[2]}
    return None

def main():
    ap = argparse.ArgumentParser()
    here = os.path.dirname(os.path.abspath(__file__))
    ap.add_argument("--appts", required=True)
    ap.add_argument("--income", default=None)
    ap.add_argument("--roster", default=os.path.join(here, "self-pay-roster.json"))
    ap.add_argument("--out", default=None, help="write markdown report to this path")
    args = ap.parse_args()

    roster, roster_n, captured = load_roster(args.roster)
    agg = parse_appts(args.appts)

    disputable, legit_fullfee, drift_new, drift_stale = [], [], [], []
    for c, d in agg.items():
        if d["paid"] <= 0:
            continue
        in_roster = norm(c) in roster
        full_fee_only = d["copay_rows"] == 0
        if in_roster:
            disputable.append((c, d["paid"]))
            if not full_fee_only:
                drift_stale.append(c)          # roster says self-pay but copays seen -> maybe switched to insurance
        else:
            if full_fee_only:
                drift_new.append((c, d["paid"]))  # paid full fee every session, not in roster -> maybe new self-pay
            else:
                legit_fullfee.append((c, d["paid"]))

    disputable.sort(key=lambda x: -x[1])
    drift_new.sort(key=lambda x: -x[1])
    total_disp = sum(a for _, a in disputable)
    overcharge = round(total_disp * FEE_RATE, 2)

    income = parse_income_docx(args.income) if args.income else None

    L = []
    L.append("# SOSA 8% Billing-Fee Audit")
    L.append(f"_Roster: {roster_n} self-pay clients (captured {captured}). Fee rate {FEE_RATE:.0%}._\n")
    if income:
        sosa_fee = round(income["gross"] * FEE_RATE, 2)
        L.append("## SOSA invoice (from income report)")
        L.append(f"- Client payments: ${income['client']:,.2f}")
        L.append(f"- Insurance payments: ${income['insurance']:,.2f}")
        L.append(f"- Gross collected: ${income['gross']:,.2f}")
        L.append(f"- 8% SOSA billed on gross: **${sosa_fee:,.2f}**\n")
    L.append("## Overcharge (self-pay wrongly included)")
    L.append(f"- Self-pay clients who paid this period: **{len(disputable)}**")
    L.append(f"- Self-pay $ collected (NOT fee-eligible): **${total_disp:,.2f}**")
    L.append(f"- 8% SOSA wrongly charged on it: **${overcharge:,.2f}**  <-- clawback\n")
    L.append("### Self-pay payers included by SOSA (date-of-service basis)")
    for c, a in disputable:
        L.append(f"- {c}: ${a:,.2f}")
    if drift_new:
        L.append("\n## ROSTER DRIFT - verify these (no screenshots needed)")
        L.append("_Paid full fee every session but NOT in the self-pay roster. If they're self-pay, add them to self-pay-roster.json:_")
        for c, a in drift_new:
            L.append(f"- {c}: ${a:,.2f}  (+${round(a*FEE_RATE,2):,.2f} more clawback if self-pay)")
    if drift_stale:
        L.append("\n## ROSTER STALE? - verify these")
        L.append("_In roster as self-pay, but copay-style rows appeared (insurance may now be billed). If switched, remove from roster:_")
        for c in drift_stale:
            L.append(f"- {c}")

    report = "\n".join(L)
    print(report)
    if args.out:
        open(args.out, "w").write(report + "\n")
        print(f"\n[written to {args.out}]", file=sys.stderr)

if __name__ == "__main__":
    main()
