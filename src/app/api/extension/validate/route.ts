import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

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

  const { licenseKey } = body as Record<string, unknown>

  if (!licenseKey || typeof licenseKey !== 'string' || licenseKey.trim().length === 0) {
    return NextResponse.json({ valid: false, tier: null, expiresAt: null })
  }

  const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const { data, error } = await supabase
    .from('users')
    .select('id, subscription_tier, trial_ends_at')
    .eq('extension_license_key', licenseKey.trim())
    .single()

  if (error || !data) {
    return NextResponse.json({ valid: false, tier: null, expiresAt: null })
  }

  const tier = data.subscription_tier as string | null
  const trialEndsAt = data.trial_ends_at as string | null

  let valid = false
  let expiresAt: string | null = null

  if (tier === 'pro') {
    valid = true
  } else if (trialEndsAt) {
    const trialEnd = new Date(trialEndsAt)
    if (trialEnd > new Date()) {
      valid = true
      expiresAt = trialEndsAt
    }
  }

  return NextResponse.json({ valid, tier, expiresAt })
}
