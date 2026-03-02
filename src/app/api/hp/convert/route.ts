import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-server'
import { HP_VISITOR_COOKIE, HP_EXCLUDED_EMAILS } from '@/lib/hp-utils'

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
    const { userId, triggerSection, timeOnPageMs } = body

    // Check if this user's email is in the exclusion list
    if (userId) {
      const { data: authUser } = await supabase.auth.admin.getUserById(userId)
      if (authUser?.user?.email && HP_EXCLUDED_EMAILS.includes(authUser.user.email.toLowerCase())) {
        // Mark visitor as excluded so they don't pollute data, but don't count as conversion
        const { data: visitor } = await supabase
          .from('hp_visitors')
          .select('id')
          .eq('cookie_id', cookieId)
          .single()

        if (visitor) {
          await supabase
            .from('hp_visitors')
            .update({ excluded: true })
            .eq('id', visitor.id)
        }

        return NextResponse.json({ ok: true, excluded: true })
      }
    }

    // Look up visitor
    const { data: visitor } = await supabase
      .from('hp_visitors')
      .select('id')
      .eq('cookie_id', cookieId)
      .single()

    if (!visitor) {
      return NextResponse.json({ ok: false }, { status: 404 })
    }

    // Mark visitor as converted
    await supabase
      .from('hp_visitors')
      .update({
        converted: true,
        converted_user_id: userId || null,
      })
      .eq('id', visitor.id)

    // Look up variant assignment for attribution
    const { data: assignment } = await supabase
      .from('hp_assignments')
      .select('variant_id')
      .eq('visitor_id', visitor.id)
      .limit(1)
      .single()

    // Insert signup_complete event with enriched metadata
    const metadata: Record<string, unknown> = {}
    if (userId) metadata.user_id = userId
    if (typeof triggerSection === 'string' && triggerSection) metadata.trigger_section = triggerSection
    if (typeof timeOnPageMs === 'number' && timeOnPageMs > 0) metadata.time_on_page_ms = timeOnPageMs

    await supabase.from('hp_events').insert({
      visitor_id: visitor.id,
      variant_id: assignment?.variant_id || null,
      event_type: 'signup_complete',
      metadata: Object.keys(metadata).length > 0 ? metadata : null,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
