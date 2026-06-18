#!/usr/bin/env python3
"""Per-video TikTok attribution digest: signups by utm_content (video key) -> paid conversion.

Mirrors scripts/signup-source-report.py: Python stdlib only (no node_modules on this box), reads
.env.local, queries Supabase REST read-only, posts to Slack. --dry-run prints instead of posting.

Capture path (DB is source of truth, GA4 secondary):
  ManyChat link /go/practice-questions?s=tiktok&c=<videokey>
    -> users.utm_source='tiktok', utm_content='<videokey>'
  Real paid checkout -> funnel_events row event_name='checkout_completed' (created_at = paid date).
  (Trial users are NOT "paid": tier/subscription_started_at are set at signup for the 7-day trial.)

Env (from .env.local): NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY,
and a Slack webhook (SLACK_WEBHOOK_TIKTOK_ATTRIBUTION, else falls back to SLACK_WEBHOOK_SIGNUPS).

Flags:
  --dry-run        print the digest, do not post to Slack
  --all-sources    include every utm_source, not just tiktok
  --env PATH       path to .env.local (default: repo-root .env.local relative to this file)

To schedule weekly (founder follow-up), mirror the signup report's launchd plist; a ready copy is
in scripts/launchd/ai.thepsychology.tiktok-attribution-report.plist.
"""

import argparse
import json
import os
import sys
import urllib.request
import urllib.parse
from collections import defaultdict
from datetime import datetime, timedelta, timezone

PAGE = 1000


def load_env(path):
    env = {}
    if not os.path.exists(path):
        return env
    with open(path, "r", encoding="utf-8") as fh:
        for raw in fh:
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, val = line.split("=", 1)
            key = key.strip()
            val = val.strip()
            if len(val) >= 2 and val[0] in "\"'" and val[-1] == val[0]:
                val = val[1:-1]
            env[key] = val
    return env


def parse_ts(s):
    """Parse a PostgREST ISO timestamp into an aware UTC datetime."""
    if not s:
        return None
    s = s.strip()
    if s.endswith("Z"):
        s = s[:-1] + "+00:00"
    # Trim fractional seconds to 6 digits (Python tolerates <=6).
    if "." in s:
        head, _, tail = s.partition(".")
        frac = ""
        rest = ""
        for i, ch in enumerate(tail):
            if ch.isdigit():
                frac += ch
            else:
                rest = tail[i:]
                break
        s = head + "." + frac[:6] + rest
    try:
        dt = datetime.fromisoformat(s)
    except ValueError:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def rest_get(base_url, key, table, query):
    """Paginated read-only GET against PostgREST. Returns a list of row dicts."""
    rows = []
    offset = 0
    while True:
        params = dict(query)
        params["limit"] = str(PAGE)
        params["offset"] = str(offset)
        url = f"{base_url}/rest/v1/{table}?" + urllib.parse.urlencode(params, safe=".*,()")
        req = urllib.request.Request(url, headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Accept": "application/json",
        })
        with urllib.request.urlopen(req, timeout=30) as resp:
            page = json.loads(resp.read().decode("utf-8"))
        rows.extend(page)
        if len(page) < PAGE:
            break
        offset += PAGE
    return rows


def post_slack(webhook, text):
    body = json.dumps({"text": text}).encode("utf-8")
    req = urllib.request.Request(webhook, data=body,
                                headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=20) as resp:
        return resp.status


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    default_env = os.path.normpath(os.path.join(here, "..", ".env.local"))

    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--all-sources", action="store_true")
    ap.add_argument("--env", default=default_env)
    args = ap.parse_args()

    env = load_env(args.env)
    base_url = (env.get("NEXT_PUBLIC_SUPABASE_URL") or env.get("SUPABASE_URL") or "").rstrip("/")
    key = env.get("SUPABASE_SERVICE_ROLE_KEY", "")
    webhook = env.get("SLACK_WEBHOOK_TIKTOK_ATTRIBUTION") or env.get("SLACK_WEBHOOK_SIGNUPS", "")

    if not base_url or not key:
        sys.exit("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in env file.")

    # Signups: rows with a video key set. utm_content is the per-video tag.
    signup_query = {
        "select": "id,created_at,utm_source,utm_campaign,utm_content",
        "utm_content": "not.is.null",
        "order": "created_at.asc",
    }
    if not args.all_sources:
        signup_query["utm_source"] = "eq.tiktok"
    signups = rest_get(base_url, key, "users", signup_query)

    # First real paid checkout per user (the Stripe webhook logs checkout_completed).
    paid_rows = rest_get(base_url, key, "funnel_events", {
        "select": "user_id,created_at",
        "event_name": "eq.checkout_completed",
    })
    paid_at = {}
    for r in paid_rows:
        uid = r.get("user_id")
        ts = parse_ts(r.get("created_at"))
        if not uid or ts is None:
            continue
        if uid not in paid_at or ts < paid_at[uid]:
            paid_at[uid] = ts

    # Aggregate per video key.
    agg = defaultdict(lambda: {"signups": 0, "paid": 0, "paid7": 0, "days": []})
    total = {"signups": 0, "paid": 0, "paid7": 0}
    for u in signups:
        vk = u.get("utm_content") or "(none)"
        a = agg[vk]
        a["signups"] += 1
        total["signups"] += 1
        signed = parse_ts(u.get("created_at"))
        pts = paid_at.get(u.get("id"))
        if pts and signed:
            a["paid"] += 1
            total["paid"] += 1
            days = (pts - signed).total_seconds() / 86400.0
            a["days"].append(days)
            if pts >= signed + timedelta(days=7):
                a["paid7"] += 1
                total["paid7"] += 1

    scope = "all sources" if args.all_sources else "TikTok"
    lines = [f"*Per-video {scope} attribution* (signup → paid)"]
    if not agg:
        lines.append("No tagged signups yet (links not live, or no signups carrying a video key).")
    else:
        for vk, a in sorted(agg.items(), key=lambda kv: (-kv[1]["signups"], -kv[1]["paid"])):
            pct = round(100.0 * a["paid"] / a["signups"], 1) if a["signups"] else 0.0
            avg = round(sum(a["days"]) / len(a["days"]), 1) if a["days"] else None
            avg_txt = f", avg {avg}d to pay" if avg is not None else ""
            lines.append(
                f"• `{vk}` — {a['signups']} signups, {a['paid']} paid ({pct}%), "
                f"{a['paid7']} paid 7+ days{avg_txt}"
            )
        tot_pct = round(100.0 * total["paid"] / total["signups"], 1) if total["signups"] else 0.0
        lines.append(
            f"*Total:* {total['signups']} signups, {total['paid']} paid ({tot_pct}%), "
            f"{total['paid7']} paid 7+ days after signup"
        )
    text = "\n".join(lines)

    if args.dry_run or not webhook:
        if not webhook and not args.dry_run:
            print("(no Slack webhook configured; printing instead)\n", file=sys.stderr)
        print(text)
        return
    status = post_slack(webhook, text)
    print(f"Posted to Slack (HTTP {status}).")


if __name__ == "__main__":
    main()
