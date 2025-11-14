# Test Execution Checklist - Diagnostic Exam & Prioritizer System

## Quick Start
```bash
# Before testing - clear localStorage
localStorage.clear()

# Verify dev server is running
npm run dev
```

## Test 1: Diagnostic + Study Mode ✅

| Step | Verification | Status |
|------|-------------|--------|
| Navigate to exam-generator | Page loads, shows exam type cards | ⏳ |
| Click Diagnostic card | Step 2 appears, mode tabs visible | ⏳ |
| See "Recommended" badge | Blue badge on Diagnostic card | ⏳ |
| Click Study Mode tab | Study card content shows | ⏳ |
| Click "Start Diagnostic" button | Exam page loads with Q1 of 71 | ⏳ |
| Verify badges show | 🎯 Diagnostic + 📚 Study Mode | ⏳ |
| Select answer | Option highlights, turns green | ⏳ |
| Auto-show explanation | Explanation appears immediately | ⏳ |
| Click Next Question | Q2 loads smoothly, no lag | ⏳ |
| Navigate to Q71 | Last question shows | ⏳ |
| Click "Finish" | Routes to prioritizer | ⏳ |
| Verify top 3 domains | Shows ranked domains with scores | ⏳ |
| Expand domain | Shows wrong KNs and topics | ⏳ |
| Click topic | Routes to topic-teacher | ⏳ |
| localStorage check | `quizResults_diagnostic` exists | ⏳ |
| localStorage check | `priorityRecommendations_latest_diagnostic` exists | ⏳ |

**Issues Found**: (none yet)

---

## Test 2: Diagnostic + Test Mode ✅

| Step | Verification | Status |
|------|-------------|--------|
| Clear localStorage | Fresh start | ⏳ |
| Navigate to exam-generator | Both exam types visible | ⏳ |
| Click Diagnostic card | Step 2 appears | ⏳ |
| Click Test Mode tab | Test description shows | ⏳ |
| Click "Start Diagnostic" button | Exam loads with timer | ⏳ |
| Verify timer format | Shows HH:MM:SS format | ⏳ |
| Timer calculation | ~59 minutes (50 sec × 71 questions) | ⏳ |
| Select answer | No immediate green/red highlight | ⏳ |
| No auto-explanation | Explanation doesn't show | ⏳ |
| Click "Show Explanation" | Explanation appears on demand | ⏳ |
| Timer counts down | Decrements every second | ⏳ |
| Navigate questions | Timer persists across questions | ⏳ |
| Click Finish | Routes to prioritizer | ⏳ |
| Verify recommendations | Calculated from wrong answers | ⏳ |

**Issues Found**: (none yet)

---

## Test 3: Practice + Study Mode ✅

| Step | Verification | Status |
|------|-------------|--------|
| Clear localStorage | Fresh start | ⏳ |
| Navigate to exam-generator | Both exam types visible | ⏳ |
| Click Practice card | Step 2 appears | ⏳ |
| Verify default mode | "Study" mode is default selected | ⏳ |
| Click "Start Practice" button | Exam loads with Q1 of 225 | ⏳ |
| No timer visible | Timer doesn't show in Study mode | ⏳ |
| Select answer | Option highlights green immediately | ⏳ |
| Auto-show explanation | Explanation appears | ⏳ |
| Question progress | Shows "Question X of 225" | ⏳ |
| Question badges | Shows domain and difficulty | ⏳ |
| Some questions are unscored | Some have `isScored: false` attribute | ⏳ |
| Navigate through 10 questions | Smooth transitions | ⏳ |
| Click Finish | Routes to study-optimizer (NOT prioritizer) | ⏳ |
| Score calculation | Excludes unscored questions | ⏳ |

**Issues Found**: (none yet)

---

## Test 4: Practice + Test Mode ✅

| Step | Verification | Status |
|------|-------------|--------|
| Clear localStorage | Fresh start | ⏳ |
| Navigate to exam-generator | Both exam types visible | ⏳ |
| Click Practice card | Step 2 appears | ⏳ |
| Click Test Mode tab | Test description shows | ⏳ |
| Click "Start Practice" button | Exam loads with timer | ⏳ |
| Verify timer | Shows ~4.25 hours (68 sec × 225 questions) | ⏳ |
| Timer format | HH:MM:SS format | ⏳ |
| No immediate feedback | Answers don't highlight | ⏳ |
| Navigate several questions | Timer persists, updates correctly | ⏳ |
| Click Finish | Routes to study-optimizer | ⏳ |
| Verify score | Calculated correctly | ⏳ |

