import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { sendNotificationEmail } from '@/lib/notify-email'
import { sendSlackNotification, SlackChannel } from '@/lib/notify-slack'
import { getSupabaseClient } from '@/lib/supabase-server'

type SupabaseWebhookPayload = {
  type?: string
  table?: string
  schema?: string
  record?: Record<string, unknown> | null
  old_record?: Record<string, unknown> | null
}

const WEBHOOK_SECRET = process.env.SUPABASE_WEBHOOK_SECRET

const asNonEmptyString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const plusSevenDaysIso = (baseIso: string) => {
  const baseDate = new Date(baseIso)
  if (Number.isNaN(baseDate.getTime())) {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  }
  baseDate.setUTCDate(baseDate.getUTCDate() + 7)
  return baseDate.toISOString()
}

async function repairIncompleteSignupRecord(
  payload: SupabaseWebhookPayload
): Promise<Record<string, unknown> | null> {
  if (payload.table !== 'users' || payload.type !== 'INSERT') return null
  if (!payload.record || typeof payload.record !== 'object') return null

  const record = payload.record
  const userId = asNonEmptyString(record.id)
  if (!userId) return null

  // Never touch Stripe-backed accounts.
  const hasStripeCustomer = Boolean(asNonEmptyString(record.stripe_customer_id))
  if (hasStripeCustomer) return null

  const tier = asNonEmptyString(record.subscription_tier)
  const subscriptionStartedAt = asNonEmptyString(record.subscription_started_at)
  const trialEndsAt = asNonEmptyString(record.trial_ends_at)
  const referralSource = asNonEmptyString(record.referral_source)

  const needsRepair =
    tier !== 'pro' ||
    !subscriptionStartedAt ||
    !trialEndsAt ||
    !referralSource

  if (!needsRepair) return null

  const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
  if (!supabase) {
    console.warn('[supabase-webhook] Skipping signup repair: Supabase service client unavailable')
    return null
  }

  let metadata: Record<string, unknown> = {}
  let authCreatedAt: string | null = null

  try {
    const { data: adminUser, error: adminUserError } = await supabase.auth.admin.getUserById(userId)
    if (!adminUserError && adminUser?.user) {
      metadata = (adminUser.user.user_metadata || {}) as Record<string, unknown>
      authCreatedAt = asNonEmptyString(adminUser.user.created_at)
    } else if (adminUserError) {
      console.warn('[supabase-webhook] Failed to load auth metadata for signup repair:', adminUserError)
    }
  } catch (error) {
    console.warn('[supabase-webhook] Unexpected metadata lookup error during signup repair:', error)
  }

  const derivedCreatedAt =
    subscriptionStartedAt ||
    authCreatedAt ||
    asNonEmptyString(record.created_at) ||
    new Date().toISOString()

  const updateData: Record<string, unknown> = {}

  if (tier !== 'pro') updateData.subscription_tier = 'pro'
  if (!subscriptionStartedAt) updateData.subscription_started_at = derivedCreatedAt
  if (!trialEndsAt) updateData.trial_ends_at = plusSevenDaysIso(derivedCreatedAt)

  if (!referralSource) {
    const metadataReferral = asNonEmptyString(metadata.referral_source)
    if (metadataReferral) updateData.referral_source = metadataReferral
  }

  if (!asNonEmptyString(record.full_name)) {
    const metadataFullName = asNonEmptyString(metadata.full_name)
    if (metadataFullName) updateData.full_name = metadataFullName
  }

  if (!asNonEmptyString(record.utm_source)) {
    const metadataValue = asNonEmptyString(metadata.utm_source)
    if (metadataValue) updateData.utm_source = metadataValue
  }
  if (!asNonEmptyString(record.utm_medium)) {
    const metadataValue = asNonEmptyString(metadata.utm_medium)
    if (metadataValue) updateData.utm_medium = metadataValue
  }
  if (!asNonEmptyString(record.utm_campaign)) {
    const metadataValue = asNonEmptyString(metadata.utm_campaign)
    if (metadataValue) updateData.utm_campaign = metadataValue
  }
  if (!asNonEmptyString(record.utm_content)) {
    const metadataValue = asNonEmptyString(metadata.utm_content)
    if (metadataValue) updateData.utm_content = metadataValue
  }
  if (!asNonEmptyString(record.utm_term)) {
    const metadataValue = asNonEmptyString(metadata.utm_term)
    if (metadataValue) updateData.utm_term = metadataValue
  }

  if (Object.keys(updateData).length === 0) return null

  const { data: updatedUser, error: updateError } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', userId)
    .select('*')
    .maybeSingle()

  if (updateError) {
    console.warn('[supabase-webhook] Failed to repair incomplete signup row:', {
      userId,
      updateError,
      attemptedFields: Object.keys(updateData),
    })
    return null
  }

  if (updatedUser) {
    console.log('[supabase-webhook] Repaired incomplete signup row', {
      userId,
      repairedFields: Object.keys(updateData),
    })
  }

  return updatedUser as Record<string, unknown> | null
}

