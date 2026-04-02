import {
  getIntake,
  getNote,
  saveNote,
  clearAll,
  getPreferences,
  savePreferences,
  hasPreferences,
  mergeIntake,
  getSessionNotes,
  saveSessionNotes,
  getTreatmentPlan,
  getSoapDraft,
  saveSoapDraft,
  getDiagnosticWorkspace,
  getTranscript,
  getMseChecklist,
} from '../lib/storage'
import { IntakeData, ProviderPreferences, DEFAULT_PREFERENCES, SoapDraft, TreatmentPlanData } from '../lib/types'
import { buildDraftNote } from '../lib/note-draft'
import { generateSoapDraft as generateSoapDraftLLM } from '../lib/soap-generator'

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function setToggleButtonState(visible: boolean): void {
  const toggleBtn = document.getElementById('btn-toggle-btns')!
  toggleBtn.textContent = visible ? '\u{1F441}' : '\u{1F6AB}'
  toggleBtn.title = visible ? 'Hide page buttons' : 'Show page buttons'
}

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
  } catch {}
  return { isAppt: false, apptId: '' }
}

async function syncToggleButtonState(): Promise<void> {
  const tabId = await getActiveTabId()
  if (!tabId) {
    setToggleButtonState(true)
    return
  }

  const response = await sendTabMessage<{ visible: boolean }>(tabId, {
    type: 'get-floating-buttons-visibility',
  })
  setToggleButtonState(response?.visible ?? true)
}

function updateCheckItem(id: string, done: boolean): void {
  const el = document.getElementById(id)
  if (!el) return
  const icon = el.querySelector('.check-icon')
  if (done) {
    el.classList.add('done')
    if (icon) icon.textContent = '\u2713'
  } else {
    el.classList.remove('done')
    if (icon) icon.textContent = '\u25CB'
  }
}

function showView(view: 'main' | 'settings'): void {
  const emptyState = document.getElementById('empty-state')!
  const intakeInfo = document.getElementById('intake-info')!
  const manualNotesSection = document.getElementById('manual-notes-section')!
  const settingsPanel = document.getElementById('settings-panel')!
  const popupStatus = document.getElementById('popup-status') as HTMLDivElement | null
  const treatmentPlanSection = document.getElementById('treatment-plan-section') as HTMLDivElement | null
  const soapPreviewSection = document.getElementById('soap-preview-section') as HTMLDivElement | null

  if (view === 'settings') {
    emptyState.style.display = 'none'
    intakeInfo.style.display = 'none'
    manualNotesSection.style.display = 'none'
    if (popupStatus) popupStatus.style.display = 'none'
    if (treatmentPlanSection) treatmentPlanSection.style.display = 'none'
    if (soapPreviewSection) soapPreviewSection.style.display = 'none'
    settingsPanel.style.display = 'flex'
  } else {
    settingsPanel.style.display = 'none'
    manualNotesSection.style.display = 'block'
  }
}

function renderIntakeFields(intake: IntakeData): void {
  const container = document.getElementById('intake-fields')!
  container.innerHTML = ''

  const fields: [string, string][] = [
    ['Name', intake.fullName || `${intake.firstName} ${intake.lastName}`.trim()],
    ['DOB', intake.dob],
    ['Sex', intake.sex],
    ['Gender', intake.genderIdentity],
    ['Phone', intake.phone],
    ['Address', intake.address.raw || [intake.address.street, intake.address.city, intake.address.state, intake.address.zip].filter(Boolean).join(', ')],
    ['Race', intake.race],
    ['Emergency Contact', intake.emergencyContact],
    ['Chief Complaint', intake.chiefComplaint],
    ['Goals', intake.counselingGoals],
    ['Prior Treatment', intake.priorTreatment],
    ['Medications', intake.medications],
    ['Prescribing MD', intake.prescribingMD],
    ['PCP', intake.primaryCarePhysician],
    ['Alcohol', intake.alcoholUse],
    ['Drugs', intake.drugUse],
    ['C-SSRS', intake.cssrs?.severity ?? ''],
    ['SI', intake.suicidalIdeation],
    ['Suicide Attempts', intake.suicideAttemptHistory],
    ['HI', intake.homicidalIdeation],
    ['Psych Hospitalization', intake.psychiatricHospitalization],
    ['Family MH Hx', intake.familyPsychiatricHistory],
    ['Marital Status', intake.maritalStatus],
    ['Relationship', intake.relationshipDescription],
    ['Living Situation', intake.livingArrangement],
    ['Education', intake.education],
    ['Occupation', intake.occupation],
    ['Abuse Hx', intake.physicalSexualAbuseHistory],
    ['DV Hx', intake.domesticViolenceHistory],
    ['Recent Symptoms', intake.recentSymptoms],
    ['Additional Info', intake.additionalInfo],
    ['Clinician Notes', intake.manualNotes],
  ]

  for (const [label, value] of fields) {
    const item = document.createElement('div')
    item.className = 'field-item'

    const labelEl = document.createElement('span')
    labelEl.className = 'field-label'
    labelEl.textContent = label

    const valueEl = document.createElement('span')
    valueEl.className = value ? 'field-value' : 'field-value empty'
    valueEl.textContent = value || '(not captured)'

    // Truncate long values in the popup
    if (value && value.length > 80) {
      valueEl.textContent = value.substring(0, 80) + '...'
      valueEl.title = value
    }

    item.appendChild(labelEl)
    item.appendChild(valueEl)
    container.appendChild(item)
  }
}

