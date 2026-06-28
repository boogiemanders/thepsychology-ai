// Fix AG1 - Comparison / Best: its positive keywords were entered as BROAD match.
// Google Ads can't change a keyword's match type in place, so this removes AG1's
// existing positive keywords and re-creates the corrected list as PHRASE, in one
// atomic mutate. Negatives (e.g. "free") are left untouched.
//
// Corrected AG1 list from content/company/google-ads-eppp-launch-checklist-2026-06-22.md
// (also adds the 3 that were missing). Some terms may show "Low search volume" - that
// is normal for niche phrases; leave them in.
//
// SAFE BY DEFAULT: validate_only unless --apply.
// Usage:
//   bun run gads:fix-ag1              # dry run: prints current keywords, validates, changes nothing
//   bun run gads:fix-ag1 -- --apply   # remove broad + add phrase (live)

import { enums, ResourceNames } from "google-ads-api"
import { getCustomer } from "./client"

const APPLY = process.argv.includes("--apply")
const AG1_NAME = "AG1 - Comparison / Best"
const CUSTOMER_ID = (process.env.GOOGLE_ADS_CUSTOMER_ID || "").replace(/\D/g, "")

const TARGET_PHRASE = [
  "best eppp prep",
  "best eppp study materials",
  "best eppp prep course",
  "eppp prep comparison",
  "eppp study programs compared",
  "best eppp practice questions",
  "eppp prep reviews",
  "top eppp prep courses",
  "affordable eppp prep",
  "cheapest eppp prep",
  "best online eppp prep",
]

const MT = (n: number | null | undefined) =>
  ({ 2: "exact", 3: "phrase", 4: "broad" } as Record<number, string>)[n ?? 0] || String(n)

async function main() {
  if (!CUSTOMER_ID) {
    console.error("GOOGLE_ADS_CUSTOMER_ID is not set (see README.md)")
    process.exit(1)
  }
  const customer = getCustomer()

  // Resolve AG1.
  const [ag] = await customer.query(`
    SELECT ad_group.id, ad_group.resource_name, ad_group.name
    FROM ad_group WHERE ad_group.name = '${AG1_NAME.replace(/'/g, "\\'")}' LIMIT 1
  `)
  if (!ag?.ad_group?.resource_name) {
    console.error(`Ad group not found: "${AG1_NAME}"`)
    process.exit(1)
  }
  const adGroupRN = ag.ad_group.resource_name

  // Current positive keywords (we leave negatives alone).
  const current = await customer.query(`
    SELECT ad_group_criterion.resource_name, ad_group_criterion.keyword.text,
           ad_group_criterion.keyword.match_type, ad_group_criterion.negative
    FROM ad_group_criterion
    WHERE ad_group.name = '${AG1_NAME.replace(/'/g, "\\'")}'
      AND ad_group_criterion.type = 'KEYWORD' AND ad_group_criterion.negative = false
  `)
  console.log(`Current AG1 positive keywords (${current.length}):`)
  for (const c of current) {
    console.log(`  "${c.ad_group_criterion?.keyword?.text}" [${MT(c.ad_group_criterion?.keyword?.match_type as number)}]`)
  }

  // Skip creating any target that already exists as PHRASE (idempotent re-runs).
  const existingPhrase = new Set(
    current
      .filter((c) => c.ad_group_criterion?.keyword?.match_type === enums.KeywordMatchType.PHRASE)
      .map((c) => c.ad_group_criterion?.keyword?.text)
  )
  const toCreate = TARGET_PHRASE.filter((t) => !existingPhrase.has(t))
  // Remove every current positive keyword that is not already a target phrase keyword.
  const toRemove = current.filter(
    (c) =>
      !(
        c.ad_group_criterion?.keyword?.match_type === enums.KeywordMatchType.PHRASE &&
        TARGET_PHRASE.includes(c.ad_group_criterion?.keyword?.text as string)
      )
  )

  const operations: any[] = [
    ...toRemove.map((c) => ({
      entity: "ad_group_criterion",
      operation: "remove",
      // google-ads-api reads the resource_name string off `resource` for removes
      resource: c.ad_group_criterion!.resource_name as string,
    })),
    ...toCreate.map((text) => ({
      entity: "ad_group_criterion",
      operation: "create",
      resource: {
        ad_group: adGroupRN,
        status: enums.AdGroupCriterionStatus.ENABLED,
        keyword: { text, match_type: enums.KeywordMatchType.PHRASE },
      },
    })),
  ]

  console.log(`\nPlan: remove ${toRemove.length} keyword(s), create ${toCreate.length} phrase keyword(s).`)
  console.log(`  remove: ${toRemove.map((c) => `"${c.ad_group_criterion?.keyword?.text}"[${MT(c.ad_group_criterion?.keyword?.match_type as number)}]`).join(", ") || "(none)"}`)
  console.log(`  create (phrase): ${toCreate.map((t) => `"${t}"`).join(", ") || "(none)"}\n`)

  if (operations.length === 0) {
    console.log("Nothing to do - AG1 already matches the target phrase list.")
    return
  }

  await customer.mutateResources(operations, { validate_only: !APPLY })

  if (!APPLY) {
    console.log("DRY RUN ok: Google validated the changes, nothing was modified.")
    console.log("Re-run with -- --apply to apply (goes live).")
  } else {
    console.log("APPLIED: AG1 keywords are now Phrase match.")
  }
}

main().catch((e) => {
  console.error("fix-ag1-phrase failed:", e?.message || e)
  if (e?.errors) console.error(JSON.stringify(e.errors, null, 2))
  process.exit(1)
})
