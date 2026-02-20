import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const userId = 'cc1fc7bc-c3ce-4b1c-99ae-25560ebb21cd'

async function getDomainScores() {
  const { data, error } = await supabase
    .from('exam_results')
    .select('score, total_questions, questions, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    console.error('Error:', error.message)
    return
  }

  console.log('Last Exam:', new Date(data.created_at).toLocaleDateString())
  console.log('Overall Score:', data.score, '/', data.total_questions, `(${Math.round(data.score/data.total_questions*100)}%)`)
  console.log('')

  // Calculate domain scores from questions
  const domainStats: Record<string, { correct: number; total: number; topics: Set<string> }> = {}
  const topicStats: Record<string, { correct: number; total: number }> = {}

  for (const q of data.questions || []) {
    const domain = q.domain || q.domainId || 'Unknown'
    const topic = q.topicName || 'Unknown'
    const isCorrect = q.userAnswer === q.correct_answer

    if (!domainStats[domain]) {
      domainStats[domain] = { correct: 0, total: 0, topics: new Set() }
    }
    domainStats[domain].total++
    if (isCorrect) domainStats[domain].correct++
    domainStats[domain].topics.add(topic)

    if (!topicStats[topic]) {
      topicStats[topic] = { correct: 0, total: 0 }
    }
    topicStats[topic].total++
    if (isCorrect) topicStats[topic].correct++
  }

  console.log('=== Domain Performance ===')
  const sortedDomains = Object.entries(domainStats).sort((a, b) => {
    const pctA = a[1].correct / a[1].total
    const pctB = b[1].correct / b[1].total
    return pctA - pctB // Worst first
  })

  for (const [domain, stats] of sortedDomains) {
    const pct = Math.round(stats.correct / stats.total * 100)
    console.log(`${domain}: ${stats.correct}/${stats.total} (${pct}%)`)
  }

  console.log('')
  console.log('=== Weak Topics (below 50%) ===')
  const weakTopics = Object.entries(topicStats)
    .filter(([_, stats]) => stats.total >= 2 && stats.correct / stats.total < 0.5)
    .sort((a, b) => (a[1].correct / a[1].total) - (b[1].correct / b[1].total))

  for (const [topic, stats] of weakTopics) {
    const pct = Math.round(stats.correct / stats.total * 100)
    console.log(`- ${topic}: ${stats.correct}/${stats.total} (${pct}%)`)
  }

  if (weakTopics.length === 0) {
    console.log('No topics with 2+ questions below 50%')
  }

  console.log('')
  console.log('=== Recommended Study Areas ===')
  // Get worst domains
  const worstDomains = sortedDomains.slice(0, 3)
  console.log('Focus on these domains:')
  for (const [domain, stats] of worstDomains) {
    const pct = Math.round(stats.correct / stats.total * 100)
    console.log(`1. ${domain} (${pct}%) - Topics: ${Array.from(stats.topics).join(', ')}`)
  }
}

getDomainScores()
