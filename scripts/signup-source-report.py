#!/usr/bin/env python3
"""Weekly signup-source report -> Slack.

Pulls all users from Supabase (read-only), groups by referral_source,
compares the last 7 days vs the prior 7 days, and posts a digest to the
SLACK_WEBHOOK_SIGNUPS channel. Stdlib only (no node_modules on this box).

Run with --dry-run to print the message instead of posting to Slack.
"""
import json
import os
import sys
import urllib.request
from collections import Counter
from datetime import datetime, timedelta, timezone

REPO = "/Users/anderschan/thepsychology-ai"


def load_env(path):
    env = {}
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip().strip('"').strip("'")
    return env


def group(raw):
    s = (raw or "").strip().lower()
    if not s:
        return "(blank/unknown)"
    if "search" in s:
        return "search"
    if s.startswith("fb_") or s in ("facebook", "fb_other"):
        return "facebook"
    if s == "instagram":
        return "instagram"
    if s == "tiktok":
        return "tiktok"
    if s == "linkedin":
        return "linkedin"
    if s == "reddit":
        return "reddit"
    if "gemini" in s or "chatgpt" in s or s == "other: chat":
        return "ai_tools"
    if s in ("friend_colleague", "friend", "coworker", "supervisor_professor",
             "dr. holtz", "anders!", "social"):
        return "word_of_mouth"
    return "other"


def fetch_all_users(url, key):
    rows, offset = [], 0
    while True:
        req = urllib.request.Request(
            f"{url}/rest/v1/users?select=created_at,subscription_tier,"
            f"stripe_customer_id,referral_source&order=created_at.asc",
            headers={
                "apikey": key,
                "Authorization": f"Bearer {key}",
                "Range": f"{offset}-{offset + 999}",
            },
        )
        with urllib.request.urlopen(req, timeout=30) as r:
            page = json.load(r)
        rows += page
        if len(page) < 1000:
            break
        offset += 1000
    return rows


def post_slack(webhook, text):
    data = json.dumps({"text": text}).encode()
    req = urllib.request.Request(
        webhook, data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.status


def build_message(rows, now):
    wk1_start = now - timedelta(days=7)
    wk2_start = now - timedelta(days=14)

    def parse(ts):
        return datetime.fromisoformat(ts.replace("Z", "+00:00"))

    this_wk = [r for r in rows if parse(r["created_at"]) >= wk1_start]
    prev_wk = [r for r in rows
               if wk2_start <= parse(r["created_at"]) < wk1_start]

    this_c = Counter(group(r["referral_source"]) for r in this_wk)
    prev_c = Counter(group(r["referral_source"]) for r in prev_wk)
    paid_this = sum(1 for r in this_wk if r["stripe_customer_id"])

    sources = sorted(set(this_c) | set(prev_c),
                     key=lambda g: (-this_c.get(g, 0), g))

    lines = [
        f"*Weekly signup sources* ({wk1_start:%b %-d} - {now:%b %-d})",
        f"New signups: *{len(this_wk)}* (prev week: {len(prev_wk)})  |  "
        f"new paid: *{paid_this}*",
        "",
    ]
    if not sources:
        lines.append("_No signups this week._")
    for g in sources:
        t, p = this_c.get(g, 0), prev_c.get(g, 0)
        d = t - p
        arrow = "" if d == 0 else (f"  (+{d} vs prev)" if d > 0
                                   else f"  ({d} vs prev)")
        lines.append(f"- {g}: *{t}*{arrow}")

    li_t, li_p = this_c.get("linkedin", 0), prev_c.get("linkedin", 0)
    lines += ["", f"_LinkedIn watch: {li_t} this week, {li_p} prior week._"]
    return "\n".join(lines), len(this_wk), paid_this


def main():
    dry = "--dry-run" in sys.argv
    env = load_env(os.path.join(REPO, ".env.local"))
    rows = fetch_all_users(env["NEXT_PUBLIC_SUPABASE_URL"],
                           env["SUPABASE_SERVICE_ROLE_KEY"])
    msg, n, paid = build_message(rows, datetime.now(timezone.utc))
    if dry:
        print(msg)
        return
    post_slack(env["SLACK_WEBHOOK_SIGNUPS"], msg)
    print(f"posted: {n} signups this week, {paid} paid")


if __name__ == "__main__":
    main()
