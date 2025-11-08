---
name: eppp-topic-teacher
description: Personalized EPPP topic teaching with intelligent performance-based highlighting. Uses simple 13-year-old language with custom metaphors based on user's hobbies/interests/fandoms. Automatically highlights concepts based on recent quiz/exam performance - strong yellow for recently wrong, medium for previously wrong, light green for improving, faded for mastered. Integrates with eppp-quizzer and eppp-exam-generator for continuous improvement.
---

# EPPP Topic Teacher - Smart Learning with Highlights

## Overview

This skill provides personalized, engaging EPPP topic instruction with **intelligent highlighting** by:
1. Collecting user's hobbies, interests, and fandoms
2. Loading the complete .md file for their selected topic
3. **Analyzing past quiz/exam performance** to determine what needs attention
4. **Applying smart highlights** - strong for recent mistakes, faded for mastered content
5. Teaching ALL content using simple language and custom analogies
6. Directing to assessment tools and updating highlights based on new results

### 🎨 Smart Highlighting System

Content is automatically highlighted based on performance:
- 🔴 **Strong Yellow** = Recently wrong (last 7 days) - URGENT attention needed
- 🟡 **Medium Yellow** = Previously wrong (7-30 days ago) - Review needed
- 🟢 **Light Green** = Improving (was wrong, now right) - Quick review
- ⚪ **Faded/Gray** = Tested and always correct - Can skip/skim
- ⬜ **Normal text** = Never tested - Standard teaching (no highlight)

This means your study sessions get smarter over time - you focus on what you need most!

## Integration with Study Workflow

This skill is part 4 in the complete EPPP study system:

```
1. eppp-exam-generator → Take practice exam
2. eppp-study-optimizer → Analyze results, get recommendations  
3. eppp-topic-selector → Choose which topic to study
4. eppp-topic-teacher → LEARN with smart highlights (THIS SKILL)
5. eppp-quizzer → Take 10-question quiz
6. Performance tracked → Highlights update automatically
7. eppp-exam-generator → Take 10-question exam (8 regular + 2 unscored)
8. Track progress → Highlights refine, repeat
```

**Feedback Loop**: Quiz/exam results → Update highlights → Next study session shows what to focus on

## Quick Start

### Basic Usage

**When user says they want to study a topic:**
```
User: "I want to study Operant Conditioning"
```

**Your Response Flow:**
1. Show the interest collection form
2. Receive their hobbies/interests/fandoms
3. Find the .md file for the topic
4. **Check performance history for highlighting**
5. Generate personalized teaching content **with smart highlights**
6. Display completion message with next steps

## Core Teaching Process

### Step 1: Collect User Interests

Always start by collecting interests for personalized analogies:

```python
from scripts.topic_teacher import create_interests_form
print(create_interests_form())
```

The form asks for:
- **Hobbies**: What they do for fun
- **Interests**: Topics that fascinate them
- **Fandoms**: Shows/books/games they love

### Step 2: Load Topic Content

Use the topic teacher to find and load the .md file:

```python
from scripts.topic_teacher import TopicTeacher

# Initialize with path to EPPP Guts folder
teacher = TopicTeacher("/mnt/user-data/uploads/EPPP Guts references removed domain numbers added latest")

# Find the topic file
topic_file = teacher.find_topic_file("Operant Conditioning")

# Load content
content = teacher.load_topic_content(topic_file)
```

### Step 3: Check Performance History & Get Highlights

**NEW:** Check past quiz/exam performance to determine highlighting:

```python
# Check if they've studied before
learning_history = teacher.get_learning_history("Operant Conditioning")

# Get performance-based highlighting
highlights, highlight_instructions = teacher.get_performance_highlights(
    "Operant Conditioning",
    content
)

# highlights contains:
# - Which concepts to highlight strongly (recently wrong)
# - Which to highlight medium (previously wrong)
# - Which to highlight light (improving)
# - Which to fade (mastered)
```

### Step 4: Generate Teaching Prompt with Highlights

Create the prompt for teaching with highlighting instructions:

```python
# Load user's interests
interests = {
    "hobbies": "gaming, basketball", 
    "interests": "technology, space",
    "fandoms": "Star Wars, Avatar"
}

# Generate teaching prompt WITH HIGHLIGHTING
prompt = teacher.format_teaching_prompt(
    topic_name="Operant Conditioning",
    content=content,
    interests=interests,
    learning_history=learning_history,
    highlights=highlights,  # NEW
    highlight_instructions=highlight_instructions  # NEW
)
```

### Step 5: Teach with Smart Highlighting

Use the generated prompt to teach. **Critical requirements:**

1. **Apply Highlighting Correctly**:
   - 🔴 Strong yellow = Recently wrong (give EXTRA attention)
   - 🟡 Medium yellow = Previously wrong (thorough explanation)
   - 🟢 Light green = Improving (brief review + confidence boost)
   - ⚪ Faded = Mastered (quick summary, user can skip)

