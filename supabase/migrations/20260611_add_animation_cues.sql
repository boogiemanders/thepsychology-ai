-- Animation cues for the Remotion overlay pass (video-overlay/). The daily writer
-- emits 1-3 cues on practice-question/explainer TikTok drafts; each is
-- { trigger, type: 'diagram' | 'illustration' | 'pullquote', payload }.
-- generate-videos.ts forwards them to the Remotion render as props; the overlay
-- fires each cue when the spoken transcript contains the trigger phrase.
--
-- NOT applied yet — run alongside the video pipeline rollout (PR #68 gate).

alter table marketing_drafts
  add column if not exists animation_cues jsonb not null default '[]'::jsonb;
