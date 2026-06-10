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

// Talking-head video generation state (TikTok drafts only). null = not processed yet;
// 'failed' rows are skipped — reset video_status to null to retry.
export type VideoStatus = "generated" | "failed"

// title + url are required. author/year/publication are optional and power the
// APA reference list in the Slack approval card and the Obsidian note. When they
// are missing the reference still renders (title leads, "n.d." for the year).
export type Source = {
  title: string
  url: string
  author?: string // "Dunlosky, J." or an org as author, e.g. "CA Board of Psychology"
  year?: number | string // publication year; an LLM may emit a string, so accept both
  publication?: string // journal, site, or org name (e.g. "Psychology Today")
}

// Rows in marketing_feedback: every Feedback submission and every Approve. Raw log
// behind the learned-voice notebook (content/marketing/voice-learnings.md).
export type MarketingFeedbackKind = "feedback" | "approved"

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
  video_status: VideoStatus | null
  video_path: string | null
  video_error: string | null
  video_generated_at: string | null
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
