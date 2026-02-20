import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function signupRate() {
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  if (error) {
    console.error('Error:', error.message)
    return
  }

  const users = data.users
  const sorted = users.sort((a, b) =>
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  // Group by week
  const weeklySignups = new Map<string, number>()
  const monthlySignups = new Map<string, number>()

  for (const user of sorted) {
    const date = new Date(user.created_at)

    // Weekly (start of week)
    const weekStart = new Date(date)
    weekStart.setDate(date.getDate() - date.getDay())
    const weekKey = weekStart.toISOString().split('T')[0]
    weeklySignups.set(weekKey, (weeklySignups.get(weekKey) || 0) + 1)

    // Monthly
    const monthKey = date.toISOString().slice(0, 7) // YYYY-MM
    monthlySignups.set(monthKey, (monthlySignups.get(monthKey) || 0) + 1)
  }

  // Calculate stats
  const firstSignup = new Date(sorted[0].created_at)
  const lastSignup = new Date(sorted[sorted.length - 1].created_at)
  const daysDiff = (lastSignup.getTime() - firstSignup.getTime()) / (1000 * 60 * 60 * 24)
  const weeksDiff = daysDiff / 7

  console.log('=== Overall Stats ===')
  console.log('Total users:', users.length)
  console.log('First signup:', firstSignup.toLocaleDateString())
  console.log('Days active:', Math.round(daysDiff))
  console.log('Avg signups/day:', (users.length / daysDiff).toFixed(2))
  console.log('Avg signups/week:', (users.length / weeksDiff).toFixed(1))

  // Last 8 weeks
  console.log('')
  console.log('=== Last 8 Weeks ===')
  const weeks = Array.from(weeklySignups.entries()).slice(-8)
  for (const [week, count] of weeks) {
    const weekDate = new Date(week)
    const label = weekDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    console.log(`Week of ${label}: ${count} signups`)
  }

  // Monthly breakdown
  console.log('')
  console.log('=== By Month ===')
  for (const [month, count] of monthlySignups.entries()) {
    const [year, m] = month.split('-')
    const monthName = new Date(parseInt(year), parseInt(m) - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    console.log(`${monthName}: ${count} signups`)
  }
}

signupRate()
