import { getIntake, getNote, clearAll, getPreferences, savePreferences, hasPreferences } from '../lib/storage'
import { IntakeData, ProviderPreferences, DEFAULT_PREFERENCES } from '../lib/types'

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
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
  const settingsPanel = document.getElementById('settings-panel')!

  if (view === 'settings') {
    emptyState.style.display = 'none'
    intakeInfo.style.display = 'none'
    settingsPanel.style.display = 'flex'
  } else {
    settingsPanel.style.display = 'none'
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

  document.getElementById('provider-badge')!.textContent =
    `Provider: ${prefs.providerFirstName} ${prefs.providerLastName}`

  const emptyState = document.getElementById('empty-state')!
  const intakeInfo = document.getElementById('intake-info')!

  if (!intake) {
    emptyState.style.display = 'block'
    intakeInfo.style.display = 'none'
    return
  }

  emptyState.style.display = 'none'
  intakeInfo.style.display = 'flex'

  document.getElementById('client-name')!.textContent =
    `${intake.firstName} ${intake.lastName}`.trim() || 'Client'

  const metaParts: string[] = []
  if (intake.insuranceCompany) metaParts.push(intake.insuranceCompany)
  metaParts.push(`Captured ${formatDate(intake.capturedAt)}`)
  document.getElementById('client-meta')!.textContent = metaParts.join(' \u00B7 ')

  // Checklist
  updateCheckItem('check-intake', true)
  updateCheckItem('check-note-gen', note?.status?.noteGenerated ?? false)
  updateCheckItem('check-note-review', note?.status?.noteReviewed ?? false)
  updateCheckItem('check-note-submit', note?.status?.noteSubmitted ?? false)

  // Intake fields
  renderIntakeFields(intake)

  // Note preview
  const notePreview = document.getElementById('note-preview')!
  const noteContent = document.getElementById('note-content')!
  if (note) {
    notePreview.style.display = 'block'
    const sections: string[] = []
    if (note.chiefComplaint) sections.push(`CC: ${note.chiefComplaint}`)
    if (note.diagnosticImpressions.length) {
      sections.push(`Dx: ${note.diagnosticImpressions.map(d => `${d.name} (${d.code})`).join(', ')}`)
    }
    if (note.plan) sections.push(`Plan: ${note.plan}`)
    noteContent.textContent = sections.join('\n\n') || 'Note generated — click "Fill Note" on the SP notes page'
  } else {
    notePreview.style.display = 'none'
  }
}

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

chrome.storage.onChanged.addListener(() => render())

async function init(): Promise<void> {
  const hasPrefs = await hasPreferences()
  if (!hasPrefs) {
    await populateSettingsForm()
    showView('settings')
  } else {
    render()
  }
}

init()
