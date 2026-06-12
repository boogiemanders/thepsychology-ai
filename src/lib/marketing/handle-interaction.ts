// Handles Approve/Reject button clicks for marketing drafts. Called by the shared
// /api/slack/triage-approval endpoint when the action is a marketing one. Updates the
// draft, publishes blog posts, and returns a replace_original response so the buttons
// disappear and the outcome shows inline (no bot token needed).

import {
  openFeedbackModal,
  FEEDBACK_BLOCK_ID,
  FEEDBACK_INPUT_ACTION_ID,
} from "./slack-modal"
import { sendSlackNotification } from "../notify-slack"
import type { MarketingDraft, MarketingFeedbackKind } from "./types"

const MARKETING_ACTIONS = new Set(["approve_draft", "reject_draft", "post_video", "skip_video"])

// True if this interaction is a marketing approve/reject (vs triage or the feedback button).
export function isMarketingAction(payload: { actions?: Array<{ action_id?: string }> }): boolean {
  return (payload.actions || []).some((a) => MARKETING_ACTIONS.has(a.action_id || ""))
}

// True if this interaction is a Feedback button click (opens a modal, handled separately
// because it must call views.open with the trigger_id, not replace the card).
export function isFeedbackButton(payload: { actions?: Array<{ action_id?: string }> }): boolean {
  return (payload.actions || []).some((a) => a.action_id === "feedback_draft")
}

// Best-effort log of one feedback/approval event into marketing_feedback (the raw learning
// log). Never throws — a logging failure must not break the approve or rewrite flow.
async function logSignal(
  supabase: any,
  row: {
    draft_id: string
    kind: MarketingFeedbackKind
    new_draft_id?: string | null
    feedback_text?: string | null
    original_body?: string | null
    rewritten_body?: string | null
    created_by?: string | null
  }
): Promise<void> {
  try {
    await supabase.from("marketing_feedback").insert(row)
  } catch (err) {
    console.error("[marketing] logSignal failed:", (err as Error).message)
  }
}

type ResponseBody = { replace_original: true; text: string; blocks: unknown[] }

// Build the replacement message and deliver it to Slack's response_url. We POST to
// response_url (valid for ~30 min) rather than returning the body synchronously,
// because a blog publish makes GitHub round-trips that blow past Slack's 3s window
// for the sync reply — by then Slack has discarded the sync body and the card never
// updates. response_url has no such limit, so the card refreshes once work is done.
async function reply(payload: any, statusText: string, extra: unknown[] = []): Promise<ResponseBody> {
  const original = Array.isArray(payload.message?.blocks) ? payload.message.blocks : []
  const withoutActions = original.filter((b: any) => b.type !== "actions")
  const body: ResponseBody = {
    replace_original: true,
    text: payload.message?.text || "Marketing draft updated",
    blocks: [
      ...withoutActions,
      { type: "context", elements: [{ type: "mrkdwn", text: statusText }] },
      ...extra,
    ],
  }

  const url: string | undefined = payload.response_url
  if (url) {
    try {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
    } catch (err) {
      console.error("[marketing] response_url post failed:", (err as Error).message)
    }
  }
  return body
}

