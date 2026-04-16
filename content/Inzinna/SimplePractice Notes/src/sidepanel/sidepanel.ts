import { DSM5_DISORDER_MAP, DSM5_DISORDERS } from '../data/dsm5-criteria'
import { DSM5_DIAGNOSES_V2 } from '../data/dsm5-criteria-v2'
import {
  buildDiagnosticImpressions,
  findSuggestion,
  getAvailableDiagnosisOptions,
  getDiagnosticSuggestions,
  getDisorderNotes,
  getEffectiveCriterionStatus,
  getOverride,
} from '../lib/diagnostic-engine'
import { buildClinicalGuidance, ClinicalGuidance } from '../lib/clinical-guidance'
import { getLLMDiagnosticSuggestions, type LLMDiagnosticSuggestion } from '../lib/diagnostic-llm'
import { generateSupervisionPrep } from '../lib/supervision-generator'
import { buildDraftNote } from '../lib/note-draft'
import { generateSoapDraft } from '../lib/soap-generator'
import {
  clearAll,
  getDiagnosticWorkspace,
  getIntake,
  getMseChecklist,
  getNote,
  getPreferences,
  getSessionNotes,
  getSoapDraft,
  getSupervisionPrep,
  getTranscript,
  getTreatmentPlan,
  saveDiagnosticWorkspace,
  saveNote,
  saveSoapDraft,
  saveSupervisionPrep,
} from '../lib/storage'
import {
  CriterionEvaluation,
  CriterionMatchStatus,
  DiagnosticWorkspaceState,
  DSM5DisorderDefinition,
  EMPTY_DIAGNOSTIC_WORKSPACE,
  IntakeData,
  ProgressNote,
  SoapDraft,
  TranscriptEntry,
  TreatmentPlanData,
} from '../lib/types'

function formatDate(iso: string): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

let activePanel: 'soap' | 'diagnostics' | 'treatment-plan' | 'transcript' | 'supervision' = 'diagnostics'

// LLM suggestions are ephemeral per panel session — regenerate on demand.
let llmSuggestions: LLMDiagnosticSuggestion[] | null = null
let llmStatus = ''
let llmGenerating = false

async function getActiveTab(): Promise<chrome.tabs.Tab | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  return tab ?? null
}

async function getActiveTabId(): Promise<number | null> {
  const tab = await getActiveTab()
  return tab?.id ?? null
}

function sendTabMessage<T>(tabId: number, message: object): Promise<T | null> {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        resolve(null)
        return
      }
      resolve((response as T | undefined) ?? null)
    })
  })
}

