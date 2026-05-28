# DCT outreach scraper

Pulls the APA-accredited Clinical Ph.D./Psy.D. program list (251 schools) and
tries to find each Director of Clinical Training's name + email.

## Setup (one time)

```bash
pip install requests beautifulsoup4 lxml ddgs
brew install poppler   # only needed if re-running parse_apa_pdf.py
```

## Run

```bash
cd scripts/dct-outreach
python3 scrape_dcts.py            # all 251 institutions
python3 scrape_dcts.py 10         # just first 10 (test run)
```

- Writes to `dct_results.csv` incrementally — safe to ctrl-C and rerun (it
  resumes where it left off).
- Rate-limited (~3-6s between DDG calls) so the full run is ~2-3 hours.
- Expected hit rate: 60-80%. Misses go to a manual cleanup pass.

## Status columns in dct_results.csv

- `ok` — name + email both found
- `name_only` — name found, no email (look it up manually on `source_url`)
- `no_dct_found` — found the institution's .edu domain but no DCT page hit
- `no_host_found` — couldn't identify the school's .edu domain
- `error: ...` — exception during processing

## Known accuracy caveats

DDG sometimes returns nearby schools' pages instead of the target. The
`host_matches_institution` check filters most of this, but eyeball the
results — especially for institutions with short/common names.

## Files

- `apa-doctoral-2025.pdf` — source PDF from APA accreditation site
- `apa-doctoral-2025.txt` — text-extracted PDF (debug)
- `parse_apa_pdf.py` — PDF → `clinical_programs.csv`
- `clinical_programs.csv` — 251 unique institutions
- `scrape_dcts.py` — DDG search + page scrape → `dct_results.csv`
