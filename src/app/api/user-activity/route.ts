import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const ThemeSchema = z.enum(['light', 'dark'])
const ThemePreferenceSchema = z.enum(['light', 'dark', 'system'])
let themeColumnsUnavailable = false

const ActivitySchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('heartbeat'),
    page: z.string(),
    theme: ThemeSchema.optional(),
    themePreference: ThemePreferenceSchema.optional(),
  }),
  z.object({
    action: z.literal('enter'),
    page: z.string(),
    theme: ThemeSchema.optional(),
    themePreference: ThemePreferenceSchema.optional(),
  }),
  z.object({
    action: z.literal('exit'),
    pageViewId: z.string().uuid(),
    durationMs: z.number().min(0),
    sessionEnd: z.boolean().optional(), // True when tab closes/hidden
  }),
])

async function getUserIdFromToken(token: string): Promise<string | null> {
  if (!supabaseUrl || !supabaseAnonKey) return null

  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user?.id) return null
  return data.user.id
}

function buildUserActivityUpdate(input: {
  page: string
  nowIso: string
  theme?: z.infer<typeof ThemeSchema>
  themePreference?: z.infer<typeof ThemePreferenceSchema>
}) {
  const update: {
    last_activity_at: string
    current_page: string
    current_theme?: z.infer<typeof ThemeSchema>
    theme_preference?: z.infer<typeof ThemePreferenceSchema>
    theme_last_seen_at?: string
  } = {
    last_activity_at: input.nowIso,
    current_page: input.page,
  }

  if (input.theme) {
    update.current_theme = input.theme
    update.theme_last_seen_at = input.nowIso
  }

  if (input.themePreference) {
    update.theme_preference = input.themePreference
    if (!update.theme_last_seen_at) {
      update.theme_last_seen_at = input.nowIso
    }
  }

  return update
}

function buildLegacyUserActivityUpdate(input: { page: string; nowIso: string }) {
  return {
    last_activity_at: input.nowIso,
    current_page: input.page,
  }
}

function isMissingThemeColumnError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const candidate = error as { code?: string; message?: string; details?: string }
  const combined = `${candidate.message || ''} ${candidate.details || ''}`.toLowerCase()
  return candidate.code === '42703' || combined.includes('current_theme') || combined.includes('theme_preference')
}

async function updateUserActivityRow(input: {
  supabase: SupabaseClient
  userId: string
  page: string
  nowIso: string
  theme?: z.infer<typeof ThemeSchema>
  themePreference?: z.infer<typeof ThemePreferenceSchema>
}) {
  const { supabase, userId, page, nowIso, theme, themePreference } = input

  if (themeColumnsUnavailable) {
    await supabase.from('users').update(buildLegacyUserActivityUpdate({ page, nowIso })).eq('id', userId)
    return
  }

  const { error } = await supabase
    .from('users')
    .update(buildUserActivityUpdate({ page, theme, themePreference, nowIso }))
    .eq('id', userId)

  if (error && isMissingThemeColumnError(error)) {
    themeColumnsUnavailable = true
    await supabase.from('users').update(buildLegacyUserActivityUpdate({ page, nowIso })).eq('id', userId)
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get auth token from Authorization header (Bearer token)
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.toLowerCase().startsWith('bearer ')
      ? authHeader.slice(7).trim()
      : null

    // Get user ID from token
    const userId = token ? await getUserIdFromToken(token) : null

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
      // Update last_activity_at, current page, and latest resolved theme state.
      const { page, theme, themePreference } = parsed.data
      const nowIso = new Date().toISOString()
      await updateUserActivityRow({ supabase, userId, page, theme, themePreference, nowIso })

      return NextResponse.json({ ok: true })
    }

    if (action === 'enter') {
      // Create new page view record and update user's current page
      const { page, theme, themePreference } = parsed.data
      const nowIso = new Date().toISOString()

      // Update user's current page and last activity
      await updateUserActivityRow({ supabase, userId, page, theme, themePreference, nowIso })

      // Insert page view record
      const { data: pageView, error } = await supabase
        .from('user_page_views')
        .insert({
          user_id: userId,
          page_path: page,
          entered_at: nowIso,
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
      const { pageViewId, durationMs, sessionEnd } = parsed.data
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
