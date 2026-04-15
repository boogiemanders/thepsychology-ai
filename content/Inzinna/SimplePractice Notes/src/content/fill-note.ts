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

import { IntakeData, AssessmentResult, DiagnosticImpression, ProgressNote, SessionNotes, SoapDraft, TranscriptEntry, MseChecklist, DEFAULT_MSE_CHECKLIST } from '../lib/types'
import { getIntake, getNote, getDiagnosticWorkspace, getPreferences, getSessionNotes, saveSessionNotes, getSoapDraft, saveSoapDraft, clearSoapDraft, appendTranscriptEntry, saveMseChecklist, getMseChecklist, clearMseChecklist, getTranscript, clearTranscript } from '../lib/storage'
import { generateSoapDraft } from '../lib/soap-generator'
import { buildDraftNote } from '../lib/note-draft'
import { buildClinicalGuidance } from '../lib/clinical-guidance'
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

function isAppointmentPage(): boolean {
  return /\/appointments\/\d+/.test(window.location.pathname)
}

function isVideoRoom(): boolean {
  return /\/appt-[a-f0-9]+\/room/.test(window.location.pathname)
}

function getVideoApptId(): string {
  const match = window.location.pathname.match(/\/appt-([a-f0-9]+)\/room/)
  return match ? match[1] : ''
}

function detectSoapForm(): boolean {
  const labels = ['free-text-1', 'free-text-2', 'free-text-3', 'free-text-4']
  const hasSoapFields = !!document.querySelector('.progress-individual-note-container') &&
    labels.every((label) => !!document.querySelector(`[contenteditable="true"][aria-label="${label}"]`))
  if (!hasSoapFields) return false
  // SOAP notes have exactly 4 free-text fields (S/O/A/P); ICE and other forms have many more
  const totalFreeText = document.querySelectorAll('[contenteditable="true"][aria-label^="free-text-"]').length
  return totalFreeText <= 5
}

function fillSoapNote(draft: SoapDraft): number {
  let filled = 0
  if (fillProseMirrorByLabel('free-text-1', draft.subjective)) filled++
  if (fillProseMirrorByLabel('free-text-2', draft.objective)) filled++
  if (fillProseMirrorByLabel('free-text-3', draft.assessment)) filled++
  if (fillProseMirrorByLabel('free-text-4', draft.plan)) filled++
  return filled
}

async function fillSavedSoapDraft(providedDraft?: SoapDraft | null): Promise<{ ok: boolean; filled?: number; error?: string }> {
  const draft = providedDraft ?? await getSoapDraft()
  if (!draft) {
    return { ok: false, error: 'No saved SOAP draft found. Save notes for SOAP first.' }
  }

  if (!detectSoapForm()) {
    return { ok: false, error: 'SOAP progress note form is not open on this page.' }
  }

  await wait(300)
  const filled = fillSoapNote(draft)

  if (filled === 0) {
    return { ok: false, error: 'SOAP fields were found, but no draft content could be filled.' }
  }

  return { ok: true, filled }
}

// ── Video Room Session Notes ──

let saveTimeout: ReturnType<typeof setTimeout> | null = null

function handleSessionNotesInput(textarea: HTMLTextAreaElement): void {
  const apptId = getVideoApptId()
  if (!apptId) return

  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => {
    saveSessionNotes({
      apptId,
      notes: textarea.value,
      updatedAt: new Date().toISOString(),
    }).catch(() => {})
  }, 500)
}

/** Track which apptId we've initialized the video panel for, to avoid re-clearing on re-inject */
let videoRoomInitApptId = ''

function injectVideoNotePanel(): void {
  if (!isVideoRoom()) return
  if (document.getElementById('spn-video-notes')) return

  const apptId = getVideoApptId()
  if (!apptId) return

  // Clear stale data from previous session when entering a new video room
  if (apptId !== videoRoomInitApptId) {
    videoRoomInitApptId = apptId
    clearSoapDraft().catch(() => {})
    clearMseChecklist().catch(() => {})
    clearTranscript().catch(() => {})
    // Reset caption + incremental generation state for the new session
    captionCount = 0
    stopIncrementalGeneration()
    if (captionObserver) {
      captionObserver.disconnect()
      captionObserver = null
    }
    console.log('[SPN] Cleared stale session data for new appointment', apptId)
  }

  const panel = document.createElement('div')
  panel.id = 'spn-video-notes'
  panel.innerHTML = `
    <div class="spn-video-notes-header">
      <span class="spn-video-notes-title">Session Notes</span>
      <div class="spn-video-notes-actions">
        <span class="spn-video-notes-status" id="spn-notes-status"></span>
        <button class="spn-video-notes-toggle" id="spn-notes-toggle" title="Minimize">−</button>
      </div>
    </div>
    <div class="spn-video-notes-caption-status" id="spn-caption-status" title="Live caption capture status"></div>
    <div class="spn-video-notes-body" id="spn-notes-body">
      <textarea
        id="spn-session-textarea"
        class="spn-video-notes-textarea"
        placeholder="Type session notes here..."
        spellcheck="true"
      ></textarea>
      <div class="spn-mse-section">
        <button class="spn-mse-toggle" id="spn-mse-toggle">MSE Quick Check ▸</button>
        <div class="spn-mse-body" id="spn-mse-body" style="display:none">
          <div class="spn-mse-row" data-field="appearance">
            <span class="spn-mse-label">Appearance</span>
            <div class="spn-mse-pills">
              <button class="spn-mse-pill active" data-value="well-groomed">well-groomed</button>
              <button class="spn-mse-pill active" data-value="casually dressed">casual dress</button>
              <button class="spn-mse-pill active" data-value="appropriate hygiene">good hygiene</button>
              <button class="spn-mse-pill" data-value="disheveled">disheveled</button>
              <button class="spn-mse-pill" data-value="unkempt">unkempt</button>
            </div>
          </div>
          <div class="spn-mse-row" data-field="behavior">
            <span class="spn-mse-label">Behavior</span>
            <div class="spn-mse-pills">
              <button class="spn-mse-pill active" data-value="cooperative">cooperative</button>
              <button class="spn-mse-pill active" data-value="good eye contact">good eye contact</button>
              <button class="spn-mse-pill active" data-value="psychomotor normal">psychomotor normal</button>
              <button class="spn-mse-pill" data-value="guarded">guarded</button>
              <button class="spn-mse-pill" data-value="poor eye contact">poor eye contact</button>
              <button class="spn-mse-pill" data-value="agitated">agitated</button>
              <button class="spn-mse-pill" data-value="psychomotor retarded">retarded</button>
            </div>
          </div>
          <div class="spn-mse-row" data-field="speech">
            <span class="spn-mse-label">Speech</span>
            <div class="spn-mse-pills">
              <button class="spn-mse-pill active" data-value="normal rate">normal rate</button>
              <button class="spn-mse-pill active" data-value="normal volume">normal volume</button>
              <button class="spn-mse-pill active" data-value="coherent">coherent</button>
              <button class="spn-mse-pill" data-value="pressured">pressured</button>
              <button class="spn-mse-pill" data-value="slow">slow</button>
              <button class="spn-mse-pill" data-value="soft">soft</button>
              <button class="spn-mse-pill" data-value="loud">loud</button>
              <button class="spn-mse-pill" data-value="monotone">monotone</button>
            </div>
          </div>
          <div class="spn-mse-row" data-field="mood">
            <span class="spn-mse-label">Mood</span>
            <input type="text" class="spn-mse-input" id="spn-mse-mood" placeholder="Client's words (e.g. anxious, good, frustrated)" />
          </div>
          <div class="spn-mse-row" data-field="affect">
            <span class="spn-mse-label">Affect</span>
            <div class="spn-mse-pills">
              <button class="spn-mse-pill active" data-value="congruent">congruent</button>
              <button class="spn-mse-pill active" data-value="full range">full range</button>
              <button class="spn-mse-pill" data-value="flat">flat</button>
              <button class="spn-mse-pill" data-value="blunted">blunted</button>
              <button class="spn-mse-pill" data-value="labile">labile</button>
              <button class="spn-mse-pill" data-value="constricted">constricted</button>
              <button class="spn-mse-pill" data-value="incongruent">incongruent</button>
            </div>
          </div>
          <div class="spn-mse-row" data-field="thoughtProcess">
            <span class="spn-mse-label">Thought Process</span>
            <div class="spn-mse-pills">
              <button class="spn-mse-pill active" data-value="linear">linear</button>
              <button class="spn-mse-pill active" data-value="goal-directed">goal-directed</button>
              <button class="spn-mse-pill" data-value="tangential">tangential</button>
              <button class="spn-mse-pill" data-value="circumstantial">circumstantial</button>
              <button class="spn-mse-pill" data-value="disorganized">disorganized</button>
              <button class="spn-mse-pill" data-value="flight of ideas">flight of ideas</button>
            </div>
          </div>
          <div class="spn-mse-row" data-field="thoughtContent">
            <span class="spn-mse-label">Thought Content</span>
            <div class="spn-mse-pills">
              <button class="spn-mse-pill active" data-value="no SI">no SI</button>
              <button class="spn-mse-pill active" data-value="no HI">no HI</button>
              <button class="spn-mse-pill active" data-value="no delusions">no delusions</button>
              <button class="spn-mse-pill" data-value="SI endorsed">SI endorsed</button>
              <button class="spn-mse-pill" data-value="HI endorsed">HI endorsed</button>
              <button class="spn-mse-pill" data-value="paranoid ideation">paranoid ideation</button>
              <button class="spn-mse-pill" data-value="obsessions">obsessions</button>
            </div>
          </div>
          <div class="spn-mse-row" data-field="perceptions">
            <span class="spn-mse-label">Perceptions</span>
            <div class="spn-mse-pills">
              <button class="spn-mse-pill active" data-value="no hallucinations">no hallucinations</button>
              <button class="spn-mse-pill" data-value="AH">AH</button>
              <button class="spn-mse-pill" data-value="VH">VH</button>
              <button class="spn-mse-pill" data-value="illusions">illusions</button>
            </div>
          </div>
          <div class="spn-mse-row" data-field="cognition">
            <span class="spn-mse-label">Cognition</span>
            <div class="spn-mse-pills">
              <button class="spn-mse-pill active" data-value="alert">alert</button>
              <button class="spn-mse-pill active" data-value="oriented x4">oriented x4</button>
              <button class="spn-mse-pill active" data-value="intact memory">intact memory</button>
              <button class="spn-mse-pill" data-value="oriented x3">oriented x3</button>
              <button class="spn-mse-pill" data-value="impaired concentration">impaired concentration</button>
              <button class="spn-mse-pill" data-value="impaired memory">impaired memory</button>
            </div>
          </div>
          <div class="spn-mse-row" data-field="insight">
            <span class="spn-mse-label">Insight</span>
            <select class="spn-mse-select" id="spn-mse-insight">
              <option value="good" selected>Good</option>
              <option value="fair">Fair</option>
              <option value="limited">Limited</option>
              <option value="poor">Poor</option>
            </select>
          </div>
          <div class="spn-mse-row" data-field="judgment">
            <span class="spn-mse-label">Judgment</span>
            <select class="spn-mse-select" id="spn-mse-judgment">
              <option value="good" selected>Good</option>
              <option value="fair">Fair</option>
              <option value="impaired">Impaired</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  `
  document.body.appendChild(panel)

  const textarea = document.getElementById('spn-session-textarea') as HTMLTextAreaElement
  const toggle = document.getElementById('spn-notes-toggle') as HTMLButtonElement
  const body = document.getElementById('spn-notes-body') as HTMLDivElement
  const status = document.getElementById('spn-notes-status') as HTMLSpanElement

  // Load existing notes
  getSessionNotes(apptId).then((existing) => {
    if (existing?.notes) {
      textarea.value = existing.notes
    }
  }).catch(() => {})

  // Auto-save on input
  textarea.addEventListener('input', () => {
    status.textContent = 'Saving...'
    handleSessionNotesInput(textarea)
    setTimeout(() => { status.textContent = 'Saved' }, 600)
    setTimeout(() => { status.textContent = '' }, 2000)
  })

  // Sync from popup or other sources writing to session notes
  chrome.storage.onChanged.addListener((changes) => {
    if (!changes['spn_session_notes']) return
    const updated = changes['spn_session_notes'].newValue as SessionNotes | undefined
    if (!updated || updated.apptId !== apptId) return
    if (document.activeElement !== textarea) {
      textarea.value = updated.notes
    }
  })

  // Minimize/expand toggle
  let minimized = false
  toggle.addEventListener('click', () => {
    minimized = !minimized
    body.style.display = minimized ? 'none' : 'block'
    toggle.textContent = minimized ? '+' : '−'
    toggle.title = minimized ? 'Expand' : 'Minimize'
    panel.classList.toggle('spn-video-notes-minimized', minimized)
  })

  // MSE checklist behavior
  initMseChecklist(apptId)
}

