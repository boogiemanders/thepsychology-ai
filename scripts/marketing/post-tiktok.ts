// Post founder-approved finals to TikTok via Zernio. Drains marketing_drafts
// rows with tiktok_post_status='queued' (set by the "Post to TikTok" button on
// the Slack review card — see handle-interaction.ts), oldest first, capped per
// run so a clicking spree spreads across the day's runs instead of dumping
// posts on the feed at once. Runs after generate-videos.ts in
// ~/.thepsychology-automation/run-video-generate.sh (10am/1pm/4pm/7pm ET), or
// by hand for an immediate post.
//
// Failure policy: mark the row tiktok_post_status='failed' with the error and
// ping Slack, then keep draining. The review card accepts another Post click
// on failed rows, so retry = click the button again.
//
// Usage: npx tsx scripts/marketing/post-tiktok.ts [--dry-run]
// Env (.env.local): ZERNIO_API_KEY, ZERNIO_ACCOUNT_TIKTOK
// Optional: TIKTOK_POSTS_PER_RUN (default 2)

import { createClient } from "@supabase/supabase-js"
import { config } from "dotenv"
import { existsSync } from "fs"
import { publishTikTokVideo } from "../../src/lib/marketing/publish-tiktok"
import type { MarketingDraft } from "../../src/lib/marketing/types"

config({ path: ".env.local" })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const DRY_RUN = process.argv.includes("--dry-run")
const PER_RUN_CAP = Number(process.env.TIKTOK_POSTS_PER_RUN || 2)

// Same channel routing as generate-videos.ts: video approvals channel first,
// #social-approvals as fallback until SLACK_WEBHOOK_VIDEO is configured.
async function notifySlack(text: string): Promise<void> {
  const webhook = process.env.SLACK_WEBHOOK_VIDEO || process.env.SLACK_WEBHOOK_SOCIAL
  if (!webhook) return console.warn("[slack] SLACK_WEBHOOK_VIDEO/SOCIAL not set, skipping notify")
  const res = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  })
  if (!res.ok) console.error(`[slack] notify failed: ${res.status} ${await res.text()}`)
}

async function markFailed(draftId: string, label: string, reason: string): Promise<void> {
  console.error(`❌ ${label}: ${reason}`)
  await supabase
    .from("marketing_drafts")
    .update({ tiktok_post_status: "failed", tiktok_post_error: reason.slice(0, 500) })
    .eq("id", draftId)
  await notifySlack(
    `TikTok post FAILED for ${label}: ${reason.slice(0, 500)}\nHit "Post to TikTok" on its card to retry.`
  ).catch((e) => console.error(`[slack] ${(e as Error).message}`))
}

async function main() {
  const { data, error } = await supabase
    .from("marketing_drafts")
    .select("*")
    .eq("type", "tiktok")
    .eq("tiktok_post_status", "queued")
    .order("created_at", { ascending: true })
    .limit(PER_RUN_CAP)
  if (error) throw new Error(`Select failed: ${error.message}`)

  const drafts = (data ?? []) as MarketingDraft[]
  if (drafts.length === 0) {
    console.log("No queued TikTok posts. Nothing to do.")
    return
  }
  console.log(`${drafts.length} queued post(s) (cap ${PER_RUN_CAP}/run).`)

  for (const draft of drafts) {
    const label = `"${draft.title}" [${draft.id.slice(0, 8)}]`
    // The deliverable is the Remotion final next to the raw mp4 in Drive.
    const finalPath = draft.video_path ? draft.video_path.replace(/\.mp4$/, "_final.mp4") : null
    const caption = draft.tiktok_caption?.trim()

    if (!finalPath || !existsSync(finalPath)) {
      await markFailed(draft.id, label, `final cut not found at ${finalPath ?? "(no video_path)"}`)
      continue
    }
    if (!caption) {
      await markFailed(draft.id, label, "no tiktok_caption on the row (review card sets it)")
      continue
    }

    if (DRY_RUN) {
      console.log(`[dry-run] would post ${label} → ${finalPath}`)
      continue
    }

    let result
    try {
      console.log(`▶ Posting ${label}...`)
      result = await publishTikTokVideo(finalPath, caption)
    } catch (pubErr) {
      await markFailed(draft.id, label, (pubErr as Error).message)
      continue
    }

    const { error: updErr } = await supabase
      .from("marketing_drafts")
      .update({
        tiktok_post_status: "posted",
        tiktok_post_id: result.postId,
        tiktok_post_error: null,
        tiktok_posted_at: new Date().toISOString(),
      })
      .eq("id", draft.id)
    // The post is already live at this point. If the DB write fails the row stays
    // 'queued' and the next run would double-post — surface this loudly.
    if (updErr) {
      throw new Error(
        `Posted to TikTok but DB update FAILED for ${draft.id} (zernio post ${result.postId}). ` +
          `Set tiktok_post_status='posted' manually to avoid a duplicate next run: ${updErr.message}`
      )
    }

    const link = result.url ? ` → ${result.url}` : " (link appears on @thepsychology.ai in a few minutes)"
    console.log(`✅ Posted ${label}${link}`)
    await notifySlack(`Posted to TikTok: ${draft.title}${link}`).catch((e) =>
      console.error(`[slack] ${(e as Error).message}`)
    )
  }
}

main().catch((err) => {
  console.error("❌", err.message)
  process.exit(1)
})
