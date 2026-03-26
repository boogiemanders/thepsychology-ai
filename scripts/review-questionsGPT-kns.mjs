#!/usr/bin/env node

import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()
const QUESTIONS_DIR = path.join(ROOT, 'questionsGPT')
const LESSONS_DIR = path.join(ROOT, 'topic-content-v4')
const KNS_PATH = path.join(ROOT, 'KNs.md')

const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'because', 'by', 'can', 'current', 'do', 'does',
  'for', 'from', 'how', 'if', 'in', 'include', 'including', 'into', 'is', 'it', 'its', 'of',
  'on', 'or', 'pertaining', 'should', 'such', 'than', 'that', 'the', 'their', 'them', 'these',
  'this', 'those', 'to', 'use', 'used', 'using', 'various', 'what', 'when', 'which', 'with',
  'within', 'your', 'major', 'models', 'theories', 'theory', 'model', 'issues', 'issue',
  'methods', 'method', 'research', 'based', 'psychological', 'psychology', 'client', 'clients',
  'question', 'questions', 'knowledge', 'domain', 'domains', 'factors', 'factor', 'approaches',
  'approach', 'best', 'most', 'following', 'according', 'primary', 'common', 'typical'
])

const DOMAIN_FOLDER_MAP = {
  '1': '1 Biopsychology (Neuroscience & Pharmacology)',
  '2': '2 Learning and Memory',
  '3-social': '3 Social Psychology',
  '3-cultural': '3 Cultural Considerations',
  '4': '4 Development',
  '5-assessment': '5 Assessment',
  '5-diagnosis': '5 Diagnosis',
  '5-test': '5 Test Construction',
  '6': '6 Clinical Interventions',
  '7': '7 Research and Stats',
  '8': '8 Ethics',
  '3-5-6': '2 3 5 6 I-O Psychology',
}

const LESSON_DEFAULT_KN = {
  '1-cerebral-cortex': 'KN1',
  '1-hindbrain-midbrain-forebrain': 'KN1',
  '1-memory-and-sleep': 'KN1',
  '1-neurological-endocrine-disorders': 'KN1',
  '1-neurons-and-neurotransmitters': 'KN1',
  '1-pharmacology-antidepressants-antipsychotics': 'KN2',
  '1-pharmacology-other-drugs': 'KN2',
  '1-sensory-perception': 'KN1',
  '2-3-work-satisfaction': 'KN16',
  '2-classical-conditioning-interventions': 'KN7',
  '2-memory': 'KN8',
  '2-operant-conditioning-interventions': 'KN7',
  '2-pavlov-and-classical-conditioning': 'KN7',
  '2-skinner-and-operant-conditioning': 'KN7',
  '2-stress-and-emotion': 'KN10',
  '2-work-motivation': 'KN9',
  '3-attitudes': 'KN14',
  '3-connection': 'KN15',
  '3-cultural-concepts': 'KN18',
  '3-cultural-identity': 'KN19',
  '3-errors-and-shortcuts': 'KN14',
  '3-group-influences': 'KN16',
  '3-helping-and-hurting': 'KN15',
  '3-influence': 'KN16',
  '3-persuasion': 'KN16',
  '3-why-people-do-things': 'KN14',
  '4-before-birth': 'KN27',
  '4-body-growth': 'KN21',
  '4-bonding-and-attachment': 'KN25',
  '4-cognitive-development': 'KN23',
  '4-heredity-and-environment': 'KN22',
  '4-language-development': 'KN21',
  '4-morality': 'KN23',
  '4-school-and-family': 'KN22',
  '4-temperament-and-personality': 'KN21',
  '5-6-evaluating-jobs': 'KN34',
  '5-6-leadership': 'KN46',
  '5-6-training-and-evaluation': 'KN46',
  '5-6-workplace-decisions': 'KN16',
  '5-acting-out': 'KN36',
  '5-anxiety-and-ocd': 'KN36',
  '5-can-tests-predict': 'KN29',
  '5-career-interests': 'KN32',
  '5-clinical-tests': 'KN32',
  '5-cognitive-tests': 'KN32',
  '5-do-hiring-tools-work': 'KN29',
  '5-eating-sleep-elimination': 'KN36',
  '5-hiring-methods': 'KN34',
  '5-interpreting-scores': 'KN37',
  '5-iq-tests': 'KN32',
  '5-items-and-reliability': 'KN29',
  '5-mmpi': 'KN32',
  '5-mood': 'KN36',
  '5-neurocognitive': 'KN36',
  '5-neurodevelopmental': 'KN36',
  '5-personality': 'KN36',
  '5-personality-tests': 'KN32',
  '5-psychosis': 'KN36',
  '5-sex-and-gender': 'KN36',
  '5-substance-misuse': 'KN36',
  '5-trauma-dissociation-somatic': 'KN36',
  '5-what-tests-measure': 'KN29',
  '6-brief-therapies': 'KN43',
  '6-cbt': 'KN43',
  '6-family-and-group': 'KN43',
  '6-how-careers-develop': 'KN48',
  '6-how-orgs-change': 'KN46',
  '6-management-theories': 'KN46',
  '6-prevention-and-consultation': 'KN47',
  '6-psychodynamic-and-humanistic': 'KN43',
  '7-correlation-and-regression': 'KN55',
  '7-inferential-stats': 'KN55',
  '7-internal-external-validity': 'KN57',
  '7-research-designs': 'KN54',
  '7-stats-tests': 'KN55',
  '7-variables': 'KN54',
  '8-practice-issues': 'KN64',
  '8-standards-1-2': 'KN61',
  '8-standards-3-4': 'KN61',
  '8-standards-5-6': 'KN61',
  '8-standards-7-8': 'KN61',
  '8-standards-9-10': 'KN61',
}

