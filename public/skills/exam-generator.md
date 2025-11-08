---
name: eppp-exam-generator
description: Comprehensive EPPP (Examination for Professional Practice in Psychology) practice exam generator that creates 225-question exams following official domain weights and specifications. Use when users need to create practice exams for the EPPP Part 1-Knowledge exam, generate psychology assessment questions, create comparative psychology questions, develop difficult/unscored experimental items, or produce domain-specific psychology practice materials following ASPPB specifications.
---

# EPPP Practice Exam Generator

## Overview

This skill generates comprehensive 225-question practice exams for the EPPP (Examination for Professional Practice in Psychology) Part 1-Knowledge exam, strictly following official ASPPB domain weights and question specifications. Each exam includes validated questions, performance analytics, and personalized study recommendations.

## Quick Start

### Basic Usage
Simply request: "Generate an EPPP practice exam"

The skill will automatically:
- Create 225 questions with proper domain distribution
- Include 50+ comparative questions testing distinctions
- Generate 50 difficult/unscored experimental items
- Provide answer key with explanations
- Generate study recommendations based on performance

### Installation
1. Load the skill into your Claude environment
2. Ensure all reference materials are available
3. Run `python scripts/generate_exam.py` or request exam generation

### Output Options
- **JSON**: Machine-readable with complete metadata
- **Text**: Printable format for offline study
- **HTML**: Interactive web interface with timer

## Core Capabilities

### 1. Full Exam Generation
Generate complete 225-question practice exams with:
- Exact domain weight distribution (8 domains per ASPPB)
- 50+ comparative/distinction questions
- 50 difficult "unscored" experimental questions
- Source tracking for every question
- Knowledge Statement (KN1-KN71) coverage

### 2. Question Analysis Engine
Advanced content analysis that:
- Extracts testable concepts from study materials
- Identifies relationships and comparisons
- Finds prevalence rates and statistics
- Creates contextually appropriate distractors
- Ensures question validity

### 3. Domain-Specific Generation
Create questions for specific domains:
- Domain 1: Biological Bases (10%)
- Domain 2: Cognitive-Affective (13%)
- Domain 3: Social & Cultural (11%)
- Domain 4: Lifespan Development (12%)
- Domain 5: Assessment & Diagnosis (16%)
- Domain 6: Treatment/Intervention (15%)
- Domain 7: Research & Statistics (7%)
- Domain 8: Ethical/Legal/Professional (16%)

## Exam Generation Workflow

### Step 1: Initialize Generation
```python
from scripts.generate_exam import ExamGenerator

# Create generator with study materials
generator = ExamGenerator(references_path="references/")
```

### Step 2: Configure Parameters
Adjust domain distribution if needed (default follows ASPPB):
```python
# Standard ASPPB distribution
DOMAIN_CONFIG = {
    "Domain 1": {"count": 22, "percentage": "10%"},
    "Domain 2": {"count": 29, "percentage": "13%"},
    # ... etc
}
```

### Step 3: Generate Exam
```python
# Generate complete exam
exam = generator.generate_full_exam()

# Save in multiple formats
generator.save_exam(exam, "output/practice_exam.txt")
```

## Question Generation Rules

### Comparative Questions (50+ Required)
Must test distinctions between related concepts:
- Theory differences (e.g., CBT vs. DBT)
- Diagnostic differentials
- Treatment selection rationales
- Professional role boundaries

Example pattern:
```
"What is the primary difference between [Concept A] and [Concept B]?"
"Which best distinguishes [Theory X] from [Theory Y]?"
```

### Difficult/Unscored Questions (50 Required)
Focus on challenging, obscure details:
- Specific prevalence rates
- Lesser-known theorists
- Complex statistical formulas
- Detailed ethical codes
- Subtle conceptual distinctions

### Standard Questions
Cover fundamental knowledge:
- Core definitions
- Major theories
- Common interventions
- Basic statistics

## Content Sourcing Protocol

### Primary Sources (Domain-Specific)
Each domain MUST source from designated files:

```python
DOMAIN_SOURCES = {
    "Domain 1": ["1_Biological_Bases_*.md"],
    "Domain 2": ["2_Cognitive-Affective_*.md"],
    "Domain 3": ["3_Cultural.md", "3_Social_*.md", "3_5_6_Organizational_Psychology.md"],
    "Domain 4": ["4_Growth_*.md"],
    "Domain 5": ["5_Assessment.md", "5_Diagnosis_*.md", "5_Test_Construction.md", "3_5_6_Organizational_Psychology.md"],
    "Domain 6": ["6_Treatment_*.md", "3_5_6_Organizational_Psychology.md"],
    "Domain 7": ["7_Research_*.md"],
    "Domain 8": ["8_Ethical_*.md"]
}
```

### Content Extraction
Use the question engine for intelligent extraction:

```python
from scripts.question_engine import ContentAnalyzer

analyzer = ContentAnalyzer(content)
concepts = analyzer.extract_key_concepts()
facts = analyzer.find_testable_facts()
relationships = analyzer.identify_relationships()
```

## Output Specifications

