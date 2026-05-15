import "server-only"

import fs from "node:fs"
import path from "node:path"
import { V4_FOLDER_TO_URL_DOMAIN, URL_DOMAIN_TO_V4_FOLDER } from "@/lib/topic-paths"

export type TopicContentEntry = {
  domainDir: string
  slug: string
  topicName: string
  domainLabel: string
  filePath: string
  lastModified: Date
}

type FrontmatterParseResult = {
  data: Record<string, string>
  content: string
}

const TOPIC_CONTENT_ROOT = path.join(process.cwd(), "EPPP/content/topic-content-v4")

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
    const value = trimmed.slice(colonIndex + 1).trim()
    if (!key) continue
    data[key] = value
  }

  return { data, content }
}

function getSlugFromFilename(filename: string) {
  return filename.replace(/\.md$/i, "")
}

function listDomainDirs() {
  if (!fs.existsSync(TOPIC_CONTENT_ROOT)) return []
  return fs
    .readdirSync(TOPIC_CONTENT_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => !name.startsWith("."))
    .sort((a, b) => a.localeCompare(b))
}

export function getAllTopicContentEntries(): TopicContentEntry[] {
  const onDiskFolders = listDomainDirs()
  const entries: TopicContentEntry[] = []

  for (const onDiskFolder of onDiskFolders) {
    // Only surface folders we have a URL mapping for. v4 may contain extras
    // (e.g. unsorted reference files) we don't want to expose as SEO pages.
    const urlDomainSlug = V4_FOLDER_TO_URL_DOMAIN[onDiskFolder]
    if (!urlDomainSlug) continue

    const domainPath = path.join(TOPIC_CONTENT_ROOT, onDiskFolder)
    const files = fs
      .readdirSync(domainPath, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".md"))
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b))

    for (const filename of files) {
      const filePath = path.join(domainPath, filename)
      const raw = fs.readFileSync(filePath, "utf8")
      const { data } = parseFrontmatter(raw)
      const slug = data.slug?.trim() || getSlugFromFilename(filename)
      const topicName = data.topic_name?.trim() || slug.replace(/-/g, " ")
      const domainLabel = data.domain?.trim() || onDiskFolder
      const stat = fs.statSync(filePath)

      entries.push({
        domainDir: urlDomainSlug,
        slug,
        topicName,
        domainLabel,
        filePath,
        lastModified: stat.mtime,
      })
    }
  }

  return entries
}

export function getTopicContentMarkdown(domainDir: string, slug: string) {
  // domainDir is the URL-facing kebab slug; map back to the v4 on-disk folder.
  if (!URL_DOMAIN_TO_V4_FOLDER[domainDir]) return null

  const entries = getAllTopicContentEntries()
  const entry = entries.find((e) => e.domainDir === domainDir && e.slug === slug)
  if (!entry) return null

  const raw = fs.readFileSync(entry.filePath, "utf8")
  const parsed = parseFrontmatter(raw)
  return {
    entry,
    frontmatter: parsed.data,
    content: parsed.content,
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
