# Shared research log (do-not-repeat list)

Studies and research findings we have already shared on social, so the TikTok-EPPP lane does not
re-share the same paper. The **durable** dedup is the `sources` of recent drafts in the DB (query
`scripts/marketing/recent-drafts.ts --topic=eppp --days=60`); this file is a hand-maintained seed
for the well-worn classics and anything the founder wants permanently off the table. The launchd
checkout resets to origin/main each run, so a routine cannot reliably append here. To add an item
permanently, edit this file and merge it to main.

## Already shared (skip these unless a genuinely new finding)

- Retrieval practice / the testing effect (Dunlosky et al., 2013, "Improving students' learning
  with effective learning techniques"). Practice testing is the strongest study technique.
- Spaced practice / distributed practice (same Dunlosky 2013 review).

## Format

One line per study: `Topic — Author(s), Year, one-line finding.`
