/**
 * SimplePractice Notes — Initial Clinical Evaluation Auto-Filler
 *
 * Fills SimplePractice's "Initial Clinical Evaluation" note template
 * with captured intake data. Uses exact DOM selectors mapped from
 * the real SP form structure.
 *
 * Field types in the ICE form:
 *   - date:          #date-N (date picker input)
 *   - short-answer:  #short-answer-N (text input)
 *   - multi-select:  [name="multi-select-N-M"] (checkboxes)
 *   - single-select: [name="single-select-N"] (radio buttons)
 *   - free-text:     [aria-label="free-text-N"] (ProseMirror contenteditable)
 *   - dropdown:      #dropdown-N (select element)
 *   - combobox:      .select-box__input[aria-label="X"] (searchbox input)
 *
 * SimplePractice note URL patterns:
 *   Progress note:    /clients/{id}/notes/{noteId}/edit
 *   New note:         /clients/{id}/appointments/{apptId}/notes/new
 *   Treatment plan:   /clients/{id}/treatment_plans/{tpId}/edit
 */

import { IntakeData, AssessmentResult } from '../lib/types'
import { getIntake } from '../lib/storage'
import {
  injectButton,
  showToast,
  assertExtensionContext,
  isExtensionContextInvalidatedError,
  fillTextLikeField,
  fillProseMirrorByLabel,
  fillContentEditableField,
  fillCombobox,
  checkCheckboxByLabel,
  flushBooleanSyncOperations,
  selectRadio,
  selectYesNo,
  selectDropdownById,
  wait,
  findFieldElement,
  registerFloatingButtonsController,
} from './shared'

// ── URL Detection ──

function isNotePage(): boolean {
  return /\/appointments\/\d+/.test(window.location.pathname) ||
    /\/clients\/\d+\/(notes|appointments)/.test(window.location.pathname) ||
    /\/clients\/\d+\/treatment_plans/.test(window.location.pathname)
}

function capitalize(value: string): string {
  if (!value) return value
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function lowerCaseFirst(value: string): string {
  if (!value) return value
  return value.charAt(0).toLowerCase() + value.slice(1)
}

function parseDate(value: string): Date | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  const direct = new Date(trimmed)
  if (!Number.isNaN(direct.getTime())) return direct

  const mmddyyyy = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!mmddyyyy) return null

  const [, month, day, year] = mmddyyyy
  const parsed = new Date(Number(year), Number(month) - 1, Number(day))
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function calculateAge(dob: string): string {
  const age = getAgeYears(dob)
  return age ? `${age} yo` : ''
}

function getManualAgeLabel(notes: string): string {
  const match = notes.match(/\b(\d{1,3})\s*(?:yo|y\/o|year old)\b/i)
  return match ? `${match[1]} yo` : ''
}

function getAgeYears(dob: string): number | null {
  const birthDate = parseDate(dob)
  if (!birthDate) return null

  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const hadBirthday =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate())

  if (!hadBirthday) age -= 1
  return age > 0 ? age : null
}

function buildIdentityDescriptor(intake: IntakeData): string {
  const ethnicity = intake.ethnicity.trim()
  const race = intake.race.trim()
  const gender = (intake.genderIdentity || intake.sex).trim().toLowerCase()

  let ethnicityOrRace = ''
  if (/^yes$/i.test(ethnicity)) {
    ethnicityOrRace = race ? `${race} Hispanic/Latino` : 'Hispanic/Latino'
  } else if (/^no$/i.test(ethnicity)) {
    ethnicityOrRace = race
  } else {
    ethnicityOrRace = ethnicity || race
  }

  return [ethnicityOrRace, gender].filter(Boolean).join(', ')
}

function normalizeLivingArrangement(livingArrangement: string): string {
  const trimmed = livingArrangement.trim()
  if (!trimmed) return ''
  if (/alone|live alone/i.test(trimmed)) return 'alone'

  const cleaned = trimmed
    .replace(/^i\s+live\s+/i, '')
    .replace(/^live\s+/i, '')
    .trim()

  if (!cleaned) return ''
  const lower = cleaned.toLowerCase()
  if (/^with\s+/i.test(lower)) return lower
  return `with ${lower}`
}

function normalizeOccupation(occupation: string): string {
  const trimmed = occupation.trim()
  if (!trimmed) return ''
  if (/unemployed|not working|out of work/i.test(trimmed)) return 'currently unemployed'

  const yearsMatch = trimmed.match(/^(.*?)(\d+\s+years?)$/i)
  if (yearsMatch) {
    const role = yearsMatch[1].trim().replace(/^(a|an)\s+/i, '').toLowerCase()
    const duration = yearsMatch[2].trim().toLowerCase()
    return role ? `a ${role} for ${duration}` : ''
  }

  const cleaned = trimmed.replace(/^(a|an)\s+/i, '').toLowerCase()
  return cleaned ? `a ${cleaned}` : ''
}

function normalizeEducationForNarrative(education: string): string {
  const trimmed = education.trim()
  if (!trimmed) return ''

  return trimmed
    .replace(/^education[:\s-]*/i, '')
    .replace(/^i\s+(?:am|have|completed|finished|earned)\s+/i, '')
    .replace(/[.]+$/, '')
    .trim()
    .toLowerCase()
}

function inferSubjectPronoun(intake: IntakeData): string {
  const genderText = `${intake.genderIdentity} ${intake.sex}`.toLowerCase()
  if (/\b(male|man|boy|he|him)\b/.test(genderText)) return 'he'
  if (/\b(female|woman|girl|she|her)\b/.test(genderText)) return 'she'
  return 'they'
}

function normalizeClause(value: string): string {
  return lowerCaseFirst(value.trim().replace(/[.]+$/, ''))
}

function splitComplaintParts(value: string): string[] {
  return value
    .split(/[\n,;]+/)
    .map((part) => normalizeClause(part))
    .filter(Boolean)
}

