// Knowledge Statements (KN1-KN71) from EPPP Part 1
// Source: Official ASPPB EPPP Knowledge Statements

export interface KnowledgeStatement {
  id: string // "KN1" through "KN71"
  domain: number // 1-8
  domainName: string
  name: string
  description: string
  weight: number // Domain weight (e.g., 0.10 for 10%)
}

export const KN_DATA: Record<string, KnowledgeStatement> = {
  // Domain 1: Biological Bases of Behavior (10%)
  KN1: {
    id: "KN1",
    domain: 1,
    domainName: "Biological Bases of Behavior",
    name: "Neurobiological and genetic bases",
    description: "Functional correlates and determinants of the neurobiological and genetic bases of behavior pertaining to perception, cognition, personality, and mood and affect in normal, acute and chronic neurobehavioral disease processes and disease, comorbidities.",
    weight: 0.10
  },
  KN2: {
    id: "KN2",
    domain: 1,
    domainName: "Biological Bases of Behavior",
    name: "Drug classification and mechanisms",
    description: "Drug classification, mechanisms of action, and desired/adverse effects of therapeutic agents, drugs of abuse, and complementary or alternative agents.",
    weight: 0.10
  },
  KN3: {
    id: "KN3",
    domain: 1,
    domainName: "Biological Bases of Behavior",
    name: "Treatment guidelines and trials",
    description: "Results from major trials and general guidelines for pharmacological, psychotherapeutic, and combined treatment of psychological disorders.",
    weight: 0.10
  },
  KN4: {
    id: "KN4",
    domain: 1,
    domainName: "Biological Bases of Behavior",
    name: "Behavioral genetics",
    description: "Behavioral genetics, transmission and expression of genetic information, and its modification, and the role and limitations of this information in understanding disorders.",
    weight: 0.10
  },
  KN5: {
    id: "KN5",
    domain: 1,
    domainName: "Biological Bases of Behavior",
    name: "Assessment methodologies",
    description: "Applications of structural and functional brain imaging methods, electrophysiological methods, therapeutic drug monitoring methods, and genetic screening methodologies, and the evidence for their effectiveness.",
    weight: 0.10
  },

  // Domain 2: Cognitive-Affective Bases of Behavior (13%)
  KN6: {
    id: "KN6",
    domain: 2,
    domainName: "Cognitive-Affective Bases of Behavior",
    name: "Theories and models of intelligence",
    description: "Major research-based theories and models of intelligence and their application.",
    weight: 0.13
  },
  KN7: {
    id: "KN7",
    domain: 2,
    domainName: "Cognitive-Affective Bases of Behavior",
    name: "Theories and models of learning",
    description: "Major research-based theories, models, and principles of learning and their application.",
    weight: 0.13
  },
  KN8: {
    id: "KN8",
    domain: 2,
    domainName: "Cognitive-Affective Bases of Behavior",
    name: "Theories and models of memory",
    description: "Major research-based theories and models of memory and their application.",
    weight: 0.13
  },
  KN9: {
    id: "KN9",
    domain: 2,
    domainName: "Cognitive-Affective Bases of Behavior",
    name: "Theories and models of motivation",
    description: "Major research-based theories and models of motivation and their application.",
    weight: 0.13
  },
  KN10: {
    id: "KN10",
    domain: 2,
    domainName: "Cognitive-Affective Bases of Behavior",
    name: "Theories and models of emotion",
    description: "Major research-based theories and models of emotion and their application.",
    weight: 0.13
  },
  KN11: {
    id: "KN11",
    domain: 2,
    domainName: "Cognitive-Affective Bases of Behavior",
    name: "Elements of cognition",
    description: "Elements of cognition, including sensation and perception, attention, language, information processing, visual-spatial processing, executive functioning.",
    weight: 0.13
  },
  KN12: {
    id: "KN12",
    domain: 2,
    domainName: "Cognitive-Affective Bases of Behavior",
    name: "Relations among cognitions and affect",
    description: "Relations among cognitions/beliefs, behavior, affect, temperament, and mood.",
    weight: 0.13
  },
  KN13: {
    id: "KN13",
    domain: 2,
    domainName: "Cognitive-Affective Bases of Behavior",
    name: "Psychosocial factors influence",
    description: "Influence of psychosocial factors on cognitions/beliefs and behaviors.",
    weight: 0.13
  },

  // Domain 3: Social and Cultural Bases of Behavior (11%)
  KN14: {
    id: "KN14",
    domain: 3,
    domainName: "Social and Cultural Bases of Behavior",
    name: "Theories of social cognition",
    description: "Major research-based theories and models of social cognition (e.g., person perception, development of stereotypes, prejudice).",
    weight: 0.11
  },
  KN15: {
    id: "KN15",
    domain: 3,
    domainName: "Social and Cultural Bases of Behavior",
    name: "Social interaction and relationships",
    description: "Social interaction and relationships (e.g., attraction, aggression, altruism, organizational justice, verbal and non-verbal communication, internet communication, mate selection, empathy).",
    weight: 0.11
  },
  KN16: {
    id: "KN16",
    domain: 3,
    domainName: "Social and Cultural Bases of Behavior",
    name: "Group and systems processes",
    description: "Group and systems processes (e.g., school, work, and family systems, job satisfaction, team functioning, conformity, persuasion) and social influences on functioning.",
    weight: 0.11
  },
  KN17: {
    id: "KN17",
    domain: 3,
    domainName: "Social and Cultural Bases of Behavior",
    name: "Personality theories and models",
    description: "Major research-based personality theories and models.",
    weight: 0.11
  },
  KN18: {
    id: "KN18",
    domain: 3,
    domainName: "Social and Cultural Bases of Behavior",
    name: "Cultural and sociopolitical psychology",
    description: "Cultural and sociopolitical psychology (e.g., privilege, cross-cultural comparisons, political differences, international and global awareness, religiosity and spirituality, acculturation).",
    weight: 0.11
  },
  KN19: {
    id: "KN19",
    domain: 3,
    domainName: "Social and Cultural Bases of Behavior",
    name: "Identity diversity and intersectionality",
    description: "Identity diversity and intersectionality (e.g., psychological impact of diversity on individuals, families, and systems).",
    weight: 0.11
  },
  KN20: {
    id: "KN20",
    domain: 3,
    domainName: "Social and Cultural Bases of Behavior",
    name: "Causes and effects of oppression",
    description: "Causes, manifestations, and effects of oppression.",
    weight: 0.11
  },

  // Domain 4: Growth and Lifespan Development (12%)
  KN21: {
    id: "KN21",
    domain: 4,
    domainName: "Growth and Lifespan Development",
    name: "Normal growth and development",
    description: "Normal growth and development across the lifespan.",
    weight: 0.12
  },
  KN22: {
    id: "KN22",
    domain: 4,
    domainName: "Growth and Lifespan Development",
    name: "Individual-environment interaction",
    description: "Influence of individual-environment interaction on development over time (e.g., the relationship between the individual and the social, academic, work, community environment).",
    weight: 0.12
  },
  KN23: {
    id: "KN23",
    domain: 4,
    domainName: "Growth and Lifespan Development",
    name: "Developmental theories and models",
    description: "Major research-based theories and models of development.",
    weight: 0.12
  },
  KN24: {
    id: "KN24",
    domain: 4,
    domainName: "Growth and Lifespan Development",
    name: "Influence of diverse identities",
    description: "Influence of diverse identities on development.",
    weight: 0.12
  },
  KN25: {
    id: "KN25",
    domain: 4,
    domainName: "Growth and Lifespan Development",
    name: "Family development and functioning",
    description: "Family development, configuration, and functioning and their impact on the individual across the lifespan.",
    weight: 0.12
  },
  KN26: {
    id: "KN26",
    domain: 4,
    domainName: "Growth and Lifespan Development",
    name: "Life events and development",
    description: "Life events that can influence the course of development across the lifespan.",
    weight: 0.12
  },
  KN27: {
    id: "KN27",
    domain: 4,
    domainName: "Growth and Lifespan Development",
    name: "Risk and protective factors",
    description: "Risk and protective factors that may impact a developmental course (e.g., nutrition, prenatal care, health care, social support, socioeconomic status, abuse, victimization, and resiliency).",
    weight: 0.12
  },
  KN28: {
    id: "KN28",
    domain: 4,
    domainName: "Growth and Lifespan Development",
    name: "Disorders impacting development",
    description: "Disorders and diseases that impact the expected course of development over the lifespan.",
    weight: 0.12
  },

  // Domain 5: Assessment and Diagnosis (16%)
  KN29: {
    id: "KN29",
    domain: 5,
    domainName: "Assessment and Diagnosis",
    name: "Psychometric theories and test characteristics",
    description: "Psychometric theories, item and test characteristics, test construction and standardization procedures, reliability and validity, sensitivity and specificity, and test fairness and bias.",
    weight: 0.16
  },
  KN30: {
    id: "KN30",
    domain: 5,
    domainName: "Assessment and Diagnosis",
    name: "Assessment theories and models",
    description: "Assessment theories and models (e.g., developmental, behavioral, ecological, neuropsychological).",
    weight: 0.16
  },
  KN31: {
    id: "KN31",
    domain: 5,
    domainName: "Assessment and Diagnosis",
    name: "Assessment methods and strengths",
    description: "Assessment methods and their strengths and limitations (e.g., self-report, multi-informant reports, psychophysiological measures, work samples, assessment centers, direct observation, structured and semi-structured interviews).",
    weight: 0.16
  },
  KN32: {
    id: "KN32",
    domain: 5,
    domainName: "Assessment and Diagnosis",
    name: "Commonly used instruments",
    description: "Commonly used instruments for the measurement of characteristics and behaviors of individuals and their appropriate use with various populations.",
    weight: 0.16
  },
  KN33: {
    id: "KN33",
    domain: 5,
    domainName: "Assessment and Diagnosis",
    name: "Differential diagnosis",
    description: "Issues of differential diagnosis and integration of non-psychological information into psychological assessment.",
    weight: 0.16
  },
  KN34: {
    id: "KN34",
    domain: 5,
    domainName: "Assessment and Diagnosis",
    name: "Group and organizational assessment",
    description: "Instruments and methods appropriate for the assessment of groups and organizations (e.g., program evaluation, needs assessment, organizational and personnel assessment).",
    weight: 0.16
  },
  KN35: {
    id: "KN35",
    domain: 5,
    domainName: "Assessment and Diagnosis",
    name: "Selection and adaptation of methods",
    description: "Criteria for selection and adaptation of assessment methods (e.g., evidenced-based knowledge of assessment limitations, cultural appropriateness, trans-cultural adaptation, and language accommodations).",
    weight: 0.16
  },
  KN36: {
    id: "KN36",
    domain: 5,
    domainName: "Assessment and Diagnosis",
    name: "Classification systems and diagnosis",
    description: "Classification systems and their underlying rationales and limitations for evaluating client functioning; dimensional vs. categorical approaches to diagnosis.",
    weight: 0.16
  },
  KN37: {
    id: "KN37",
    domain: 5,
    domainName: "Assessment and Diagnosis",
    name: "Evidence-based interpretation",
    description: "Factors influencing evidence-based interpretation of data and decision-making (e.g., base rates, group differences, cultural biases and differences, heuristics).",
    weight: 0.16
  },
  KN38: {
    id: "KN38",
    domain: 5,
    domainName: "Assessment and Diagnosis",
    name: "Epidemiology and base rates",
    description: "Constructs of epidemiology and base rates of psychological and behavioral disorders.",
    weight: 0.16
  },
  KN39: {
    id: "KN39",
    domain: 5,
    domainName: "Assessment and Diagnosis",
    name: "Psychopathology theories",
    description: "Major research-based theories and models of psychopathology.",
    weight: 0.16
  },
  KN40: {
    id: "KN40",
    domain: 5,
    domainName: "Assessment and Diagnosis",
    name: "Outcome measurement",
    description: "Measurement of outcomes and changes due to prevention or intervention efforts with individuals, couples, families, groups, and organizations.",
    weight: 0.16
  },
  KN41: {
    id: "KN41",
    domain: 5,
    domainName: "Assessment and Diagnosis",
    name: "Technology in assessment",
    description: "Use of technology in implementing tests, surveys, and other forms of assessment and diagnostic evaluation (e.g., validity, cost-effectiveness, consumer acceptability).",
    weight: 0.16
  },

  // Domain 6: Treatment, Intervention, Prevention, and Supervision (15%)
  KN42: {
    id: "KN42",
    domain: 6,
    domainName: "Treatment, Intervention, Prevention, and Supervision",
    name: "Treatment decision-making factors",
    description: "Factors related to treatment or intervention decision-making (e.g., relevant research, matching treatment to assessment/diagnosis, matching client or patient with psychologist characteristics, knowledge and use of allied services, cost and benefit, readiness to change).",
    weight: 0.15
  },
  KN43: {
    id: "KN43",
    domain: 6,
    domainName: "Treatment, Intervention, Prevention, and Supervision",
    name: "Treatment and intervention theories",
    description: "Contemporary research-based theories and models of treatment, intervention, and prevention.",
    weight: 0.15
  },
  KN44: {
    id: "KN44",
    domain: 6,
    domainName: "Treatment, Intervention, Prevention, and Supervision",
    name: "Treatment techniques and interventions",
    description: "Treatment techniques and interventions, and the evidence for their comparative efficacy and effectiveness.",
    weight: 0.15
  },
  KN45: {
    id: "KN45",
    domain: 6,
    domainName: "Treatment, Intervention, Prevention, and Supervision",
    name: "Prevention and intervention with special populations",
    description: "Methods and their evidence base for prevention, intervention, and rehabilitation with diverse and special populations.",
    weight: 0.15
  },
  KN46: {
    id: "KN46",
    domain: 6,
    domainName: "Treatment, Intervention, Prevention, and Supervision",
    name: "Growth-enhancing interventions",
    description: "Interventions to enhance growth and performance of individuals, couples, families, groups, systems, and organizations.",
    weight: 0.15
  },
  KN47: {
    id: "KN47",
    domain: 6,
    domainName: "Treatment, Intervention, Prevention, and Supervision",
    name: "Consultation models and processes",
    description: "Research-based consultation models and processes.",
    weight: 0.15
  },
  KN48: {
    id: "KN48",
    domain: 6,
    domainName: "Treatment, Intervention, Prevention, and Supervision",
    name: "Vocational and career development",
    description: "Research-based models of vocational and career development.",
    weight: 0.15
  },
  KN49: {
    id: "KN49",
    domain: 6,
    domainName: "Treatment, Intervention, Prevention, and Supervision",
    name: "Telepsychology and technology",
    description: "Telepsychology and technology-assisted psychological services.",
    weight: 0.15
  },
  KN50: {
    id: "KN50",
    domain: 6,
    domainName: "Treatment, Intervention, Prevention, and Supervision",
    name: "Healthcare systems and economics",
    description: "Healthcare systems, structures, and economics, and how these impact intervention choice.",
    weight: 0.15
  },
  KN51: {
    id: "KN51",
    domain: 6,
    domainName: "Treatment, Intervention, Prevention, and Supervision",
    name: "Health promotion and wellness",
    description: "Approaches to health promotion, risk reduction, resilience, and wellness.",
    weight: 0.15
  },
  KN52: {
    id: "KN52",
    domain: 6,
    domainName: "Treatment, Intervention, Prevention, and Supervision",
    name: "Supervision theories and models",
    description: "Contemporary theories and models of supervision and their evidence base.",
    weight: 0.15
  },

  // Domain 7: Research Methods and Statistics (7%)
  KN53: {
    id: "KN53",
    domain: 7,
    domainName: "Research Methods and Statistics",
    name: "Sampling and data collection",
    description: "Sampling and data collection methods.",
    weight: 0.07
  },
  KN54: {
    id: "KN54",
    domain: 7,
    domainName: "Research Methods and Statistics",
    name: "Study design",
    description: "Design of case, correlational, quasi-experimental, and experimental studies.",
    weight: 0.07
  },
  KN55: {
    id: "KN55",
    domain: 7,
    domainName: "Research Methods and Statistics",
    name: "Analytic methods",
    description: "Analytic methods, including qualitative (e.g., thematic, phenomenological) and quantitative (e.g., probability theory; descriptive, inferential, and parametric statistics; meta-analysis; factor analysis; causal modeling).",
    weight: 0.07
  },
  KN56: {
    id: "KN56",
    domain: 7,
    domainName: "Research Methods and Statistics",
    name: "Statistical interpretation",
    description: "Statistical interpretation (e.g., power, effect size, causation vs. association, clinical vs. statistical significance).",
    weight: 0.07
  },
  KN57: {
    id: "KN57",
    domain: 7,
    domainName: "Research Methods and Statistics",
    name: "Critical appraisal of research",
    description: "Critical appraisal and application of research findings (e.g., adequacy of design and statistics, limitations to generalizability, threats to internal and external validity, design flaws, level of evidence).",
    weight: 0.07
  },
  KN58: {
    id: "KN58",
    domain: 7,
    domainName: "Research Methods and Statistics",
    name: "Evaluation strategies",
    description: "Evaluation strategies and techniques (e.g., needs assessment, process and implementation evaluation, formative and summative program evaluation, outcome evaluation, cost-benefit analysis).",
    weight: 0.07
  },
  KN59: {
    id: "KN59",
    domain: 7,
    domainName: "Research Methods and Statistics",
    name: "Community involvement in research",
    description: "Considerations regarding community involvement and participation in research.",
    weight: 0.07
  },
  KN60: {
    id: "KN60",
    domain: 7,
    domainName: "Research Methods and Statistics",
    name: "Dissemination of research",
    description: "Dissemination and presentation of research findings.",
    weight: 0.07
  },

  // Domain 8: Ethical, Legal, and Professional Issues (16%)
  KN61: {
    id: "KN61",
    domain: 8,
    domainName: "Ethical, Legal, and Professional Issues",
    name: "Ethical principles and codes",
    description: "Current ethical principles and codes for psychologists (APA, CPA).",
    weight: 0.16
  },
  KN62: {
    id: "KN62",
    domain: 8,
    domainName: "Ethical, Legal, and Professional Issues",
    name: "Professional standards and guidelines",
    description: "Professional standards and relevant guidelines for the practice of psychology (e.g., standards for educational and psychological testing).",
    weight: 0.16
  },
  KN63: {
    id: "KN63",
    domain: 8,
    domainName: "Ethical, Legal, and Professional Issues",
    name: "Laws and judicial decisions",
    description: "Laws, statutes, and judicial decisions that affect psychological practice.",
    weight: 0.16
  },
  KN64: {
    id: "KN64",
    domain: 8,
    domainName: "Ethical, Legal, and Professional Issues",
    name: "Identification and management of ethical issues",
    description: "Identification and management of potential ethical issues.",
    weight: 0.16
  },
  KN65: {
    id: "KN65",
    domain: 8,
    domainName: "Ethical, Legal, and Professional Issues",
    name: "Ethical decision-making models",
    description: "Models of ethical decision-making.",
    weight: 0.16
  },
  KN66: {
    id: "KN66",
    domain: 8,
    domainName: "Ethical, Legal, and Professional Issues",
    name: "Continuing professional development",
    description: "Approaches for continuing professional development.",
    weight: 0.16
  },
  KN67: {
    id: "KN67",
    domain: 8,
    domainName: "Ethical, Legal, and Professional Issues",
    name: "Emerging social and ethical issues",
    description: "Emerging social, legal, ethical, and policy issues and their impact on psychological practice.",
    weight: 0.16
  },
  KN68: {
    id: "KN68",
    domain: 8,
    domainName: "Ethical, Legal, and Professional Issues",
    name: "Client and patient rights",
    description: "Client and patient rights.",
    weight: 0.16
  },
  KN69: {
    id: "KN69",
    domain: 8,
    domainName: "Ethical, Legal, and Professional Issues",
    name: "Ethical issues in research",
    description: "Ethical issues in the conduct of research.",
    weight: 0.16
  },
  KN70: {
    id: "KN70",
    domain: 8,
    domainName: "Ethical, Legal, and Professional Issues",
    name: "Ethical issues in supervision",
    description: "Ethical issues in supervision.",
    weight: 0.16
  },
  KN71: {
    id: "KN71",
    domain: 8,
    domainName: "Ethical, Legal, and Professional Issues",
    name: "Ethical issues in technology",
    description: "Ethical issues in technology-assisted psychological services.",
    weight: 0.16
  },
}

