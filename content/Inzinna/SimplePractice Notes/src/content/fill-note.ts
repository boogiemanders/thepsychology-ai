/**
 * SimplePractice Notes — Progress Note Auto-Filler
 *
 * Fills SimplePractice's progress note / clinical documentation forms
 * with the generated note data. Injects a "Fill Note" button when
 * on a note-editing page.
 *
 * SimplePractice note URL patterns:
 *   Progress note:    /clients/{id}/notes/{noteId}/edit
 *   New note:         /clients/{id}/appointments/{apptId}/notes/new
 *   Treatment plan:   /clients/{id}/treatment_plans/{tpId}/edit
 */

import { ProgressNote } from '../lib/types'
import { getNote, updateNoteStatus } from '../lib/storage'
import {
  injectButton,
  showToast,
  assertExtensionContext,
  isExtensionContextInvalidatedError,
  fillField,
  fillTextLikeField,
  fillContentEditableField,
  normalizedText,
  isVisible,
  findFieldContainer,
  findFieldElement,
  selectOptionByText,
  wait,
} from './shared'

// ── URL Detection ──

function isNotePage(): boolean {
  return /\/clients\/\d+\/(notes|appointments)/.test(window.location.pathname) ||
    /\/clients\/\d+\/treatment_plans/.test(window.location.pathname)
}

// ── Field Filling Helpers ──

/**
 * Fill a field by trying multiple strategies:
 * 1. Direct selector match
 * 2. Label-based lookup → input/textarea
 * 3. Label-based lookup → contenteditable
 */
function fillByLabel(labelText: string, value: string): boolean {
  if (!value) return false

  const container = findFieldContainer(labelText)
  if (!container) return false

  // Try input/textarea
  const input = container.querySelector('input:not([type="checkbox"]):not([type="radio"]), textarea') as HTMLInputElement | HTMLTextAreaElement | null
  if (input && isVisible(input)) {
    return fillTextLikeField(input, value)
  }

  // Try contenteditable
  const editable = container.querySelector('[contenteditable="true"]') as HTMLElement | null
  if (editable && isVisible(editable)) {
    return fillContentEditableField(editable, value)
  }

  return false
}

/**
 * Fill a rich text editor field (SimplePractice uses contenteditable divs
 * and sometimes embedded editors for note body sections).
 */
function fillRichTextField(selectors: string[], value: string): boolean {
  if (!value) return false

  for (const sel of selectors) {
    const el = document.querySelector(sel) as HTMLElement | null
    if (!el || !isVisible(el)) continue

    if (el.getAttribute('contenteditable') === 'true') {
      return fillContentEditableField(el, value)
    }

    if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
      return fillTextLikeField(el, value)
    }
  }

  return false
}

// ── Note Section Fillers ──

function formatMSE(mse: ProgressNote['mentalStatusExam']): string {
  const parts: string[] = []

  if (mse.appearance) parts.push(`Appearance: ${mse.appearance}`)
  if (mse.behavior) parts.push(`Behavior: ${mse.behavior}`)
  if (mse.speech) parts.push(`Speech: ${mse.speech}`)
  if (mse.mood) parts.push(`Mood: ${mse.mood}`)
  if (mse.affect) parts.push(`Affect: ${mse.affect}`)
  if (mse.thoughtProcess) parts.push(`Thought Process: ${mse.thoughtProcess}`)
  if (mse.thoughtContent) parts.push(`Thought Content: ${mse.thoughtContent}`)
  if (mse.perceptions) parts.push(`Perceptions: ${mse.perceptions}`)
  if (mse.cognition) parts.push(`Cognition: ${mse.cognition}`)
  if (mse.insight) parts.push(`Insight: ${mse.insight}`)
  if (mse.judgment) parts.push(`Judgment: ${mse.judgment}`)

  return parts.join('\n')
}

