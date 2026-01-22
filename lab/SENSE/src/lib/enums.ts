// SENSE Domains
export const DOMAINS = [
  { id: 'somatic', label: 'Somatic', description: 'Body sensations, pain, tension' },
  { id: 'emotional', label: 'Emotional', description: 'Mood, affect, emotional regulation' },
  { id: 'neurological', label: 'Neurological', description: 'Processing, attention, arousal' },
  { id: 'social', label: 'Social', description: 'Relationships, communication, connection' },
  { id: 'environmental', label: 'Environmental', description: 'Context, setting, surroundings' },
] as const

export type DomainId = typeof DOMAINS[number]['id']

// State Tags
export const STATE_TAGS = [
  { id: 'hyper', label: 'Hyperaroused', color: '#ef4444' },
  { id: 'hypo', label: 'Hypoaroused', color: '#3b82f6' },
  { id: 'mixed', label: 'Mixed State', color: '#a855f7' },
  { id: 'regulated', label: 'Regulated', color: '#22c55e' },
] as const

export type StateTagId = typeof STATE_TAGS[number]['id']

// Body Systems
export const BODY_SYSTEMS = [
  { id: 'gi', label: 'GI / Digestive' },
  { id: 'cardio', label: 'Cardiovascular' },
  { id: 'respiratory', label: 'Respiratory' },
  { id: 'musculoskeletal', label: 'Musculoskeletal' },
  { id: 'sleep', label: 'Sleep / Circadian' },
] as const

export type BodySystemId = typeof BODY_SYSTEMS[number]['id']

// Contexts / Settings
export const CONTEXTS = [
  { id: 'home', label: 'Home' },
  { id: 'clinic', label: 'Clinic' },
  { id: 'school', label: 'School' },
  { id: 'work', label: 'Work' },
  { id: 'community', label: 'Community' },
] as const

export type ContextId = typeof CONTEXTS[number]['id']

// Sensory Modifiers
export const SENSORY_MODIFIERS = [
  { id: 'vestibular_seeking', label: 'Vestibular Seeking', domain: 'neurological' },
  { id: 'vestibular_avoiding', label: 'Vestibular Avoiding', domain: 'neurological' },
  { id: 'proprioceptive_seeking', label: 'Proprioceptive Seeking', domain: 'somatic' },
  { id: 'proprioceptive_low', label: 'Low Proprioceptive Awareness', domain: 'somatic' },
  { id: 'tactile_defensive', label: 'Tactile Defensive', domain: 'somatic' },
  { id: 'tactile_seeking', label: 'Tactile Seeking', domain: 'somatic' },
  { id: 'auditory_sensitive', label: 'Auditory Sensitivity', domain: 'neurological' },
  { id: 'visual_sensitive', label: 'Visual Sensitivity', domain: 'neurological' },
  { id: 'interoception_low', label: 'Low Interoceptive Awareness', domain: 'somatic' },
  { id: 'interoception_high', label: 'High Interoceptive Sensitivity', domain: 'somatic' },
] as const

export type SensoryModifierId = typeof SENSORY_MODIFIERS[number]['id']

// Practice Frequency Options
export const PRACTICE_FREQUENCIES = [
  { id: 'daily', label: 'Daily' },
  { id: '3x_week', label: '3x per week' },
  { id: '2x_week', label: '2x per week' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'as_needed', label: 'As needed' },
] as const

export type PracticeFrequencyId = typeof PRACTICE_FREQUENCIES[number]['id']

// Rating Scale Labels
export const RATING_LABELS = [
  { value: 1, label: 'Minimal concern' },
  { value: 2, label: 'Mild concern' },
  { value: 3, label: 'Moderate concern' },
  { value: 4, label: 'Significant concern' },
  { value: 5, label: 'Severe concern' },
] as const
