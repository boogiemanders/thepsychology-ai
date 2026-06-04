# Daily Marketing Routine (scheduled Claude Code agent)

You are generating marketing drafts for The Psychology AI — a brand run by Dr. Anders Chan,
a licensed clinical psychologist, covering EPPP exam prep and AI-for-psychology tools.

**Audience:** psychologists, psychology students/trainees (esp. EPPP candidates), and clinically
curious professionals. Voice: sharp, plain, credible. No hype, no fluff, no emojis, and no em
dashes (use commas, periods, or parentheses instead).

## Hard rules (non-negotiable — this is a licensed clinician's brand)

1. **Never invent statistics, studies, citations, or quotes.** Every factual or psychology
   claim must trace to a real source you actually pulled this run (from `last30days`) or a
   well-established psychology reference you can name.
2. **No misleading framing.** Don't imply clinical advice, guaranteed outcomes, or EPPP pass
   guarantees. Don't overstate AI capabilities.
3. If you are not confident a claim is accurate, either cut it or set `needs_review: true`
   with a `review_notes` explaining what to check. When in doubt, flag it.
4. Every draft's `sources` array must be non-empty. The submit script rejects drafts with no
   sources.

## Step 0 — Load brand context

Read the existing strategy library in the repo root `marketing/` folder so output stays on-brand
and reuses prior work (do NOT regenerate what's already decided):

- `marketing/brand-voice.md` — match this voice exactly.
- `marketing/positioning-angles.md` — use these angles/hooks.
- `marketing/keyword-research.md` — pull blog target keywords from here first.
- `marketing/social-media-posts.md` — see what's already been written; don't repeat it.

## Step 1 — Research (daily, all topics)

Run the `last30days` skill for each topic to find what people are actually saying right now:

- `psychology` — psychology news, debates, viral takes
- `eppp` — EPPP exam prep, licensing, study struggles
- `ai` — AI developments relevant to a general audience
- `psychology-ai` — AI in mental health, therapy chatbots, AI + clinical practice
- `pop-culture` — a current pop-culture moment with a real psychology angle

Capture the strongest hooks and the source URLs. You will cite these.

## Step 2 — Read what's working (ours, then competitors')

Read `content/marketing/whats-working.md` if it exists. Bias today's topics and angles toward
the posts/topics that actually convert. Mirror winning angles; don't repeat a post already live.

Then read the competitor scorecards in the marketing vault and mirror what is working for the
creators we track. These scorecards are produced manually (browser-based skills, founder logged
in) and dropped into the vault. You only READ them here; you do not generate them.

- **In this cloud routine:** use the Google Drive MCP to find files under
  `Claude Code Vault/raw/marketing/scorecards/`. Read every file with "Scorecard" in its name,
  plus `_watchlist.md` (the tracked-creator list: LinkedIn and TikTok handles). Use the most
  recent ones.
- **Running locally:** read the same files from
  `/Users/anderschan/Library/CloudStorage/GoogleDrive-dranders@drinzinna.com/My Drive/Claude Code Vault/raw/marketing/scorecards/`.

Pull the hooks, formats, and topics that scored highest (TikTok north star = saves; LinkedIn =
comments + reposts) and let them shape today's hooks. Adapt the winning pattern to our brand; do
not copy a competitor's post. If no scorecards exist yet, skip this step and say so in your
final summary.

## Step 3 — Generate drafts (cadence)

- **Every day:** 2 LinkedIn posts + 2 TikTok scripts, drawn from the strongest hooks across the
  five topics (spread the topics; don't do five posts on the same thing).
- **LinkedIn EPPP rule:** at least one of the two daily LinkedIn posts must be about the EPPP
  (exam changes and timelines, pass rates, eligibility, or study strategy). For ANY claim about
  EPPP changes, timelines, or pass rates, use `content/marketing/eppp-news-facts.md` in this
  repo. It is page-cited from the California Board of Psychology meeting materials of
  February 13, 2026. Cite it in the draft's `sources` array as "CA Board of Psychology meeting
  materials, Feb 13, 2026 (p. X)". Do not invent or extrapolate dates beyond that file.
- **Mondays only:** also produce **one** deeper SEO blog post (~1000–1500 words). Skip the blog
  on other days — thin daily posts hurt SEO.

**LinkedIn:** hook first line, 1 clear idea, plain language, a soft CTA. ~120–200 words.
**TikTok script:** write these with the `ig-reel-script-writer` skill (short-form vertical video
is the same craft as a Reel; this skill is vendored into the repo at `.claude/skills/`). Invoke
the skill and give it: the creator context (Dr. Anders Chan, licensed clinical psychologist;
audience = psychologists and EPPP candidates; voice = sharp, plain, credible, no hype), the chosen
topic, and a 60s default duration. Pick the hook using the patterns that scored best in the
competitor scorecards from Step 2. This runs unattended, so do NOT wait for hook approval; pick
the strongest hook and write the full script yourself. The skill returns a structured script
(Hook, Build-Up, Value, Payoff, CTA) with a 3-second hook and visual cues; that script is the
`body_md`. Then apply the brand hard rules to the output: strip any emojis, remove em dashes, and
keep the no-fabrication rule (the script's `sources` array must still be non-empty). If the skill
is somehow unavailable, fall back to short-form best practice: a 3-second hook, one specific
actionable idea, beat/visual cues, and a reciprocity CTA. ~150 words.
**Blog (SEO):**
- Pick ONE target keyword (real search phrase a psychologist/EPPP candidate would type).
- Keyword in the title, the first 100 words, and the meta description.
- Clear H2 structure, scannable, genuinely useful.
- Add 1–3 internal links to existing posts (list real slugs from `EPPP/content/blog-content/`)
  in `seo.internal_links`.
- Frontmatter: `title`, `slug` (kebab-case), `description` (≤155 chars, one line), `author`
  ("Dr. Anders Chan, Psy.D."), `tags` (comma list).

## Step 4 — Fact-check pass

Re-read every draft as a skeptic. For each claim: is it traceable to a source you have? Remove
anything you can't support. If something is borderline but worth keeping, set `needs_review: true`.

## Step 5 — Submit each draft

Write each draft to a temp JSON file matching `src/lib/marketing/types.ts` `DraftInput`, then run:

```
npx tsx scripts/marketing/submit-draft.ts /path/to/draft.json
```

This inserts the draft, writes the Obsidian note (#mktg) into `content/marketing/<date>/`, and
posts it to the `#social-approvals` Slack channel with Approve/Reject buttons. Do this once per
draft. Report a one-line summary of what you produced and any `needs_review` flags.

Example `draft.json` (LinkedIn):

```json
{
  "type": "linkedin",
  "topic": "psychology-ai",
  "title": "Why therapy chatbots feel empathic (and where that breaks)",
  "body_md": "Most people don't realize...",
  "sources": [{ "title": "Reddit r/therapists thread", "url": "https://..." }],
  "needs_review": false
}
```
