/**
 * Test harness for the two-pass RAG diagnostic suggester.
 *
 * Run:
 *   OPENAI_API_KEY=sk-... npm run test:llm-diagnostic
 *   OPENAI_API_KEY=sk-... OPENAI_MODEL=gpt-4o npm run test:llm-diagnostic
 *
 * Uses the David Barayev intake fixture. The same case that broke the rules
 * engine (missed Erectile Disorder, false-positive PTSD moderate).
 *
 * Expected correct output from the LLM:
 *   - Erectile Disorder (F52.21) — high
 *   - Generalized Anxiety Disorder (F41.1) — moderate
 *   - Adjustment Disorder with Anxiety (F43.22) — moderate
 *   - Major Depressive Disorder, mild (F32.0) — low
 *   - No PTSD unless trauma exposure is clearly affirmed
 */

import { EMPTY_INTAKE, type IntakeData } from '../src/lib/types.ts'
import { getLLMDiagnosticSuggestions } from '../src/lib/diagnostic-llm.ts'

const apiKey = process.env.OPENAI_API_KEY
if (!apiKey) {
  console.error('OPENAI_API_KEY not set in env. Example: OPENAI_API_KEY=sk-... npm run test:llm-diagnostic')
  process.exit(1)
}
const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'

const intake: IntakeData = {
  ...EMPTY_INTAKE,
  fullName: 'David Barayev',
  firstName: 'David',
  lastName: 'Barayev',
  sex: 'Male',
  genderIdentity: 'Male',

  chiefComplaint: 'He presented for sex therapy. He stated that he wants to resolve his ED.',
  presentingProblems:
    'erectile dysfunction, severe performance anxiety, fear of partner negative judgment, catastrophic thinking about relationship failure, secret sildenafil use, trauma history related to STD acquisition, relationship distress, low mood, anger and emotional reactivity, difficulty concentrating',
  historyOfPresentIllness:
    'He has been experiencing erectile dysfunction exclusively with his girlfriend for the past four months. He can achieve morning erections and had no issues with previous partners. He feels severe performance anxiety and fears that his partner will judge him negatively. He has been using sildenafil secretly to maintain erections. His partner has expressed that his erectile difficulties are a turnoff, which increases his anxiety. He has lost weight from 210-215 pounds to 186 pounds over two months through exercise and diet. A urologist found no physical cause for his ED, and his testosterone levels are normal. He reports high work stress, fatigue, poor sleep, and inadequate nutrition. He also reports a history of herpes type 2 diagnosis from a traumatic anal sex experience several years ago.',
  medicalHistory:
    'Herpes type 2 diagnosis, taking daily antiviral medication, secret use of sildenafil. Recent weight loss from 210-215 to 186 pounds over two months.',
  priorTreatment: 'No prior mental health treatment. Prescribed Cialis by urologist.',

  suicidalIdeation: 'Denies',
  homicidalIdeation: 'Denies',
  suicideAttemptHistory: 'No',
  psychiatricHospitalization: 'No',

  alcoholUse: '',
  drugUse: 'Prescribed Cialis; takes sildenafil without partner knowledge',
  substanceUseHistory: 'Yes — prescribed Cialis, minimal other substance use',

  familyPsychiatricHistory: 'No',
  familyMentalEmotionalHistory: '',
  maritalStatus: 'Single',
  relationshipDescription: 'In 4-month relationship with girlfriend (registered nurse, similar Russian Jewish background)',
  livingArrangement: 'Lives with parents after failed apartment lease',
  education: 'high school',
  occupation: 'barber',

  physicalSexualAbuseHistory: 'Traumatic anal sex experience leading to herpes diagnosis several years ago',
  domesticViolenceHistory: 'No',

  recentSymptoms:
    'Loss of energy, Fatigue, Worthlessness, Loss of appetite, Social withdrawal, agitation, Excessive worry, Difficulty falling or staying asleep, Restlessness, Sweating, Direct experience or witnessing of traumatic event',
  additionalSymptoms: '',
  additionalInfo:
    'Appearance: Casually dressed, age-appropriate. Behavior: Cooperative, engaged. Mood/Affect: Anxious, frustrated. Thoughts: Preoccupied with sexual performance, catastrophic thinking.',
  overviewClinicalNote: '',
  manualNotes: '',
  rawQA: [
    { question: 'Depression symptoms', answer: 'Loss of energy, fatigue, worthlessness, loss of appetite, social withdrawal, agitation' },
    { question: 'Anxiety symptoms', answer: 'Excessive worry, difficulty falling or staying asleep, restlessness' },
    { question: 'Panic symptoms', answer: 'Sweating' },
    { question: 'Post-traumatic stress', answer: 'Direct experience, witnessing, or learning of a traumatic event' },
    { question: 'Substance use', answer: 'Yes prescribed Cialis, Other Yes Minimal' },
  ],

  gad7: {
    name: 'GAD-7',
    totalScore: 7,
    severity: 'mild anxiety',
    difficulty: 'Not difficult at all',
    items: [],
    capturedAt: '',
  },
  phq9: {
    name: 'PHQ-9',
    totalScore: 5,
    severity: 'mild depression',
    difficulty: 'Not difficult at all',
    items: [],
    capturedAt: '',
  },
  cssrs: null,
  dass21: null,
}

async function main() {
  const started = Date.now()
  console.log(`\nRunning two-pass RAG diagnostic suggester (model=${model})\n`)

  const suggestions = await getLLMDiagnosticSuggestions(intake, {
    apiKey: apiKey!,
    model,
    onProgress: (msg) => console.log(`  [${((Date.now() - started) / 1000).toFixed(1)}s] ${msg}`),
  })

  console.log(`\n=== LLM DIAGNOSTIC SUGGESTIONS (${suggestions.length}) ===\n`)

  suggestions.forEach((s, i) => {
    const code = s.code ? ` [${s.code}]` : ''
    console.log(`${i + 1}. ${s.disorderName}${code} — ${s.confidence}`)
    console.log(`   chapter: ${s.chapter}`)
    console.log(`   reasoning: ${s.reasoning}`)
    if (s.ruleOuts.length) console.log(`   rule-outs: ${s.ruleOuts.join('; ')}`)
    if (s.criteriaEval.length) {
      console.log(`   criteria:`)
      s.criteriaEval.forEach((c) => {
        console.log(`     ${c.letter}. [${c.status}] ${c.criterionText}`)
        if (c.evidence) console.log(`        evidence: ${c.evidence}`)
      })
    }
    console.log('')
  })

  const elapsed = ((Date.now() - started) / 1000).toFixed(1)
  console.log(`Done in ${elapsed}s\n`)
}

main().catch((err) => {
  console.error('\nTest failed:', err instanceof Error ? err.message : err)
  if (err instanceof Error && err.stack) console.error(err.stack)
  process.exit(1)
})
