export const FREE_TIER_LIMITS = {
  LESSONS_ACCESSIBLE: 10,
  QUIZZES_PER_DAY: 3,
  RECOVER_SESSIONS_PER_DAY: 0, // Pro only
  EXAM_SIMULATION: false,
  CUSTOM_METAPHORS: false,
  AUDIO_LESSONS: false,
} as const

// One curated topic per domain that free users can access
export const FREE_TOPICS_BY_DOMAIN: Record<string, string[]> = {
  '1': ['Cerebral Cortex'],
  '2': ['Pavlov and Classical Conditioning'],
  '3-social': ['Connection'],
  '3-cultural': ['Cultural Identity'],
  '4': ['Cognitive Development'],
  '5-assessment': ['Clinical Tests'],
  '5-diagnosis': ['Anxiety and OCD'],
  '5-test': ['Items and Reliability'],
  '6': ['CBT'],
  '7': ['Correlation and Regression'],
  '8': ['Standards 1 and 2'],
  '3-5-6': ['Work Satisfaction'],
}

// Flat set of all free topic names (for lookups where domain is unknown)
export const FREE_TOPIC_NAMES: Set<string> = new Set(
  Object.values(FREE_TOPICS_BY_DOMAIN).flat()
)

/**
 * Returns true if the topic is accessible for the given subscription tier.
 * Pro users can access everything; free users only get FREE_TOPICS_BY_DOMAIN.
 */
export function isTopicAccessible(
  domain: string,
  topic: string,
  subscriptionTier: string
): boolean {
  if (subscriptionTier !== 'free') return true
  return FREE_TOPICS_BY_DOMAIN[domain]?.includes(topic) ?? false
}