// ── MSE Checklist ──

function initMseChecklist(apptId: string): void {
  const mseToggle = document.getElementById('spn-mse-toggle')
  const mseBody = document.getElementById('spn-mse-body')
  if (!mseToggle || !mseBody) return

  let mseOpen = false
  mseToggle.addEventListener('click', () => {
    mseOpen = !mseOpen
    mseBody.style.display = mseOpen ? 'block' : 'none'
    mseToggle.textContent = mseOpen ? 'MSE Quick Check ▾' : 'MSE Quick Check ▸'
  })

  // Load saved checklist
  getMseChecklist().then((saved) => {
    if (!saved) return
    restoreMseChecklist(saved)
  }).catch(() => {})

  // Pill toggle behavior
  let saveTimer: ReturnType<typeof setTimeout> | null = null
  const debouncedSave = () => {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => saveMseChecklist(collectMseChecklist()), 500)
  }

  mseBody.addEventListener('click', (e) => {
    const pill = (e.target as HTMLElement).closest('.spn-mse-pill') as HTMLButtonElement | null
    if (!pill) return
    pill.classList.toggle('active')
    debouncedSave()
  })

  // Mood input
  const moodInput = document.getElementById('spn-mse-mood') as HTMLInputElement | null
  moodInput?.addEventListener('input', debouncedSave)

  // Select dropdowns
  const insightSelect = document.getElementById('spn-mse-insight') as HTMLSelectElement | null
  const judgmentSelect = document.getElementById('spn-mse-judgment') as HTMLSelectElement | null
  insightSelect?.addEventListener('change', debouncedSave)
  judgmentSelect?.addEventListener('change', debouncedSave)
}

function collectMseChecklist(): MseChecklist {
  const getActivePills = (field: string): string[] => {
    const row = document.querySelector(`.spn-mse-row[data-field="${field}"]`)
    if (!row) return []
    return Array.from(row.querySelectorAll('.spn-mse-pill.active')).map((el) => el.getAttribute('data-value') || '')
  }

  return {
    appearance: getActivePills('appearance'),
    behavior: getActivePills('behavior'),
    speech: getActivePills('speech'),
    mood: (document.getElementById('spn-mse-mood') as HTMLInputElement)?.value ?? '',
    affect: getActivePills('affect'),
    thoughtProcess: getActivePills('thoughtProcess'),
    thoughtContent: getActivePills('thoughtContent'),
    perceptions: getActivePills('perceptions'),
    cognition: getActivePills('cognition'),
    insight: (document.getElementById('spn-mse-insight') as HTMLSelectElement)?.value ?? 'good',
    judgment: (document.getElementById('spn-mse-judgment') as HTMLSelectElement)?.value ?? 'good',
    updatedAt: new Date().toISOString(),
  }
}

function restoreMseChecklist(checklist: MseChecklist): void {
  const restorePills = (field: string, values: string[]) => {
    const row = document.querySelector(`.spn-mse-row[data-field="${field}"]`)
    if (!row) return
    const valueSet = new Set(values)
    for (const pill of Array.from(row.querySelectorAll('.spn-mse-pill'))) {
      const value = pill.getAttribute('data-value') || ''
      pill.classList.toggle('active', valueSet.has(value))
    }
  }

  restorePills('appearance', checklist.appearance)
  restorePills('behavior', checklist.behavior)
  restorePills('speech', checklist.speech)
  restorePills('affect', checklist.affect)
  restorePills('thoughtProcess', checklist.thoughtProcess)
  restorePills('thoughtContent', checklist.thoughtContent)
  restorePills('perceptions', checklist.perceptions)
  restorePills('cognition', checklist.cognition)

  const moodInput = document.getElementById('spn-mse-mood') as HTMLInputElement | null
  if (moodInput && checklist.mood) moodInput.value = checklist.mood

  const insightSelect = document.getElementById('spn-mse-insight') as HTMLSelectElement | null
  if (insightSelect && checklist.insight) insightSelect.value = checklist.insight

  const judgmentSelect = document.getElementById('spn-mse-judgment') as HTMLSelectElement | null
  if (judgmentSelect && checklist.judgment) judgmentSelect.value = checklist.judgment
}

// ── Session End Detection + Auto-Generation ──

let lastVideoRoomUrl = ''
let lastCaptionTimestamp = 0
let sessionEndTimer: ReturnType<typeof setInterval> | null = null
let sessionEndTriggered = false

function startSessionEndDetection(): void {
  if (!isVideoRoom()) return
  lastVideoRoomUrl = location.href
  sessionEndTriggered = false

  // Caption timeout detection: if captions were active and stop for 60s, session likely ended
  sessionEndTimer = setInterval(() => {
    if (sessionEndTriggered) return
    if (lastCaptionTimestamp > 0 && Date.now() - lastCaptionTimestamp > 60_000) {
      console.log('[SPN] Caption stream inactive for 60s — session may have ended')
      // Don't auto-trigger on caption timeout alone — too noisy. Only on URL change.
    }
  }, 10_000)
}

function checkSessionEndOnUrlChange(newUrl: string): void {
  if (sessionEndTriggered) return
  const wasVideoRoom = /\/appt-[a-f0-9]+\/room/.test(lastVideoRoomUrl)
  const isStillVideoRoom = /\/appt-[a-f0-9]+\/room/.test(newUrl)

  if (wasVideoRoom && !isStillVideoRoom) {
    sessionEndTriggered = true
    stopIncrementalGeneration()
    if (sessionEndTimer) {
      clearInterval(sessionEndTimer)
      sessionEndTimer = null
    }
    const apptMatch = lastVideoRoomUrl.match(/\/appt-([a-f0-9]+)\/room/)
    const apptId = apptMatch?.[1] ?? ''
    if (apptId) {
      handleSessionEnd(apptId)
    }
  }
  lastVideoRoomUrl = newUrl
}

async function handleSessionEnd(apptId: string): Promise<void> {
  console.log('[SPN] Session ended for appointment', apptId)

  try {
    const prefs = await getPreferences()
    if (!prefs.autoGenerateOnSessionEnd) {
      console.log('[SPN] Auto-generation disabled in preferences')
      return
    }

    showToast('Generating SOAP draft...', 'info')

    const [sessionNotesData, transcript, intake, workspace, mseChecklist] = await Promise.all([
      getSessionNotes(apptId),
      getTranscript(apptId),
      getIntake(),
      getDiagnosticWorkspace(),
      getMseChecklist(),
    ])

    const sessionNotes = sessionNotesData?.notes ?? ''
    const diagnosticImpressions = workspace?.finalizedImpressions ?? []

    // Try to get treatment plan from storage
    const tpResult = await chrome.storage.session.get('spn_treatment_plan')
    const treatmentPlan = tpResult['spn_treatment_plan'] ?? null

    const clientName = intake
      ? [intake.firstName, intake.lastName].filter(Boolean).join(' ') || intake.fullName
      : ''

    const draft = await generateSoapDraft(
      sessionNotes,
      transcript,
      treatmentPlan,
      intake,
      diagnosticImpressions,
      mseChecklist,
      prefs,
      { apptId, clientName, sessionDate: new Date().toLocaleDateString('en-US') }
    )

    await chrome.storage.session.set({ spn_soap_draft: draft })

    const method = draft.generationMethod === 'llm' ? 'AI-generated' : 'Template-generated'
    showToast(`SOAP draft ready (${method}) — open popup to review`, 'success')
    console.log('[SPN] Auto-generated SOAP draft:', draft.generationMethod)
  } catch (err) {
    console.error('[SPN] Failed to auto-generate SOAP draft:', err)
    showToast('SOAP auto-generation failed — generate manually from popup', 'error')
  }
}

