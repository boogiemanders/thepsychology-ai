#!/usr/bin/env python3
"""
Crawl thepsychology.ai sitemap and generate clean markdown mirrors
for every public page. Output goes to public/md/ so Vercel serves
them at thepsychology.ai/md/...

Usage:
  pip install requests beautifulsoup4 markdownify lxml
  python scripts/generate-md-mirrors.py
"""

import os
import re
import sys
import time
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup, Comment
from markdownify import markdownify as md

SITE = "https://www.thepsychology.ai"
SITEMAP_URL = f"{SITE}/sitemap.xml"
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "public" / "md"

# Pages to skip (auth, app, noindex, etc.)
SKIP_PATHS = {
    "/login", "/signup", "/dashboard", "/admin", "/payment",
    "/prioritize", "/prioritizer", "/quizzer", "/recover",
    "/review-exams", "/study-optimizer", "/topic-selector",
    "/topic-teacher", "/trial-expired", "/thanks", "/404",
    "/app", "/spline-tuner",
}

# HTML elements to strip entirely
STRIP_TAGS = [
    "nav", "footer", "script", "style", "noscript", "iframe",
    "svg", "video", "audio",
]

# CSS classes that indicate non-content elements
STRIP_CLASS_PATTERNS = [
    re.compile(r"^nav", re.I),
    re.compile(r"^footer", re.I),
    re.compile(r"cta-split", re.I),
    re.compile(r"^ghl", re.I),
    re.compile(r"chat-widget", re.I),
    re.compile(r"hubspot", re.I),
    re.compile(r"cookie", re.I),
]


def fetch_sitemap_urls() -> list[str]:
    """Fetch all URLs from the sitemap."""
    resp = requests.get(SITEMAP_URL, timeout=15)
    resp.raise_for_status()
    root = ET.fromstring(resp.content)
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    urls = [loc.text for loc in root.findall(".//sm:loc", ns) if loc.text]
    return urls


def should_skip(url: str) -> bool:
    """Check if URL should be skipped."""
    path = urlparse(url).path.rstrip("/")
    if not path:
        return False  # homepage is fine
    for skip in SKIP_PATHS:
        if path == skip or path.startswith(skip + "/"):
            return True
    return False


def strip_non_content(soup: BeautifulSoup) -> None:
    """Remove navigation, scripts, widgets, and other non-content elements."""
    # Remove HTML comments
    for comment in soup.find_all(string=lambda t: isinstance(t, Comment)):
        comment.extract()

    # Remove unwanted tags
    for tag_name in STRIP_TAGS:
        for el in soup.find_all(tag_name):
            el.decompose()

    # Remove elements with matching class patterns
    for el in soup.find_all(attrs={"class": True}):
        classes = el.get("class", [])
        class_str = " ".join(classes) if isinstance(classes, list) else classes
        for pattern in STRIP_CLASS_PATTERNS:
            if pattern.search(class_str):
                el.decompose()
                break

    # Remove JSON-LD script tags (already handled by schema)
    for el in soup.find_all("script", {"type": "application/ld+json"}):
        el.decompose()

    # Remove header elements (site header with nav)
    for el in soup.find_all("header"):
        el.decompose()

    # Remove theme toggles, buttons with no meaningful text
    for el in soup.find_all("button"):
        text = el.get_text(strip=True).lower()
        if text in ("toggle theme", "toggle menu", "menu", "close", ""):
            el.decompose()

    # Remove elements with role="navigation"
    for el in soup.find_all(attrs={"role": "navigation"}):
        el.decompose()

    # Remove empty wrapper divs/spans
    changed = True
    while changed:
        changed = False
        for el in soup.find_all(["div", "span"]):
            if el.get_text(strip=True) == "" and not el.find("img"):
                el.decompose()
                changed = True


