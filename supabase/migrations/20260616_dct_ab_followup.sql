-- DCT A/B test + follow-up sends.
-- The cold list (campaign #1) is fully sent. To actually LEARN what lifts clicks
-- and replies we need (a) multiple live variants and (b) an audience. This adds:
--   * variant flags + structured body on dct_campaigns (active rotation, per-variant
--     UTM so GA attributes clicks per variant, body_paras the sender renders from)
--   * follow-up tracking on dct_contacts (a 2nd touch to non-responders, without
--     disturbing the cold sender's sent_at idempotency)
--   * mode on the audit table so cold vs follow-up runs are distinguishable
--   * three seeded variants (A money/ROI, B student-outcomes, C short peer-favor),
--     all active, each with a distinct tone + angle so the test is meaningful.

-- 1. Variant fields on campaigns.
alter table public.dct_campaigns
  add column if not exists active boolean not null default false,
  add column if not exists variant text,
  -- Persuasive paragraphs between the salutation and the shared "take a look" line.
  -- The sender renders subject + these paras + a shared scaffold (link/signoff/unsub).
  add column if not exists body_paras jsonb;

-- 2. Follow-up tracking on contacts. Separate from sent_at so the cold sender's
--    "never re-select a sent row" stays true; the follow-up sender keys off these.
alter table public.dct_contacts
  add column if not exists followup_sent_at timestamptz,
  add column if not exists followup_campaign_id bigint references public.dct_campaigns(id),
  add column if not exists followup_resend_id text;

-- 3. Distinguish cold vs follow-up in the run audit.
alter table public.dct_send_runs
  add column if not exists mode text not null default 'cold';

-- 4. Seed the three test variants. Tone + angle deliberately differ so we learn
--    which lever moves engagement. utm_campaign is per-variant for GA click split.
--    Copy facts are verbatim-true: UCLA postdoc / LIU Post PsyD, passed in a month,
--    four postdocs passed, $30/mo vs $849-$1,799, ~$692 per exam attempt.
insert into public.dct_campaigns
  (name, email_type, intent, tone, angle, angle_secondary, subject, body_text, body_paras, utm_campaign, active, variant, notes)
values
(
  'eppp-dct-v2-a-money',
  'follow_up', 'get_reply', 'direct', 'affordability', 'founder_credibility',
  'EPPP prep that costs your students $30, not $1,800',
  'See body_paras (rendered by the sender).',
  jsonb_build_array(
    'I''m Anders Chan, a clinical psychologist (UCLA postdoc, LIU Post PsyD). I built thepsychology.ai to prep for the EPPP, passed in a month, and four postdocs have passed with it since.',
    'It''s $30/month instead of the usual $849 to $1,799, and the questions are worded like the real exam, so practice scores mean something. The exam runs about $692 per attempt, so one avoided retake pays for years of it.',
    'Can I give you free access to look around, plus free trials for any students who want them?'
  ),
  'eppp-dct-a', true, 'A',
  'A/B v2 variant A: money/ROI, direct tone. Follow-up to non-responders + new cold.'
),
(
  'eppp-dct-v2-b-outcomes',
  'follow_up', 'get_reply', 'warm_professional', 'student_outcomes', 'pass_rate_risk',
  'Helping your students pass the EPPP the first time',
  'See body_paras (rendered by the sender).',
  jsonb_build_array(
    'I''m Anders Chan, a clinical psychologist (UCLA postdoc, LIU Post PsyD). After I built thepsychology.ai and passed the EPPP in a month, four postdocs used it and passed too.',
    'Every retake costs a student about $692 and months of stress. It drills questions worded like the real exam, for $30/month, so your grads walk in ready instead of guessing.',
    'I''d love to give you free access and free trials for your graduating cohort. Want me to set that up?'
  ),
  'eppp-dct-b', true, 'B',
  'A/B v2 variant B: student outcomes / pass-rate risk, warm tone. Follow-up + new cold.'
),
(
  'eppp-dct-v2-c-favor',
  'follow_up', 'get_reply', 'casual', 'founder_credibility', 'affordability',
  'A free EPPP tool for your grads, from a fellow psychologist',
  'See body_paras (rendered by the sender).',
  jsonb_build_array(
    'I''m Anders Chan, a clinical psychologist (UCLA postdoc, LIU Post PsyD). I built an affordable EPPP prep tool, thepsychology.ai ($30/month), that helped me and four postdocs pass.',
    'Could I give your students free access to try it? If it''s useful, you can pass it along to your cohort.'
  ),
  'eppp-dct-c', true, 'C',
  'A/B v2 variant C: short peer-favor, casual tone. Follow-up + new cold.'
)
on conflict (name) do nothing;
