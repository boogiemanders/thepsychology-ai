// Create AG6 - Study Materials in the live Search campaign via the Google Ads API:
// the ad group, 3 phrase keywords, a "free" negative, and the responsive search ad
// (15 headlines, 4 descriptions, display paths EPPP-Study / Free-Trial), all in one
// atomic mutate using temporary resource names.
//
// SAFE BY DEFAULT: with no flag it runs validate_only (Google checks the whole payload
// but creates nothing). Add --apply to actually create it (the ad group + ad launch
// ENABLED, i.e. live, since the campaign is already running).
//
// Auth: same .env.local vars as report.ts (see README.md).
// Usage:
//   bun run gads:create-ag6              # dry run: validate against Google, create nothing
//   bun run gads:create-ag6 -- --apply   # actually create AG6 (goes live)

import { enums, ResourceNames } from "google-ads-api"
import { getCustomer } from "./client"

const APPLY = process.argv.includes("--apply")
const CAMPAIGN_NAME = process.env.GADS_CAMPAIGN_NAME || "EPPP Prep - Search - US+CA"
const CUSTOMER_ID = (process.env.GOOGLE_ADS_CUSTOMER_ID || "").replace(/\D/g, "")
const FINAL_URL =
  "https://www.thepsychology.ai/blog/eppp-prep-programs-compared-2026"

const KEYWORDS = ["eppp study materials", "eppp exam study guide", "eppp exam prep"]

const HEADLINES = [
  "EPPP Study Materials",
  "All-in-One EPPP Study",
  "EPPP Study Guide Online",
  "Adaptive EPPP Study Tool",
  "Study Smarter for the EPPP",
  "Full-Length EPPP Exams",
  "Big EPPP Question Bank",
  "Practice That Adapts to You",
  "Try EPPP Prep, 7-Day Trial",
  "7-Day Trial, No Card",
  "No Credit Card to Start",
  "Lock In $40/mo in July",
  "Join in July for $40/mo",
  "$50/mo Starting August",
  "EPPP Prep in One Place",
]

const DESCRIPTIONS = [
  "EPPP study materials that adapt to you. Full-length exams and a deep question bank.",
  "Start a 7-day free trial, no credit card. See if adaptive EPPP study fits you.",
  "Lock in $40/mo in July before the $50/mo rise on Aug 1, 2026. Cancel anytime.",
  "One place for EPPP study guides, practice exams, and adaptive questions.",
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

  // Temp resource name so the keywords + ad attach to the not-yet-created ad group.
  const adGroupRN = ResourceNames.adGroup(CUSTOMER_ID, "-1")

  const operations: any[] = [
    {
      entity: "ad_group",
      operation: "create",
      resource: {
        resource_name: adGroupRN,
        name: "AG6 - Study Materials",
        campaign: campaignRN,
        type: enums.AdGroupType.SEARCH_STANDARD,
        status: enums.AdGroupStatus.ENABLED,
      },
    },
    ...KEYWORDS.map((text) => ({
      entity: "ad_group_criterion",
      operation: "create",
      resource: {
        ad_group: adGroupRN,
        status: enums.AdGroupCriterionStatus.ENABLED,
        keyword: { text, match_type: enums.KeywordMatchType.PHRASE },
      },
    })),
    {
      // per-ad-group negative: only AG5 may bid on "free"
      entity: "ad_group_criterion",
      operation: "create",
      resource: {
        ad_group: adGroupRN,
        negative: true,
        keyword: { text: "free", match_type: enums.KeywordMatchType.BROAD },
      },
    },
    {
      entity: "ad_group_ad",
      operation: "create",
      resource: {
        ad_group: adGroupRN,
        status: enums.AdGroupAdStatus.ENABLED,
        ad: {
          final_urls: [FINAL_URL],
          responsive_search_ad: {
            path1: "EPPP-Study",
            path2: "Free-Trial",
            headlines: HEADLINES.map((text, i) =>
              i === 0
                ? { text, pinned_field: enums.ServedAssetFieldType.HEADLINE_1 }
                : { text }
            ),
            descriptions: DESCRIPTIONS.map((text, i) =>
              i === 0
                ? { text, pinned_field: enums.ServedAssetFieldType.DESCRIPTION_1 }
                : { text }
            ),
          },
        },
      },
    },
  ]

  console.log(
    `Campaign: ${CAMPAIGN_NAME}\n` +
      `Ad group: AG6 - Study Materials (ENABLED)\n` +
      `Keywords (phrase): ${KEYWORDS.join(", ")}\n` +
      `Negative: free\n` +
      `RSA: ${HEADLINES.length} headlines, ${DESCRIPTIONS.length} descriptions, paths EPPP-Study/Free-Trial\n` +
      `Final URL: ${FINAL_URL}\n`
  )

  const result = await customer.mutateResources(operations, {
    validate_only: !APPLY,
  })

  if (!APPLY) {
    console.log("DRY RUN ok: Google validated the payload, nothing was created.")
    console.log("Re-run with -- --apply to create it (it will go live).")
  } else {
    console.log("CREATED. New resources:")
    for (const r of result.mutate_operation_responses ?? []) {
      const v = Object.values(r)[0] as any
      if (v?.resource_name) console.log("  " + v.resource_name)
    }
  }
}

main().catch((e) => {
  console.error("create-ag6 failed:", e?.message || e)
  if (e?.errors) console.error(JSON.stringify(e.errors, null, 2))
  process.exit(1)
})