2. **Highlight Format Examples**:

**Strong Highlight (Recently Wrong):**
```markdown
## 🔴 Positive Reinforcement - FOCUS HERE

==This concept was recently gotten wrong. Let's really nail it down!==

[Multiple explanations from different angles]
[Extra examples using their interests]
[Common misconceptions addressed]
[Practice scenarios]
```

**Medium Highlight (Previously Wrong):**
```markdown
## 🟡 Negative Reinforcement - Review This

*You've struggled with this before, so let's review it thoroughly...*

[Standard clear explanation]
[Good examples from their interests]
[Key points highlighted]
```

**Light Highlight (Improving):**
```markdown
## 🟢 Variable Ratio Schedule - Good Progress! ✓

Great news - you got this right recently after previous struggles! Quick review to solidify it...

[Brief reminder of key points]
[One solid example]
[Confidence boost]
```

**Faded (Mastered):**
```markdown
<details>
<summary>⚪ Fixed Interval Schedule - You Know This (Click if needed)</summary>

<span style="color: #888;">
You've consistently gotten this correct. Quick summary:

[Very brief overview they can skip]
</span>
</details>
```

3. **Cover EVERYTHING**: Still teach every concept, but adjust depth based on highlights

4. **Simple Language**: Explain like talking to a smart 13-year-old

5. **Custom Analogies**: Use their specific interests

6. **Engaging Format**: Conversational, examples, recaps

### Step 6: Display Completion

After teaching, show next steps and explain the feedback loop:

```python
from scripts.topic_teacher import display_topic_completion
print(display_topic_completion("Operant Conditioning"))
```

## Performance Tracking System

### How Highlighting is Determined

The system tracks every quiz and exam question with:
- **Concept tested** (mapped to .md sections)
- **Correct/Incorrect**
- **Timestamp** (for recency calculation)
- **Assessment type** (quiz vs exam)

**Highlight Logic:**

```python
# Recently wrong (0-7 days) + incorrect = 🔴 STRONG
# Previously wrong (7-30 days) + incorrect = 🟡 MEDIUM
# Recently correct + had previous wrongs = 🟢 LIGHT
# Always correct = ⚪ FADE
# Recently wrong after being right = 🔴 STRONG (back to urgent)
```

### Data Structure

Performance history is stored in `performance_history.json`:

```json
{
  "Operant Conditioning": {
    "assessments": [
      {
        "type": "quiz",
        "timestamp": "2025-11-01T10:30:00",
        "results": [
          {
            "concept": "Positive Reinforcement",
            "question": "What is positive reinforcement?",
            "correct": false
          }
        ]
      }
    ],
    "concept_performance": {
      "Positive Reinforcement": [
        {"timestamp": "2025-11-01T10:30:00", "correct": false, "assessment_type": "quiz"},
        {"timestamp": "2025-10-25T14:00:00", "correct": false, "assessment_type": "exam"}
      ],
      "Negative Reinforcement": [
        {"timestamp": "2025-11-01T10:30:00", "correct": true, "assessment_type": "quiz"}
      ]
    }
  }
}
```

### Concept Mapping

The `ConceptMapper` class automatically maps quiz/exam questions to study material sections by:
1. Extracting all concepts from the .md file
2. Matching question content to concept names/keywords
3. Creating associations for tracking

## Highlighting Examples by Scenario

### Scenario 1: First Time Studying
**No performance data** → All content gets equal treatment, no highlighting

### Scenario 2: Never Tested on Concept
**Haven't been quizzed on "Shaping" yet** → ⬜ Normal text (no highlight, taught normally)

### Scenario 3: Recently Failed Quiz
**Last week got "Variable Ratio" wrong** → 🔴 Strong yellow highlight on that section

### Scenario 4: Previously Struggled, Now Better
**Got "Punishment" wrong 2 weeks ago, right yesterday** → 🟢 Light green (improving!)

### Scenario 5: Tested and Always Correct
**Been quizzed on "Fixed Interval" 3 times, gotten it right all 3 times** → ⚪ Faded, user can skip

### Scenario 6: Backsliding
**Was getting it right, now wrong again** → 🔴 Back to strong yellow

### Scenario 6: Mixed Results
**Multiple concepts at different levels** → Each concept highlighted independently

## Integration with Quiz/Exam Generator

### After Taking a Quiz

When user takes a quiz via `eppp-quizzer` (coming soon):

```python
from scripts.performance_tracker import PerformanceTracker

tracker = PerformanceTracker()

# Record quiz results
quiz_results = [
    {
        "concept": "Positive Reinforcement",
        "question": "What is positive reinforcement?",
        "correct": False,
        "timestamp": "2025-11-02T15:30:00"
    },
    # ... more results
]

tracker.record_assessment(
    topic="Operant Conditioning",
    assessment_type="quiz",
    results=quiz_results
)

# Next time they study, highlights update automatically!
```

### After Taking a Practice Exam

