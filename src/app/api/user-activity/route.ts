import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const ActivitySchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('heartbeat'),
    page: z.string(),
  }),
  z.object({
    action: z.literal('enter'),
    page: z.string(),
  }),
  z.object({
    action: z.literal('exit'),
    pageViewId: z.string().uuid(),
    durationMs: z.number().min(0),
  }),
])

async function getUserIdFromToken(token: string): Promise<string | null> {
  if (!supabaseUrl || !supabaseAnonKey) return null

  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user?.id) return null
  return data.user.id
}

export async function POST(request: NextRequest) {
  try {
    // Get auth token from cookie or header
    const authHeader = request.headers.get('authorization') || ''
    const cookieToken = request.cookies.get('sb-access-token')?.value

    const token = authHeader.toLowerCase().startsWith('bearer ')
      ? authHeader.slice(7).trim()
      : cookieToken

    // Try to get user from session if no token
    let userId: string | null = null

    if (token) {
      userId = await getUserIdFromToken(token)
    }

    // If no token, try the session cookie approach
    if (!userId && supabaseUrl && supabaseAnonKey) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            cookie: request.headers.get('cookie') || '',
          },
        },
      })
      const { data } = await supabase.auth.getSession()
      userId = data.session?.user?.id || null
    }

    if (!userId) {
      // Silently fail for unauthenticated users - don't error
      return NextResponse.json({ ok: true })
    }

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const body = await request.json()
    const parsed = ActivitySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false },
    })

    const { action } = parsed.data

    if (action === 'heartbeat') {
      // Update last_activity_at and current_page
      const { page } = parsed.data
      await supabase
        .from('users')
        .update({
          last_activity_at: new Date().toISOString(),
          current_page: page,
        })
        .eq('id', userId)

      return NextResponse.json({ ok: true })
    }

    if (action === 'enter') {
      // Create new page view record and update user's current page
      const { page } = parsed.data

      // Update user's current page and last activity
      await supabase
        .from('users')
        .update({
          last_activity_at: new Date().toISOString(),
          current_page: page,
        })
        .eq('id', userId)

      // Insert page view record
      const { data: pageView, error } = await supabase
        .from('user_page_views')
        .insert({
          user_id: userId,
          page_path: page,
          entered_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (error) {
        // Table might not exist yet - silently fail
        console.debug('[user-activity] page view insert failed:', error.message)
        return NextResponse.json({ ok: true })
      }

      return NextResponse.json({ ok: true, pageViewId: pageView?.id })
    }

    if (action === 'exit') {
      // Update page view with exit time and duration
      const { pageViewId, durationMs } = parsed.data
      const durationSeconds = Math.round(durationMs / 1000)

      await supabase
        .from('user_page_views')
        .update({
          exited_at: new Date().toISOString(),
          duration_seconds: durationSeconds,
        })
        .eq('id', pageViewId)
        .eq('user_id', userId) // Ensure user owns this record

      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[user-activity] error:', error)
    // Silently fail - activity tracking should not break the app
    return NextResponse.json({ ok: true })
  }
}
