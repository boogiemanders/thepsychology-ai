// Priority Calculator
// Calculates priority scores based on: (% wrong in domain) × (domain weight)
// Used by: prioritizer to rank domains and recommend topics

import { KN_BY_DOMAIN, DOMAIN_WEIGHTS, KN_DATA, type KnowledgeStatement } from "./kn-data"
import { KN_TOPIC_MAPPING } from "./kn-topic-mapping"
import type { WrongAnswer } from "./quiz-results-storage"
import type { PriorityDomainRecommendation, WrongKNInfo } from "./priority-storage"

const DOMAIN_NAMES: Record<number, string> = {
  1: "Biological Bases of Behavior",
  2: "Cognitive-Affective Bases of Behavior",
  3: "Social Psychology & Cultural Aspects",
  4: "Growth & Lifespan Development",
  5: "Assessment, Diagnosis & Psychopathology",
  6: "Treatment & Intervention",
  7: "Research Methods & Statistics",
  8: "Ethical, Legal & Professional Issues",
}

export interface DomainPerformance {
  domainNumber: number
  domainName: string
  domainWeight: number
  totalQuestionsInDomain: number
  totalWrongInDomain: number
  percentageWrong: number
  priorityScore: number // percentageWrong * domainWeight
}

/**
 * Parse question/wrong answer to determine which domain/KN it belongs to
 * Strategy: Search for domain number in question text or use QuizResults metadata
 */
export function getKNFromQuestion(questionId: number, questionText: string): string | null {
  // For diagnostic exams, questionId directly maps to KN (Q1=KN1, Q2=KN2, etc.)
  if (questionId >= 1 && questionId <= 71) {
    return `KN${questionId}`
  }

  // For practice exams, we need to infer from the question or domain metadata
  // This would require additional metadata in the question structure
  // For now, return null and handle at the prioritizer level
  return null
}

/**
 * Calculate domain performance based on wrong answers
 */
export function calculateDomainPerformance(wrongAnswers: WrongAnswer[]): DomainPerformance[] {
  const domainData: Record<number, { wrong: number; total: number; wrongKNs: Set<string> }> = {}

  // Initialize domain data
  for (let i = 1; i <= 8; i++) {
    domainData[i] = {
      wrong: 0,
      total: KN_BY_DOMAIN[i].length,
      wrongKNs: new Set(),
    }
  }

  // Count wrong answers per domain
  for (const wrongAnswer of wrongAnswers) {
    // Try to extract KN from questionId (for diagnostic exams)
    const knId = `KN${wrongAnswer.questionId}`
    const kn = KN_DATA[knId]

    if (kn) {
      const domain = kn.domain
      domainData[domain].wrong++
      domainData[domain].wrongKNs.add(knId)
    }
  }

  // Calculate performance metrics
  const performance: DomainPerformance[] = []

  for (let i = 1; i <= 8; i++) {
    const data = domainData[i]
    const percentageWrong = (data.wrong / data.total) * 100
    const domainWeight = DOMAIN_WEIGHTS[i]
    const priorityScore = (percentageWrong / 100) * domainWeight * 100 // Convert to percentage points

    performance.push({
      domainNumber: i,
      domainName: DOMAIN_NAMES[i],
      domainWeight: domainWeight * 100, // Convert to percentage
      totalQuestionsInDomain: data.total,
      totalWrongInDomain: data.wrong,
      percentageWrong: Math.round(percentageWrong),
      priorityScore: Math.round(priorityScore * 100) / 100, // Round to 2 decimals
    })
  }

  return performance
}

/**
 * Get top 3 priority domains sorted by priority score (highest first)
 */
export function getTopPriorityDomains(performance: DomainPerformance[]): DomainPerformance[] {
  return performance.sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 3)
}

/**
 * Get wrong KNs for a specific domain
 */
