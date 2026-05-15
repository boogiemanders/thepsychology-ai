#!/usr/bin/env python3
"""Generate 20 questions for each of 52 source files."""

import json
import os
import re
from pathlib import Path
from typing import Dict, List
import anthropic
import time

# Configuration
SOURCE_ROOT = Path("/Users/anderschan/thepsychology-ai/eppp-reference")
OUTPUT_ROOT = Path("/Users/anderschan/thepsychology-ai/questions")

# Define all 52 files in priority order
PRIORITY_FILES = [
    # ASSESSMENT FILES (16 files)
    {
        "source": "5 Assessment/5 Stanford-Binet and Wechsler Tests.md",
        "output": "5 Assessment/5 Stanford-Binet and Wechsler Tests done.md",
        "kn_id": "KN28",
    },
    {
        "source": "5 Assessment/5 Clinical Tests.md",
        "output": "5 Assessment/5 Clinical Tests done.md",
        "kn_id": "KN25",
    },
    {
        "source": "5 Assessment/5 MMPI-2.md",
        "output": "5 Assessment/5 MMPI-2 done.md",
        "kn_id": "KN28",
    },
    {
        "source": "5 Assessment/5 Interest Inventories.md",
        "output": "5 Assessment/5 Interest Inventories done.md",
        "kn_id": "KN29",
    },
    {
        "source": "5 Assessment/5 Other Measures of Cognitive Ability.md",
        "output": "5 Assessment/5 Other Measures of Cognitive Ability done.md",
        "kn_id": "KN28",
    },
    {
        "source": "5 Assessment/5 Other Measures of Personality.md",
        "output": "5 Assessment/5 Other Measures of Personality done.md",
        "kn_id": "KN28",
    },
    {
        "source": "5 Test Construction/5 Item Analysis and Test Reliability.md",
        "output": "5 Test Construction/5 Item Analysis and Test Reliability done.md",
        "kn_id": "KN26",
    },
    {
        "source": "5 Test Construction/5 Test Validity – Content and Construct Validity.md",
        "output": "5 Test Construction/5 Test Validity – Content and Construct Validity done.md",
        "kn_id": "KN26",
    },
    {
        "source": "5 Test Construction/5 Test Validity – Criterion-Related Validity.md",
        "output": "5 Test Construction/5 Test Validity – Criterion-Related Validity done.md",
        "kn_id": "KN26",
    },
    {
        "source": "5 Test Construction/5 Test Score Interpretation.md",
        "output": "5 Test Construction/5 Test Score Interpretation done.md",
        "kn_id": "KN26",
    },
    # PSYCHOPATHOLOGY/DIAGNOSIS FILES (11 files)
    {
        "source": "5 Diagnosis : Psychopathology/5 Neurodevelopmental Disorders.md",
        "output": "5 Diagnosis : Psychopathology/5 Neurodevelopmental Disorders done.md",
        "kn_id": "KN18",
    },
    {
        "source": "5 Diagnosis : Psychopathology/5 Disruptive, Impulse-Control, and Conduct Disorders.md",
        "output": "5 Diagnosis : Psychopathology/5 Disruptive, Impulse-Control, and Conduct Disorders done.md",
        "kn_id": "KN18",
    },
    {
        "source": "5 Diagnosis : Psychopathology/5 Bipolar and Depressive Disorders.md",
        "output": "5 Diagnosis : Psychopathology/5 Bipolar and Depressive Disorders done.md",
        "kn_id": "KN20",
    },
    {
        "source": "5 Diagnosis : Psychopathology/5 Anxiety Disorders and Obsessive-Compulsive Disorder.md",
        "output": "5 Diagnosis : Psychopathology/5 Anxiety Disorders and Obsessive-Compulsive Disorder done.md",
        "kn_id": "KN21",
    },
    {
        "source": "5 Diagnosis : Psychopathology/5 Trauma-Stressor-Related, Dissociative, and Somatic Symptom Disorders.md",
        "output": "5 Diagnosis : Psychopathology/5 Trauma-Stressor-Related, Dissociative, and Somatic Symptom Disorders done.md",
        "kn_id": "KN21",
    },
    {
        "source": "5 Diagnosis : Psychopathology/5 Feeding-Eating, Elimination, and Sleep-Wake Disor.md",
        "output": "5 Diagnosis : Psychopathology/5 Feeding-Eating, Elimination, and Sleep-Wake Disor done.md",
        "kn_id": "KN22",
    },
    {
        "source": "5 Diagnosis : Psychopathology/5 Substance-Related and Addictive Disorders.md",
        "output": "5 Diagnosis : Psychopathology/5 Substance-Related and Addictive Disorders done.md",
        "kn_id": "KN22",
    },
    {
        "source": "5 Diagnosis : Psychopathology/5 Personality Disorders.md",
        "output": "5 Diagnosis : Psychopathology/5 Personality Disorders done.md",
        "kn_id": "KN24",
    },
    {
        "source": "5 Diagnosis : Psychopathology/5 Sexual Dysfunctions, Gender Dysphoria, and Paraphilic Disorders.md",
        "output": "5 Diagnosis : Psychopathology/5 Sexual Dysfunctions, Gender Dysphoria, and Paraphilic Disorders done.md",
        "kn_id": "KN24",
    },
    {
        "source": "5 Diagnosis : Psychopathology/5 Schizophrenia Spectrum-Other Psychotic Disorders.md",
        "output": "5 Diagnosis : Psychopathology/5 Schizophrenia Spectrum-Other Psychotic Disorders done.md",
        "kn_id": "KN19",
    },
    {
        "source": "5 Diagnosis : Psychopathology/5 Neurocognitive Disorders.md",
        "output": "5 Diagnosis : Psychopathology/5 Neurocognitive Disorders done.md",
        "kn_id": "KN23",
    },
    # TREATMENT/INTERVENTION FILES (5 files)
    {
        "source": "6 Treatment, Intervention, and Prevention : Clinical Psychology/6 Psychodynamic and Humanistic Therapies.md",
        "output": "6 Treatment, Intervention, and Prevention : Clinical Psychology/6 Psychodynamic and Humanistic Therapies done.md",
        "kn_id": "KN30",
    },
    {
        "source": "6 Treatment, Intervention, and Prevention : Clinical Psychology/6 Cognitive-Behavioral Therapies.md",
        "output": "6 Treatment, Intervention, and Prevention : Clinical Psychology/6 Cognitive-Behavioral Therapies done.md",
        "kn_id": "KN31",
    },
    {
        "source": "6 Treatment, Intervention, and Prevention : Clinical Psychology/6 Family Therapies and Group Therapies.md",
        "output": "6 Treatment, Intervention, and Prevention : Clinical Psychology/6 Family Therapies and Group Therapies done.md",
        "kn_id": "KN33",
    },
    {
        "source": "6 Treatment, Intervention, and Prevention : Clinical Psychology/6 Brief Therapies.md",
        "output": "6 Treatment, Intervention, and Prevention : Clinical Psychology/6 Brief Therapies done.md",
        "kn_id": "KN31",
    },
    {
        "source": "6 Treatment, Intervention, and Prevention : Clinical Psychology/6 Prevention, Consultation, and Psychotherapy Research.md",
        "output": "6 Treatment, Intervention, and Prevention : Clinical Psychology/6 Prevention, Consultation, and Psychotherapy Research done.md",
        "kn_id": "KN35",
    },
    # ORGANIZATIONAL/PROFESSIONAL FILES (12 files)
    {
        "source": "2 3 5 6 Organizational Psychology/2 3 Satisfaction, Commitment, and Stress.md",
        "output": "2 3 5 6 Organizational Psychology/2 3 Satisfaction, Commitment, and Stress done.md",
        "kn_id": "KN37",
    },
    {
        "source": "2 3 5 6 Organizational Psychology/2 Theories of Motivation.md",
        "output": "2 3 5 6 Organizational Psychology/2 Theories of Motivation done.md",
        "kn_id": "KN48",
    },
    {
        "source": "2 3 5 6 Organizational Psychology/5 6 Job Analysis and Performance Assessment.md",
        "output": "2 3 5 6 Organizational Psychology/5 6 Job Analysis and Performance Assessment done.md",
        "kn_id": "KN37",
    },
    {
        "source": "2 3 5 6 Organizational Psychology/5 6 Organizational Decision-Making.md",
        "output": "2 3 5 6 Organizational Psychology/5 6 Organizational Decision-Making done.md",
        "kn_id": "KN37",
    },
    {
        "source": "2 3 5 6 Organizational Psychology/5 6 Organizational Leadership.md",
        "output": "2 3 5 6 Organizational Psychology/5 6 Organizational Leadership done.md",
        "kn_id": "KN37",
    },
    {
        "source": "2 3 5 6 Organizational Psychology/5 6 Training Methods and Evaluation.md",
        "output": "2 3 5 6 Organizational Psychology/5 6 Training Methods and Evaluation done.md",
        "kn_id": "KN37",
    },
    {
        "source": "2 3 5 6 Organizational Psychology/5 Employee Selection – Techniques.md",
        "output": "2 3 5 6 Organizational Psychology/5 Employee Selection – Techniques done.md",
        "kn_id": "KN37",
    },
    {
        "source": "2 3 5 6 Organizational Psychology/5 Employee Selection – Evaluation of Techniques.md",
        "output": "2 3 5 6 Organizational Psychology/5 Employee Selection – Evaluation of Techniques done.md",
        "kn_id": "KN37",
    },
    {
        "source": "2 3 5 6 Organizational Psychology/6 Job Analysis and Performance Assessment.md",
        "output": "2 3 5 6 Organizational Psychology/6 Job Analysis and Performance Assessment done.md",
        "kn_id": "KN37",
    },
    {
        "source": "2 3 5 6 Organizational Psychology/6 Organizational Theories.md",
        "output": "2 3 5 6 Organizational Psychology/6 Organizational Theories done.md",
        "kn_id": "KN37",
    },
    {
        "source": "2 3 5 6 Organizational Psychology/6 Organizational Change and Development.md",
        "output": "2 3 5 6 Organizational Psychology/6 Organizational Change and Development done.md",
        "kn_id": "KN37",
    },
    {
        "source": "2 3 5 6 Organizational Psychology/6 Career Choice and Development.md",
        "output": "2 3 5 6 Organizational Psychology/6 Career Choice and Development done.md",
        "kn_id": "KN37",
    },
    # RESEARCH/STATISTICS FILES (6 files)
    {
        "source": "7 Research Methods & Statistics/7 Types of Variables and Data.md",
        "output": "7 Research Methods & Statistics/7 Types of Variables and Data done.md",
        "kn_id": "KN50",
    },
    {
        "source": "7 Research Methods & Statistics/7 Overview of Inferential Statistics.md",
        "output": "7 Research Methods & Statistics/7 Overview of Inferential Statistics done.md",
        "kn_id": "KN51",
    },
    {
        "source": "7 Research Methods & Statistics/7 Inferential Statistical Tests.md",
        "output": "7 Research Methods & Statistics/7 Inferential Statistical Tests done.md",
        "kn_id": "KN51",
    },
    {
        "source": "7 Research Methods & Statistics/7 Correlation and Regression.md",
        "output": "7 Research Methods & Statistics/7 Correlation and Regression done.md",
        "kn_id": "KN51",
    },
    {
        "source": "7 Research Methods & Statistics/7 Research – Internal-External Validity.md",
        "output": "7 Research Methods & Statistics/7 Research – Internal-External Validity done.md",
        "kn_id": "KN50",
    },
    {
        "source": "7 Research Methods & Statistics/7 Research – Single-Subject and Group Designs.md",
        "output": "7 Research Methods & Statistics/7 Research – Single-Subject and Group Designs done.md",
        "kn_id": "KN50",
    },
    # ETHICS/LEGAL/PROFESSIONAL FILES (6 files)
    {
        "source": "8 Ethical : Legal : Professional Issues/8 APA Ethics Code Over and Standards 1 & 2.md",
        "output": "8 Ethical : Legal : Professional Issues/8 APA Ethics Code Over and Standards 1 & 2 done.md",
        "kn_id": "KN38",
    },
    {
        "source": "8 Ethical : Legal : Professional Issues/8 APA Ethics Code Standards 3 & 4.md",
        "output": "8 Ethical : Legal : Professional Issues/8 APA Ethics Code Standards 3 & 4 done.md",
        "kn_id": "KN39",
    },
    {
        "source": "8 Ethical : Legal : Professional Issues/8 APA Ethics Code Standards 5 & 6.md",
        "output": "8 Ethical : Legal : Professional Issues/8 APA Ethics Code Standards 5 & 6 done.md",
        "kn_id": "KN39",
    },
    {
        "source": "8 Ethical : Legal : Professional Issues/8 APA Ethics Code Standards 7 & 8.md",
        "output": "8 Ethical : Legal : Professional Issues/8 APA Ethics Code Standards 7 & 8 done.md",
        "kn_id": "KN40",
    },
    {
        "source": "8 Ethical : Legal : Professional Issues/8 APA Ethics Code Standards 9 & 10.md",
        "output": "8 Ethical : Legal : Professional Issues/8 APA Ethics Code Standards 9 & 10 done.md",
        "kn_id": "KN41",
    },
    {
        "source": "8 Ethical : Legal : Professional Issues/8 Professional Issues.md",
        "output": "8 Ethical : Legal : Professional Issues/8 Professional Issues done.md",
        "kn_id": "KN42",
    },
]

