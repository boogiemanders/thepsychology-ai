# Lane 2 — TikTok EPPP daily (scheduled Claude Code agent)

Generate the day's EPPP talking-head scripts for The Psychology AI (Dr. Anders Chan, UCLA-trained
licensed clinical psychologist) and post each to its EPPP approval lane (exam or strategy, set by
topic) for the founder to approve, reject, or give feedback. Audience = EPPP candidates and
trainees. Runs unattended:
write the full scripts yourself, do not wait for hook approval.

## What to produce each day

1. **5 EPPP practice-question scripts**, balanced across the 12 EPPP domains (see balance step).
2. **1 EPPP-news script** IF there is something real in the last 24 to 48 hours (ASPPB / Pearson /
   board / licensure news). If nothing fresh, skip it and say so.
3. **1 to 2 EPPP-strategy scripts** (`topic: "eppp-strategy"`, routes to the strat lane): a
   concrete test-taking tactic, a learning protocol from `oe_ask` tied to the Learning and Memory
   v4 lesson, or one of Dr. Chan's own prep stories / exam-day experiences. See Step 4.

That is up to 8 talking-head scripts, each one `submit-draft` call with `type: "tiktok"`. Topic
sets the lane: the 5 practice questions and the news script use `topic: "eppp"` (lands in the
TikTok-EPPP-Exam channel); the 1 to 2 strategy scripts use `topic: "eppp-strategy"` (lands in the
TikTok-EPPP-Strat channel).

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
- **The UCLA credential is a VISUAL hook, rendered in the Remotion animation/overlay layer, NOT a
  spoken line.** It appears ON SCREEN in the first 1 to 2 seconds (a Remotion overlay, e.g. an
  `animation_cues` overlay; keep it OUT of `body_md`, the HeyGen script the avatar speaks). The UCLA
  hook out-reached everything ("UCLA-trained psychologist's tips for the EPPP" = our #1 video).
  Carry this visual hook on BOTH exam and strategy scripts; the spoken script opens straight on the
  question or the tactic. The "EPPP sample question with explanation" format is our #2.
- Subtitles always on, under 45 seconds, one specific idea per video.
- Write each script with the `ig-reel-script-writer` skill (vendored at `.claude/skills/`). Give
  it: creator = Dr. Anders Chan, UCLA-trained licensed clinical psychologist; audience = EPPP
  candidates; voice = sharp, plain, credible, no hype; 30 to 45s; the chosen question or angle.
  The skill returns Hook / Build-Up / Value / Payoff / CTA + visual cues; that structured script
  is the `body_md`. Then strip emojis and em dashes.
- **CTA = like, follow, visit the site** (spoken). Use exactly: "Like, follow, and check the
  psychology dot ai." ("the psychology dot ai" is the spoken form of thepsychology.ai, and saying it
  also fires the on-screen end card.) The comment-trigger DM funnel ("Comment PASS...") is ON HOLD
  until the founder's ManyChat/TikTok auto-DM is set up (US TikTok cannot do comment-to-DM yet); do
  NOT use a comment-gate CTA until then. Put the tracked link in the caption:
  `https://www.thepsychology.ai/go/<slug>?s=tiktok`.

## Hook variety (A/B test these, rotate daily)

We are testing spoken hooks. Open most scripts with ONE of the templates below, and vary it day to
day (do not reuse the same opener two days running). Keep the UCLA credential as the ON-SCREEN
visual hook either way. Fill `[outcome]` with an EPPP win (pass the E triple P, stop blanking on
`[domain]`, answer any `[domain]` question, walk into test day calm) and `[solution]`/`[concept]`
with the exact tactic or concept the video teaches. Spoken "EPPP" = "E triple P". No em dashes, no
emojis. Pick the hook that genuinely fits; do not force one that doesn't match the question.

