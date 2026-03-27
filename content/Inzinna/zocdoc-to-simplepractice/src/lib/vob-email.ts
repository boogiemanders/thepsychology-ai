import { CapturedClient } from './types'

const VOB_TO = ['david@sosapartners.com', 'support@sosapartners.com']
const VOB_CC = ['greg@drinzinna.com', 'carlos@drinzinna.com']

const SIGNATURE = `Regards,
Anders

Anders H. Chan, PsyD (he/him)
Postdoctoral Fellow
DrAnders@DrInzinna.com
1-516-226-0379`

function abbreviateName(name: string): string {
  return name.trim().substring(0, 3)
}

function formatTimeShort(time: string): string {
  // Input like "9:00 AM", "2:30 PM", "10:00 AM"
  const match = time.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM|am|pm|a|p)?/i)
  if (!match) return time

  const hour = match[1]
  const ampm = (match[3] || '').toLowerCase()
  const suffix = ampm.startsWith('p') ? 'p' : ampm.startsWith('a') ? 'a' : ''
  return `${hour}${suffix}`
}

function formatDateShort(dateStr: string): string {
  if (!dateStr) return ''

  // Try ISO format "2026-05-27"
  const isoMatch = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (isoMatch) {
    return `${parseInt(isoMatch[2], 10)}/${parseInt(isoMatch[3], 10)}`
  }

  // Try "Mar 30, 2026" or "Mar 30"
  const monthNames: Record<string, number> = {
    jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
    jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
  }
  const namedMatch = dateStr.match(/([A-Za-z]+)\s+(\d{1,2})/)
  if (namedMatch) {
    const month = monthNames[namedMatch[1].toLowerCase().substring(0, 3)]
    const day = parseInt(namedMatch[2], 10)
    if (month && day) return `${month}/${day}`
  }

  // Try MM/DD/YYYY or M/D
  const slashMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})/)
  if (slashMatch) {
    return `${parseInt(slashMatch[1], 10)}/${parseInt(slashMatch[2], 10)}`
  }

  return dateStr
}

export function buildVobSubject(client: CapturedClient): string {
  const first3 = abbreviateName(client.firstName)
  const last3 = abbreviateName(client.lastName)
  return `VOB – Inzinna - ${first3} ${last3}`
}

export function buildVobBody(client: CapturedClient): string {
  const first3 = abbreviateName(client.firstName)
  const last3 = abbreviateName(client.lastName)
  const date = formatDateShort(client.appointmentDate)
  const time = formatTimeShort(client.appointmentTime)

  return `Hello,

New pt submitted:

${first3} ${last3} ${date} ${time}

${SIGNATURE}`
}

export function openVobEmail(client: CapturedClient): void {
  const subject = encodeURIComponent(buildVobSubject(client))
  const body = encodeURIComponent(buildVobBody(client))
  const to = VOB_TO.join(',')
  const cc = VOB_CC.join(',')

  // Try Gmail compose first, falls back to mailto
  const gmailUrl = `https://mail.google.com/mail/?view=cm&to=${to}&cc=${cc}&su=${subject}&body=${body}`
  window.open(gmailUrl, '_blank')
}
