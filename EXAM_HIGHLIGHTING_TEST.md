# Testing Exam-Based Highlighting (Green Apple 🍏)

## What Was Changed

The Topic Teacher now automatically shows green apple emojis (🍏) next to sections where you got questions wrong in:
- ✅ Quizzes (already working)
- ✅ Diagnostic exams (NEW!)
- ✅ Practice exams (NEW!)

## How It Works

1. **Exam results are automatically saved** when you complete a diagnostic or practice exam
   - Stored in localStorage with key: `sectionResults_{topicName}`
   - Each wrong answer creates a section result entry

2. **Topic Teacher automatically checks** for wrong answers when you navigate to any topic
   - No URL parameters needed
   - Combines quiz + exam results
   - Shows green apples on matching sections

3. **Sections are highlighted** using fuzzy matching
   - Compares exam section names to topic content headers
   - Uses 25% similarity threshold
   - Green apples appear on paragraphs, lists, and ordered lists in those sections

## Testing Steps

### Test 1: Take a Diagnostic Exam

1. **Navigate to**: `/exam-generator`
2. **Select**: Diagnostic + Study (or Test)
3. **Take the exam**: Get at least 2-3 questions wrong intentionally
4. **Complete the exam**: Click "End Exam"
5. **Go to prioritizer**: You'll be redirected to `/prioritize`

### Test 2: Navigate to Topic Teacher

1. **From prioritizer**: Click "Start Studying" to go to topic selector
2. **Select a topic** you got questions wrong on (check your exam results)
3. **Navigate to Topic Teacher**: Click the topic name

### Test 3: Verify Highlighting

**Expected behavior:**
- Green apple message appears: "🍏 Highlighting sections where you got questions wrong: [section names]"
- Green apple emojis appear in the content next to relevant paragraphs/lists
- Sections that match your wrong answers are highlighted

**Debug if not working:**
1. Open browser DevTools → Console
2. Check for errors in topic-teacher-content.tsx
3. Verify localStorage has data:
   ```javascript
   localStorage.getItem('sectionResults_Classical Conditioning')
   // Should return JSON with section results
   ```

### Test 4: Multiple Sources

1. **Take a quiz** on the same topic (via `/quizzer`)
2. **Get different questions wrong**
3. **Return to Topic Teacher**
4. **Verify**: Both quiz AND exam wrong sections show green apples

## Current Limitations

**Section name matching:**
- Exam questions currently use placeholder section name "Main Content" (from exam-result-saver.ts line 74)
- This needs improvement to map questions to actual section headers
- For now, highlighting works best with quiz results which have proper section names

## File Changes Made

1. **`/src/lib/unified-question-results.ts`**
   - Added `getExamWrongSections()` helper function
   - Returns array of section names with wrong answers

2. **`/src/app/topic-teacher/topic-teacher-content.tsx`**
   - Loads exam results automatically (no URL params needed)
   - Merges quiz + exam wrong sections
   - Shows combined highlighting

3. **Generation prompts** (separate feature)
   - Tables now included in generated content
   - See Cognitive Development for examples

## Next Steps (Future Improvements)

1. **Improve section name mapping** in exam-result-saver.ts
   - Map exam questions to actual topic section headers
   - Replace "Main Content" with meaningful section names
   - Use AI to extract relevant section from question content

2. **Add Supabase sync**
   - Store section results in Supabase for cross-device sync
   - Currently only in localStorage

3. **Add "Resolve" functionality**
   - Allow users to mark sections as "learned"
   - Remove green apples when section is mastered

## Success Criteria

✅ Tables appear in newly generated content
✅ Green apples show for quiz wrong answers (existing)
✅ Green apples show for exam wrong answers (NEW)
✅ Both sources combine without duplicates
✅ No errors in browser console
