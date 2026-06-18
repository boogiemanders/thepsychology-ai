-- Per-video TikTok attribution: signups (by utm_content video key) -> paid conversion.
--
-- The deterministic capture path (DB is source of truth, GA4 is secondary):
--   ManyChat DMs  /go/practice-questions?s=tiktok&c=<videokey>
--     -> /go route emits utm_source=tiktok, utm_campaign=practice-questions, utm_content=<videokey>
--     -> client first-touch capture -> signUp metadata -> users.utm_content = '<videokey>'
--   Actual paid conversion -> Stripe webhook logs a funnel_events row:
--     event_name='checkout_completed', created_at = the paid date.
--
-- Why funnel_events and not users.subscription_tier: tier='pro' + subscription_started_at are BOTH
-- set at signup for the 7-day trial, so they cannot tell you who actually paid or when. The
-- checkout_completed event only fires on a real subscription purchase. (custom_audio_purchased is a
-- one-time audio add-on, intentionally excluded.) funnel_events.user_id == public.users.id.
--
-- Run READ-ONLY. To see every channel (not just TikTok), delete the utm_source filter lines.

-- ============================================================================
-- 1) Summary: one row per video key
-- ============================================================================
with signups as (
  select id, created_at, utm_source, utm_campaign, utm_content
  from public.users
  where utm_content is not null
    and utm_source = 'tiktok'              -- per-video TikTok view; remove for all sources
),
paid as (                                  -- first real paid checkout per user
  select user_id, min(created_at) as paid_at
  from public.funnel_events
  where event_name = 'checkout_completed'
  group by user_id
)
select
  s.utm_content                                                            as video_key,
  count(*)                                                                 as signups,
  count(p.user_id)                                                         as paid,
  count(p.user_id) filter (
    where p.paid_at >= s.created_at + interval '7 days')                   as paid_7plus_days,
  round(100.0 * count(p.user_id) / nullif(count(*), 0), 1)                 as paid_pct,
  round(
    (avg(extract(epoch from (p.paid_at - s.created_at)) / 86400.0)
       filter (where p.user_id is not null))::numeric, 1)                  as avg_days_to_pay
from signups s
left join paid p on p.user_id = s.id
group by s.utm_content
order by signups desc, paid desc;

-- ============================================================================
-- 2) Per-user detail (who converted, how long it took). Includes email (PII).
-- ============================================================================
with paid as (
  select user_id, min(created_at) as paid_at
  from public.funnel_events
  where event_name = 'checkout_completed'
  group by user_id
)
select
  u.utm_content                                                            as video_key,
  u.email,
  u.created_at                                                             as signed_up_at,
  p.paid_at,
  round(extract(epoch from (p.paid_at - u.created_at)) / 86400.0, 1)       as days_to_pay,
  (p.paid_at >= u.created_at + interval '7 days')                          as converted_7plus_days
from public.users u
left join paid p on p.user_id = u.id
where u.utm_content is not null
  and u.utm_source = 'tiktok'              -- per-video TikTok view; remove for all sources
order by u.created_at desc;
