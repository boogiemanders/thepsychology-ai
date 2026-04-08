# Assessment Tools — Shared Plan

## Goal
Build clinician-facing assessment tools for the lab website, starting with BAARS and ADHD-RS, and make each tool discoverable from the lab site's ring animation.

## Product Requirements
- Tool loads inside the lab site, not as a separate extension
- Each assessment has its own route, config, and rendering logic
- Each assessment can be listed in the ring animation as a first-class tool
- Scoring should be deterministic and reviewable
- Question content and result interpretation should be easy to update without rewriting UI logic

## Shared Architecture
- Define a common assessment schema:
  - metadata
  - sections
  - items
  - response scale
  - scoring rules
  - result bands / interpretations
- Separate content from renderer:
  - assessment definition file
  - scoring engine
  - result summary component
- Register each tool in whatever lab-site source currently powers:
  - ring animation entries
  - tool cards / labels
  - route loading
  - icon / visual metadata

## Planning Questions
- Are BAARS and ADHD-RS public-domain, licensed, or partially reproducible only?
- Do you want exact instrument wording, or a clinician workflow inspired by the instruments?
- Should results stay local-only, or be persisted to user accounts?
- Do you need printable / exportable output?
- Will the tool support adult, child, parent, teacher, or self-report variants?

## Build Sequence
1. Confirm content/licensing constraints for each instrument
2. Model the shared assessment schema
3. Build one assessment end-to-end as the reference implementation
4. Add lab-site registration so it appears in the ring animation
5. Add second assessment using the same renderer/scoring pattern

## Integration Work To Do Later
- Find the lab site file that defines ring animation entries
- Add a new assessment-tool category or entries if needed
- Connect each assessment to the tool loader / route system
- Decide whether tool definitions live in the main app or are loaded from content files
