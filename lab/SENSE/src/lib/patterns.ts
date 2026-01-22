import type { DomainId, StateTagId } from './enums'

export interface ClinicalPattern {
  id: string
  name: string
  description: string
  primaryDomains: DomainId[]
  typicalStateTag: StateTagId
  senseProfile: {
    somatic: [number, number] // [min, max] range
    emotional: [number, number]
    neurological: [number, number]
    social: [number, number]
    environmental: [number, number]
  }
  commonModifiers: string[]
  differentialConsiderations: string[]
  suggestedInterventions: string[]
}

export const CLINICAL_PATTERNS: ClinicalPattern[] = [
  {
    id: 'hypervigilance',
    name: 'Hypervigilance Pattern',
    description: 'Chronic state of heightened alertness characterized by scanning for threat, difficulty relaxing, and sensory sensitivity.',
    primaryDomains: ['neurological', 'somatic'],
    typicalStateTag: 'hyper',
    senseProfile: {
      somatic: [3, 5],
      emotional: [3, 5],
      neurological: [4, 5],
      social: [2, 4],
      environmental: [4, 5],
    },
    commonModifiers: ['auditory_sensitive', 'visual_sensitive', 'tactile_defensive'],
    differentialConsiderations: ['PTSD', 'Generalized anxiety', 'Autism spectrum (sensory profile)'],
    suggestedInterventions: ['somatic_grounding', 'progressive_relaxation', 'environment_modification'],
  },
  {
    id: 'shutdown',
    name: 'Shutdown/Collapse Pattern',
    description: 'Hypoaroused state characterized by disconnection, low energy, numbness, and withdrawal.',
    primaryDomains: ['neurological', 'emotional'],
    typicalStateTag: 'hypo',
    senseProfile: {
      somatic: [2, 4],
      emotional: [3, 5],
      neurological: [4, 5],
      social: [3, 5],
      environmental: [2, 4],
    },
    commonModifiers: ['interoception_low', 'proprioceptive_low'],
    differentialConsiderations: ['Depression', 'Dissociative disorders', 'Chronic fatigue'],
    suggestedInterventions: ['rhythmic_regulation', 'social_engagement', 'deep_pressure'],
  },
  {
    id: 'sensory_overwhelm',
    name: 'Sensory Overwhelm Pattern',
    description: 'Difficulty processing sensory input leading to overload, shutdown, or meltdown responses.',
    primaryDomains: ['neurological', 'environmental'],
    typicalStateTag: 'mixed',
    senseProfile: {
      somatic: [3, 5],
      emotional: [3, 5],
      neurological: [4, 5],
      social: [3, 5],
      environmental: [4, 5],
    },
    commonModifiers: ['auditory_sensitive', 'visual_sensitive', 'tactile_defensive', 'vestibular_avoiding'],
    differentialConsiderations: ['Autism spectrum', 'Sensory processing disorder', 'ADHD'],
    suggestedInterventions: ['sensory_diet', 'environment_modification', 'safe_space'],
  },
  {
    id: 'somatic_holding',
    name: 'Somatic Holding Pattern',
    description: 'Chronic physical tension and bracing, often with associated pain, restricted movement, and breath holding.',
    primaryDomains: ['somatic'],
    typicalStateTag: 'hyper',
    senseProfile: {
      somatic: [4, 5],
      emotional: [2, 4],
      neurological: [2, 4],
      social: [1, 3],
      environmental: [2, 3],
    },
    commonModifiers: ['proprioceptive_low', 'interoception_high'],
    differentialConsiderations: ['Chronic pain', 'Anxiety', 'Trauma', 'Fibromyalgia'],
    suggestedInterventions: ['progressive_relaxation', 'somatic_grounding', 'deep_pressure'],
  },
  {
    id: 'emotional_flooding',
    name: 'Emotional Flooding Pattern',
    description: 'Overwhelming emotional experiences that exceed capacity for regulation, often with rapid onset.',
    primaryDomains: ['emotional', 'neurological'],
    typicalStateTag: 'hyper',
    senseProfile: {
      somatic: [3, 5],
      emotional: [4, 5],
      neurological: [3, 5],
      social: [2, 4],
      environmental: [3, 5],
    },
    commonModifiers: ['interoception_high'],
    differentialConsiderations: ['PTSD', 'Borderline personality', 'Panic disorder', 'Bipolar'],
    suggestedInterventions: ['containment', 'window_tolerance', 'co_regulation'],
  },
  {
    id: 'alexithymia',
    name: 'Alexithymia Pattern',
    description: 'Difficulty identifying, naming, and describing emotional experiences, often with somatic expression of emotions.',
    primaryDomains: ['emotional', 'somatic'],
    typicalStateTag: 'hypo',
    senseProfile: {
      somatic: [3, 5],
      emotional: [4, 5],
      neurological: [2, 4],
      social: [3, 5],
      environmental: [1, 3],
    },
    commonModifiers: ['interoception_low'],
    differentialConsiderations: ['Autism spectrum', 'Trauma', 'Developmental differences'],
    suggestedInterventions: ['emotion_naming', 'somatic_grounding', 'window_tolerance'],
  },
  {
    id: 'social_withdrawal',
    name: 'Social Withdrawal Pattern',
    description: 'Avoidance of social contact, difficulty with connection, and isolation behaviors.',
    primaryDomains: ['social', 'emotional'],
    typicalStateTag: 'hypo',
    senseProfile: {
      somatic: [1, 3],
      emotional: [3, 5],
      neurological: [2, 4],
      social: [4, 5],
      environmental: [2, 4],
    },
    commonModifiers: ['auditory_sensitive'],
    differentialConsiderations: ['Social anxiety', 'Depression', 'Autism spectrum', 'Avoidant attachment'],
    suggestedInterventions: ['social_engagement', 'co_regulation', 'safe_space'],
  },
  {
    id: 'boundary_porosity',
    name: 'Boundary Porosity Pattern',
    description: 'Difficulty maintaining interpersonal boundaries, tendency to merge with others or become overwhelmed by others\' emotions.',
    primaryDomains: ['social', 'emotional'],
    typicalStateTag: 'mixed',
    senseProfile: {
      somatic: [2, 4],
      emotional: [4, 5],
      neurological: [2, 4],
      social: [4, 5],
      environmental: [3, 5],
    },
    commonModifiers: ['interoception_high'],
    differentialConsiderations: ['Codependency', 'Enmeshment', 'Empathic sensitivity', 'Attachment trauma'],
    suggestedInterventions: ['boundary_work', 'containment', 'somatic_grounding'],
  },
  {
    id: 'transition_difficulty',
    name: 'Transition Difficulty Pattern',
    description: 'Significant distress with changes in activity, environment, or routine; difficulty shifting attention or state.',
    primaryDomains: ['environmental', 'neurological'],
    typicalStateTag: 'mixed',
    senseProfile: {
      somatic: [2, 4],
      emotional: [3, 5],
      neurological: [3, 5],
      social: [2, 4],
      environmental: [4, 5],
    },
    commonModifiers: ['vestibular_avoiding', 'proprioceptive_seeking'],
    differentialConsiderations: ['ADHD', 'Autism spectrum', 'Anxiety', 'Executive function difficulties'],
    suggestedInterventions: ['transition_support', 'sensory_diet', 'rhythmic_regulation'],
  },
  {
    id: 'dissociation',
    name: 'Dissociation Pattern',
    description: 'Disconnection from body, emotions, or surroundings; may include depersonalization, derealization, or fragmentation.',
    primaryDomains: ['neurological', 'somatic'],
    typicalStateTag: 'hypo',
    senseProfile: {
      somatic: [3, 5],
      emotional: [3, 5],
      neurological: [4, 5],
      social: [3, 5],
      environmental: [3, 5],
    },
    commonModifiers: ['interoception_low', 'proprioceptive_low'],
    differentialConsiderations: ['PTSD', 'Dissociative disorders', 'Complex trauma', 'Structural dissociation'],
    suggestedInterventions: ['somatic_grounding', 'bilateral_stimulation', 'co_regulation'],
  },
  {
    id: 'seeking_pattern',
    name: 'Sensory Seeking Pattern',
    description: 'Active pursuit of intense sensory experiences; may include movement seeking, deep pressure seeking, or high-intensity activities.',
    primaryDomains: ['neurological', 'somatic'],
    typicalStateTag: 'hypo',
    senseProfile: {
      somatic: [2, 4],
      emotional: [1, 3],
      neurological: [3, 5],
      social: [1, 3],
      environmental: [2, 4],
    },
    commonModifiers: ['vestibular_seeking', 'proprioceptive_seeking', 'tactile_seeking'],
    differentialConsiderations: ['ADHD', 'Autism spectrum', 'Underresponsive sensory profile'],
    suggestedInterventions: ['sensory_diet', 'deep_pressure', 'rhythmic_regulation'],
  },
  {
    id: 'interoceptive_disconnect',
    name: 'Interoceptive Disconnect Pattern',
    description: 'Poor awareness of internal body signals including hunger, thirst, pain, and emotional body states.',
    primaryDomains: ['somatic', 'emotional'],
    typicalStateTag: 'hypo',
    senseProfile: {
      somatic: [3, 5],
      emotional: [3, 5],
      neurological: [2, 4],
      social: [1, 3],
      environmental: [1, 3],
    },
    commonModifiers: ['interoception_low', 'proprioceptive_low'],
    differentialConsiderations: ['Autism spectrum', 'Eating disorders', 'Trauma', 'Alexithymia'],
    suggestedInterventions: ['somatic_grounding', 'emotion_naming', 'window_tolerance'],
  },
]

export function getPatternById(id: string): ClinicalPattern | undefined {
  return CLINICAL_PATTERNS.find(p => p.id === id)
}

export function getPatternsByDomain(domain: DomainId): ClinicalPattern[] {
  return CLINICAL_PATTERNS.filter(p => p.primaryDomains.includes(domain))
}

export function getPatternsByStateTag(stateTag: StateTagId): ClinicalPattern[] {
  return CLINICAL_PATTERNS.filter(p => p.typicalStateTag === stateTag)
}
