import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
)

async function query() {
  const { data: assignments } = await supabase
    .from('user_exam_assignments')
    .select('user_id, exam_type, exam_file, assigned_at')

  const { data: results } = await supabase
    .from('exam_results')
    .select('user_id, exam_type, score, total_questions, created_at')
    .order('created_at', { ascending: false })

  const assignedUsers = new Set((assignments || []).map(a => a.user_id))
  const resultUsers = new Set((results || []).map(r => r.user_id))

  const overlap = [...assignedUsers].filter(u => resultUsers.has(u))
  const resultsOnly = [...resultUsers].filter(u => {
    return !assignedUsers.has(u)
  })

  console.log('Users with assignments:', assignedUsers.size)
  console.log('Users with exam results:', resultUsers.size)
  console.log('Users with BOTH:', overlap.length)

  if (overlap.length > 0) {
    console.log('\n=== Users with both assignment and results ===')
    for (const uid of overlap) {
      const { data: authUser } = await supabase.auth.admin.getUserById(uid)
      const email = authUser?.user?.email || uid
      const ua = (assignments || []).filter(a => a.user_id === uid)
      const ur = (results || []).filter(r => r.user_id === uid)
      console.log('\n' + email)
      for (const a of ua) {
        console.log('  Assignment: ' + a.exam_type + ' ' + a.exam_file + ' (' + a.assigned_at.split('T')[0] + ')')
      }
      for (const r of ur) {
        console.log('  Result: ' + r.exam_type + ' ' + r.score + '/' + r.total_questions + ' (' + r.created_at.split('T')[0] + ')')
      }
    }
  }

  if (resultsOnly.length > 0) {
    console.log('\n=== Users with results but NO assignment (bypassed assign-exam) ===')
    for (const uid of resultsOnly.slice(0, 10)) {
      const { data: authUser } = await supabase.auth.admin.getUserById(uid)
      const email = authUser?.user?.email || uid
      const ur = (results || []).filter(r => r.user_id === uid)
      console.log(email + ': ' + ur.length + ' result(s)')
      for (const r of ur) {
        console.log('  ' + r.exam_type + ' ' + r.score + '/' + r.total_questions + ' (' + r.created_at.split('T')[0] + ')')
      }
    }
  }
}

query()
