export interface EPPPTopic {
  name: string
}

export interface EPPPDomain {
  id: string
  name: string
  description: string
  topics: EPPPTopic[]
}

export const EPPP_DOMAINS: EPPPDomain[] = [
  {
    id: '1',
    name: '1: Biological Bases',
    description: 'Physiological Psychology and Psychopharmacology',
    topics: [
      { name: 'Brain Regions/Functions – Cerebral Cortex' },
      { name: 'Brain Regions/Functions – Hindbrain, Midbrain, and Subcortical Forebrain…' },
      { name: 'Emotions and Stress' },
      { name: 'Memory and Sleep' },
      { name: 'Nervous System, Neurons, and Neurotransmitters' },
      { name: 'Neurological and Endocrine Disorders' },
      { name: 'Psychopharmacology – Antipsychotics and Antidepressants' },
      { name: 'Psychopharmacology – Other Psychoactive Drugs' },
      { name: 'Sensation and Perception' },
    ],
  },
  {
    id: '2',
    name: '2: Cognitive-Affective Bases',
    description: 'Learning and Memory',
    topics: [
      { name: 'Classical Conditioning' },
      { name: 'Interventions Based on Classical Conditioning' },
      { name: 'Interventions Based on Operant Conditioning' },
      { name: 'Memory and Forgetting' },
      { name: 'Operant Conditioning' },
    ],
  },
  {
    id: '3-social',
    name: '3: Social Bases',
    description: 'Social Behavior and Cognition',
    topics: [
      { name: 'Affiliation, Attraction, and Intimacy' },
      { name: 'Attitudes and Attitude Change' },
      { name: 'Persuasion' },
      { name: 'Prosocial Behavior and Prejudice/Discrimination' },
      { name: 'Social Cognition – Causal Attributions' },
      { name: 'Social Cognition – Errors, Biases, and Heuristics' },
      { name: 'Social Influence – Group Influences' },
      { name: 'Social Influence – Types of Influence' },
    ],
  },
  {
    id: '3-cultural',
    name: '3: Cultural Bases',
    description: 'Cross-Cultural Issues',
    topics: [
      { name: 'Cross-Cultural Issues – Identity Development Models' },
      { name: 'Cross-Cultural Issues – Terms and Concepts' },
    ],
  },
  {
    id: '4',
    name: '4: Growth & Lifespan',
    description: 'Human Development Across the Lifespan',
    topics: [
      { name: 'Cognitive Development' },
      { name: 'Early Influences on Development – Nature vs. Nurture' },
      { name: 'Early Influences on Development – Prenatal Development' },
      { name: 'Language Development' },
      { name: 'Physical Development' },
      { name: 'School and Family Influences' },
      { name: 'Socioemotional Development – Attachment, Emotions, and Social Relationships' },
      { name: 'Socioemotional Development – Moral Development' },
      { name: 'Socioemotional Development – Temperament and Personality' },
    ],
  },
  {
    id: '5-assessment',
    name: '5: Assessment',
    description: 'Psychological Testing and Measurement',
    topics: [
      { name: 'Clinical Tests' },
      { name: 'Interest Inventories' },
      { name: 'MMPI-2' },
      { name: 'Other Measures of Cognitive Ability' },
      { name: 'Other Measures of Personality' },
      { name: 'Stanford-Binet and Wechsler Tests' },
    ],
  },
  {
    id: '5-diagnosis',
    name: '5: Diagnosis',
    description: 'Clinical Diagnosis and Mental Disorders',
    topics: [
      { name: 'Anxiety Disorders and Obsessive-Compulsive Disorder' },
      { name: 'Bipolar and Depressive Disorders' },
      { name: 'Disruptive, Impulse-Control, and Conduct Disorders' },
      { name: 'Feeding/Eating, Elimination, and Sleep-Wake Disor' },
      { name: 'Neurocognitive Disorders' },
      { name: 'Neurodevelopmental Disorders' },
      { name: 'Personality Disorders' },
      { name: 'Schizophrenia Spectrum/Other Psychotic Disorders' },
      { name: 'Sexual Dysfunctions, Gender Dysphoria, and Paraphilic Disorders' },
      { name: 'Substance-Related and Addictive Disorders' },
      { name: 'Trauma/Stressor-Related, Dissociative, and Somatic Symptom Disorders' },
    ],
  },
  {
    id: '5-test',
    name: '5: Test Construction',
    description: 'Test Development and Psychometrics',
    topics: [
      { name: 'Item Analysis and Test Reliability' },
      { name: 'Test Score Interpretation' },
      { name: 'Test Validity – Content and Construct Validity' },
      { name: 'Test Validity – Criterion-Related Validity' },
    ],
  },
  {
    id: '6',
    name: '6: Treatment & Intervention',
    description: 'Clinical Psychology',
    topics: [
      { name: 'Cognitive-Behavioral Therapies' },
      { name: 'Family Therapies and Group Therapies' },
      { name: 'Prevention, Consultation, and Psychotherapy Research' },
      { name: 'Psychodynamic and Humanistic Therapies' },
    ],
  },
  {
    id: '7',
    name: '7: Research Methods & Statistics',
    description: 'Research Design and Data Analysis',
    topics: [
      { name: 'Correlation and Regression' },
      { name: 'Inferential Statistical Tests' },
      { name: 'Overview of Inferential Statistics' },
      { name: 'Research – Internal/External Validity' },
      { name: 'Research – Single-Subject and Group Designs' },
      { name: 'Types of Variables and Data' },
    ],
  },
  {
    id: '8',
    name: '8: Ethical, Legal & Professional Issues',
    description: 'Professional Conduct and Regulation',
    topics: [
      { name: 'APA Ethics Code Over and Standards 1 & 2' },
      { name: 'APA Ethics Code Standards 3 & 4' },
      { name: 'APA Ethics Code Standards 5 & 6' },
      { name: 'APA Ethics Code Standards 7 & 8' },
      { name: 'APA Ethics Code Standards 9 & 10' },
      { name: 'Professional Issues' },
    ],
  },
  {
    id: '3-5-6',
    name: '3, 5, 6: Organizational Psychology',
    description: 'Integrated Organizational & Workplace Topics',
    topics: [
      { name: 'Career Choice and Development' },
      { name: 'Employee Selection – Evaluation of Techniques' },
      { name: 'Employee Selection – Techniques' },
      { name: 'Job Analysis and Performance Assessment' },
      { name: 'Organizational Change and Development' },
      { name: 'Organizational Decision-Making' },
      { name: 'Organizational Leadership' },
      { name: 'Organizational Theories' },
      { name: 'Satisfaction, Commitment, and Stress' },
      { name: 'Theories of Motivation' },
      { name: 'Training Methods and Evaluation' },
    ],
  },
]

// Helper function to get domain by ID
export function getDomainById(domainId: string): EPPPDomain | undefined {
  return EPPP_DOMAINS.find(domain => domain.id === domainId)
}

// Helper function to get topic by ID (domainId-topicIndex)
export function getTopicById(topicId: string): { domain: EPPPDomain; topic: EPPPTopic; topicIndex: number } | undefined {
  const [domainId, topicIndexStr] = topicId.split('-')
  const topicIndex = parseInt(topicIndexStr, 10)

  const domain = EPPP_DOMAINS.find(d => d.id === domainId)
  if (!domain || isNaN(topicIndex) || topicIndex < 0 || topicIndex >= domain.topics.length) {
    return undefined
  }

  return {
    domain,
    topic: domain.topics[topicIndex],
    topicIndex
  }
}
