"""Scrape DCT (Director of Clinical Training) name + email for each APA-accredited
clinical psychology doctoral program.

Two-stage approach to avoid mismatches:
  1. Find the institution's actual .edu domain (search "<name> psychology", pick
     a result whose hostname contains a token from the institution name).
  2. Do a site:-restricted search on that domain for "director of clinical training".
  3. Fetch the top 1-3 results, extract a name near the DCT phrase and an email
     whose host matches the institution domain.

Resume-safe: writes incrementally to dct_results.csv and skips already-done rows.
"""

import csv
import random
import re
import sys
import time
from pathlib import Path
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup
from ddgs import DDGS

BASE = Path(__file__).parent
INPUT_CSV = BASE / "clinical_programs.csv"
OUTPUT_CSV = BASE / "dct_results.csv"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
    )
}

EMAIL_RE = re.compile(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}")
OBF_RE = re.compile(
    r"([A-Za-z0-9._%+\-]+)\s*[\[\(]?\s*at\s*[\]\)]?\s*([A-Za-z0-9.\-]+)\s*[\[\(]?\s*dot\s*[\]\)]?\s*([A-Za-z]{2,})",
    re.IGNORECASE,
)
DCT_PHRASES = [
    "director of clinical training",
    "clinical training director",
    "director, clinical training",
]
# Title case 2-3 token name, optionally with middle initial.
NAME_RE = re.compile(
    r"\b([A-Z][a-z]+(?:-[A-Z][a-z]+)?)\s+(?:([A-Z]\.?)\s+)?([A-Z][a-z]+(?:-[A-Z][a-z]+)?)\b"
)
BAD_NAME_PARTS = {
    "Director",
    "Clinical",
    "Training",
    "Doctoral",
    "Program",
    "Psychology",
    "Department",
    "University",
    "College",
    "School",
    "Faculty",
    "Graduate",
    "PhD",
    "PsyD",
    "Doctor",
    "Professor",
    "Associate",
    "Assistant",
}

STOP_WORDS = {
    "of",
    "the",
    "at",
    "for",
    "in",
    "and",
    "on",
    "university",
    "college",
    "school",
    "institute",
    "center",
    "centre",
    "graduate",
}

ABBREV = {
    "Carnegie Mellon": "cmu",
    "Massachusetts Institute of Technology": "mit",
    "Pennsylvania State": "psu",
    "University of California": "uc",
    "University of Alabama at Birmingham": "uab",
    "Virginia Commonwealth": "vcu",
    "Texas A&M": "tamu",
    "Drexel University": "drexel",
    "Yeshiva University": "yu",
    "Suffolk University": "suffolk",
    "Hofstra University": "hofstra",
}


def tokens_for(institution):
    """Tokens that should appear in the official .edu hostname of `institution`."""
    name = institution.lower()
    # Strip "university of", commas, "the", etc.
    name = re.sub(r"[,\-\(\)]", " ", name)
    raw = [t for t in name.split() if t and t not in STOP_WORDS]
    extras = []
    for k, v in ABBREV.items():
        if k.lower() in institution.lower():
            extras.append(v)
    return raw + extras


def host_matches_institution(host, institution):
    if not host:
        return False
    host_l = host.lower()
    toks = tokens_for(institution)
    return any(t in host_l for t in toks if len(t) >= 3)


def deobfuscate(text):
    return [f"{m.group(1)}@{m.group(2)}.{m.group(3)}" for m in OBF_RE.finditer(text)]


def ddg_search(query, max_results=8):
    try:
        with DDGS() as ddgs:
            return list(ddgs.text(query, max_results=max_results, region="us-en"))
    except Exception as e:
        print(f"  ddg error ({query!r}): {e}", file=sys.stderr)
        return []


def fetch(url, timeout=15):
    try:
        r = requests.get(url, headers=HEADERS, timeout=timeout, allow_redirects=True)
        if r.status_code == 200 and "text/html" in r.headers.get("content-type", "").lower():
            return r.text
    except Exception as e:
        print(f"  fetch error {url}: {e}", file=sys.stderr)
    return None


def find_institution_host(institution):
    """Return the most likely .edu hostname for this institution."""
    queries = [
        f'"{institution}" psychology department',
        f"{institution} psychology",
    ]
    candidates = []
    for q in queries:
        for r in ddg_search(q, max_results=8):
            host = urlparse(r.get("href", "")).hostname or ""
            if host.endswith(".edu") and host_matches_institution(host, institution):
                # Use base domain (e.g., uab.edu, not www.uab.edu)
                parts = host.split(".")
                base = ".".join(parts[-2:])
                candidates.append(base)
        time.sleep(random.uniform(1.5, 3.0))
        if candidates:
            break
    if not candidates:
        return None
    # Pick most common base domain.
    from collections import Counter
    return Counter(candidates).most_common(1)[0][0]


