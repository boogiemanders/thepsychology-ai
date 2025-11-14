# Testing Guide: Diagnostic Exam & Prioritizer System

## Overview
This guide covers testing all 4 exam combinations and the complete exam → prioritizer flow.

## Test Setup

### Prerequisites
- Clear browser localStorage: `localStorage.clear()`
- Test in incognito mode for clean state
- Use browser DevTools to verify localStorage and events

## Test Scenarios

### Test 1: Diagnostic + Study Mode ✓
**Expected Behavior**: User should be able to take 71-question diagnostic exam with immediate feedback

**Steps**:
1. Navigate to `/tools/exam-generator`
2. Verify initial state shows both exam type cards (Diagnostic, Practice)
3. Click "Diagnostic Exam" card
4. Verify Step 2 appears with Mode selection (Study, Test)
5. Verify "Recommended" badge shows on Diagnostic card (first time)
6. Click "Study Mode" tab
7. Click "Start Diagnostic - Study Mode"
8. Verify exam loads with 71 questions
9. Verify badges show "🎯 Diagnostic" and "📚 Study Mode"
10. Select an answer
11. Verify explanation shows immediately (Study Mode behavior)
12. Click "Next Question"
13. Verify smooth navigation through all 71 questions
14. On last question, verify "Finish & Analyze Results" button appears
15. Click "Finish & Analyze Results"
16. Verify:
    - Route to `/tools/prioritizer`
    - Display top 3 priority domains
    - Show wrong KNs for each domain
    - Display recommended topics
    - Can expand each domain to see details

**Verify localStorage**:
```javascript
// In browser console
localStorage.getItem('quizResults_diagnostic') // Should exist
localStorage.getItem('priorityRecommendations_latest_diagnostic') // Should exist
```

**Verify localStorage events**:
- Should see "quiz-results-updated" custom event
- Should see "priority-recommendations-updated" custom event

---

### Test 2: Diagnostic + Test Mode
**Expected Behavior**: Timed exam with no immediate feedback, all answers shown at end

**Steps**:
1. Clear localStorage: `localStorage.clear()`
2. Navigate to `/tools/exam-generator`
3. Click "Diagnostic Exam" card
4. Click "Test Mode" tab
5. Click "Start Diagnostic - Test Mode"
6. Verify exam loads with timer (50 sec/question × 71 questions = ~59 minutes)
7. Verify timer counts down in corner
8. Verify selected answers DON'T show green/red immediately
9. Select multiple answers without explanation showing
10. Click "Show Explanation" button to verify it appears
11. Navigate through several questions
12. Click "Finish & Analyze Results" on last question
13. Verify:
    - Route to prioritizer with results
    - Priority recommendations generated correctly
    - Wrong answers identified properly

**Verify timer functionality**:
- Should show time remaining
- Should warn when time < 5 minutes
- Should format as HH:MM:SS

---

### Test 3: Practice + Study Mode
**Expected Behavior**: 225-question exam with immediate feedback

**Steps**:
1. Navigate to `/tools/exam-generator`
2. Click "Practice Exam" card
3. Verify "Recommended" badge appears (should be Practice since Diagnostic was taken)
4. Click "Study Mode" tab
5. Click "Start Practice - Study Mode"
6. Verify exam loads with 225 questions
7. Verify timer is NOT showing (Study Mode)
8. Select answer and verify immediate green/red feedback
9. Verify explanation shows automatically in Study Mode
10. Navigate through questions (verify some might be marked "isScored: false" for unscored experimental questions)
11. Click "Finish & Analyze Results"
12. Verify route to `/tools/study-optimizer` (NOT prioritizer for practice exams)
13. Verify score calculation excludes unscored questions

---

### Test 4: Practice + Test Mode
**Expected Behavior**: Full timed 225-question exam simulation

**Steps**:
1. Navigate to `/tools/exam-generator`
2. Click "Practice Exam" card
3. Click "Test Mode" tab
4. Click "Start Practice - Test Mode"
5. Verify exam loads
6. Verify timer showing (68 sec/question × 225 questions = ~4.25 hours)
7. Verify no immediate feedback
8. Navigate through several questions
9. Click "Finish & Analyze Results"
10. Verify route to `/tools/study-optimizer`

---

## Cross-App Integration Tests