// ── Live Caption Observer ──

let captionObserver: MutationObserver | null = null
let captionCount = 0

function updateCaptionStatus(): void {
  const el = document.getElementById('spn-caption-status')
  if (!el) return
  if (captionCount === 0) {
    el.textContent = 'Captions: waiting for captions...'
    el.className = 'spn-video-notes-caption-status waiting'
  } else {
    el.textContent = `Captions: ${captionCount} captured`
    el.className = 'spn-video-notes-caption-status active'
  }
}

function inferSpeakerRole(name: string): TranscriptEntry['speaker'] {
  // SimplePractice shows the clinician's name with credentials (e.g. "Anders Chan, PsyD")
  // Clients typically don't have credential suffixes
  if (/\b(PsyD|PhD|LMFT|LCSW|LMHC|LPCC|LPC|MSW|MD|DO|NP|RN)\b/i.test(name)) {
    return 'clinician'
  }
  return 'client'
}

function findCaptionContainer(): Element | null {
  // SimplePractice uses class "HDRTV room-captions" on the caption container
  return document.querySelector('.room-captions') ?? document.querySelector('[class*="room-captions"]')
}

function extractCaptionLines(container: Element): Array<{ name: string; text: string }> {
  const results: Array<{ name: string; text: string }> = []

  // Try known selector patterns for SimplePractice caption lines
  // Pattern 1: .line elements with .name and .text children
  let lines = container.querySelectorAll('.line')
  if (lines.length) {
    for (const line of lines) {
      const name = (line.querySelector('.name') ?? line.querySelector('[class*="name"]'))?.textContent?.trim() ?? ''
      const text = (line.querySelector('.text') ?? line.querySelector('[class*="text"]'))?.textContent?.trim() ?? ''
      if (text) results.push({ name, text })
    }
    return results
  }

  // Pattern 2: direct children divs/spans that contain speaker text
  lines = container.querySelectorAll('[class*="line"], [class*="caption"]')
  if (lines.length) {
    for (const line of lines) {
      const children = line.children
      if (children.length >= 2) {
        const name = children[0].textContent?.trim() ?? ''
        const text = children[1].textContent?.trim() ?? ''
        if (text) results.push({ name, text })
      } else if (children.length === 1 || line.textContent) {
        const text = line.textContent?.trim() ?? ''
        if (text) results.push({ name: '', text })
      }
    }
    return results
  }

  // Pattern 3: fallback — grab all text nodes with meaningful content from the body area
  const body = container.querySelector('.body, [class*="body"]') ?? container
  const childDivs = body.querySelectorAll(':scope > div, :scope > p, :scope > span')
  for (const el of childDivs) {
    const text = el.textContent?.trim() ?? ''
    if (text && text.length > 2) results.push({ name: '', text })
  }

  return results
}

function startCaptionObserver(): void {
  if (!isVideoRoom()) return
  if (captionObserver) return

  const apptId = getVideoApptId()
  if (!apptId) return

  const seenTexts = new Set<string>()
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  function processCaptions(): void {
    const container = findCaptionContainer()
    if (!container) return

    const lines = extractCaptionLines(container)
    if (!lines.length) return

    for (const { name, text } of lines) {
      // Deduplicate by exact text to avoid storing the same caption twice
      // (SimplePractice updates caption text in-place as speech is recognized)
      if (seenTexts.has(text)) continue
      seenTexts.add(text)

      const speaker = inferSpeakerRole(name)
      captionCount++
      lastCaptionTimestamp = Date.now()
      updateCaptionStatus()
      appendTranscriptEntry(apptId, {
        speaker,
        text,
        timestamp: new Date().toISOString(),
      }).catch(() => {})
    }
  }

  function attachObserver(target: Element): void {
    captionObserver?.disconnect()
    captionObserver = new MutationObserver(() => {
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(processCaptions, 300)
    })
    captionObserver.observe(target, { childList: true, subtree: true, characterData: true })
    console.log('[SPN] Caption observer attached to', target.className)
  }

  updateCaptionStatus()

  // If caption container already exists, attach directly
  const existing = findCaptionContainer()
  if (existing) {
    attachObserver(existing)
    console.log('[SPN] Caption observer started for appointment', apptId)
    return
  }

  // Otherwise watch for the caption container to appear (user toggles captions on later)
  console.log('[SPN] Waiting for caption container to appear...')
  const waitForCaptions = new MutationObserver(() => {
    const container = findCaptionContainer()
    if (container) {
      waitForCaptions.disconnect()
      attachObserver(container)
      console.log('[SPN] Caption observer started for appointment', apptId)
    }
  })
  waitForCaptions.observe(document.body, { childList: true, subtree: true })
}

// ── Incremental SOAP Generation During Session ──

let incrementalGenTimer: ReturnType<typeof setInterval> | null = null
let lastIncrementalCaptionCount = 0
let incrementalGenerating = false

function startIncrementalGeneration(): void {
  if (!isVideoRoom()) return
  if (incrementalGenTimer) return

  const apptId = getVideoApptId()
  if (!apptId) return

  // Check every 90s if new captions arrived, and regenerate SOAP draft
  incrementalGenTimer = setInterval(async () => {
    if (incrementalGenerating) return
    if (captionCount <= lastIncrementalCaptionCount) return
    // Need at least 10 new captions before regenerating
    if (captionCount - lastIncrementalCaptionCount < 10) return

    incrementalGenerating = true
    lastIncrementalCaptionCount = captionCount

    try {
      const prefs = await getPreferences()
      const [sessionNotesData, transcript, intake, workspace, mseChecklist] = await Promise.all([
        getSessionNotes(apptId),
        getTranscript(apptId),
        getIntake(),
        getDiagnosticWorkspace(),
        getMseChecklist(),
      ])

      if (!transcript?.entries.length) return

      const sessionNotes = sessionNotesData?.notes ?? ''
      const diagnosticImpressions = workspace?.finalizedImpressions ?? []
      const treatmentPlan = await chrome.storage.session.get('spn_treatment_plan').then((r) => r['spn_treatment_plan'] ?? null)
      const clientName = intake ? [intake.firstName, intake.lastName].filter(Boolean).join(' ') || intake.fullName : ''

      console.log('[SPN] Incremental SOAP generation...', { captionCount, transcriptEntries: transcript.entries.length })

      const draft = await generateSoapDraft(
        sessionNotes,
        transcript,
        treatmentPlan,
        intake,
        diagnosticImpressions,
        mseChecklist,
        prefs,
        { apptId, clientName, sessionDate: new Date().toLocaleDateString('en-US') }
      )

      await saveSoapDraft(draft)
      console.log('[SPN] Incremental SOAP draft updated:', draft.generationMethod)
    } catch (err) {
      console.warn('[SPN] Incremental SOAP generation failed:', err)
    } finally {
      incrementalGenerating = false
    }
  }, 90_000) // every 90 seconds

  console.log('[SPN] Incremental SOAP generation started for', apptId)
}

function stopIncrementalGeneration(): void {
  if (incrementalGenTimer) {
    clearInterval(incrementalGenTimer)
    incrementalGenTimer = null
  }
  lastIncrementalCaptionCount = 0
  incrementalGenerating = false
}

