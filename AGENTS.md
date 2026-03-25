# EPPP Question Generator

## Overview

Bulk audit + triage workflow for AI-generated exam questions. Covers four checks: lesson linkage, excerpt verification, answer correctness, and flag cleanup. Questions not grounded in any lesson get archived, not deleted.

## Question Schema (expected fields)

```json
{
  "stem": "...",
  "options": ["A", "B", "C", "D"],
  "answer": "exact match to one option",
  "explanation": "...",
  "suggestedLesson": "lesson-slug",
  "lessonExcerpt": "verbatim or near-verbatim text from lesson",
  "needsReview": false,
  "quality_comment": "..."
}
```

## Phase 1 — Bulk Audit (run first, all at once)

Run a single Python script across all question JSON files. Check:

1. **Missing lesson link** — `suggestedLesson` slug doesn't match any lesson file
2. **Fabricated excerpt** — `lessonExcerpt` text (6+ consecutive words) not found in the lesson file
3. **Answer mismatch** — `answer` doesn't exactly match any string in `options`
4. **needsReview=true** — collect all flagged questions
5. **quality_comment concerns** — scan for phrases: `not explicitly`, `not covered`, `truncated`, `not in the lesson`, `not discussed`
6. **Stubs** — fewer than 4 options or stem under 30 chars
7. **Duplicates** — same stem in multiple files

Output counts per category before reviewing any individual question.

## Phase 2 — Triage Order

Work in this order (quickest wins first):

### 1. Missing lesson links (usually < 10)
- Check if content exists in a *different* lesson — remap the slug
- If no lesson covers it at all, archive (see Phase 3)

### 2. Fabricated excerpts (can be 50%+ of questions)
**Don't panic at high numbers.** Many are paraphrases, not fabrications. Before flagging:
- Search the lesson for key phrases (6-word windows)
- Also search the EPPP reference source files
- Only flag if genuinely absent from all source material

Common cause: generator ran with truncated context window. The lesson exists and covers the topic — the excerpt is just a summary. These are fine.

### 3. quality_comment concerns — check excerpt first
When a comment says "not covered" or "truncated":
1. Check if the `lessonExcerpt` is actually in the lesson file
2. If it IS found → the comment is a generator artifact. Fix the comment, clear `needsReview`
3. If it's NOT found → search all other lessons and the reference source
4. Only truly not covered → archive

### 4. needsReview=true cleanup
Bucket into:
- **Auto-clear safe**: comment says "The question is clear/good/straightforward/directly supported" → `needsReview = false`
- **Needs eyes**: comment flags a real issue (wrong domain, thin coverage, concept mismatch)

### 5. Answer correctness
- Exact string match between `answer` and an `options` entry (case-sensitive)
- Read explanation — does it support the stated answer, or inadvertently argue for a different option?

## Phase 3 — Archiving

Questions that cannot be linked to any lesson or reference source go to an archive file, not the trash.

```
staging/review/archive-beyond-lesson.json
```

Each archived entry keeps all original fields plus:
```json
{
  "archived_date": "YYYY-MM-DD",
  "original_file": "relative/path.json",
  "original_index": 2,
  "reason": "Content not found in any lesson or reference material"
}
```

Remove the question from its source file. If the source file becomes empty, delete it.

## Phase 4 — Fix Inaccurate Comments

After confirming an excerpt IS in the lesson, clean the `quality_comment`:
- Remove phrases like "does not explicitly cover", "lesson is truncated before", "not covered in provided lesson files"
- Replace with accurate description of what the question tests
- Set `needsReview: false`

## Key Heuristics

**"Truncated lesson" comments** — almost always a generator artifact from hitting context limits during generation. Check the actual lesson file end. If it ends cleanly with a summary section, the lesson is complete and the comment is wrong.

**High fabricated-excerpt count** — paraphrased excerpts register as "not found" on exact phrase matching. Always verify manually before archiving. A question is only truly ungrounded if the *concept* isn't in any source, not just the exact wording.

**Wrong domain placement** — questions sometimes end up in the wrong file (e.g., I-O Psychology questions in a Learning & Memory file). Keep the question, remap `suggestedLesson` to the correct lesson slug.

**Beyond-lesson EPPP questions** — some valid EPPP questions go beyond current lesson material. These are fine to keep; update `quality_comment` to note "Content goes beyond current lesson material — no lesson excerpt available" and archive if no lesson exists at all.

**Empty `lessonExcerpt` ≠ beyond-lesson** — a question can have a valid `suggestedLesson` slug that resolves, yet still have an empty `lessonExcerpt` if the generator couldn't find grounding text. **Before accepting any empty excerpt as "beyond lesson", grep all lesson files for 2–3 key topic words from the stem and explanation.** The question may belong to a completely different lesson than the one it was assigned to. Only after searching all lessons and the reference source should a question be marked truly beyond-lesson and archived.

Example: a question about group polarization assigned to `3-group-influences` may have an empty excerpt because that lesson doesn't cover polarization — but `5-6-workplace-decisions` does. Remap the slug and pull the real excerpt rather than archiving.

## Common Mistakes

- **Trusting quality_comment blindly** — always verify the excerpt against the actual lesson file before accepting a "not covered" judgment
- **Accepting empty excerpts without a cross-lesson search** — an empty `lessonExcerpt` means the generator failed to find grounding text, not that none exists. Always grep all lessons before concluding a question is beyond-lesson
- **Deleting instead of archiving** — always archive; questions may be useful when lessons are expanded
- **Ignoring the reference source** — if the topic isn't in a lesson, check the original EPPP reference files before archiving
- **Fixing only `needsReview` without fixing the comment** — inaccurate comments mislead future reviewers
