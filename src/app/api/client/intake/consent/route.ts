import { NextRequest, NextResponse } from 'next/server'
import {
  getUserWithRole,
  hasRole,
  logPhiAccess,
} from '@/lib/supabase-matching'
import { getSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const authToken = request.headers.get('authorization')?.split('Bearer ')[1]
    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getUserWithRole(authToken)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasRole(user, 'client')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { hipaa_consent, matching_consent } = body as {
      hipaa_consent: boolean
      matching_consent: boolean
    }

    const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 })
    }

    const now = new Date().toISOString()
    const updates: Record<string, string> = {}
    if (hipaa_consent) {
      updates.hipaa_consent_given_at = now
    }
    if (matching_consent) {
      updates.matching_consent_given_at = now
    }

    // Ensure a row exists for this user, then apply consent timestamps
    const { error: upsertError } = await supabase
      .from('client_intake_profiles')
      .upsert({ user_id: user.id, ...updates }, { onConflict: 'user_id' })

    if (upsertError) {
      console.error('Client intake consent upsert error:', upsertError)
      return NextResponse.json({ error: 'Failed to record consent' }, { status: 500 })
    }

    const ip = request.headers.get('x-forwarded-for') ?? undefined
    const userAgent = request.headers.get('user-agent') ?? undefined

    await logPhiAccess({
      accessorId: user.id,
      accessorRole: user.role,
      clientId: user.id,
      accessType: 'intake_view',
      resourceTable: 'client_intake_profiles',
      ipAddress: ip,
      userAgent,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Client intake consent POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
