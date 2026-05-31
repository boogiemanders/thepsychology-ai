// Publish an approved LinkedIn draft as a text post via the Zernio API. Mirrors
// publish-blog.ts: a self-contained fetch helper, no SDK. publishNow makes it go
// live on LinkedIn immediately. Marketing LinkedIn drafts are text-only (no media),
// which Zernio accepts (mediaItems omitted).

import crypto from "crypto"
import type { MarketingDraft } from "./types"

const DEFAULT_BASE = "https://zernio.com/api/v1"

function env(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`${name} is not set`)
  return v
}

export type LinkedInPublishResult = { postId: string; url: string | null }

export async function publishLinkedInDraft(draft: MarketingDraft): Promise<LinkedInPublishResult> {
  if (draft.type !== "linkedin") throw new Error("publishLinkedInDraft called on a non-linkedin draft")

  const apiKey = env("ZERNIO_API_KEY")
  const accountId = env("ZERNIO_ACCOUNT_LINKEDIN")
  const base = (process.env.ZERNIO_API_URL || DEFAULT_BASE).replace(/\/$/, "")

  const res = await fetch(`${base}/posts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      // Fresh idempotency id per create call, matching Zernio's convention.
      "x-request-id": crypto.randomUUID(),
    },
    body: JSON.stringify({
      content: draft.body_md,
      platforms: [{ platform: "linkedin", accountId }],
      publishNow: true,
    }),
  })

  if (!res.ok) {
    const detail = await res.text()
    throw new Error(`Zernio publish failed (${res.status}): ${detail}`)
  }

  const data = (await res.json()) as {
    post?: { _id?: string; id?: string; platforms?: Array<{ platformPostUrl?: string }> }
  }
  const post = data.post || {}
  // publishNow is async on Zernio's side, so the live URL may not be ready yet.
  const url = post.platforms?.[0]?.platformPostUrl || null
  return { postId: post._id || post.id || "", url }
}
