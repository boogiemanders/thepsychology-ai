// Drip-publish queued LinkedIn drafts. Run by a cron ~2x/day (9am + 2pm ET).
// Each run publishes AT MOST ONE post. The per-day cap is queue-depth aware: a thin
// backlog drips 1/day to protect runway, a healthy backlog (QUEUE_2X_THRESHOLD+)
// drips 2/day to drain faster. Approvals just fill the buffer. Drains FIFO by age.
//
// Usage: npx tsx scripts/marketing/drip-linkedin.ts [--dry-run]

import { createClient } from "@supabase/supabase-js"
import { config } from "dotenv"
import { publishLinkedInDraft } from "../../src/lib/marketing/publish-linkedin"
import type { MarketingDraft } from "../../src/lib/marketing/types"

config({ path: ".env.local" })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Effective backlog (still-queued + already-posted-today) at/above this -> 2/day,
// otherwise 1/day. Caps absolutely at 2/day. 2 in the queue always = 1/day.
const QUEUE_2X_THRESHOLD = 5
const DRY_RUN = process.argv.includes("--dry-run")

// Start of "today" in America/New_York, as a UTC ISO string. The founder is ET and
// cares how the feed looks per ET day, so the cap is an ET calendar day, not UTC.
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

  // How many LinkedIn posts already went live today (ET)?
  const { count: publishedCount, error: countErr } = await supabase
    .from("marketing_drafts")
    .select("id", { count: "exact", head: true })
    .eq("type", "linkedin")
    .eq("status", "published")
    .gte("published_at", sinceIso)
  if (countErr) throw new Error(`Count failed: ${countErr.message}`)
  const publishedToday = publishedCount ?? 0

  // Oldest queued LinkedIn draft (FIFO by draft age) + total queue depth in one query.
  const { data, count: queuedCount, error } = await supabase
    .from("marketing_drafts")
    .select("*", { count: "exact" })
    .eq("type", "linkedin")
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(1)
  if (error) throw new Error(`Select failed: ${error.message}`)

  const draft = (data?.[0] as MarketingDraft | undefined) ?? null
  if (!draft) {
    console.log("Queue empty — no queued LinkedIn drafts.")
    return
  }

  // Decide today's cadence from the effective backlog. Including publishedToday keeps
  // the decision stable across the 9am/2pm runs (it doesn't shrink after the 1st post).
  const effectiveDepth = (queuedCount ?? 0) + publishedToday
  const dailyCap = effectiveDepth >= QUEUE_2X_THRESHOLD ? 2 : 1

  if (publishedToday >= dailyCap) {
    console.log(
      `Cadence cap reached today (${publishedToday}/${dailyCap}; backlog ${effectiveDepth}, ` +
        `2x at ${QUEUE_2X_THRESHOLD}+). Nothing to do.`
    )
    return
  }

  if (DRY_RUN) {
    console.log(
      `[dry-run] would publish "${draft.title}" [${draft.id.slice(0, 8)}] ` +
        `(${publishedToday + 1}/${dailyCap} today; backlog ${effectiveDepth})`
    )
    return
  }

  let result
  try {
    result = await publishLinkedInDraft(draft)
  } catch (pubErr) {
    // Publish failed (Zernio 409 duplicate, 5xx, auth, etc.). Don't leave it at the
    // queue head jamming everything behind it — reject it with the reason and move on
    // (the next run takes the next queued draft). Trade-off: a transient failure also
    // gets rejected, so re-queue that draft manually if it should still go out.
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

  // The post is already live on LinkedIn at this point. If the DB write fails, the
  // draft stays 'queued' and the next run would republish it — so surface this loudly.
  if (updErr) {
    throw new Error(
      `Published to LinkedIn but DB update FAILED for ${draft.id} (url=${result.url}). ` +
        `Mark it 'published' manually to avoid a duplicate next run: ${updErr.message}`
    )
  }

  const link = result.url ? ` → ${result.url}` : " (URL pending)"
  console.log(`✅ Published "${draft.title}" [${draft.id.slice(0, 8)}]${link} (${publishedToday + 1}/${dailyCap} today, backlog ${effectiveDepth})`)
}

main().catch((err) => {
  console.error("❌", err.message)
  process.exit(1)
})
