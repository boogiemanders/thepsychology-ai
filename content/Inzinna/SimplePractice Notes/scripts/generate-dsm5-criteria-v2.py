#!/usr/bin/env python3

from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import subprocess
from pathlib import Path

import fitz


SECTION_II_START_PAGE = 126
SECTION_II_END_PAGE = 1103
CLASSIFICATION_START_PAGE = 41
CLASSIFICATION_END_PAGE = 91

TERMINATOR_PREFIXES = [
    "coding and recording procedures",
    "recording procedures",
    "diagnostic features",
    "associated features",
    "associated laboratory findings",
    "prevalence",
    "development and course",
    "risk and prognostic factors",
    "culture-related diagnostic issues",
    "sex- and gender-related diagnostic issues",
    "gender-related diagnostic issues",
    "association with suicidal thoughts or behavior",
    "suicide risk",
    "functional consequences",
    "differential diagnosis",
    "comorbidity",
    "diagnostic markers",
    "course modifiers",
    "subtypes",
    "specifiers",
]

TITLE_PREFIX_EXCLUSIONS = (
    "diagnostic criteria",
    "diagnostic features",
    "coding note",
    "note:",
    "specify",
    "specifiers",
    "subtypes",
    "recording procedures",
    "coding and recording procedures",
    "for a diagnosis",
    "criterion ",
    "single episode",
    "recurrent episodes",
    "with ",
    "without ",
    "posttransition",
)

TITLE_KEYWORD_RE = re.compile(
    r"\b("
    r"disorder|dysphoria|delirium|intoxication|withdrawal|"
    r"amnesia|enuresis|encopresis|neurocognitive|anorexia|"
    r"bulimia|narcolepsy|agoraphobia|pyromania|kleptomania|pica"
    r")\b",
    re.I,
)
CRITERION_START_RE = re.compile(r"^(?:[A-Z]|\d+|[a-z]|[ivxlcdm]+)\.", re.I)
CODE_RE = re.compile(r"^(.*?)(?:\s{2,}([A-Z][0-9A-Z.]+))\s*$")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate a comprehensive DSM-5-TR criteria dataset."
    )
    parser.add_argument(
        "--pdf",
        default="/Users/anderschan/Downloads/DSM 5 TR-APA (2022).pdf",
        help="Path to the DSM-5-TR PDF.",
    )
    parser.add_argument(
        "--out",
        default=(
            "content/Inzinna/SimplePractice Notes/src/data/"
            "dsm5-criteria-v2.ts"
        ),
        help="Output TypeScript file.",
    )
    return parser.parse_args()


