import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSupabaseClient } from '@/lib/supabase-server'
import {
  analyzeContent,
  saveAnalysis,
  getAnalyses,
  generateSiteRecommendations,
  type ContentInput,
  type Platform,
} from '@/lib/viral-analyzer'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function requireAuthedUserId(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization') || ''
  const token = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : null

  if (!token || !supabaseUrl || !supabaseAnonKey) return null

  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user?.id) return null
  return data.user.id
}

// GET: Fetch analyses for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuthedUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const platform = searchParams.get('platform') as Platform | null
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 50
    const action = searchParams.get('action')

    // Generate site recommendations
    if (action === 'site-recommendations') {
      const recommendations = await generateSiteRecommendations(supabase, userId)
      return NextResponse.json({ recommendations })
    }

    // Get past site recommendations
    if (action === 'get-site-recommendations') {
      const { data } = await supabase
        .from('site_viral_recommendations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)

      return NextResponse.json({ recommendations: data || [] })
    }

    // Get all analyses
    const analyses = await getAnalyses(supabase, userId, {
      platform: platform || undefined,
      limit,
    })

    // Calculate aggregate stats
    const stats = {
      totalAnalyses: analyses.length,
      avgHookScore: 0,
      avgVisualScore: 0,
      avgPacingScore: 0,
      avgToneScore: 0,
      avgCadenceScore: 0,
      avgOverallScore: 0,
      platformBreakdown: {} as Record<string, number>,
      topPerformers: [] as any[],
    }

    if (analyses.length > 0) {
      analyses.forEach((a) => {
        stats.avgHookScore += a.hook_score || 0
        stats.avgVisualScore += a.visual_score || 0
        stats.avgPacingScore += a.pacing_score || 0
        stats.avgToneScore += a.tone_score || 0
        stats.avgCadenceScore += a.cadence_score || 0
        stats.avgOverallScore += a.overall_viral_score || 0

        stats.platformBreakdown[a.platform] = (stats.platformBreakdown[a.platform] || 0) + 1
      })

      const count = analyses.length
      stats.avgHookScore = Math.round(stats.avgHookScore / count)
      stats.avgVisualScore = Math.round(stats.avgVisualScore / count)
      stats.avgPacingScore = Math.round(stats.avgPacingScore / count)
      stats.avgToneScore = Math.round(stats.avgToneScore / count)
      stats.avgCadenceScore = Math.round(stats.avgCadenceScore / count)
      stats.avgOverallScore = Math.round(stats.avgOverallScore / count)

      // Get top 5 performers
      stats.topPerformers = [...analyses]
        .sort((a, b) => (b.overall_viral_score || 0) - (a.overall_viral_score || 0))
        .slice(0, 5)
        .map((a) => ({
          id: a.id,
          platform: a.platform,
          title: a.title || 'Untitled',
          score: a.overall_viral_score,
          createdAt: a.created_at,
        }))
    }

    return NextResponse.json({ analyses, stats })
  } catch (error) {
    console.error('[viral-analyzer GET] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Analyze new content
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuthedUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const body = await request.json()
    const {
      platform,
      contentUrl,
      contentId,
      title,
      description,
      transcript,
      thumbnailUrl,
      durationSeconds,
      postedAt,
      views,
      likes,
      comments,
      shares,
      saves,
    } = body as ContentInput & {
      views?: number
      likes?: number
      comments?: number
      shares?: number
      saves?: number
    }

    // Validate platform
    if (!platform || !['tiktok', 'twitter', 'instagram'].includes(platform)) {
      return NextResponse.json(
        { error: 'Invalid platform. Must be tiktok, twitter, or instagram' },
        { status: 400 }
      )
    }

    // Need at least some content to analyze
    if (!title && !description && !transcript) {
      return NextResponse.json(
        { error: 'At least one of title, description, or transcript is required' },
        { status: 400 }
      )
    }

    const input: ContentInput = {
      platform,
      contentUrl,
      contentId,
      title,
      description,
      transcript,
      thumbnailUrl,
      durationSeconds,
      postedAt,
      views,
      likes,
      comments,
      shares,
      saves,
    }

    // Analyze the content
    const analysis = await analyzeContent(input)
    if (!analysis) {
      return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
    }

    // Save to database
    const saved = await saveAnalysis(supabase, userId, input, analysis)
    if (!saved) {
      // Return analysis even if save failed
      return NextResponse.json({ analysis, saved: false })
    }

    return NextResponse.json({
      id: saved.id,
      analysis,
      saved: true,
    })
  } catch (error) {
    console.error('[viral-analyzer POST] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
