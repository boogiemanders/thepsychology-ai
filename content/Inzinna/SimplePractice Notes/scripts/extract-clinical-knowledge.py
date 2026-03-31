#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import subprocess
import tempfile
import unicodedata
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "src" / "assets" / "clinical-knowledge"

GENERAL_ACTIONABLE_KEYWORDS = [
    "assessment",
    "behavioral activation",
    "case conceptualization",
    "case formulation",
    "chain analysis",
    "coping",
    "criteria",
    "craving",
    "crisis",
    "dbt",
    "diagnos",
    "distress tolerance",
    "emotion regulation",
    "evidence-based",
    "exposure",
    "functional analysis",
    "goal",
    "goals",
    "homework",
    "interpersonal effectiveness",
    "intervention",
    "manual",
    "mindfulness",
    "motivational interviewing",
    "objective",
    "objectives",
    "precipitat",
    "predispos",
    "protective factor",
    "psychoeducation",
    "relapse",
    "session",
    "skill",
    "skills",
    "stage of change",
    "strategy",
    "substance use",
    "safety plan",
    "treatment plan",
    "treatment planning",
    "technique",
    "therapy",
    "therapeutic",
    "transference",
    "worksheet",
]

FILTER_ACTIONABLE_KEYWORDS = [
    "assessment",
    "behavioral activation",
    "case conceptualization",
    "case formulation",
    "chain analysis",
    "contingency management",
    "diagnostic",
    "distress tolerance",
    "emotion regulation",
    "exposure",
    "functional analysis",
    "harm reduction",
    "interpersonal effectiveness",
    "motivational interviewing",
    "pharmacotherapy",
    "relapse prevention",
    "risk assessment",
    "safety plan",
    "skills training",
    "stage of change",
    "treatment plan",
    "treatment planning",
    "withdrawal management",
    "worksheet",
]

NONCLINICAL_MARKERS = [
    "about the author",
    "about the editors",
    "acknowledgments",
    "acquisitions editor",
    "all rights reserved",
    "author index",
    "contributing authors",
    "contributors",
    "copyright",
    "dedication",
    "extended contents",
    "foreword",
    "library of congress",
    "name index",
    "preface",
    "subject index",
    "table of contents",
]

TAG_KEYWORDS: dict[str, list[str]] = {
    "assessment": [
        "assessment",
        "diagnos",
        "diagnostic",
        "evaluate",
        "evaluation",
        "functional analysis",
        "intake",
        "screening",
    ],
    "formulation": [
        "case conceptualization",
        "case formulation",
        "conceptualization",
        "formulation",
        "predispos",
        "precipitat",
        "perpetuat",
        "protective factor",
        "schema",
        "transference",
    ],
    "treatment-planning": [
        "course of treatment",
        "goal",
        "goals",
        "objective",
        "objectives",
        "plan",
        "referral",
        "treatment plan",
        "treatment planning",
    ],
    "intervention": [
        "behavioral activation",
        "chain analysis",
        "contingency management",
        "coping",
        "distress tolerance",
        "exposure",
        "homework",
        "interpersonal effectiveness",
        "intervention",
        "mindfulness",
        "motivational interviewing",
        "problem-solving",
        "psychoeducation",
        "relapse prevention",
        "skill",
        "skills",
        "technique",
        "worksheet",
    ],
    "risk": [
        "crisis",
        "overdose",
        "risk",
        "safety",
        "self-harm",
        "suicid",
        "violence",
        "withdrawal",
    ],
    "substance-use": [
        "addiction",
        "alcohol",
        "cannabis",
        "co-occurring",
        "craving",
        "detox",
        "intoxication",
        "opioid",
        "relapse",
        "substance use",
        "withdrawal",
    ],
    "dbt": [
        "dbt",
        "distress tolerance",
        "emotion regulation",
        "interpersonal effectiveness",
        "mindfulness",
        "walking the middle path",
    ],
    "cbt": [
        "behavioral activation",
        "cbt",
        "cognitive behavior therapy",
        "exposure",
        "functional analysis",
        "reinforcement",
    ],
    "mi": [
        "change talk",
        "motivational interviewing",
        "roll with resistance",
        "sustain talk",
        "stages of change",
    ],
    "psychodynamic": [
        "countertransference",
        "defense",
        "mentalization",
        "object relations",
        "personality organization",
        "psychodynamic",
        "transference",
    ],
}


@dataclass(frozen=True)
class PdfSpec:
    resource_id: str
    pdf_path: Path
    title: str
    authors: list[str]
    modality: str
    focus_tags: list[str]
    extraction_mode: str = "all"
    include_neighbors: int = 0
    keep_keywords: list[str] | None = None


