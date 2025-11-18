// Knowledge Statement to Topic Mapping
// Maps each KN (Knowledge Statement) to concrete study topics from EPPP_DOMAINS
// Used by: prioritizer (to recommend topics), topic-teacher (to show related KNs)

export interface KNTopicMapping {
  knId: string
  topicIds: string[] // IDs from EPPP_DOMAINS
}

// Maps KN IDs to their relevant topic IDs
export const KN_TOPIC_MAPPING: Record<string, string[]> = {
  // Domain 1: Biological Bases of Behavior

  // KN1: Neurobiological and genetic bases
  KN1: ["1-1", "1-2", "1-3", "1-4", "1-5"],

  // KN2: Drug classification and mechanisms
  KN2: ["1-7", "1-8"],

  // KN3: Treatment guidelines and trials
  KN3: ["1-7", "1-8", "6-1", "6-2", "6-3"],

  // KN4: Behavioral genetics
  KN4: ["1-1", "1-2", "1-3"],

  // KN5: Assessment methodologies
  KN5: ["1-6"],

  // Domain 2: Cognitive-Affective Bases of Behavior

  // KN6: Theories and models of intelligence
  KN6: ["2-1", "2-2", "2-3", "2-4"],

  // KN7: Theories and models of learning
  KN7: ["2-1", "2-2", "2-3", "2-4"],

  // KN8: Theories and models of memory
  KN8: ["1-4", "2-5"],

  // KN9: Emotion and affect regulation
  KN9: ["2-6", "6-1"],

  // KN10: Stress and coping
  KN10: ["2-6", "6-5"],

  // KN11: Motivation and goal-directed behavior
  KN11: [],

  // KN12: Cognitive and affective bases of psychopathology
  KN12: ["5d-2", "5d-3", "5d-4", "5d-5"],

  // KN13: Lifespan cognitive and affective development
  KN13: ["4-4", "4-6", "4-7"],

  // Domain 3: Social Psychology & Cultural Aspects

  // KN14: Social cognition and attribution
  KN14: ["3s-1", "3s-2"],

  // KN15: Attitudes and persuasion
  KN15: ["3s-3", "3s-4"],

  // KN16: Group behavior and dynamics
  KN16: ["3s-5", "3s-6"],

  // KN17: Interpersonal processes
  KN17: ["3s-7", "3s-8"],

  // KN18: Prejudice and discrimination
  KN18: ["3s-8", "3c-1", "3c-2"],

  // KN19: Culture, ethnicity, and diversity
  KN19: ["3c-1", "3c-2"],

  // KN20: Sexual and gender identity
  KN20: ["4-6", "4-7"],

  // Domain 4: Growth and Lifespan Development

  // KN21: Prenatal and early childhood development
  KN21: ["4-1", "4-2"],

  // KN22: Physical development across the lifespan
  KN22: ["4-3"],

  // KN23: Cognitive development across the lifespan
  KN23: ["4-4"],

  // KN24: Language development
  KN24: ["4-5"],

  // KN25: Socioemotional development
  KN25: ["4-6", "4-7"],

  // KN26: Moral development
  KN26: ["4-8"],

  // KN27: Family influences on development
  KN27: ["4-7", "4-9"],

  // KN28: School and peer influences on development
  KN28: ["4-9"],

  // Domain 5: Assessment, Diagnosis, and Psychopathology

  // KN29: Intelligence assessment
  KN29: ["5a-1", "5a-2"],

  // KN30: Personality assessment and diagnosis
  KN30: ["5a-3", "5a-4"],

  // KN31: Behavioral assessment and diagnostic interviews
  KN31: ["5a-6"],

  // KN32: Diagnosis and conceptualization of psychological disorders
  KN32: ["5d-1", "5d-2", "5d-3", "5d-4", "5d-5", "5d-6", "5d-7", "5d-8", "5d-9", "5d-10", "5d-11"],

  // KN33: Comorbidity, epidemiology, and cultural factors
  KN33: ["5d-1", "5d-2", "5d-3", "5d-4", "5d-5"],

  // KN34: Assessment across the lifespan
  KN34: ["5a-1", "5a-2", "5a-3", "5a-4"],

  // KN35: Neuropsychological assessment
  KN35: ["1-6", "5d-9"],

  // KN36: Psychometric concepts and measurement
  KN36: ["5t-1", "5t-2", "5t-3", "5t-4"],

  // KN37: Test selection and interpretation
  KN37: ["5t-4", "5a-1", "5a-2", "5a-3", "5a-4"],

  // KN38: Occupational/organizational assessment
  KN38: [],

  // KN39: Selection and placement assessment
  KN39: [],

  // KN40: Assessment of group differences
  KN40: ["5t-2", "5t-3"],

  // KN41: Forensic assessment
  KN41: ["5a-6"],

  // Domain 6: Treatment and Intervention

  // KN42: Cognitive and behavioral interventions
  KN42: ["6-1"],

  // KN43: Humanistic and psychodynamic interventions
  KN43: ["6-2"],

  // KN44: Brief and integrated therapies
  KN44: ["6-3"],

  // KN45: Group and family interventions
  KN45: ["6-4"],

  // KN46: Consultation and interprofessional collaboration
  KN46: ["6-5", "8-6"],

  // KN47: Prevention and health promotion
  KN47: ["6-5"],

  // KN48: Psychotherapy research and evidence
  KN48: ["6-5"],

  // KN49: Treatment planning and case conceptualization
  KN49: ["6-1", "6-2", "6-3"],

  // KN50: Diversity in treatment
  KN50: ["6-1", "6-2", "6-3", "6-4"],

  // KN51: Organizational/industrial interventions
  KN51: [],

  // KN52: Coaching and consulting
  KN52: [],

  // Domain 7: Research Methods and Statistics

  // KN53: Types of variables and research designs
  KN53: ["7-1", "7-2", "7-3"],

  // KN54: Research validity and control
  KN54: ["7-2"],

  // KN55: Quantitative methods and statistics
  KN55: ["7-4", "7-5", "7-6"],

  // KN56: Qualitative research
  KN56: ["7-1"],

  // KN57: Single-case and program evaluation
  KN57: ["7-3"],

  // KN58: Data interpretation and effect sizes
  KN58: ["7-5", "7-6"],

  // KN59: Meta-analysis and systematic reviews
  KN59: ["7-5"],

  // KN60: Replication and generalizability
  KN60: ["7-2"],

  // Domain 8: Ethical, Legal, and Professional Issues

  // KN61: APA Ethics Code
  KN61: ["8-1", "8-2", "8-3", "8-4", "8-5"],

  // KN62: Confidentiality and privacy
  KN62: ["8-1", "8-2"],

  // KN63: Informed consent and capacity
  KN63: ["8-2", "8-3"],

  // KN64: Boundary issues and multiple relationships
  KN64: ["8-3", "8-4"],

  // KN65: Competence and professional development
  KN65: ["8-1", "8-6"],

  // KN66: Professional fees and recordkeeping
  KN66: ["8-4", "8-6"],

  // KN67: Legal issues and court involvement
  KN67: ["8-5", "8-6"],

  // KN68: Licensing and credentialing
  KN68: ["8-6"],

  // KN69: Diversity and cultural competence
  KN69: ["8-1", "3c-1", "3c-2"],

  // KN70: Organizational policy and operations
  KN70: ["8-6"],

  // KN71: Professional identity and advocacy
  KN71: ["8-6"],
}

// Helper function to get topics for a KN
export function getTopicsForKN(knId: string): string[] {
  return KN_TOPIC_MAPPING[knId] || []
}

// Helper function to get all KNs that relate to a topic
export function getKNsForTopic(topicId: string): string[] {
  const kns: string[] = []
  for (const [knId, topicIds] of Object.entries(KN_TOPIC_MAPPING)) {
    if (topicIds.includes(topicId)) {
      kns.push(knId)
    }
  }
  return kns
}

// Get all unique topic IDs referenced in the mapping
export function getAllMappedTopicIds(): string[] {
  const topicIds = new Set<string>()
  for (const ids of Object.values(KN_TOPIC_MAPPING)) {
    ids.forEach(id => topicIds.add(id))
  }
  return Array.from(topicIds).sort()
}
