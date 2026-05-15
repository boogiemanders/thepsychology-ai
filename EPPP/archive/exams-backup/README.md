# EPPP Exam Files

This directory contains pre-generated EPPP exam questions stored as Markdown files with JSON content.

## Directory Structure

```
exams/
├── diagnostic/       # Diagnostic exams (71 questions each)
│   ├── diagnostic-2025-01-14.md
│   ├── diagnostic-2025-01-13.md
│   └── diagnostic-2025-01-12.md
└── practice/         # Practice exams (225 questions each)
    ├── practice-exam-001.md
    ├── practice-exam-002.md
    └── practice-exam-003.md
```

## File Format

Each exam file uses the following format:

### Frontmatter (YAML metadata)
```yaml
---
exam_id: diagnostic-2025-01-14
exam_type: diagnostic
generated_at: 2025-01-14T10:30:00Z
question_count: 71
version: 1
---
```

### Body (JSON questions)
```json
{
  "questions": [
    {
      "id": 1,
      "question": "Question text here...",
      "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
      "correct_answer": "Option A text",
      "explanation": "Why this is correct...",
      "domain": "Domain 1",
      "difficulty": "medium",
      "knId": "KN1",
      "isScored": true
    },
    ...
  ]
}
```

## Naming Convention

- **Diagnostic exams**: `diagnostic-YYYY-MM-DD.md` (timestamped)
- **Practice exams**: `practice-exam-XXX.md` (numbered)

## Version Control

Exam files are version controlled in Git:
- Each new exam generation creates a new file
- Old exams are kept in Git history for reference
- Users can only review exams they've already taken
- Typically 2-3 exams of each type are kept available at any time

## Exam Pool Management

The system maintains a rolling cache:
- **Target**: 2 diagnostic + 2 practice exams ready
- **Generation**: New exams are generated when pool is low
- **Cleanup**: Oldest exams are removed when pool exceeds limit
- **Fallback**: If no pre-generated exams available, exams are generated on-demand

## Adding a New Exam File

1. Generate exam questions via the Claude API
2. Format with frontmatter metadata
3. Save to appropriate directory with timestamp
4. Commit to Git: `git add exams/{type}/{filename}.md && git commit -m "Add {type} exam {filename}"`
5. Push to GitHub: `git push origin main`

## Fetching Exams

The application fetches exams in this order:

1. **Check GitHub**: Fetch pre-generated exam via `/api/fetch-exam-from-github`
2. **Assign to user**: Create assignment record via `/api/assign-exam`
3. **Fallback**: If no pre-generated exam available, generate on-demand via `/api/exam-generator`

Users are tracked in `user_exam_assignments` table to prevent them from taking the same exam twice.