function buildNotePreview(note: Awaited<ReturnType<typeof getNote>>): string {
  if (!note) return ''

  const lines: string[] = []

  if (note.sessionType || note.cptCode) {
    lines.push(
      ['Session', [note.sessionType, note.cptCode && `CPT ${note.cptCode}`].filter(Boolean).join(' - ')]
        .filter(Boolean)
        .join(': ')
    )
  }

  if (note.chiefComplaint) lines.push(`CC: ${note.chiefComplaint}`)
  if (note.diagnosticImpressions.length) {
    lines.push(`Dx: ${note.diagnosticImpressions.map((d) => `${d.name} (${d.code})`).join(', ')}`)
  }
  if (note.presentingComplaint) lines.push(`Presenting: ${note.presentingComplaint}`)
  if (note.clinicalFormulation) lines.push(`Formulation: ${note.clinicalFormulation}`)
  if (note.treatmentPlan.goals.length) lines.push(`Goals: ${note.treatmentPlan.goals.join('; ')}`)
  if (note.treatmentPlan.interventions.length) lines.push(`Interventions: ${note.treatmentPlan.interventions.join('; ')}`)
  if (note.plan) lines.push(`Plan: ${note.plan}`)

  return lines.join('\n\n')
}

function buildTreatmentPlanPreview(plan: TreatmentPlanData | null): string {
  if (!plan) {
    return 'No treatment plan captured yet. Open the client treatment plan page and click "Capture Treatment Plan" first.'
  }

  const lines: string[] = []
  if (plan.diagnoses.length) {
    lines.push(`Dx: ${plan.diagnoses.map((entry) => `${entry.description}${entry.code ? ` (${entry.code})` : ''}`).join(', ')}`)
  }
  if (plan.presentingProblem) lines.push(`Problem: ${plan.presentingProblem}`)
  if (plan.goals.length) {
    lines.push(`Goals:\n${plan.goals.map((goal) => `- Goal ${goal.goalNumber}: ${goal.goal}`).join('\n')}`)
  }
  if (plan.interventions.length) {
    lines.push(`Interventions: ${plan.interventions.join(', ')}`)
  }
  if (plan.treatmentFrequency) {
    lines.push(`Frequency: ${plan.treatmentFrequency}`)
  }
  return lines.join('\n\n')
}

function buildSoapPreview(draft: SoapDraft | null): string {
  if (!draft) return ''

  return [
    `S: ${draft.subjective}`,
    `O: ${draft.objective}`,
    `A: ${draft.assessment}`,
    `P: ${draft.plan}`,
  ].join('\n\n')
}

function setStatus(
  message: string,
  type: 'success' | 'error' | 'neutral' = 'neutral'
): void {
  const el = document.getElementById('popup-status')
  if (!el) return

  if (!message.trim()) {
    el.textContent = ''
    ;(el as HTMLElement).style.display = 'none'
    el.className = 'status-banner'
    return
  }

  el.textContent = message
  ;(el as HTMLElement).style.display = 'block'
  el.className = `status-banner${type === 'neutral' ? '' : ` ${type}`}`
}

