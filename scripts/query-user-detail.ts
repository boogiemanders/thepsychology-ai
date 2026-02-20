import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function query() {
  const userId = 'b4aa08a1-6d14-4928-bd23-799f246cdb4f'

  // Get user email from auth.users
  const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId)

  if (userError) {
    console.error('Error fetching user:', userError.message)
  } else if (userData?.user) {
    console.log('=== User Info ===')
    console.log('User ID:', userId)
    console.log('Email:', userData.user.email)
    console.log('Created:', userData.user.created_at)
    console.log('')
  }

  // Get their TTS usage on Jan 25
  const { data, error } = await supabase
    .from('usage_events')
    .select('metadata, created_at')
    .eq('event_name', 'topic-teacher.audio')
    .eq('user_id', userId)
    .gte('created_at', '2026-01-25T00:00:00Z')
    .lt('created_at', '2026-01-26T00:00:00Z')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error:', error.message)
    return
  }

  if (!data || data.length === 0) {
    console.log('No TTS events found.')
    return
  }

  // Calculate time spent
  const totalChars = data.reduce((sum, r) => sum + ((r.metadata?.characters as number) || (r.metadata?.chars as number) || 0), 0)

  // TTS speaking rate: roughly 150 words/min, avg 5 chars/word = 750 chars/min
  // Or more accurately for TTS: ~15 chars/second at normal speed
  const estimatedSeconds = totalChars / 15
  const estimatedMinutes = estimatedSeconds / 60
  const estimatedHours = estimatedMinutes / 60

  // Session duration (first to last request)
  const firstRequest = new Date(data[0].created_at)
  const lastRequest = new Date(data[data.length - 1].created_at)
  const sessionDurationMs = lastRequest.getTime() - firstRequest.getTime()
  const sessionDurationMin = sessionDurationMs / 60000
  const sessionDurationHours = sessionDurationMin / 60

  console.log('=== Jan 25 TTS Activity ===')
  console.log('Requests:', data.length)
  console.log('Total characters:', totalChars.toLocaleString())
  console.log('')
  console.log('=== Time Estimates ===')
  console.log(`Audio duration: ~${estimatedMinutes.toFixed(0)} minutes (${estimatedHours.toFixed(1)} hours)`)
  console.log(`Session span: ${sessionDurationMin.toFixed(0)} minutes (${sessionDurationHours.toFixed(1)} hours)`)
  console.log(`First request: ${firstRequest.toISOString()}`)
  console.log(`Last request: ${lastRequest.toISOString()}`)

  // Topics they studied
  const topics = new Set<string>()
  for (const row of data) {
    if (row.metadata?.topic) topics.add(row.metadata.topic as string)
  }
  console.log('')
  console.log(`=== Topics Studied (${topics.size}) ===`)
  for (const topic of Array.from(topics).sort()) {
    console.log(`- ${topic}`)
  }
}

query()
