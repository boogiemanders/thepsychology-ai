import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getReferralSources() {
  const { data, error } = await supabase
    .from('users')
    .select('referral_source, utm_source, utm_medium, utm_campaign')

  if (error) {
    console.error('Error:', error.message)
    return
  }

  // Count referral sources
  const refCounts: Record<string, number> = {}
  const utmSourceCounts: Record<string, number> = {}
  const utmMediumCounts: Record<string, number> = {}
  const utmCampaignCounts: Record<string, number> = {}

  for (const user of data) {
    const ref = user.referral_source || 'not_set'
    refCounts[ref] = (refCounts[ref] || 0) + 1

    if (user.utm_source) {
      utmSourceCounts[user.utm_source] = (utmSourceCounts[user.utm_source] || 0) + 1
    }
    if (user.utm_medium) {
      utmMediumCounts[user.utm_medium] = (utmMediumCounts[user.utm_medium] || 0) + 1
    }
    if (user.utm_campaign) {
      utmCampaignCounts[user.utm_campaign] = (utmCampaignCounts[user.utm_campaign] || 0) + 1
    }
  }

  console.log('=== Referral Sources ===')
  const sortedRefs = Object.entries(refCounts).sort((a, b) => b[1] - a[1])
  for (const [source, count] of sortedRefs) {
    console.log(`${source}: ${count}`)
  }

  if (Object.keys(utmSourceCounts).length > 0) {
    console.log('')
    console.log('=== UTM Sources ===')
    const sortedUtm = Object.entries(utmSourceCounts).sort((a, b) => b[1] - a[1])
    for (const [source, count] of sortedUtm) {
      console.log(`${source}: ${count}`)
    }
  }

  if (Object.keys(utmMediumCounts).length > 0) {
    console.log('')
    console.log('=== UTM Medium ===')
    const sortedMedium = Object.entries(utmMediumCounts).sort((a, b) => b[1] - a[1])
    for (const [medium, count] of sortedMedium) {
      console.log(`${medium}: ${count}`)
    }
  }

  if (Object.keys(utmCampaignCounts).length > 0) {
    console.log('')
    console.log('=== UTM Campaigns ===')
    const sortedCampaign = Object.entries(utmCampaignCounts).sort((a, b) => b[1] - a[1])
    for (const [campaign, count] of sortedCampaign) {
      console.log(`${campaign}: ${count}`)
    }
  }
}

getReferralSources()