const formatTimestamp = (value?: unknown) => {
  if (!value || typeof value !== 'string') return 'unknown'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('en-US', { timeZone: 'America/New_York', timeZoneName: 'short' })
}

const buildSlackMessage = (payload: SupabaseWebhookPayload): { message: string; channel: SlackChannel } | null => {
  const { table, record } = payload
  if (!record || typeof record !== 'object') return null

  if (table === 'feedback') {
    const pagePath = (record.page_path as string) || 'Unknown page'
    const isAnonymous = Boolean(record.is_anonymous)
    return {
      message: `📝 New feedback submitted on ${pagePath}${isAnonymous ? ' (anonymous)' : ''}`,
      channel: 'feedback',
    }
  }

  if (table === 'users') {
    const email = (record.email as string) || 'Unknown'
    const device = (record.signup_device as string) || 'unknown'
    const referral = (record.referral_source as string) || 'direct'
    return {
      message: `🎉 New signup: ${email} (${device}, via ${referral})`,
      channel: 'signups',
    }
  }

  return null
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
    const rawDevice = (record.signup_device as string | null | undefined) ?? 'unknown'
    const signupDevice =
      rawDevice === 'desktop' ? 'laptop/desktop' : rawDevice === 'phone' ? 'phone' : 'unknown'
    const textLines = [
      `New user profile created`,
      `- Time: ${formatTimestamp(record.created_at)}`,
      `- Device: ${signupDevice}`,
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
          <li><strong>Device:</strong> ${signupDevice}</li>
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

export async function POST(request: NextRequest) {
  if (!WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'SUPABASE_WEBHOOK_SECRET is not configured' },
      { status: 500 },
    )
  }

  // Use timing-safe comparison to prevent timing attacks
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.replace('Bearer ', '').trim()

  try {
    const tokenBuffer = Buffer.from(token)
    const secretBuffer = Buffer.from(WEBHOOK_SECRET)

    // Timing-safe comparison requires equal length buffers
    if (tokenBuffer.length !== secretBuffer.length || !timingSafeEqual(tokenBuffer, secretBuffer)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  } catch {
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

  if (payload.table === 'users') {
    const repairedRecord = await repairIncompleteSignupRecord(payload)
    if (repairedRecord && payload.record && typeof payload.record === 'object') {
      payload.record = { ...payload.record, ...repairedRecord }
    }
  }

  const emailPayload = buildEmailPayload(payload)
  const slackMessage = buildSlackMessage(payload)

  if (!emailPayload && !slackMessage) {
    return NextResponse.json({ ignored: true, reason: 'No handler for this table' })
  }

  const results: { email?: boolean; slack?: boolean } = {}

  if (emailPayload) {
    try {
      await sendNotificationEmail({
        subject: emailPayload.subject,
        text: emailPayload.text,
        html: emailPayload.html,
      })
      results.email = true
    } catch (error) {
      console.error('Failed to send notification email', error)
      results.email = false
    }
  }

  if (slackMessage) {
    try {
      await sendSlackNotification(slackMessage.message, slackMessage.channel)
      results.slack = true
    } catch (error) {
      console.error('Failed to send Slack notification', error)
      results.slack = false
    }
  }

  return NextResponse.json({ success: true, results })
}