def read_source_file(file_path: Path) -> str:
    """Read source markdown file content."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        return ""

def generate_questions_with_claude(content: str, kn_id: str, file_name: str) -> List[Dict]:
    """Generate 20 questions using Claude API."""
    client = anthropic.Anthropic()

    prompt = f"""You are an expert EPPP (Examination for Professional Practice in Psychology) test question generator.

Generate exactly 20 multiple-choice questions based on the following source material:

---SOURCE MATERIAL---
{content[:4000]}
---END SOURCE---

Requirements:
1. Create 20 questions total with this distribution:
   - ~50% (10 questions): Basic recall/definition (type: "basic", difficulty: "easy")
   - ~20% (4 questions): Distinguish between concepts (type: "distinction", difficulty: "medium")
   - ~30% (6 questions): Advanced/application questions (type: "difficult", difficulty: "hard")

2. Format as JSON array with objects containing:
   - id: "q001", "q002", ... "q020"
   - difficulty: "easy" | "medium" | "hard"
   - type: "basic" | "distinction" | "difficult"
   - question: 1-2 sentence stem
   - options: {{"A": "option text", "B": "option text", "C": "option text", "D": "option text"}}
   - correct_answer: "A" | "B" | "C" | "D"
   - kn_id: "{kn_id}"
   - explanation: Brief 1-2 sentence explanation

