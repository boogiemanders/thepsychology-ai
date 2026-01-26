// Priority Recommendations Storage
// Stores and retrieves priority recommendations from diagnostic/practice exam results
// Used by: prioritizer (shows recommendations), dashboard/topic-selector (shows badges)

export interface WrongKNInfo {
  knId: string
  knName: string
  percentageWrong: number // e.g., 50 for 50%
}

export interface RecommendedTopic {
  topicName: string // Topic name or source_file name
  sourceFile?: string // Source file name (e.g., "5 Anxiety Disorders.md") for linking
  domainId: string // Domain ID for routing to topic-teacher
  topicContentFormat?: string // Kebab-case format for linking to topic-content-v4
}

export interface PriorityDomainRecommendation {
  domainNumber: number // 1-8
  domainName: string
  domainWeight: number // e.g., 0.10 for 10%
  percentageWrong: number // Percentage of domain questions answered wrong
  priorityScore: number // percentageWrong * domainWeight
  wrongKNs: WrongKNInfo[]
  recommendedTopicIds: string[] // Topic IDs to study (deprecated, use recommendedTopics)
  recommendedTopics?: RecommendedTopic[] // Recommended topics with names and domain routing
}

export interface PriorityRecommendation {
  id: string // Unique ID
  userId?: string // Supabase user ID (optional)
  examType: "diagnostic" | "practice"
  examMode: "study" | "test"
  timestamp: number
  topPriorities: PriorityDomainRecommendation[] // Top 3 domains sorted by priority score
  allResults: PriorityDomainRecommendation[] // All 8 domains for reference
}

const PRIORITY_RECOMMENDATIONS_KEY = "priorityRecommendations"

/**
 * Save a priority recommendation
 */
export function savePriorityRecommendation(recommendation: Omit<PriorityRecommendation, "id" | "timestamp">): PriorityRecommendation {
  if (typeof window === "undefined") {
    return { ...recommendation, id: "", timestamp: Date.now() }
  }

  const rec: PriorityRecommendation = {
    ...recommendation,
    id: crypto.randomUUID?.() || `priority-${Date.now()}`,
    timestamp: Date.now(),
  }

  // Store the latest recommendation by exam type
  const key = `${PRIORITY_RECOMMENDATIONS_KEY}_latest_${recommendation.examType}`
  localStorage.setItem(key, JSON.stringify(rec))

  // Also store in history array
  const historyKey = `${PRIORITY_RECOMMENDATIONS_KEY}_history`
  const history = getRecommendationHistory()
  history.push(rec)
  localStorage.setItem(historyKey, JSON.stringify(history))

  // Dispatch event to notify listeners
  window.dispatchEvent(
    new CustomEvent("priority-recommendations-updated", {
      detail: { recommendation: rec },
    })
  )

  return rec
}

/**
 * Get the latest priority recommendation for an exam type
 */
export function getLatestRecommendation(examType: "diagnostic" | "practice"): PriorityRecommendation | null {
  if (typeof window === "undefined") return null

  const key = `${PRIORITY_RECOMMENDATIONS_KEY}_latest_${examType}`
  const data = localStorage.getItem(key)
  return data ? JSON.parse(data) : null
}

/**
 * Get all priority recommendations (history)
 */
export function getRecommendationHistory(): PriorityRecommendation[] {
  if (typeof window === "undefined") return []

  const key = `${PRIORITY_RECOMMENDATIONS_KEY}_history`
  const data = localStorage.getItem(key)
  const history: PriorityRecommendation[] = data ? JSON.parse(data) : []

  // Sort by timestamp descending (most recent first)
  return history.sort((a, b) => b.timestamp - a.timestamp)
}

/**
 * Get all recommended topic IDs from latest recommendation
 */
export function getRecommendedTopicIds(examType: "diagnostic" | "practice"): string[] {
  const rec = getLatestRecommendation(examType)
  if (!rec) return []

  const topicIds = new Set<string>()
  rec.topPriorities.forEach((domain) => {
    domain.recommendedTopicIds.forEach((id) => topicIds.add(id))
  })

  return Array.from(topicIds)
}

/**
 * Get KNs that were wrong in a specific domain from latest recommendation
 */
export function getWrongKNsInDomain(examType: "diagnostic" | "practice", domainNumber: number): WrongKNInfo[] {
  const rec = getLatestRecommendation(examType)
  if (!rec) return []

  const domain = rec.allResults.find((d) => d.domainNumber === domainNumber)
  return domain ? domain.wrongKNs : []
}

/**
 * Get the top 3 priority domains
 */
export function getTopPriorities(examType: "diagnostic" | "practice"): PriorityDomainRecommendation[] {
  const rec = getLatestRecommendation(examType)
  return rec ? rec.topPriorities : []
}

/**
 * Check if a topic is recommended
 */
export function isTopicRecommended(topicId: string, examType: "diagnostic" | "practice"): boolean {
  return getRecommendedTopicIds(examType).includes(topicId)
}

/**
 * Clear priority recommendations (for testing/reset)
 */
export function clearPriorityRecommendations(): void {
  if (typeof window === "undefined") return

  localStorage.removeItem(`${PRIORITY_RECOMMENDATIONS_KEY}_latest_diagnostic`)
  localStorage.removeItem(`${PRIORITY_RECOMMENDATIONS_KEY}_latest_practice`)
  localStorage.removeItem(`${PRIORITY_RECOMMENDATIONS_KEY}_history`)

  window.dispatchEvent(new CustomEvent("priority-recommendations-cleared", {}))
}

/**
 * Get priority badge info for a topic (for displaying in UI)
 * Returns the domain and rank if this topic is recommended, null otherwise
 */
export function getPriorityBadgeInfo(
  topicId: string,
  examType: "diagnostic" | "practice"
): { domainName: string; rank: number } | null {
  const priorities = getTopPriorities(examType)

  for (let i = 0; i < priorities.length; i++) {
    if (priorities[i].recommendedTopicIds.includes(topicId)) {
      return {
        domainName: priorities[i].domainName,
        rank: i + 1, // 1, 2, or 3
      }
    }
  }

  return null
}

/**
 * Get all recommendations (latest from both diagnostic and practice)
 */
export function getAllLatestRecommendations(): {
  diagnostic: PriorityRecommendation | null
  practice: PriorityRecommendation | null
} {
  return {
    diagnostic: getLatestRecommendation("diagnostic"),
    practice: getLatestRecommendation("practice"),
  }
}
