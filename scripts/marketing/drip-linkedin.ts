// Drip-publish queued LinkedIn drafts. Run by launchd ~2x/day (e.g. 9am + 2pm local).
// Each run publishes AT MOST ONE post, and never more than MAX_PER_DAY in a single ET
// calendar day, so approvals just fill a buffer and the feed drains slowly instead of
// going out in bursts. Drains FIFO by draft age.
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

const MAX_PER_DAY = 2
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
  const { count, error: countErr } = await supabase
    .from("marketing_drafts")
    .select("id", { count: "exact", head: true })
    .eq("type", "linkedin")
    .eq("status", "published")
    .gte("published_at", sinceIso)
  if (countErr) throw new Error(`Count failed: ${countErr.message}`)

  const publishedToday = count ?? 0
  if (publishedToday >= MAX_PER_DAY) {
    console.log(`Daily cap reached (${publishedToday}/${MAX_PER_DAY}). Nothing to do.`)
    return
  }

  // Oldest queued LinkedIn draft (FIFO by draft age).
  const { data, error } = await supabase
    .from("marketing_drafts")
    .select("*")
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

  if (DRY_RUN) {
    console.log(
      `[dry-run] would publish "${draft.title}" [${draft.id.slice(0, 8)}] ` +
        `(published today: ${publishedToday}/${MAX_PER_DAY})`
    )
    return
  }

  const result = await publishLinkedInDraft(draft)
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
  console.log(`✅ Published "${draft.title}" [${draft.id.slice(0, 8)}]${link} (${publishedToday + 1}/${MAX_PER_DAY} today)`)
}

main().catch((err) => {
  console.error("❌", err.message)
  process.exit(1)
})
