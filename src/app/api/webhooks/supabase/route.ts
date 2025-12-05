import { NextRequest, NextResponse } from 'next/server'

type SupabaseWebhookPayload = {
  type?: string
  table?: string
  schema?: string
  record?: Record<string, unknown> | null
  old_record?: Record<string, unknown> | null
}

const WEBHOOK_SECRET = process.env.SUPABASE_WEBHOOK_SECRET
const RESEND_API_KEY = process.env.RESEND_API_KEY
const NOTIFY_EMAIL_TO = process.env.NOTIFY_EMAIL_TO
const NOTIFY_EMAIL_FROM = process.env.NOTIFY_EMAIL_FROM

const RESEND_ENDPOINT = 'https://api.resend.com/emails'

const formatTimestamp = (value?: unknown) => {
  if (!value || typeof value !== 'string') return 'unknown'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return `${date.toLocaleString('en-US', { timeZone: 'UTC' })} UTC`
}

const buildEmailPayload = (payload: SupabaseWebhookPayload) => {
  const { table, schema, record } = payload
  if (!record || typeof record !== 'object') return null

  if (table === 'feedback') {
    const email = (record.user_email as string) || 'Unknown email'
    const message = (record.message as string) || '[No message]'
    const pagePath = (record.page_path as string) || 'Unknown page'
    const screenshot = record.screenshot_path as string | null | undefined
    const isAnonymous = Boolean(record.is_anonymous)
    const status = (record.status as string) || 'new'
    const createdAt = formatTimestamp(record.created_at)

    const subject = `[Feedback] ${isAnonymous ? 'Anonymous' : email} @ ${pagePath}`
    const textLines = [
      `New feedback submitted`,
      `- Time: ${createdAt}`,
      `- Page: ${pagePath}`,
      `- Status: ${status}`,
      `- Anonymous: ${isAnonymous ? 'yes' : 'no'}`,
      `- User ID: ${(record.user_id as string | null | undefined) ?? 'none'}`,
      `- User email: ${isAnonymous ? 'hidden (anonymous)' : email}`,
      '',
      'Message:',
      message,
    ]

    if (screenshot) {
      textLines.push('', `Screenshot path: ${screenshot}`)
    }

    return {
      subject,
      text: textLines.join('\n'),
      html: `
        <p><strong>New feedback submitted</strong></p>
        <ul>
          <li><strong>Time:</strong> ${createdAt}</li>
          <li><strong>Page:</strong> ${pagePath}</li>
          <li><strong>Status:</strong> ${status}</li>
          <li><strong>Anonymous:</strong> ${isAnonymous ? 'yes' : 'no'}</li>
          <li><strong>User ID:</strong> ${(record.user_id as string | null | undefined) ?? 'none'}</li>
          <li><strong>User email:</strong> ${isAnonymous ? 'hidden (anonymous)' : email}</li>
        </ul>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br/>')}</p>
        ${screenshot ? `<p><strong>Screenshot path:</strong> ${screenshot}</p>` : ''}
      `,
    }
  }

  if (table === 'users') {
    const subject = `[Signup] ${(record.email as string) || 'New user'} (${schema || 'public'})`
    const textLines = [
      `New user profile created`,
      `- Time: ${formatTimestamp(record.created_at)}`,
      `- Email: ${(record.email as string) || 'unknown'}`,
      `- Full name: ${(record.full_name as string | null | undefined) ?? 'not provided'}`,
      `- Subscription tier: ${(record.subscription_tier as string | null | undefined) ?? 'unknown'}`,
      `- Referral source: ${(record.referral_source as string | null | undefined) ?? 'unknown'}`,
      `- Promo code: ${(record.promo_code_used as string | null | undefined) ?? 'none'}`,
      `- Stripe customer id: ${(record.stripe_customer_id as string | null | undefined) ?? 'none'}`,
      `- Exam date: ${(record.exam_date as string | null | undefined) ?? 'not set'}`,
      `- User ID: ${(record.id as string | null | undefined) ?? 'missing id'}`,
    ]

    return {
      subject,
      text: textLines.join('\n'),
      html: `
        <p><strong>New user profile created</strong></p>
        <ul>
          <li><strong>Time:</strong> ${formatTimestamp(record.created_at)}</li>
          <li><strong>Email:</strong> ${(record.email as string) || 'unknown'}</li>
          <li><strong>Full name:</strong> ${(record.full_name as string | null | undefined) ?? 'not provided'}</li>
          <li><strong>Subscription tier:</strong> ${(record.subscription_tier as string | null | undefined) ?? 'unknown'}</li>
          <li><strong>Referral source:</strong> ${(record.referral_source as string | null | undefined) ?? 'unknown'}</li>
          <li><strong>Promo code:</strong> ${(record.promo_code_used as string | null | undefined) ?? 'none'}</li>
          <li><strong>Stripe customer id:</strong> ${(record.stripe_customer_id as string | null | undefined) ?? 'none'}</li>
          <li><strong>Exam date:</strong> ${(record.exam_date as string | null | undefined) ?? 'not set'}</li>
          <li><strong>User ID:</strong> ${(record.id as string | null | undefined) ?? 'missing id'}</li>
        </ul>
      `,
    }
  }

  return null
}

const sendEmail = async (subject: string, text: string, html?: string) => {
  if (!RESEND_API_KEY || !NOTIFY_EMAIL_TO || !NOTIFY_EMAIL_FROM) {
    throw new Error('Email configuration missing (RESEND_API_KEY / NOTIFY_EMAIL_FROM / NOTIFY_EMAIL_TO)')
  }

  const response = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: NOTIFY_EMAIL_FROM,
      to: [NOTIFY_EMAIL_TO],
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

export async function POST(request: NextRequest) {
  if (!WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'SUPABASE_WEBHOOK_SECRET is not configured' },
      { status: 500 },
    )
  }

  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.replace('Bearer ', '').trim()
  if (token !== WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: SupabaseWebhookPayload
  try {
    payload = await request.json()
  } catch (error) {
    console.error('Failed to parse webhook payload', error)
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  if (payload.type !== 'INSERT') {
    return NextResponse.json({ ignored: true, reason: 'Only INSERT events are processed' })
  }

  const emailPayload = buildEmailPayload(payload)
  if (!emailPayload) {
    return NextResponse.json({ ignored: true, reason: 'No handler for this table' })
  }

  try {
    await sendEmail(emailPayload.subject, emailPayload.text, emailPayload.html)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to send notification email', error)
    return NextResponse.json(
      { error: 'Failed to send email notification' },
      { status: 500 },
    )
  }
}
