import "server-only"

import fs from "node:fs"
import path from "node:path"

export type BlogPostEntry = {
  slug: string
  title: string
  description: string
  author: string
  publishedAt: string
  updatedAt?: string
  tags: string[]
  filePath: string
  lastModified: Date
}

type FrontmatterParseResult = {
  data: Record<string, string>
  content: string
}

const BLOG_CONTENT_ROOT = path.join(process.cwd(), "blog-content")

function parseFrontmatter(raw: string): FrontmatterParseResult {
  if (!raw.startsWith("---\n")) {
    return { data: {}, content: raw }
  }

  const endMarker = "\n---\n"
  const endIndex = raw.indexOf(endMarker, 4)
  if (endIndex === -1) {
    return { data: {}, content: raw }
  }

  const frontmatterRaw = raw.slice(4, endIndex).trim()
  const content = raw.slice(endIndex + endMarker.length)

  const data: Record<string, string> = {}
  for (const line of frontmatterRaw.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const colonIndex = trimmed.indexOf(":")
    if (colonIndex === -1) continue

    const key = trimmed.slice(0, colonIndex).trim()
    let value = trimmed.slice(colonIndex + 1).trim()
    if (!key) continue
    // Strip surrounding quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    data[key] = value
  }

  return { data, content }
}

function getSlugFromFilename(filename: string) {
  return filename.replace(/\.md$/i, "")
}

export function getAllBlogPosts(): BlogPostEntry[] {
  if (!fs.existsSync(BLOG_CONTENT_ROOT)) return []

  const files = fs
    .readdirSync(BLOG_CONTENT_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".md"))
    .map((entry) => entry.name)

  const entries: BlogPostEntry[] = []

  for (const filename of files) {
    const filePath = path.join(BLOG_CONTENT_ROOT, filename)
    const raw = fs.readFileSync(filePath, "utf8")
    const { data } = parseFrontmatter(raw)
    const slug = data.slug?.trim() || getSlugFromFilename(filename)
    const title = data.title?.trim() || slug.replace(/-/g, " ")
    const description = data.description?.trim() || ""
    const author = data.author?.trim() || "Dr. Anders Chan, Psy.D."
    const publishedAt = data.published_at?.trim() || ""
    const updatedAt = data.updated_at?.trim() || undefined
    const tags = data.tags?.split(",").map((t) => t.trim()).filter(Boolean) || []
    const stat = fs.statSync(filePath)

    entries.push({
      slug,
      title,
      description,
      author,
      publishedAt,
      updatedAt,
      tags,
      filePath,
      lastModified: stat.mtime,
    })
  }

  // Sort by published date descending (newest first)
  return entries.sort((a, b) => {
    if (!a.publishedAt || !b.publishedAt) return 0
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  })
}

export function getBlogPostMarkdown(slug: string) {
  const entries = getAllBlogPosts()
  const entry = entries.find((e) => e.slug === slug)
  if (!entry) return null

  const raw = fs.readFileSync(entry.filePath, "utf8")
  const parsed = parseFrontmatter(raw)
  const content = parsed.content.replace(/^\s*#\s+.+\n?/, "")
  return {
    entry,
    frontmatter: parsed.data,
    content,
  }
}

export function getPlainTextExcerpt(markdown: string, maxLength = 180) {
  const plain = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^\)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^\)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_~]/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  if (plain.length <= maxLength) return plain
  const clipped = plain.slice(0, maxLength)
  const lastSpace = clipped.lastIndexOf(" ")
  return `${(lastSpace > 60 ? clipped.slice(0, lastSpace) : clipped).trim()}…`
}