const MANUAL_KN_OVERRIDES = {
  'A psychiatrist consults you regarding a 35-year-old patient recently diagnosed with bipolar I disorder who is experiencing a manic episode with euphoric mood and no rapid cycling features. Which medication would be considered the first-line pharmacological treatment?': 'KN3',
  'A psychiatrist consults a psychologist regarding pharmacological management for a client newly diagnosed with Bipolar I Disorder following a first manic episode with grandiosity, decreased need for sleep, and pressured speech. According to established treatment guidelines, which medication class represents the first-line pharmacological intervention for Bipolar I Disorder?': 'KN3',
  'A community health program aims to increase cervical cancer screening rates among women who already believe the procedure is effective but nonetheless fail to schedule appointments. According to the Theory of Planned Behavior, which intervention MOST directly targets the subjective norm component in order to strengthen behavioral intention?': 'KN13',
  "According to the theory of planned behavior, which factor is NOT considered a determinant of a person's intention to perform a behavior?": 'KN13',
  'Which of the following statements best reflects the concept of trait theory in personality psychology?': 'KN17',
  'A community mental health center establishes a halfway house program for individuals with severe mental illness who have completed inpatient psychiatric treatment. Residents receive social skills training, vocational rehabilitation, and ongoing medication management while gradually reintegrating into the community. This program is BEST classified as which level of prevention?': 'KN45',
  'A community mental health center serving a racially diverse urban population reviews its utilization data and finds that clients from racial and ethnic minority backgrounds are terminating services significantly earlier than non-minority clients with comparable presenting problems and insurance coverage. Which of the following most accurately characterizes what the empirical literature predicts about this pattern and its etiology?': 'KN45',
  "Following a six-month psychiatric hospitalization for treatment-resistant bipolar disorder, a patient is referred to a supported housing program where staff provide daily living skills coaching, facilitate gradual reintegration into community activities, and coordinate outpatient follow-up care. The treatment team explicitly emphasizes relapse prevention and functional rehabilitation as the program's goals. According to Caplan's classic prevention framework, this program is best classified as:": 'KN45',
  'What is an important factor psychologists should discuss with managed care patients?': 'KN50',
  'Which model of stepped care for depression prioritizes the least restrictive but effective treatments first and systematically monitors treatment response to adjust care?': 'KN50',
  'What is the primary purpose of a formative evaluation in training program development?': 'KN58',
  "Which evaluation component involves determining if a program's effectiveness can be practically measured before conducting a full evaluation?": 'KN58',
  'According to the Dessinger-Moseley full-scope evaluation model, what type of evaluation is conducted a significant time after training to assess long-term effects?': 'KN58',
  'What is the role of a meta-evaluation in the Dessinger-Moseley full-scope evaluation model?': 'KN58',
  'Which economic evaluation method compares the costs and benefits of interventions by converting both into monetary terms?': 'KN58',
  'Which of the following best describes the ethical considerations regarding authorship in academic publications?': 'KN60',
  'What is a key criterion for authorship in research papers according to ethical standards?': 'KN60',
  'A researcher conducts a study in which participants are led to believe they are evaluating a new educational program, when in fact the study examines conformity to authority figures. After data collection is complete, the researcher\'s primary ethical obligation is to:': 'KN69',
  'A graduate student completes her doctoral dissertation with substantial intellectual contributions from her faculty advisor, who helped design the study methodology, conducted the primary statistical analyses, and wrote significant portions of the results and discussion sections. When the dissertation is submitted for publication, what authorship arrangement is MOST consistent with APA Ethics Code Standard 8.12?': 'KN60',
  'When is using deception in research ethically justifiable?': 'KN69',
  'What must psychologists do about Institutional Review Board approval before starting research with human participants?': 'KN69',
  'Which statement best describes the APA Ethics Code requirements for informed consent in research involving children who are unable to provide consent themselves?': 'KN69',
  'According to the Ethics Code, what must psychologists do when they discover significant errors in their published research data?': 'KN60',
  'What distinguishes duplicate publication from piecemeal publication according to APA guidelines?': 'KN60',
  "After research is published, what are psychologists' obligations around sharing data for verification?": 'KN60',
  'As a peer reviewer for manuscripts or grant proposals, what is a key ethical obligation?': 'KN60',
  'According to the APA Ethics Code, what must psychologists consider when providing telepsychology services in emerging areas with incomplete evidence for effectiveness?': 'KN71',
  'What is the recommended approach for psychologists using telepsychology services to protect client confidentiality, according to APA Guidelines?': 'KN71',
  "Which of the following best reflects the psychologist's ethical responsibilities when providing telepsychology services to enhance confidentiality?": 'KN71',
  'If a psychologist switches a client from in-person therapy to telepsychology, what ethical practice is recommended according to APA Guidelines for the Practice of Telepsychology?': 'KN71',
}

