# Complete Exam Generation Guide

## Overview

The exam system has been updated to:
1. **Use Opus AI model** - Better quality and larger context window (128k tokens)
2. **Read from local filesystem** - Instant access without network latency
3. **Support 4 of each exam type** - 4 diagnostic exams (71 questions each) + 4 practice exams (225 questions each)

## What Was Fixed

### ✅ API Route Updates
- Updated `/api/pre-generate-exam` to use Claude Opus with 128k token limit
- Increased from Haiku (16k tokens) to Opus (128k tokens) for complete exams
- Updated prompts to emphasize all questions must be generated (no partial exams)

### ✅ Exam Loading System
- Switched from GitHub network fetching to local filesystem reading
- Removed 200-500ms network latency
- Now reads from `exams/diagnostic/` and `exams/practice/` directories
- Added security validation for file names

### ✅ Exam File List
- Updated `getAvailableExamFilesList()` to expect 4 of each exam type
- New naming convention: `diagnostic-exam-001.md` through `diagnostic-exam-004.md`
- Same for practice: `practice-exam-001.md` through `practice-exam-004.md`

## How to Generate Complete Exams

### Option 1: Generate via API Endpoint (Recommended)

1. **Start the development server:**
   ```bash
   npm run dev
   # Server runs on http://localhost:3000
   ```

2. **Generate all 8 exams:**
   Use the provided generation script (requires Node.js + ts-node):
   ```bash
   npx ts-node scripts/generate-all-exams.ts
   ```

   OR manually call the API 8 times using curl:

   **Diagnostic Exams (71 questions each):**
   ```bash
   curl -X POST http://localhost:3000/api/pre-generate-exam \
     -H "Content-Type: application/json" \
     -d '{"userId":"exam-gen-1","examType":"diagnostic"}'

   curl -X POST http://localhost:3000/api/pre-generate-exam \
     -H "Content-Type: application/json" \
     -d '{"userId":"exam-gen-2","examType":"diagnostic"}'

   curl -X POST http://localhost:3000/api/pre-generate-exam \
     -H "Content-Type: application/json" \
     -d '{"userId":"exam-gen-3","examType":"diagnostic"}'

   curl -X POST http://localhost:3000/api/pre-generate-exam \
     -H "Content-Type: application/json" \
     -d '{"userId":"exam-gen-4","examType":"diagnostic"}'
   ```

   **Practice Exams (225 questions each):**
   ```bash
   curl -X POST http://localhost:3000/api/pre-generate-exam \
     -H "Content-Type: application/json" \
     -d '{"userId":"exam-gen-1","examType":"practice"}'

   curl -X POST http://localhost:3000/api/pre-generate-exam \
     -H "Content-Type: application/json" \
     -d '{"userId":"exam-gen-2","examType":"practice"}'

   curl -X POST http://localhost:3000/api/pre-generate-exam \
     -H "Content-Type: application/json" \
     -d '{"userId":"exam-gen-3","examType":"practice"}'

   curl -X POST http://localhost:3000/api/pre-generate-exam \
     -H "Content-Type: application/json" \
     -d '{"userId":"exam-gen-4","examType":"practice"}'
   ```

3. **Exams are saved to Supabase:**
   The API generates exams and saves them to the `pre_generated_exams` table in Supabase
   - Expires after 7 days
   - Marked as unused
   - Can be retrieved by the exam system

4. **Move exams to local filesystem:**
   Once generated in Supabase, export them and save to:
   - `exams/diagnostic/diagnostic-exam-001.md`
   - `exams/diagnostic/diagnostic-exam-002.md`
   - `exams/diagnostic/diagnostic-exam-003.md`
   - `exams/diagnostic/diagnostic-exam-004.md`
   - `exams/practice/practice-exam-001.md`
   - `exams/practice/practice-exam-002.md`
   - `exams/practice/practice-exam-003.md`
   - `exams/practice/practice-exam-004.md`

### Option 2: Manual Database Export

If you have exams already in Supabase's `pre_generated_exams` table:

1. Query the Supabase table:
   ```sql
   SELECT exam_id, exam_type, questions FROM pre_generated_exams
   WHERE used = FALSE AND exam_type IN ('diagnostic', 'practice')
   ORDER BY created_at DESC
   LIMIT 8;
   ```

2. Export the questions JSON and format into .md files with frontmatter:
   ```yaml
   ---
   exam_id: diagnostic-exam-001
   exam_type: diagnostic
   generated_at: 2025-01-15T10:30:00Z
   question_count: 71
   version: 1
   ---

   {
     "questions": [
       { "id": 1, "question": "...", ... },
       { "id": 2, "question": "...", ... },
       ...
       { "id": 71, "question": "...", ... }
     ]
   }
   ```

3. Save to `exams/` directory with proper naming

## Exam File Format

Each exam file should follow this structure:

```markdown
---
exam_id: diagnostic-exam-001
exam_type: diagnostic
generated_at: 2025-01-15T10:30:00Z
question_count: 71
version: 1
---

{
  "questions": [
    {
      "id": 1,
      "question": "What is...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option A",
      "explanation": "Explanation of why Option A is correct...",
      "domain": "Domain 1",
      "difficulty": "easy|medium|hard",
      "isScored": true,
      "knId": "KN1"
    },
    // ... more questions ...
    {
      "id": 71,
      "question": "...",
      ...
    }
  ]
}
```

### Important Requirements:
- **Diagnostic exams**: Must have exactly 71 questions
- **Practice exams**: Must have exactly 225 questions (180 scored + 45 unscored)
- **Correct answers**: Must be randomized across positions (roughly 25% in each position A-D)
- **Correct answer field**: Must contain the actual option text, not A/B/C/D
- **IDs**: Must be sequential from 1 to N

## Expected Performance After Generation

Once complete exams are saved to local filesystem:

| Metric | Before | After |
|--------|--------|-------|
| **Initial exam load** | 30-60 seconds | <100ms |
| **Subsequent loads** | 30-60 seconds | <10ms |
| **Network dependency** | GitHub API | Local filesystem |
| **Fallback generation** | Frequent | Never (if all questions present) |

## Troubleshooting

### Issue: "Exam file not found"
**Solution**: Ensure the .md file exists in the correct directory:
- `exams/diagnostic/diagnostic-exam-001.md`
- `exams/practice/practice-exam-001.md`

### Issue: API returns partial exam (< 71/225 questions)
**Solution**:
- Check logs for token limit issues
- Increase generation timeout in browser (Opus can take 2-3 minutes per exam)
- Try again - API might have hit rate limits
- Verify Anthropic API key has sufficient quota

### Issue: Questions are incomplete or corrupted
**Solution**:
- Check JSON is valid (`{...}` properly closed)
- Verify all questions have required fields: id, question, options, correct_answer, explanation, domain, difficulty
- Count questions matches declaration (71 or 225)
- Use online JSON validator if unsure

## Next Steps

1. ✅ API is ready to generate complete exams
2. ⏳ Generate 4 diagnostic + 4 practice exams
3. ⏳ Save .md files to `exams/` directories
4. ✅ System will load them from local filesystem instantly
5. ✅ No more waiting for AI generation

Once exams are in place, users will get instant exam access on every load!

## Questions?

Check the logs for detailed error messages:
```bash
# Development server logs show exam loading details
npm run dev

# Look for: "[Exam Load]" prefix for loading information
# Look for: "[Pre-Gen]" prefix for generation information
```
