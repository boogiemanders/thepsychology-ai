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
import { deriveTopicMetaFromQuestionSource } from './topic-source-utils'

export interface ExamQuestion {
  id?: string
  question: string
  correct_answer: string
  topic?: string
  domain?: string
  // New fields for source tracking and org psych integration
  source_file?: string
  source_folder?: string
  question_type?: 'standard' | 'distinction' | 'difficult'
  is_org_psych?: boolean
  knId?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  isScored?: boolean
  relatedSections?: string[]
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
    const meta = deriveTopicMetaFromQuestionSource(question)
    const topicName =
      question.topic ||
      question.topicName ||
      meta?.topicName ||
      topic
    const domainId =
      question.domain ||
      question.domainId ||
      meta?.domainId ||
      domain
    const sectionCandidates = Array.isArray(question.relatedSections)
      ? question.relatedSections
          .map((section) => (typeof section === 'string' ? section.trim() : ''))
          .filter((section) => section.length > 0)
      : []
    const sections =
      sectionCandidates.length > 0
        ? sectionCandidates
        : meta?.sectionName
          ? [meta.sectionName]
          : ['__ALL__']

    // Create question result record
    const questionResult: QuestionResult = {
      questionId: question.id || `${topic}_q${index}`,
      question: question.question,
      examType,
      topic: topicName,
      domain: domainId,
      selectedAnswer,
      correctAnswer: question.correct_answer,
      isCorrect,
      timestamp: Date.now(),
      sessionId,
    }

    saveQuestionResult(questionResult)

    // If question was answered incorrectly, mark the topic's section as needing review
    if (!isCorrect) {
      sections.forEach((sectionName) => {
        const cleanName = sectionName.trim() || '__ALL__'
        const sectionResult: SectionResult = {
          sectionName: cleanName,
          topicName,
          domain: domainId,
          wrongCount: 1,
          lastAttempted: Date.now(),
          isResolved: false,
        }
        addSectionResult(sectionResult)
      })
    } else {
      // If question was answered correctly, check if this resolves any sections
      // This marks the section as "mastered" since user got a question right
      sections.forEach((sectionName) => {
        const cleanName = sectionName.trim() || '__ALL__'
        resolveSectionResult(topicName, cleanName)
      })
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
