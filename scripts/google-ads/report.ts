// Read-only Google Ads connectivity test + 7-day account snapshot.
// Proves OAuth + developer token work end to end, then prints campaigns,
// ad groups, and the top search terms (the raw material for negative mining).
// No writes. Safe to run anytime.
//
// Auth (in .env.local): GOOGLE_ADS_DEVELOPER_TOKEN, GOOGLE_ADS_CLIENT_ID,
// GOOGLE_ADS_CLIENT_SECRET, GOOGLE_ADS_REFRESH_TOKEN, GOOGLE_ADS_CUSTOMER_ID,
// and GOOGLE_ADS_LOGIN_CUSTOMER_ID only if the account sits under a manager.
//
// Usage: npx tsx scripts/google-ads/report.ts

import { getCustomer } from "./client"

const usd = (micros: number | string | null | undefined) =>
  `$${(Number(micros ?? 0) / 1_000_000).toFixed(2)}`

async function main() {
  const customer = getCustomer()

  // 1. Connectivity: who am I?
  const [acct] = await customer.query(`
    SELECT customer.id, customer.descriptive_name, customer.currency_code
    FROM customer
    LIMIT 1
  `)
  console.log(
    `\nAccount: ${acct?.customer?.descriptive_name} (${acct?.customer?.id}) ${acct?.customer?.currency_code}`
  )

  // 2. Campaigns, last 7 days
  const campaigns = await customer.query(`
    SELECT campaign.name, campaign.status, metrics.impressions, metrics.clicks,
           metrics.cost_micros, metrics.conversions
    FROM campaign
    WHERE segments.date DURING LAST_7_DAYS
    ORDER BY metrics.cost_micros DESC
  `)
  console.log("\nCampaigns (last 7 days):")
  if (campaigns.length === 0) console.log("  (no data yet)")
  for (const r of campaigns) {
    console.log(
      `  ${r.campaign?.name}  [${r.campaign?.status}]  ` +
        `impr ${r.metrics?.impressions}  clicks ${r.metrics?.clicks}  ` +
        `cost ${usd(r.metrics?.cost_micros)}  conv ${r.metrics?.conversions}`
    )
  }

  // 3. Ad groups, last 7 days
  const adGroups = await customer.query(`
    SELECT campaign.name, ad_group.name, ad_group.status,
           metrics.clicks, metrics.cost_micros, metrics.conversions
    FROM ad_group
    WHERE segments.date DURING LAST_7_DAYS
    ORDER BY metrics.cost_micros DESC
  `)
  console.log("\nAd groups (last 7 days):")
  if (adGroups.length === 0) console.log("  (no data yet)")
  for (const r of adGroups) {
    console.log(
      `  ${r.campaign?.name} > ${r.ad_group?.name}  [${r.ad_group?.status}]  ` +
        `clicks ${r.metrics?.clicks}  cost ${usd(r.metrics?.cost_micros)}  ` +
        `conv ${r.metrics?.conversions}`
    )
  }

  // 4. Top search terms, last 7 days (basis for negative-keyword mining)
  const terms = await customer.query(`
    SELECT search_term_view.search_term, metrics.clicks, metrics.cost_micros,
           metrics.conversions
    FROM search_term_view
    WHERE segments.date DURING LAST_7_DAYS
    ORDER BY metrics.cost_micros DESC
    LIMIT 25
  `)
  console.log("\nTop search terms (last 7 days):")
  if (terms.length === 0) console.log("  (no data yet)")
  for (const r of terms) {
    console.log(
      `  "${r.search_term_view?.search_term}"  ` +
        `clicks ${r.metrics?.clicks}  cost ${usd(r.metrics?.cost_micros)}  ` +
        `conv ${r.metrics?.conversions}`
    )
  }
  console.log()
}

main().catch((e) => {
  console.error("Google Ads report failed:", e?.message || e)
  process.exit(1)
})
