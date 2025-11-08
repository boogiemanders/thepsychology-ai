---
name: eppp-study-optimizer
description: Advanced study optimizer for EPPP exam results that identifies weak domains, extracts specific topics from wrong answers, and provides optimal learning recommendations. Use when users have completed an EPPP practice exam and need detailed topic-level analysis and personalized study plans based on their performance.
---

# EPPP Study Optimizer - Topic-Level Performance Analysis

## Overview

**IMPORTANT: Use this skill AFTER you've taken a practice exam AND reviewed the explanations for why you got each question wrong.**

This skill provides deep topic-level analysis of EPPP practice exam results. While the EPPP exam generator shows you which **domains** need work, the Study Optimizer goes deeper to identify the specific **topics within those domains** where you're struggling, then creates an optimal study plan prioritized by learning efficiency.

### Understanding Domains vs Topics

**Domains** (8 total) - The broad categories that make up the EPPP:
- Domain 1: Biological Bases of Behavior / Physiological Psychology and Psychopharmacology
- Domain 2: Cognitive-Affective Bases / Learning and Memory
- Domain 3: Social & Cultural Foundations (includes Social Psychology, Cultural, and Organizational)
- Domain 4: Growth & Lifespan Development
- Domain 5: Assessment & Diagnosis (includes Assessment, Diagnosis/Psychopathology, and Test Construction)
- Domain 6: Treatment, Intervention, and Prevention / Clinical Psychology
- Domain 7: Research Methods & Statistics
- Domain 8: Ethical, Legal & Professional Issues

**Topics** - Specific subject areas within each domain (40+ total):
- Example from Domain 4: "4 Physical Development.md", "4 Cognitive Development.md", "4 Language Development.md"
- Example from Domain 6: "6 Cognitive-Behavioral Therapies.md", "6 Psychodynamic and Humanistic Therapies.md"
- Example from Domain 3: "3 Social Cognition – Errors, Biases, and Heuristics.md", "3 Attitudes and Attitude Change.md"

Each topic is a separate .md file containing detailed content about that specific subject area.

## What Makes This Different

### Standard Analysis (from EPPP Exam Generator)
- Shows you scored 62% in Domain 5: Assessment & Diagnosis
- Lists questions you missed (Q23, Q45, Q67, etc.)
- Tells you to review domain files like "5_Assessment.md"

### Study Optimizer Analysis (This Skill)
**After you've reviewed why you got each question wrong**, this skill:
- Identifies you missed questions specifically from the topics "Neuropsychological Assessment" and "Intelligence Testing"
- Maps each wrong answer to its specific topic file (e.g., Q23 → Halstead-Reitan content in assessment topic)
- Ranks topics by learning value: (questions missed × domain weight × topic difficulty)
- Provides targeted study recommendations like: "Study the Neuropsychological Assessment topic (5 questions missed, high domain weight) before the Intelligence Testing topic (2 questions missed, lower impact)"

### The Complete Workflow

```
1. Generate Practice Exam (EPPP Exam Generator)
   ↓
2. Take the 225-question exam
   ↓
3. Review explanations for EVERY question
   • Understand WHY the correct answer is correct
   • Understand WHY your answer was wrong
   • Identify knowledge gaps
   ↓
4. Domain-level Analysis (EPPP Exam Generator)
   • See which of the 8 domains are weakest
   • Get weighted priority scores
   ↓
5. Topic-level Analysis (THIS SKILL)
   • Takes your top 3 weakest domains
   • Breaks them into specific topics
   • Creates optimized study plan
```

**Why wait until after reviewing explanations?** 
- You need to understand your mistakes before optimizing your study plan
- The skill works best when you've internalized which concepts you confused or didn't know
- Reviewing explanations helps you identify patterns in your errors that inform better study strategies

## Quick Start

