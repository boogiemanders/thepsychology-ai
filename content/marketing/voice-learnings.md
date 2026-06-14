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
- Every claim traces to a real source. In written body copy (blog, LinkedIn), back it with an
  inline (Author, Year) cite; in spoken TikTok scripts the cite lives in the `sources[]` array,
  not the spoken line. Whether a "Sources" list goes in the body is platform-specific (see the
  CTA + link rules below).
- **Tracked link + CTA are platform-specific** (use a UNIQUE `<slug>` per post so GA attributes
  clicks; the /go route adds the GA UTMs, so use the short `/go/<slug>` form, never the raw UTM
  query string):
  - **LinkedIn:** NO link and NO "Sources" block in the post body (external links and APA blocks
    both tank reach with our senior-clinician audience). The body CTA is one specific question only
    a working clinician can answer. Put the tracked link `https://www.thepsychology.ai/go/<slug>`
    and any reference in the FIRST COMMENT, not the post.
  - **TikTok (both lanes):** the spoken CTA is a comment-trigger DM funnel (e.g. "Comment PASS and
    I'll send you free EPPP practice questions"); the trigger word must match the founder's
    ManyChat keyword. Put the tracked link in the caption as `/go/<slug>?s=tiktok`.
  - **Blog:** keep the tracked `/go/<slug>` link inline as before.
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
