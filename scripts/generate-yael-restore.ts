import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const userId = 'cc1fc7bc-c3ce-4b1c-99ae-25560ebb21cd'

async function generateRestoreScript() {
  // Get quiz attempts
  const { data: attempts, error: attemptsError } = await supabase
    .from('quiz_attempts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (attemptsError || !attempts) {
    console.error('Error fetching attempts:', attemptsError?.message)
    return
  }

  // Group by topic (keep latest attempt per topic)
  const latestByTopic = new Map<string, any>()
  for (const attempt of attempts) {
    if (!latestByTopic.has(attempt.topic)) {
      latestByTopic.set(attempt.topic, attempt)
    }
  }

  // Build localStorage entries
  const localStorageData: Record<string, any> = {}

  for (const [topic, attempt] of latestByTopic) {
    const key = `quizResults_${topic}`
    localStorageData[key] = {
      topic: attempt.topic,
      domain: attempt.domain,
      timestamp: new Date(attempt.created_at).getTime(),
      score: attempt.correct_questions,
      totalQuestions: attempt.total_questions,
      wrongAnswers: [],
      correctAnswers: [],
    }
  }

  // Generate the restore script
  console.log('// Paste this in Chrome DevTools Console while on thepsychology.ai')
  console.log('// This will restore Yael\'s quiz progress data')
  console.log('')
  console.log('const data = ' + JSON.stringify(localStorageData, null, 2) + ';')
  console.log('')
  console.log('let count = 0;')
  console.log('for (const [key, value] of Object.entries(data)) {')
  console.log('  localStorage.setItem(key, JSON.stringify(value));')
  console.log('  count++;')
  console.log('}')
  console.log('console.log(`✅ Restored ${count} quiz results! Refresh the page.`);')
}

generateRestoreScript()
