# Lane 3 — TikTok Pop daily (scheduled Claude Code agent)

Generate the day's pop-culture talking-head scripts for The Psychology AI (Dr. Anders Chan,
UCLA-trained licensed clinical psychologist): take a current moment (pop culture, AI, or music),
explain the psychology behind it, and ALWAYS tie it to a real lesson from our topic content. Post
each to the TikTok-Pop approval channel for the founder to approve, reject, or give feedback.
Audience skews 25 to 34 (about 41% men, 58% women). Runs unattended: write the full scripts
yourself.

## What to produce each day

2 to 3 talking-head scripts, one per research stream that actually has a strong fresh moment
(skip a stream if nothing landed in the last 48 hours). Every script MUST connect the moment to a
specific psychology lesson and explain it.

**Routing rule (do not skip):** submit every script in this lane with `type: "tiktok"` and
`topic: "pop-culture"`. That is what routes the card to the TikTok-Pop channel. Even an AI or
music script uses `topic: "pop-culture"` here, because the psychology-explainer angle is the lane,
not the subject.

## Hard rules (non-negotiable)

1. **Never invent statistics, studies, or quotes.** Every psychology claim traces to a real
   source you pulled this run or a named, well-established reference. The v4 lesson you tie to is
   itself the grounding for the psychology concept.
2. No em dashes (commas, periods, parentheses). No emojis.
3. Borderline claim: `needs_review: true` with a note. The `sources` array must be non-empty.

## The winning format (from our TikTok scorecard — follow it)

- **Saves are the north star.** Clean talking head beats montages and app demos.
- Open in the first 1 to 2 seconds with the credential or a provocative reframe ("A psychologist
  explains why X broke the internet").
- Subtitles always on, under 45 seconds, one idea per video.
- Write each script with the `ig-reel-script-writer` skill (`.claude/skills/`). Give it: creator =
  Dr. Anders Chan, UCLA-trained clinical psychologist; audience = 25 to 34, curious general; voice
  = sharp, plain, credible, no hype; 30 to 45s; the moment + the lesson tie-in. The structured
  script (Hook / Build-Up / Value / Payoff / CTA) is the `body_md`. Strip emojis and em dashes.
- **CTA = comment-trigger DM funnel.** Default: "Comment LEARN and I'll send you the breakdown"
  (or a trigger word that matches the founder's ManyChat keyword and the asset you are offering).
  Put the tracked link in the caption: `https://www.thepsychology.ai/go/<slug>?s=tiktok`.

## Step 1 — Find today's moments (past 24 to 48h)

Run `last30days --days=2` on each stream and keep only what is genuinely fresh and interesting to
a 25 to 34 audience:

- **Pop culture:** a current moment (a show, release, trend, celebrity beat, viral debate).
- **AI:** a past-24h AI development worth a psychology take.
- **Music / Ableton / production:** a past-24h music or production story (founder is a producer;
  this is a real interest, not filler).

Capture the moment and its source URL. If a stream has nothing fresh, skip it. Do not reach back
for old headlines.

## Step 2 — Don't repeat yourself

```
node --env-file=.env.local --import tsx scripts/marketing/recent-drafts.ts --type=tiktok --topic=pop-culture --days=21
```

Read recent titles; pick different moments and different lessons than what is already in flight.

## Step 3 — Tie each moment to a v4 lesson (required)

Our lessons live in `EPPP/content/topic-content-v4/<domain folder>/` (12 domain folders; loader
`src/lib/topic-content-manager.ts`, `stripMetaphorMarkers` removes `{{M}}` markup; frontmatter has
`topic_name`, `domain`, `slug`). Free variant: `EPPP/content/free-contentGPT/`.

For each moment, find ONE lesson whose concept explains it (e.g. a banned product going viral ->
reactance; a parasocial celebrity beat -> attachment or social comparison; an AI tool people trust
too fast -> automation bias). Read the lesson, take the real psychology concept from it, and build
the explainer on that. Name the concept and explain it in plain, 13-year-old language. The tie-in
is the value, not a throwaway line.

## Step 4 — Fact-check, then submit each script

Re-read as a skeptic: every claim traceable, the psychology concept faithful to the lesson, no
fabricated study. Cut what you can't support; flag borderline keepers. Write each script to its own
temp JSON matching `DraftInput` in `src/lib/marketing/types.ts` (remember `topic: "pop-culture"`)
and submit one at a time:

```
npx tsx scripts/marketing/submit-draft.ts /path/to/script.json
```

Each posts an approval card to the TikTok-Pop lane (`SLACK_WEBHOOK_TIKTOK_POP`, falls back to
`#social-approvals`). Report one line: the moments you used, the lessons you tied them to, and any
`needs_review` flags.
