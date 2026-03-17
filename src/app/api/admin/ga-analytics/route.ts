import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { BetaAnalyticsDataClient } from '@google-analytics/data'
import { z } from 'zod'

const QuerySchema = z.object({
  range: z.enum(['7d', '30d', '90d']).optional().default('30d'),
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

function getRangeDays(range: string): number {
  switch (range) {
    case '7d': return 7
    case '30d': return 30
    case '90d': return 90
    default: return 30
  }
}

function getServiceAccountCredentials(): { client_email: string; private_key: string } | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  if (!raw) return null

  try {
    // Try parsing as raw JSON first
    const parsed = JSON.parse(raw)
    if (parsed.client_email && parsed.private_key) return parsed
  } catch {
    // Try base64-encoded
    try {
      const decoded = Buffer.from(raw, 'base64').toString('utf-8')
      const parsed = JSON.parse(decoded)
      if (parsed.client_email && parsed.private_key) return parsed
    } catch {
      return null
    }
  }

  return null
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const propertyId = process.env.GA4_PROPERTY_ID
    const credentials = getServiceAccountCredentials()

    if (!propertyId || !credentials) {
      return NextResponse.json({ configured: false })
    }

    const { searchParams } = new URL(request.url)
    const parsedQuery = QuerySchema.safeParse({
      range: searchParams.get('range') || undefined,
    })
    if (!parsedQuery.success) {
      return NextResponse.json({ error: 'Invalid query' }, { status: 400 })
    }

    const { range } = parsedQuery.data
    const days = getRangeDays(range)

    const client = new BetaAnalyticsDataClient({
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key,
      },
    })

    const property = `properties/${propertyId}`
    const dateRange = { startDate: `${days}daysAgo`, endDate: 'today' }

    // Run all 4 reports in parallel
    const [pageViewsByDay, topPages, topBlogPosts, trafficSources] = await Promise.all([
      // Page views by day
      client.runReport({
        property,
        dateRanges: [dateRange],
        dimensions: [{ name: 'date' }],
        metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }],
        orderBys: [{ dimension: { dimensionName: 'date', orderType: 'ALPHANUMERIC' } }],
      }),

      // Top 20 pages
      client.runReport({
        property,
        dateRanges: [dateRange],
        dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
        metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 20,
      }),

      // Top 10 blog posts
      client.runReport({
        property,
        dateRanges: [dateRange],
        dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
        metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }],
        dimensionFilter: {
          filter: {
            fieldName: 'pagePath',
            stringFilter: { matchType: 'BEGINS_WITH', value: '/blog/' },
          },
        },
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 10,
      }),

      // Traffic sources
      client.runReport({
        property,
        dateRanges: [dateRange],
        dimensions: [{ name: 'sessionDefaultChannelGroup' }],
        metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      }),
    ])

    // Parse page views by day
    const pageViewsByDayData = (pageViewsByDay[0].rows || []).map((row) => ({
      date: row.dimensionValues?.[0]?.value || '',
      pageViews: parseInt(row.metricValues?.[0]?.value || '0', 10),
      activeUsers: parseInt(row.metricValues?.[1]?.value || '0', 10),
    }))

    // Parse top pages
    const topPagesData = (topPages[0].rows || []).map((row) => ({
      path: row.dimensionValues?.[0]?.value || '',
      title: row.dimensionValues?.[1]?.value || '',
      pageViews: parseInt(row.metricValues?.[0]?.value || '0', 10),
      activeUsers: parseInt(row.metricValues?.[1]?.value || '0', 10),
    }))

    // Parse top blog posts
    const topBlogPostsData = (topBlogPosts[0].rows || []).map((row) => ({
      path: row.dimensionValues?.[0]?.value || '',
      title: row.dimensionValues?.[1]?.value || '',
      pageViews: parseInt(row.metricValues?.[0]?.value || '0', 10),
      activeUsers: parseInt(row.metricValues?.[1]?.value || '0', 10),
    }))

    // Parse traffic sources
    const totalSessions = (trafficSources[0].rows || []).reduce(
      (sum, row) => sum + parseInt(row.metricValues?.[0]?.value || '0', 10),
      0
    )
    const trafficSourcesData = (trafficSources[0].rows || []).map((row) => {
      const sessions = parseInt(row.metricValues?.[0]?.value || '0', 10)
      return {
        channel: row.dimensionValues?.[0]?.value || '',
        sessions,
        activeUsers: parseInt(row.metricValues?.[1]?.value || '0', 10),
        percentage: totalSessions > 0 ? (sessions / totalSessions) * 100 : 0,
      }
    })

    // Totals
    const totalPageViews = pageViewsByDayData.reduce((sum, d) => sum + d.pageViews, 0)
    const totalVisitors = pageViewsByDayData.reduce((sum, d) => sum + d.activeUsers, 0)

    return NextResponse.json({
      configured: true,
      note: 'GA4 data may be delayed up to 48 hours',
      totalPageViews,
      totalVisitors,
      pageViewsByDay: pageViewsByDayData,
      topPages: topPagesData,
      topBlogPosts: topBlogPostsData,
      trafficSources: trafficSourcesData,
    })
  } catch (error) {
    console.error('GA Analytics API error:', error)
    return NextResponse.json({ error: 'Failed to fetch GA4 data' }, { status: 500 })
  }
}
