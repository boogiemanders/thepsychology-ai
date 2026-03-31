import { getClient, clearClient, updateStatus, getPreferences, savePreferences, hasPreferences } from '../lib/storage'
import { ProviderPreferences, DEFAULT_PREFERENCES } from '../lib/types'
import { openVobEmail } from '../lib/vob-email'
import { isLicenseValid, validateAndSaveLicense, submitFeedback } from '../lib/license'

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

function showView(view: 'main' | 'settings' | 'license' | 'feedback'): void {
  // Hide all overlay panels
  document.getElementById('settings-panel')!.style.display = 'none'
  document.getElementById('license-gate')!.style.display = 'none'
  document.getElementById('feedback-panel')!.style.display = 'none'

  if (view === 'settings') {
    document.getElementById('empty-state')!.style.display = 'none'
    document.getElementById('client-info')!.style.display = 'none'
    document.getElementById('settings-panel')!.style.display = 'flex'
  } else if (view === 'license') {
    document.getElementById('empty-state')!.style.display = 'none'
    document.getElementById('client-info')!.style.display = 'none'
    document.getElementById('license-gate')!.style.display = 'flex'
  } else if (view === 'feedback') {
    document.getElementById('empty-state')!.style.display = 'none'
    document.getElementById('client-info')!.style.display = 'none'
    document.getElementById('feedback-panel')!.style.display = 'flex'
  }
  // For 'main': all panels hidden, render() controls empty/client visibility
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
    firstVisitCPT: (document.getElementById('pref-firstCPT') as HTMLInputElement).value.trim() || DEFAULT_PREFERENCES.firstVisitCPT,
    followUpCPT: (document.getElementById('pref-followUpCPT') as HTMLInputElement).value.trim() || DEFAULT_PREFERENCES.followUpCPT,
    vobTo: (document.getElementById('pref-vobTo') as HTMLInputElement).value.split(',').map(s => s.trim()).filter(Boolean),
    vobCc: (document.getElementById('pref-vobCc') as HTMLInputElement).value.split(',').map(s => s.trim()).filter(Boolean),
    vobSignature: (document.getElementById('pref-signature') as HTMLTextAreaElement).value,
  }
}

async function render(): Promise<void> {
  const licenseValid = await isLicenseValid()
  if (!licenseValid) {
    showView('license')
    return
  }

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

// Toggle floating buttons on page
const toggleBtn = document.getElementById('btn-toggle-btns')!
toggleBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab?.id) return
  chrome.tabs.sendMessage(tab.id, { type: 'toggle-floating-buttons' }, (response) => {
    const nowVisible = response?.visible ?? true
    toggleBtn.textContent = nowVisible ? '\u{1F441}' : '\u{1F6AB}'
    toggleBtn.title = nowVisible ? 'Hide page buttons' : 'Show page buttons'
  })
})

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

// License gate: activate button
document.getElementById('btn-activate')?.addEventListener('click', async () => {
  const input = document.getElementById('license-key-input') as HTMLInputElement
  const errorEl = document.getElementById('license-error')!
  const btn = document.getElementById('btn-activate') as HTMLButtonElement

  btn.disabled = true
  btn.textContent = 'Checking...'
  errorEl.style.display = 'none'

  const result = await validateAndSaveLicense(input.value)

  if (result.valid) {
    showView('main')
    render()
  } else {
    errorEl.textContent = result.error ?? 'Invalid license key.'
    errorEl.style.display = 'block'
    btn.disabled = false
    btn.textContent = 'Activate'
  }
})

// Feedback button (footer)
document.getElementById('btn-feedback')?.addEventListener('click', () => {
  const statusEl = document.getElementById('feedback-status')!
  statusEl.style.display = 'none'
  ;(document.getElementById('feedback-message') as HTMLTextAreaElement).value = ''
  showView('feedback')
})

// Feedback submit
document.getElementById('btn-feedback-submit')?.addEventListener('click', async () => {
  const category = (document.getElementById('feedback-category') as HTMLSelectElement).value
  const message = (document.getElementById('feedback-message') as HTMLTextAreaElement).value.trim()
  const statusEl = document.getElementById('feedback-status')!
  const btn = document.getElementById('btn-feedback-submit') as HTMLButtonElement

  if (!message) {
    statusEl.textContent = 'Please enter a message.'
    statusEl.className = 'feedback-status feedback-error'
    statusEl.style.display = 'block'
    return
  }

  btn.disabled = true
  btn.textContent = 'Sending...'
  statusEl.style.display = 'none'

  try {
    const { version } = chrome.runtime.getManifest()
    await submitFeedback('ZocDoc to SimplePractice', version, category, message)
    statusEl.textContent = 'Thanks! We\'ll review your feedback.'
    statusEl.className = 'feedback-status feedback-success'
    statusEl.style.display = 'block'
    btn.textContent = 'Sent'
    setTimeout(() => {
      showView('main')
      render()
    }, 1500)
  } catch {
    statusEl.textContent = 'Failed to send. Please try again.'
    statusEl.className = 'feedback-status feedback-error'
    statusEl.style.display = 'block'
    btn.disabled = false
    btn.textContent = 'Send'
  }
})

// Feedback cancel
document.getElementById('btn-feedback-cancel')?.addEventListener('click', () => {
  showView('main')
  render()
})

// Listen for storage changes
chrome.storage.onChanged.addListener(() => render())

// Initial load — show settings on first use
async function init(): Promise<void> {
  const licenseValid = await isLicenseValid()
  if (!licenseValid) {
    showView('license')
    return
  }

  const hasPrefs = await hasPreferences()
  if (!hasPrefs) {
    await populateSettingsForm()
    showView('settings')
  } else {
    render()
  }
}

init()
