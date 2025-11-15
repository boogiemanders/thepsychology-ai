import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase with service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface PreGenAnalytics {
  totalGenerated: number
  totalUsed: number
  totalUnused: number
  totalExpired: number
  averageExamsPerUser: number
  diagnosticCount: number
  practiceCount: number
  usedPercentage: number
  expiringWithin24h: number
  userStats: {
    usersWithPreGen: number
    usersWithoutPreGen: number
    avgPreGenPerUser: number
  }
  timestamp: string
}

/**
 * Analytics endpoint for monitoring the pre-generated exams system
 * Requires CRON_SECRET or authenticated user (if needed)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Optional: Add authentication check
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // Allow requests from authenticated users or with valid cron secret
    // For now, we'll require the cron secret for security
    if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
      // Authorized
    } else {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[Analytics] Generating pre-generation analytics...')

    // Get total pre-generated exams stats
    const { data: allExams, error: allExamsError } = await supabase
      .from('pre_generated_exams')
      .select('*')

    if (allExamsError) {
      console.error('[Analytics] Error fetching exams:', allExamsError)
      return NextResponse.json(
        { error: 'Failed to fetch analytics', stats: null },
        { status: 500 }
      )
    }

    if (!allExams) {
      return NextResponse.json(
        {
          success: true,
          stats: {
            totalGenerated: 0,
            totalUsed: 0,
            totalUnused: 0,
            totalExpired: 0,
            averageExamsPerUser: 0,
            diagnosticCount: 0,
            practiceCount: 0,
            usedPercentage: 0,
            expiringWithin24h: 0,
            userStats: {
              usersWithPreGen: 0,
              usersWithoutPreGen: 0,
              avgPreGenPerUser: 0,
            },
            timestamp: new Date().toISOString(),
          },
        },
        { status: 200 }
      )
    }

    const now = new Date()
    const oneDay = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    // Calculate statistics
    const totalGenerated = allExams.length
    const totalUsed = allExams.filter((e) => e.used).length
    const totalUnused = allExams.filter((e) => !e.used).length
    const totalExpired = allExams.filter((e) => new Date(e.expires_at) <= now).length
    const diagnosticCount = allExams.filter((e) => e.exam_type === 'diagnostic').length
    const practiceCount = allExams.filter((e) => e.exam_type === 'practice').length
    const expiringWithin24h = allExams.filter(
      (e) => new Date(e.expires_at) > now && new Date(e.expires_at) <= oneDay
    ).length

    // User statistics
    const uniqueUsers = new Set(allExams.map((e) => e.user_id))
    const usersWithPreGen = uniqueUsers.size
    const averageExamsPerUser = totalGenerated / Math.max(usersWithPreGen, 1)

    // Get total active users (this is approximate)
    const { data: users, error: usersError } = await supabase
      .from('auth.users')
      .select('id', { count: 'exact' })

    let usersWithoutPreGen = 0
    if (!usersError && users) {
      usersWithoutPreGen = Math.max(0, users.length - usersWithPreGen)
    }

    const usedPercentage = totalGenerated > 0 ? Math.round((totalUsed / totalGenerated) * 100) : 0

    const analytics: PreGenAnalytics = {
      totalGenerated,
      totalUsed,
      totalUnused,
      totalExpired,
      averageExamsPerUser: Math.round(averageExamsPerUser * 100) / 100,
      diagnosticCount,
      practiceCount,
      usedPercentage,
      expiringWithin24h,
      userStats: {
        usersWithPreGen,
        usersWithoutPreGen,
        avgPreGenPerUser: Math.round(averageExamsPerUser * 100) / 100,
      },
      timestamp: new Date().toISOString(),
    }

    console.log('[Analytics] Analytics generated successfully:', analytics)

    return NextResponse.json(
      {
        success: true,
        stats: analytics,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Analytics] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', stats: null },
      { status: 500 }
    )
  }
}
