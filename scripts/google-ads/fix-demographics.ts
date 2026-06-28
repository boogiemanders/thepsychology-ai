// Exclude the 18-24 and 65+ age ranges on every ad group in the campaign (= "uncheck
// 18-24 and 65+" in the UI). These are added as negative age_range criteria at the ad
// group level. Idempotent: skips any ad group that already excludes a given range.
//
// SAFE BY DEFAULT: validate_only unless --apply.
// Usage:
//   bun run gads:fix-demographics              # dry run
//   bun run gads:fix-demographics -- --apply   # apply (live)

import { enums } from "google-ads-api"
import { getCustomer } from "./client"

const APPLY = process.argv.includes("--apply")
const CAMPAIGN_NAME = process.env.GADS_CAMPAIGN_NAME || "EPPP Prep - Search - US+CA"

const EXCLUDE = [
  { name: "18-24", type: enums.AgeRangeType.AGE_RANGE_18_24 },
  { name: "65+", type: enums.AgeRangeType.AGE_RANGE_65_UP },
]

async function main() {
  const customer = getCustomer()

  // All ad groups in the campaign.
  const ags = await customer.query(`
    SELECT ad_group.resource_name, ad_group.name
    FROM ad_group
    WHERE campaign.name = '${CAMPAIGN_NAME.replace(/'/g, "\\'")}'
      AND ad_group.status != 'REMOVED'
    ORDER BY ad_group.name
  `)
  if (ags.length === 0) {
    console.error(`No ad groups found in campaign "${CAMPAIGN_NAME}".`)
    process.exit(1)
  }

  // Existing excluded age ranges, by ad group resource name.
  const existing = await customer.query(`
    SELECT ad_group.resource_name, ad_group_criterion.age_range.type, ad_group_criterion.negative
    FROM ad_group_criterion
    WHERE campaign.name = '${CAMPAIGN_NAME.replace(/'/g, "\\'")}'
      AND ad_group_criterion.type = 'AGE_RANGE' AND ad_group_criterion.negative = true
  `)
  const excludedByAg = new Map<string, Set<number>>()
  for (const r of existing) {
    const rn = r.ad_group?.resource_name as string
    if (!excludedByAg.has(rn)) excludedByAg.set(rn, new Set())
    excludedByAg.get(rn)!.add(r.ad_group_criterion?.age_range?.type as number)
  }

  const operations: any[] = []
  for (const a of ags) {
    const rn = a.ad_group?.resource_name as string
    const have = excludedByAg.get(rn) ?? new Set<number>()
    const missing = EXCLUDE.filter((e) => !have.has(e.type))
    console.log(
      `${a.ad_group?.name}: already excludes [${EXCLUDE.filter((e) => have.has(e.type)).map((e) => e.name).join(", ") || "none"}], ` +
        `adding [${missing.map((e) => e.name).join(", ") || "none"}]`
    )
    for (const e of missing) {
      operations.push({
        entity: "ad_group_criterion",
        operation: "create",
        resource: { ad_group: rn, negative: true, age_range: { type: e.type } },
      })
    }
  }

  console.log(`\nTotal exclusions to create: ${operations.length}\n`)
  if (operations.length === 0) {
    console.log("Nothing to do - every ad group already excludes 18-24 and 65+.")
    return
  }

  await customer.mutateResources(operations, { validate_only: !APPLY })

  if (!APPLY) {
    console.log("DRY RUN ok: Google validated the exclusions, nothing was created.")
    console.log("Re-run with -- --apply to apply (goes live).")
  } else {
    console.log(`APPLIED: created ${operations.length} age-range exclusion(s).`)
  }
}

main().catch((e) => {
  console.error("fix-demographics failed:", e?.message || e)
  if (e?.errors) console.error(JSON.stringify(e.errors, null, 2))
  process.exit(1)
})
