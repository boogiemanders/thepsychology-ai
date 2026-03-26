import { CapturedClient } from '../lib/types'
import { getClient, clearClient, updateStatus } from '../lib/storage'
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
    if (icon) icon.textContent = '✓'
  } else {
    el.classList.remove('done')
    if (icon) icon.textContent = '○'
  }
}

async function render(): Promise<void> {
  const client = await getClient()

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
  document.getElementById('client-meta')!.textContent = metaParts.join(' · ')

  updateCheckItem('check-client', client.status.clientCreated)
  updateCheckItem('check-appointment', client.status.appointmentSet)
  updateCheckItem('check-insurance', client.status.insuranceAdded)
  updateCheckItem('check-vob', client.status.vobEmailSent)
}

document.getElementById('btn-vob')?.addEventListener('click', async () => {
  const client = await getClient()
  if (!client) return
  openVobEmail(client)
  await updateStatus({ vobEmailSent: true })
  render()
})

document.getElementById('btn-clear')?.addEventListener('click', async () => {
  await clearClient()
  render()
})

// Listen for storage changes (when content script captures data)
chrome.storage.onChanged.addListener(() => render())

// Initial render
render()