def extract_dct_from_html(html, host):
    """Find a name + email near a DCT phrase. Email must be from `host` (or any .edu)."""
    soup = BeautifulSoup(html, "lxml")
    for t in soup(["script", "style", "noscript"]):
        t.decompose()
    text = soup.get_text("\n", strip=True)
    text_lower = text.lower()

    matches = []
    for phrase in DCT_PHRASES:
        i = 0
        while True:
            j = text_lower.find(phrase, i)
            if j < 0:
                break
            matches.append((j, phrase))
            i = j + 1
    if not matches:
        return None

    best = None
    for pos, phrase in matches:
        window = text[max(0, pos - 400) : pos + 400]
        # Emails.
        emails = list(set(EMAIL_RE.findall(window))) + deobfuscate(window)
        # Prefer .edu emails matching host.
        def email_rank(e):
            el = e.lower()
            if host and host in el:
                return 0
            if el.endswith(".edu"):
                return 1
            return 2
        emails.sort(key=email_rank)

        # Names: look for capitalized 2-3 token names.
        names = []
        for m in NAME_RE.finditer(window):
            parts = [m.group(1), m.group(3)]
            if any(p in BAD_NAME_PARTS for p in parts):
                continue
            names.append(m.group(0))

        cand = {
            "name": names[0] if names else "",
            "email": emails[0] if emails else "",
            "context": window.replace("\n", " ")[:400],
            "phrase": phrase,
        }
        # Prefer the match with both name and email.
        if not best:
            best = cand
        elif (cand["email"] and cand["name"]) and not (best["email"] and best["name"]):
            best = cand
    return best


def process_institution(institution):
    print(f"[{institution}]")
    host = find_institution_host(institution)
    print(f"  host: {host}")
    if not host:
        return {"institution": institution, "status": "no_host_found"}

    # Site-restricted DDG search.
    queries = [
        f'site:{host} "director of clinical training"',
        f"site:{host} clinical psychology DCT",
        f"site:{host} clinical psychology training",
    ]
    tried_urls = set()
    best_result = None
    for q in queries:
        results = ddg_search(q, max_results=6)
        time.sleep(random.uniform(1.5, 3.0))
        for r in results:
            url = r.get("href", "")
            if not url or url in tried_urls:
                continue
            u_host = urlparse(url).hostname or ""
            if host not in u_host:
                continue
            tried_urls.add(url)
            print(f"  fetching: {url}")
            html = fetch(url)
            time.sleep(random.uniform(0.8, 1.5))
            if not html:
                continue
            info = extract_dct_from_html(html, host)
            if info and info.get("name"):
                # Prefer one with an email.
                if info.get("email"):
                    return {
                        "institution": institution,
                        "host": host,
                        "dct_name": info["name"],
                        "dct_email": info["email"],
                        "source_url": url,
                        "context": info["context"],
                        "phrase_matched": info["phrase"],
                        "status": "ok",
                    }
                if not best_result:
                    best_result = {
                        "institution": institution,
                        "host": host,
                        "dct_name": info["name"],
                        "dct_email": "",
                        "source_url": url,
                        "context": info["context"],
                        "phrase_matched": info["phrase"],
                        "status": "name_only",
                    }
        if best_result and best_result.get("dct_email"):
            return best_result
    if best_result:
        return best_result
    return {"institution": institution, "host": host, "status": "no_dct_found"}


def main():
    with open(INPUT_CSV) as f:
        rows = list(csv.DictReader(f))
    institutions = []
    seen = set()
    for r in rows:
        inst = r["institution"].strip()
        if not inst or inst in seen:
            continue
        seen.add(inst)
        institutions.append(inst)
    print(f"Processing {len(institutions)} unique institutions")

    done = set()
    if OUTPUT_CSV.exists():
        with open(OUTPUT_CSV) as f:
            for row in csv.DictReader(f):
                done.add(row["institution"])
        print(f"Resuming: {len(done)} already done")

    fieldnames = [
        "institution",
        "host",
        "dct_name",
        "dct_email",
        "source_url",
        "phrase_matched",
        "context",
        "status",
    ]
    write_header = not OUTPUT_CSV.exists()

    # Optional CLI arg: limit
    limit = int(sys.argv[1]) if len(sys.argv) > 1 else None

    with open(OUTPUT_CSV, "a", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        if write_header:
            writer.writeheader()
        count = 0
        for i, inst in enumerate(institutions, 1):
            if inst in done:
                continue
            if limit and count >= limit:
                break
            try:
                result = process_institution(inst)
            except Exception as e:
                print(f"  EXC: {e}", file=sys.stderr)
                result = {"institution": inst, "status": f"error: {e}"}
            for k in fieldnames:
                result.setdefault(k, "")
            writer.writerow(result)
            f.flush()
            print(
                f"  [{i}/{len(institutions)}] -> {result.get('status')} | "
                f"{result.get('dct_name','')} | {result.get('dct_email','')}"
            )
            count += 1
            time.sleep(random.uniform(1.0, 2.5))


if __name__ == "__main__":
    main()
