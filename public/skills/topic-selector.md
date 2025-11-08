---
name: eppp-topic-selector
description: Interactive topic selection interface for EPPP study planning. Use after the study optimizer skill has analyzed exam results to help users select which specific topic to study next. Displays all domains with completion percentages and recommendations, allows expanding domains to see topics, shows study status (80%+ quiz score = studied), and enables selecting a single topic to begin studying. Essential for navigating study progress and choosing what to learn next.
---

# EPPP Topic Selector - Choose What to Study Next

## Overview

The EPPP Topic Selector is an interactive interface that helps you navigate your EPPP study plan and select which topic to study next. After using the **eppp-study-optimizer** skill to analyze your practice exam results, this skill helps you:

1. **View all 8 EPPP domains** with completion percentages and recommendations
2. **Expand domains** to see individual topics within them
3. **See study status** for each topic (studied = 80%+ quiz score)
4. **Identify recommended topics** from the study optimizer
5. **Select a specific topic** to begin studying

### Integration with Other Skills

This skill works as part of a complete EPPP study workflow:

```
1. eppp-exam-generator → Generate and take practice exam
2. eppp-study-optimizer → Analyze results and get recommendations
3. eppp-topic-selector → SELECT which topic to study (THIS SKILL)
4. Study the topic → Learn the material
5. Take quiz on topic → Test your knowledge
6. Record quiz score → Track progress (80%+ = studied)
7. Repeat → Continue with next topic
```

## Quick Start

### Basic Usage

**Step 1: Load recommendations from study optimizer**
```
"Load my study optimizer recommendations into the topic selector"
```

**Step 2: View all domains**
```
"Show me all EPPP domains and their completion status"
```

**Step 3: Expand a domain to see topics**
```
"Show me topics in Domain 5"
```

**Step 4: Select a topic to study**
```
"I want to study Neuropsychological Assessment"
```

**Step 5: Record quiz scores after studying**
```
"I scored 85% on the Neuropsychological Assessment quiz"
```

## Core Capabilities

### 1. Display All Domains

Shows all 8 EPPP domains with:
- Completion percentage (based on topics studied)
- Recommendation status (⭐ if contains recommended topics)
- Number of topics studied vs total topics
- Domain weight on exam

Use `scripts/topic_selector.py` function `display_domain_list()`

### 2. Display Topics in a Domain

Shows all topics within a specific domain with:
- Study status (✓ studied, ○ not studied)
- Quiz scores for each topic
- Recommendation status (⭐ if recommended)
- Domain completion percentage

Use `scripts/topic_selector.py` function `display_topic_list(domain_name)`

### 3. Select a Topic for Study

Displays information about a selected topic:
- Domain and topic name
- Recommendation status
- Current study status and quiz score
- Next steps for studying

Use `scripts/topic_selector.py` function `select_topic(domain_name, topic_name)`

### 4. Load Recommendations

Imports recommendations from study optimizer output:
- Parses optimizer report (text or JSON)
- Extracts recommended topics
- Marks them with ⭐ in displays

Use `scripts/optimizer_integration.py` functions

### 5. Track Progress

Records quiz scores and updates study status:
- Quiz score ≥ 80% marks topic as "studied"
- Updates domain completion percentages
- Maintains progress history

Use `scripts/progress_tracker.py` class `ProgressTracker`

## Display Format

### Domain View Legend
- ⭐ = Recommended by Study Optimizer
- ✓ = All topics studied
- ◐ = Partially studied  
- ○ = Not started

### Topic View Legend
- ⭐ = Recommended by Study Optimizer
- ✓ = Studied (80%+ quiz score)
- ○ = Not yet studied

## Workflow Example

