// Create the three conquest ad groups (AG2 AATBS, AG3 PsychPrep, AG4 Other) in the
// live Search campaign via the Google Ads API: each ad group's keywords (phrase, plus
// exact for the brand term), its "free" + cross-brand negatives, and its responsive
// search ad (15 headlines, 4 descriptions, display paths EPPP-Prep / Free-Trial), all
// in one atomic mutate using temporary resource names.
//
// Spec source: content/company/google-ads-eppp-launch-checklist-2026-06-22.md (Sections 3-4).
//
// SAFE BY DEFAULT: with no flag it runs validate_only (Google checks the whole payload
// but creates nothing). Add --apply to actually create them (ENABLED, i.e. live, since
// the campaign is already running). Aborts if any of the three ad groups already exist.
//
// Auth: same .env.local vars as report.ts (see README.md).
// Usage:
//   bun run gads:create-ag234              # dry run: validate against Google, create nothing
//   bun run gads:create-ag234 -- --apply   # actually create AG2/AG3/AG4 (goes live)

import { enums, ResourceNames } from "google-ads-api"
import { getCustomer } from "./client"

const APPLY = process.argv.includes("--apply")
const CAMPAIGN_NAME = process.env.GADS_CAMPAIGN_NAME || "EPPP Prep - Search - US+CA"
const CUSTOMER_ID = (process.env.GOOGLE_ADS_CUSTOMER_ID || "").replace(/\D/g, "")
const BASE = "https://www.thepsychology.ai"

const PHRASE = enums.KeywordMatchType.PHRASE
const EXACT = enums.KeywordMatchType.EXACT
const BROAD = enums.KeywordMatchType.BROAD

type Group = {
  name: string
  finalUrl: string
  keywords: { text: string; match: number }[]
  negatives: string[] // added BROAD; matches how the founder would paste them in the UI
  headlines: string[]
  descriptions: string[]
  pins: Record<string, number> // headline/description text -> ServedAssetFieldType
}

