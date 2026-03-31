import { DSM5_DISORDER_MAP } from '../data/dsm5-criteria'
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
import { buildDraftNote } from '../lib/note-draft'
import {
  getDiagnosticWorkspace,
  getIntake,
  getNote,
  getPreferences,
  saveDiagnosticWorkspace,
  saveNote,
} from '../lib/storage'
import {
  CriterionEvaluation,
  CriterionMatchStatus,
  DiagnosticWorkspaceState,
  EMPTY_DIAGNOSTIC_WORKSPACE,
  IntakeData,
  ProgressNote,
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

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
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
      if (!disorder) return ''
      return `
        <button class="tab ${activeDisorderId === disorderId ? 'active' : ''}" data-action="activate-tab" data-disorder-id="${disorderId}">
          ${escapeHtml(disorder.name)}
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
  if (!suggestion || !disorder) {
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
        ${impression.criteriaSummary.length ? `<ul>${impression.criteriaSummary.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : ''}
        ${impression.criteriaEvidence.length ? `<ul>${impression.criteriaEvidence.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : ''}
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
      <h3>Working Formulation</h3>
      <p>${escapeHtml(guidance.formulation)}</p>
    </article>
    <article class="knowledge-block">
      <h3>Suggested Goals</h3>
      <ul>${guidance.goals.map((goal) => `<li>${escapeHtml(goal)}</li>`).join('')}</ul>
    </article>
    <article class="knowledge-block">
      <h3>Suggested Interventions</h3>
      <ul>${guidance.interventions.map((intervention) => `<li>${escapeHtml(intervention)}</li>`).join('')}</ul>
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

async function render(): Promise<void> {
  const intake = await getIntake()
  const workspace = await getDiagnosticWorkspace()

  const emptyState = document.getElementById('empty-state')!
  const content = document.getElementById('content')!

  if (!intake) {
    emptyState.hidden = false
    content.hidden = true
    return
  }

  emptyState.hidden = true
  content.hidden = false

  const suggestions = getDiagnosticSuggestions(intake)
  const activeDisorderId = resolveActiveDisorderId(workspace, suggestions.map((suggestion) => suggestion.disorderId))
  const draftImpressions = workspace?.finalizedImpressions.length
    ? workspace.finalizedImpressions
    : buildDiagnosticImpressions(intake, suggestions, buildWorkspaceBase(workspace))
  const guidance = await buildClinicalGuidance(intake, draftImpressions)

  document.getElementById('patient-name')!.textContent =
    intake.fullName || `${intake.firstName} ${intake.lastName}`.trim() || 'Client'
  document.getElementById('patient-meta')!.textContent =
    [`Client ${intake.clientId || 'unknown'}`, intake.capturedAt ? `Captured ${formatDate(intake.capturedAt)}` : '']
      .filter(Boolean)
      .join(' · ')

  document.getElementById('score-grid')!.innerHTML = buildScoreCards(intake)
  document.getElementById('pinned-tabs')!.innerHTML = renderPinnedTabs(workspace, activeDisorderId)
  document.getElementById('suggestion-list')!.innerHTML = renderSuggestionList(intake, workspace, activeDisorderId)
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

  const addSelect = document.getElementById('add-diagnosis-select') as HTMLSelectElement
  const options = getAvailableDiagnosisOptions(workspace)
  addSelect.innerHTML = options.length
    ? options.map((disorder) => `<option value="${disorder.id}">${escapeHtml(disorder.name)}</option>`).join('')
    : '<option value="">All 15 diagnoses are already pinned.</option>'
  addSelect.disabled = options.length === 0
  ;(document.getElementById('btn-add-diagnosis') as HTMLButtonElement).disabled = options.length === 0
}

document.addEventListener('click', async (event) => {
  const target = event.target as HTMLElement | null
  if (!target) return

  const actionTarget = target.closest<HTMLElement>('[data-action]')
  const action = actionTarget?.dataset.action
  const disorderId = actionTarget?.dataset.disorderId

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

  if (target.id === 'add-diagnosis-select') return

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

document.getElementById('btn-add-diagnosis')?.addEventListener('click', async () => {
  const select = document.getElementById('add-diagnosis-select') as HTMLSelectElement
  if (!select.value) return
  await pinDiagnosis(select.value)
  await render()
})

document.getElementById('btn-generate-summary')?.addEventListener('click', async () => {
  await generateSummary(false)
})

document.getElementById('btn-write-note')?.addEventListener('click', async () => {
  await generateSummary(true)
})

chrome.storage.onChanged.addListener(() => render())

render()