- In 60 seconds I'm going to logically prove you can `[outcome]`.
- Here's the ONE `[solution]` I used to `[outcome]`.
- Here's how to `[outcome]`. Stop `[the thing they're doing wrong]`.
- Today we're talking about how to `[outcome]`.
- This is the single easiest way to `[outcome]`.
- If you want to instantly `[outcome]`, this is the only video you'll ever need.
- Here's exactly how you're gonna `[outcome]` in 2026. You're gonna `[solution]`.
- Here's the strategy I used to `[outcome]`. I call it `[solution]`.
- The easiest way to `[outcome]` is to `[solution]`.
- Is it possible to `[outcome]` in `[X]` minutes?
- POV: you and your study buddy hit this `[domain]` question.
- Here's why you should `[solution]`.
- Here's the only video you'll ever need to watch to `[outcome]`.
- I `[personal outcome]` literally just from spamming this ONE `[solution]`.

**Structure still holds.** Practice-question scripts: hook first, then go straight into the
question, the four choices ("A, ..." etc.), the pause, and the answer (the on-screen card needs that
structure). Strategy scripts: hook, then the one tactic. Note in `review_notes` which hook template
you used, so we can compare saves later.

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
WHY from `explanation`.

**Vary where the correct answer sits (a viewer flagged "the answer is always C").** The bank often
lists the right option third, so left as-is every video lands on C. When you lay out the four
choices, shuffle their order so the correct answer falls in a different slot, and across today's 5
questions spread the correct letter across A, B, C, and D (aim for four different letters; never all
the same). When you reorder, also reword any choice that refers to another by position ("both A and
B"). The choice order on the card, the spoken `The answer is <letter>`, and the wrong-answer
call-outs must all match the slot you chose.

**Keep the explanation short and simple. This is the part to tighten most.** Two to three short
sentences a tired candidate understands on the first listen. Give the single reason the right
answer is right, in everyday words, and define any term the moment you use it. Cut hedges, "note
that", second clauses, and exam jargon. The whole payoff should land in one breath. Shorter
explanation means a shorter video, which means better retention and more saves. Wrong-answer
call-outs stay one short clause each (why it is a trap), never a mini-lecture.

Cite the source as our question bank / the domain. If the question's `explanation` makes a factual
claim you can name a reference for, add it to `sources`.

## Step 3 — EPPP news (only if fresh in the last 24 to 48h)

- Run `last30days --days=2` on EPPP / licensure / ASPPB.
- **Also WebSearch `asppb.org`** for any posted updates or news.
- If there is real news, write one talking-head script that explains it plainly for candidates,
  grounded in `eppp-news-facts.md` for any board/timeline/pass-rate claim. If nothing is fresh,
  skip this script.

## Step 4 — EPPP-strategy scripts (1 to 2; `topic: "eppp-strategy"` -> strat lane)

Produce one or two strategy scripts. Each is its own `submit-draft` call with `topic:
"eppp-strategy"` (NOT `eppp`) so it routes to the EPPP-Strategy lane. Rotate the angles day to day:

- **Test-taking tactic** — one concrete, usable move (use the options to eliminate distractors,
  time budgeting per item, the "two right answers" trap). Specific, not generic "study hard".
- **Learning protocol (oe_ask + lesson)** — use `oe_ask` (OpenEvidence) to find NEW
  studying/learning research we have not shared (retrieval practice, spacing, interleaving, test
  anxiety) and tie it to the matching **Learning and Memory** lesson under
  `EPPP/content/topic-content-v4/` (that domain is literally the science of how to study). The
  lesson plus the study are the grounding and the `sources`.
- **Founder story** — a first-person story of how Dr. Chan actually prepared and what exam day was
  like. Authentic and specific, no hype. Where it maps to a concept, tie it to its
  `topic-content-v4` lesson.

**Dedup the research before using it:**
- Run `recent-drafts.ts --topic=eppp-strategy --days=60` (and `--topic=eppp`) and check the
  `sources` of recent drafts; do NOT re-share a study already cited there.
- Also read `content/marketing/shared-research.md` (the running do-not-repeat list) and skip
  anything listed.
- Cite any new study in `sources` with author + year. (The checkout resets each run, so that file
  is a manually maintained seed; the durable dedup is the recent-drafts `sources`.)

## Step 5 — Fact-check, then submit each script

Re-read every script as a skeptic. Practice questions must match the bank (no altered answers).
Cut unsupported claims; flag borderline keepers. Write each script to its own temp JSON matching
`DraftInput` in `src/lib/marketing/types.ts` and submit one at a time:

```
npx tsx scripts/marketing/submit-draft.ts /path/to/script.json
```

Each posts an approval card to its lane by topic: `eppp` -> TikTok-EPPP-Exam
(`SLACK_WEBHOOK_TIKTOK_EPPP`), `eppp-strategy` -> TikTok-EPPP-Strat
(`SLACK_WEBHOOK_TIKTOK_EPPP_STRAT`); both fall back to `#social-approvals`. Report one line: the 5
domains you covered, whether you shipped a news script, and any `needs_review` flags.
