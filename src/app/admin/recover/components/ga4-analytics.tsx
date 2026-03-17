'use client'

import { useEffect, useState } from 'react'
import { BarChart3, Globe, FileText, Info, Eye, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'

type GA4Data = {
  configured: boolean
  note?: string
  totalPageViews?: number
  totalVisitors?: number
  pageViewsByDay?: Array<{
    date: string
    pageViews: number
    activeUsers: number
  }>
  topPages?: Array<{
    path: string
    title: string
    pageViews: number
    activeUsers: number
  }>
  topBlogPosts?: Array<{
    path: string
    title: string
    pageViews: number
    activeUsers: number
  }>
  trafficSources?: Array<{
    channel: string
    sessions: number
    activeUsers: number
    percentage: number
  }>
}

async function getAccessToken(): Promise<string> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Not authenticated')
  return token
}

export function GA4Analytics({ timeRange }: { timeRange: string }) {
  const [data, setData] = useState<GA4Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)
      try {
        const token = await getAccessToken()
        const range = timeRange === 'all' ? '90d' : timeRange
        const response = await fetch(`/api/admin/ga-analytics?range=${range}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!response.ok) {
          const err = await response.json().catch(() => ({}))
          throw new Error(err.error || 'Failed to load GA4 data')
        }
        const result = await response.json()
        setData(result)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load GA4 data')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [timeRange])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-40" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-24 bg-muted rounded" />
            <div className="h-24 bg-muted rounded" />
          </div>
          <div className="h-48 bg-muted rounded" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg border border-destructive/50 bg-destructive/10 text-destructive text-sm">
        {error}
      </div>
    )
  }

  if (data && !data.configured) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">GA4 Not Configured</p>
              <p className="text-sm text-muted-foreground mt-1">
                Set <code className="text-xs bg-muted px-1 py-0.5 rounded">GA4_PROPERTY_ID</code> and{' '}
                <code className="text-xs bg-muted px-1 py-0.5 rounded">GOOGLE_SERVICE_ACCOUNT_KEY</code>{' '}
                environment variables to see site traffic data.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Note about data delay */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Info className="h-3 w-3" />
        <span>GA4 data may be delayed up to 48 hours</span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-normal flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              Total Page Views
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(data.totalPageViews || 0).toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-normal flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              Total Visitors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(data.totalVisitors || 0).toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Two Column: Traffic Sources + Top Blog Posts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traffic Sources */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Traffic Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[280px]">
              {data.trafficSources?.length ? (
                <div className="space-y-2">
                  {data.trafficSources.map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                      <span className="text-sm truncate">{item.channel}</span>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm font-medium">{item.sessions.toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground w-12 text-right">
                          {item.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground py-8 text-center">No traffic data yet</div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Top Blog Posts */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Top Blog Posts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[280px]">
              {data.topBlogPosts?.length ? (
                <div className="space-y-2">
                  {data.topBlogPosts.map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                      <div className="min-w-0 mr-3">
                        <p className="text-sm truncate">{item.title || item.path}</p>
                        <p className="text-xs text-muted-foreground truncate">{item.path}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm font-medium">{item.pageViews.toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground">{item.activeUsers} users</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground py-8 text-center">No blog traffic yet</div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Top Pages Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Top Pages
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[300px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Page</TableHead>
                  <TableHead className="text-xs">Title</TableHead>
                  <TableHead className="text-xs text-right">Views</TableHead>
                  <TableHead className="text-xs text-right">Users</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topPages?.map((item, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs truncate max-w-[180px]">
                      <div className="flex items-center gap-1.5">
                        {item.path}
                        {item.path.startsWith('/blog/') && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Blog</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs truncate max-w-[200px]">{item.title || '-'}</TableCell>
                    <TableCell className="text-xs text-right font-medium">{item.pageViews.toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-right">{item.activeUsers.toLocaleString()}</TableCell>
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
