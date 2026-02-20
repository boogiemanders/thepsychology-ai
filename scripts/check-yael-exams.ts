import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const userId = 'cc1fc7bc-c3ce-4b1c-99ae-25560ebb21cd'

async function checkExams() {
  // Check all exam results
  console.log('=== All Exam Results ===')
  const { data: exams, error: examsErr } = await supabase
    .from('exam_results')
    .select('id, exam_type, score, total_questions, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (examsErr) {
    console.log('Error:', examsErr.message)
  } else {
    for (const e of exams || []) {
      console.log(`${new Date(e.created_at).toLocaleString()} - ${e.exam_type}: ${e.score}/${e.total_questions}`)
    }
  }

  // Check pre-generated exams table
  console.log('\n=== Pre-generated Exams ===')
  const { data: preGen, error: preGenErr } = await supabase
    .from('pre_generated_exams')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5)

  if (preGenErr) {
    console.log('Error or no table:', preGenErr.message)
  } else if (preGen && preGen.length > 0) {
    for (const e of preGen) {
      console.log(`${new Date(e.created_at).toLocaleString()} - ${e.exam_type} - status: ${e.status}`)
    }
  } else {
    console.log('None found')
  }

  // Check user_exams table if exists
  console.log('\n=== User Exams ===')
  const { data: userExams, error: userExamsErr } = await supabase
    .from('user_exams')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5)

  if (userExamsErr) {
    console.log('Error or no table:', userExamsErr.message)
  } else if (userExams && userExams.length > 0) {
    console.log(JSON.stringify(userExams, null, 2))
  } else {
    console.log('None found')
  }

  // Check for any errors in usage events
  console.log('\n=== Recent Usage Events (all types) ===')
  const { data: events, error: eventsErr } = await supabase
    .from('usage_events')
    .select('event_name, metadata, created_at')
    .eq('user_id', userId)
    .gte('created_at', '2026-01-28T00:00:00Z')
    .order('created_at', { ascending: true })

  if (eventsErr) {
    console.log('Error:', eventsErr.message)
  } else {
    for (const e of events || []) {
      console.log(`${new Date(e.created_at).toLocaleString()} - ${e.event_name}`)
    }
  }
}

checkExams()
