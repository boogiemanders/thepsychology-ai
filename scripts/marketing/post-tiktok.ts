// Post founder-approved finals to TikTok via Zernio. Drains marketing_drafts
// rows with tiktok_post_status='queued' (set by the "Post to TikTok" button on
// the Slack review card — see handle-interaction.ts), oldest first, capped at
// ONE post per ET day (founder cadence, 2026-06-12) — approvals just fill the
// queue and posts drip out daily, same idea as drip-blog. The first run of the
// day (10am) posts; later runs are no-ops once the day's post is out. Runs
// after generate-videos.ts in ~/.thepsychology-automation/run-video-generate.sh
// (10am/1pm/4pm/7pm ET), or by hand for an immediate post.
//
// Failure policy: mark the row tiktok_post_status='failed' with the error and
// ping Slack, then keep draining. The review card accepts another Post click
// on failed rows, so retry = click the button again.
//
// Usage: npx tsx scripts/marketing/post-tiktok.ts [--dry-run]
// Env (.env.local): ZERNIO_API_KEY, ZERNIO_ACCOUNT_TIKTOK
// Optional: TIKTOK_POSTS_PER_DAY (default 1)

import { createClient } from "@supabase/supabase-js"
import { config } from "dotenv"
import { existsSync, mkdirSync, renameSync } from "fs"
import { basename, join } from "path"
import { publishTikTokVideo } from "../../src/lib/marketing/publish-tiktok"
import type { MarketingDraft } from "../../src/lib/marketing/types"

config({ path: ".env.local" })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const DRY_RUN = process.argv.includes("--dry-run")
// Same Drive root as generate-videos.ts; published work lands in done/ off the
// root even though in-review files live in "final review/".
const OUTPUT_DIR =
  process.env.VIDEO_OUTPUT_DIR ||
  "/Users/anderschan/Library/CloudStorage/GoogleDrive-dranders@drinzinna.com/My Drive/thepsychology.ai marketing/videos"
// Folder lifecycle (founder 2026-06-13): clicking "Post to TikTok" in Slack only
// flips the row to 'queued' (the server can't touch the local Drive), so this
// LOCAL run is what physically relocates files. Waiting room = queued/, posted =
// done/, still-in-review = "final review/".
const QUEUED_DIR = join(OUTPUT_DIR, "queued")
const DAILY_CAP = Number(process.env.TIKTOK_POSTS_PER_DAY || 1)

// Same ET-day convention as drip-blog/drip-linkedin — the cap is per founder
// calendar day, not UTC.
function startOfEtDayUtcIso(): string {
  const now = new Date()
  const etNow = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }))
  const utcNow = new Date(now.toLocaleString("en-US", { timeZone: "UTC" }))
  const offsetMs = utcNow.getTime() - etNow.getTime()
  etNow.setHours(0, 0, 0, 0)
  return new Date(etNow.getTime() + offsetMs).toISOString()
}

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

// Move every 'queued' row's file trio (raw mp4, SRT, final) into queued/ and
// repoint video_path. Runs every pipeline tick so files that the Slack button
// queued land in the waiting-room folder regardless of the daily cap. Skips
// rows already in queued/ and is best-effort per row (a move failure logs and
// moves on, never blocks posting).
async function reconcileQueuedFolder(): Promise<void> {
  const { data, error } = await supabase
    .from("marketing_drafts")
    .select("id,video_path")
    .eq("type", "tiktok")
    .eq("tiktok_post_status", "queued")
  if (error) return console.warn(`[queued-move] select failed: ${error.message}`)
  for (const row of (data ?? []) as Array<{ id: string; video_path: string | null }>) {
    const vp = row.video_path
    if (!vp || vp.includes("/queued/")) continue // no file, or already in queued/
    if (DRY_RUN) {
      console.log(`[dry-run] would move ${row.id.slice(0, 8)} to queued/`)
      continue
    }
    try {
      mkdirSync(QUEUED_DIR, { recursive: true })
      const finalP = vp.replace(/\.mp4$/, "_final.mp4")
      const srtP = vp.replace(/\.mp4$/, ".srt")
      for (const p of [vp, srtP, finalP]) {
        if (existsSync(p)) renameSync(p, join(QUEUED_DIR, basename(p)))
      }
      const newVp = join(QUEUED_DIR, basename(vp))
      await supabase.from("marketing_drafts").update({ video_path: newVp }).eq("id", row.id)
      console.log(`→ moved ${row.id.slice(0, 8)} to queued/`)
    } catch (e) {
      console.warn(`[queued-move] ${row.id.slice(0, 8)} failed (files stay put): ${(e as Error).message}`)
    }
  }
}

async function main() {
  // First, migrate any newly-queued rows into the queued/ waiting room. Done
  // before the cap check so files relocate even on a day that is already capped.
  await reconcileQueuedFolder()

  // How many already went out today (ET)?
  const { count, error: countErr } = await supabase
    .from("marketing_drafts")
    .select("id", { count: "exact", head: true })
    .eq("type", "tiktok")
    .eq("tiktok_post_status", "posted")
    .gte("tiktok_posted_at", startOfEtDayUtcIso())
  if (countErr) throw new Error(`Count failed: ${countErr.message}`)
  const postedToday = count ?? 0
  if (postedToday >= DAILY_CAP) {
    console.log(`Daily cap reached (${postedToday}/${DAILY_CAP}). Nothing to do.`)
    return
  }

  const { data, error } = await supabase
    .from("marketing_drafts")
    .select("*")
    .eq("type", "tiktok")
    .eq("tiktok_post_status", "queued")
    .order("created_at", { ascending: true })
    .limit(DAILY_CAP - postedToday)
  if (error) throw new Error(`Select failed: ${error.message}`)

  const drafts = (data ?? []) as MarketingDraft[]
  if (drafts.length === 0) {
    console.log("No queued TikTok posts. Nothing to do.")
    return
  }
  console.log(`${drafts.length} queued post(s) (${postedToday}/${DAILY_CAP} posted today).`)

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

    // Published: move the draft's trio (raw mp4, SRT, final) into videos/done
    // so the review folder only holds unposted work (founder ask 2026-06-12).
    // Best-effort — a failed move must not block marking the row posted.
    let newRawPath = draft.video_path!
    try {
      const doneDir = join(OUTPUT_DIR, "done")
      mkdirSync(doneDir, { recursive: true })
      const srtPath = draft.video_path!.replace(/\.mp4$/, ".srt")
      for (const p of [draft.video_path!, srtPath, finalPath]) {
        if (existsSync(p)) renameSync(p, join(doneDir, basename(p)))
      }
      newRawPath = join(doneDir, basename(draft.video_path!))
    } catch (moveErr) {
      console.warn(`⚠️  ${label}: move to done/ failed (files stay put): ${(moveErr as Error).message}`)
    }

    const { error: updErr } = await supabase
      .from("marketing_drafts")
      .update({
        tiktok_post_status: "posted",
        tiktok_post_id: result.postId,
        tiktok_post_error: null,
        tiktok_posted_at: new Date().toISOString(),
        video_path: newRawPath,
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