const GROUPS: Group[] = [
  {
    name: "AG2 - Conquest AATBS",
    finalUrl: `${BASE}/blog/thepsychology-vs-aatbs`,
    keywords: [
      { text: "aatbs", match: PHRASE },
      { text: "aatbs", match: EXACT },
      { text: "aatbs review", match: PHRASE },
      { text: "aatbs alternative", match: PHRASE },
      { text: "aatbs cost", match: PHRASE },
    ],
    negatives: ["free", "psychprep", "prepjet", "taylor", "mometrix", "academic review"],
    headlines: [
      "Adaptive EPPP Exam Prep",
      "Adaptive, Not a Static Bank",
      "Lower-Cost EPPP Prep",
      "Free 7-Day Trial, No Card",
      "Lock In $40/mo in July",
      "$50/mo Starting August",
      "Adaptive EPPP Practice",
      "Full-Length Practice Exams",
      "Smarter EPPP Question Bank",
      "Prep That Adapts to You",
      "Try EPPP Prep Free 7 Days",
      "No Credit Card to Start",
      "Pass the EPPP for Less",
      "Targets Your Weak Domains",
      "Join in July for $40/mo",
    ],
    descriptions: [
      "Adaptive EPPP prep that targets your weak domains, not a static question bank.",
      "Start a free 7-day trial. No credit card. Then $40/mo in July, $50 from Aug 1.",
      "Full-length practice exams plus adaptive questions that adjust to your level.",
      "Lower-cost EPPP prep built to focus your study time where it counts most.",
    ],
    pins: {
      "Adaptive, Not a Static Bank": enums.ServedAssetFieldType.HEADLINE_1,
      "Adaptive EPPP prep that targets your weak domains, not a static question bank.":
        enums.ServedAssetFieldType.DESCRIPTION_1,
    },
  },
  {
    name: "AG3 - Conquest PsychPrep",
    finalUrl: `${BASE}/blog/thepsychology-vs-psychprep`,
    keywords: [
      { text: "psychprep", match: PHRASE },
      { text: "psychprep", match: EXACT },
      { text: "psychprep review", match: PHRASE },
      { text: "psychprep alternative", match: PHRASE },
    ],
    negatives: ["free", "aatbs", "prepjet", "taylor", "mometrix", "academic review"],
    headlines: [
      "Adaptive EPPP Prep",
      "EPPP Prep That Adapts",
      "Practice the Real EPPP",
      "Questions Like the Exam",
      "Adaptive, Not Static Bank",
      "Full-Length EPPP Exams",
      "Free 7-Day Trial",
      "No Credit Card Needed",
      "Lock In $40/mo in July",
      "$50/mo Starting August",
      "Join in July for $40/mo",
      "Lower-Cost EPPP Prep",
      "Targeted EPPP Question Bank",
      "Study Smarter for the EPPP",
      "Pass the EPPP With Less",
    ],
    descriptions: [
      "Adaptive practice that targets your weak spots with questions that match the real EPPP.",
      "Free 7-day trial, no credit card. Then $40/mo in July, $50/mo from Aug 1. Lock it in.",
      "Full-length practice exams plus a deep question bank built for the real EPPP.",
      "Smarter EPPP prep for less. Start your free 7-day trial today, no credit card required.",
    ],
    pins: {
      "Adaptive EPPP Prep": enums.ServedAssetFieldType.HEADLINE_1,
      "Adaptive practice that targets your weak spots with questions that match the real EPPP.":
        enums.ServedAssetFieldType.DESCRIPTION_1,
    },
  },
  {
    name: "AG4 - Conquest Other",
    finalUrl: `${BASE}/blog/thepsychology-vs-prepjet`,
    keywords: [
      { text: "prepjet eppp", match: PHRASE },
      { text: "taylor study method", match: PHRASE },
      { text: "taylor study method review", match: PHRASE },
      { text: "taylor study method cost", match: PHRASE },
      { text: "academic review eppp", match: PHRASE },
      { text: "mometrix eppp", match: PHRASE },
    ],
    negatives: ["free", "aatbs", "psychprep"],
    headlines: [
      "Adaptive EPPP Exam Prep",
      "EPPP Prep That Adapts",
      "Smarter EPPP Practice",
      "Adaptive, Not Static Bank",
      "Full-Length EPPP Exams",
      "EPPP Question Bank",
      "Practice That Knows You",
      "Try EPPP Prep Free 7 Days",
      "Free 7-Day Trial, No Card",
      "Lock In $40/mo in July",
      "$50/mo Starting August",
      "Join in July for $40/mo",
      "Transparent Low Price",
      "Pass the EPPP With Less",
      "Targeted EPPP Practice",
    ],
    descriptions: [
      "Adaptive EPPP practice that learns your weak areas. Free 7-day trial, no credit card.",
      "Full-length practice exams and a deep question bank. Start your free trial today.",
      "Honest pricing: $40/mo in July, $50/mo from Aug 1. Lock in the lower rate now.",
      "Continuous adaptive practice that targets your gaps. Free trial, no credit card needed.",
    ],
    pins: {
      "Adaptive EPPP Exam Prep": enums.ServedAssetFieldType.HEADLINE_1,
      "Adaptive, Not Static Bank": enums.ServedAssetFieldType.HEADLINE_2,
      "Adaptive EPPP practice that learns your weak areas. Free 7-day trial, no credit card.":
        enums.ServedAssetFieldType.DESCRIPTION_1,
    },
  },
]

