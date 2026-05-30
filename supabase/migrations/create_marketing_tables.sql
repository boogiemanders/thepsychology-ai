-- Marketing Content Engine: draft approval queue + blog performance feedback loop
-- Source of truth for the Slack approval flow. Service-role only (no public access).

create table if not exists marketing_drafts (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('blog', 'linkedin', 'tiktok')),
  topic text not null,                  -- psychology | eppp | ai | psychology-ai | pop-culture
  title text not null,
  slug text,                            -- blog only; null for social
  body_md text not null,                -- the post / script / article body
  frontmatter jsonb not null default '{}'::jsonb,  -- blog: title/description/author/tags
  sources jsonb not null default '[]'::jsonb,       -- [{title,url}] every claim traces here
  seo jsonb not null default '{}'::jsonb,           -- {keyword, internal_links:[...]}
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'published')),
  needs_review boolean not null default false,       -- fact-check flagged an unverified claim
  review_notes text,                                 -- what the fact-checker flagged
  slack_channel text,
  slack_ts text,                                     -- Slack message timestamp (for updates)
  published_url text,
  created_at timestamptz not null default now(),
  decided_at timestamptz                             -- when approved/rejected
);

create index if not exists marketing_drafts_status_idx on marketing_drafts (status);
create index if not exists marketing_drafts_created_idx on marketing_drafts (created_at desc);

alter table marketing_drafts enable row level security;
-- No policies = no anon/auth access. Service role bypasses RLS.

create table if not exists blog_performance (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  period_start date not null,
  period_end date not null,
  sessions integer not null default 0,
  engaged_sessions integer not null default 0,
  conversions integer not null default 0,            -- sign_up events attributed to this path
  pulled_at timestamptz not null default now(),
  unique (slug, period_start, period_end)
);

create index if not exists blog_performance_slug_idx on blog_performance (slug);

alter table blog_performance enable row level security;
