// Priority Calculator
// Calculates priority scores based on: (% wrong in domain) × (domain weight)
// Used by: prioritizer to rank domains and recommend topics

import { KN_BY_DOMAIN, DOMAIN_WEIGHTS, KN_DATA, type KnowledgeStatement } from "./kn-data"
import { KN_TOPIC_MAPPING } from "./kn-topic-mapping"
import type { WrongAnswer } from "./quiz-results-storage"
import type { PriorityDomainRecommendation, WrongKNInfo, RecommendedTopic } from "./priority-storage"
import { EPPP_DOMAINS } from "./eppp-data"

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
  wrongSourceFiles: string[] // source files from incorrect/skipped questions
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
 * Now properly handles practice exams by counting actual questions per domain
 */
export function calculateDomainPerformance(
  wrongAnswers: (WrongAnswer & { domain?: string; source_file?: string })[]
): DomainPerformance[] {
  const domainData: Record<number, { wrong: number; total: number; wrongKNs: Set<string>; wrongFiles: Set<string> }> = {}

  // Initialize domain data with proper question counts for practice exams
  // Practice exam distribution: Domain 1: 23, Domain 2: 29, Domain 3: 25, Domain 4: 27,
  // Domain 5: 36, Domain 6: 34, Domain 7: 18, Domain 8: 33
  const PRACTICE_EXAM_QUESTION_COUNTS: Record<number, number> = {
    1: 23,
    2: 29,
    3: 25,
    4: 27,
    5: 36,
    6: 34,
    7: 18,
    8: 33,
  }

  for (let i = 1; i <= 8; i++) {
    domainData[i] = {
      wrong: 0,
      total: PRACTICE_EXAM_QUESTION_COUNTS[i],
      wrongKNs: new Set(),
      wrongFiles: new Set(),
    }
  }

  // Count wrong answers per domain
  for (const wrongAnswer of wrongAnswers) {
    // First try to get domain from domain metadata
    let domain: number | null = null

    if (wrongAnswer.domain) {
      // Extract domain number from domain name like "Domain 1: Biological Bases of Behavior"
      const match = wrongAnswer.domain.match(/Domain (\d+)/)
      domain = match ? parseInt(match[1]) : null
    }

    // Fallback: Try to extract KN from questionId for diagnostic exams
    if (!domain) {
      const knId = `KN${wrongAnswer.questionId}`
      const kn = KN_DATA[knId]
      if (kn) {
        domain = kn.domain
      }
    }

    if (domain && domain >= 1 && domain <= 8) {
      domainData[domain].wrong++
      if (wrongAnswer.source_file) {
        domainData[domain].wrongFiles.add(wrongAnswer.source_file)
      }
    }
  }

  // Calculate performance metrics
  const performance: DomainPerformance[] = []

  for (let i = 1; i <= 8; i++) {
    const data = domainData[i]
    const percentageWrong = (data.wrong / data.total) * 100
    const domainWeight = DOMAIN_WEIGHTS[i]
    const priorityScore = percentageWrong * domainWeight // % wrong × weight (both as decimals 0-1)

    performance.push({
      domainNumber: i,
      domainName: DOMAIN_NAMES[i],
      domainWeight: domainWeight * 100, // Convert to percentage for display
      totalQuestionsInDomain: data.total,
      totalWrongInDomain: data.wrong,
      percentageWrong: Math.round(percentageWrong * 100) / 100, // Round to 2 decimals
      priorityScore: Math.round(priorityScore * 10000) / 100, // Round to 2 decimals (as percentage points)
      wrongSourceFiles: Array.from(data.wrongFiles), // Include source files from incorrect/skipped questions
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
  wrongAnswers: (WrongAnswer & { knId?: string })[]
): WrongKNInfo[] {
  const wrongKNs = wrongAnswers
    .map((answer) => {
      // Use knId from question if available (practice exams), else fall back to questionId (diagnostic exams)
      const knId = answer.knId || `KN${answer.questionId}`
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
 * Convert topic IDs to RecommendedTopic objects with topic names and domain IDs
 * Strips leading numbers from topic names (e.g., "1 Brain Regions" → "Brain Regions")
 */
export function convertTopicIdsToTopicNames(topicIds: string[]): RecommendedTopic[] {
  const recommendedTopics: RecommendedTopic[] = []

  topicIds.forEach((topicId) => {
    // Find the domain that contains this topic ID
    const domain = EPPP_DOMAINS.find((d) => {
      const [domainPart] = topicId.split('-')
      return d.id === domainPart || d.id.includes(domainPart)
    })

    if (domain) {
      // Extract topic index from topicId (format: "domainId-index")
      const parts = topicId.split('-')
      const topicIndex = parseInt(parts[parts.length - 1])

      if (topicIndex >= 0 && topicIndex < domain.topics.length) {
        const topicName = domain.topics[topicIndex].name
        // Strip leading number if present (e.g., "1 Brain Regions" → "Brain Regions")
        const cleanedName = topicName.replace(/^\d+\s+/, '')

        recommendedTopics.push({
          topicName: cleanedName,
          domainId: domain.id,
        })
      }
    }
  })

  return recommendedTopics
}

/**
 * Extract organizational psychology topics from source file names
 * Directly uses source file names as topic names instead of trying to match to EPPP_DOMAINS
 * This ensures all source files from incorrect org psych answers appear as recommendations
 * e.g., "2 Theories of Motivation.md" → "Theories of Motivation"
 */
export function extractOrgPsychTopicsFromSourceFiles(sourceFiles: string[]): RecommendedTopic[] {
  const orgPsychDomain = EPPP_DOMAINS.find((d) => d.id === '3-5-6')
  if (!orgPsychDomain) return []

  const recommendedTopics: RecommendedTopic[] = []
  const addedTopics = new Set<string>()

  sourceFiles.forEach((sourceFile) => {
    if (!sourceFile) return

    // Strip domain prefix from filename (e.g., "2 ", "5 6 ", "2 3 ")
    // Match patterns like "2 ", "5 6 ", "2 3 ", "3 5 6 " at the start
    const cleanedName = sourceFile.replace(/^[\d\s]+/, '').replace(/\.md$/, '')

    // Use source file name directly as topic (don't try to match to EPPP_DOMAINS topics)
    // This ensures all source files from wrong answers appear as recommendations
    if (!addedTopics.has(cleanedName)) {
      addedTopics.add(cleanedName)
      recommendedTopics.push({
        topicName: cleanedName,
        domainId: '3-5-6',
      })
    }
  })

  return recommendedTopics
}

/**
 * Convert source file names to RecommendedTopic objects for regular domains
 * Directly uses source file names as topic names instead of trying to match to EPPP_DOMAINS
 * This ensures all source files from incorrect answers appear as recommendations
 * e.g., "1 Brain Regions.md" → topic name "Brain Regions"
 */
export function convertSourceFilesToTopicNames(sourceFiles: string[], domainNumber: number): RecommendedTopic[] {
  const domain = EPPP_DOMAINS.find((d) => {
    // Find domain by matching domain number in the id
    const idStart = d.id.split('-')[0]
    return idStart === String(domainNumber)
  })

  if (!domain) return []

  const recommendedTopics: RecommendedTopic[] = []
  const addedTopics = new Set<string>()

  sourceFiles.forEach((sourceFile) => {
    if (!sourceFile) return

    // Strip domain prefix and .md extension to get clean topic name
    // e.g., "1 Brain Regions.md" → "Brain Regions"
    const cleanTopicName = sourceFile.replace(/^[\d\s]+/, '').replace(/\.md$/, '')

    // Use source file name directly as topic (don't try to match to EPPP_DOMAINS topics)
    // This ensures all source files from wrong answers appear as recommendations
    if (!addedTopics.has(cleanTopicName)) {
      addedTopics.add(cleanTopicName)
      recommendedTopics.push({
        topicName: cleanTopicName,
        domainId: domain.id,
      })
    }
  })

  return recommendedTopics
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
    const recommendedTopicIds = getRecommendedTopicsForDomain(perf.domainNumber, wrongKNs)
    const recommendedTopics = convertTopicIdsToTopicNames(recommendedTopicIds)

    return {
      domainNumber: perf.domainNumber,
      domainName: perf.domainName,
      domainWeight: perf.domainWeight / 100, // Convert back to decimal
      percentageWrong: perf.percentageWrong,
      priorityScore: perf.priorityScore,
      wrongKNs,
      recommendedTopicIds,
      recommendedTopics,
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
    const recommendedTopicIds = getRecommendedTopicsForDomain(perf.domainNumber, wrongKNs)
    const recommendedTopics = convertTopicIdsToTopicNames(recommendedTopicIds)

    return {
      domainNumber: perf.domainNumber,
      domainName: perf.domainName,
      domainWeight: perf.domainWeight / 100, // Convert back to decimal
      percentageWrong: perf.percentageWrong,
      priorityScore: perf.priorityScore,
      wrongKNs,
      recommendedTopicIds,
      recommendedTopics,
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

/**
 * Calculate organizational psychology performance
 * Org psych comprises 21% of the exam and is distributed across domains 2, 3, 5, 6
 */
export interface OrgPsychPerformance {
  label: string
  weight: number
  totalQuestionsInOrgPsych: number
  totalWrongInOrgPsych: number
  percentageWrong: number
  priorityScore: number // percentageWrong * weight
  wrongSourceFiles: string[]
}

export function calculateOrgPsychPerformance(
  wrongAnswers: (WrongAnswer & { is_org_psych?: boolean; source_file?: string })[]
): OrgPsychPerformance {
  const ORG_PSYCH_WEIGHT = 0.21 // 21% of exam

  const orgPsychWrong = wrongAnswers.filter((a) => a.is_org_psych === true)
  const wrongSourceFiles = new Set(orgPsychWrong.map((a) => a.source_file).filter(Boolean))

  // For calculation, we use actual org psych questions in the practice exam
  // Practice exam: 44 questions (marked as is_org_psych: true)
  const totalOrgPsychQuestions = 44 // Based on exam generation

  const percentageWrong = (orgPsychWrong.length / totalOrgPsychQuestions) * 100
  const priorityScore = percentageWrong * ORG_PSYCH_WEIGHT // % wrong × weight

  return {
    label: "Organizational Psychology",
    weight: ORG_PSYCH_WEIGHT * 100, // Convert to percentage (21%)
    totalQuestionsInOrgPsych: totalOrgPsychQuestions,
    totalWrongInOrgPsych: orgPsychWrong.length,
    percentageWrong: Math.round(percentageWrong * 100) / 100, // Round to 2 decimals
    priorityScore: Math.round(priorityScore * 10000) / 100, // Round to 2 decimals (as percentage points)
    wrongSourceFiles: Array.from(wrongSourceFiles),
  }
}

/**
 * Get top 3 priority areas from all 9 areas (8 domains + org psych)
 * Ranks all areas by priority score and returns top 3
 */
export interface PriorityArea {
  label: string
  type: 'domain' | 'org_psych'
  domainNumber?: number
  weight: number
  percentageWrong: number
  priorityScore: number
  wrongKNs?: WrongKNInfo[]
  wrongSourceFiles?: string[]
}

export function getTopPriorityAreas(
  domainPerformance: DomainPerformance[],
  orgPsychPerformance: OrgPsychPerformance
): PriorityArea[] {
  // Convert domain performance to priority areas
  const domainAreas: PriorityArea[] = domainPerformance.map((perf) => ({
    label: perf.domainName,
    type: 'domain',
    domainNumber: perf.domainNumber,
    weight: perf.domainWeight,
    percentageWrong: perf.percentageWrong,
    priorityScore: perf.priorityScore,
    wrongSourceFiles: perf.wrongSourceFiles || [],
  }))

  // Add org psych as a priority area
  const orgPsychArea: PriorityArea = {
    label: orgPsychPerformance.label,
    type: 'org_psych',
    weight: orgPsychPerformance.weight,
    percentageWrong: orgPsychPerformance.percentageWrong,
    priorityScore: orgPsychPerformance.priorityScore,
    wrongSourceFiles: orgPsychPerformance.wrongSourceFiles,
  }

  // Combine all 9 areas and rank by priority score
  const allAreas = [...domainAreas, orgPsychArea]
  return allAreas.sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 3)
}

/**
 * Main priority calculation function
 * Called after exam completion to determine priority areas
 */
export function calculatePriorities(examResults: {
  questions: Array<{
    knId?: string
    is_org_psych?: boolean
    source_file?: string
    correct_answer?: string
    [key: string]: any
  }>
  selectedAnswers: Record<number, string>
  totalQuestions: number
}) {
  // Convert exam results to wrong answers format
  const wrongAnswers: Array<WrongAnswer & { is_org_psych?: boolean; source_file?: string }> = []

  examResults.questions.forEach((question, index) => {
    const selectedAnswer = examResults.selectedAnswers[index]

    // Count both incorrect AND skipped questions (undefined selectedAnswer)
    if (selectedAnswer !== question.correct_answer) {
      wrongAnswers.push({
        questionId: index + 1,
        domain: question.domain,
        is_org_psych: question.is_org_psych,
        source_file: question.source_file,
        ...question,
      })
    }
  })

  // Calculate domain and org psych performance
  const domainPerformance = calculateDomainPerformance(wrongAnswers)
  const orgPsychPerformance = calculateOrgPsychPerformance(wrongAnswers)

  // Get top 3 priority areas (8 domains + org psych)
  const topPriorityAreas = getTopPriorityAreas(domainPerformance, orgPsychPerformance)

  // Get detailed recommendations for top 3 areas (including org psych if it ranks in top 3)
  const topPriorities: any[] = topPriorityAreas.map((area) => {
    if (area.type === 'org_psych') {
      // Extract org psych topics from wrong source files
      const recommendedTopics = extractOrgPsychTopicsFromSourceFiles(area.wrongSourceFiles || [])

      return {
        type: 'org_psych',
        domainName: area.label,
        domainWeight: area.weight / 100,
        percentageWrong: area.percentageWrong,
        priorityScore: area.priorityScore,
        wrongSourceFiles: area.wrongSourceFiles || [],
        wrongKNs: [],
        recommendedTopicIds: [],
        recommendedTopics,
      }
    } else {
      // Regular domain - use source files for recommended topics
      const wrongKNs = getWrongKNsForDomain(area.domainNumber!, wrongAnswers)
      const recommendedTopics = convertSourceFilesToTopicNames(area.wrongSourceFiles || [], area.domainNumber!)

      return {
        type: 'domain',
        domainNumber: area.domainNumber!,
        domainName: area.label,
        domainWeight: area.weight / 100,
        percentageWrong: area.percentageWrong,
        priorityScore: area.priorityScore,
        wrongKNs,
        recommendedTopicIds: [],
        recommendedTopics,
        wrongSourceFiles: area.wrongSourceFiles,
      }
    }
  })

  // Get all domain results
  const allResults = getAllDomainResults(wrongAnswers)

  return {
    topPriorities,
    allResults,
    topPriorityAreas,
    orgPsychPerformance,
    score: examResults.questions.length - wrongAnswers.length,
    totalQuestions: examResults.totalQuestions,
  }
}