async function detectApptContext(): Promise<{ isAppt: boolean; apptId: string }> {
  const tab = await getActiveTab()
  if (!tab?.url) return { isAppt: false, apptId: '' }

  try {
    const url = new URL(tab.url)
    const videoMatch = url.pathname.match(/\/appt-([a-f0-9]+)\/room/)
    if (videoMatch) return { isAppt: true, apptId: videoMatch[1] }
    const apptMatch = url.pathname.match(/\/appointments\/(\d+)/)
    if (apptMatch) return { isAppt: true, apptId: apptMatch[1] }
  } catch {
    // Ignore malformed tab URLs.
  }

  return { isAppt: false, apptId: '' }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function deduplicateTranscript(entries: TranscriptEntry[]): TranscriptEntry[] {
  if (entries.length === 0) return []
  const norm = (t: string) => t.toLowerCase().replace(/[.,!?;:]+$/, '').trim()
  const result: TranscriptEntry[] = []
  let cur = entries[0]
  for (let i = 1; i < entries.length; i++) {
    const e = entries[i]
    if (e.speaker === cur.speaker && norm(e.text).startsWith(norm(cur.text))) {
      cur = e
    } else {
      result.push(cur)
      cur = e
    }
  }
  result.push(cur)
  return result
}

function renderTranscriptEntries(entries: TranscriptEntry[]): string {
  if (!entries.length) return '<div class="empty-copy">No captions captured yet.</div>'
  return entries
    .map((e) => {
      const label =
        e.speaker === 'clinician' ? 'Clinician' : e.speaker === 'client' ? 'Client' : 'Unknown'
      const time = e.timestamp ? formatDate(e.timestamp) : ''
      return `<div class="transcript-entry ${e.speaker}">
      <span class="transcript-speaker">${label}</span>${time ? `<span class="transcript-time">${escapeHtml(time)}</span>` : ''}
      <div class="transcript-text">${escapeHtml(e.text)}</div>
    </div>`
    })
    .join('')
}

function formatTranscriptForClipboard(entries: TranscriptEntry[]): string {
  return entries
    .map((e) => {
      const speaker =
        e.speaker === 'clinician' ? 'Clinician' : e.speaker === 'client' ? 'Client' : 'Unknown'
      const time = e.timestamp ? ` [${formatDate(e.timestamp)}]` : ''
      return `${speaker}${time}: ${e.text}`
    })
    .join('\n\n')
}

function firstNonEmpty(...values: Array<string | null | undefined>): string {
  for (const value of values) {
    const trimmed = value?.trim()
    if (trimmed) return trimmed
  }
  return ''
}

function buildTreatmentPlanReference(plan: TreatmentPlanData | null): string {
  if (!plan) {
    return 'No treatment plan captured yet. Open the client treatment plan page and click "Capture Treatment Plan" first.'
  }

  const sections: string[] = []

  if (plan.diagnoses.length) {
    sections.push(`Dx: ${plan.diagnoses.map((entry) => `${entry.description}${entry.code ? ` (${entry.code})` : ''}`).join(', ')}`)
  }
  if (plan.presentingProblem) {
    sections.push(`Presenting problem: ${plan.presentingProblem}`)
  }
  if (plan.goals.length) {
    sections.push(plan.goals.map((goal) => {
      const objectives = goal.objectives.length
        ? `\n${goal.objectives.map((objective) => `  - ${objective.id}: ${objective.objective}`).join('\n')}`
        : ''
      return `Goal ${goal.goalNumber}: ${goal.goal}${objectives}`
    }).join('\n\n'))
  }
  if (plan.interventions.length) {
    sections.push(`Interventions: ${plan.interventions.join(', ')}`)
  }
  if (plan.treatmentFrequency) {
    sections.push(`Frequency: ${plan.treatmentFrequency}`)
  }

  return sections.join('\n\n')
}

function buildSessionNotesReference(notes: string): string {
  return notes.trim() || 'No session notes saved for this appointment yet.'
}

function buildOverviewNoteReference(note: string): string {
  return note.trim() || 'No overview clinical note captured yet. Open the client overview page and click "Capture Overview Prep".'
}

function setSoapTextareaValue(id: string, value: string): void {
  const el = document.getElementById(id) as HTMLTextAreaElement | null
  if (el) el.value = value
}

function readSoapDraftFromFields(existing: SoapDraft | null): SoapDraft {
  const now = new Date().toISOString()
  return {
    ...(existing ?? {
      apptId: '',
      clientName: '',
      sessionDate: '',
      cptCode: '90837',
      subjective: '',
      objective: '',
      assessment: '',
      plan: '',
      sessionNotes: '',
      transcript: '',
      treatmentPlanId: '',
      generatedAt: now,
      editedAt: now,
      status: 'draft' as const,
    }),
    subjective: (document.getElementById('soap-subjective') as HTMLTextAreaElement | null)?.value.trim() ?? '',
    objective: (document.getElementById('soap-objective') as HTMLTextAreaElement | null)?.value.trim() ?? '',
    assessment: (document.getElementById('soap-assessment') as HTMLTextAreaElement | null)?.value.trim() ?? '',
    plan: (document.getElementById('soap-plan') as HTMLTextAreaElement | null)?.value.trim() ?? '',
    editedAt: now,
    status: 'draft',
  }
}

function setSoapStatus(message: string): void {
  const el = document.getElementById('soap-status')
  if (el) el.textContent = message
}

function clearDiagnosticUi(): void {
  const setHtml = (id: string, html: string): void => {
    const el = document.getElementById(id)
    if (el) el.innerHTML = html
  }

  const setText = (id: string, text: string): void => {
    const el = document.getElementById(id)
    if (el) el.textContent = text
  }

  setHtml('score-grid', '<div class="empty-copy">No intake captured yet.</div>')
  setText('overview-note-reference', buildOverviewNoteReference(''))
  setHtml('pinned-tabs', '<div class="empty-copy">Capture intake first to review diagnoses.</div>')
  setHtml('suggestion-list', '<div class="empty-copy">Capture intake first to see diagnostic suggestions.</div>')
  setHtml('active-review', '<div class="empty-copy">Capture intake first to review diagnostic criteria.</div>')
  setHtml('generated-summary', '<div class="empty-copy">No diagnostic summary generated yet.</div>')
  setText('summary-status', 'Capture intake first to generate a diagnostic summary.')
  setHtml('knowledge-guidance', '<div class="empty-copy">No formulation or treatment-plan support generated yet.</div>')
  setText('guidance-status', 'Capture intake first to generate formulation and treatment guidance.')

  const searchInput = document.getElementById('diagnosis-search') as HTMLInputElement | null
  if (searchInput) {
    searchInput.value = ''
    searchInput.disabled = true
    searchInput.placeholder = 'Capture intake first.'
  }

  // Clear supervision
  setText('supervision-case-summary', '')
  setHtml('supervision-discussion-questions', '')
  setHtml('supervision-blind-spot-flags', '')
  setHtml('supervision-modality-prompts', '')
  setText('supervision-status', 'Click "Generate Supervision Prep" to create a supervision agenda from current session data.')
}

function switchPanel(panel: 'soap' | 'diagnostics' | 'treatment-plan' | 'transcript' | 'supervision'): void {
  activePanel = panel

  const panels = ['soap', 'diagnostics', 'treatment-plan', 'transcript', 'supervision']
  for (const p of panels) {
    const panelEl = document.getElementById(`${p}-panel`)
    const tabEl = document.getElementById(`tab-${p}`)
    if (panelEl) panelEl.hidden = p !== panel
    tabEl?.classList.toggle('active', p === panel)
  }
}

function statusLabel(status: CriterionMatchStatus): string {
  switch (status) {
    case 'met':
      return 'Met'
    case 'likely':
      return 'Likely'
    case 'unclear':
      return 'Unclear'
    case 'not_assessed':
      return 'Not assessed'
    case 'not_met':
      return 'Not met'
  }
}

function buildWorkspaceBase(
  workspace: DiagnosticWorkspaceState | null
): DiagnosticWorkspaceState {
  return workspace
    ? {
        ...workspace,
        pinnedDisorderIds: [...workspace.pinnedDisorderIds],
        overrides: [...workspace.overrides],
        disorderNotes: [...workspace.disorderNotes],
        finalizedImpressions: [...workspace.finalizedImpressions],
      }
    : {
        ...EMPTY_DIAGNOSTIC_WORKSPACE,
      }
}

function resolveActiveDisorderId(
  workspace: DiagnosticWorkspaceState | null,
  suggestionIds: string[]
): string | null {
  if (workspace?.activeDisorderId && suggestionIds.includes(workspace.activeDisorderId)) {
    return workspace.activeDisorderId
  }
  if (workspace?.pinnedDisorderIds.length) {
    const pinned = workspace.pinnedDisorderIds.find((id) => suggestionIds.includes(id))
    if (pinned) return pinned
  }
  return suggestionIds[0] ?? null
}

async function updateWorkspace(
  mutator: (current: DiagnosticWorkspaceState) => DiagnosticWorkspaceState
): Promise<DiagnosticWorkspaceState> {
  const current = buildWorkspaceBase(await getDiagnosticWorkspace())
  const next = mutator(current)
  const normalized = {
    ...next,
    updatedAt: new Date().toISOString(),
  }
  await saveDiagnosticWorkspace(normalized)
  return normalized
}

function buildScoreCards(intake: IntakeData): string {
  const cards = [
    intake.phq9
      ? `
        <div class="score-card">
          <div class="score-label">PHQ-9</div>
          <div class="score-value">${intake.phq9.totalScore}/27</div>
          <div class="score-subtext">${escapeHtml(intake.phq9.severity || 'Severity unavailable')}</div>
          <div class="score-subtext">${escapeHtml(intake.phq9.difficulty || 'No impairment note captured')}</div>
        </div>
      `
      : `
        <div class="score-card">
          <div class="score-label">PHQ-9</div>
          <div class="score-value">Not captured</div>
          <div class="score-subtext">No PHQ-9 assessment in session storage.</div>
        </div>
      `,
    intake.gad7
      ? `
        <div class="score-card">
          <div class="score-label">GAD-7</div>
          <div class="score-value">${intake.gad7.totalScore}/21</div>
          <div class="score-subtext">${escapeHtml(intake.gad7.severity || 'Severity unavailable')}</div>
          <div class="score-subtext">${escapeHtml(intake.gad7.difficulty || 'No impairment note captured')}</div>
        </div>
      `
      : `
        <div class="score-card">
          <div class="score-label">GAD-7</div>
          <div class="score-value">Not captured</div>
          <div class="score-subtext">No GAD-7 assessment in session storage.</div>
        </div>
      `,
    intake.cssrs
      ? `
        <div class="score-card">
          <div class="score-label">C-SSRS</div>
          <div class="score-value">${intake.cssrs.totalScore} yes</div>
          <div class="score-subtext">${escapeHtml(intake.cssrs.severity || 'Summary unavailable')}</div>
          <div class="score-subtext">${escapeHtml(intake.cssrs.difficulty || 'No C-SSRS detail captured')}</div>
        </div>
      `
      : `
        <div class="score-card">
          <div class="score-label">C-SSRS</div>
          <div class="score-value">Not captured</div>
          <div class="score-subtext">No C-SSRS assessment in session storage.</div>
        </div>
      `,
    intake.dass21
      ? `
        <div class="score-card">
          <div class="score-label">DASS-21</div>
          <div class="score-value">${intake.dass21.totalScore}</div>
          <div class="score-subtext">${escapeHtml(intake.dass21.severity || 'Summary unavailable')}</div>
          <div class="score-subtext">${escapeHtml(intake.dass21.difficulty || 'No DASS detail captured')}</div>
        </div>
      `
      : `
        <div class="score-card">
          <div class="score-label">DASS-21</div>
          <div class="score-value">Not captured</div>
          <div class="score-subtext">No DASS-21 assessment in session storage.</div>
        </div>
      `,
  ]

  return cards.join('')
}

function renderPinnedTabs(
  workspace: DiagnosticWorkspaceState | null,
  activeDisorderId: string | null
): string {
  if (!workspace?.pinnedDisorderIds.length) {
    return '<div class="empty-copy">Pin diagnoses from the ranked list to keep them in active review tabs.</div>'
  }

  return workspace.pinnedDisorderIds
    .map((disorderId) => {
      const disorder = DSM5_DISORDER_MAP[disorderId]
      const v2 = !disorder ? DSM5_DIAGNOSES_V2.find((d) => d.id === disorderId) : null
      const name = disorder?.name ?? v2?.name
      if (!name) return ''
      return `
        <button class="tab ${activeDisorderId === disorderId ? 'active' : ''}" data-action="activate-tab" data-disorder-id="${disorderId}">
          ${escapeHtml(name)}
        </button>
      `
    })
    .join('')
}

function renderSuggestionList(
  intake: IntakeData,
  workspace: DiagnosticWorkspaceState | null,
  activeDisorderId: string | null
): string {
  const suggestions = getDiagnosticSuggestions(intake)

  return suggestions
    .map((suggestion) => {
      const pinned = workspace?.pinnedDisorderIds.includes(suggestion.disorderId) ?? false
      const isActive = suggestion.disorderId === activeDisorderId
      return `
        <article class="suggestion-card">
          <div class="suggestion-top">
            <div>
              <div class="suggestion-name">${escapeHtml(suggestion.disorderName)}</div>
              <div class="suggestion-meta">${escapeHtml(suggestion.code)} · ${suggestion.metCount} met · ${suggestion.likelyCount} likely · ${suggestion.requiredCount} required</div>
            </div>
            <span class="pill ${suggestion.confidence}">${suggestion.confidence.toUpperCase()}</span>
          </div>
          <div class="suggestion-reason">${escapeHtml(suggestion.reason)}</div>
          <div class="suggestion-actions">
            <button class="button ${pinned ? 'secondary' : 'primary'}" data-action="${pinned ? 'unpin' : 'pin'}" data-disorder-id="${suggestion.disorderId}">
              ${pinned ? 'Unpin' : 'Pin diagnosis'}
            </button>
            <button class="button ghost" data-action="review" data-disorder-id="${suggestion.disorderId}">
              ${isActive ? 'Reviewing' : 'Review'}
            </button>
          </div>
        </article>
      `
    })
    .join('')
}

function statusPillLabel(status: 'met' | 'likely' | 'unclear' | 'not_met'): string {
  switch (status) {
    case 'met': return 'Met'
    case 'likely': return 'Likely'
    case 'unclear': return 'Unclear'
    case 'not_met': return 'Not met'
  }
}

function renderLLMSuggestionList(workspace: DiagnosticWorkspaceState | null): string {
  if (llmGenerating) {
    return '<div class="empty-copy">Generating — pass 1 picks candidates, pass 2 evaluates DSM-5-TR criteria. Takes ~30s.</div>'
  }
  if (!llmSuggestions) {
    return '<div class="empty-copy">Click Generate to run the two-pass RAG diagnostic suggester.</div>'
  }
  if (!llmSuggestions.length) {
    return '<div class="empty-copy">LLM returned no candidates — check console.</div>'
  }

  return llmSuggestions
    .map((suggestion) => {
      const pinned = workspace?.pinnedDisorderIds.includes(suggestion.disorderId) ?? false
      const code = suggestion.code ? ` · ${escapeHtml(suggestion.code)}` : ''
      const ruleOuts = suggestion.ruleOuts.length
        ? `<div class="suggestion-meta"><strong>Rule-outs:</strong> ${escapeHtml(suggestion.ruleOuts.join('; '))}</div>`
        : ''
      const criteriaRows = suggestion.criteriaEval
        .map(
          (c) => `
            <div class="criterion-row">
              <span class="criterion-letter">${escapeHtml(c.letter || '?')}</span>
              <span class="pill status ${c.status}">${statusPillLabel(c.status)}</span>
              <span class="criterion-text">${escapeHtml(c.criterionText)}</span>
              ${c.evidence ? `<div class="criterion-evidence-inline"><em>${escapeHtml(c.evidence)}</em></div>` : ''}
            </div>
          `
        )
        .join('')
      return `
        <article class="suggestion-card">
          <div class="suggestion-top">
            <div>
              <div class="suggestion-name">${escapeHtml(suggestion.disorderName)}</div>
              <div class="suggestion-meta">${escapeHtml(suggestion.chapter)}${code}</div>
            </div>
            <span class="pill ${suggestion.confidence}">${suggestion.confidence.toUpperCase()}</span>
          </div>
          <div class="suggestion-reason">${escapeHtml(suggestion.reasoning)}</div>
          ${ruleOuts}
          <details class="llm-criteria-details">
            <summary>Criterion-by-criterion (${suggestion.criteriaEval.length})</summary>
            ${criteriaRows}
          </details>
          <div class="suggestion-actions">
            <button class="button ${pinned ? 'secondary' : 'primary'}" data-action="${pinned ? 'unpin' : 'pin'}" data-disorder-id="${suggestion.disorderId}">
              ${pinned ? 'Unpin' : 'Pin diagnosis'}
            </button>
          </div>
        </article>
      `
    })
    .join('')
}

async function generateLLMSuggestions(): Promise<void> {
  if (llmGenerating) return
  const intake = await getIntake()
  if (!intake) {
    llmStatus = 'Capture intake first.'
    await render()
    return
  }
  const prefs = await getPreferences()
  if (!prefs.openaiApiKey) {
    llmStatus = 'No OpenAI API key in settings — open the popup and paste one.'
    await render()
    return
  }

  llmGenerating = true
  llmStatus = 'Calling OpenAI (pass 1 of 2)...'
  await render()

  try {
    const started = Date.now()
    const suggestions = await getLLMDiagnosticSuggestions(intake, {
      apiKey: prefs.openaiApiKey,
      model: prefs.openaiModel || 'gpt-4o-mini',
      onProgress: (msg) => {
        llmStatus = msg
        // Fire and forget — don't await inside onProgress.
        void render()
      },
    })
    const elapsed = ((Date.now() - started) / 1000).toFixed(1)
    llmSuggestions = suggestions
    llmStatus = `${suggestions.length} suggestions in ${elapsed}s.`
    // Persist to session storage so reopening sidepanel doesn't re-cost $0.002
    const cacheKey = `llm_dx_${intake.clientId}`
    chrome.storage.session.set({ [cacheKey]: suggestions })
  } catch (err) {
    console.error('[SPN] LLM diagnostic failed:', err)
    llmStatus = `Failed: ${err instanceof Error ? err.message : String(err)}`
    llmSuggestions = null
  } finally {
    llmGenerating = false
    await render()
  }
}

function renderCriterionCard(
  disorderId: string,
  evaluation: CriterionEvaluation,
  workspace: DiagnosticWorkspaceState | null
): string {
  const status = getEffectiveCriterionStatus(workspace, disorderId, evaluation)
  const override = getOverride(workspace, disorderId, evaluation.criterionId)
  const criterionId = evaluation.criterionId.replace(`${disorderId}.`, '')
  const evidence = evaluation.evidence.length
    ? evaluation.evidence.map((item) => `<div>${escapeHtml(item)}</div>`).join('')
    : '<div>No direct intake evidence yet.</div>'

  return `
    <article class="criterion-card">
      <div class="criterion-top">
        <div class="criterion-id">${escapeHtml(criterionId)}</div>
        <span class="pill status ${status}">${statusLabel(status)}</span>
      </div>
      <div class="criterion-text">${escapeHtml(DSM5_DISORDER_MAP[disorderId].criteria.find((criterion) => criterion.id === evaluation.criterionId)?.text ?? '')}</div>
      <div class="criterion-evidence"><strong>Evidence:</strong> ${evidence}</div>
      <div class="criterion-rationale"><strong>Engine note:</strong> ${escapeHtml(evaluation.rationale)}</div>
      <div class="criterion-followup"><strong>Follow-up:</strong> ${escapeHtml(evaluation.followUpQuestion)}</div>
      <div class="criterion-controls">
        <select
          class="status-select"
          data-role="criterion-status"
          data-disorder-id="${disorderId}"
          data-criterion-id="${evaluation.criterionId}"
          data-auto-status="${evaluation.status}"
        >
          ${(['met', 'likely', 'unclear', 'not_assessed', 'not_met'] as CriterionMatchStatus[])
            .map((candidate) => `<option value="${candidate}" ${candidate === status ? 'selected' : ''}>${statusLabel(candidate)}</option>`)
            .join('')}
        </select>
        <textarea
          class="criterion-note"
          data-role="criterion-note"
          data-disorder-id="${disorderId}"
          data-criterion-id="${evaluation.criterionId}"
          data-auto-status="${evaluation.status}"
          placeholder="Optional override note"
        >${escapeHtml(override?.notes ?? '')}</textarea>
      </div>
    </article>
  `
}

function renderActiveReview(
  intake: IntakeData,
  workspace: DiagnosticWorkspaceState | null,
  activeDisorderId: string | null
): string {
  if (!activeDisorderId) {
    return '<div class="empty-copy">No diagnosis selected for checklist review.</div>'
  }

  const suggestion = findSuggestion(getDiagnosticSuggestions(intake), activeDisorderId)
  const disorder = suggestion ? DSM5_DISORDER_MAP[suggestion.disorderId] : null

  // v2-only disorder: show criteria text instead of structured checklist
  if (!disorder) {
    const v2 = DSM5_DIAGNOSES_V2.find((d) => d.id === activeDisorderId)
    if (!v2) return '<div class="empty-copy">The selected diagnosis is no longer available.</div>'
    const code = v2.icd10Code ? ` (${v2.icd10Code})` : ''
    return `
      <div class="criterion-group">${escapeHtml(v2.name)}${code}</div>
      <div class="diagnosis-notes" style="white-space:pre-wrap;font-size:12px;margin-top:8px;padding:10px;background:var(--neutral-bg);border-radius:6px;">${escapeHtml(v2.criteriaText)}</div>
    `
  }

  if (!suggestion) {
    return '<div class="empty-copy">The selected diagnosis is no longer available.</div>'
  }

  const unresolved = suggestion.criteria
    .filter((criterion) => {
      const status = getEffectiveCriterionStatus(workspace, activeDisorderId, criterion)
      return status === 'unclear' || status === 'not_assessed'
    })
    .slice(0, 5)

  let lastLetter = ''
  const criteriaMarkup = suggestion.criteria.map((evaluation) => {
    const definition = disorder.criteria.find((criterion) => criterion.id === evaluation.criterionId)
    const nextLetter = definition?.letter ?? ''
    const groupHeading = nextLetter !== lastLetter
      ? `<div class="criterion-group">${escapeHtml(nextLetter)}</div>`
      : ''
    lastLetter = nextLetter
    return `${groupHeading}${renderCriterionCard(activeDisorderId, evaluation, workspace)}`
  }).join('')

  const disorderNotes = getDisorderNotes(workspace, activeDisorderId)

  return `
    <div class="review-header">
      <div>
        <h3 class="review-title">${escapeHtml(suggestion.suggestedSpecifier ? `${suggestion.disorderName} — ${suggestion.suggestedSpecifier}` : suggestion.disorderName)}</h3>
        <div class="review-subtitle">${escapeHtml(suggestion.code)} · ${escapeHtml(suggestion.reason)}</div>
      </div>
      <span class="pill ${suggestion.confidence}">${suggestion.confidence.toUpperCase()}</span>
    </div>
    ${unresolved.length ? `
      <div class="criterion-followup">
        <strong>Unresolved prompts:</strong>
        <ul>
          ${unresolved.map((criterion) => `<li>${escapeHtml(criterion.followUpQuestion)}</li>`).join('')}
        </ul>
      </div>
    ` : ''}
    <div class="criteria-list">${criteriaMarkup}</div>
    <div class="diagnosis-notes-wrap">
      <label class="criterion-evidence"><strong>Clinician notes</strong></label>
      <textarea
        class="diagnosis-notes"
        data-role="diagnosis-notes"
        data-disorder-id="${activeDisorderId}"
        placeholder="Summary note, rule-outs, or interview takeaways"
      >${escapeHtml(disorderNotes)}</textarea>
    </div>
  `
}

function renderGeneratedSummary(workspace: DiagnosticWorkspaceState | null): string {
  if (!workspace?.finalizedImpressions.length) {
    return '<div class="empty-copy">No diagnostic summary generated yet.</div>'
  }

  return workspace.finalizedImpressions
    .map((impression) => `
      <article class="summary-card">
        <h3>${escapeHtml(impression.name)}</h3>
        <p>${escapeHtml(impression.code)} · ${escapeHtml(impression.confidence.toUpperCase())}</p>
        ${impression.diagnosticReasoning ? `<p>${escapeHtml(impression.diagnosticReasoning)}</p>` : ''}
        ${impression.criteriaEvidence.length ? `
          <div class="criterion-evidence"><strong>Supporting sentences</strong></div>
          <ul>${impression.criteriaEvidence.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
        ` : ''}
        ${impression.criteriaSummary.length ? `
          <div class="criterion-evidence"><strong>Criteria snapshot</strong></div>
          <ul>${impression.criteriaSummary.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
        ` : ''}
        ${impression.ruleOuts.length ? `
          <div class="criterion-evidence"><strong>Rule-outs / follow-up</strong></div>
          <ul>${impression.ruleOuts.slice(0, 4).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
        ` : ''}
        ${impression.clinicianNotes ? `<p>${escapeHtml(impression.clinicianNotes)}</p>` : ''}
      </article>
    `)
    .join('')
}

function renderGuidance(guidance: ClinicalGuidance | null): string {
  if (!guidance) {
    return '<div class="empty-copy">No formulation or treatment-plan support generated yet.</div>'
  }

  const modalityPills = guidance.modalities.length
    ? `<div class="pill-row">${guidance.modalities.map((modality) => `<span class="pill low">${escapeHtml(modality)}</span>`).join('')}</div>`
    : ''

  const references = guidance.references.length
    ? `
      <div class="reference-list">
        ${guidance.references.map((reference) => `
          <article class="reference-card">
            <div class="reference-title">${escapeHtml(reference.resourceTitle)}</div>
            <div class="reference-meta">p. ${reference.pageStart}${reference.heading ? ` · ${escapeHtml(reference.heading)}` : ''}</div>
            <div class="reference-preview">${escapeHtml(reference.preview)}</div>
          </article>
        `).join('')}
      </div>
    `
    : '<div class="empty-copy">No corpus matches were found for the current intake and diagnostic picture.</div>'

  return `
    ${modalityPills}
    <article class="knowledge-block">
      <h3>Diagnostic Formulation</h3>
      <p>${escapeHtml(guidance.formulation)}</p>
    </article>
    <article class="knowledge-block">
      <h3>Suggested Goals</h3>
      <pre style="white-space:pre-wrap;font-family:inherit;">${escapeHtml(guidance.goals)}</pre>
    </article>
    <article class="knowledge-block">
      <h3>Suggested Interventions</h3>
      <pre style="white-space:pre-wrap;font-family:inherit;">${escapeHtml(guidance.interventions)}</pre>
    </article>
    <article class="knowledge-block">
      <h3>Scheduling / Coordination</h3>
      <p><strong>Frequency:</strong> ${escapeHtml(guidance.frequency)}</p>
      <p><strong>Referrals:</strong> ${escapeHtml(guidance.referrals || 'No immediate referral recommendation pulled from the current intake.')}</p>
      <p><strong>Next step:</strong> ${escapeHtml(guidance.plan)}</p>
    </article>
    <article class="knowledge-block">
      <h3>Knowledge Matches</h3>
      ${references}
    </article>
  `
}

async function persistCriterionOverride(
  disorderId: string,
  criterionId: string,
  selectedStatus: CriterionMatchStatus,
  autoStatus: CriterionMatchStatus,
  notes: string
): Promise<void> {
  await updateWorkspace((workspace) => {
    const trimmedNotes = notes.trim()
    const nextOverrides = workspace.overrides.filter((override) => !(override.disorderId === disorderId && override.criterionId === criterionId))

    if (selectedStatus !== autoStatus || trimmedNotes) {
      nextOverrides.push({
        disorderId,
        criterionId,
        status: selectedStatus,
        notes: trimmedNotes,
        updatedAt: new Date().toISOString(),
      })
    }

    return {
      ...workspace,
      overrides: nextOverrides,
    }
  })
}

async function persistDisorderNotes(disorderId: string, notes: string): Promise<void> {
  await updateWorkspace((workspace) => {
    const trimmedNotes = notes.trim()
    const next = workspace.disorderNotes.filter((entry) => entry.disorderId !== disorderId)
    if (trimmedNotes) {
      next.push({ disorderId, notes: trimmedNotes })
    }
    return {
      ...workspace,
      disorderNotes: next,
    }
  })
}

async function pinDiagnosis(disorderId: string): Promise<void> {
  await updateWorkspace((workspace) => ({
    ...workspace,
    pinnedDisorderIds: workspace.pinnedDisorderIds.includes(disorderId)
      ? workspace.pinnedDisorderIds
      : [...workspace.pinnedDisorderIds, disorderId],
    activeDisorderId: disorderId,
  }))
}

async function unpinDiagnosis(disorderId: string): Promise<void> {
  await updateWorkspace((workspace) => {
    const pinnedDisorderIds = workspace.pinnedDisorderIds.filter((id) => id !== disorderId)
    return {
      ...workspace,
      pinnedDisorderIds,
      activeDisorderId: workspace.activeDisorderId === disorderId ? pinnedDisorderIds[0] ?? null : workspace.activeDisorderId,
    }
  })
}

async function setActiveDiagnosis(disorderId: string): Promise<void> {
  await updateWorkspace((workspace) => ({
    ...workspace,
    activeDisorderId: disorderId,
  }))
}

function mergeDiagnosticImpressionsIntoNote(
  note: ProgressNote | null,
  intake: IntakeData,
  impressions: DiagnosticWorkspaceState['finalizedImpressions']
): Promise<ProgressNote> {
  return getPreferences().then(async (prefs) => {
    const generated = await buildDraftNote(intake, prefs, impressions)
    if (!note) {
      return generated
    }

    return {
      ...generated,
      mentalStatusExam: note.mentalStatusExam,
      duration: note.duration || generated.duration,
      sessionType: note.sessionType || generated.sessionType,
      cptCode: note.cptCode || generated.cptCode,
      status: {
        ...note.status,
        intakeCaptured: true,
        noteGenerated: true,
      },
      generatedAt: new Date().toISOString(),
    }
  })
}

async function generateSummary(writeToNote: boolean): Promise<void> {
  const intake = await getIntake()
  if (!intake) return

  const workspace = buildWorkspaceBase(await getDiagnosticWorkspace())
  const suggestions = getDiagnosticSuggestions(intake)
  const activeDisorderId = resolveActiveDisorderId(workspace, suggestions.map((suggestion) => suggestion.disorderId))

  if (!workspace.pinnedDisorderIds.length && activeDisorderId) {
    workspace.activeDisorderId = activeDisorderId
  }

  const impressions = buildDiagnosticImpressions(intake, suggestions, workspace)

  const nextWorkspace = await updateWorkspace((current) => ({
    ...current,
    activeDisorderId: current.activeDisorderId ?? activeDisorderId,
    finalizedImpressions: impressions,
  }))

  if (writeToNote) {
    const currentNote = await getNote()
    const nextNote = await mergeDiagnosticImpressionsIntoNote(currentNote, intake, impressions)
    await saveNote(nextNote)
  }

  const statusEl = document.getElementById('summary-status')
  if (statusEl) {
    const verb = writeToNote ? 'Summary written to note draft' : 'Diagnostic summary generated'
    statusEl.textContent = `${verb} · ${nextWorkspace.finalizedImpressions.length} diagnoses`
  }

  await render()
}

async function regenerateSoapDraftFromSavedNotes(): Promise<void> {
  const apptCtx = await detectApptContext()
  if (!apptCtx.isAppt) {
    setSoapStatus('Open an appointment page first.')
    return
  }

  const treatmentPlan = await getTreatmentPlan()
  if (!treatmentPlan) {
    setSoapStatus('Capture a treatment plan first on the client treatment plan page.')
    return
  }

  const sessionNotes = (await getSessionNotes(apptCtx.apptId))?.notes ?? ''
  if (!sessionNotes.trim()) {
    setSoapStatus('Save session notes first from the popup or video room notes panel.')
    return
  }

  const intake = await getIntake()
  const note = await getNote()
  const workspace = await getDiagnosticWorkspace()
  const transcript = await getTranscript(apptCtx.apptId)
  const prefs = await getPreferences()
  const mseChecklist = await getMseChecklist()
  const diagnosticImpressions = workspace?.finalizedImpressions?.length
    ? workspace.finalizedImpressions
    : (note?.diagnosticImpressions ?? [])

  const clientName = [intake?.firstName, intake?.lastName].filter(Boolean).join(' ')
    || intake?.fullName
    || 'Client'
  const sessionDate = new Date().toLocaleDateString('en-US')

  setSoapStatus('Generating SOAP with LLM (this can take 10-60 seconds)...')
  activePanel = 'soap'
  await render()

  try {
    const draft = await generateSoapDraft(
      sessionNotes,
      transcript,
      treatmentPlan,
      intake,
      diagnosticImpressions,
      mseChecklist,
      prefs,
      { apptId: apptCtx.apptId, clientName, sessionDate }
    )

    await saveSoapDraft(draft)
    const method = draft.generationMethod === 'regex'
      ? 'LLM unavailable — generic draft produced. Edit manually.'
      : `SOAP draft generated via ${draft.generationMethod}.`
    setSoapStatus(method)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    setSoapStatus(`SOAP generation failed: ${message}`)
  }

  await render()
}

async function saveSoapDraftFromPanel(): Promise<SoapDraft | null> {
  const existing = await getSoapDraft()
  const next = readSoapDraftFromFields(existing)

  if (!next.subjective && !next.objective && !next.assessment && !next.plan) {
    setSoapStatus('SOAP draft is empty. Generate it first or add content before saving.')
    return null
  }

  await saveSoapDraft(next)
  setSoapStatus('SOAP draft saved.')
  return next
}

async function fillSoapDraftIntoPage(): Promise<void> {
  const draft = await saveSoapDraftFromPanel()
  if (!draft) return

  const tabId = await getActiveTabId()
  if (!tabId) {
    setSoapStatus('No active appointment tab found.')
    return
  }

  const response = await sendTabMessage<{ ok?: boolean; filled?: number; error?: string }>(tabId, {
    type: 'SPN_FILL_SOAP_DRAFT',
    draft,
  })

  if (response?.ok) {
    setSoapStatus(`Filled ${response.filled ?? 0} SOAP fields in SimplePractice.`)
    return
  }

  setSoapStatus(response?.error ?? 'Unable to fill the SOAP form. Open the progress note tab first.')
}

function renderSupervisionPrep(prep: Awaited<ReturnType<typeof getSupervisionPrep>>): void {
  const caseSummaryEl = document.getElementById('supervision-case-summary')
  const questionsEl = document.getElementById('supervision-discussion-questions')
  const blindSpotsEl = document.getElementById('supervision-blind-spot-flags')
  const modalityEl = document.getElementById('supervision-modality-prompts')
  const statusEl = document.getElementById('supervision-status')

  if (!prep) {
    if (caseSummaryEl) caseSummaryEl.textContent = ''
    if (questionsEl) questionsEl.innerHTML = ''
    if (blindSpotsEl) blindSpotsEl.innerHTML = ''
    if (modalityEl) modalityEl.innerHTML = ''
    if (statusEl) statusEl.textContent = 'Click "Generate Supervision Prep" to create a supervision agenda from current session data.'
    return
  }

  if (caseSummaryEl) caseSummaryEl.textContent = prep.caseSummary || 'No case summary generated.'
  if (questionsEl) questionsEl.innerHTML = renderBulletList(prep.discussionQuestions)
  if (blindSpotsEl) blindSpotsEl.innerHTML = renderBulletList(prep.blindSpotFlags)
  if (modalityEl) modalityEl.innerHTML = renderBulletList(prep.modalityPrompts)
  if (statusEl) statusEl.textContent = `Generated ${formatDate(prep.generatedAt)} (${prep.generationMethod})`
}

function renderBulletList(items: string[]): string {
  if (!items?.length) return '<div class="empty-copy">None generated.</div>'
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
}

async function generateAndSaveSupervisionPrep(): Promise<void> {
  const statusEl = document.getElementById('supervision-status')
  if (statusEl) statusEl.textContent = 'Generating supervision prep...'

  const intake = await getIntake()
  const workspace = await getDiagnosticWorkspace()
  const treatmentPlan = await getTreatmentPlan()
  const prefs = await getPreferences()
  const apptCtx = await detectApptContext()
  const soapDraft = await getSoapDraft()
  const sessionNotes = apptCtx.isAppt
    ? (await getSessionNotes(apptCtx.apptId))?.notes ?? soapDraft?.sessionNotes ?? ''
    : (soapDraft?.sessionNotes ?? '')
  const transcript = apptCtx.isAppt ? await getTranscript(apptCtx.apptId) : null
  const mseChecklist = await getMseChecklist()
  const diagnosticImpressions = workspace?.finalizedImpressions ?? []

  try {
    const prep = await generateSupervisionPrep(
      sessionNotes,
      transcript,
      treatmentPlan,
      intake,
      diagnosticImpressions,
      mseChecklist,
      prefs
    )
    await saveSupervisionPrep(prep)
    renderSupervisionPrep(prep)
  } catch (err) {
    if (statusEl) statusEl.textContent = `Generation failed: ${err instanceof Error ? err.message : String(err)}`
  }
}

async function copySupervisionToClipboard(): Promise<void> {
  const prep = await getSupervisionPrep()
  if (!prep) return

  const lines: string[] = []
  if (prep.caseSummary) {
    lines.push('CASE SUMMARY', prep.caseSummary, '')
  }
  if (prep.discussionQuestions.length) {
    lines.push('DISCUSSION QUESTIONS')
    prep.discussionQuestions.forEach((q, i) => lines.push(`${i + 1}. ${q}`))
    lines.push('')
  }
  if (prep.blindSpotFlags.length) {
    lines.push('BLIND SPOT FLAGS')
    prep.blindSpotFlags.forEach((f, i) => lines.push(`${i + 1}. ${f}`))
    lines.push('')
  }
  if (prep.modalityPrompts.length) {
    lines.push('MODALITY PROMPTS')
    prep.modalityPrompts.forEach((p, i) => lines.push(`${i + 1}. ${p}`))
  }

  await navigator.clipboard.writeText(lines.join('\n'))
  const btn = document.getElementById('btn-copy-supervision')
  if (btn) {
    const original = btn.textContent
    btn.textContent = 'Copied!'
    setTimeout(() => { btn.textContent = original }, 1500)
  }
}

async function render(): Promise<void> {
  const intake = await getIntake()
  let workspace = await getDiagnosticWorkspace()
  const soapDraft = await getSoapDraft()
  const treatmentPlan = await getTreatmentPlan()
  const apptCtx = await detectApptContext()
  const sessionNotes = apptCtx.isAppt
    ? (await getSessionNotes(apptCtx.apptId))?.notes ?? soapDraft?.sessionNotes ?? ''
    : (soapDraft?.sessionNotes ?? '')
  const transcript = apptCtx.isAppt ? await getTranscript(apptCtx.apptId) : null

  const emptyState = document.getElementById('empty-state')!
  const content = document.getElementById('content')!
  const diagnosticsTab = document.getElementById('tab-diagnostics') as HTMLButtonElement | null
  const treatmentPlanTab = document.getElementById('tab-treatment-plan') as HTMLButtonElement | null
  const hasSoapContext = !!soapDraft || !!treatmentPlan || !!sessionNotes || !!transcript

  if (!intake && !hasSoapContext) {
    clearDiagnosticUi()
    emptyState.hidden = false
    content.hidden = true
    return
  }

  emptyState.hidden = true
  content.hidden = false

  document.getElementById('patient-name')!.textContent =
    firstNonEmpty(
      intake?.fullName,
      `${intake?.firstName ?? ''} ${intake?.lastName ?? ''}`.trim(),
      soapDraft?.clientName,
      apptCtx.isAppt ? 'Current Appointment' : 'Client'
    )

  document.getElementById('patient-meta')!.textContent =
    [
      intake?.clientId ? `Client ${intake.clientId}` : '',
      soapDraft?.sessionDate ? `Session ${soapDraft.sessionDate}` : '',
      treatmentPlan?.capturedAt ? `Plan ${formatDate(treatmentPlan.capturedAt)}` : '',
    ]
      .filter(Boolean)
      .join(' · ')

  setSoapTextareaValue('soap-subjective', soapDraft?.subjective ?? '')
  setSoapTextareaValue('soap-objective', soapDraft?.objective ?? '')
  setSoapTextareaValue('soap-assessment', soapDraft?.assessment ?? '')
  setSoapTextareaValue('soap-plan', soapDraft?.plan ?? '')
  const treatmentPlanReference = buildTreatmentPlanReference(treatmentPlan)
  document.getElementById('soap-treatment-plan')!.textContent = treatmentPlanReference
  const treatmentPlanRef = document.getElementById('treatment-plan-reference')
  if (treatmentPlanRef) {
    treatmentPlanRef.textContent = treatmentPlanReference
  }
  document.getElementById('soap-session-notes')!.textContent = buildSessionNotesReference(sessionNotes)
  const overviewNoteRef = document.getElementById('overview-note-reference')
  if (overviewNoteRef) {
    overviewNoteRef.textContent = buildOverviewNoteReference(intake?.overviewClinicalNote ?? '')
  }

  if (!soapDraft) {
    if (!treatmentPlan) {
      setSoapStatus('Capture a treatment plan first, then generate a SOAP draft from session notes.')
    } else if (!sessionNotes.trim()) {
      setSoapStatus('No session notes saved for this appointment yet.')
    } else {
      setSoapStatus('SOAP draft not generated yet. Click "Regenerate SOAP" to build one from the saved session notes and treatment plan.')
    }
  } else {
    setSoapStatus(`Draft updated ${formatDate(soapDraft.editedAt || soapDraft.generatedAt)}`)
  }

  // ── Transcript panel ──
  const transcriptEntriesEl = document.getElementById('transcript-entries')
  const transcriptCountEl = document.getElementById('transcript-count')
  const transcriptStatusEl = document.getElementById('transcript-status')
  if (transcriptEntriesEl && transcriptCountEl && transcriptStatusEl) {
    if (!transcript || transcript.entries.length === 0) {
      transcriptEntriesEl.innerHTML =
        '<div class="empty-copy">No captions captured yet. Start a video session with captions enabled.</div>'
      transcriptCountEl.textContent = ''
      transcriptStatusEl.textContent = apptCtx.isAppt
        ? 'Listening for captions…'
        : 'Open a video appointment to capture transcript.'
    } else {
      const deduped = deduplicateTranscript(transcript.entries)
      transcriptEntriesEl.innerHTML = renderTranscriptEntries(deduped)
      transcriptCountEl.textContent = `${deduped.length} entries`
      transcriptStatusEl.textContent = `Last updated ${formatDate(transcript.updatedAt)} · ${transcript.entries.length} raw → ${deduped.length} deduped`
    }
  }

  // ── Supervision panel ──
  const supervisionPrep = await getSupervisionPrep()
  renderSupervisionPrep(supervisionPrep)

  if (!intake) {
    clearDiagnosticUi()
    if (diagnosticsTab) diagnosticsTab.disabled = true
    if (treatmentPlanTab) treatmentPlanTab.disabled = false
    if (activePanel === 'diagnostics') {
      switchPanel(treatmentPlan ? 'treatment-plan' : 'soap')
    } else {
      switchPanel(activePanel)
    }
    return
  }

  if (diagnosticsTab) diagnosticsTab.disabled = false
  if (treatmentPlanTab) treatmentPlanTab.disabled = false

  const suggestions = getDiagnosticSuggestions(intake)
  const staleFinalizedImpressions = workspace?.finalizedImpressions.length
    ? workspace.finalizedImpressions.some((impression) => !(impression.diagnosticReasoning ?? '').trim())
    : false

  if (staleFinalizedImpressions) {
    workspace = await updateWorkspace((current) => ({
      ...current,
      finalizedImpressions: buildDiagnosticImpressions(intake, suggestions, current),
    }))
  }

  const activeDisorderId = resolveActiveDisorderId(workspace, suggestions.map((suggestion) => suggestion.disorderId))
  const draftImpressions = workspace?.finalizedImpressions.length
    ? workspace.finalizedImpressions
    : buildDiagnosticImpressions(intake, suggestions, buildWorkspaceBase(workspace))
  const guidance = await buildClinicalGuidance(intake, draftImpressions)

  document.getElementById('score-grid')!.innerHTML = buildScoreCards(intake)
  document.getElementById('pinned-tabs')!.innerHTML = renderPinnedTabs(workspace, activeDisorderId)
  document.getElementById('suggestion-list')!.innerHTML = renderSuggestionList(intake, workspace, activeDisorderId)
  document.getElementById('llm-suggestion-list')!.innerHTML = renderLLMSuggestionList(workspace)
  const llmStatusEl = document.getElementById('llm-suggestion-status')
  if (llmStatusEl) llmStatusEl.textContent = llmStatus
  const llmGenBtn = document.getElementById('btn-generate-llm-suggestions') as HTMLButtonElement | null
  if (llmGenBtn) {
    llmGenBtn.disabled = llmGenerating
    llmGenBtn.textContent = llmGenerating ? 'Generating…' : llmSuggestions ? 'Regenerate' : 'Generate'
  }
  document.getElementById('active-review')!.innerHTML = renderActiveReview(intake, workspace, activeDisorderId)
  document.getElementById('generated-summary')!.innerHTML = renderGeneratedSummary(workspace)
  document.getElementById('knowledge-guidance')!.innerHTML = renderGuidance(guidance)

  const summaryStatus = document.getElementById('summary-status')!
  summaryStatus.textContent = workspace?.finalizedImpressions.length
    ? `Most recent summary includes ${workspace.finalizedImpressions.length} pinned diagnoses.`
    : 'Generate a summary to push finalized diagnostic impressions into the note draft.'

  const guidanceStatus = document.getElementById('guidance-status')!
  guidanceStatus.textContent = workspace?.finalizedImpressions.length
    ? `Knowledge support is using the finalized diagnostic summary and current intake evidence.`
    : 'Knowledge support is using provisional intake-driven diagnoses until a summary is finalized.'

  const searchInput = document.getElementById('diagnosis-search') as HTMLInputElement
  const availableOptions = getAvailableDiagnosisOptions(workspace)
  searchInput.disabled = false
  searchInput.placeholder = availableOptions.length
    ? 'Search diagnoses by name or ICD code...'
    : 'All diagnoses are already pinned.'

  switchPanel(activePanel)
}

document.addEventListener('click', async (event) => {
  const target = event.target as HTMLElement | null
  if (!target) return

  const actionTarget = target.closest<HTMLElement>('[data-action]')
  const action = actionTarget?.dataset.action
  const disorderId = actionTarget?.dataset.disorderId

  if (action === 'generate-llm-suggestions') {
    await generateLLMSuggestions()
    return
  }

  if (action === 'pin' && disorderId) {
    await pinDiagnosis(disorderId)
    await render()
    return
  }

  if (action === 'unpin' && disorderId) {
    await unpinDiagnosis(disorderId)
    await render()
    return
  }

  if ((action === 'review' || action === 'activate-tab') && disorderId) {
    await setActiveDiagnosis(disorderId)
    await render()
    return
  }
})

document.addEventListener('change', async (event) => {
  const target = event.target as HTMLElement | null
  if (!target) return

  if (target instanceof HTMLSelectElement && target.dataset.role === 'criterion-status') {
    const disorderId = target.dataset.disorderId
    const criterionId = target.dataset.criterionId
    const autoStatus = target.dataset.autoStatus as CriterionMatchStatus | undefined
    if (!disorderId || !criterionId || !autoStatus) return

    const noteEl = document.querySelector<HTMLTextAreaElement>(`textarea[data-role="criterion-note"][data-disorder-id="${disorderId}"][data-criterion-id="${criterionId}"]`)
    await persistCriterionOverride(
      disorderId,
      criterionId,
      target.value as CriterionMatchStatus,
      autoStatus,
      noteEl?.value ?? ''
    )
    await render()
    return
  }

  if (target instanceof HTMLTextAreaElement && target.dataset.role === 'diagnosis-notes') {
    const disorderId = target.dataset.disorderId
    if (!disorderId) return
    await persistDisorderNotes(disorderId, target.value)
    return
  }
})

document.addEventListener('blur', async (event) => {
  const target = event.target as HTMLElement | null
  if (!(target instanceof HTMLTextAreaElement)) return

  if (target.dataset.role === 'criterion-note') {
    const disorderId = target.dataset.disorderId
    const criterionId = target.dataset.criterionId
    const autoStatus = target.dataset.autoStatus as CriterionMatchStatus | undefined
    if (!disorderId || !criterionId || !autoStatus) return

    const statusEl = document.querySelector<HTMLSelectElement>(`select[data-role="criterion-status"][data-disorder-id="${disorderId}"][data-criterion-id="${criterionId}"]`)
    await persistCriterionOverride(
      disorderId,
      criterionId,
      (statusEl?.value as CriterionMatchStatus | undefined) ?? autoStatus,
      autoStatus,
      target.value
    )
    return
  }

  if (target.dataset.role === 'diagnosis-notes') {
    const disorderId = target.dataset.disorderId
    if (!disorderId) return
    await persistDisorderNotes(disorderId, target.value)
  }
}, true)

document.getElementById('btn-refresh')?.addEventListener('click', () => {
  render()
})

document.getElementById('btn-new-patient')?.addEventListener('click', async () => {
  if (!confirm('Clear all captured data for a new patient?')) return
  await clearAll()
  activePanel = 'diagnostics'
  await render()
})

// ── Diagnosis Search Autocomplete ──

// Unified search item for both v1 (detailed criteria) and v2 (full DSM catalog)
type SearchableDiagnosis = {
  id: string
  name: string
  chapter: string
  codes: string[]
  hasDetailedCriteria: boolean
}

function buildSearchableDiagnoses(): SearchableDiagnosis[] {
  const seen = new Set<string>()
  const items: SearchableDiagnosis[] = []

  // v1 disorders first (they have full criterion checklists)
  for (const d of DSM5_DISORDERS) {
    seen.add(d.id)
    items.push({ id: d.id, name: d.name, chapter: d.chapter, codes: d.icd10Codes, hasDetailedCriteria: true })
  }

  // v2 disorders that aren't already in v1
  for (const d of DSM5_DIAGNOSES_V2) {
    if (seen.has(d.id)) continue
    seen.add(d.id)
    items.push({ id: d.id, name: d.name, chapter: d.chapter, codes: d.icd10Code ? [d.icd10Code] : [], hasDetailedCriteria: false })
  }

  return items
}

const ALL_DIAGNOSES = buildSearchableDiagnoses()

function getSuggestedDiagnosisIds(intake: IntakeData): Set<string> {
  const corpus = [
    intake.chiefComplaint,
    intake.presentingProblems,
    intake.historyOfPresentIllness,
    intake.counselingGoals,
    intake.recentSymptoms,
    intake.additionalSymptoms,
    intake.additionalInfo,
    intake.manualNotes,
    intake.overviewClinicalNote,
    intake.spSoapNote,
    ...(intake.rawQA ?? []).map((qa) => `${qa.question} ${qa.answer}`),
  ].join(' ').toLowerCase()

  if (!corpus.trim()) return new Set()

  const ids = new Set<string>()

  // Check v1 disorders (have keyword data)
  for (const disorder of DSM5_DISORDERS) {
    const nameWords = disorder.name.toLowerCase().split(/\s+/)
    if (nameWords.some((w) => w.length > 3 && corpus.includes(w))) {
      ids.add(disorder.id)
      continue
    }
    const hasKeywordMatch = disorder.criteria.some((c) =>
      c.keywords?.some((kw) => corpus.includes(kw.toLowerCase()))
    )
    if (hasKeywordMatch) ids.add(disorder.id)
  }

  // Check v2 disorders by name fragments
  for (const d of DSM5_DIAGNOSES_V2) {
    if (ids.has(d.id)) continue
    const nameWords = d.name.toLowerCase().split(/[\s()/-]+/)
    if (nameWords.some((w) => w.length > 4 && corpus.includes(w))) {
      ids.add(d.id)
    }
  }

  return ids
}

;(function initDiagnosisSearch() {
  const searchInput = document.getElementById('diagnosis-search') as HTMLInputElement
  const dropdown = document.getElementById('diagnosis-dropdown') as HTMLElement
  let activeIndex = -1
  let currentItems: SearchableDiagnosis[] = []

  function showDropdown(items: SearchableDiagnosis[], intake: IntakeData | null) {
    currentItems = items
    activeIndex = -1
    if (items.length === 0) {
      dropdown.innerHTML = '<div class="diagnosis-dropdown-empty">No matches found.</div>'
      dropdown.classList.remove('hidden')
      return
    }

    const suggestedIds = intake ? getSuggestedDiagnosisIds(intake) : new Set<string>()

    dropdown.innerHTML = items.slice(0, 30).map((d, i) => {
      const codes = d.codes.slice(0, 3).join(', ')
      const suggested = suggestedIds.has(d.id) ? '<span class="dx-suggested">suggested</span>' : ''
      const detailed = d.hasDetailedCriteria ? '' : '<span class="dx-code"> (criteria only)</span>'
      return `<div class="diagnosis-dropdown-item${i === activeIndex ? ' active' : ''}" data-index="${i}" data-id="${d.id}">` +
        `<span class="dx-name">${escapeHtml(d.name)}</span>` +
        `<span class="dx-code">${codes}</span>` +
        suggested + detailed +
        `</div>`
    }).join('')
    dropdown.classList.remove('hidden')
  }

  function hideDropdown() {
    dropdown.classList.add('hidden')
    activeIndex = -1
  }

  async function selectItem(id: string) {
    searchInput.value = ''
    hideDropdown()
    await pinDiagnosis(id)
    await render()
  }

  searchInput.addEventListener('input', async () => {
    const query = searchInput.value.trim().toLowerCase()
    const workspace = await getDiagnosticWorkspace()
    const pinned = new Set(workspace?.pinnedDisorderIds ?? [])
    const intake = await getIntake()

    // Filter out already-pinned from full catalog
    const available = ALL_DIAGNOSES.filter((d) => !pinned.has(d.id))

    if (!query) {
      const suggestedIds = intake ? getSuggestedDiagnosisIds(intake) : new Set<string>()
      const suggested = available.filter((d) => suggestedIds.has(d.id))
      if (suggested.length) {
        showDropdown(suggested, intake)
      } else {
        showDropdown(available.slice(0, 15), intake)
      }
      return
    }

    const filtered = available.filter((d) => {
      const nameMatch = d.name.toLowerCase().includes(query)
      const codeMatch = d.codes.some((c) => c.toLowerCase().includes(query))
      const chapterMatch = d.chapter.toLowerCase().includes(query)
      return nameMatch || codeMatch || chapterMatch
    })
    showDropdown(filtered, intake)
  })

  searchInput.addEventListener('focus', () => {
    // Trigger the input handler to show suggestions on focus
    searchInput.dispatchEvent(new Event('input'))
  })

  searchInput.addEventListener('keydown', (e) => {
    if (dropdown.classList.contains('hidden')) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      activeIndex = Math.min(activeIndex + 1, currentItems.length - 1)
      updateActiveItem()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      activeIndex = Math.max(activeIndex - 1, 0)
      updateActiveItem()
    } else if (e.key === 'Enter' && activeIndex >= 0 && currentItems[activeIndex]) {
      e.preventDefault()
      selectItem(currentItems[activeIndex].id)
    } else if (e.key === 'Escape') {
      hideDropdown()
    }
  })

  function updateActiveItem() {
    dropdown.querySelectorAll('.diagnosis-dropdown-item').forEach((el, i) => {
      el.classList.toggle('active', i === activeIndex)
      if (i === activeIndex) el.scrollIntoView({ block: 'nearest' })
    })
  }

  dropdown.addEventListener('click', (e) => {
    const item = (e.target as HTMLElement).closest<HTMLElement>('.diagnosis-dropdown-item')
    if (item?.dataset.id) selectItem(item.dataset.id)
  })

  document.addEventListener('click', (e) => {
    if (!(e.target as HTMLElement).closest('.diagnosis-search-wrap')) {
      hideDropdown()
    }
  })
})()

document.getElementById('btn-generate-summary')?.addEventListener('click', async () => {
  await generateSummary(false)
})

document.getElementById('btn-write-note')?.addEventListener('click', async () => {
  await generateSummary(true)
})

document.getElementById('tab-soap')?.addEventListener('click', () => {
  switchPanel('soap')
})

document.getElementById('tab-diagnostics')?.addEventListener('click', () => {
  const tab = document.getElementById('tab-diagnostics') as HTMLButtonElement | null
  if (tab?.disabled) return
  switchPanel('diagnostics')
})

document.getElementById('tab-treatment-plan')?.addEventListener('click', () => {
  const tab = document.getElementById('tab-treatment-plan') as HTMLButtonElement | null
  if (tab?.disabled) return
  switchPanel('treatment-plan')
})

document.getElementById('tab-transcript')?.addEventListener('click', () => {
  switchPanel('transcript')
})

document.getElementById('btn-copy-transcript')?.addEventListener('click', async () => {
  const apptCtx = await detectApptContext()
  const transcript = apptCtx.isAppt ? await getTranscript(apptCtx.apptId) : null
  if (!transcript || transcript.entries.length === 0) return
  const deduped = deduplicateTranscript(transcript.entries)
  const text = formatTranscriptForClipboard(deduped)
  await navigator.clipboard.writeText(text)
  const btn = document.getElementById('btn-copy-transcript')
  if (btn) {
    const original = btn.textContent
    btn.textContent = 'Copied!'
    setTimeout(() => {
      btn.textContent = original
    }, 1500)
  }
})

document.getElementById('btn-refresh-transcript')?.addEventListener('click', () => {
  render()
})

document.getElementById('btn-generate-soap')?.addEventListener('click', async () => {
  await regenerateSoapDraftFromSavedNotes()
})

document.getElementById('btn-save-soap')?.addEventListener('click', async () => {
  const saved = await saveSoapDraftFromPanel()
  if (saved) {
    await render()
  }
})

document.getElementById('btn-fill-soap')?.addEventListener('click', async () => {
  await fillSoapDraftIntoPage()
})

document.getElementById('tab-supervision')?.addEventListener('click', () => {
  switchPanel('supervision')
})

document.getElementById('btn-generate-supervision')?.addEventListener('click', async () => {
  await generateAndSaveSupervisionPrep()
})

document.getElementById('btn-copy-supervision')?.addEventListener('click', async () => {
  await copySupervisionToClipboard()
})

chrome.storage.onChanged.addListener(() => render())

// Restore cached LLM suggestions from session storage
getIntake().then((intake) => {
  if (!intake?.clientId) return render()
  const cacheKey = `llm_dx_${intake.clientId}`
  chrome.storage.session.get(cacheKey).then((result) => {
    const cached = result[cacheKey] as LLMDiagnosticSuggestion[] | undefined
    if (cached?.length) {
      llmSuggestions = cached
      llmStatus = `${cached.length} suggestions (cached).`
    }
    render()
  })
}).catch(() => render())