def clean_markdown(text: str) -> str:
    """Clean up markdownify output."""
    # Collapse 3+ blank lines to 2
    text = re.sub(r"\n{3,}", "\n\n", text)
    # Strip standalone step numbers like "01" "02" on their own line
    text = re.sub(r"^\s*0\d\s*$", "", text, flags=re.MULTILINE)
    # Remove bullet separator characters (decorative)
    text = re.sub(r"^[\s]*[|]\s*$", "", text, flags=re.MULTILINE)
    # Remove empty image references like ![]()
    text = re.sub(r"!\[\]\([^)]*\)", "", text)
    # Remove images with empty alt text
    text = re.sub(r"!\[\s*\]\([^)]*\)", "", text)
    # Strip trailing whitespace per line
    text = "\n".join(line.rstrip() for line in text.split("\n"))
    # Collapse again after removals
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def extract_metadata(soup: BeautifulSoup, url: str) -> dict:
    """Extract page title and description from meta tags."""
    title = ""
    title_tag = soup.find("title")
    if title_tag:
        title = title_tag.get_text(strip=True)

    description = ""
    meta_desc = soup.find("meta", attrs={"name": "description"})
    if meta_desc:
        description = meta_desc.get("content", "")

    canonical = url
    link_canonical = soup.find("link", attrs={"rel": "canonical"})
    if link_canonical:
        href = link_canonical.get("href", "")
        if href.startswith("http"):
            canonical = href
        elif href.startswith("/"):
            canonical = SITE + href

    return {
        "title": title,
        "description": description,
        "canonical": canonical,
    }


def url_to_filepath(url: str) -> Path:
    """Convert URL to output file path."""
    path = urlparse(url).path.strip("/")
    if not path:
        return OUTPUT_DIR / "index.md"
    return OUTPUT_DIR / path / "index.md"


def generate_frontmatter(meta: dict, url: str) -> str:
    """Generate YAML frontmatter."""
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    title = meta["title"].replace('"', '\\"')
    desc = meta["description"].replace('"', '\\"')
    return f"""---
title: "{title}"
description: "{desc}"
url: "{url}"
canonical: "{meta['canonical']}"
generated: "{now}"
---

"""


def process_url(url: str) -> bool:
    """Fetch a URL, convert to markdown, and write the file."""
    try:
        resp = requests.get(url, timeout=15, headers={
            "User-Agent": "thePsychology.ai-md-mirror/1.0"
        })
        resp.raise_for_status()
    except requests.RequestException as e:
        print(f"  SKIP (fetch error): {e}")
        return False

    soup = BeautifulSoup(resp.text, "lxml")

    # Skip noindex pages
    noindex = soup.find("meta", attrs={"name": "robots", "content": re.compile("noindex")})
    if noindex:
        print(f"  SKIP (noindex)")
        return False

    meta = extract_metadata(soup, url)

    # Work with just the body
    body = soup.find("body")
    if not body:
        print(f"  SKIP (no body)")
        return False

    strip_non_content(body)

    # Convert to markdown
    markdown = md(str(body), heading_style="ATX", bullets="-", strip=["img"])
    markdown = clean_markdown(markdown)

    if len(markdown.strip()) < 50:
        print(f"  SKIP (too short after cleaning: {len(markdown.strip())} chars)")
        return False

    # Write file
    filepath = url_to_filepath(url)
    filepath.parent.mkdir(parents=True, exist_ok=True)

    content = generate_frontmatter(meta, url) + markdown + "\n"
    filepath.write_text(content, encoding="utf-8")
    return True


def main():
    print(f"Fetching sitemap from {SITEMAP_URL}...")
    urls = fetch_sitemap_urls()
    print(f"Found {len(urls)} URLs in sitemap\n")

    # Clean output dir
    if OUTPUT_DIR.exists():
        import shutil
        shutil.rmtree(OUTPUT_DIR)

    processed = 0
    skipped = 0

    for url in urls:
        path = urlparse(url).path
        print(f"[{processed + skipped + 1}/{len(urls)}] {path}")

        if should_skip(url):
            print(f"  SKIP (blocked path)")
            skipped += 1
            continue

        if process_url(url):
            processed += 1
        else:
            skipped += 1

        # Be polite to our own server
        time.sleep(0.3)

    print(f"\nDone! {processed} pages converted, {skipped} skipped")
    print(f"Output: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
