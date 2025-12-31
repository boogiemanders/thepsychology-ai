import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { getSupabaseClient } from '@/lib/supabase-server'

const QuerySchema = z.object({
  range: z.enum(['7d', '30d', '90d', 'all']).optional().default('30d'),
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

function getDateRangeFilter(range: string): Date {
  const now = new Date()
  switch (range) {
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    case 'all':
    default:
      return new Date('2020-01-01') // Far enough in the past
  }
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const parsedQuery = QuerySchema.safeParse({
      range: searchParams.get('range') || undefined,
    })
    if (!parsedQuery.success) {
      return NextResponse.json({ error: 'Invalid query' }, { status: 400 })
    }

    const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 })
    }

    const { range } = parsedQuery.data
    const rangeStart = getDateRangeFilter(range)

    // Get all users for total count
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select('id, created_at')

    if (allUsersError) {
      console.error('Failed to fetch all users:', allUsersError)
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 })
    }

    const totalUsers = allUsers?.length || 0

    // Calculate time-based counts
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)
    const startOfDay = new Date(now)
    startOfDay.setHours(0, 0, 0, 0)

    const usersThisMonth = allUsers?.filter(u => new Date(u.created_at) >= startOfMonth).length || 0
    const usersThisWeek = allUsers?.filter(u => new Date(u.created_at) >= startOfWeek).length || 0
    const usersToday = allUsers?.filter(u => new Date(u.created_at) >= startOfDay).length || 0

    // Get users with marketing data for the selected range
    const { data: rangeUsers, error: rangeError } = await supabase
      .from('users')
      .select('id, email, full_name, referral_source, utm_source, utm_medium, utm_campaign, utm_content, utm_term, signup_device, created_at')
      .gte('created_at', rangeStart.toISOString())
      .order('created_at', { ascending: false })

    if (rangeError) {
      console.error('Failed to fetch range users:', rangeError)
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 })
    }

    // Calculate referral breakdown
    const referralCounts: Record<string, number> = {}
    for (const user of rangeUsers || []) {
      const source = user.referral_source || 'unknown'
      referralCounts[source] = (referralCounts[source] || 0) + 1
    }
    const totalRangeUsers = rangeUsers?.length || 1
    const referralBreakdown = Object.entries(referralCounts)
      .map(([source, count]) => ({
        source,
        count,
        percentage: (count / totalRangeUsers) * 100,
      }))
      .sort((a, b) => b.count - a.count)

    // Calculate UTM breakdown
    const utmMap = new Map<string, { utm_source: string | null; utm_medium: string | null; utm_campaign: string | null; count: number }>()
    for (const user of rangeUsers || []) {
      if (user.utm_source) {
        const key = `${user.utm_source}|${user.utm_medium || ''}|${user.utm_campaign || ''}`
        const existing = utmMap.get(key)
        if (existing) {
          existing.count++
        } else {
          utmMap.set(key, {
            utm_source: user.utm_source,
            utm_medium: user.utm_medium,
            utm_campaign: user.utm_campaign,
            count: 1,
          })
        }
      }
    }
    const utmBreakdown = Array.from(utmMap.values()).sort((a, b) => b.count - a.count)

    // Calculate device breakdown
    const deviceCounts: Record<string, number> = {}
    for (const user of rangeUsers || []) {
      const device = user.signup_device || 'unknown'
      deviceCounts[device] = (deviceCounts[device] || 0) + 1
    }
    const deviceBreakdown = Object.entries(deviceCounts)
      .map(([device, count]) => ({
        device,
        count,
        percentage: (count / totalRangeUsers) * 100,
      }))
      .sort((a, b) => b.count - a.count)

    // Get signups by day for chart (last 30 days regardless of range)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const signupsByDayMap: Record<string, number> = {}

    // Initialize all days with 0
    for (let i = 0; i < 30; i++) {
      const date = new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]
      signupsByDayMap[dateStr] = 0
    }

    // Count signups
    for (const user of allUsers || []) {
      const dateStr = new Date(user.created_at).toISOString().split('T')[0]
      if (signupsByDayMap[dateStr] !== undefined) {
        signupsByDayMap[dateStr]++
      }
    }

    const signupsByDay = Object.entries(signupsByDayMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Recent signups (most recent 50)
    const recentSignups = (rangeUsers || []).slice(0, 50).map(user => ({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      referral_source: user.referral_source,
      utm_source: user.utm_source,
      utm_campaign: user.utm_campaign,
      signup_device: user.signup_device,
      created_at: user.created_at,
    }))

    return NextResponse.json({
      totalUsers,
      usersThisMonth,
      usersThisWeek,
      usersToday,
      referralBreakdown,
      utmBreakdown,
      deviceBreakdown,
      signupsByDay,
      recentSignups,
    })
  } catch (error) {
    console.error('Marketing API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
