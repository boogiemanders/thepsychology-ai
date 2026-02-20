import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const userId = 'cc1fc7bc-c3ce-4b1c-99ae-25560ebb21cd'

async function checkPriorities() {
  // Check priority recommendations
  console.log('=== Priority Recommendations ===')
  const { data: priorities, error: prioritiesErr } = await supabase
    .from('priority_recommendations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)

  if (prioritiesErr) {
    console.log('Error:', prioritiesErr.message)
  } else if (priorities && priorities.length > 0) {
    const p = priorities[0]
    console.log('Generated:', new Date(p.created_at).toLocaleString())
    console.log('\nRecommendations:')
    const recs = p.recommendations || p.priority_topics || []
    for (const r of recs.slice(0, 10)) {
      console.log(`- ${r.topic || r.name}: ${r.priority || r.score || 'N/A'}`)
    }
  } else {
    console.log('None found')
  }

  // Check domain performance from exam results
  console.log('\n=== Domain Performance (from last exam) ===')
  const { data: examResults, error: examErr } = await supabase
    .from('exam_results')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)

  if (examErr) {
    console.log('Error:', examErr.message)
  } else if (examResults && examResults.length > 0) {
    const exam = examResults[0]
    console.log('Exam date:', new Date(exam.created_at).toLocaleDateString())
    console.log('Score:', exam.score, '/', exam.total_questions)

    if (exam.domain_scores) {
      console.log('\nBy Domain:')
      const domains = exam.domain_scores
      for (const [domain, score] of Object.entries(domains)) {
        console.log(`  ${domain}: ${JSON.stringify(score)}`)
      }
    }

    if (exam.weak_areas) {
      console.log('\nWeak Areas:')
      for (const area of exam.weak_areas) {
        console.log(`  - ${area}`)
      }
    }
  }
}

checkPriorities()
