import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
)

async function query() {
  // Get all completed practice exam assignments
  const { data, error } = await supabase
    .from('user_exam_assignments')
    .select('user_id, exam_file, exam_type, completed, assigned_at')
    .eq('exam_type', 'practice')
    .order('user_id')
    .order('assigned_at', { ascending: true })

  if (error) { console.error(error); return }

  // Group by user
  const byUser: Record<string, { completed: string[], incomplete: string[] }> = {}
  for (const row of data || []) {
    if (!byUser[row.user_id]) byUser[row.user_id] = { completed: [], incomplete: [] }
    if (row.completed) {
      byUser[row.user_id].completed.push(row.exam_file)
    } else {
      byUser[row.user_id].incomplete.push(row.exam_file)
    }
  }

  // Get emails
  console.log('=== Practice Exam Progress ===\n')
  for (const [userId, info] of Object.entries(byUser)) {
    const { data: authUser } = await supabase.auth.admin.getUserById(userId)
    const email = authUser?.user?.email || userId
    console.log(`${email}: ${info.completed.length} completed, ${info.incomplete.length} in-progress`)
    if (info.completed.length > 0) console.log(`  Completed: ${info.completed.join(', ')}`)
    if (info.incomplete.length > 0) console.log(`  Incomplete: ${info.incomplete.join(', ')}`)
  }

  // Also check diagnostic
  const { data: diagData } = await supabase
    .from('user_exam_assignments')
    .select('user_id, exam_file, exam_type, completed')
    .eq('exam_type', 'diagnostic')
    .order('user_id')

  const byUserDiag: Record<string, { completed: string[], incomplete: string[] }> = {}
  for (const row of diagData || []) {
    if (!byUserDiag[row.user_id]) byUserDiag[row.user_id] = { completed: [], incomplete: [] }
    if (row.completed) {
      byUserDiag[row.user_id].completed.push(row.exam_file)
    } else {
      byUserDiag[row.user_id].incomplete.push(row.exam_file)
    }
  }

  console.log('\n=== Diagnostic Exam Progress ===\n')
  for (const [userId, info] of Object.entries(byUserDiag)) {
    const { data: authUser } = await supabase.auth.admin.getUserById(userId)
    const email = authUser?.user?.email || userId
    console.log(`${email}: ${info.completed.length} completed, ${info.incomplete.length} in-progress`)
    if (info.completed.length > 0) console.log(`  Completed: ${info.completed.join(', ')}`)
    if (info.incomplete.length > 0) console.log(`  Incomplete: ${info.incomplete.join(', ')}`)
  }

  // Summary
  console.log('\n=== Summary ===')
  const practiceMaxCompleted = Math.max(0, ...Object.values(byUser).map(u => u.completed.length))
  const diagMaxCompleted = Math.max(0, ...Object.values(byUserDiag).map(u => u.completed.length))
  console.log(`Most practice exams completed by one user: ${practiceMaxCompleted}/4`)
  console.log(`Most diagnostic exams completed by one user: ${diagMaxCompleted}/4`)
}

query()
