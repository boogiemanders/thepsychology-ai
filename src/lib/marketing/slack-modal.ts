// Opens the Feedback modal via Slack's views.open Web API. This is the ONE place the
// marketing engine needs a bot token: views.open requires a trigger_id (from the button
// click) plus an xoxb- token. Everything else still uses the incoming webhook. Set
// SLACK_BOT_TOKEN in .env.local and Vercel (Slack app -> OAuth & Permissions -> add the
// chat:write bot scope -> reinstall -> copy the xoxb- token).

const VIEWS_OPEN_URL = "https://slack.com/api/views.open"

// The callback_id the interactivity endpoint matches on for view_submission, and the
// block/action ids used to read the typed feedback back out of the submission payload.
export const FEEDBACK_MODAL_CALLBACK_ID = "feedback_modal"
export const FEEDBACK_BLOCK_ID = "feedback_block"
export const FEEDBACK_INPUT_ACTION_ID = "feedback_input"

function buildFeedbackModal(draftId: string, draftTitle?: string) {
  const blocks: unknown[] = []
  if (draftTitle) {
    blocks.push({
      type: "context",
      elements: [{ type: "mrkdwn", text: `Rewriting: *${draftTitle.slice(0, 140)}*` }],
    })
  }
  blocks.push({
    type: "input",
    block_id: FEEDBACK_BLOCK_ID,
    label: { type: "plain_text", text: "What should change?" },
    element: {
      type: "plain_text_input",
      action_id: FEEDBACK_INPUT_ACTION_ID,
      multiline: true,
      placeholder: {
        type: "plain_text",
        text: "e.g. punchier opener, cut the hedging, add a real stat on therapist burnout",
      },
    },
  })

  return {
    type: "modal",
    callback_id: FEEDBACK_MODAL_CALLBACK_ID,
    private_metadata: draftId, // the draft to rewrite; read back on view_submission
    title: { type: "plain_text", text: "Feedback" },
    submit: { type: "plain_text", text: "Rewrite" },
    close: { type: "plain_text", text: "Cancel" },
    blocks,
  }
}

// Open the feedback modal. Returns true on success. Never throws — a missing token or
// Slack error is logged and surfaced as false so the caller can still ack the click.
export async function openFeedbackModal(
  triggerId: string,
  draftId: string,
  draftTitle?: string
): Promise<boolean> {
  const token = process.env.SLACK_BOT_TOKEN
  if (!token) {
    console.error("[marketing] SLACK_BOT_TOKEN missing — cannot open feedback modal")
    return false
  }

  try {
    const res = await fetch(VIEWS_OPEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ trigger_id: triggerId, view: buildFeedbackModal(draftId, draftTitle) }),
    })
    const data = (await res.json()) as { ok?: boolean; error?: string }
    if (!data.ok) {
      console.error("[marketing] views.open failed:", data.error || "unknown")
      return false
    }
    return true
  } catch (err) {
    console.error("[marketing] views.open request error:", (err as Error).message)
    return false
  }
}
