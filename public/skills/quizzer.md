---
name: eppp-quizzer
description: Generates adaptive 10-question quizzes (8 regular + 2 unscored difficult) from EPPP topic .md files after users complete learning from eppp-topic-teacher. Tracks performance across attempts, repeats missed questions with shuffled answers, generates new questions for mastered concepts, and updates performance data for smart highlighting in the teacher skill. Pass threshold is 8/8 regular questions (100%). Provides empathetic feedback that validates reasoning before clarifying. Passing marks topic complete for eppp-topic-selector; failing returns to teacher with targeted review. Tracks both correct and incorrect answers for complete highlighting (fading mastered content).
---

# EPPP Topic Quizzer - Adaptive Assessment with Empathetic Feedback

## Overview

This skill generates adaptive 10-question quizzes to assess mastery after using the **eppp-topic-teacher** skill. The quiz intelligently:

1. **Generates 10 questions** from the same .md file used for studying (8 regular + 2 difficult unscored)
2. **Tracks performance** across multiple attempts per topic
3. **Adapts questions** based on previous attempts:
   - Repeats questions you got wrong (with shuffled answer choices)
   - Generates NEW questions for concepts you've mastered
4. **Provides empathetic feedback** that validates your reasoning before explaining the correct answer
5. **Updates highlighting** for the teacher skill based on ALL results (wrong = highlight, right = fade)
6. **Marks completion** when passing (8/8 or 100% on regular questions)

### Pass/Fail Threshold