```python
# 1. Initialize and load recommendations
from scripts.optimizer_integration import load_recommendations_from_file
load_recommendations_from_file("optimizer_report.txt")

# 2. Display all domains
from scripts.topic_selector import display_domain_list
print(display_domain_list())

# 3. User selects a domain to expand (e.g., Domain 5)
from scripts.topic_selector import display_topic_list
print(display_topic_list("Domain 5: Assessment & Diagnosis"))

# 4. User selects a topic to study
from scripts.topic_selector import select_topic
print(select_topic(
    "Domain 5: Assessment & Diagnosis",
    "Neuropsychological Assessment"
))

# 5. After studying and taking quiz, record score
from scripts.progress_tracker import ProgressTracker
tracker = ProgressTracker()
tracker.record_quiz_score(
    "Domain 5: Assessment & Diagnosis",
    "Neuropsychological Assessment",
    85  # 80%+ marks as studied
)

# 6. View updated progress
print(display_domain_list())
```

## Understanding Study Status

### What "Studied" Means
A topic is marked as studied (✓) when your quiz score is 80% or higher. This indicates mastery and readiness to move on.

### Quiz Scores Below 80%
If you score below 80%, the topic remains "○ Not yet studied". Review the material and retake the quiz to achieve 80%+.

### Domain Completion
Domain completion % = (Studied topics / Total topics) × 100

## Domain and Topic Structure

### Domain 1: Biological Bases of Behavior (10%)
- Neuroanatomy and Neurophysiology
- Neurotransmitters and Psychopharmacology
- Sensory and Perceptual Processes
- Sleep and Consciousness
- Genetics and Evolutionary Psychology

### Domain 2: Cognitive-Affective Bases (13%)
- Learning Theories and Classical Conditioning
- Operant Conditioning
- Cognitive Learning and Memory
- Language and Problem Solving
- Motivation and Emotion

### Domain 3: Social & Cultural Foundations (11%)
- Social Cognition and Attribution
- Attitudes and Attitude Change
- Group Dynamics and Conformity
- Cultural Psychology
- Organizational Psychology

### Domain 4: Growth & Lifespan Development (12%)
- Physical Development
- Cognitive Development
- Language Development
- Social and Emotional Development
- Moral Development and Identity
- Aging and Late Adulthood

### Domain 5: Assessment & Diagnosis (16%)
- Psychometric Properties
- Intelligence Testing
- Personality Assessment
- Neuropsychological Assessment
- Diagnosis and DSM Classification
- Test Construction and Validation

### Domain 6: Treatment, Intervention, and Prevention (15%)
- Psychodynamic and Humanistic Therapies
- Cognitive-Behavioral Therapies
- Family and Group Therapy
- Prevention and Community Interventions
- Treatment Efficacy and Evidence-Based Practice

### Domain 7: Research Methods & Statistics (7%)
- Research Design and Methodology
- Descriptive and Inferential Statistics
- Correlation and Regression
- Statistical Tests and Analysis
- Experimental Design and Validity

### Domain 8: Ethical, Legal & Professional Issues (16%)
- APA Ethics Code
- Professional Standards and Conduct
- Legal Issues and Mandates
- Multicultural Competence
- Supervision and Consultation

## Scripts Reference

### `progress_tracker.py`
Manages study progress for all domains and topics. Tracks quiz scores, study status, completion percentages, and maintains recommendations.

**Key Class:** `ProgressTracker`

**Key Methods:**
- `record_quiz_score(domain, topic, score)` - Record quiz result
- `get_domain_summary()` - Get all domains with status
- `get_topic_details(domain)` - Get topics in a domain
- `get_overall_progress()` - Get overall statistics

### `topic_selector.py`
Interactive display interface for domains and topics.

**Key Class:** `TopicSelector`

**Key Functions:**
- `display_domain_list()` - Show all domains
- `display_topic_list(domain_name)` - Show topics in domain
- `select_topic(domain_name, topic_name)` - Display selected topic

### `optimizer_integration.py`
Integrates with study optimizer to load recommendations.

**Key Functions:**
- `load_recommendations_from_file(file_path)` - Load from text
- `load_recommendations_from_json(file_path)` - Load from JSON

## Best Practices

1. Always load optimizer recommendations first
2. Follow the recommendation order (⭐ topics)
3. Study until you hit 80% on quizzes
4. Update progress immediately after quizzes
5. Focus on one topic at a time

---

**Version 1.0** - November 2025
**Integrates with**: eppp-study-optimizer, eppp-exam-generator
