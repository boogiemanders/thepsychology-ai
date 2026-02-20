import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function query() {
  const { data, error } = await supabase
    .from('usage_events')
    .select('event_name, model, metadata, created_at, user_id')
    .eq('event_name', 'topic-teacher.audio')
    .gte('created_at', '2026-01-25T00:00:00Z')
    .lt('created_at', '2026-01-26T00:00:00Z')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error:', error.message)
    return
  }

  if (!data || data.length === 0) {
    console.log('No TTS events on Jan 25.')
    return
  }

  console.log(`=== TTS on 2026-01-25 (${data.length} requests) ===\n`)

  // Group by hour
  const byHour: Record<string, { count: number; chars: number }> = {}
  for (const row of data) {
    const hour = row.created_at.split('T')[1].split(':')[0]
    if (!byHour[hour]) byHour[hour] = { count: 0, chars: 0 }
    byHour[hour].count++
    byHour[hour].chars += (row.metadata?.characters as number) || (row.metadata?.chars as number) || 0
  }

  console.log('Hour (UTC) | Requests | Characters')
  console.log('-'.repeat(40))
  for (const [hour, stats] of Object.entries(byHour).sort()) {
    console.log(hour + ':00      | ' + String(stats.count).padStart(8) + ' | ' + String(stats.chars.toLocaleString()).padStart(10))
  }

  // Group by user
  const byUser: Record<string, { count: number; chars: number }> = {}
  for (const row of data) {
    const userId = row.user_id || 'anonymous'
    if (!byUser[userId]) byUser[userId] = { count: 0, chars: 0 }
    byUser[userId].count++
    byUser[userId].chars += (row.metadata?.characters as number) || (row.metadata?.chars as number) || 0
  }

  console.log('\n=== By User ===')
  console.log('User ID                              | Requests | Characters')
  console.log('-'.repeat(65))
  const sortedUsers = Object.entries(byUser).sort((a, b) => b[1].count - a[1].count)
  for (const [userId, stats] of sortedUsers.slice(0, 10)) {
    const displayId = userId.length > 36 ? userId.slice(0, 33) + '...' : userId
    console.log(displayId.padEnd(36) + ' | ' + String(stats.count).padStart(8) + ' | ' + String(stats.chars.toLocaleString()).padStart(10))
  }
  if (sortedUsers.length > 10) {
    console.log(`... and ${sortedUsers.length - 10} more users`)
  }

  // Group by topic
  const byTopic: Record<string, { count: number; chars: number }> = {}
  for (const row of data) {
    const topic = (row.metadata?.topic as string) || 'unknown'
    if (!byTopic[topic]) byTopic[topic] = { count: 0, chars: 0 }
    byTopic[topic].count++
    byTopic[topic].chars += (row.metadata?.characters as number) || (row.metadata?.chars as number) || 0
  }

  console.log('\n=== By Topic ===')
  console.log('Topic                                          | Requests | Characters')
  console.log('-'.repeat(75))
  const sortedTopics = Object.entries(byTopic).sort((a, b) => b[1].count - a[1].count)
  for (const [topic, stats] of sortedTopics.slice(0, 15)) {
    const displayTopic = topic.length > 45 ? topic.slice(0, 42) + '...' : topic
    console.log(displayTopic.padEnd(46) + ' | ' + String(stats.count).padStart(8) + ' | ' + String(stats.chars.toLocaleString()).padStart(10))
  }
  if (sortedTopics.length > 15) {
    console.log(`... and ${sortedTopics.length - 15} more topics`)
  }

  // Check for patterns - rapid requests from same user
  console.log('\n=== Rapid Request Detection ===')
  const userRequests: Record<string, Date[]> = {}
  for (const row of data) {
    const userId = row.user_id || 'anonymous'
    if (!userRequests[userId]) userRequests[userId] = []
    userRequests[userId].push(new Date(row.created_at))
  }

  for (const [userId, times] of Object.entries(userRequests)) {
    if (times.length < 50) continue
    const sorted = times.sort((a, b) => a.getTime() - b.getTime())
    const firstRequest = sorted[0]
    const lastRequest = sorted[sorted.length - 1]
    const durationMin = (lastRequest.getTime() - firstRequest.getTime()) / 60000
    const reqPerMin = times.length / Math.max(durationMin, 1)

    if (reqPerMin > 5) {
      console.log(`⚠️  User ${userId.slice(0, 8)}... made ${times.length} requests in ${durationMin.toFixed(1)} min (${reqPerMin.toFixed(1)}/min)`)
    }
  }

  // Total
  const totalChars = data.reduce((sum, r) => sum + ((r.metadata?.characters as number) || (r.metadata?.chars as number) || 0), 0)
  const cost = (totalChars / 1000) * 0.015
  console.log(`\n=== Summary ===`)
  console.log(`Total requests: ${data.length}`)
  console.log(`Total characters: ${totalChars.toLocaleString()}`)
  console.log(`Estimated cost: $${cost.toFixed(2)}`)
  console.log(`Unique users: ${Object.keys(byUser).length}`)
  console.log(`Unique topics: ${Object.keys(byTopic).length}`)
}

query()
