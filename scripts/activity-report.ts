import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function report() {
  const twoWeeksAgo = new Date()
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
  const twoWeeksAgoISO = twoWeeksAgo.toISOString()

  // Check auth logins in past 2 weeks
  const { data: authData } = await supabase.auth.admin.listUsers()
  const recentLogins = authData?.users.filter(u =>
    u.last_sign_in_at &&
    new Date(u.last_sign_in_at) >= twoWeeksAgo &&
    u.email !== 'chanders0@yahoo.com'
  ) || []

  console.log('\n🔐 Users who logged in (past 2 weeks):', recentLogins.length)
  for (const u of recentLogins) {
    console.log('  -', u.email, '| Last login:', new Date(u.last_sign_in_at!).toLocaleDateString())
  }

  // Check exam activity
  const { data: exams } = await supabase
    .from('exam_history')
    .select('user_id, exam_type, score, total_questions, created_at, users!inner(email)')
    .gte('created_at', twoWeeksAgoISO)
    .neq('users.email', 'chanders0@yahoo.com')
    .order('created_at', { ascending: false })

  console.log('\n📝 Exams taken (past 2 weeks):', exams?.length || 0)
  if (exams) {
    for (const e of exams) {
      const user = e.users as { email: string } | null
      const pct = Math.round((e.score / e.total_questions) * 100)
      console.log('  -', user?.email, '|', e.exam_type || 'Exam', '|', `${e.score}/${e.total_questions}`, `(${pct}%)`, '|', new Date(e.created_at).toLocaleDateString())
    }
  }

  // Check quiz activity
  const { data: quizzes } = await supabase
    .from('quiz_results')
    .select('user_id, topic, score, total_questions, created_at, users!inner(email)')
    .gte('created_at', twoWeeksAgoISO)
    .neq('users.email', 'chanders0@yahoo.com')
    .order('created_at', { ascending: false })
    .limit(20)

  console.log('\n🧠 Quiz sessions (past 2 weeks):', quizzes?.length || 0)
  if (quizzes && quizzes.length > 0) {
    for (const q of quizzes.slice(0, 10)) {
      const user = q.users as { email: string } | null
      console.log('  -', user?.email, '|', q.topic || 'Quiz', '|', `${q.score}/${q.total_questions}`)
    }
    if (quizzes.length > 10) console.log('  ... and', quizzes.length - 10, 'more')
  }

  // Check recover chat usage
  const { data: chats } = await supabase
    .from('recover_chat_logs')
    .select('user_id, created_at, users!inner(email)')
    .gte('created_at', twoWeeksAgoISO)
    .neq('users.email', 'chanders0@yahoo.com')

  console.log('\n💬 Recover chat sessions (past 2 weeks):', chats?.length || 0)

  // Detailed user lookup for active user
  if (recentLogins.length > 0) {
    console.log('\n' + '='.repeat(60))
    console.log('DETAILED ACTIVITY BY USER')
    console.log('='.repeat(60))

    for (const authUser of recentLogins) {
      console.log(`\n👤 ${authUser.email}`)
      console.log(`   Last login: ${new Date(authUser.last_sign_in_at!).toLocaleString()}`)

      // Get their profile
      const { data: profile } = await supabase
        .from('users')
        .select('subscription_tier, last_activity_at, current_page')
        .eq('id', authUser.id)
        .single()

      if (profile) {
        console.log(`   Tier: ${profile.subscription_tier}`)
        if (profile.last_activity_at) {
          console.log(`   Last activity: ${new Date(profile.last_activity_at).toLocaleString()}`)
        }
        if (profile.current_page) {
          console.log(`   Last page: ${profile.current_page}`)
        }
      }

      // Count their exams
      const userExams = exams?.filter(e => e.user_id === authUser.id) || []
      if (userExams.length > 0) {
        console.log(`   Exams taken: ${userExams.length}`)
        for (const e of userExams) {
          const pct = Math.round((e.score / e.total_questions) * 100)
          console.log(`     - ${e.exam_type || 'Exam'}: ${e.score}/${e.total_questions} (${pct}%) on ${new Date(e.created_at).toLocaleDateString()}`)
        }
      }

      // Count their quizzes
      const userQuizzes = quizzes?.filter(q => q.user_id === authUser.id) || []
      if (userQuizzes.length > 0) {
        console.log(`   Quizzes: ${userQuizzes.length}`)
      }
    }
  }
}

report()
