import type { ClientIntakeProfile, ProviderProfile } from '@/types/matching'

export type ScoreBreakdown = {
  specialization: number
  modality: number
  style: number
  cultural: number
  practical: number
}

export type MatchScore = {
  total: number
  breakdown: ScoreBreakdown
  insurance_match: boolean
  hard_filter_passed: boolean
  reasons: string[]
}

const WEIGHTS = {
  specialization: 0.35,
  modality: 0.2,
  style: 0.2,
  cultural: 0.13,
  practical: 0.12,
}

function jaccard(a: string[], b: string[]): number {
  if (!a.length && !b.length) return 0
  const setA = new Set(a)
  const setB = new Set(b)
  let inter = 0
  for (const x of setA) if (setB.has(x)) inter++
  const union = setA.size + setB.size - inter
  return union === 0 ? 0 : inter / union
}

function styleDistance(
  intake: ClientIntakeProfile,
  provider: ProviderProfile
): number | null {
  const pairs: [number | null, number | null][] = [
    [intake.pref_style_directive, provider.style_directive],
    [intake.pref_style_present_focused, provider.style_present_focused],
    [intake.pref_style_insight_behavioral, provider.style_insight_behavioral],
    [intake.pref_style_warmth_professional, provider.style_warmth_professional],
  ]
  const usable = pairs.filter(([a, b]) => a != null && b != null) as [number, number][]
  if (usable.length === 0) return null
  let sumSq = 0
  for (const [a, b] of usable) sumSq += (a - b) ** 2
  const distance = Math.sqrt(sumSq)
  const maxDistance = Math.sqrt(usable.length * 81)
  return 1 - distance / maxDistance
}

function culturalScore(intake: ClientIntakeProfile, provider: ProviderProfile): number {
  let score = 0
  let weight = 0

  if (intake.preferred_languages?.length) {
    weight += 0.5
    const overlap = intake.preferred_languages.some((l) => provider.languages_spoken.includes(l))
    if (overlap) score += 0.5
  }

  if (intake.lgbtq_affirming_required) {
    weight += 0.3
    if (provider.lgbtq_affirming) score += 0.3
  }

  if (intake.faith_integrated_preferred) {
    weight += 0.2
    if (provider.faith_integrated) score += 0.2
  }

  if (weight === 0) return 1
  return score / weight
}

function practicalScore(intake: ClientIntakeProfile, provider: ProviderProfile): number {
  if (intake.telehealth_preference === 'telehealth_only') {
    return provider.telehealth_states.length > 0 ? 1 : 0
  }
  if (intake.telehealth_preference === 'in_person_only') {
    return provider.telehealth_only ? 0 : 1
  }
  return 1
}

export function hardFilter(
  intake: ClientIntakeProfile,
  provider: ProviderProfile
): boolean {
  if (provider.status !== 'active') return false
  if (!intake.state_of_residence) return false
  if (!provider.telehealth_states.includes(intake.state_of_residence)) return false
  return true
}

export function scoreMatch(
  intake: ClientIntakeProfile,
  provider: ProviderProfile
): MatchScore {
  const passed = hardFilter(intake, provider)

  const specialization = jaccard(
    intake.conditions_seeking_help,
    provider.conditions_treated
  )

  const modalityRaw = intake.preferred_modalities?.length
    ? jaccard(intake.preferred_modalities, provider.modalities)
    : null

  const style = styleDistance(intake, provider)
  const cultural = culturalScore(intake, provider)
  const practical = practicalScore(intake, provider)

  const activeWeights: Record<string, number> = {
    specialization: WEIGHTS.specialization,
    cultural: WEIGHTS.cultural,
    practical: WEIGHTS.practical,
  }
  const activeScores: Record<string, number> = {
    specialization,
    cultural,
    practical,
  }

  if (modalityRaw != null) {
    activeWeights.modality = WEIGHTS.modality
    activeScores.modality = modalityRaw
  }
  if (style != null) {
    activeWeights.style = WEIGHTS.style
    activeScores.style = style
  }

  const weightSum = Object.values(activeWeights).reduce((a, b) => a + b, 0)
  let total = 0
  for (const k of Object.keys(activeWeights)) {
    total += (activeScores[k] * activeWeights[k]) / weightSum
  }

  const insurance_match =
    !!intake.insurance_payer_name &&
    provider.insurance_networks.some(
      (n) =>
        n.toLowerCase() === intake.insurance_payer_name?.toLowerCase() ||
        n.toLowerCase().includes(intake.insurance_payer_name?.toLowerCase() ?? '') ||
        intake.insurance_payer_name?.toLowerCase().includes(n.toLowerCase())
    )

  const reasons: string[] = []
  const sharedConditions = intake.conditions_seeking_help.filter((c) =>
    provider.conditions_treated.includes(c)
  )
  if (sharedConditions.length > 0) {
    reasons.push(`Treats ${sharedConditions.slice(0, 3).join(', ')}`)
  }
  if (modalityRaw && modalityRaw > 0 && intake.preferred_modalities) {
    const sharedModalities = intake.preferred_modalities.filter((m) =>
      provider.modalities.includes(m)
    )
    if (sharedModalities.length > 0) {
      reasons.push(`Uses ${sharedModalities.slice(0, 2).join(', ')}`)
    }
  }
  if (insurance_match) {
    reasons.push(`In-network with ${intake.insurance_payer_name}`)
  }
  if (intake.lgbtq_affirming_required && provider.lgbtq_affirming) {
    reasons.push('LGBTQ+ affirming')
  }

  return {
    total: passed ? total : 0,
    breakdown: {
      specialization,
      modality: modalityRaw ?? 0,
      style: style ?? 0,
      cultural,
      practical,
    },
    insurance_match,
    hard_filter_passed: passed,
    reasons,
  }
}

export function rankMatches(
  intake: ClientIntakeProfile,
  providers: ProviderProfile[]
): Array<{ provider: ProviderProfile; score: MatchScore }> {
  return providers
    .map((provider) => ({ provider, score: scoreMatch(intake, provider) }))
    .filter((m) => m.score.hard_filter_passed)
    .sort((a, b) => b.score.total - a.score.total)
}
