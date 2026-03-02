import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-server'
import { HP_VISITOR_COOKIE } from '@/lib/hp-utils'

export async function POST(request: NextRequest) {
  const cookieId = request.cookies.get(HP_VISITOR_COOKIE)?.value
  if (!cookieId) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
  if (!supabase) {
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  try {
    const body = await request.json()
    const { eventType, sectionKey, variantId } = body

    if (!eventType) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    // Look up visitor ID from cookie_id, skip if excluded
    const { data: visitor } = await supabase
      .from('hp_visitors')
      .select('id, excluded')
      .eq('cookie_id', cookieId)
      .single()

    if (!visitor || visitor.excluded) {
      return NextResponse.json({ ok: true })
    }

    await supabase.from('hp_events').insert({
      visitor_id: visitor.id,
      variant_id: variantId || null,
      event_type: eventType,
      section_key: sectionKey || null,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
