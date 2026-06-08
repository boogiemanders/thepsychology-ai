# Voice learnings

The founder's writing preferences, learned from every Feedback rewrite and every Approve in
#social-approvals. The daily marketing writer reads this file before drafting so new posts
land closer to approval the first time. You can edit this file directly — it is the source of
truth for voice.

`scripts/marketing/distill-learnings.ts` updates the rules below from the raw `marketing_feedback`
log (run it after a batch of feedback). Hand edits are preserved on the next distill run unless
they conflict with a strong, repeated signal.

## Hard rules (never break)

- No em dashes. Commas, periods, or parentheses instead.
- No emojis.
- Every claim traces to a real source with an inline (Author, Year) cite and a Sources list.
- Every post ends with a tracked branded link: `https://www.thepsychology.ai/go/<topic>`
  (e.g. /go/eppp-cost). The /go route adds the GA UTMs (source=linkedin, medium=social,
  campaign=<topic>), so use the short /go form in posts, never the raw UTM query string. Use a
  UNIQUE <topic> slug per post so Google Analytics attributes clicks to the right post. For a
  non-LinkedIn platform add ?s=<platform> (e.g. /go/eppp-cost?s=tiktok). Required on every post.
- Keep the founder's voice: a clinical psychologist talking to other clinicians and students, credible but plain-spoken.

## Learned preferences

- Verify any salary, pass rate, or dated statistic against the LATEST available year before citing
  (e.g. BLS for the psychologist median wage). Do not reuse a stale figure; the founder will catch it.
- Do not imply that any demographic group "can't afford" or is "least able to absorb" a cost. Frame
  cost as total or structural (more retakes = more fees), not by-group, unless a direct statistic
  supports the group-level claim.
- Headlines should state the specific claim plainly. "The EPPP does not have equal pass rates by
  ethnicity" beats "does not fail everyone equally."
- For the licensure-cost angle, the goal framing is a fair shot and affordable prep, not lowering
  the bar.