### Prerequisites
You must have:
1. ✅ Completed an EPPP practice exam (225 questions)
2. ✅ **Reviewed the explanation for EVERY question** - both correct and incorrect answers
3. ✅ Understood why you got questions wrong (not just which ones)
4. ✅ A completed exam file (JSON format from EPPP exam generator)
5. ✅ Your answer file (JSON format with your responses)
6. ✅ Access to the EPPP reference materials (domain folders with topic .md files)

**Critical:** This skill analyzes your knowledge gaps, but you need to have already identified what those gaps are by reviewing explanations. Don't skip the review step!

### Basic Usage
```
"Analyze my EPPP exam results and tell me exactly what topics to study"
"Optimize my study plan based on my practice test"
"What specific topics in Domain 5 should I focus on?"
```

The skill will automatically:
1. Identify your top 3 weakest domains (by weighted score)
2. Extract exact topics from each wrong answer
3. Rank topics by optimal learning sequence
4. Provide detailed study recommendations

## Core Capabilities

### 1. Weighted Domain Analysis
Uses the proven formula: `(100 - % correct) × domain_weight`

**Why this matters:** A 60% score in Domain 5 (16% weight) is more critical than 60% in Domain 7 (7% weight). The optimizer automatically prioritizes domains that will have the biggest impact on your passing score.

### 2. Topic Extraction Engine
Analyzes each wrong answer and identifies:
- **Primary topic** (the main subject of the question)
- **Secondary topics** (related concepts tested)
- **Topic location** (exact section in source file)
- **Topic frequency** (how often it appears in the exam)

### 3. Optimal Learning Prioritization
Ranks topics using a multi-factor scoring system:

```
Learning Priority Score = 
  (Questions Missed) × 
  (Domain Weight) × 
  (Topic Complexity Factor) × 
  (Foundation Score)
```

**Foundation Score:** Topics that are prerequisites for other topics get higher priority. For example, "Classical Conditioning" comes before "Higher-Order Conditioning."

### 4. Cross-Domain Pattern Detection
Identifies when topics span multiple domains:
- Example: "Cognitive Behavioral Therapy" appears in Domain 2, 5, and 6
- Recommendation: Study once but review in all three contexts

## Detailed Workflow

### Step 1: Load and Validate Data
```python
from scripts.study_optimizer import EPPPStudyOptimizer

optimizer = EPPPStudyOptimizer(
    exam_path="output/exam.json",
    answers_path="output/answers.json",
    references_path="references/"
)
```

### Step 2: Analyze Performance
```python
# Comprehensive analysis
analysis = optimizer.analyze_performance()

# Returns:
{
    "top_domains": [
        {
            "domain": "Domain 5: Assessment & Diagnosis",
            "weighted_score": 6.24,  # (100-61) × 0.16
            "percent_correct": 61.0,
            "questions_missed": 14,
            "topics_affected": [...]
        },
        # ... 2 more domains
    ],
    "topic_breakdown": {...},
    "study_plan": {...}
}
```

### Step 3: Extract Topics from Wrong Answers
```python
# For each wrong answer, identify specific topics
topic_analysis = optimizer.extract_topics_from_questions()

# Example output:
{
    "question_23": {
        "domain": "Domain 5",
        "source_file": "5_Assessment.md",
        "primary_topic": "Neuropsychological Assessment",
        "specific_subtopic": "Halstead-Reitan Battery",
        "related_topics": ["Brain Damage Assessment", "Test Interpretation"],
        "topic_section": "Lines 1-50",
        "difficulty": "moderate"
    }
}
```

### Step 4: Generate Optimal Study Plan
```python
# Create prioritized study recommendations
study_plan = optimizer.generate_study_plan()

# Output format described below
```

## Output Format

