// Switch the campaign's bidding from Maximize Conversions to Maximize Clicks
// (= TARGET_SPEND bidding strategy in the API). This is TEMPORARY scaffolding to
// break the cold-start trap: Maximize Conversions with zero conversion history bids
// near-zero, so the campaign never serves (0 impressions -> 0 clicks -> 0 conversions
// -> stays dark forever). Maximize Clicks forces it to serve and gather click +
// search-term data. Once real purchase conversions accumulate, flip it BACK to
// Maximize Conversions (or add a tCPA). Re-running this script after the flip is a
// no-op.
//
// A max-CPC ceiling is set because the API will not switch to TARGET_SPEND with an
// empty body (the update mask can't point at target_spend itself, it needs a leaf
// subfield). We set it to $5: high enough that ads still win auctions (a too-low
// ceiling would re-create the no-serve problem we're trying to escape), low enough
// that a single click can't eat half the $10/day budget. Adjust CPC_CEILING_USD if
// CPCs run hot or serving stays thin.
//
// SAFE BY DEFAULT: validate_only unless --apply.
// Usage:
//   bun run gads:max-clicks              # dry run: prints current bidding, validates, changes nothing
//   bun run gads:max-clicks -- --apply   # flip to Maximize Clicks (live), then re-query to verify

import { enums } from "google-ads-api"
import { getCustomer } from "./client"

const APPLY = process.argv.includes("--apply")
const CAMPAIGN_NAME = process.env.GADS_CAMPAIGN_NAME || "EPPP Prep - Search - US+CA"
const CPC_CEILING_USD = 5
const CPC_CEILING_MICROS = CPC_CEILING_USD * 1_000_000

const bidLabel = (n: number | null | undefined) =>
  enums.BiddingStrategyType[n as number] ?? String(n)

async function main() {
  const customer = getCustomer()

  // Resolve the campaign and read its current bidding strategy (the before-state).
  const [c] = await customer.query(`
    SELECT campaign.id, campaign.name, campaign.resource_name,
           campaign.status, campaign.bidding_strategy_type
    FROM campaign
    WHERE campaign.name = '${CAMPAIGN_NAME.replace(/'/g, "\\'")}'
    LIMIT 1
  `)
  const camp = c?.campaign as any
  if (!camp?.resource_name) {
    console.error(`Campaign not found: "${CAMPAIGN_NAME}"`)
    process.exit(1)
  }

  const before = camp.bidding_strategy_type as number
  console.log(`Campaign: ${camp.name} (id ${camp.id})`)
  console.log(`  current bidding: ${bidLabel(before)}`)

  if (before === enums.BiddingStrategyType.TARGET_SPEND) {
    console.log("\nAlready on Maximize Clicks (TARGET_SPEND). Nothing to do.")
    return
  }

  // Set the target_spend bidding scheme. Bidding strategy is a oneof on the campaign,
  // so selecting target_spend automatically clears maximize_conversions on the server.
  // cpc_bid_ceiling_micros must be set: it gives the update mask a leaf subfield (the
  // API rejects a bare target_spend mask) and caps the max bid per click.
  const operations: any[] = [
    {
      entity: "campaign",
      operation: "update",
      resource: {
        resource_name: camp.resource_name,
        target_spend: { cpc_bid_ceiling_micros: CPC_CEILING_MICROS },
      },
    },
  ]

  console.log(
    `\nPlan: switch bidding ${bidLabel(before)} -> TARGET_SPEND (Maximize Clicks), ` +
      `max CPC ceiling $${CPC_CEILING_USD}.`
  )

  await customer.mutateResources(operations, { validate_only: !APPLY })

  if (!APPLY) {
    console.log("\nDRY RUN ok: Google validated the switch, nothing was changed.")
    console.log("Re-run with -- --apply to apply (goes live).")
    return
  }

  // Re-query to prove the flip actually took.
  const [after] = await customer.query(`
    SELECT campaign.bidding_strategy_type
    FROM campaign WHERE campaign.name = '${CAMPAIGN_NAME.replace(/'/g, "\\'")}' LIMIT 1
  `)
  const now = (after?.campaign as any)?.bidding_strategy_type as number
  if (now === enums.BiddingStrategyType.TARGET_SPEND) {
    console.log(`\nAPPLIED + VERIFIED: bidding is now ${bidLabel(now)} (Maximize Clicks).`)
    console.log("Watch for impressions/clicks over the next few days, then flip back to")
    console.log("Maximize Conversions once purchase conversions start landing.")
  } else {
    console.log(`\nAPPLIED but verification reads ${bidLabel(now)} - re-check in the UI.`)
  }
}

main().catch((e) => {
  console.error("switch-to-max-clicks failed:", e?.message || e)
  if (e?.errors) console.error(JSON.stringify(e.errors, null, 2))
  process.exit(1)
})
