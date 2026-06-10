#!/usr/bin/env python3
"""Record a posted A/B test video in video_map.json.

Run this right after posting a test video (currently by hand on TikTok):

  python3 scripts/marketing/record_post.py v001 \
      --avatar-model "Avatar III" \
      --tiktok-url "https://www.tiktok.com/@thepsychology.ai/video/731..." \
      --zernio-post-id 6a275f452b2567671a38768e   # if you have it

The entry is what lets import_analytics.py match export rows to Test Log rows
deterministically. zernio_post_id is optional (hand-posted videos do not have
one); without it, matching falls back to same-day date matching using the
posted_at timestamp recorded here.

Re-running for the same video id merges in the new flags. posted_at is set
automatically on first record and is NOT changed on later updates, because
date-fallback matching depends on it.

The future Zernio auto-posting step should write these same entries after a
successful post (video id -> zernio_post_id, tiktok_url, avatar_model,
posted_at).
"""

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

DEFAULT_MAP = Path(
    "/Users/anderschan/Library/CloudStorage/GoogleDrive-dranders@drinzinna.com/"
    "My Drive/thepsychology.ai marketing/avatar-ab-test/video_map.json"
)


def main():
    ap = argparse.ArgumentParser(description="Record a posted test video in video_map.json.")
    ap.add_argument("video_id", help="Test Log video id, e.g. v001")
    ap.add_argument("--avatar-model", help='e.g. "Avatar III"')
    ap.add_argument("--tiktok-url", help="live TikTok URL of the post")
    ap.add_argument("--zernio-post-id", help="Zernio hex post id, if posted via Zernio")
    ap.add_argument("--map", dest="map_path", default=str(DEFAULT_MAP))
    args = ap.parse_args()

    vid = args.video_id.strip()
    if not re.fullmatch(r"v\d{3,}", vid):
        print(f"ERROR: video id {vid!r} does not look like v001 / v002 / ...", file=sys.stderr)
        sys.exit(1)
    if args.zernio_post_id and not re.fullmatch(r"[0-9a-f]{24}", args.zernio_post_id.strip()):
        print(f"WARNING: {args.zernio_post_id!r} does not look like a Zernio hex post id; recording it anyway")

    map_path = Path(args.map_path)
    video_map = {}
    if map_path.exists():
        with open(map_path) as f:
            video_map = json.load(f)

    entry = video_map.get(vid, {})
    is_new = vid not in video_map
    if is_new:
        entry["posted_at"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
    for key, value in [("avatar_model", args.avatar_model),
                       ("tiktok_url", args.tiktok_url),
                       ("zernio_post_id", args.zernio_post_id)]:
        if value:
            entry[key] = value.strip()
    video_map[vid] = entry

    map_path.parent.mkdir(parents=True, exist_ok=True)
    tmp = map_path.with_suffix(".json.tmp")
    with open(tmp, "w") as f:
        json.dump(video_map, f, indent=2, sort_keys=True)
        f.write("\n")
    tmp.replace(map_path)

    action = "Recorded" if is_new else "Updated"
    print(f"{action} {vid} in {map_path}:")
    print(json.dumps(entry, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
