// Publish an approved blog draft by committing its markdown to the repo via the
// GitHub Contents API. Pushing to main triggers Vercel's auto-deploy. Plain fetch.

import type { MarketingDraft } from "./types"
import { buildBlogMarkdown, slugify } from "./format"

const GITHUB_API = "https://api.github.com"
const OWNER = "boogiemanders"
const REPO = "thepsychology-ai"
const BRANCH = "main"
const BLOG_DIR = "EPPP/content/blog-content"
const SITE_ORIGIN = "https://www.thepsychology.ai"

function token(): string {
  const t = process.env.GITHUB_TOKEN
  if (!t) throw new Error("GITHUB_TOKEN is not set")
  return t
}

function headers() {
  return {
    Authorization: `Bearer ${token()}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  }
}

// Today's date in YYYY-MM-DD (UTC) for published_at — makes the post live immediately.
function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export type PublishResult = { url: string; commitUrl: string; slug: string }

export async function publishBlogDraft(draft: MarketingDraft): Promise<PublishResult> {
  if (draft.type !== "blog") throw new Error("publishBlogDraft called on a non-blog draft")

  const slug = draft.slug || slugify(draft.frontmatter?.title || draft.title)
  const filePath = `${BLOG_DIR}/${slug}.md`
  const markdown = buildBlogMarkdown(draft, todayIso())
  const contentBase64 = Buffer.from(markdown, "utf8").toString("base64")

  // If a file with this slug already exists we must pass its blob sha to update it.
  let existingSha: string | undefined
  const getRes = await fetch(
    `${GITHUB_API}/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(filePath)}?ref=${BRANCH}`,
    { headers: headers() }
  )
  if (getRes.ok) {
    const existing = (await getRes.json()) as { sha?: string }
    existingSha = existing.sha
  }

  const putRes = await fetch(
    `${GITHUB_API}/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(filePath)}`,
    {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify({
        message: `blog: publish "${draft.title}" (approved via Slack)`,
        content: contentBase64,
        branch: BRANCH,
        ...(existingSha ? { sha: existingSha } : {}),
      }),
    }
  )

  if (!putRes.ok) {
    const detail = await putRes.text()
    throw new Error(`GitHub commit failed (${putRes.status}): ${detail}`)
  }

  const commit = (await putRes.json()) as { commit?: { html_url?: string } }
  return {
    slug,
    url: `${SITE_ORIGIN}/blog/${slug}`,
    commitUrl: commit.commit?.html_url || "",
  }
}
