// Drip-publish queued blog drafts. Run by a daily cron/launchd. Publishes AT MOST ONE
// blog per ET calendar day (founder wants approved blogs spaced out, not dumped). Approving
// a blog in #social-approvals just queues it; this drains the queue FIFO by draft age.
//
// Usage: npx tsx scripts/marketing/drip-blog.ts [--dry-run]

import { createClient } from "@supabase/supabase-js"
import { config } from "dotenv"
import { publishBlogDraft } from "../../src/lib/marketing/publish-blog"
import type { MarketingDraft } from "../../src/lib/marketing/types"

config({ path: ".env.local" })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const DAILY_CAP = 1
const DRY_RUN = process.argv.includes("--dry-run")

// Start of "today" in America/New_York as a UTC ISO string. The founder is ET and cares
// how publishing looks per ET day, so the cap is an ET calendar day, not UTC.
function startOfEtDayUtcIso(): string {
  const now = new Date()
  const etNow = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }))
  const utcNow = new Date(now.toLocaleString("en-US", { timeZone: "UTC" }))
  const offsetMs = utcNow.getTime() - etNow.getTime() // how far ET is behind UTC
  etNow.setHours(0, 0, 0, 0)
  return new Date(etNow.getTime() + offsetMs).toISOString()
}

async function main() {
  const sinceIso = startOfEtDayUtcIso()

  // How many blogs already published today (ET)?
  const { count: publishedCount, error: countErr } = await supabase
    .from("marketing_drafts")
    .select("id", { count: "exact", head: true })
    .eq("type", "blog")
    .eq("status", "published")
    .gte("published_at", sinceIso)
  if (countErr) throw new Error(`Count failed: ${countErr.message}`)
  const publishedToday = publishedCount ?? 0

  if (publishedToday >= DAILY_CAP) {
    console.log(`Daily cap reached (${publishedToday}/${DAILY_CAP} published today). Nothing to do.`)
    return
  }

  // Oldest queued blog draft (FIFO by draft age).
  const { data, error } = await supabase
    .from("marketing_drafts")
    .select("*")
    .eq("type", "blog")
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(1)
  if (error) throw new Error(`Select failed: ${error.message}`)

  const draft = (data?.[0] as MarketingDraft | undefined) ?? null
  if (!draft) {
    console.log("Queue empty — no queued blog drafts.")
    return
  }

  if (DRY_RUN) {
    console.log(`[dry-run] would publish "${draft.title}" [${draft.id.slice(0, 8)}] (${publishedToday + 1}/${DAILY_CAP} today)`)
    return
  }

  let result
  try {
    result = await publishBlogDraft(draft)
  } catch (pubErr) {
    // Publish failed (GitHub API error, etc.). Don't leave it at the queue head jamming
    // everything behind it — reject it with the reason so the next run takes the next blog.
    // Trade-off: a transient failure also gets rejected, so re-queue manually if needed.
    const reason = (pubErr as Error).message.slice(0, 500)
    await supabase
      .from("marketing_drafts")
      .update({ status: "rejected", review_notes: `drip publish failed: ${reason}` })
      .eq("id", draft.id)
    console.error(`❌ Publish failed for "${draft.title}" [${draft.id.slice(0, 8)}] — marked rejected, queue unblocked: ${reason}`)
    return
  }

  const { error: updErr } = await supabase
    .from("marketing_drafts")
    .update({ status: "published", published_url: result.url, published_at: new Date().toISOString() })
    .eq("id", draft.id)

  // The blog is already committed/live at this point. If the DB write fails, the draft
  // stays 'queued' and the next run would republish it — so surface this loudly.
  if (updErr) {
    throw new Error(
      `Published blog but DB update FAILED for ${draft.id} (url=${result.url}). ` +
        `Mark it 'published' manually to avoid a duplicate next run: ${updErr.message}`
    )
  }

  console.log(`✅ Published "${draft.title}" [${draft.id.slice(0, 8)}] → ${result.url} (${publishedToday + 1}/${DAILY_CAP} today)`)
}

main().catch((err) => {
  console.error("❌", err.message)
  process.exit(1)
})