### JSON Format (Machine-Readable)
Complete metadata for automated processing and analysis:
```json
{
  "exam_id": "EPPP_2025_001",
  "timestamp": "2025-11-01T10:30:00Z",
  "questions": [
    {
      "question_number": 1,
      "domain": "Domain 1: Biological Bases",
      "source_file": "1_Biological_Bases.md",
      "type": ["comparative"],
      "is_unscored": false,
      "stem": "According to Schachter-Singer theory...",
      "choices": {
        "A": "Emotion follows cognitive labeling",
        "B": "Arousal precedes cognition",
        "C": "Physiological response is emotion-specific",
        "D": "Facial feedback determines emotion"
      },
      "correct_answer": "A",
      "explanation": "Two-factor theory proposes...",
      "kn_reference": "KN3",
      "difficulty_level": "moderate"
    }
  ],
  "statistics": {
    "total_questions": 225,
    "comparative_count": 52,
    "unscored_count": 50,
    "domain_distribution": {...}
  }
}
```

### Text Format (Human-Readable)
Printable format for offline study:
```
EPPP PRACTICE EXAM #001
Generated: November 1, 2025
Total Questions: 225 | Time Limit: 4.5 hours

================================================

Question 1 [COMPARATIVE]
Domain: Biological Bases
Source: 1_Biological_Bases.md

According to Schachter-Singer theory, emotional experience results from:

  A. Emotion follows cognitive labeling of arousal
  B. Arousal precedes cognitive processing
  C. Physiological response is emotion-specific
  D. Facial feedback determines emotional experience

[Answer Key at end of exam]

================================================
```

### HTML Format (Interactive)
Web-based exam interface with timer and navigation:
```html
<!DOCTYPE html>
<html>
<head>
    <title>EPPP Practice Exam</title>
    <link rel="stylesheet" href="exam_style.css">
</head>
<body>
    <div class="exam-header">
        <div class="timer">Time Remaining: 4:30:00</div>
        <div class="progress">Question 1 of 225</div>
    </div>
    
    <div class="question-nav-grid">
        <!-- 225 numbered boxes for quick navigation -->
        <!-- Green = answered, Yellow = marked for review -->
    </div>
    
    <div class="question-display">
        <h3>Question 1</h3>
        <p>According to Schachter-Singer theory...</p>
        <div class="choices">
            <label><input type="radio" name="q1" value="A"> A. ...</label>
            <label><input type="radio" name="q1" value="B"> B. ...</label>
            <label><input type="radio" name="q1" value="C"> C. ...</label>
            <label><input type="radio" name="q1" value="D"> D. ...</label>
        </div>
        <button class="mark-review">Mark for Review</button>
    </div>
    
    <div class="navigation">
        <button class="prev">Previous</button>
        <button class="next">Next</button>
        <button class="submit">Submit Exam</button>
    </div>
</body>
</html>
```

Features of HTML format:
- **Timer**: Counts down from 4.5 hours
- **Navigation Grid**: Visual map of all 225 questions
- **Mark for Review**: Flag questions to revisit
- **Auto-Save**: Saves progress every 60 seconds
- **Scoring**: Immediate results upon submission
- **Review Mode**: Post-exam analysis with explanations

## Quality Validation

### Automatic Validation
Each exam undergoes comprehensive validation:

```bash
# Run validation
python scripts/exam_validator.py output/exam.json

# Validation Report:
EPPP EXAM VALIDATION REPORT
============================
✓ Total questions: 225
✓ Domain distribution: MATCHES ASPPB
  - Domain 1: 22/22 ✓
  - Domain 2: 29/29 ✓
  - Domain 3: 25/25 ✓
  - Domain 4: 27/27 ✓
  - Domain 5: 36/36 ✓
  - Domain 6: 34/34 ✓
  - Domain 7: 16/16 ✓
  - Domain 8: 36/36 ✓
✓ Comparative questions: 52 (≥50 required)
✓ Unscored questions: 50 (exactly 50 required)
✓ Source verification: All questions traced to valid files
✓ Duplicate check: No duplicate questions found
✓ Distractor quality: All options plausible
✓ Format compliance: EPPP standards met

EXAM STATUS: VALID ✅
```

### Manual Review Checklist
For additional quality assurance:
- [ ] Stems are 1-2 sentences maximum
- [ ] All choices are brief (terms or short phrases)
- [ ] No "All of the above" or "None of the above"
- [ ] Grammar consistent across all options
- [ ] Content directly from source materials
- [ ] No copyright violations or direct quotes
- [ ] Balanced difficulty distribution
- [ ] Comprehensive topic coverage

## Advanced Features

### Custom Question Generation
Generate specific question types programmatically:

```python
from scripts.question_engine import QuestionEngine

engine = QuestionEngine()

# Generate comparative question
question = engine.generate_comparative_question(
    concept1="Classical Conditioning",
    concept2="Operant Conditioning",
    distinction="Classical involves reflexive responses",
    distractors=["Both require reinforcement", 
                "Classical is more effective",
                "Operant is involuntary"]
)

# Generate application question
question = engine.generate_application_question(
    scenario="panic attacks in crowded spaces",
    intervention="systematic desensitization",
    distractors=["psychoanalysis", 
                "medication only",
                "supportive therapy"]
)
```