async function generateSoapDraftForAppointment(
  apptId: string,
  sessionNotes: string
): Promise<{ draft: SoapDraft | null; error?: string }> {
  const treatmentPlan = await getTreatmentPlan()
  const intake = await getIntake()
  if (intake?.clientId && treatmentPlan?.clientId && intake.clientId !== treatmentPlan.clientId) {
    return {
      draft: null,
      error: 'The captured treatment plan appears to belong to a different client. Re-capture the correct treatment plan first.',
    }
  }

  const prefs = await getPreferences()
  const note = await getNote()
  const workspace = await getDiagnosticWorkspace()
  const transcript = await getTranscript(apptId)
  const mseChecklist = await getMseChecklist()
  const diagnosticImpressions = workspace?.finalizedImpressions?.length
    ? workspace.finalizedImpressions
    : (note?.diagnosticImpressions ?? [])

  const clientName = intake
    ? [intake.firstName, intake.lastName].filter(Boolean).join(' ') || intake.fullName
    : ''

  const draft = await generateSoapDraftLLM(
    sessionNotes,
    transcript,
    treatmentPlan,
    intake,
    diagnosticImpressions,
    mseChecklist,
    prefs,
    { apptId, clientName }
  )

  await saveSoapDraft(draft)
  const warnings: string[] = []
  if (!treatmentPlan) warnings.push('No treatment plan captured — Assessment section will be limited.')
  if (draft.generationMethod === 'regex') warnings.push('Ollama not available — used template-based generation.')
  return { draft, error: warnings.join(' ') || undefined }
}

async function populateSettingsForm(): Promise<void> {
  const prefs = await getPreferences()
  ;(document.getElementById('pref-firstName') as HTMLInputElement).value = prefs.providerFirstName
  ;(document.getElementById('pref-lastName') as HTMLInputElement).value = prefs.providerLastName
  ;(document.getElementById('pref-location') as HTMLSelectElement).value = prefs.defaultLocation
  ;(document.getElementById('pref-firstCPT') as HTMLInputElement).value = prefs.firstVisitCPT
  ;(document.getElementById('pref-followUpCPT') as HTMLInputElement).value = prefs.followUpCPT
}

function readSettingsForm(): ProviderPreferences {
  return {
    providerFirstName: (document.getElementById('pref-firstName') as HTMLInputElement).value.trim(),
    providerLastName: (document.getElementById('pref-lastName') as HTMLInputElement).value.trim(),
    defaultLocation: (document.getElementById('pref-location') as HTMLSelectElement).value,
    firstVisitCPT: (document.getElementById('pref-firstCPT') as HTMLInputElement).value.trim() || DEFAULT_PREFERENCES.firstVisitCPT,
    followUpCPT: (document.getElementById('pref-followUpCPT') as HTMLInputElement).value.trim() || DEFAULT_PREFERENCES.followUpCPT,
  }
}

