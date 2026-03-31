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
import { trackAction } from '../lib/usage'
import {
  injectButton,
  showToast,
  assertExtensionContext,
  isExtensionContextInvalidatedError,
  fillTextLikeField,
  fillProseMirrorByLabel,
  fillCombobox,
  checkCheckboxByLabel,
  selectRadio,
  selectYesNo,
  selectDropdownById,
  wait,
} from './shared'

// ── URL Detection ──

function isNotePage(): boolean {
  return /\/appointments\/\d+/.test(window.location.pathname) ||
    /\/clients\/\d+\/(notes|appointments)/.test(window.location.pathname) ||
    /\/clients\/\d+\/treatment_plans/.test(window.location.pathname)
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
  if (fillProseMirrorByLabel('free-text-6', intake.chiefComplaint)) filled++
  if (fillProseMirrorByLabel('free-text-7', intake.historyOfPresentIllness || intake.presentingProblems)) filled++

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
    }
  }

  // ── Past Medical History ──
  if (intake.medicalHistory) {
    const hasMedical = !/none|no|denied|denies/i.test(intake.medicalHistory)
    if (selectRadio('single-select-39', hasMedical ? '1' : '2')) filled++
  }
  // Surgeries free-text
  // TBI/LOC free-text
  // Trouble sleeping
  // Allergies, developmental history — not directly mapped in intake

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
  if (intake.occupation) {
    filled += fillEmployment(intake.occupation)
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

  // Abuse (multi-select-20) — from intake trauma fields
  if (intake.physicalSexualAbuseHistory) {
    const abuse = intake.physicalSexualAbuseHistory.toLowerCase()
    if (/physical/i.test(abuse)) { if (checkCheckboxByLabel('multi-select-20', 'Physical')) filled++ }
    if (/sexual/i.test(abuse)) { if (checkCheckboxByLabel('multi-select-20', 'Sexual')) filled++ }
    if (/emotional/i.test(abuse)) { if (checkCheckboxByLabel('multi-select-20', 'Emotional')) filled++ }
    if (/neglect/i.test(abuse)) { if (checkCheckboxByLabel('multi-select-20', 'Neglect')) filled++ }
    if (/none|no|denied|denies/i.test(abuse)) { if (checkCheckboxByLabel('multi-select-20', 'Denies')) filled++ }
  }

  // Risk factors (multi-select-21) — derived from intake
  if (intake.suicideAttemptHistory && !/no|denied|denies|none/i.test(intake.suicideAttemptHistory)) {
    if (checkCheckboxByLabel('multi-select-21', 'History of suicide attempt')) filled++
  }
  if (intake.substanceUseHistory && !/no|denied|denies|none/i.test(intake.substanceUseHistory)) {
    if (checkCheckboxByLabel('multi-select-21', 'History of substance abuse')) filled++
  }
  if (intake.physicalSexualAbuseHistory && !/no|denied|denies|none/i.test(intake.physicalSexualAbuseHistory)) {
    if (checkCheckboxByLabel('multi-select-21', 'History of abuse')) filled++
  }

  return filled
}

function fillSubstanceCheckboxes(intake: IntakeData): number {
  let filled = 0
  const substance = `${intake.alcoholUse} ${intake.drugUse} ${intake.substanceUseHistory}`.toLowerCase()

  if (/alcohol/i.test(substance)) { if (checkCheckboxByLabel('multi-select-36', 'Alcohol')) filled++ }
  if (/tobacco|nicotine|cigarette|vape/i.test(substance)) { if (checkCheckboxByLabel('multi-select-36', 'Tobacco')) filled++ }
  if (/cannabis|marijuana|weed|thc/i.test(substance)) { if (checkCheckboxByLabel('multi-select-36', 'Cannabis')) filled++ }
  if (/opioid|heroin|fentanyl|oxy/i.test(substance)) { if (checkCheckboxByLabel('multi-select-36', 'Opioids')) filled++ }
  if (/cocaine|crack/i.test(substance)) { if (checkCheckboxByLabel('multi-select-36', 'Cocaine')) filled++ }
  if (/amphetamine|meth|adderall/i.test(substance)) { if (checkCheckboxByLabel('multi-select-36', 'Amphetamines')) filled++ }
  if (/hallucinogen|lsd|mushroom|psilocybin/i.test(substance)) { if (checkCheckboxByLabel('multi-select-36', 'Hallucinogens')) filled++ }

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

function fillEmployment(occupation: string): number {
  let filled = 0
  const lower = occupation.toLowerCase()

  if (/unemployed|not working|out of work/i.test(lower)) {
    if (checkCheckboxByLabel('multi-select-50', 'Currently unemployed')) filled++
  } else if (occupation.trim()) {
    if (checkCheckboxByLabel('multi-select-50', 'Currently employed')) filled++
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

  if (filled > 0) {
    void trackAction('fillNote')
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

// Listen for toggle-buttons message from popup
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === 'toggle-floating-buttons') {
    const btns = document.querySelectorAll('.spn-floating-btn, .zsp-floating-btn') as NodeListOf<HTMLElement>
    const anyVisible = Array.from(btns).some(b => b.style.display !== 'none')
    btns.forEach(b => { b.style.display = anyVisible ? 'none' : '' })
    sendResponse({ visible: !anyVisible })
    return true
  }
})