function buildChiefComplaintSentences(chiefComplaint: string, pronoun: string): string[] {
  const parts = splitComplaintParts(chiefComplaint)
  if (parts.length === 0) return []

  const hasAirplaneAccident = parts.some((part) => /air\s*plane|airplane|plane accident|plane crash/.test(part))
  const otherParts = parts.filter((part) => !/air\s*plane|airplane|plane accident|plane crash/.test(part))

  if (hasAirplaneAccident) {
    const hasAnxiety = otherParts.some((part) => /\banxiety\b/.test(part))
    const remaining = otherParts.filter((part) => !/\banxiety\b/.test(part))

    let sentence = `${pronoun} recently was in an airplane accident`
    if (hasAnxiety) sentence += ' and reported anxiety'
    if (remaining.length) sentence += ` and reported ${remaining.join(', ')}`
    return [`${sentence}.`]
  }

  return parts.map((part) => `${pronoun} presented with ${part}.`)
}

function buildChiefComplaintNarrative(intake: IntakeData): string {
  const name = intake.firstName || intake.fullName || [intake.firstName, intake.lastName].filter(Boolean).join(' ') || 'Patient'
  const age = calculateAge(intake.dob) || getManualAgeLabel(intake.manualNotes)
  const identity = buildIdentityDescriptor(intake)
  const livingArrangement = normalizeLivingArrangement(intake.livingArrangement)
  const education = normalizeEducationForNarrative(intake.education)
  const occupation = normalizeOccupation(intake.occupation)
  const pronoun = capitalize(inferSubjectPronoun(intake))

  const descriptor = [age, identity].filter(Boolean).join(', ')
  let intro = descriptor ? `${name} is a ${descriptor}` : `${name} is a patient`
  const contextualClauses: string[] = []
  if (livingArrangement) contextualClauses.push(`living ${livingArrangement}`)
  if (education) contextualClauses.push(`with education history of ${education}`)
  if (occupation) contextualClauses.push(`working as ${occupation}`)
  if (contextualClauses.length) {
    intro += ` ${contextualClauses.join(', ')}`
  }
  intro += '.'

  const sentences = [intro]
  if (intake.counselingGoals) {
    const goal = intake.counselingGoals.replace(/^to\s+/i, '').trim()
    if (goal) {
      const quotedGoal = normalizeClause(goal).replace(/[.]+$/, '')
      sentences.push(`${pronoun} shared goals to "${quotedGoal}."`)
    }
  }
  if (intake.chiefComplaint) {
    sentences.push(...buildChiefComplaintSentences(intake.chiefComplaint, pronoun))
  }

  return sentences.join(' ')
}

function buildHistoryOfPresentIllnessText(intake: IntakeData): string {
  return [
    intake.historyOfPresentIllness,
    intake.presentingProblems,
    intake.manualNotes,
    intake.chiefComplaint,
  ]
    .map((value) => value.trim())
    .filter(Boolean)
    .join('\n\n')
}

type KeywordRule = {
  label: string
  patterns: RegExp[]
}

function buildIntakeAnswerCorpus(intake: IntakeData): string {
  return [
    intake.chiefComplaint,
    intake.counselingGoals,
    intake.presentingProblems,
    intake.historyOfPresentIllness,
    intake.priorTreatment,
    intake.medicalHistory,
    intake.suicidalIdeation,
    intake.suicideAttemptHistory,
    intake.homicidalIdeation,
    intake.psychiatricHospitalization,
    intake.alcoholUse,
    intake.drugUse,
    intake.substanceUseHistory,
    intake.familyPsychiatricHistory,
    intake.familyMentalEmotionalHistory,
    intake.relationshipDescription,
    intake.livingArrangement,
    intake.occupation,
    intake.physicalSexualAbuseHistory,
    intake.domesticViolenceHistory,
    intake.recentSymptoms,
    intake.additionalSymptoms,
    intake.additionalInfo,
    intake.manualNotes,
    ...intake.rawQA.map((pair) => pair.answer),
    ...(intake.phq9?.items.map((item) => `${item.question} ${item.response}`) ?? []),
    ...(intake.gad7?.items.map((item) => `${item.question} ${item.response}`) ?? []),
  ]
    .filter(Boolean)
    .join('\n')
    .toLowerCase()
}

function fillKeywordChecklist(groupName: string, corpus: string, rules: KeywordRule[]): number {
  let filled = 0
  const checked = new Set<string>()

  for (const rule of rules) {
    if (checked.has(rule.label)) continue
    if (!rule.patterns.some((pattern) => pattern.test(corpus))) continue

    if (checkCheckboxByLabel(groupName, rule.label)) {
      checked.add(rule.label)
      filled++
    }
  }

  return filled
}

function isNegativeAnswer(value: string): boolean {
  return /^(no|none|n\/a|na|denied|denies|negative|false)$/i.test(value.trim())
}

function selectPresenceByFieldLabel(labelText: string, details: string): number {
  const value = details.trim()
  if (!value) return 0

  const radio = findFieldElement<HTMLInputElement>(labelText, 'input[type="radio"]')
  if (!radio?.name) return 0

  return selectRadio(radio.name, isNegativeAnswer(value) ? '2' : '1') ? 1 : 0
}

function selectYesNoByFieldLabel(labelText: string, answer: string): number {
  const value = answer.trim()
  if (!value) return 0

  const radio = findFieldElement<HTMLInputElement>(labelText, 'input[type="radio"]')
  if (!radio?.name) return 0

  return selectYesNo(radio.name, value) ? 1 : 0
}

function fillLabeledField(labelText: string, value: string): number {
  const trimmed = value.trim()
  if (!trimmed) return 0

  const field = findFieldElement<HTMLElement>(
    labelText,
    '[contenteditable="true"], textarea, input[type="text"], input:not([type])'
  )
  if (!field) return 0

  if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
    return fillTextLikeField(field, trimmed) ? 1 : 0
  }

  return fillContentEditableField(field, trimmed) ? 1 : 0
}

function buildSubstanceDetails(intake: IntakeData): string {
  const genericOnly = /^(yes|no|none|n\/a|na)$/i
  const parts = [intake.alcoholUse, intake.drugUse, intake.substanceUseHistory]
    .map((value) => value.trim())
    .filter((value) => value && !genericOnly.test(value))

  return Array.from(new Set(parts)).join('; ')
}

// ── Intake → ICE Field Mapping ──

