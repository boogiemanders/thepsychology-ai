// Print recent marketing_drafts as JSON so a daily routine can avoid repeats and
// balance coverage. The launchd run scripts hard-reset the checkout to origin/main
// every run, so a local file can't track history — Supabase is the only durable
// memory. This reads it. The tiktok-eppp lane uses it for domain balance (which of
// the 12 EPPP domains were covered recently) and every lane uses it to not repeat a
// topic/hook already drafted.
//
// Run: node --env-file=.env.local --import tsx scripts/marketing/recent-drafts.ts [--type=tiktok] [--topic=eppp] [--days=14] [--limit=100]
//
// Output: JSON array, newest first, each:
//   { id, type, topic, title, status, created_at, sources: [{title, url}] }
// `sources` lets the routine dedup oe_ask research against studies already shared.

import { createClient } from "@supabase/supabase-js"
import { config } from "dotenv"

config({ path: ".env.local" })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`))
  return hit ? hit.split("=").slice(1).join("=") : undefined
}

async function main() {
  const days = Number(arg("days") ?? 14)
  const limit = Number(arg("limit") ?? 100)
  const type = arg("type")
  const topic = arg("topic")
  const since = new Date(Date.now() - days * 86400_000).toISOString()

  let q = supabase
    .from("marketing_drafts")
    .select("id, type, topic, title, status, created_at, sources")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(limit)
  if (type) q = q.eq("type", type)
  if (topic) q = q.eq("topic", topic)

  const { data, error } = await q
  if (error) throw new Error(`Read failed: ${error.message}`)

  const out = (data || []).map((d: any) => ({
    id: d.id,
    type: d.type,
    topic: d.topic,
    title: d.title,
    status: d.status,
    created_at: d.created_at,
    sources: Array.isArray(d.sources)
      ? d.sources.map((s: any) => ({ title: s?.title, url: s?.url }))
      : [],
  }))

  console.log(JSON.stringify(out, null, 2))
}

main().catch((err) => {
  console.error("❌", err.message)
  process.exit(1)
})
