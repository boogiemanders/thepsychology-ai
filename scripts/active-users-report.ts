import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getActiveUsers() {
  const twoWeeksAgo = new Date()
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

  // Get users with activity in the past 2 weeks
  const { data: users, error } = await supabase
    .from('users')
    .select('email, last_activity_at, subscription_tier')
    .gte('last_activity_at', twoWeeksAgo.toISOString())
    .neq('email', 'chanders0@yahoo.com')
    .order('last_activity_at', { ascending: false })

  if (error) {
    console.error('Error:', error)
    return
  }

  const count = users ? users.length : 0
  console.log(`\n📊 Active users in past 2 weeks (excluding chanders0@yahoo.com): ${count}\n`)

  if (users && users.length > 0) {
    console.log('Email | Last Active | Tier')
    console.log('-'.repeat(70))
    for (const u of users) {
      const lastActive = u.last_activity_at
        ? new Date(u.last_activity_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        : 'Never'
      console.log(`${u.email} | ${lastActive} | ${u.subscription_tier}`)
    }
  }
}

getActiveUsers()