3. Answer length balance: max variance <= 15 characters within each question's options
4. Concise stems (1-2 sentences), brief options (max 50 chars each)
5. Ensure all 4 options are plausible but clearly distinguishable
6. Cover main concepts and key details from the source material
7. All questions should be appropriate for EPPP level (doctoral-level psychology)

Return ONLY a valid JSON array with exactly 20 question objects. No markdown formatting, no code blocks."""

    message = client.messages.create(
        model="claude-opus-4-1-20250805",
        max_tokens=5000,
        messages=[
            {"role": "user", "content": prompt}
        ]
    )

    response_text = message.content[0].text

    # Try to parse JSON
    try:
        # Remove markdown code blocks if present
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0]
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0]

        response_text = response_text.strip()
        questions = json.loads(response_text)

        # Ensure we have exactly 20 questions
        if isinstance(questions, list) and len(questions) == 20:
            return questions
        else:
            print(f"  Warning: Got {len(questions) if isinstance(questions, list) else 'non-list'} questions instead of 20")
            return questions if isinstance(questions, list) else []
    except json.JSONDecodeError as e:
        print(f"  Error parsing JSON for {file_name}: {e}")
        return []

def save_questions(questions: List[Dict], output_path: Path, source_file: str):
    """Save questions to markdown file with JSON content."""
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Create the content with JSON
    content = json.dumps({
        "source_file": source_file.split('/')[-1],
        "questions": questions
    }, indent=2)

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"  Saved {len(questions)} questions to {output_path}")

def process_files():
    """Process all 52 files."""
    successful = 0
    failed = 0
    failed_files = []

    for i, file_config in enumerate(PRIORITY_FILES, 1):
        source_file = SOURCE_ROOT / file_config["source"]
        output_file = OUTPUT_ROOT / file_config["output"]

        print(f"\n[{i}/{len(PRIORITY_FILES)}] Processing: {file_config['source']}")

        # Read source content
        content = read_source_file(source_file)
        if not content:
            print(f"  ERROR: Could not read source file")
            failed += 1
            failed_files.append(file_config["source"])
            continue

        # Generate questions
        print(f"  Generating 20 questions...")
        questions = generate_questions_with_claude(content, file_config["kn_id"], file_config["source"])

        if not questions or len(questions) != 20:
            print(f"  ERROR: Failed to generate exactly 20 questions (got {len(questions) if questions else 0})")
            failed += 1
            failed_files.append(file_config["source"])
            continue

        # Save questions
        save_questions(questions, output_file, file_config["source"])
        successful += 1

        # Rate limiting to avoid API throttling
        if i < len(PRIORITY_FILES):
            time.sleep(1)

    print(f"\n\n{'='*60}")
    print(f"SUMMARY:")
    print(f"  Total files: {len(PRIORITY_FILES)}")
    print(f"  Successful: {successful}/{len(PRIORITY_FILES)}")
    print(f"  Failed: {failed}/{len(PRIORITY_FILES)}")

    if failed_files:
        print(f"\nFailed files:")
        for f in failed_files:
            print(f"  - {f}")

    print(f"{'='*60}")

if __name__ == "__main__":
    process_files()