- **Regular questions**: 8 questions that count toward your score
- **Unscored questions**: 2 extremely difficult questions (experimental, don't affect pass/fail)
- **Passing requirement**: 8/8 correct (100%) on regular questions
- **If you pass**: Topic marked complete → directed to **eppp-topic-selector**
- **If you fail**: Get empathetic, targeted review → return to **eppp-topic-teacher** with specific sections highlighted

### NEW: Empathetic Feedback System

**For wrong answers**, feedback now includes:
1. **Gentle validation** - Why your answer makes sense/is a reasonable choice
2. **Clarification** - What the key distinction is
3. **Correct explanation** - Why the right answer is correct
4. **Memory aid** - How to remember this going forward

**For correct answers**:
- Positive reinforcement
- Tracked for teacher's **fading feature** (mastered content appears faded/gray on rereads)

## Integration with Study Workflow

This skill is part 5 in the complete EPPP study system:

```
1. eppp-exam-generator → Take practice exam
2. eppp-study-optimizer → Analyze results, get recommendations  
3. eppp-topic-selector → Choose which topic to study
4. eppp-topic-teacher → Learn with smart highlights
5. eppp-quizzer → Take 10-question quiz (THIS SKILL)
   ├─ Pass (8/8) → Mark complete → eppp-topic-selector
   └─ Fail (<8/8) → Empathetic review → eppp-topic-teacher
6. Repeat until all topics mastered
```

**Complete Feedback Loop**: 
- Quiz results → Update performance data
- Both correct AND incorrect tracked
- Next teacher session shows:
  - **Strong yellow** = Recently wrong
  - **Faded/gray** = Recently correct (mastered)

## EPPP Guts Folder Organization

### Current Structure (11-03-2025 version)

The EPPP reference materials use this folder name: `EPPP Guts 11-03-2025`

**Organizational Psychology** has been reorganized:
- **Folder name**: `2 3 5 6 Organizational Psychology`
- This indicates the folder contains topics from domains 2, 3, 5, and 6

**Domain-Numbered Files**:
Files now begin with number(s) indicating which domain(s) they belong to:

Examples:
- `5 6 Job Analysis and Performance Assessment.md` → Domains 5 and 6
- `2 3 Satisfaction, Commitment, and Stress.md` → Domains 2 and 3
- `2 Theories of Motivation.md` → Domain 2 only
- `6 Career Choice and Development.md` → Domain 6 only

**Why This Matters**:
- Some topics appear in multiple domains (cross-domain concepts)
- Single source file prevents duplicate content
- Quiz generator automatically handles domain-numbered filenames
- Topics are accessible from any of their associated domains

**Other Domain Folders** (unchanged):
- `1 Biological Bases of Behavior`
- `2 Cognitive-Affective Bases`
- `3 Cultural`
- `3 Social Psychology`
- `4 Growth & Lifespan Development`
- `5 Assessment`
- `5 Diagnosis : Psychopathology`
- `5 Test Construction`
- `6 Treatment, Intervention, and Prevention`
- `7 Research Methods & Statistics`
- `8 Ethical : Legal : Professional Issues`

## Quick Start

### Basic Usage

**When user finishes learning a topic:**
```
User: "I'm ready to take the quiz on Operant Conditioning"
```

**Your Response Flow:**
1. Load the topic's .md file
2. Check quiz history for this topic
3. Generate 10 questions (8 regular + 2 difficult)
   - Adapt based on previous attempts
4. Present quiz to user
5. Grade and provide empathetic detailed feedback
6. Update performance tracking (both correct AND incorrect)
7. Direct to next step (selector or teacher)

## Core Process - Implementation Steps

### Step 1: Load Topic and Check History

```python
from scripts.quiz_generator import QuizGenerator
from scripts.performance_tracker import QuizPerformanceTracker

# Initialize with path to EPPP Guts folder
# NOTE: Use "EPPP Guts 11-03-2025" or the current version
quiz_gen = QuizGenerator("/mnt/user-data/uploads/EPPP Guts 11-03-2025")
tracker = QuizPerformanceTracker()

# Load topic
topic_name = "Operant Conditioning"
topic_file = quiz_gen.find_topic_file(topic_name)
content = quiz_gen.load_topic_content(topic_file)

# Check history
quiz_history = tracker.get_quiz_history(topic_name)
```

### Important: EPPP Guts Folder Structure

The EPPP Guts folder has been reorganized with:
- **Organizational Psychology** files now in folder: `2 3 5 6 Organizational Psychology`
- **Domain-numbered files**: Files begin with numbers indicating which domain(s) they belong to
  - Example: `5 6 Job Analysis and Performance Assessment.md` is in domains 5 and 6
  - Example: `2 3 Satisfaction, Commitment, and Stress.md` is in domains 2 and 3
  
This structure allows topics to appear in multiple domains while maintaining a single source file.

### Step 2: Generate Adaptive Questions

```python
# Generate quiz with adaptive logic
questions = quiz_gen.generate_adaptive_quiz(
    topic_name=topic_name,
    content=content,
    quiz_history=quiz_history,
    num_regular=8,
    num_difficult=2
)
```

**Adaptive Logic:**
- **First attempt**: All new questions
- **Subsequent attempts**:
  - Questions previously WRONG → Repeat with shuffled answers
  - Questions previously RIGHT → Generate NEW question on that concept

### Step 3: Present Quiz to User

Display quiz with clear formatting showing question type and numbering.

### Step 4: Grade and Provide Empathetic Feedback

```python
# Collect user answers
user_answers = {1: "B", 2: "A", 3: "C", ...}

# Grade
results = quiz_gen.grade_quiz(questions, user_answers)
```

**CRITICAL**: For EACH question, provide empathetic feedback using the pattern below.

### Step 5: Update Performance Data (Both Correct AND Incorrect)

```python
# Record quiz attempt - tracks EVERYTHING
tracker.record_quiz_attempt(
    topic=topic_name,
    questions=questions,
    user_answers=user_answers,
    results=results
)
```

This automatically:
- Saves quiz history for adaptive generation
- **Updates concept performance for BOTH correct and incorrect answers**
- **Enables teacher fading for mastered concepts**
- Marks completion status if passed

### Step 6: Direct to Next Step

**If passed (8/8):**
```python
from scripts.completion_manager import mark_topic_complete, display_success_message

mark_topic_complete(topic_name)
print(display_success_message(topic_name, results))
# → Directs to eppp-topic-selector
```

**If failed (<8/8):**
```python
from scripts.completion_manager import generate_review_targets, display_review_message

review_targets = generate_review_targets(results, content)
print(display_review_message(topic_name, results, review_targets))
# → Directs back to eppp-topic-teacher with highlighted sections
```

## Empathetic Feedback Format

### For INCORRECT Answers - Required Pattern

**ALWAYS follow this exact structure for wrong answers:**

```markdown
### ❌ Question 5: Incorrect

**Your Answer**: B) Negative punishment

**Correct Answer**: D) Negative reinforcement

---

**I can see why you chose that!** Negative punishment and negative reinforcement both involve something being *removed* or taken away, so it's really easy to mix them up. Your reasoning makes total sense - you saw something being removed and thought "negative punishment." That's a super common mistake even experienced students make!

**Here's the key distinction:**
The critical difference is what happens to the *behavior* afterward:
- **Punishment** (what you chose) → Behavior *decreases* ⬇️
- **Reinforcement** (correct answer) → Behavior *increases* ⬆️

**Why the correct answer is right:**
In this scenario, the person's hand-washing behavior *increased* after their anxiety (the aversive feeling) was removed. When behavior goes UP because something unpleasant is taken away, that's **negative reinforcement**.

Your choice (negative punishment) would mean the behavior *decreased* after something good was removed - like taking away someone's phone (removing something pleasant) so they stop staying out late (behavior decreases).

**Memory Tip:**
- Reinforcement = behavior **goes UP** ⬆️ (think: you're *reinforcing* the building, making it stronger)
- Punishment = behavior **goes DOWN** ⬇️
- Positive = **ADD** something ➕
- Negative = **REMOVE** something ➖

**Review Section**: Go back to "Negative Reinforcement vs Negative Punishment" in your study materials (Section 2.2)
```

**Key Elements of Empathetic Feedback:**
1. ✅ **Validation first** - "I can see why..." / "That makes sense because..."
2. ✅ **Acknowledge the confusion** - Explain why it's a common mistake
3. ✅ **Clear distinction** - Explain the key difference simply
4. ✅ **Correct explanation** - Why the right answer works
5. ✅ **Memory aid** - Concrete way to remember
6. ✅ **Review guidance** - Where to study more

### For CORRECT Answers - Positive Pattern

```markdown
### ✅ Question 3: Correct! 

**Your Answer**: A) Positive reinforcement

**Great work!** You correctly identified that adding something desirable (the treat) to increase behavior (sitting) is positive reinforcement. You nailed the distinction!

**Why this is right:**
Positive reinforcement increases behavior by *adding* something the subject wants. The dog sits more often because treats are added as a consequence.

**Key Point to Remember**: 
"Positive" means *adding* something (not necessarily pleasant), and "reinforcement" means the behavior *increases*. You've got this concept down!

---

*Note: This concept will appear faded/gray when you review this topic, since you've demonstrated mastery.*
```

## Question Generation Specifications

### Regular Questions (8 total, graded)

- **Source**: Main concepts from the .md file
- **Difficulty**: Standard EPPP level
- **Format**: Multiple choice with 4 options
- **Coverage**: Distributed across major concepts
- **Clarity**: Clear, unambiguous stems

### Difficult Questions (2 total, unscored)

- **Source**: Advanced/integrative concepts from .md file
- **Difficulty**: Significantly harder
- **Purpose**: Challenge and exposure, NOT grading
- **Marked**: Clearly labeled as "unscored"
- **User knows**: These don't affect pass/fail

## Teacher Skill Highlighting Integration

### How Highlighting Works Based on Quiz Results

The performance tracker updates data that the teacher skill uses for highlighting:

**Question WRONG in quiz** → 
- Tracked with timestamp
- Next teacher session: **Strong yellow highlight** (if recent) or **Medium yellow** (if older)
- Section gets extra attention in teaching

**Question RIGHT in quiz** →
- Tracked with timestamp
- Next teacher session: **Faded/gray text** (mastered content)
- User can skip or skim this section

**Never tested** →
- Normal text (no highlight, no fading)
- Taught as usual

### Complete Highlighting System

After quiz completion, the teacher skill will show:

```
🔴 Strong Yellow = Recently wrong (0-7 days) - Focus here!
🟡 Medium Yellow = Previously wrong (7-30 days) - Review this
🟢 Light Green = Improving (was wrong, now right) - Quick check
⚪ Faded/Gray = Consistently correct - Can skip
⬜ Normal = Never tested - Standard teaching
```

## Success Messages

### Passing Message (8/8)

```markdown
# 🎉 Congratulations! Quiz Passed!

## Final Score
- **Regular Questions**: 8/8 (100%) ✅ PASSED
- **Difficult Questions**: [X]/2 - For practice only

## What This Means
You've demonstrated mastery of [Topic Name]! This topic is now marked as **complete** in your study plan.

### Concepts You've Mastered
The following concepts will appear **faded/gray** when you review this topic since you got them right:
- [Concept 1] ✓
- [Concept 2] ✓
- [Concept 3] ✓
[etc.]

This means you can skip or quickly skim those sections on future reviews!

[If any difficult questions missed, gentle note that it's okay]

## Next Steps
✅ Topic marked complete in your study tracker
✅ Mastered concepts will be faded in teacher skill
➡️ Ready to select your next topic?

Use the **eppp-topic-selector** skill to choose what to study next.

**Great work! Keep up the momentum! 🚀**
```

### Review Needed Message (<8/8)

```markdown
# Quiz Results - Let's Review Together

## Your Score
- **Regular Questions**: [X]/8 ([Y]%) 
- **Passing requirement**: 8/8 (100%)

## You're making progress!
Getting [X]/8 means you understand [Y]% of the material - that's solid! Let's identify exactly what to review so you can get to 100%.

## What We'll Focus On

[For each missed question, use empathetic feedback pattern]

### Question 2: Negative Reinforcement ❌

**I can see why you chose negative punishment!** 
[Validation of their reasoning...]

**Here's what to remember:**
[Key distinction and explanation...]

---

## Your Personalized Study Plan

When you return to the teacher, these sections will be **highlighted in strong yellow**:

1. **Section 2.2: Negative Reinforcement vs Punishment** (Question 2) - HIGH PRIORITY
2. **Section 3.1: Schedules of Reinforcement** (Question 5) - HIGH PRIORITY

The sections you got right will appear **faded** since you've mastered them!

## Next Steps

➡️ **Return to eppp-topic-teacher** for targeted review

The teaching will now:
- ✨ Emphasize the concepts you struggled with (strong yellow)
- 💫 Fade the concepts you mastered (gray text)

**On your next quiz attempt:**
- Questions you MISSED will repeat (with shuffled answers)
- Questions you got RIGHT will be replaced with NEW questions on those concepts

**You're so close! Let's nail down these last concepts! 💪**
```

## Complete Performance Tracking

### What Gets Tracked

**For EVERY question (both correct and incorrect):**
```python
{
    'concept': 'Negative Reinforcement',
    'question_text': '...',
    'correct': False,  # or True
    'timestamp': '2025-11-02T15:30:00',
    'assessment_type': 'quiz'
}
```

### How Teacher Uses This Data

When user returns to teacher skill:
```python
# Teacher checks performance for each concept
performance = tracker.get_concept_performance(topic, concept)

# Determines highlighting:
if recently_wrong(performance):
    highlight = "strong_yellow"
elif previously_wrong(performance):
    highlight = "medium_yellow"
elif improving(performance):
    highlight = "light_green"
elif always_correct(performance):
    highlight = "faded"  # GRAY/FADED - Can skip!
else:
    highlight = "normal"
```

## Scripts Reference

### `quiz_generator.py`
- Find and load topic .md files
- Extract concepts from content
- Generate regular and difficult questions
- Apply adaptive logic (repeat vs new)
- Shuffle answer choices
- Grade quizzes

### `performance_tracker.py` (UPDATED)
- Get quiz history for topics
- Record quiz attempts and results
- **Track BOTH correct and incorrect answers** (for complete highlighting)
- Calculate highlight levels including fading
- Manage completion status

### `completion_manager.py` (UPDATED)
- Mark topics complete
- Generate review targets
- **Format empathetic feedback messages**
- Include mastery notifications

## Empathetic Feedback Guidelines

### DO's:
✅ **Start with validation** - "I can see why..." / "That makes sense..."
✅ **Acknowledge the reasoning** - Explain why their choice was logical
✅ **Be gentle** - Use encouraging language
✅ **Clear distinctions** - Explain the key difference simply
✅ **Memory aids** - Provide concrete ways to remember
✅ **Specific guidance** - Tell them exactly where to review

### DON'Ts:
❌ Don't say "wrong" or "incorrect" harshly
❌ Don't make them feel dumb
❌ Don't just say "study more"
❌ Don't skip the validation step
❌ Don't be condescending ("you should have known...")

### Example Validation Starters:

**Common confusions:**
- "I can see why you chose that! Many students mix these up because..."
- "That's a really common mistake - here's why..."
- "Your reasoning makes total sense given that..."
- "I totally understand the confusion here..."

**Partial understanding:**
- "You're on the right track with..."
- "You correctly identified [X], but..."
- "Good thinking about [X]! The missing piece is..."

**Pattern recognition:**
- "You picked up on [pattern], which is great! But..."
- "Your answer shows you understand [concept A], now let's clarify [concept B]..."

## Validation Before Presenting Quiz

Verify:
- ✅ 8 regular + 2 difficult questions
- ✅ All questions have 4 answer choices
- ✅ One correct answer per question
- ✅ Different concepts covered
- ✅ Difficult questions marked as unscored
- ✅ Adaptive logic applied correctly
- ✅ Answers shuffled appropriately

## Validation After Grading

Verify:
- ✅ Regular scored separately from difficult
- ✅ Pass/fail = 8/8 threshold
- ✅ **Empathetic feedback for ALL wrong answers**
- ✅ Positive reinforcement for correct answers
- ✅ **Both correct AND incorrect tracked in performance data**
- ✅ Review targets identified for failures
- ✅ Mastered concepts listed for fading
- ✅ Next step clearly communicated

## Best Practices

### Feedback Delivery
1. **Always validate first** - Even if answer is completely wrong
2. **Be specific about the confusion** - Don't be vague
3. **Use analogies from their interests** - If available from teacher data
4. **Keep it conversational** - Like a supportive tutor
5. **End with encouragement** - "You've got this!" tone

### Performance Tracking
1. **Track everything** - Both right and wrong answers
2. **Track immediately** - Don't lose data
3. **Concept-level tracking** - Not just overall scores
4. **Enable complete highlighting** - For optimal teacher integration
5. **Preserve full history** - Show learning trajectory

## Example Complete Feedback Session

```markdown
# Quiz Results: Operant Conditioning

## Your Score: 6/8 (75%)

---

### ✅ Question 1: Correct!
[Positive feedback with mastery note]

---

### ❌ Question 2: Let's clarify this one

**Your Answer**: B) Negative punishment
**Correct Answer**: D) Negative reinforcement

**I totally understand why you picked that!** Both involve something being removed, and that's the "negative" part. Your brain saw "negative" and "behavior change" and went to punishment - that's actually really logical thinking!

**Here's the game-changer:**
Look at what happened to the behavior:
- Did it increase or decrease?

In the scenario, the hand-washing *increased* after anxiety was removed. Anytime a behavior goes UP, that's reinforcement (not punishment).

**Think of it like this:**
- 🏋️ Reinforcement = Make the behavior STRONGER (happens more)
- 🚫 Punishment = Make the behavior WEAKER (happens less)

So even though something was removed (negative), the behavior got stronger (reinforcement) = Negative Reinforcement.

**You'll remember this!** Next time, just ask: "Did the behavior go up or down?" That tells you reinforcement vs punishment immediately.

**Review**: Section 2.2 in your materials

---

[Continue for all questions...]

## Summary

**You've Mastered** (will appear faded on review):
- Positive Reinforcement ✓
- Fixed Interval Schedules ✓  
- Shaping ✓
[etc.]

**Need Review** (will be highlighted):
- Negative Reinforcement (Question 2)
- Variable Ratio (Question 5)

➡️ Return to **eppp-topic-teacher** - your highlighted sections are ready!
```

---

**Version 2.0** - November 2025 (Enhanced with Empathetic Feedback & Complete Tracking)
**Integrates with**: eppp-topic-teacher, eppp-topic-selector, eppp-study-optimizer

**Key Innovations**: 
- Empathetic feedback that validates before correcting
- Complete performance tracking (both correct and incorrect) for optimal teacher highlighting
- Mastered concepts fade in teacher skill for efficient review