function formatDiagnosticImpressions(impressions: ProgressNote['diagnosticImpressions']): string {
  if (!impressions.length) return ''

  return impressions.map((dx, i) => {
    const lines = [`${i + 1}. ${dx.name} (${dx.code})`]
    if (dx.criteriaEvidence.length) {
      lines.push(`   Evidence: ${dx.criteriaEvidence.join('; ')}`)
    }
    if (dx.ruleOuts.length) {
      lines.push(`   Rule-outs: ${dx.ruleOuts.join(', ')}`)
    }
    return lines.join('\n')
  }).join('\n\n')
}

function formatTreatmentPlan(plan: ProgressNote['treatmentPlan']): string {
  const parts: string[] = []

  if (plan.goals.length) {
    parts.push('Goals:')
    plan.goals.forEach((g, i) => parts.push(`  ${i + 1}. ${g}`))
  }
  if (plan.interventions.length) {
    parts.push('Interventions:')
    plan.interventions.forEach((iv, i) => parts.push(`  ${i + 1}. ${iv}`))
  }
  if (plan.frequency) parts.push(`Frequency: ${plan.frequency}`)
  if (plan.referrals) parts.push(`Referrals: ${plan.referrals}`)

  return parts.join('\n')
}

/**
 * Build the full progress note as a single text block.
 * Used as fallback when SP has a single large text area for the note body.
 */
function buildFullNoteText(note: ProgressNote): string {
  const sections: string[] = []

  sections.push(`CLIENT: ${note.clientName}`)
  sections.push(`DATE: ${note.sessionDate}`)
  sections.push(`SESSION TYPE: ${note.sessionType}`)
  if (note.cptCode) sections.push(`CPT: ${note.cptCode}`)
  if (note.duration) sections.push(`DURATION: ${note.duration}`)
  sections.push('')

  if (note.chiefComplaint) {
    sections.push('CHIEF COMPLAINT')
    sections.push(note.chiefComplaint)
    sections.push('')
  }

  if (note.presentingComplaint) {
    sections.push('PRESENTING COMPLAINT')
    sections.push(note.presentingComplaint)
    sections.push('')
  }

  const mseText = formatMSE(note.mentalStatusExam)
  if (mseText) {
    sections.push('MENTAL STATUS EXAM')
    sections.push(mseText)
    sections.push('')
  }

  const dxText = formatDiagnosticImpressions(note.diagnosticImpressions)
  if (dxText) {
    sections.push('DIAGNOSTIC IMPRESSIONS')
    sections.push(dxText)
    sections.push('')
  }

  if (note.clinicalFormulation) {
    sections.push('CLINICAL FORMULATION')
    sections.push(note.clinicalFormulation)
    sections.push('')
  }

  const txPlan = formatTreatmentPlan(note.treatmentPlan)
  if (txPlan) {
    sections.push('TREATMENT PLAN')
    sections.push(txPlan)
    sections.push('')
  }

  if (note.plan) {
    sections.push('PLAN / NEXT STEPS')
    sections.push(note.plan)
  }

  return sections.join('\n')
}

// ── Main Fill Logic ──

