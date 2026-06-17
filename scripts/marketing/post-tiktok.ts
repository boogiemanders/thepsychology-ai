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

// Move a draft's trio (raw .mp4, .srt, _final.mp4) into videos/<subdir> and
// return the new raw-mp4 path (what video_path stores). Best-effort: on any
// error the files stay put and the original raw path comes back.
function moveTrio(rawPath: string, subdir: string): string {
  try {
    const destDir = join(OUTPUT_DIR, subdir)
    mkdirSync(destDir, { recursive: true })
    const srtPath = rawPath.replace(/\.mp4$/, ".srt")
    const finalPath = rawPath.replace(/\.mp4$/, "_final.mp4")
    for (const p of [rawPath, srtPath, finalPath]) {
      if (existsSync(p)) renameSync(p, join(destDir, basename(p)))
    }
    return join(destDir, basename(rawPath))
  } catch (moveErr) {
    console.warn(`⚠️  move to ${subdir}/ failed (files stay put): ${(moveErr as Error).message}`)
    return rawPath
  }
}

// Reflect the post queue on disk: every queued draft's files live in
// videos/queued (founder ask 2026-06-15). The "Post to TikTok" click flips the
// status on Vercel, which can't reach this Mac's Drive, so we reconcile the
// folder here on each run (including --dry-run — only the posting is gated).
// Files then drip out to done/ as they post.
async function syncQueuedFolder(): Promise<void> {
  const { data, error } = await supabase
    .from("marketing_drafts")
    .select("id, video_path")
    .eq("type", "tiktok")
    .eq("tiktok_post_status", "queued")
  if (error) {
    console.warn(`[tiktok] queue-folder sync skipped: ${error.message}`)
    return
  }
  for (const row of data ?? []) {
    if (!row.video_path || row.video_path.includes("/queued/")) continue
    const newPath = moveTrio(row.video_path, "queued")
    if (newPath !== row.video_path) {
      await supabase.from("marketing_drafts").update({ video_path: newPath }).eq("id", row.id)
      console.log(`→ queued/: ${basename(newPath)}`)
    }
  }
}

async function main() {
  await syncQueuedFolder()

  // Per-topic daily quotas (ET day). The exam/everything-else lane keeps the
  // existing cap (TIKTOK_POSTS_PER_DAY); strategy videos get their own daily
  // slot so a test-taking tactic goes out ALONGSIDE the question, not instead
  // of it (founder 2026-06-16: "post a strategy one a day too").
  const since = startOfEtDayUtcIso()
  const examCap = DAILY_CAP
  const stratCap = Number(process.env.TIKTOK_STRATEGY_POSTS_PER_DAY || 1)

  const countPosted = async (strategy: boolean): Promise<number> => {
    let q = supabase
      .from("marketing_drafts")
      .select("id", { count: "exact", head: true })
      .eq("type", "tiktok")
      .eq("tiktok_post_status", "posted")
      .gte("tiktok_posted_at", since)
    q = strategy ? q.eq("topic", "eppp-strategy") : q.neq("topic", "eppp-strategy")
    const { count, error } = await q
    if (error) throw new Error(`Count failed: ${error.message}`)
    return count ?? 0
  }
  const otherRemaining = Math.max(0, examCap - (await countPosted(false)))
  const stratRemaining = Math.max(0, stratCap - (await countPosted(true)))
  if (otherRemaining === 0 && stratRemaining === 0) {
    console.log("Daily post caps reached. Nothing to do.")
    return
  }

  const pickQueued = async (strategy: boolean, n: number): Promise<MarketingDraft[]> => {
    if (n <= 0) return []
    let q = supabase
      .from("marketing_drafts")
      .select("*")
      .eq("type", "tiktok")
      .eq("tiktok_post_status", "queued")
    q = strategy ? q.eq("topic", "eppp-strategy") : q.neq("topic", "eppp-strategy")
    const { data, error } = await q.order("created_at", { ascending: true }).limit(n)
    if (error) throw new Error(`Select failed: ${error.message}`)
    return (data ?? []) as MarketingDraft[]
  }
  // Strategy first so its daily slot is never crowded out by a backlog of exams.
  const drafts = [
    ...(await pickQueued(true, stratRemaining)),
    ...(await pickQueued(false, otherRemaining)),
  ]
  if (drafts.length === 0) {
    console.log("No queued TikTok posts. Nothing to do.")
    return
  }
  console.log(
    `${drafts.length} queued post(s) (exam/other up to ${otherRemaining}, strategy up to ${stratRemaining}).`
  )

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

    // Published: move the trio (raw mp4, SRT, final) from queued/ into videos/done
    // so the queue folder only holds unposted work. Best-effort — a failed move
    // must not block marking the row posted.
    const newRawPath = moveTrio(draft.video_path!, "done")

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
