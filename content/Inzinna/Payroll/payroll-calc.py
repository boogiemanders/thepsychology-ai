"""
Payroll Calculator — Inzinna Practice
Reads SimplePractice appointment status CSV, applies compensation legend,
outputs per-clinician pay totals.

Usage: python3 payroll-calc.py <path-to-csv>

Known gaps:
- Bret Boatwright: uses 80% of billing rate as fallback (needs payer-specific rates)
- Manual additions not in CSV: Filomena admin hours, Fusion Trip/Event entries
- No-show rates unconfirmed for: Filomena, Isabelle, Karen
"""

import csv
import sys

# ============================================================
# COMPENSATION LEGEND
# ============================================================

legend = {
    "Anders Chan": {
        "type": "cpt_based",
        "rates": {"90791": 75, "90837": 75},
        "default": 50,
        "no_show": {"00001": 40, "00002": 40},
    },
    "Bret Boatwright": {
        "type": "payer_dependent",
        "note": "Needs payer info. Falling back to 80% of billing rate.",
        "no_show": {"00001": 75, "00002": 75},
    },
    "Juan Carlos Espinal": {
        "type": "cpt_based",
        "rates": {},
        "default": 80,
        "overrides": {"EFC50": 45, "00005": 0},
        "no_show": {"00001": 40, "00002": 40},
        "supervision": {
            "90791": 160, "90837": 140, "90834": 120,
            "90847": 120, "90832": 70, "EFC50": 0,
        },
    },
    "Emily Underwood": {
        "type": "cpt_based",
        "rates": {"90791": 80, "90837": 80, "90834": 70, "90846": 65, "90847": 65, "90832": 40},
        "no_show": {"00001": 40, "00002": 40},
    },
    "Filomena DiFranco": {
        "type": "cpt_based",
        "rates": {"90791": 70, "90837": 65, "90834": 60, "90847": 60, "90832": 40, "Admin": 65},
        "no_show": {},
    },
    "Isabelle Feinstein": {
        "type": "flat",
        "rate": 50,
        "supervision": {
            "90791": 160, "90837": 140, "90834": 120, "90846": 120,
            "90847": 120, "90832": 70,
            "96132": 93.53, "96138": 93.53, "96139": 93.53,
        },
    },
    "Joelle Gill": {
        "type": "flat",
        "rate": 50,
        "no_show": {"00001": 25, "00002": 25},
    },
    "Karen Terry": {
        "type": "cpt_based",
        "rates": {"90791": 80, "90837": 75, "90834": 65, "90847": 65, "90832": 40},
        "no_show": {},
        "supervision": {
            "90791": 160, "90837": 140, "90834": 120,
            "90847": 120, "90832": 70,
        },
    },
    "Lorin Singh": {
        "type": "cpt_based",
        "rates": {"90791": 90, "90837": 90},
        "default": 65,
        "overrides": {"00005": 0},
        "no_show": {"00001": 40, "00002": 40},
    },
    "Rachel Beyer": {
        "type": "flat",
        "rate": 50,
    },
}


def get_pay_rate(clinician, code, billing_rate=None):
    """Return (pay_rate, supervision_value) for a row."""
    cfg = legend.get(clinician)
    if not cfg:
        return None, None

    codes = [c.strip() for c in code.split('\n') if c.strip()]

    total_pay = 0
    total_supe = 0

    for c in codes:
        pay = 0
        supe = 0

        if cfg["type"] == "payer_dependent":
            if c in cfg.get("no_show", {}):
                pay = cfg["no_show"][c]
            elif billing_rate:
                try:
                    rates = [float(r.strip()) for r in str(billing_rate).split('\n') if r.strip()]
                    idx = codes.index(c)
                    if idx < len(rates):
                        pay = rates[idx] * 0.80
                    else:
                        pay = rates[0] * 0.80
                except (ValueError, IndexError):
                    pay = 0

        elif cfg["type"] == "flat":
            if c in cfg.get("no_show", {}):
                pay = cfg["no_show"][c]
            else:
                pay = cfg["rate"]

        elif cfg["type"] == "cpt_based":
            if c in cfg.get("no_show", {}):
                pay = cfg["no_show"][c]
            elif c in cfg.get("overrides", {}):
                pay = cfg["overrides"][c]
            elif c in cfg.get("rates", {}):
                pay = cfg["rates"][c]
            elif "default" in cfg:
                pay = cfg["default"]
            else:
                pay = None

        if "supervision" in cfg and c in cfg["supervision"]:
            supe = cfg["supervision"][c]

        if pay is not None:
            total_pay += pay
        total_supe += supe

    return total_pay, total_supe


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 payroll-calc.py <path-to-csv>")
        sys.exit(1)

    csv_path = sys.argv[1]

    with open(csv_path) as f:
        reader = csv.DictReader(f)

        clinician_totals = {}
        clinician_supe_totals = {}
        clinician_rows = {}

        for row in reader:
            clin = row['Clinician']
            code = row['Billing Code']
            billing_rate = row['Rate per Unit']

            if clin == 'Gregory Inzinna':
                continue

            pay, supe = get_pay_rate(clin, code, billing_rate)

            if clin not in clinician_totals:
                clinician_totals[clin] = 0
                clinician_supe_totals[clin] = 0
                clinician_rows[clin] = []

            if pay is not None:
                clinician_totals[clin] += pay
            clinician_supe_totals[clin] += supe
            clinician_rows[clin].append((row['Date of Service'], row['Client'], code, pay, supe))

    # Print results
    print("=" * 70)
    print("PAYROLL CALCULATION")
    print("=" * 70)

    bret_supe_total = 0
    for clin in sorted(clinician_totals.keys()):
        total = clinician_totals[clin]
        supe = clinician_supe_totals[clin]
        print(f"\n{clin}")
        print(f"  Session pay: ${total:,.2f}")
        if supe > 0:
            supe_for_bret = supe * 0.05
            bret_supe_total += supe_for_bret
            print(f"  Supervision total: ${supe:,.2f} (Bret gets ${supe_for_bret:,.2f})")
        print(f"  Sessions: {len(clinician_rows[clin])}")

    # Bret's full calc
    bret_session_pay = clinician_totals.get("Bret Boatwright", 0)
    print(f"\n{'=' * 70}")
    print(f"BRET BOATWRIGHT — FULL CALC")
    print(f"  Session pay (ESTIMATED — needs payer rates): ${bret_session_pay:,.2f}")
    print(f"  Supervision from Izzy: ${clinician_supe_totals.get('Isabelle Feinstein', 0) * 0.05:,.2f}")
    print(f"  Supervision from Carlos: ${clinician_supe_totals.get('Juan Carlos Espinal', 0) * 0.05:,.2f}")
    print(f"  Supervision from Karen: ${clinician_supe_totals.get('Karen Terry', 0) * 0.05:,.2f}")
    print(f"  Total supervision: ${bret_supe_total:,.2f}")
    print(f"  ESTIMATED GRAND TOTAL: ${bret_session_pay + bret_supe_total:,.2f}")


if __name__ == "__main__":
    main()
