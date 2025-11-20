# Complete Exam Generation Guide

## Overview

The exam system generates high-quality practice exams with:
1. **Use Sonnet 4.5 AI model** - Superior quality, balanced token efficiency (~100k tokens per exam)
2. **Exclusive source material** - All 83 .md files from eppp-reference folder
3. **Complete source tracking** - Every question tagged with source file for topic selector/teacher
4. **Read from local filesystem** - Instant access without network latency
5. **Support 4 of each exam type** - 4 diagnostic exams (71 questions each) + 4 practice exams (225 questions each)

## What Makes These Exams Different

### ✅ Comprehensive Question Coverage
- Uses EXCLUSIVELY the 83 .md files in `/eppp-reference/` folder
- Covers all 71 Knowledge Statements (KNs) from the official EPPP Part 1 exam
- Follows official domain weight distributions from KNs.pdf
- Each question traced to source file for educational tracking

### ✅ Source File Tracking
- Every question includes `source_file` and `source_folder` metadata
- Enables Topic Selector to recommend specific .md files to study
- Allows Topic Teacher to highlight exact sentences from reference material
- Powers prioritization engine for targeted learning

### ✅ Organizational Psychology Integration
- Organizational psychology questions distributed across domains 2, 3, 5, 6
- Comprises 21% of all questions (~47 questions in 225-question exam)
- Tracked separately to show as 9th priority area if user struggles
- Links to all org psych .md files: 12 files in "2 3 5 6 Organizational Psychology" folder

### ✅ Question Type Distribution
- **60% Standard questions** (135 scored) - Core knowledge verification
- **20% Distinction questions** (45 scored) - Compare/contrast related concepts
- **20% Difficult questions** (45 unscored) - Obscure facts, subtle distinctions, complex integrations

### ✅ Domain Distribution
Following KNs.pdf official weights for 225-question practice exam:
- Domain 1 (Biological): 10% = 23 questions
- Domain 2 (Cognitive-Affective): 13% = 29 questions (7 org psych)
- Domain 3 (Social & Cultural): 11% = 25 questions (9 org psych)
- Domain 4 (Lifespan): 12% = 27 questions
- Domain 5 (Assessment & Diagnosis): 16% = 36 questions (9 org psych)
- Domain 6 (Treatment/Intervention): 15% = 34 questions (13 org psych)
- Domain 7 (Research & Statistics): 7% = 16 questions
- Domain 8 (Ethical/Legal): 16% = 35 questions
- **Org Psychology Total: 21% = 47 questions** (38 scored + 9 unscored)

## Exam Generation Instructions

### Generation Prompt

Use this exact prompt to generate exams with Claude Sonnet 4.5:

```
You are an expert EPPP (Part 1–Knowledge) exam generator and subject matter expert in psychology. Your task is to create a comprehensive, [71|225]-question multiple-choice practice exam from the eppp-reference folder.

Your generation of this exam must follow these rules precisely:

1. Exclusive Source Material
   - You must use ONLY the provided study material from eppp-reference as the exclusive source for generating all questions, correct answers, and incorrect answer choices (distractors)
   - Do not use any external knowledge
   - Every question must be traceable to a specific .md file in eppp-reference
   - Reference ALL 83 .md files across all domains
   - Ensure all 71 Knowledge Statements (KNs) are covered

2. Question Style, Length, and Difficulty
   - Format: Replicate these two sample questions:
     * "An organizational psychologist is hired by a company to determine if the performance of many of its recently hired employees can be improved by providing them with training. To do so, the psychologist will conduct a: A. performance appraisal. B. needs analysis. C. task analysis D. job evaluation."
     * "A psychologist developed a program for first-time parents that addresses methods of dealing with parenting stress and lifestyle changes and is open to all expectant parents in the community. This is an example of which of the following? A. primary prevention B. secondary prevention C. tertiary prevention D. quaternary prevention"
   - Stems: Concise and direct (1-2 sentences), direct
   - Choices: Brief (single terms or short phrases) and comparable in length so the correct answer is not noticeably longer than the distractors
   - No "All of the above" or "None of the above"
   - Keep each answer choice around the same length (max 7 character difference)
   - Make sure the correct answer is not always the longest choice. 

3. Question Distribution
   - 60% Standard questions: Core knowledge from eppp-reference
   - 20% Distinction questions: Compare/contrast related concepts, differences in application between similar approaches, selecting the most appropriate option between viable alternatives
   - 20% Difficult/Unscored questions: Obscure or secondary facts, extremely subtle distinctions, complex concept integration. MARK AS isScored: false

4. Domain Coverage (follow KNs.pdf percentages)
   [For practice exams: Distribute per domain percentages above, with org psych integrated]
   - Ensure coverage of all 71 KNs across all domains
   - Organizational psychology questions should be distributed in domains 2, 3, 5, 6 with approximately 21% total

5. Source File Tracking (CRITICAL)
   - Every question MUST include source_file and source_folder fields
   - source_file: Exact .md filename from eppp-reference
   - source_folder: Directory name containing the file
   - Example: source_file: "2 Theories of Motivation.md", source_folder: "2 3 5 6 Organizational Psychology"

6. Randomized Answers
   - Correct answers must be randomized across A, B, C, D positions
   - Approximately 25% in each position
   - Ensure distractors are plausible and come from the eppp-reference material

Output Format:
{
  "questions": [
    {
      "id": 1,
      "question": "...",
      "options": ["...", "...", "...", "..."],
      "correct_answer": "The actual option text",
      "explanation": "Why this answer is correct and why others are wrong",
      "domain": "Domain X: [Name]",
      "knId": "KNX",
      "source_file": "filename.md",
      "source_folder": "folder name",
      "difficulty": "easy|medium|hard",
      "question_type": "standard|distinction|difficult",
      "isScored": true|false,
      "is_org_psych": true|false
    },
    ...
  ]
}
```

