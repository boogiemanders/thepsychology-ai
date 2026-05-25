"""Parse APA accredited doctoral programs PDF.

Approach: column boundaries shift across pages, so we don't slice by fixed
position. Instead we find each "(Clinical Ph.D.)" / "(Clinical Psy.D.)" marker,
note the char offset where it starts, then look at neighboring lines in the
SAME column band (offset +/- 8 chars) to assemble each program record.
"""

import csv
import re
import subprocess
from pathlib import Path

PDF = Path(__file__).parent / "apa-doctoral-2025.pdf"
OUT = Path(__file__).parent / "clinical_programs.csv"

CLINICAL_RE = re.compile(r"\((Clinical (?:Ph\.D\.|Psy\.D\.))\)")
CITY_STATE_ZIP_RE = re.compile(r",\s*[A-Z]{2}\s+\d{5}")
DATE_RE = re.compile(r"^[A-Z][a-z]+ \d{1,2}, \d{4}$")
STATUS_RE = re.compile(r"^Accredited")
NEXT_VISIT_RE = re.compile(r"^Next site visit")
STATE_HEADER_RE = re.compile(r"^[A-Z][A-Z &\-]{2,}$")


def slice_col(line, start, width=55):
    """Extract the substring of `line` that lies in the column band starting near `start`.
    Width 55 covers a typical column. Returns stripped text."""
    # Look in [start-3, start+width] but trim to line length.
    s = max(0, start - 3)
    e = min(len(line), start + width)
    return line[s:e].rstrip()


def find_text_at_col(line, target_col, tol=10):
    """Return the stripped chunk of text that begins within `tol` chars of target_col.

    Find the start of a non-space run whose start_col is within tol of target_col,
    then return that run up to two consecutive spaces (column gutter).
    """
    if target_col >= len(line):
        return ""
    # Find runs of non-double-space.
    i = 0
    while i < len(line):
        # Skip leading whitespace.
        while i < len(line) and line[i] == " ":
            i += 1
        if i >= len(line):
            break
        run_start = i
        # Run continues until 2+ consecutive spaces.
        j = i
        while j < len(line):
            if line[j] == " " and j + 1 < len(line) and line[j + 1] == " ":
                break
            j += 1
        run_end = j
        text = line[run_start:run_end].rstrip()
        if abs(run_start - target_col) <= tol and text:
            return text
        i = j + 1
    return ""


def main():
    txt = subprocess.check_output(
        ["pdftotext", "-layout", "-nopgbrk", str(PDF), "-"], text=True
    )
    lines = txt.splitlines()

    # Track current state header (state names are emitted between programs).
    # We assign each program the most recent state header that appears in any column above it.
    records = []

    for idx, line in enumerate(lines):
        for m in CLINICAL_RE.finditer(line):
            col = m.start()
            degree = m.group(1)

            # Institution is the previous non-empty text at this column.
            institution = ""
            inst_extra = []  # for multi-line institution names
            k = idx - 1
            while k >= 0:
                txt_at = find_text_at_col(lines[k], col)
                if txt_at:
                    # Stop if we hit a state header, status, next-visit, date, city/state/zip
                    if STATE_HEADER_RE.match(txt_at):
                        break
                    if NEXT_VISIT_RE.match(txt_at) or STATUS_RE.match(txt_at):
                        break
                    if DATE_RE.match(txt_at) or CITY_STATE_ZIP_RE.search(txt_at):
                        break
                    if CLINICAL_RE.search(txt_at):
                        break
                    if txt_at.startswith("("):  # other degree marker like (Counseling Ph.D.)
                        break
                    # Otherwise this is institution name (possibly wrapped).
                    inst_extra.insert(0, txt_at)
                    # Heuristic: stop if previous line had a NEXT site visit (end of prior record).
                k -= 1
                # Limit to 4 lines back for institution name.
                if idx - k > 4:
                    break
            institution = " ".join(inst_extra).strip()

            # Collect lines below for address/city/date/status/next-visit.
            addr_lines = []
            city_state_zip = ""
            initial_date = ""
            status = ""
            next_visit = ""
            k = idx + 1
            while k < len(lines):
                txt_at = find_text_at_col(lines[k], col)
                if not txt_at:
                    # Blank in this column — could be a continuation or end. Check a couple more.
                    k += 1
                    if k - idx > 12:
                        break
                    continue
                # End conditions.
                if NEXT_VISIT_RE.match(txt_at):
                    next_visit = txt_at
                    break
                if CLINICAL_RE.search(txt_at) or txt_at.startswith("("):
                    # Hit the next program before finding "next visit" — abandon collection here.
                    break
                if STATE_HEADER_RE.match(txt_at):
                    break
                if DATE_RE.match(txt_at):
                    initial_date = txt_at
                elif STATUS_RE.match(txt_at):
                    status = txt_at
                elif CITY_STATE_ZIP_RE.search(txt_at) and not city_state_zip:
                    city_state_zip = txt_at
                else:
                    addr_lines.append(txt_at)
                k += 1
                if k - idx > 15:
                    break

            records.append({
                "institution": institution,
                "degree": degree,
                "address": " | ".join(addr_lines),
                "city_state_zip": city_state_zip,
                "initial_accreditation": initial_date,
                "status": status,
                "next_visit": next_visit,
            })

    # Clean: strip recurring page-header text that bleeds into institution names.
    HEADER_NOISE = [
        re.compile(r"AMERICAN PSYCHOLOGICAL ASSOCIATION\s*\d*\s*", re.IGNORECASE),
        re.compile(
            r"ACCREDITED DOCTORAL PROGRAMS FOR TRAINING IN HEALTH SERVICE PSYCHOLOGY:?\s*\d*\s*",
            re.IGNORECASE,
        ),
    ]
    for p in records:
        for noise in HEADER_NOISE:
            p["institution"] = noise.sub("", p["institution"]).strip()

    # Drop records with no institution AND no address (parser failures).
    records = [p for p in records if p["institution"] or p["city_state_zip"]]

    # Dedupe.
    seen = set()
    unique = []
    for p in records:
        key = (p["institution"], p["degree"], p["city_state_zip"])
        if key in seen:
            continue
        seen.add(key)
        unique.append(p)

    with open(OUT, "w", newline="") as f:
        w = csv.DictWriter(
            f,
            fieldnames=[
                "institution",
                "degree",
                "address",
                "city_state_zip",
                "initial_accreditation",
                "status",
                "next_visit",
            ],
        )
        w.writeheader()
        w.writerows(unique)

    print(f"Total clinical records found: {len(records)}")
    print(f"Unique: {len(unique)}")
    # Show how many have empty institution (parser failures).
    blanks = sum(1 for p in unique if not p["institution"])
    print(f"Records with no institution name: {blanks}")
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