**Issues Found**: (none yet)

---

## Test 5: Dashboard Priority Badges ✅

| Step | Verification | Status |
|------|-------------|--------|
| Complete Diagnostic + Study | Exam finished, routed to prioritizer | ⏳ |
| Close prioritizer, go to dashboard | Dashboard loads | ⏳ |
| Look at Study card | Shows "Priority Focus" section | ⏳ |
| See badges | Shows #1, #2, #3 domain badges | ⏳ |
| Badge styling | Blue background, alert icon | ⏳ |
| Domain list | Orange ⚠️ icons on priority domains | ⏳ |
| Opacity change | Priority domains have full opacity | ⏳ |
| Normal domains | Remain at 60% opacity | ⏳ |
| Progress bars | Show correct percentages | ⏳ |

**Issues Found**: (none yet)

---

## Test 6: Topic Selector Priority Badges ✅

| Step | Verification | Status |
|------|-------------|--------|
| From dashboard, click Study card | Routes to topic-selector | ⏳ |
| Expand a domain | Topics list shows | ⏳ |
| Look for priority badges | Topics have "Priority" badge if recommended | ⏳ |
| Badge styling | Blue, with alert icon | ⏳ |
| Non-priority topics | No badge shown | ⏳ |
| Click priority topic | Routes to topic-teacher | ⏳ |
| Expand multiple domains | Only recommended topics have badges | ⏳ |

**Issues Found**: (none yet)

---

## Test 7: Default Selection Logic ✅

| Step | Verification | Status |
|------|-------------|--------|
| Clear localStorage | Fresh start | ⏳ |
| Go to exam-generator | Both cards visible | ⏳ |
| Check recommended badge | "Recommended" on Diagnostic card | ⏳ |
| Complete Diagnostic exam | Finish flow | ⏳ |
| Go back to exam-generator | Cards reset for next exam | ⏳ |
| Check recommended badge | "Recommended" now on Practice card | ⏳ |
| Verify mode default | "Study" mode is selected | ⏳ |
| Complete Practice + Study | Finish flow | ⏳ |
| Go back to exam-generator | Cards reset again | ⏳ |
| Check recommended | "Recommended" still on Practice | ⏳ |
| Verify mode default | "Test" mode is now selected | ⏳ |

**Issues Found**: (none yet)

---

## Browser Compatibility

| Browser | Test 1 | Test 2 | Test 3 | Test 4 | Test 5 | Test 6 | Test 7 | Status |
|---------|--------|--------|--------|--------|--------|--------|--------|--------|
| Chrome | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| Firefox | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| Safari | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |

---

## Data Integrity Checks

### localStorage Verification
```javascript
// After each exam completion, check:
console.log(localStorage.getItem('quizResults_diagnostic'))
console.log(localStorage.getItem('quizResults_practice'))
console.log(localStorage.getItem('priorityRecommendations_latest_diagnostic'))
console.log(localStorage.getItem('priorityRecommendations_latest_practice'))
```

### Custom Events
- [ ] "quiz-results-updated" fires on exam completion
- [ ] "priority-recommendations-updated" fires on diagnostic
- [ ] Dashboard re-renders without page refresh
- [ ] Priority badges update on topic-selector

---

## Console Check

After each test:
```javascript
// Should have NO errors or warnings related to:
// - undefined variables
// - failed imports
// - missing data
// - timer issues
```

---

## Performance Metrics

| Metric | Target | Status |
|--------|--------|--------|
| Exam page load time | < 2 sec | ⏳ |
| Question navigation | < 100ms | ⏳ |
| Prioritizer load time | < 1 sec | ⏳ |
| Priority calculation | < 500ms | ⏳ |
| No memory leaks | ✅ | ⏳ |

---

## Final Sign-Off

| Criterion | Status |
|-----------|--------|
| All 4 exam combinations work | ⏳ |
| Routing correct (prioritizer vs study-optimizer) | ⏳ |
| Default selection logic correct | ⏳ |
| Priority badges display correctly | ⏳ |
| No console errors | ⏳ |
| localStorage data persists | ⏳ |
| Custom events fire | ⏳ |
| Responsive design works | ⏳ |
| All animations smooth | ⏳ |
| Ready for production | ⏳ |

---

## Notes & Observations

### Test Run 1
- Date: [TBD]
- Browser: [TBD]
- Overall: [TBD]
- Critical Issues: [TBD]
- Minor Issues: [TBD]
