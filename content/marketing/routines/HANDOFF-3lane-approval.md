# Handoff: split social approval into 3 lanes + daily research routines

Spec from founder (2026-06-14), fully reconned, ready to build in a fresh session.
This doc is the build plan. PR with the blog/DCT CTA fixes is separate ("fix 2").

## The ask (all 3 lanes are daily, auto, posted to Slack for approval)

### Lane 1 — LinkedIn approval
- Write in the format of the current LinkedIn WINNERS.
- Use relevant topics from the past 24h.
- Be aware of the best LinkedIn performer.
- Winner data: vault `LinkedIn Scorecard - thepsychology.ai (2026-06-12).md`. Best
  performer = the AI-therapy-skepticism post (1,247 impressions, 3 comments). All 8
  EPPP posts got 0 comments. Audience = senior licensed clinicians, NOT EPPP
  candidates. COORDINATE with PR #93 (retunes the engine clinician-first; per memory
  pending merge 6/14) so we don't fight it.

### Lane 2 — TikTok-EPPP approval (5/day to approve)
- 5 EPPP practice questions per day, as talking-head scripts, for approval.
- Balanced across the 12 domains: track what's already been posted, pick the
  under-covered domains each day.
- PLUS: EPPP news in the past 24h.
- PLUS: an EPPP test-taking strategy.
- PLUS: search whether ASPPB has posted updates/news (WebSearch asppb.org).
- PLUS: use oe_ask to find new studying research we have NOT shared before
  (dedup against a running shared-research log).
