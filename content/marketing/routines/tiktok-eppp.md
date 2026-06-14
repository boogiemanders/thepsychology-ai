# Lane 2 — TikTok EPPP daily (scheduled Claude Code agent)

Generate the day's EPPP talking-head scripts for The Psychology AI (Dr. Anders Chan, UCLA-trained
licensed clinical psychologist) and post each to the TikTok-EPPP approval channel for the founder
to approve, reject, or give feedback. Audience = EPPP candidates and trainees. Runs unattended:
write the full scripts yourself, do not wait for hook approval.

## What to produce each day

1. **5 EPPP practice-question scripts**, balanced across the 12 EPPP domains (see balance step).
2. **1 EPPP-news script** IF there is something real in the last 24 to 48 hours (ASPPB / Pearson /
   board / licensure news). If nothing fresh, skip it and say so.
3. **1 EPPP test-taking-strategy script** (one specific, usable tactic, not generic "study hard").

That is up to 7 talking-head scripts. Each is one `submit-draft` call (`type: "tiktok"`,
`topic: "eppp"`), so it lands in the TikTok-EPPP lane channel.

## Hard rules (non-negotiable)

1. **Never invent a question, statistic, study, or rule.** Practice questions come from our real
   bank (see below), never fabricated. For any claim about EPPP changes/timelines/pass rates, use
   `content/marketing/eppp-news-facts.md` and cite "California Board of Psychology meeting
   materials, Feb 13, 2026 (p. X)". Never extrapolate dates beyond that file.
2. No em dashes (commas, periods, parentheses). No emojis.
3. Borderline claim you want to keep: `needs_review: true` with a note. The `sources` array must
   be non-empty.

## The winning format (from our TikTok scorecard — follow it)

- **Saves are the north star**, not likes or views. A save on study content is one step from a
  signup. Clean talking head beats montages and app demos (those die on engagement).
- **Open in the first 1 to 2 seconds with the UCLA credential or a provocative reframe.** The UCLA
  hook out-reached everything ("UCLA-trained psychologist's tips for the EPPP" = our #1 video).
  The "EPPP sample question with explanation" format is our #2.
- Subtitles always on, under 45 seconds, one specific idea per video.
- Write each script with the `ig-reel-script-writer` skill (vendored at `.claude/skills/`). Give
  it: creator = Dr. Anders Chan, UCLA-trained licensed clinical psychologist; audience = EPPP
  candidates; voice = sharp, plain, credible, no hype; 30 to 45s; the chosen question or angle.
  The skill returns Hook / Build-Up / Value / Payoff / CTA + visual cues; that structured script
  is the `body_md`. Then strip emojis and em dashes.
- **CTA = comment-trigger DM funnel** (this is the single biggest play and the ONLY place we use a
  comment-gate). Default: "Comment PASS and I'll send you free EPPP practice questions." The
  trigger word must match the founder's auto-DM keyword (ManyChat); if unsure, keep PASS. Put the
  tracked link in the caption, not as the spoken CTA: `https://www.thepsychology.ai/go/<slug>?s=tiktok`.

## Step 1 — Balance the 12 domains

The 12 EPPP domains (these are also the question-bank folder names under
`EPPP/content/questionsGPT/`):

1. Biopsychology (Neuroscience & Pharmacology)
2. Learning and Memory
3. Social Psychology
4. Cultural Considerations
5. Development
6. Assessment
7. Diagnosis
8. Test Construction
9. Clinical Interventions
10. Research and Stats
11. Ethics
12. I-O Psychology (`2 3 5 6 I-O Psychology`)

See which domains we covered recently so today's 5 spread coverage (pick the under-covered ones):

```
node --env-file=.env.local --import tsx scripts/marketing/recent-drafts.ts --type=tiktok --topic=eppp --days=14
```

Read the recent titles, map each to its domain, and choose 5 domains that are under-represented in
the last two weeks. Rotate so all 12 get covered over time.

## Step 2 — Pull 5 real questions (one per chosen domain)

Pick questions from the bank, not your head. Bank: `EPPP/content/questionsGPT/<domain folder>/`
(JSON files; fields: `stem`, `options` [4], `answer`, `explanation`, `kn`, `difficulty`,
`suggestedLesson`, `realExam`). Free variant: `EPPP/content/free-questionsGPT/`. Prefer
`realExam: true` questions and clear, teachable explanations.

For each: turn the question into a talking-head script. Hook with the credential or a reframe
("Most people miss this EPPP question about X"), pose the question, give the answer, and teach the
WHY from `explanation` in plain language. Cite the source as our question bank / the domain. If the
question's `explanation` makes a factual claim you can name a reference for, add it to `sources`.

## Step 3 — EPPP news (only if fresh in the last 24 to 48h)

- Run `last30days --days=2` on EPPP / licensure / ASPPB.
- **Also WebSearch `asppb.org`** for any posted updates or news.
- If there is real news, write one talking-head script that explains it plainly for candidates,
  grounded in `eppp-news-facts.md` for any board/timeline/pass-rate claim. If nothing is fresh,
  skip this script.

## Step 4 — Test-taking strategy + new research (oe_ask, deduped)

- Write one script on a single concrete EPPP test-taking tactic (e.g. how to use the answer
  options to eliminate distractors, time budgeting per item, managing the "two right answers"
  trap). Make it specific and usable.
- Use `oe_ask` (OpenEvidence) to find NEW studying/learning research we have not shared before
  (e.g. retrieval practice, spacing, interleaving, test anxiety). This research is the GROUNDING
  and source for the test-taking-strategy script above (not a separate card) — fold the finding
  into that script and cite it. **Dedup before using it:**
  - Run `recent-drafts.ts --topic=eppp --days=60` and check the `sources` of recent drafts; do
    NOT re-share a study already cited there.
  - Also read `content/marketing/shared-research.md` (the running do-not-repeat list) and skip
    anything listed.
  - Cite any new study in `sources` with author + year. (Note: the checkout resets each run, so
    that file is a manually maintained seed; the durable dedup is the recent-drafts `sources`.)

## Step 5 — Fact-check, then submit each script

Re-read every script as a skeptic. Practice questions must match the bank (no altered answers).
Cut unsupported claims; flag borderline keepers. Write each script to its own temp JSON matching
`DraftInput` in `src/lib/marketing/types.ts` and submit one at a time:

```
npx tsx scripts/marketing/submit-draft.ts /path/to/script.json
```

Each posts an approval card to the TikTok-EPPP lane (`SLACK_WEBHOOK_TIKTOK_EPPP`, falls back to
`#social-approvals`). Report one line: the 5 domains you covered, whether you shipped a news script,
and any `needs_review` flags.
