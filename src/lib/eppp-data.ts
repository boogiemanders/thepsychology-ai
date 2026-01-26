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
    name: '1: Biopsychology',
    description: 'Neuroscience & Pharmacology',
    topics: [
      { name: 'Cerebral Cortex' },                              // 0 - matches 1-cerebral-cortex.md
      { name: 'Hindbrain, Midbrain, and Forebrain' },           // 1 - matches 1-hindbrain-midbrain-forebrain.md
      { name: 'Stress and Emotion' },                           // 2 - matches 2-stress-and-emotion.md (in Domain 2 folder)
      { name: 'Memory and Sleep' },                             // 3 - matches 1-memory-and-sleep.md
      { name: 'Neurons and Neurotransmitters' },                // 4 - matches 1-neurons-and-neurotransmitters.md
      { name: 'Neurological and Endocrine Disorders' },         // 5 - matches 1-neurological-endocrine-disorders.md
      { name: 'Pharmacology: Antidepressants and Antipsychotics' }, // 6 - matches 1-pharmacology-antidepressants-antipsychotics.md
      { name: 'Pharmacology: Other Drugs' },                    // 7 - matches 1-pharmacology-other-drugs.md
      { name: 'Sensory Perception' },                           // 8 - matches 1-sensory-perception.md
    ],
  },
  {
    id: '2',
    name: '2: Learning and Memory',
    description: 'Classical & Operant Conditioning',
    topics: [
      { name: 'Pavlov and Classical Conditioning' },            // 0 - matches 2-pavlov-and-classical-conditioning.md
      { name: 'Classical Conditioning Interventions' },         // 1 - matches 2-classical-conditioning-interventions.md
      { name: 'Operant Conditioning Interventions' },           // 2 - matches 2-operant-conditioning-interventions.md
      { name: 'Memory' },                                       // 3 - matches 2-memory.md
      { name: 'Skinner and Operant Conditioning' },             // 4 - matches 2-skinner-and-operant-conditioning.md
    ],
  },
  {
    id: '3-social',
    name: '3: Social Psychology',
    description: 'Social Behavior and Cognition',
    topics: [
      { name: 'Connection' },                                   // 0 - matches 3-connection.md
      { name: 'Attitudes' },                                    // 1 - matches 3-attitudes.md
      { name: 'Persuasion' },                                   // 2 - matches 3-persuasion.md
      { name: 'Helping and Hurting' },                          // 3 - matches 3-helping-and-hurting.md
      { name: 'Why People Do Things' },                         // 4 - matches 3-why-people-do-things.md
      { name: 'Errors and Shortcuts' },                         // 5 - matches 3-errors-and-shortcuts.md
      { name: 'Group Influences' },                             // 6 - matches 3-group-influences.md
      { name: 'Influence' },                                    // 7 - matches 3-influence.md
    ],
  },
  {
    id: '3-cultural',
    name: '3: Cultural Considerations',
    description: 'Cross-Cultural Issues',
    topics: [
      { name: 'Cultural Identity' },                            // 0 - matches 3-cultural-identity.md
      { name: 'Cultural Concepts' },                            // 1 - matches 3-cultural-concepts.md
    ],
  },
  {
    id: '4',
    name: '4: Development',
    description: 'Human Development Across the Lifespan',
    topics: [
      { name: 'Cognitive Development' },                        // 0 - matches 4-cognitive-development.md
      { name: 'Heredity and Environment' },                     // 1 - matches 4-heredity-and-environment.md
      { name: 'Before Birth' },                                 // 2 - matches 4-before-birth.md
      { name: 'Language Development' },                         // 3 - matches 4-language-development.md
      { name: 'Body Growth' },                                  // 4 - matches 4-body-growth.md
      { name: 'School and Family' },                            // 5 - matches 4-school-and-family.md
      { name: 'Bonding and Attachment' },                       // 6 - matches 4-bonding-and-attachment.md
      { name: 'Morality' },                                     // 7 - matches 4-morality.md
      { name: 'Temperament and Personality' },                  // 8 - matches 4-temperament-and-personality.md
    ],
  },
  {
    id: '5-assessment',
    name: '5: Assessment',
    description: 'Psychological Testing and Measurement',
    topics: [
      { name: 'Clinical Tests' },                               // 0 - matches 5-clinical-tests.md
      { name: 'Career Interests' },                             // 1 - matches 5-career-interests.md
      { name: 'MMPI' },                                         // 2 - matches 5-mmpi.md
      { name: 'Cognitive Tests' },                              // 3 - matches 5-cognitive-tests.md
      { name: 'Personality Tests' },                            // 4 - matches 5-personality-tests.md
      { name: 'IQ Tests' },                                     // 5 - matches 5-iq-tests.md
    ],
  },
  {
    id: '5-diagnosis',
    name: '5: Diagnosis',
    description: 'Clinical Diagnosis and Mental Disorders',
    topics: [
      { name: 'Anxiety and OCD' },                              // 0 - matches 5-anxiety-and-ocd.md
      { name: 'Mood' },                                         // 1 - matches 5-mood.md
      { name: 'Acting Out' },                                   // 2 - matches 5-acting-out.md
      { name: 'Eating, Sleep, and Elimination' },               // 3 - matches 5-eating-sleep-elimination.md
      { name: 'Neurocognitive' },                               // 4 - matches 5-neurocognitive.md
      { name: 'Neurodevelopmental' },                           // 5 - matches 5-neurodevelopmental.md
      { name: 'Personality' },                                  // 6 - matches 5-personality.md
      { name: 'Psychosis' },                                    // 7 - matches 5-psychosis.md
      { name: 'Sex and Gender' },                               // 8 - matches 5-sex-and-gender.md
      { name: 'Substance Misuse' },                             // 9 - matches 5-substance-misuse.md
      { name: 'Trauma, Dissociation, and Somatic' },            // 10 - matches 5-trauma-dissociation-somatic.md
    ],
  },
  {
    id: '5-test',
    name: '5: Test Construction',
    description: 'Test Development and Psychometrics',
    topics: [
      { name: 'Items and Reliability' },                        // 0 - matches 5-items-and-reliability.md
      { name: 'Interpreting Scores' },                          // 1 - matches 5-interpreting-scores.md
      { name: 'What Tests Measure' },                           // 2 - matches 5-what-tests-measure.md
      { name: 'Can Tests Predict' },                            // 3 - matches 5-can-tests-predict.md
    ],
  },
  {
    id: '6',
    name: '6: Clinical Interventions',
    description: 'Clinical Psychology',
    topics: [
      { name: 'Brief Therapies' },                              // 0 - matches 6-brief-therapies.md
      { name: 'CBT' },                                          // 1 - matches 6-cbt.md
      { name: 'Family and Group' },                             // 2 - matches 6-family-and-group.md
      { name: 'Prevention and Consultation' },                  // 3 - matches 6-prevention-and-consultation.md
      { name: 'Psychodynamic and Humanistic' },                 // 4 - matches 6-psychodynamic-and-humanistic.md
    ],
  },
  {
    id: '7',
    name: '7: Research and Stats',
    description: 'Research Design and Data Analysis',
    topics: [
      { name: 'Correlation and Regression' },                   // 0 - matches 7-correlation-and-regression.md
      { name: 'Stats Tests' },                                  // 1 - matches 7-stats-tests.md
      { name: 'Inferential Stats' },                            // 2 - matches 7-inferential-stats.md
      { name: 'Internal and External Validity' },               // 3 - matches 7-internal-external-validity.md
      { name: 'Research Designs' },                             // 4 - matches 7-research-designs.md
      { name: 'Variables' },                                    // 5 - matches 7-variables.md
    ],
  },
  {
    id: '8',
    name: '8: Ethics',
    description: 'Professional Conduct and Regulation',
    topics: [
      { name: 'Standards 1 and 2' },                            // 0 - matches 8-standards-1-2.md
      { name: 'Standards 3 and 4' },                            // 1 - matches 8-standards-3-4.md
      { name: 'Standards 5 and 6' },                            // 2 - matches 8-standards-5-6.md
      { name: 'Standards 7 and 8' },                            // 3 - matches 8-standards-7-8.md
      { name: 'Standards 9 and 10' },                           // 4 - matches 8-standards-9-10.md
      { name: 'Practice Issues' },                              // 5 - matches 8-practice-issues.md
    ],
  },
  {
    id: '3-5-6',
    name: '3, 5, 6: I-O Psychology',
    description: 'Industrial-Organizational Psychology',
    topics: [
      { name: 'How Careers Develop' },                          // 0 - matches 6-how-careers-develop.md
      { name: 'Do Hiring Tools Work' },                         // 1 - matches 5-do-hiring-tools-work.md
      { name: 'Hiring Methods' },                               // 2 - matches 5-hiring-methods.md
      { name: 'Evaluating Jobs' },                              // 3 - matches 5-6-evaluating-jobs.md
      { name: 'How Orgs Change' },                              // 4 - matches 6-how-orgs-change.md
      { name: 'Workplace Decisions' },                          // 5 - matches 5-6-workplace-decisions.md
      { name: 'Leadership' },                                   // 6 - matches 5-6-leadership.md
      { name: 'Management Theories' },                          // 7 - matches 6-management-theories.md
      { name: 'Work Satisfaction' },                            // 8 - matches 2-3-work-satisfaction.md
      { name: 'Work Motivation' },                              // 9 - matches 2-work-motivation.md
      { name: 'Training and Evaluation' },                      // 10 - matches 5-6-training-and-evaluation.md
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
