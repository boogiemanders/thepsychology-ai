#!/usr/bin/env node
// Exports EPPP priority engine config as JSON for iOS app consumption
// Run: node scripts/export-priority-config.mjs

import { writeFileSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = join(__dirname, '..')

// -- Domain config (from kn-data.ts DOMAIN_WEIGHTS + KN_BY_DOMAIN) --

const domainWeights = { "1": 0.10, "2": 0.13, "3": 0.11, "4": 0.12, "5": 0.16, "6": 0.15, "7": 0.07, "8": 0.16 }
const defaultQuestionCounts = { "1": 23, "2": 29, "3": 25, "4": 27, "5": 36, "6": 34, "7": 18, "8": 33 }

const knByDomain = {
  "1": ["KN1", "KN2", "KN3", "KN4", "KN5"],
  "2": ["KN6", "KN7", "KN8", "KN9", "KN10", "KN11", "KN12", "KN13"],
  "3": ["KN14", "KN15", "KN16", "KN17", "KN18", "KN19", "KN20"],
  "4": ["KN21", "KN22", "KN23", "KN24", "KN25", "KN26", "KN27", "KN28"],
  "5": ["KN29", "KN30", "KN31", "KN32", "KN33", "KN34", "KN35", "KN36", "KN37", "KN38", "KN39", "KN40", "KN41"],
  "6": ["KN42", "KN43", "KN44", "KN45", "KN46", "KN47", "KN48", "KN49", "KN50", "KN51", "KN52"],
  "7": ["KN53", "KN54", "KN55", "KN56", "KN57", "KN58", "KN59", "KN60"],
  "8": ["KN61", "KN62", "KN63", "KN64", "KN65", "KN66", "KN67", "KN68", "KN69", "KN70", "KN71"]
}

const domainNames = {
  "1": "Biological Bases of Behavior",
  "2": "Cognitive-Affective Bases of Behavior",
  "3": "Social and Cultural Bases of Behavior",
  "4": "Growth and Lifespan Development",
  "5": "Assessment and Diagnosis",
  "6": "Treatment, Intervention, Prevention, and Supervision",
  "7": "Research Methods and Statistics",
  "8": "Ethical, Legal, and Professional Issues"
}

// -- KN data (from kn-data.ts KN_DATA) --
const knData = {
  "KN1": { "domain": 1, "name": "Neurobiological and genetic bases", "description": "Functional correlates and determinants of the neurobiological and genetic bases of behavior." },
  "KN2": { "domain": 1, "name": "Drug classification and mechanisms", "description": "Drug classification, mechanisms of action, and desired/adverse effects of therapeutic agents." },
  "KN3": { "domain": 1, "name": "Treatment guidelines and trials", "description": "Results from major trials and general guidelines for pharmacological, psychotherapeutic, and combined treatment." },
  "KN4": { "domain": 1, "name": "Behavioral genetics", "description": "Behavioral genetics, transmission and expression of genetic information." },
  "KN5": { "domain": 1, "name": "Assessment methodologies", "description": "Applications of structural and functional brain imaging methods." },
  "KN6": { "domain": 2, "name": "Theories and models of intelligence", "description": "Major research-based theories and models of intelligence." },
  "KN7": { "domain": 2, "name": "Theories and models of learning", "description": "Major research-based theories, models, and principles of learning." },
  "KN8": { "domain": 2, "name": "Theories and models of memory", "description": "Major research-based theories and models of memory." },
  "KN9": { "domain": 2, "name": "Theories and models of motivation", "description": "Major research-based theories and models of motivation." },
  "KN10": { "domain": 2, "name": "Theories and models of emotion", "description": "Major research-based theories and models of emotion." },
  "KN11": { "domain": 2, "name": "Elements of cognition", "description": "Sensation, perception, attention, language, information processing, executive functioning." },
  "KN12": { "domain": 2, "name": "Relations among cognitions and affect", "description": "Relations among cognitions/beliefs, behavior, affect, temperament, and mood." },
  "KN13": { "domain": 2, "name": "Psychosocial factors influence", "description": "Influence of psychosocial factors on cognitions/beliefs and behaviors." },
  "KN14": { "domain": 3, "name": "Theories of social cognition", "description": "Person perception, development of stereotypes, prejudice." },
  "KN15": { "domain": 3, "name": "Social interaction and relationships", "description": "Attraction, aggression, altruism, communication, empathy." },
  "KN16": { "domain": 3, "name": "Group and systems processes", "description": "School, work, and family systems, conformity, persuasion." },
  "KN17": { "domain": 3, "name": "Personality theories and models", "description": "Major research-based personality theories and models." },
  "KN18": { "domain": 3, "name": "Cultural and sociopolitical psychology", "description": "Privilege, cross-cultural comparisons, acculturation." },
  "KN19": { "domain": 3, "name": "Identity diversity and intersectionality", "description": "Psychological impact of diversity on individuals, families, and systems." },
  "KN20": { "domain": 3, "name": "Causes and effects of oppression", "description": "Causes, manifestations, and effects of oppression." },
  "KN21": { "domain": 4, "name": "Normal growth and development", "description": "Normal growth and development across the lifespan." },
  "KN22": { "domain": 4, "name": "Individual-environment interaction", "description": "Influence of individual-environment interaction on development over time." },
  "KN23": { "domain": 4, "name": "Developmental theories and models", "description": "Major research-based theories and models of development." },
  "KN24": { "domain": 4, "name": "Language development", "description": "Influence of diverse identities on development." },
  "KN25": { "domain": 4, "name": "Family development and functioning", "description": "Family development, configuration, and functioning across the lifespan." },
  "KN26": { "domain": 4, "name": "Life events and development", "description": "Life events that can influence the course of development." },
  "KN27": { "domain": 4, "name": "Risk and protective factors", "description": "Risk and protective factors that may impact developmental course." },
  "KN28": { "domain": 4, "name": "Disorders impacting development", "description": "Disorders and diseases that impact expected course of development." },
  "KN29": { "domain": 5, "name": "Psychometric theories and test characteristics", "description": "Test construction, standardization, reliability, validity, fairness, and bias." },
  "KN30": { "domain": 5, "name": "Assessment theories and models", "description": "Developmental, behavioral, ecological, neuropsychological models." },
  "KN31": { "domain": 5, "name": "Assessment methods and strengths", "description": "Self-report, multi-informant reports, direct observation, interviews." },
  "KN32": { "domain": 5, "name": "Commonly used instruments", "description": "Commonly used instruments for measuring characteristics and behaviors." },
  "KN33": { "domain": 5, "name": "Differential diagnosis", "description": "Differential diagnosis and integration of non-psychological information." },
  "KN34": { "domain": 5, "name": "Group and organizational assessment", "description": "Program evaluation, needs assessment, organizational assessment." },
  "KN35": { "domain": 5, "name": "Selection and adaptation of methods", "description": "Cultural appropriateness, trans-cultural adaptation, language accommodations." },
  "KN36": { "domain": 5, "name": "Classification systems and diagnosis", "description": "Dimensional vs. categorical approaches to diagnosis." },
  "KN37": { "domain": 5, "name": "Evidence-based interpretation", "description": "Base rates, group differences, cultural biases, heuristics." },
  "KN38": { "domain": 5, "name": "Epidemiology and base rates", "description": "Epidemiology and base rates of psychological disorders." },
  "KN39": { "domain": 5, "name": "Psychopathology theories", "description": "Major research-based theories and models of psychopathology." },
  "KN40": { "domain": 5, "name": "Outcome measurement", "description": "Measurement of outcomes due to prevention or intervention efforts." },
  "KN41": { "domain": 5, "name": "Technology in assessment", "description": "Use of technology in implementing tests, surveys, and assessment." },
  "KN42": { "domain": 6, "name": "Treatment decision-making factors", "description": "Treatment matching, cost-benefit, readiness to change." },
  "KN43": { "domain": 6, "name": "Treatment and intervention theories", "description": "Contemporary research-based theories and models of treatment." },
  "KN44": { "domain": 6, "name": "Treatment techniques and interventions", "description": "Evidence for comparative efficacy and effectiveness." },
  "KN45": { "domain": 6, "name": "Prevention and intervention with special populations", "description": "Methods for diverse and special populations." },
  "KN46": { "domain": 6, "name": "Growth-enhancing interventions", "description": "Interventions for individuals, couples, families, groups, organizations." },
  "KN47": { "domain": 6, "name": "Consultation models and processes", "description": "Research-based consultation models and processes." },
  "KN48": { "domain": 6, "name": "Vocational and career development", "description": "Research-based models of vocational and career development." },
  "KN49": { "domain": 6, "name": "Telepsychology and technology", "description": "Technology-assisted psychological services." },
  "KN50": { "domain": 6, "name": "Healthcare systems and economics", "description": "Healthcare systems, structures, and economics." },
  "KN51": { "domain": 6, "name": "Health promotion and wellness", "description": "Approaches to health promotion, risk reduction, resilience." },
  "KN52": { "domain": 6, "name": "Supervision theories and models", "description": "Contemporary theories and models of supervision." },
  "KN53": { "domain": 7, "name": "Sampling and data collection", "description": "Sampling and data collection methods." },
  "KN54": { "domain": 7, "name": "Study design", "description": "Case, correlational, quasi-experimental, and experimental studies." },
  "KN55": { "domain": 7, "name": "Analytic methods", "description": "Qualitative and quantitative methods, meta-analysis, factor analysis." },
  "KN56": { "domain": 7, "name": "Statistical interpretation", "description": "Power, effect size, causation vs. association, clinical significance." },
  "KN57": { "domain": 7, "name": "Critical appraisal of research", "description": "Design adequacy, generalizability, threats to validity." },
  "KN58": { "domain": 7, "name": "Evaluation strategies", "description": "Needs assessment, process evaluation, cost-benefit analysis." },
  "KN59": { "domain": 7, "name": "Community involvement in research", "description": "Community involvement and participation in research." },
  "KN60": { "domain": 7, "name": "Dissemination of research", "description": "Dissemination and presentation of research findings." },
  "KN61": { "domain": 8, "name": "Ethical principles and codes", "description": "Current ethical principles and codes (APA, CPA)." },
  "KN62": { "domain": 8, "name": "Professional standards and guidelines", "description": "Standards for educational and psychological testing." },
  "KN63": { "domain": 8, "name": "Laws and judicial decisions", "description": "Laws, statutes, and judicial decisions affecting practice." },
  "KN64": { "domain": 8, "name": "Identification and management of ethical issues", "description": "Identification and management of potential ethical issues." },
  "KN65": { "domain": 8, "name": "Ethical decision-making models", "description": "Models of ethical decision-making." },
  "KN66": { "domain": 8, "name": "Continuing professional development", "description": "Approaches for continuing professional development." },
  "KN67": { "domain": 8, "name": "Emerging social and ethical issues", "description": "Emerging social, legal, ethical, and policy issues." },
  "KN68": { "domain": 8, "name": "Client and patient rights", "description": "Client and patient rights." },
  "KN69": { "domain": 8, "name": "Ethical issues in research", "description": "Ethical issues in the conduct of research." },
  "KN70": { "domain": 8, "name": "Ethical issues in supervision", "description": "Ethical issues in supervision." },
  "KN71": { "domain": 8, "name": "Ethical issues in technology", "description": "Ethical issues in technology-assisted psychological services." }
}

// -- KN Topic Mapping (from kn-topic-mapping.ts) --
const knTopicMapping = {
  "KN1": ["1-1", "1-2", "1-3", "1-4", "1-5"],
  "KN2": ["1-7", "1-8"],
  "KN3": ["1-7", "1-8", "6-1", "6-2", "6-3"],
  "KN4": ["1-1", "1-2", "1-3"],
  "KN5": ["1-6"],
  "KN6": ["2-1", "2-2", "2-3", "2-4"],
  "KN7": ["2-1", "2-2", "2-3", "2-4"],
  "KN8": ["1-4", "2-5"],
  "KN9": ["2-6", "6-1"],
  "KN10": ["2-6", "6-5"],
  "KN11": [],
  "KN12": ["5d-2", "5d-3", "5d-4", "5d-5"],
  "KN13": ["4-4", "4-6", "4-7"],
  "KN14": ["3s-1", "3s-2"],
  "KN15": ["3s-3", "3s-4"],
  "KN16": ["3s-5", "3s-6"],
  "KN17": ["3s-7", "3s-8"],
  "KN18": ["3s-8", "3c-1", "3c-2"],
  "KN19": ["3c-1", "3c-2"],
  "KN20": ["4-6", "4-7"],
  "KN21": ["4-1", "4-2"],
  "KN22": ["4-3"],
  "KN23": ["4-4"],
  "KN24": ["4-5"],
  "KN25": ["4-6", "4-7"],
  "KN26": ["4-8"],
  "KN27": ["4-7", "4-9"],
  "KN28": ["4-9"],
  "KN29": ["5a-4", "5a-5"],
  "KN30": ["5a-2", "5a-4"],
  "KN31": ["5a-0"],
  "KN32": ["5d-0", "5d-1", "5d-2", "5d-3", "5d-4", "5d-5", "5d-6", "5d-7", "5d-8", "5d-9", "5d-10"],
  "KN33": ["5d-0", "5d-1", "5d-2", "5d-3", "5d-4"],
  "KN34": ["5a-4", "5a-5"],
  "KN35": ["1-5", "5d-4"],
  "KN36": ["5t-0", "5t-1", "5t-2", "5t-3"],
  "KN37": ["5a-0", "5a-4", "5a-5"],
  "KN38": ["5a-1"],
  "KN39": ["5a-1"],
  "KN40": ["5t-2", "5t-3"],
  "KN41": ["5a-0"],
  "KN42": ["6-1"],
  "KN43": ["6-2"],
  "KN44": ["6-3"],
  "KN45": ["6-4"],
  "KN46": ["6-5", "8-6"],
  "KN47": ["6-5"],
  "KN48": ["6-5"],
  "KN49": ["6-1", "6-2", "6-3"],
  "KN50": ["6-1", "6-2", "6-3", "6-4"],
  "KN51": [],
  "KN52": [],
  "KN53": ["7-1", "7-2", "7-3"],
  "KN54": ["7-2"],
  "KN55": ["7-4", "7-5", "7-6"],
  "KN56": ["7-1"],
  "KN57": ["7-3"],
  "KN58": ["7-5", "7-6"],
  "KN59": ["7-5"],
  "KN60": ["7-2"],
  "KN61": ["8-1", "8-2", "8-3", "8-4", "8-5"],
  "KN62": ["8-1", "8-2"],
  "KN63": ["8-2", "8-3"],
  "KN64": ["8-3", "8-4"],
  "KN65": ["8-1", "8-6"],
  "KN66": ["8-4", "8-6"],
  "KN67": ["8-5", "8-6"],
  "KN68": ["8-6"],
  "KN69": ["8-1", "3c-1", "3c-2"],
  "KN70": ["8-6"],
  "KN71": ["8-6"]
}

// -- Topic to lesson slug mapping (from eppp-data.ts comments + topic-content-v4 filenames) --
const topicToLessonSlug = {
  // Domain 1 (prefix: 1-)
  "1-0": "1-cerebral-cortex",
  "1-1": "1-hindbrain-midbrain-forebrain",
  "1-2": "2-stress-and-emotion",
  "1-3": "1-memory-and-sleep",
  "1-4": "1-neurons-and-neurotransmitters",
  "1-5": "1-neurological-endocrine-disorders",
  "1-6": "1-pharmacology-antidepressants-antipsychotics",
  "1-7": "1-pharmacology-other-drugs",
  "1-8": "1-sensory-perception",
  // Domain 2 (prefix: 2-)
  "2-0": "2-pavlov-and-classical-conditioning",
  "2-1": "2-classical-conditioning-interventions",
  "2-2": "2-operant-conditioning-interventions",
  "2-3": "2-memory",
  "2-4": "2-skinner-and-operant-conditioning",
  "2-5": "2-memory",
  "2-6": "2-stress-and-emotion",
  // Domain 3 Social (prefix: 3s-)
  "3s-0": "3-connection",
  "3s-1": "3-attitudes",
  "3s-2": "3-persuasion",
  "3s-3": "3-helping-and-hurting",
  "3s-4": "3-why-people-do-things",
  "3s-5": "3-errors-and-shortcuts",
  "3s-6": "3-group-influences",
  "3s-7": "3-influence",
  "3s-8": "3-influence",
  // Domain 3 Cultural (prefix: 3c-)
  "3c-0": "3-cultural-identity",
  "3c-1": "3-cultural-identity",
  "3c-2": "3-cultural-concepts",
  // Domain 4 (prefix: 4-)
  "4-0": "4-cognitive-development",
  "4-1": "4-heredity-and-environment",
  "4-2": "4-before-birth",
  "4-3": "4-language-development",
  "4-4": "4-body-growth",
  "4-5": "4-school-and-family",
  "4-6": "4-bonding-and-attachment",
  "4-7": "4-morality",
  "4-8": "4-temperament-and-personality",
  "4-9": "4-school-and-family",
  // Domain 5 Assessment (prefix: 5a-)
  "5a-0": "5-clinical-tests",
  "5a-1": "5-career-interests",
  "5a-2": "5-mmpi",
  "5a-3": "5-cognitive-tests",
  "5a-4": "5-personality-tests",
  "5a-5": "5-iq-tests",
  // Domain 5 Diagnosis (prefix: 5d-)
  "5d-0": "5-anxiety-and-ocd",
  "5d-1": "5-mood",
  "5d-2": "5-acting-out",
  "5d-3": "5-eating-sleep-elimination",
  "5d-4": "5-neurocognitive",
  "5d-5": "5-neurodevelopmental",
  "5d-6": "5-personality",
  "5d-7": "5-psychosis",
  "5d-8": "5-sex-and-gender",
  "5d-9": "5-substance-misuse",
  "5d-10": "5-trauma-dissociation-somatic",
  // Domain 5 Test Construction (prefix: 5t-)
  "5t-0": "5-items-and-reliability",
  "5t-1": "5-interpreting-scores",
  "5t-2": "5-what-tests-measure",
  "5t-3": "5-can-tests-predict",
  // Domain 6 (prefix: 6-)
  "6-0": "6-brief-therapies",
  "6-1": "6-cbt",
  "6-2": "6-family-and-group",
  "6-3": "6-prevention-and-consultation",
  "6-4": "6-psychodynamic-and-humanistic",
  "6-5": "6-prevention-and-consultation",
  // Domain 7 (prefix: 7-)
  "7-0": "7-correlation-and-regression",
  "7-1": "7-stats-tests",
  "7-2": "7-inferential-stats",
  "7-3": "7-internal-external-validity",
  "7-4": "7-research-designs",
  "7-5": "7-variables",
  "7-6": "7-variables",
  // Domain 8 (prefix: 8-)
  "8-0": "8-standards-1-2",
  "8-1": "8-standards-3-4",
  "8-2": "8-standards-5-6",
  "8-3": "8-standards-7-8",
  "8-4": "8-standards-9-10",
  "8-5": "8-practice-issues",
  "8-6": "8-practice-issues"
}

// -- Build domains config --
const domains = {}
for (const [num, kns] of Object.entries(knByDomain)) {
  domains[num] = {
    name: domainNames[num],
    weight: domainWeights[num],
    knowledgeStatements: kns,
    defaultQuestionCount: defaultQuestionCounts[num]
  }
}

// -- Assemble and write --
const config = {
  domains,
  domainWeights,
  knData,
  knTopicMapping,
  topicToLessonSlug,
  defaultQuestionCounts
}

const outputPath = join(ROOT, 'public/priority-config.json')
writeFileSync(outputPath, JSON.stringify(config, null, 2))

console.log(`Written to ${outputPath}`)
console.log(`Domains: ${Object.keys(domains).length}`)
console.log(`KN statements: ${Object.keys(knData).length}`)
console.log(`Topic mappings: ${Object.keys(knTopicMapping).length}`)
console.log(`Lesson slug mappings: ${Object.keys(topicToLessonSlug).length}`)
