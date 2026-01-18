'use client'

import { useEffect, useState } from 'react'
import { RefreshCcw, Users, BookOpen, Star, Cpu, TrendingUp, ThumbsUp, ThumbsDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { supabase } from '@/lib/supabase'

type AnalyticsData = {
  engagement: {
    totalUsers: number
    activeUsersInRange: number
    avgSessionsPerUser: number
    timeByFeature: Array<{
      feature: string
      totalMinutes: number
      avgMinutesPerUser: number
      sessionCount: number
    }>
    dailyActiveUsers: Array<{ date: string; count: number }>
  }
  learning: {
    diagnosticCompletion: {
      usersWithFirstDiagnostic: number
      usersWithMultipleDiagnostics: number
      avgFirstScore: number
      avgLatestScore: number
      avgImprovement: number
    }
    quizTrends: {
      avgQuizScore: number
      avgQuizzesPerUser: number
      passRate: number
      totalQuizzes: number
    }
    topicMasteryStats: {
      avgTopicsMastered: number
      avgAccuracyRate: number
    }
  }
  satisfaction: {
    topicTeacher: {
      avgRating: number
      totalRatings: number
      distribution: Record<number, number>
      recentComments: Array<{ rating: number; comment: string; createdAt: string }>
    }
    quizzer: {
      thumbsUpCount: number
      thumbsDownCount: number
      satisfactionRate: number
      totalRatings: number
      recentComments: Array<{ isPositive: boolean; comment: string; createdAt: string }>
    }
  }
  aiMetrics: {
    totalCalls: number
    callsByFeature: Array<{
      feature: string
      callCount: number
      avgInputTokens: number
      avgOutputTokens: number
    }>
    dailyCalls: Array<{ date: string; count: number }>
  }
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

function formatFeatureName(feature: string): string {
  return feature
    .replace(/-/g, ' ')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
        />
      ))}
    </div>
  )
}

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d')

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = await getAccessToken()
      const response = await fetch(`/api/admin/analytics?range=${timeRange}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to load analytics data')
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

  if (error) {
    return (
      <div className="p-6">
        <div className="text-destructive">{error}</div>
        <Button onClick={loadData} variant="outline" className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Research Analytics</h2>
          <p className="text-sm text-muted-foreground">APA presentation metrics for user engagement, learning outcomes, and satisfaction</p>
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
          <Button onClick={loadData} variant="outline" size="icon" disabled={loading}>
            <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.engagement.activeUsersInRange ?? 0}</div>
            <p className="text-xs text-muted-foreground">of {data?.engagement.totalUsers ?? 0} total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Avg Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.learning.diagnosticCompletion.avgImprovement > 0 ? '+' : ''}
              {data?.learning.diagnosticCompletion.avgImprovement ?? 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {data?.learning.diagnosticCompletion.usersWithMultipleDiagnostics ?? 0} users with 2+ diagnostics
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Star className="h-4 w-4" />
              Topic Teacher
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.satisfaction.topicTeacher.avgRating ?? 0}/5</div>
            <p className="text-xs text-muted-foreground">{data?.satisfaction.topicTeacher.totalRatings ?? 0} ratings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ThumbsUp className="h-4 w-4" />
              Quizzer Satisfaction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.satisfaction.quizzer.satisfactionRate ?? 0}%</div>
            <p className="text-xs text-muted-foreground">{data?.satisfaction.quizzer.totalRatings ?? 0} ratings</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="engagement" className="space-y-4">
        <TabsList>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="learning">Learning</TabsTrigger>
          <TabsTrigger value="satisfaction">Satisfaction</TabsTrigger>
          <TabsTrigger value="ai">AI Usage</TabsTrigger>
        </TabsList>

        {/* Engagement Tab */}
        <TabsContent value="engagement" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Sessions Per User</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data?.engagement.avgSessionsPerUser ?? 0}</div>
                <p className="text-sm text-muted-foreground">average study sessions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Time by Feature</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Feature</TableHead>
                        <TableHead className="text-right">Total (min)</TableHead>
                        <TableHead className="text-right">Sessions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(data?.engagement.timeByFeature ?? []).map((item) => (
                        <TableRow key={item.feature}>
                          <TableCell>{formatFeatureName(item.feature)}</TableCell>
                          <TableCell className="text-right">{item.totalMinutes.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{item.sessionCount.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Learning Tab */}
        <TabsContent value="learning" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Diagnostic Scores</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">First Attempt</span>
                  <span className="font-medium">{data?.learning.diagnosticCompletion.avgFirstScore ?? 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Latest Attempt</span>
                  <span className="font-medium">{data?.learning.diagnosticCompletion.avgLatestScore ?? 0}%</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-muted-foreground">Improvement</span>
                  <span className={`font-bold ${(data?.learning.diagnosticCompletion.avgImprovement ?? 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(data?.learning.diagnosticCompletion.avgImprovement ?? 0) > 0 ? '+' : ''}
                    {data?.learning.diagnosticCompletion.avgImprovement ?? 0}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quiz Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Score</span>
                  <span className="font-medium">{data?.learning.quizTrends.avgQuizScore ?? 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pass Rate</span>
                  <span className="font-medium">{data?.learning.quizTrends.passRate ?? 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Quizzes</span>
                  <span className="font-medium">{data?.learning.quizTrends.totalQuizzes ?? 0}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Topic Mastery</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Topics/User</span>
                  <span className="font-medium">{data?.learning.topicMasteryStats.avgTopicsMastered ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Accuracy</span>
                  <span className="font-medium">{data?.learning.topicMasteryStats.avgAccuracyRate ?? 0}%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Satisfaction Tab */}
        <TabsContent value="satisfaction" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Topic Teacher Ratings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Topic Teacher Ratings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="text-4xl font-bold">{data?.satisfaction.topicTeacher.avgRating ?? 0}</div>
                  <div>
                    <StarRating rating={Math.round(data?.satisfaction.topicTeacher.avgRating ?? 0)} />
                    <p className="text-xs text-muted-foreground mt-1">
                      {data?.satisfaction.topicTeacher.totalRatings ?? 0} total ratings
                    </p>
                  </div>
                </div>

                {/* Distribution */}
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = data?.satisfaction.topicTeacher.distribution[star] ?? 0
                    const total = data?.satisfaction.topicTeacher.totalRatings ?? 1
                    const pct = total > 0 ? (count / total) * 100 : 0
                    return (
                      <div key={star} className="flex items-center gap-2 text-sm">
                        <span className="w-4">{star}</span>
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <Progress value={pct} className="h-2 flex-1" />
                        <span className="w-8 text-right text-muted-foreground">{count}</span>
                      </div>
                    )
                  })}
                </div>

                {/* Recent Comments */}
                {(data?.satisfaction.topicTeacher.recentComments ?? []).length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium mb-2">Recent Comments</h4>
                    <ScrollArea className="h-[150px]">
                      <div className="space-y-2">
                        {data?.satisfaction.topicTeacher.recentComments.map((item, i) => (
                          <div key={i} className="text-sm p-2 bg-muted rounded">
                            <div className="flex items-center gap-2 mb-1">
                              <StarRating rating={item.rating} />
                              <span className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</span>
                            </div>
                            <p className="text-muted-foreground">{item.comment}</p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quizzer Ratings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <ThumbsUp className="h-4 w-4" />
                  Quizzer Ratings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="text-4xl font-bold">{data?.satisfaction.quizzer.satisfactionRate ?? 0}%</div>
                  <div>
                    <p className="text-sm">satisfaction rate</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {data?.satisfaction.quizzer.totalRatings ?? 0} total ratings
                    </p>
                  </div>
                </div>

                {/* Thumbs breakdown */}
                <div className="flex gap-4">
                  <div className="flex items-center gap-2 text-green-600">
                    <ThumbsUp className="h-5 w-5" />
                    <span className="font-medium">{data?.satisfaction.quizzer.thumbsUpCount ?? 0}</span>
                  </div>
                  <div className="flex items-center gap-2 text-red-600">
                    <ThumbsDown className="h-5 w-5" />
                    <span className="font-medium">{data?.satisfaction.quizzer.thumbsDownCount ?? 0}</span>
                  </div>
                </div>

                {/* Recent Comments */}
                {(data?.satisfaction.quizzer.recentComments ?? []).length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium mb-2">Recent Comments</h4>
                    <ScrollArea className="h-[150px]">
                      <div className="space-y-2">
                        {data?.satisfaction.quizzer.recentComments.map((item, i) => (
                          <div key={i} className="text-sm p-2 bg-muted rounded">
                            <div className="flex items-center gap-2 mb-1">
                              {item.isPositive ? (
                                <ThumbsUp className="h-4 w-4 text-green-600" />
                              ) : (
                                <ThumbsDown className="h-4 w-4 text-red-600" />
                              )}
                              <span className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</span>
                            </div>
                            <p className="text-muted-foreground">{item.comment}</p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AI Usage Tab */}
        <TabsContent value="ai" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Cpu className="h-4 w-4" />
                  Total AI Calls
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{(data?.aiMetrics.totalCalls ?? 0).toLocaleString()}</div>
                <p className="text-sm text-muted-foreground">in selected period</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Calls by Feature</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Feature</TableHead>
                        <TableHead className="text-right">Calls</TableHead>
                        <TableHead className="text-right">Avg Tokens</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(data?.aiMetrics.callsByFeature ?? []).map((item) => (
                        <TableRow key={item.feature}>
                          <TableCell>{formatFeatureName(item.feature)}</TableCell>
                          <TableCell className="text-right">{item.callCount.toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            {item.avgInputTokens > 0 || item.avgOutputTokens > 0
                              ? `${item.avgInputTokens}/${item.avgOutputTokens}`
                              : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
