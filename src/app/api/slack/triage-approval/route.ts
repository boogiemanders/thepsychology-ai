import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getSupabaseClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET || ''
const FIVE_MINUTES = 60 * 5

function verifySlackSignature(rawBody: string, timestamp: string, signature: string): boolean {
  if (!SLACK_SIGNING_SECRET) return false
  if (!timestamp || !signature) return false

  const ts = parseInt(timestamp, 10)
  if (!Number.isFinite(ts)) return false
  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - ts) > FIVE_MINUTES) return false

  const basestring = `v0:${timestamp}:${rawBody}`
  const computed = 'v0=' + crypto
    .createHmac('sha256', SLACK_SIGNING_SECRET)
    .update(basestring)
    .digest('hex')

  const a = Buffer.from(computed)
  const b = Buffer.from(signature)
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const timestamp = request.headers.get('x-slack-request-timestamp') || ''
  const signature = request.headers.get('x-slack-signature') || ''

  if (!verifySlackSignature(rawBody, timestamp, signature)) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
  }

  const params = new URLSearchParams(rawBody)
  const payloadStr = params.get('payload')
  if (!payloadStr) {
    return NextResponse.json({ error: 'missing payload' }, { status: 400 })
  }

  let payload: any
  try {
    payload = JSON.parse(payloadStr)
  } catch {
    return NextResponse.json({ error: 'invalid json payload' }, { status: 400 })
  }

  if (payload.type !== 'block_actions') {
    return NextResponse.json({ ok: true })
  }

  const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
  if (!supabase) {
    return NextResponse.json({ error: 'supabase unavailable' }, { status: 500 })
  }

  const actions: any[] = payload.actions || []
  const user = payload.user?.username || payload.user?.name || 'unknown'
  const results: Array<{ id: string; status: string }> = []

  for (const action of actions) {
    const draftId = action.value
    const actionId = action.action_id
    if (!draftId) continue

    let nextStatus: 'approved' | 'rejected' | null = null
    if (actionId === 'approve') nextStatus = 'approved'
    else if (actionId === 'reject') nextStatus = 'rejected'
    if (!nextStatus) continue

    const { error } = await supabase
      .from('triage_drafts')
      .update({ status: nextStatus })
      .eq('id', draftId)
      .eq('status', 'pending_approval')

    if (error) {
      console.error('[slack triage] update failed', draftId, error)
      continue
    }
    results.push({ id: draftId, status: nextStatus })
  }

  if (results.length === 0) {
    return new Response('', { status: 200 })
  }

  const summary = results
    .map((r) => `${r.status === 'approved' ? 'Approved' : 'Rejected'} by ${user}`)
    .join(', ')

  const originalBlocks = Array.isArray(payload.message?.blocks) ? payload.message.blocks : []
  const blocksWithoutActions = originalBlocks.filter((b: any) => b.type !== 'actions')
  const statusBlock = {
    type: 'context',
    elements: [{ type: 'mrkdwn', text: `Status: ${summary}` }],
  }

  return NextResponse.json({
    replace_original: true,
    text: payload.message?.text || 'Triage draft updated',
    blocks: [...blocksWithoutActions, statusBlock],
  })
}