/**
 * Fill the "Initial Clinical Evaluation" form from intake data.
 * Maps IntakeData fields to the specific SP form field selectors.
 *
 * Form sections (userAnswer numbers):
 *   1     Date of assessment
 *   3-4   Beginning/ending time (not from intake)
 *   5     Present at session (checkboxes)
 *   6     Chief complaint (ProseMirror)
 *   7     History of present illness (ProseMirror)
 *   9-22  Symptom checklists & risk (checkboxes) — partially from intake
 *   25-30 Past psychiatric history (radios)
 *   31    Past psychiatric medication trials (ProseMirror)
 *   34    Current psychiatric medications (ProseMirror)
 *   35-36 Substance use (radio + checkboxes)
 *   39-44 Past medical history (radios + ProseMirror)
 *   47-53 Social history (radios, checkboxes, ProseMirror)
 *   56-60 Family history (radios + ProseMirror)
 *   64-84 Mental status exam (comboboxes, checkboxes, ProseMirror) — session observation
 *   85-92 Judgment/assessment (dropdowns, checkboxes, ProseMirror) — session observation
 *   95-103 Review of systems (checkboxes) — session observation
 *   106-111 Assessment section (ProseMirror) — session observation + clinical judgment
 */
function fillICEFromIntake(intake: IntakeData): number {
  let filled = 0

  // ── Session info ──
  // Date of assessment
  const dateInput = document.querySelector('#date-1') as HTMLInputElement | null
  if (dateInput && intake.formDate) {
    if (fillTextLikeField(dateInput, intake.formDate)) filled++
  }

  // Beginning / ending time from appointment header
  const timeSpan = document.querySelector('.start-end-time')
  if (timeSpan) {
    const timeParts = timeSpan.textContent?.trim().split(/\s*-\s*/)
    if (timeParts && timeParts.length === 2) {
      const startInput = document.querySelector('#short-answer-3') as HTMLInputElement | null
      const endInput = document.querySelector('#short-answer-4') as HTMLInputElement | null
      if (fillTextLikeField(startInput, timeParts[0].trim())) filled++
      if (fillTextLikeField(endInput, timeParts[1].trim())) filled++
    }
  }

  // Present at session — always check "Patient"
  if (checkCheckboxByLabel('multi-select-5', 'Patient')) filled++

  // ── Chief complaint & HPI ── (ProseMirror free-text fields)
  const chiefComplaintNarrative = buildChiefComplaintNarrative(intake)
  const historyOfPresentIllness = buildHistoryOfPresentIllnessText(intake)
  if (fillProseMirrorByLabel('free-text-6', chiefComplaintNarrative)) filled++
  if (fillProseMirrorByLabel('free-text-7', historyOfPresentIllness)) filled++

  // ── Symptom checklists (9-22) ──
  // These are clinical observations. We can pre-check from intake symptom data.
  filled += fillSymptomChecklistsFromIntake(intake)

  // ── Past Psychiatric History (radios 25-30) ──
  if (selectYesNo('single-select-25', intake.psychiatricHospitalization)) filled++
  if (selectYesNo('single-select-26', intake.priorTreatment)) filled++
  if (selectYesNo('single-select-27', intake.suicideAttemptHistory)) filled++
  // 28: History of SIB — check intake
  // 29: Access to weapon — not directly in intake
  // 30: Minor weapon notify — N/A

  // Past psychiatric medication trials
  if (fillProseMirrorByLabel('free-text-31', intake.medications)) filled++

  // ── Substance Abuse History ──
  // Current psychiatric medications
  if (fillProseMirrorByLabel('free-text-34', intake.medications)) filled++

  // Currently using or abusing substances
  const hasSubstanceUse = intake.alcoholUse || intake.drugUse || intake.substanceUseHistory
  if (hasSubstanceUse) {
    const isUsing = /yes|current|daily|weekly|monthly|regular|social|occasional/i.test(
      `${intake.alcoholUse} ${intake.drugUse} ${intake.substanceUseHistory}`
    )
    if (selectRadio('single-select-35', isUsing ? '1' : '2')) filled++

    // Substance specifics (checkboxes 36)
    if (isUsing) {
      filled += fillSubstanceCheckboxes(intake)
      filled += fillLabeledField('If yes, please specify', buildSubstanceDetails(intake))
    }
  }

  // ── Past Medical History ──
  if (intake.medicalHistory) {
    const hasMedical = !/none|no|denied|denies/i.test(intake.medicalHistory)
    if (selectRadio('single-select-39', hasMedical ? '1' : '2')) filled++
  }
  filled += selectPresenceByFieldLabel('Allergies', intake.allergies)
  filled += selectYesNoByFieldLabel('Developmental history reported to be within normal limits', intake.developmentalHistory)
  filled += fillLabeledField('Surgeries', intake.surgeries)
  filled += selectPresenceByFieldLabel('History of trouble sleeping', intake.troubleSleeping)
  filled += fillLabeledField('TBI/LOC', intake.tbiLoc)
  filled += fillLabeledField('TBL/LOC', intake.tbiLoc)

  // ── Social History ──
  // History of trauma
  if (intake.physicalSexualAbuseHistory || intake.domesticViolenceHistory) {
    const hasTrauma = !/none|no|denied|denies/i.test(
      `${intake.physicalSexualAbuseHistory} ${intake.domesticViolenceHistory}`
    )
    if (selectRadio('single-select-47', hasTrauma ? '1' : '2')) filled++
  }

  // Marital status (single-select-48)
  if (intake.maritalStatus) {
    filled += fillMaritalStatus(intake.maritalStatus)
  }

  // Living arrangements (multi-select-49)
  if (intake.livingArrangement) {
    filled += fillLivingArrangements(intake.livingArrangement)
  }

  // Employment (multi-select-50)
  if (intake.occupation || intake.additionalInfo || intake.rawQA.length > 0) {
    filled += fillEmployment(intake.occupation, buildIntakeAnswerCorpus(intake))
  }

  // Education (single-select-51)
  if (intake.education) {
    filled += fillEducation(intake.education)
  }

  // Additional social history notes
  const socialNotes = buildSocialHistoryNotes(intake)
  if (fillProseMirrorByLabel('free-text-53', socialNotes)) filled++

  // ── Family History ──
  // Victim of / witness to DV
  if (intake.domesticViolenceHistory) {
    const hasDV = !/none|no|denied|denies/i.test(intake.domesticViolenceHistory)
    if (selectRadio('single-select-56', hasDV ? '1' : '2')) filled++
  }

  // Family history of mental health issues
  if (intake.familyPsychiatricHistory || intake.familyMentalEmotionalHistory) {
    const hasFamilyMH = !/none|no|denied|denies/i.test(
      `${intake.familyPsychiatricHistory} ${intake.familyMentalEmotionalHistory}`
    )
    if (selectRadio('single-select-57', hasFamilyMH ? '1' : '2')) filled++
  }

  // Additional family history notes
  const familyNotes = [intake.familyPsychiatricHistory, intake.familyMentalEmotionalHistory]
    .filter(Boolean).join('\n')
  if (fillProseMirrorByLabel('free-text-60', familyNotes)) filled++

  // ── MSE, Assessment, ROS — left empty for clinician ──
  // These are session observations, not intake data.
  // Fields 64-111 will be filled by future phases (audio transcription, live interview).

  // ── PHQ-9 / GAD-7 scores ──
  if (intake.phq9) {
    const phqText = `PHQ-9: ${intake.phq9.totalScore}/27 — ${intake.phq9.severity}. Functional difficulty: ${intake.phq9.difficulty || 'N/A'}`
    if (fillProseMirrorByLabel('free-text-90', phqText)) filled++
  }
  if (intake.gad7) {
    const gadText = `GAD-7: ${intake.gad7.totalScore}/21 — ${intake.gad7.severity}. Functional difficulty: ${intake.gad7.difficulty || 'N/A'}`
    if (fillProseMirrorByLabel('free-text-91', gadText)) filled++
  }

  // ── SI/HI dropdowns — from intake if available ──
  if (intake.suicidalIdeation) {
    if (selectDropdownById('dropdown-86', mapSIToDropdown(intake.suicidalIdeation))) filled++
  }
  if (intake.homicidalIdeation) {
    if (selectDropdownById('dropdown-87', mapHIToDropdown(intake.homicidalIdeation))) filled++
  }

  return filled
}