def normalize_whitespace(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def normalize_name(text: str) -> str:
    text = text.replace("’", "'").replace("–", "-").replace("—", "-")
    text = re.sub(r"[^a-z0-9]+", " ", text.lower())
    return normalize_whitespace(text)


def is_page_number(text: str) -> bool:
    return bool(re.fullmatch(r"\d{1,4}", text.strip()))


def is_terminator(text: str) -> bool:
    normalized = normalize_whitespace(text).lower().rstrip(":")
    return any(normalized.startswith(prefix) for prefix in TERMINATOR_PREFIXES)


def split_title_code(raw: str) -> tuple[str, str | None]:
    raw = raw.rstrip()
    match = CODE_RE.match(raw)
    if match:
        return normalize_whitespace(match.group(1)), match.group(2)
    return normalize_whitespace(raw), None


def looks_like_title(raw: str) -> bool:
    normalized = normalize_whitespace(raw)
    if not normalized or is_page_number(normalized):
        return False
    if not normalized[0].isupper():
        return False
    if normalized.endswith(".") or normalized.endswith(":"):
        return False

    lower = normalized.lower()
    if lower.startswith(TITLE_PREFIX_EXCLUSIONS):
        return False
    if CRITERION_START_RE.match(normalized):
        return False
    if is_terminator(normalized):
        return False
    if len(normalized) > 160:
        return False
    return True


def next_nonempty(lines: list[str], start: int) -> int | None:
    for index in range(start, len(lines)):
        if normalize_whitespace(lines[index]):
            return index
    return None


def clean_criteria_lines(lines: list[str]) -> list[str]:
    cleaned: list[str] = []
    just_added_blank = False

    for raw in lines:
        stripped = raw.rstrip()
        normalized = normalize_whitespace(stripped)

        if not normalized or is_page_number(normalized):
            if cleaned and not just_added_blank:
                cleaned.append("")
                just_added_blank = True
            continue

        cleaned.append(stripped.strip())
        just_added_blank = False

    while cleaned and cleaned[0] == "":
        cleaned.pop(0)
    while cleaned and cleaned[-1] == "":
        cleaned.pop()

    compact: list[str] = []
    for line in cleaned:
        if line == "" and compact and compact[-1] == "":
            continue
        compact.append(line)

    return compact


def make_id(name: str) -> str:
    slug = name.lower().replace("’", "").replace("–", "-").replace("—", "-")
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    slug = re.sub(r"-+", "-", slug).strip("-")
    return slug


def extract_nearest_title_block(lines: list[str], index: int) -> tuple[str | None, str | None]:
    cursor = index - 1
    while cursor >= 0 and (
        not normalize_whitespace(lines[cursor])
        or is_page_number(normalize_whitespace(lines[cursor]))
    ):
        cursor -= 1

    if cursor < 0 or not looks_like_title(lines[cursor]):
        return None, None

    start = cursor
    while (
        start - 1 >= 0
        and normalize_whitespace(lines[start - 1])
        and not is_page_number(normalize_whitespace(lines[start - 1]))
        and looks_like_title(lines[start - 1])
    ):
        start -= 1

    parts: list[str] = []
    code: str | None = None
    last_part_normalized: str | None = None

    for line in lines[start : cursor + 1]:
        title_part, title_code = split_title_code(line)
        part_normalized = normalize_name(title_part)
        if part_normalized and part_normalized != last_part_normalized:
            parts.append(title_part)
            last_part_normalized = part_normalized
        code = code or title_code

    title = " ".join(parts).strip()
    return (title or None), code


def find_criterion_start_after_title(lines: list[str], start: int) -> int | None:
    saw_note = False

    for index in range(start, min(len(lines), start + 12)):
        normalized = normalize_whitespace(lines[index])
        if not normalized:
            continue
        if CRITERION_START_RE.match(normalized):
            return index
        if normalized.lower().startswith("note:"):
            saw_note = True
            continue
        if saw_note and not looks_like_title(lines[index]) and not is_terminator(lines[index]):
            continue
        return None

    return None


def title_block_at(lines: list[str], start: int) -> dict[str, object] | None:
    if not looks_like_title(lines[start]):
        return None

    end = start
    while end + 1 < len(lines) and normalize_whitespace(lines[end + 1]) and looks_like_title(lines[end + 1]):
        end += 1

    criterion_start = find_criterion_start_after_title(lines, end + 1)
    if criterion_start is None:
        return None

    parts: list[str] = []
    code: str | None = None
    last_part_normalized: str | None = None

    for line in lines[start : end + 1]:
        title_part, title_code = split_title_code(line)
        part_normalized = normalize_name(title_part)
        if part_normalized and part_normalized != last_part_normalized:
            parts.append(title_part)
            last_part_normalized = part_normalized
        code = code or title_code

    title = " ".join(parts).strip()
    if not title or not TITLE_KEYWORD_RE.search(title):
        return None

    return {
        "start": start,
        "end": end,
        "criterion_start": criterion_start,
        "title": title,
        "code": code,
    }


def get_section_ii_chapters(pdf_path: Path) -> list[tuple[str, int]]:
    document = fitz.open(pdf_path)
    toc = document.get_toc()

    chapters: list[tuple[str, int]] = []
    in_section_ii = False

    for level, title, page in toc:
        if level == 1 and "Section\xa0II" in title:
            in_section_ii = True
            continue
        if in_section_ii and level == 1 and "Section\xa0III" in title:
            break
        if in_section_ii and level == 2:
            chapters.append((title.replace("\xa0", " ").strip(), page))

    return chapters


def chapter_for_page(chapters: list[tuple[str, int]], physical_page: int) -> str | None:
    current: str | None = None
    for chapter, start_page in chapters:
        if physical_page >= start_page:
            current = chapter
        else:
            break
    return current


def extract_text_range(pdf_path: Path, start_page: int, end_page: int) -> str:
    command = [
        "pdftotext",
        "-layout",
        "-f",
        str(start_page),
        "-l",
        str(end_page),
        str(pdf_path),
        "-",
    ]
    result = subprocess.run(command, check=True, capture_output=True, text=True)
    return result.stdout


def build_entries(pdf_path: Path) -> list[dict[str, object]]:
    chapters = get_section_ii_chapters(pdf_path)

    section_text = extract_text_range(
        pdf_path,
        SECTION_II_START_PAGE,
        SECTION_II_END_PAGE,
    )
    pages = section_text.split("\f")

    criteria_pages: list[int] = []
    for offset, page_text in enumerate(pages):
        physical_page = SECTION_II_START_PAGE + offset
        if "Diagnostic Criteria" not in page_text:
            continue
        if page_text.lstrip().startswith("SECTION II"):
            continue
        criteria_pages.append(physical_page)

    entries: list[dict[str, object]] = []

    for index, physical_page in enumerate(criteria_pages):
        chapter = chapter_for_page(chapters, physical_page)
        if chapter is None:
            continue

        next_page = (
            criteria_pages[index + 1]
            if index + 1 < len(criteria_pages)
            else SECTION_II_START_PAGE + len(pages)
        )

        bundle_lines: list[str] = []
        for page in range(physical_page, next_page):
            bundle_lines.extend(pages[page - SECTION_II_START_PAGE].splitlines())

        diagnostic_index = next(
            line_index
            for line_index, line in enumerate(bundle_lines)
            if "Diagnostic Criteria" in line
        )

        parent_name, parent_code = extract_nearest_title_block(bundle_lines, diagnostic_index)
        if parent_code is None:
            _, parent_code = split_title_code(bundle_lines[diagnostic_index])

        if not parent_name and physical_page - 1 >= SECTION_II_START_PAGE:
            previous_lines = pages[physical_page - 1 - SECTION_II_START_PAGE].splitlines()
            parent_name, previous_code = extract_nearest_title_block(
                previous_lines,
                len(previous_lines),
            )
            parent_code = parent_code or previous_code

        if not parent_name:
            intro = " ".join(
                clean_criteria_lines(bundle_lines[diagnostic_index + 1 : diagnostic_index + 8])
            )
            intro_match = re.match(
                r"(.+?)\s+is\s+(?:a|an)\s+(?:disorder|condition)\b",
                intro,
                re.I,
            )
            if intro_match:
                parent_name = intro_match.group(1).strip()

        end_index = len(bundle_lines)
        for line_index in range(diagnostic_index + 1, len(bundle_lines)):
            if is_terminator(bundle_lines[line_index]):
                end_index = line_index
                break

        content_lines = clean_criteria_lines(bundle_lines[diagnostic_index + 1 : end_index])
        if not content_lines:
            continue

        title_blocks: list[dict[str, object]] = []
        cursor = 0
        while cursor < len(content_lines):
            block = title_block_at(content_lines, cursor)
            if block is None:
                cursor += 1
                continue
            title_blocks.append(block)
            cursor = int(block["criterion_start"])

        deduped_blocks: list[dict[str, object]] = []
        seen_title_norms: set[str] = set()
        parent_name_norm = normalize_name(parent_name or "")

        for block in title_blocks:
            title_norm = normalize_name(str(block["title"]))
            if not title_norm or title_norm in seen_title_norms:
                continue
            seen_title_norms.add(title_norm)
            if parent_name_norm and title_norm == parent_name_norm:
                continue
            deduped_blocks.append(block)

        if len(deduped_blocks) >= 2:
            shared_prefix = clean_criteria_lines(content_lines[: int(deduped_blocks[0]["start"])])
            for block_index, block in enumerate(deduped_blocks):
                stop = (
                    int(deduped_blocks[block_index + 1]["start"])
                    if block_index + 1 < len(deduped_blocks)
                    else len(content_lines)
                )
                criteria_slice = clean_criteria_lines(
                    shared_prefix
                    + content_lines[int(block["end"]) + 1 : stop]
                )
                entries.append(
                    {
                        "id": make_id(str(block["title"])),
                        "name": str(block["title"]),
                        "chapter": chapter,
                        "icd10Code": block["code"],
                        "sourcePdfPages": [physical_page, next_page - 1],
                        "sharedSectionTitle": parent_name,
                        "criteriaText": "\n".join(criteria_slice).strip(),
                    }
                )
            continue

        if not parent_name:
            continue

        entries.append(
            {
                "id": make_id(parent_name),
                "name": parent_name,
                "chapter": chapter,
                "icd10Code": parent_code,
                "sourcePdfPages": [physical_page, next_page - 1],
                "criteriaText": "\n".join(content_lines).strip(),
            }
        )

    filtered_entries: list[dict[str, object]] = []
    seen_keys: set[tuple[str, int, int]] = set()

    for entry in entries:
        name = str(entry["name"])
        criteria_text = str(entry["criteriaText"])
        key = (
            normalize_name(name),
            int(entry["sourcePdfPages"][0]),
            int(entry["sourcePdfPages"][1]),
        )
        if key in seen_keys:
            continue
        seen_keys.add(key)

        if normalize_name(name) in {
            "section ii diagnostic criteria and codes",
            "neurodevelopmental disorder",
        }:
            continue

        if (
            "A." not in criteria_text
            and "A pervasive pattern" not in criteria_text
            and "For a diagnosis of bipolar II disorder" not in criteria_text
        ):
            continue

        if entry.get("icd10Code") is None:
            entry.pop("icd10Code", None)
        if entry.get("sharedSectionTitle") is None:
            entry.pop("sharedSectionTitle", None)

        filtered_entries.append(entry)

    return filtered_entries


def render_typescript(entries: list[dict[str, object]], pdf_path: Path) -> str:
    generated_on = dt.date.today().isoformat()
    json_payload = json.dumps(entries, ensure_ascii=False, indent=2)

    return "\n".join(
        [
            f"// Generated from {pdf_path.name} on {generated_on}.",
            "// This file is script-generated by scripts/generate-dsm5-criteria-v2.py.",
            "",
            "export interface DSM5DiagnosisCriteriaV2 {",
            "  id: string",
            "  name: string",
            "  chapter: string",
            "  icd10Code?: string",
            "  sourcePdfPages: [number, number]",
            "  sharedSectionTitle?: string",
            "  criteriaText: string",
            "}",
            "",
            "export const DSM5_DIAGNOSES_V2: DSM5DiagnosisCriteriaV2[] = "
            + json_payload
            + "",
            "",
            "export const DSM5_DIAGNOSES_V2_MAP = Object.fromEntries(",
            "  DSM5_DIAGNOSES_V2.map((diagnosis) => [diagnosis.id, diagnosis])",
            ") as Record<string, DSM5DiagnosisCriteriaV2>",
            "",
        ]
    )


def main() -> None:
    args = parse_args()
    pdf_path = Path(args.pdf).expanduser().resolve()
    out_path = Path(args.out).resolve()

    if not pdf_path.is_file():
        raise FileNotFoundError(f"PDF not found: {pdf_path}")

    out_path.parent.mkdir(parents=True, exist_ok=True)

    # Smoke-check the PDF tool up front so failures are clearer.
    subprocess.run(["pdftotext", "-v"], check=False, capture_output=True, text=True)

    entries = build_entries(pdf_path)
    output = render_typescript(entries, pdf_path)
    out_path.write_text(output, encoding="utf-8")

    print(f"Wrote {len(entries)} diagnoses to {out_path}")


if __name__ == "__main__":
    main()
