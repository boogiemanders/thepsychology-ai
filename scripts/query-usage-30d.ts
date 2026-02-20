import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
)

function calcCost(
  model: string | null,
  inputTokens: number,
  outputTokens: number,
  metadata?: Record<string, unknown> | null
): number {
  if (model === 'gpt-4o') return (inputTokens / 1e6) * 2.50 + (outputTokens / 1e6) * 10.00
  if (model === 'gpt-4o-mini') return (inputTokens / 1e6) * 0.15 + (outputTokens / 1e6) * 0.60
  if (model === 'gpt-4o-mini-tts' || model === 'tts-1') {
    const chars = (metadata?.characters as number) || (metadata?.chars as number) || 0
    return (chars / 1000) * 0.015
  }
  if (model === 'whisper-1') {
    const audioSeconds = (metadata?.audioSeconds as number) || 0
    return (audioSeconds / 60) * 0.006
  }
  if (model === 'text-embedding-3-small') return (inputTokens / 1e6) * 0.02
  return 0
}

async function query() {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Paginate to get all rows (Supabase default limit is 1000)
  let allData: any[] = []
  let page = 0
  const pageSize = 1000
  while (true) {
    const { data, error } = await supabase
      .from('usage_events')
      .select('event_name, model, input_tokens, output_tokens, metadata, created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true })
      .range(page * pageSize, (page + 1) * pageSize - 1)
    if (error) { console.error(error); return }
    if (!data || data.length === 0) break
    allData = allData.concat(data)
    if (data.length < pageSize) break
    page++
  }
  const data = allData
  if (data.length === 0) { console.log('No data'); return }

  const byWeek: Record<string, { events: number; cost: number; whisperCalls: number }> = {}
  for (const row of data) {
    const d = new Date(row.created_at)
    const weekStart = new Date(d)
    weekStart.setDate(d.getDate() - d.getDay())
    const key = weekStart.toISOString().split('T')[0]
    if (!byWeek[key]) byWeek[key] = { events: 0, cost: 0, whisperCalls: 0 }
    byWeek[key].events++
    byWeek[key].cost += calcCost(row.model, row.input_tokens || 0, row.output_tokens || 0, row.metadata)
    if (row.model === 'whisper-1') byWeek[key].whisperCalls++
  }

  console.log('=== Last 30 Days by Week ===')
  console.log('Week of    | Events | Tracked Cost | Whisper Calls')
  console.log('-'.repeat(65))
  let total = 0
  let totalWhisper = 0
  for (const [week, stats] of Object.entries(byWeek).sort()) {
    total += stats.cost
    totalWhisper += stats.whisperCalls
    console.log(
      week + '  | ' +
      String(stats.events).padStart(6) + ' | $' +
      stats.cost.toFixed(4).padStart(8) + '     | ' +
      stats.whisperCalls + ' whisper calls'
    )
  }
  console.log('-'.repeat(65))
  console.log(
    'TOTAL:       ' + String(data.length).padStart(6) + ' | $' +
    total.toFixed(4).padStart(8) + '     | ' +
    totalWhisper + ' whisper calls'
  )
  console.log()
  console.log('Note: Whisper costs NOT tracked (audioSeconds not logged).')
  console.log('Each whisper call processes ~1-3 min audio at $0.006/min.')
  console.log('Estimated whisper cost: $' + (totalWhisper * 1.5 * 0.006).toFixed(2) + ' (assuming avg 1.5 min/call)')
  console.log('Estimated TOTAL with whisper: $' + (total + totalWhisper * 1.5 * 0.006).toFixed(2))
}

query()