Similar process for exam results from `eppp-exam-generator`:

```python
exam_results = [...]  # Same format
tracker.record_assessment(
    topic="Operant Conditioning",
    assessment_type="exam",
    results=exam_results
)
```

## Best Practices

### For Teaching

1. **Respect the highlighting** - Don't ignore it; use it to adjust depth
2. **Strong highlights get triple attention** - Multiple angles, extra examples
3. **Faded content stays brief** - User can expand if needed
4. **Always explain the system** - Tell user what the colors mean
5. **Complete coverage still required** - Highlight affects depth, not whether to cover

### For Performance Tracking

1. **Map questions accurately** - Ensure quiz questions link to correct concepts
2. **Track immediately** - Record results right after assessment
3. **Trust the recency** - Recent performance matters more than old
4. **Watch for patterns** - Improving vs backsliding affects highlighting

## Scripts Reference

### `topic_teacher.py`
Main teaching engine with methods:
- `load_user_interests()` - Store hobbies/interests/fandoms
- `find_topic_file()` - Locate .md file for topic
- `load_topic_content()` - Read .md file content
- `get_learning_history()` - Check past performance (legacy)
- **`get_performance_highlights()`** - **NEW**: Get highlighting info
- `format_teaching_prompt()` - Generate teaching prompt with highlights
- `create_interests_form()` - Display interest collection form
- `display_topic_completion()` - Show next steps message

### `performance_tracker.py`
**NEW**: Detailed performance tracking with methods:
- `PerformanceTracker.record_assessment()` - Save quiz/exam results
- `PerformanceTracker.get_concept_highlight_level()` - Get highlight for one concept
- `PerformanceTracker.get_topic_highlights()` - Get all highlights for topic
- `PerformanceTracker.get_performance_summary()` - Get statistics
- `ConceptMapper.extract_concepts_from_md()` - Parse .md for concepts
- `ConceptMapper.match_question_to_concept()` - Map questions to concepts
- `generate_highlight_instructions()` - Format highlighting instructions

### `workflow_integration.py`
Connects with topic selector:
- `WorkflowManager` - Manages selection to teaching transition
- `get_domain_folder()` - Maps domains to folder names
- `normalize_topic_name()` - Handles naming variations

## Highlight Intensity Details

### Strong Yellow (🔴)
- **When**: Last wrong within 7 days
- **Visual**: Bright yellow background, bold text
- **Teaching approach**: 
  - Multiple explanations from different angles
  - 3-4 examples using their interests
  - Common misconceptions explicitly addressed
  - Practice scenarios
  - "Let's nail this" section

### Medium Yellow (🟡)
- **When**: Last wrong 7-30 days ago
- **Visual**: Light yellow background or italic emphasis
- **Teaching approach**:
  - Standard thorough explanation
  - 2 good examples
  - Key points clearly marked

### Light Green (🟢)
- **When**: Recently correct after previous mistakes
- **Visual**: Subtle green tint or checkmark indicator
- **Teaching approach**:
  - Brief review (not full teaching)
  - 1 solid example
  - Confidence boost message
  - "You've got this!" tone

### Faded (⚪)
- **When**: Been tested/quizzed AND always gotten correct
- **Visual**: Gray text in collapsible section
- **Teaching approach**:
  - Very brief summary
  - User can expand if desired
  - "You know this" message
  - Can completely skip

### Normal Text (⬜)
- **When**: Never been tested/quizzed on this concept
- **Visual**: Standard text formatting (no highlight, no fade)
- **Teaching approach**:
  - Full standard teaching
  - Complete explanations and examples
  - Treat like any first-time learning
  - Can't skip (haven't proven mastery yet)

## After Teaching Checklist

Before displaying completion, verify you:
- ✅ Applied highlights according to performance data
- ✅ Gave extra attention to strongly highlighted concepts
- ✅ Kept faded content brief and skippable
- ✅ Used analogies from their specific interests
- ✅ Covered ALL concepts (highlight affects depth, not coverage)
- ✅ Kept language at 13-year-old comprehension level
- ✅ Made it engaging with examples and recaps
- ✅ Explained the highlighting system to the user

## Next Steps Message

Always end with the completion message that explains the feedback loop:

The completion message now includes:
1. Direction to **eppp-quizzer** (10-question quiz)
2. Direction to **eppp-exam-generator** (8+2 questions)
3. **Explanation that results update the highlights**
4. Motivation about smart studying

## Future Enhancements

Potential additions:
- Visual heatmap of concept mastery
- Spaced repetition scheduling
- Adaptive difficulty based on highlights
- Progress visualization over time
- Concept relationship mapping

---

**Version 2.0** - November 2025 (Enhanced with Smart Highlighting)
**Integrates with**: eppp-topic-selector, eppp-quizzer (coming soon), eppp-exam-generator

**Key Innovation**: Intelligent highlighting based on recency and performance trends makes studying more efficient by showing exactly where to focus attention.