- Format: founder's TikTok winners — clean talking head, lead with UCLA-credential
  or provocative reframe, comment-trigger DM funnel CTA ("Comment PASS and I'll
  send you free EPPP practice questions"). Saves are the north star.

### Lane 3 — TikTok-Pop approval
- Search the founder's winner formats first.
- Research past-24h pop culture interesting to 25-34 yo (audience 41% M / 58% F).
- Past-24h AI developments (interesting to founder).
- Past-24h music / Ableton / news (interesting to founder).
- ALWAYS tie back to a relevant topic-content v4 lesson and give an explanation.
- Comment-trigger funnel CTA.

## Recon (architecture is decided — don't re-recon)

### Draft model + Slack flow (smallest-footprint split)
- `type: "blog"|"linkedin"|"tiktok"` (`src/lib/marketing/types.ts:4`); sub-topic
  already exists: `topic: "psychology"|"eppp"|"ai"|"psychology-ai"|"pop-culture"`
  (`types.ts:6-11`). EPPP vs Pop is ALREADY distinguishable via `topic`. Do NOT add
  new draft types or a category column.
- Approval card posted by `postDraftForApproval()` (`src/lib/marketing/slack.ts:83`)
  → channel `"social"` = `SLACK_WEBHOOK_SOCIAL` (`src/lib/notify-slack.ts:10`).
  Buttons `approve_draft`/`reject_draft`/`feedback_draft` (`slack.ts:51-76`).
- Handler `src/lib/marketing/handle-interaction.ts`: approve branches on
  `draft.type` (blog→queued line 125, linkedin→queued line 136, tiktok→approved
  line 147). **NO handler change needed** — it routes off draft id + type, channel-
  agnostic.
- SPLIT = route the card to a per-lane channel only:
  1. `notify-slack.ts` WEBHOOKS map: add `tiktok_eppp`, `tiktok_pop`, `linkedin`
     keys, each `process.env.SLACK_WEBHOOK_* || SLACK_WEBHOOK_SOCIAL` (mirror the
     `video` fallback at line 13). Graceful: degrades to one channel until founder
     makes real channels.
  2. `slack.ts` `postDraftForApproval`: pick channel by (type, topic):
     linkedin→`linkedin`; tiktok+pop-culture→`tiktok_pop`; tiktok+else→`tiktok_eppp`.

### Data sources
- topic-content v4: `EPPP/content/topic-content-v4/` (12 domain folders, 82 lessons;
  free variant `EPPP/content/free-contentGPT/`). Loader `src/lib/topic-content-manager.ts`
  (`loadTopicContent`, `stripMetaphorMarkers` to strip `{{M}}` markup). Frontmatter
  has `topic_name`, `domain`, `slug`.
- The 12 domains: source of truth `src/lib/topic-paths.ts:4-54` (`DOMAIN_FOLDER_MAP`).
  1 Biological Bases, 2 Cognitive-Affective, 3-social Social, 3-cultural Cultural,
  4 Growth & Lifespan, 5-assessment Assessment, 5-diagnosis Diagnosis/Psychopathology,
  5-test Test Construction, 6 Treatment & Intervention, 7 Research/Stats,
  8 Ethical/Legal/Professional, 3-5-6 I-O/Organizational.
  NOTE discrepancy: public marketing copy says "8 domains" (`src/lib/config.tsx:409,511`).
  Build balance on the 12 folders; founder-facing language elsewhere says 8.
- Question bank: `EPPP/content/questionsGPT/` (12 folders, 2,286 Qs JSON; free variant
  `free-questionsGPT/`). Loader `src/lib/topic-question-loader.ts` (`TopicQuestion`).
  Fields: stem, options[4], answer, explanation, kn, difficulty, suggestedLesson
  (back-links to a v4 lesson), realExam flag. Folder name = domain.
- Domain post-tracking: DOES NOT EXIST. Options: (a) add `domain text` column to
  marketing_drafts (cleanest — query "domains posted last N days"), or (b)
  reconstruct via `src/lib/marketing/video-script.ts` `parseDomain()` over recent
  eppp rows' body_md. Recommend (a). WARNING: the video_title + tiktok_* column
  migrations may not be applied yet (gated on PR #68) — verify before adding.
- oe_ask: see memory `reference_openevidence_oe_ask` — headful Chrome via
  `~/.openevidence-mcp` profile; answer in `output.structured_article.raw_text`.
  Needs a shared-research log to dedup (propose `content/marketing/shared-research.md`).

### Routine + schedule pattern (copy daily-marketing.md + feedback-rewrite plumbing)
- Routine = a markdown prompt run by a scheduled Claude agent. Template:
  `content/marketing/routines/daily-marketing.md` (Step 0 brand context, Step 1
  `last30days --days=2` research, Step 2 whats-working + scorecards, Step 3 write
  scripts via `ig-reel-script-writer` skill, Step 4 skeptic fact-check, Step 5
  submit). Submit: `npx tsx scripts/marketing/submit-draft.ts <draft.json>`. Draft
  shape = `DraftInput` in types.ts (required: type, topic, title, body_md, sources[];
  optional: video_title, tiktok_caption, animation_cues, needs_review).
- Schedule via LOCAL launchd (proven; cloud /schedule has 401/Slack-drop history):
  - `~/Library/LaunchAgents/ai.thepsychology.<name>.plist` (StartCalendarInterval)
  - `~/.thepsychology-automation/run-<name>.sh`: `cd ~/thepsychology-ai-marketing`,
    `git fetch && git reset --hard origin/main`, `timeout 600 claude
    --dangerously-skip-permissions -p "Execute the routine in
    content/marketing/routines/<name>.md now ..." >> LOG 2>&1`
  - `launchctl load` once. Template to clone: feedback-rewrite plist + run script.
  - IMPORTANT: routines must be merged to origin/main BEFORE launchd picks them up
    (the run script hard-resets to origin/main).
- Web research available in routine: agent has WebSearch; `last30days` skill at
  `~/.claude/skills/last30days` (--days=2 ≈ 24-48h, pulls Reddit/X/YT/TikTok/HN/web).

## Build checklist (PR2)
1. `notify-slack.ts`: add tiktok_eppp / tiktok_pop / linkedin webhook keys w/ fallback.
2. `slack.ts` postDraftForApproval: channel picker by (type, topic).
3. (recommended) migration: `domain text` on marketing_drafts (verify PR #68 cols first).
4. New routines:
   - `routines/linkedin-daily.md` (winner format, 24h topics, clinician-first per #93).
   - `routines/tiktok-eppp.md` (5 domain-balanced Qs + EPPP news 24h + test strategy +
     ASPPB WebSearch + oe_ask dedup; talking-head + comment funnel + UCLA hook).
   - `routines/tiktok-pop.md` (winner formats + 24h pop/AI/music/Ableton/news for
     25-34 41M/58F; tie each to a v4 lesson + explanation; comment funnel).
5. 3 run scripts + 3 plists (clone feedback-rewrite); `launchctl load`. Merge routines
   to origin/main first.
6. Resolve the caption CTA conflict in daily-marketing.md + update
   `.claude/skills/ig-reel-script-writer/references/script-template.md` CTA section
   (currently "join the free discord in my bio" — change to comment-trigger pattern).
7. First manual run of each routine to give founder approvals immediately.

## Open decisions for founder
- Slack: make 3 real channels (+ webhook env vars) or keep 1 channel w/ labeled cards?
  (Build supports both; default = real channels w/ fallback to SLACK_WEBHOOK_SOCIAL.)
- oe_ask dedup: OK to create `content/marketing/shared-research.md` as the log?
- comment-trigger funnel needs an auto-DM (ManyChat or manual). Trigger word "PASS",
  asset = free EPPP practice questions. Founder operational setup.
- domain tracking: add `domain` column (recommended) vs parse from text?

## Not part of this build (separate)
- Bug A (0 DCT replies): Resend dashboard fix — point inbound webhook to
  `https://www.thepsychology.ai/api/dct-reply` (apex 307-redirects, svix won't
  follow); verify `DCT_REPLY_TO` + `RESEND_WEBHOOK_SECRET` in Vercel prod. Founder action.
- Bug B (Canada DCT 0 sends): NOT a bug — intentionally queued behind US list
  (commit 6b672cf), CASL gate already open. Auto-starts when US list drains.
