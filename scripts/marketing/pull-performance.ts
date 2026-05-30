// Pull blog performance from GA4 (Data API) and upsert into blog_performance.
// Engagement is per pagePath; conversions are sign_up events in sessions that
// LANDED on a blog page (so the post gets credit for the click that converted).
//
// Auth: set GOOGLE_APPLICATION_CREDENTIALS to the service-account JSON path and
// GA4_PROPERTY_ID to the numeric property id (NOT the G-XXXX measurement id).
//
// Usage: npx tsx scripts/marketing/pull-performance.ts [days]   (default 28)

import { BetaAnalyticsDataClient } from "@google-analytics/data"
import { createClient } from "@supabase/supabase-js"
import { config } from "dotenv"

config({ path: ".env.local" })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const propertyId = process.env.GA4_PROPERTY_ID
if (!propertyId) {
  console.error("❌ GA4_PROPERTY_ID is not set")
  process.exit(1)
}

// Reuse the existing GA4 auth (same as scripts/ga_query.mjs): GOOGLE_SERVICE_ACCOUNT_KEY
// holds the service-account JSON (raw or base64). No GOOGLE_APPLICATION_CREDENTIALS needed.
const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
if (!rawKey) {
  console.error("GOOGLE_SERVICE_ACCOUNT_KEY is not set")
  process.exit(1)
}
let creds: { client_email: string; private_key: string }
try {
  creds = JSON.parse(rawKey)
} catch {
  creds = JSON.parse(Buffer.from(rawKey, "base64").toString("utf-8"))
}

const analytics = new BetaAnalyticsDataClient({
  credentials: { client_email: creds.client_email, private_key: creds.private_key },
})
const property = `properties/${propertyId}`

const days = Number(process.argv[2] || 28)
const end = new Date()
const start = new Date()
start.setDate(end.getDate() - days)
const periodStart = start.toISOString().slice(0, 10)
const periodEnd = end.toISOString().slice(0, 10)

function slugFromBlogPath(path: string): string | null {
  const m = path.match(/^\/blog\/([^/?#]+)/)
  return m ? m[1] : null
}

async function main() {
  // Engagement per blog page.
  const [engagement] = await analytics.runReport({
    property,
    dateRanges: [{ startDate: periodStart, endDate: periodEnd }],
    dimensions: [{ name: "pagePath" }],
    metrics: [{ name: "sessions" }, { name: "engagedSessions" }],
    dimensionFilter: {
      filter: { fieldName: "pagePath", stringFilter: { matchType: "BEGINS_WITH", value: "/blog/" } },
    },
    limit: 1000,
  })

  // Conversions: sign_up events in sessions that landed on a blog page.
  const [conv] = await analytics.runReport({
    property,
    dateRanges: [{ startDate: periodStart, endDate: periodEnd }],
    dimensions: [{ name: "landingPagePlusQueryString" }],
    metrics: [{ name: "eventCount" }],
    dimensionFilter: {
      andGroup: {
        expressions: [
          { filter: { fieldName: "landingPagePlusQueryString", stringFilter: { matchType: "BEGINS_WITH", value: "/blog/" } } },
          { filter: { fieldName: "eventName", stringFilter: { matchType: "EXACT", value: "sign_up" } } },
        ],
      },
    },
    limit: 1000,
  })

  const rows: Record<string, { sessions: number; engaged: number; conversions: number }> = {}

  for (const r of engagement.rows || []) {
    const slug = slugFromBlogPath(r.dimensionValues?.[0]?.value || "")
    if (!slug) continue
    const e = (rows[slug] ||= { sessions: 0, engaged: 0, conversions: 0 })
    e.sessions += Number(r.metricValues?.[0]?.value || 0)
    e.engaged += Number(r.metricValues?.[1]?.value || 0)
  }
  for (const r of conv.rows || []) {
    const slug = slugFromBlogPath(r.dimensionValues?.[0]?.value || "")
    if (!slug) continue
    const e = (rows[slug] ||= { sessions: 0, engaged: 0, conversions: 0 })
    e.conversions += Number(r.metricValues?.[0]?.value || 0)
  }

  const records = Object.entries(rows).map(([slug, v]) => ({
    slug,
    period_start: periodStart,
    period_end: periodEnd,
    sessions: v.sessions,
    engaged_sessions: v.engaged,
    conversions: v.conversions,
    pulled_at: new Date().toISOString(),
  }))

  if (records.length === 0) {
    console.log("No blog traffic in window.")
    return
  }

  const { error } = await supabase
    .from("blog_performance")
    .upsert(records, { onConflict: "slug,period_start,period_end" })
  if (error) throw new Error(`Upsert failed: ${error.message}`)

  console.log(`✅ Upserted ${records.length} blog_performance rows (${periodStart} → ${periodEnd})`)
}

main().catch((err) => {
  console.error("❌", err.message)
  process.exit(1)
})
