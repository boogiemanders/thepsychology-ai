// Summarize blog_performance into content/marketing/whats-working.md — the note the
// daily generation agent reads to bias future drafts toward topics/posts that convert.
//
// Usage: npx tsx scripts/marketing/whats-working.ts

import { createClient } from "@supabase/supabase-js"
import { config } from "dotenv"
import * as fs from "fs"
import * as path from "path"

config({ path: ".env.local" })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type Perf = { slug: string; sessions: number; engaged_sessions: number; conversions: number; period_end: string }
type DraftMeta = { slug: string | null; topic: string; seo: { keyword?: string } }

function rate(n: number, d: number): string {
  return d > 0 ? `${((n / d) * 100).toFixed(1)}%` : "—"
}

async function main() {
  // Most recent performance row per slug.
  const { data: perfRows } = await supabase
    .from("blog_performance")
    .select("slug, sessions, engaged_sessions, conversions, period_end")
    .order("period_end", { ascending: false })

  const latest = new Map<string, Perf>()
  for (const r of (perfRows || []) as Perf[]) {
    if (!latest.has(r.slug)) latest.set(r.slug, r)
  }
  const perf = [...latest.values()]

  const { data: draftRows } = await supabase
    .from("marketing_drafts")
    .select("slug, topic, seo")
    .eq("type", "blog")
  const topicBySlug = new Map<string, DraftMeta>()
  for (const d of (draftRows || []) as DraftMeta[]) {
    if (d.slug) topicBySlug.set(d.slug, d)
  }

  // Rank: conversions first, then engaged sessions.
  const ranked = perf.sort((a, b) => b.conversions - a.conversions || b.engaged_sessions - a.engaged_sessions)

  // Aggregate conversions + sessions by topic.
  const byTopic: Record<string, { sessions: number; conversions: number }> = {}
  for (const p of perf) {
    const topic = topicBySlug.get(p.slug)?.topic || "(unknown — pre-engine post)"
    const t = (byTopic[topic] ||= { sessions: 0, conversions: 0 })
    t.sessions += p.sessions
    t.conversions += p.conversions
  }
  const topicLines = Object.entries(byTopic)
    .sort((a, b) => b[1].conversions - a[1].conversions || b[1].sessions - a[1].sessions)
    .map(([topic, v]) => `- **${topic}** — ${v.conversions} conversions / ${v.sessions} sessions (${rate(v.conversions, v.sessions)})`)

  const top = ranked.slice(0, 10).map((p) => {
    const kw = topicBySlug.get(p.slug)?.seo?.keyword
    return `| ${p.slug} | ${p.sessions} | ${p.engaged_sessions} | ${p.conversions} | ${rate(p.conversions, p.sessions)} | ${kw || "—"} |`
  })

  const generatedAt = new Date().toISOString()
  const note = [
    "---",
    "tags: [mktg]",
    `generated: ${generatedAt}`,
    "---",
    "",
    "#mktg",
    "",
    "# What's Working (blog)",
    "",
    "_Auto-generated from GA4 blog performance. The daily generation agent reads this to",
    "bias new drafts toward topics/angles that actually convert. Do not edit by hand._",
    "",
    "## Best topics (by conversions)",
    "",
    topicLines.length ? topicLines.join("\n") : "_No performance data yet._",
    "",
    "## Top posts",
    "",
    "| slug | sessions | engaged | conversions | conv. rate | keyword |",
    "| --- | --- | --- | --- | --- | --- |",
    top.length ? top.join("\n") : "| _no data yet_ | | | | | |",
    "",
    "## Guidance for the next round",
    "",
    "- Lean toward the top topics above; mirror the angle/keyword of the highest-converting posts.",
    "- A post with high sessions but low conversion rate = good hook, weak CTA — keep the topic, sharpen the call to action.",
    "- Low sessions = weak SEO/hook — revisit the keyword and title, not the topic.",
    "",
  ].join("\n")

  const out = path.join(process.cwd(), "content/marketing/whats-working.md")
  fs.mkdirSync(path.dirname(out), { recursive: true })
  fs.writeFileSync(out, note, "utf8")
  console.log(`✅ Wrote ${out} (${perf.length} posts analyzed)`)
}

main().catch((err) => {
  console.error("❌", err.message)
  process.exit(1)
})