### Performance Analysis & Study Recommendations

### Analyze Practice Results
```python
python scripts/performance_analyzer.py exam.json answers.json

# Output:
Domain Performance:
- Domain 1: 18/22 (81.8%)
- Domain 2: 20/29 (69.0%)
...
Weakness Areas: Research Methods, Ethics
Recommended Study: Focus on Domain 7 & 8
```

### Interactive Review System
After completing a practice exam, use the review system with 5 sorting options:

```python
from scripts.performance_analyzer import ReviewSystem

review = ReviewSystem(exam, user_answers)

# Option 1: Review in original exam order
review.display_all_in_order(show_checkmarks=True)

# Option 2: Sort by weighted domain performance
# Formula: (100 - percent_wrong) * domain_weight
review.sort_by_weighted_performance()

# Option 3: Sort domains with <70% at top
review.sort_by_failing_domains(threshold=70)

# Option 4: Review all wrong answers first
review.display_wrong_first_then_correct()

# Option 5: Domain summary with source files
review.generate_study_summary()
```

### Study Recommendations Output
After review, the system provides:

1. **Top 3 Priority Domains** (weighted by importance):
   - Domain with highest `(100 - % correct) × domain_weight`
   - Specific source files containing missed questions
   - Recommended review time allocation

2. **Question-Level Analysis**:
   - Check/X marks for correct/incorrect
   - User's reasoning for their choice
   - Explanation of correct answer
   - Related concepts to review

3. **Personalized Study Plan**:
   ```
   Priority Study Areas:
   1. Domain 5: Assessment (Score: 58%, Weight: 16%)
      - Review: 5_Assessment.md (questions 23, 45, 78 missed)
      - Focus: Reliability vs validity distinctions
   
   2. Domain 8: Ethics (Score: 61%, Weight: 16%)
      - Review: 8_Ethical_Legal.md (questions 12, 89, 156 missed)
      - Focus: Mandatory reporting requirements
   
   3. Domain 2: Cognitive (Score: 69%, Weight: 13%)
      - Review: 2_Cognitive_Affective.md (questions 34, 102 missed)
      - Focus: Memory models and encoding strategies
   ```

## Resources

### Scripts
- `generate_exam.py`: Main exam generation engine
- `question_engine.py`: Advanced question creation algorithms
- `exam_validator.py`: Validates exam specifications
- `performance_analyzer.py`: Analyzes practice results

### References
Complete EPPP study materials organized by domain:
- Domain 1-8 markdown files with comprehensive content
- Knowledge Statement mappings (KN1-KN71)
- ASPPB exam specifications

### Assets
- `exam_template.html`: Web-based exam interface
- `scoring_rubric.json`: Official scoring guidelines
- `timer.js`: Exam timing simulator (4.5 hours)

## Usage Examples

### Generate Standard Practice Exam
```bash
python scripts/generate_exam.py
# Output: output/eppp_exam_[timestamp].json
#         output/eppp_exam_[timestamp].txt
```

### Generate Domain-Specific Questions
```python
# Generate 20 questions from Domain 5 only
generator.generate_domain_questions(
    "Domain 5: Assessment & Diagnosis",
    {"count": 20, "source_files": ["5_Assessment.md"]}
)
```

### Create Adaptive Difficulty Exam
```python
# Adjust difficulty distribution
exam = generator.generate_full_exam(
    difficulty_weights={
        "easy": 0.2,
        "medium": 0.5,
        "difficult": 0.3
    }
)
```

## Important Notes & Troubleshooting

### Critical Requirements
1. **Source Fidelity**: All questions MUST derive from provided study materials only
2. **Distribution Accuracy**: Domain percentages must match ASPPB exactly
3. **Question Quality**: Every distractor must be plausible but clearly incorrect
4. **No Repetition**: Questions must not duplicate content within an exam
5. **Marking System**: Unscored questions are secretly marked for tracking

### Performance Guidelines
- **Target Pass Rate**: 70% (varies by jurisdiction)
- **Time Allowance**: 4.5 hours for 225 questions (1.2 minutes per question)
- **Unscored Items**: 50 experimental questions don't count toward final score
- **Review Time**: Allow 2-3 hours for comprehensive post-exam review

### Troubleshooting

#### Generation Failures
If exam generation fails:
- Ensure all study materials are present in `references/`
- Check Python dependencies: `pip install -r requirements.txt`
- Verify sufficient memory (minimum 4GB RAM recommended)
- Review error logs in `logs/generation_errors.log`

#### Validation Errors
Common validation issues and fixes:
- **Domain count mismatch**: Check source file mapping
- **Missing comparative questions**: Adjust generation parameters
- **Duplicate content**: Clear question cache and regenerate
- **Invalid sources**: Verify reference files haven't been modified

#### Performance Issues
For slow generation:
- Process domains in parallel using `--parallel` flag
- Pre-cache content analysis with `--cache` option
- Reduce logging verbosity with `--quiet`

### Support & Updates
- Check for skill updates regularly for new features
- Report issues through the skill feedback system
- Custom modifications can be made to scripts as needed
