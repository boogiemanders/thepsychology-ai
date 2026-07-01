import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-server'
import { sendNotificationEmail, isNotificationEmailConfigured } from '@/lib/notify-email'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Interim HIPAA posture (BAAs pending): this endpoint accepts ONLY click-intake
// callback requests (a preset topic plus a phone number). It deliberately
// rejects everything else so no free text, name, or email can reach storage,
// even from a stale client or a hand-crafted request. Revert to the full
// free-text handoff shape once OpenAI/AWS/Neon BAAs are signed.

type Topic = 'scheduling' | 'insurance' | 'general'

const TOPIC_LABEL: Record<Topic, string> = {
  scheduling: 'Scheduling',
  insurance: 'Insurance / billing',
  general: 'General',
}

// Reuses the existing inzi_messages intent enum so the inbox filters keep working.
const TOPIC_INTENT: Record<Topic, 'scheduling' | 'billing' | 'general'> = {
  scheduling: 'scheduling',
  insurance: 'billing',
  general: 'general',
}

export async function POST(req: Request) {
  let body: { topic?: string; phone?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const topics: Topic[] = ['scheduling', 'insurance', 'general']
  const topic = body?.topic as Topic
  if (!topic || !topics.includes(topic)) {
    return NextResponse.json({ error: 'Missing or invalid topic' }, { status: 400 })
  }

  // Digits-only validation so nothing but a phone number can be smuggled in.
  const raw = String(body?.phone || '')
  const digits = raw.replace(/[\s().+-]/g, '')
  if (!/^\d{10,15}$/.test(digits)) {
    return NextResponse.json({ error: 'Valid phone number required' }, { status: 400 })
  }

  const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })

  const { data, error } = await supabase
    .from('inzi_messages')
    .insert({
      intent: TOPIC_INTENT[topic],
      patient_name: null,
      patient_email: null,
      patient_phone: digits,
      summary: `Callback request: ${TOPIC_LABEL[topic]}`,
      payload: { topic, source: 'click-intake' },
      urgency: 'normal',
      status: 'new',
    })
    .select('id')
    .single()

  if (error || !data) {
    console.error('inzi handoff insert failed:', error)
    return NextResponse.json({ error: 'Failed to record request', detail: error?.message }, { status: 500 })
  }

  // The notification email intentionally carries no phone number or any other
  // identifying info: Resend has no HIPAA BAA. The phone lives only in Supabase.
  let emailSent = false
  if (isNotificationEmailConfigured()) {
    try {
      await sendNotificationEmail({
        subject: `[Inzi] Callback request (${TOPIC_LABEL[topic]})`,
        text: [
          `A visitor requested a callback about: ${TOPIC_LABEL[topic]}.`,
          '',
          'Their phone number is in the Inzi inbox: /lab/inzinna/inbox',
          `Inbox ID: ${data.id}`,
        ].join('\n'),
      })
      emailSent = true
    } catch (e) {
      console.warn('Resend email failed:', e)
    }
  }

  return NextResponse.json({ ok: true, id: data.id, emailSent })
}
