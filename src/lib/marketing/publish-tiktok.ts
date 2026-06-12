// Publish a finished TikTok video (the Remotion _final.mp4) via the Zernio API.
// Mirrors publish-linkedin.ts: self-contained fetch helpers, no SDK. Video bytes
// upload through Zernio's presign flow because Drive links serve HTML, not media
// (and the file is local anyway — Drive syncs it to this Mac).
//
// Caption policy (founder, 2026-06-12): a 1-2 sentence explanation teaser that
// never reveals the answer, then exactly 5 hashtags (#eppp #psychology + 3
// topic-relevant). No sales CTA — that kept TikTok's branded-content flag out
// of the picture. The daily writer authors tiktok_caption per draft;
// buildFallbackCaption only covers older rows that predate the column.
//
// tiktokSettings notes: video_made_with_ai stays true (the avatar is a Digital
// Twin; TikTok policy requires labeling realistic AI content). The two consent
// booleans are required by Zernio's TikTok integration.

import crypto from "crypto"
import { readFileSync } from "fs"
import { basename } from "path"
import type { MarketingDraft } from "./types"

const DEFAULT_BASE = "https://zernio.com/api/v1"

function env(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`${name} is not set`)
  return v
}

function base(): string {
  return (process.env.ZERNIO_API_URL || DEFAULT_BASE).replace(/\/$/, "")
}

// 3 topic-relevant hashtags by EPPP domain (first regex match wins). The two
// fixed tags (#eppp #psychology) are prepended by the caption builders.
const DOMAIN_HASHTAGS: Array<[RegExp, string[]]> = [
  [/assess/i, ["#neuropsychology", "#psychassessment", "#testprep"]],
  [/ethic/i, ["#psychologyethics", "#therapistsoftiktok", "#gradschool"]],
  [/biopsych|physiolog/i, ["#neuroscience", "#brainfacts", "#psychstudent"]],
  [/social/i, ["#socialpsychology", "#humanbehavior", "#psychfacts"]],
  [/develop/i, ["#developmentalpsychology", "#attachmenttheory", "#psychstudent"]],
  [/research|stat/i, ["#researchmethods", "#statistics", "#gradschool"]],
  [/diagnos/i, ["#mentalhealth", "#dsm5", "#psychstudent"]],
  [/clinical|intervention/i, ["#therapy", "#mentalhealth", "#psychologystudent"]],
  [/industrial|organizational|\bi[/-]?o\b/i, ["#iopsychology", "#workplacepsychology", "#careertok"]],
  [/learning|memory/i, ["#learningscience", "#memorytips", "#studytips"]],
  [/test construction|psychometric/i, ["#psychometrics", "#testprep", "#gradschool"]],
]
const DEFAULT_TAGS = ["#epppprep", "#psychologystudent", "#gradschool"]

export function domainHashtags(domain: string | null): string[] {
  for (const [re, tags] of DOMAIN_HASHTAGS) if (domain && re.test(domain)) return tags
  return DEFAULT_TAGS
}

// Caption for rows without an authored tiktok_caption (drafts that predate the
// column). Title hook + a neutral teaser + the 5 hashtags.
export function buildFallbackCaption(draft: MarketingDraft, domain: string | null): string {
  const lines: string[] = []
  if (draft.video_title) lines.push(draft.video_title)
  lines.push(
    domain
      ? `An EPPP practice question on ${domain}. The full explanation is in the video.`
      : "An EPPP practice question. The full explanation is in the video."
  )
  lines.push(["#eppp", "#psychology", ...domainHashtags(domain)].join(" "))
  return lines.join("\n")
}

export type TikTokPublishResult = { postId: string; url: string | null }

// Upload the local mp4 to Zernio (presign + PUT) and return its public URL.
async function uploadVideo(apiKey: string, filePath: string): Promise<string> {
  const presignRes = await fetch(`${base()}/media/presign`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    // Field names verified live 2026-06-12 (the docs say fileName/fileType; the
    // API actually requires filename/contentType and 400s otherwise).
    body: JSON.stringify({ filename: basename(filePath), contentType: "video/mp4" }),
  })
  if (!presignRes.ok) {
    throw new Error(`Zernio presign failed (${presignRes.status}): ${await presignRes.text()}`)
  }
  const presign = (await presignRes.json()) as { uploadUrl?: string; publicUrl?: string }
  if (!presign.uploadUrl || !presign.publicUrl) {
    throw new Error(`Zernio presign response missing uploadUrl/publicUrl: ${JSON.stringify(presign)}`)
  }

  const putRes = await fetch(presign.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "video/mp4" },
    body: new Uint8Array(readFileSync(filePath)),
  })
  if (!putRes.ok) {
    throw new Error(`Zernio media upload failed (${putRes.status}): ${await putRes.text()}`)
  }
  return presign.publicUrl
}

// Upload + create the post. publishNow is async on Zernio's side, so url may
// come back null — the post still goes live on TikTok within a few minutes.
export async function publishTikTokVideo(filePath: string, caption: string): Promise<TikTokPublishResult> {
  const apiKey = env("ZERNIO_API_KEY")
  const accountId = env("ZERNIO_ACCOUNT_TIKTOK")

  const mediaUrl = await uploadVideo(apiKey, filePath)

  const res = await fetch(`${base()}/posts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      // Fresh idempotency id per create call, matching Zernio's convention.
      "x-request-id": crypto.randomUUID(),
    },
    body: JSON.stringify({
      content: caption,
      mediaItems: [{ type: "video", url: mediaUrl }],
      platforms: [{ platform: "tiktok", accountId }],
      tiktokSettings: {
        privacy_level: "PUBLIC_TO_EVERYONE",
        allow_comment: true,
        allow_duet: true,
        allow_stitch: true,
        content_preview_confirmed: true,
        express_consent_given: true,
        video_made_with_ai: true,
      },
      publishNow: true,
    }),
  })

  if (!res.ok) {
    throw new Error(`Zernio TikTok publish failed (${res.status}): ${await res.text()}`)
  }

  const data = (await res.json()) as {
    post?: { _id?: string; id?: string; platforms?: Array<{ platformPostUrl?: string }> }
  }
  const post = data.post || {}
  const url = post.platforms?.[0]?.platformPostUrl || null
  return { postId: post._id || post.id || "", url }
}