PDF_SPECS = [
    PdfSpec(
        resource_id="dbt-skills-manual-adolescents",
        pdf_path=Path("/Users/anderschan/Downloads/DBT® Skills Manual for Adolescents (Jill H. Rathus, Alec L. Miller) (z-library.sk, 1lib.sk, z-lib.sk).pdf"),
        title="DBT Skills Manual for Adolescents",
        authors=["Jill H. Rathus", "Alec L. Miller"],
        modality="dbt",
        focus_tags=["adolescents", "dbt", "skills training", "treatment planning"],
    ),
    PdfSpec(
        resource_id="dbt-skills-training-handouts-worksheets-2e",
        pdf_path=Path("/Users/anderschan/Downloads/DBT® Skills Training Handouts and Worksheets, Second Edition -- Marsha M_ Linehan -- Oct 21, 2014 -- Guilford Publications -- 9781462517824 -- e05de28dc22850ad492651edb0ad79f6 -- Anna’s Archive.pdf"),
        title="DBT Skills Training Handouts and Worksheets, Second Edition",
        authors=["Marsha M. Linehan"],
        modality="dbt",
        focus_tags=["adult", "dbt", "handouts", "worksheets"],
    ),
    PdfSpec(
        resource_id="asam-principles-of-addiction-medicine-7e",
        pdf_path=Path("/Users/anderschan/Downloads/The ASAM Principles of Addiction Medicine -- Shannon C Miller; Sharon Levy; Richard N Rosenthal; Andrew J -- 7, 2024 -- Lippincott Williams & Wilkins -- 9781975201562 -- 0844fe050d3da6121469b519271ea908 -- Anna’s Archive.pdf"),
        title="The ASAM Principles of Addiction Medicine",
        authors=["Shannon C. Miller", "Sharon Levy", "Richard N. Rosenthal", "Andrew J. Saxon"],
        modality="addiction-medicine",
        focus_tags=["addiction", "substance use", "withdrawal", "treatment planning"],
        extraction_mode="filtered",
        include_neighbors=1,
        keep_keywords=[
            "assessment",
            "care plan",
            "co-occurring",
            "contingency management",
            "craving",
            "detox",
            "harm reduction",
            "intoxication",
            "motivational interviewing",
            "opioid",
            "pharmacotherapy",
            "relapse prevention",
            "screening",
            "stages of change",
            "withdrawal",
        ],
    ),
    PdfSpec(
        resource_id="behavioral-interventions-cbt-2e",
        pdf_path=Path("/Users/anderschan/Downloads/Behavioral Interventions in Cognitive Behavior Therapy -  Practical Guidance for Putting Theory Into Action - Farmer and Chapman (1).pdf"),
        title="Behavioral Interventions in Cognitive Behavior Therapy: Practical Guidance for Putting Theory Into Action, Second Edition",
        authors=["Richard F. Farmer", "Alexander L. Chapman"],
        modality="cbt",
        focus_tags=["behavioral interventions", "cbt", "homework", "treatment planning"],
    ),
    PdfSpec(
        resource_id="case-formulation-approach-cbt",
        pdf_path=Path("/Users/anderschan/Downloads/The Case Formulation Approach to Cognitive-Behavior Therapy (Guides to Individualized Evidence-Based Treatment) - Parsons (1).pdf"),
        title="The Case Formulation Approach to Cognitive-Behavior Therapy",
        authors=["Jeffrey B. Persons"],
        modality="cbt",
        focus_tags=["case formulation", "cbt", "diagnosis", "treatment planning"],
    ),
    PdfSpec(
        resource_id="motivational-interviewing-helping-people-change-and-grow",
        pdf_path=Path("/Users/anderschan/Downloads/Motivational Interviewing Helping People Change and Grow (William R. Miller, Stephen Rollnick) (z-library.sk, 1lib.sk, z-lib.sk).pdf"),
        title="Motivational Interviewing: Helping People Change and Grow",
        authors=["William R. Miller", "Stephen Rollnick"],
        modality="mi",
        focus_tags=["change talk", "engagement", "motivational interviewing", "substance use"],
    ),
    PdfSpec(
        resource_id="psychoanalytic-case-formulation",
        pdf_path=Path("/Users/anderschan/Downloads/Psychoanalytic case formulation (Nancy McWilliams) (z-library.sk, 1lib.sk, z-lib.sk).pdf"),
        title="Psychoanalytic Case Formulation",
        authors=["Nancy McWilliams"],
        modality="psychodynamic",
        focus_tags=["case formulation", "psychodynamic", "personality", "transference"],
    ),
    PdfSpec(
        resource_id="psychodynamic-diagnostic-manual-pdm-3",
        pdf_path=Path("/Users/anderschan/Downloads/Psychodynamic Diagnostic Manual Third Edition PDM-3 (Vittorio Lingiardi, Nancy McWilliams) (z-library.sk, 1lib.sk, z-lib.sk).pdf"),
        title="Psychodynamic Diagnostic Manual, Third Edition",
        authors=["Vittorio Lingiardi", "Nancy McWilliams"],
        modality="psychodynamic",
        focus_tags=["assessment", "diagnosis", "mental functioning", "psychodynamic formulation"],
        extraction_mode="filtered",
        include_neighbors=1,
        keep_keywords=[
            "assessment",
            "attachment",
            "case formulation",
            "countertransference",
            "defense",
            "mental functioning",
            "mentalization",
            "personality organization",
            "risk assessment",
            "transference",
        ],
    ),
]


