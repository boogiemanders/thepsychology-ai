# Routine: feedback-rewrite

Drain the marketing rewrite queue. When the founder taps **Feedback** on a draft card in
#social-approvals and submits a note, the Slack server enqueues it (a pending `marketing_feedback`
row). This routine rewrites each pending draft to honor that feedback, posts a fresh approval
card, and marks the row done. It runs on the founder's Claude subscription, so the rewrite can
use oe_ask, last30days, and web search for grounding (no API key needed).

Run it on a short cadence (e.g. every few minutes, or after each daily-marketing run) so
rewrites turn around quickly.

## Step 1 — Read the queue

Run (env must load first, same as the other marketing scripts):

```
node --env-file=.env.local --import tsx scripts/marketing/list-pending-feedback.ts
```

This prints a JSON array of pending items, each:
`{ feedback_id, feedback_text, requested_by, requested_at, original: { id, type, topic, title, slug, body_md, frontmatter, sources, seo } }`

If the array is empty, stop — nothing to do.

## Step 2 — Read the founder's voice

Read `content/marketing/voice-learnings.md` so the rewrite matches the founder's learned
preferences, not just this one note.

## Step 3 — Rewrite each item

For each queued item, rewrite `original` to honor `feedback_text`. Rules (do not break):

- Keep inline APA citations in (Author, Year) form and a "Sources:" list.
- Never invent a statistic, study, or quote. If the feedback asks for a claim the original
  sources don't cover, VERIFY it first:
  - clinical / psychology claims -> `oe_ask` (OpenEvidence),
  - current / cultural / general claims -> `last30days` or web search.
  Cite what you find in (Author, Year) form and add it to the sources list. If you cannot
  verify a requested claim, leave it out and set `needs_review: true` with a short note.
- No em dashes (commas, periods, or parentheses instead). No emojis.
- Keep the founder's voice and the post's format (blog / linkedin / tiktok). Apply the
  voice-learnings. Change only what the feedback asks for; keep the rest of the wording.
  BUT every retained citation, statistic, and claim must still pass the fact-check in Step 3.5
  below. Carrying a stat over from the original is NOT a reason to trust it. Re-verify it.

Write each rewrite to a temp JSON file matching this shape (carry the same `type`/`topic`,
and include the `feedback_id`):

```json
{
  "feedback_id": "<from the queue item>",
  "type": "<same as original>",
  "topic": "<same as original>",
  "title": "<kept or improved>",
  "slug": "<blog only; omit for social>",
  "body_md": "<rewritten body with (Author, Year) cites + Sources: list>",
  "frontmatter": { "...": "carry the original frontmatter; update title/description if changed" },
  "sources": [{ "title": "...", "url": "..." }],
  "seo": { "...": "carry the original seo" },
  "needs_review": false,
  "review_notes": ""
}
```

## Step 3.5 — Source-faithful fact-check (run on EVERY rewrite, no exceptions)

Do not trust the original draft's numbers. Most errors are inherited, not introduced: a wrong
figure or a misattributed cite rides along because nobody re-checked it. Before you submit,
audit EVERY factual claim in the body, including ones you did not change.

For each statistic, dollar figure, percentage, study finding, or quote:

1. Open the actual cited source (follow the DOI, PubMed link, or URL; for clinical/psychology
   claims use `oe_ask`, for current/general claims use `last30days` or web search). Do not rely
   on memory or on what the previous draft said.
2. Confirm the source ACTUALLY reports that number or finding. A real-looking citation is not
   enough. The claim must be what the source says. Watch for:
   - Wrong figure: the paper reports a different number than the draft states.
   - Misattribution: a logical extrapolation pinned to a source that never makes it (e.g.,
     citing a pass-rate study for a retake-cost claim).
   - Wrong subject: the source is about a different population than implied (e.g., a guideline
     about low-income clients cited for students' training costs).
   - Stale year: a newer figure exists. Always use the latest available year for salaries, pass
     rates, fees, and any dated stat.
   - Population mismatch: a severity or comparison claim that does not match the study's actual
     sample (e.g., calling a trial "mild-to-moderate" when it enrolled clinically significant cases).
3. If a claim does not check out: replace it with the verified figure and fix the cite, or cut
   it. If you cannot verify it at all, remove it and set `needs_review: true` with a one-line note
   on what failed.
4. Skeptic pass: for each number that survives, ask "if someone opened this exact source right
   now, would they find this exact figure?" If you are not sure, treat it as unverified and cut it.

A claim with no traceable, source-faithful backing does not ship. When in doubt, cut it. It is
always better to post a shorter, fully-verified draft than a richer one with a single bad stat,
because this is a licensed clinician's brand and one wrong number costs more than ten missing ones.

## Step 4 — Post the rewritten card + mark done

For each rewrite JSON:

```
node --env-file=.env.local --import tsx scripts/marketing/submit-rewrite.ts /path/to/rewrite.json
```

This inserts the new pending draft, writes its Obsidian note, posts a fresh approval card to
#social-approvals (Approve / Reject / Feedback), and marks the originating `marketing_feedback`
row processed (so it won't be picked up again).

## Notes

- **Running locally:** set `MARKETING_NOTES_DIR` to your Obsidian vault to write notes straight
  in, same as `submit-draft.ts`. Otherwise notes land in the repo under `content/marketing/<date>/`.
- The original draft stays pending — the founder can still act on it. The rewrite is a new,
  separate card.
- Every processed rewrite stays in `marketing_feedback`; `distill-learnings.ts` folds the
  feedback into `voice-learnings.md` so future drafts start closer to approval.
