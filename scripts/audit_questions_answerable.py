#!/usr/bin/env python3
import csv
import glob
import json
import os
import re
import sys
from dataclasses import dataclass
from typing import Dict, Iterable, List, Optional, Sequence, Set, Tuple


STOPWORDS: Set[str] = {
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "because",
    "been",
    "being",
    "but",
    "by",
    "can",
    "could",
    "did",
    "do",
    "does",
    "doing",
    "for",
    "from",
    "had",
    "has",
    "have",
    "having",
    "he",
    "her",
    "hers",
    "him",
    "his",
    "how",
    "i",
    "if",
    "in",
    "into",
    "is",
    "it",
    "its",
    "may",
    "might",
    "more",
    "most",
    "must",
    "no",
    "not",
    "of",
    "on",
    "or",
    "our",
    "out",
    "over",
    "she",
    "should",
    "so",
    "some",
    "such",
    "than",
    "that",
    "the",
    "their",
    "them",
    "then",
    "there",
    "these",
    "they",
    "this",
    "those",
    "to",
    "under",
    "up",
    "us",
    "very",
    "was",
    "were",
    "what",
    "when",
    "which",
    "who",
    "why",
    "will",
    "with",
    "would",
    "you",
    "your",
}

TOKEN_RE = re.compile(r"[a-z0-9]+(?:'[a-z0-9]+)?")


def normalize_text(text: str) -> str:
    return text.replace("\u2013", "-").replace("\u2014", "-").replace("\u00a0", " ")


def tokenize(text: str) -> List[str]:
    return TOKEN_RE.findall(normalize_text(text).lower())


def keywords_from_text(text: str) -> List[str]:
    tokens = tokenize(text)
    keywords: List[str] = []
    for token in tokens:
        if len(token) < 3:
            continue
        if token in STOPWORDS:
            continue
        keywords.append(token)
    return keywords


def contains_answer(text_lower: str, answer: str) -> bool:
    answer = (answer or "").strip()
    if not answer:
        return False

    answer_lower = normalize_text(answer).lower()
    if len(answer_lower) <= 2:
        return answer_lower in text_lower

    if any(ch in answer_lower for ch in (" ", "-", "/")):
        return answer_lower in text_lower

    return re.search(rf"\b{re.escape(answer_lower)}\b", text_lower) is not None


def basename_no_ext(path: str) -> str:
    return os.path.splitext(os.path.basename(path))[0]


def safe_read(path: str) -> str:
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def normalize_name(name: str) -> str:
    name = normalize_text(name)
    name = re.sub(r"^\s*\d+\s*", "", name)
    name = name.replace("&", "and")
    name = name.replace("/", " ")
    name = name.replace("-", " ")
    name = re.sub(r"[^a-zA-Z0-9\s]+", " ", name)
    name = re.sub(r"\s+", " ", name).strip().lower()
    return name


def extract_frontmatter_topic_name(text: str) -> str:
    if not text.startswith("---"):
        return ""
    end = text.find("\n---", 3)
    if end == -1:
        return ""
    front = text[3:end]
    m = re.search(r"^topic_name:\s*(.+)\s*$", front, flags=re.MULTILINE)
    return m.group(1).strip() if m else ""


@dataclass
class TopicDoc:
    path: str
    text_lower: str
    tokens: Set[str]
    title_norm: str


@dataclass
class QuestionRow:
    question_file: str
    index_in_file: int
    stem: str
    answer: str


def load_questions(questions_root: str) -> List[QuestionRow]:
    rows: List[QuestionRow] = []
    for path in sorted(glob.glob(os.path.join(questions_root, "**/*.json"), recursive=True)):
        data = json.loads(safe_read(path))
        if isinstance(data, dict):
            questions = data.get("questions", [])
        elif isinstance(data, list):
            questions = data
        else:
            continue

        for idx, q in enumerate(questions):
            if not isinstance(q, dict):
                continue
            stem = str(q.get("stem", "") or "").strip()
            answer = str(q.get("answer", "") or "").strip()
            rows.append(QuestionRow(question_file=path, index_in_file=idx, stem=stem, answer=answer))
    return rows


def load_topic_docs(topic_root: str) -> Tuple[Dict[str, List[TopicDoc]], Dict[str, List[TopicDoc]]]:
    by_basename: Dict[str, List[TopicDoc]] = {}
    by_title_norm: Dict[str, List[TopicDoc]] = {}
    for path in sorted(glob.glob(os.path.join(topic_root, "**/*.md"), recursive=True)):
        text = safe_read(path)
        topic_name = extract_frontmatter_topic_name(text)
        title_norm = normalize_name(topic_name) if topic_name else normalize_name(basename_no_ext(path))
        doc = TopicDoc(
            path=path,
            text_lower=normalize_text(text).lower(),
            tokens=set(tokenize(text)),
            title_norm=title_norm,
        )
        by_basename.setdefault(basename_no_ext(path), []).append(doc)
        by_title_norm.setdefault(title_norm, []).append(doc)
    return by_basename, by_title_norm


def domain_prefix(path: str) -> str:
    parts = path.replace("\\", "/").split("/")
    if len(parts) < 2:
        return ""
    m = re.match(r"^\s*(\d+)", parts[1])
    return m.group(1) if m else ""


