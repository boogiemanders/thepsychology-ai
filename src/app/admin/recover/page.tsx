'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { formatDistanceToNowStrict } from 'date-fns'
import { AlertTriangle, Circle, RefreshCcw } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UserListSkeleton } from './components/user-list-skeleton'
import { UserDetailSkeleton } from './components/user-detail-skeleton'
import { TranscriptSkeleton } from './components/transcript-skeleton'
import { EmptyUserList } from './components/empty-user-list'
import { EmptyTranscript } from './components/empty-transcript'
import { EmptyTable } from './components/empty-table'
import { ExamScoreTrendChart } from './components/exam-score-trend-chart'
import { TopicMasteryProgress } from './components/topic-mastery-progress'
import { MarketingAnalytics } from './components/marketing-analytics'

type AdminUserSummary = {
  userId: string
  email: string | null
  fullName: string | null
  subscriptionTier: string | null
  lastMessageAt: string | null
  sessionsCount: number
  messagesCount: number
  hasHarmAlert: boolean
  hasStressAlert: boolean
  latestPracticeExam?: {
    score: number
    totalQuestions: number
    createdAt: string
  } | null
  // Activity tracking fields
  lastActivityAt: string | null
  currentPage: string | null
  timeSpentTodaySeconds: number
  timeSpentAllTimeSeconds: number
}

type AdminUserDetail = {
  user: {
    id: string
    email: string | null
    full_name: string | null
    subscription_tier: string | null
    exam_date: string | null
    created_at: string | null
  } | null
  sessions: Array<{
    id: string
    created_at: string
    last_message_at: string | null
    message_count: number
    has_harm_alert: boolean
    has_stress_alert: boolean
    last_alert_reason: string | null
    last_alert_at: string | null
  }>
  practiceExams: Array<{
    id: string
    created_at: string
    exam_mode: string
    score: number
    total_questions: number
  }>
  latestPracticeRecommendations: Array<{ label: string; priorityScore: number; percentageWrong: number }>
  topicMasteryRecent: Array<{
    topic: string
    section: string
    total_attempts: number
    correct_attempts: number
    wrong_attempts: number
    last_attempted: string | null
  }>
  topicMasteryCount: number
}

type AdminSessionMessage = {
  id: string
  session_id: string
  message_index: number
  role: 'user' | 'assistant'
  content: string
  sources: unknown | null
  alert_reason: string | null
  created_at: string
}

function formatRelative(iso: string | null): string {
  if (!iso) return 'n/a'
  try {
    return formatDistanceToNowStrict(new Date(iso), { addSuffix: true })
  } catch {
    return iso
  }
}