// ── Symptom Checklist Helpers ──

// PHQ-9 item → Depression checkbox mapping (multi-select-9)
// Only checks boxes for items the patient endorsed (score > 0)
function fillDepressionFromPHQ9(phq9: AssessmentResult): number {
  let filled = 0
  const endorsed = phq9.items.filter(i => i.score > 0)

  if (endorsed.length === 0) {
    if (checkCheckboxByLabel('multi-select-9', 'Denies')) filled++
    return filled
  }

  // PHQ-9 item number → ICE depression checkbox labels
  const phqToDepression: Record<number, string[]> = {
    1: ['Loss of interest', 'Loss of enjoyment'],
    2: ['Feeling sad, empty, or down', 'Hopelessness'],
    3: ['Insomnia'],  // "sleeping too much" → Hypersomnia handled below
    4: ['Loss of energy', 'Fatigue'],
    5: ['Loss of appetite (without weight loss)'], // overeating handled below
    6: ['Worthlessness'],
    7: ['Difficulty concentrating'],
    8: ['Social withdrawal, agitation'],
    9: ['Recurrent suicidal ideation', 'Recurrent thoughts about death/dying'],
  }

  for (const item of endorsed) {
    const labels = phqToDepression[item.number]
    if (!labels) continue
    for (const label of labels) {
      if (checkCheckboxByLabel('multi-select-9', label)) filled++
    }

    // Special handling for item 3: check response text for hypersomnia
    if (item.number === 3 && /too much|hypersomnia/i.test(item.response)) {
      if (checkCheckboxByLabel('multi-select-9', 'Hypersomnia')) filled++
    }
    // Special handling for item 5: check for overeating
    if (item.number === 5 && /overeat/i.test(item.response)) {
      if (checkCheckboxByLabel('multi-select-9', 'Increased appetite (without weight gain)')) filled++
    }
  }

  return filled
}

function fillDepressionFromKeywords(intake: IntakeData): number {
  let filled = 0
  const symptoms = `${intake.recentSymptoms} ${intake.additionalSymptoms}`.toLowerCase()
  if (!symptoms.trim()) return 0

  const map: Record<string, string> = {
    'crying': 'Frequent crying', 'sad': 'Feeling sad, empty, or down',
    'energy': 'Loss of energy', 'fatigue': 'Fatigue',
    'interest': 'Loss of interest', 'enjoyment': 'Loss of enjoyment',
    'hopeless': 'Hopelessness', 'helpless': 'Helplessness',
    'worthless': 'Worthlessness', 'concentrat': 'Difficulty concentrating',
    'suicid': 'Recurrent suicidal ideation', 'death': 'Recurrent thoughts about death/dying',
    'insomnia': 'Insomnia', 'hypersomnia': 'Hypersomnia',
    'appetite': 'Loss of appetite (without weight loss)',
    'withdrawal': 'Social withdrawal, agitation',
  }
  for (const [keyword, label] of Object.entries(map)) {
    if (symptoms.includes(keyword)) {
      if (checkCheckboxByLabel('multi-select-9', label)) filled++
    }
  }
  return filled
}

// GAD-7 item → Anxiety checkbox mapping (multi-select-10)
function fillAnxietyFromGAD7(gad7: AssessmentResult): number {
  let filled = 0
  const endorsed = gad7.items.filter(i => i.score > 0)

  if (endorsed.length === 0) {
    if (checkCheckboxByLabel('multi-select-10', 'Denies')) filled++
    return filled
  }

  // GAD-7 item number → ICE anxiety checkbox labels
  const gadToAnxiety: Record<number, string[]> = {
    1: ['Feeling on edge or tense'],
    2: ['Difficulty controlling worry, difficulty concentrating'],
    3: ['Excessive worry'],
    4: ['Feeling on edge or tense'],
    5: ['Restlessness'],
    6: ['Feeling on edge or tense'],
    7: ['Excessive worry'],
  }

  const checked = new Set<string>()
  for (const item of endorsed) {
    const labels = gadToAnxiety[item.number]
    if (!labels) continue
    for (const label of labels) {
      if (checked.has(label)) continue
      if (checkCheckboxByLabel('multi-select-10', label)) {
        filled++
        checked.add(label)
      }
    }
  }

  // If sleep issues endorsed on GAD, also check sleep checkbox
  const sleepItem = gad7.items.find(i => i.number === 4 || i.number === 5)
  if (sleepItem && sleepItem.score > 0) {
    if (!checked.has('Difficulty falling or staying asleep')) {
      if (checkCheckboxByLabel('multi-select-10', 'Difficulty falling or staying asleep')) filled++
    }
  }

  return filled
}

