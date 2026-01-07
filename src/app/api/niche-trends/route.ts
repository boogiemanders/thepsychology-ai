import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSupabaseClient } from '@/lib/supabase-server'
import {
  analyzeNicheTrends,
  saveTrends,
  getTrends,
  getUniqueNiches,
} from '@/lib/niche-trends'

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

// GET: Fetch saved trends
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
    const niche = searchParams.get('niche')
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 100
    const action = searchParams.get('action')

    // Get list of analyzed niches
    if (action === 'niches') {
      const niches = await getUniqueNiches(supabase, userId)
      return NextResponse.json({ niches })
    }

    // Get trends
    const trends = await getTrends(supabase, userId, {
      niche: niche || undefined,
      limit,
    })

    // Group trends by niche for easier consumption
    const groupedByNiche: Record<string, any[]> = {}
    trends.forEach((trend) => {
      if (!groupedByNiche[trend.niche]) {
        groupedByNiche[trend.niche] = []
      }
      groupedByNiche[trend.niche].push(trend)
    })

    // Calculate summary stats
    const stats = {
      totalKeywords: trends.length,
      risingKeywords: trends.filter((t) => t.trend_direction === 'rising').length,
      lowCompetition: trends.filter((t) => t.competition_level === 'low').length,
      topPlatforms: {
        tiktok: 0,
        twitter: 0,
        instagram: 0,
        youtube: 0,
        google: 0,
      },
    }

    trends.forEach((t) => {
      stats.topPlatforms.tiktok += t.tiktok_popularity || 0
      stats.topPlatforms.twitter += t.twitter_popularity || 0
      stats.topPlatforms.instagram += t.instagram_popularity || 0
      stats.topPlatforms.youtube += t.youtube_popularity || 0
      stats.topPlatforms.google += t.google_popularity || 0
    })

    if (trends.length > 0) {
      stats.topPlatforms.tiktok = Math.round(stats.topPlatforms.tiktok / trends.length)
      stats.topPlatforms.twitter = Math.round(stats.topPlatforms.twitter / trends.length)
      stats.topPlatforms.instagram = Math.round(stats.topPlatforms.instagram / trends.length)
      stats.topPlatforms.youtube = Math.round(stats.topPlatforms.youtube / trends.length)
      stats.topPlatforms.google = Math.round(stats.topPlatforms.google / trends.length)
    }

    return NextResponse.json({
      trends,
      groupedByNiche,
      stats,
    })
  } catch (error) {
    console.error('[niche-trends GET] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Analyze a new niche
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
    const { niche } = body as { niche?: string }

    if (!niche || typeof niche !== 'string' || niche.trim().length === 0) {
      return NextResponse.json(
        { error: 'Niche is required' },
        { status: 400 }
      )
    }

    if (niche.length > 200) {
      return NextResponse.json(
        { error: 'Niche must be under 200 characters' },
        { status: 400 }
      )
    }

    // Analyze the niche
    const analysis = await analyzeNicheTrends(niche.trim())
    if (!analysis) {
      return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
    }

    // Save trends to database
    const saved = await saveTrends(supabase, userId, analysis)

    return NextResponse.json({
      analysis,
      saved,
    })
  } catch (error) {
    console.error('[niche-trends POST] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