### 1. Executive Summary
```
═══════════════════════════════════════════════════════════
EPPP STUDY OPTIMIZATION REPORT
═══════════════════════════════════════════════════════════

Overall Performance: 156/225 (69.3%)
Status: ⚠️  BELOW PASSING (0.7% improvement needed)

Top 3 Priority Domains:
1. Domain 5: Assessment & Diagnosis (61.0%, Weight: 16%)
2. Domain 8: Ethical/Legal/Professional (58.3%, Weight: 16%)
3. Domain 2: Cognitive-Affective (66.7%, Weight: 13%)

Total Topics Identified: 42
Estimated Study Time: 18-24 hours
```

### 2. Detailed Topic Analysis
```
═══════════════════════════════════════════════════════════
DOMAIN 5: ASSESSMENT & DIAGNOSIS
═══════════════════════════════════════════════════════════

Performance: 22/36 (61.0%)
Domain Weight: 16% of exam
Priority Score: 6.24
Questions Missed: 14

TOPIC BREAKDOWN (Ranked by Learning Priority)
─────────────────────────────────────────────────────────

Priority #1: Neuropsychological Assessment
  ├─ Questions Missed: 5 (Questions #23, #45, #67, #89, #112)
  ├─ Learning Impact: HIGH (5 questions × 0.16 weight)
  ├─ Topic Complexity: Moderate-High
  ├─ Source: 5_Assessment.md (Lines 1-50)
  ├─ Subtopics Affected:
  │   • Halstead-Reitan Battery (Q23, Q45)
  │   • Luria-Nebraska Battery (Q67)
  │   • Boston Process Approach (Q89)
  │   • Bender-Gestalt II (Q112)
  └─ Study Recommendation:
      Focus on: Battery components, scoring interpretation,
      appropriate age ranges, and clinical applications.
      Time estimate: 2-3 hours

Priority #2: Intelligence Testing
  ├─ Questions Missed: 4 (Questions #34, #56, #78, #91)
  ├─ Learning Impact: HIGH (4 questions × 0.16 weight)
  ├─ Topic Complexity: Moderate
  ├─ Source: 5_Assessment.md (Lines 122-150)
  ├─ Subtopics Affected:
  │   • KABC-II (Q34)
  │   • Raven's SPM (Q56, Q78)
  │   • PPVT-5 (Q91)
  ├─ Foundation Dependencies: 
  │   ⚠️  Review "Psychometric Principles" first (prerequisite)
  └─ Study Recommendation:
      Focus on: Culturally fair assessment, nonverbal tests,
      appropriate populations, and test selection criteria.
      Time estimate: 1.5-2 hours

Priority #3: Projective Testing
  ├─ Questions Missed: 3 (Questions #44, #65, #87)
  ├─ Learning Impact: MODERATE (3 questions × 0.16 weight)
  ├─ Topic Complexity: Moderate
  ├─ Source: 5_Assessment.md (Lines 75-121)
  ├─ Cross-Domain Note: 
  │   Also appears in Domain 6 (Treatment planning)
  └─ Study Recommendation:
      Focus on: TAT interpretation, Rorschach systems,
      scoring methods, and validity concerns.
      Time estimate: 1-2 hours

[... Additional priorities continue ...]

═══════════════════════════════════════════════════════════
CROSS-DOMAIN TOPICS
═══════════════════════════════════════════════════════════

Some topics appeared in multiple domains you struggled with:

1. **Ethical Decision-Making**
   • Domain 5: Test selection ethics (2 questions)
   • Domain 8: General ethical principles (4 questions)
   • Recommendation: Study Domain 8 version first (foundation),
     then apply to Domain 5 context

2. **Cognitive-Behavioral Therapy**
   • Domain 2: Theoretical foundations (1 question)
   • Domain 6: Treatment applications (3 questions)
   • Recommendation: Study both together for integrated understanding
```

