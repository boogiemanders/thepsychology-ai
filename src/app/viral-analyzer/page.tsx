'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import {
  AlertCircle,
  BarChart3,
  FileText,
  Flame,
  Loader2,
  Plus,
  RefreshCcw,
  Search,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

type Platform = 'tiktok' | 'twitter' | 'instagram'

type ContentAnalysis = {
  id: string
  platform: Platform
  title: string | null
  description: string | null
  transcript: string | null
  overall_viral_score: number
  hook_score: number
  visual_score: number
  pacing_score: number
  tone_score: number
  cadence_score: number
  hook_analysis: any
  visual_analysis: any
  pacing_analysis: any
  tone_analysis: any
  cadence_analysis: any
  viral_elements: string[]
  missing_elements: string[]
  improvement_suggestions: string[]
  created_at: string
}

type Stats = {
  totalAnalyses: number
  avgHookScore: number
  avgVisualScore: number
  avgPacingScore: number
  avgToneScore: number
  avgCadenceScore: number
  avgOverallScore: number
  platformBreakdown: Record<string, number>
  topPerformers: Array<{
    id: string
    platform: string
    title: string
    score: number
    createdAt: string
  }>
}

type NicheTrend = {
  keyword: string
  trend_direction: 'rising' | 'stable' | 'declining'
  competition_level: 'low' | 'medium' | 'high'
  tiktok_popularity: number
  twitter_popularity: number
  instagram_popularity: number
  youtube_popularity: number
  google_popularity: number
  related_keywords: string[]
  content_ideas: string[]
}

type NicheAnalysis = {
  niche: string
  trends: NicheTrend[]
  emergingTopics: string[]
  contentGaps: string[]
  bestContentFormats: string[]
  audienceInsights: {
    demographics: string
    painPoints: string[]
    desires: string[]
    questions: string[]
  }
  competitorInsights: string[]
  seasonalTrends: string[]
}

const PLATFORM_COLORS = {
  tiktok: '#00f2ea',
  twitter: '#1da1f2',
  instagram: '#e1306c',
}

const CHART_COLORS = ['#f97316', '#3b82f6', '#22c55e', '#eab308', '#a855f7']

async function getAccessToken(): Promise<string> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Not authenticated')
  return token
}

async function fetchAPI<T>(url: string, options?: RequestInit): Promise<T> {
  const token = await getAccessToken()
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(data?.error || 'Request failed')
  }
  return data as T
}

