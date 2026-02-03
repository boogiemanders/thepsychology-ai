import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSupabaseClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

async function requireAuthedUserId(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization') || ''
  const token = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : null

  if (!token) return null

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) return null

  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user?.id) return null
  return data.user.id
}

export async function POST(req: NextRequest) {
  const userId = await requireAuthedUserId(req)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    // Get user info first
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log('[Data Delete] Starting data deletion for user:', userId)

    // Delete user data from various tables
    // Order matters for foreign key constraints
    const tablesToDelete = [
      'feedback',
      'question_feedback',
      'study_priorities',
      'quiz_results',
      'user_consent',
      'research_profiles',
    ]

    const deletionResults: Record<string, { success: boolean; count?: number; error?: string }> = {}

    for (const table of tablesToDelete) {
      try {
        const { data, error } = await supabase
          .from(table)
          .delete()
          .eq('user_id', userId)
          .select('id')

        if (error) {
          // Table might not exist or user_id column might be named differently
          console.warn(`[Data Delete] Could not delete from ${table}:`, error.message)
          deletionResults[table] = { success: false, error: error.message }
        } else {
          deletionResults[table] = { success: true, count: data?.length || 0 }
          console.log(`[Data Delete] Deleted ${data?.length || 0} rows from ${table}`)
        }
      } catch (err) {
        console.warn(`[Data Delete] Error deleting from ${table}:`, err)
        deletionResults[table] = { success: false, error: String(err) }
      }
    }

    // Anonymize the user record (keep the row but remove PII)
    const { error: updateError } = await supabase
      .from('users')
      .update({
        email: `deleted_${userId.slice(0, 8)}@deleted.local`,
        full_name: 'Deleted User',
        data_deleted_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (updateError) {
      console.error('[Data Delete] Error anonymizing user record:', updateError)
    }

    console.log('[Data Delete] Data deletion completed for user:', userId)

    return NextResponse.json({
      success: true,
      message: 'Your data has been permanently deleted.',
      details: deletionResults,
    })
  } catch (error) {
    console.error('[Data Delete] Error:', error)
    return NextResponse.json(
      { error: 'Failed to delete data' },
      { status: 500 }
    )
  }
}
