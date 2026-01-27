import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const EMAIL = process.argv[2]

if (!EMAIL) {
  console.error('Usage: npx tsx scripts/user-activity-lookup.ts <email>')
  process.exit(1)
}

async function lookupUser() {
  console.log(`\n📧 Looking up activity for: ${EMAIL}\n`)
  console.log('='.repeat(60))

  // 1. Get user from auth
  const { data: authData } = await supabase.auth.admin.listUsers()
  const authUser = authData?.users.find(u => u.email === EMAIL)

  if (!authUser) {
    console.log('❌ User not found in auth.users')
    return
  }

  const userId = authUser.id
  console.log('\n👤 AUTH USER')
  console.log(`   ID: ${userId}`)
  console.log(`   Email: ${authUser.email}`)
  console.log(`   Created: ${authUser.created_at}`)
  console.log(`   Last Sign In: ${authUser.last_sign_in_at || 'Never'}`)
  console.log(`   Email Confirmed: ${authUser.email_confirmed_at ? 'Yes' : 'No'}`)

  // 2. Get user profile
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (profile) {
    console.log('\n👤 USER PROFILE')
    console.log(`   Full Name: ${profile.full_name || '(not set)'}`)
    console.log(`   Subscription: ${profile.subscription_tier}`)
    console.log(`   Subscription Started: ${profile.subscription_started_at || '(not set)'}`)
    console.log(`   Exam Date: ${profile.exam_date || '(not set)'}`)
    console.log(`   Referral Source: ${profile.referral_source || '(not set)'}`)
    console.log(`   Stripe Customer ID: ${profile.stripe_customer_id || '(none)'}`)
    console.log(`   Created: ${profile.created_at}`)
  } else {
    console.log('\n👤 USER PROFILE: Not found (was orphaned)')
  }

  // 3. Check exam history
  const { data: examHistory, error: examError } = await supabase
    .from('exam_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (examHistory && examHistory.length > 0) {
    console.log(`\n📝 EXAM HISTORY (${examHistory.length} exams)`)
    for (const exam of examHistory) {
      console.log(`   - ${exam.exam_type || 'Exam'} | Score: ${exam.score}/${exam.total_questions} (${Math.round((exam.score/exam.total_questions)*100)}%) | ${new Date(exam.created_at).toLocaleDateString()}`)
    }
  } else {
    console.log('\n📝 EXAM HISTORY: None')
  }

  // 4. Check exam results
  const { data: examResults } = await supabase
    .from('exam_results')
    .select('*')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })

  if (examResults && examResults.length > 0) {
    console.log(`\n📊 EXAM RESULTS (${examResults.length} results)`)
    for (const result of examResults.slice(0, 10)) {
      console.log(`   - Exam ${result.exam_id} | Score: ${result.score}/${result.total_questions} | ${new Date(result.completed_at).toLocaleDateString()}`)
    }
    if (examResults.length > 10) {
      console.log(`   ... and ${examResults.length - 10} more`)
    }
  } else {
    console.log('\n📊 EXAM RESULTS: None')
  }

  // 5. Check user activity
  const { data: activity } = await supabase
    .from('user_activity')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (activity && activity.length > 0) {
    console.log(`\n🔄 RECENT ACTIVITY (last ${activity.length} events)`)
    for (const act of activity) {
      console.log(`   - ${act.activity_type} | ${new Date(act.created_at).toLocaleString()}`)
    }
  } else {
    console.log('\n🔄 USER ACTIVITY: None')
  }

  // 6. Check consent preferences
  const { data: consent } = await supabase
    .from('user_consent_preferences')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (consent) {
    console.log('\n✅ CONSENT PREFERENCES')
    console.log(`   Personal Tracking: ${consent.consent_personal_tracking}`)
    console.log(`   AI Insights: ${consent.consent_ai_insights}`)
    console.log(`   Research: ${consent.consent_research_contribution}`)
    console.log(`   Marketing: ${consent.consent_marketing_communications}`)
  } else {
    console.log('\n✅ CONSENT PREFERENCES: Not set')
  }

  // 7. Check feature ratings
  const { data: ratings } = await supabase
    .from('feature_ratings')
    .select('*')
    .eq('user_id', userId)

  if (ratings && ratings.length > 0) {
    console.log(`\n⭐ FEATURE RATINGS (${ratings.length})`)
    for (const rating of ratings) {
      console.log(`   - ${rating.feature_name}: ${rating.rating}/5 | "${rating.feedback || '(no comment)'}"`)
    }
  } else {
    console.log('\n⭐ FEATURE RATINGS: None')
  }

  // 8. Check question feedback
  const { data: feedback } = await supabase
    .from('question_feedback')
    .select('*')
    .eq('user_id', userId)

  if (feedback && feedback.length > 0) {
    console.log(`\n💬 QUESTION FEEDBACK (${feedback.length})`)
    for (const fb of feedback.slice(0, 5)) {
      console.log(`   - Q${fb.question_id}: ${fb.feedback_type} | "${fb.feedback_text?.slice(0, 50) || '(no text)'}"`)
    }
  } else {
    console.log('\n💬 QUESTION FEEDBACK: None')
  }

  // 9. Check recover chat logs
  const { data: chatLogs } = await supabase
    .from('recover_chat_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (chatLogs && chatLogs.length > 0) {
    console.log(`\n💭 RECOVER CHAT LOGS (${chatLogs.length} sessions)`)
    for (const log of chatLogs.slice(0, 5)) {
      console.log(`   - ${new Date(log.created_at).toLocaleString()} | ${log.message_count || '?'} messages`)
    }
  } else {
    console.log('\n💭 RECOVER CHAT LOGS: None')
  }

  // 10. Check progress tracking
  const { data: progress } = await supabase
    .from('user_domain_progress')
    .select('*')
    .eq('user_id', userId)

  if (progress && progress.length > 0) {
    console.log(`\n📈 DOMAIN PROGRESS (${progress.length} domains)`)
    for (const p of progress) {
      console.log(`   - ${p.domain_name}: ${p.mastery_level}% mastery | ${p.questions_answered} questions`)
    }
  } else {
    console.log('\n📈 DOMAIN PROGRESS: None')
  }

  console.log('\n' + '='.repeat(60))
}

lookupUser()
