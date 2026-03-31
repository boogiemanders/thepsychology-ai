import { getIntake, getNote, saveNote, clearAll, getPreferences, savePreferences, hasPreferences, mergeIntake } from '../lib/storage'
import { IntakeData, ProviderPreferences, DEFAULT_PREFERENCES } from '../lib/types'
import { buildDraftNote } from '../lib/note-draft'

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

  if (view === 'settings') {
    emptyState.style.display = 'none'
    intakeInfo.style.display = 'none'
    manualNotesSection.style.display = 'none'
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
  const prefs = await getPreferences()
  const draftBtn = document.getElementById('btn-generate-draft') as HTMLButtonElement | null
  const manualNotesInput = document.getElementById('manual-notes-input') as HTMLTextAreaElement | null
  const manualNotesHint = document.getElementById('manual-notes-hint') as HTMLParagraphElement | null

  document.getElementById('provider-badge')!.textContent =
    `Provider: ${prefs.providerFirstName} ${prefs.providerLastName}`

  const emptyState = document.getElementById('empty-state')!
  const intakeInfo = document.getElementById('intake-info')!

  if (!intake) {
    emptyState.style.display = 'block'
    intakeInfo.style.display = 'none'
    if (manualNotesInput) manualNotesInput.value = ''
    if (manualNotesHint) {
      manualNotesHint.textContent =
        'Paste your own notes here to create a manual intake when SimplePractice intake data is not available.'
    }
    if (draftBtn) draftBtn.textContent = 'Generate Draft'
    return
  }

  emptyState.style.display = 'none'
  intakeInfo.style.display = 'flex'
  if (manualNotesHint) {
    manualNotesHint.textContent =
      'Paste your own notes here to augment the captured intake, diagnostics, and draft note.'
  }

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
  if (manualNotesInput) manualNotesInput.value = intake.manualNotes
  if (draftBtn) draftBtn.textContent = note ? 'Regenerate Draft' : 'Generate Draft'

  // Note preview
  const notePreview = document.getElementById('note-preview')!
  const noteContent = document.getElementById('note-content')!
  if (note) {
    notePreview.style.display = 'block'
    noteContent.textContent = buildNotePreview(note) || 'Draft generated from intake data.'
  } else {
    notePreview.style.display = 'none'
  }
}

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
  render()
})

document.getElementById('btn-open-diagnostics')?.addEventListener('click', async () => {
  const tab = await getActiveTab()
  if (!tab?.id || !chrome.sidePanel) return

  await chrome.sidePanel.setOptions({
    tabId: tab.id,
    path: 'sidepanel/sidepanel.html',
    enabled: true,
  })
  await chrome.sidePanel.open({ tabId: tab.id })
  window.close()
})

document.getElementById('btn-generate-draft')?.addEventListener('click', async () => {
  const intake = await getIntake()
  if (!intake) {
    render()
    return
  }

  const prefs = await getPreferences()
  const existingNote = await getNote()
  const note = await buildDraftNote(intake, prefs, existingNote?.diagnosticImpressions ?? [])
  await saveNote(note)
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
