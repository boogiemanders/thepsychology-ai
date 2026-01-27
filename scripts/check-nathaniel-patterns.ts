import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const userId = 'b4aa08a1-6d14-4928-bd23-799f246cdb4f'

async function check() {
  const { data: ratings } = await supabase
    .from('feature_ratings')
    .select('topic, domain, duration_seconds, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (!ratings?.length) return

  console.log('=== SUSPICIOUS PATTERN ANALYSIS ===\n')

  // 1. Time per topic breakdown
  const durations = ratings.map(r => r.duration_seconds || 0)
  const avgDuration = durations.reduce((a,b) => a+b, 0) / durations.length
  const shortSessions = durations.filter(d => d < 60).length
  const veryShortSessions = durations.filter(d => d < 30).length
  
  console.log('TIME PER TOPIC:')
  console.log('  Average:', Math.round(avgDuration), 'seconds (' + Math.round(avgDuration/60) + ' min)')
  console.log('  Sessions under 1 min:', shortSessions, '/', ratings.length)
  console.log('  Sessions under 30 sec:', veryShortSessions, '/', ratings.length)

  // 2. Check for systematic coverage (hitting every domain)
  const domains = new Set(ratings.map(r => r.domain))
  console.log('\nDOMAINS COVERED:', domains.size)
  domains.forEach(d => {
    const count = ratings.filter(r => r.domain === d).length
    console.log('  -', d, ':', count, 'topics')
  })

  // 3. Check for repeat visits to same topic (would indicate actually studying)
  const topicCounts: Record<string, number> = {}
  ratings.forEach(r => {
    const key = r.topic + '|' + r.domain
    topicCounts[key] = (topicCounts[key] || 0) + 1
  })
  const repeats = Object.entries(topicCounts).filter(([_, count]) => count > 1)
  console.log('\nREPEAT VISITS (same topic multiple times):')
  if (repeats.length) {
    repeats.forEach(([topic, count]) => console.log('  -', topic, ':', count, 'times'))
  } else {
    console.log('  None - each topic visited exactly once')
  }

  // 4. Time gaps between sessions (rapid-fire = suspicious)
  console.log('\nSESSION TIMING (time between topics):')
  let rapidTransitions = 0
  for (let i = 1; i < ratings.length; i++) {
    const prev = new Date(ratings[i-1].created_at).getTime()
    const curr = new Date(ratings[i].created_at).getTime()
    const prevDuration = (ratings[i-1].duration_seconds || 0) * 1000
    const gap = curr - prev - prevDuration
    if (gap < 10000 && gap > -5000) { // Less than 10 sec between sessions
      rapidTransitions++
    }
  }
  console.log('  Rapid transitions (<10 sec gap):', rapidTransitions, '/', ratings.length - 1)

  // 5. Very short sessions list
  console.log('\nVERY SHORT SESSIONS (<30 sec):')
  const veryShort = ratings.filter(r => (r.duration_seconds || 0) < 30)
  if (veryShort.length) {
    veryShort.forEach(r => {
      console.log('  -', r.topic, '(' + r.domain + '):', r.duration_seconds + 's')
    })
  } else {
    console.log('  None')
  }
}
check()