function formatMessageTime(iso: string | null): string {
  if (!iso) return ''
  try {
    const date = new Date(iso)
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  } catch {
    return ''
  }
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const remainingMins = minutes % 60
  return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`
}

function isUserOnline(lastActivityAt: string | null): boolean {
  if (!lastActivityAt) return false
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
  return new Date(lastActivityAt).getTime() > fiveMinutesAgo
}

async function getAccessToken(): Promise<string> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Not authenticated')
  return token
}

async function fetchAdminJson<T>(url: string): Promise<T> {
  const token = await getAccessToken()
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const message = typeof data?.error === 'string' ? data.error : 'Request failed'
    throw new Error(message)
  }
  return data as T
}

function MarkdownMessage({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="whitespace-pre-wrap">{children}</p>,
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        ul: ({ children }) => <ul className="list-disc pl-5 my-2 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-5 my-2 space-y-1">{children}</ol>,
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

export default function AdminRecoverPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [query, setQuery] = useState('')
  const [showAllUsers, setShowAllUsers] = useState(false)
  const [sortBy, setSortBy] = useState<'lastActive' | 'messages' | 'name' | 'sessions' | 'timeToday' | 'timeTotal'>('lastActive')
  const [users, setUsers] = useState<AdminUserSummary[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [detail, setDetail] = useState<AdminUserDetail | null>(null)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<AdminSessionMessage[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [authLoading, router, user])

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase()
    let result = users
    if (q) {
      result = result.filter((u) => {
        const email = (u.email || '').toLowerCase()
        const name = (u.fullName || '').toLowerCase()
        return email.includes(q) || name.includes(q)
      })
    }
    // Sort based on selected option
    return [...result].sort((a, b) => {
      switch (sortBy) {
        case 'lastActive':
          // Prefer lastActivityAt, fall back to lastMessageAt
          const aActive = a.lastActivityAt || a.lastMessageAt
          const bActive = b.lastActivityAt || b.lastMessageAt
          if (!aActive && !bActive) return 0
          if (!aActive) return 1
          if (!bActive) return -1
          return bActive.localeCompare(aActive)
        case 'messages':
          return b.messagesCount - a.messagesCount
        case 'sessions':
          return b.sessionsCount - a.sessionsCount
        case 'name':
          return (a.fullName || a.email || '').localeCompare(b.fullName || b.email || '')
        case 'timeToday':
          return (b.timeSpentTodaySeconds || 0) - (a.timeSpentTodaySeconds || 0)
        case 'timeTotal':
          return (b.timeSpentAllTimeSeconds || 0) - (a.timeSpentAllTimeSeconds || 0)
        default:
          return 0
      }
    })
  }, [query, users, sortBy])

  const loadUsers = async (includeAll?: boolean) => {
    setError(null)
    setLoadingUsers(true)
    const showAll = includeAll ?? showAllUsers
    try {
      const url = showAll ? '/api/admin/recover?showAll=true' : '/api/admin/recover'
      const data = await fetchAdminJson<{ users: AdminUserSummary[] }>(url)
      setUsers(data.users || [])
      if (!selectedUserId && data.users?.length) {
        setSelectedUserId(data.users[0].userId)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load users')
    } finally {
      setLoadingUsers(false)
    }
  }

  const loadDetail = async (userId: string) => {
    setError(null)
    setLoadingDetail(true)
    try {
      const data = await fetchAdminJson<AdminUserDetail>(`/api/admin/recover?userId=${encodeURIComponent(userId)}`)
      setDetail(data)
      const nextSession = data.sessions?.[0]?.id ?? null
      setSelectedSessionId(nextSession)
      setMessages([])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load user detail')
      setDetail(null)
      setSelectedSessionId(null)
      setMessages([])
    } finally {
      setLoadingDetail(false)
    }
  }

  const loadMessages = async (sessionId: string) => {
    setError(null)
    setLoadingMessages(true)
    try {
      const data = await fetchAdminJson<{ messages: AdminSessionMessage[] }>(
        `/api/admin/recover?sessionId=${encodeURIComponent(sessionId)}`
      )
      setMessages(data.messages || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load messages')
      setMessages([])
    } finally {
      setLoadingMessages(false)
    }
  }

  useEffect(() => {
    if (!user) return
    void loadUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  // Polling for auto-refresh every 20 seconds
  useEffect(() => {
    if (!user) return

    const interval = setInterval(() => {
      // Silent refresh - don't show loading state
      const showAll = showAllUsers
      const url = showAll ? '/api/admin/recover?showAll=true' : '/api/admin/recover'
      fetchAdminJson<{ users: AdminUserSummary[] }>(url)
        .then((data) => {
          setUsers(data.users || [])
        })
        .catch(() => {
          // Silently fail on polling errors
        })
    }, 20000)

    return () => clearInterval(interval)
  }, [user?.id, showAllUsers])

  useEffect(() => {
    if (!selectedUserId) return
    void loadDetail(selectedUserId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUserId])

  useEffect(() => {
    if (!selectedSessionId) return
    void loadMessages(selectedSessionId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSessionId])

  const latestPractice = detail?.practiceExams?.[0] ?? null
  const latestPracticePct =
    latestPractice && latestPractice.total_questions > 0
      ? Math.round((latestPractice.score / latestPractice.total_questions) * 100)
      : null

  return (
    <main className="h-dvh bg-background overflow-hidden">
      <Tabs defaultValue="learning" className="h-full flex flex-col">
        <div className="px-6 pt-4 pb-2 border-b border-border flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Admin Dashboard</h1>
            <p className="text-xs text-muted-foreground">Manage users and track growth</p>
          </div>
          <TabsList>
            <TabsTrigger value="learning">Users & Learning</TabsTrigger>
            <TabsTrigger value="marketing">Marketing</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="learning" className="flex-1 overflow-hidden m-0 px-6">
          <div className="h-full w-full flex">
            <aside className="w-[360px] border-r border-border h-full flex flex-col">
              <div className="p-4 flex items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold">Recover Admin</div>
                  <div className="text-xs text-muted-foreground">View Recover chats and study stats</div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadUsers()}
                  disabled={loadingUsers}
                  title="Refresh"
                >
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              </div>

          <div className="px-4 pb-3 space-y-3">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search email or name…" />
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground shrink-0">Sort:</span>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lastActive">Last Active</SelectItem>
                  <SelectItem value="messages">Most Messages</SelectItem>
                  <SelectItem value="sessions">Most Sessions</SelectItem>
                  <SelectItem value="timeToday">Time Today</SelectItem>
                  <SelectItem value="timeTotal">Time All-Time</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="showAll"
                checked={showAllUsers}
                onCheckedChange={(checked) => {
                  const newValue = checked === true
                  setShowAllUsers(newValue)
                  loadUsers(newValue)
                }}
              />
              <label htmlFor="showAll" className="text-xs text-muted-foreground cursor-pointer">
                Show all users (including those without sessions)
              </label>
            </div>
          </div>

          <Separator />

          <ScrollArea className="flex-1">
            {loadingUsers ? (
              <UserListSkeleton />
            ) : filteredUsers.length === 0 ? (
              <EmptyUserList isSearching={!!query.trim()} />
            ) : (
            <div className="p-2 space-y-1">
              {filteredUsers.map((u) => {
                const selected = u.userId === selectedUserId
                const online = isUserOnline(u.lastActivityAt)
                return (
                  <button
                    key={u.userId}
                    onClick={() => setSelectedUserId(u.userId)}
                    className={[
                      'w-full text-left rounded-md border px-3 py-2 transition-colors',
                      selected ? 'bg-muted border-border' : 'bg-background hover:bg-muted/50 border-transparent',
                    ].join(' ')}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex items-center gap-2">
                        {online && (
                          <Circle className="h-2 w-2 fill-green-500 text-green-500 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{u.email || u.userId}</div>
                          <div className="text-xs text-muted-foreground truncate">{u.fullName || '—'}</div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {u.hasHarmAlert && <Badge variant="destructive">Harm</Badge>}
                        {!u.hasHarmAlert && u.hasStressAlert && <Badge variant="secondary">Stress</Badge>}
                      </div>
                    </div>
                    {online && u.currentPage && (
                      <div className="mt-1 text-[10px] text-green-600 truncate">
                        On: {u.currentPage}
                      </div>
                    )}
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{u.sessionsCount} sessions</span>
                      <span>{formatRelative(u.lastActivityAt || u.lastMessageAt)}</span>
                    </div>
                    {(u.timeSpentTodaySeconds > 0 || u.timeSpentAllTimeSeconds > 0) && (
                      <div className="mt-1 text-[11px] text-muted-foreground flex gap-3">
                        {u.timeSpentTodaySeconds > 0 && (
                          <span>Today: {formatDuration(u.timeSpentTodaySeconds)}</span>
                        )}
                        {u.timeSpentAllTimeSeconds > 0 && (
                          <span>Total: {formatDuration(u.timeSpentAllTimeSeconds)}</span>
                        )}
                      </div>
                    )}
                    {u.latestPracticeExam && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        Practice: {u.latestPracticeExam.score}/{u.latestPracticeExam.totalQuestions} (
                        {Math.round((u.latestPracticeExam.score / u.latestPracticeExam.totalQuestions) * 100)}%)
                      </div>
                    )}
                    {u.subscriptionTier && (
                      <div className="mt-1 text-[11px] text-muted-foreground">Tier: {u.subscriptionTier}</div>
                    )}
                  </button>
                )
              })}
            </div>
            )}
          </ScrollArea>
        </aside>

        <section className="flex-1 h-full overflow-y-auto">
          <div className="flex flex-col">
            <div className="p-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-lg font-semibold truncate">
                  {detail?.user?.email || (selectedUserId ? selectedUserId : 'Select a user')}
                </div>
                <div className="text-sm text-muted-foreground truncate">
                  {(detail?.user?.full_name || '').trim() || '—'}
                </div>
                {detail?.user?.subscription_tier && (
                  <div className="mt-2">
                    <Badge variant="outline">{detail.user.subscription_tier}</Badge>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {selectedUserId && (
                  <Button variant="outline" onClick={() => loadDetail(selectedUserId)} disabled={loadingDetail}>
                    Refresh user
                  </Button>
                )}
              </div>
            </div>

            {error && (
              <div className="px-4 pb-2">
                <div className="rounded-md border border-border bg-muted/30 p-3 text-sm flex gap-2 items-start">
                  <AlertTriangle className="h-4 w-4 mt-0.5" />
                  <div className="min-w-0">{error}</div>
                </div>
              </div>
            )}

            <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">Latest practice exam</CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  {latestPractice ? (
                    <div className="space-y-1">
                      <div className="text-2xl font-semibold">
                        {latestPractice.score}/{latestPractice.total_questions}
                        {latestPracticePct !== null && (
                          <span className="text-muted-foreground text-base font-normal"> ({latestPracticePct}%)</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{formatRelative(latestPractice.created_at)}</div>
                      <div className="text-xs text-muted-foreground">Mode: {latestPractice.exam_mode}</div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">No practice exams yet.</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">Top focus areas</CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  {detail?.latestPracticeRecommendations?.length ? (
                    <ul className="text-sm space-y-1">
                      {detail.latestPracticeRecommendations.map((d) => (
                        <li key={d.label} className="flex items-center justify-between gap-3">
                          <span className="truncate">{d.label}</span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {Math.round(d.percentageWrong)}% wrong
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm text-muted-foreground">Not enough data.</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">Topic Mastery</CardTitle>
                  {detail && detail.topicMasteryCount > 0 && (
                    <p className="text-xs text-muted-foreground">{detail.topicMasteryCount} sections studied</p>
                  )}
                </CardHeader>
                <CardContent className="pb-4">
                  <TopicMasteryProgress topics={detail?.topicMasteryRecent || []} />
                </CardContent>
              </Card>
            </div>

            {detail?.practiceExams && detail.practiceExams.length >= 2 && (
              <div className="px-4 pb-4">
                <ExamScoreTrendChart exams={detail.practiceExams} />
              </div>
            )}

            <div className="px-4 pb-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="overflow-hidden">
                <CardHeader className="py-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm">Recover sessions</CardTitle>
                  <div className="text-xs text-muted-foreground">
                    {detail?.sessions?.length ? `${detail.sessions.length} total` : '—'}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[120px]">
                    <Table className="table-fixed [&_th]:px-4 [&_td]:px-4">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-1/4">Date</TableHead>
                          <TableHead className="w-1/4">Last message</TableHead>
                          <TableHead className="w-1/4 text-right">Messages</TableHead>
                          <TableHead className="w-1/4">Flags</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(detail?.sessions || []).map((s) => {
                          const selected = s.id === selectedSessionId
                          return (
                            <TableRow
                              key={s.id}
                              data-state={selected ? 'selected' : undefined}
                              className="cursor-pointer"
                              onClick={() => setSelectedSessionId(s.id)}
                            >
                              <TableCell className="text-xs text-muted-foreground">{formatRelative(s.created_at)}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">{formatRelative(s.last_message_at)}</TableCell>
                              <TableCell className="text-xs text-right tabular-nums">{s.message_count}</TableCell>
                              <TableCell className="text-xs">
                                <div className="flex gap-1">
                                  {s.has_harm_alert && <Badge variant="destructive">Harm</Badge>}
                                  {!s.has_harm_alert && s.has_stress_alert && <Badge variant="secondary">Stress</Badge>}
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                        {(detail?.sessions || []).length === 0 && !loadingDetail && (
                          <EmptyTable type="sessions" colSpan={4} />
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card className="overflow-hidden">
                <CardHeader className="py-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm">Practice exam history</CardTitle>
                  <div className="text-xs text-muted-foreground">
                    {detail?.practiceExams?.length ? `${detail.practiceExams.length} shown` : '—'}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[120px]">
                    <Table className="table-fixed [&_th]:px-4 [&_td]:px-4">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-1/3">Date</TableHead>
                          <TableHead className="w-1/3">Mode</TableHead>
                          <TableHead className="w-1/3 text-right">Score</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(detail?.practiceExams || []).map((exam) => (
                          <TableRow key={exam.id}>
                            <TableCell className="text-xs text-muted-foreground">{formatRelative(exam.created_at)}</TableCell>
                            <TableCell className="text-xs">{exam.exam_mode}</TableCell>
                            <TableCell className="text-xs text-right tabular-nums">
                              {exam.score}/{exam.total_questions}{' '}
                              {exam.total_questions > 0 ? `(${Math.round((exam.score / exam.total_questions) * 100)}%)` : ''}
                            </TableCell>
                          </TableRow>
                        ))}
                        {(detail?.practiceExams || []).length === 0 && !loadingDetail && (
                          <EmptyTable type="exams" colSpan={3} />
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            <div className="px-4 pb-6 flex-1 min-h-0">
              <Card className="h-full overflow-hidden flex flex-col">
                <CardHeader className="py-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm">Transcript</CardTitle>
                  <div className="text-xs text-muted-foreground">
                    {selectedSessionId ? (loadingMessages ? 'Loading…' : `${messages.length} messages`) : 'Select a session'}
                  </div>
                </CardHeader>
                <CardContent className="p-0 flex-1 min-h-0">
                  <ScrollArea className="h-full">
                    {loadingMessages ? (
                      <TranscriptSkeleton />
                    ) : !selectedSessionId ? (
                      <EmptyTranscript noSession />
                    ) : messages.length === 0 ? (
                      <EmptyTranscript />
                    ) : (
                      <div className="p-4 space-y-3">
                        {messages.map((m) => (
                          <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                            <div
                              className={
                                m.role === 'user'
                                  ? 'max-w-[85%] rounded-2xl bg-primary text-primary-foreground px-4 py-2 text-sm'
                                  : 'max-w-[85%] rounded-2xl bg-muted px-4 py-2 text-sm'
                              }
                            >
                              <div className="space-y-2">
                                <MarkdownMessage content={m.content} />
                              </div>
                              {m.alert_reason && (
                                <div className="mt-2 text-xs text-muted-foreground">
                                  Flag: {m.alert_reason}
                                </div>
                              )}
                              {Array.isArray(m.sources) && m.sources.length > 0 && (
                                <details className="mt-2 text-xs text-muted-foreground">
                                  <summary className="cursor-pointer select-none">References ({m.sources.length})</summary>
                                  <ul className="mt-1 list-disc pl-4">
                                    {m.sources.map((s: any, idx: number) => (
                                      <li key={`${idx}-${String(s?.citation ?? '')}`} className="break-words">
                                        {typeof s?.citation === 'string' ? s.citation : JSON.stringify(s)}
                                      </li>
                                    ))}
                                  </ul>
                                </details>
                              )}
                              <div className={`mt-1 text-[10px] ${m.role === 'user' ? 'text-primary-foreground/60' : 'text-muted-foreground/60'}`}>
                                {formatMessageTime(m.created_at)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
