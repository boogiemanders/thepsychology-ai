type SendEmailArgs = {
  subject: string
  text: string
  html?: string
  to?: string | string[]
}

const RESEND_API_KEY = process.env.RESEND_API_KEY
const NOTIFY_EMAIL_TO = process.env.NOTIFY_EMAIL_TO
const NOTIFY_EMAIL_FROM = process.env.NOTIFY_EMAIL_FROM

const RESEND_ENDPOINT = 'https://api.resend.com/emails'

export function isNotificationEmailConfigured(toOverride?: string | string[]): boolean {
  const resolvedTo = toOverride ?? NOTIFY_EMAIL_TO
  return Boolean(RESEND_API_KEY && resolvedTo && NOTIFY_EMAIL_FROM)
}

export async function sendNotificationEmail({ subject, text, html, to }: SendEmailArgs): Promise<void> {
  const resolvedTo = to ?? NOTIFY_EMAIL_TO

  if (!RESEND_API_KEY || !resolvedTo || !NOTIFY_EMAIL_FROM) {
    throw new Error('Email configuration missing (RESEND_API_KEY / NOTIFY_EMAIL_FROM / NOTIFY_EMAIL_TO)')
  }

  const toList = Array.isArray(resolvedTo) ? resolvedTo : [resolvedTo]

  const response = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: NOTIFY_EMAIL_FROM,
      to: toList,
      subject,
      text,
      html: html || text.replace(/\n/g, '<br/>'),
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Resend returned ${response.status}: ${body}`)
  }
}