const KN_RULES = {
  KN1: {
    tokens: [
      'brain', 'cortex', 'cortical', 'amygdala', 'hippocampus', 'thalamus', 'hypothalamus',
      'cerebellum', 'brainstem', 'hindbrain', 'midbrain', 'forebrain', 'parietal', 'frontal',
      'occipital', 'temporal', 'neuron', 'neuronal', 'neurotransmitter', 'axon', 'dendrite',
      'synapse', 'action', 'potential', 'resting', 'sleep', 'rem', 'circadian', 'endocrine',
      'hormone', 'pituitary', 'adrenal', 'thyroid', 'alzheimer', 'parkinson', 'stroke',
      'lesion', 'aphasia', 'agnosia', 'apraxia', 'sensation', 'sensory', 'perception',
      'visual', 'auditory', 'olfactory', 'gustatory', 'somatosensory', 'corpus', 'callosum',
      'cingulate'
    ],
    phrases: ['action potential', 'sleep stage', 'resting potential', 'split brain']
  },
  KN2: {
    tokens: [
      'medication', 'medications', 'drug', 'drugs', 'pharmacology', 'antidepressant',
      'antidepressants', 'antipsychotic', 'antipsychotics', 'ssri', 'snri', 'maoi', 'tca',
      'benzodiazepine', 'benzodiazepines', 'stimulant', 'stimulants', 'lithium', 'valproate',
      'clozapine', 'haloperidol', 'risperidone', 'olanzapine', 'prozac', 'fluoxetine',
      'sertraline', 'side', 'effect', 'adverse', 'withdrawal', 'tolerance', 'beta', 'blocker',
      'ritalin', 'methylphenidate', 'amphetamine', 'opioid', 'alcohol', 'nicotine', 'cannabis'
    ],
    phrases: ['side effect', 'mechanism of action', 'first line medication']
  },
  KN3: {
    tokens: [
      'combined', 'combination', 'monotherapy', 'augmentation', 'trial', 'guideline', 'guidelines',
      'comparative', 'efficacy', 'effectiveness', 'psychotherapeutic', 'pharmacological'
    ],
    phrases: ['combined treatment', 'treatment guideline', 'major trial']
  },
  KN4: {
    tokens: [
      'gene', 'genes', 'genetic', 'genetics', 'heredity', 'heritable', 'heritability', 'chromosome',
      'genotype', 'phenotype', 'epigenetic', 'epigenetics', 'allele', 'twin', 'adoption', 'pku',
      'phenylketonuria', 'klinefelter', 'turner', 'xyy'
    ],
    phrases: ['behavioral genetics', 'genetic screening']
  },
  KN5: {
    tokens: [
      'mri', 'fmri', 'pet', 'ct', 'eeg', 'erp', 'imaging', 'scan', 'scanning', 'screening',
      'screen', 'biomarker', 'spectroscopy', 'monitoring'
    ],
    phrases: ['functional imaging', 'structural imaging', 'brain imaging', 'therapeutic drug monitoring']
  },
  KN6: {
    tokens: [
      'intelligence', 'iq', 'spearman', 'sternberg', 'gardner', 'gfactor', 'fluid', 'crystallized',
      'mental', 'age', 'multiple', 'intelligences', 'triarchic', 'gifted'
    ],
    phrases: ['multiple intelligences', 'fluid intelligence', 'crystallized intelligence']
  },
  KN7: {
    tokens: [
      'reinforcement', 'punishment', 'conditioning', 'classical', 'operant', 'habituation',
      'extinction', 'acquisition', 'generalization', 'stimulus', 'response', 'schedule',
      'shaping', 'chaining', 'token', 'economy', 'observational', 'vicarious', 'bandura',
      'exposure', 'counterconditioning', 'desensitization'
    ],
    phrases: ['operant conditioning', 'classical conditioning', 'response prevention']
  },
  KN8: {
    tokens: [
      'memory', 'encoding', 'storage', 'retrieval', 'recall', 'recognition', 'episodic',
      'semantic', 'procedural', 'sensory', 'shortterm', 'longterm', 'working', 'interference',
      'proactive', 'retroactive', 'rehearsal', 'mnemonic', 'prospective', 'flashbulb', 'chunking',
      'serial', 'position', 'forgetting'
    ],
    phrases: ['working memory', 'serial position', 'levels of processing', 'prospective memory']
  },
  KN9: {
    tokens: [
      'motivation', 'motive', 'incentive', 'drive', 'arousal', 'need', 'needs', 'achievement',
      'affiliation', 'power', 'intrinsic', 'extrinsic', 'goal', 'goals', 'maslow', 'herzberg',
      'selfdetermination', 'expectancy'
    ],
    phrases: ['two factor theory', 'need for achievement', 'self determination']
  },
  KN10: {
    tokens: [
      'emotion', 'emotional', 'affect', 'stress', 'anxiety', 'fear', 'james', 'lange', 'cannon',
      'bard', 'schachter', 'appraisal', 'facial', 'feedback', 'arousal', 'polygraph'
    ],
    phrases: ['james lange', 'cannon bard', 'facial feedback']
  },
  KN11: {
    tokens: [
      'attention', 'language', 'linguistic', 'perception', 'perceptual', 'sensation',
      'information', 'processing', 'executive', 'visualspatial', 'visuospatial', 'problem',
      'solving', 'decision', 'making'
    ],
    phrases: ['executive functioning', 'information processing', 'visual spatial']
  },
  KN12: {
    tokens: [
      'schema', 'schemas', 'belief', 'beliefs', 'cognitive', 'distortion', 'distortions',
      'automatic', 'thought', 'thoughts', 'mood', 'affect', 'learned', 'helplessness',
      'irrational', 'ellis', 'beck', 'attribution'
    ],
    phrases: ['automatic thoughts', 'cognitive distortion', 'learned helplessness', 'collaborative empiricism']
  },
  KN13: {
    tokens: ['psychosocial', 'socialization', 'peer', 'family', 'media', 'environmental'],
    phrases: ['psychosocial factors']
  },
  KN14: {
    tokens: [
      'attitude', 'attitudes', 'attribution', 'stereotype', 'stereotypes', 'prejudice',
      'heuristic', 'heuristics', 'bias', 'biases', 'dissonance', 'person', 'perception',
      'social', 'cognition'
    ],
    phrases: ['fundamental attribution', 'actor observer', 'self serving bias', 'cognitive dissonance']
  },
  KN15: {
    tokens: [
      'attraction', 'aggression', 'altruism', 'empathy', 'helping', 'bystander', 'communication',
      'nonverbal', 'verbal', 'relationship', 'relationships', 'mate', 'selection', 'intimacy'
    ],
    phrases: ['bystander effect', 'non verbal communication']
  },
  KN16: {
    tokens: [
      'group', 'groups', 'team', 'teams', 'conformity', 'obedience', 'persuasion', 'compliance',
      'norm', 'norms', 'groupthink', 'polarization', 'deindividuation', 'job', 'satisfaction',
      'organizational', 'justice', 'social', 'influence', 'systems', 'school', 'workplace',
      'family', 'system'
    ],
    phrases: ['group polarization', 'social facilitation', 'organizational justice']
  },
  KN17: {
    tokens: ['personality', 'trait', 'traits', 'big', 'five', 'psychoanalytic', 'humanistic'],
    phrases: ['big five', 'personality theory']
  },
  KN18: {
    tokens: [
      'culture', 'cultural', 'acculturation', 'collectivism', 'individualism', 'privilege',
      'religiosity', 'spirituality', 'political', 'sociopolitical', 'global', 'worldview'
    ],
    phrases: ['cross cultural', 'cultural competence']
  },
  KN19: {
    tokens: [
      'identity', 'identities', 'intersectionality', 'intersectional', 'diversity', 'diverse',
      'racial', 'gender', 'sexual', 'orientation', 'minority'
    ],
    phrases: ['identity development', 'sexual orientation', 'gender identity']
  },
  KN20: {
    tokens: [
      'oppression', 'discrimination', 'racism', 'sexism', 'stigma', 'marginalization',
      'microaggression', 'prejudice', 'bias'
    ],
    phrases: ['systemic oppression', 'institutional racism']
  },
  KN21: {
    tokens: [
      'development', 'developmental', 'milestone', 'milestones', 'infancy', 'adolescence',
      'adolescent', 'adulthood', 'aging', 'puberty', 'language', 'growth', 'temperament'
    ],
    phrases: ['normal development', 'across the lifespan']
  },
  KN22: {
    tokens: [
      'environment', 'environmental', 'school', 'peer', 'community', 'teacher', 'neighborhood',
      'ecological', 'interaction'
    ],
    phrases: ['school and family', 'person environment']
  },
  KN23: {
    tokens: [
      'piaget', 'erikson', 'kohlberg', 'vygotsky', 'stage', 'stages', 'theory', 'theories',
      'moral', 'morality'
    ],
    phrases: ['developmental theory', 'cognitive development']
  },
  KN24: {
    tokens: ['identity', 'cultural', 'gender', 'racial', 'diverse', 'diversity'],
    phrases: ['identities on development']
  },
  KN25: {
    tokens: [
      'family', 'parent', 'parents', 'parenting', 'attachment', 'marriage', 'divorce', 'sibling',
      'household', 'caregiver'
    ],
    phrases: ['family systems', 'parenting style', 'family functioning']
  },
  KN26: {
    tokens: ['bereavement', 'retirement', 'marriage', 'divorce', 'widowhood', 'life', 'event'],
    phrases: ['life event']
  },
  KN27: {
    tokens: [
      'prenatal', 'teratogen', 'nutrition', 'resilience', 'resiliency', 'social', 'support',
      'poverty', 'abuse', 'victimization', 'protective', 'risk'
    ],
    phrases: ['risk factor', 'protective factor', 'prenatal care']
  },
  KN28: {
    tokens: [
      'autism', 'adhd', 'learning', 'disorder', 'fetal', 'alcohol', 'neurodevelopmental',
      'disease', 'disability'
    ],
    phrases: ['expected course of development']
  },
  KN29: {
    tokens: [
      'reliability', 'validity', 'psychometric', 'psychometrics', 'item', 'items', 'standardization',
      'norming', 'sensitivity', 'specificity', 'fairness', 'bias', 'coefficient', 'alpha',
      'testretest', 'internal', 'consistency', 'criterion', 'construct', 'content', 'predictive'
    ],
    phrases: ['item analysis', 'criterion related', 'test construction', 'four fifths rule']
  },
  KN30: {
    tokens: [
      'behavioral', 'ecological', 'neuropsychological', 'developmental', 'functional', 'analysis'
    ],
    phrases: ['functional analysis', 'behavioral assessment', 'neuropsychological assessment']
  },
  KN31: {
    tokens: [
      'interview', 'interviews', 'observation', 'observational', 'selfreport', 'report',
      'multiinformant', 'psychophysiological', 'work', 'sample', 'direct', 'structured',
      'semistructured', 'momentary', 'interval', 'recording'
    ],
    phrases: ['momentary time sampling', 'structured interview', 'work sample']
  },
  KN32: {
    tokens: [
      'wais', 'wisc', 'stanford', 'binet', 'mmpi', 'rorschach', 'tat', 'instrument',
      'inventory', 'scale', 'battery', 'bdi', 'bai'
    ],
    phrases: ['commonly used instrument', 'specific test']
  },
  KN33: {
    tokens: [
      'differential', 'diagnosis', 'rule', 'out', 'medical', 'substance', 'induced', 'comorbidity',
      'labs', 'laboratory'
    ],
    phrases: ['differential diagnosis', 'rule out', 'diagnostic overshadowing']
  },
  KN34: {
    tokens: [
      'organization', 'organizational', 'personnel', 'selection', 'hiring', 'job', 'performance',
      'appraisal', 'appraisals', 'needs', 'assessment', 'survey', 'climate', 'work', 'sample',
      'assessment', 'center'
    ],
    phrases: ['needs assessment', 'assessment center', 'personnel assessment', 'job analysis']
  },
  KN35: {
    tokens: [
      'accommodation', 'adaptation', 'adapted', 'translated', 'translation', 'language',
      'cultural', 'appropriateness', 'crosscultural'
    ],
    phrases: ['language accommodation', 'cultural appropriateness']
  },
  KN36: {
    tokens: [
      'dsm', 'diagnostic', 'criteria', 'criterion', 'categorical', 'dimensional', 'classification',
      'diagnosis', 'disorder', 'specifier', 'icd', 'symptom', 'symptoms', 'comorbidity'
    ],
    phrases: ['diagnostic criteria', 'classification system']
  },
  KN37: {
    tokens: [
      'base', 'rate', 'incremental', 'validity', 'cut', 'score', 'cutoff', 'predictive',
      'value', 'decision', 'heuristic', 'utility', 'taylor', 'russell', 'false', 'positive'
    ],
    phrases: ['base rate', 'incremental validity', 'taylor russell']
  },
  KN38: {
    tokens: ['prevalence', 'incidence', 'lifetime', 'epidemiology', 'epidemiological', 'demographic', 'gender', 'risk'],
    phrases: ['lifetime prevalence', 'point prevalence']
  },
  KN39: {
    tokens: ['etiology', 'diathesis', 'stress', 'biopsychosocial', 'psychopathology'],
    phrases: ['diathesis stress', 'model of psychopathology']
  },
  KN40: {
    tokens: ['outcome', 'progress', 'monitoring', 'change', 'treatment', 'response'],
    phrases: ['outcome measure', 'progress monitoring']
  },
  KN41: {
    tokens: ['computerized', 'computer', 'online', 'digital', 'technology', 'cat'],
    phrases: ['computer adaptive', 'online testing']
  },
  KN42: {
    tokens: [
      'readiness', 'stage', 'change', 'matching', 'match', 'referral', 'decision', 'deciding',
      'comprehensive', 'assessment', 'first', 'step'
    ],
    phrases: ['readiness to change', 'treatment decision', 'match treatment']
  },
  KN43: {
    tokens: [
      'cbt', 'cognitive', 'therapy', 'psychodynamic', 'humanistic', 'interpersonal', 'act',
      'dbt', 'model', 'theory', 'approach', 'conceptual'
    ],
    phrases: ['collaborative empiricism', 'cognitive therapy', 'psychodynamic therapy']
  },
  KN44: {
    tokens: [
      'erp', 'exposure', 'response', 'prevention', 'sensate', 'focus', 'systematic',
      'desensitization', 'restructuring', 'thought', 'record', 'relaxation', 'safety', 'planning',
      'behavioral', 'activation', 'contingency', 'management'
    ],
    phrases: ['response prevention', 'safety planning', 'dysfunctional thought record', 'behavioral activation']
  },
  KN45: {
    tokens: ['rehabilitation', 'special', 'population', 'populations', 'adapted', 'diverse'],
    phrases: ['special population', 'diverse population']
  },
  KN46: {
    tokens: [
      'performance', 'leadership', 'team', 'organization', 'organizational', 'change',
      'management', 'coaching', 'group', 'family', 'systems', 'workplace'
    ],
    phrases: ['organizational development', 'team building', 'management theory']
  },
  KN47: {
    tokens: ['consultation', 'consultant', 'consultee', 'collaboration'],
    phrases: ['behavioral consultation', 'consultation model']
  },
  KN48: {
    tokens: ['career', 'vocational', 'holland', 'super', 'occupation', 'occupational'],
    phrases: ['career development', 'vocational choice']
  },
  KN49: {
    tokens: ['telepsychology', 'teletherapy', 'telehealth', 'remote', 'technology', 'platform'],
    phrases: ['technology assisted', 'tele psychology']
  },
  KN50: {
    tokens: ['managed', 'care', 'insurance', 'reimbursement', 'healthcare', 'cost', 'benefit'],
    phrases: ['health care system', 'managed care']
  },
  KN51: {
    tokens: ['wellness', 'resilience', 'prevention', 'health', 'promotion', 'risk', 'reduction'],
    phrases: ['health promotion', 'risk reduction']
  },
  KN52: {
    tokens: ['supervision', 'supervisor', 'supervisee', 'gatekeeping', 'feedback'],
    phrases: ['supervision model', 'parallel process']
  },
  KN53: {
    tokens: ['sample', 'sampling', 'survey', 'questionnaire', 'data', 'collection', 'response', 'rate'],
    phrases: ['random sample', 'stratified sample', 'data collection']
  },
  KN54: {
    tokens: [
      'design', 'experimental', 'quasi', 'correlational', 'singlecase', 'single', 'case',
      'independent', 'dependent', 'variable', 'variables', 'random', 'assignment', 'control',
      'group', 'factorial', 'longitudinal', 'crosssectional'
    ],
    phrases: ['research design', 'independent variable', 'dependent variable']
  },
  KN55: {
    tokens: [
      'anova', 'ttest', 'chisquare', 'correlation', 'regression', 'manova', 'factor', 'analysis',
      'metaanalysis', 'quantitative', 'qualitative', 'descriptive', 'inferential', 'parametric',
      'statistic', 'statistics'
    ],
    phrases: ['inferential statistics', 'descriptive statistics', 'factor analysis']
  },
  KN56: {
    tokens: [
      'power', 'effect', 'size', 'pvalue', 'alpha', 'beta', 'causation', 'association',
      'clinical', 'significance', 'confidence', 'interval', 'type', 'error'
    ],
    phrases: ['effect size', 'type i', 'type ii', 'clinical significance']
  },
  KN57: {
    tokens: [
      'internal', 'external', 'validity', 'generalizability', 'confound', 'confounding', 'maturation',
      'history', 'attrition', 'instrumentation', 'selection', 'bias', 'threat', 'threats'
    ],
    phrases: ['internal validity', 'external validity']
  },
  KN58: {
    tokens: ['evaluation', 'formative', 'summative', 'process', 'outcome', 'needs', 'assessment', 'costbenefit'],
    phrases: ['program evaluation', 'process evaluation', 'outcome evaluation']
  },
  KN59: {
    tokens: ['community', 'participation', 'stakeholder', 'participatory'],
    phrases: ['community based', 'participatory action']
  },
  KN60: {
    tokens: ['dissemination', 'publication', 'poster', 'presentation'],
    phrases: ['research findings', 'conference presentation']
  },
  KN61: {
    tokens: ['ethics', 'ethical', 'principle', 'principles', 'apa', 'code'],
    phrases: ['apa ethics code', 'general principle', 'ethical standard']
  },
  KN62: {
    tokens: ['guideline', 'guidelines', 'professional', 'testing', 'standard', 'standards'],
    phrases: ['professional standard', 'testing standard', 'practice guideline']
  },
  KN63: {
    tokens: [
      'law', 'legal', 'statute', 'court', 'subpoena', 'judge', 'judicial', 'tarasoff', 'duty',
      'warn', 'mandated', 'report', 'reporting', 'licensure', 'license', 'hipaa', 'privilege', 'griggs',
      'title', 'vii', 'insanity', 'competent', 'trial'
    ],
    phrases: ['duty to warn', 'stand trial', 'not guilty by reason of insanity']
  },
  KN64: {
    tokens: [
      'confidentiality', 'boundary', 'boundaries', 'multiple', 'relationship', 'competence',
      'impairment', 'record', 'records', 'documentation', 'fees', 'gift', 'referral', 'conflict',
      'dual', 'ethical', 'dilemma'
    ],
    phrases: ['multiple relationship', 'ethical dilemma', 'potential ethical']
  },
  KN65: {
    tokens: ['decision', 'making', 'model', 'steps', 'resolve', 'deliberation'],
    phrases: ['ethical decision', 'decision making model']
  },
  KN66: {
    tokens: ['continuing', 'education', 'development', 'competence', 'maintenance'],
    phrases: ['continuing professional', 'professional development']
  },
  KN67: {
    tokens: ['emerging', 'policy', 'ai', 'artificial', 'intelligence', 'socialmedia'],
    phrases: ['emerging issue', 'policy issue']
  },
  KN68: {
    tokens: ['informed', 'consent', 'capacity', 'rights', 'privacy', 'access', 'records', 'refuse'],
    phrases: ['client rights', 'legal capacity', 'informed consent']
  },
  KN69: {
    tokens: ['irb', 'deception', 'participant', 'participants', 'research', 'consent', 'animal'],
    phrases: ['research ethics', 'human subjects']
  },
  KN70: {
    tokens: ['supervision', 'supervisor', 'supervisee', 'trainee', 'intern', 'practicum'],
    phrases: ['ethical issues in supervision', 'supervisory relationship']
  },
  KN71: {
    tokens: ['telehealth', 'telepsychology', 'teletherapy', 'email', 'text', 'platform', 'online'],
    phrases: ['technology assisted psychological services', 'online therapy']
  },
}

