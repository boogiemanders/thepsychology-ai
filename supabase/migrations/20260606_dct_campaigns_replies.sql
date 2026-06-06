-- DCT outreach learning loop: campaign strategy log + reply capture.
-- Campaigns carry the strategy tags (type/intent/tone/angle) so outcomes can be
-- compared across variants. Replies land via the Resend inbound webhook
-- (/api/dct-reply) and link back to contact + campaign.

create table if not exists public.dct_campaigns (
  id bigint generated always as identity primary key,
  name text not null unique,
  email_type text not null check (email_type in ('cold', 'warm', 'follow_up')),
  intent text not null check (intent in ('book_call', 'get_reply', 'nurture')),
  tone text not null check (tone in ('casual', 'warm_professional', 'formal', 'direct')),
  angle text not null check (angle in ('affordability', 'founder_credibility', 'evidence_based_prep', 'pass_rate_risk', 'student_outcomes')),
  angle_secondary text null check (angle_secondary in ('affordability', 'founder_credibility', 'evidence_based_prep', 'pass_rate_risk', 'student_outcomes')),
  subject text not null,
  body_text text not null,
  utm_campaign text null,
  notes text null,
  created_at timestamptz not null default now()
);
alter table public.dct_campaigns enable row level security;

alter table public.dct_contacts
  add column if not exists campaign_id bigint references public.dct_campaigns(id);

create table if not exists public.dct_replies (
  id bigint generated always as identity primary key,
  resend_inbound_id text unique,
  contact_email text null,
  campaign_id bigint null references public.dct_campaigns(id),
  from_email text not null,
  to_email text null,
  subject text null,
  body_text text null,
  -- positive/neutral/negative are set by later review; the webhook only
  -- auto-detects auto_reply via subject heuristics, everything else = unknown.
  reply_type text not null default 'unknown'
    check (reply_type in ('positive', 'neutral', 'negative', 'auto_reply', 'opt_out', 'unknown')),
  received_at timestamptz not null default now(),
  raw jsonb null,
  created_at timestamptz not null default now()
);
alter table public.dct_replies enable row level security;
create index if not exists dct_replies_contact_email_idx on public.dct_replies (contact_email);

-- Campaign #1 = the live cold sender's exact copy (route.ts is source of truth).
-- Tags grounded in 30-day cold-email research + OpenEvidence EPPP literature:
-- primary angle 'affordability' ($30 vs $849-1799 line carries the email),
-- secondary 'founder_credibility' (I passed it, postdocs passed it).
insert into public.dct_campaigns
  (name, email_type, intent, tone, angle, angle_secondary, subject, body_text, utm_campaign, notes)
values (
  'eppp-dct-cold-v1',
  'cold',
  'get_reply',
  'warm_professional',
  'affordability',
  'founder_credibility',
  'An Affordable EPPP Option for Your Students',
  'Hi {greeting},' || E'\n\n' ||
  'I''m Anders Chan, a clinical psychologist (UCLA postdoc, LIU Post PsyD). I built an EPPP prep tool, thepsychology.ai, which helped me pass with a month of preparation, and four postdocs have since passed with it too, most after about two months.' || E'\n\n' ||
  'Two reasons it might help your students. It''s affordable ($30/month vs. the usual $849 to $1,799), and the questions are written the way the EPPP actually words them, so practice scores mean something.' || E'\n\n' ||
  'I''d love to give you free access to look around, plus a free trial for any student who wants to try it. If it''s useful, please forward it to your graduating cohort. And if it could help program-wide, I''m glad to talk.' || E'\n\n' ||
  'You can take a look here: https://thepsychology.ai' || E'\n\n' ||
  'Thanks for everything you do for our field.' || E'\n\n' ||
  'Regards,' || E'\n' || 'Anders',
  'eppp-dct',
  'Soft ask (forward to cohort / glad to talk). Sent 1:1 via Resend, weekday cron, 30/day cap.'
)
on conflict (name) do nothing;

-- Backfill: every existing contact belongs to campaign #1.
update public.dct_contacts
set campaign_id = (select id from public.dct_campaigns where name = 'eppp-dct-cold-v1')
where campaign_id is null;