### How to Generate

1. **Start the development server:**
   ```bash
   npm run dev
   # Server runs on http://localhost:3000
   ```

2. **Generate practice exam using Claude directly:**
   - Use Claude Sonnet 4.5
   - Paste the generation prompt above
   - Provide the full content of all 83 .md files from eppp-reference/
   - Request 225 questions for practice exam or 71 for diagnostic
   - Takes approximately 5-10 minutes to generate

3. **Or use the API endpoint (future implementation):**
   ```bash
   curl -X POST http://localhost:3000/api/pre-generate-exam \
     -H "Content-Type: application/json" \
     -d '{"userId":"exam-gen-1","examType":"practice"}'
   ```

4. **Validate the generated JSON:**
   - Verify all questions have source_file fields
   - Check question count matches (71 or 225)
   - Validate domain distribution
   - Ensure all 71 KNs are represented
   - Confirm org psych questions marked with is_org_psych: true

5. **Save to local filesystem:**
   Save to `exams/practice/practice-exam-001.md` with frontmatter:
   ```yaml
   ---
   exam_id: practice-exam-001
   exam_type: practice
   generated_at: 2025-11-17T12:00:00Z
   question_count: 225
   version: 3
   format: full
   ---
   ```

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

## Exam File Format (NEW: Version 3 with Source Tracking)

Each exam file should follow this structure:

```markdown
---
exam_id: practice-exam-001
exam_type: practice
generated_at: 2025-11-17T12:00:00Z
question_count: 225
version: 3
format: full
---

{
  "questions": [
    {
      "id": 1,
      "question": "An organizational psychologist is hired by a company to determine if the performance of many of its recently hired employees can be improved by providing them with training. To do so, the psychologist will conduct a:",
      "options": [
        "performance appraisal",
        "needs analysis",
        "task analysis",
        "job evaluation"
      ],
      "correct_answer": "needs analysis",
      "explanation": "A needs analysis is the appropriate tool for determining whether training would improve employee performance. A performance appraisal evaluates current performance, while task and job analyses examine job requirements.",
      "domain": "Domain 6: Treatment, Intervention, Prevention",
      "knId": "KN46",
      "source_file": "5 6 Training Methods and Evaluation.md",
      "source_folder": "2 3 5 6 Organizational Psychology",
      "difficulty": "medium",
      "question_type": "standard",
      "isScored": true,
      "is_org_psych": true
    },
    {
      "id": 2,
      "question": "A psychologist developed a program for first-time parents that addresses methods of dealing with parenting stress and lifestyle changes and is open to all expectant parents in the community. This is an example of which of the following?",
      "options": [
        "primary prevention",
        "secondary prevention",
        "tertiary prevention",
        "quaternary prevention"
      ],
      "correct_answer": "primary prevention",
      "explanation": "Primary prevention targets entire populations before problems occur. This universal program for expectant parents prevents problems before they develop. Secondary prevention addresses early symptoms, tertiary treats established disorders.",
      "domain": "Domain 6: Treatment, Intervention, Prevention",
      "knId": "KN43",
      "source_file": "6 Prevention, Consultation, and Psychotherapy Research.md",
      "source_folder": "6 Treatment, Intervention, and Prevention : Clinical Psychology",
      "difficulty": "easy",
      "question_type": "standard",
      "isScored": true,
      "is_org_psych": false
    },
    // ... more questions (225 total) ...
    {
      "id": 225,
      "question": "Which of the following is the most obscure application of the false consensus effect in organizational decision-making when combined with temporal discounting?",
      "options": ["...", "...", "...", "..."],
      "correct_answer": "...",
      "explanation": "...",
      "domain": "Domain 2: Cognitive-Affective Bases",
      "knId": "KN14",
      "source_file": "3 Social Cognition – Errors, Biases, and Heuristics.md",
      "source_folder": "3 Social Psychology",
      "difficulty": "hard",
      "question_type": "difficult",
      "isScored": false,
      "is_org_psych": false
    }
  ]
}
```

### Important Requirements:

**Question Count:**
- **Diagnostic exams**: Exactly 71 questions
- **Practice exams**: Exactly 225 questions (180 scored + 45 unscored)

**Source Tracking (REQUIRED):**
- Every question MUST have `source_file` field with exact .md filename
- Every question MUST have `source_folder` field with directory name
- Enables Topic Selector and Topic Teacher to track and display source material

**Organizational Psychology (REQUIRED):**
- Mark all organizational psychology questions with `is_org_psych: true`
- Should comprise ~21% of questions (47 questions in 225-question exam)
- Distributed across domains 2, 3, 5, 6

**Question Types:**
- `question_type`: "standard" (60%), "distinction" (20%), "difficult" (20%)
- Difficult questions MUST have `isScored: false`

**Answers:**
- Correct answers must be randomized across positions (25% each: A, B, C, D)
- `correct_answer` field contains actual option text, NOT A/B/C/D
- All distractors must come from eppp-reference material

**Domain Format:**
- Include full domain name: "Domain X: [Full Name]"
- Must match one of the 8 official EPPP domains

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
