-- TikTok auto-posting via Zernio (Phase 5). After a final cut renders, the
-- pipeline saves the caption and posts a Slack review card; the founder's
-- "Post to TikTok" click queues it, and scripts/marketing/post-tiktok.ts
-- drains the queue on the next launchd run.
--
-- tiktok_post_status lifecycle:
--   null    -> no final cut yet (or pre-rollout row)
--   review  -> Slack card posted, waiting on the founder
--   queued  -> founder clicked Post, drains on next run
--   skipped -> founder clicked Skip
--   posted  -> live on TikTok (tiktok_post_id + tiktok_posted_at set)
--   failed  -> publish error in tiktok_post_error; reset to 'queued' to retry
--
-- tiktok_caption is the exact text that posts (explanation teaser + 5
-- hashtags), written by the daily writer; the card shows it verbatim.
--
-- NOT applied yet — run at merge, same flow as 20260612_add_video_title.

alter table marketing_drafts
  add column if not exists tiktok_caption text,
  add column if not exists tiktok_post_status text,
  add column if not exists tiktok_post_id text,
  add column if not exists tiktok_post_error text,
  add column if not exists tiktok_posted_at timestamptz;
