#!/usr/bin/env python3
"""Task 3 gate: inspect Zernio's analytics API BEFORE building a daily pull.

Per the brief, the daily API pull only gets built if the API exposes more than
the CSV export does (especially watch time or profile visits). This script is
the gate: it makes ONE raw call, prints the full response, and prints a
key/type outline of the schema so the fields can be compared against the
export columns. It does not write anything anywhere.

  ZERNIO_API_KEY=... python3 scripts/marketing/zernio_schema_check.py
  ZERNIO_API_KEY=... python3 scripts/marketing/zernio_schema_check.py --path /analytics/posts

Notes:
- This repo talks to Zernio over raw HTTP (see src/lib/marketing/
  publish-linkedin.ts), not the zernio-sdk the brief mentions. Same here:
  stdlib urllib, Bearer auth, base URL https://zernio.com/api/v1
  (override with ZERNIO_API_URL).
- The exact analytics path is unverified; --path lets you probe. A 404 is
  useful output too.
- Decision rule after running this: if the response adds nothing over
  posts_analytics_*.csv (no watch time, no profile visits), keep the zip
  export workflow and skip Task 3.
"""

import argparse
import json
import os
import sys
import urllib.error
import urllib.request

DEFAULT_BASE = "https://zernio.com/api/v1"


def outline(value, indent=0):
    """Print a recursive key -> type outline of a JSON response."""
    pad = "  " * indent
    if isinstance(value, dict):
        for k, v in value.items():
            if isinstance(v, (dict, list)):
                print(f"{pad}{k}:")
                outline(v, indent + 1)
            else:
                print(f"{pad}{k}: {type(v).__name__}")
    elif isinstance(value, list):
        print(f"{pad}[list of {len(value)}]")
        if value:
            outline(value[0], indent + 1)  # first element as the shape sample
    else:
        print(f"{pad}{type(value).__name__}")


def main():
    ap = argparse.ArgumentParser(description="Print Zernio analytics API response schema (Task 3 gate).")
    ap.add_argument("--path", default="/analytics", help="API path to probe (default: /analytics)")
    args = ap.parse_args()

    api_key = os.environ.get("ZERNIO_API_KEY")
    if not api_key:
        print("ERROR: ZERNIO_API_KEY is not set", file=sys.stderr)
        sys.exit(1)
    base = os.environ.get("ZERNIO_API_URL", DEFAULT_BASE).rstrip("/")
    url = base + args.path

    print(f"GET {url}")
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {api_key}"})
    try:
        with urllib.request.urlopen(req, timeout=30) as res:
            status, body = res.status, res.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        status, body = e.code, e.read().decode("utf-8", "replace")
    except urllib.error.URLError as e:
        print(f"ERROR: request failed: {e.reason}", file=sys.stderr)
        sys.exit(1)

    print(f"Status: {status}\n")
    try:
        data = json.loads(body)
    except json.JSONDecodeError:
        print("Non-JSON response body:")
        print(body[:5000])
        sys.exit(1)

    print("Full response:")
    print(json.dumps(data, indent=2)[:20000])
    print("\nSchema outline:")
    outline(data)
    print("\nCheck against the CSV export columns (Post ID, Content, Published Date,")
    print("Platform, Post URL, Likes, Comments, Shares, Views, Impressions, Reach,")
    print("Clicks). Build the daily pull ONLY if watch time or profile visits show")
    print("up here; otherwise keep the zip export workflow.")


if __name__ == "__main__":
    main()
