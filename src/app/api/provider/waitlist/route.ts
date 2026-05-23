import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-server'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    const name = typeof body?.name === 'string' ? body.name.trim().slice(0, 200) : ''
    const phone = typeof body?.phone === 'string' ? body.phone.trim().slice(0, 50) : null
    const note = typeof body?.note === 'string' ? body.note.trim().slice(0, 2000) : null
    const source = typeof body?.source === 'string' ? body.source.trim().slice(0, 200) : null

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email.' }, { status: 400 })
    }
    if (!name) {
      return NextResponse.json({ error: 'Please enter your name.' }, { status: 400 })
    }

    const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
    if (!supabase) {
      return NextResponse.json({ error: 'Server not configured.' }, { status: 500 })
    }

    const { error } = await supabase
      .from('provider_waitlist')
      .upsert(
        { email, name, phone, note, source },
        { onConflict: 'email' }
      )

    if (error) {
      console.error('Provider waitlist upsert error:', error)
      return NextResponse.json({ error: 'Could not save. Try again.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Provider waitlist POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
