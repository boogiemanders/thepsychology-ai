import { EMPTY_INTAKE } from '../src/lib/types.ts';
import { getDiagnosticSuggestions } from '../src/lib/diagnostic-engine.ts';

const intake = {
  ...EMPTY_INTAKE,
  fullName: 'David Barayev',
  firstName: 'David',
  lastName: 'Barayev',
  age: 32,
  sex: 'Male',
  genderIdentity: 'Male',

  // From overview note + AI note + enriched HPI
  chiefComplaint: 'He presented for sex therapy. He stated that he wants to resolve his ED.',
  presentingProblems: 'erectile dysfunction, severe performance anxiety, fear of partner negative judgment, catastrophic thinking about relationship failure, secret sildenafil use, trauma history related to STD acquisition, relationship distress, low mood, anger and emotional reactivity, difficulty concentrating',
  historyOfPresentIllness: 'He has been experiencing erectile dysfunction exclusively with his girlfriend for the past four months. He can achieve morning erections and had no issues with previous partners. He feels severe performance anxiety and fears that his partner will judge him negatively. He has been using sildenafil secretly to maintain erections. His partner has expressed that his erectile difficulties are a turnoff, which increases his anxiety. He has lost weight from 210-215 pounds to 186 pounds over two months through exercise and diet. A urologist found no physical cause for his ED, and his testosterone levels are normal. He reports high work stress, fatigue, poor sleep, and inadequate nutrition. He also reports a history of herpes type 2 diagnosis from a traumatic anal sex experience several years ago.',
  medicalHistory: 'Herpes type 2 diagnosis, taking daily antiviral medication, secret use of sildenafil. Recent weight loss from 210-215 to 186 pounds over two months.',
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

  recentSymptoms: 'Loss of energy, Fatigue, Worthlessness, Loss of appetite, Social withdrawal, agitation, Excessive worry, Difficulty falling or staying asleep, Restlessness, Sweating, Direct experience or witnessing of traumatic event',
  additionalSymptoms: '',
  additionalInfo: 'Appearance: Casually dressed, age-appropriate. Behavior: Cooperative, engaged. Mood/Affect: Anxious, frustrated. Thoughts: Preoccupied with sexual performance, catastrophic thinking.',
  overviewClinicalNote: '',
  manualNotes: '',
  rawQA: [
    { question: 'Depression symptoms', answer: 'Loss of energy, fatigue, worthlessness, loss of appetite, social withdrawal, agitation' },
    { question: 'Anxiety symptoms', answer: 'Excessive worry, difficulty falling or staying asleep, restlessness' },
    { question: 'Panic symptoms', answer: 'Sweating' },
    { question: 'Post-traumatic stress', answer: 'Direct experience, witnessing, or learning of a traumatic event' },
    { question: 'Substance use', answer: 'Yes prescribed Cialis, Other Yes Minimal' },
  ],

  // Assessments from the capture
  assessments: {
    gad7: {
      assessmentType: 'GAD-7',
      totalScore: 7,
      maxTotalScore: 21,
      severityLabel: 'mild anxiety',
      functionalDifficulty: 'Not difficult at all',
      items: []
    },
    phq9: {
      assessmentType: 'PHQ-9',
      totalScore: 5,
      maxTotalScore: 27,
      severityLabel: 'mild depression',
      functionalDifficulty: 'Not difficult at all',
      items: []
    },
    cssrs: null,
    dass21: null
  } as any
};

const suggestions = getDiagnosticSuggestions(intake);

console.log('=== RULES-BASED DIAGNOSTIC SUGGESTIONS ===\n');
console.log(`Total suggestions: ${suggestions.length}\n`);

// Show all with score > 0 or confidence not low
const meaningful = suggestions.filter(s => s.score > 0 || s.metCount > 0);
console.log(`Meaningful (score>0): ${meaningful.length}\n`);

meaningful.slice(0, 15).forEach((s, i) => {
  console.log(`${i+1}. ${s.disorderName} — ${s.code ?? 'no code'}`);
  console.log(`   confidence: ${s.confidence} | score: ${s.score} | met: ${s.metCount} | likely: ${s.likelyCount} | unresolved: ${s.unresolvedCount} | required: ${s.requiredCount}`);
  if (s.suggestedSpecifier) console.log(`   specifier: ${s.suggestedSpecifier}`);
  if (s.reason) console.log(`   reason: ${s.reason.slice(0, 400)}`);
  if (s.ruleOuts?.length) console.log(`   rule-outs: ${s.ruleOuts.join('; ')}`);
  console.log('');
});