function walkFiles(dir, extension) {
  const results = []
  if (!fs.existsSync(dir)) return results

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...walkFiles(fullPath, extension))
    } else if (entry.isFile() && fullPath.toLowerCase().endsWith(extension.toLowerCase())) {
      results.push(fullPath)
    }
  }

  return results.sort()
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

function parseKNs(markdown) {
  const kns = new Map()
  let currentDomain = null

  for (const line of markdown.split(/\r?\n/)) {
    const domainMatch = line.match(/^##\s+(\d+)\./)
    if (domainMatch) {
      currentDomain = Number(domainMatch[1])
      continue
    }

    const knMatch = line.match(/^- (KN\d{1,2})\.\s+(.*)$/)
    if (knMatch && currentDomain) {
      const [, code, description] = knMatch
      kns.set(code, {
        code,
        domain: currentDomain,
        description: description.trim(),
      })
    }
  }

  return kns
}

function normalizeToken(token) {
  let value = String(token || '').toLowerCase()
  if (value.length > 5 && value.endsWith('ing')) value = value.slice(0, -3)
  else if (value.length > 4 && value.endsWith('ed')) value = value.slice(0, -2)
  else if (value.length > 4 && value.endsWith('es')) value = value.slice(0, -2)
  else if (value.length > 3 && value.endsWith('s')) value = value.slice(0, -1)
  return value
}

function tokenize(text) {
  const raw = String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  return raw
    .map(normalizeToken)
    .filter((token) => token.length >= 3 && !STOPWORDS.has(token))
}

function normalizeText(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function scoreCandidateName(lessonName, candidateName) {
  const lessonTokens = new Set(tokenize(lessonName))
  const candidateTokens = new Set(tokenize(candidateName))
  let overlap = 0

  for (const token of lessonTokens) {
    if (candidateTokens.has(token)) overlap += 1
  }

  let score = overlap
  const normalizedLesson = normalizeText(lessonName)
  const normalizedCandidate = normalizeText(candidateName)

  if (normalizedLesson === normalizedCandidate) score += 3
  if (normalizedLesson.includes(normalizedCandidate) || normalizedCandidate.includes(normalizedLesson)) {
    score += 1
  }

  return score
}

function buildRootToLessonMap() {
  const lessonFiles = walkFiles(LESSONS_DIR, '.md')
  const rootFiles = walkFiles(QUESTIONS_DIR, '.json')
  const rootByFolder = new Map()
  const rootToLesson = new Map()

  for (const rootFile of rootFiles) {
    const relativeFolder = path.relative(QUESTIONS_DIR, path.dirname(rootFile))
    const group = rootByFolder.get(relativeFolder) ?? []
    group.push(rootFile)
    rootByFolder.set(relativeFolder, group)
  }

  const used = new Set()
  for (const lessonFile of lessonFiles) {
    const lesson = path.basename(lessonFile, '.md')
    const relativeFolder = path.relative(LESSONS_DIR, path.dirname(lessonFile))
    const candidates = rootByFolder.get(relativeFolder) ?? []

    const ranked = candidates
      .map((candidate) => ({
        candidate,
        score: scoreCandidateName(lesson, path.basename(candidate, '.json')),
      }))
      .sort((a, b) => b.score - a.score)

    const best = ranked[0]
    if (!best || best.score < 2 || used.has(best.candidate)) continue
    rootToLesson.set(best.candidate, lesson)
    used.add(best.candidate)
  }

  return rootToLesson
}

function getDomainKeyFromFolder(folderName) {
  if (folderName === DOMAIN_FOLDER_MAP['1']) return '1'
  if (folderName === DOMAIN_FOLDER_MAP['2']) return '2'
  if (folderName === DOMAIN_FOLDER_MAP['3-social']) return '3-social'
  if (folderName === DOMAIN_FOLDER_MAP['3-cultural']) return '3-cultural'
  if (folderName === DOMAIN_FOLDER_MAP['4']) return '4'
  if (folderName === DOMAIN_FOLDER_MAP['5-assessment']) return '5-assessment'
  if (folderName === DOMAIN_FOLDER_MAP['5-diagnosis']) return '5-diagnosis'
  if (folderName === DOMAIN_FOLDER_MAP['5-test']) return '5-test'
  if (folderName === DOMAIN_FOLDER_MAP['6']) return '6'
  if (folderName === DOMAIN_FOLDER_MAP['7']) return '7'
  if (folderName === DOMAIN_FOLDER_MAP['8']) return '8'
  if (folderName === DOMAIN_FOLDER_MAP['3-5-6']) return '3-5-6'
  return null
}

function domainNumberFromKey(domainKey) {
  if (!domainKey) return null
  if (domainKey === '3-social' || domainKey === '3-cultural') return 3
  if (domainKey === '5-assessment' || domainKey === '5-diagnosis' || domainKey === '5-test') return 5
  if (domainKey === '3-5-6') return null
  return Number.parseInt(domainKey, 10)
}

function inferExpectedDomain(filePath, question, lesson) {
  const inspiration = String(question.inspirationDomain || '').toUpperCase()
  if (inspiration.includes('BIOLOGICAL')) return 1
  if (inspiration.includes('COGNITIVE-AFFECTIVE')) return 2
  if (inspiration.includes('SOCIAL') || inspiration.includes('CULTURAL')) return 3
  if (inspiration.includes('GROWTH') || inspiration.includes('LIFESPAN')) return 4
  if (inspiration.includes('ASSESSMENT') || inspiration.includes('DIAGNOSIS')) return 5
  if (inspiration.includes('TREATMENT') || inspiration.includes('INTERVENTION')) return 6
  if (inspiration.includes('RESEARCH')) return 7
  if (inspiration.includes('ETHIC') || inspiration.includes('LEGAL') || inspiration.includes('PROFESSIONAL')) return 8

  if (lesson && LESSON_DEFAULT_KN[lesson]) {
    return Number.parseInt(LESSON_DEFAULT_KN[lesson].replace('KN', ''), 10) <= 5
      ? getDomainFromKn(LESSON_DEFAULT_KN[lesson])
      : getDomainFromKn(LESSON_DEFAULT_KN[lesson])
  }

  const rel = path.relative(QUESTIONS_DIR, filePath)
  const folder = rel.split(path.sep)[0] || ''
  return domainNumberFromKey(getDomainKeyFromFolder(folder))
}

function getDomainFromKn(kn) {
  const num = Number.parseInt(String(kn).replace('KN', ''), 10)
  if (num >= 1 && num <= 5) return 1
  if (num >= 6 && num <= 13) return 2
  if (num >= 14 && num <= 20) return 3
  if (num >= 21 && num <= 28) return 4
  if (num >= 29 && num <= 41) return 5
  if (num >= 42 && num <= 52) return 6
  if (num >= 53 && num <= 60) return 7
  if (num >= 61 && num <= 71) return 8
  return null
}

function buildRuleForKn(kn, description) {
  const rule = KN_RULES[kn] ?? { tokens: [], phrases: [] }
  return {
    tokens: new Set((rule.tokens ?? []).map(normalizeToken)),
    phrases: (rule.phrases ?? []).map((phrase) => normalizeText(phrase)),
  }
}

function scoreKn(rule, text, tokenSet, lesson, currentKn, candidateKn) {
  let score = 0

  for (const token of rule.tokens) {
    if (tokenSet.has(token)) score += 2
  }

  for (const phrase of rule.phrases) {
    if (phrase && text.includes(phrase)) score += 4
  }

  if (lesson) {
    const lessonTokens = tokenize(lesson)
    for (const token of lessonTokens) {
      if (rule.tokens.has(token)) score += 1
    }
  }

  if (candidateKn === currentKn) score += 0.5
  return score
}

function chooseKnForQuestion(question, context, kns, rulesByKn) {
  const { filePath, lesson, expectedDomain } = context
  const currentKn = question.kn || question.knId || null
  const fileName = path.basename(filePath, '.json')
  const text = normalizeText([
    question.stem,
    fileName,
    lesson,
  ].filter(Boolean).join(' '))
  const tokenSet = new Set(tokenize(text))

  const candidates = [...kns.values()].filter((entry) => entry.domain === expectedDomain)
  const scored = candidates
    .map((entry) => ({
      kn: entry.code,
      score: scoreKn(rulesByKn.get(entry.code), text, tokenSet, lesson, currentKn, entry.code),
    }))
    .sort((a, b) => b.score - a.score)

  const best = scored[0] ?? { kn: null, score: 0 }
  const currentScore = currentKn && rulesByKn.has(currentKn)
    ? scoreKn(rulesByKn.get(currentKn), text, tokenSet, lesson, currentKn, currentKn)
    : 0

  const fallbackKn = lesson && LESSON_DEFAULT_KN[lesson] ? LESSON_DEFAULT_KN[lesson] : null
  const chosenKn = best.score > 0 ? best.kn : fallbackKn
  return {
    chosenKn,
    chosenScore: best.score,
    currentScore,
    fallbackKn,
  }
}

function shouldUpdateKn(currentKn, chosenKn, expectedDomain, chosenScore, currentScore) {
  if (!chosenKn) return false
  if (!currentKn) return true

  const currentDomain = getDomainFromKn(currentKn)
  if (currentDomain !== expectedDomain) return true
  if (currentKn !== chosenKn && chosenScore >= currentScore + 2) return true
  if (currentKn !== chosenKn && currentScore === 0 && chosenScore > 0) return true
  return false
}

function buildKnExplanation(knMeta) {
  return `This question is best aligned with ${knMeta.code} because it tests ${knMeta.description}`
}

function main() {
  const kns = parseKNs(fs.readFileSync(KNS_PATH, 'utf8'))
  const rulesByKn = new Map([...kns.entries()].map(([code, meta]) => [code, buildRuleForKn(code, meta.description)]))
  const rootToLesson = buildRootToLessonMap()
  const files = walkFiles(QUESTIONS_DIR, '.json')

  let totalQuestions = 0
  let changedQuestions = 0
  let changedFiles = 0
  let missingExpectedDomain = 0
  let changedFromWrongDomain = 0

  for (const filePath of files) {
    const raw = readJson(filePath)
    const questions = Array.isArray(raw.questions) ? raw.questions : Array.isArray(raw) ? raw : []
    const lesson = rootToLesson.get(filePath) ?? null
    let fileChanged = false

    for (const question of questions) {
      totalQuestions += 1
      const currentKn = question.kn || question.knId || null
      const manualKn = MANUAL_KN_OVERRIDES[String(question.stem || '').trim()] ?? null
      if (manualKn) {
        const knMeta = kns.get(manualKn)
        if (!knMeta) continue
        const nextExplanation = buildKnExplanation(knMeta)
        if (currentKn !== manualKn || question.kn_explanation !== nextExplanation) {
          if (currentKn && getDomainFromKn(currentKn) !== getDomainFromKn(manualKn)) {
            changedFromWrongDomain += 1
          }
          question.kn = manualKn
          question.kn_explanation = nextExplanation
          fileChanged = true
          changedQuestions += 1
        }
        continue
      }

      const expectedDomain = inferExpectedDomain(filePath, question, lesson)
      if (!expectedDomain) {
        missingExpectedDomain += 1
        continue
      }

      const { chosenKn, chosenScore, currentScore } = chooseKnForQuestion(
        question,
        { filePath, lesson, expectedDomain },
        kns,
        rulesByKn
      )

      if (!shouldUpdateKn(currentKn, chosenKn, expectedDomain, chosenScore, currentScore)) {
        continue
      }

      const knMeta = chosenKn ? kns.get(chosenKn) : null
      if (!knMeta) continue

      if (currentKn && getDomainFromKn(currentKn) !== expectedDomain) {
        changedFromWrongDomain += 1
      }

      question.kn = chosenKn
      question.kn_explanation = buildKnExplanation(knMeta)
      fileChanged = true
      changedQuestions += 1
    }

    if (fileChanged) {
      writeJson(filePath, Array.isArray(raw.questions) ? { ...raw, questions } : { questions })
      changedFiles += 1
    }
  }

  console.log(`Reviewed ${files.length} questionsGPT files`)
  console.log(`Questions reviewed: ${totalQuestions}`)
  console.log(`Questions updated: ${changedQuestions}`)
  console.log(`Files updated: ${changedFiles}`)
  console.log(`Updates from clear domain mismatches: ${changedFromWrongDomain}`)
  console.log(`Questions without inferred expected domain: ${missingExpectedDomain}`)
}

main()
