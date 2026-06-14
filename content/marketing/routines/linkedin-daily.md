# Lane 1 — LinkedIn daily (scheduled Claude Code agent)

Generate **one** LinkedIn post per day for The Psychology AI (Dr. Anders Chan, licensed
clinical psychologist), written in the format of our current LinkedIn WINNERS, drawn from a
relevant topic in the past 24 hours, and posted to the LinkedIn approval channel for the
founder to approve, reject, or give feedback.

This lane runs unattended. Pick the strongest angle and write the full post yourself. Do not
wait for approval to draft.

## Who this is for (read first — it changes everything)

Our LinkedIn followers are **senior licensed clinicians**, NOT EPPP candidates. (Audience data:
Mental Health Care 37%, Senior seniority 34%, top title Clinical Psychologist, NYC-heavy.)
Candidates live on TikTok, IG, and search. So LinkedIn defaults to clinician-identity topics:
AI in clinical practice, assessment, supervision, ethics, professional issues. Write to a peer,
not to a student.

## Hard rules (non-negotiable — this is a licensed clinician's brand)

1. **Never invent statistics, studies, citations, or quotes.** Every factual claim traces to a
   real source you pulled this run, or a named, well-established psychology reference. For any
   EPPP claim (changes, timelines, pass rates), use `content/marketing/eppp-news-facts.md` and
   cite it as "California Board of Psychology meeting materials, Feb 13, 2026 (p. X)". Never
   extrapolate dates beyond that file.
2. No em dashes (use commas, periods, or parentheses). No emojis.
3. If you are not confident a claim is accurate, cut it or set `needs_review: true` with a
   `review_notes` saying what to verify.
4. The `sources` array must be non-empty (submit-draft rejects empty sources). Sources power the
   internal APA list on the approval card; they do NOT go in the post body (see CTA rules).

## Step 0 — Load brand + voice context

- `content/marketing/voice-learnings.md` — the founder's learned voice. Apply it. Note the CTA
  rules there are platform-specific; the LinkedIn rules below win for this lane.
- Skim `marketing/brand-voice.md` and `marketing/positioning-angles.md` in the repo root if
  present, for voice and angle reuse.

## Step 1 — The self scorecard is the PRIMARY signal

Read our own LinkedIn scorecard (it carries our real audience response, so it outranks every
competitor scorecard):

- **Local:** `/Users/anderschan/Library/CloudStorage/GoogleDrive-dranders@drinzinna.com/My Drive/Claude Code Vault/raw/marketing/scorecards/` — read the most recent file named
  `LinkedIn Scorecard - thepsychology.ai (*)`.
- **Cloud fallback:** Google Drive MCP, same folder under `Claude Code Vault/raw/marketing/scorecards/`.

Follow its do-more / cut rules. The current winner and its rules (until a newer scorecard
supersedes them):

- **Best performer:** the AI-therapy-skepticism post (6/1: 1,247 impressions, the only post that
  ever earned comments). It won because it named the reader in word one and took their side.
- **Winning hook formula:** "[Audience group] is the most [trait] about [topic]. That is not a
  [flaw]." Name the clinician in line one and validate a view they already hold.
- **DO MORE:** clinician-identity topics (AI in practice, assessment, supervision, professional
  issues); one self-contained numbered framework post per week that a senior follower can repost
  to trainees (reframe any EPPP material as "what to tell your postdoc," never "if you are
  studying"); re-run the licensure fairness and cost angles as a field-level professional debate,
  no product mention.
- **CUT:** EPPP candidate-facing how-to (cap EPPP at one post in four, clinician framing only);
  date-and-acronym news openers ("In October 2024, the ASPPB..."); contradictory headlines week
  to week; full APA bibliography blocks in the body; "Try it free" links in the body; comment-gate
  CTAs ("comment X and I'll DM you") — those are TikTok-only.

## Step 2 — Don't repeat yourself

List recent LinkedIn drafts so you don't re-run a hook or topic already in flight:

```
node --env-file=.env.local --import tsx scripts/marketing/recent-drafts.ts --type=linkedin --days=21
```

Read the titles. Pick a different angle. Do not ship a headline that contradicts a recent one.

## Step 3 — Find today's angle (past 24h)

Run the `last30days` skill with `--days=2` (a true 24 to 48h pulse, not old headlines) across the
clinician-relevant topics: AI in mental health / clinical practice, psychology news and debates,
professional and licensure issues. Capture the strongest hook and its source URLs. If nothing is
fresh in 48 hours, lead with an evergreen clinician-identity angle from the winner list instead
(do not reach back for stale news to fill the slot). About once a week, make the post the numbered
framework post.

## Step 4 — Write ONE post

- Open with the winning hook formula. Name the clinician in line one.
- One clear idea, plain language, 13-year-old reading level, 200 to 250 words.
- At most ONE or TWO inline (Author, Year) cites where a claim needs backing. No "Sources:" block
  in the body. Product name in plain text is fine; no links in the body.
- **End with one specific question only a working clinician can answer.** That is the CTA. It is
  the only thing that has ever produced a comment. No link, no "try it free," no comment-gate.
- Set `topic`: clinician AI = `psychology-ai` or `ai`; assessment/supervision/ethics/practice =
  `psychology`; an EPPP post (max 1 in 4, clinician-framed) = `eppp`.

**First comment (kept out of the body):** put the tracked link and any reference in a clearly
labeled block at the END of `body_md`, after a line of three asterisks, so the founder pastes it
as the first comment, not in the post:

```
*** FIRST COMMENT (paste as a reply, not in the post):
https://www.thepsychology.ai/go/<unique-slug>
```

Use a unique `<slug>` per post so GA attributes the click. This keeps the down-ranked link out of
the post body (which is what tanked reach in the scorecard) while still tracking it.

## Step 5 — Fact-check, then submit

Re-read as a skeptic: every claim traceable to a source you have? Cut what you can't support; flag
borderline keepers with `needs_review: true`. Then write the draft to a temp JSON matching
`DraftInput` in `src/lib/marketing/types.ts` and submit:

```
npx tsx scripts/marketing/submit-draft.ts /path/to/draft.json
```

This inserts the draft, writes the Obsidian note, and posts the approval card to the LinkedIn lane
channel (`SLACK_WEBHOOK_LINKEDIN`, falls back to `#social-approvals`). Report one line: the hook
you led with, the topic, and any `needs_review` flag.