export function getWrongKNsForDomain(
  domainNumber: number,
  wrongAnswers: WrongAnswer[]
): WrongKNInfo[] {
  const wrongKNs = wrongAnswers
    .map((answer) => {
      const knId = `KN${answer.questionId}`
      const kn = KN_DATA[knId]
      return kn && kn.domain === domainNumber ? { knId, kn } : null
    })
    .filter((item): item is { knId: string; kn: KnowledgeStatement } => item !== null)

  // Deduplicate and calculate percentage wrong
  const uniqueWrongKNs = new Map<string, KnowledgeStatement>()
  wrongKNs.forEach(({ knId, kn }) => {
    uniqueWrongKNs.set(knId, kn)
  })

  return Array.from(uniqueWrongKNs.entries()).map(([knId, kn]) => ({
    knId,
    knName: kn.name,
    percentageWrong: 100, // If it appears in wrongAnswers, it was completely wrong
  }))
}

/**
 * Get recommended topics for a domain based on wrong KNs
 */
export function getRecommendedTopicsForDomain(domainNumber: number, wrongKNs: WrongKNInfo[]): string[] {
  const topicIds = new Set<string>()

  // Get all topics mapped to wrong KNs
  wrongKNs.forEach((wrongKN) => {
    const mappedTopics = KN_TOPIC_MAPPING[wrongKN.knId] || []
    mappedTopics.forEach((topicId) => topicIds.add(topicId))
  })

  // If no specific topics from wrong KNs, get all topics for this domain
  if (topicIds.size === 0) {
    const knIds = KN_BY_DOMAIN[domainNumber] || []
    knIds.forEach((knId) => {
      const mappedTopics = KN_TOPIC_MAPPING[knId] || []
      mappedTopics.forEach((topicId) => topicIds.add(topicId))
    })
  }

  return Array.from(topicIds)
}

/**
 * Build priority domain recommendations (used by prioritizer)
 */
export function buildPriorityRecommendations(
  wrongAnswers: WrongAnswer[],
  totalQuestions: number
): PriorityDomainRecommendation[] {
  const performance = calculateDomainPerformance(wrongAnswers)
  const topPriorities = getTopPriorityDomains(performance)

  return topPriorities.map((perf) => {
    const wrongKNs = getWrongKNsForDomain(perf.domainNumber, wrongAnswers)
    const recommendedTopics = getRecommendedTopicsForDomain(perf.domainNumber, wrongKNs)

    return {
      domainNumber: perf.domainNumber,
      domainName: perf.domainName,
      domainWeight: perf.domainWeight / 100, // Convert back to decimal
      percentageWrong: perf.percentageWrong,
      priorityScore: perf.priorityScore,
      wrongKNs,
      recommendedTopicIds: recommendedTopics,
    }
  })
}

/**
 * Get all domain results (including non-priority domains)
 */
export function getAllDomainResults(wrongAnswers: WrongAnswer[]): PriorityDomainRecommendation[] {
  const performance = calculateDomainPerformance(wrongAnswers)

  return performance.map((perf) => {
    const wrongKNs = getWrongKNsForDomain(perf.domainNumber, wrongAnswers)
    const recommendedTopics = getRecommendedTopicsForDomain(perf.domainNumber, wrongKNs)

    return {
      domainNumber: perf.domainNumber,
      domainName: perf.domainName,
      domainWeight: perf.domainWeight / 100, // Convert back to decimal
      percentageWrong: perf.percentageWrong,
      priorityScore: perf.priorityScore,
      wrongKNs,
      recommendedTopicIds: recommendedTopics,
    }
  })
}

/**
 * Calculate overall score improvement suggestion
 * Returns array of recommendations to improve the score
 */
export function getImprovementSuggestions(performance: DomainPerformance[]): {
  domain: string
  focusAreas: string[]
}[] {
  const topThree = getTopPriorityDomains(performance)

  return topThree.map((domain) => {
    const suggestions: string[] = []

    if (domain.percentageWrong > 50) {
      suggestions.push("This is a major weak area - recommend intensive study")
    } else if (domain.percentageWrong > 30) {
      suggestions.push("This domain needs focused review")
    } else if (domain.percentageWrong > 10) {
      suggestions.push("Minor gaps detected - targeted practice recommended")
    }

    return {
      domain: domain.domainName,
      focusAreas: suggestions,
    }
  })
}
