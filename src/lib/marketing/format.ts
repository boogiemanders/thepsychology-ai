// Pure formatting helpers: slugs, blog frontmatter (matching the blog parser),
// and Obsidian notes (#mktg tagged). No framework or node-runtime deps beyond strings.

import type { DraftType, MarketingDraft, Source, Topic } from "./types"
import { DEFAULT_AUTHOR } from "./types"

// Build an APA 7th-style reference string WITHOUT the trailing URL (each surface
// appends the link in its own syntax: Slack <url>, markdown <url>). Fields degrade
// gracefully: no author means the title leads, no year becomes "(n.d.)", no
// publication is simply omitted. Trailing periods are stripped so we never double up.
export function apaReference(s: Source): string {
  const strip = (v: string) => v.trim().replace(/\.+$/, "")
  const year = s.year ? `(${s.year})` : "(n.d.)"
  const title = strip(s.title)
  const author = s.author ? strip(s.author) : ""
  const publication = s.publication ? strip(s.publication) : ""
  const lead = author ? `${author}. ${year}. ${title}.` : `${title}. ${year}.`
  return publication ? `${lead} ${publication}.` : lead
}

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
  // tags may arrive as an array (typed shape) or a comma-string (what an LLM draft
  // often emits). Coerce both to a clean comma list so publish never crashes on it.
  const rawTags: unknown = fm.tags
  const tagList = Array.isArray(rawTags)
    ? rawTags.map((t) => String(t).trim())
    : typeof rawTags === "string"
      ? rawTags.split(",").map((t) => t.trim())
      : []
  const tags = tagList.filter(Boolean).join(", ")

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
  "eppp-strategy": "EPPP Strategy",
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
    ? draft.sources.map((s) => `- ${apaReference(s)} <${s.url}>`).join("\n")
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