### 3. Optimal Study Sequence
```
═══════════════════════════════════════════════════════════
RECOMMENDED STUDY SEQUENCE
═══════════════════════════════════════════════════════════

This sequence optimizes for:
✓ Foundation topics before advanced topics
✓ High-impact domains before low-impact
✓ Cross-domain integration opportunities
✓ Spaced repetition principles

WEEK 1 (Priority: Domain 5 - Assessment)
─────────────────────────────────────────────────────────
Day 1-2: Foundation Topics
  □ Psychometric Principles (prerequisite for others)
    Source: 5_Assessment.md + 5_Test_Construction.md
    Time: 3-4 hours

Day 3-4: Neuropsychological Assessment
  □ Study main topic (5_Assessment.md, Lines 1-50)
  □ Complete practice questions on topic
    Time: 2-3 hours

Day 5: Intelligence Testing
  □ Study main topic (5_Assessment.md, Lines 122-150)
  □ Link to psychometric principles studied Day 1-2
    Time: 2 hours

Day 6-7: Review + Projective Testing
  □ Review previous topics with spaced repetition
  □ Study Projective Testing (5_Assessment.md, Lines 75-121)
    Time: 3 hours total

WEEK 2 (Priority: Domain 8 - Ethics)
─────────────────────────────────────────────────────────
[Similar breakdown for Domain 8...]

WEEK 3 (Priority: Domain 2 - Cognitive-Affective)
─────────────────────────────────────────────────────────
[Similar breakdown for Domain 2...]
```

### 4. Topic-Specific Study Cards
```
═══════════════════════════════════════════════════════════
TOPIC STUDY CARDS
═══════════════════════════════════════════════════════════

For each high-priority topic, receive a study card with:

┌─────────────────────────────────────────────────────────┐
│ TOPIC: Halstead-Reitan Neuropsychological Battery       │
├─────────────────────────────────────────────────────────┤
│ Domain: 5 (Assessment & Diagnosis)                      │
│ Source: 5_Assessment.md (Lines 6-7)                     │
│ Questions You Missed: #23, #45                          │
├─────────────────────────────────────────────────────────┤
│ KEY FACTS TO MEMORIZE:                                  │
│                                                          │
│ • Purpose: Determine severity & nature of brain damage  │
│ • Age Versions: 5-8, 9-14, 15+                         │
│ • Commonly paired with: Wechsler tests + MMPI-2        │
│ • Impairment Index ranges:                             │
│   - 0-0.2: Normal functioning                          │
│   - 0.3-0.4: Mild impairment                           │
│   - 0.5-0.7: Moderate impairment                       │
│   - 0.8-1.0: Severe impairment                         │
├─────────────────────────────────────────────────────────┤
│ YOUR MISTAKES:                                          │
│                                                          │
│ Q23: You confused the age ranges with Luria-Nebraska   │
│      Remember: Halstead has THREE versions (5-8, 9-14, │
│      15+) vs Luria-Nebraska's TWO (8-12, 13+)          │
│                                                          │
│ Q45: You forgot it's used with Wechsler + MMPI-2      │
│      Memory trick: "HRM" = Halstead + Reitan + More    │
│      (the "More" = Wechsler + MMPI)                    │
├─────────────────────────────────────────────────────────┤
│ PRACTICE QUESTIONS:                                     │
│                                                          │
│ 1. A 10-year-old with suspected TBI would use which    │
│    Halstead-Reitan version?                            │
│    Answer: Ages 9-14 version                           │
│                                                          │
│ 2. An Impairment Index of 0.6 indicates what level?   │
│    Answer: Moderate impairment (0.5-0.7 range)        │
├─────────────────────────────────────────────────────────┤
│ RELATED TOPICS TO REVIEW:                              │
│ • Luria-Nebraska (comparison/contrast)                 │
│ • Traumatic Brain Injury assessment                    │
│ • Wechsler Intelligence Scales                         │
└─────────────────────────────────────────────────────────┘
```

## Advanced Features

### 1. Topic Dependency Mapping
```python
# Identify prerequisite relationships
dependencies = optimizer.map_topic_dependencies()

# Example output:
{
    "Classical Conditioning": {
        "prerequisites": ["Learning Theory Basics"],
        "enables": ["Operant Conditioning", "Systematic Desensitization"],
        "priority_boost": 1.5  # Study this before dependent topics
    }
}
```