async function render(): Promise<void> {
  const intake = await getIntake()
  const note = await getNote()
  const soapDraft = await getSoapDraft()
  const treatmentPlan = await getTreatmentPlan()
  const prefs = await getPreferences()
  const apptCtx = await detectApptContext()
  const isSessionMode = apptCtx.isAppt
  const draftBtn = document.getElementById('btn-generate-draft') as HTMLButtonElement | null
  const manualNotesInput = document.getElementById('manual-notes-input') as HTMLTextAreaElement | null
  const manualNotesHint = document.getElementById('manual-notes-hint') as HTMLParagraphElement | null
  const soapBtn = document.getElementById('btn-save-session-notes') as HTMLButtonElement | null
  const saveManualBtn = document.getElementById('btn-save-manual-notes') as HTMLButtonElement | null
  const treatmentPlanSection = document.getElementById('treatment-plan-section') as HTMLDivElement | null
  const treatmentPlanContent = document.getElementById('treatment-plan-content') as HTMLDivElement | null
  const soapPreviewSection = document.getElementById('soap-preview-section') as HTMLDivElement | null
  const soapPreviewContent = document.getElementById('soap-preview-content') as HTMLDivElement | null

  document.getElementById('provider-badge')!.textContent =
    `Provider: ${prefs.providerFirstName} ${prefs.providerLastName}`

  const emptyState = document.getElementById('empty-state')!
  const intakeInfo = document.getElementById('intake-info')!

  if (saveManualBtn) saveManualBtn.style.display = isSessionMode ? 'none' : 'block'
  if (soapBtn) soapBtn.style.display = isSessionMode ? 'block' : 'none'
  const diagSessionBtn = document.getElementById('btn-open-diagnostics-session') as HTMLButtonElement | null
  if (diagSessionBtn) diagSessionBtn.style.display = isSessionMode ? 'block' : 'none'
  if (draftBtn) {
    draftBtn.textContent = isSessionMode
      ? (soapDraft ? 'Regenerate SOAP Draft' : 'Generate SOAP Draft')
      : (note ? 'Regenerate Draft' : 'Generate Draft')
  }

  if (treatmentPlanSection && treatmentPlanContent) {
    treatmentPlanSection.style.display = isSessionMode ? 'block' : 'none'
    treatmentPlanContent.textContent = isSessionMode ? buildTreatmentPlanPreview(treatmentPlan) : ''
  }

  if (soapPreviewSection && soapPreviewContent) {
    const showSoapPreview = isSessionMode && !!soapDraft
    soapPreviewSection.style.display = showSoapPreview ? 'block' : 'none'
    soapPreviewContent.textContent = showSoapPreview ? buildSoapPreview(soapDraft) : ''
  }

  if (isSessionMode && manualNotesInput) {
    const sessionNotes = await getSessionNotes(apptCtx.apptId)
    if (sessionNotes?.notes && !manualNotesInput.dataset.userEdited) {
      manualNotesInput.value = sessionNotes.notes
    } else if (soapDraft?.sessionNotes && !manualNotesInput.dataset.userEdited) {
      manualNotesInput.value = soapDraft.sessionNotes
    }
    if (manualNotesHint) {
      manualNotesHint.textContent =
        'Paste follow-up session notes here. "Save Notes for SOAP" will save them, generate a SOAP draft from the captured treatment plan, and auto-fill the SOAP form if it is open.'
    }
  } else if (manualNotesHint) {
    manualNotesHint.textContent =
      intake
        ? 'Paste your own notes here to augment the captured intake, diagnostics, and draft note.'
        : 'Paste your own notes here to create a manual intake when SimplePractice intake data is not available.'
  }

  if (!intake && !isSessionMode) {
    emptyState.style.display = 'block'
    intakeInfo.style.display = 'none'
    if (manualNotesInput && !manualNotesInput.dataset.userEdited) {
      manualNotesInput.value = ''
    }
    return
  }

  emptyState.style.display = 'none'

  if (isSessionMode && !intake) {
    intakeInfo.style.display = 'none'
    return
  }

  emptyState.style.display = 'none'
  intakeInfo.style.display = 'flex'

  document.getElementById('client-name')!.textContent =
    `${intake.firstName} ${intake.lastName}`.trim() || 'Client'

  const metaParts: string[] = []
  if (intake.insuranceCompany) metaParts.push(intake.insuranceCompany)
  if (intake.capturedAt) {
    const formattedCapturedAt = formatDate(intake.capturedAt)
    if (formattedCapturedAt) metaParts.push(`Captured ${formattedCapturedAt}`)
  }
  document.getElementById('client-meta')!.textContent = metaParts.join(' \u00B7 ')

  // Checklist
  updateCheckItem('check-intake', true)
  updateCheckItem('check-note-gen', note?.status?.noteGenerated ?? false)
  updateCheckItem('check-note-review', note?.status?.noteReviewed ?? false)
  updateCheckItem('check-note-submit', note?.status?.noteSubmitted ?? false)

  // Intake fields
  renderIntakeFields(intake)
  if (!isSessionMode && manualNotesInput && !manualNotesInput.dataset.userEdited) {
    manualNotesInput.value = intake.manualNotes
  }

  // Note preview
  const notePreview = document.getElementById('note-preview')!
  const noteContent = document.getElementById('note-content')!
  if (!isSessionMode && note) {
    notePreview.style.display = 'block'
    noteContent.textContent = buildNotePreview(note) || 'Draft generated from intake data.'
  } else {
    notePreview.style.display = 'none'
  }
}

document.getElementById('manual-notes-input')?.addEventListener('input', (event) => {
  const target = event.currentTarget as HTMLTextAreaElement | null
  if (!target) return
  target.dataset.userEdited = '1'
})

// Toggle floating buttons on page
const toggleBtn = document.getElementById('btn-toggle-btns')!
toggleBtn.addEventListener('click', async () => {
  const tabId = await getActiveTabId()
  if (!tabId) return

  const response = await sendTabMessage<{ visible: boolean }>(tabId, {
    type: 'toggle-floating-buttons',
  })
  setToggleButtonState(response?.visible ?? true)
})

// Settings toggle
document.getElementById('btn-settings')?.addEventListener('click', async () => {
  await populateSettingsForm()
  showView('settings')
})

document.getElementById('btn-save-prefs')?.addEventListener('click', async () => {
  const prefs = readSettingsForm()
  await savePreferences(prefs)
  showView('main')
  render()
})

document.getElementById('btn-cancel-prefs')?.addEventListener('click', () => {
  showView('main')
  render()
})

document.getElementById('btn-clear')?.addEventListener('click', async () => {
  await clearAll()
  setStatus('', 'neutral')
  render()
})

