'use client'

import { useEffect, useState } from 'react'
import { RefreshCcw, TrendingUp, Users, Target, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { REFERRAL_SOURCES, getReferralSourceByValue } from '@/lib/referral-sources'

type MarketingData = {
  totalUsers: number
  usersThisMonth: number
  usersThisWeek: number
  usersToday: number
  referralBreakdown: Array<{
    source: string
    count: number
    percentage: number
  }>
  utmBreakdown: Array<{
    utm_source: string | null
    utm_medium: string | null
    utm_campaign: string | null
    count: number
  }>
  signupsByDay: Array<{
    date: string
    count: number
  }>
  deviceBreakdown: Array<{
    device: string
    count: number
    percentage: number
  }>
  recentSignups: Array<{
    id: string
    email: string
    full_name: string | null
    referral_source: string | null
    utm_source: string | null
    utm_campaign: string | null
    signup_device: string | null
    created_at: string
  }>
}

async function getAccessToken(): Promise<string> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Not authenticated')
  return token
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function getReferralLabel(source: string | null): string {
  if (!source) return 'Unknown'

  // Check if it's a custom "other" response
  if (source.startsWith('other: ')) {
    return source.replace('other: ', 'Other: ')
  }
  if (source.startsWith('fb_other: ')) {
    return source.replace('fb_other: ', 'FB Group: ')
  }

  // Look up the label from our constants
  const found = getReferralSourceByValue(source)
  if (found) return found.label

  // Legacy free-text responses
  return source
}

export function MarketingAnalytics() {
  const [data, setData] = useState<MarketingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d')

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = await getAccessToken()
      const response = await fetch(`/api/admin/marketing?range=${timeRange}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to load marketing data')
      }
      const result = await response.json()
      setData(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [timeRange])

  if (loading && !data) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-muted rounded" />
            ))}
          </div>
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    )
  }

  const goal = 2000
  const progress = data ? Math.min((data.usersThisMonth / goal) * 100, 100) : 0

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Marketing Analytics</h2>
          <p className="text-sm text-muted-foreground">Track signups, referrals, and campaign performance</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as typeof timeRange)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg border border-destructive/50 bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Goal Progress */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="h-4 w-4" />
            Monthly Goal: 2,000 Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{data?.usersThisMonth || 0} / {goal}</span>
              <span className="text-muted-foreground">{progress.toFixed(1)}%</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {goal - (data?.usersThisMonth || 0)} more signups needed this month
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-normal">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalUsers || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-normal">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{data?.usersThisMonth || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-normal">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.usersThisWeek || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-normal">Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.usersToday || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Referral Sources */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Referral Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[280px]">
              {data?.referralBreakdown?.length ? (
                <div className="space-y-2">
                  {data.referralBreakdown.map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm truncate">{getReferralLabel(item.source)}</span>
                        {item.source?.startsWith('fb_') && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">FB</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm font-medium">{item.count}</span>
                        <span className="text-xs text-muted-foreground w-12 text-right">
                          {item.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground py-8 text-center">No referral data yet</div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* UTM Campaigns */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              UTM Campaigns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[280px]">
              {data?.utmBreakdown?.filter(u => u.utm_source).length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Source</TableHead>
                      <TableHead className="text-xs">Medium</TableHead>
                      <TableHead className="text-xs">Campaign</TableHead>
                      <TableHead className="text-xs text-right">Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.utmBreakdown.filter(u => u.utm_source).map((item, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs">{item.utm_source || '-'}</TableCell>
                        <TableCell className="text-xs">{item.utm_medium || '-'}</TableCell>
                        <TableCell className="text-xs truncate max-w-[120px]">{item.utm_campaign || '-'}</TableCell>
                        <TableCell className="text-xs text-right font-medium">{item.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-sm text-muted-foreground py-8 text-center">
                  <p>No UTM data yet</p>
                  <p className="text-xs mt-2">Add ?utm_source=...&utm_campaign=... to your links</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Device Breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4" />
            Signup Device
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6">
            {data?.deviceBreakdown?.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-sm capitalize">{item.device || 'Unknown'}:</span>
                <span className="font-medium">{item.count}</span>
                <span className="text-xs text-muted-foreground">({item.percentage.toFixed(1)}%)</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Signups */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Recent Signups</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[300px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Email</TableHead>
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs">Referral Source</TableHead>
                  <TableHead className="text-xs">UTM</TableHead>
                  <TableHead className="text-xs">Device</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.recentSignups?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="text-xs truncate max-w-[180px]">{user.email}</TableCell>
                    <TableCell className="text-xs truncate max-w-[120px]">{user.full_name || '-'}</TableCell>
                    <TableCell className="text-xs truncate max-w-[140px]">
                      {getReferralLabel(user.referral_source)}
                    </TableCell>
                    <TableCell className="text-xs">
                      {user.utm_source ? (
                        <span className="truncate max-w-[100px] block">
                          {user.utm_source}
                          {user.utm_campaign && ` / ${user.utm_campaign}`}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs capitalize">{user.signup_device || '-'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(user.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
