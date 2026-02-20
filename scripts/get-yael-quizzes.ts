import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const userId = 'cc1fc7bc-c3ce-4b1c-99ae-25560ebb21cd'

async function getYaelQuizzes() {
  const { data, error } = await supabase
    .from('quiz_attempts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error:', error.message)
    return
  }

  console.log('=== Yael Quiz Attempts ===')
  console.log('Total:', data?.length || 0)
  console.log('')

  for (const q of data || []) {
    const pct = Math.round((q.correct_questions / q.total_questions) * 100)
    console.log(`${new Date(q.created_at).toLocaleDateString()} - ${q.topic}: ${q.correct_questions}/${q.total_questions} (${pct}%)`)
  }

  // Generate localStorage format
  if (data && data.length > 0) {
    console.log('\n=== localStorage Format ===')
    const quizResults = data.map(q => ({
      topic: q.topic,
      domain: q.domain,
      score: q.correct_questions,
      totalQuestions: q.total_questions,
      timestamp: new Date(q.created_at).getTime(),
    }))
    console.log(JSON.stringify(quizResults, null, 2))
  }
}

getYaelQuizzes()
