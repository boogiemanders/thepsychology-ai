-- On-video title for the Remotion overlay's TikTok-style title block (line 1,
-- e.g. "Breaking Test Rules?"). Authored per TikTok draft; line 2 (the EPPP
-- domain label) is parsed from the script, so it needs no column.
-- generate-videos.ts passes video_title to the render as titleLine1; null or
-- empty just hides the line.
--
-- NOT applied yet — run alongside the video pipeline rollout (PR #68 gate).

alter table marketing_drafts
  add column if not exists video_title text;
