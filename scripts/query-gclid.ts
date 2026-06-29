import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
// Run from a checkout whose .env.local has NEXT_PUBLIC_SUPABASE_URL +
// SUPABASE_SERVICE_ROLE_KEY (the gads worktree .env.local only has GOOGLE_ADS_*).
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function queryGclid() {
  const { data, error } = await supabase
    .from('users')
    .select('email, gclid, utm_source, utm_medium, utm_campaign, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    if (error.message.includes('gclid')) {
      console.error('gclid column not present yet. Apply supabase/migrations/20260629_add_gclid_attribution.sql first.')
      return
    }
    console.error('Error:', error.message)
    return
  }

  const withGclid = data.filter((u) => u.gclid)
  console.log(`=== gclid capture ===`)
  console.log(`Total users: ${data.length}`)
  console.log(`With gclid (paid Google Ads clicks): ${withGclid.length}`)

  if (withGclid.length > 0) {
    console.log('')
    console.log('=== Most recent gclid signups ===')
    for (const u of withGclid.slice(0, 20)) {
      const utm = [u.utm_source, u.utm_medium, u.utm_campaign].filter(Boolean).join('/') || 'no-utm'
      console.log(`${u.created_at}  ${u.email}  gclid=${u.gclid}  (${utm})`)
    }
  }
}

queryGclid()
