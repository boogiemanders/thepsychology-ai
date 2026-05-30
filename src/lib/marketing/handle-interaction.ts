// Handles Approve/Reject button clicks for marketing drafts. Called by the shared
// /api/slack/triage-approval endpoint when the action is a marketing one. Updates the
// draft, publishes blog posts, and returns a replace_original response so the buttons
// disappear and the outcome shows inline (no bot token needed).

import { publishBlogDraft } from "./publish-blog"
import type { MarketingDraft } from "./types"

const MARKETING_ACTIONS = new Set(["approve_draft", "reject_draft"])

// True if this interaction is a marketing approval (vs the existing triage flow).
export function isMarketingAction(payload: { actions?: Array<{ action_id?: string }> }): boolean {
  return (payload.actions || []).some((a) => MARKETING_ACTIONS.has(a.action_id || ""))
}

type ResponseBody = { replace_original: true; text: string; blocks: unknown[] }

function reply(payload: any, statusText: string, extra: unknown[] = []): ResponseBody {
  const original = Array.isArray(payload.message?.blocks) ? payload.message.blocks : []
  const withoutActions = original.filter((b: any) => b.type !== "actions")
  return {
    replace_original: true,
    text: payload.message?.text || "Marketing draft updated",
    blocks: [
      ...withoutActions,
      { type: "context", elements: [{ type: "mrkdwn", text: statusText }] },
      ...extra,
    ],
  }
}

// supabase is the service-role client from the calling route.
export async function handleMarketingInteraction(payload: any, supabase: any): Promise<ResponseBody> {
  const action = (payload.actions || []).find((a: any) => MARKETING_ACTIONS.has(a.action_id))
  const user = payload.user?.username || payload.user?.name || "unknown"
  const draftId: string | undefined = action?.value
  if (!draftId) return reply(payload, "No draft id on the action.")

  const { data: row } = await supabase.from("marketing_drafts").select("*").eq("id", draftId).single()
  const draft = row as MarketingDraft | null
  if (!draft) return reply(payload, "Draft not found.")
  if (draft.status !== "pending") return reply(payload, `Already ${draft.status}.`)

  const now = new Date().toISOString()

  if (action.action_id === "reject_draft") {
    await supabase.from("marketing_drafts").update({ status: "rejected", decided_at: now }).eq("id", draftId)
    return reply(payload, `Rejected by ${user}.`)
  }

  // Approve.
  if (draft.type === "blog") {
    try {
      const result = await publishBlogDraft(draft)
      await supabase
        .from("marketing_drafts")
        .update({ status: "published", published_url: result.url, decided_at: now })
        .eq("id", draftId)
      return reply(payload, `Published by ${user}: <${result.url}|view post>`)
    } catch (err) {
      return reply(payload, `Approved by ${user}, but publish failed: ${(err as Error).message}`)
    }
  }

  // Social (linkedin / tiktok): mark approved and show the copy-paste text inline.
  await supabase.from("marketing_drafts").update({ status: "approved", decided_at: now }).eq("id", draftId)
  return reply(payload, `Approved by ${user}. Copy-paste below:`, [
    { type: "section", text: { type: "mrkdwn", text: draft.body_md.slice(0, 2800) } },
  ])
}