function capitalize(value: string): string {
  if (!value) return value
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function unique(values: string[]): string[] {
  const seen = new Set<string>()
  const output: string[] = []

  for (const value of values) {
    const key = value.toLowerCase()
    if (!key || seen.has(key)) continue
    seen.add(key)
    output.push(value)
  }

  return output
}

function joinList(items: string[]): string {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`
}

function lowerCaseFirst(value: string): string {
  if (!value) return value
  return value.charAt(0).toLowerCase() + value.slice(1)
}

function splitManualNoteLines(notes: string): string[] {
  return unique(
    notes
      .split(/\n+/)
      .map((line) => normalizeWhitespace(line))
      .filter(Boolean)
  )
}

function collectManualNoteLines(notes: string, patterns: RegExp[], limit = 4): string[] {
  return splitManualNoteLines(notes)
    .filter((line) => patterns.some((pattern) => pattern.test(line)))
    .slice(0, limit)
}

function hasAnyPattern(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text))
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
  return age ? `${age}-year-old` : ''
}

function getManualAgeLabel(notes: string): string {
  const match = notes.match(/\b(\d{1,3})\s*(?:yo|y\/o|year old)\b/i)
  return match ? `${match[1]}-year-old` : ''
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
    if (/multiple races/i.test(race)) {
      ethnicityOrRace = 'multiracial Hispanic/Latino'
    } else {
      ethnicityOrRace = race ? `${race} Hispanic/Latino` : 'Hispanic/Latino'
    }
  } else if (/^no$/i.test(ethnicity)) {
    ethnicityOrRace = /multiple races/i.test(race) ? 'multiracial' : race
  } else {
    ethnicityOrRace = ethnicity || (/multiple races/i.test(race) ? 'multiracial' : race)
  }

  return [ethnicityOrRace, gender].filter(Boolean).join(' ')
}

type PronounForms = {
  subject: string
  object: string
  possessive: string
  reflexive: string
}

function inferPronounForms(intake: IntakeData): PronounForms {
  const genderText = `${intake.genderIdentity} ${intake.sex}`.toLowerCase()
  if (/\b(male|man|boy|he|him)\b/.test(genderText)) {
    return { subject: 'he', object: 'him', possessive: 'his', reflexive: 'himself' }
  }
  if (/\b(female|woman|girl|she|her)\b/.test(genderText)) {
    return { subject: 'she', object: 'her', possessive: 'her', reflexive: 'herself' }
  }
  return { subject: 'they', object: 'them', possessive: 'their', reflexive: 'themselves' }
}

const ANXIETY_PATTERNS = [/\banxiety\b/i, /\banxious\b/i, /\bworry\b/i, /\bpanic\b/i, /\bon edge\b/i, /\bjealous\b/i]
const DEPRESSION_PATTERNS = [/\bdepress/i, /\bsad\b/i, /\bdown\b/i, /\bhopeless/i, /\bcry(?:ing)?\b/i, /\bgrief\b/i, /\bloss\b/i]
const ANGER_PATTERNS = [/\banger\b/i, /\bangry\b/i, /\byell(?:ed|ing)?\b/i, /\bfight(?:ing|s)?\b/i, /\birritab/i, /\bdefensive\b/i, /\blose control\b/i]
const RELATIONSHIP_PATTERNS = [/\bgirlfriend\b/i, /\bboyfriend\b/i, /\bpartner\b/i, /\bspouse\b/i, /\bex\b/i, /\brelationship\b/i, /\battachment\b/i, /\bmarriage\b/i, /\bengage(?:d|ment)?\b/i]
const TRAUMA_PATTERNS = [/\btrauma\b/i, /\bassault\b/i, /\babuse\b/i, /\bviolence\b/i, /\broofied\b/i, /\bdrugged\b/i, /\btouch(?:ed|ing)\b/i, /\baccident\b/i, /\bcrash\b/i]
const ABUSE_PATTERNS = [/\babuse\b/i, /\bassault\b/i, /\broofied\b/i, /\bdrugged\b/i, /\btouch(?:ed|ing)\b/i, /\bslap(?:ped)?\b/i, /\bpush(?:ed)?\b/i, /\bviolence\b/i]
const SUBSTANCE_PATTERNS = [/\balcohol\b/i, /\bdrink(?:ing)?\b/i, /\bdrank\b/i, /\bbeer\b/i, /\bwine\b/i, /\bliquor\b/i, /\bpatron\b/i, /\bsoju\b/i, /\bweed\b/i, /\bmarijuana\b/i, /\bcannabis\b/i, /\bjoint\b/i, /\bblunt\b/i, /\bthc\b/i, /\bvape\b/i, /\bnicotine\b/i, /\bcigarette\b/i, /\bcocaine\b/i, /\bcrack\b/i, /\bmeth\b/i, /\badderall\b/i, /\bxanax\b/i, /\bopioid\b/i, /\bshroom/i, /\bmushroom/i, /\blsd\b/i]
const SLEEP_PATTERNS = [/\bsleep\b/i, /\binsomnia\b/i, /\bnightmare/i]
const CONCENTRATION_PATTERNS = [/\bfoggy\b/i, /\bfogginess\b/i, /\bconcentrat/i, /\bfocus\b/i, /\bhazy memory\b/i]
const EXERCISE_PATTERNS = [/\bcycling\b/i, /\bcycle\b/i, /\blifting\b/i, /\bweights?\b/i, /\bgym\b/i, /\bexercise\b/i]
const BREATHING_PATTERNS = [/\bbreathe\b/i, /\bbreathing\b/i, /\bgrounding\b/i]
const SPIRITUAL_PATTERNS = [/\bgod\b/i, /\bchurch\b/i, /\bfaith\b/i, /\bpray/i, /\bspiritual/i]
const ANGER_MANAGEMENT_PATTERNS = [/\banger management\b/i]

function normalizeLivingArrangement(livingArrangement: string, pronouns: PronounForms): string {
  const trimmed = livingArrangement.trim()
  if (!trimmed) return ''
  if (/alone|live alone/i.test(trimmed)) return 'alone'

  let cleaned = trimmed
    .replace(/^i\s+live\s+/i, '')
    .replace(/^i\s+love\s+/i, '')
    .replace(/^live\s+/i, '')
    .replace(/^love\s+/i, '')
    .trim()

  if (!cleaned) return ''
  cleaned = cleaned
    .replace(/\bmy mom\b/gi, `${pronouns.possessive} mother`)
    .replace(/\bmy dad\b/gi, `${pronouns.possessive} father`)
    .replace(/\bmy parents\b/gi, `${pronouns.possessive} parents`)
    .replace(/\bmy grandma\b/gi, `${pronouns.possessive} grandmother`)
    .replace(/\bmy grandpa\b/gi, `${pronouns.possessive} grandfather`)
    .replace(/\bmy sister\b/gi, `${pronouns.possessive} sister`)
    .replace(/\bmy brother\b/gi, `${pronouns.possessive} brother`)
    .replace(/\bmy family\b/gi, `${pronouns.possessive} family`)
    .replace(/\bmy\b/gi, pronouns.possessive)

  const lower = cleaned.toLowerCase()
  if (/^with\s+/i.test(lower)) return lower
  return `with ${lower}`
}

function normalizeOccupation(occupation: string): string {
  const trimmed = occupation.trim()
  if (!trimmed) return ''
  if (/unemployed|not working|out of work/i.test(trimmed)) return 'currently unemployed'

  const yearsMatch = trimmed.match(/^(.*?)[,\s-]+(\d+\s+years?)$/i)
  if (yearsMatch) {
    const role = yearsMatch[1]
      .trim()
      .replace(/[,\s-]+$/, '')
      .replace(/^(a|an)\s+/i, '')
      .toLowerCase()
    const duration = yearsMatch[2].trim().toLowerCase()
    return role ? `a ${role} for ${duration}` : ''
  }

  const cleaned = trimmed.replace(/^(a|an)\s+/i, '').toLowerCase()
  return cleaned ? `a ${cleaned}` : ''
}

function normalizeEducationForNarrative(education: string): string {
  const trimmed = education.trim()
  if (!trimmed) return ''

  const cleaned = trimmed
    .replace(/^education[:\s-]*/i, '')
    .replace(/^i\s+(?:am|have|completed|finished|earned)\s+/i, '')
    .replace(/[.]+$/, '')
    .trim()
    .toLowerCase()

  if (!cleaned) return ''
  if (/^bachelor/.test(cleaned)) return `completed a ${cleaned}`
  if (/^master/.test(cleaned)) return `completed a ${cleaned}`
  if (/^associate/.test(cleaned)) return `completed an ${cleaned}`
  return `completed ${cleaned}`
}

function normalizeClause(value: string): string {
  return lowerCaseFirst(value.trim().replace(/[.]+$/, ''))
}

function rewriteClientPerspective(value: string, pronouns: PronounForms): string {
  return normalizeWhitespace(value)
    .replace(/\bmyself\b/gi, pronouns.reflexive)
    .replace(/\bmine\b/gi, `${pronouns.possessive} own`)
    .replace(/\bmy\b/gi, pronouns.possessive)
    .replace(/\bme\b/gi, pronouns.object)
    .replace(/\bourselves\b/gi, pronouns.reflexive)
    .replace(/\bours\b/gi, `${pronouns.possessive} own`)
    .replace(/\bour\b/gi, pronouns.possessive)
    .replace(/\bus\b/gi, pronouns.object)
}

function smoothClinicalPhrase(value: string, pronouns: PronounForms): string {
  let cleaned = rewriteClientPerspective(value, pronouns)

  cleaned = cleaned
    .replace(
      /\bwork on\s+(?:his|her|their)\s+communicating\s+(?:his|her|their)\s+emotions\s+and\s+understanding\s+them\s+for\s+the\s+relationships\s+around\s+(?:him|her|them)\b/i,
      `improve how ${pronouns.subject} communicates and understands ${pronouns.possessive} emotions in close relationships`
    )
    .replace(
      /\bwork on\s+(?:his|her|their)\s+communicating\s+(?:his|her|their)\s+emotions\b/i,
      `improve how ${pronouns.subject} communicates ${pronouns.possessive} emotions`
    )
    .replace(/\bfor the relationships around (?:him|her|them)\b/i, 'in close relationships')
    .replace(/\bunderstanding them for the relationships around (?:him|her|them)\b/i, `understanding them in ${pronouns.possessive} close relationships`)
    .replace(/\s+,/g, ',')

  return normalizeWhitespace(cleaned)
}

function splitComplaintParts(value: string): string[] {
  return value
    .split(/[\n,;]+/)
    .map((part) => normalizeClause(part))
    .filter(Boolean)
}

function buildChiefComplaintSentences(chiefComplaint: string, pronoun: string, pronouns: PronounForms): string[] {
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

  return parts.map((part) => {
    if (/^i\s+want\s+to\b/i.test(part)) {
      const normalized = smoothClinicalPhrase(part.replace(/^i\s+want\s+to\b/i, '').trim(), pronouns)
      return `${pronoun} presented for therapy to ${normalized}.`
    }
    if (/^want\s+to\b/i.test(part)) {
      const normalized = smoothClinicalPhrase(part.replace(/^want\s+to\b/i, '').trim(), pronouns)
      return `${pronoun} presented for therapy to ${normalized}.`
    }
    if (/^i\s+need\s+to\b/i.test(part)) {
      const normalized = smoothClinicalPhrase(part.replace(/^i\s+need\s+to\b/i, '').trim(), pronouns)
      return `${pronoun} reported needing to ${normalized}.`
    }
    if (/^i\s+feel\b/i.test(part)) {
      const normalized = smoothClinicalPhrase(part.replace(/^i\s+feel\b/i, '').trim(), pronouns)
      return `${pronoun} reported feeling ${normalized}.`
    }
    // Therapy-type complaints: "sex therapy", "couples therapy", "grief counseling", etc.
    if (/\btherap(y|ist)\b|\bcounseling\b|\btreatment\b/i.test(part)) {
      return `${pronoun} presented for ${smoothClinicalPhrase(part, pronouns)}.`
    }
    return `${pronoun} reported ${smoothClinicalPhrase(part, pronouns)}.`
  })
}

function toReportedSpeech(value: string, pronouns: PronounForms): string {
  const trimmed = smoothClinicalPhrase(value, pronouns).replace(/[.]+$/, '')
  if (!trimmed) return ''

  const replacements: Array<[RegExp, string]> = [
    [/^i want to\b/i, `${capitalize(pronouns.subject)} wants to`],
    [/^i would like to\b/i, `${capitalize(pronouns.subject)} would like to`],
    [/^i need to\b/i, `${capitalize(pronouns.subject)} needs to`],
    [/^i am\b/i, `${capitalize(pronouns.subject)} is`],
    [/^i'm\b/i, `${capitalize(pronouns.subject)} is`],
    [/^i have\b/i, `${capitalize(pronouns.subject)} has`],
    [/^i feel\b/i, `${capitalize(pronouns.subject)} feels`],
    [/^i live\b/i, `${capitalize(pronouns.subject)} lives`],
    [/^my\b/i, `${capitalize(pronouns.possessive)}`],
  ]

  for (const [pattern, replacement] of replacements) {
    if (pattern.test(trimmed)) {
      return `${trimmed.replace(pattern, replacement)}.`
    }
  }

  return `${capitalize(pronouns.subject)} reported ${lowerCaseFirst(trimmed)}.`
}

function buildManualThemePhrases(notes: string): string[] {
  const lower = notes.toLowerCase()
  const phrases: string[] = []

  if (hasAnyPattern(lower, ANXIETY_PATTERNS)) phrases.push('anxiety and worry')
  if (hasAnyPattern(lower, ANGER_PATTERNS)) phrases.push('anger and emotional reactivity')
  if (hasAnyPattern(lower, RELATIONSHIP_PATTERNS)) phrases.push('relationship stress and attachment difficulties')
  if (hasAnyPattern(lower, TRAUMA_PATTERNS)) phrases.push('distress related to a recent unsafe event')
  if (hasAnyPattern(lower, DEPRESSION_PATTERNS)) phrases.push('low mood or loss-related distress')
  if (hasAnyPattern(lower, SLEEP_PATTERNS)) phrases.push('sleep disturbance')
  if (hasAnyPattern(lower, CONCENTRATION_PATTERNS)) phrases.push('difficulty concentrating')
  if (hasAnyPattern(lower, SUBSTANCE_PATTERNS)) phrases.push('substance use concerns')

  return unique(phrases).slice(0, 4)
}

function buildManualGoalPhrases(notes: string): string[] {
  const lower = notes.toLowerCase()
  const phrases: string[] = []

  if (/\bstop drinking\b|\bdrink less\b|\breduce drinking\b|\bsober\b/.test(lower)) {
    phrases.push('reducing alcohol use')
  }
  if (hasAnyPattern(lower, EXERCISE_PATTERNS)) {
    phrases.push('using exercise as a coping skill')
  }
  if (hasAnyPattern(lower, BREATHING_PATTERNS)) {
    phrases.push('using breathing skills')
  }
  if (hasAnyPattern(lower, ANGER_MANAGEMENT_PATTERNS)) {
    phrases.push('strengthening anger-management skills')
  }

  return unique(phrases).slice(0, 3)
}

function buildManualChiefComplaintSentences(intake: IntakeData): string[] {
  const notes = intake.manualNotes.trim()
  if (!notes) return []

  const themePhrases = buildManualThemePhrases(notes)
  const goalPhrases = buildManualGoalPhrases(notes)
  const sentences: string[] = []

  if (themePhrases.length) {
    sentences.push(`Additional concerns include ${joinList(themePhrases)}.`)
  }
  if (goalPhrases.length) {
    sentences.push(`The client expressed interest in ${joinList(goalPhrases)}.`)
  }

  return sentences
}

function buildManualHPISentences(intake: IntakeData): string[] {
  const notes = intake.manualNotes.trim()
  if (!notes) return []

  const lower = notes.toLowerCase()
  const sentences: string[] = []

  if (hasAnyPattern(lower, RELATIONSHIP_PATTERNS) && hasAnyPattern(lower, ANGER_PATTERNS)) {
    sentences.push('Current stress appears closely tied to relationship conflict and difficulty managing strong emotions.')
  } else {
    const themePhrases = buildManualThemePhrases(notes)
    if (themePhrases.length) {
      sentences.push(`The client also reported ${joinList(themePhrases)}.`)
    }
  }

  if (hasAnyPattern(lower, TRAUMA_PATTERNS)) {
    if (/\bvideo\b|\bothers know\b|\bperceived by others\b/.test(lower)) {
      sentences.push('The client also described distress related to a recent unsafe event and worry about how others may perceive the situation.')
    } else {
      sentences.push('The client also described distress related to a recent unsafe event.')
    }
  }

  const goalPhrases = buildManualGoalPhrases(notes)
  if (goalPhrases.length) {
    sentences.push(`The client described efforts toward ${joinList(goalPhrases)}.`)
  }

  return unique(sentences)
}

function buildManualSubstanceDetails(notes: string): string[] {
  const lower = notes.toLowerCase()
  const details: string[] = []

  if (!hasAnyPattern(lower, SUBSTANCE_PATTERNS)) return details

  if (/\balcohol\b|\bdrink(?:ing)?\b|\bdrank\b|\bbeer\b|\bwine\b|\bliquor\b|\bpatron\b|\bsoju\b/.test(lower)) {
    if (/\bstop drinking\b|\bdrink less\b|\breduce drinking\b/.test(lower)) {
      details.push('Alcohol use was discussed, and the client expressed interest in drinking less')
    } else {
      details.push('Alcohol use was discussed in clinician notes')
    }
  }

  if (/\bweed\b|\bmarijuana\b|\bcannabis\b|\bjoint\b|\bblunt\b|\bthc\b/.test(lower)) {
    details.push('Cannabis use was discussed in clinician notes')
  }

  if (/\bvape\b|\bnicotine\b|\bcigarette\b/.test(lower)) {
    details.push('Nicotine use was discussed in clinician notes')
  }

  if (/\bcocaine\b|\bcrack\b|\bmeth\b|\badderall\b|\bxanax\b|\bopioid\b|\bshroom/i.test(lower)) {
    details.push('Other substance use was discussed in clinician notes')
  }

  return unique(details)
}

function buildManualSocialHistorySentences(intake: IntakeData): string[] {
  const notes = intake.manualNotes.trim()
  if (!notes) return []

  const lower = notes.toLowerCase()
  const sentences: string[] = []

  if (hasAnyPattern(lower, RELATIONSHIP_PATTERNS) && !intake.relationshipDescription.trim()) {
    sentences.push('The client reported significant relationship stress.')
  }
  if (hasAnyPattern(lower, EXERCISE_PATTERNS)) {
    sentences.push('The client engages in exercise, such as cycling or weight lifting, as part of a coping routine.')
  }
  if (hasAnyPattern(lower, SPIRITUAL_PATTERNS)) {
    sentences.push('Faith or spiritual involvement was identified as part of the client\'s support system.')
  }
  if (hasAnyPattern(lower, ANGER_MANAGEMENT_PATTERNS)) {
    sentences.push('The client is currently engaged in anger-management work.')
  }

  return unique(sentences)
}

/**
 * When structured intake fields are empty (e.g. DIPS forms with only consent Q&A),
 * extract clinical content from the overview clinical note as a fallback.
 * Filters out logistics (plan, fees, scheduling) and psychoeducation paragraphs.
 */
function extractClinicalFromOverviewNote(
  note: string,
  clientName: string,
  pronouns: PronounForms,
): { introParagraph: string; clinicalParagraphs: string[] } {
  const clean = note
    .replace(/^overview note \d+:\s*/gim, '')
    .replace(/^\d+ min (?:phone )?consultation\s*/gim, '')
    .trim()

  if (!clean) return { introParagraph: '', clinicalParagraphs: [] }

  const paragraphs = clean.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)
  const subject = capitalize(pronouns.subject)
  // Clean the name: take just "First Last", strip any parenthetical or whitespace junk
  const cleanName = clientName.replace(/\s*\(.*?\)/g, '').replace(/\s+/g, ' ').trim()

  // Sentence-level skip patterns for logistics, psychoeducation, plan
  const skipSentence = (s: string): boolean => {
    const t = s.trim()
    return /^plan\b/i.test(t) ||
      /sliding scale/i.test(t) ||
      /per session/i.test(t) ||
      /paneled with/i.test(t) ||
      /will look into/i.test(t) ||
      /^psychoeducation was provided/i.test(t) ||
      /^discussed introduction of/i.test(t) ||
      /agreement for/i.test(t) ||
      /until clinician/i.test(t) ||
      /shared agreement/i.test(t)
  }

  // Filter sentences within each paragraph, then reassemble
  const filterParagraph = (p: string): string => {
    const sentences = p.split(/(?<=\.)\s+/)
    return sentences.filter((s) => !skipSentence(s)).join(' ').trim()
  }

  // First paragraph is usually demographics — replace "Client" with clean name
  const introRaw = paragraphs[0] ? filterParagraph(paragraphs[0]) : ''
  const introParagraph = introRaw
    .replace(/\bClient's\b/g, `${cleanName}'s`)
    .replace(/\bClient\b/g, cleanName)

  // Remaining paragraphs: filter sentences, replace "Client" with pronoun
  const clinicalParagraphs = paragraphs.slice(1)
    .map(filterParagraph)
    .filter(Boolean)
    .map((p) => p
      .replace(/\bClient's\b/g, capitalize(pronouns.possessive))
      .replace(/\bClient\b/g, subject)
    )

  return { introParagraph, clinicalParagraphs }
}

function buildChiefComplaintNarrative(intake: IntakeData): string {
  const rawName = intake.fullName || [intake.firstName, intake.lastName].filter(Boolean).join(' ') || intake.firstName || 'Patient'
  const name = rawName.replace(/\s*\(.*?\)/g, '').replace(/\s+/g, ' ').trim()
  const age = calculateAge(intake.dob) || getManualAgeLabel(intake.manualNotes)
  const identity = buildIdentityDescriptor(intake)
  const pronouns = inferPronounForms(intake)
  const livingArrangement = normalizeLivingArrangement(intake.livingArrangement, pronouns)
  const occupation = normalizeOccupation(intake.occupation)
  const education = normalizeEducationForNarrative(intake.education)
  const subject = capitalize(pronouns.subject)

  const introBits: string[] = []
  const ageIdentity = age && identity ? `${age} ${identity}` : [age, identity].filter(Boolean).join(' ')
  if (ageIdentity) {
    introBits.push(`${name} is a ${ageIdentity}`)
  } else {
    introBits.push(name)
  }
  // Weave education, living arrangement, and occupation into the intro clause
  const whoClause: string[] = []
  if (education) whoClause.push(education)
  if (livingArrangement) whoClause.push(`lives ${livingArrangement}`)
  if (occupation) whoClause.push(`works as ${occupation.replace(/\s+for\s+(\d+\s+years?)$/i, '')}`)
  if (whoClause.length === 1) {
    introBits.push(`who ${whoClause[0]}`)
  } else if (whoClause.length === 2) {
    introBits.push(`who ${whoClause[0]} and ${whoClause[1]}`)
  } else if (whoClause.length >= 3) {
    introBits.push(`who ${whoClause.slice(0, -1).join(', ')}, and ${whoClause[whoClause.length - 1]}`)
  }

  let intro = introBits.join(' ')
  intro += '.'

  const sentences = [intro]
  if (intake.chiefComplaint) {
    sentences.push(...buildChiefComplaintSentences(intake.chiefComplaint, subject, pronouns))
  }
  sentences.push(...buildManualChiefComplaintSentences(intake))
  if (intake.counselingGoals) {
    const goal = smoothClinicalPhrase(intake.counselingGoals.replace(/^to\s+/i, '').trim(), pronouns)
    if (goal) {
      sentences.push(`${subject} stated that ${pronouns.subject} wants to ${lowerCaseFirst(goal).replace(/[.]+$/, '')}.`)
    }
  }

  // Fallback: if structured fields produced only the intro, use overview clinical note
  if (sentences.length === 1 && intake.overviewClinicalNote?.trim()) {
    const { introParagraph, clinicalParagraphs } = extractClinicalFromOverviewNote(
      intake.overviewClinicalNote, name, pronouns
    )
    // Replace the thin intro with the richer overview note intro (has occupation, identity, etc.)
    if (introParagraph) sentences[0] = introParagraph
    if (clinicalParagraphs.length) sentences.push(...clinicalParagraphs)
  }

  return sentences.join(' ')
}

function buildHistoryOfPresentIllnessText(intake: IntakeData): string {
  const pronouns = inferPronounForms(intake)
  const hpi = intake.historyOfPresentIllness.trim()
  const hpiLower = hpi.toLowerCase()

  // When HPI is AI-enriched (long, multi-sentence), skip other sources whose
  // content is already covered — prevents near-duplicate paragraphs
  const isRedundant = (value: string): boolean => {
    if (!hpi || hpi.length < 200) return false
    const words = value.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter((w) => w.length > 4)
    if (words.length < 3) return false
    const matchCount = words.filter((w) => hpiLower.includes(w)).length
    return matchCount / words.length > 0.6
  }

  const candidateSources = [
    intake.presentingProblems.trim(),
    intake.chiefComplaint.trim(),
    intake.counselingGoals ? `Goal: ${intake.counselingGoals}`.trim() : '',
  ].filter((value) => Boolean(value) && !isRedundant(value))

  const sources = [hpi, ...candidateSources].filter(Boolean)

  const subject = capitalize(pronouns.subject)
  const sentences = unique(
    sources.map((value) => {
      if (/^goal:\s*/i.test(value)) {
        const goalText = smoothClinicalPhrase(value.replace(/^goal:\s*/i, '').replace(/^to\s+/i, '').trim(), pronouns)
        return goalText
          ? `${subject} stated that ${pronouns.subject} wants to ${lowerCaseFirst(goalText).replace(/[.]+$/, '')}.`
          : ''
      }

      if (/^i want to\b/i.test(value)) {
        const normalized = smoothClinicalPhrase(value.replace(/^i want to\b/i, '').trim(), pronouns)
        return `${subject} reported wanting to ${normalized.replace(/[.]+$/, '')}.`
      }

      // If already in third-person clinical prose (from AI note), replace "Client" with pronoun
      if (/\bClient\b/.test(value)) {
        return value
          .replace(/\bClient's\b/g, capitalize(pronouns.possessive))
          .replace(/\bClient\b/g, subject)
      }

      return toReportedSpeech(value, pronouns)
    }).filter(Boolean)
  )

  const hasStructuredSources = sources.length > 0

  const result = unique([...sentences, ...buildManualHPISentences(intake)])

  // Fallback: if no structured intake fields matched, use overview clinical note
  console.log('[SPN] HPI fallback check:', { hasStructuredSources, overviewNoteLength: intake.overviewClinicalNote?.length ?? 0, resultSoFar: result.length })
  if (!hasStructuredSources && intake.overviewClinicalNote?.trim()) {
    const name = intake.fullName || [intake.firstName, intake.lastName].filter(Boolean).join(' ') || 'Patient'
    const { clinicalParagraphs } = extractClinicalFromOverviewNote(
      intake.overviewClinicalNote, name, pronouns
    )
    if (clinicalParagraphs.length) result.push(...clinicalParagraphs)
  }

  return result.join(' ')
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

  return Array.from(new Set([...parts, ...buildManualSubstanceDetails(intake.manualNotes)])).join('; ')
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
  const substanceDetails = buildSubstanceDetails(intake)
  const hasSubstanceUse = intake.alcoholUse || intake.drugUse || intake.substanceUseHistory || substanceDetails
  if (hasSubstanceUse) {
    const isUsing = /yes|current|daily|weekly|monthly|regular|social|occasional/i.test(
      `${intake.alcoholUse} ${intake.drugUse} ${intake.substanceUseHistory} ${substanceDetails}`
    )
      || hasAnyPattern(`${substanceDetails}`.toLowerCase(), SUBSTANCE_PATTERNS)
    if (selectRadio('single-select-35', isUsing ? '1' : '2')) filled++

    // Substance specifics (checkboxes 36)
    if (isUsing) {
      filled += fillSubstanceCheckboxes(intake)
      filled += fillLabeledField('If yes, please specify', substanceDetails)
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
  const symptoms = buildIntakeAnswerCorpus(intake)
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
  const symptoms = buildIntakeAnswerCorpus(intake)
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
  if (!intake.physicalSexualAbuseHistory && hasAnyPattern(corpus, ABUSE_PATTERNS)) {
    if (/roofied|drugged|touched|sexual assault|sexual/i.test(corpus)) {
      if (checkCheckboxByLabel('multi-select-20', 'Sexual')) filled++
    }
    if (/slap|push|physical|violence/i.test(corpus)) {
      if (checkCheckboxByLabel('multi-select-20', 'Physical')) filled++
    }
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
  if ((intake.substanceUseHistory && !/no|denied|denies|none/i.test(intake.substanceUseHistory)) ||
      hasAnyPattern(corpus, SUBSTANCE_PATTERNS)) {
    if (checkCheckboxByLabel('multi-select-21', 'History of substance abuse')) filled++
  }
  if ((intake.physicalSexualAbuseHistory && !/no|denied|denies|none/i.test(intake.physicalSexualAbuseHistory)) ||
      hasAnyPattern(corpus, ABUSE_PATTERNS)) {
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
  const substance = `${intake.alcoholUse} ${intake.drugUse} ${intake.substanceUseHistory} ${buildSubstanceDetails(intake)}`.toLowerCase()
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
  const sentences: string[] = []
  const pronouns = inferPronounForms(intake)
  const livingArrangement = normalizeLivingArrangement(intake.livingArrangement, pronouns)
  const occupation = normalizeOccupation(intake.occupation)
  const education = normalizeEducationForNarrative(intake.education)

  if (occupation) {
    sentences.push(`Client works as ${occupation.replace(/[.]+$/, '')}.`)
  }
  if (education) {
    sentences.push(`Client ${education}.`)
  }
  if (livingArrangement) {
    sentences.push(`Client lives ${livingArrangement}.`)
  }
  if (intake.relationshipDescription) {
    sentences.push(`Relationship history includes ${lowerCaseFirst(smoothClinicalPhrase(intake.relationshipDescription.replace(/[.]+$/, ''), pronouns))}.`)
  }
  if (intake.additionalInfo) {
    sentences.push(ensureSentence(smoothClinicalPhrase(intake.additionalInfo, pronouns)))
  }

  sentences.push(...buildManualSocialHistorySentences(intake))

  return unique(sentences).join(' ')
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

// ── Assessment Section (106-111) ──

function ensureSentence(value: string): string {
  const trimmed = normalizeWhitespace(value)
  if (!trimmed) return ''
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`
}

function cleanDiagnosticReasoning(value: string): string {
  return normalizeWhitespace(
    value.replace(/\s*Most direct supporting sentence:\s.+$/i, '').trim()
  )
}

function formatDiagnosisLabel(impression: DiagnosticImpression): string {
  return impression.code ? `${impression.name} (${impression.code})` : impression.name
}

function buildPresentingConcernPhrases(intake: IntakeData): string[] {
  const corpus = buildIntakeAnswerCorpus(intake)
  const phrases: string[] = []

  if ((intake.gad7?.totalScore ?? 0) >= 10 || hasAnyPattern(corpus, ANXIETY_PATTERNS)) {
    phrases.push('anxiety and worry')
  }
  if ((intake.phq9?.totalScore ?? 0) >= 10 || hasAnyPattern(corpus, DEPRESSION_PATTERNS)) {
    phrases.push('low mood or depressive symptoms')
  }
  if (hasAnyPattern(corpus, ANGER_PATTERNS)) {
    phrases.push('anger and emotional reactivity')
  }
  if (hasAnyPattern(corpus, RELATIONSHIP_PATTERNS)) {
    phrases.push('relationship stress')
  }
  if (hasAnyPattern(corpus, TRAUMA_PATTERNS)) {
    phrases.push('trauma-related distress')
  }
  if (hasAnyPattern(corpus, SUBSTANCE_PATTERNS)) {
    phrases.push('substance use concerns')
  }
  if (hasAnyPattern(corpus, SLEEP_PATTERNS)) {
    phrases.push('sleep disturbance')
  }
  if (hasAnyPattern(corpus, CONCENTRATION_PATTERNS)) {
    phrases.push('difficulty concentrating')
  }

  return unique(phrases).slice(0, 5)
}

function buildRelevantHistoryPhrases(intake: IntakeData): string[] {
  const phrases: string[] = []

  if (intake.priorTreatment.trim() && !/^(no|none|denied|denies)$/i.test(intake.priorTreatment.trim())) {
    phrases.push(`prior treatment history (${intake.priorTreatment.trim()})`)
  }
  if (intake.medications.trim() && !/^(no|none|denied|denies)$/i.test(intake.medications.trim())) {
    phrases.push(`medication history (${intake.medications.trim()})`)
  }
  if (intake.medicalHistory.trim() && !/^(no|none|denied|denies)$/i.test(intake.medicalHistory.trim())) {
    phrases.push(`medical history (${intake.medicalHistory.trim()})`)
  }
  if (intake.surgeries.trim()) {
    phrases.push(`reported surgeries (${intake.surgeries.trim()})`)
  }
  if (
    (intake.physicalSexualAbuseHistory.trim() && !/^(no|none|denied|denies)$/i.test(intake.physicalSexualAbuseHistory.trim())) ||
    (intake.domesticViolenceHistory.trim() && !/^(no|none|denied|denies)$/i.test(intake.domesticViolenceHistory.trim()))
  ) {
    phrases.push('trauma or abuse history')
  }
  if (
    (intake.familyPsychiatricHistory.trim() && !/^(no|none|denied|denies)$/i.test(intake.familyPsychiatricHistory.trim())) ||
    (intake.familyMentalEmotionalHistory.trim() && !/^(no|none|denied|denies)$/i.test(intake.familyMentalEmotionalHistory.trim()))
  ) {
    phrases.push('family mental health history')
  }

  return unique(phrases).slice(0, 4)
}

function buildMaintainingFactorPhrases(intake: IntakeData): string[] {
  const corpus = buildIntakeAnswerCorpus(intake)
  const factors: string[] = []

  if (hasAnyPattern(corpus, RELATIONSHIP_PATTERNS)) {
    factors.push('ongoing relationship stress')
  }
  if (hasAnyPattern(corpus, ANGER_PATTERNS)) {
    factors.push('difficulty managing strong emotions during conflict')
  }
  if (hasAnyPattern(corpus, SUBSTANCE_PATTERNS)) {
    factors.push('substance use as a coping pattern')
  }
  if (hasAnyPattern(corpus, SLEEP_PATTERNS)) {
    factors.push('sleep disruption')
  }
  if (hasAnyPattern(corpus, TRAUMA_PATTERNS)) {
    factors.push('distress related to reminders of unsafe events')
  }

  return unique(factors).slice(0, 4)
}

function buildProtectiveFactorPhrases(intake: IntakeData): string[] {
  const corpus = intake.manualNotes.toLowerCase()
  const factors: string[] = []

  if (intake.counselingGoals.trim()) {
    factors.push('stated motivation for treatment')
  }
  if (intake.livingArrangement.trim() && !/alone/i.test(intake.livingArrangement)) {
    factors.push('some social support in the home')
  }
  if (intake.occupation.trim() && !/unemployed|not working/i.test(intake.occupation)) {
    factors.push('current employment')
  }
  if (hasAnyPattern(corpus, EXERCISE_PATTERNS)) {
    factors.push('exercise as a coping skill')
  }
  if (hasAnyPattern(corpus, SPIRITUAL_PATTERNS)) {
    factors.push('faith or spiritual support')
  }

  return unique(factors).slice(0, 4)
}

function buildIceFormulationText(
  intake: IntakeData,
  note: ProgressNote,
  guidance: Awaited<ReturnType<typeof buildClinicalGuidance>>,
  impressions: DiagnosticImpression[]
): string {
  const concerns = buildPresentingConcernPhrases(intake)
  const history = buildRelevantHistoryPhrases(intake)
  const maintaining = buildMaintainingFactorPhrases(intake)
  const strengths = buildProtectiveFactorPhrases(intake)
  const diagnosisLabels = (impressions.length ? impressions : note.diagnosticImpressions)
    .map(formatDiagnosisLabel)
    .slice(0, 3)
  const modalities = unique(guidance.modalities.map((item) => item.toLowerCase())).slice(0, 4)

  const parts: string[] = []

  if (concerns.length) {
    parts.push(`Client presents with ${joinList(concerns)}.`)
  }
  if (diagnosisLabels.length) {
    parts.push(`Current presentation is consistent with ${joinList(diagnosisLabels)}.`)
  }
  if (history.length) {
    parts.push(`Relevant history includes ${joinList(history)}.`)
  }
  if (maintaining.length) {
    parts.push(`Current problems appear to be maintained by ${joinList(maintaining)}.`)
  }
  if (strengths.length) {
    parts.push(`Protective factors include ${joinList(strengths)}.`)
  }
  if (modalities.length) {
    parts.push(`Initial treatment can focus on ${joinList(modalities)}.`)
  }

  return parts.join(' ') || guidance.formulation || note.clinicalFormulation
}

function extractStructuredItems(text: string): string[] {
  return unique(
    text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((line) => !/^[A-Za-z ]+:$/.test(line))
      .filter((line) => !/^\d+\.\s+[A-Z]/.test(line))
      .map((line) => line.replace(/^[•\-]\s*/, '').replace(/^\d+\.\s*/, '').trim())
      .filter(Boolean)
  )
}

function parseFrequencySections(text: string): Record<string, string[]> {
  const sections: Record<string, string[]> = {
    frequency: [],
    monitoring: [],
    reassessment: [],
    referral: [],
    safety: [],
  }

  let current: keyof typeof sections = 'frequency'

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim()
    if (!line) continue

    const headingMatch = line.match(/^(Frequency|Monitoring|Reassessment|Referral|Safety):\s*(.*)$/i)
    if (headingMatch) {
      current = headingMatch[1].toLowerCase() as keyof typeof sections
      const remainder = headingMatch[2].trim()
      if (remainder) sections[current].push(remainder)
      continue
    }

    sections[current].push(line.replace(/^[•\-]\s*/, '').trim())
  }

  return sections
}

function formatImpressionsList(impressions: DiagnosticImpression[]): string {
  if (!impressions.length) return ''
  return impressions
    .map((imp, i) => {
      const lines: string[] = [`${i + 1}. ${ensureSentence(formatDiagnosisLabel(imp))}`]
      const reasoning = cleanDiagnosticReasoning(imp.diagnosticReasoning)
      if (reasoning) {
        lines.push(ensureSentence(reasoning))
      }
      if (imp.criteriaEvidence.length) {
        lines.push(`Supporting evidence includes ${joinList(imp.criteriaEvidence.slice(0, 4))}.`)
      }
      if (imp.ruleOuts.length) {
        lines.push(`Rule-outs to monitor include ${joinList(imp.ruleOuts.slice(0, 3))}.`)
      }
      return lines.join(' ')
    })
    .join('\n\n')
}

function formatStrengthsWeaknesses(intake: IntakeData): string {
  const pronouns = inferPronounForms(intake)
  const strengths: string[] = []
  const weaknesses: string[] = []

  // Protective / strength factors
  if (intake.counselingGoals.trim()) {
    const goal = smoothClinicalPhrase(intake.counselingGoals.trim(), pronouns).replace(/[.]+$/, '')
    strengths.push(`treatment motivation (${lowerCaseFirst(goal)})`)
  }
  if (intake.priorTreatment.trim() && !/none|no|denied|denies/i.test(intake.priorTreatment))
    strengths.push(`prior treatment engagement`)
  if (intake.livingArrangement.trim() && !/alone/i.test(intake.livingArrangement)) {
    const arrangement = normalizeLivingArrangement(intake.livingArrangement, pronouns)
    strengths.push(`social support (lives ${arrangement})`)
  }
  if (intake.primaryCarePhysician.trim())
    strengths.push(`established medical care`)
  if (intake.occupation.trim() && !/unemployed|not working/i.test(intake.occupation))
    strengths.push(`current employment`)

  // Risk / weakness factors
  if (intake.suicidalIdeation.trim() && !/no|denied|denies|none/i.test(intake.suicidalIdeation))
    weaknesses.push('reported suicidal ideation')
  if (intake.suicideAttemptHistory.trim() && !/no|denied|denies|none/i.test(intake.suicideAttemptHistory))
    weaknesses.push('history of suicide attempt(s)')
  if (intake.homicidalIdeation.trim() && !/no|denied|denies|none/i.test(intake.homicidalIdeation))
    weaknesses.push('reported homicidal ideation')
  if (intake.psychiatricHospitalization.trim() && !/no|denied|denies|none/i.test(intake.psychiatricHospitalization))
    weaknesses.push('history of psychiatric hospitalization')
  if (intake.physicalSexualAbuseHistory.trim() && !/no|denied|denies|none/i.test(intake.physicalSexualAbuseHistory))
    weaknesses.push('reported abuse history')
  if (intake.domesticViolenceHistory.trim() && !/no|denied|denies|none/i.test(intake.domesticViolenceHistory))
    weaknesses.push('reported domestic violence history')
  const hasSubstanceConcern = [intake.alcoholUse, intake.drugUse, intake.substanceUseHistory]
    .some(v => v.trim() && !/no|denied|denies|none/i.test(v))
  if (hasSubstanceConcern) weaknesses.push('substance use concerns')

  const parts: string[] = []
  if (strengths.length) parts.push(`Strengths and protective factors include ${joinList(strengths)}.`)
  if (weaknesses.length) parts.push(`Clinical vulnerabilities include ${joinList(weaknesses)}.`)

  return parts.join(' ')
}

function formatTreatmentRecommendations(
  interventions: string,
  modalities: string[]
): string {
  const parts: string[] = []
  if (modalities.length) {
    parts.push(`Recommended treatment modalities include ${joinList(modalities.map((item) => item.toLowerCase()))}.`)
  }
  const items = extractStructuredItems(interventions).slice(0, 6)
  if (items.length) {
    parts.push(`Initial treatment focus should include ${joinList(items)}.`)
  }
  return parts.join(' ')
}

function formatFollowUp(frequency: string, plan: string): string {
  const parts: string[] = []
  const sections = parseFrequencySections(frequency)

  if (sections.frequency.length) {
    parts.push(ensureSentence(sections.frequency[0]))
  }
  if (sections.monitoring.length) {
    parts.push(`Monitoring will include ${joinList(sections.monitoring)}.`)
  }
  if (sections.reassessment.length) {
    parts.push(`Reassessment will include ${joinList(sections.reassessment)}.`)
  }
  if (sections.referral.length) {
    parts.push(`Referral plan: ${joinList(sections.referral)}.`)
  }
  if (sections.safety.length) {
    parts.push(`Safety plan: ${joinList(sections.safety)}.`)
  }
  if (plan) {
    parts.push(ensureSentence(plan))
  }

  return parts.join(' ')
}

async function fillAssessmentSection(intake: IntakeData): Promise<number> {
  let filled = 0

  // Load workspace for finalized impressions
  const workspace = await getDiagnosticWorkspace()
  const impressions = workspace?.finalizedImpressions ?? []

  // Load existing note or build one for formulation/guidance data
  let note = await getNote()
  if (!note) {
    const prefs = await getPreferences()
    note = await buildDraftNote(intake, prefs, impressions)
  }

  // Build clinical guidance when extension assets are available. If they fail to
  // load in the content-script context, fall back to the saved draft note so the
  // ICE assessment fields can still be populated.
  let guidance = {
    modalities: [] as string[],
    formulation: '',
    goals: '',
    interventions: '',
    frequency: '',
    referrals: '',
    plan: '',
    references: [] as Array<{
      resourceId: string
      resourceTitle: string
      pageStart: number
      heading: string
      preview: string
      score: number
    }>,
    queries: [] as string[],
  }

  try {
    guidance = await buildClinicalGuidance(intake, impressions)
  } catch (err) {
    console.warn('[SPN] Clinical guidance unavailable during ICE fill; using draft-note fallback only:', err)
  }

  // 106: Formulation — always prefer guidance.formulation (mechanism-based)
  // over note.clinicalFormulation (which may just list factors without explaining how
  // the diagnosis formed)
  const formulation = buildIceFormulationText(intake, note, guidance, impressions)
  if (formulation && fillProseMirrorByLabel('free-text-106', formulation)) filled++

  // 107: Diagnosis and impression — evidence-based, not just a name list
  const diagSource = impressions.length ? impressions : note.diagnosticImpressions
  const diagText = formatImpressionsList(diagSource)
  if (diagText && fillProseMirrorByLabel('free-text-107', diagText)) filled++

  // 108: Patient's strengths/weaknesses
  const strengthsText = formatStrengthsWeaknesses(intake)
  if (strengthsText && fillProseMirrorByLabel('free-text-108', strengthsText)) filled++

  // 109: Treatment recommendations
  const interventionsText = guidance.interventions || note.treatmentPlan.interventions.map(i => `• ${i}`).join('\n')
  const txRecsText = formatTreatmentRecommendations(
    interventionsText,
    guidance.modalities
  )
  if (txRecsText && fillProseMirrorByLabel('free-text-109', txRecsText)) filled++

  // 111: Follow up
  const followUpText = formatFollowUp(
    guidance.frequency || note.treatmentPlan.frequency,
    guidance.plan || note.plan
  )
  if (followUpText && fillProseMirrorByLabel('free-text-111', followUpText)) filled++

  return filled
}

// ── SimplePractice AI SOAP Note Enrichment ──

function enrichIntakeFromSoapCopyArea(intake: IntakeData): void {
  const aiContent = document.querySelector('.ai-note-content')
  if (!aiContent) return

  // Parse all sections by their h3.section-title headers
  const sections = new Map<string, string>()
  const headers = aiContent.querySelectorAll('h3.section-title')
  for (const h3 of headers) {
    const title = h3.textContent?.trim().toLowerCase() ?? ''
    const copyArea = h3.nextElementSibling
    if (copyArea?.classList.contains('copy-area')) {
      sections.set(title, copyArea.textContent?.replace(/\s*Copy\s*$/, '').trim() ?? '')
    }
  }

  if (sections.size === 0) return
  console.log('[SPN] Found SimplePractice AI note sections:', [...sections.keys()])

  const bpsText = sections.get('biopsychosocial assessment') ?? ''
  const subjective = sections.get('subjective') ?? ''
  const objective = sections.get('objective') ?? ''
  const assessment = sections.get('assessment') ?? ''
  const plan = sections.get('plan') ?? ''

  // Store full note
  intake.spSoapNote = [...sections.entries()].map(([k, v]) => `${k}:\n${v}`).join('\n\n')

  // Parse Bio/Psych/Social from biopsychosocial assessment
  const bioMatch = bpsText.match(/Biological:\s*([\s\S]*?)(?=Psychological:|Social:|$)/i)
  const psychMatch = bpsText.match(/Psychological:\s*([\s\S]*?)(?=Biological:|Social:|$)/i)
  const socialMatch = bpsText.match(/Social:\s*([\s\S]*?)(?=Biological:|Psychological:|$)/i)

  const bio = bioMatch?.[1]?.trim() ?? ''
  const psych = psychMatch?.[1]?.trim() ?? ''
  const social = socialMatch?.[1]?.trim() ?? ''

  // Enrich HPI: assessment is the concise synthesis; bio adds medical context
  // Skip psych/subjective — they overlap heavily with assessment and create repetition
  const hpiCandidate = [assessment, bio].filter(Boolean).join(' ')
  let usedAssessmentForHpi = false
  if (hpiCandidate && intake.historyOfPresentIllness.length < hpiCandidate.length) {
    intake.historyOfPresentIllness = hpiCandidate
    usedAssessmentForHpi = true
  }

  // Enrich medical history from biological section
  if (bio && intake.medicalHistory.length < bio.length) {
    intake.medicalHistory = bio
  }

  // Enrich social context
  if (social) {
    if (!intake.livingArrangement.trim() || intake.livingArrangement.length < 10) {
      const livingMatch = social.match(/living\s+(?:with|alone|independently)[\s\S]*?[.]/i)
      if (livingMatch) intake.livingArrangement = livingMatch[0].replace(/[.]+$/, '')
    }
    if (!intake.relationshipDescription.trim()) {
      const relMatch = social.match(/(?:girlfriend|boyfriend|partner|spouse|wife|husband|married|dating|relationship)[\s\S]*?[.]/i)
      if (relMatch) intake.relationshipDescription = relMatch[0]
    }
  }

  // Enrich assessment/presenting problems from the Assessment section
  // Skip if assessment was already used for HPI — avoids duplication in buildHistoryOfPresentIllnessText
  if (assessment && !usedAssessmentForHpi && intake.presentingProblems.length < assessment.length) {
    intake.presentingProblems = assessment
  }

  // Extract MSE from objective section if present
  const mseMatch = objective.match(/Mental Status Exam:\s*([\s\S]*?)$/i)
  if (mseMatch) {
    intake.additionalInfo = [intake.additionalInfo, mseMatch[1].trim()].filter(Boolean).join('\n\n')
  }
}

// ── Main Fill Logic ──

async function fillInitialClinicalEval(): Promise<void> {
  assertExtensionContext()

  const intake = await getIntake()
  if (!intake) {
    showToast('No intake data captured. Go to the client\'s intake form and click "Capture Intake" first.', 'error')
    return
  }

  // Auto-click Note Taker if AI content isn't already visible
  if (!document.querySelector('.ai-note-content')) {
    const noteTakerBtn = document.querySelector<HTMLButtonElement>('button.note-taker')
    if (noteTakerBtn) {
      noteTakerBtn.click()
      // Wait for SP to render the AI note content
      const deadline = Date.now() + 5000
      while (!document.querySelector('.ai-note-content') && Date.now() < deadline) {
        await wait(300)
      }
    }
  }

  // Extract SimplePractice AI SOAP note if present on the page
  enrichIntakeFromSoapCopyArea(intake)

  // Wait for ProseMirror editors to initialize (Ember.js rendering)
  await wait(500)

  let filled = fillICEFromIntake(intake)
  await flushBooleanSyncOperations()
  await wait(200)

  // Fill assessment section (106-111) from note draft + guidance + workspace
  try {
    filled += await fillAssessmentSection(intake)
  } catch (err) {
    console.warn('[SPN] Assessment section fill failed:', err)
  }

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
  if (!isNotePage()) {
    document.getElementById('spn-fill-btn')?.remove()
    return
  }
  if (detectSoapForm()) {
    document.getElementById('spn-fill-btn')?.remove()
    return
  }
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

async function handleFillSoapClick(): Promise<void> {
  try {
    const result = await fillSavedSoapDraft()
    if (!result.ok) {
      showToast(result.error ?? 'Failed to fill SOAP note.', 'error')
      return
    }

    showToast(`Filled ${result.filled ?? 0} SOAP fields from saved session notes`, 'success')
  } catch (err) {
    if (isExtensionContextInvalidatedError(err)) {
      showToast('Extension reloaded — please refresh this page.', 'error')
    } else {
      console.error('[SPN] Fill SOAP error:', err)
      showToast('Failed to fill SOAP note.', 'error')
    }
  }
}

function injectFillSoapButton(): void {
  if (!isAppointmentPage()) {
    document.getElementById('spn-fill-soap-btn')?.remove()
    return
  }
  if (!detectSoapForm()) {
    document.getElementById('spn-fill-soap-btn')?.remove()
    return
  }
  if (document.getElementById('spn-fill-soap-btn')) return

  injectButton('Fill SOAP from Notes', handleFillSoapClick, {
    id: 'spn-fill-soap-btn',
    position: 'bottom-left-high',
  })
}

// Watch for SPA navigation
let lastUrl = window.location.href
const observer = new MutationObserver(() => {
  if (window.location.href !== lastUrl) {
    const newUrl = window.location.href
    checkSessionEndOnUrlChange(newUrl)
    lastUrl = newUrl
    setTimeout(injectFillButton, 500)
    setTimeout(injectFillSoapButton, 500)
    setTimeout(injectVideoNotePanel, 500)
    setTimeout(startCaptionObserver, 1000)
    setTimeout(startSessionEndDetection, 1000)
    setTimeout(startIncrementalGeneration, 2000)
  }
})

observer.observe(document.body, { childList: true, subtree: true })

// Initial injection
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(injectFillButton, 500)
    setTimeout(injectFillSoapButton, 500)
    setTimeout(injectVideoNotePanel, 500)
    setTimeout(startCaptionObserver, 1000)
    setTimeout(startSessionEndDetection, 1000)
    setTimeout(startIncrementalGeneration, 2000)
  })
} else {
  setTimeout(injectFillButton, 500)
  setTimeout(injectFillSoapButton, 500)
  setTimeout(injectVideoNotePanel, 500)
  setTimeout(startCaptionObserver, 1000)
  setTimeout(startSessionEndDetection, 1000)
}

registerFloatingButtonsController(() => {
  setTimeout(injectFillButton, 0)
  setTimeout(injectFillSoapButton, 0)
})

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'session') return
  if (changes['spn_soap_draft']) {
    setTimeout(injectFillSoapButton, 0)
  }
})

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === 'SPN_FILL_SOAP_DRAFT') {
    void (async () => {
      const result = await fillSavedSoapDraft((msg.draft as SoapDraft | undefined) ?? null)
      if (result.ok) {
        showToast(`Filled ${result.filled ?? 0} SOAP fields from saved session notes`, 'success')
      }
      sendResponse(result)
    })()
    return true
  }
})
