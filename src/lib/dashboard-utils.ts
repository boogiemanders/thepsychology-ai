import { getAllQuizResults, QuizResult } from './quiz-results-storage'

export interface StudyStats {
  totalQuizzes: number
  averageScore: number
  studyStreak: number
  lastStudyDate: Date | null
  bestPerformingDomain: string
  recentScores: number[]
  weakTopics: { topic: string; score: number }[]
  lastStudiedTopic: string | null
  studyDays: Date[]
}

export function calculateStudyStats(): StudyStats {
  const allResults = getAllQuizResults()

  if (allResults.length === 0) {
    return {
      totalQuizzes: 0,
      averageScore: 0,
      studyStreak: 0,
      lastStudyDate: null,
      bestPerformingDomain: '',
      recentScores: [],
      weakTopics: [],
      lastStudiedTopic: null,
      studyDays: [],
    }
  }

  // Sort by timestamp (most recent first)
  const sortedResults = [...allResults].sort((a, b) => b.timestamp - a.timestamp)

  // Calculate total quizzes
  const totalQuizzes = allResults.length

  // Calculate average score
  const totalScore = allResults.reduce((sum, result) => sum + (result.score / result.totalQuestions) * 100, 0)
  const averageScore = Math.round(totalScore / totalQuizzes)

  // Get recent scores (last 10)
  const recentScores = sortedResults
    .slice(0, 10)
    .map(result => Math.round((result.score / result.totalQuestions) * 100))
    .reverse() // Oldest to newest for chart

  // Calculate study streak
  const studyStreak = calculateStreak(allResults)

  // Get last study date
  const lastStudyDate = sortedResults.length > 0 ? new Date(sortedResults[0].timestamp) : null

  // Get last studied topic
  const lastStudiedTopic = sortedResults.length > 0 ? sortedResults[0].topic : null

  // Calculate best performing domain
  const domainScores = calculateDomainScores(allResults)
  const bestPerformingDomain = domainScores.length > 0
    ? domainScores.sort((a, b) => b.score - a.score)[0].domain
    : ''

  // Find weak topics (< 60%)
  const topicScores = calculateTopicScores(allResults)
  const weakTopics = topicScores
    .filter(t => t.score < 60)
    .sort((a, b) => a.score - b.score)
    .slice(0, 5)

  // Get unique study days
  const studyDays = getUniqueStudyDays(allResults)

  return {
    totalQuizzes,
    averageScore,
    studyStreak,
    lastStudyDate,
    bestPerformingDomain,
    recentScores,
    weakTopics,
    lastStudiedTopic,
    studyDays,
  }
}

function calculateStreak(results: QuizResult[]): number {
  if (results.length === 0) return 0

  // Get unique study dates (dates with at least one quiz)
  const studyDates = results
    .map(r => {
      const date = new Date(r.timestamp)
      date.setHours(0, 0, 0, 0)
      return date.getTime()
    })
    .filter((date, index, self) => self.indexOf(date) === index)
    .sort((a, b) => b - a) // Most recent first

  if (studyDates.length === 0) return 0

  // Check if today or yesterday is in the list
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const mostRecentStudy = studyDates[0]
  if (mostRecentStudy !== today.getTime() && mostRecentStudy !== yesterday.getTime()) {
    return 0 // Streak is broken
  }

  // Count consecutive days
  let streak = 0
  let currentDate = new Date(today)
  currentDate.setHours(0, 0, 0, 0)

  for (const studyDate of studyDates) {
    if (studyDate === currentDate.getTime()) {
      streak++
      currentDate.setDate(currentDate.getDate() - 1)
    } else if (studyDate < currentDate.getTime()) {
      break // Gap found
    }
  }

  return streak
}