export default function ViralAnalyzerPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  // Content analysis state
  const [analyses, setAnalyses] = useState<ContentAnalysis[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [selectedAnalysis, setSelectedAnalysis] = useState<ContentAnalysis | null>(null)

  // New analysis form state
  const [platform, setPlatform] = useState<Platform>('tiktok')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [transcript, setTranscript] = useState('')
  const [contentUrl, setContentUrl] = useState('')

  // Niche trends state
  const [niche, setNiche] = useState('')
  const [nicheAnalysis, setNicheAnalysis] = useState<NicheAnalysis | null>(null)
  const [savedTrends, setSavedTrends] = useState<NicheTrend[]>([])

  // Site recommendations state
  const [siteRecommendations, setSiteRecommendations] = useState<any>(null)

  // Loading states
  const [loadingAnalyses, setLoadingAnalyses] = useState(false)
  const [submittingAnalysis, setSubmittingAnalysis] = useState(false)
  const [loadingTrends, setLoadingTrends] = useState(false)
  const [loadingSiteRecs, setLoadingSiteRecs] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [authLoading, router, user])

  const loadAnalyses = useCallback(async () => {
    setLoadingAnalyses(true)
    setError(null)
    try {
      const data = await fetchAPI<{ analyses: ContentAnalysis[]; stats: Stats }>(
        '/api/viral-analyzer'
      )
      setAnalyses(data.analyses || [])
      setStats(data.stats || null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load analyses')
    } finally {
      setLoadingAnalyses(false)
    }
  }, [])

  const loadSiteRecommendations = useCallback(async () => {
    setLoadingSiteRecs(true)
    try {
      const data = await fetchAPI<{ recommendations: any[] }>(
        '/api/viral-analyzer?action=get-site-recommendations'
      )
      if (data.recommendations?.length > 0) {
        setSiteRecommendations(data.recommendations[0])
      }
    } catch (e) {
      console.error('Failed to load site recommendations:', e)
    } finally {
      setLoadingSiteRecs(false)
    }
  }, [])

  useEffect(() => {
    if (user) {
      loadAnalyses()
      loadSiteRecommendations()
    }
  }, [user, loadAnalyses, loadSiteRecommendations])

  const submitAnalysis = async () => {
    if (!title && !description && !transcript) {
      setError('Please provide at least a title, description, or transcript')
      return
    }

    setSubmittingAnalysis(true)
    setError(null)
    try {
      const result = await fetchAPI<{ id: string; analysis: any; saved: boolean }>(
        '/api/viral-analyzer',
        {
          method: 'POST',
          body: JSON.stringify({
            platform,
            title: title || undefined,
            description: description || undefined,
            transcript: transcript || undefined,
            contentUrl: contentUrl || undefined,
          }),
        }
      )

      // Refresh the list
      await loadAnalyses()

      // Clear form
      setTitle('')
      setDescription('')
      setTranscript('')
      setContentUrl('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed')
    } finally {
      setSubmittingAnalysis(false)
    }
  }

  const analyzeNiche = async () => {
    if (!niche.trim()) {
      setError('Please enter a niche to analyze')
      return
    }

    setLoadingTrends(true)
    setError(null)
    try {
      const data = await fetchAPI<{ analysis: NicheAnalysis; saved: boolean }>(
        '/api/niche-trends',
        {
          method: 'POST',
          body: JSON.stringify({ niche: niche.trim() }),
        }
      )
      setNicheAnalysis(data.analysis)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Niche analysis failed')
    } finally {
      setLoadingTrends(false)
    }
  }

  const generateSiteRecommendations = async () => {
    setLoadingSiteRecs(true)
    setError(null)
    try {
      const data = await fetchAPI<{ recommendations: any }>(
        '/api/viral-analyzer?action=site-recommendations'
      )
      setSiteRecommendations(data.recommendations)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate recommendations')
    } finally {
      setLoadingSiteRecs(false)
    }
  }

  // Chart data preparation
  const radarData = stats
    ? [
        { dimension: 'Hook', score: stats.avgHookScore, fullMark: 10 },
        { dimension: 'Visual', score: stats.avgVisualScore, fullMark: 10 },
        { dimension: 'Pacing', score: stats.avgPacingScore, fullMark: 10 },
        { dimension: 'Tone', score: stats.avgToneScore, fullMark: 10 },
        { dimension: 'Cadence', score: stats.avgCadenceScore, fullMark: 10 },
      ]
    : []

  const platformData = stats
    ? Object.entries(stats.platformBreakdown).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: PLATFORM_COLORS[name as Platform] || '#666',
      }))
    : []

  const trendDirectionData = nicheAnalysis
    ? [
        {
          name: 'Rising',
          value: nicheAnalysis.trends.filter((t) => t.trendDirection === 'rising').length,
        },
        {
          name: 'Stable',
          value: nicheAnalysis.trends.filter((t) => t.trendDirection === 'stable').length,
        },
        {
          name: 'Declining',
          value: nicheAnalysis.trends.filter((t) => t.trendDirection === 'declining').length,
        },
      ]
    : []

  if (authLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Flame className="h-8 w-8 text-orange-500" />
              Viral Content Analyzer
            </h1>
            <p className="text-muted-foreground mt-1">
              Analyze your social content and discover what makes it go viral
            </p>
          </div>
          <Button variant="outline" onClick={loadAnalyses} disabled={loadingAnalyses}>
            <RefreshCcw className={`h-4 w-4 mr-2 ${loadingAnalyses ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-destructive">{error}</p>
          </div>
        )}

        <Tabs defaultValue="analyze" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="analyze" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Analyze Content
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Niche Trends
            </TabsTrigger>
            <TabsTrigger value="site" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Site Improvements
            </TabsTrigger>
          </TabsList>

          {/* Analyze Content Tab */}
          <TabsContent value="analyze" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Analyze New Content</CardTitle>
                <CardDescription>
                  Enter your content details to get AI-powered viral potential analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="platform">Platform</Label>
                      <Select
                        value={platform}
                        onValueChange={(v) => setPlatform(v as Platform)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tiktok">TikTok</SelectItem>
                          <SelectItem value="twitter">Twitter / X</SelectItem>
                          <SelectItem value="instagram">Instagram</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="title">Title / Hook</Label>
                      <Input
                        id="title"
                        placeholder="Enter your video title or opening hook..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="url">Content URL (optional)</Label>
                      <Input
                        id="url"
                        placeholder="https://..."
                        value={contentUrl}
                        onChange={(e) => setContentUrl(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="description">Caption / Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Enter your caption or description..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="transcript">Script / Transcript</Label>
                      <Textarea
                        id="transcript"
                        placeholder="Enter your video script or audio transcript..."
                        value={transcript}
                        onChange={(e) => setTranscript(e.target.value)}
                        rows={4}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={submitAnalysis}
                    disabled={submittingAnalysis || (!title && !description && !transcript)}
                    className="w-full md:w-auto"
                  >
                    {submittingAnalysis ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Analyze Content
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Analysis Results */}
            {analyses.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Analyses</CardTitle>
                  <CardDescription>
                    Click on an analysis to see detailed breakdown
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analyses.slice(0, 5).map((analysis) => (
                      <button
                        key={analysis.id}
                        className={`w-full text-left p-4 rounded-lg border transition-colors ${
                          selectedAnalysis?.id === analysis.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:bg-muted/50'
                        }`}
                        onClick={() =>
                          setSelectedAnalysis(
                            selectedAnalysis?.id === analysis.id ? null : analysis
                          )
                        }
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge
                              variant="outline"
                              style={{
                                borderColor: PLATFORM_COLORS[analysis.platform],
                                color: PLATFORM_COLORS[analysis.platform],
                              }}
                            >
                              {analysis.platform}
                            </Badge>
                            <span className="font-medium truncate max-w-[300px]">
                              {analysis.title || analysis.description?.slice(0, 50) || 'Untitled'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-2xl font-bold ${
                                analysis.overall_viral_score >= 70
                                  ? 'text-green-500'
                                  : analysis.overall_viral_score >= 50
                                  ? 'text-yellow-500'
                                  : 'text-red-500'
                              }`}
                            >
                              {analysis.overall_viral_score}
                            </span>
                            <span className="text-sm text-muted-foreground">/100</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Detailed Analysis View */}
            {selectedAnalysis && (
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                      { label: 'Hook', score: selectedAnalysis.hook_score },
                      { label: 'Visual', score: selectedAnalysis.visual_score },
                      { label: 'Pacing', score: selectedAnalysis.pacing_score },
                      { label: 'Tone', score: selectedAnalysis.tone_score },
                      { label: 'Cadence', score: selectedAnalysis.cadence_score },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="p-4 rounded-lg bg-muted/50 text-center"
                      >
                        <div className="text-sm text-muted-foreground">{item.label}</div>
                        <div
                          className={`text-2xl font-bold ${
                            item.score >= 7
                              ? 'text-green-500'
                              : item.score >= 5
                              ? 'text-yellow-500'
                              : 'text-red-500'
                          }`}
                        >
                          {item.score}/10
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-green-500 mb-2">Viral Elements</h4>
                      <ul className="space-y-1">
                        {(selectedAnalysis.viral_elements || []).map((el, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <span className="text-green-500">+</span>
                            {el}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-red-500 mb-2">Missing Elements</h4>
                      <ul className="space-y-1">
                        {(selectedAnalysis.missing_elements || []).map((el, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <span className="text-red-500">-</span>
                            {el}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-semibold mb-2">Improvement Suggestions</h4>
                    <ul className="space-y-2">
                      {(selectedAnalysis.improvement_suggestions || []).map((sug, i) => (
                        <li key={i} className="text-sm p-3 bg-primary/5 rounded-lg">
                          {sug}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {stats && stats.totalAnalyses > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-sm text-muted-foreground">Total Analyses</div>
                      <div className="text-3xl font-bold">{stats.totalAnalyses}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-sm text-muted-foreground">Avg. Viral Score</div>
                      <div
                        className={`text-3xl font-bold ${
                          stats.avgOverallScore >= 70
                            ? 'text-green-500'
                            : stats.avgOverallScore >= 50
                            ? 'text-yellow-500'
                            : 'text-red-500'
                        }`}
                      >
                        {stats.avgOverallScore}/100
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-sm text-muted-foreground">Best Hook Score</div>
                      <div className="text-3xl font-bold">{stats.avgHookScore}/10</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-sm text-muted-foreground">Best Pacing Score</div>
                      <div className="text-3xl font-bold">{stats.avgPacingScore}/10</div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Content Dimensions</CardTitle>
                      <CardDescription>Average scores across all dimensions</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={{}} className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart data={radarData}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="dimension" />
                            <PolarRadiusAxis domain={[0, 10]} />
                            <Radar
                              name="Score"
                              dataKey="score"
                              stroke="#f97316"
                              fill="#f97316"
                              fillOpacity={0.5}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Platform Distribution</CardTitle>
                      <CardDescription>Content analyzed by platform</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={{}} className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={platformData}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={100}
                              label={({ name, value }) => `${name}: ${value}`}
                            >
                              {platformData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Performers</CardTitle>
                    <CardDescription>Your highest scoring content</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stats.topPerformers.map((performer, idx) => (
                        <div
                          key={performer.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-bold text-muted-foreground">
                              #{idx + 1}
                            </span>
                            <Badge
                              variant="outline"
                              style={{
                                borderColor: PLATFORM_COLORS[performer.platform as Platform],
                                color: PLATFORM_COLORS[performer.platform as Platform],
                              }}
                            >
                              {performer.platform}
                            </Badge>
                            <span className="font-medium">{performer.title}</span>
                          </div>
                          <span className="text-2xl font-bold text-green-500">
                            {performer.score}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No analyses yet</h3>
                  <p className="text-muted-foreground">
                    Start by analyzing your first piece of content
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Niche Trends Tab */}
          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Analyze Your Niche</CardTitle>
                <CardDescription>
                  Discover what people in your niche are searching for
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Enter your niche (e.g., 'psychology exam prep', 'mental health education')"
                      value={niche}
                      onChange={(e) => setNiche(e.target.value)}
                    />
                  </div>
                  <Button onClick={analyzeNiche} disabled={loadingTrends || !niche.trim()}>
                    {loadingTrends ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Analyze Niche
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {nicheAnalysis && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-sm text-muted-foreground">Total Keywords</div>
                      <div className="text-3xl font-bold">{nicheAnalysis.trends.length}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-sm text-muted-foreground">Rising Keywords</div>
                      <div className="text-3xl font-bold text-green-500">
                        {nicheAnalysis.trends.filter((t) => t.trendDirection === 'rising').length}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-sm text-muted-foreground">Low Competition</div>
                      <div className="text-3xl font-bold text-blue-500">
                        {nicheAnalysis.trends.filter((t) => t.competitionLevel === 'low').length}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Trending Keywords</CardTitle>
                    <CardDescription>Keywords people are actively searching for</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {nicheAnalysis.trends.map((trend, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold">{trend.keyword}</span>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  trend.trendDirection === 'rising'
                                    ? 'default'
                                    : trend.trendDirection === 'declining'
                                    ? 'destructive'
                                    : 'secondary'
                                }
                              >
                                {trend.trendDirection}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={
                                  trend.competitionLevel === 'low'
                                    ? 'border-green-500 text-green-500'
                                    : trend.competitionLevel === 'high'
                                    ? 'border-red-500 text-red-500'
                                    : ''
                                }
                              >
                                {trend.competitionLevel} competition
                              </Badge>
                            </div>
                          </div>
                          <div className="flex gap-4 text-sm text-muted-foreground mb-2">
                            <span>TikTok: {trend.platformPopularity.tiktok}/10</span>
                            <span>Twitter: {trend.platformPopularity.twitter}/10</span>
                            <span>Instagram: {trend.platformPopularity.instagram}/10</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {trend.relatedKeywords.map((kw, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {kw}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Emerging Topics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {nicheAnalysis.emergingTopics.map((topic, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            {topic}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Content Gaps</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {nicheAnalysis.contentGaps.map((gap, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-yellow-500" />
                            {gap}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Audience Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Demographics</h4>
                        <p className="text-muted-foreground">
                          {nicheAnalysis.audienceInsights.demographics}
                        </p>
                      </div>
                      <Separator />
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <h4 className="font-semibold mb-2 text-red-500">Pain Points</h4>
                          <ul className="space-y-1">
                            {nicheAnalysis.audienceInsights.painPoints.map((p, i) => (
                              <li key={i} className="text-sm text-muted-foreground">
                                {p}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2 text-green-500">Desires</h4>
                          <ul className="space-y-1">
                            {nicheAnalysis.audienceInsights.desires.map((d, i) => (
                              <li key={i} className="text-sm text-muted-foreground">
                                {d}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2 text-blue-500">Questions</h4>
                          <ul className="space-y-1">
                            {nicheAnalysis.audienceInsights.questions.map((q, i) => (
                              <li key={i} className="text-sm text-muted-foreground">
                                {q}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Site Improvements Tab */}
          <TabsContent value="site" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Site Viral Optimization</CardTitle>
                <CardDescription>
                  Get AI-powered recommendations to make your site more engaging based on your
                  content analysis patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={generateSiteRecommendations}
                  disabled={loadingSiteRecs || (stats?.totalAnalyses || 0) < 1}
                >
                  {loadingSiteRecs ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Recommendations
                    </>
                  )}
                </Button>
                {(stats?.totalAnalyses || 0) < 1 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Analyze at least one piece of content first to get site recommendations.
                  </p>
                )}
              </CardContent>
            </Card>

            {siteRecommendations && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Current Site Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div
                        className={`text-5xl font-bold ${
                          siteRecommendations.current_site_score >= 70
                            ? 'text-green-500'
                            : siteRecommendations.current_site_score >= 50
                            ? 'text-yellow-500'
                            : 'text-red-500'
                        }`}
                      >
                        {siteRecommendations.current_site_score || siteRecommendations.currentSiteScore}
                      </div>
                      <span className="text-2xl text-muted-foreground">/100</span>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {siteRecommendations.hook_recommendations && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Hook Improvements</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <h4 className="font-semibold text-sm">Headline</h4>
                          <p className="text-muted-foreground text-sm">
                            {siteRecommendations.hook_recommendations.headline}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm">Subheadline</h4>
                          <p className="text-muted-foreground text-sm">
                            {siteRecommendations.hook_recommendations.subheadline}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm">CTA</h4>
                          <p className="text-muted-foreground text-sm">
                            {siteRecommendations.hook_recommendations.cta}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {siteRecommendations.visual_recommendations && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Visual Improvements</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <h4 className="font-semibold text-sm">Hero Section</h4>
                          <p className="text-muted-foreground text-sm">
                            {siteRecommendations.visual_recommendations.heroSection}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm">Imagery</h4>
                          <p className="text-muted-foreground text-sm">
                            {siteRecommendations.visual_recommendations.imagery}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm">Color Scheme</h4>
                          <p className="text-muted-foreground text-sm">
                            {siteRecommendations.visual_recommendations.colorScheme}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {siteRecommendations.copy_recommendations && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Copy Improvements</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <h4 className="font-semibold text-sm">Tone of Voice</h4>
                          <p className="text-muted-foreground text-sm">
                            {siteRecommendations.copy_recommendations.toneOfVoice}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm">Messaging Framework</h4>
                          <p className="text-muted-foreground text-sm">
                            {siteRecommendations.copy_recommendations.messagingFramework}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm">Urgency</h4>
                          <p className="text-muted-foreground text-sm">
                            {siteRecommendations.copy_recommendations.urgency}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {siteRecommendations.cta_recommendations && (
                    <Card>
                      <CardHeader>
                        <CardTitle>CTA Improvements</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <h4 className="font-semibold text-sm">Primary CTA</h4>
                          <p className="text-muted-foreground text-sm">
                            {siteRecommendations.cta_recommendations.primaryCTA}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm">Placement</h4>
                          <p className="text-muted-foreground text-sm">
                            {siteRecommendations.cta_recommendations.placement}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm">Copy</h4>
                          <p className="text-muted-foreground text-sm">
                            {siteRecommendations.cta_recommendations.copy}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {siteRecommendations.suggested_changes && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Suggested Changes</CardTitle>
                      <CardDescription>Prioritized list of changes to implement</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {(siteRecommendations.suggested_changes || []).map(
                          (change: any, idx: number) => (
                            <div
                              key={idx}
                              className="p-4 rounded-lg border border-border"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold">{change.area}</span>
                                <Badge
                                  variant={
                                    change.priority === 'high'
                                      ? 'destructive'
                                      : change.priority === 'medium'
                                      ? 'default'
                                      : 'secondary'
                                  }
                                >
                                  {change.priority} priority
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Current: </span>
                                  {change.current}
                                </div>
                                <div>
                                  <span className="text-green-500">Suggested: </span>
                                  {change.suggested}
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
