import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const userId = 'b4aa08a1-6d14-4928-bd23-799f246cdb4f'

async function check() {
  // Check for Topic Teacher chat logs
  const { data: ttChats } = await supabase
    .from('topic_teacher_chats')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10)
  
  console.log('=== TOPIC TEACHER CHAT LOGS ===')
  console.log('Total chats found:', ttChats?.length || 0)
  if (ttChats?.length) {
    ttChats.forEach(c => {
      console.log('  -', c.topic || c.lesson_id, '| messages:', c.message_count || '?')
    })
  }

  // Check quizzer sessions
  const { data: quizzer } = await supabase
    .from('quizzer_sessions')
    .select('*')
    .eq('user_id', userId)
  
  console.log('')
  console.log('=== QUIZZER SESSIONS ===')
  console.log('Total:', quizzer?.length || 0)
  if (quizzer?.length) {
    quizzer.forEach(q => {
      console.log('  -', JSON.stringify(q))
    })
  }

  // Check user_question_history for any quiz performance
  const { data: qHistory, count } = await supabase
    .from('user_question_history')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .limit(20)
  
  console.log('')
  console.log('=== QUESTION HISTORY ===')
  console.log('Total questions answered:', count || 0)
  if (qHistory?.length) {
    let correct = 0
    let incorrect = 0
    qHistory.forEach(q => {
      if (q.is_correct) correct++
      else incorrect++
    })
    console.log('Sample (first 20):', correct, 'correct,', incorrect, 'incorrect')
  }

  // Check domain progress
  const { data: progress } = await supabase
    .from('user_domain_progress')
    .select('*')
    .eq('user_id', userId)
  
  console.log('')
  console.log('=== DOMAIN PROGRESS ===')
  if (progress?.length) {
    progress.forEach(p => {
      console.log('  -', p.domain_name, ':', p.mastery_level + '%', '|', p.questions_answered, 'questions')
    })
  } else {
    console.log('  None recorded')
  }

  // Check topic_teacher_sessions for detailed chat data
  const { data: ttSessions } = await supabase
    .from('topic_teacher_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10)
  
  console.log('')
  console.log('=== TOPIC TEACHER SESSIONS (detailed) ===')
  console.log('Total:', ttSessions?.length || 0)
  if (ttSessions?.length) {
    ttSessions.forEach(s => {
      console.log('  - Topic:', s.topic_name || s.topic_id, '| Messages:', s.message_count, '| Quiz correct:', s.quiz_correct, '/', s.quiz_total)
    })
  }
}
check()
