-- Video generation pipeline: track which approved TikTok scripts have a generated
-- talking-head video. scripts/marketing/generate-videos.ts picks up rows where
-- type='tiktok', status='approved', video_status is null.
--
-- video_status: null = not processed | 'generated' = mp4 saved to Drive |
-- 'failed' = generation errored (see video_error); reset to null to retry.

alter table marketing_drafts
  add column if not exists video_status text
    check (video_status in ('generated', 'failed')),
  add column if not exists video_path text,
  add column if not exists video_error text,
  add column if not exists video_generated_at timestamptz;

create index if not exists marketing_drafts_video_pending_idx
  on marketing_drafts (created_at)
  where type = 'tiktok' and status = 'approved' and video_status is null;
