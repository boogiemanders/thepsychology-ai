import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function POST(req: NextRequest) {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const body = await req.json()
  const firstName = typeof body.firstName === 'string' ? body.firstName.trim() : ''
  const lastName = typeof body.lastName === 'string' ? body.lastName.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''

  if (!firstName || !lastName || !email) {
    return NextResponse.json({ error: 'First name, last name, and email are required' }, { status: 400 })
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  const name = `${lastName}, ${firstName}`

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

  const { error } = await supabase
    .from('license_watch_signups')
    .upsert(
      { name, email, status: 'watching', updated_at: new Date().toISOString() },
      { onConflict: 'email' }
    )

  if (error) {
    console.error('[license-watch] signup error:', error)
    return NextResponse.json({ error: 'Failed to save signup' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
