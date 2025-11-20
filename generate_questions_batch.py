#!/usr/bin/env python3
"""Generate 20 questions for each source file in priority order."""

import json
import os
import re
from pathlib import Path
from typing import Dict, List
import anthropic

# Configuration
SOURCE_ROOT = Path("/Users/anderschan/thepsychology-ai/eppp-reference")
OUTPUT_ROOT = Path("/Users/anderschan/thepsychology-ai/thepsychology-ai-main/questions")

# Define priority files
PRIORITY_FILES = [
    # DOMAIN 2 (5 files)
    {
        "source": "2 Cognitive-Affective Bases : Learning and Memory/2 Operant Conditioning.md",
        "output": "2 Cognitive-Affective Bases : Learning and Memory/2 Operant Conditioning done.md",
        "kn_id": "KN12",
        "domain": "2"
    },
    {
        "source": "2 Cognitive-Affective Bases : Learning and Memory/2 Memory and Forgetting.md",
        "output": "2 Cognitive-Affective Bases : Learning and Memory/2 Memory and Forgetting done.md",
        "kn_id": "KN8",
        "domain": "2"
    },
    {
        "source": "2 Cognitive-Affective Bases : Learning and Memory/2 Emotions and Stress.md",
        "output": "2 Cognitive-Affective Bases : Learning and Memory/2 Emotions and Stress done.md",
        "kn_id": "KN13",
        "domain": "2"
    },
    {
        "source": "2 Cognitive-Affective Bases : Learning and Memory/2 Interventions Based on Classical Conditioning.md",
        "output": "2 Cognitive-Affective Bases : Learning and Memory/2 Interventions Based on Classical Conditioning done.md",
        "kn_id": "KN12",
        "domain": "2"
    },
    {
        "source": "2 Cognitive-Affective Bases : Learning and Memory/2 Interventions Based on Operant Conditioning.md",
        "output": "2 Cognitive-Affective Bases : Learning and Memory/2 Interventions Based on Operant Conditioning done.md",
        "kn_id": "KN12",
        "domain": "2"
    },
    # DOMAIN 3 (9 files)
    {
        "source": "4 Growth & Lifespan Development/4 Early Influences on Development – Nature vs- Nurture.md",
        "output": "4 Growth & Lifespan Development/4 Early Influences on Development – Nature vs- Nurture done.md",
        "kn_id": "KN14",
        "domain": "3"
    },
    {
        "source": "4 Growth & Lifespan Development/4 Early Influences on Development – Prenatal Development.md",
        "output": "4 Growth & Lifespan Development/4 Early Influences on Development – Prenatal Development done.md",
        "kn_id": "KN14",
        "domain": "3"
    },
    {
        "source": "4 Growth & Lifespan Development/4 Physical Development.md",
        "output": "4 Growth & Lifespan Development/4 Physical Development done.md",
        "kn_id": "KN14",
        "domain": "3"
    },
    {
        "source": "4 Growth & Lifespan Development/4 Cognitive Development.md",
        "output": "4 Growth & Lifespan Development/4 Cognitive Development done.md",
        "kn_id": "KN15",
        "domain": "3"
    },
    {
        "source": "4 Growth & Lifespan Development/4 Language Development.md",
        "output": "4 Growth & Lifespan Development/4 Language Development done.md",
        "kn_id": "KN15",
        "domain": "3"
    },
    {
        "source": "4 Growth & Lifespan Development/4 Socioemotional Development – Attachment, Emotions, and Social Relationships.md",
        "output": "4 Growth & Lifespan Development/4 Socioemotional Development – Attachment, Emotions, and Social Relationships done.md",
        "kn_id": "KN16",
        "domain": "3"
    },
    {
        "source": "4 Growth & Lifespan Development/4 Socioemotional Development – Temperament and Personality.md",
        "output": "4 Growth & Lifespan Development/4 Socioemotional Development – Temperament and Personality done.md",
        "kn_id": "KN16",
        "domain": "3"
    },
    {
        "source": "4 Growth & Lifespan Development/4 Socioemotional Development – Moral Development.md",
        "output": "4 Growth & Lifespan Development/4 Socioemotional Development – Moral Development done.md",
        "kn_id": "KN16",
        "domain": "3"
    },
    {
        "source": "4 Growth & Lifespan Development/4 School and Family Influences.md",
        "output": "4 Growth & Lifespan Development/4 School and Family Influences done.md",
        "kn_id": "KN16",
        "domain": "3"
    },
    # DOMAIN 4 - SOCIAL/CULTURAL (10 files)
    {
        "source": "3 Social Psychology/3 Affiliation, Attraction, and Intimacy.md",
        "output": "3 Social Psychology/3 Affiliation, Attraction, and Intimacy done.md",
        "kn_id": "KN48",
        "domain": "4"
    },
    {
        "source": "3 Social Psychology/3 Attitudes and Attitude Change.md",
        "output": "3 Social Psychology/3 Attitudes and Attitude Change done.md",
        "kn_id": "KN48",
        "domain": "4"
    },
    {
        "source": "3 Social Psychology/3 Persuasion.md",
        "output": "3 Social Psychology/3 Persuasion done.md",
        "kn_id": "KN48",
        "domain": "4"
    },
    {
        "source": "3 Social Psychology/3 Prosocial Behavior and Prejudice-Discrimination.md",
        "output": "3 Social Psychology/3 Prosocial Behavior and Prejudice-Discrimination done.md",
        "kn_id": "KN49",
        "domain": "4"
    },
    {
        "source": "3 Social Psychology/3 Social Cognition – Causal Attributions.md",
        "output": "3 Social Psychology/3 Social Cognition – Causal Attributions done.md",
        "kn_id": "KN48",
        "domain": "4"
    },
    {
        "source": "3 Social Psychology/3 Social Cognition – Errors, Biases, and Heuristics.md",
        "output": "3 Social Psychology/3 Social Cognition – Errors, Biases, and Heuristics done.md",
        "kn_id": "KN48",
        "domain": "4"
    },
    {
        "source": "3 Social Psychology/3 Social Influence – Group Influences.md",
        "output": "3 Social Psychology/3 Social Influence – Group Influences done.md",
        "kn_id": "KN49",
        "domain": "4"
    },
    {
        "source": "3 Social Psychology/3 Social Influence – Types of Influence.md",
        "output": "3 Social Psychology/3 Social Influence – Types of Influence done.md",
        "kn_id": "KN49",
        "domain": "4"
    },
    {
        "source": "3 Cultural/3 Cross-Cultural Issues – Terms and Concepts.md",
        "output": "3 Cultural/3 Cross-Cultural Issues – Terms and Concepts done.md",
        "kn_id": "KN45",
        "domain": "4"
    },
    {
        "source": "3 Cultural/3 Cross-Cultural Issues – Identity Development Models.md",
        "output": "3 Cultural/3 Cross-Cultural Issues – Identity Development Models done.md",
        "kn_id": "KN47",
        "domain": "4"
    },
]