// Index KNs by domain for quick lookup
export const KN_BY_DOMAIN: Record<number, string[]> = {
  1: ["KN1", "KN2", "KN3", "KN4", "KN5"],
  2: ["KN6", "KN7", "KN8", "KN9", "KN10", "KN11", "KN12", "KN13"],
  3: ["KN14", "KN15", "KN16", "KN17", "KN18", "KN19", "KN20"],
  4: ["KN21", "KN22", "KN23", "KN24", "KN25", "KN26", "KN27", "KN28"],
  5: ["KN29", "KN30", "KN31", "KN32", "KN33", "KN34", "KN35", "KN36", "KN37", "KN38", "KN39", "KN40", "KN41"],
  6: ["KN42", "KN43", "KN44", "KN45", "KN46", "KN47", "KN48", "KN49", "KN50", "KN51", "KN52"],
  7: ["KN53", "KN54", "KN55", "KN56", "KN57", "KN58", "KN59", "KN60"],
  8: ["KN61", "KN62", "KN63", "KN64", "KN65", "KN66", "KN67", "KN68", "KN69", "KN70", "KN71"],
}

// Domain weights for reference
export const DOMAIN_WEIGHTS: Record<number, number> = {
  1: 0.10,
  2: 0.13,
  3: 0.11,
  4: 0.12,
  5: 0.16,
  6: 0.15,
  7: 0.07,
  8: 0.16,
}

// Get all KN IDs in order
export const ALL_KNS = Object.keys(KN_DATA).sort((a, b) => {
  const numA = parseInt(a.slice(2))
  const numB = parseInt(b.slice(2))
  return numA - numB
})
