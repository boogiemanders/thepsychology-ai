import { getSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export interface ConsentPreferences {
  consent_personal_tracking: boolean
  consent_ai_insights: boolean
  consent_research_contribution: boolean
  consent_marketing_communications: boolean
  consent_version: string
  privacy_policy_version: string | null
  terms_version: string | null
}

const CURRENT_CONSENT_VERSION = '1.0'

// GET - Retrieve current consent preferences
export async function GET(request: NextRequest) {
  try {
    const authToken = request.headers.get('authorization')?.split('Bearer ')[1]

    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseClient(
      { global: { headers: { Authorization: `Bearer ${authToken}` } } },
      { requireServiceRole: false }
    )

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 })
    }

    // Fetch consent preferences
    const { data: preferences, error } = await supabase
      .from('user_consent_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('Error fetching consent preferences:', error)
      return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 })
    }

    // Return defaults if no preferences exist yet
    if (!preferences) {
      return NextResponse.json({
        consent_personal_tracking: true,
        consent_ai_insights: true,
        consent_research_contribution: false,
        consent_marketing_communications: false,
        consent_version: CURRENT_CONSENT_VERSION,
        privacy_policy_version: null,
        terms_version: null,
        is_default: true,
      })
    }

    return NextResponse.json(preferences)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Update consent preferences
export async function POST(request: NextRequest) {
  try {
    const authToken = request.headers.get('authorization')?.split('Bearer ')[1]

    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      consent_personal_tracking,
      consent_ai_insights,
      consent_research_contribution,
      consent_marketing_communications,
    } = body

    // Use service role for audit log insertion
    const supabase = getSupabaseClient(
      { global: { headers: { Authorization: `Bearer ${authToken}` } } },
      { requireServiceRole: true }
    )

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 })
    }

    // Get current preferences for audit log
    const { data: currentPrefs } = await supabase
      .from('user_consent_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    const newPreferences: Partial<ConsentPreferences> = {}
    const auditEntries: Array<{
      user_id: string
      consent_type: string
      old_value: boolean | null
      new_value: boolean
      ip_address: string | null
      user_agent: string | null
      consent_method: string
      consent_version: string
    }> = []

    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || null
    const userAgent = request.headers.get('user-agent') || null

    // Track changes for each consent type
    const consentTypes = [
      { key: 'consent_personal_tracking', value: consent_personal_tracking },
      { key: 'consent_ai_insights', value: consent_ai_insights },
      { key: 'consent_research_contribution', value: consent_research_contribution },
      { key: 'consent_marketing_communications', value: consent_marketing_communications },
    ] as const

    for (const { key, value } of consentTypes) {
      if (value !== undefined) {
        const oldValue = currentPrefs?.[key] ?? null
        if (oldValue !== value) {
          newPreferences[key] = value
          auditEntries.push({
            user_id: user.id,
            consent_type: key.replace('consent_', ''),
            old_value: oldValue,
            new_value: value,
            ip_address: ipAddress,
            user_agent: userAgent,
            consent_method: 'settings_page',
            consent_version: CURRENT_CONSENT_VERSION,
          })
        }
      }
    }

    // If no changes, return early
    if (Object.keys(newPreferences).length === 0) {
      return NextResponse.json({ message: 'No changes to save', preferences: currentPrefs })
    }

    // Upsert preferences
    const { data: updatedPrefs, error: upsertError } = await supabase
      .from('user_consent_preferences')
      .upsert(
        {
          user_id: user.id,
          ...newPreferences,
          consent_version: CURRENT_CONSENT_VERSION,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single()

    if (upsertError) {
      console.error('Error updating consent preferences:', upsertError)
      return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 })
    }

    // Insert audit log entries
    if (auditEntries.length > 0) {
      const { error: auditError } = await supabase.from('consent_audit_log').insert(auditEntries)

      if (auditError) {
        console.error('Error inserting audit log:', auditError)
        // Don't fail the request for audit log errors, but log it
      }
    }

    // Update research consent timestamp on users table if research consent was enabled
    if (consent_research_contribution === true && !currentPrefs?.consent_research_contribution) {
      await supabase
        .from('users')
        .update({ research_consent_given_at: new Date().toISOString() })
        .eq('id', user.id)
    }

    return NextResponse.json({
      success: true,
      preferences: updatedPrefs,
      changes: auditEntries.length,
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