def read_source_file(file_path: Path) -> str:
    """Read source markdown file content."""
    try:
        with open(file_path, 'r') as f:
            return f.read()
    except FileNotFoundError:
        return ""

def generate_questions_with_claude(content: str, kn_id: str, file_name: str) -> List[Dict]:
    """Generate 20 questions using Claude API."""
    client = anthropic.Anthropic()

    prompt = f"""You are an expert EPPP (Examination for Professional Practice in Psychology) test question generator.

Generate exactly 20 multiple-choice questions based on the following source material:

---SOURCE MATERIAL---
{content[:3000]}  # Limit to first 3000 chars to save tokens
---END SOURCE---

Requirements:
1. Create 20 questions total with this distribution:
   - ~50% (10 questions): Basic recall/definition (type: "basic", difficulty: "easy")
   - ~20% (4 questions): Distinguish between concepts (type: "distinction", difficulty: "medium")
   - ~30% (6 questions): Advanced/application questions (type: "difficult", difficulty: "hard")

2. Format as JSON array with objects containing:
   - id: {{"id": "q_001", "id": "q_002", ... etc}}
   - difficulty: "easy" | "medium" | "hard"
   - type: "basic" | "distinction" | "difficult"
   - question: 1-2 sentence stem
   - options: {{"A": "...", "B": "...", "C": "...", "D": "..."}}
   - correct_answer: "A" | "B" | "C" | "D"
   - kn_id: "{kn_id}"
   - explanation: Brief explanation

3. Answer length balance: max variance ≤15 characters within each question's options
4. Concise stems (1-2 sentences), brief options (≤50 chars each)
5. Ensure options are plausible but clearly distinguishable
6. Cover main concepts from the source material

Return ONLY valid JSON array, no markdown formatting."""

    message = client.messages.create(
        model="claude-opus-4-1-20250805",
        max_tokens=4000,
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

        questions = json.loads(response_text)
        return questions
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON for {file_name}: {e}")
        return []

def save_questions(questions: List[Dict], output_path: Path):
    """Save questions to JSON file."""
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Convert to .json extension
    json_path = output_path.with_suffix('.json')

    with open(json_path, 'w') as f:
        json.dump(questions, f, indent=2)

    print(f"Saved {len(questions)} questions to {json_path}")

def process_files():
    """Process all priority files."""
    successful = 0
    failed = 0

    for i, file_config in enumerate(PRIORITY_FILES, 1):
        source_file = SOURCE_ROOT / file_config["source"]
        output_file = OUTPUT_ROOT / file_config["output"]

        print(f"\n[{i}/{len(PRIORITY_FILES)}] Processing: {file_config['source']}")

        # Read source content
        content = read_source_file(source_file)
        if not content:
            print(f"  ERROR: Could not read source file")
            failed += 1
            continue

        # Generate questions
        print(f"  Generating 20 questions...")
        questions = generate_questions_with_claude(content, file_config["kn_id"], file_config["source"])

        if not questions:
            print(f"  ERROR: Failed to generate questions")
            failed += 1
            continue

        # Save questions
        save_questions(questions, output_file)
        successful += 1

    print(f"\n\nSummary:")
    print(f"  Successful: {successful}/{len(PRIORITY_FILES)}")
    print(f"  Failed: {failed}/{len(PRIORITY_FILES)}")

if __name__ == "__main__":
    process_files()