### 2. Difficulty-Adjusted Recommendations
Topics are rated by inherent complexity:
- **Low**: Basic definitions, simple distinctions
- **Moderate**: Multi-component concepts, common applications
- **High**: Complex theory, subtle distinctions, statistical formulas

Time estimates adjust based on difficulty + your performance.

### 3. Spaced Repetition Schedule
```python
# Generate optimal review schedule
review_schedule = optimizer.create_review_schedule()

# Output:
{
    "day_1": ["Study: Neuropsychological Assessment"],
    "day_3": ["Review: Neuropsychological Assessment (1st review)"],
    "day_7": ["Review: Neuropsychological Assessment (2nd review)"],
    "day_14": ["Review: Neuropsychological Assessment (3rd review)"]
}
```

### 4. Progress Tracking
```python
# After studying, update your progress
optimizer.mark_topic_studied("Halstead-Reitan Battery")

# Regenerate plan with updated priorities
updated_plan = optimizer.generate_study_plan(exclude_studied=True)
```

## Scoring Formulas Explained

### Weighted Domain Score
```
Weighted Score = (100 - % Correct) × Domain Weight

Example:
Domain 5: (100 - 61) × 0.16 = 6.24
Domain 8: (100 - 58.3) × 0.16 = 6.67
Domain 2: (100 - 66.7) × 0.13 = 4.33

Result: Domain 8 is highest priority
```

### Topic Learning Priority
```
Priority = Questions Missed × Domain Weight × Complexity × Foundation

Example for "Halstead-Reitan Battery":
= 2 questions × 0.16 weight × 1.2 complexity × 1.0 foundation
= 0.384

Example for "Psychometric Principles":
= 1 question × 0.16 weight × 1.3 complexity × 1.8 foundation
= 0.374 (but studied first due to foundation boost)
```

### Estimated Study Time
```
Time = Base Time × Questions Missed × Complexity Factor × Your Learning Rate

Base Time: 20-30 minutes per topic (average)
Complexity Factor: 0.8 (low) to 1.5 (high)
Your Learning Rate: Calculated from overall exam performance
```

## Integration with EPPP Exam Generator

This skill is designed to work seamlessly with the EPPP exam generator as part of a complete study workflow:

1. **Generate Exam** (eppp-exam-generator skill)
   - Creates 225-question practice exam
   - Saves to `exam.json`

2. **Take Exam** (User)
   - Complete the exam (4.5 hours)
   - Save answers to `answers.json`

3. **Review ALL Explanations** (User) ⚠️ CRITICAL STEP
   - Read explanation for EVERY question (not just wrong ones)
   - Understand why correct answer is correct
   - Understand why your answer was wrong
   - Identify what knowledge you were missing
   - Note any patterns in your mistakes

4. **Initial Analysis** (eppp-exam-generator skill)
   - Performance analyzer shows domain-level results
   - Identifies top 3 priority domains using weighted formula
   - Provides general "study this domain" recommendations

5. **Deep Dive** (THIS SKILL - eppp-study-optimizer)
   - Now that you understand your mistakes, optimize your study plan
   - Takes those top 3 domains
   - Breaks each domain into specific topics
   - Maps your wrong answers to specific topic files
   - Calculates optimal learning priorities
   - Creates week-by-week study schedule

6. **Study & Improve** (User)
   - Follow the optimized plan
   - Study the specific topics identified
   - Use generated study cards
   - Track progress with review schedule
   - Mark topics as mastered

7. **Reassess** (Both skills)
   - Generate another practice exam
   - Take and review it
   - Compare performance to previous
   - Adjust study plan for remaining gaps
   - Repeat until consistently passing (70%+)

