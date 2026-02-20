import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
)

async function query() {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data, error } = await supabase
    .from('usage_events')
    .select('user_id, created_at')
    .eq('event_name', 'pre-generate-exam.diagnostic')
    .gte('created_at', sevenDaysAgo.toISOString())
    .order('created_at', { ascending: false })

  if (error) { console.error(error); return }

  const byUser: Record<string, { count: number, dates: string[] }> = {}
  for (const row of data || []) {
    const uid = row.user_id || 'unknown'
    if (!byUser[uid]) byUser[uid] = { count: 0, dates: [] }
    byUser[uid].count++
    byUser[uid].dates.push(row.created_at.split('T')[0])
  }

  for (const userId of Object.keys(byUser)) {
    if (userId === 'unknown') continue
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single()
    const info = byUser[userId]
    const uniqueDays = [...new Set(info.dates)].sort()
    console.log(
      (profile?.full_name || profile?.email || userId) +
      ': ' + info.count + ' diagnostic exams on ' + uniqueDays.join(', ')
    )
  }
}
query()
