import { getClient, clearClient, updateStatus, getPreferences, savePreferences, hasPreferences } from '../lib/storage'
import { ProviderPreferences } from '../lib/types'
import { openVobEmail } from '../lib/vob-email'

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
  const clientInfo = document.getElementById('client-info')!
  const settingsPanel = document.getElementById('settings-panel')!

  if (view === 'settings') {
    emptyState.style.display = 'none'
    clientInfo.style.display = 'none'
    settingsPanel.style.display = 'flex'
  } else {
    settingsPanel.style.display = 'none'
    // main view render handles empty/client visibility
  }
}

async function populateSettingsForm(): Promise<void> {
  const prefs = await getPreferences()
  ;(document.getElementById('pref-firstName') as HTMLInputElement).value = prefs.providerFirstName
  ;(document.getElementById('pref-lastName') as HTMLInputElement).value = prefs.providerLastName
  ;(document.getElementById('pref-location') as HTMLSelectElement).value = prefs.defaultLocation
  ;(document.getElementById('pref-firstCPT') as HTMLInputElement).value = prefs.firstVisitCPT
  ;(document.getElementById('pref-followUpCPT') as HTMLInputElement).value = prefs.followUpCPT
  ;(document.getElementById('pref-vobTo') as HTMLInputElement).value = prefs.vobTo.join(', ')
  ;(document.getElementById('pref-vobCc') as HTMLInputElement).value = prefs.vobCc.join(', ')
  ;(document.getElementById('pref-signature') as HTMLTextAreaElement).value = prefs.vobSignature
}

function readSettingsForm(): ProviderPreferences {
  return {
    providerFirstName: (document.getElementById('pref-firstName') as HTMLInputElement).value.trim(),
    providerLastName: (document.getElementById('pref-lastName') as HTMLInputElement).value.trim(),
    defaultLocation: (document.getElementById('pref-location') as HTMLSelectElement).value,
    firstVisitCPT: (document.getElementById('pref-firstCPT') as HTMLInputElement).value.trim(),
    followUpCPT: (document.getElementById('pref-followUpCPT') as HTMLInputElement).value.trim(),
    vobTo: (document.getElementById('pref-vobTo') as HTMLInputElement).value.split(',').map(s => s.trim()).filter(Boolean),
    vobCc: (document.getElementById('pref-vobCc') as HTMLInputElement).value.split(',').map(s => s.trim()).filter(Boolean),
    vobSignature: (document.getElementById('pref-signature') as HTMLTextAreaElement).value,
  }
}

async function render(): Promise<void> {
  const client = await getClient()
  const prefs = await getPreferences()

  // Provider badge
  document.getElementById('provider-badge')!.textContent =
    `Provider: ${prefs.providerFirstName} ${prefs.providerLastName}`

  const emptyState = document.getElementById('empty-state')!
  const clientInfo = document.getElementById('client-info')!

  if (!client) {
    emptyState.style.display = 'block'
    clientInfo.style.display = 'none'
    return
  }

  emptyState.style.display = 'none'
  clientInfo.style.display = 'flex'

  document.getElementById('client-name')!.textContent =
    `${client.firstName} ${client.lastName}`

  const metaParts: string[] = []
  if (client.insuranceCompany) metaParts.push(client.insuranceCompany)
  if (client.appointmentDate) metaParts.push(client.appointmentDate)
  metaParts.push(`Captured ${formatDate(client.capturedAt)}`)
  document.getElementById('client-meta')!.textContent = metaParts.join(' \u00B7 ')

  updateCheckItem('check-client', client.status.clientCreated)
  updateCheckItem('check-appointment', client.status.appointmentSet)
  updateCheckItem('check-insurance', client.status.insuranceAdded)
  updateCheckItem('check-vob', client.status.vobEmailSent)
}

// Settings toggle
document.getElementById('btn-settings')?.addEventListener('click', async () => {
  await populateSettingsForm()
  showView('settings')
})

// Save preferences
document.getElementById('btn-save-prefs')?.addEventListener('click', async () => {
  const prefs = readSettingsForm()
  await savePreferences(prefs)
  showView('main')
  render()
})

// Cancel settings
document.getElementById('btn-cancel-prefs')?.addEventListener('click', () => {
  showView('main')
  render()
})

// VOB email
document.getElementById('btn-vob')?.addEventListener('click', async () => {
  const client = await getClient()
  if (!client) return
  await openVobEmail(client)
  await updateStatus({ vobEmailSent: true })
  render()
})

// Clear
document.getElementById('btn-clear')?.addEventListener('click', async () => {
  await clearClient()
  render()
})

// Listen for storage changes
chrome.storage.onChanged.addListener(() => render())

// Initial load — show settings on first use
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