function fillAnxietyFromKeywords(intake: IntakeData): number {
  let filled = 0
  const symptoms = `${intake.recentSymptoms} ${intake.additionalSymptoms}`.toLowerCase()
  if (!symptoms.trim()) return 0

  const map: Record<string, string> = {
    'worry': 'Excessive worry', 'distract': 'Distractibility',
    'sleep': 'Difficulty falling or staying asleep',
    'restless': 'Restlessness', 'edge': 'Feeling on edge or tense',
    'tense': 'Feeling on edge or tense',
  }
  for (const [keyword, label] of Object.entries(map)) {
    if (symptoms.includes(keyword)) {
      if (checkCheckboxByLabel('multi-select-10', label)) filled++
    }
  }
  return filled
}

function fillSymptomChecklistsFromIntake(intake: IntakeData): number {
  let filled = 0
  const corpus = buildIntakeAnswerCorpus(intake)

  // ── Depression (multi-select-9) — use PHQ-9 if available ──
  if (intake.phq9 && intake.phq9.items.length > 0) {
    filled += fillDepressionFromPHQ9(intake.phq9)
  } else {
    filled += fillDepressionFromKeywords(intake)
  }

  // ── Anxiety (multi-select-10) — use GAD-7 if available ──
  if (intake.gad7 && intake.gad7.items.length > 0) {
    filled += fillAnxietyFromGAD7(intake.gad7)
  } else {
    filled += fillAnxietyFromKeywords(intake)
  }

  // ── Panic (multi-select-11) ──
  filled += fillKeywordChecklist('multi-select-11', corpus, [
    { label: 'Pounding heart', patterns: [/pounding heart|heart pounding|heart racing/] },
    { label: 'Heart palpitations', patterns: [/palpitations?|heart palpitations?/] },
    { label: 'Sweating', patterns: [/sweating|sweaty/] },
    { label: 'Shortness of breath', patterns: [/shortness of breath|breathless/] },
    { label: 'Difficulty breathing', patterns: [/difficulty breathing|cannot breathe|can't breathe/] },
    { label: 'Sensation of choking', patterns: [/sensation of choking|choking/] },
    { label: 'Trembling or shaking', patterns: [/trembling|shaking|shaky/] },
    { label: 'Chest pain or discomfort', patterns: [/chest pain|chest discomfort/] },
    { label: 'Nausea or abdominal distress', patterns: [/nausea|nauseous|queasy|queasiness|abdominal distress|stomach distress|upset stomach/] },
    { label: 'Abdominal pain or discomfort', patterns: [/abdominal pain|abdominal discomfort|stomach pain|stomach pains|stomach ache|stomach discomfort/] },
    { label: 'Feeling dizzy, unsteady, lightheaded, or faint', patterns: [/dizzy|unsteady|lightheaded|faint/] },
    { label: 'Chills or heat sensations', patterns: [/chills|heat sensations?|hot flashes?/] },
    { label: 'Paresthesias', patterns: [/paresthesia|tingling|numbness/] },
    { label: 'Derealization', patterns: [/derealization|things feel unreal|world feels unreal/] },
    { label: 'Depersonalization', patterns: [/depersonalization|detached from myself|outside my body/] },
    { label: 'Fear of losing control or "going crazy"', patterns: [/losing control|going crazy/] },
    { label: 'Fear of dying', patterns: [/fear of dying|thought i was dying|felt like i was dying/] },
    { label: 'Persistent concern or worry about additional panic attacks or their consequences', patterns: [/worry about another panic|concern about additional panic|fear of another panic/] },
    { label: 'Significant, maladaptive change in behavior related to the attacks', patterns: [/changed behavior.*panic|avoid.*panic|maladaptive change.*panic/] },
    { label: 'Feeling on edge or tense', patterns: [/on edge|tense/] },
  ])

  // ── Post-traumatic stress (multi-select-12) ──
  filled += fillKeywordChecklist('multi-select-12', corpus, [
    { label: 'Repeated or extreme exposure to aversive details of the traumatic event(s)', patterns: [/repeated exposure|extreme exposure|aversive details/] },
    { label: 'Recurrent, involuntary, and intrusive distressing memories of the event(s)', patterns: [/intrusive memories|distressing memories|unwanted memories/] },
    { label: 'Repetitive play involving aspects of the traumatic event(s)', patterns: [/repetitive play/] },
    { label: 'Recurrent distressing dreams related to the event(s)', patterns: [/nightmares?|distressing dreams?/] },
    { label: 'Recurrent distressing dreams related the the event(s), dissociative reactions (e.g. flashbacks, re-enactment of trauma)', patterns: [/flashbacks?|dissociative reactions?|re-?enactment/] },
    { label: 'Intense or prolonged psychological distress at exposure to internal or external cues', patterns: [/psychological distress.*cue|distress.*reminders?|triggered by reminders?/] },
    { label: 'Marked physiological reactions to internal or external cues', patterns: [/physiological reactions?.*cue|physical reactions?.*reminders?/] },
    { label: 'Persistent avoidance of stimuli associated with the event(s)', patterns: [/avoidance|avoiding reminders?|persistent avoidance/] },
    { label: 'Behaviors, difficulty falling or staying asleep', patterns: [/difficulty falling asleep|difficulty staying asleep|insomnia/] },
    { label: 'Negative alterations in cognition and mood (e.g. memory)', patterns: [/memory problems?|negative alterations?|detachment|guilt|shame/] },
    { label: 'Direct experience, witnessing, or learning of a traumatic event(s)', patterns: [/trauma|accident|assault|abuse|violence|crash|plane accident|air ?plane accident|witnessed/] },
  ])

  // ── Mania (multi-select-13) ──
  filled += fillKeywordChecklist('multi-select-13', corpus, [
    { label: 'Persistently elevated mood', patterns: [/elevated mood|euphoric/] },
    { label: 'Persistently expansive mood', patterns: [/expansive mood/] },
    { label: 'Increased energy', patterns: [/increased energy|high energy/] },
    { label: 'Inflated self-esteem', patterns: [/inflated self-esteem/] },
    { label: 'Grandiosity', patterns: [/grandios|grandiosity/] },
    { label: 'Decreased need for sleep', patterns: [/decreased need for sleep|sleeping very little|little sleep/] },
    { label: 'More talkative than usual', patterns: [/more talkative than usual|talkative/] },
    { label: 'Rapid speech', patterns: [/rapid speech/] },
    { label: 'Pressured speech', patterns: [/pressured speech/] },
    { label: 'Flight of ideas', patterns: [/flight of ideas/] },
    { label: 'Racing thoughts', patterns: [/racing thoughts/] },
    { label: 'Distractibility', patterns: [/distractibility|easily distracted/] },
    { label: 'Increase in goal-directed activity', patterns: [/goal-directed activity|more projects|more productive/] },
    { label: 'Psychomotor agitation', patterns: [/psychomotor agitation|agitated/] },
    { label: 'Increased involvement in activities that have a high potential for painful consequences', patterns: [/risky behavior|spending spree|dangerous behavior/] },
    { label: 'Diminished judgment', patterns: [/poor judgment|diminished judgment/] },
    { label: 'Diminished insight', patterns: [/poor insight|diminished insight/] },
    { label: 'Persistently irritable mood', patterns: [/persistently irritable|irritable mood/] },
  ])

  // ── Psychosis: Hallucinations (multi-select-14) ──
  filled += fillKeywordChecklist('multi-select-14', corpus, [
    { label: 'Command', patterns: [/command hallucinations?|voices telling me/] },
    { label: 'Visual (simple)', patterns: [/visual hallucinations? simple/] },
    { label: 'Visual (complex)', patterns: [/visual hallucinations?|seeing things/] },
    { label: 'Tactile', patterns: [/tactile hallucinations?|bugs crawling|things crawling/] },
    { label: 'Olfactory', patterns: [/olfactory hallucinations?|smelling things that aren't there/] },
    { label: 'Gustatory', patterns: [/gustatory hallucinations?|tasting things that aren't there/] },
    { label: 'Auditory', patterns: [/auditory hallucinations?|hearing voices|hearing things that aren't there/] },
  ])

  // ── Psychosis: Delusion (multi-select-15) ──
  filled += fillKeywordChecklist('multi-select-15', corpus, [
    { label: 'Of grandeur', patterns: [/delusions? of grandeur/] },
    { label: 'Of guilt or sin', patterns: [/delusions? of guilt|delusions? of sin/] },
    { label: 'Of reference', patterns: [/delusions? of reference/] },
    { label: 'Of persecution', patterns: [/delusions? of persecution|paranoid delusions?/] },
    { label: 'Of grandiosity', patterns: [/grandiose delusions?|delusions? of grandiosity/] },
    { label: 'Of love (erotic)', patterns: [/erotomanic|delusions? of love/] },
    { label: 'Of jealousy', patterns: [/delusions? of jealousy/] },
    { label: 'Somatic', patterns: [/somatic delusions?/] },
    { label: 'Thought broadcasting', patterns: [/thought broadcasting/] },
    { label: 'Thought insertion', patterns: [/thought insertion/] },
    { label: 'Bizarre', patterns: [/bizarre delusions?/] },
    { label: 'Mood-congruent', patterns: [/mood-congruent/] },
    { label: 'Mood-incongruent', patterns: [/mood-incongruent/] },
    { label: 'Mood-neutral', patterns: [/mood-neutral/] },
    { label: 'Flat affect', patterns: [/flat affect/] },
    { label: 'Disorganized speech', patterns: [/disorganized speech/] },
    { label: 'Disorganized behavior', patterns: [/disorganized behavior/] },
    { label: 'Of control', patterns: [/delusions? of control/] },
  ])

  // ── ADHD (multi-select-16) ──
  filled += fillKeywordChecklist('multi-select-16', corpus, [
    { label: 'Distractibility', patterns: [/distractibility|easily distracted/] },
    { label: 'Hyperactivity and impulsivity', patterns: [/hyperactivity|hyperactive|impulsivity|impulsive/] },
    { label: 'Inattention', patterns: [/inattention|attention problems?|difficulty paying attention/] },
  ])

  // ── Self-injurious behavior (multi-select-17) ──
  filled += fillKeywordChecklist('multi-select-17', corpus, [
    { label: 'Burning skin', patterns: [/burning skin|burn self|burning myself/] },
    { label: 'Pinching or picking skin', patterns: [/skin picking|picking skin|pinching skin/] },
    { label: 'Pulling out hair', patterns: [/pulling out hair|hair pulling|trichotillomania/] },
    { label: 'Hitting head', patterns: [/hitting head|hit head/] },
    { label: 'Banging head', patterns: [/banging head|bang head/] },
    { label: 'Cutting or excoriating skin', patterns: [/cutting|cut self|excoriating skin|excoriation/] },
  ])

  // ── Self-injurious behavior: Insertions-ingestions of object(s) (multi-select-18) ──
  filled += fillKeywordChecklist('multi-select-18', corpus, [
    { label: 'In vagina', patterns: [/insert.*vagina|in vagina/] },
    { label: 'In anus', patterns: [/insert.*anus|in anus/] },
    { label: 'Swallowing', patterns: [/swallowing objects?|ingesting objects?/] },
    { label: 'Under skin', patterns: [/under skin|insert.*skin/] },
  ])

  // ── Eating disorder behaviors (multi-select-19) ──
  filled += fillKeywordChecklist('multi-select-19', corpus, [
    { label: 'Binging', patterns: [/binge|binging/] },
    { label: 'Purging', patterns: [/purge|purging|self-induced vomiting/] },
    { label: 'Excessive exercise', patterns: [/excessive exercise|overexercise|compulsive exercise/] },
    { label: 'Use of diuretics or laxatives', patterns: [/diuretics?|laxatives?/] },
    { label: 'Use of appetite suppressants', patterns: [/appetite suppressants?/] },
    { label: 'Restricting', patterns: [/restricting|food restriction|restrict food/] },
  ])

  // Abuse (multi-select-20) — from intake trauma fields
  if (intake.physicalSexualAbuseHistory) {
    const abuse = intake.physicalSexualAbuseHistory.toLowerCase()
    if (/physical/i.test(abuse)) { if (checkCheckboxByLabel('multi-select-20', 'Physical')) filled++ }
    if (/sexual/i.test(abuse)) { if (checkCheckboxByLabel('multi-select-20', 'Sexual')) filled++ }
    if (/emotional/i.test(abuse)) { if (checkCheckboxByLabel('multi-select-20', 'Emotional')) filled++ }
    if (/household dysfunction|family dysfunction|chaotic home/i.test(abuse)) { if (checkCheckboxByLabel('multi-select-20', 'Household dysfunction')) filled++ }
    if (/neglect/i.test(abuse)) { if (checkCheckboxByLabel('multi-select-20', 'Neglect')) filled++ }
    if (/none|no|denied|denies/i.test(abuse)) { if (checkCheckboxByLabel('multi-select-20', 'Denies')) filled++ }
  }

  // Risk factors (multi-select-21) — derived from intake
  const ageYears = getAgeYears(intake.dob)
  if (ageYears !== null && (ageYears <= 25 || ageYears >= 65)) {
    if (checkCheckboxByLabel('multi-select-21', 'Adolescent, young adult, or elderly age')) filled++
  }
  if (/(single|divorced|widowed)/i.test(intake.maritalStatus)) {
    if (checkCheckboxByLabel('multi-select-21', 'Single, divorced or widowed')) filled++
  }
  if (intake.suicideAttemptHistory && !/no|denied|denies|none/i.test(intake.suicideAttemptHistory)) {
    if (checkCheckboxByLabel('multi-select-21', 'History of suicide attempt')) filled++
  }
  if (/firearm|firearms|gun|guns|weapon|weapons/i.test(corpus)) {
    if (checkCheckboxByLabel('multi-select-21', 'Access to firearms')) filled++
  }
  if (/recent discharge.*psych|discharged.*psych|recently discharged.*hospital/i.test(corpus)) {
    if (checkCheckboxByLabel('multi-select-21', 'Recent discharge from psych hospital')) filled++
  }
  if (/recent loss|grief|bereavement|passed away|death of|lost my|loss of|breakup|divorce/i.test(corpus)) {
    if (checkCheckboxByLabel('multi-select-21', 'Recent loss')) filled++
  }
  if (/suicide.*family member|family member.*suicide|close friend.*suicide|friend.*died by suicide/i.test(corpus)) {
    if (checkCheckboxByLabel('multi-select-21', 'Suicide by family member or close friend')) filled++
  }
  if (intake.substanceUseHistory && !/no|denied|denies|none/i.test(intake.substanceUseHistory)) {
    if (checkCheckboxByLabel('multi-select-21', 'History of substance abuse')) filled++
  }
  if (intake.physicalSexualAbuseHistory && !/no|denied|denies|none/i.test(intake.physicalSexualAbuseHistory)) {
    if (checkCheckboxByLabel('multi-select-21', 'History of abuse')) filled++
  }
  if (/\b(male|man)\b/i.test(`${intake.sex} ${intake.genderIdentity}`)) {
    if (checkCheckboxByLabel('multi-select-21', 'Male')) filled++
  }

  // Protective factors (multi-select-22) — derived from intake / rawQA
  if (/spiritual|religious|religion|faith|church|god|pray/i.test(corpus)) {
    if (checkCheckboxByLabel('multi-select-22', 'Spiritual/religious beliefs')) filled++
  }
  if (/supportive family|supportive friends|good support|social support|family support|partner support/i.test(corpus) ||
      /(with family|with spouse|with partner|with roommate)/i.test(intake.livingArrangement)) {
    if (checkCheckboxByLabel('multi-select-22', 'Perceived social support')) filled++
  }
  if (/(child|children|kids|family|spouse|partner)/i.test(intake.livingArrangement) ||
      /responsibility to family|responsibility to friends|take care of my family/i.test(corpus)) {
    if (checkCheckboxByLabel('multi-select-22', 'Responsibility to family or friends')) filled++
  }

  return filled
}

function fillSubstanceCheckboxes(intake: IntakeData): number {
  let filled = 0
  const substance = `${intake.alcoholUse} ${intake.drugUse} ${intake.substanceUseHistory}`.toLowerCase()
  let matchedSpecific = false

  if (/alcohol/i.test(substance)) { if (checkCheckboxByLabel('multi-select-36', 'Alcohol')) { filled++; matchedSpecific = true } }
  if (/tobacco|nicotine|cigarette|vape/i.test(substance)) { if (checkCheckboxByLabel('multi-select-36', 'Tobacco')) { filled++; matchedSpecific = true } }
  if (/cannabis|marijuana|weed|thc/i.test(substance)) { if (checkCheckboxByLabel('multi-select-36', 'Cannabis')) { filled++; matchedSpecific = true } }
  if (/opioid|heroin|fentanyl|oxy/i.test(substance)) { if (checkCheckboxByLabel('multi-select-36', 'Opioids')) { filled++; matchedSpecific = true } }
  if (/cocaine|crack/i.test(substance)) { if (checkCheckboxByLabel('multi-select-36', 'Cocaine')) { filled++; matchedSpecific = true } }
  if (/amphetamine|meth|adderall/i.test(substance)) { if (checkCheckboxByLabel('multi-select-36', 'Amphetamines')) { filled++; matchedSpecific = true } }
  if (/hallucinogen|lsd|mushroom|psilocybin/i.test(substance)) { if (checkCheckboxByLabel('multi-select-36', 'Hallucinogens')) { filled++; matchedSpecific = true } }
  if (!matchedSpecific && buildSubstanceDetails(intake)) {
    if (checkCheckboxByLabel('multi-select-36', 'Other')) filled++
  }

  return filled
}

// ── Social History Helpers ──

function fillMaritalStatus(status: string): number {
  const lower = status.toLowerCase()
  const map: Record<string, string> = {
    'married': '1',
    'domestic': '2',
    'divorced': '3',
    'widowed': '4',
    'single': '5',
  }
  for (const [keyword, value] of Object.entries(map)) {
    if (lower.includes(keyword)) {
      return selectRadio('single-select-48', value) ? 1 : 0
    }
  }
  // Fallback to "Other"
  return selectRadio('single-select-48', '6') ? 1 : 0
}

function fillLivingArrangements(living: string): number {
  let filled = 0
  const lower = living.toLowerCase()

  if (/alone/i.test(lower)) { if (checkCheckboxByLabel('multi-select-49', 'Alone')) filled++ }
  if (/roommate/i.test(lower)) { if (checkCheckboxByLabel('multi-select-49', 'With roommate')) filled++ }
  if (/family|parent|child|sibling/i.test(lower)) { if (checkCheckboxByLabel('multi-select-49', 'With family')) filled++ }
  if (/spouse|husband|wife|partner/i.test(lower)) { if (checkCheckboxByLabel('multi-select-49', 'With spouse')) filled++ }
  if (/group home/i.test(lower)) { if (checkCheckboxByLabel('multi-select-49', 'Group home')) filled++ }

  return filled
}

function fillEmployment(occupation: string, corpus = ''): number {
  let filled = 0
  const lower = occupation.toLowerCase()

  if (/unemployed|not working|out of work/i.test(lower)) {
    if (checkCheckboxByLabel('multi-select-50', 'Currently unemployed')) filled++
  } else if (occupation.trim()) {
    if (checkCheckboxByLabel('multi-select-50', 'Currently employed')) filled++
  }

  if (/history of unemployment|periods of unemployment|laid off|layoff|out of work/i.test(corpus)) {
    if (checkCheckboxByLabel('multi-select-50', 'History of unemployment')) filled++
  }

  if (/work misconduct|misconduct at work|terminated for cause|fired for cause|disciplinary action/i.test(corpus)) {
    if (checkCheckboxByLabel('multi-select-50', 'History of work misconduct')) filled++
  }

  return filled
}

function fillEducation(education: string): number {
  const lower = education.toLowerCase()
  const map: Record<string, string> = {
    'pre-school': '1', 'preschool': '1',
    'elementary': '2',
    'middle': '3',
    'high school': '4', 'hs': '4', 'ged': '4',
    'associate': '5', '2-year': '5', 'community college': '5',
    'bachelor': '6', '4-year': '6', 'college': '6', 'university': '6',
    'graduate': '7', 'master': '7', 'doctoral': '7', 'phd': '7', 'md': '7', 'jd': '7',
  }
  for (const [keyword, value] of Object.entries(map)) {
    if (lower.includes(keyword)) {
      return selectRadio('single-select-51', value) ? 1 : 0
    }
  }
  return 0
}

function buildSocialHistoryNotes(intake: IntakeData): string {
  const parts: string[] = []
  if (intake.occupation) parts.push(`Occupation: ${intake.occupation}`)
  if (intake.relationshipDescription) parts.push(`Relationship: ${intake.relationshipDescription}`)
  if (intake.livingArrangement) parts.push(`Living arrangement: ${intake.livingArrangement}`)
  if (intake.additionalInfo) parts.push(intake.additionalInfo)
  return parts.join('\n')
}

// ── SI/HI Dropdown Mappers ──

function mapSIToDropdown(si: string): string {
  const lower = si.toLowerCase()
  if (/no|denied|denies|none/i.test(lower)) return 'Denies'
  if (/active.*plan.*intent/i.test(lower)) return 'Active with plan with intent'
  if (/active.*plan/i.test(lower)) return 'Active with plan but without intent'
  if (/passive.*plan/i.test(lower)) return 'Passive with plan and without intent'
  if (/passive/i.test(lower)) return 'Passive without plan or intent'
  return 'Denies'
}

function mapHIToDropdown(hi: string): string {
  const lower = hi.toLowerCase()
  if (/no|denied|denies|none/i.test(lower)) return 'Denies'
  if (/active.*plan.*intent/i.test(lower)) return 'Yes: Active with plan and with intent'
  if (/active.*plan/i.test(lower)) return 'Yes: Active with plan but without intent'
  if (/passive.*plan/i.test(lower)) return 'Yes: Passive with plan and without intent'
  if (/passive/i.test(lower)) return 'Yes: Passive without plan or intent'
  if (/specific/i.test(lower)) return 'Yes: Specific person'
  return 'Denies'
}

// ── Main Fill Logic ──

async function fillInitialClinicalEval(): Promise<void> {
  assertExtensionContext()

  const intake = await getIntake()
  if (!intake) {
    showToast('No intake data captured. Go to the client\'s intake form and click "Capture Intake" first.', 'error')
    return
  }

  // Wait for ProseMirror editors to initialize (Ember.js rendering)
  await wait(500)

  const filled = fillICEFromIntake(intake)
  await flushBooleanSyncOperations()
  await wait(200)

  if (filled > 0) {
    showToast(`Filled ${filled} fields from intake data for ${intake.fullName || 'client'}`, 'success')
  } else {
    showToast('Could not fill any fields. Make sure you are on the Initial Clinical Evaluation note.', 'error')
  }

  console.log('[SPN] Filled ICE from intake:', { filled, clientName: intake.fullName })
}

// ── Button Injection ──

async function handleFillClick(): Promise<void> {
  try {
    await fillInitialClinicalEval()
  } catch (err) {
    if (isExtensionContextInvalidatedError(err)) {
      showToast('Extension reloaded — please refresh this page.', 'error')
    } else {
      console.error('[SPN] Fill note error:', err)
      showToast('Failed to fill note.', 'error')
    }
  }
}

function injectFillButton(): void {
  if (!isNotePage()) return
  if (document.getElementById('spn-fill-btn')) return

  // Only show if we have intake data
  getIntake().then((intake) => {
    if (!intake) return

    injectButton('Fill from Intake', handleFillClick, {
      id: 'spn-fill-btn',
      position: 'bottom-left-high',
    })
  }).catch(() => {
    // Extension context invalidated — ignore
  })
}

// Watch for SPA navigation
let lastUrl = window.location.href
const observer = new MutationObserver(() => {
  if (window.location.href !== lastUrl) {
    lastUrl = window.location.href
    setTimeout(injectFillButton, 500)
  }
})

observer.observe(document.body, { childList: true, subtree: true })

// Initial injection
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(injectFillButton, 500))
} else {
  setTimeout(injectFillButton, 500)
}

registerFloatingButtonsController(() => {
  setTimeout(injectFillButton, 0)
})