**Why the review step matters:** The Study Optimizer creates recommendations based on which topics appear in your wrong answers. If you haven't reviewed and understood why you got questions wrong, you won't have the context to effectively study those topics. The explanations help you understand not just what you missed, but how those concepts connect to the broader topic area.

## Integration with Topic Selector

The Study Optimizer can export recommendations in a format compatible with the **eppp-topic-selector** skill, enabling seamless navigation of your study plan:

### Export Recommendations
```bash
# After running analysis, export for topic selector
python scripts/study_optimizer.py exam.json answers.json --export-recommendations -o recommendations.json
```

This creates a JSON file with:
- All recommended topics from your top 3 domains
- Priority scores for optimal study order
- Domain and topic names formatted for the selector
- Difficulty levels and questions missed counts

### Using with Topic Selector
```bash
# 1. Load recommendations into topic selector
python topic_selector.py --load recommendations.json

# 2. View all domains with completion status
python topic_selector.py --list

# 3. Expand a domain to see topics
python topic_selector.py --domain "Domain 5: Assessment & Diagnosis"

# 4. Select a topic to study
python topic_selector.py --select "Domain 5" "Neuropsychological Assessment"

# 5. Record quiz scores after studying
python topic_selector.py --record-score "Domain 5" "Neuropsychological Assessment" 85
```

### Complete Workflow with Topic Selector
```
1. Study Optimizer: Analyze exam → Generate recommendations
   ↓
2. Export: Create recommendations.json for topic selector
   ↓
3. Topic Selector: Load recommendations and view study plan
   ↓
4. Topic Selector: Select specific topic to study next
   ↓
5. Study: Learn the selected topic material
   ↓
6. Quiz: Test knowledge with practice questions
   ↓
7. Topic Selector: Record quiz score (80%+ = mastered)
   ↓
8. Repeat: Continue with next recommended topic
```

### Report Format for Parsing

The optimizer now outputs reports in a format that the topic selector can automatically parse:

```
═══════════════════════════════════════════════
DOMAIN 5: ASSESSMENT & DIAGNOSIS
═══════════════════════════════════════════════

Priority 1: Neuropsychological Assessment
  ├─ Questions Missed: 5
  ├─ Learning Impact: HIGH
  └─ Study Recommendation: ...

Priority 2: Intelligence Testing
  ├─ Questions Missed: 4
  ├─ Learning Impact: HIGH
  └─ Study Recommendation: ...
```

The selector automatically extracts:
- Domain numbers and names from `DOMAIN X: NAME` headers
- Topic names from `Priority N: Topic Name` lines
- Removes the `#` symbol for clean parsing

## Usage Examples

### Example 1: Basic Analysis
```bash
python scripts/study_optimizer.py exam.json answers.json

# Output: Full study optimization report
```

### Example 2: Focus on Specific Domain
```bash
python scripts/study_optimizer.py exam.json answers.json --domain 5

# Output: Deep topic analysis for Domain 5 only
```

### Example 3: Generate Study Cards
```bash
python scripts/study_optimizer.py exam.json answers.json --cards

# Output: Individual study cards for each topic
```

### Example 4: Interactive Mode
```bash
python scripts/study_optimizer.py exam.json answers.json --interactive

# Provides menu:
# 1. View full optimization report
# 2. Analyze specific domain
# 3. Generate study cards
# 4. Create review schedule
# 5. Track study progress
```

## Scripts Included

### 1. `study_optimizer.py`
Main optimization engine that:
- Loads exam results
- Identifies priority domains
- Extracts topics from questions
- Generates study plan

### 2. `topic_extractor.py`
Analyzes reference files to:
- Parse topic structure (headers, sections)
- Map questions to specific topics
- Identify topic relationships
- Calculate topic difficulty

### 3. `learning_scheduler.py`
Creates optimal study schedule:
- Orders topics by priority
- Implements spaced repetition
- Adjusts for dependencies
- Generates timeline