def run(args: list[str]) -> str:
    return subprocess.check_output(args, text=True, errors="replace")


def normalize_whitespace(text: str) -> str:
    text = unicodedata.normalize("NFKC", text.replace("\u00a0", " "))
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    return text


def parse_pdfinfo(pdf_path: Path) -> dict[str, Any]:
    info_text = run(["pdfinfo", str(pdf_path)])
    info: dict[str, Any] = {}
    for line in info_text.splitlines():
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        info[key.strip()] = value.strip()
    pages = int(info.get("Pages", "0") or "0")
    return {
        "title": info.get("Title", "") or pdf_path.stem,
        "author": info.get("Author", ""),
        "producer": info.get("Producer", ""),
        "creator": info.get("Creator", ""),
        "creationDate": info.get("CreationDate", ""),
        "modDate": info.get("ModDate", ""),
        "pages": pages,
        "fileSizeBytes": pdf_path.stat().st_size,
    }


def extract_pdf_text(pdf_path: Path) -> list[str]:
    with tempfile.NamedTemporaryFile(suffix=".txt", delete=False) as handle:
        tmp_path = Path(handle.name)

    try:
        subprocess.check_call(["pdftotext", "-layout", "-enc", "UTF-8", str(pdf_path), str(tmp_path)])
        raw = normalize_whitespace(tmp_path.read_text(encoding="utf-8", errors="replace"))
    finally:
        if tmp_path.exists():
            tmp_path.unlink()

    return [page for page in raw.split("\f")]


def is_noise_line(line: str) -> bool:
    lower = line.lower().strip()
    if not lower:
        return False
    if re.fullmatch(r"\d+", lower):
        return True
    noise_phrases = [
        "anna's archive",
        "z-library",
        "z-lib",
        "1lib.sk",
        "copyrighted material",
        "all rights reserved",
    ]
    return any(phrase in lower for phrase in noise_phrases)


def clean_page_text(page_text: str) -> str:
    lines = [re.sub(r"\s+", " ", line.strip()) for line in page_text.splitlines()]
    lines = [line for line in lines if line and not is_noise_line(line)]
    paragraphs: list[str] = []
    current = ""
    for line in lines:
        if not line:
            if current:
                paragraphs.append(current.strip())
                current = ""
            continue
        if not current:
            current = line
            continue
        if current.endswith("-") and not current.endswith(" -"):
            current = current[:-1] + line
        else:
            current = f"{current} {line}"
    if current:
        paragraphs.append(current.strip())
    return "\n\n".join(paragraphs).strip()


def choose_heading(page_text: str) -> str:
    lines = [re.sub(r"\s+", " ", line.strip()) for line in page_text.splitlines()]
    candidates = [line for line in lines if line and not is_noise_line(line)]
    for line in candidates[:8]:
        if len(line) > 140:
            continue
        if re.fullmatch(r"chapter\s+\d+.*", line.lower()) or re.fullmatch(r"appendix.*", line.lower()):
            return line
        if line.isupper():
            return line.title()
        alpha_ratio = sum(char.isalpha() for char in line) / max(len(line), 1)
        if alpha_ratio > 0.65:
            return line
    return ""


def collect_tags(text: str, modality: str, focus_tags: list[str]) -> list[str]:
    lower = text.lower()
    tags = set(focus_tags)
    tags.add(modality)
    for tag, keywords in TAG_KEYWORDS.items():
        if any(keyword in lower for keyword in keywords):
            tags.add(tag)
    return sorted(tags)


def estimate_tokens(text: str) -> int:
    return max(1, int(len(text.split()) * 1.3))


def count_keyword_hits(text: str, keywords: list[str]) -> int:
    lower = text.lower()
    return len({keyword for keyword in keywords if keyword in lower})


def is_nonclinical_page(cleaned_text: str) -> bool:
    lower = cleaned_text.lower()
    first_k = lower[:1200]
    if any(marker in first_k for marker in NONCLINICAL_MARKERS):
        return True
    if lower.startswith("contents\n") or lower.startswith("contents "):
        return True
    return False


