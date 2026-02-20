import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const userId = process.argv[2] || 'cc1fc7bc-c3ce-4b1c-99ae-25560ebb21cd'

async function checkUsage() {
  // Check usage events
  const { data: events, error: eventsError } = await supabase
    .from('usage_events')
    .select('event_name, metadata, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (eventsError) {
    console.log('Usage events error:', eventsError.message)
  } else if (events && events.length > 0) {
    console.log('=== Recent Usage Events ===')
    for (const e of events) {
      const date = new Date(e.created_at).toLocaleString()
      const meta = e.metadata ? JSON.stringify(e.metadata) : ''
      console.log(`${date} - ${e.event_name} ${meta}`)
    }
  } else {
    console.log('No usage events found')
  }

  // Check exam results
  const { data: exams, error: examsError } = await supabase
    .from('exam_results')
    .select('exam_type, score, total_questions, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10)

  if (examsError) {
    console.log('\nExam results error:', examsError.message)
  } else if (exams && exams.length > 0) {
    console.log('\n=== Recent Exams ===')
    for (const e of exams) {
      const date = new Date(e.created_at).toLocaleDateString()
      console.log(`${date} - ${e.exam_type}: ${e.score}/${e.total_questions}`)
    }
  } else {
    console.log('\nNo exam results found')
  }

  // Check quiz results
  const { data: quizzes, error: quizzesError } = await supabase
    .from('quiz_results')
    .select('topic, score, total_questions, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10)

  if (quizzesError) {
    console.log('\nQuiz results error:', quizzesError.message)
  } else if (quizzes && quizzes.length > 0) {
    console.log('\n=== Recent Quizzes ===')
    for (const q of quizzes) {
      const date = new Date(q.created_at).toLocaleDateString()
      console.log(`${date} - ${q.topic}: ${q.score}/${q.total_questions}`)
    }
  } else {
    console.log('\nNo quiz results found')
  }
}

checkUsage()