function calculateDomainScores(results: QuizResult[]): { domain: string; score: number }[] {
  const topicsByDomain: Record<number, string> = {
    0: 'Biological Bases',
    1: 'Cognitive-Affective',
    2: 'Social & Cultural',
    3: 'Growth & Lifespan',
    4: 'Assessment & Diagnosis',
    5: 'Treatment & Intervention',
    6: 'Research & Statistics',
    7: 'Ethical & Legal',
  }

  const topicsToDomain: Record<string, string> = {
    'Neurotransmitters & Receptors': 'Biological Bases',
    'Brain Anatomy & Function': 'Biological Bases',
    'Nervous System Organization': 'Biological Bases',
    'Psychopharmacology': 'Biological Bases',
    'Sleep & Circadian Rhythms': 'Biological Bases',
    'Classical & Operant Conditioning': 'Cognitive-Affective',
    'Observational Learning': 'Cognitive-Affective',
    'Memory Systems & Encoding': 'Cognitive-Affective',
    'Attention & Consciousness': 'Cognitive-Affective',
    'Motivation & Emotion': 'Cognitive-Affective',
    'Social Cognition & Attitudes': 'Social & Cultural',
    'Group Dynamics & Conformity': 'Social & Cultural',
    'Cultural Psychology': 'Social & Cultural',
    'Organizational Psychology': 'Social & Cultural',
    'Diversity & Multicultural Issues': 'Social & Cultural',
    'Physical Development': 'Growth & Lifespan',
    'Cognitive Development': 'Growth & Lifespan',
    'Psychosocial Development': 'Growth & Lifespan',
    'Moral Development': 'Growth & Lifespan',
    'Aging & Late Adulthood': 'Growth & Lifespan',
    'Psychological Testing Principles': 'Assessment & Diagnosis',
    'Intelligence Assessment': 'Assessment & Diagnosis',
    'Personality Assessment': 'Assessment & Diagnosis',
    'Clinical Diagnosis & Psychopathology': 'Assessment & Diagnosis',
    'Substance Use Disorders': 'Assessment & Diagnosis',
    'Cognitive-Behavioral Therapies': 'Treatment & Intervention',
    'Psychodynamic Therapies': 'Treatment & Intervention',
    'Humanistic & Experiential Therapies': 'Treatment & Intervention',
    'Group & Family Therapy': 'Treatment & Intervention',
    'Evidence-Based Interventions': 'Treatment & Intervention',
    'Research Design & Methodology': 'Research & Statistics',
    'Experimental vs Non-Experimental': 'Research & Statistics',
    'Descriptive Statistics': 'Research & Statistics',
    'Inferential Statistics': 'Research & Statistics',
    'Effect Size & Power': 'Research & Statistics',
    'Ethical Principles & Guidelines': 'Ethical & Legal',
    'Confidentiality & Privacy': 'Ethical & Legal',
    'Informed Consent': 'Ethical & Legal',
    'Competence & Boundaries': 'Ethical & Legal',
    'Legal Liability & Licensing': 'Ethical & Legal',
  }

  const domainScores: Record<string, { total: number; count: number }> = {}

  results.forEach(result => {
    const domain = topicsToDomain[result.topic] || 'Unknown'
    if (!domainScores[domain]) {
      domainScores[domain] = { total: 0, count: 0 }
    }
    const percentage = (result.score / result.totalQuestions) * 100
    domainScores[domain].total += percentage
    domainScores[domain].count += 1
  })

  return Object.entries(domainScores).map(([domain, { total, count }]) => ({
    domain,
    score: Math.round(total / count),
  }))
}

function calculateTopicScores(results: QuizResult[]): { topic: string; score: number }[] {
  const topicScores: Record<string, { total: number; count: number }> = {}

  results.forEach(result => {
    if (!topicScores[result.topic]) {
      topicScores[result.topic] = { total: 0, count: 0 }
    }
    const percentage = (result.score / result.totalQuestions) * 100
    topicScores[result.topic].total += percentage
    topicScores[result.topic].count += 1
  })

  return Object.entries(topicScores).map(([topic, { total, count }]) => ({
    topic,
    score: Math.round(total / count),
  }))
}

function getUniqueStudyDays(results: QuizResult[]): Date[] {
  const dates = results
    .map(r => {
      const date = new Date(r.timestamp)
      date.setHours(0, 0, 0, 0)
      return date.getTime()
    })
    .filter((date, index, self) => self.indexOf(date) === index)
    .sort((a, b) => a - b)
    .map(timestamp => new Date(timestamp))

  return dates
}

export interface StudyPaceInfo {
  pace: 'On track' | 'Behind' | 'Ahead' | 'Unknown'
  topicsPerWeek: number
  daysRemaining: number
  topicsCompleted: number
  totalTopics: number
}

export function calculateStudyPace(examDate: string | null, completedTopics: number): StudyPaceInfo {
  const totalTopics = 56

  if (!examDate) {
    return {
      pace: 'Unknown',
      topicsPerWeek: 0,
      daysRemaining: 0,
      topicsCompleted: completedTopics,
      totalTopics,
    }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const exam = new Date(examDate)
  exam.setHours(0, 0, 0, 0)

  const daysRemaining = Math.max(0, Math.ceil((exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
  const weeksRemaining = daysRemaining / 7

  if (weeksRemaining <= 0) {
    return {
      pace: 'Unknown',
      topicsPerWeek: 0,
      daysRemaining: 0,
      topicsCompleted: completedTopics,
      totalTopics,
    }
  }

  const topicsRemaining = totalTopics - completedTopics
  const topicsPerWeek = Math.ceil(topicsRemaining / weeksRemaining)

  // Calculate pace based on ideal progress
  const idealCompletedTopics = (totalTopics * (1 - weeksRemaining / (daysRemaining / 7)))

  let pace: 'On track' | 'Behind' | 'Ahead' = 'On track'
  if (completedTopics < idealCompletedTopics * 0.9) {
    pace = 'Behind'
  } else if (completedTopics > idealCompletedTopics * 1.1) {
    pace = 'Ahead'
  }

  return {
    pace,
    topicsPerWeek,
    daysRemaining,
    topicsCompleted: completedTopics,
    totalTopics,
  }
}

// Daily goal management
export function getDailyGoal(): number {
  if (typeof window === 'undefined') return 2
  const goal = localStorage.getItem('dailyQuizGoal')
  return goal ? parseInt(goal, 10) : 2
}

export function setDailyGoal(goal: number): void {
  if (typeof window === 'undefined') return
  // Validate goal is between 1 and 7
  const validatedGoal = Math.max(1, Math.min(7, Math.round(goal)))
  localStorage.setItem('dailyQuizGoal', validatedGoal.toString())
}

export function getTodayQuizCount(): number {
  const allResults = getAllQuizResults()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return allResults.filter(result => {
    const resultDate = new Date(result.timestamp)
    resultDate.setHours(0, 0, 0, 0)
    return resultDate.getTime() === today.getTime()
  }).length
}
