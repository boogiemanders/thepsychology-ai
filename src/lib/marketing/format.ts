// Pure formatting helpers: slugs, blog frontmatter (matching the blog parser),
// and Obsidian notes (#mktg tagged). No framework or node-runtime deps beyond strings.

import type { DraftType, MarketingDraft, Topic } from "./types"
import { DEFAULT_AUTHOR } from "./types"

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/['’"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
}

// Escape a value for the blog's line-based frontmatter parser (single line, double-quoted).
function fmValue(value: string): string {
  const oneLine = value.replace(/\s+/g, " ").trim().replace(/"/g, "'")
  return `"${oneLine}"`
}

// Build the markdown that gets committed live to EPPP/content/blog-content/<slug>.md.
// Matches src/lib/seo/blog-content.server.ts (single-line keys, comma-separated tags).
export function buildBlogMarkdown(draft: MarketingDraft, publishedAt: string): string {
  const fm = draft.frontmatter || {}
  const title = fm.title || draft.title
  const slug = draft.slug || slugify(title)
  const description = fm.description || ""
  const author = fm.author || DEFAULT_AUTHOR
  const tags = (fm.tags || []).join(", ")

  const header = [
    "---",
    `title: ${fmValue(title)}`,
    `slug: ${slug}`,
    `description: ${fmValue(description)}`,
    `author: ${fmValue(author)}`,
    `published_at: ${publishedAt}`,
    tags ? `tags: ${tags}` : null,
    "---",
    "",
  ]
    .filter((line) => line !== null)
    .join("\n")

  return `${header}\n${draft.body_md.trim()}\n`
}

const TOPIC_LABEL: Record<Topic, string> = {
  psychology: "Psychology",
  eppp: "EPPP",
  ai: "AI",
  "psychology-ai": "Psychology + AI",
  "pop-culture": "Pop Culture",
}

const TYPE_LABEL: Record<DraftType, string> = {
  blog: "Blog post",
  linkedin: "LinkedIn post",
  tiktok: "TikTok script",
}

// Build the human-facing Obsidian note saved under content/marketing/<date>/.
// Tagged #mktg so it surfaces in the user's Obsidian once the repo is synced.
export function buildObsidianNote(draft: MarketingDraft): string {
  const sources = draft.sources.length
    ? draft.sources.map((s) => `- [${s.title}](${s.url})`).join("\n")
    : "_none recorded_"

  const review = draft.needs_review
    ? `\n> [!warning] Needs human review\n> ${draft.review_notes || "Fact-checker flagged an unverified claim."}\n`
    : ""

  return [
    "---",
    `type: ${draft.type}`,
    `topic: ${draft.topic}`,
    `status: ${draft.status}`,
    "tags: [mktg]",
    `created: ${draft.created_at}`,
    "---",
    "",
    `#mktg`,
    "",
    `# ${draft.title}`,
    "",
    `**${TYPE_LABEL[draft.type]} · ${TOPIC_LABEL[draft.topic]}**`,
    review,
    "## Draft",
    "",
    draft.body_md.trim(),
    "",
    "## Sources",
    "",
    sources,
    "",
  ].join("\n")
}