async function main() {
  if (!CUSTOMER_ID) {
    console.error("GOOGLE_ADS_CUSTOMER_ID is not set (see README.md)")
    process.exit(1)
  }
  const customer = getCustomer()

  // Find the live campaign by name.
  const [campaign] = await customer.query(`
    SELECT campaign.id, campaign.resource_name, campaign.name
    FROM campaign
    WHERE campaign.name = '${CAMPAIGN_NAME.replace(/'/g, "\\'")}'
    LIMIT 1
  `)
  if (!campaign?.campaign?.resource_name) {
    console.error(`Campaign not found: "${CAMPAIGN_NAME}". Set GADS_CAMPAIGN_NAME to override.`)
    process.exit(1)
  }
  const campaignRN = campaign.campaign.resource_name

  // Guard: refuse to create duplicates if any of the three already exist.
  const existing = await customer.query(`
    SELECT ad_group.name FROM ad_group
    WHERE ad_group.name IN (${GROUPS.map((g) => `'${g.name}'`).join(", ")})
  `)
  if (existing.length > 0) {
    console.error(
      "Aborting: these ad groups already exist:\n  " +
        existing.map((r) => r.ad_group?.name).join("\n  ")
    )
    process.exit(1)
  }

  const operations: any[] = []
  GROUPS.forEach((g, gi) => {
    const adGroupRN = ResourceNames.adGroup(CUSTOMER_ID, String(-(gi + 1)))
    operations.push({
      entity: "ad_group",
      operation: "create",
      resource: {
        resource_name: adGroupRN,
        name: g.name,
        campaign: campaignRN,
        type: enums.AdGroupType.SEARCH_STANDARD,
        status: enums.AdGroupStatus.ENABLED,
      },
    })
    for (const kw of g.keywords) {
      operations.push({
        entity: "ad_group_criterion",
        operation: "create",
        resource: {
          ad_group: adGroupRN,
          status: enums.AdGroupCriterionStatus.ENABLED,
          keyword: { text: kw.text, match_type: kw.match },
        },
      })
    }
    for (const neg of g.negatives) {
      operations.push({
        entity: "ad_group_criterion",
        operation: "create",
        resource: {
          ad_group: adGroupRN,
          negative: true,
          keyword: { text: neg, match_type: BROAD },
        },
      })
    }
    operations.push({
      entity: "ad_group_ad",
      operation: "create",
      resource: {
        ad_group: adGroupRN,
        status: enums.AdGroupAdStatus.ENABLED,
        ad: {
          final_urls: [g.finalUrl],
          responsive_search_ad: {
            path1: "EPPP-Prep",
            path2: "Free-Trial",
            headlines: g.headlines.map((text) =>
              g.pins[text] ? { text, pinned_field: g.pins[text] } : { text }
            ),
            descriptions: g.descriptions.map((text) =>
              g.pins[text] ? { text, pinned_field: g.pins[text] } : { text }
            ),
          },
        },
      },
    })
  })

  for (const g of GROUPS) {
    console.log(
      `${g.name} -> ${g.finalUrl}\n` +
        `  keywords: ${g.keywords.map((k) => `${k.text}[${k.match === EXACT ? "exact" : "phrase"}]`).join(", ")}\n` +
        `  negatives: ${g.negatives.join(", ")}\n` +
        `  RSA: ${g.headlines.length} headlines, ${g.descriptions.length} descriptions`
    )
  }
  console.log(`\nCampaign: ${CAMPAIGN_NAME}  (paths EPPP-Prep / Free-Trial)\n`)

  const result = await customer.mutateResources(operations, { validate_only: !APPLY })

  if (!APPLY) {
    console.log("DRY RUN ok: Google validated the payload, nothing was created.")
    console.log("Re-run with -- --apply to create them (they will go live).")
  } else {
    console.log("CREATED. New resources:")
    for (const r of result.mutate_operation_responses ?? []) {
      const v = Object.values(r)[0] as any
      if (v?.resource_name) console.log("  " + v.resource_name)
    }
  }
}

main().catch((e) => {
  console.error("create-ag234 failed:", e?.message || e)
  if (e?.errors) console.error(JSON.stringify(e.errors, null, 2))
  process.exit(1)
})