// supabase is the service-role client from the calling route.
export async function handleMarketingInteraction(payload: any, supabase: any): Promise<ResponseBody> {
  const action = (payload.actions || []).find((a: any) => MARKETING_ACTIONS.has(a.action_id))
  const user = payload.user?.username || payload.user?.name || "unknown"
  const draftId: string | undefined = action?.value
  if (!draftId) return await reply(payload, "No draft id on the action.")

  const { data: row } = await supabase.from("marketing_drafts").select("*").eq("id", draftId).single()
  const draft = row as MarketingDraft | null
  if (!draft) return await reply(payload, "Draft not found.")

  // Video review card (post-render, draft is already 'approved'): Post queues it
  // for scripts/marketing/post-tiktok.ts; Skip parks it in Drive. 'failed' rows
  // accept Post again so the founder can retry from the same card.
  if (action.action_id === "post_video" || action.action_id === "skip_video") {
    const postStatus = draft.tiktok_post_status ?? null
    if (postStatus !== "review" && postStatus !== "failed") {
      return await reply(payload, `Already ${postStatus ?? "unqueued"}.`)
    }
    if (action.action_id === "skip_video") {
      await supabase.from("marketing_drafts").update({ tiktok_post_status: "skipped" }).eq("id", draftId)
      return await reply(payload, `Skipped by ${user} — stays in Drive, nothing posts.`)
    }
    await supabase
      .from("marketing_drafts")
      .update({ tiktok_post_status: "queued", tiktok_post_error: null })
      .eq("id", draftId)
    return await reply(payload, `Queued by ${user} — posts to TikTok on the next pipeline run (10am/1pm/4pm/7pm ET).`)
  }

  if (draft.status !== "pending") return await reply(payload, `Already ${draft.status}.`)

  const now = new Date().toISOString()

  if (action.action_id === "reject_draft") {
    await supabase.from("marketing_drafts").update({ status: "rejected", decided_at: now }).eq("id", draftId)
    return await reply(payload, `Rejected by ${user}.`)
  }

  // Approve.
  // Blog: don't publish on approve. Queue it — scripts/marketing/drip-blog.ts publishes
  // at most ONE queued blog per day, so approvals just fill the buffer and posts space out.
  if (draft.type === "blog") {
    await supabase
      .from("marketing_drafts")
      .update({ status: "queued", decided_at: now })
      .eq("id", draftId)
    await logSignal(supabase, { draft_id: draftId, kind: "approved", original_body: draft.body_md, created_by: user })
    return await reply(payload, `Queued by ${user} — publishes to the blog (1/day, FIFO).`)
  }

  // LinkedIn: don't publish on approve. Queue it — scripts/marketing/drip-linkedin.ts
  // drains the queue at most 2x/day so the feed never looks spammy and a backlog builds.
  if (draft.type === "linkedin") {
    await supabase
      .from("marketing_drafts")
      .update({ status: "queued", decided_at: now })
      .eq("id", draftId)
    await logSignal(supabase, { draft_id: draftId, kind: "approved", original_body: draft.body_md, created_by: user })
    return await reply(payload, `Queued by ${user} — drip-posts to LinkedIn (max 2/day).`)
  }

  // TikTok (and any other social): mark approved and show the copy-paste text inline.
  // TikTok needs a video the engine doesn't have yet — auto-publish comes later.
  await supabase.from("marketing_drafts").update({ status: "approved", decided_at: now }).eq("id", draftId)
  await logSignal(supabase, { draft_id: draftId, kind: "approved", original_body: draft.body_md, created_by: user })
  return await reply(payload, `Approved by ${user}. Copy-paste below:`, [
    { type: "section", text: { type: "mrkdwn", text: draft.body_md.slice(0, 2800) } },
  ])
}

// Feedback button click: open the modal. Called synchronously by the route (the trigger_id
// expires ~3s after the click, so this must run before we ack, not deferred via after()).
export async function handleFeedbackButton(payload: any): Promise<void> {
  const action = (payload.actions || []).find((a: any) => a.action_id === "feedback_draft")
  const draftId: string | undefined = action?.value
  const triggerId: string | undefined = payload.trigger_id
  if (!draftId || !triggerId) {
    console.error("[marketing] feedback button missing draftId or trigger_id")
    return
  }
  // The card header holds the draft title — show it in the modal for context.
  const header = (payload.message?.blocks || []).find((b: any) => b.type === "header")
  const title: string | undefined = header?.text?.text
  await openFeedbackModal(triggerId, draftId, title)
}

// Modal submit (view_submission, callback_id feedback_modal). Reads the typed feedback + the
// draft id from private_metadata and ENQUEUES it (a pending marketing_feedback row). The
// rewrite itself runs on the founder's Claude subscription in the feedback-rewrite routine
// (scripts/marketing/list-pending-feedback.ts -> agent rewrites -> submit-rewrite.ts), which
// posts the new card. No LLM and no API key on the server. Runs in after() so the modal ack
// stays under 3s. We post a quick note to #social-approvals so the founder knows it landed.
export async function handleFeedbackSubmission(payload: any, supabase: any): Promise<void> {
  const draftId: string | undefined = payload.view?.private_metadata
  const feedback: string | undefined =
    payload.view?.state?.values?.[FEEDBACK_BLOCK_ID]?.[FEEDBACK_INPUT_ACTION_ID]?.value
  const user = payload.user?.username || payload.user?.name || "unknown"

  if (!draftId || !feedback?.trim()) {
    console.error("[marketing] feedback submission missing draft id or text")
    return
  }

  try {
    const { data: row } = await supabase
      .from("marketing_drafts")
      .select("title, body_md")
      .eq("id", draftId)
      .single()
    const draft = row as { title: string; body_md: string } | null

    // Enqueue the rewrite (processed_at stays null = pending). The routine drains this.
    await logSignal(supabase, {
      draft_id: draftId,
      kind: "feedback",
      feedback_text: feedback,
      original_body: draft?.body_md ?? null,
      created_by: user,
    })

    const title = draft?.title ? `"${draft.title}"` : "the draft"
    await sendSlackNotification(
      `Feedback from ${user} on ${title}: "${feedback.trim()}". A rewritten draft will post here shortly.`,
      "social"
    )
  } catch (err) {
    console.error("[marketing] feedback submission error:", (err as Error).message)
  }
}
