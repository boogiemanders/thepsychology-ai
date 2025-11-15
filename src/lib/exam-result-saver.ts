/**
 * Utility for saving exam results to unified question tracking system
 * Called after exams complete to record which questions were answered correctly/incorrectly
 */

import {
  saveQuestionResult,
  addSectionResult,
  resolveSectionResult,
  QuestionResult,
  SectionResult,
} from './unified-question-results'

export interface ExamQuestion {
  id?: string
  question: string
  correct_answer: string
  topic?: string
  domain?: string
  [key: string]: any
}

export interface ExamResultsSummary {
  examType: 'diagnostic' | 'practice' | 'quiz'
  topic: string
  domain: string
  selectedAnswers: Record<number, string>
  questions: ExamQuestion[]
  sessionId?: string
}

/**
 * Save exam results to the unified tracking system
 * This records which questions were answered correctly/incorrectly
 * for the purpose of tracking learning progress and showing green apples
 */
export function saveExamResults(summary: ExamResultsSummary): void {
  if (typeof window === 'undefined') return

  const { examType, topic, domain, selectedAnswers, questions, sessionId } = summary

  console.log(`[Exam Result Saver] Saving ${examType} exam results for topic: ${topic}`)

  questions.forEach((question, index) => {
    const selectedAnswer = selectedAnswers[index]
    if (!selectedAnswer) {
      // Skip unanswered questions
      return
    }

    const isCorrect = selectedAnswer === question.correct_answer

    // Create question result record
    const questionResult: QuestionResult = {
      questionId: question.id || `${topic}_q${index}`,
      question: question.question,
      examType,
      topic,
      domain,
      selectedAnswer,
      correctAnswer: question.correct_answer,
      isCorrect,
      timestamp: Date.now(),
      sessionId,
    }

    saveQuestionResult(questionResult)

    // If question was answered incorrectly, mark the topic's section as needing review
    if (!isCorrect) {
      // For now, we track at the topic level
      // In the future, this could be enhanced to track specific sections
      const sectionResult: SectionResult = {
        sectionName: 'Main Content', // Placeholder - could be enhanced to specific sections
        topicName: topic,
        domain,
        wrongCount: 1,
        lastAttempted: Date.now(),
        isResolved: false,
      }
      addSectionResult(sectionResult)
    } else {
      // If question was answered correctly, check if this resolves any sections
      // This marks the section as "mastered" since user got a question right
      resolveSectionResult(topic, 'Main Content')
    }
  })

  console.log(
    `[Exam Result Saver] Saved ${questions.length} question results for ${topic}`
  )
}

/**
 * Get summary statistics for exam results
 */
export function getExamStats(topic: string) {
  // This can be used to display statistics about exam performance
  // Implementation would depend on the unified results system
  return {
    topic,
    // Stats would go here
  }
}