async function fillProgressNote(): Promise<void> {
  assertExtensionContext()

  const note = await getNote()
  if (!note) {
    showToast('No note data available. Generate a note first.', 'error')
    return
  }

  let filled = 0

  // Try to fill individual sections if SP has structured fields
  // SP progress notes can have different templates — try label-based filling first

  if (fillByLabel('chief complaint', note.chiefComplaint)) filled++
  if (fillByLabel('presenting complaint', note.presentingComplaint) ||
      fillByLabel('presenting problem', note.presentingComplaint)) filled++

  // Mental Status Exam — try individual fields
  const mse = note.mentalStatusExam
  if (fillByLabel('appearance', mse.appearance)) filled++
  if (fillByLabel('behavior', mse.behavior)) filled++
  if (fillByLabel('speech', mse.speech)) filled++
  if (fillByLabel('mood', mse.mood)) filled++
  if (fillByLabel('affect', mse.affect)) filled++
  if (fillByLabel('thought process', mse.thoughtProcess)) filled++
  if (fillByLabel('thought content', mse.thoughtContent)) filled++
  if (fillByLabel('perceptions', mse.perceptions)) filled++
  if (fillByLabel('cognition', mse.cognition)) filled++
  if (fillByLabel('insight', mse.insight)) filled++
  if (fillByLabel('judgment', mse.judgment)) filled++

  // MSE as a single block if individual fields didn't work
  if (filled === 0) {
    const mseText = formatMSE(mse)
    if (fillByLabel('mental status', mseText) ||
        fillByLabel('mental status exam', mseText) ||
        fillByLabel('mse', mseText)) {
      filled++
    }
  }

  // Diagnostic impressions
  const dxText = formatDiagnosticImpressions(note.diagnosticImpressions)
  if (fillByLabel('diagnostic impressions', dxText) ||
      fillByLabel('diagnosis', dxText) ||
      fillByLabel('assessment', dxText)) {
    filled++
  }

  // Diagnosis codes — try to fill ICD-10 code fields
  for (const dx of note.diagnosticImpressions) {
    if (fillByLabel('diagnosis code', dx.code) ||
        fillByLabel('icd-10', dx.code) ||
        fillByLabel('icd code', dx.code)) {
      filled++
    }
  }

  // Clinical formulation
  if (fillByLabel('clinical formulation', note.clinicalFormulation) ||
      fillByLabel('formulation', note.clinicalFormulation) ||
      fillByLabel('case conceptualization', note.clinicalFormulation)) {
    filled++
  }

  // Treatment plan
  const txText = formatTreatmentPlan(note.treatmentPlan)
  if (fillByLabel('treatment plan', txText) ||
      fillByLabel('plan', txText)) {
    filled++
  }

  // Next steps / follow-up
  if (fillByLabel('plan', note.plan) ||
      fillByLabel('next steps', note.plan) ||
      fillByLabel('follow-up', note.plan) ||
      fillByLabel('follow up', note.plan)) {
    filled++
  }

  // CPT code
  if (note.cptCode) {
    if (selectOptionByText('select[name*="cpt" i]', note.cptCode) ||
        fillByLabel('cpt code', note.cptCode) ||
        fillByLabel('service code', note.cptCode)) {
      filled++
    }
  }

  // Duration
  if (note.duration) {
    if (fillByLabel('duration', note.duration) ||
        fillByLabel('session length', note.duration)) {
      filled++
    }
  }

  // Fallback: if we couldn't fill individual fields, try the main note body
  if (filled < 3) {
    const fullText = buildFullNoteText(note)

    // Try common SP note body selectors
    const bodyFilled = fillRichTextField([
      '[contenteditable="true"].note-body',
      '[contenteditable="true"].ql-editor',
      '.note-content [contenteditable="true"]',
      'textarea[name*="note" i]',
      'textarea[name*="body" i]',
      'textarea[name*="content" i]',
      '.progress-note-body textarea',
      '[contenteditable="true"]',
    ], fullText)

    if (bodyFilled) filled += 10 // bulk fill
  }

  if (filled > 0) {
    await updateNoteStatus({ noteSubmitted: true })
    showToast(`Filled ${filled} note sections for ${note.clientName}`, 'success')
  } else {
    showToast('Could not find note fields on this page. Make sure you are on a note editing page.', 'error')
  }

  console.log('[SPN] Filled progress note:', { filled, clientName: note.clientName })
}

// ── Button Injection ──

async function handleFillClick(): Promise<void> {
  try {
    await fillProgressNote()
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

  // Only show if we have note data
  getNote().then((note) => {
    if (!note) return

    injectButton('Fill Note', handleFillClick, {
      id: 'spn-fill-btn',
      position: 'bottom-left',
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
