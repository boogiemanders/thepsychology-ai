// Posts a draft to the #social-approvals channel with Approve/Reject buttons, reusing
// the existing per-channel webhook system (src/lib/notify-slack.ts). Button clicks are
// handled by the existing /api/slack/triage-approval endpoint (see handle-interaction.ts).
// No bot token and no second Slack app: one app, one interactivity URL, one new webhook.

import type { MarketingDraft } from "./types"
import { apaReference } from "./format"
import { sendSlackNotification } from "../notify-slack"

const TYPE_LABEL: Record<MarketingDraft["type"], string> = {
  blog: "Blog post (auto-publishes on approve)",
  linkedin: "LinkedIn post (copy-paste)",
  tiktok: "TikTok script (copy-paste)",
}

// Slack section text caps at 3000 chars. Keep a margin.
function clip(text: string, max = 2800): string {
  return text.length <= max ? text : `${text.slice(0, max)}\n(truncated, full draft in the note)`
}

// Block Kit for an approval message. Buttons carry the draft id; action_ids are
// approve_draft / reject_draft so the shared endpoint can tell marketing from triage.
export function buildApprovalBlocks(draft: MarketingDraft): unknown[] {
  const blocks: unknown[] = [
    { type: "header", text: { type: "plain_text", text: clip(draft.title, 150) } },
    {
      type: "context",
      elements: [{ type: "mrkdwn", text: `${TYPE_LABEL[draft.type]}  (topic: *${draft.topic}*)` }],
    },
  ]

  if (draft.needs_review) {
    blocks.push({
      type: "context",
      elements: [
        { type: "mrkdwn", text: `Needs review: ${draft.review_notes || "unverified claim flagged"}` },
      ],
    })
  }

  blocks.push({ type: "section", text: { type: "mrkdwn", text: clip(draft.body_md) } })

  if (draft.sources.length) {
    // APA 7th reference list: "Author. (Year). Title. Publication. <url>". The
    // bare <url> stays clickable in Slack. In-text (Author, year) citations live
    // in body_md; this is the matching reference list at the bottom of the card.
    const list = draft.sources.map((s) => `- ${apaReference(s)} <${s.url}>`).join("\n")
    blocks.push({ type: "section", text: { type: "mrkdwn", text: `*Sources (APA)*\n${clip(list, 1500)}` } })
  }

  blocks.push({
    type: "actions",
    block_id: `mktg_${draft.id}`,
    elements: [
      {
        type: "button",
        style: "primary",
        text: { type: "plain_text", text: "Approve" },
        action_id: "approve_draft",
        value: draft.id,
      },
      {
        type: "button",
        style: "danger",
        text: { type: "plain_text", text: "Reject" },
        action_id: "reject_draft",
        value: draft.id,
      },
    ],
  })

  return blocks
}

// Post a draft to #social-approvals (SLACK_WEBHOOK_SOCIAL) for review. Throws if
// delivery fails so the caller (submit-draft) does not report a false success.
export async function postDraftForApproval(draft: MarketingDraft): Promise<void> {
  const delivered = await sendSlackNotification(
    `New draft for review: ${draft.title}`,
    "social",
    buildApprovalBlocks(draft)
  )
  if (!delivered) {
    throw new Error(
      "Slack delivery to #social-approvals failed (SLACK_WEBHOOK_SOCIAL missing or webhook returned non-ok)"
    )
  }
}