def pick_best_doc(
    candidates: Sequence[TopicDoc], stem_keywords: Sequence[str], preferred_domain: str
) -> Optional[TopicDoc]:
    if not candidates:
        return None
    if len(candidates) == 1:
        return candidates[0]

    scored: List[Tuple[int, int, TopicDoc]] = []
    for doc in candidates:
        hit = sum(1 for k in stem_keywords if k in doc.tokens)
        doc_domain = domain_prefix(doc.path)
        domain_bonus = 1 if preferred_domain and doc_domain == preferred_domain else 0
        scored.append((domain_bonus, hit, doc))

    scored.sort(key=lambda t: (t[0], t[1]), reverse=True)
    return scored[0][2]


def best_doc_global(topic_docs: Iterable[TopicDoc], stem_keywords: Sequence[str]) -> Optional[Tuple[TopicDoc, int]]:
    best: Optional[Tuple[TopicDoc, int]] = None
    for doc in topic_docs:
        hit = sum(1 for k in stem_keywords if k in doc.tokens)
        if best is None or hit > best[1]:
            best = (doc, hit)
    return best


def classify(stem_cov: float, answer_present: bool, keywords_total: int) -> str:
    if answer_present:
        return "yes_high"
    if keywords_total == 0:
        return "no_low"
    if stem_cov >= 0.60:
        return "yes_high"
    if stem_cov >= 0.40:
        return "yes_medium"
    if stem_cov >= 0.25:
        return "maybe"
    return "no_low"


def main() -> int:
    questions_root = sys.argv[1] if len(sys.argv) > 1 else "questionsGPT"
    topic_root = sys.argv[2] if len(sys.argv) > 2 else "topic-content-v3-test"
    out_tsv = sys.argv[3] if len(sys.argv) > 3 else "questionsGPT_answerability_report.tsv"
    out_summary = sys.argv[4] if len(sys.argv) > 4 else "questionsGPT_answerability_summary.txt"

    questions = load_questions(questions_root)
    topic_by_basename, topic_by_title_norm = load_topic_docs(topic_root)
    all_topic_docs = [doc for docs in topic_by_basename.values() for doc in docs]

    counts = {"yes_high": 0, "yes_medium": 0, "maybe": 0, "no_low": 0}
    used_global_fallback = 0

    with open(out_tsv, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
                "question_id",
                "question_file",
                "topic_file",
                "used_fallback_topic",
                "answer_present",
                "keyword_hits",
                "keywords_total",
                "keyword_coverage",
                "classification",
                "stem",
                "answer",
            ],
            delimiter="\t",
        )
        writer.writeheader()

        for i, q in enumerate(questions, start=1):
            stem_keywords = keywords_from_text(q.stem)
            keyword_set = set(stem_keywords)
            keywords_total = len(keyword_set)

            base = basename_no_ext(q.question_file)
            preferred_domain = domain_prefix(q.question_file)

            matched_candidates = topic_by_basename.get(base, [])
            doc = pick_best_doc(matched_candidates, stem_keywords, preferred_domain)
            used_fallback = False

            if doc is None:
                q_norm = normalize_name(base)
                matched_candidates = topic_by_title_norm.get(q_norm, [])
                doc = pick_best_doc(matched_candidates, stem_keywords, preferred_domain)

            if doc is None:
                used_global_fallback += 1
                best = best_doc_global(all_topic_docs, stem_keywords)
                doc = best[0] if best else None
                used_fallback = True if doc else False
            else:
                hit = sum(1 for k in keyword_set if k in doc.tokens)
                cov = (hit / keywords_total) if keywords_total else 0.0
                if cov < 0.25 and keywords_total >= 6:
                    best = best_doc_global(all_topic_docs, stem_keywords)
                    if best and best[0].path != doc.path and best[1] > hit:
                        doc = best[0]
                        used_fallback = True

            topic_path = doc.path if doc else ""
            text_lower = doc.text_lower if doc else ""
            tokens = doc.tokens if doc else set()

            answer_present = contains_answer(text_lower, q.answer) if doc else False
            keyword_hits = sum(1 for k in keyword_set if k in tokens)
            keyword_coverage = (keyword_hits / keywords_total) if keywords_total else 0.0
            classification = classify(keyword_coverage, answer_present, keywords_total)
            counts[classification] += 1

            writer.writerow(
                {
                    "question_id": f"q{i}",
                    "question_file": q.question_file,
                    "topic_file": topic_path,
                    "used_fallback_topic": "1" if used_fallback else "0",
                    "answer_present": "1" if answer_present else "0",
                    "keyword_hits": str(keyword_hits),
                    "keywords_total": str(keywords_total),
                    "keyword_coverage": f"{keyword_coverage:.3f}",
                    "classification": classification,
                    "stem": q.stem,
                    "answer": q.answer,
                }
            )

    total = len(questions)
    with open(out_summary, "w", encoding="utf-8") as f:
        f.write(f"questions_root\t{questions_root}\n")
        f.write(f"topic_root\t{topic_root}\n")
        f.write(f"total_questions\t{total}\n")
        f.write(f"used_global_fallback_topic\t{used_global_fallback}\n")
        for k in ("yes_high", "yes_medium", "maybe", "no_low"):
            f.write(f"{k}\t{counts[k]}\t{(counts[k] / total if total else 0):.1%}\n")

    print(f"Wrote {out_tsv} and {out_summary}")
    print(f"Total questions: {total}")
    for k in ("yes_high", "yes_medium", "maybe", "no_low"):
        print(f"{k}: {counts[k]} ({(counts[k] / total if total else 0):.1%})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

