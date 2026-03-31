import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-server'
import { sendSlackNotification } from '@/lib/notify-slack'

export const dynamic = 'force-dynamic'

const CATEGORY_LABELS: Record<string, string> = {
  bug: '🐛 Bug Report',
  feature: '✨ Feature Request',
  question: '❓ Question',
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { licenseKey, extensionName, category, message, extensionVersion } =
    body as Record<string, unknown>

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 })
  }

  if (message.length > 1000) {
    return NextResponse.json({ error: 'Message too long (max 1000 characters)' }, { status: 400 })
  }

  // Look up user by license key to include attribution in Slack message
  let userInfo = 'Anonymous'
  if (licenseKey && typeof licenseKey === 'string' && licenseKey.trim().length > 0) {
    const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
    if (supabase) {
      const { data } = await supabase
        .from('users')
        .select('email')
        .eq('extension_license_key', licenseKey.trim())
        .single()
      if (data?.email) {
        userInfo = data.email as string
      }
    }
  }

  const categoryLabel = CATEGORY_LABELS[String(category)] ?? '📝 Feedback'
  const extName = typeof extensionName === 'string' ? extensionName : 'Inzinna Extension'
  const extVersion = typeof extensionVersion === 'string' ? extensionVersion : 'unknown'

  const slackMessage = [
    `${categoryLabel} — *${extName}* v${extVersion}`,
    `From: ${userInfo}`,
    `\`\`\`${String(message).trim()}\`\`\``,
  ].join('\n')

  await sendSlackNotification(slackMessage, 'feedback')

  return NextResponse.json({ ok: true })
}