### 4. `study_card_generator.py`
Creates detailed study cards:
- Extracts key facts
- Identifies common mistakes
- Generates practice questions
- Links related topics

## File Structure

```
eppp-study-optimizer/
├── SKILL.md                      # This file
├── scripts/
│   ├── study_optimizer.py        # Main optimization engine
│   ├── topic_extractor.py        # Topic analysis from source files
│   ├── learning_scheduler.py     # Study schedule generator
│   └── study_card_generator.py   # Study card creator
├── templates/
│   ├── report_template.txt       # Text report format
│   ├── study_card_template.txt   # Study card format
│   └── schedule_template.txt     # Schedule format
└── examples/
    ├── example_report.txt        # Sample optimization report
    ├── example_cards.txt         # Sample study cards
    └── example_schedule.txt      # Sample study schedule
```

## Requirements

### Input Files
1. **Exam JSON** (from EPPP exam generator)
   - Must include question metadata
   - Must track domain and source files
   
2. **Answers JSON**
   - User's selected answers
   - Optional: reasoning for each answer

3. **Reference Materials**
   - All EPPP domain .md files
   - Must be accessible in `references/` directory

### Python Dependencies
```
pip install pandas numpy --break-system-packages
```

## Important Notes

### Study Time Estimates
- **Conservative estimates**: 20-30 hours for comprehensive review
- **Accelerated track**: 12-15 hours focusing on highest priorities only
- **Your results may vary**: Adjust based on your learning speed

### Topic Granularity
The skill identifies topics at multiple levels:
1. **Major topics** (e.g., "Neuropsychological Assessment")
2. **Subtopics** (e.g., "Halstead-Reitan Battery")
3. **Specific concepts** (e.g., "Impairment Index interpretation")

You can study at any level, but subtopic focus is usually most efficient.

### Limitation: Content-Based Only
This skill analyzes what topics were tested, not why you got them wrong:
- If you misread a question → Skill can't detect
- If you knew the content but rushed → Skill can't detect
- If you had test anxiety → Skill can't detect

For test-taking strategy issues, combine this with other study approaches.

### Multiple Exams
For best results, use this skill after each practice exam:
- 1st exam: Identifies major knowledge gaps
- 2nd exam: Tracks improvement and reveals persistent weaknesses
- 3rd+ exams: Fine-tunes to subtle distinctions and remaining gaps

## Troubleshooting

### "No topics found for question"
**Cause**: Question references content not clearly marked in source file
**Solution**: Review the source file manually for that question number

### "Dependency loop detected"
**Cause**: Two topics marked as prerequisites for each other
**Solution**: Study them together as an integrated unit

### "Estimated time seems off"
**Cause**: Learning rate not calibrated for your performance
**Solution**: Use `--adjust-learning-rate` flag and specify your estimated rate

### "Topics seem too granular/broad"
**Cause**: Default topic extraction level doesn't match your needs
**Solution**: Use `--topic-level [major|sub|concept]` to adjust

## Best Practices

1. **Take full practice exams** - Topic analysis is most accurate with complete 225-question exams

2. **Use immediately after exam** - Study recommendations are most relevant when your exam performance is fresh

3. **Follow the sequence** - The optimizer orders topics for a reason; trust the algorithm

4. **Update progress** - Mark topics as studied so subsequent analyses adjust priorities

5. **Review before next exam** - Use the review schedule, don't just study once

6. **Combine with active learning** - Reading source material is necessary but not sufficient; also do practice questions, teach concepts, create mnemonics

7. **Track multiple exams** - Save each optimization report to see your improvement trajectory

## Support

For issues or questions about the EPPP Study Optimizer:
- Check example files in `examples/` directory
- Review troubleshooting section above
- Ensure input files match expected format from EPPP exam generator

---

**Version 1.0** - November 2025
**Requires**: EPPP Exam Generator v2.0+
**Optimized for**: 225-question ASPPB-format practice exams
