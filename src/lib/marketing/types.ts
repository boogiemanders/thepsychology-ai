// Shared types for the marketing content engine. Pure types — safe to import
// from both Next.js routes and standalone tsx scripts.

export type DraftType = "blog" | "linkedin" | "tiktok"

export type Topic =
  | "psychology"
  | "eppp"
  | "ai"
  | "psychology-ai"
  | "pop-culture"

export type DraftStatus = "pending" | "approved" | "rejected" | "published" | "queued"

export type Source = { title: string; url: string }

export type BlogFrontmatter = {
  title: string
  slug: string
  description: string
  author: string
  tags: string[]
}

export type MarketingDraft = {
  id: string
  type: DraftType
  topic: Topic
  title: string
  slug: string | null
  body_md: string
  frontmatter: Partial<BlogFrontmatter>
  sources: Source[]
  seo: { keyword?: string; internal_links?: string[] }
  status: DraftStatus
  needs_review: boolean
  review_notes: string | null
  slack_channel: string | null
  slack_ts: string | null
  published_url: string | null
  published_at: string | null
  created_at: string
  decided_at: string | null
}

// Input shape the generation agent produces (a JSON file handed to submit-draft.ts).
export type DraftInput = {
  type: DraftType
  topic: Topic
  title: string
  slug?: string
  body_md: string
  frontmatter?: Partial<BlogFrontmatter>
  sources: Source[]
  seo?: { keyword?: string; internal_links?: string[] }
  needs_review?: boolean
  review_notes?: string
}

export const DEFAULT_AUTHOR = "Dr. Anders Chan, Psy.D."
