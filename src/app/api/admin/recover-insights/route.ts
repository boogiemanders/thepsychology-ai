import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { getSupabaseClient } from '@/lib/supabase-server'

const QuerySchema = z.object({
  userId: z.string().uuid().optional(),
  status: z.enum(['pending', 'approved', 'rejected', 'sent']).optional(),
  includeStyle: z.string().optional(),
})

const UpdateSchema = z.object({
  insightId: z.string().uuid(),
  status: z.enum(['pending', 'approved', 'rejected', 'sent']).optional(),
  draftMessage: z.string().optional(),
  approvedMessage: z.string().optional(),
  adminNotes: z.string().optional(),
})

const StyleSchema = z.object({
  stylePrompt: z.string().min(1),
})

function getBearerToken(req: NextRequest): string | null {
  const header = req.headers.get('authorization') || ''
  if (!header.toLowerCase().startsWith('bearer ')) return null
  return header.slice(7).trim() || null
}

function getAdminEmailAllowlist(): string[] {
  const raw = process.env.RECOVER_ADMIN_EMAILS || process.env.ADMIN_EMAILS || 'chanders0@yahoo.com'
  return raw
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

async function requireAdmin(req: NextRequest): Promise<{ id: string; email: string } | null> {
  const token = getBearerToken(req)
  if (!token) return null

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) return null

  const anon = createClient(url, anonKey, { auth: { persistSession: false } })
  const { data, error } = await anon.auth.getUser(token)
  if (error || !data.user?.id || !data.user.email) return null

  const allowlist = getAdminEmailAllowlist()
  const email = data.user.email.toLowerCase()
  if (!allowlist.includes(email)) return null

  return { id: data.user.id, email }
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const parsedQuery = QuerySchema.safeParse({
      userId: searchParams.get('userId') || undefined,
      status: (searchParams.get('status') as any) || undefined,
      includeStyle: searchParams.get('includeStyle') || undefined,
    })

    if (!parsedQuery.success) {
      return NextResponse.json({ error: 'Invalid query' }, { status: 400 })
    }

    const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const includeStyle = parsedQuery.data.includeStyle !== 'false'

    const [insightsResult, styleResult] = await Promise.all([
      parsedQuery.data.userId
        ? supabase
            .from('recover_insights')
            .select('id, status, source_type, source_id, insight_data, draft_message, approved_message, admin_notes, model, prompt_version, approved_at, sent_at, created_at')
            .eq('user_id', parsedQuery.data.userId)
            .order('created_at', { ascending: false })
        : Promise.resolve({ data: [] as any[] }),
      includeStyle
        ? supabase
            .from('recover_insight_preferences')
            .select('style_prompt')
            .eq('id', 'global')
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ])

    if ((insightsResult as any).error) {
      console.error('[admin/recover-insights] insights error:', (insightsResult as any).error)
      return NextResponse.json({ error: 'Failed to load insights' }, { status: 500 })
    }

    const insights = (insightsResult as any).data || []

    return NextResponse.json({
      insights,
      stylePrompt: includeStyle ? styleResult.data?.style_prompt ?? '' : undefined,
    })
  } catch (error) {
    console.error('[admin/recover-insights] error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const parsed = StyleSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
    }

    const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const { error } = await supabase
      .from('recover_insight_preferences')
      .upsert({
        id: 'global',
        style_prompt: parsed.data.stylePrompt,
        updated_at: new Date().toISOString(),
      })

    if (error) {
      console.error('[admin/recover-insights] style update error:', error)
      return NextResponse.json({ error: 'Failed to save style prompt' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[admin/recover-insights] style update error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const parsed = UpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
    }

    const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const updatePayload: Record<string, unknown> = {}
    if (parsed.data.status) {
      updatePayload.status = parsed.data.status
      if (parsed.data.status === 'approved') {
        updatePayload.approved_at = new Date().toISOString()
      }
    }
    if (typeof parsed.data.draftMessage === 'string') {
      updatePayload.draft_message = parsed.data.draftMessage
    }
    if (typeof parsed.data.approvedMessage === 'string') {
      updatePayload.approved_message = parsed.data.approvedMessage
    }
    if (typeof parsed.data.adminNotes === 'string') {
      updatePayload.admin_notes = parsed.data.adminNotes
    }

    const { error } = await supabase
      .from('recover_insights')
      .update(updatePayload)
      .eq('id', parsed.data.insightId)

    if (error) {
      console.error('[admin/recover-insights] update error:', error)
      return NextResponse.json({ error: 'Failed to update insight' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[admin/recover-insights] update error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