### Test 5: Dashboard Priority Badges
**Steps**:
1. Complete Diagnostic + Study exam (Test 1)
2. Navigate to `/dashboard`
3. Verify "Study" bento card shows:
   - "Priority Focus" section at top
   - Top 3 domains with badges (#1, #2, #3)
   - Orange alert icons next to priority domains in progress list
   - Increased opacity for priority domains

**Expected Results**:
```
Priority Focus
[#1: Assessment...] [#2: Treatment...] [#3: Ethical...]

Domain List with orange alerts:
⚠️ Assessment, Diagnosis & Psychopathology
⚠️ Treatment & Intervention
⚠️ Ethical, Legal & Professional Issues
(others with normal opacity)
```

---

### Test 6: Topic Selector Priority Badges
**Steps**:
1. From dashboard, click "Study" bento → goes to `/tools/topic-selector`
2. Expand first priority domain
3. Verify topics have "Priority" badge with alert icon if recommended
4. Verify other topics don't have badge
5. Click on a priority topic → should route to topic-teacher
6. Verify badge styling matches design

---

### Test 7: Default Selection Logic
**Steps**:

**First Visit**:
1. Clear localStorage
2. Go to `/tools/exam-generator`
3. Verify both exam type cards visible
4. Verify "Recommended" badge shows on Diagnostic

**After Diagnostic**:
1. Complete Diagnostic exam
2. Go back to `/tools/exam-generator`
3. Verify cards show again
4. Verify "Recommended" badge now shows on Practice card
5. Verify mode defaults to "Study"

**After Practice Study**:
1. Complete Practice + Study exam
2. Go back to `/tools/exam-generator`
3. Verify "Recommended" now on Practice card
4. Verify mode defaults to "Test"

---

## Bug Checklist

### UI/UX Issues
- [ ] Step 2 mode selection only appears after clicking exam type
- [ ] "Back to Exam Selection" button works and resets state
- [ ] Progress bar on exam card shows correct progress
- [ ] Domain/question badges display correctly
- [ ] Navigation between questions works smoothly
- [ ] Timer updates properly in real-time
- [ ] Time warning triggers at < 5 minutes
- [ ] Auto-submit on time expiration works

### Data Issues
- [ ] Exam history saves to localStorage correctly
- [ ] Priority recommendations calculate correctly
- [ ] Wrong answers properly identified
- [ ] Domain scores accurate (% wrong calculated correctly)
- [ ] Scored vs unscored questions handled correctly
- [ ] LocalStorage doesn't corrupt on repeated exams

### Integration Issues
- [ ] Custom events fire on exam completion
- [ ] Dashboard updates without page refresh
- [ ] Topic selector shows correct badges
- [ ] Prioritizer loads data from URL params or localStorage
- [ ] Clicking topic from prioritizer routes correctly
- [ ] Default selection logic works across visits

### Edge Cases
- [ ] Skip all questions then finish (0% score)
- [ ] Answer all questions correctly (100% score)
- [ ] Browser back button during exam (data preserved)
- [ ] Page refresh during exam (state restored)
- [ ] Take multiple exams in sequence
- [ ] Rapid mode switching before starting

---

## Performance Checklist

- [ ] Exam loads within 2 seconds
- [ ] Questions navigate without lag
- [ ] Timer updates smoothly (no CPU spike)
- [ ] 71 KN data loads quickly
- [ ] Prioritizer calculates in < 1 second
- [ ] No memory leaks (check DevTools)

---

## Accessibility Checklist

- [ ] All buttons keyboard accessible (Tab key)
- [ ] Color contrast meets WCAG AA standard
- [ ] Focus indicators visible
- [ ] Modal dialogs have proper focus management
- [ ] Timer is announced to screen readers

---

## Test Results Template

For each test, record:
```
Test [N]: [Scenario Name]
Date: [Date]
Browser: [Chrome/Firefox/Safari/Edge]
Status: [PASS/FAIL]
Issues Found: [List any bugs]
Notes: [Additional observations]
```

---

## Success Criteria

All tests should pass:
- ✅ All 4 exam combinations load and function
- ✅ Exam completion routes correctly
- ✅ Priority badges appear on dashboard and topic-selector
- ✅ Default selection logic works across visits
- ✅ No console errors
- ✅ Data persists correctly
- ✅ Custom events fire properly
- ✅ No memory leaks
