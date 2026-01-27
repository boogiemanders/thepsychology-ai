import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const userId = process.argv[2]

if (!userId) {
  console.error('Usage: npx tsx scripts/user-details.ts <user-id>')
  process.exit(1)
}

async function check() {
  // Get all study sessions with full metadata
  const { data: sessions } = await supabase
    .from('study_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: true })

  console.log('=== STUDY SESSION DETAILS ===\n')
  for (const s of sessions || []) {
    console.log(`📚 ${s.feature}`)
    console.log(`   Time: ${new Date(s.started_at).toLocaleString()}`)
    console.log(`   Duration: ${s.duration_seconds} seconds`)
    if (s.metadata?.topic) console.log(`   Topic: ${s.metadata.topic}`)
    if (s.metadata?.domain) console.log(`   Domain: ${s.metadata.domain}`)
    if (s.metadata?.mode) console.log(`   Mode: ${s.metadata.mode}`)
    if (s.metadata?.examType) console.log(`   Exam Type: ${s.metadata.examType}`)
    console.log('')
  }

  // List all tables to check what exists
  const tablesToCheck = [
    'topic_interactions',
    'user_question_attempts',
    'question_attempts',
    'user_answers',
    'exam_answers',
    'study_progress',
    'learning_events',
    'user_sessions',
    'analytics_events'
  ]

  console.log('=== CHECKING OTHER TABLES ===\n')
  for (const table of tablesToCheck) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('user_id', userId)
      .limit(10)

    if (!error && data && data.length > 0) {
      console.log(`✅ ${table}: ${data.length} records`)
      console.log(JSON.stringify(data, null, 2))
      console.log('')
    }
  }
}

check()