def build_chunk(resource_id: str, page_number: int, raw_page_text: str, spec: PdfSpec) -> dict[str, Any] | None:
    cleaned = clean_page_text(raw_page_text)
    if len(cleaned) < 250:
        return None

    heading = choose_heading(raw_page_text)
    tags = collect_tags(cleaned, spec.modality, spec.focus_tags)
    preview = cleaned[:300]
    if len(cleaned) > 300:
        preview = preview.rstrip() + "..."

    return {
        "id": f"{resource_id}-p{page_number}",
        "pageStart": page_number,
        "pageEnd": page_number,
        "heading": heading,
        "preview": preview,
        "tags": tags,
        "estimatedTokens": estimate_tokens(cleaned),
        "text": cleaned,
    }


def should_keep_page(cleaned_text: str, spec: PdfSpec) -> bool:
    if len(cleaned_text) < 250 or is_nonclinical_page(cleaned_text):
        return False

    if spec.extraction_mode == "all":
        return True

    keywords = [keyword.lower() for keyword in (spec.keep_keywords or [])]
    specific_hits = count_keyword_hits(cleaned_text, keywords)
    actionable_hits = count_keyword_hits(cleaned_text, FILTER_ACTIONABLE_KEYWORDS)
    return specific_hits >= 1 or actionable_hits >= 2


def page_selection(pages: list[str], spec: PdfSpec) -> set[int]:
    if spec.extraction_mode == "all":
        return {
            index
            for index, page in enumerate(pages, start=1)
            if should_keep_page(clean_page_text(page), spec)
        }

    matched = {
        index
        for index, page in enumerate(pages, start=1)
        if should_keep_page(clean_page_text(page), spec)
    }
    selected = set(matched)
    for page_number in matched:
        for offset in range(1, spec.include_neighbors + 1):
            if page_number - offset >= 1:
                selected.add(page_number - offset)
            if page_number + offset <= len(pages):
                selected.add(page_number + offset)
    return selected


def build_resource(spec: PdfSpec) -> dict[str, Any]:
    if not spec.pdf_path.exists():
        raise FileNotFoundError(f"Missing PDF: {spec.pdf_path}")

    metadata = parse_pdfinfo(spec.pdf_path)
    pages = extract_pdf_text(spec.pdf_path)
    selected_pages = page_selection(pages, spec)
    chunks = []

    for page_number, page_text in enumerate(pages, start=1):
        if page_number not in selected_pages:
            continue
        chunk = build_chunk(spec.resource_id, page_number, page_text, spec)
        if chunk is not None:
            chunks.append(chunk)

    tags = sorted(set(spec.focus_tags + [spec.modality]))
    return {
        "id": spec.resource_id,
        "title": spec.title,
        "authors": spec.authors,
        "modality": spec.modality,
        "focusTags": tags,
        "source": {
            "pdfPath": str(spec.pdf_path),
            "extractionMode": spec.extraction_mode,
            "includeNeighbors": spec.include_neighbors,
        },
        "metadata": metadata,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "chunkCount": len(chunks),
        "chunks": chunks,
    }


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(payload, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )


def build_manifest(resources: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "version": 1,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "resourceCount": len(resources),
        "resources": [
            {
                "id": resource["id"],
                "title": resource["title"],
                "authors": resource["authors"],
                "modality": resource["modality"],
                "focusTags": resource["focusTags"],
                "pageCount": resource["metadata"]["pages"],
                "chunkCount": resource["chunkCount"],
                "path": f"assets/clinical-knowledge/{resource['id']}.json",
            }
            for resource in resources
        ],
    }


def build_index(resources: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "version": 1,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "entries": [
            {
                "resourceId": resource["id"],
                "resourceTitle": resource["title"],
                "resourceModality": resource["modality"],
                "chunk": {
                    "id": chunk["id"],
                    "pageStart": chunk["pageStart"],
                    "pageEnd": chunk["pageEnd"],
                    "heading": chunk["heading"],
                    "preview": chunk["preview"],
                    "tags": chunk["tags"],
                    "estimatedTokens": chunk["estimatedTokens"],
                },
            }
            for resource in resources
            for chunk in resource["chunks"]
        ],
    }


def main() -> None:
    resources = [build_resource(spec) for spec in PDF_SPECS]
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for resource in resources:
        write_json(OUT_DIR / f"{resource['id']}.json", resource)
    write_json(OUT_DIR / "manifest.json", build_manifest(resources))
    write_json(OUT_DIR / "index.json", build_index(resources))
    print(f"Wrote {len(resources)} resources to {OUT_DIR}")
    for resource in resources:
        print(
            f"- {resource['id']}: {resource['chunkCount']} chunks "
            f"from {resource['metadata']['pages']} pages"
        )


if __name__ == "__main__":
    main()
