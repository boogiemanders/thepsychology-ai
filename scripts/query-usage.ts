import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function queryUsage() {
  // Get last 7 days usage
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data, error } = await supabase
    .from('usage_events')
    .select('event_name, model, input_tokens, output_tokens, metadata, created_at')
    .gte('created_at', sevenDaysAgo.toISOString())
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error:', error.message)
    return
  }

  if (!data || data.length === 0) {
    console.log('No usage events found for today.')
    return
  }

  // Helper to calc cost - includes TTS (per character) and Whisper (per audio minute)
  function calcCost(
    model: string | null,
    inputTokens: number,
    outputTokens: number,
    metadata?: Record<string, unknown> | null
  ): number {
    // GPT-4o: $2.50/1M input, $10/1M output
    if (model === 'gpt-4o') {
      return (inputTokens / 1000000) * 2.50 + (outputTokens / 1000000) * 10.00
    }
    // GPT-4o-mini: $0.15/1M input, $0.60/1M output
    if (model === 'gpt-4o-mini') {
      return (inputTokens / 1000000) * 0.15 + (outputTokens / 1000000) * 0.60
    }
    // TTS: $0.015 per 1000 characters (gpt-4o-mini-tts)
    if (model === 'gpt-4o-mini-tts' || model === 'tts-1') {
      const chars = (metadata?.characters as number) || (metadata?.chars as number) || 0
      return (chars / 1000) * 0.015
    }
    // Whisper: $0.006 per minute
    if (model === 'whisper-1') {
      const audioSeconds = (metadata?.audioSeconds as number) || 0
      const audioMinutes = audioSeconds / 60
      return audioMinutes * 0.006
    }
    // Embeddings: $0.02/1M tokens
    if (model === 'text-embedding-3-small') {
      return (inputTokens / 1000000) * 0.02
    }
    return 0
  }

  // Group by day
  const byDay: Record<string, { events: number; input: number; output: number; cost: number; characters: number; audioSeconds: number }> = {}
  for (const row of data) {
    const day = row.created_at.split('T')[0]
    if (!byDay[day]) byDay[day] = { events: 0, input: 0, output: 0, cost: 0, characters: 0, audioSeconds: 0 }
    byDay[day].events++
    byDay[day].input += row.input_tokens || 0
    byDay[day].output += row.output_tokens || 0
    byDay[day].characters += (row.metadata?.characters as number) || (row.metadata?.chars as number) || 0
    byDay[day].audioSeconds += (row.metadata?.audioSeconds as number) || 0
    byDay[day].cost += calcCost(row.model, row.input_tokens || 0, row.output_tokens || 0, row.metadata)
  }

  console.log('=== Last 7 Days Usage ===\n')
  console.log('Date       | Events | Input Tkns | Output Tkns | TTS Chars  | Whisper Sec | Est. Cost')
  console.log('-'.repeat(100))

  let totalCost = 0
  let totalChars = 0
  let totalAudioSec = 0
  for (const [day, stats] of Object.entries(byDay).sort()) {
    totalCost += stats.cost
    totalChars += stats.characters
    totalAudioSec += stats.audioSeconds
    console.log(
      day + ' | ' +
      String(stats.events).padStart(6) + ' | ' +
      String(stats.input).padStart(10) + ' | ' +
      String(stats.output).padStart(11) + ' | ' +
      String(stats.characters).padStart(10) + ' | ' +
      String(stats.audioSeconds).padStart(11) + ' | $' +
      stats.cost.toFixed(4)
    )
  }
  console.log('-'.repeat(100))
  console.log(
    'TOTALS     | ' +
    String(data.length).padStart(6) + ' | ' +
    '          ' + ' | ' +
    '           ' + ' | ' +
    String(totalChars).padStart(10) + ' | ' +
    String(totalAudioSec).padStart(11) + ' | $' +
    totalCost.toFixed(4)
  )
  console.log('\n7-day total estimated cost: $' + totalCost.toFixed(4))

  // Top event types
  console.log('\n=== Top Event Types (7 days) ===')
  const byEvent: Record<string, number> = {}
  for (const row of data) {
    if (!byEvent[row.event_name]) byEvent[row.event_name] = 0
    byEvent[row.event_name]++
  }
  const sortedEvents = Object.entries(byEvent).sort((a, b) => b[1] - a[1]).slice(0, 10)
  for (const [name, count] of sortedEvents) {
    console.log(String(count).padStart(6) + ' x ' + name)
  }

  // Aggregate by event_name and model for detailed breakdown
  const aggregated: Record<string, {
    event_name: string
    model: string | null
    count: number
    input_tokens: number
    output_tokens: number
    characters: number
    audioSeconds: number
  }> = {}
  for (const row of data) {
    const key = `${row.event_name}|${row.model || 'unknown'}`
    if (!aggregated[key]) {
      aggregated[key] = {
        event_name: row.event_name,
        model: row.model,
        count: 0,
        input_tokens: 0,
        output_tokens: 0,
        characters: 0,
        audioSeconds: 0,
      }
    }
    aggregated[key].count++
    aggregated[key].input_tokens += row.input_tokens || 0
    aggregated[key].output_tokens += row.output_tokens || 0
    aggregated[key].characters += (row.metadata?.characters as number) || (row.metadata?.chars as number) || 0
    aggregated[key].audioSeconds += (row.metadata?.audioSeconds as number) || 0
  }

  console.log('\n=== Detailed Breakdown by Event + Model ===\n')
  console.log('Event Name'.padEnd(35) + '| Model'.padEnd(20) + '| Count | Tokens/Chars/Sec | Cost')
  console.log('-'.repeat(100))

  const sorted = Object.values(aggregated).sort((a, b) => b.count - a.count)
  for (const row of sorted) {
    // Build a metadata object for cost calculation
    const metaForCost = { characters: row.characters, audioSeconds: row.audioSeconds }
    const cost = calcCost(row.model, row.input_tokens, row.output_tokens, metaForCost)

    // Show relevant metric based on model type
    let metric = ''
    if (row.model === 'gpt-4o-mini-tts' || row.model === 'tts-1') {
      metric = `${row.characters.toLocaleString()} chars`
    } else if (row.model === 'whisper-1') {
      metric = `${row.audioSeconds}s audio`
    } else if (row.input_tokens || row.output_tokens) {
      metric = `${row.input_tokens}/${row.output_tokens} tkns`
    }

    console.log(
      row.event_name.padEnd(35) +
      '| ' + (row.model || 'n/a').padEnd(18) +
      '| ' + String(row.count).padStart(5) +
      ' | ' + metric.padEnd(16) +
      ' | $' + cost.toFixed(4)
    )
  }
}

queryUsage()