document.getElementById('btn-save-manual-notes')?.addEventListener('click', async () => {
  const intake = await getIntake()

  const input = document.getElementById('manual-notes-input') as HTMLTextAreaElement | null
  const manualNotes = input?.value.replace(/\r\n/g, '\n').trim() ?? ''
  if (!intake && !manualNotes) return

  await mergeIntake({
    manualNotes,
    capturedAt: intake?.capturedAt || new Date().toISOString(),
  })
  if (input) delete input.dataset.userEdited
  setStatus('Intake notes saved.', 'success')
  render()
})

document.getElementById('btn-save-session-notes')?.addEventListener('click', async () => {
  const ctx = await detectApptContext()
  if (!ctx.isAppt) {
    setStatus('Open an appointment page first.', 'error')
    return
  }
  const input = document.getElementById('manual-notes-input') as HTMLTextAreaElement | null
  const notes = input?.value.replace(/\r\n/g, '\n').trim() ?? ''
  const transcript = await getTranscript(ctx.apptId)
  if (!notes && !transcript?.entries.length) {
    setStatus('Type session notes or enable captions first.', 'error')
    return
  }
  if (notes) {
    await saveSessionNotes({ apptId: ctx.apptId, notes, updatedAt: new Date().toISOString() })
  }

  const { draft, error } = await generateSoapDraftForAppointment(ctx.apptId, notes)
  if (!draft) {
    if (input) delete input.dataset.userEdited
    setStatus(`Session notes saved. ${error ?? 'Failed to generate SOAP draft.'}`, 'error')
    await render()
    return
  }

  const tabId = await getActiveTabId()
  const fillResponse = tabId
    ? await sendTabMessage<{ ok?: boolean; filled?: number; error?: string }>(tabId, {
        type: 'SPN_FILL_SOAP_DRAFT',
        draft,
      })
    : null

  if (input) delete input.dataset.userEdited

  const suffix = error ?? ''
  if (fillResponse?.ok) {
    setStatus(`Session notes saved, SOAP draft generated, and SOAP fields filled.${suffix}`, 'success')
  } else if (fillResponse?.error) {
    setStatus(`Session notes saved and SOAP draft generated. ${fillResponse.error}${suffix}`, 'neutral')
  } else {
    setStatus(`Session notes saved and SOAP draft generated. Open the SOAP progress note form to fill automatically.${suffix}`, 'neutral')
  }

  await render()
})

async function openDiagnosticsSidePanel(): Promise<void> {
  const tab = await getActiveTab()
  if (!tab?.id || !chrome.sidePanel) return

  await chrome.sidePanel.setOptions({
    tabId: tab.id,
    path: 'sidepanel/sidepanel.html',
    enabled: true,
  })
  await chrome.sidePanel.open({ tabId: tab.id })
  window.close()
}

document.getElementById('btn-open-diagnostics')?.addEventListener('click', openDiagnosticsSidePanel)
document.getElementById('btn-open-diagnostics-session')?.addEventListener('click', openDiagnosticsSidePanel)

document.getElementById('btn-generate-draft')?.addEventListener('click', async () => {
  const apptCtx = await detectApptContext()
  if (apptCtx.isAppt) {
    const input = document.getElementById('manual-notes-input') as HTMLTextAreaElement | null
    const notes = input?.value.replace(/\r\n/g, '\n').trim() ?? ''
    const transcript = await getTranscript(apptCtx.apptId)
    if (!notes && !transcript?.entries.length) {
      setStatus('Type session notes or enable captions first.', 'error')
      return
    }

    if (notes) {
      await saveSessionNotes({ apptId: apptCtx.apptId, notes, updatedAt: new Date().toISOString() })
    }
    const { draft, error } = await generateSoapDraftForAppointment(apptCtx.apptId, notes)
    if (!draft) {
      setStatus(error ?? 'Failed to generate SOAP draft.', 'error')
      return
    }

    if (input) delete input.dataset.userEdited
    setStatus('SOAP draft generated. Open the side panel to review and edit it.', 'success')
    await render()
    return
  }

  const intake = await getIntake()
  if (!intake) {
    render()
    return
  }

  const prefs = await getPreferences()
  const existingNote = await getNote()
  const note = await buildDraftNote(intake, prefs, existingNote?.diagnosticImpressions ?? [])
  await saveNote(note)
  setStatus('Intake draft generated.', 'success')
  render()
})

chrome.storage.onChanged.addListener(() => render())

async function init(): Promise<void> {
  const hasPrefs = await hasPreferences()
  await syncToggleButtonState()
  if (!hasPrefs) {
    await populateSettingsForm()
    showView('settings')
  } else {
    render()
  }
}

init()
