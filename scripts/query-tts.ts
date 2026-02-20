import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function query() {
  const twoDaysAgo = new Date()
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

  const { data, error } = await supabase
    .from('usage_events')
    .select('event_name, model, metadata, created_at')
    .eq('event_name', 'topic-teacher.audio')
    .gte('created_at', twoDaysAgo.toISOString())
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error:', error.message)
    return
  }

  if (!data || data.length === 0) {
    console.log('No TTS events in past 2 days.')
    return
  }

  const byDay: Record<string, { count: number; chars: number }> = {}
  for (const row of data) {
    const day = row.created_at.split('T')[0]
    if (!byDay[day]) byDay[day] = { count: 0, chars: 0 }
    byDay[day].count++
    byDay[day].chars += (row.metadata?.characters as number) || (row.metadata?.chars as number) || 0
  }

  console.log('=== TTS Usage (Past 2 Days) ===\n')
  console.log('Date       | Requests | Characters | Est. Cost')
  console.log('-'.repeat(55))

  let totalChars = 0
  let totalCount = 0
  for (const [day, stats] of Object.entries(byDay).sort()) {
    const cost = (stats.chars / 1000) * 0.015
    totalChars += stats.chars
    totalCount += stats.count
    console.log(
      day +
        ' | ' +
        String(stats.count).padStart(8) +
        ' | ' +
        String(stats.chars.toLocaleString()).padStart(10) +
        ' | $' +
        cost.toFixed(4)
    )
  }

  const totalCost = (totalChars / 1000) * 0.015
  console.log('-'.repeat(55))
  console.log(
    'TOTAL      | ' +
      String(totalCount).padStart(8) +
      ' | ' +
      String(totalChars.toLocaleString()).padStart(10) +
      ' | $' +
      totalCost.toFixed(4)
  )
}

query()
