import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-server'
import { sendNotificationEmail, isNotificationEmailConfigured } from '@/lib/notify-email'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Intent = 'scheduling' | 'billing' | 'clinical' | 'general'
type Urgency = 'low' | 'normal' | 'urgent'

interface HandoffBody {
  intent: Intent
  patient: { name: string; email: string; phone?: string }
  summary: string
  payload?: Record<string, unknown>
  urgency?: Urgency
  assignedClinician?: string
}

function intentLabel(i: Intent): string {
  if (i === 'scheduling') return 'Scheduling request'
  if (i === 'billing') return 'Billing question'
  if (i === 'clinical') return 'Message to clinician'
  return 'General question'
}

function renderBodyText(b: HandoffBody, id: string): string {
  const lines: string[] = []
  lines.push(`${intentLabel(b.intent).toUpperCase()}`)
  lines.push('')
  lines.push(`Patient: ${b.patient.name} <${b.patient.email}>`)
  if (b.patient.phone) lines.push(`Phone: ${b.patient.phone}`)
  if (b.assignedClinician) lines.push(`For: ${b.assignedClinician}`)
  if (b.urgency && b.urgency !== 'normal') lines.push(`Urgency: ${b.urgency.toUpperCase()}`)
  lines.push('')
  lines.push('Summary:')
  lines.push(b.summary)
  if (b.payload && Object.keys(b.payload).length > 0) {
    lines.push('')
    lines.push('Details:')
    for (const [k, v] of Object.entries(b.payload)) {
      const value = Array.isArray(v) ? v.join(', ') : String(v)
      lines.push(`  ${k}: ${value}`)
    }
  }
  lines.push('')
  lines.push(`Inbox ID: ${id}`)
  lines.push(`View at: /lab/inzinna/inbox`)
  return lines.join('\n')
}

export async function POST(req: Request) {
  let body: HandoffBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const allowed: Intent[] = ['scheduling', 'billing', 'clinical', 'general']
  if (!body || !body.intent || !allowed.includes(body.intent)) {
    return NextResponse.json({ error: 'Missing or invalid intent' }, { status: 400 })
  }
  if (!body.patient?.name?.trim() || !body.patient?.email?.trim()) {
    return NextResponse.json({ error: 'Patient name and email required' }, { status: 400 })
  }
  if (!body.summary?.trim()) {
    return NextResponse.json({ error: 'Summary required' }, { status: 400 })
  }

  const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })

  const { data, error } = await supabase
    .from('inzi_messages')
    .insert({
      intent: body.intent,
      patient_name: body.patient.name.trim(),
      patient_email: body.patient.email.trim(),
      patient_phone: body.patient.phone?.trim() || null,
      summary: body.summary.trim(),
      payload: body.payload || {},
      urgency: body.urgency || 'normal',
      assigned_clinician: body.assignedClinician?.trim() || null,
      status: 'new',
    })
    .select('id')
    .single()

  if (error || !data) {
    console.error('inzi handoff insert failed:', error)
    return NextResponse.json({ error: 'Failed to record message', detail: error?.message }, { status: 500 })
  }

  let emailSent = false
  if (isNotificationEmailConfigured()) {
    try {
      await sendNotificationEmail({
        subject: `[Inzi] ${intentLabel(body.intent)} from ${body.patient.name}`,
        text: renderBodyText(body, data.id),
      })
      emailSent = true
    } catch (e) {
      console.warn('Resend email failed:', e)
    }
  }

  return NextResponse.json({ ok: true, id: data.id, emailSent })
}
