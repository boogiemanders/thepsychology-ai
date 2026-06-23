// AG5 - Practice Questions is missing its keywords. This adds the checklist phrase
// keywords (idempotent: skips any that already exist). AG5 is the ONLY group allowed
// to bid on "free", so it gets NO "free" negative. Existing criteria are left untouched.
//
// Spec: content/company/google-ads-eppp-launch-checklist-2026-06-22.md (AG5 section).
//
// SAFE BY DEFAULT: validate_only unless --apply.
// Usage:
//   bun run gads:add-ag5              # dry run: prints current state, validates, changes nothing
//   bun run gads:add-ag5 -- --apply   # add the phrase keywords (live)

import { enums } from "google-ads-api"
import { getCustomer } from "./client"

const APPLY = process.argv.includes("--apply")
const AG5_NAME = "AG5 - Practice Questions"

const TARGET_PHRASE = [
  "eppp practice questions",
  "eppp practice test",
  "eppp practice exam",
  "free eppp practice questions",
  "eppp question bank",
  "eppp sample questions",
  "eppp quiz",
  "adaptive eppp practice",
  "best eppp question bank",
]

const MT = (n: number | null | undefined) =>
  ({ 2: "exact", 3: "phrase", 4: "broad" } as Record<number, string>)[n ?? 0] || String(n)

async function main() {
  const customer = getCustomer()

  const [ag] = await customer.query(`
    SELECT ad_group.resource_name, ad_group.name
    FROM ad_group WHERE ad_group.name = '${AG5_NAME.replace(/'/g, "\\'")}' LIMIT 1
  `)
  if (!ag?.ad_group?.resource_name) {
    console.error(`Ad group not found: "${AG5_NAME}"`)
    process.exit(1)
  }
  const adGroupRN = ag.ad_group.resource_name

  const current = await customer.query(`
    SELECT ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type,
           ad_group_criterion.negative
    FROM ad_group_criterion
    WHERE ad_group.name = '${AG5_NAME.replace(/'/g, "\\'")}' AND ad_group_criterion.type = 'KEYWORD'
  `)
  const pos = current.filter((c) => !c.ad_group_criterion?.negative)
  const neg = current.filter((c) => c.ad_group_criterion?.negative)
  console.log(`AG5 current positive keywords (${pos.length}): ${pos.map((c) => `"${c.ad_group_criterion?.keyword?.text}"[${MT(c.ad_group_criterion?.keyword?.match_type as number)}]`).join(", ") || "(none)"}`)
  console.log(`AG5 current negatives (${neg.length}): ${neg.map((c) => c.ad_group_criterion?.keyword?.text).join(", ") || "(none)"}`)

  // Flag (do not modify) whether AG5 has a servable ad - an ad group with no ad won't run.
  const ads = await customer.query(`
    SELECT ad_group_ad.ad.id, ad_group_ad.status
    FROM ad_group_ad WHERE ad_group.name = '${AG5_NAME.replace(/'/g, "\\'")}'
  `)
  console.log(`AG5 ads (${ads.length}): ${ads.map((a) => `${a.ad_group_ad?.ad?.id}[status ${a.ad_group_ad?.status}]`).join(", ") || "(NONE - ad group cannot serve without an ad)"}`)

  const existingPhrase = new Set(
    pos.filter((c) => c.ad_group_criterion?.keyword?.match_type === enums.KeywordMatchType.PHRASE)
      .map((c) => c.ad_group_criterion?.keyword?.text)
  )
  const toCreate = TARGET_PHRASE.filter((t) => !existingPhrase.has(t))

  console.log(`\nPlan: create ${toCreate.length} phrase keyword(s): ${toCreate.map((t) => `"${t}"`).join(", ") || "(none)"}\n`)
  if (toCreate.length === 0) {
    console.log("Nothing to do - AG5 already has all target phrase keywords.")
    return
  }

  const operations = toCreate.map((text) => ({
    entity: "ad_group_criterion",
    operation: "create",
    resource: {
      ad_group: adGroupRN,
      status: enums.AdGroupCriterionStatus.ENABLED,
      keyword: { text, match_type: enums.KeywordMatchType.PHRASE },
    },
  }))

  await customer.mutateResources(operations, { validate_only: !APPLY })

  if (!APPLY) {
    console.log("DRY RUN ok: Google validated the keywords, nothing was created.")
    console.log("Re-run with -- --apply to add them (goes live).")
  } else {
    console.log(`APPLIED: added ${toCreate.length} phrase keyword(s) to AG5.`)
  }
}

main().catch((e) => {
  console.error("add-ag5-keywords failed:", e?.message || e)
  if (e?.errors) console.error(JSON.stringify(e.errors, null, 2))
  process.exit(1)
})
