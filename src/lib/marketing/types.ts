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

// One Remotion animation moment on a TikTok draft. Fires when the spoken
// transcript contains `trigger`. Payload by type — diagram: {nodes, arrows,
// labels?}; illustration: {image} or {prompt} (pipeline generates the art and
// rewrites it to image); pullquote: {text}; clip: {video} (pre-rendered mp4
// under video-overlay/public/, e.g. clips/studying.mp4); art: {image, caption?}
// (founder's hand-drawn artwork under video-overlay/public/art/).
// Art library: art/studying.png (slumped reader, book over face — the
// exam-hook moment), art/onfire.png (panicked creature on fire — anxiety,
// stress, overwhelm). Clip library: clips/{studying,gavel,therapy,brain}.mp4.
// Rendering lives in video-overlay/src/PracticeQuestion.tsx.
export type AnimationCue = {
  trigger: string
  type: "diagram" | "illustration" | "pullquote" | "clip" | "art"
  payload: Record<string, unknown>
}

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
  // Optional until the 20260611_add_animation_cues migration is applied —
  // rows selected before then simply lack the key.
  animation_cues?: AnimationCue[]
  // Punchy on-video title (line 1 of the overlay's title block, e.g.
  // "Breaking Test Rules?"). Optional until the 20260612_add_video_title
  // migration is applied. null/empty hides the line.
  video_title?: string | null
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
  // TikTok practice-question/explainer scripts only (1-3 cues).
  animation_cues?: AnimationCue[]
  // TikTok drafts only: short topical hook for the on-video title block
  // (2-5 words, e.g. "Breaking Test Rules?").
  video_title?: string | null
}

export const DEFAULT_AUTHOR = "Dr. Anders Chan, Psy.D."
